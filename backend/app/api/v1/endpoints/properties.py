import uuid
from decimal import Decimal
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.permissions import Permission
from app.database.session import get_db
from app.dependencies.auth import CurrentUser, require_permission
from app.models.property import PropertyImage
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.property import (
    ImageOrderRequest,
    OwnerCreate,
    OwnerResponse,
    OwnerUpdate,
    PropertyCreate,
    PropertyImageResponse,
    PropertyResponse,
    PropertyUpdate,
)
from app.services.property import (
    OwnerService,
    PropertyService,
    RealEstateConflictError,
)

router = APIRouter(tags=["Proprietários e imóveis"])
DB = Annotated[Session, Depends(get_db)]
Manager = Annotated[User, Depends(require_permission(Permission.PROPERTIES_MANAGE))]
UPLOADS = Path("uploads/properties")
UPLOADS.mkdir(parents=True, exist_ok=True)


def fail(error: ValueError) -> None:
    raise HTTPException(
        status_code=409 if isinstance(error, RealEstateConflictError) else 404,
        detail=str(error),
    ) from error


@router.get("/owners", response_model=list[OwnerResponse])
def owners(database: DB, _: CurrentUser, search: str | None = None):
    return OwnerService(database).list(search)


@router.post("/owners", response_model=OwnerResponse, status_code=201)
def create_owner(data: OwnerCreate, database: DB, _: Manager):
    try:
        return OwnerService(database).create(data)
    except ValueError as error:
        fail(error)


@router.get("/owners/{owner_id}", response_model=OwnerResponse)
def owner(owner_id: uuid.UUID, database: DB, _: CurrentUser):
    try:
        return OwnerService(database).get(owner_id)
    except ValueError as error:
        fail(error)


@router.patch("/owners/{owner_id}", response_model=OwnerResponse)
def update_owner(owner_id: uuid.UUID, data: OwnerUpdate, database: DB, _: Manager):
    try:
        return OwnerService(database).update(owner_id, data)
    except ValueError as error:
        fail(error)


@router.delete("/owners/{owner_id}", response_model=MessageResponse)
def delete_owner(owner_id: uuid.UUID, database: DB, _: Manager):
    try:
        OwnerService(database).delete(owner_id)
        return MessageResponse(message="Proprietário excluído")
    except ValueError as error:
        fail(error)


@router.get("/properties")
def properties(
    database: DB,
    _: CurrentUser,
    search: str | None = None,
    purpose: str | None = None,
    property_type: str | None = None,
    city: str | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    bedrooms: int | None = None,
    available: bool | None = None,
    featured: bool | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    items, total = PropertyService(database, _).list(
        search=search,
        purpose=purpose,
        property_type=property_type,
        city=city,
        min_price=min_price,
        max_price=max_price,
        bedrooms=bedrooms,
        available=available,
        featured=featured,
        offset=(page - 1) * page_size,
        limit=page_size,
    )
    return {
        "items": [PropertyResponse.model_validate(item) for item in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/properties", response_model=PropertyResponse, status_code=201)
def create_property(data: PropertyCreate, database: DB, current: Manager):
    try:
        return PropertyService(database, current).create(data)
    except ValueError as error:
        fail(error)


@router.get("/properties/{property_id}", response_model=PropertyResponse)
def property_detail(property_id: uuid.UUID, database: DB, current: CurrentUser):
    try:
        return PropertyService(database, current).get(property_id)
    except ValueError as error:
        fail(error)


@router.patch("/properties/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: uuid.UUID, data: PropertyUpdate, database: DB, current: Manager
):
    try:
        return PropertyService(database, current).update(property_id, data)
    except ValueError as error:
        fail(error)


@router.delete("/properties/{property_id}", response_model=MessageResponse)
def delete_property(property_id: uuid.UUID, database: DB, current: Manager):
    try:
        PropertyService(database, current).delete(property_id)
        return MessageResponse(message="Imóvel excluído")
    except ValueError as error:
        fail(error)


@router.post(
    "/properties/{property_id}/images",
    response_model=PropertyImageResponse,
    status_code=201,
)
async def upload_image(
    property_id: uuid.UUID,
    database: DB,
    current: Manager,
    file: Annotated[UploadFile, File()],
):
    item = PropertyService(database, current).get(property_id)
    content = await file.read(10 * 1024 * 1024 + 1)
    signatures = {
        "image/jpeg": (b"\xff\xd8\xff",),
        "image/png": (b"\x89PNG\r\n\x1a\n",),
        "image/webp": (b"RIFF",),
    }
    if file.content_type not in signatures or not content.startswith(
        signatures.get(file.content_type, ())
    ):
        raise HTTPException(415, "Imagem inválida; use JPEG, PNG ou WebP")
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(413, "Imagem excede 10 MB")
    suffix = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}[
        file.content_type
    ]
    name = f"{uuid.uuid4()}{suffix}"
    path = UPLOADS / name
    path.write_bytes(content)
    image = PropertyImage(
        property_id=item.id,
        file_name=file.filename or name,
        storage_path=str(path),
        content_type=file.content_type,
        size=len(content),
        position=len(item.images),
        is_primary=not item.images,
    )
    database.add(image)
    database.commit()
    database.refresh(image)
    return image


@router.get("/properties/{property_id}/images/{image_id}")
def image_file(
    property_id: uuid.UUID, image_id: uuid.UUID, database: DB, _: CurrentUser
):
    image = database.scalar(
        select(PropertyImage).where(
            PropertyImage.id == image_id, PropertyImage.property_id == property_id
        )
    )
    if not image or not Path(image.storage_path).is_file():
        raise HTTPException(404, "Imagem não encontrada")
    return FileResponse(
        image.storage_path, media_type=image.content_type, filename=image.file_name
    )


@router.put(
    "/properties/{property_id}/images/order", response_model=list[PropertyImageResponse]
)
def order_images(
    property_id: uuid.UUID, data: ImageOrderRequest, database: DB, current: Manager
):
    PropertyService(database, current).get(property_id)
    for entry in data.images:
        database.execute(
            update(PropertyImage)
            .where(
                PropertyImage.id == entry.id, PropertyImage.property_id == property_id
            )
            .values(position=entry.position, is_primary=entry.id == data.primary_id)
        )
    database.commit()
    return list(
        database.scalars(
            select(PropertyImage)
            .where(PropertyImage.property_id == property_id)
            .order_by(PropertyImage.position)
        )
    )


@router.delete(
    "/properties/{property_id}/images/{image_id}", response_model=MessageResponse
)
def delete_image(
    property_id: uuid.UUID, image_id: uuid.UUID, database: DB, current: Manager
):
    PropertyService(database, current).get(property_id)
    image = database.scalar(
        select(PropertyImage).where(
            PropertyImage.id == image_id, PropertyImage.property_id == property_id
        )
    )
    if not image:
        raise HTTPException(404, "Imagem não encontrada")
    path = Path(image.storage_path)
    database.delete(image)
    database.flush()
    remaining = list(
        database.scalars(
            select(PropertyImage)
            .where(PropertyImage.property_id == property_id)
            .order_by(PropertyImage.position)
        )
    )
    for position, item in enumerate(remaining):
        item.position = position
        item.is_primary = position == 0 if image.is_primary else item.is_primary
    database.commit()
    if path.is_file():
        path.unlink()
    return MessageResponse(message="Imagem excluída")
