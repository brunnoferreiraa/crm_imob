import uuid
from typing import Literal

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.models.client import Client
from app.models.user import User


class ClientRepository:
    def __init__(self, database: Session) -> None:
        self.database = database

    def scoped_query(
        self, responsible_id: uuid.UUID | None = None
    ) -> Select[tuple[Client]]:
        query = select(Client).where(Client.deleted_at.is_(None))
        if responsible_id:
            query = query.where(Client.responsible_id == responsible_id)
        return query

    def get(
        self, client_id: uuid.UUID, scope_id: uuid.UUID | None = None
    ) -> Client | None:
        return self.database.scalar(
            self.scoped_query(scope_id).where(Client.id == client_id)
        )

    def list(
        self,
        *,
        scope_id: uuid.UUID | None,
        search: str | None,
        status: str | None,
        client_type: str | None,
        lead_source: str | None,
        responsible_id: uuid.UUID | None,
        order_by: Literal["name", "created_at", "next_contact_at"],
        order: Literal["asc", "desc"],
        offset: int,
        limit: int,
    ) -> tuple[list[Client], int]:
        query = self.scoped_query(scope_id)
        if search:
            term = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Client.name.ilike(term),
                    Client.email.ilike(term),
                    Client.phone.ilike(term),
                    Client.cpf.ilike(term),
                )
            )
        if status:
            query = query.where(Client.status == status)
        if client_type:
            query = query.where(Client.client_type == client_type)
        if lead_source:
            query = query.where(Client.lead_source == lead_source)
        if responsible_id:
            query = query.where(Client.responsible_id == responsible_id)

        total = (
            self.database.scalar(select(func.count()).select_from(query.subquery()))
            or 0
        )
        column = getattr(Client, order_by)
        ordering = column.asc() if order == "asc" else column.desc()
        items = list(
            self.database.scalars(
                query.order_by(ordering).offset(offset).limit(limit)
            ).unique()
        )
        return items, total

    def find_duplicate(
        self,
        *,
        cpf: str | None,
        email: str | None,
        phone: str | None,
        exclude_id: uuid.UUID | None = None,
    ) -> Client | None:
        criteria = []
        if cpf:
            criteria.append(Client.cpf == cpf)
        if email:
            criteria.append(Client.email == email.lower())
        if phone:
            criteria.append(Client.phone == phone)
        if not criteria:
            return None
        query = select(Client).where(Client.deleted_at.is_(None), or_(*criteria))
        if exclude_id:
            query = query.where(Client.id != exclude_id)
        return self.database.scalar(query.limit(1))

    def get_active_user(self, user_id: uuid.UUID) -> User | None:
        return self.database.scalar(
            select(User).where(
                User.id == user_id, User.is_active.is_(True), User.deleted_at.is_(None)
            )
        )
