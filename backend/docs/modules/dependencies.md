# Module: dependencies.py

## Purpose
Provide reusable FastAPI dependencies for external services and admin protection.

## Key Components
- `get_chat_model()`: returns a `ClaudeClient` with `api_key=None` (enhanced rule-based stub). If an API key is provided in the future, the same client can call Claude.
- `require_admin()`: header-based check for `Authorization: Bearer <ADMIN_TOKEN>`; raises 401 otherwise.

## Behavior
- Uses `get_settings()` to read admin token and other envs.

## Interactions
- `routes/chat.py` depends on `get_chat_model`.
- Admin and counsellor admin routes use `require_admin` to guard access.
