from __future__ import annotations
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database.connection import Base


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(10), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    mimo_api_key = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    usage_logs = relationship("UsageLog", back_populates="user", cascade="all, delete-orphan")
    voice_profiles = relationship("VoiceProfile", back_populates="user", cascade="all, delete-orphan")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), default="New Conversation")
    model = Column(String(50), default="mimo-v2.5-pro")
    system_prompt = Column(Text, default="你是小米MIMO智能助手，回答要简洁准确，乐于助人。")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="conversations")
    messages = relationship(
        "Message", back_populates="conversation", cascade="all, delete-orphan",
        order_by="Message.created_at"
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=True)
    tool_calls = Column(JSON, nullable=True)
    tool_call_id = Column(String(100), nullable=True)
    audio_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")


class VoiceProfile(Base):
    __tablename__ = "voice_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    voice_type = Column(String(20), nullable=False)
    voice_id = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    sample_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="voice_profiles")


class UsageLog(Base):
    __tablename__ = "usage_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String(50), nullable=False)
    model = Column(String(50), nullable=True)
    tokens_in = Column(Integer, default=0)
    tokens_out = Column(Integer, default=0)
    duration_ms = Column(Integer, default=0)
    success = Column(Boolean, default=True)
    error_msg = Column(Text, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="usage_logs")


class SystemConfig(Base):
    __tablename__ = "system_config"

    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(String(500), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
