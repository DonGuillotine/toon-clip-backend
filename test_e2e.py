"""Black-box HTTP checks against a real API process and a local HTTPS RPC fixture.

No database grants or payment-verifier patches. No real tokens are sent.
"""
import base64
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
import hashlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import ipaddress
import json
import os
from pathlib import Path
import socket
import ssl
import struct
import subprocess
import sys
import tempfile
import threading
import time
import unittest
from urllib.parse import urlsplit
import zlib

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID
import httpx
import imageio_ffmpeg
from solders.hash import Hash
from solders.instruction import AccountMeta, Instruction
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.transaction import Transaction

GENESIS = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG"
MINT = Pubkey.from_string("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU")
TOKEN = Pubkey.from_string("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
ASSOCIATED = Pubkey.from_string("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
RECIPIENT = "FHBBpDTfzg6rKX3vHCGwNAgveGeExKKGwBvCwCeZFXb6"
TRACE = []


class RpcFixture(BaseHTTPRequestHandler):
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        state = self.server.state
        if state["offline"]:
            self.send_error(503)
            return
        if body["method"] == "getGenesisHash":
            result = state["genesis"]
        elif body["method"] == "getTransaction":
            if body["params"][1]["commitment"] != "finalized":
                self.send_error(400)
                return
            result = state["transactions"].get(body["params"][0])
        else:
            self.send_error(400)
            return
        data = json.dumps({"jsonrpc": "2.0", "id": body["id"], "result": result}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *args):
        pass


class EndToEndTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.addClassCleanup(cls.temp.cleanup)
        cls.root = Path(cls.temp.name)
        cls.ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
        cls.assets = cls.root / "assets"
        cls.assets.mkdir()
        for name, color in (("first", "green"), ("second", "blue"), ("alternate", "red"), ("unsupported", "yellow")):
            subprocess.run([cls.ffmpeg, "-v", "error", "-f", "lavfi", "-i", f"color=c={color}:s=160x90:r=10:d=0.4",
                            "-f", "lavfi", "-i", "sine=frequency=440:duration=0.4", "-c:v", "libx264",
                            "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", "-movflags", "+faststart",
                            str(cls.assets / f"{name}.mp4")], check=True, capture_output=True)
        for name, first in (("final", "first"), ("final-alternate", "alternate")):
            listing = cls.root / f"{name}.txt"
            listing.write_text(f"file '{(cls.assets / (first + '.mp4')).as_posix()}'\nfile '{(cls.assets / 'second.mp4').as_posix()}'\n")
            subprocess.run([cls.ffmpeg, "-v", "error", "-f", "concat", "-safe", "0", "-i", str(listing),
                            "-c", "copy", "-movflags", "+faststart", str(cls.assets / f"{name}.mp4")], check=True, capture_output=True)
        def chunk(kind, data):
            return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))
        png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0))
        png += chunk(b"IDAT", zlib.compress(b"\0\xff\xff\xff")) + chunk(b"IEND", b"")
        (cls.assets / "character.png").write_bytes(png)
        media = [{"id": p.stem, "file": p.name, "contentType": "image/png" if p.suffix == ".png" else "video/mp4",
                  "sha256": hashlib.sha256(p.read_bytes()).hexdigest()} for p in cls.assets.iterdir()]
        def take(name):
            return {"id": name, "label": name, "assetId": name, "prompt": "Test take: " + name}
        scene = {"title": "Synthetic E2E sample", "description": "Generated colors, not real demo content",
                 "choices": {"character": [{"id": "sample", "label": "Test character", "assetId": "character"}]},
                 "selections": [{"id": "sample", "values": {"character": "sample"},
                                 "prompt": {"original": "Turn", "improved": "Turn toward the door", "changes": ["Adds direction"]},
                                 "shots": [{"id": "one", "label": "First shot", "durationSeconds": 0.4,
                                            "takes": [take("first"), take("alternate")], "defaultTakeId": "first"},
                                           {"id": "two", "label": "Second shot", "durationSeconds": 0.4,
                                            "takes": [take("second"), take("unsupported")], "defaultTakeId": "second"}]}],
                 "exports": [{"selectionId": "sample", "selectedOptions": {"one": "first", "two": "second"}, "assetId": "final"},
                             {"selectionId": "sample", "selectedOptions": {"one": "alternate", "two": "second"}, "assetId": "final-alternate"}]}
        cls.catalog = {"version": "e2e", "assets": media, "scenarios": [
            {**scene, "id": "paid"}, {**scene, "id": "second-example"}, {**scene, "id": "tour", "isTour": True}]}
        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        subject = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "Toon Clip local test RPC")])
        now = datetime.now(timezone.utc)
        cert = (x509.CertificateBuilder().subject_name(subject).issuer_name(subject).public_key(key.public_key())
                .serial_number(x509.random_serial_number()).not_valid_before(now - timedelta(minutes=1))
                .not_valid_after(now + timedelta(days=1))
                .add_extension(x509.SubjectAlternativeName([x509.IPAddress(ipaddress.ip_address("127.0.0.1"))]), critical=False)
                .add_extension(x509.BasicConstraints(ca=True, path_length=None), critical=True).sign(key, hashes.SHA256()))
        cls.cert = cls.root / "rpc-cert.pem"
        cls.cert.write_bytes(cert.public_bytes(serialization.Encoding.PEM))
        key_path = cls.root / "rpc-key.pem"
        key_path.write_bytes(key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))
        cls.rpc = ThreadingHTTPServer(("127.0.0.1", 0), RpcFixture)
        cls.rpc.daemon_threads = True
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(cls.cert, key_path)
        cls.rpc.socket = context.wrap_socket(cls.rpc.socket, server_side=True)
        cls.rpc_thread = threading.Thread(target=cls.rpc.serve_forever, daemon=True)
        cls.rpc_thread.start()
        cls.addClassCleanup(cls.stop_rpc)

    @classmethod
    def stop_rpc(cls):
        cls.rpc.shutdown()
        cls.rpc.server_close()
        cls.rpc_thread.join(timeout=5)

    def setUp(self):
        self.case = Path(tempfile.mkdtemp(dir=self.root))
        self.catalog_path = self.case / "catalog.json"
        self.catalog_path.write_text(json.dumps(self.catalog), encoding="utf-8")
        self.rpc.state = {"offline": False, "genesis": GENESIS, "transactions": {}}
        with socket.socket() as reservation:
            reservation.bind(("127.0.0.1", 0))
            self.port = reservation.getsockname()[1]
        self.client = httpx.Client(base_url=f"http://127.0.0.1:{self.port}", timeout=10, trust_env=False)
        self.addCleanup(self.client.close)
        self.addCleanup(self.stop_api)
        self.log = (self.case / "api.log").open("ab")
        self.addCleanup(self.log.close)
        self.start_api()
        response = self.call("POST", "/v1/sessions", expected=201)
        self.token = response.json()["token"]
        self.client.headers["Authorization"] = "Bearer " + self.token
        self.wallet = Keypair()
        self.selection = {"scenarioId": "paid", "selectionId": "sample"}

    def start_api(self):
        env = {**os.environ, "TOON_DATABASE": str(self.case / "db.sqlite3"), "TOON_CATALOG": str(self.catalog_path),
               "TOON_ASSETS": str(self.assets), "TOON_FRONTEND_ORIGINS": "http://localhost:5050",
               "TOON_SOLANA_RECIPIENT": RECIPIENT, "TOON_SOLANA_RPC": f"https://127.0.0.1:{self.rpc.server_port}",
               "SSL_CERT_FILE": str(self.cert)}
        self.process = subprocess.Popen([sys.executable, "-m", "uvicorn", "main:configured_app", "--factory",
                                         "--host", "127.0.0.1", "--port", str(self.port)],
                                        cwd=Path(__file__).parent, env=env, stdout=self.log, stderr=self.log,
                                        creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0)
        for _ in range(100):
            if self.process.poll() is not None:
                self.fail("API failed to start: " + (self.case / "api.log").read_text())
            try:
                if self.client.get("/health").status_code == 200:
                    return
            except httpx.TransportError:
                pass
            time.sleep(0.1)
        self.fail("API did not start within ten seconds")

    def stop_api(self):
        if hasattr(self, "process") and self.process.poll() is None:
            self.process.terminate()
            self.process.wait(timeout=5)

    def call(self, method, path, body=None, expected=200, key=None, headers=None):
        extra = dict(headers or {})
        if key:
            extra["Idempotency-Key"] = key
        response = self.client.request(method, path, json=body, headers=extra)
        TRACE.append({"test": self._testMethodName, "method": method, "path": urlsplit(path).path,
                      "status": response.status_code})
        if isinstance(expected, tuple):
            self.assertIn(response.status_code, expected, response.text)
        else:
            self.assertEqual(response.status_code, expected, response.text)
        return response

    def balance(self, expected):
        result = self.call("GET", "/v1/balance").json()
        self.assertEqual(result["balance"], expected)
        return result

    def link(self):
        challenge = self.call("POST", "/v1/wallet-challenges", {"walletAddress": str(self.wallet.pubkey())}, expected=201).json()
        proof = {"challengeId": challenge["id"], "signatureBase64": base64.b64encode(bytes(self.wallet.sign_message(challenge["message"].encode()))).decode()}
        self.call("POST", "/v1/wallet-links", proof)
        return proof

    def order(self, key="purchase"):
        result = self.call("POST", "/v1/payment-intents", {}, expected=201, key=key).json()
        self.assertEqual((result["amount"], result["amountAtomic"], result["credits"], result["recipient"]), ("10", 10000000, 100, RECIPIENT))
        return result

    def transaction(self, order, *, amount=10000000, payer=None, recipient=None, reference=None, mint=MINT, extra_references=()):
        payer = payer or self.wallet
        recipient = Pubkey.from_string(recipient or order["recipient"])
        source, _ = Pubkey.find_program_address([bytes(payer.pubkey()), bytes(TOKEN), bytes(mint)], ASSOCIATED)
        destination, _ = Pubkey.find_program_address([bytes(recipient), bytes(TOKEN), bytes(mint)], ASSOCIATED)
        create_account = Instruction(ASSOCIATED, b"\1", [AccountMeta(payer.pubkey(), True, True), AccountMeta(destination, False, True),
            AccountMeta(recipient, False, False), AccountMeta(mint, False, False), AccountMeta(Pubkey.default(), False, False), AccountMeta(TOKEN, False, False)])
        references = [reference or order["reference"], *extra_references]
        transfer = Instruction(TOKEN, b"\x0c" + amount.to_bytes(8, "little") + b"\6", [AccountMeta(source, False, True),
            AccountMeta(mint, False, False), AccountMeta(destination, False, True), AccountMeta(payer.pubkey(), True, False),
            *[AccountMeta(Pubkey.from_string(r), False, False) for r in references]])
        tx = Transaction.new_signed_with_payer([create_account, transfer], payer.pubkey(), [payer], Hash.new_unique())
        keys = list(tx.message.account_keys)
        def token_balance(account, owner, balance):
            return {"accountIndex": keys.index(account), "owner": str(owner), "mint": str(mint),
                    "uiTokenAmount": {"amount": str(balance), "decimals": 6}}
        result = {"blockTime": int(time.time()), "transaction": [base64.b64encode(bytes(tx)).decode(), "base64"],
                  "meta": {"err": None, "preTokenBalances": [token_balance(source, payer.pubkey(), 20000000)],
                           "postTokenBalances": [token_balance(source, payer.pubkey(), 20000000 - amount),
                                                 token_balance(destination, recipient, amount)]}}
        return str(tx.signatures[0]), result

    def verify(self, order, signature, expected=200, key="verify"):
        return self.call("POST", f"/v1/payment-intents/{order['id']}/verify", {"transactionSignature": signature}, expected=expected, key=key).json()

    def purchase(self):
        self.link()
        order = self.order()
        signature, result = self.transaction(order)
        self.rpc.state["transactions"][signature] = result
        self.assertEqual(self.verify(order, signature)["state"], "paid")
        self.balance(100)
        return order, signature

    def test_complete_purchase_creation_revision_export_download_and_restart(self):
        self.balance(0)
        health = self.call("GET", "/health").json()
        self.assertEqual((health["demoReady"], health["scenarioCount"]), (True, 3))
        catalog = self.call("GET", "/v1/catalog").json()
        self.assertEqual(catalog["prices"]["creditPack"]["amount"], "10")
        self.assertFalse(catalog["aiGenerationEnabled"])
        image = catalog["scenarios"][0]["choices"]["character"][0]["media"]["url"]
        self.assertEqual(self.call("GET", image).content, (self.assets / "character.png").read_bytes())
        self.assertEqual(self.call("POST", "/v1/prompt-previews", self.selection).json()["improved"], "Turn toward the door")
        tour = self.call("POST", "/v1/projects", {**self.selection, "scenarioId": "tour"}, expected=201, key="tour").json()
        self.call("POST", f"/v1/projects/{tour['id']}/shots/one/revisions", {"revisionOptionId": "alternate"}, expected=201, key="tour-revise")
        self.call("POST", f"/v1/projects/{tour['id']}/exports", {}, expected=409, key="tour-export")
        self.balance(0)
        self.call("POST", "/v1/projects", self.selection, expected=402, key="create")
        order, signature = self.purchase()
        self.verify(order, signature, key="retry-payment")
        self.balance(100)
        project = self.call("POST", "/v1/projects", self.selection, expected=201, key="create").json()
        url = f"/v1/projects/{project['id']}"
        first_take = project["shots"][0]["selectedTakeId"]
        self.call("POST", "/v1/projects", self.selection, expected=201, key="create")
        self.balance(90)
        self.call("PATCH", url + "/shots/one", {"flagged": True, "locked": True}, key="lock")
        self.call("POST", url + "/shots/one/revisions", {"revisionOptionId": "alternate"}, expected=409, key="revise")
        self.balance(90)
        self.call("PATCH", url + "/shots/one", {"locked": False}, key="unlock")
        revised = self.call("POST", url + "/shots/one/revisions", {"revisionOptionId": "alternate"}, expected=201, key="revise").json()
        alternate_take = revised["shots"][0]["selectedTakeId"]
        self.assertEqual(len(revised["shots"][0]["takes"]), 2)
        self.call("POST", url + "/shots/one/revisions", {"revisionOptionId": "alternate"}, expected=201, key="revise")
        self.balance(85)
        export = self.call("POST", url + "/exports", {}, expected=201, key="export").json()
        self.assertEqual(export["assetId"], "final-alternate")
        self.balance(65)
        download = self.call("GET", export["download"]["url"])
        expected_bytes = (self.assets / "final-alternate.mp4").read_bytes()
        self.assertEqual(download.content, expected_bytes)
        downloaded = self.case / "download.mp4"
        downloaded.write_bytes(download.content)
        subprocess.run([self.ffmpeg, "-v", "error", "-i", str(downloaded), "-f", "null", "-"], check=True, capture_output=True)
        part = self.call("GET", export["download"]["url"], expected=206, headers={"Range": "bytes=0-31"})
        self.assertEqual(part.content, expected_bytes[:32])
        self.assertEqual(part.headers["content-range"], f"bytes 0-31/{len(expected_bytes)}")
        self.call("POST", url + "/exports", {}, expected=201, key="another-export-request")
        self.call("GET", f"/v1/exports/{export['id']}")
        self.balance(65)
        self.call("PATCH", url + "/shots/one", {"selectedTakeId": first_take}, key="choose-original")
        original_export = self.call("POST", url + "/exports", {}, expected=201, key="original-export").json()
        self.assertEqual(original_export["assetId"], "final")
        original_bytes = self.call("GET", original_export["download"]["url"]).content
        self.assertEqual(original_bytes, (self.assets / "final.mp4").read_bytes())
        self.assertNotEqual(original_bytes, expected_bytes)
        self.balance(45)
        self.call("PATCH", url + "/shots/one", {"selectedTakeId": alternate_take}, key="choose-alternate")
        self.assertEqual(self.call("POST", url + "/exports", {}, expected=201, key="return-to-unlocked").json()["id"], export["id"])
        self.balance(45)
        other = self.call("POST", "/v1/projects", {**self.selection, "scenarioId": "second-example"}, expected=201, key="second-example").json()
        self.assertNotEqual(other["id"], project["id"])
        self.balance(35)
        self.stop_api()
        self.start_api()
        self.balance(35)
        self.assertEqual(len(self.call("GET", "/v1/projects").json()), 3)
        self.assertEqual(self.call("GET", url).json()["shots"][0]["selectedTakeId"], alternate_take)
        self.assertEqual(self.call("GET", f"/v1/payment-intents/{order['id']}").json()["state"], "paid")
        self.assertEqual(self.call("GET", export["download"]["url"]).content, expected_bytes)
        self.assertEqual(self.call("POST", url + "/exports", {}, expected=201, key="after-restart").json()["id"], export["id"])
        self.balance(35)

    def test_payment_failures_pending_and_recovery_do_not_grant_credits(self):
        self.link()
        order = self.order()
        signature, valid = self.transaction(order)
        self.assertEqual(self.verify(order, signature)["state"], "pending")
        self.balance(0)
        self.rpc.state["offline"] = True
        self.verify(order, signature, expected=503)
        self.balance(0)
        self.rpc.state["offline"] = False
        self.rpc.state["genesis"] = "not-devnet"
        self.verify(order, signature, expected=503)
        self.rpc.state["genesis"] = GENESIS
        for change in ({"amount": 1}, {"payer": Keypair()}, {"recipient": str(Keypair().pubkey())},
                       {"mint": Pubkey.new_unique()}, {"reference": str(Pubkey.new_unique())}):
            with self.subTest(change=list(change)):
                wrong_signature, result = self.transaction(order, **change)
                self.rpc.state["transactions"][wrong_signature] = result
                self.verify(order, wrong_signature, expected=422)
                self.balance(0)
        for change in ("failed", "late", "malformed"):
            with self.subTest(change=change):
                result = json.loads(json.dumps(valid))
                if change == "failed":
                    result["meta"]["err"] = {"InstructionError": [1, "InvalidArgument"]}
                elif change == "late":
                    result["blockTime"] = order["expiresAt"] + 1
                else:
                    result["transaction"] = [base64.b64encode(b"invalid bytes").decode(), "base64"]
                self.rpc.state["transactions"][signature] = result
                self.verify(order, signature, expected=422)
                self.balance(0)
        self.rpc.state["transactions"][signature] = valid
        self.assertEqual(self.verify(order, signature)["state"], "paid")
        self.balance(100)

    def test_concurrent_verification_spending_exports_and_cross_purchase_replay(self):
        self.link()
        first, second = self.order(), self.order("second")
        signature, result = self.transaction(first, extra_references=[second["reference"]])
        self.rpc.state["transactions"][signature] = result
        with ThreadPoolExecutor(max_workers=4) as pool:
            receipts = list(pool.map(lambda i: self.verify(first, signature, key=f"verify-{i}"), range(8)))
        self.assertTrue(all(receipt["state"] == "paid" for receipt in receipts))
        self.verify(second, signature, expected=409)
        self.balance(100)
        project = self.call("POST", "/v1/projects", self.selection, expected=201, key="create").json()
        url = f"/v1/projects/{project['id']}/exports"
        with ThreadPoolExecutor(max_workers=4) as pool:
            exports = list(pool.map(lambda i: self.call("POST", url, {}, expected=201, key=f"export-{i}").json(), range(8)))
        self.assertEqual(len({e["id"] for e in exports}), 1)
        self.balance(70)
        def spend(i):
            return self.call("POST", "/v1/projects", self.selection, expected=(201, 402), key=f"distinct-{i}").status_code
        with ThreadPoolExecutor(max_workers=4) as pool:
            statuses = list(pool.map(spend, range(12)))
        self.assertEqual(statuses.count(201), 7)
        self.assertEqual(statuses.count(402), 5)
        self.balance(0)

    def test_private_records_invalid_selections_unsupported_export_and_cors(self):
        self.purchase()
        project = self.call("POST", "/v1/projects", self.selection, expected=201, key="create").json()
        url = f"/v1/projects/{project['id']}"
        export = self.call("POST", url + "/exports", {}, expected=201, key="export").json()
        self.balance(70)
        self.call("POST", url + "/shots/two/revisions", {"revisionOptionId": "unsupported"}, expected=201, key="unsupported")
        self.call("POST", url + "/exports", {}, expected=409, key="unsupported-export")
        self.balance(65)
        self.call("POST", "/v1/projects", {**self.selection, "selectionId": "missing"}, expected=422, key="invalid")
        self.call("POST", "/v1/projects", {**self.selection, "price": 0}, expected=422, key="extra")
        self.call("POST", "/v1/projects", self.selection, expected=422)
        self.call("POST", "/v1/projects", {**self.selection, "scenarioId": "second-example"}, expected=409, key="create")
        self.call("PATCH", url + "/shots/one", {"selectedTakeId": project["shots"][1]["selectedTakeId"]}, expected=422, key="foreign-take")
        self.balance(65)
        other = self.call("POST", "/v1/sessions", expected=201).json()["token"]
        unauthorized = {"Authorization": "Bearer " + other}
        self.call("GET", url, expected=404, headers=unauthorized)
        self.call("GET", f"/v1/exports/{export['id']}", expected=404, headers=unauthorized)
        self.call("GET", "/v1/projects", headers=unauthorized)
        self.call("GET", "/v1/balance", expected=401, headers={"Authorization": "Bearer invalid"})
        forged = export["download"]["url"].replace("/media/final?", "/media/final-alternate?")
        self.call("GET", forged, expected=403)
        self.call("GET", export["download"]["url"].replace("expires=", "expires=1"), expected=403)
        headers = {"Origin": "http://localhost:5050", "Access-Control-Request-Method": "POST",
                   "Access-Control-Request-Headers": "authorization,content-type,idempotency-key"}
        response = self.call("OPTIONS", "/v1/payment-intents", headers=headers)
        self.assertEqual(response.headers["access-control-allow-origin"], "http://localhost:5050")
        self.call("OPTIONS", "/v1/payment-intents", expected=400, headers={**headers, "Origin": "http://unapproved.example"})
        schema = self.call("GET", "/openapi.json").json()
        self.assertEqual(sum(len(value) for value in schema["paths"].values()), 18)


if __name__ == "__main__":
    result = unittest.main(exit=False)
    if os.environ.get("TOON_E2E_REPORT"):
        Path(os.environ["TOON_E2E_REPORT"]).write_text(json.dumps({
            "passed": result.result.wasSuccessful(), "testsRun": result.result.testsRun,
            "failures": len(result.result.failures), "errors": len(result.result.errors),
            "scope": "Real local HTTP API, SQLite, signed transaction fixtures over HTTPS RPC, generated playable MP4s; no live tokens or UI.",
            "requests": TRACE}, indent=2) + "\n", encoding="utf-8")
    sys.exit(0 if result.result.wasSuccessful() else 1)
