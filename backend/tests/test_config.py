from __future__ import annotations

import pytest

from app.config import PLACEHOLDER_RLUSD_ISSUER, NGOProfileSettings, Settings


def build_profile(**overrides: str) -> dict[str, str]:
    profile = {
        "ngo_id": "wateraid",
        "name": "WaterAid",
        "treasury_address": "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
        "treasury_seed": "sEdTM1uX8pu2do5XvTnutH6HsouMaM2",
        "issuer_address": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
        "issuer_seed": "sEd7K7U4xXyX2rGqR5x6bA1y7c8d9e0",
        "distributor_address": "rLEsXccBGNR3UPuPu2hUXPjziKC3qKSBun",
        "distributor_seed": "sEd7K7U4xXyX2rGqR5x6bA1y7c8d9e1",
        "dono_rate": 10,
    }
    profile.update(overrides)
    return profile


def test_settings_reject_placeholder_rlusd_issuer() -> None:
    with pytest.raises(ValueError):
        Settings(
            xrpl_network_url="https://example.test",
            xrpl_poll_interval_seconds=30,
            xrpl_account_tx_limit=20,
            rlusd_currency_code="RLUSD",
            rlusd_issuer=PLACEHOLDER_RLUSD_ISSUER,
            ngo_profiles=[],
        )


def test_settings_reject_duplicate_ngo_ids() -> None:
    with pytest.raises(ValueError):
        Settings(
            xrpl_network_url="https://example.test",
            xrpl_poll_interval_seconds=30,
            xrpl_account_tx_limit=20,
            rlusd_currency_code="RLUSD",
            rlusd_issuer="rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
            ngo_profiles=[build_profile(), build_profile()],
        )


def test_profile_rejects_invalid_address() -> None:
    with pytest.raises(ValueError):
        NGOProfileSettings(**build_profile(treasury_address="not-an-address"))
