from __future__ import annotations

from decimal import Decimal

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.models import DonationProcessingState, DonationRecord, NGOProfile, WalletSecrets
from app.repositories import DonationRepository, NGORepository
from app.routers.donations import router as donations_router
from app.routers.ngos import router as ngos_router
from app.services.donation_processor import DonationProcessor

from tests.test_donation_processor import FakeXRPLService, build_settings


def build_test_client() -> tuple[TestClient, DonationRepository]:
    app = FastAPI()
    ngo_repository = NGORepository(
        [
            NGOProfile(
                ngo_id="wateraid",
                name="WaterAid",
                treasury_address="rTreasury",
                issuer_address="rIssuer",
                distributor_address="rDistributor",
                dono_rate=Decimal("10"),
            )
        ],
        {
            "wateraid": WalletSecrets(
                treasury_seed="sTreasury",
                issuer_seed="sIssuer",
                distributor_seed="sDistributor",
            )
        },
    )
    donation_repository = DonationRepository()
    processor = DonationProcessor(
        settings=build_settings(),
        donation_repository=donation_repository,
        ngo_repository=ngo_repository,
        xrpl_service=FakeXRPLService(),
    )
    app.state.ngo_repository = ngo_repository
    app.state.donation_repository = donation_repository
    app.state.donation_processor = processor
    app.include_router(ngos_router)
    app.include_router(donations_router)
    return TestClient(app), donation_repository


def test_list_ngos() -> None:
    client, _ = build_test_client()

    response = client.get("/ngos")

    assert response.status_code == 200
    assert response.json()[0]["ngo_id"] == "wateraid"


def test_list_donations() -> None:
    client, donation_repository = build_test_client()
    donation_repository.upsert(
        DonationRecord(
            donation_id="donation-1",
            payment_reference="payment-1",
            ngo_id="wateraid",
            donor_wallet_address="rDonor",
            treasury_address="rTreasury",
            rlusd_amount=Decimal("5"),
            dono_rate=Decimal("10"),
            dono_amount=50,
            state=DonationProcessingState.PENDING_TRUSTLINE,
        )
    )

    response = client.get("/donations")

    assert response.status_code == 200
    assert response.json()[0]["donation_id"] == "donation-1"


def test_prepare_trustline() -> None:
    client, _ = build_test_client()

    response = client.post(
        "/ngos/wateraid/trustline/prepare",
        json={"wallet_address": "rDonor"},
    )

    assert response.status_code == 200
    assert response.json()["currency_code"] == "DONO"
