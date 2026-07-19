import uuid
from datetime import UTC, datetime

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import UserCreate, UserUpdate


class UserConflictError(ValueError):
    pass


class RoleNotFoundError(ValueError):
    pass


class UserNotFoundError(ValueError):
    pass


class UserService:
    def __init__(self, database: Session) -> None:
        self.database = database
        self.repository = UserRepository(database)

    def create(self, data: UserCreate) -> User:
        if self.repository.get_by_email(str(data.email)):
            raise UserConflictError("Já existe um usuário com este e-mail")

        role = self.repository.get_role(data.role_slug.value)
        if role is None:
            raise RoleNotFoundError("Perfil de acesso não encontrado")

        user = User(
            full_name=data.full_name.strip(),
            email=str(data.email),
            cpf=data.cpf,
            phone=data.phone,
            password_hash=hash_password(data.password),
            role_id=role.id,
        )
        try:
            created = self.repository.add(user)
            self.database.commit()
            return created
        except IntegrityError as error:
            self.database.rollback()
            raise UserConflictError("E-mail ou CPF já cadastrado") from error

    def list(self, offset: int = 0, limit: int = 50) -> list[User]:
        return self.repository.list_active(offset, limit)

    def update(self, user_id: uuid.UUID, data: UserUpdate) -> User:
        user = self.repository.get_by_id(user_id)
        if user is None:
            raise UserNotFoundError("Usuário não encontrado")
        changes = data.model_dump(exclude_unset=True)
        role_slug = changes.pop("role_slug", None)
        if role_slug is not None:
            role = self.repository.get_role(role_slug.value)
            if role is None:
                raise RoleNotFoundError("Perfil de acesso não encontrado")
            user.role_id = role.id
        for field, value in changes.items():
            setattr(user, field, value)
        self.database.commit()
        self.database.refresh(user)
        return user

    def delete(self, user_id: uuid.UUID, current_user_id: uuid.UUID) -> None:
        if user_id == current_user_id:
            raise UserConflictError("Não é possível excluir o próprio usuário")
        user = self.repository.get_by_id(user_id)
        if user is None:
            raise UserNotFoundError("Usuário não encontrado")
        user.deleted_at = datetime.now(UTC)
        user.is_active = False
        self.database.commit()
