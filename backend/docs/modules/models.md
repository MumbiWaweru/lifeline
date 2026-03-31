# Module: models.py

## Purpose
Define SQLAlchemy ORM models for conversations, messages, resources, alerts, and counsellor workflows.

## Models
### Conversation
- `id` (UUID PK)
- `session_id` (String(64), unique, indexed): client session key
- `language` (String(4), default `"en"`)
- `risk_level` (String(10), default `"green"`)
- `flagged` (Boolean, default `False`, not null): set when risk is red
- `created_at` (DateTime, tz-aware, default `datetime.utcnow`)
- Relationship: `messages` one-to-many

### Message
- `id` (UUID PK)
- `conversation_id` (UUID FK -> conversations.id, CASCADE)
- `sender` (String(16)): `"user"` or `"assistant"`
- `content` (Text)
- `created_at` (DateTime, tz-aware, default `datetime.utcnow`)
- Relationship: `conversation` many-to-one

### Resource
- `id` (UUID PK)
- `name` (String(255))
- `number` (String(64))
- `type` (String(64))
- `location` (String(128), indexed)
- `language` (String(4), default `"en"`)
- `created_at` (DateTime, tz-aware, default `datetime.utcnow`)
- Constraint: unique (`name`, `location`) via `uq_resource_name_location`

### Alert
- `id` (UUID PK)
- `session_id` (String(64), indexed)
- `risk_level` (String(10)) — red in current logic
- `message_preview` (String(200), nullable)
- `created_at` (DateTime, tz-aware, default `datetime.utcnow`)

### Counsellor
- `id` (UUID PK)
- `name` (String(100))
- `email` (String(100), unique)
- `phone` (String(20), nullable)
- `is_available` (Boolean, default `True`)
- `created_at` (DateTime, tz-aware, default `datetime.utcnow`)
- Relationship: `requests` one-to-many

### CounsellorRequest
- `id` (UUID PK)
- `session_id` (String(64), indexed)
- `counsellor_id` (UUID FK -> counsellors.id)
- `status` (String(20), default `"pending"`)
- `created_at` (DateTime, tz-aware, default `datetime.utcnow`)
- `assigned_at` (DateTime, tz-aware, nullable)
- Relationship: `counsellor` many-to-one

## Interactions
- `chat` writes conversations/messages and creates alerts on red risk.
- `resources` reads `Resource` for location-based listings.
- `admin` reads conversations, stats, and alerts.
- `counsellors` routes manage `Counsellor` and `CounsellorRequest` records.
