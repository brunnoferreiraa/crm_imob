import uuid
from datetime import UTC, date, datetime, timedelta
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session
from app.core.permissions import Permission
from app.database.session import get_db
from app.dependencies.auth import CurrentUser
from app.models.activity import Interaction, Task, Visit
from app.models.client import Client
from app.models.deal import Deal
from app.models.property import Property
from app.models.user import User

router = APIRouter(tags=["Dashboard e relatórios"])
DB = Annotated[Session, Depends(get_db)]


def scope(user: User, column):
    return (
        None
        if user.has_permission(Permission.DEALS_VIEW_ALL.value)
        or user.has_permission(Permission.USERS_MANAGE.value)
        else column == user.id
    )


def scalar(db, q, condition=None):
    if condition is not None:
        q = q.where(condition)
    return db.scalar(q) or 0


def period(start: date | None, end: date | None):
    now = datetime.now(UTC)
    return (
        datetime.combine(start, datetime.min.time(), UTC)
        if start
        else now - timedelta(days=30),
        datetime.combine(end, datetime.max.time(), UTC) if end else now,
    )


@router.get("/dashboard")
def dashboard(database: DB, current: CurrentUser):
    now = datetime.now(UTC)
    deal_scope = scope(current, Deal.broker_id)
    client_scope = scope(current, Client.responsible_id)
    visit_scope = scope(current, Visit.broker_id)
    task_scope = scope(current, Task.assignee_id)

    def count(model, *criteria, condition=None):
        return scalar(
            database,
            select(func.count()).select_from(model).where(*criteria),
            condition,
        )

    new = count(
        Client,
        Client.deleted_at.is_(None),
        Client.created_at >= now - timedelta(days=30),
        condition=client_scope,
    )
    won = count(
        Deal, Deal.deleted_at.is_(None), Deal.stage == "ganho", condition=deal_scope
    )
    total = count(Deal, Deal.deleted_at.is_(None), condition=deal_scope)
    value = scalar(
        database,
        select(func.coalesce(func.sum(Deal.final_value), 0)).where(
            Deal.deleted_at.is_(None), Deal.stage == "ganho"
        ),
        deal_scope,
    )
    leads = database.execute(
        select(func.date(Client.created_at), func.count())
        .where(
            Client.deleted_at.is_(None),
            Client.created_at >= now - timedelta(days=30),
            *([client_scope] if client_scope is not None else []),
        )
        .group_by(func.date(Client.created_at))
        .order_by(func.date(Client.created_at))
    ).all()
    stages = database.execute(
        select(Deal.stage, func.count())
        .where(
            Deal.deleted_at.is_(None), *([deal_scope] if deal_scope is not None else [])
        )
        .group_by(Deal.stage)
    ).all()
    recent = database.execute(
        select(Interaction.occurred_at, Interaction.contact_type, Client.name)
        .join(Client, Client.id == Interaction.client_id)
        .where(
            Interaction.deleted_at.is_(None),
            *(
                [scope(current, Interaction.broker_id)]
                if scope(current, Interaction.broker_id) is not None
                else []
            ),
        )
        .order_by(Interaction.occurred_at.desc())
        .limit(8)
    ).all()
    return {
        "metrics": {
            "new_leads": new,
            "in_service": count(
                Client,
                Client.status == "em_atendimento",
                Client.deleted_at.is_(None),
                condition=client_scope,
            ),
            "scheduled_visits": count(
                Visit,
                Visit.status == "agendada",
                Visit.scheduled_at >= now,
                Visit.deleted_at.is_(None),
                condition=visit_scope,
            ),
            "open_deals": count(
                Deal,
                Deal.stage.notin_(["ganho", "perdido"]),
                Deal.deleted_at.is_(None),
                condition=deal_scope,
            ),
            "won_deals": won,
            "deal_value": value,
            "conversion_rate": round(won / total * 100, 2) if total else 0,
            "available_properties": count(
                Property, Property.is_available.is_(True), Property.deleted_at.is_(None)
            ),
            "overdue_tasks": count(
                Task,
                Task.due_at < now,
                Task.status != "concluida",
                Task.deleted_at.is_(None),
                condition=task_scope,
            ),
        },
        "leads_by_day": [{"date": str(day), "total": amount} for day, amount in leads],
        "deals_by_stage": [
            {"stage": stage, "total": amount} for stage, amount in stages
        ],
        "recent_activities": [
            {"at": at, "type": kind, "client": name} for at, kind, name in recent
        ],
    }


@router.get("/reports")
def reports(
    database: DB,
    current: CurrentUser,
    start: date | None = None,
    end: date | None = None,
    broker_id: uuid.UUID | None = None,
):
    begin, finish = period(start, end)
    requested = (
        broker_id
        if current.has_permission(Permission.REPORTS_VIEW_ALL.value)
        or current.has_permission(Permission.REPORTS_VIEW_TEAM.value)
        else current.id
    )
    client_filter = (
        Client.responsible_id == requested
        if requested
        else scope(current, Client.responsible_id)
    )
    deal_filter = (
        Deal.broker_id == requested if requested else scope(current, Deal.broker_id)
    )
    sources = database.execute(
        select(func.coalesce(Client.lead_source, "Não informado"), func.count())
        .where(
            Client.created_at.between(begin, finish),
            Client.deleted_at.is_(None),
            *([client_filter] if client_filter is not None else []),
        )
        .group_by(Client.lead_source)
    ).all()
    stages = database.execute(
        select(Deal.stage, func.count(), func.coalesce(func.sum(Deal.final_value), 0))
        .where(
            Deal.created_at.between(begin, finish),
            Deal.deleted_at.is_(None),
            *([deal_filter] if deal_filter is not None else []),
        )
        .group_by(Deal.stage)
    ).all()
    performance = database.execute(
        select(
            User.full_name,
            func.count(Deal.id),
            func.sum(case((Deal.stage == "ganho", 1), else_=0)),
            func.coalesce(func.sum(Deal.final_value), 0),
        )
        .join(Deal, Deal.broker_id == User.id)
        .where(
            Deal.created_at.between(begin, finish),
            Deal.deleted_at.is_(None),
            *([deal_filter] if deal_filter is not None else []),
        )
        .group_by(User.id, User.full_name)
    ).all()
    losses = database.execute(
        select(Deal.lost_reason, func.count())
        .where(
            Deal.stage == "perdido",
            Deal.created_at.between(begin, finish),
            Deal.deleted_at.is_(None),
            *([deal_filter] if deal_filter is not None else []),
        )
        .group_by(Deal.lost_reason)
    ).all()
    top = database.execute(
        select(Property.title, func.count(Visit.id))
        .join(Visit, Visit.property_id == Property.id)
        .where(
            Visit.created_at.between(begin, finish),
            Visit.deleted_at.is_(None),
            *([Visit.broker_id == requested] if requested else []),
        )
        .group_by(Property.id, Property.title)
        .order_by(func.count(Visit.id).desc())
        .limit(10)
    ).all()
    return {
        "leads_by_source": [{"source": x, "total": n} for x, n in sources],
        "deals_by_stage": [{"stage": x, "total": n, "value": v} for x, n, v in stages],
        "team_performance": [
            {"broker": x, "deals": n, "won": w, "value": v}
            for x, n, w, v in performance
        ],
        "loss_reasons": [
            {"reason": x or "Não informado", "total": n} for x, n in losses
        ],
        "most_visited_properties": [{"property": x, "visits": n} for x, n in top],
    }
