import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from app.schemas.property_type import PropertyType


def digits(value: str) -> str:
    return "".join(char for char in value if char.isdigit())


class OwnerCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    document: str
    email: EmailStr | None = None
    phone: str = Field(min_length=8, max_length=20)
    whatsapp: str | None = None
    address: str | None = Field(default=None, max_length=300)
    bank_details: str | None = None
    notes: str | None = None

    @field_validator("document")
    @classmethod
    def document_digits(cls, value: str) -> str:
        normalized = digits(value)
        if len(normalized) not in {11, 14}:
            raise ValueError("Informe um CPF ou CNPJ válido")
        return normalized

    @field_validator("phone", "whatsapp")
    @classmethod
    def phone_digits(cls, value: str | None) -> str | None:
        return digits(value) if value else None


class OwnerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    email: EmailStr | None = None
    phone: str | None = None
    whatsapp: str | None = None
    address: str | None = None
    bank_details: str | None = None
    notes: str | None = None


class OwnerSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    document: str


class OwnerResponse(OwnerSummary):
    email: EmailStr | None
    phone: str
    whatsapp: str | None
    address: str | None
    bank_details: str | None
    notes: str | None
    created_at: datetime


class PropertyCreate(BaseModel):
    reference_code: str = Field(min_length=2, max_length=30)
    title: str = Field(min_length=3, max_length=180)
    description: str | None = None
    purpose: str = Field(pattern="^(venda|aluguel|temporada)$")
    property_type: PropertyType
    status: str = Field(default="disponivel", max_length=30)
    price: Decimal = Field(gt=0)
    condominium_fee: Decimal | None = Field(default=None, ge=0)
    property_tax: Decimal | None = Field(default=None, ge=0)
    total_area: Decimal | None = Field(default=None, ge=0)
    usable_area: Decimal | None = Field(default=None, ge=0)
    bedrooms: int = Field(default=0, ge=0)
    suites: int = Field(default=0, ge=0)
    bathrooms: int = Field(default=0, ge=0)
    parking_spaces: int = Field(default=0, ge=0)
    street: str
    number: str
    complement: str | None = None
    neighborhood: str
    city: str
    state: str = Field(min_length=2, max_length=2)
    postal_code: str
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    is_featured: bool = False
    is_available: bool = True
    owner_id: uuid.UUID
    responsible_id: uuid.UUID | None = None
    features: list[str] = Field(default_factory=list)


class PropertyUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    price: Decimal | None = Field(default=None, gt=0)
    condominium_fee: Decimal | None = Field(default=None, ge=0)
    property_tax: Decimal | None = Field(default=None, ge=0)
    is_featured: bool | None = None
    is_available: bool | None = None
    features: list[str] | None = None


class PropertyImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    file_name: str
    content_type: str
    size: int
    position: int
    is_primary: bool


class PropertyFeatureResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str


class PropertyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    reference_code: str
    title: str
    description: str | None
    purpose: str
    property_type: str
    status: str
    price: Decimal
    condominium_fee: Decimal | None
    property_tax: Decimal | None
    total_area: Decimal | None
    usable_area: Decimal | None
    bedrooms: int
    suites: int
    bathrooms: int
    parking_spaces: int
    street: str
    number: str
    complement: str | None
    neighborhood: str
    city: str
    state: str
    postal_code: str
    latitude: Decimal | None
    longitude: Decimal | None
    is_featured: bool
    is_available: bool
    owner: OwnerSummary
    responsible_id: uuid.UUID
    features: list[PropertyFeatureResponse]
    images: list[PropertyImageResponse]
    created_at: datetime


class ImageOrderItem(BaseModel):
    id: uuid.UUID
    position: int = Field(ge=0)


class ImageOrderRequest(BaseModel):
    images: list[ImageOrderItem]
    primary_id: uuid.UUID | None = None
