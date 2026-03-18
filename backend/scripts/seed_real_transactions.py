"""
Create REAL testnet transactions for the hackathon demo.

This script:
1. Creates a donor wallet via faucet
2. Sets up RLUSD trustline from donor
3. Issues RLUSD to the donor (simulating purchase)
4. Sets up DONO trustlines from donor to each NGO issuer
5. Sends real RLUSD donations from donor to NGO treasuries
6. Issues real DONO tokens from issuers to distributors to donor
7. Saves all real tx hashes

Usage:
  cd backend
  uv run python scripts/seed_real_transactions.py
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
from xrpl.models.requests import AccountInfo, AccountLines
from xrpl.models.transactions import Payment, TrustSet
from xrpl.wallet import Wallet

from app.models.domain import xrpl_currency_code

NETWORK_URL = os.getenv("XRPL_NETWORK_URL", "https://s.altnet.rippletest.net:51234/")
DONO_HEX = xrpl_currency_code("DONO")
RLUSD_HEX = xrpl_currency_code("RLUSD")


async def submit_tx(client, tx, wallet, label=""):
    """Submit a transaction and return the hash."""
    response = await submit_and_wait(tx, client, wallet)
    result = response.result
    tx_result = result.get("meta", {}).get("TransactionResult")
    tx_hash = result.get("hash", "")
    if tx_result != "tesSUCCESS":
        print(f"  FAILED {label}: {tx_result} (hash: {tx_hash})")
        return None
    print(f"  OK {label}: {tx_hash}")
    return tx_hash


async def get_balance(client, address):
    """Get XRP balance in drops."""
    try:
        resp = await client.request(AccountInfo(account=address, ledger_index="validated"))
        return int(resp.result["account_data"]["Balance"]) / 1_000_000
    except Exception:
        return 0


async def main():
    print("=" * 60)
    print("XRPL Testnet Real Transaction Seeder")
    print(f"Network: {NETWORK_URL}")
    print("=" * 60)

    # Load wallet setup data
    setup_path = os.path.join(os.path.dirname(__file__), "wallet_setup_output.json")
    with open(setup_path) as f:
        setup = json.load(f)

    rlusd_issuer_seed = setup["rlusd_issuer"]["seed"]
    rlusd_issuer_address = setup["rlusd_issuer"]["address"]
    ngo_profiles = setup["ngo_profiles"]

    client = AsyncJsonRpcClient(NETWORK_URL)
    rlusd_issuer_wallet = Wallet.from_seed(rlusd_issuer_seed)

    # 1. Create and fund a donor wallet
    print("\n--- Creating donor wallet ---")
    donor = await async_generate_faucet_wallet(client, debug=False)
    print(f"Donor address: {donor.address}")
    print(f"Donor seed: {donor.seed}")
    balance = await get_balance(client, donor.address)
    print(f"Donor XRP balance: {balance}")
    await asyncio.sleep(2)

    # 2. Donor sets up RLUSD trustline to our RLUSD issuer
    print("\n--- Donor RLUSD trustline ---")
    rlusd_trustline_hash = await submit_tx(client, TrustSet(
        account=donor.address,
        limit_amount=IssuedCurrencyAmount(
            currency=RLUSD_HEX, issuer=rlusd_issuer_address, value="100000",
        ),
    ), donor, "Donor RLUSD trustline")
    await asyncio.sleep(2)

    # 3. Issue RLUSD to the donor (simulate them buying RLUSD)
    print("\n--- Issuing RLUSD to donor ---")
    rlusd_issue_hash = await submit_tx(client, Payment(
        account=rlusd_issuer_wallet.address,
        destination=donor.address,
        amount=IssuedCurrencyAmount(
            currency=RLUSD_HEX, issuer=rlusd_issuer_address, value="500",
        ),
    ), rlusd_issuer_wallet, "Issue 500 RLUSD to donor")
    await asyncio.sleep(2)

    all_tx = {
        "donor": {
            "address": donor.address,
            "seed": donor.seed,
        },
        "rlusd_trustline_hash": rlusd_trustline_hash,
        "rlusd_issue_hash": rlusd_issue_hash,
        "donations": [],
    }

    # For each NGO, do a real donation cycle
    donation_amounts = [50, 30, 25, 15, 10]  # vary amounts

    for i, ngo in enumerate(ngo_profiles[:5]):
        amount = donation_amounts[i] if i < len(donation_amounts) else 5
        ngo_name = ngo["name"]
        ngo_id = ngo["ngo_id"]
        issuer_address = ngo["issuer_address"]
        issuer_seed = ngo["issuer_seed"]
        treasury_address = ngo["treasury_address"]
        distributor_address = ngo["distributor_address"]
        distributor_seed = ngo["distributor_seed"]

        print(f"\n{'='*50}")
        print(f"Donation to {ngo_name}: {amount} RLUSD")
        print(f"{'='*50}")

        # 4. Donor sets up DONO trustline to this NGO's issuer
        print(f"  Setting up DONO trustline to {ngo_name}...")
        dono_trustline_hash = await submit_tx(client, TrustSet(
            account=donor.address,
            limit_amount=IssuedCurrencyAmount(
                currency=DONO_HEX, issuer=issuer_address, value="1000000",
            ),
        ), donor, f"DONO trustline to {ngo_name}")
        await asyncio.sleep(2)

        # 5. Donor sends RLUSD to NGO treasury (the actual donation)
        print(f"  Sending {amount} RLUSD to treasury...")
        donation_hash = await submit_tx(client, Payment(
            account=donor.address,
            destination=treasury_address,
            amount=IssuedCurrencyAmount(
                currency=RLUSD_HEX, issuer=rlusd_issuer_address, value=str(amount),
            ),
        ), donor, f"Donate {amount} RLUSD to {ngo_name}")
        await asyncio.sleep(2)

        # 6. Issuer issues DONO to distributor
        print(f"  Issuing {amount} DONO to distributor...")
        issuer_wallet = Wallet.from_seed(issuer_seed)
        issuance_hash = await submit_tx(client, Payment(
            account=issuer_wallet.address,
            destination=distributor_address,
            amount=IssuedCurrencyAmount(
                currency=DONO_HEX, issuer=issuer_address, value=str(amount),
            ),
        ), issuer_wallet, f"Issue {amount} DONO")
        await asyncio.sleep(2)

        # 7. Distributor sends DONO to donor
        print(f"  Distributing {amount} DONO to donor...")
        distributor_wallet = Wallet.from_seed(distributor_seed)
        distribution_hash = await submit_tx(client, Payment(
            account=distributor_wallet.address,
            destination=donor.address,
            amount=IssuedCurrencyAmount(
                currency=DONO_HEX, issuer=issuer_address, value=str(amount),
            ),
        ), distributor_wallet, f"Distribute {amount} DONO to donor")
        await asyncio.sleep(2)

        donation_record = {
            "ngo_id": ngo_id,
            "ngo_name": ngo_name,
            "amount": amount,
            "donor_address": donor.address,
            "treasury_address": treasury_address,
            "issuer_address": issuer_address,
            "distributor_address": distributor_address,
            "dono_trustline_hash": dono_trustline_hash,
            "donation_hash": donation_hash,
            "issuance_hash": issuance_hash,
            "distribution_hash": distribution_hash,
        }
        all_tx["donations"].append(donation_record)

    # Print summary
    print(f"\n{'='*60}")
    print("ALL TRANSACTIONS COMPLETE")
    print(f"{'='*60}")
    print(f"\nDonor wallet: {donor.address}")
    print(f"Donor seed: {donor.seed}")
    print(f"\nRLUSD trustline: https://testnet.xrpl.org/transactions/{rlusd_trustline_hash}")
    print(f"RLUSD issuance: https://testnet.xrpl.org/transactions/{rlusd_issue_hash}")

    for d in all_tx["donations"]:
        print(f"\n--- {d['ngo_name']} ({d['amount']} RLUSD) ---")
        print(f"  DONO trustline: https://testnet.xrpl.org/transactions/{d['dono_trustline_hash']}")
        print(f"  Donation:       https://testnet.xrpl.org/transactions/{d['donation_hash']}")
        print(f"  DONO issuance:  https://testnet.xrpl.org/transactions/{d['issuance_hash']}")
        print(f"  DONO delivery:  https://testnet.xrpl.org/transactions/{d['distribution_hash']}")

    # Save to file
    out_path = os.path.join(os.path.dirname(__file__), "real_transactions.json")
    with open(out_path, "w") as f:
        json.dump(all_tx, f, indent=2)
    print(f"\nSaved to {out_path}")


if __name__ == "__main__":
    asyncio.run(main())
