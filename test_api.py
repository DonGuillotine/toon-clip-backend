"""Transport/domain checks use temporary bytes, not production demo media."""
import hashlib
import base64
import json
import sqlite3
from pathlib import Path
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from contextlib import closing
from urllib.parse import parse_qs, urlsplit
from unittest.mock import patch

from fastapi.testclient import TestClient
from solders.keypair import Keypair

from main import Catalog, create_app


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        assets = []
        for name in ["original", "alternate", "final-original", "final-alternate"]:
            data = ("Transport fixture: " + name).encode()
            (self.root / (name + ".mp4")).write_bytes(data)
            assets.append({"id": name, "file": name + ".mp4", "contentType": "video/mp4",
                           "sha256": hashlib.sha256(data).hexdigest()})
        take = lambda name: {"id": name, "label": name, "assetId": name, "prompt": "Saved prompt " + name}
        self.catalog = {"version": "test1", "assets": assets, "scenarios": [{
            "id": "scene", "title": "Test scene", "description": "Temporary test data",
            "choices": {"character": [{"id": "kaito", "label": "Kaito"}]},
            "selections": [{"id": "selection", "values": {"character": "kaito"},
                            "prompt": {"original": "Turn", "improved": "Turn toward the door", "changes": ["Adds direction"]},
                            "shots": [{"id": "shot1", "label": "Shot 1", "durationSeconds": 3.0,
                                       "takes": [take("original"), take("alternate")], "defaultTakeId": "original"}]}],
            "exports": [{"selectionId": "selection", "selectedOptions": {"shot1": "original"}, "assetId": "final-original"},
                        {"selectionId": "selection", "selectedOptions": {"shot1": "alternate"}, "assetId": "final-alternate"}]}]}
        self.path = self.root / "catalog.json"
        self.path.write_text(json.dumps(self.catalog), encoding="utf-8")
        self.database = self.root / "db.sqlite3"
        self.app = create_app(self.database, self.path, self.root, ["http://localhost:3000"])
        self.client = TestClient(self.app)
        self.addCleanup(self.client.close)
        token = self.client.post("/v1/sessions").json()["token"]
        self.headers = {"Authorization": "Bearer " + token}
        self.selection = {"scenarioId": "scene", "selectionId": "selection"}
        with closing(sqlite3.connect(self.database)) as db, db:
            self.owner = db.execute("SELECT id FROM sessions WHERE token_hash=?", (hashlib.sha256(token.encode()).hexdigest(),)).fetchone()[0]
            db.execute("INSERT INTO ledger VALUES ('fixture', ?, 100, 'test-fixture', 0, 'fixture')", (self.owner,))

    def credits(self):
        return self.client.get("/v1/balance", headers=self.headers).json()["balance"]

    def clear_credits(self):
        with closing(sqlite3.connect(self.database)) as db, db:
            db.execute("DELETE FROM ledger WHERE owner=?", (self.owner,))

    def connect_wallet(self, wallet=None):
        wallet = wallet or Keypair()
        challenge = self.post("/v1/wallet-challenges", {"walletAddress": str(wallet.pubkey())}).json()
        proof = {"challengeId": challenge["id"], "signatureBase64": base64.b64encode(bytes(wallet.sign_message(challenge["message"].encode()))).decode()}
        response = self.post("/v1/wallet-links", proof)
        self.assertEqual(response.status_code, 200, response.text)
        return wallet, proof

    def post(self, url, body, key="test", headers=None):
        return self.client.post(url, json=body, headers={**(headers or self.headers), "Idempotency-Key": key})

    def project(self):
        response = self.post("/v1/projects", self.selection)
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()

    def test_core_flow_keeps_takes_and_export_snapshot(self):
        self.assertFalse(self.client.get("/v1/catalog").json()["aiGenerationEnabled"])
        prompt = self.client.post("/v1/prompt-previews", json=self.selection).json()
        self.assertEqual(prompt["improved"], "Turn toward the door")
        project = self.project()
        project_id = project["id"]
        old_take = project["shots"][0]["selectedTakeId"]
        export = self.post(f"/v1/projects/{project_id}/exports", {}, key="export1").json()
        response = self.post(f"/v1/projects/{project_id}/shots/shot1/revisions", {"revisionOptionId": "alternate"})
        self.assertEqual(response.status_code, 201, response.text)
        shot = response.json()["shots"][0]
        self.assertEqual(len(shot["takes"]), 2)
        self.assertNotEqual(shot["selectedTakeId"], old_take)
        replay = self.post(f"/v1/projects/{project_id}/shots/shot1/revisions", {"revisionOptionId": "alternate"})
        self.assertEqual(len(replay.json()["shots"][0]["takes"]), 2)
        new_export = self.post(f"/v1/projects/{project_id}/exports", {}, key="export2").json()
        self.assertEqual(new_export["assetId"], "final-alternate")
        old_export = self.client.get(f"/v1/exports/{export['id']}", headers=self.headers).json()
        self.assertEqual(old_export["assetId"], "final-original")
        self.assertEqual(old_export["selectedTakeIds"]["shot1"], old_take)
        url = urlsplit(old_export["download"]["url"])
        download = self.client.get(url.path + "?" + url.query)
        self.assertEqual(download.content, b"Transport fixture: final-original")
        resumed = TestClient(create_app(self.database, self.path, self.root, []))
        self.addCleanup(resumed.close)
        self.assertEqual(len(resumed.get(f"/v1/projects/{project_id}", headers=self.headers).json()["shots"][0]["takes"]), 2)

    def test_ownership_and_invalid_input(self):
        self.assertEqual(self.client.get("/v1/projects").status_code, 401)
        project = self.project()
        other_token = self.client.post("/v1/sessions").json()["token"]
        other = {"Authorization": "Bearer " + other_token}
        self.assertEqual(self.client.get(f"/v1/projects/{project['id']}", headers=other).status_code, 404)
        self.assertEqual(self.post("/v1/projects", {**self.selection, "selectionId": "missing"}, key="bad").status_code, 422)
        self.assertEqual(self.post("/v1/projects", {**self.selection, "price": 0}, key="extra").status_code, 422)
        self.assertEqual(self.post("/v1/projects", {**self.selection, "selectionId": "missing"}).status_code, 422)
        self.assertEqual(self.client.get("/v1/projects", headers=other).json(), [])
        self.assertEqual(self.client.get("/v1/media/original?expires=9999999999&signature=" + "0" * 64).status_code, 403)
        self.assertEqual(self.client.get("/v1/media/original?expires=9999999999&signature=fake").status_code, 422)

    def test_lock_and_take_validation(self):
        project = self.project()
        url = f"/v1/projects/{project['id']}/shots/shot1"
        headers = {**self.headers, "Idempotency-Key": "lock"}
        self.assertEqual(self.client.patch(url, json={"locked": True}, headers=headers).status_code, 200)
        self.assertEqual(self.post(url + "/revisions", {"revisionOptionId": "alternate"}).status_code, 409)
        self.assertEqual(self.client.patch(url, json={"locked": True}, headers=headers).json()["revision"], 2)
        self.assertEqual(self.client.patch(url, json={"locked": False}, headers=headers).status_code, 409)
        self.assertEqual(self.client.patch(url, json={"locked": False}, headers={**self.headers, "Idempotency-Key": "unlock"}).status_code, 200)
        self.assertEqual(self.client.patch(url, json={"selectedTakeId": "foreign-take"}, headers={**self.headers, "Idempotency-Key": "foreign"}).status_code, 422)
        self.assertEqual(self.client.patch(url, json={"locked": None}, headers={**self.headers, "Idempotency-Key": "null"}).status_code, 422)
        self.assertEqual(self.client.patch(url, json={}, headers={**self.headers, "Idempotency-Key": "empty"}).status_code, 422)

    def test_unmatched_export_is_rejected(self):
        self.catalog["scenarios"][0]["exports"].pop()
        self.path.write_text(json.dumps(self.catalog), encoding="utf-8")
        self.client = TestClient(create_app(self.database, self.path, self.root, []))
        self.addCleanup(self.client.close)
        project = self.project()
        url = f"/v1/projects/{project['id']}"
        self.assertEqual(self.post(url + "/shots/shot1/revisions", {"revisionOptionId": "alternate"}).status_code, 201)
        self.assertFalse(self.client.get(url, headers=self.headers).json()["exportAvailable"])
        self.assertEqual(self.post(url + "/exports", {}).status_code, 409)

    def test_concurrent_retries_create_only_one_project(self):
        def create(_):
            with TestClient(self.app) as client:
                response = client.post("/v1/projects", json=self.selection,
                                       headers={**self.headers, "Idempotency-Key": "concurrent"})
                self.assertEqual(response.status_code, 201, response.text)
                return response.json()["id"]
        with ThreadPoolExecutor(max_workers=4) as pool:
            ids = list(pool.map(create, range(8)))
        self.assertEqual(len(set(ids)), 1)
        self.assertEqual(len(self.client.get("/v1/projects", headers=self.headers).json()), 1)
        self.assertEqual(self.credits(), 90)

    def test_credit_charges_and_free_export_reloads(self):
        project = self.project()
        self.assertEqual(self.credits(), 90)
        self.project()  # Same operation retry.
        self.assertEqual(self.credits(), 90)
        url = f"/v1/projects/{project['id']}"
        export = self.post(url + "/exports", {}).json()
        self.assertEqual(self.credits(), 70)
        second = self.post(url + "/exports", {}, key="another-key").json()
        self.assertEqual(second["id"], export["id"])
        self.client.get(f"/v1/exports/{export['id']}", headers=self.headers)
        self.assertEqual(self.credits(), 70)
        self.assertEqual(self.post(url + "/shots/shot1/revisions", {"revisionOptionId": "missing"}).status_code, 422)
        self.assertEqual(self.credits(), 70)
        response = self.post(url + "/shots/shot1/revisions", {"revisionOptionId": "alternate"})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(self.credits(), 65)

    def test_valid_media_link_expires_and_export_refresh_is_free(self):
        project = self.project()
        export = self.post(f"/v1/projects/{project['id']}/exports", {}).json()
        original_url = export["download"]["url"]
        expiry = int(parse_qs(urlsplit(original_url).query)["expires"][0])
        self.assertEqual(self.client.get(original_url).status_code, 200)
        with patch("main.time.time", return_value=expiry + 1):
            self.assertEqual(self.client.get(original_url).status_code, 403)
            refreshed = self.client.get(f"/v1/exports/{export['id']}", headers=self.headers)
            self.assertEqual(refreshed.status_code, 200, refreshed.text)
            new_download = refreshed.json()["download"]
            self.assertGreater(new_download["expiresAt"], expiry)
            self.assertEqual(self.client.get(new_download["url"]).content, b"Transport fixture: final-original")
            self.assertEqual(self.credits(), 70)

    def test_concurrent_new_requests_cannot_overspend(self):
        with closing(sqlite3.connect(self.database)) as db, db:
            db.execute("UPDATE ledger SET delta=10 WHERE id='fixture'")
        def create(i):
            return self.post("/v1/projects", self.selection, key=f"distinct-{i}").status_code
        with ThreadPoolExecutor(max_workers=4) as pool:
            statuses = list(pool.map(create, range(8)))
        self.assertEqual(statuses.count(201), 1)
        self.assertEqual(statuses.count(402), 7)
        self.assertEqual(self.credits(), 0)

    def test_insufficient_credits_roll_back_without_saved_changes(self):
        project = self.project()
        self.clear_credits()
        response = self.post("/v1/projects", self.selection, key="empty")
        self.assertEqual(response.status_code, 402)
        self.assertEqual(response.json()["detail"], {"code": "insufficient_credits", "balance": 0, "required": 10})
        self.assertEqual(len(self.client.get("/v1/projects", headers=self.headers).json()), 1)
        url = f"/v1/projects/{project['id']}"
        self.assertEqual(self.post(url + "/shots/shot1/revisions", {"revisionOptionId": "alternate"}).status_code, 402)
        self.assertEqual(self.post(url + "/exports", {}).status_code, 402)
        self.assertEqual(len(self.client.get(url, headers=self.headers).json()["shots"][0]["takes"]), 1)
        self.assertEqual(self.credits(), 0)

    def test_free_tour_cannot_unlock_export(self):
        self.catalog["scenarios"][0]["isTour"] = True
        self.path.write_text(json.dumps(self.catalog), encoding="utf-8")
        self.client = TestClient(create_app(self.database, self.path, self.root, []))
        self.addCleanup(self.client.close)
        self.clear_credits()
        project = self.project()
        self.assertFalse(project["exportAvailable"])
        url = f"/v1/projects/{project['id']}"
        self.assertEqual(self.post(url + "/shots/shot1/revisions", {"revisionOptionId": "alternate"}).status_code, 201)
        self.assertEqual(self.post(url + "/exports", {}).status_code, 409)
        self.assertEqual(self.credits(), 0)

    def test_wallet_proof_replay_forgery_and_ownership(self):
        self.assertEqual(self.post("/v1/payment-intents", {}).status_code, 409)
        self.assertEqual(self.post("/v1/wallet-challenges", {"walletAddress": "x" * 32}).status_code, 422)
        wallet, proof = self.connect_wallet()
        self.assertEqual(self.post("/v1/wallet-links", proof).status_code, 409)
        challenge = self.post("/v1/wallet-challenges", {"walletAddress": str(wallet.pubkey())}).json()
        forgery = {"challengeId": challenge["id"], "signatureBase64": base64.b64encode(bytes(Keypair().sign_message(challenge["message"].encode()))).decode()}
        self.assertEqual(self.post("/v1/wallet-links", forgery).status_code, 422)
        self.assertEqual(self.post("/v1/wallet-links", {**forgery, "signatureBase64": "!" * 88}).status_code, 422)
        other = {"Authorization": "Bearer " + self.client.post("/v1/sessions").json()["token"]}
        self.assertEqual(self.post("/v1/wallet-links", proof, headers=other).status_code, 404)
        challenge = self.post("/v1/wallet-challenges", {"walletAddress": str(wallet.pubkey())}, headers=other).json()
        valid = {"challengeId": challenge["id"], "signatureBase64": base64.b64encode(bytes(wallet.sign_message(challenge["message"].encode()))).decode()}
        self.assertEqual(self.post("/v1/wallet-links", valid, headers=other).status_code, 409)
        with patch("main.time.time", return_value=challenge["expiresAt"] + 1):
            self.assertEqual(self.post("/v1/wallet-links", valid, headers=other).status_code, 409)

    def test_purchase_pending_then_granted_once_and_signature_claimed_once(self):
        self.clear_credits()
        wallet, _ = self.connect_wallet()
        order = self.post("/v1/payment-intents", {}).json()
        self.assertEqual(order["amountAtomic"], 10000000)
        self.assertEqual(order["credits"], 100)
        self.assertEqual(order["payer"], str(wallet.pubkey()))
        self.assertEqual(self.post("/v1/payment-intents", {}).json()["id"], order["id"])
        self.assertEqual(self.post("/v1/payment-intents", {"amount": "0"}, key="bad").status_code, 422)
        proof = {"transactionSignature": str(wallet.sign_message(b"transaction-fixture"))}
        url = f"/v1/payment-intents/{order['id']}/verify"
        with patch("main.verify_payment", return_value=False):
            self.assertEqual(self.post(url, proof).json()["state"], "pending")
            self.assertEqual(self.credits(), 0)
        with patch("main.verify_payment", return_value=True):
            def verify(i):
                response = self.post(url, proof, key=f"verify-{i}")
                self.assertEqual(response.status_code, 200, response.text)
                return response.json()["creditsGranted"]
            with ThreadPoolExecutor(max_workers=4) as pool:
                self.assertEqual(list(pool.map(verify, range(8))), [100] * 8)
            self.assertEqual(self.credits(), 100)
            another = self.post("/v1/payment-intents", {}, key="another").json()
            self.assertEqual(self.post(f"/v1/payment-intents/{another['id']}/verify", proof).status_code, 409)
            self.assertEqual(self.credits(), 100)
        other = {"Authorization": "Bearer " + self.client.post("/v1/sessions").json()["token"]}
        self.assertEqual(self.client.get(f"/v1/payment-intents/{order['id']}", headers=other).status_code, 404)

    def test_catalog_checks_files_references_and_paths(self):
        self.catalog["assets"][0]["file"] = "missing.mp4"
        self.path.write_text(json.dumps(self.catalog), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "Asset missing"):
            create_app(self.database, self.path, self.root, [])
        self.catalog["assets"][0]["file"] = "original.mp4"
        self.catalog["assets"][0]["sha256"] = "0" * 64
        self.path.write_text(json.dumps(self.catalog), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "checksum"):
            create_app(self.database, self.path, self.root, [])
        self.catalog["assets"][0]["file"] = "../outside.mp4"
        self.path.write_text(json.dumps(self.catalog), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "outside"):
            create_app(self.database, self.path, self.root, [])
        self.catalog["scenarios"][0]["exports"][0]["selectedOptions"] = {}
        with self.assertRaisesRegex(ValueError, "every shot"):
            Catalog.model_validate(self.catalog)


if __name__ == "__main__":
    unittest.main()
