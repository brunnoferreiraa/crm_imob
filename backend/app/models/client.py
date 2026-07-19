import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User


class Client(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "clients"

    name: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(254), index=True)
    phone: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    whatsapp: Mapped[str | None] = mapped_column(String(20))
    cpf: Mapped[str | None] = mapped_column(String(11), index=True)
    birth_date: Mapped[date | None] = mapped_column(Date)
    client_type: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    lead_source: Mapped[str | None] = mapped_column(String(50), index=True)
    status: Mapped[str] = mapped_column(String(30), index=True, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    next_contact_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    responsible_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), index=True
    )

    responsible: Mapped["User"] = relationship(lazy="joined")
    interest: Mapped["ClientInterest"] = relationship(
        back_populates="client", cascade="all, delete-orphan", uselist=False, lazy="joined"
    )


class ClientInterest(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "client_interests"

    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), unique=True
    )
    budget_min: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    budget_max: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    property_type: Mapped[str | None] = mapped_column(String(50))
    cities: Mapped[list[str]] = mapped_column(ARRAY(String(100)), default=list, nullable=False)
    neighborhoods: Mapped[list[str]] = mapped_column(
        ARRAY(String(100)), default=list, nullable=False
    )
    bedrooms: Mapped[int | None] = mapped_column(Integer)

    client: Mapped[Client] = relationship(back_populates="interest")
