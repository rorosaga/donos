from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import ngos, donations, donors

app = FastAPI(title="Donos API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ngos.router)
app.include_router(donations.router)
app.include_router(donors.router)


@app.get("/")
async def health_check():
    return {"status": "ok"}
