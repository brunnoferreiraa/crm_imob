import uuid
from datetime import UTC, datetime
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.permissions import Permission
from app.database.session import get_db
from app.dependencies.auth import CurrentUser
from app.models.activity import Interaction, Task, Visit
from app.models.client import Client
from app.models.deal import Deal
from app.models.property import Property
from app.models.user import User
from app.schemas.activity import (
    InteractionCreate,
    InteractionResponse,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
    VisitCreate,
    VisitResponse,
    VisitUpdate,
)
from app.schemas.auth import MessageResponse

router = APIRouter(tags=["Atividades"])
DB = Annotated[Session, Depends(get_db)]


def all_scope(user: User) -> bool:
    return user.has_permission(Permission.DEALS_VIEW_ALL.value) or user.has_permission(
        Permission.USERS_MANAGE.value
    )


def one(database: Session, model, item_id: uuid.UUID, user: User):
    query = select(model).where(model.id == item_id, model.deleted_at.is_(None))
    if not all_scope(user):
        query = query.where(
            model.broker_id == user.id
            if hasattr(model, "broker_id")
            else model.assignee_id == user.id
        )
    item = database.scalar(query)
    if not item:
        raise HTTPException(404, "Registro não encontrado")
    return item


@router.get(
    "/clients/{client_id}/interactions", response_model=list[InteractionResponse]
)
def interactions(client_id: uuid.UUID, database: DB, current: CurrentUser):
    query = select(Interaction).where(
        Interaction.client_id == client_id, Interaction.deleted_at.is_(None)
    )
    if not all_scope(current):
        query = query.where(Interaction.broker_id == current.id)
    return list(database.scalars(query.order_by(Interaction.occurred_at.desc())))


@router.post("/interactions", response_model=InteractionResponse, status_code=201)
def create_interaction(data: InteractionCreate, database: DB, current: CurrentUser):
    if not database.get(Client, data.client_id):
        raise HTTPException(422, "Cliente inválido")
    item = Interaction(**data.model_dump(), broker_id=current.id)
    database.add(item)
    client = database.get(Client, data.client_id)
    if data.next_contact_at:
        client.next_contact_at = data.next_contact_at
    database.commit()
    database.refresh(item)
    return item


@router.get("/visits", response_model=list[VisitResponse])
def visits(
    database: DB,
    current: CurrentUser,
    start: datetime | None = None,
    end: datetime | None = None,
):
    query = select(Visit).where(Visit.deleted_at.is_(None))
    if not all_scope(current):
        query = query.where(Visit.broker_id == current.id)
    if start:
        query = query.where(Visit.scheduled_at >= start)
    if end:
        query = query.where(Visit.scheduled_at <= end)
    return list(database.scalars(query.order_by(Visit.scheduled_at)).unique())


@router.post("/visits", response_model=VisitResponse, status_code=201)
def create_visit(data: VisitCreate, database: DB, current: CurrentUser):
    if not database.get(Client, data.client_id) or not database.get(
        Property, data.property_id
    ):
        raise HTTPException(422, "Cliente ou imóvel inválido")
    item = Visit(**data.model_dump(), broker_id=current.id)
    database.add(item)
    database.commit()
    database.refresh(item)
    return item


@router.patch("/visits/{item_id}", response_model=VisitResponse)
def update_visit(
    item_id: uuid.UUID, data: VisitUpdate, database: DB, current: CurrentUser
):
    item = one(database, Visit, item_id, current)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    database.commit()
    database.refresh(item)
    return item


@router.get("/tasks", response_model=list[TaskResponse])
def tasks(
    database: DB,
    current: CurrentUser,
    view: str | None = Query(None, pattern="^(today|upcoming|overdue)$"),
):
    now = datetime.now(UTC)
    query = select(Task).where(Task.deleted_at.is_(None))
    if not all_scope(current):
        query = query.where(Task.assignee_id == current.id)
    if view == "today":
        query = query.where(
            Task.due_at >= now.replace(hour=0, minute=0, second=0),
            Task.due_at
            < now.replace(hour=0, minute=0, second=0).replace(day=now.day)
            + __import__("datetime").timedelta(days=1),
        )
    if view == "upcoming":
        query = query.where(Task.due_at > now, Task.status != "concluida")
    if view == "overdue":
        query = query.where(Task.due_at < now, Task.status != "concluida")
    return list(database.scalars(query.order_by(Task.due_at)).unique())


@router.post("/tasks", response_model=TaskResponse, status_code=201)
def create_task(data: TaskCreate, database: DB, current: CurrentUser):
    assignee = (
        data.assignee_id if all_scope(current) and data.assignee_id else current.id
    )
    if data.client_id and not database.get(Client, data.client_id):
        raise HTTPException(422, "Cliente inválido")
    if data.deal_id and not database.get(Deal, data.deal_id):
        raise HTTPException(422, "Negociação inválida")
    item = Task(**data.model_dump(exclude={"assignee_id"}), assignee_id=assignee)
    database.add(item)
    database.commit()
    database.refresh(item)
    return item


@router.patch("/tasks/{item_id}", response_model=TaskResponse)
def update_task(
    item_id: uuid.UUID, data: TaskUpdate, database: DB, current: CurrentUser
):
    item = one(database, Task, item_id, current)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    database.commit()
    database.refresh(item)
    return item


@router.delete("/tasks/{item_id}", response_model=MessageResponse)
def delete_task(item_id: uuid.UUID, database: DB, current: CurrentUser):
    item = one(database, Task, item_id, current)
    item.deleted_at = datetime.now(UTC)
    database.commit()
    return MessageResponse(message="Tarefa excluída")
