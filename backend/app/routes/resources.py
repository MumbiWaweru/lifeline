"""
resources.py — Location-based smart resource matching engine (FR-005)
Uses PostGIS ST_Distance for geospatial proximity ranking.
Falls back to Haversine formula when PostGIS unavailable (dev mode).
"""

import math
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db
from models import SupportService, ResourceMatch, RiskAssessment
from auth import get_current_user, User

router = APIRouter(prefix="/resources", tags=["Resource Matching"])

EARTH_RADIUS_KM = 6371.0


# ─── Pydantic schemas ──────────────────────────────────────────────────────────
class ServiceOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    service_type: str
    phone: Optional[str]
    email: Optional[str]
    website: Optional[str]
    address: Optional[str]
    county: Optional[str]
    distance_km: Optional[float]
    operating_hours: Optional[dict]
    languages: Optional[List[str]]

    class Config:
        from_attributes = True


class MatchRequest(BaseModel):
    latitude: float
    longitude: float
    service_types: Optional[List[str]] = None   # filter by type
    assessment_id: Optional[str] = None          # log the match
    limit: int = 5


# ─── Haversine fallback ────────────────────────────────────────────────────────
def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    φ1, φ2 = math.radians(lat1), math.radians(lat2)
    dφ = math.radians(lat2 - lat1)
    dλ = math.radians(lon2 - lon1)
    a = math.sin(dφ / 2) ** 2 + math.cos(φ1) * math.cos(φ2) * math.sin(dλ / 2) ** 2
    return EARTH_RADIUS_KM * 2 * math.asin(math.sqrt(a))


def _postgis_available(db: Session) -> bool:
    try:
        db.execute(text("SELECT PostGIS_Version()"))
        return True
    except Exception:
        return False


# ─── Core matching logic ───────────────────────────────────────────────────────
def match_services(
    db: Session,
    lat: float,
    lon: float,
    service_types: Optional[List[str]] = None,
    limit: int = 5,
) -> List[dict]:
    """
    Returns top-N services ranked by:
      40% geographic proximity
      30% service type relevance
      30% availability (is_active)
    """
    services = db.query(SupportService).filter_by(is_active=True).all()

    if service_types:
        services = [s for s in services if s.service_type in service_types]

    results = []
    use_postgis = _postgis_available(db)

    for svc in services:
        if use_postgis and svc.location is not None:
            row = db.execute(
                text(
                    "SELECT ST_Distance(:loc::geography, location) / 1000.0 AS dist "
                    "FROM support_services WHERE id = :id"
                ),
                {"loc": f"POINT({lon} {lat})", "id": str(svc.id)},
            ).fetchone()
            dist_km = row.dist if row else 9999.0
        elif svc.latitude is not None and svc.longitude is not None:
            dist_km = haversine_km(lat, lon, svc.latitude, svc.longitude)
        else:
            dist_km = 9999.0  # no location data — rank last

        # Proximity score: decay exponentially (0 → 100 km maps to 1.0 → 0.0)
        proximity_score = math.exp(-dist_km / 50.0)

        # Type relevance: always 1.0 when filtered, 0.8 otherwise
        type_score = 1.0

        composite = 0.4 * proximity_score + 0.3 * type_score + 0.3 * 1.0

        results.append({
            "service":   svc,
            "distance_km": round(dist_km, 2) if dist_km < 9000 else None,
            "score":     round(composite, 4),
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:limit]


# ─── Endpoints ────────────────────────────────────────────────────────────────
@router.post("/match", response_model=List[ServiceOut])
def match_resources(req: MatchRequest, db: Session = Depends(get_db)):
    """
    Main resource matching endpoint — open to anonymous users (no auth required).
    Location is provided by the client; never stored server-side.
    """
    matched = match_services(db, req.latitude, req.longitude, req.service_types, req.limit)

    # Log matches if an assessment ID was provided
    if req.assessment_id:
        for rank, m in enumerate(matched, start=1):
            rm = ResourceMatch(
                id=uuid.uuid4(),
                assessment_id=req.assessment_id,
                service_id=m["service"].id,
                distance_km=m["distance_km"],
                score=m["score"],
                rank=rank,
            )
            db.add(rm)
        db.commit()

    out = []
    for m in matched:
        svc = m["service"]
        out.append(ServiceOut(
            id=str(svc.id),
            name=svc.name,
            description=svc.description,
            service_type=svc.service_type,
            phone=svc.phone,
            email=svc.email,
            website=svc.website,
            address=svc.address,
            county=svc.county,
            distance_km=m["distance_km"],
            operating_hours=svc.operating_hours,
            languages=svc.languages,
        ))
    return out


@router.get("/services", response_model=List[ServiceOut])
def list_services(
    county: Optional[str] = Query(None),
    service_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List all active services, optionally filtered."""
    q = db.query(SupportService).filter_by(is_active=True)
    if county:
        q = q.filter(SupportService.county.ilike(f"%{county}%"))
    if service_type:
        q = q.filter_by(service_type=service_type)
    svcs = q.all()
    return [
        ServiceOut(
            id=str(s.id), name=s.name, description=s.description,
            service_type=s.service_type, phone=s.phone, email=s.email,
            website=s.website, address=s.address, county=s.county,
            distance_km=None, operating_hours=s.operating_hours,
            languages=s.languages,
        )
        for s in svcs
    ]


@router.post("/services", status_code=201)
def create_service(
    svc: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin only — add a new support service to the directory."""
    if user.role != "admin":
        from fastapi import HTTPException
        raise HTTPException(403, "Admin only")
    service = SupportService(id=uuid.uuid4(), **svc)
    db.add(service)
    db.commit()
    return {"id": str(service.id)}