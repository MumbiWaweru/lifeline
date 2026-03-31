# Database Schema

## Table of Contents
- [Overview](#overview)
- [Tables](#tables)
  - [conversations](#conversations)
  - [messages](#messages)
  - [resources](#resources)
  - [alerts](#alerts)
  - [counsellors](#counsellors)
  - [counsellor_requests](#counsellor_requests)
- [ER Diagram (text)](#er-diagram-text)
- [Indexes and Constraints](#indexes-and-constraints)

## Overview
The backend uses SQLAlchemy (async) with SQLite by default (configurable to PostgreSQL). Tables are created automatically on startup; UUIDs are used for primary keys. Seed data populates `resources` if empty.

## Tables

### conversations
- `id` (UUID, PK)
- `session_id` (String(64), unique, indexed): client-provided session identifier.
- `language` (String(4), default `"en"`)
- `risk_level` (String(10), default `"green"`): `green | amber | red`
- `flagged` (Boolean, default `False`, not null): set when risk is red
- `created_at` (DateTime, timezone-aware, default `datetime.utcnow`)
- Relationships: one-to-many `messages`

### messages
- `id` (UUID, PK)
- `conversation_id` (UUID, FK -> conversations.id, ondelete CASCADE)
- `sender` (String(16)): `"user"` or `"assistant"`
- `content` (Text)
- `created_at` (DateTime, timezone-aware, default `datetime.utcnow`)
- Relationships: many-to-one `conversation`

### resources
- `id` (UUID, PK)
- `name` (String(255))
- `number` (String(64))
- `type` (String(64)): e.g., hotline, shelter, legal
- `location` (String(128), indexed)
- `language` (String(4), default `"en"`)
- `created_at` (DateTime, timezone-aware, default `datetime.utcnow`)
- Constraints: unique (`name`, `location`)

### alerts
- `id` (UUID, PK)
- `session_id` (String(64), indexed)
- `risk_level` (String(10)) — always `"red"` in current logic
- `message_preview` (String(200), nullable)
- `created_at` (DateTime, timezone-aware, default `datetime.utcnow`)

### counsellors
- `id` (UUID, PK)
- `name` (String(100))
- `email` (String(100), unique)
- `phone` (String(20), nullable)
- `is_available` (Boolean, default `True`)
- `created_at` (DateTime, timezone-aware, default `datetime.utcnow`)
- Relationships: one-to-many `requests`

### counsellor_requests
- `id` (UUID, PK)
- `session_id` (String(64), indexed)
- `counsellor_id` (UUID, FK -> counsellors.id)
- `status` (String(20), default `"pending"`) — `pending | assigned | resolved`
- `created_at` (DateTime, timezone-aware, default `datetime.utcnow`)
- `assigned_at` (DateTime, timezone-aware, nullable)
- Relationships: many-to-one `counsellor`

## ER Diagram (text)
```
conversations (1) ──< messages (many)
conversations.id ── messages.conversation_id (FK, CASCADE)
conversations.session_id ── alerts.session_id (loose linkage, no FK)
counsellors (1) ──< counsellor_requests (many)
counsellors.id ── counsellor_requests.counsellor_id (FK)
resources is standalone
```

## Indexes and Constraints
- `conversations.session_id` unique + index
- `resources.location` index; unique constraint `uq_resource_name_location` on (`name`, `location`)
- `alerts.session_id` index
- `counsellor_requests.session_id` index
- FK `messages.conversation_id` cascade delete; FK `counsellor_requests.counsellor_id` ensures referential integrity
