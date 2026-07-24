import uuid
from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)
from app.schemas.property_type import PropertyType


class ClientType(StrEnum):
    BUYER = "comprador"
    TENANT = "locatario"
    OWNER = "proprietario"
    INVESTOR = "investidor"


class ClientStatus(StrEnum):
    NEW = "novo"
    IN_SERVICE = "em_atendimento"
    QUALIFIED = "qualificado"
    INACTIVE = "inativo"


class ClientInterestInput(BaseModel):
    budget_min: Decimal | None = Field(default=None, ge=0)
    budget_max: Decimal | None = Field(default=None, ge=0)
    property_type: PropertyType | None = None
    cities: list[str] = Field(default_factory=list)
    neighborhoods: list[str] = Field(default_factory=list)
    bedrooms: int | None = Field(default=None, ge=0, le=30)

    @model_validator(mode="after")
    def validate_budget(self) -> "ClientInterestInput":
        if self.budget_min is not None and self.budget_max is not None:
            if self.budget_min > self.budget_max:
                raise ValueError("Orçamento mínimo não pode superar o máximo")
        return self


class ClientCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    email: EmailStr | None = None
    phone: str = Field(min_length=8, max_length=20)
    whatsapp: str | None = Field(default=None, max_length=20)
    cpf: str | None = None
    birth_date: date | None = None
    client_type: ClientType
    lead_source: str | None = Field(default=None, max_length=50)
    status: ClientStatus = ClientStatus.NEW
    notes: str | None = None
    next_contact_at: datetime | None = None
    responsible_id: uuid.UUID | None = None
    interest: ClientInterestInput = Field(default_factory=ClientInterestInput)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr | None) -> str | None:
        return str(value).strip().lower() if value else None

    @field_validator("cpf")
    @classmethod
    def normalize_cpf(cls, value: str | None) -> str | None:
        if not value:
            return None
        digits = "".join(character for character in value if character.isdigit())
        if len(digits) != 11:
            raise ValueError("CPF precisa conter 11 dígitos")
        return digits

    @field_validator("phone", "whatsapp")
    @classmethod
    def normalize_phone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        digits = "".join(character for character in value if character.isdigit())
        if len(digits) < 8 or len(digits) > 15:
            raise ValueError("Telefone inválido")
        return digits


class ClientUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, min_length=8, max_length=20)
    whatsapp: str | None = Field(default=None, max_length=20)
    birth_date: date | None = None
    client_type: ClientType | None = None
    lead_source: str | None = Field(default=None, max_length=50)
    status: ClientStatus | None = None
    notes: str | None = None
    next_contact_at: datetime | None = None
    interest: ClientInterestInput | None = None


class TransferClientRequest(BaseModel):
    responsible_id: uuid.UUID


class ResponsibleSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    full_name: str


class ClientInterestResponse(ClientInterestInput):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID


class ClientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    email: EmailStr | None
    phone: str
    whatsapp: str | None
    cpf: str | None
    birth_date: date | None
    client_type: str
    lead_source: str | None
    status: str
    notes: str | None
    next_contact_at: datetime | None
    responsible: ResponsibleSummary
    interest: ClientInterestResponse
    created_at: datetime
    updated_at: datetime


class ClientPage(BaseModel):
    items: list[ClientResponse]
    total: int
    page: int
    page_size: int
    pages: int
