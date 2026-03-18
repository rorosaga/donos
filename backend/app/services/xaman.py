"""Proxy service for Xaman/XUMM wallet operations."""
import httpx
from app.config import Settings


class XamanService:
    def __init__(self, settings: Settings):
        self._api_key = settings.xaman_api_key
        self._api_secret = settings.xaman_api_secret
        self._base_url = "https://xumm.app/api/v1/platform"

    @property
    def is_configured(self) -> bool:
        return bool(self._api_key and self._api_secret)

    def _headers(self) -> dict:
        return {
            "Content-Type": "application/json",
            "X-API-Key": self._api_key,
            "X-API-Secret": self._api_secret,
        }

    async def create_signin_payload(self) -> dict:
        """Create a SignIn payload for wallet connection."""
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self._base_url}/payload",
                headers=self._headers(),
                json={"txjson": {"TransactionType": "SignIn"}},
            )
            resp.raise_for_status()
            data = resp.json()
            return {
                "uuid": data.get("uuid"),
                "qr_url": data.get("refs", {}).get("qr_png"),
                "deeplink": data.get("next", {}).get("always"),
                "websocket_url": data.get("refs", {}).get("websocket_status"),
            }

    @staticmethod
    def _to_xrpl_json(txjson: dict) -> dict:
        """Convert xrpl-py snake_case dict to XRPL PascalCase JSON for XUMM.

        xrpl-py's to_dict() returns snake_case keys (transaction_type, limit_amount),
        but XUMM expects the standard XRPL JSON format (TransactionType, LimitAmount).
        """
        key_map = {
            "transaction_type": "TransactionType",
            "account": "Account",
            "destination": "Destination",
            "amount": "Amount",
            "limit_amount": "LimitAmount",
            "signing_pub_key": "SigningPubKey",
            "fee": "Fee",
            "flags": "Flags",
            "sequence": "Sequence",
            "last_ledger_sequence": "LastLedgerSequence",
            "source_tag": "SourceTag",
            "destination_tag": "DestinationTag",
            "memos": "Memos",
            "send_max": "SendMax",
            "deliver_min": "DeliverMin",
            "paths": "Paths",
        }
        strip_keys = {"signing_pub_key", "SigningPubKey", "TxnSignature", "hash"}
        result = {}
        for k, v in txjson.items():
            if k in strip_keys:
                continue
            mapped_key = key_map.get(k, k)
            if isinstance(v, dict):
                # Recursively convert nested dicts (like LimitAmount)
                nested_map = {
                    "currency": "currency",
                    "issuer": "issuer",
                    "value": "value",
                }
                result[mapped_key] = {nested_map.get(nk, nk): nv for nk, nv in v.items()}
            else:
                result[mapped_key] = v
        return result

    async def create_sign_payload(self, txjson: dict) -> dict:
        """Create a payload for signing a transaction."""
        # Convert xrpl-py snake_case to XRPL PascalCase if needed
        if any(k.islower() and "_" in k for k in txjson):
            clean_tx = self._to_xrpl_json(txjson)
        else:
            # Already in PascalCase (from frontend), just strip signing fields
            strip_keys = {"SigningPubKey", "TxnSignature", "hash"}
            clean_tx = {k: v for k, v in txjson.items() if k not in strip_keys}

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self._base_url}/payload",
                headers=self._headers(),
                json={"txjson": clean_tx},
            )
            if resp.status_code == 400:
                # Log the error detail for debugging
                error_detail = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else resp.text
                raise ValueError(f"XUMM rejected the payload: {error_detail}")
            resp.raise_for_status()
            data = resp.json()
            return {
                "uuid": data.get("uuid"),
                "qr_url": data.get("refs", {}).get("qr_png"),
                "deeplink": data.get("next", {}).get("always"),
                "websocket_url": data.get("refs", {}).get("websocket_status"),
            }

    async def get_payload_result(self, uuid: str) -> dict:
        """Get the result of a payload (after user signs/rejects)."""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self._base_url}/payload/{uuid}",
                headers=self._headers(),
            )
            resp.raise_for_status()
            data = resp.json()
            response_data = data.get("response", {})
            return {
                "signed": response_data.get("dispatched_result") == "tesSUCCESS" or bool(response_data.get("account")),
                "account": response_data.get("account"),
                "txid": response_data.get("txid"),
                "resolved": data.get("meta", {}).get("resolved", False),
                "cancelled": data.get("meta", {}).get("cancelled", False),
            }
