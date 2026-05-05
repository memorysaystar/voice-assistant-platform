from __future__ import annotations
from pydantic import BaseModel, EmailStr
from datetime import datetime


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    mimo_api_key: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UpdateProfileRequest(BaseModel):
    username: str | None = None
    email: str | None = None
    mimo_api_key: str | None = None
