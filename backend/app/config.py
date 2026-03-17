from __future__ import annotations

import json
import os
from functools import lru_cache

from dotenv import load_dotenv
from pydantic import BaseModel, ConfigDict, Field, ValidationError


load_dotenv()


class NGOProfileSettings(BaseModel):
    model_config = ConfigDict(frozen=True)

    ngo_id: str
    name: str
    treasury_address: str
    treasury_seed: str
    issuer_address: str
    issuer_seed: str
    distributor_address: str
    distributor_seed: str
    dono_rate: float = Field(gt=0)


class Settings(BaseModel):
    model_config = ConfigDict(frozen=True)

    xrpl_network_url: str
    xrpl_poll_interval_seconds: int = Field(default=30, ge=5)
    xrpl_account_tx_limit: int = Field(default=50, ge=1, le=200)
    rlusd_currency_code: str = Field(default="RLUSD", min_length=3, max_length=20)
    rlusd_issuer: str
    ngo_profiles: list[NGOProfileSettings]

    @classmethod
    def from_env(cls) -> "Settings":
        raw_profiles = os.getenv("NGO_CHAIN_PROFILES_JSON", "[]")
        try:
            ngo_profiles = json.loads(raw_profiles)
        except json.JSONDecodeError as exc:
            raise ValueError("NGO_CHAIN_PROFILES_JSON must be valid JSON.") from exc

        try:
            return cls(
                xrpl_network_url=os.getenv(
                    "XRPL_NETWORK_URL",
                    "https://s.altnet.rippletest.net:51234/",
                ),
                xrpl_poll_interval_seconds=int(
                    os.getenv("XRPL_POLL_INTERVAL_SECONDS", "30")
                ),
                xrpl_account_tx_limit=int(os.getenv("XRPL_ACCOUNT_TX_LIMIT", "50")),
                rlusd_currency_code=os.getenv("RLUSD_CURRENCY_CODE", "RLUSD"),
                rlusd_issuer=os.getenv("RLUSD_ISSUER", ""),
                ngo_profiles=ngo_profiles,
            )
        except ValidationError as exc:
            raise ValueError(f"Invalid backend settings: {exc}") from exc


@lru_cache
def get_settings() -> Settings:
    return Settings.from_env()
