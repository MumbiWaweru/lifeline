# Security and Access Controls

## Table of Contents
- [Authentication](#authentication)
- [Admin Protection](#admin-protection)
- [CORS](#cors)
- [Environment Variables and Secrets](#environment-variables-and-secrets)
- [Data Handling](#data-handling)
- [Future Hardening](#future-hardening)

## Authentication
- Admin login uses a static password from environment variables at `POST /admin/login`.
- On success, it returns a static bearer token (`ADMIN_TOKEN`); admin routes require `Authorization: Bearer <token>`.
- JWT helpers are available but not used yet; `app/routes/auth.py` is empty (placeholder for future JWT-based auth).

## Admin Protection
- Dependency `require_admin` checks the bearer token against `ADMIN_TOKEN` and returns 401 on mismatch/missing.
- Applied to `/admin/conversations`, `/admin/stats`, `/admin/alerts`, and counsellor admin endpoints under `/counsellors/admin/*`.

## CORS
- Configured via `ALLOWED_ORIGINS` environment variable; defaults to `*` for demo.
- Middleware allows all methods and headers; tighten in production.

## Environment Variables and Secrets
- `.env` controls database URL, Claude API key/model, admin password/token, allowed origins, environment label, and app name.
- Claude key is optional; when absent, the app uses the in-process rule-based stub (no network calls).
- Replace all defaults before any public demo.

## Data Handling
- Stored data: conversations, messages, alerts (red-only), counsellors, and counsellor requests.
- Identifiers: client-provided `session_id` is stored; no user names/PII are collected by design.
- Data is stored as plaintext in the database; rely on disk/database encryption if required at the deployment layer.
- Alerts are created for red risk to support escalation; consider access logging around these records.
- Quick exit / safety UX is handled in the frontend; no server-side state persists beyond stored conversations.

## Future Hardening
- Implement JWT-based auth with expiry/refresh; remove static bearer tokens.
- Hash/rotate admin credentials; store in a secret manager.
- Enforce origin/host allowlists; disable `*` CORS in production.
- Add rate limiting and audit logging, especially for alerts and admin actions.
- Introduce migrations (Alembic) and secrets management (e.g., Vault/KMS).
- Add application-level encryption or field-level masking if PII is introduced.
- Add content filtering/prompt safety when swapping in external LLMs.
