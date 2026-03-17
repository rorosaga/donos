# donos

Solarpunk donation platform. Transparent giving on XRPL, where donors donate in stablecoins and watch impact grow without touching a wallet.

Built for the **XRPL Commons Hackathon - Challenge 4**.

## Architecture

Donors send `RLUSD` donations to NGO treasuries and receive NGO-issued `DONO` tokens as on-chain proof-of-donation receipts. Each NGO owns its own treasury, issuer, and distributor accounts, while a backend scanner watches treasury activity and triggers issuance after validated payments.

1. **Donor** - sends stablecoin donations
2. **Treasury** - the NGO-owned account that receives and stores incoming `RLUSD` donations
3. **Issuer** - the NGO-owned issuing account that mints that NGO's `DONO` tokens
4. **Distributor** - the NGO-owned account that receives issued `DONO` and distributes it to donors

The canonical v1 chain architecture is documented in `docs/architecture/donation-infrastructure.md`.

## Project Structure

```text
donos/
|- frontend/   # React + Vite + TypeScript + Tailwind
`- backend/    # Python FastAPI + xrpl-py
```

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev        # -> http://localhost:5173
```

### Backend

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000   # -> http://localhost:8000
```

Copy `.env.example` to `.env` before running:

```bash
cp backend/.env.example backend/.env
```

## Tech Stack

| Layer    | Stack                                 |
|----------|---------------------------------------|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend  | FastAPI, Pydantic, uvicorn            |
| Chain    | XRPL (xrpl-py), Testnet               |
