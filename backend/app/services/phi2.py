import logging
import re
from typing import Dict, List

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

from .claude import ChatResult  # reuse the same result dataclass


logger = logging.getLogger(__name__)

class Phi2Model:
    def __init__(self):
        self.model_name = "microsoft/phi-2"
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Loading {self.model_name} on {self.device}...")
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name, trust_remote_code=True)
        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_name,
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            trust_remote_code=True
        ).to(self.device)
        self.model.eval()
        print("Model loaded.")

    def _build_prompt(self, message: str, language: str, history: List[Dict[str, str]]) -> str:
        """Construct a prompt that instructs phi-2 to act as GBV assistant and output JSON."""
        # Simple prompt template – you can refine
        system = f"""You are a compassionate AI assistant for a Gender-Based Violence (GBV) support platform in Kenya.
Analyze the user's message and return ONLY a JSON object with these fields:
- "reply": your supportive response (in {language})
- "risk_level": "green", "amber", or "red" based on danger
- "hotlines": list of {{"name": "...", "number": "...", "type": "hotline"}}

For red risk: emphasize immediate safety and suggest calling 1195.
For amber: provide safety planning tips.
For green: offer listening and general support.

Example response:
{{"reply": "I hear you. You are not alone.", "risk_level": "green", "hotlines": [{{"name": "GVRC", "number": "1195", "type": "hotline"}}]}}
"""
        # Build conversation context
        context = ""
        for msg in history[-3:]:  # last 3 exchanges
            context += f"{msg['role'].capitalize()}: {msg['content']}\n"
        context += f"User: {message}\nAssistant:"
        return system + "\n\n" + context

    async def generate(
        self,
        message: str,
        language: str,
        history: List[Dict[str, str]] = None,
        session_id: str | None = None,
    ) -> ChatResult:
        if history is None:
            history = []
        prompt = self._build_prompt(message, language, history)
        try:
            inputs = self.tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1024).to(self.device)
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=300,
                    temperature=0.7,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id
                )
            response_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        except Exception as exc:  # pragma: no cover - hardware/network dependent
            logger.exception("Phi-2 generation failed; returning safe fallback reply.")
            return ChatResult(
                reply="I'm here to support you. Please tell me more.",
                risk_level="green",
                hotlines=self._default_hotlines(),
            )
        # Extract JSON after "Assistant:" or the last line
        try:
            # Look for JSON block
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                import json
                data = json.loads(json_match.group())
                reply = data.get("reply", "I am here for you.")
                risk = data.get("risk_level", "green")
                hotlines = data.get("hotlines", [])
            else:
                # fallback
                reply = response_text.split("Assistant:")[-1].strip()
                risk = "green"
                hotlines = self._default_hotlines()
        except Exception:  # pragma: no cover - defensive parsing
            logger.exception("Phi-2 parsing failed; returning safe fallback reply.")
            reply = "I'm here to support you. Please tell me more."
            risk = "green"
            hotlines = self._default_hotlines()
        return ChatResult(reply=reply, risk_level=risk, hotlines=hotlines)

    def _default_hotlines(self):
        return [{"name": "GBV Helpline", "number": "1195", "type": "hotline"}]