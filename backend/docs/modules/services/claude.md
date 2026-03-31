# Module: services/claude.py

## Purpose
Client wrapper for Anthropic Claude with an **enhanced rule-based stub** for offline/demo use. The stub is the default engine (no external calls) but the same interface can call Claude with an API key.

## Key Components
- `ChatResult` dataclass: `reply`, `risk_level`, `hotlines`.
- `ClaudeClient` class:
  - `generate(message, language, session_id=None)`: calls Claude API when `api_key` is set; otherwise uses `_enhanced_stub`.
  - `_enhanced_stub`: keyword/sentiment risk scoring, per-session memory (rolling), bilingual replies, safety tips, and contextual reflections.
  - `_system_prompt(language)`: used only when calling the real API; enforces JSON reply.
  - `_parse_json_response`: parses Claude API text; falls back to heuristics on errors.
  - `_default_hotlines`: Kenyan emergency contacts (GVRC 1195, Police 999).
  - `_stub_response`: alias to `_enhanced_stub` for backward compatibility.

## Behavior
- Default path uses the stub (no network). If `api_key` starts with `sk-`, the real API is called.
- Risk scoring uses weighted keywords (high/medium), sentiment via TextBlob, and recent red turns to set `green | amber | red`.
- Memory keeps ~4 exchanges per session for more personal reflections.
- Replies are assembled from openers, reflections, body guidance, safety tips, and follow-up questions in English or Swahili.
- Always returns hotlines; never raises to caller.

## Interactions
- Returned by `get_chat_model` dependency; used directly by `/chat`.
- Can be swapped with any model exposing the same `generate` signature.
