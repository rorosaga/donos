# donos

Solarpunk donation platform. Transparent giving on XRPL, where donors donate in stablecoins and watch impact grow without touching a wallet.

Built for the **XRPL Commons Hackathon - Challenge 4**.

## Architecture

Donors send stablecoin donations to NGO treasuries and receive **DONO tokens** as on-chain proof-of-donation receipts. A 4-account pipeline per NGO handles donation intake and token distribution, while a backend scanner watches treasury activity and triggers issuance:

1. **Donor** - sends stablecoin donations
2. **Treasury** - receives and stores incoming stablecoin donations
3. **Issuer** - the NGO's own issuing account, which mints that NGO's DONO tokens
4. **Distributor** - receives issued DONO tokens for distribution back to donors

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
