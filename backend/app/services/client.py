import uuid
from datetime import UTC, datetime
from math import ceil
from typing import Literal

from sqlalchemy.orm import Session

from app.core.permissions import Permission
from app.models.client import Client, ClientInterest
from app.models.user import User
from app.repositories.client import ClientRepository
from app.schemas.client import ClientCreate, ClientPage, ClientUpdate


class ClientNotFoundError(ValueError):
    pass


class ClientConflictError(ValueError):
    pass


class ResponsibleNotFoundError(ValueError):
    pass


class ClientService:
    def __init__(self, database: Session, current_user: User) -> None:
        self.database = database
        self.current_user = current_user
        self.repository = ClientRepository(database)

    @property
    def scope_id(self) -> uuid.UUID | None:
        if self.current_user.has_permission(Permission.LEADS_VIEW_ALL.value):
            return None
        return self.current_user.id

    def list(
        self,
        *,
        page: int,
        page_size: int,
        search: str | None,
        status: str | None,
        client_type: str | None,
        lead_source: str | None,
        responsible_id: uuid.UUID | None,
        order_by: Literal["name", "created_at", "next_contact_at"],
        order: Literal["asc", "desc"],
    ) -> ClientPage:
        items, total = self.repository.list(
            scope_id=self.scope_id,
            search=search,
            status=status,
            client_type=client_type,
            lead_source=lead_source,
            responsible_id=responsible_id,
            order_by=order_by,
            order=order,
            offset=(page - 1) * page_size,
            limit=page_size,
        )
        return ClientPage(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            pages=ceil(total / page_size) if total else 0,
        )

    def get(self, client_id: uuid.UUID) -> Client:
        client = self.repository.get(client_id, self.scope_id)
        if client is None:
            raise ClientNotFoundError("Cliente não encontrado")
        return client

    def create(self, data: ClientCreate) -> Client:
        duplicate = self.repository.find_duplicate(
            cpf=data.cpf, email=str(data.email) if data.email else None, phone=data.phone
        )
        if duplicate:
            raise ClientConflictError(f"Possível duplicidade com o cliente {duplicate.name}")
        responsible_id = data.responsible_id or self.current_user.id
        if responsible_id != self.current_user.id and not self.current_user.has_permission(
            Permission.LEADS_ASSIGN.value
        ) and not self.current_user.has_permission(Permission.USERS_MANAGE.value):
            responsible_id = self.current_user.id
        if self.repository.get_active_user(responsible_id) is None:
            raise ResponsibleNotFoundError("Corretor responsável não encontrado")
        values = data.model_dump(exclude={"interest", "responsible_id"})
        values["email"] = str(data.email) if data.email else None
        client = Client(**values, responsible_id=responsible_id)
        client.interest = ClientInterest(**data.interest.model_dump())
        self.database.add(client)
        self.database.commit()
        self.database.refresh(client)
        return client

    def update(self, client_id: uuid.UUID, data: ClientUpdate) -> Client:
        client = self.get(client_id)
        changes = data.model_dump(exclude_unset=True, exclude={"interest"})
        if "email" in changes and changes["email"] is not None:
            changes["email"] = str(changes["email"]).lower()
        duplicate = self.repository.find_duplicate(
            cpf=client.cpf,
            email=changes.get("email", client.email),
            phone=changes.get("phone", client.phone),
            exclude_id=client.id,
        )
        if duplicate:
            raise ClientConflictError(f"Possível duplicidade com o cliente {duplicate.name}")
        for field, value in changes.items():
            setattr(client, field, value)
        if data.interest is not None:
            for field, value in data.interest.model_dump().items():
                setattr(client.interest, field, value)
        self.database.commit()
        self.database.refresh(client)
        return client

    def transfer(self, client_id: uuid.UUID, responsible_id: uuid.UUID) -> Client:
        client = self.get(client_id)
        if self.repository.get_active_user(responsible_id) is None:
            raise ResponsibleNotFoundError("Corretor responsável não encontrado")
        client.responsible_id = responsible_id
        self.database.commit()
        self.database.refresh(client)
        return client

    def delete(self, client_id: uuid.UUID) -> None:
        client = self.get(client_id)
        client.deleted_at = datetime.now(UTC)
        self.database.commit()
