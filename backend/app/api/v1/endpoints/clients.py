import csv
import io
import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.permissions import Permission
from app.database.session import get_db
from app.dependencies.auth import CurrentUser, require_permission
from app.models.client import Client
from app.models.user import User
from app.schemas.client import (
    ClientCreate,
    ClientPage,
    ClientResponse,
    ClientUpdate,
    TransferClientRequest,
)
from app.schemas.auth import MessageResponse
from app.services.client import (
    ClientConflictError,
    ClientNotFoundError,
    ClientService,
    ResponsibleNotFoundError,
)


router = APIRouter(prefix="/clients", tags=["Clientes e leads"])
DatabaseSession = Annotated[Session, Depends(get_db)]
LeadAssigner = Annotated[User, Depends(require_permission(Permission.LEADS_ASSIGN))]


def service(database: Session, current_user: User) -> ClientService:
    return ClientService(database, current_user)


def raise_client_error(error: ValueError) -> None:
    if isinstance(error, ClientNotFoundError):
        code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, ClientConflictError):
        code = status.HTTP_409_CONFLICT
    else:
        code = status.HTTP_422_UNPROCESSABLE_CONTENT
    raise HTTPException(status_code=code, detail=str(error)) from error


@router.get("", response_model=ClientPage)
def list_clients(
    database: DatabaseSession,
    current_user: CurrentUser,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str | None = None,
    client_status: str | None = Query(default=None, alias="status"),
    client_type: str | None = None,
    lead_source: str | None = None,
    responsible_id: uuid.UUID | None = None,
    order_by: Literal["name", "created_at", "next_contact_at"] = "created_at",
    order: Literal["asc", "desc"] = "desc",
) -> ClientPage:
    return service(database, current_user).list(
        page=page,
        page_size=page_size,
        search=search,
        status=client_status,
        client_type=client_type,
        lead_source=lead_source,
        responsible_id=responsible_id,
        order_by=order_by,
        order=order,
    )


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(
    data: ClientCreate, database: DatabaseSession, current_user: CurrentUser
) -> Client:
    try:
        return service(database, current_user).create(data)
    except (ClientConflictError, ResponsibleNotFoundError) as error:
        raise_client_error(error)


@router.get("/export.csv")
def export_clients(
    database: DatabaseSession, current_user: CurrentUser
) -> StreamingResponse:
    page = service(database, current_user).list(
        page=1,
        page_size=100,
        search=None,
        status=None,
        client_type=None,
        lead_source=None,
        responsible_id=None,
        order_by="name",
        order="asc",
    )
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        ["nome", "email", "telefone", "whatsapp", "cpf", "tipo", "origem", "status"]
    )
    for client in page.items:
        writer.writerow(
            [
                client.name,
                client.email or "",
                client.phone,
                client.whatsapp or "",
                client.cpf or "",
                client.client_type,
                client.lead_source or "",
                client.status,
            ]
        )
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=clientes.csv"},
    )


@router.post("/import.csv")
async def import_clients(
    database: DatabaseSession,
    current_user: CurrentUser,
    file: Annotated[UploadFile, File()],
) -> dict[str, object]:
    if file.content_type not in {"text/csv", "application/vnd.ms-excel"}:
        raise HTTPException(status_code=415, detail="Envie um arquivo CSV")
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Arquivo excede o limite de 5 MB")
    reader = csv.DictReader(io.StringIO(content.decode("utf-8-sig")))
    imported = 0
    errors: list[dict[str, object]] = []
    for line, row in enumerate(reader, start=2):
        try:
            data = ClientCreate(
                name=row.get("nome", ""),
                email=row.get("email") or None,
                phone=row.get("telefone", ""),
                whatsapp=row.get("whatsapp") or None,
                cpf=row.get("cpf") or None,
                client_type=row.get("tipo", "comprador"),
                lead_source=row.get("origem") or None,
                status=row.get("status", "novo"),
            )
            service(database, current_user).create(data)
            imported += 1
        except (ValidationError, ValueError) as error:
            errors.append({"line": line, "error": str(error)})
    return {"imported": imported, "errors": errors}


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(
    client_id: uuid.UUID, database: DatabaseSession, current_user: CurrentUser
) -> Client:
    try:
        return service(database, current_user).get(client_id)
    except ClientNotFoundError as error:
        raise_client_error(error)


@router.patch("/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: uuid.UUID,
    data: ClientUpdate,
    database: DatabaseSession,
    current_user: CurrentUser,
) -> Client:
    try:
        return service(database, current_user).update(client_id, data)
    except (ClientNotFoundError, ClientConflictError) as error:
        raise_client_error(error)


@router.post("/{client_id}/transfer", response_model=ClientResponse)
def transfer_client(
    client_id: uuid.UUID,
    data: TransferClientRequest,
    database: DatabaseSession,
    current_user: CurrentUser,
    _: LeadAssigner,
) -> Client:
    try:
        return service(database, current_user).transfer(client_id, data.responsible_id)
    except (ClientNotFoundError, ResponsibleNotFoundError) as error:
        raise_client_error(error)


@router.delete("/{client_id}", response_model=MessageResponse)
def delete_client(
    client_id: uuid.UUID, database: DatabaseSession, current_user: CurrentUser
) -> MessageResponse:
    try:
        service(database, current_user).delete(client_id)
    except ClientNotFoundError as error:
        raise_client_error(error)
    return MessageResponse(message="Cliente excluído com sucesso")
