from __future__ import annotations

import json
import os
from functools import lru_cache

from dotenv import load_dotenv
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator, model_validator
from xrpl.core.addresscodec import is_valid_classic_address


load_dotenv()
PLACEHOLDER_RLUSD_ISSUER = "rRLUSDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"


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

    @field_validator(
        "treasury_address",
        "issuer_address",
        "distributor_address",
    )
    @classmethod
    def validate_address(cls, value: str) -> str:
        if not is_valid_classic_address(value):
            raise ValueError("Must be a valid XRPL classic address.")
        return value

    @field_validator("treasury_seed", "issuer_seed", "distributor_seed")
    @classmethod
    def validate_seed_shape(cls, value: str) -> str:
        if not value or not value.startswith("s"):
            raise ValueError("Must be a non-empty XRPL family seed.")
        return value


class Settings(BaseModel):
    model_config = ConfigDict(frozen=True)

    xrpl_network_url: str
    xrpl_poll_interval_seconds: int = Field(default=30, ge=5)
    xrpl_account_tx_limit: int = Field(default=50, ge=1, le=200)
    rlusd_currency_code: str = Field(default="RLUSD", min_length=3, max_length=20)
    rlusd_issuer: str
    ngo_profiles: list[NGOProfileSettings]
    xaman_api_key: str = ""
    xaman_api_secret: str = ""

    @field_validator("rlusd_issuer")
    @classmethod
    def validate_rlusd_issuer(cls, value: str) -> str:
        if not is_valid_classic_address(value):
            raise ValueError("RLUSD_ISSUER must be a valid XRPL classic address.")
        if value == PLACEHOLDER_RLUSD_ISSUER:
            raise ValueError("RLUSD_ISSUER must not use the placeholder issuer value.")
        return value

    @model_validator(mode="after")
    def validate_unique_ngo_ids(self) -> "Settings":
        ngo_ids = [profile.ngo_id for profile in self.ngo_profiles]
        duplicates = {ngo_id for ngo_id in ngo_ids if ngo_ids.count(ngo_id) > 1}
        if duplicates:
            duplicate_list = ", ".join(sorted(duplicates))
            raise ValueError(f"Duplicate NGO ids are not allowed: {duplicate_list}.")
        return self

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
                xaman_api_key=os.getenv("XAMAN_API_KEY", ""),
                xaman_api_secret=os.getenv("XAMAN_API_SECRET", ""),
            )
        except ValidationError as exc:
            raise ValueError(f"Invalid backend settings: {exc}") from exc


@lru_cache
def get_settings() -> Settings:
    return Settings.from_env()
