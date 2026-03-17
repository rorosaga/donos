from xrpl.clients import JsonRpcClient
from xrpl.models import TrustSet, Payment, IssuedCurrencyAmount
from xrpl.transaction import submit_and_wait
from xrpl.wallet import Wallet

from .client import get_xrpl_client


def setup_trustline(
    wallet: Wallet,
    issuer_address: str,
    currency_code: str,
    limit: str = "1000000",
    client: JsonRpcClient | None = None,
) -> str:
    """Establish a trustline from wallet to issuer for a given currency.
    Returns the transaction hash."""
    client = client or get_xrpl_client()
    tx = TrustSet(
        account=wallet.address,
        limit_amount=IssuedCurrencyAmount(
            currency=currency_code,
            issuer=issuer_address,
            value=limit,
        ),
    )
    response = submit_and_wait(tx, client, wallet)
    return response.result["hash"]


def issue_tokens(
    issuer_wallet: Wallet,
    destination_address: str,
    currency_code: str,
    amount: str,
    client: JsonRpcClient | None = None,
) -> str:
    """Issue tokens from the issuer to a destination address.
    The destination must already have a trustline set up.
    Returns the transaction hash."""
    client = client or get_xrpl_client()
    tx = Payment(
        account=issuer_wallet.address,
        destination=destination_address,
        amount=IssuedCurrencyAmount(
            currency=currency_code,
            issuer=issuer_wallet.address,
            value=amount,
        ),
    )
    response = submit_and_wait(tx, client, issuer_wallet)
    return response.result["hash"]


def get_token_balance(
    address: str,
    currency_code: str,
    issuer_address: str,
    client: JsonRpcClient | None = None,
) -> float:
    """Get the balance of a specific issued token for an account."""
    from xrpl.models import AccountLines

    client = client or get_xrpl_client()
    req = AccountLines(account=address, peer=issuer_address)
    response = client.request(req)
    for line in response.result.get("lines", []):
        if line["currency"] == currency_code:
            return float(line["balance"])
    return 0.0
