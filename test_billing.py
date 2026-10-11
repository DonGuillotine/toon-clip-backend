"""Signed Solana transaction fixtures; no tokens are sent by these tests."""
import base64
import copy
import unittest
from unittest.mock import patch

from fastapi import HTTPException
from solders.address_lookup_table_account import AddressLookupTableAccount
from solders.hash import Hash
from solders.instruction import AccountMeta, Instruction
from solders.keypair import Keypair
from solders.message import MessageV0
from solders.pubkey import Pubkey
from solders.transaction import Transaction, VersionedTransaction

from billing import DEFAULT_RECIPIENT, GENESIS, TOKEN_PROGRAM, USDC_MINT, verify_payment


class PaymentTests(unittest.TestCase):
    def setUp(self):
        self.payer = Keypair()
        self.source, self.destination, self.reference = [Pubkey.new_unique() for _ in range(3)]
        self.order = {"payer": str(self.payer.pubkey()), "recipient": DEFAULT_RECIPIENT,
                      "mint": USDC_MINT, "reference": str(self.reference), "amountAtomic": 10000000,
                      "createdAt": 1000, "expiresAt": 1900}
        self.result, self.signature = self.fixture()

    def fixture(self, amount=10000000, reference=None, program=TOKEN_PROGRAM, versioned=False, lookup_table=False):
        instruction = Instruction(Pubkey.from_string(program), bytes([12]) + amount.to_bytes(8, "little") + bytes([6]), [
            AccountMeta(self.source, False, True), AccountMeta(Pubkey.from_string(USDC_MINT), False, False),
            AccountMeta(self.destination, False, True), AccountMeta(self.payer.pubkey(), True, False),
            AccountMeta(reference or self.reference, False, False)])
        loaded = {"writable": [], "readonly": []}
        if versioned:
            table = AddressLookupTableAccount(Pubkey.new_unique(), [self.source, Pubkey.from_string(USDC_MINT), self.destination, self.reference])
            message = MessageV0.try_compile(self.payer.pubkey(), [instruction], [table] if lookup_table else [], Hash.default())
            for lookup in message.address_table_lookups:
                loaded["writable"].extend(str(table.addresses[i]) for i in lookup.writable_indexes)
                loaded["readonly"].extend(str(table.addresses[i]) for i in lookup.readonly_indexes)
            transaction = VersionedTransaction(message, [self.payer])
        else:
            transaction = Transaction.new_signed_with_payer([instruction], self.payer.pubkey(), [self.payer], Hash.default())
        keys = list(transaction.message.account_keys)
        keys += [Pubkey.from_string(key) for key in loaded["writable"] + loaded["readonly"]]
        source, destination = keys.index(self.source), keys.index(self.destination)

        def balance(index, owner, amount):
            return {"accountIndex": index, "owner": owner, "mint": USDC_MINT,
                    "uiTokenAmount": {"amount": str(amount), "decimals": 6}}

        result = {"blockTime": 1100, "transaction": [base64.b64encode(bytes(transaction)).decode(), "base64"],
                  "meta": {"err": None, "loadedAddresses": loaded,
                           "preTokenBalances": [balance(source, self.order["payer"], 20000000)],
                           "postTokenBalances": [balance(source, self.order["payer"], 10000000),
                                                 balance(destination, DEFAULT_RECIPIENT, 10000000)]}}
        return result, str(transaction.signatures[0])

    def verify(self, result=None, signature=None, order=None, genesis=GENESIS):
        with patch("billing.rpc_call", side_effect=[genesis, self.result if result is None else result]):
            return verify_payment(order or self.order, signature or self.signature, "https://example.test")

    def rejected(self, result=None, signature=None, order=None, genesis=GENESIS, status=422):
        with self.assertRaises(HTTPException) as error:
            self.verify(result, signature, order, genesis)
        self.assertEqual(error.exception.status_code, status)

    def test_signed_legacy_and_v0_transfers(self):
        self.assertTrue(self.verify())
        result, signature = self.fixture(versioned=True)
        self.assertTrue(self.verify(result, signature))

    def test_pending_and_wrong_network(self):
        with patch("billing.rpc_call", side_effect=[GENESIS, None]):
            self.assertFalse(verify_payment(self.order, self.signature, "https://example.test"))
        self.rejected(genesis="mainnet", status=503)

    def test_v0_lookup_table_and_missing_loaded_addresses(self):
        result, signature = self.fixture(versioned=True, lookup_table=True)
        self.assertEqual(len(result["meta"]["loadedAddresses"]["writable"]), 2)
        self.assertEqual(len(result["meta"]["loadedAddresses"]["readonly"]), 2)
        self.assertTrue(self.verify(result, signature))
        result["meta"].pop("loadedAddresses")
        self.rejected(result, signature)

    def test_wrong_amount_reference_program_and_payer(self):
        for args in ({"amount": 1}, {"reference": Pubkey.new_unique()}, {"program": str(Pubkey.new_unique())}):
            with self.subTest(args=args):
                result, signature = self.fixture(**args)
                self.rejected(result, signature)
        for field in ("payer", "recipient", "mint", "reference"):
            with self.subTest(field=field):
                self.rejected(order={**self.order, field: str(Pubkey.new_unique())})

    def test_failed_late_and_malformed_transactions(self):
        for change in ({"blockTime": 969}, {"blockTime": 1901}, {"transaction": ["invalid", "base64"]}, {"meta": {"err": "failure"}}):
            with self.subTest(change=change):
                result = copy.deepcopy(self.result)
                result.update(change)
                self.rejected(result)
        self.rejected(signature=str(Keypair().sign_message(b"wrong-transaction")))
        result = copy.deepcopy(self.result)
        encoded = bytearray(base64.b64decode(result["transaction"][0]))
        encoded[1] ^= 1  # Corrupt the first signature while leaving the message intact.
        result["transaction"][0] = base64.b64encode(encoded).decode()
        self.rejected(result)
        result = copy.deepcopy(self.result)
        result["blockTime"] = None
        self.rejected(result, status=503)

    def test_balance_changes_must_match_transfer(self):
        for field, value in (("owner", str(Pubkey.new_unique())), ("mint", str(Pubkey.new_unique()))):
            result = copy.deepcopy(self.result)
            result["meta"]["postTokenBalances"][-1][field] = value
            self.rejected(result)
        for field, value in (("amount", "9999999"), ("decimals", 9)):
            result = copy.deepcopy(self.result)
            result["meta"]["postTokenBalances"][-1]["uiTokenAmount"][field] = value
            self.rejected(result)
        result = copy.deepcopy(self.result)
        result["meta"]["postTokenBalances"][0]["uiTokenAmount"]["amount"] = "20000000"
        self.rejected(result)


if __name__ == "__main__":
    unittest.main()
