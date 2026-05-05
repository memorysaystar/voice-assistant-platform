from __future__ import annotations
from pydantic import BaseModel
from datetime import datetime


class ConversationCreate(BaseModel):
    title: str | None = None
    system_prompt: str | None = None
    model: str | None = None


class ConversationUpdate(BaseModel):
    title: str | None = None
    system_prompt: str | None = None
    model: str | None = None


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str | None
    tool_calls: list | None
    audio_url: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: int
    title: str
    model: str
    system_prompt: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    class Config:
        from_attributes = True


class ConversationDetailResponse(ConversationResponse):
    messages: list[MessageResponse] = []
