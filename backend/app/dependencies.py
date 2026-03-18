from __future__ import annotations

from fastapi import Request

from app.repositories import DonationRepository, NGORepository
from app.services.donation_processor import DonationProcessor
from app.services.operations import NGOOperationsService
from app.services.xaman import XamanService


def get_donation_repository(request: Request) -> DonationRepository:
    return request.app.state.donation_repository


def get_ngo_repository(request: Request) -> NGORepository:
    return request.app.state.ngo_repository


def get_donation_processor(request: Request) -> DonationProcessor:
    return request.app.state.donation_processor


def get_operations_service(request: Request) -> NGOOperationsService:
    return request.app.state.operations_service


def get_xaman_service(request: Request) -> XamanService:
    return request.app.state.xaman_service
