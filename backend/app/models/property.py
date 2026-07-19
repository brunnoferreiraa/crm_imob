import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User


class Owner(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "owners"
    name: Mapped[str] = mapped_column(String(150), index=True)
    document: Mapped[str] = mapped_column(String(14), index=True)
    email: Mapped[str | None] = mapped_column(String(254), index=True)
    phone: Mapped[str] = mapped_column(String(20))
    whatsapp: Mapped[str | None] = mapped_column(String(20))
    address: Mapped[str | None] = mapped_column(String(300))
    bank_details: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    properties: Mapped[list["Property"]] = relationship(back_populates="owner")


class Property(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "properties"
    reference_code: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(180), index=True)
    description: Mapped[str | None] = mapped_column(Text)
    purpose: Mapped[str] = mapped_column(String(20), index=True)
    property_type: Mapped[str] = mapped_column(String(50), index=True)
    status: Mapped[str] = mapped_column(String(30), index=True)
    price: Mapped[Decimal] = mapped_column(Numeric(14, 2), index=True)
    condominium_fee: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    property_tax: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    total_area: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    usable_area: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    bedrooms: Mapped[int] = mapped_column(Integer, default=0)
    suites: Mapped[int] = mapped_column(Integer, default=0)
    bathrooms: Mapped[int] = mapped_column(Integer, default=0)
    parking_spaces: Mapped[int] = mapped_column(Integer, default=0)
    street: Mapped[str] = mapped_column(String(180))
    number: Mapped[str] = mapped_column(String(20))
    complement: Mapped[str | None] = mapped_column(String(100))
    neighborhood: Mapped[str] = mapped_column(String(100), index=True)
    city: Mapped[str] = mapped_column(String(100), index=True)
    state: Mapped[str] = mapped_column(String(2), index=True)
    postal_code: Mapped[str] = mapped_column(String(8))
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("owners.id", ondelete="RESTRICT"), index=True
    )
    responsible_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), index=True
    )
    owner: Mapped[Owner] = relationship(back_populates="properties", lazy="joined")
    responsible: Mapped["User"] = relationship(lazy="joined")
    features: Mapped[list["PropertyFeature"]] = relationship(
        cascade="all, delete-orphan", lazy="selectin"
    )
    images: Mapped[list["PropertyImage"]] = relationship(
        cascade="all, delete-orphan", lazy="selectin", order_by="PropertyImage.position"
    )


class PropertyFeature(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "property_features"
    __table_args__ = (UniqueConstraint("property_id", "name"),)
    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(80))


class PropertyImage(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "property_images"
    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), index=True
    )
    file_name: Mapped[str] = mapped_column(String(255))
    storage_path: Mapped[str] = mapped_column(String(500), unique=True)
    content_type: Mapped[str] = mapped_column(String(50))
    size: Mapped[int] = mapped_column(Integer)
    position: Mapped[int] = mapped_column(Integer, default=0)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
