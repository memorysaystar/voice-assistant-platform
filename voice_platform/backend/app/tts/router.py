from __future__ import annotations
import logging
import time
import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import User, UsageLog, VoiceProfile
from app.auth.dependencies import get_current_user
from app.tts.schemas import TTSRequest, VoiceDesignRequest, VoiceInfo
from app.mimo_bridge.tts_adapter import synthesize_speech, clone_voice, design_voice
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


def _log_usage(db: Session, user_id: int, action: str, model: str, duration_ms: int, success: bool, error_msg: str | None = None):
    db.add(UsageLog(user_id=user_id, action=action, model=model, duration_ms=duration_ms, success=success, error_msg=error_msg))
    db.commit()


@router.post("/synthesize")
async def tts_synthesize(
    req: TTSRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start = time.time()
    logger.info("TTS合成请求开始: 用户=%s(id=%d), 音色=%s / TTS synthesis started: user=%s(id=%d), voice=%s",
                current_user.username, current_user.id, req.voice, current_user.username, current_user.id, req.voice)
    try:
        audio_bytes = await synthesize_speech(
            text=req.text,
            voice=req.voice,
            style=req.style,
            user_api_key=current_user.mimo_api_key,
        )
        duration_ms = int((time.time() - start) * 1000)
        _log_usage(db, current_user.id, "tts", settings.mimo_tts_model, duration_ms, True)
        logger.info("TTS合成完成: 用户=%s(id=%d), 耗时=%dms / TTS synthesis completed: user=%s(id=%d), duration=%dms",
                     current_user.username, current_user.id, duration_ms, current_user.username, current_user.id, duration_ms)

        # 保存音频文件
        # Save audio file
        filename = f"tts_{uuid.uuid4().hex[:8]}.wav"
        filepath = os.path.join(settings.audio_output_dir, filename)
        with open(filepath, "wb") as f:
            f.write(audio_bytes)

        return Response(content=audio_bytes, media_type="audio/wav", headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        })
    except Exception as e:
        duration_ms = int((time.time() - start) * 1000)
        _log_usage(db, current_user.id, "tts", settings.mimo_tts_model, duration_ms, False, str(e))
        logger.exception("TTS合成失败: 用户=%s(id=%d), 耗时=%dms / TTS synthesis failed: user=%s(id=%d), duration=%dms",
                          current_user.username, current_user.id, duration_ms, current_user.username, current_user.id, duration_ms)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clone")
async def tts_clone(
    audio_file: UploadFile = File(...),
    text: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start = time.time()
    logger.info("语音克隆请求开始: 用户=%s(id=%d), 文件=%s / Voice clone started: user=%s(id=%d), file=%s",
                current_user.username, current_user.id, audio_file.filename, current_user.username, current_user.id, audio_file.filename)
    try:
        audio_bytes = await audio_file.read()
        result_bytes = await clone_voice(
            audio_bytes=audio_bytes,
            audio_filename=audio_file.filename or "audio.wav",
            text=text,
            user_api_key=current_user.mimo_api_key,
        )
        duration_ms = int((time.time() - start) * 1000)
        _log_usage(db, current_user.id, "clone", "mimo-v2.5-tts-voiceclone", duration_ms, True)
        logger.info("语音克隆完成: 用户=%s(id=%d), 耗时=%dms / Voice clone completed: user=%s(id=%d), duration=%dms",
                     current_user.username, current_user.id, duration_ms, current_user.username, current_user.id, duration_ms)

        filename = f"clone_{uuid.uuid4().hex[:8]}.wav"
        filepath = os.path.join(settings.audio_output_dir, filename)
        with open(filepath, "wb") as f:
            f.write(result_bytes)

        return Response(content=result_bytes, media_type="audio/wav", headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        })
    except Exception as e:
        duration_ms = int((time.time() - start) * 1000)
        _log_usage(db, current_user.id, "clone", "mimo-v2.5-tts-voiceclone", duration_ms, False, str(e))
        logger.exception("语音克隆失败: 用户=%s(id=%d), 耗时=%dms / Voice clone failed: user=%s(id=%d), duration=%dms",
                          current_user.username, current_user.id, duration_ms, current_user.username, current_user.id, duration_ms)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/design")
async def tts_design(
    req: VoiceDesignRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start = time.time()
    logger.info("语音设计请求开始: 用户=%s(id=%d) / Voice design started: user=%s(id=%d)",
                current_user.username, current_user.id, current_user.username, current_user.id)
    try:
        audio_bytes = await design_voice(
            voice_prompt=req.voice_prompt,
            text=req.text,
            user_api_key=current_user.mimo_api_key,
        )
        duration_ms = int((time.time() - start) * 1000)
        _log_usage(db, current_user.id, "design", "mimo-v2.5-tts-voicedesign", duration_ms, True)
        logger.info("语音设计完成: 用户=%s(id=%d), 耗时=%dms / Voice design completed: user=%s(id=%d), duration=%dms",
                     current_user.username, current_user.id, duration_ms, current_user.username, current_user.id, duration_ms)

        filename = f"design_{uuid.uuid4().hex[:8]}.wav"
        filepath = os.path.join(settings.audio_output_dir, filename)
        with open(filepath, "wb") as f:
            f.write(audio_bytes)

        return Response(content=audio_bytes, media_type="audio/wav", headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        })
    except Exception as e:
        duration_ms = int((time.time() - start) * 1000)
        _log_usage(db, current_user.id, "design", "mimo-v2.5-tts-voicedesign", duration_ms, False, str(e))
        logger.exception("语音设计失败: 用户=%s(id=%d), 耗时=%dms / Voice design failed: user=%s(id=%d), duration=%dms",
                          current_user.username, current_user.id, duration_ms, current_user.username, current_user.id, duration_ms)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/voices", response_model=list[VoiceInfo])
def list_voices(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    builtin_voices = [
        VoiceInfo(name="冰糖", type="builtin", description="甜美清亮的女声"),
        VoiceInfo(name="茉莉", type="builtin", description="温柔优雅的女声"),
        VoiceInfo(name="苏打", type="builtin", description="活泼可爱的女声"),
        VoiceInfo(name="白桦", type="builtin", description="沉稳大气的男声"),
        VoiceInfo(name="Mia", type="builtin", description="English female voice"),
        VoiceInfo(name="Chloe", type="builtin", description="English female voice"),
        VoiceInfo(name="Milo", type="builtin", description="English male voice"),
        VoiceInfo(name="Dean", type="builtin", description="English male voice"),
    ]

    custom_profiles = db.query(VoiceProfile).filter(VoiceProfile.user_id == current_user.id).all()
    custom_voices = [
        VoiceInfo(name=p.name, type=p.voice_type, description=p.description or "")
        for p in custom_profiles
    ]

    return builtin_voices + custom_voices
