import pytest
from pydantic import ValidationError

from app.core.permissions import Permission, ROLE_PERMISSIONS, RoleSlug
from app.core.security import hash_password, verify_password
from app.schemas.user import UserCreate


def test_role_permissions_follow_access_rules() -> None:
    assert Permission.USERS_MANAGE in ROLE_PERMISSIONS[RoleSlug.ADMIN]
    assert Permission.LEADS_ASSIGN in ROLE_PERMISSIONS[RoleSlug.MANAGER]
    assert Permission.LEADS_MANAGE_OWN in ROLE_PERMISSIONS[RoleSlug.BROKER]
    assert Permission.USERS_MANAGE not in ROLE_PERMISSIONS[RoleSlug.BROKER]


def test_password_uses_secure_hash() -> None:
    encoded = hash_password("senha-segura-123")

    assert encoded != "senha-segura-123"
    assert encoded.startswith("$argon2")
    assert verify_password("senha-segura-123", encoded)
    assert not verify_password("senha-incorreta", encoded)


def test_user_schema_normalizes_email_and_cpf() -> None:
    user = UserCreate(
        full_name="Maria Corretora",
        email="MARIA@EXAMPLE.COM",
        password="senha-segura-123",
        role_slug=RoleSlug.BROKER,
        cpf="123.456.789-00",
    )

    assert str(user.email) == "maria@example.com"
    assert user.cpf == "12345678900"


def test_user_schema_rejects_invalid_cpf() -> None:
    with pytest.raises(ValidationError):
        UserCreate(
            full_name="Maria Corretora",
            email="maria@example.com",
            password="senha-segura-123",
            role_slug=RoleSlug.BROKER,
            cpf="123",
        )
