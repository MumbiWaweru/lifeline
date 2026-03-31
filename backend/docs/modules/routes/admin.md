# Module: routes/admin.py

## Purpose
Provide admin functions for demo oversight: authentication token issuance, conversation listing, alerts feed, and risk stats.

## Endpoints
- `POST /admin/login`: check `ADMIN_PASSWORD`; returns `token` (or empty string on failure).
- `GET /admin/conversations`: list conversations with messages, newest first; optional `flagged_only` filter. Requires admin bearer token.
- `GET /admin/stats`: aggregate counts of risk levels, flagged conversations, and alert count. Requires admin bearer token.
- `GET /admin/alerts`: list alerts (red-risk events) newest first. Requires admin bearer token.

## Behavior
- Uses `require_admin` dependency for protected routes.
- Eager-loads messages with `selectinload` for efficient admin dashboard rendering.
- Builds response payloads with Pydantic schemas (`ConversationOut`, `ConversationMessage`, `ConversationsResponse`, `StatsResponse`, `AlertsResponse`).

## Interactions
- Depends on `get_db` for DB access.
- Relies on `get_settings` for admin credentials.
- Uses ORM models `Conversation` (with `messages`) and `Alert`.
