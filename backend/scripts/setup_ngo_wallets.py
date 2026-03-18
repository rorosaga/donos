"""
Create and fund XRPL testnet wallets for all seeded NGOs.

For each NGO:
  1. Create 3 wallets (treasury, issuer, distributor) via testnet faucet
  2. Set up distributor->issuer trustline for DONO
  3. Set up treasury RLUSD trustline
  4. Update Supabase with real addresses and seeds
  5. Print NGO_CHAIN_PROFILES_JSON for .env

Usage:
  cd backend
  uv run python scripts/setup_ngo_wallets.py
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
from xrpl.asyncio.wallet import generate_faucet_wallet as async_generate_faucet_wallet
from xrpl.models.amounts import IssuedCurrencyAmount
from xrpl.models.transactions import TrustSet
from xrpl.wallet import Wallet

NETWORK_URL = os.getenv("XRPL_NETWORK_URL", "https://s.altnet.rippletest.net:51234/")
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://fcaxacsccokwaayuiast.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
# XRPL requires 3-char or 40-hex-char currency codes. "DONO" is 4 chars so we hex-encode it.
DONO_CURRENCY = "444F4E4F00000000000000000000000000000000"
DONO_RATE = 1


async def create_funded_wallet(client: AsyncJsonRpcClient, label: str) -> Wallet:
    print(f"  Funding {label}...")
    wallet = await async_generate_faucet_wallet(client, debug=False)
    print(f"  {label}: {wallet.address}")
    return wallet


async def setup_trustline(
    client: AsyncJsonRpcClient,
    wallet: Wallet,
    issuer_address: str,
    currency: str = DONO_CURRENCY,
) -> str:
    tx = TrustSet(
        account=wallet.address,
        limit_amount=IssuedCurrencyAmount(
            currency=currency,
            issuer=issuer_address,
            value="1000000",
        ),
    )
    response = await submit_and_wait(tx, client, wallet)
    result = response.result
    tx_result = result.get("meta", {}).get("TransactionResult")
    if tx_result != "tesSUCCESS":
        raise RuntimeError(f"TrustSet failed: {tx_result}")
    print(f"  Trustline: {wallet.address} -> {issuer_address} ({currency})")
    return result.get("hash", "")


def get_supabase_client():
    if not SUPABASE_KEY:
        return None
    from supabase import create_client
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def get_ngos() -> list[dict]:
    sb = get_supabase_client()
    if sb:
        result = sb.table("ngos").select("id, name, credibility_score").execute()
        print(f"Loaded {len(result.data)} NGOs from Supabase")
        return result.data
    print("No Supabase key — using hardcoded list")
    return [
        {"id": "1", "name": "Clean Water Initiative"},
        {"id": "2", "name": "EduAfrica Foundation"},
        {"id": "3", "name": "SolarVillages"},
        {"id": "4", "name": "FoodBank Kenya"},
        {"id": "5", "name": "HealthKits Africa"},
    ]


def update_supabase_ngo(ngo_id: str, data: dict):
    sb = get_supabase_client()
    if not sb:
        return
    sb.table("ngos").update(data).eq("id", ngo_id).execute()
    print(f"  Supabase updated")


async def main():
    print("XRPL Testnet NGO Wallet Setup")
    print(f"Network: {NETWORK_URL}\n")

    ngos = get_ngos()
    client = AsyncJsonRpcClient(NETWORK_URL)

    # Create RLUSD issuer
    print("=" * 50)
    print("RLUSD Issuer Account")
    print("=" * 50)
    rlusd_issuer = await create_funded_wallet(client, "RLUSD Issuer")
    await asyncio.sleep(2)

    profiles = []

    for ngo in ngos:
        ngo_id = str(ngo["id"])
        ngo_name = ngo["name"]

        print(f"\n{'=' * 50}")
        print(f"{ngo_name}")
        print("=" * 50)

        treasury = await create_funded_wallet(client, "Treasury")
        await asyncio.sleep(2)
        issuer = await create_funded_wallet(client, "Issuer")
        await asyncio.sleep(2)
        distributor = await create_funded_wallet(client, "Distributor")
        await asyncio.sleep(2)

        # Distributor trustline to issuer (for DONO)
        await setup_trustline(client, distributor, issuer.address, DONO_CURRENCY)
        await asyncio.sleep(1)

        # Treasury trustline to RLUSD issuer (to receive donations)
        rlusd_hex = "524C555344000000000000000000000000000000"
        await setup_trustline(client, treasury, rlusd_issuer.address, rlusd_hex)
        await asyncio.sleep(1)

        profile = {
            "ngo_id": ngo_id,
            "name": ngo_name,
            "treasury_address": treasury.address,
            "treasury_seed": treasury.seed,
            "issuer_address": issuer.address,
            "issuer_seed": issuer.seed,
            "distributor_address": distributor.address,
            "distributor_seed": distributor.seed,
            "dono_rate": str(DONO_RATE),
        }
        profiles.append(profile)

        # Update Supabase
        update_supabase_ngo(ngo_id, {
            "issuer_address": profile["issuer_address"],
            "treasury_address": profile["treasury_address"],
            "distributor_address": profile["distributor_address"],
        })

    # Output
    print(f"\n{'=' * 50}")
    print("DONE — paste into backend/.env")
    print("=" * 50)
    print(f"\nRLUSD_ISSUER={rlusd_issuer.address}")
    print(f"\nNGO_CHAIN_PROFILES_JSON='{json.dumps(profiles)}'")

    # Save to file
    out = os.path.join(os.path.dirname(__file__), "wallet_setup_output.json")
    with open(out, "w") as f:
        json.dump({
            "rlusd_issuer": {"address": rlusd_issuer.address, "seed": rlusd_issuer.seed},
            "ngo_profiles": profiles,
        }, f, indent=2)
    print(f"\nSaved to {out}")


if __name__ == "__main__":
    asyncio.run(main())
