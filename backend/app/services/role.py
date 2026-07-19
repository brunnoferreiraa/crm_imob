from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.permissions import ROLE_PERMISSIONS, RoleSlug
from app.models.role import Role


ROLE_NAMES = {
    RoleSlug.ADMIN: "Administrador",
    RoleSlug.MANAGER: "Gerente",
    RoleSlug.BROKER: "Corretor",
}


def seed_roles(database: Session) -> list[Role]:
    roles: list[Role] = []
    for slug, permissions in ROLE_PERMISSIONS.items():
        role = database.scalar(select(Role).where(Role.slug == slug.value))
        permission_values = sorted(permission.value for permission in permissions)
        if role is None:
            role = Role(
                name=ROLE_NAMES[slug],
                slug=slug.value,
                permissions=permission_values,
            )
            database.add(role)
        else:
            role.name = ROLE_NAMES[slug]
            role.permissions = permission_values
        roles.append(role)
    database.commit()
    return roles
