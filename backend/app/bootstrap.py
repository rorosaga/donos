from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from app.config import Settings
from app.models import NGOProfile, WalletSecrets
from app.repositories import DonationRepository, NGORepository
from app.services.donation_processor import DonationProcessor
from app.services.operations import NGOOperationsService
from app.services.poller import DonationPoller
from app.services.xrpl.client import XRPLPyService


@dataclass
class RuntimeContainer:
    settings: Settings
    ngo_repository: NGORepository
    donation_repository: DonationRepository
    xrpl_service: XRPLPyService
    donation_processor: DonationProcessor
    operations_service: NGOOperationsService
    donation_poller: DonationPoller


def build_runtime_container(settings: Settings) -> RuntimeContainer:
    ngo_profiles = [
        NGOProfile(
            ngo_id=profile.ngo_id,
            name=profile.name,
            treasury_address=profile.treasury_address,
            issuer_address=profile.issuer_address,
            distributor_address=profile.distributor_address,
            dono_rate=Decimal(str(profile.dono_rate)),
        )
        for profile in settings.ngo_profiles
    ]
    wallet_secrets = {
        profile.ngo_id: WalletSecrets(
            treasury_seed=profile.treasury_seed,
            issuer_seed=profile.issuer_seed,
            distributor_seed=profile.distributor_seed,
        )
        for profile in settings.ngo_profiles
    }
    ngo_repository = NGORepository(ngo_profiles, wallet_secrets)
    donation_repository = DonationRepository()
    xrpl_service = XRPLPyService(settings)
    donation_processor = DonationProcessor(
        settings=settings,
        donation_repository=donation_repository,
        ngo_repository=ngo_repository,
        xrpl_service=xrpl_service,
    )
    operations_service = NGOOperationsService(
        settings=settings,
        ngo_repository=ngo_repository,
        xrpl_service=xrpl_service,
    )
    donation_poller = DonationPoller(
        processor=donation_processor,
        interval_seconds=settings.xrpl_poll_interval_seconds,
    )
    return RuntimeContainer(
        settings=settings,
        ngo_repository=ngo_repository,
        donation_repository=donation_repository,
        xrpl_service=xrpl_service,
        donation_processor=donation_processor,
        operations_service=operations_service,
        donation_poller=donation_poller,
    )
