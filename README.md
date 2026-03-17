# donos

Solarpunk donation platform. Transparent giving on XRPL, where donors watch impact grow without touching a wallet.

Built for the **XRPL Commons Hackathon — Challenge 4**.

## Architecture

Donors send XRP to NGO treasuries and receive **DONO tokens** as on-chain proof-of-donation receipts. A 3-account pipeline per NGO handles issuance:

1. **Issuer** — issues DONO tokens
2. **Treasury** — receives XRP donations
3. **Backend scanner** — watches treasury and triggers token issuance

## Project Structure

```
donos/
├── frontend/   # React + Vite + TypeScript + Tailwind
└── backend/    # Python FastAPI + xrpl-py
```

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev        # → http://localhost:5173
```

### Backend

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000   # → http://localhost:8000
```

Copy `.env.example` to `.env` before running:

```bash
cp backend/.env.example backend/.env
```

## Tech Stack

| Layer    | Stack                                    |
|----------|------------------------------------------|
| Frontend | React, Vite, TypeScript, Tailwind CSS    |
| Backend  | FastAPI, Pydantic, uvicorn               |
| Chain    | XRPL (xrpl-py), Testnet                 |
