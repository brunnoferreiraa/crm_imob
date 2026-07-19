import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.permissions import Permission
from app.database.session import get_db
from app.dependencies.auth import require_permission
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.user import (
    RoleNotFoundError,
    UserConflictError,
    UserNotFoundError,
    UserService,
)


router = APIRouter(prefix="/users", tags=["Usuários"])
DatabaseSession = Annotated[Session, Depends(get_db)]
AdminUser = Annotated[User, Depends(require_permission(Permission.USERS_MANAGE))]


def handle_user_error(error: ValueError) -> None:
    code = status.HTTP_404_NOT_FOUND if isinstance(error, UserNotFoundError) else status.HTTP_409_CONFLICT
    raise HTTPException(status_code=code, detail=str(error)) from error


@router.get("", response_model=list[UserResponse])
def list_users(
    database: DatabaseSession,
    _: AdminUser,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
) -> list[User]:
    return UserService(database).list(offset, limit)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(data: UserCreate, database: DatabaseSession, _: AdminUser) -> User:
    try:
        return UserService(database).create(data)
    except (UserConflictError, RoleNotFoundError) as error:
        handle_user_error(error)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: uuid.UUID,
    data: UserUpdate,
    database: DatabaseSession,
    _: AdminUser,
) -> User:
    try:
        return UserService(database).update(user_id, data)
    except (UserNotFoundError, RoleNotFoundError) as error:
        handle_user_error(error)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: uuid.UUID, database: DatabaseSession, current_user: AdminUser
) -> Response:
    try:
        UserService(database).delete(user_id, current_user.id)
    except (UserNotFoundError, UserConflictError) as error:
        handle_user_error(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
