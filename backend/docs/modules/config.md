# Module: config.py

## Purpose
Centralized configuration via `pydantic-settings`. Loads environment variables for app metadata, database, Claude/AI options, admin secrets, and CORS.

## Key Components
- `Settings(BaseSettings)`: fields include `app_name`, `environment`, `claude_api_key`, `claude_model`, `database_url`, `admin_password`, `admin_token`, `allowed_origins`.
- `get_settings()`: `@lru_cache` accessor returning a single `Settings` instance per process.

## Behavior
- Reads `.env` with UTF-8 encoding.
- Parses `allowed_origins` as `*` or comma-separated list.
- Provides development defaults (SQLite, open CORS, demo admin credentials); override for staging/production.

## Interactions
- Used by `database.py` for the engine URL, `dependencies.py` for admin guard, `main.py` for CORS and metadata, and service loaders for AI config.
