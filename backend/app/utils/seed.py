from app.core.config import settings
from app.core.permissions import RoleSlug
from app.database.session import SessionLocal
from app.repositories.user import UserRepository
from app.schemas.user import UserCreate
from app.services.role import seed_roles
from app.services.user import UserService


def seed_initial_data() -> None:
    with SessionLocal() as database:
        seed_roles(database)

        if not all(
            (
                settings.initial_admin_name,
                settings.initial_admin_email,
                settings.initial_admin_password,
            )
        ):
            print("Perfis sincronizados; administrador inicial não configurado.")
            return

        repository = UserRepository(database)
        if repository.get_by_email(settings.initial_admin_email):
            print("Perfis sincronizados; administrador inicial já existe.")
            return

        UserService(database).create(
            UserCreate(
                full_name=settings.initial_admin_name,
                email=settings.initial_admin_email,
                password=settings.initial_admin_password,
                role_slug=RoleSlug.ADMIN,
            )
        )
        print("Perfis e administrador inicial criados.")


if __name__ == "__main__":
    seed_initial_data()
