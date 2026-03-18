"""Fund a wallet with RLUSD from our testnet RLUSD issuer.

Usage:
  cd backend
  uv run python scripts/fund_wallet_rlusd.py <wallet_address> [amount]

Example:
  uv run python scripts/fund_wallet_rlusd.py rnKycUBrmrLQ2pYs3Zc8XjWW3hsVNqywzt 100
"""
import asyncio
import json
import os
import sys
from dotenv import load_dotenv
load_dotenv()

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from xrpl.asyncio.clients import AsyncJsonRpcClient
from xrpl.asyncio.transaction import submit_and_wait
from xrpl.models.amounts import IssuedCurrencyAmount
from xrpl.models.transactions import TrustSet, Payment
from xrpl.wallet import Wallet
from app.models.domain import xrpl_currency_code

NETWORK_URL = os.getenv("XRPL_NETWORK_URL", "https://s.altnet.rippletest.net:51234/")
RLUSD_HEX = xrpl_currency_code("RLUSD")


async def main():
    if len(sys.argv) < 2:
        print("Usage: uv run python scripts/fund_wallet_rlusd.py <wallet_address> [amount]")
        sys.exit(1)

    wallet_address = sys.argv[1]
    amount = sys.argv[2] if len(sys.argv) > 2 else "100"

    with open(os.path.join(os.path.dirname(__file__), "wallet_setup_output.json")) as f:
        setup = json.load(f)

    rlusd_issuer = Wallet.from_seed(setup["rlusd_issuer"]["seed"])
    rlusd_issuer_address = setup["rlusd_issuer"]["address"]
    client = AsyncJsonRpcClient(NETWORK_URL)

    print(f"Funding {wallet_address} with {amount} RLUSD")
    print(f"RLUSD issuer: {rlusd_issuer_address}")

    # First check if the wallet has an RLUSD trustline
    from xrpl.models.requests import AccountLines
    resp = await client.request(AccountLines(account=wallet_address, ledger_index="validated"))
    has_trustline = any(
        line.get("account") == rlusd_issuer_address and line.get("currency") == RLUSD_HEX
        for line in resp.result.get("lines", [])
    )

    if not has_trustline:
        print(f"\nWallet does NOT have RLUSD trustline to {rlusd_issuer_address}")
        print(f"You need to set up a trustline first.")
        print(f"\nTo do this in Xaman:")
        print(f"  1. Open Xaman app")
        print(f"  2. Go to Settings > Advanced > Trust Set")
        print(f"  3. Set issuer: {rlusd_issuer_address}")
        print(f"  4. Set currency: RLUSD (or hex: {RLUSD_HEX})")
        print(f"  5. Set limit: 100000")
        print(f"\nOr use the donos app to send an XRP donation instead (no trustline needed)")
        sys.exit(1)

    # Issue RLUSD to the wallet
    resp = await submit_and_wait(
        Payment(
            account=rlusd_issuer.address,
            destination=wallet_address,
            amount=IssuedCurrencyAmount(
                currency=RLUSD_HEX,
                issuer=rlusd_issuer_address,
                value=amount,
            ),
        ),
        client,
        rlusd_issuer,
    )
    result = resp.result
    tx_result = result.get("meta", {}).get("TransactionResult")
    tx_hash = result.get("hash", "")
    print(f"\nResult: {tx_result}")
    print(f"Hash: {tx_hash}")
    print(f"Explorer: https://testnet.xrpl.org/transactions/{tx_hash}")


if __name__ == "__main__":
    asyncio.run(main())
