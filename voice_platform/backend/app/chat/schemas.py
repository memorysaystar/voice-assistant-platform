from __future__ import annotations
from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    conversation_id: int | None = None
    model: str | None = None
    temperature: float | None = None
    max_tokens: int | None = None


class ChatResponse(BaseModel):
    response: str
    conversation_id: int
    message_id: int


class FunctionChatRequest(BaseModel):
    message: str
    conversation_id: int | None = None
    model: str | None = None


class ToolCallInfo(BaseModel):
    name: str
    args: dict
    result: str


class FunctionChatResponse(BaseModel):
    response: str
    tool_calls: list[ToolCallInfo]
    conversation_id: int
    message_id: int
