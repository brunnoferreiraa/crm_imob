import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.dependencies.auth import CurrentUser
from app.schemas.auth import MessageResponse
from app.schemas.deal import DealCreate, DealMove, DealResponse, DealUpdate
from app.services.deal import DealNotFoundError, DealService

router = APIRouter(prefix="/deals", tags=["Negociações"])
DB = Annotated[Session, Depends(get_db)]


def fail(error: ValueError):
    raise HTTPException(
        404 if isinstance(error, DealNotFoundError) else 422, str(error)
    ) from error


@router.get("", response_model=list[DealResponse])
def list_deals(database: DB, current: CurrentUser):
    return DealService(database, current).list()


@router.post("", response_model=DealResponse, status_code=201)
def create_deal(data: DealCreate, database: DB, current: CurrentUser):
    try:
        return DealService(database, current).create(data)
    except ValueError as error:
        fail(error)


@router.get("/{deal_id}", response_model=DealResponse)
def get_deal(deal_id: uuid.UUID, database: DB, current: CurrentUser):
    try:
        return DealService(database, current).get(deal_id)
    except ValueError as error:
        fail(error)


@router.patch("/{deal_id}", response_model=DealResponse)
def update_deal(
    deal_id: uuid.UUID, data: DealUpdate, database: DB, current: CurrentUser
):
    try:
        return DealService(database, current).update(deal_id, data)
    except ValueError as error:
        fail(error)


@router.post("/{deal_id}/move", response_model=DealResponse)
def move_deal(deal_id: uuid.UUID, data: DealMove, database: DB, current: CurrentUser):
    try:
        return DealService(database, current).move(deal_id, data)
    except ValueError as error:
        fail(error)


@router.delete("/{deal_id}", response_model=MessageResponse)
def delete_deal(deal_id: uuid.UUID, database: DB, current: CurrentUser):
    try:
        DealService(database, current).delete(deal_id)
        return MessageResponse(message="Negociação excluída")
    except ValueError as error:
        fail(error)
