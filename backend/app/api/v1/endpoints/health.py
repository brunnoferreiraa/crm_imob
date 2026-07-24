from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.session import get_db


router = APIRouter(tags=["Sistema"])

DatabaseSession = Annotated[Session, Depends(get_db)]


@router.get("/health")
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "CRM Imobiliária API",
    }


@router.get("/health/database")
def database_health_check(database: DatabaseSession) -> dict[str, str]:
    database.execute(text("SELECT 1"))

    return {
        "status": "ok",
        "database": "connected",
    }
