# Module: services/phi2.py

## Purpose
Experimental local chat model using Microsoft Phi-2 via Hugging Face Transformers. Not wired by default; can replace the stub if the environment has weights/compute.

## Key Components
- `Phi2Model` class:
  - Loads tokenizer/model (`microsoft/phi-2`) to CPU or CUDA.
  - `_build_prompt(message, language, history)`: JSON-only instruction with example output; includes last 3 exchanges when provided.
  - `generate(message, language, history=None)`: tokenizes prompt, generates text, extracts JSON, and returns `ChatResult`.
  - `_default_hotlines()`: minimal hotline list for fallback.

## Behavior
- On generation or parse failure, returns a safe fallback reply with `green` risk and default hotlines.
- Expects the model to emit `reply`, `risk_level`, and `hotlines` JSON.

## Interactions
- Currently unused by the dependency injector; to enable, swap `get_chat_model()` to return `Phi2Model()`.
- Shares `ChatResult` with the Claude stub so the `/chat` route can remain unchanged.

## Requirements
- `transformers`, `torch`; optional CUDA for performance. CPU is slower but viable for small tests.
