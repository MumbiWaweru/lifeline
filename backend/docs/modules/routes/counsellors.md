# Module: routes/counsellors.py

## Purpose
Expose public and admin endpoints for counsellor discovery, requests, and management.

## Endpoints
- **Public**
  - `GET /counsellors`: list available counsellors (`is_available == True`).
  - `POST /counsellors/request`: create a counsellor request for a given `session_id` and `counsellor_id`; returns `CounsellorRequestOut`.
- **Admin (requires `Authorization: Bearer <ADMIN_TOKEN>` via `require_admin`)**
  - `POST /counsellors/admin/counsellors`: create counsellor (`CounsellorCreate`).
  - `GET /counsellors/admin/counsellors`: list all counsellors.
  - `DELETE /counsellors/admin/counsellors/{counsellor_id}`: delete counsellor.
  - `GET /counsellors/admin/requests`: list all requests with counsellor info.
  - `PATCH /counsellors/admin/requests/{request_id}?status=...`: update request status (`pending|assigned|resolved`); sets `assigned_at` when status becomes `assigned`.

## Behavior
- Uses async SQLAlchemy with `select` queries.
- Public request checks counsellor existence and availability; returns 404 if unavailable.
- Admin list uses `selectinload` to include counsellor details in requests.
- Creation routes generate UUIDs server-side; commit/refresh to return persisted entities.

## Interactions
- Depends on `get_db` for DB sessions.
- Uses `Counsellor` and `CounsellorRequest` ORM models and related Pydantic schemas.
- Shares the admin guard `require_admin` with other protected routes.
