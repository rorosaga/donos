from __future__ import annotations

import argparse
import asyncio
import json
from decimal import Decimal

from app.bootstrap import build_runtime_container
from app.config import get_settings


async def run_preflight(ngo_id: str) -> int:
    runtime = build_runtime_container(get_settings())
    summary = await runtime.operations_service.summarize_preflight(ngo_id)
    print(json.dumps(summary, indent=2, sort_keys=True))
    diagnostics = summary["ngo_diagnostics"]
    seed_checks = (
        diagnostics["treasury_seed_matches_address"]
        and diagnostics["issuer_seed_matches_address"]
        and diagnostics["distributor_seed_matches_address"]
    )
    account_checks = (
        diagnostics["treasury"]["exists"]
        and diagnostics["issuer"]["exists"]
        and diagnostics["distributor"]["exists"]
    )
    return 0 if seed_checks and account_checks else 1


async def run_verify(ngo_id: str, donor_wallet_address: str, rlusd_amount: Decimal) -> int:
    runtime = build_runtime_container(get_settings())
    guide = await runtime.operations_service.build_verification_guide(
        ngo_id=ngo_id,
        donor_wallet_address=donor_wallet_address,
        rlusd_amount=rlusd_amount,
    )
    print(json.dumps(guide, indent=2, sort_keys=True))
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Donos operator tooling for XRPL testnet.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    preflight_parser = subparsers.add_parser("preflight", help="Validate NGO testnet readiness.")
    preflight_parser.add_argument("--ngo-id", required=True)

    verify_parser = subparsers.add_parser(
        "verification-guide",
        help="Print the manual happy-path verification guide for a donor wallet.",
    )
    verify_parser.add_argument("--ngo-id", required=True)
    verify_parser.add_argument("--donor-wallet-address", required=True)
    verify_parser.add_argument("--rlusd-amount", required=True)

    args = parser.parse_args()

    if args.command == "preflight":
        raise SystemExit(asyncio.run(run_preflight(args.ngo_id)))
    if args.command == "verification-guide":
        raise SystemExit(
            asyncio.run(
                run_verify(
                    args.ngo_id,
                    args.donor_wallet_address,
                    Decimal(args.rlusd_amount),
                )
            )
        )

    raise SystemExit(2)
