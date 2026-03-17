from contextlib import asynccontextmanager
from decimal import Decimal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.config import get_settings
from app.models import NGOProfile, WalletSecrets
from app.repositories import DonationRepository, NGORepository
from app.routers.donations import router as donations_router
from app.routers.ngos import router as ngos_router
from app.services.donation_processor import DonationProcessor
from app.services.poller import DonationPoller
from app.services.xrpl.client import XRPLPyService


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
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
    donation_poller = DonationPoller(
        processor=donation_processor,
        interval_seconds=settings.xrpl_poll_interval_seconds,
    )

    app.state.settings = settings
    app.state.ngo_repository = ngo_repository
    app.state.donation_repository = donation_repository
    app.state.xrpl_service = xrpl_service
    app.state.donation_processor = donation_processor
    app.state.donation_poller = donation_poller

    await donation_poller.start()
    try:
        yield
    finally:
        await donation_poller.stop()


app = FastAPI(title="Donos API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health_check():
    return {"status": "ok"}


app.include_router(ngos_router)
app.include_router(donations_router)


def run() -> None:
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
