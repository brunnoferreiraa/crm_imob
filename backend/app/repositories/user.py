import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.role import Role
from app.models.user import User


class UserRepository:
    def __init__(self, database: Session) -> None:
        self.database = database

    def get_by_id(self, user_id: uuid.UUID) -> User | None:
        return self.database.scalar(
            select(User).where(User.id == user_id, User.deleted_at.is_(None))
        )

    def get_by_email(self, email: str) -> User | None:
        return self.database.scalar(
            select(User).where(User.email == email.lower(), User.deleted_at.is_(None))
        )

    def get_role(self, slug: str) -> Role | None:
        return self.database.scalar(select(Role).where(Role.slug == slug))

    def list_active(self, offset: int = 0, limit: int = 50) -> list[User]:
        return list(
            self.database.scalars(
                select(User)
                .where(User.deleted_at.is_(None))
                .order_by(User.full_name)
                .offset(offset)
                .limit(limit)
            ).unique()
        )

    def add(self, user: User) -> User:
        self.database.add(user)
        self.database.flush()
        self.database.refresh(user)
        return user
