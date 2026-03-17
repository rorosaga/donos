from xrpl.wallet import Wallet, generate_faucet_wallet
from xrpl.models import AccountInfo
from xrpl.clients import JsonRpcClient

from .client import get_xrpl_client


def create_funded_account(client: JsonRpcClient | None = None) -> Wallet:
    """Create and fund a new XRPL testnet account via faucet."""
    client = client or get_xrpl_client()
    wallet = generate_faucet_wallet(client, debug=False)
    return wallet


def get_balance(address: str, client: JsonRpcClient | None = None) -> float:
    """Get XRP balance of an account in XRP (not drops)."""
    client = client or get_xrpl_client()
    req = AccountInfo(account=address, ledger_index="validated")
    response = client.request(req)
    balance_drops = int(response.result["account_data"]["Balance"])
    return balance_drops / 1_000_000
