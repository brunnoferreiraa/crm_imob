from enum import StrEnum


class RoleSlug(StrEnum):
    ADMIN = "administrador"
    MANAGER = "gerente"
    BROKER = "corretor"


class Permission(StrEnum):
    USERS_MANAGE = "users:manage"
    TEAM_VIEW = "team:view"
    LEADS_VIEW_ALL = "leads:view_all"
    LEADS_MANAGE_OWN = "leads:manage_own"
    LEADS_ASSIGN = "leads:assign"
    PROPERTIES_VIEW_ALL = "properties:view_all"
    PROPERTIES_MANAGE = "properties:manage"
    DEALS_VIEW_ALL = "deals:view_all"
    DEALS_MANAGE_OWN = "deals:manage_own"
    INTERACTIONS_CREATE = "interactions:create"
    VISITS_MANAGE_OWN = "visits:manage_own"
    TASKS_MANAGE_OWN = "tasks:manage_own"
    REPORTS_VIEW_ALL = "reports:view_all"
    REPORTS_VIEW_TEAM = "reports:view_team"
    SETTINGS_MANAGE = "settings:manage"


ROLE_PERMISSIONS: dict[RoleSlug, frozenset[Permission]] = {
    RoleSlug.ADMIN: frozenset(Permission),
    RoleSlug.MANAGER: frozenset(
        {
            Permission.TEAM_VIEW,
            Permission.LEADS_VIEW_ALL,
            Permission.LEADS_ASSIGN,
            Permission.PROPERTIES_VIEW_ALL,
            Permission.DEALS_VIEW_ALL,
            Permission.REPORTS_VIEW_TEAM,
        }
    ),
    RoleSlug.BROKER: frozenset(
        {
            Permission.LEADS_MANAGE_OWN,
            Permission.PROPERTIES_VIEW_ALL,
            Permission.DEALS_MANAGE_OWN,
            Permission.INTERACTIONS_CREATE,
            Permission.VISITS_MANAGE_OWN,
            Permission.TASKS_MANAGE_OWN,
        }
    ),
}
