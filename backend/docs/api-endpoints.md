# API Endpoints

## Table of Contents
- [Chat](#chat)
- [Resources](#resources)
- [Counsellors](#counsellors)
- [Admin](#admin)
- [Auth](#auth)
- [Health](#health)

---

## Chat
### POST /chat
- **Description:** Send a user message, store it, run risk scoring, and return reply + risk + hotlines. Creates an alert when risk is `red`.
- **Request body** (`ChatRequest`):
```json
{
  "message": "He threatened me with a knife",
  "language": "en",
  "session_id": "abc-123"
}
```
- **Response** (`ChatResponse`):
```json
{
  "reply": "I'm here with you...",
  "risk_level": "red",
  "hotlines": [
    {"name": "Gender Violence Recovery Centre", "number": "1195", "type": "hotline"},
    {"name": "Kenya Police Emergency", "number": "999", "type": "emergency"}
  ]
}
```
- **Behavior:**
  - Upserts conversation by `session_id`; stores user + assistant messages.
  - Updates conversation `risk_level`; sets `flagged` on red and inserts an `alert` (message preview).
  - Uses the enhanced rule‑based stub (`ClaudeClient`) by default; can be swapped for a real LLM with the same `generate()` signature.
- **Status codes:** `200 OK`.

## Resources
### GET /resources
- **Description:** Fetch resources filtered by location (case-insensitive) and language.
- **Query params:**
  - `location` (required)
  - `language` (default `en`): `en` or `sw`
- **Response** (`ResourceResponse`):
```json
{
  "resources": [
    {
      "name": "GVRC Nairobi",
      "number": "1195",
      "type": "hotline",
      "location": "Nairobi",
      "language": "en"
    }
  ]
}
```
- **Behavior:** Falls back to a small embedded list when no DB matches.
- **Status codes:** `200 OK`.

## Counsellors
### GET /counsellors
- **Description:** Public list of available counsellors.
- **Response:** `list[CounsellorOut]` (id, name, email, phone, is_available, created_at)
- **Status codes:** `200 OK`.

### POST /counsellors/request
- **Description:** Public endpoint for a survivor to request a counsellor.
- **Request body** (`CounsellorRequestCreate`):
```json
{
  "counsellor_id": "<uuid>",
  "session_id": "abc-123"
}
```
- **Response** (`CounsellorRequestOut`): includes status (`pending` | `assigned` | `resolved`) and counsellor info.
- **Status codes:** `200 OK`, `404 Not Found` (counsellor unavailable).

### Admin counsellor management (requires `Authorization: Bearer <ADMIN_TOKEN>`)
- `POST /counsellors/admin/counsellors` — create counsellor (body: `CounsellorCreate`)
- `GET /counsellors/admin/counsellors` — list all counsellors
- `DELETE /counsellors/admin/counsellors/{counsellor_id}` — delete counsellor
- `GET /counsellors/admin/requests` — list all counsellor requests (with counsellor details)
- `PATCH /counsellors/admin/requests/{request_id}?status=assigned|resolved|pending` — update request status; sets `assigned_at` when `assigned`
- **Status codes:** `200 OK`, `401 Unauthorized`, `404 Not Found` (missing counsellor/request)

## Admin
All admin routes require `Authorization: Bearer <ADMIN_TOKEN>`; token is returned by `/admin/login`.

### POST /admin/login
- **Description:** Exchange admin password for a static bearer token.
- **Request:** `{ "password": "<ADMIN_PASSWORD>" }`
- **Response:** `{ "token": "<ADMIN_TOKEN>" }` (empty token if password wrong)
- **Status codes:** `200 OK` (client must check token value)

### GET /admin/conversations
- **Description:** List stored conversations with messages (newest first); optional `flagged_only` filter.
- **Query params:** `flagged_only` (bool, default `false`)
- **Response:** `ConversationsResponse`
- **Status codes:** `200 OK`, `401 Unauthorized`

### GET /admin/stats
- **Description:** Aggregate counts of total/green/amber/red/flagged conversations plus alert count.
- **Response:** `StatsResponse` with `alerts` field.
- **Status codes:** `200 OK`, `401 Unauthorized`

### GET /admin/alerts
- **Description:** List alerts ordered by newest first.
- **Response:** `AlertsResponse` (list of `AlertOut` with message previews).
- **Status codes:** `200 OK`, `401 Unauthorized`

## Auth
- `app/routes/auth.py` is currently empty (placeholder for future JWT or user accounts).

## Health
### GET /health
- **Description:** Liveness check.
- **Response:** `{ "status": "ok", "environment": "development" }`
- **Status codes:** `200 OK`
