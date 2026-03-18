from __future__ import annotations

from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Any

from xrpl.asyncio.clients import AsyncJsonRpcClient
from xrpl.asyncio.transaction import submit_and_wait
from xrpl.core.keypairs import derive_classic_address, derive_keypair
from xrpl.models.amounts import IssuedCurrencyAmount
from xrpl.models.requests import AccountInfo, AccountLines, AccountTx, RipplePathFind, ServerInfo
from xrpl.models.transactions import Payment, TrustSet
from xrpl.wallet import Wallet

from app.config import Settings
from app.models import IssuedAsset, TreasuryPayment, XRPLAccountStatus
from app.models.domain import xrpl_currency_code


class XRPLService(ABC):
    @abstractmethod
    async def get_validated_treasury_payments(
        self, treasury_address: str
    ) -> list[TreasuryPayment]:
        raise NotImplementedError

    @abstractmethod
    async def get_network_status(self) -> dict[str, str]:
        raise NotImplementedError

    @abstractmethod
    async def get_account_status(self, *, wallet_address: str) -> XRPLAccountStatus:
        raise NotImplementedError

    @abstractmethod
    def seed_matches_address(self, *, wallet_seed: str, wallet_address: str) -> bool:
        raise NotImplementedError

    @abstractmethod
    async def has_trustline(
        self,
        *,
        wallet_address: str,
        issuer_address: str,
        currency_code: str,
    ) -> bool:
        raise NotImplementedError

    @abstractmethod
    async def prepare_trustline(
        self,
        *,
        wallet_address: str,
        issuer_address: str,
        currency_code: str,
        limit_value: str,
    ) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    async def issue_to_distributor(
        self,
        *,
        issuer_seed: str,
        distributor_address: str,
        issued_asset: IssuedAsset,
        amount: int,
    ) -> str:
        raise NotImplementedError

    @abstractmethod
    async def distribute_to_donor(
        self,
        *,
        distributor_seed: str,
        donor_wallet_address: str,
        issued_asset: IssuedAsset,
        amount: int,
    ) -> str:
        raise NotImplementedError

    @abstractmethod
    async def find_payment_paths(
        self,
        *,
        source_address: str,
        destination_address: str,
        destination_amount: dict,  # IssuedCurrencyAmount as dict
    ) -> list[dict]:
        """Use ripple_path_find to discover cross-currency payment paths."""
        raise NotImplementedError


class XRPLClientError(RuntimeError):
    pass


class XRPLPyService(XRPLService):
    def __init__(self, settings: Settings) -> None:
        self._client = AsyncJsonRpcClient(settings.xrpl_network_url)
        self._account_tx_limit = settings.xrpl_account_tx_limit

    async def get_network_status(self) -> dict[str, str]:
        response = await self._client.request(ServerInfo())
        info = response.result.get("info", {})
        return {
            "server_state": str(info.get("server_state", "unknown")),
            "complete_ledgers": str(info.get("complete_ledgers", "")),
            "validated_ledger_seq": str(info.get("validated_ledger", {}).get("seq", "")),
        }

    async def get_validated_treasury_payments(
        self, treasury_address: str
    ) -> list[TreasuryPayment]:
        response = await self._client.request(
            AccountTx(
                account=treasury_address,
                ledger_index_min=-1,
                ledger_index_max=-1,
                limit=self._account_tx_limit,
                forward=False,
            )
        )
        transactions = response.result.get("transactions", [])
        payments: list[TreasuryPayment] = []
        for entry in transactions:
            # xrpl-py may return tx data in "tx" or "tx_json" depending on version
            tx = entry.get("tx_json", entry.get("tx", {}))
            meta = entry.get("meta", {})
            if tx.get("TransactionType") != "Payment":
                continue
            if tx.get("Destination") != treasury_address:
                continue
            if not entry.get("validated", False):
                continue

            delivered_amount = meta.get("delivered_amount", tx.get("DeliverMax", tx.get("Amount")))

            # Hash may be at entry level or inside tx
            tx_hash = entry.get("hash", tx.get("hash"))
            ledger_index = entry.get("ledger_index", tx.get("ledger_index"))
            if tx_hash is None or ledger_index is None:
                continue

            if isinstance(delivered_amount, str):
                # Native XRP payment (amount in drops)
                xrp_amount = Decimal(delivered_amount) / Decimal("1000000")
                payments.append(
                    TreasuryPayment(
                        payment_reference=tx_hash,
                        tx_hash=tx_hash,
                        ledger_index=int(ledger_index),
                        destination=tx["Destination"],
                        source_address=tx["Account"],
                        amount=xrp_amount,
                        currency_code="XRP",
                        issuer_address="",  # native XRP has no issuer
                        validated=True,
                    )
                )
                continue
            if not isinstance(delivered_amount, dict):
                continue

            payments.append(
                TreasuryPayment(
                    payment_reference=tx_hash,
                    tx_hash=tx_hash,
                    ledger_index=int(ledger_index),
                    destination=tx["Destination"],
                    source_address=tx["Account"],
                    amount=Decimal(delivered_amount["value"]),
                    currency_code=delivered_amount["currency"],
                    issuer_address=delivered_amount["issuer"],
                    validated=True,
                )
            )
        return payments

    async def get_account_status(self, *, wallet_address: str) -> XRPLAccountStatus:
        try:
            response = await self._client.request(
                AccountInfo(account=wallet_address, ledger_index="validated")
            )
        except Exception:
            return XRPLAccountStatus(
                address=wallet_address,
                exists=False,
                balance_drops=None,
                owner_count=None,
                previous_txn_id=None,
                sequence=None,
            )
        account_data = response.result.get("account_data")
        if not account_data:
            return XRPLAccountStatus(
                address=wallet_address,
                exists=False,
                balance_drops=None,
                owner_count=None,
                previous_txn_id=None,
                sequence=None,
            )
        return XRPLAccountStatus(
            address=wallet_address,
            exists=True,
            balance_drops=str(account_data.get("Balance")),
            owner_count=account_data.get("OwnerCount"),
            previous_txn_id=account_data.get("PreviousTxnID"),
            sequence=account_data.get("Sequence"),
        )

    def seed_matches_address(self, *, wallet_seed: str, wallet_address: str) -> bool:
        try:
            public_key, _ = derive_keypair(wallet_seed)
            derived_address = derive_classic_address(public_key)
        except Exception:
            return False
        return derived_address == wallet_address

    async def has_trustline(
        self,
        *,
        wallet_address: str,
        issuer_address: str,
        currency_code: str,
    ) -> bool:
        xrpl_code = xrpl_currency_code(currency_code)
        try:
            response = await self._client.request(
                AccountLines(account=wallet_address, ledger_index="validated")
            )
        except Exception:
            return False
        return any(
            line.get("account") == issuer_address and line.get("currency") == xrpl_code
            for line in response.result.get("lines", [])
        )

    async def prepare_trustline(
        self,
        *,
        wallet_address: str,
        issuer_address: str,
        currency_code: str,
        limit_value: str,
    ) -> dict[str, Any]:
        transaction = TrustSet(
            account=wallet_address,
            limit_amount=IssuedCurrencyAmount(
                currency=xrpl_currency_code(currency_code),
                issuer=issuer_address,
                value=limit_value,
            ),
        )
        return transaction.to_dict()

    async def issue_to_distributor(
        self,
        *,
        issuer_seed: str,
        distributor_address: str,
        issued_asset: IssuedAsset,
        amount: int,
    ) -> str:
        return await self._submit_issued_payment(
            wallet_seed=issuer_seed,
            destination=distributor_address,
            issued_asset=issued_asset,
            amount=amount,
        )

    async def distribute_to_donor(
        self,
        *,
        distributor_seed: str,
        donor_wallet_address: str,
        issued_asset: IssuedAsset,
        amount: int,
    ) -> str:
        return await self._submit_issued_payment(
            wallet_seed=distributor_seed,
            destination=donor_wallet_address,
            issued_asset=issued_asset,
            amount=amount,
        )

    async def find_payment_paths(
        self,
        *,
        source_address: str,
        destination_address: str,
        destination_amount: dict,
    ) -> list[dict]:
        request = RipplePathFind(
            source_account=source_address,
            destination_account=destination_address,
            destination_amount=destination_amount,
        )
        response = await self._client.request(request)
        alternatives = response.result.get("alternatives", [])

        paths: list[dict] = []
        for alt in alternatives:
            source_amount = alt.get("source_amount")
            if isinstance(source_amount, str):
                # Native XRP in drops
                paths.append({
                    "source_currency": "XRP",
                    "source_amount": str(int(source_amount) / 1_000_000),
                    "paths_computed": alt.get("paths_computed", []),
                })
            elif isinstance(source_amount, dict):
                paths.append({
                    "source_currency": source_amount.get("currency", ""),
                    "source_amount": source_amount.get("value", "0"),
                    "source_issuer": source_amount.get("issuer", ""),
                    "paths_computed": alt.get("paths_computed", []),
                })
        return paths

    async def _submit_issued_payment(
        self,
        *,
        wallet_seed: str,
        destination: str,
        issued_asset: IssuedAsset,
        amount: int,
    ) -> str:
        wallet = Wallet.from_seed(wallet_seed)
        transaction = Payment(
            account=wallet.address,
            destination=destination,
            amount=IssuedCurrencyAmount(
                currency=issued_asset.xrpl_currency,
                issuer=issued_asset.issuer_address,
                value=str(amount),
            ),
        )
        response = await submit_and_wait(transaction, self._client, wallet)
        result = response.result
        tx_result = result.get("meta", {}).get("TransactionResult")
        if tx_result != "tesSUCCESS":
            tx_hash = result.get("hash")
            raise XRPLClientError(
                f"XRPL transaction failed with result {tx_result!r} for destination "
                f"{destination!r}; tx_hash={tx_hash!r}."
            )
        tx_hash = result.get("hash")
        if not tx_hash:
            raise XRPLClientError("XRPL response did not include a transaction hash.")
        return tx_hash
