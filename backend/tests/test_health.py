from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_root_exposes_documentation() -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["documentation"] == "/docs"


def test_health_check() -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_protected_route_rejects_anonymous_access() -> None:
    response = client.get("/api/v1/users")

    assert response.status_code == 401
