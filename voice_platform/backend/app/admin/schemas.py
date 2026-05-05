from __future__ import annotations
from pydantic import BaseModel
from datetime import datetime


class UserListItem(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    conversation_count: int = 0
    usage_count: int = 0

    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    role: str | None = None
    is_active: bool | None = None


class AnalyticsOverview(BaseModel):
    total_users: int
    active_users: int
    total_conversations: int
    total_messages: int
    total_api_calls: int
    calls_today: int


class UsageByDay(BaseModel):
    date: str
    count: int


class UsageByAction(BaseModel):
    action: str
    count: int


class ConfigItem(BaseModel):
    key: str
    value: str
    description: str | None


class ConfigUpdateRequest(BaseModel):
    value: str
