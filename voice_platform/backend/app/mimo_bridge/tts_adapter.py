from __future__ import annotations
import asyncio
import base64
import logging
import os
import tempfile

import requests as http_requests

from app.config import settings
from app.mimo_bridge.client import get_mimo_client

logger = logging.getLogger(__name__)


def _tts_request_sync(messages: list[dict], model: str, audio_config: dict, user_api_key: str | None = None) -> dict:
    """同步TTS请求（内部使用）"""
    """Sync TTS request (internal use)."""
    api_key = user_api_key or settings.mimo_api_key
    url = f"{settings.mimo_base_url}/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": model,
        "messages": messages,
        "audio": audio_config
    }
    response = http_requests.post(url, headers=headers, json=data, timeout=60)
    if response.status_code != 200:
        raise Exception(f"API错误 / API error: {response.status_code} - {response.text}")
    return response.json()


async def synthesize_speech(
    text: str,
    voice: str | None = None,
    style: str | None = None,
    user_api_key: str | None = None,
) -> bytes:
    """文字转语音，返回WAV字节"""
    """Text-to-speech, returns WAV bytes."""
    voice = voice or settings.mimo_tts_voice
    messages = [
        {"role": "user", "content": style or ""},
        {"role": "assistant", "content": text}
    ]

    logger.info("语音合成: 音色=%s, 文本长度=%d / synthesize_speech: voice=%s, text_len=%d", voice, len(text), voice, len(text))

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None, lambda: _tts_request_sync(messages, settings.mimo_tts_model, {"format": "wav", "voice": voice}, user_api_key)
    )
    audio_bytes = base64.b64decode(result["choices"][0]["message"]["audio"]["data"])
    logger.info("语音合成完成: %d字节 / synthesize_speech completed: %d bytes", len(audio_bytes), len(audio_bytes))
    return audio_bytes


async def clone_voice(
    audio_bytes: bytes,
    audio_filename: str,
    text: str,
    user_api_key: str | None = None,
) -> bytes:
    """语音克隆，返回WAV字节"""
    """Voice cloning, returns WAV bytes."""
    ext = os.path.splitext(audio_filename)[1].lower().lstrip(".")

    with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    original_tmp_path = tmp_path
    try:
        # MIMO 语音克隆 voice 字段只支持 wav 和 mp3
        # MIMO voice clone voice field only supports wav and mp3
        if ext not in ("mp3", "wav"):
            from app.mimo_bridge._audio_convert import convert_audio
            tmp_path = convert_audio(tmp_path, "wav")
            ext = "wav"

        with open(tmp_path, "rb") as f:
            voice_b64 = base64.b64encode(f.read()).decode("utf-8")

        mime_type = "audio/mpeg" if ext == "mp3" else "audio/wav"
        messages = [
            {"role": "user", "content": ""},
            {"role": "assistant", "content": text}
        ]

        logger.info("语音克隆: 文件名=%s, 文本长度=%d / clone_voice: filename=%s, text_len=%d", audio_filename, len(text), audio_filename, len(text))

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: _tts_request_sync(
                messages,
                "mimo-v2.5-tts-voiceclone",
                {"format": "wav", "voice": f"data:{mime_type};base64,{voice_b64}"},
                user_api_key,
            ),
        )
        audio_out = base64.b64decode(result["choices"][0]["message"]["audio"]["data"])
        logger.info("语音克隆完成: %d字节 / clone_voice completed: %d bytes", len(audio_out), len(audio_out))
        return audio_out
    finally:
        # 清理原始临时文件和转换后的文件
        # Clean up original temp file and converted file
        if original_tmp_path and os.path.exists(original_tmp_path):
            os.unlink(original_tmp_path)
        if tmp_path != original_tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


async def design_voice(
    voice_prompt: str,
    text: str,
    user_api_key: str | None = None,
) -> bytes:
    """音色设计，返回WAV字节"""
    """Voice design, returns WAV bytes."""
    messages = [
        {"role": "user", "content": voice_prompt},
        {"role": "assistant", "content": text}
    ]

    logger.info("音色设计: 描述=%s, 文本长度=%d / design_voice: prompt=%s, text_len=%d", voice_prompt[:50], len(text), voice_prompt[:50], len(text))

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        lambda: _tts_request_sync(messages, "mimo-v2.5-tts-voicedesign", {"format": "wav"}, user_api_key),
    )
    audio_bytes = base64.b64decode(result["choices"][0]["message"]["audio"]["data"])
    logger.info("音色设计完成: %d字节 / design_voice completed: %d bytes", len(audio_bytes), len(audio_bytes))
    return audio_bytes
