"""Pydantic schemas for request/response bodies."""

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


Language = Literal["en", "sw"]
RiskLevel = Literal["green", "amber", "red"]


class Hotline(BaseModel):
	name: str
	number: str
	type: str = "hotline"


class ChatRequest(BaseModel):
	message: str = Field(..., description="User's message to the chatbot")
	language: Language = Field("en", description="Response language")
	session_id: str = Field(..., description="Client-generated session identifier")


class ChatResponse(BaseModel):
	reply: str
	risk_level: RiskLevel
	hotlines: List[Hotline]


class ResourceItem(BaseModel):
	name: str
	number: str
	type: str
	location: str
	language: Language

	class Config:
		from_attributes = True


class ResourceResponse(BaseModel):
	resources: List[ResourceItem]


class AdminLoginRequest(BaseModel):
	password: str


class AdminLoginResponse(BaseModel):
	token: str


class ConversationMessage(BaseModel):
	sender: str
	content: str
	timestamp: datetime

	class Config:
		from_attributes = True


class ConversationOut(BaseModel):
	session_id: str
	risk_level: RiskLevel
	language: Language
	timestamp: datetime
	messages: List[ConversationMessage]


class ConversationsResponse(BaseModel):
	conversations: List[ConversationOut]


class StatsResponse(BaseModel):
	total: int
	green: int
	amber: int
	red: int
