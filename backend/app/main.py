from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.bootstrap import build_runtime_container
from app.config import get_settings
from app.routers.donations import router as donations_router
from app.routers.ngos import router as ngos_router
from app.routers.wallet import router as wallet_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    runtime = build_runtime_container(settings)

    app.state.settings = runtime.settings
    app.state.ngo_repository = runtime.ngo_repository
    app.state.donation_repository = runtime.donation_repository
    app.state.xrpl_service = runtime.xrpl_service
    app.state.donation_processor = runtime.donation_processor
    app.state.operations_service = runtime.operations_service
    app.state.donation_poller = runtime.donation_poller
    app.state.xaman_service = runtime.xaman_service

    await runtime.donation_poller.start()
    try:
        yield
    finally:
        await runtime.donation_poller.stop()


app = FastAPI(title="Donos API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ngos_router)
app.include_router(donations_router)
app.include_router(wallet_router)


@app.get("/")
async def health_check():
    return {"status": "ok"}


def run() -> None:
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)


if __name__ == "__main__":
    run()
