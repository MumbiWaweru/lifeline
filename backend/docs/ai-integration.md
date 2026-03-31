# AI Integration

## Table of Contents
- [Overview](#overview)
- [Current Engine (Stub)](#current-engine-stub)
- [Risk Assessment Logic](#risk-assessment-logic)
- [Conversation Memory](#conversation-memory)
- [Hotlines](#hotlines)
- [Pluggable Design](#pluggable-design)
- [Error Handling](#error-handling)

## Overview
The backend currently ships with an **enhanced rule‑based stub** that avoids external calls for privacy, cost, and reliability. The AI layer is intentionally pluggable: any model exposing the same `generate(message, language, session_id)` coroutine can be swapped in (e.g., a local phi‑2 model or Claude API).

## Current Engine (Stub)
- Located in `app/services/claude.py` (`ClaudeClient`).
- Keyword and sentiment scoring sets `risk_level` to `green | amber | red`.
- Short-term conversation memory (rolling ~4 exchanges) personalizes replies and mirrors user content.
- Bilingual responses (English/Swahili) with varied openers, reflections, safety tips, and follow-ups.
- Always returns hotlines and a supportive reply, even on parsing errors.

## Risk Assessment Logic
- Weighted keywords: high-risk terms (e.g., `knife`, `kill`, `rape`, `bleeding`) add more points; medium-risk terms (e.g., `control`, `afraid`, `hurt`) add fewer.
- Sentiment check via TextBlob boosts risk when polarity is negative.
- Recent red responses in the session add a small risk boost.
- Thresholds: score ≥ 4 → `red`; ≥ 1 → `amber`; else `green`.
- On `red`, the chat endpoint flags the conversation and inserts an alert row.

## Conversation Memory
- Per-session rolling history is stored in memory inside the stub (last ~8 turns) to support reflections.
- All messages are persisted in the database (`messages` linked to `conversations`) for admin review.

## Hotlines
- Default hotlines returned by the stub: Gender Violence Recovery Centre (1195) and Kenya Police Emergency (999).
- These are always included to provide immediate, actionable options.

## Pluggable Design
- The dependency `get_chat_model()` returns a `ClaudeClient` instance; providing `CLAUDE_API_KEY` would enable real API calls using the same interface.
- A local LLM can be wired by implementing the same `generate()` signature. Example skeleton:
```python
class MyModel:
	async def generate(self, message: str, language: str, session_id: str | None = None):
		reply = run_local_model(message, language)
		return ChatResult(reply=reply, risk_level="green", hotlines=default_hotlines(language))

# In dependencies.py
def get_chat_model():
	return MyModel()
```
- `app/services/phi2.py` provides an experimental phi‑2 loader; it can be swapped in if the environment has the weights and compute.

## Error Handling
- Stub: fully in-process; never raises to the caller. Falls back to safe replies and default hotlines on any parse issue.
- Chat endpoint: wraps model errors and still returns a response; alerts and flags are only set when risk is `red`.
