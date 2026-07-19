import uuid
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.client import Client
    from app.models.property import Property
    from app.models.user import User


class Deal(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "deals"
    title: Mapped[str] = mapped_column(String(180), index=True)
    stage: Mapped[str] = mapped_column(String(30), index=True)
    estimated_value: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    final_value: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    probability: Mapped[int] = mapped_column(Integer, default=10)
    expected_close_date: Mapped[date | None] = mapped_column(Date)
    lost_reason: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id", ondelete="RESTRICT"), index=True
    )
    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("properties.id", ondelete="RESTRICT"), index=True
    )
    broker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), index=True
    )
    client: Mapped["Client"] = relationship(lazy="joined")
    property: Mapped["Property"] = relationship(lazy="joined")
    broker: Mapped["User"] = relationship(lazy="joined")
    history: Mapped[list["DealStageHistory"]] = relationship(
        cascade="all, delete-orphan", order_by="DealStageHistory.created_at"
    )


class DealStageHistory(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "deal_stage_history"
    deal_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("deals.id", ondelete="CASCADE"), index=True
    )
    from_stage: Mapped[str | None] = mapped_column(String(30))
    to_stage: Mapped[str] = mapped_column(String(30), index=True)
    changed_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT")
    )
    notes: Mapped[str | None] = mapped_column(Text)
    changed_by: Mapped["User"] = relationship(lazy="joined")
