import uuid
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.property import Owner, Property, PropertyFeature
from app.models.user import User
from app.schemas.property import (
    OwnerCreate,
    OwnerUpdate,
    PropertyCreate,
    PropertyUpdate,
)


class RealEstateNotFoundError(ValueError):
    pass


class RealEstateConflictError(ValueError):
    pass


class OwnerService:
    def __init__(self, database: Session) -> None:
        self.database = database

    def list(self, search: str | None = None) -> list[Owner]:
        query = select(Owner).where(Owner.deleted_at.is_(None)).order_by(Owner.name)
        if search:
            term = f"%{search}%"
            query = query.where(or_(Owner.name.ilike(term), Owner.document.ilike(term)))
        return list(self.database.scalars(query))

    def get(self, owner_id: uuid.UUID) -> Owner:
        owner = self.database.scalar(
            select(Owner).where(Owner.id == owner_id, Owner.deleted_at.is_(None))
        )
        if owner is None:
            raise RealEstateNotFoundError("Proprietário não encontrado")
        return owner

    def create(self, data: OwnerCreate) -> Owner:
        duplicate = self.database.scalar(
            select(Owner).where(
                Owner.document == data.document, Owner.deleted_at.is_(None)
            )
        )
        if duplicate:
            raise RealEstateConflictError("CPF/CNPJ já cadastrado")
        owner = Owner(**data.model_dump())
        self.database.add(owner)
        self.database.commit()
        self.database.refresh(owner)
        return owner

    def update(self, owner_id: uuid.UUID, data: OwnerUpdate) -> Owner:
        owner = self.get(owner_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(owner, field, str(value) if field == "email" and value else value)
        self.database.commit()
        self.database.refresh(owner)
        return owner

    def delete(self, owner_id: uuid.UUID) -> None:
        owner = self.get(owner_id)
        active = self.database.scalar(
            select(func.count())
            .select_from(Property)
            .where(Property.owner_id == owner.id, Property.deleted_at.is_(None))
        )
        if active:
            raise RealEstateConflictError("Proprietário possui imóveis ativos")
        owner.deleted_at = datetime.now(UTC)
        self.database.commit()


class PropertyService:
    def __init__(self, database: Session, current_user: User) -> None:
        self.database = database
        self.current_user = current_user

    def get(self, property_id: uuid.UUID) -> Property:
        item = self.database.scalar(
            select(Property).where(
                Property.id == property_id, Property.deleted_at.is_(None)
            )
        )
        if item is None:
            raise RealEstateNotFoundError("Imóvel não encontrado")
        return item

    def list(
        self,
        *,
        search: str | None,
        purpose: str | None,
        property_type: str | None,
        city: str | None,
        min_price: Decimal | None,
        max_price: Decimal | None,
        bedrooms: int | None,
        available: bool | None,
        featured: bool | None,
        offset: int,
        limit: int,
    ) -> tuple[list[Property], int]:
        query = select(Property).where(Property.deleted_at.is_(None))
        if search:
            term = f"%{search}%"
            query = query.where(
                or_(
                    Property.title.ilike(term),
                    Property.reference_code.ilike(term),
                    Property.neighborhood.ilike(term),
                )
            )
        for value, column in (
            (purpose, Property.purpose),
            (property_type, Property.property_type),
            (city, Property.city),
        ):
            if value:
                query = query.where(column == value)
        if min_price is not None:
            query = query.where(Property.price >= min_price)
        if max_price is not None:
            query = query.where(Property.price <= max_price)
        if bedrooms is not None:
            query = query.where(Property.bedrooms >= bedrooms)
        if available is not None:
            query = query.where(Property.is_available == available)
        if featured is not None:
            query = query.where(Property.is_featured == featured)
        total = (
            self.database.scalar(select(func.count()).select_from(query.subquery()))
            or 0
        )
        return list(
            self.database.scalars(
                query.order_by(Property.created_at.desc()).offset(offset).limit(limit)
            ).unique()
        ), total

    def create(self, data: PropertyCreate) -> Property:
        if self.database.scalar(
            select(Property).where(Property.reference_code == data.reference_code)
        ):
            raise RealEstateConflictError("Código de referência já cadastrado")
        if not self.database.get(Owner, data.owner_id):
            raise RealEstateNotFoundError("Proprietário não encontrado")
        responsible_id = data.responsible_id or self.current_user.id
        if not self.database.get(User, responsible_id):
            raise RealEstateNotFoundError("Corretor não encontrado")
        values = data.model_dump(exclude={"features", "responsible_id"})
        item = Property(**values, responsible_id=responsible_id)
        item.features = [
            PropertyFeature(name=name.strip())
            for name in dict.fromkeys(data.features)
            if name.strip()
        ]
        self.database.add(item)
        self.database.commit()
        self.database.refresh(item)
        return item

    def update(self, property_id: uuid.UUID, data: PropertyUpdate) -> Property:
        item = self.get(property_id)
        changes = data.model_dump(exclude_unset=True, exclude={"features"})
        for field, value in changes.items():
            setattr(item, field, value)
        if data.features is not None:
            item.features = [
                PropertyFeature(name=name.strip())
                for name in dict.fromkeys(data.features)
                if name.strip()
            ]
        self.database.commit()
        self.database.refresh(item)
        return item

    def delete(self, property_id: uuid.UUID) -> None:
        item = self.get(property_id)
        item.deleted_at = datetime.now(UTC)
        item.is_available = False
        self.database.commit()
