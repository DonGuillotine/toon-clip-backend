"""Prepared-content demo API. All user changes persist; no AI calls are made."""

import copy
import base64
from contextlib import contextmanager
import hashlib
import hmac
import json
import os
from pathlib import Path
import secrets
import sqlite3
import time
from typing import Annotated, Literal
from uuid import uuid4
from urllib.parse import urlsplit

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from solders.pubkey import Pubkey
from solders.signature import Signature

from billing import DEFAULT_RECIPIENT, NETWORK, PRICES, USDC_MINT, payment_url, verify_payment, wallet_address


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


Id = Annotated[str, Field(pattern=r"^[A-Za-z0-9_-]{1,100}$")]
Text = Annotated[str, Field(min_length=1, max_length=10000)]


class Asset(StrictModel):
    id: Id
    file: Text
    contentType: Literal["image/png", "image/jpeg", "video/mp4"]
    sha256: Annotated[str, Field(pattern=r"^[a-f0-9]{64}$")]


class Prompt(StrictModel):
    original: Text
    improved: Text
    changes: list[Text] = Field(min_length=1)


class TakeOption(StrictModel):
    id: Id
    label: Text
    assetId: Id
    prompt: Text
    durationSeconds: Annotated[float, Field(gt=0, le=60)] | None = None


class Shot(StrictModel):
    id: Id
    label: Text
    durationSeconds: Annotated[float, Field(gt=0, le=60)]
    takes: list[TakeOption] = Field(min_length=1)
    defaultTakeId: Id


class Choice(StrictModel):
    id: Id
    label: Text
    assetId: Id | None = None


class Selection(StrictModel):
    id: Id
    values: dict[Id, Id]
    prompt: Prompt
    shots: list[Shot] = Field(min_length=1)


class ExportVariant(StrictModel):
    selectionId: Id
    selectedOptions: dict[Id, Id]
    assetId: Id


class Scenario(StrictModel):
    id: Id
    title: Text
    description: Text
    isTour: bool = False
    choices: dict[Id, list[Choice]]
    selections: list[Selection] = Field(min_length=1)
    exports: list[ExportVariant] = Field(min_length=1)


class Catalog(StrictModel):
    version: Id
    assets: list[Asset]
    scenarios: list[Scenario]

    @model_validator(mode="after")
    def check_references(self):
        def unique(ids):
            if len(ids) != len(set(ids)):
                raise ValueError("Duplicate catalogue IDs")

        unique([a.id for a in self.assets])
        unique([s.id for s in self.scenarios])
        assets = {a.id: a for a in self.assets}

        def require_asset(asset_id, kind):
            if asset_id not in assets or not assets[asset_id].contentType.startswith(kind):
                raise ValueError("Missing asset or wrong media type: " + asset_id)

        for scenario in self.scenarios:
            unique([s.id for s in scenario.selections])
            choices = {}
            for field, options in scenario.choices.items():
                unique([o.id for o in options])
                choices[field] = {o.id for o in options}
                for option in options:
                    if option.assetId:
                        require_asset(option.assetId, "image/")
            selections = {s.id: s for s in scenario.selections}
            tuples = set()
            for selection in scenario.selections:
                if set(selection.values) != set(choices):
                    raise ValueError("Selection must supply every choice field")
                if any(value not in choices[field] for field, value in selection.values.items()):
                    raise ValueError("Unknown selection choice")
                values = tuple(sorted(selection.values.items()))
                if values in tuples:
                    raise ValueError("Duplicate supported selection")
                tuples.add(values)
                unique([s.id for s in selection.shots])
                for shot in selection.shots:
                    unique([t.id for t in shot.takes])
                    if shot.defaultTakeId not in {t.id for t in shot.takes}:
                        raise ValueError("Unknown default take")
                    for take in shot.takes:
                        require_asset(take.assetId, "video/")
            export_keys = set()
            for export in scenario.exports:
                if export.selectionId not in selections:
                    raise ValueError("Export refers to an unknown selection")
                selection = selections[export.selectionId]
                if set(export.selectedOptions) != {s.id for s in selection.shots}:
                    raise ValueError("Export must match every shot")
                for shot in selection.shots:
                    if export.selectedOptions[shot.id] not in {t.id for t in shot.takes}:
                        raise ValueError("Export refers to an unknown take")
                key = (export.selectionId, tuple(sorted(export.selectedOptions.items())))
                if key in export_keys:
                    raise ValueError("Duplicate export variant")
                export_keys.add(key)
                require_asset(export.assetId, "video/")
            for selection in scenario.selections:
                default = tuple(sorted((s.id, s.defaultTakeId) for s in selection.shots))
                if (selection.id, default) not in export_keys:
                    raise ValueError("Each selection needs a matching default MP4 export")
        return self


class SelectionRequest(StrictModel):
    scenarioId: Id
    selectionId: Id


class ShotPatch(StrictModel):
    flagged: bool | None = None
    locked: bool | None = None
    selectedTakeId: Id | None = None

    @model_validator(mode="after")
    def require_change(self):
        if not self.model_fields_set or any(getattr(self, f) is None for f in self.model_fields_set):
            raise ValueError("Supply at least one non-null change")
        return self


class RevisionRequest(StrictModel):
    revisionOptionId: Id


class ExportRequest(StrictModel):
    format: Literal["mp4"] = "mp4"


class WalletRequest(StrictModel):
    walletAddress: Annotated[str, Field(min_length=32, max_length=44)]
    _wallet = field_validator("walletAddress")(wallet_address)


class WalletProof(StrictModel):
    challengeId: Id
    signatureBase64: Annotated[str, Field(min_length=88, max_length=88)]


class PurchaseRequest(StrictModel):
    packId: Literal["credits-100"] = "credits-100"


class PaymentProof(StrictModel):
    transactionSignature: Annotated[str, Field(min_length=64, max_length=88)]

    @field_validator("transactionSignature")
    @classmethod
    def signature(cls, value):
        return str(Signature.from_string(value))


def create_app(database: Path, catalog_path: Path, asset_root: Path, origins: list[str],
               recipient: str = DEFAULT_RECIPIENT, rpc_url: str = "https://api.devnet.solana.com"):
    recipient = wallet_address(recipient)
    if urlsplit(rpc_url).scheme != "https" or not urlsplit(rpc_url).netloc:
        raise ValueError("Solana RPC must be an HTTPS URL")
    catalog = Catalog.model_validate_json(catalog_path.read_text(encoding="utf-8"))
    asset_root = asset_root.resolve()
    files = {}
    for asset in catalog.assets:
        path = (asset_root / asset.file).resolve()
        if not path.is_relative_to(asset_root) or not path.is_file():
            raise ValueError("Asset missing or outside assets directory: " + asset.id)
        with path.open("rb") as stream:
            digest = hashlib.file_digest(stream, "sha256").hexdigest()
        if digest != asset.sha256:
            raise ValueError("Asset checksum mismatch: " + asset.id)
        files[asset.id] = path
    assets = {a.id: a for a in catalog.assets}
    scenarios = {s.id: s for s in catalog.scenarios}
    database.parent.mkdir(parents=True, exist_ok=True)

    @contextmanager
    def connect():
        db = sqlite3.connect(database, timeout=10)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys = ON")
        try:
            with db:
                yield db
        finally:
            db.close()

    with connect() as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY, token_hash TEXT UNIQUE NOT NULL, expires INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS records (
            id TEXT PRIMARY KEY, owner TEXT NOT NULL REFERENCES sessions(id),
            kind TEXT NOT NULL, body TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS records_owner ON records(owner, kind);
        CREATE TABLE IF NOT EXISTS retries (
            owner TEXT NOT NULL REFERENCES sessions(id), scope TEXT NOT NULL,
            key TEXT NOT NULL, fingerprint TEXT NOT NULL, body TEXT NOT NULL,
            PRIMARY KEY(owner, scope, key));
        CREATE TABLE IF NOT EXISTS wallets (
            owner TEXT PRIMARY KEY REFERENCES sessions(id), address TEXT UNIQUE NOT NULL);
        CREATE TABLE IF NOT EXISTS ledger (
            id TEXT PRIMARY KEY, owner TEXT NOT NULL REFERENCES sessions(id), delta INTEGER NOT NULL,
            reason TEXT NOT NULL, created INTEGER NOT NULL, operation TEXT UNIQUE NOT NULL);
        CREATE INDEX IF NOT EXISTS ledger_owner ON ledger(owner);
        CREATE TABLE IF NOT EXISTS payment_claims (
            signature TEXT PRIMARY KEY, payment_id TEXT UNIQUE NOT NULL REFERENCES records(id));
        CREATE TABLE IF NOT EXISTS export_unlocks (
            owner TEXT NOT NULL REFERENCES sessions(id), snapshot TEXT NOT NULL,
            export_id TEXT NOT NULL REFERENCES records(id), PRIMARY KEY(owner, snapshot));
        """)
        db.execute("INSERT OR IGNORE INTO settings VALUES ('media_secret', ?)", (secrets.token_hex(32),))
        media_secret = bytes.fromhex(db.execute("SELECT value FROM settings WHERE key='media_secret'").fetchone()[0])

    app = FastAPI(title="Toon Clip Demo API", version="0.2.0",
                  description="Prepared examples, persistent takes, and Solana Devnet credit purchases.")
    app.add_middleware(CORSMiddleware, allow_origins=origins,
                       allow_methods=["GET", "POST", "PATCH"],
                       allow_headers=["Authorization", "Content-Type", "Idempotency-Key"])

    @app.middleware("http")
    async def private_responses(request: Request, call_next):
        response = await call_next(request)
        response.headers["Cache-Control"] = "no-store"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    @app.exception_handler(sqlite3.OperationalError)
    async def database_busy(request, error):
        return JSONResponse(status_code=503, content={"detail": "Database unavailable; retry shortly"})

    bearer = HTTPBearer(auto_error=False)

    def owner(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
        if credentials is None:
            raise HTTPException(401, "Start a session and send its bearer token")
        digest = hashlib.sha256(credentials.credentials.encode()).hexdigest()
        with connect() as db:
            row = db.execute("SELECT id FROM sessions WHERE token_hash=? AND expires>?", (digest, int(time.time()))).fetchone()
        if row is None:
            raise HTTPException(401, "Session is invalid or expired")
        return row[0]

    def select(body: SelectionRequest):
        scenario = scenarios.get(body.scenarioId)
        if scenario:
            for selection in scenario.selections:
                if selection.id == body.selectionId:
                    return scenario, selection
        raise HTTPException(422, "Choose a supported scenario and selection from the catalogue")

    def load(db, record_id, user, kind):
        row = db.execute("SELECT body FROM records WHERE id=? AND owner=? AND kind=?", (record_id, user, kind)).fetchone()
        if row is None:
            raise HTTPException(404, "Not found")
        return json.loads(row[0])

    def save(db, record, user, kind):
        db.execute("INSERT INTO records VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET body=excluded.body",
                   (record["id"], user, kind, json.dumps(record)))

    def balance(db, user):
        return db.execute("SELECT COALESCE(SUM(delta),0) FROM ledger WHERE owner=?", (user,)).fetchone()[0]

    def charge(db, user, cost, reason, operation):
        current = balance(db, user)
        if current < cost:
            raise HTTPException(402, {"code": "insufficient_credits", "balance": current, "required": cost})
        db.execute("INSERT INTO ledger VALUES (?, ?, ?, ?, ?, ?)",
                   (uuid4().hex, user, -cost, reason, int(time.time()), operation))

    def mutate(user, scope, key, payload, action):
        fingerprint = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
        with connect() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute("SELECT fingerprint, body FROM retries WHERE owner=? AND scope=? AND key=?", (user, scope, key)).fetchone()
            if row:
                if row[0] != fingerprint:
                    raise HTTPException(409, "Idempotency key was already used with different input")
                return json.loads(row[1])
            result = action(db)
            db.execute("INSERT INTO retries VALUES (?, ?, ?, ?, ?)", (user, scope, key, fingerprint, json.dumps(result)))
            return result

    def media(asset_id, request):
        expires = int(time.time()) + 900
        signature = hmac.new(media_secret, f"{asset_id}:{expires}".encode(), hashlib.sha256).hexdigest()
        return {"id": asset_id, "contentType": assets[asset_id].contentType,
                "url": str(request.url_for("media_file", asset_id=asset_id)) + f"?expires={expires}&signature={signature}",
                "expiresAt": expires}

    def present(record, request):
        result = copy.deepcopy(record)
        if "shots" in result:
            result["exportAvailable"] = not record.get("isTour", False) and export_match(record) is not None
            for shot in result["shots"]:
                for take in shot["takes"]:
                    take["media"] = media(take["assetId"], request)
                for option in shot["revisionOptions"]:
                    option["media"] = media(option["assetId"], request)
        elif "assetId" in result:
            result["download"] = media(result["assetId"], request)
        return result

    def shot_for(project, shot_id):
        for shot in project["shots"]:
            if shot["id"] == shot_id:
                return shot
        raise HTTPException(404, "Shot not found")

    def export_match(project):
        options = {s["id"]: next(t["sourceOptionId"] for t in s["takes"] if t["id"] == s["selectedTakeId"])
                   for s in project["shots"]}
        for variant in project["exportVariants"]:
            if variant["selectedOptions"] == options:
                return variant
        return None

    Key = Annotated[str, Header(alias="Idempotency-Key", min_length=1, max_length=128)]

    @app.get("/health")
    def health():
        with connect() as db:
            db.execute("SELECT 1")
        return {"status": "ok", "demoReady": bool(catalog.scenarios), "scenarioCount": len(catalog.scenarios)}

    @app.post("/v1/sessions", status_code=201)
    def start_session():
        token = secrets.token_urlsafe(32)
        user = uuid4().hex
        expires = int(time.time()) + 604800
        with connect() as db:
            db.execute("INSERT INTO sessions VALUES (?, ?, ?)", (user, hashlib.sha256(token.encode()).hexdigest(), expires))
        return {"token": token, "tokenType": "Bearer", "expiresAt": expires}

    @app.get("/v1/catalog")
    def get_catalog(request: Request):
        result = []
        for scenario in catalog.scenarios:
            item = scenario.model_dump(exclude={"exports"})
            for options in item["choices"].values():
                for option in options:
                    if option["assetId"]:
                        option["media"] = media(option["assetId"], request)
            result.append(item)
        return {"version": catalog.version, "contentMode": "demo", "aiGenerationEnabled": False,
                "billingMode": "credits", "paymentsEnabled": True, "network": NETWORK, "prices": PRICES,
                "exportFormats": ["mp4"], "scenarios": result}

    @app.post("/v1/prompt-previews")
    def prompt_preview(body: SelectionRequest):
        _, selection = select(body)
        return {"contentMode": "demo", **selection.prompt.model_dump()}

    @app.post("/v1/projects", status_code=201)
    def create_project(body: SelectionRequest, request: Request, key: Key, user: str = Depends(owner)):
        scenario, selection = select(body)

        def action(db):
            project = {"id": uuid4().hex, "title": scenario.title, "scenarioId": scenario.id,
                       "selectionId": selection.id, "catalogVersion": catalog.version, "contentMode": "demo",
                       "values": selection.values, "prompt": selection.prompt.model_dump(),
                       "createdAt": int(time.time()), "revision": 1, "shots": [], "isTour": scenario.isTour,
                       "exportVariants": [e.model_dump() for e in scenario.exports if e.selectionId == selection.id]}
            for source in selection.shots:
                default = next(t for t in source.takes if t.id == source.defaultTakeId)
                take = {"id": uuid4().hex, "sourceOptionId": default.id, "assetId": default.assetId,
                        "prompt": default.prompt, "createdAt": int(time.time()),
                        "durationSeconds": default.durationSeconds or source.durationSeconds}
                project["shots"].append({"id": source.id, "label": source.label,
                                         "durationSeconds": take["durationSeconds"], "flagged": False,
                                         "locked": False, "selectedTakeId": take["id"], "takes": [take],
                                         "revisionOptions": [{**t.model_dump(), "durationSeconds": t.durationSeconds or source.durationSeconds}
                                                             for t in source.takes]})
            if not scenario.isTour:
                charge(db, user, PRICES["createCredits"], "create", project["id"])
            save(db, project, user, "project")
            return project

        return present(mutate(user, "create-project", key, body.model_dump(), action), request)

    @app.get("/v1/projects")
    def list_projects(user: str = Depends(owner)):
        with connect() as db:
            rows = db.execute("SELECT body FROM records WHERE owner=? AND kind='project'", (user,)).fetchall()
        return [{k: p[k] for k in ("id", "title", "createdAt", "revision")} for row in rows for p in [json.loads(row[0])]]

    @app.get("/v1/projects/{project_id}")
    def get_project(project_id: str, request: Request, user: str = Depends(owner)):
        with connect() as db:
            project = load(db, project_id, user, "project")
        return present(project, request)

    @app.patch("/v1/projects/{project_id}/shots/{shot_id}")
    def patch_shot(project_id: str, shot_id: str, body: ShotPatch, request: Request, key: Key, user: str = Depends(owner)):
        def action(db):
            project = load(db, project_id, user, "project")
            shot = shot_for(project, shot_id)
            changes = body.model_dump(exclude_unset=True)
            if "selectedTakeId" in changes:
                if shot["locked"]:
                    raise HTTPException(409, "Unlock the shot before changing its take")
                if changes["selectedTakeId"] not in {t["id"] for t in shot["takes"]}:
                    raise HTTPException(422, "Take does not belong to this shot")
            shot.update(changes)
            if "selectedTakeId" in changes:
                selected = next(t for t in shot["takes"] if t["id"] == shot["selectedTakeId"])
                shot["durationSeconds"] = selected.get("durationSeconds", shot["durationSeconds"])
            project["revision"] += 1
            save(db, project, user, "project")
            return project

        return present(mutate(user, f"patch:{project_id}:{shot_id}", key, body.model_dump(exclude_unset=True), action), request)

    @app.post("/v1/projects/{project_id}/shots/{shot_id}/revisions", status_code=201)
    def revise_shot(project_id: str, shot_id: str, body: RevisionRequest, request: Request, key: Key, user: str = Depends(owner)):
        def action(db):
            project = load(db, project_id, user, "project")
            shot = shot_for(project, shot_id)
            if shot["locked"]:
                raise HTTPException(409, "Unlock the shot before applying a revision")
            option = next((t for t in shot["revisionOptions"] if t["id"] == body.revisionOptionId), None)
            if option is None:
                raise HTTPException(422, "Choose an available prepared revision")
            take = {"id": uuid4().hex, "sourceOptionId": option["id"], "assetId": option["assetId"],
                    "prompt": option["prompt"], "createdAt": int(time.time()),
                    "durationSeconds": option.get("durationSeconds") or shot["durationSeconds"]}
            if not project.get("isTour", False):
                charge(db, user, PRICES["revisionCredits"], "revision", take["id"])
            shot["takes"].append(take)
            shot["selectedTakeId"] = take["id"]
            shot["durationSeconds"] = take["durationSeconds"]
            project["revision"] += 1
            save(db, project, user, "project")
            return project

        return present(mutate(user, f"revision:{project_id}:{shot_id}", key, body.model_dump(), action), request)

    @app.post("/v1/projects/{project_id}/exports", status_code=201)
    def create_export(project_id: str, body: ExportRequest, request: Request, key: Key, user: str = Depends(owner)):
        def action(db):
            project = load(db, project_id, user, "project")
            if project.get("isTour", False):
                raise HTTPException(409, "Tour projects are free previews; create a paid project to export")
            variant = export_match(project)
            if variant is None:
                raise HTTPException(409, "No prepared MP4 matches these takes; choose a supported combination")
            selected = {s["id"]: s["selectedTakeId"] for s in project["shots"]}
            snapshot = hashlib.sha256(json.dumps([project_id, selected, body.format], sort_keys=True).encode()).hexdigest()
            unlocked = db.execute("SELECT export_id FROM export_unlocks WHERE owner=? AND snapshot=?", (user, snapshot)).fetchone()
            if unlocked:
                return load(db, unlocked[0], user, "export")
            result = {"id": uuid4().hex, "projectId": project_id, "projectRevision": project["revision"],
                      "selectedTakeIds": selected,
                      "assetId": variant["assetId"], "format": body.format, "state": "ready",
                      "contentMode": "demo", "createdAt": int(time.time())}
            charge(db, user, PRICES["exportCredits"], "export", result["id"])
            save(db, result, user, "export")
            db.execute("INSERT INTO export_unlocks VALUES (?, ?, ?)", (user, snapshot, result["id"]))
            return result

        return present(mutate(user, f"export:{project_id}", key, body.model_dump(), action), request)

    @app.get("/v1/exports/{export_id}")
    def get_export(export_id: str, request: Request, user: str = Depends(owner)):
        with connect() as db:
            return present(load(db, export_id, user, "export"), request)

    @app.get("/v1/balance")
    def get_balance(user: str = Depends(owner)):
        with connect() as db:
            entries = db.execute("SELECT delta, reason, created FROM ledger WHERE owner=? ORDER BY created DESC, rowid DESC LIMIT 50", (user,)).fetchall()
            return {"balance": balance(db, user), "prices": PRICES, "network": NETWORK,
                    "history": [dict(row) for row in entries]}

    @app.post("/v1/wallet-challenges", status_code=201)
    def wallet_challenge(body: WalletRequest, user: str = Depends(owner)):
        expires = int(time.time()) + 300
        challenge_id = uuid4().hex
        domain = urlsplit(origins[0]).netloc if origins else "Toon Clip"
        message = (f"Toon Clip wallet connection\nDomain: {domain}\nNetwork: Solana Devnet\n"
                   f"Wallet: {body.walletAddress}\nSession: {user}\nNonce: {secrets.token_hex(32)}\n"
                   f"Expires: {expires}\nThis signature connects your wallet; it does not send tokens.")
        result = {"id": challenge_id, "walletAddress": body.walletAddress, "message": message,
                  "expiresAt": expires, "used": False}
        with connect() as db:
            save(db, result, user, "wallet-challenge")
        return result

    @app.post("/v1/wallet-links")
    def link_wallet(body: WalletProof, user: str = Depends(owner)):
        with connect() as db:
            db.execute("BEGIN IMMEDIATE")
            challenge = load(db, body.challengeId, user, "wallet-challenge")
            if challenge["used"] or challenge["expiresAt"] <= int(time.time()):
                raise HTTPException(409, "Wallet challenge used or expired; request a new one")
            try:
                signature = Signature.from_bytes(base64.b64decode(body.signatureBase64, validate=True))
            except ValueError as error:
                raise HTTPException(422, "Supply the wallet signature as base64") from error
            if not signature.verify(Pubkey.from_string(challenge["walletAddress"]), challenge["message"].encode()):
                raise HTTPException(422, "Wallet signature is invalid")
            existing = db.execute("SELECT address FROM wallets WHERE owner=?", (user,)).fetchone()
            if existing and existing[0] != challenge["walletAddress"]:
                raise HTTPException(409, "This session already uses another wallet")
            elsewhere = db.execute("SELECT owner FROM wallets WHERE address=?", (challenge["walletAddress"],)).fetchone()
            # shortcut: seven-day guest sessions; add wallet account recovery before a public launch.
            if elsewhere and elsewhere[0] != user:
                raise HTTPException(409, "Wallet already linked; use its original demo session")
            db.execute("INSERT OR IGNORE INTO wallets VALUES (?, ?)", (user, challenge["walletAddress"]))
            challenge["used"] = True
            save(db, challenge, user, "wallet-challenge")
        return {"walletAddress": challenge["walletAddress"], "network": NETWORK}

    @app.post("/v1/payment-intents", status_code=201)
    def create_payment(body: PurchaseRequest, key: Key, user: str = Depends(owner)):
        def action(db):
            wallet = db.execute("SELECT address FROM wallets WHERE owner=?", (user,)).fetchone()
            if wallet is None:
                raise HTTPException(409, "Connect and verify a Solana wallet first")
            now = int(time.time())
            pack = PRICES["creditPack"]
            result = {"id": uuid4().hex, "packId": body.packId, "state": "pending", "network": NETWORK,
                      "payer": wallet[0], "recipient": recipient, "mint": USDC_MINT,
                      "amount": pack["amount"], "amountAtomic": pack["amountAtomic"], "credits": pack["credits"],
                      "reference": str(Pubkey.from_bytes(secrets.token_bytes(32))),
                      "createdAt": now, "expiresAt": now + 900, "creditsGranted": 0}
            result["paymentUrl"] = payment_url(result)
            save(db, result, user, "payment")
            return result
        return mutate(user, "payment-intent", key, body.model_dump(), action)

    @app.get("/v1/payment-intents/{payment_id}")
    def get_payment(payment_id: str, user: str = Depends(owner)):
        with connect() as db:
            return load(db, payment_id, user, "payment")

    @app.post("/v1/payment-intents/{payment_id}/verify")
    def verify_purchase(payment_id: str, body: PaymentProof, key: Key, user: str = Depends(owner)):
        with connect() as db:
            order = load(db, payment_id, user, "payment")
        if order["state"] != "paid" and not verify_payment(order, body.transactionSignature, rpc_url):
            return order

        def action(db):
            payment = load(db, payment_id, user, "payment")
            if payment["state"] == "paid":
                if payment["transactionSignature"] != body.transactionSignature:
                    raise HTTPException(409, "Purchase already paid with another transaction")
                return payment
            claimed = db.execute("SELECT payment_id FROM payment_claims WHERE signature=?", (body.transactionSignature,)).fetchone()
            if claimed:
                raise HTTPException(409, "Transaction was already used for another purchase")
            db.execute("INSERT INTO payment_claims VALUES (?, ?)", (body.transactionSignature, payment_id))
            db.execute("INSERT INTO ledger VALUES (?, ?, ?, ?, ?, ?)",
                       (uuid4().hex, user, payment["credits"], "purchase", int(time.time()), payment_id))
            payment.update(state="paid", creditsGranted=payment["credits"], transactionSignature=body.transactionSignature)
            save(db, payment, user, "payment")
            return payment

        return mutate(user, f"verify:{payment_id}", key, body.model_dump(), action)

    @app.get("/v1/media/{asset_id}", name="media_file")
    def media_file(asset_id: str, expires: Annotated[int, Query(gt=0)],
                   signature: Annotated[str, Query(pattern=r"^[a-f0-9]{64}$")]):
        expected = hmac.new(media_secret, f"{asset_id}:{expires}".encode(), hashlib.sha256).hexdigest()
        if expires <= int(time.time()) or not hmac.compare_digest(expected, signature):
            raise HTTPException(403, "Media link is invalid or expired; reload the project")
        if asset_id not in files:
            raise HTTPException(404, "Media not found")
        path = files[asset_id]
        if not path.is_file():
            raise HTTPException(503, "Media unavailable")
        return FileResponse(path, media_type=assets[asset_id].contentType, filename=path.name,
                            content_disposition_type="inline")

    return app


def configured_app():
    root = Path(__file__).parent
    # shortcut: one SQLite service instance, switch to managed Postgres before scaling.
    return create_app(Path(os.environ.get("TOON_DATABASE", root / "data/toon.sqlite3")),
                      Path(os.environ.get("TOON_CATALOG", root / "catalog.json")),
                      Path(os.environ.get("TOON_ASSETS", root / "assets")),
                      [o.strip() for o in os.environ.get("TOON_FRONTEND_ORIGINS", "http://localhost:5050").split(",") if o.strip()],
                      os.environ.get("TOON_SOLANA_RECIPIENT", DEFAULT_RECIPIENT),
                      os.environ.get("TOON_SOLANA_RPC", "https://api.devnet.solana.com"))
