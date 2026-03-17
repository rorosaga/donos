from __future__ import annotations

from fastapi import Request

from app.repositories import DonationRepository, NGORepository
from app.services.donation_processor import DonationProcessor


def get_donation_repository(request: Request) -> DonationRepository:
    return request.app.state.donation_repository


def get_ngo_repository(request: Request) -> NGORepository:
    return request.app.state.ngo_repository


def get_donation_processor(request: Request) -> DonationProcessor:
    return request.app.state.donation_processor
