# Module: routes/chat.py

## Purpose
Expose the chatbot API endpoint that stores conversations, invokes the AI model, and returns replies with risk assessments.

## Endpoint
### POST /chat
- Request: `ChatRequest` (`message`, `language`, `session_id`).
- Response: `ChatResponse` (`reply`, `risk_level`, `hotlines`).

## Behavior
- Upserts a `Conversation` by `session_id`; creates if missing.
- Persists the user `Message`, then calls the chat model (enhanced Claude stub by default).
- On model exception, falls back to the stub to keep responses flowing.
- Persists assistant `Message`, updates `conversation.risk_level`, and sets `flagged=True` when risk is red.
- When risk is red, inserts an `Alert` with `session_id`, `risk_level`, and `message_preview` (first 200 chars).
- Commits the transaction and returns the reply payload.

## Interactions
- Depends on `get_db` for DB session.
- Depends on `get_chat_model` (returns `ClaudeClient` stub unless replaced).
- Uses ORM models `Conversation`, `Message`, and `Alert`; schemas `ChatRequest`/`ChatResponse`.
