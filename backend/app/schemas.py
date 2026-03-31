"""Pydantic schemas for request/response bodies."""

from datetime import datetime
from typing import List, Literal, Optional
import uuid

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
	flagged: int
	alerts: int


# Alert schemas
class AlertOut(BaseModel):
	id: uuid.UUID
	session_id: str
	risk_level: str
	message_preview: Optional[str]
	created_at: datetime

	class Config:
		from_attributes = True


class AlertsResponse(BaseModel):
	alerts: List[AlertOut]


# Counsellor schemas
class CounsellorBase(BaseModel):
	name: str
	email: str
	phone: Optional[str] = None
	is_available: bool = True


class CounsellorCreate(CounsellorBase):
	pass


class CounsellorOut(CounsellorBase):
	id: uuid.UUID
	created_at: datetime

	class Config:
		from_attributes = True


class CounsellorRequestCreate(BaseModel):
	counsellor_id: uuid.UUID
	session_id: str


class CounsellorRequestOut(BaseModel):
	id: uuid.UUID
	session_id: str
	counsellor_id: uuid.UUID
	status: str
	created_at: datetime
	assigned_at: Optional[datetime]
	counsellor: CounsellorOut

	class Config:
		from_attributes = True
