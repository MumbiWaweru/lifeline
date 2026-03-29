"""Claude API client wrapper for risk assessment and replies."""

import json
from dataclasses import dataclass
from typing import Any, Dict, List

import httpx


@dataclass
class ChatResult:
	reply: str
	risk_level: str
	hotlines: List[Dict[str, str]]


class ClaudeClient:
	def __init__(self, api_key: str | None, model: str) -> None:
		self.api_key = api_key
		self.model = model
		self.base_url = "https://api.anthropic.com/v1/messages"

	def _system_prompt(self, language: str) -> str:
		# Instruct Claude to return strict JSON to keep the frontend simple.
		return (
			"You are a trauma-informed GBV support bot for Kenya. "
			"Respond concisely and compassionately in the user's language. "
			"Analyze the message and return JSON with keys reply (string), risk_level (green|amber|red), "
			"and hotlines (array of {name, number, type}). "
			"Avoid extra text outside JSON. Keep advice practical and safety-first. Language: "
			f"{language}."
		)

	async def generate(self, message: str, language: str) -> ChatResult:
		# If no API key is configured, fall back to a deterministic stub to keep the demo working offline.
		if not self.api_key:
			return self._stub_response(message, language)

		payload: Dict[str, Any] = {
			"model": self.model,
			"max_tokens": 400,
			"system": self._system_prompt(language),
			"messages": [{"role": "user", "content": message}],
		}

		headers = {
			"x-api-key": self.api_key,
			"anthropic-version": "2023-06-01",
			"content-type": "application/json",
		}

		async with httpx.AsyncClient(timeout=20) as client:
			response = await client.post(self.base_url, headers=headers, json=payload)
			response.raise_for_status()
			data = response.json()

		# The Claude message content is an array of content blocks; we expect a JSON string in the first text block.
		content_blocks = data.get("content", [])
		if content_blocks and isinstance(content_blocks[0], dict):
			text = content_blocks[0].get("text", "{}")
		else:
			text = "{}"

		return self._parse_json_response(text, language)

	def _parse_json_response(self, text: str, language: str) -> ChatResult:
		try:
			parsed = json.loads(text)
			reply = parsed.get("reply") or "I am here to support you."
			risk_level = parsed.get("risk_level") or "green"
			hotlines = parsed.get("hotlines") or self._default_hotlines(language)
		except json.JSONDecodeError:
			# If Claude returns non-JSON, degrade gracefully.
			reply = text or "I am here to support you."
			risk_level = "amber" if self._looks_urgent(text) else "green"
			hotlines = self._default_hotlines(language)
		return ChatResult(reply=reply, risk_level=risk_level, hotlines=hotlines)

	def _default_hotlines(self, language: str) -> List[Dict[str, str]]:
		# Basic Kenyan hotlines for immediate display
		return [
			{
				"name": "Gender Violence Recovery Centre",
				"number": "1195",
				"type": "hotline",
			},
			{
				"name": "Kenya Police Emergency",
				"number": "999",
				"type": "emergency",
			},
		]

	def _looks_urgent(self, text: str) -> bool:
		lower = text.lower()
		return any(word in lower for word in ["danger", "hurt", "threat", "violence"])

	def _stub_response(self, message: str, language: str) -> ChatResult:
		# Simple heuristic for offline demo/testing.
		urgent = self._looks_urgent(message)
		risk = "red" if urgent else "amber" if "afraid" in message.lower() else "green"
		reply = (
			"Nimekupata, niko hapa kukusaidia. "
			if language == "sw"
			else "I hear you. I'm here to help."
		)
		reply += " If you feel unsafe right now, move to a safe place and call 1195."
		return ChatResult(reply=reply, risk_level=risk, hotlines=self._default_hotlines(language))
