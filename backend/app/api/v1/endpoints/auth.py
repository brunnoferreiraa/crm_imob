from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rate_limit import limiter
from app.database.session import get_db
from app.dependencies.auth import CurrentUser
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    ResetPasswordRequest,
    TokenPair,
)
from app.schemas.user import UserResponse
from app.services.auth import (
    AuthService,
    InvalidCredentialsError,
    InvalidTokenError,
)


router = APIRouter(prefix="/auth", tags=["Autenticação"])
DatabaseSession = Annotated[Session, Depends(get_db)]


def token_response(access: str, refresh: str) -> TokenPair:
    return TokenPair(
        access_token=access,
        refresh_token=refresh,
        expires_in=settings.access_token_expire_minutes * 60,
    )


@router.post("/login", response_model=AuthResponse)
@limiter.limit(settings.login_rate_limit)
def login(request: Request, data: LoginRequest, database: DatabaseSession) -> AuthResponse:
    del request
    service = AuthService(database)
    try:
        user = service.authenticate(str(data.email), data.password)
    except InvalidCredentialsError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(error)) from error
    access, refresh = service.issue_pair(user)
    return AuthResponse(
        **token_response(access, refresh).model_dump(),
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=TokenPair)
def refresh(data: RefreshRequest, database: DatabaseSession) -> TokenPair:
    try:
        _, access, new_refresh = AuthService(database).rotate(data.refresh_token)
    except InvalidTokenError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(error)) from error
    return token_response(access, new_refresh)


@router.post("/logout", response_model=MessageResponse)
def logout(data: RefreshRequest, database: DatabaseSession) -> MessageResponse:
    AuthService(database).revoke(data.refresh_token)
    return MessageResponse(message="Sessão encerrada com sucesso")


@router.get("/me", response_model=UserResponse)
def me(current_user: CurrentUser) -> User:
    return current_user


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    data: ChangePasswordRequest,
    current_user: CurrentUser,
    database: DatabaseSession,
) -> MessageResponse:
    try:
        AuthService(database).change_password(
            current_user, data.current_password, data.new_password
        )
    except InvalidCredentialsError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    return MessageResponse(message="Senha alterada; entre novamente")


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(
    data: ForgotPasswordRequest, database: DatabaseSession
) -> ForgotPasswordResponse:
    reset_token = AuthService(database).create_reset_token(str(data.email))
    return ForgotPasswordResponse(
        message="Se o e-mail existir, as instruções de recuperação serão enviadas",
        reset_token=reset_token if settings.debug else None,
    )


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(
    data: ResetPasswordRequest, database: DatabaseSession
) -> MessageResponse:
    try:
        AuthService(database).reset_password(data.token, data.new_password)
    except InvalidTokenError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    return MessageResponse(message="Senha redefinida com sucesso")
