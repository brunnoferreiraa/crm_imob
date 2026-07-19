import uuid

from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.core.permissions import RoleSlug
from app.database.session import SessionLocal
from app.main import app
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.user import UserCreate
from app.services.role import seed_roles
from app.services.user import UserService


client = TestClient(app)


def test_broker_cannot_access_administrative_users() -> None:
    email = f"broker-{uuid.uuid4()}@example.com"
    password = "senha-segura-123"
    with SessionLocal() as database:
        seed_roles(database)
        broker = UserService(database).create(
            UserCreate(
                full_name="Corretor Autorização",
                email=email,
                password=password,
                role_slug=RoleSlug.BROKER,
            )
        )
        broker_id = broker.id

    try:
        login = client.post("/api/v1/auth/login", json={"email": email, "password": password})
        assert login.status_code == 200
        access_token = login.json()["access_token"]

        response = client.get(
            "/api/v1/users", headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 403
    finally:
        with SessionLocal() as database:
            database.execute(delete(RefreshToken).where(RefreshToken.user_id == broker_id))
            database.execute(delete(User).where(User.id == broker_id))
            database.commit()


def test_refresh_rotation_prevents_reuse() -> None:
    email = f"rotation-{uuid.uuid4()}@example.com"
    password = "senha-segura-123"
    with SessionLocal() as database:
        seed_roles(database)
        user = UserService(database).create(
            UserCreate(
                full_name="Corretor Rotação",
                email=email,
                password=password,
                role_slug=RoleSlug.BROKER,
            )
        )
        user_id = user.id

    try:
        login = client.post("/api/v1/auth/login", json={"email": email, "password": password})
        old_refresh = login.json()["refresh_token"]
        rotated = client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})

        assert rotated.status_code == 200
        assert rotated.json()["refresh_token"] != old_refresh
        assert client.post(
            "/api/v1/auth/refresh", json={"refresh_token": old_refresh}
        ).status_code == 401
    finally:
        with SessionLocal() as database:
            database.execute(delete(RefreshToken).where(RefreshToken.user_id == user_id))
            database.execute(delete(User).where(User.id == user_id))
            database.commit()
