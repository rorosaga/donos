from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.dependencies import get_xaman_service
from app.services.xaman import XamanService

router = APIRouter(prefix="/wallet", tags=["wallet"])


class SignPayloadRequest(BaseModel):
    txjson: dict


class PayloadResponse(BaseModel):
    uuid: str
    qr_url: str | None
    deeplink: str | None
    websocket_url: str | None


class PayloadResultResponse(BaseModel):
    signed: bool
    account: str | None
    txid: str | None
    resolved: bool
    cancelled: bool


@router.post("/connect", response_model=PayloadResponse)
async def create_connect_payload(
    xaman: XamanService = Depends(get_xaman_service),
):
    """Create a Xaman SignIn payload. Frontend shows QR/deeplink, then polls for result."""
    if not xaman.is_configured:
        raise HTTPException(status_code=503, detail="Xaman integration not configured")
    result = await xaman.create_signin_payload()
    return PayloadResponse(**result)


@router.post("/sign", response_model=PayloadResponse)
async def create_sign_payload(
    payload: SignPayloadRequest,
    xaman: XamanService = Depends(get_xaman_service),
):
    """Create a Xaman payload for signing a transaction."""
    if not xaman.is_configured:
        raise HTTPException(status_code=503, detail="Xaman integration not configured")
    try:
        result = await xaman.create_sign_payload(payload.txjson)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Xaman API error: {exc}") from exc
    return PayloadResponse(**result)


@router.get("/payload/{uuid}", response_model=PayloadResultResponse)
async def get_payload_result(
    uuid: str,
    xaman: XamanService = Depends(get_xaman_service),
):
    """Poll for the result of a Xaman payload."""
    if not xaman.is_configured:
        raise HTTPException(status_code=503, detail="Xaman integration not configured")
    result = await xaman.get_payload_result(uuid)
    return PayloadResultResponse(**result)
