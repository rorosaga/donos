from __future__ import annotations

import sys

import pytest

from app import cli


def test_cli_preflight_dispatches(monkeypatch: pytest.MonkeyPatch) -> None:
    called: dict[str, str] = {}

    async def fake_run_preflight(ngo_id: str) -> int:
        called["ngo_id"] = ngo_id
        return 0

    monkeypatch.setattr(cli, "run_preflight", fake_run_preflight)
    monkeypatch.setattr(sys, "argv", ["ops", "preflight", "--ngo-id", "wateraid"])

    with pytest.raises(SystemExit) as exc:
        cli.main()

    assert exc.value.code == 0
    assert called["ngo_id"] == "wateraid"


def test_cli_verification_dispatches(monkeypatch: pytest.MonkeyPatch) -> None:
    called: dict[str, str] = {}

    async def fake_run_verify(ngo_id: str, donor_wallet_address: str, rlusd_amount) -> int:
        called["ngo_id"] = ngo_id
        called["donor_wallet_address"] = donor_wallet_address
        called["rlusd_amount"] = str(rlusd_amount)
        return 0

    monkeypatch.setattr(cli, "run_verify", fake_run_verify)
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "ops",
            "verification-guide",
            "--ngo-id",
            "wateraid",
            "--donor-wallet-address",
            "rDonor",
            "--rlusd-amount",
            "1.5",
        ],
    )

    with pytest.raises(SystemExit) as exc:
        cli.main()

    assert exc.value.code == 0
    assert called["ngo_id"] == "wateraid"
    assert called["donor_wallet_address"] == "rDonor"
    assert called["rlusd_amount"] == "1.5"
