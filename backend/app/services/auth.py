import uuid
from datetime import UTC, datetime, timedelta

import jwt
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_token,
    decode_token,
    fingerprint_token,
    hash_password,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.repositories.user import UserRepository


class InvalidCredentialsError(ValueError):
    pass


class InvalidTokenError(ValueError):
    pass


class AuthService:
    def __init__(self, database: Session) -> None:
        self.database = database
        self.users = UserRepository(database)

    def authenticate(self, email: str, password: str) -> User:
        user = self.users.get_by_email(email.strip().lower())
        if (
            user is None
            or not user.is_active
            or not verify_password(password, user.password_hash)
        ):
            raise InvalidCredentialsError("E-mail ou senha inválidos")
        user.last_login_at = datetime.now(UTC)
        self.database.commit()
        self.database.refresh(user)
        return user

    def issue_pair(self, user: User) -> tuple[str, str]:
        access_token, _ = create_token(
            str(user.id),
            "access",
            timedelta(minutes=settings.access_token_expire_minutes),
        )
        refresh_token, expires_at = create_token(
            str(user.id),
            "refresh",
            timedelta(days=settings.refresh_token_expire_days),
        )
        self.database.add(
            RefreshToken(
                user_id=user.id,
                token_hash=fingerprint_token(refresh_token),
                expires_at=expires_at,
            )
        )
        self.database.commit()
        return access_token, refresh_token

    def rotate(self, raw_token: str) -> tuple[User, str, str]:
        try:
            payload = decode_token(raw_token, "refresh")
            user_id = uuid.UUID(payload["sub"])
        except (jwt.InvalidTokenError, KeyError, ValueError) as error:
            raise InvalidTokenError("Refresh token inválido") from error

        stored = self.database.scalar(
            select(RefreshToken).where(
                RefreshToken.token_hash == fingerprint_token(raw_token)
            )
        )
        now = datetime.now(UTC)
        if stored is None or stored.revoked_at is not None or stored.expires_at <= now:
            raise InvalidTokenError("Refresh token inválido ou revogado")
        user = self.users.get_by_id(user_id)
        if user is None or not user.is_active or stored.user_id != user.id:
            raise InvalidTokenError("Usuário inválido ou inativo")

        stored.revoked_at = now
        self.database.commit()
        access, refresh = self.issue_pair(user)
        return user, access, refresh

    def revoke(self, raw_token: str) -> None:
        stored = self.database.scalar(
            select(RefreshToken).where(
                RefreshToken.token_hash == fingerprint_token(raw_token)
            )
        )
        if stored is not None and stored.revoked_at is None:
            stored.revoked_at = datetime.now(UTC)
            self.database.commit()

    def revoke_all(self, user_id: uuid.UUID) -> None:
        self.database.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=datetime.now(UTC))
        )
        self.database.commit()

    def change_password(self, user: User, current: str, new: str) -> None:
        if not verify_password(current, user.password_hash):
            raise InvalidCredentialsError("Senha atual inválida")
        user.password_hash = hash_password(new)
        self.database.commit()
        self.revoke_all(user.id)

    def create_reset_token(self, email: str) -> str | None:
        user = self.users.get_by_email(email.strip().lower())
        if user is None or not user.is_active:
            return None
        token, _ = create_token(
            str(user.id),
            "password_reset",
            timedelta(minutes=settings.password_reset_expire_minutes),
            {"password_fingerprint": fingerprint_token(user.password_hash)},
        )
        return token

    def reset_password(self, raw_token: str, new_password: str) -> None:
        try:
            payload = decode_token(raw_token, "password_reset")
            user = self.users.get_by_id(uuid.UUID(payload["sub"]))
        except (jwt.InvalidTokenError, KeyError, ValueError) as error:
            raise InvalidTokenError("Token de recuperação inválido") from error
        if user is None or not user.is_active:
            raise InvalidTokenError("Token de recuperação inválido")
        if payload.get("password_fingerprint") != fingerprint_token(user.password_hash):
            raise InvalidTokenError("Token de recuperação já utilizado")
        user.password_hash = hash_password(new_password)
        self.database.commit()
        self.revoke_all(user.id)
