# Module: schemas.py

## Purpose
Pydantic v2 models for request and response validation.

## Key Schemas
- `Language`: Literal `"en" | "sw"`
- `RiskLevel`: Literal `"green" | "amber" | "red"`

### Chat
- `ChatRequest`: `message`, `language`, `session_id`.
- `ChatResponse`: `reply`, `risk_level`, `hotlines`.
- `Hotline`: `name`, `number`, `type`.

### Resources
- `ResourceItem`: resource fields, `from_attributes=True` for ORM mode.
- `ResourceResponse`: list wrapper.

### Admin
- `AdminLoginRequest`: `password`.
- `AdminLoginResponse`: `token`.
- `ConversationMessage`: `sender`, `content`, `timestamp`.
- `ConversationOut`: `session_id`, `risk_level`, `language`, `timestamp`, `messages`.
- `ConversationsResponse`: wrapper for list.
- `StatsResponse`: `total`, `green`, `amber`, `red`, `flagged`, `alerts`.

### Alerts
- `AlertOut`: `id`, `session_id`, `risk_level`, `message_preview`, `created_at` (ORM-friendly).
- `AlertsResponse`: wrapper for list of alerts.

### Counsellors
- `CounsellorBase`: `name`, `email`, `phone?`, `is_available`.
- `CounsellorCreate`: same as base.
- `CounsellorOut`: base + `id`, `created_at`.
- `CounsellorRequestCreate`: `counsellor_id`, `session_id`.
- `CounsellorRequestOut`: `id`, `session_id`, `counsellor_id`, `status`, `created_at`, `assigned_at?`, `counsellor` (nested `CounsellorOut`).

## Interactions
- Used by FastAPI `response_model` and request validation across routes.
- Aligns with SQLAlchemy models and AI outputs (risk levels, hotlines, alerts, counsellor data).
