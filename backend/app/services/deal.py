import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.permissions import Permission
from app.models.client import Client
from app.models.deal import Deal, DealStageHistory
from app.models.property import Property
from app.models.user import User
from app.schemas.deal import DealCreate, DealMove, DealStage, DealUpdate


class DealNotFoundError(ValueError):
    pass


class DealReferenceError(ValueError):
    pass


class DealService:
    def __init__(self, database: Session, current: User) -> None:
        self.database, self.current = database, current

    @property
    def can_view_all(self) -> bool:
        return self.current.has_permission(Permission.DEALS_VIEW_ALL.value)

    def query(self):
        query = select(Deal).where(Deal.deleted_at.is_(None))
        return (
            query
            if self.can_view_all
            else query.where(Deal.broker_id == self.current.id)
        )

    def list(self) -> list[Deal]:
        return list(
            self.database.scalars(
                self.query().order_by(Deal.updated_at.desc())
            ).unique()
        )

    def get(self, deal_id: uuid.UUID) -> Deal:
        deal = self.database.scalar(self.query().where(Deal.id == deal_id))
        if deal is None:
            raise DealNotFoundError("Negociação não encontrada")
        return deal

    def create(self, data: DealCreate) -> Deal:
        client = self.database.scalar(
            select(Client).where(
                Client.id == data.client_id, Client.deleted_at.is_(None)
            )
        )
        prop = self.database.scalar(
            select(Property).where(
                Property.id == data.property_id, Property.deleted_at.is_(None)
            )
        )
        broker_id = (
            data.broker_id if self.can_view_all and data.broker_id else self.current.id
        )
        broker = self.database.scalar(
            select(User).where(User.id == broker_id, User.is_active.is_(True))
        )
        if not client or not prop or not broker:
            raise DealReferenceError("Cliente, imóvel ou corretor inválido")
        deal = Deal(
            **data.model_dump(exclude={"broker_id"}),
            broker_id=broker_id,
            stage=DealStage.NEW.value,
        )
        deal.history.append(
            DealStageHistory(
                from_stage=None,
                to_stage=deal.stage,
                changed_by_id=self.current.id,
                notes="Negociação criada",
            )
        )
        self.database.add(deal)
        self.database.commit()
        self.database.refresh(deal)
        return deal

    def update(self, deal_id: uuid.UUID, data: DealUpdate) -> Deal:
        deal = self.get(deal_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(deal, field, value)
        self.database.commit()
        self.database.refresh(deal)
        return deal

    def move(self, deal_id: uuid.UUID, data: DealMove) -> Deal:
        deal = self.get(deal_id)
        previous = deal.stage
        if previous == data.stage.value:
            return deal
        deal.stage = data.stage.value
        deal.lost_reason = data.lost_reason if data.stage == DealStage.LOST else None
        if data.final_value is not None:
            deal.final_value = data.final_value
        if data.stage == DealStage.WON:
            deal.probability = 100
        if data.stage == DealStage.LOST:
            deal.probability = 0
        deal.history.append(
            DealStageHistory(
                from_stage=previous,
                to_stage=deal.stage,
                changed_by_id=self.current.id,
                notes=data.lost_reason,
            )
        )
        self.database.commit()
        self.database.refresh(deal)
        return deal

    def delete(self, deal_id: uuid.UUID) -> None:
        deal = self.get(deal_id)
        deal.deleted_at = datetime.now(UTC)
        self.database.commit()
