import uuid
from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, model_validator


class DealStage(StrEnum):
    NEW = "lead_novo"
    CONTACTED = "contato_realizado"
    QUALIFIED = "qualificado"
    VISIT = "visita_agendada"
    PROPOSAL = "proposta_enviada"
    NEGOTIATION = "negociacao"
    CONTRACT = "contrato"
    WON = "ganho"
    LOST = "perdido"


class DealCreate(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    client_id: uuid.UUID
    property_id: uuid.UUID
    broker_id: uuid.UUID | None = None
    estimated_value: Decimal = Field(ge=0)
    probability: int = Field(default=10, ge=0, le=100)
    expected_close_date: date | None = None
    notes: str | None = None


class DealUpdate(BaseModel):
    title: str | None = None
    estimated_value: Decimal | None = Field(default=None, ge=0)
    final_value: Decimal | None = Field(default=None, ge=0)
    probability: int | None = Field(default=None, ge=0, le=100)
    expected_close_date: date | None = None
    notes: str | None = None


class DealMove(BaseModel):
    stage: DealStage
    lost_reason: str | None = None
    final_value: Decimal | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def validate_outcome(self) -> "DealMove":
        if self.stage == DealStage.LOST and not self.lost_reason:
            raise ValueError("Informe o motivo da perda")
        if self.stage == DealStage.WON and self.final_value is None:
            raise ValueError("Informe o valor final do negócio ganho")
        return self


class EntitySummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str | None = None
    title: str | None = None
    full_name: str | None = None


class DealHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    from_stage: str | None
    to_stage: str
    notes: str | None
    created_at: datetime
    changed_by: EntitySummary


class DealResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    stage: str
    estimated_value: Decimal
    final_value: Decimal | None
    probability: int
    expected_close_date: date | None
    lost_reason: str | None
    notes: str | None
    client: EntitySummary
    property: EntitySummary
    broker: EntitySummary
    history: list[DealHistoryResponse]
    created_at: datetime
