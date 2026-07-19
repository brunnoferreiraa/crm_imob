from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.schemas.client import ClientCreate, ClientInterestInput


def test_client_normalizes_contact_data() -> None:
    client = ClientCreate(
        name="Maria Cliente",
        email="MARIA@EXAMPLE.COM",
        phone="(11) 99999-8888",
        cpf="123.456.789-01",
        client_type="comprador",
    )

    assert str(client.email) == "maria@example.com"
    assert client.phone == "11999998888"
    assert client.cpf == "12345678901"


def test_interest_rejects_inverted_budget() -> None:
    with pytest.raises(ValidationError):
        ClientInterestInput(
            budget_min=Decimal("500000"), budget_max=Decimal("300000")
        )
