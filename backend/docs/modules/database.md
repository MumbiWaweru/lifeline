# Module: database.py

## Purpose
Configure the async SQLAlchemy engine, session factory, and declarative base.

## Key Components
- `engine`: async engine from `create_async_engine` using `settings.database_url`.
- `AsyncSessionLocal`: `async_sessionmaker` producing request-scoped `AsyncSession` instances.
- `Base`: declarative base for ORM models.
- `get_db()`: FastAPI dependency yielding an `AsyncSession` per request.

## Behavior
- Uses `future=True` engine config; `echo` disabled by default.
- Sessions do not expire on commit to keep objects usable post-commit.

## Interactions
- Models in `models.py` inherit from `Base`.
- Routes depend on `get_db` for DB access.
- `main.py` uses `engine`/`Base` to create tables at startup.
