from __future__ import annotations
from pydantic import BaseModel


class TTSRequest(BaseModel):
    text: str
    voice: str | None = None
    style: str | None = None


class VoiceDesignRequest(BaseModel):
    voice_prompt: str
    text: str


class VoiceInfo(BaseModel):
    name: str
    type: str
    description: str
