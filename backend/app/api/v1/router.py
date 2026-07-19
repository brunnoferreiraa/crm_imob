from fastapi import APIRouter

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.activities import router as activities_router
from app.api.v1.endpoints.analytics import router as analytics_router
from app.api.v1.endpoints.clients import router as clients_router
from app.api.v1.endpoints.deals import router as deals_router
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.properties import router as properties_router
from app.api.v1.endpoints.users import router as users_router


api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(activities_router)
api_router.include_router(analytics_router)
api_router.include_router(clients_router)
api_router.include_router(deals_router)
api_router.include_router(health_router)
api_router.include_router(properties_router)
api_router.include_router(users_router)
