"""Endpoints for counsellor discovery and requests."""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..dependencies import require_admin
from ..models import Counsellor, CounsellorRequest
from ..schemas import (
    CounsellorCreate,
    CounsellorOut,
    CounsellorRequestCreate,
    CounsellorRequestOut,
)


router = APIRouter(prefix="/counsellors", tags=["counsellors"])


# Public: list available counsellors (minimal info)
@router.get("/", response_model=list[CounsellorOut])
async def list_counsellors(db: AsyncSession = Depends(get_db)):
    stmt = select(Counsellor).where(Counsellor.is_available == True)  # noqa: E712
    result = await db.execute(stmt)
    return result.scalars().all()


# Public: request a counsellor (anonymous)
@router.post("/request", response_model=CounsellorRequestOut)
async def request_counsellor(req: CounsellorRequestCreate, db: AsyncSession = Depends(get_db)):
    counsellor = await db.get(Counsellor, req.counsellor_id)
    if not counsellor or not counsellor.is_available:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Counsellor not available")

    new_request = CounsellorRequest(
        id=uuid.uuid4(),
        session_id=req.session_id,
        counsellor_id=req.counsellor_id,
    )
    db.add(new_request)
    await db.commit()
    await db.refresh(new_request, attribute_names=["counsellor"])
    return new_request


# Admin: list all requests (protected)
@router.get(
    "/admin/requests",
    response_model=list[CounsellorRequestOut],
    dependencies=[Depends(require_admin)],
)
async def list_requests(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(CounsellorRequest)
        .options(selectinload(CounsellorRequest.counsellor))
        .order_by(CounsellorRequest.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


# Admin: update request status (assign, resolve)
@router.patch(
    "/admin/requests/{request_id}",
    dependencies=[Depends(require_admin)],
)
async def update_request(request_id: uuid.UUID, status: str, db: AsyncSession = Depends(get_db)):
    req = await db.get(CounsellorRequest, request_id)
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    req.status = status
    if status == "assigned":
        req.assigned_at = datetime.utcnow()
    await db.commit()
    await db.refresh(req)
    return {"message": "updated"}


# Admin: manage counsellors (CRUD)
@router.post(
    "/admin/counsellors",
    response_model=CounsellorOut,
    dependencies=[Depends(require_admin)],
)
async def create_counsellor(counsellor: CounsellorCreate, db: AsyncSession = Depends(get_db)):
    db_counsellor = Counsellor(**counsellor.model_dump(), id=uuid.uuid4())
    db.add(db_counsellor)
    await db.commit()
    await db.refresh(db_counsellor)
    return db_counsellor


@router.get(
    "/admin/counsellors",
    response_model=list[CounsellorOut],
    dependencies=[Depends(require_admin)],
)
async def list_all_counsellors(db: AsyncSession = Depends(get_db)):
    stmt = select(Counsellor).order_by(Counsellor.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.delete(
    "/admin/counsellors/{counsellor_id}",
    dependencies=[Depends(require_admin)],
)
async def delete_counsellor(counsellor_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    counsellor = await db.get(Counsellor, counsellor_id)
    if not counsellor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Counsellor not found")

    await db.delete(counsellor)
    await db.commit()
    return {"message": "deleted"}
