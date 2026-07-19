import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, model_validator
from app.schemas.deal import EntitySummary


class InteractionCreate(BaseModel):
    client_id: uuid.UUID
    contact_type: str
    occurred_at: datetime
    description: str
    result: str | None = None
    next_action: str | None = None
    next_contact_at: datetime | None = None


class InteractionResponse(InteractionCreate):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    broker: EntitySummary
    created_at: datetime


class VisitCreate(BaseModel):
    client_id: uuid.UUID
    property_id: uuid.UUID
    scheduled_at: datetime
    status: str = "agendada"
    notes: str | None = None
    result: str | None = None
    interest_level: str | None = None


class VisitUpdate(BaseModel):
    scheduled_at: datetime | None = None
    status: str | None = None
    notes: str | None = None
    result: str | None = None
    interest_level: str | None = None


class VisitResponse(VisitCreate):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    client: EntitySummary
    property: EntitySummary
    broker: EntitySummary


class TaskCreate(BaseModel):
    title: str = Field(min_length=2, max_length=180)
    description: str | None = None
    assignee_id: uuid.UUID | None = None
    client_id: uuid.UUID | None = None
    deal_id: uuid.UUID | None = None
    priority: str = "media"
    due_at: datetime
    status: str = "pendente"

    @model_validator(mode="after")
    def relation(self):
        if self.client_id and self.deal_id:
            raise ValueError("Relacione a tarefa a cliente ou negociação, não ambos")
        return self


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: str | None = None
    due_at: datetime | None = None
    status: str | None = None


class TaskResponse(TaskCreate):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    assignee: EntitySummary
    client: EntitySummary | None
    deal: EntitySummary | None
    created_at: datetime
