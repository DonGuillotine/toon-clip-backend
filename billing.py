"""Solana Devnet only. Verify direct SPL-token transfers before granting credits."""
import base64
import json
import urllib.error
import urllib.request
from urllib.parse import urlencode

from fastapi import HTTPException
from solders.pubkey import Pubkey
from solders.transaction import TransactionError, VersionedTransaction

NETWORK = "solana-devnet"
GENESIS = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG"
USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
DEFAULT_RECIPIENT = "FHBBpDTfzg6rKX3vHCGwNAgveGeExKKGwBvCwCeZFXb6"
PRICES = {"creditPack": {"id": "credits-100", "credits": 100, "amount": "10",
                         "amountAtomic": 10000000, "token": "USDC", "decimals": 6},
          "createCredits": 10, "revisionCredits": 5, "exportCredits": 20}


def wallet_address(value):
    try:
        key = Pubkey.from_string(value)
        if not key.is_on_curve():
            raise ValueError("Wallet needs a signing key")
        return str(key)
    except ValueError as error:
        raise ValueError("Supply a valid signing Solana wallet address") from error


def payment_url(order):
    return "solana:" + order["recipient"] + "?" + urlencode({
        "amount": order["amount"], "spl-token": order["mint"], "reference": order["reference"],
        "label": "Toon Clip", "message": "100 demo credits - Solana Devnet only"})


def rpc_call(url, method, params):
    request = urllib.request.Request(url, data=json.dumps({"jsonrpc": "2.0", "id": 1,
                                     "method": method, "params": params}).encode(),
                                     headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            body = response.read(2000001)
        if len(body) > 2000000:
            raise ValueError("Response too large")
        result = json.loads(body)
        if not isinstance(result, dict) or "result" not in result or result.get("error"):
            raise ValueError("Invalid RPC response")
        return result["result"]
    except (OSError, ValueError, urllib.error.URLError) as error:
        raise HTTPException(503, "Solana RPC unavailable; retry verification shortly") from error


def verify_payment(order, signature, rpc_url):
    if rpc_call(rpc_url, "getGenesisHash", []) != GENESIS:
        raise HTTPException(503, "Configured RPC is not Solana Devnet")
    result = rpc_call(rpc_url, "getTransaction", [signature, {
        "encoding": "base64", "commitment": "finalized", "maxSupportedTransactionVersion": 0}])
    if result is None:
        return False
    try:
        meta = result["meta"]
        if meta["err"] is not None:
            raise HTTPException(422, "Transaction failed on Solana")
        block_time = result["blockTime"]
        if type(block_time) is not int:
            raise HTTPException(503, "Transaction timestamp unavailable; retry shortly")
        if block_time < order["createdAt"] - 30 or block_time > order["expiresAt"]:
            raise HTTPException(422, "Transaction is outside this purchase's payment window")
        transaction = VersionedTransaction.from_bytes(base64.b64decode(result["transaction"][0], validate=True))
        transaction.verify_and_hash_message()
        if str(transaction.signatures[0]) != signature:
            raise HTTPException(422, "Transaction signature does not match")
        keys = list(transaction.message.account_keys)
        if hasattr(transaction.message, "address_table_lookups"):
            loaded = meta["loadedAddresses"]
            keys += [Pubkey.from_string(k) for k in loaded["writable"] + loaded["readonly"]]
        keys = [str(k) for k in keys]
        if keys[0] != order["payer"]:
            raise HTTPException(422, "Transaction was not sent by the linked wallet")
        before = {b["accountIndex"]: b for b in meta["preTokenBalances"]}
        after = {b["accountIndex"]: b for b in meta["postTokenBalances"]}
        for instruction in transaction.message.instructions:
            if keys[instruction.program_id_index] != TOKEN_PROGRAM:
                continue
            data = bytes(instruction.data)
            accounts = list(instruction.accounts)
            # shortcut: direct TransferChecked payments only; add other paths when a wallet requires them.
            if len(data) != 10 or data[0] != 12 or len(accounts) < 5:
                continue
            source, mint, destination, authority = accounts[:4]
            if (keys[mint] != order["mint"] or keys[authority] != order["payer"]
                    or order["reference"] not in [keys[i] for i in accounts[4:]]):
                continue
            amount = int.from_bytes(data[1:9], "little")
            if amount != order["amountAtomic"] or data[9] != 6:
                continue
            source_before, destination_after = before.get(source), after.get(destination)
            if not source_before or not destination_after:
                continue
            if (source_before.get("owner") != order["payer"]
                    or destination_after.get("owner") != order["recipient"]
                    or source_before["mint"] != order["mint"] or destination_after["mint"] != order["mint"]):
                continue
            relevant = [b for b in (before.get(source), after.get(source), before.get(destination), after.get(destination)) if b]
            if any(b["mint"] != order["mint"] or b["uiTokenAmount"]["decimals"] != 6 for b in relevant):
                continue
            balance = lambda rows, index: int(rows.get(index, {}).get("uiTokenAmount", {}).get("amount", "0"))
            if (balance(before, source) - balance(after, source) == amount
                    and balance(after, destination) - balance(before, destination) == amount):
                return True
        raise HTTPException(422, "No matching 10 test USDC transfer with this purchase reference")
    except (KeyError, IndexError, TypeError, ValueError, TransactionError) as error:
        raise HTTPException(422, "Unsupported or malformed Solana transaction") from error
