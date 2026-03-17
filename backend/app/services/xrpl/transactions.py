from xrpl.clients import JsonRpcClient
from xrpl.models import Tx

from .client import get_xrpl_client


def verify_payment(
    tx_hash: str,
    expected_destination: str | None = None,
    client: JsonRpcClient | None = None,
) -> dict | None:
    """Verify a transaction exists on-chain and is a successful Payment.

    Returns a dict with payment details if valid, None otherwise.
    """
    client = client or get_xrpl_client()
    try:
        response = client.request(Tx(transaction=tx_hash))
    except Exception:
        return None

    result = response.result
    if result.get("TransactionType") != "Payment":
        return None
    if result.get("meta", {}).get("TransactionResult") != "tesSUCCESS":
        return None
    if expected_destination and result.get("Destination") != expected_destination:
        return None

    # Extract amount — could be XRP (string in drops) or issued currency (dict)
    delivered = result.get("meta", {}).get("delivered_amount", result.get("Amount"))
    if isinstance(delivered, str):
        amount = int(delivered) / 1_000_000
        currency = "XRP"
    elif isinstance(delivered, dict):
        amount = float(delivered["value"])
        currency = delivered["currency"]
    else:
        return None

    return {
        "hash": result["hash"],
        "source": result["Account"],
        "destination": result["Destination"],
        "amount": amount,
        "currency": currency,
        "ledger_index": result.get("ledger_index"),
    }
