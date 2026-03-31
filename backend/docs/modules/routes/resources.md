# Module: routes/resources.py

## Purpose
Provide location- and language-filtered support resources.

## Endpoint
### GET /resources
- Query params: `location` (required), `language` (default `en`).
- Response: `ResourceResponse` containing `resources: List[ResourceItem]`.

## Behavior
- Queries `Resource` records with case-insensitive match on `location`.
- When no DB results, returns a small embedded fallback list to avoid empty responses.
- Language is passed through to the fallback entries.

## Interactions
- Depends on `get_db` for DB access.
- Uses ORM model `Resource` and schemas `ResourceItem`/`ResourceResponse`.
