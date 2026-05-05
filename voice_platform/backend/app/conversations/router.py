from __future__ import annotations
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import User, Conversation, Message
from app.auth.dependencies import get_current_user
from app.conversations.schemas import (
    ConversationCreate, ConversationUpdate, ConversationResponse,
    ConversationDetailResponse, MessageResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=list[ConversationResponse])
def list_conversations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    convs = (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    result = []
    for c in convs:
        resp = ConversationResponse.model_validate(c)
        resp.message_count = len(c.messages)
        result.append(resp)
    return result


@router.post("", response_model=ConversationResponse)
def create_conversation(
    req: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = Conversation(
        user_id=current_user.id,
        title=req.title or "新对话 / New Conversation",
        system_prompt=req.system_prompt or "你是小米MIMO智能助手，回答要简洁准确，乐于助人。",
        model=req.model or "mimo-v2.5-pro",
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    logger.info("对话已创建: id=%d, 用户=%s / Conversation created: id=%d, user=%s", conv.id, current_user.username, conv.id, current_user.username)
    return ConversationResponse.model_validate(conv)


@router.get("/{conv_id}", response_model=ConversationDetailResponse)
def get_conversation(
    conv_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter(Conversation.id == conv_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="对话不存在 / Conversation not found")
    resp = ConversationDetailResponse.model_validate(conv)
    resp.message_count = len(conv.messages)
    return resp


@router.put("/{conv_id}", response_model=ConversationResponse)
def update_conversation(
    conv_id: int,
    req: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter(Conversation.id == conv_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="对话不存在 / Conversation not found")
    if req.title is not None:
        conv.title = req.title
    if req.system_prompt is not None:
        conv.system_prompt = req.system_prompt
    if req.model is not None:
        conv.model = req.model
    db.commit()
    db.refresh(conv)
    logger.info("对话已更新: id=%d, 用户=%s / Conversation updated: id=%d, user=%s", conv_id, current_user.username, conv_id, current_user.username)
    return ConversationResponse.model_validate(conv)


@router.delete("/{conv_id}")
def delete_conversation(
    conv_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter(Conversation.id == conv_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="对话不存在 / Conversation not found")
    db.delete(conv)
    db.commit()
    logger.info("对话已删除: id=%d / Conversation deleted: id=%d", conv_id, conv_id)
    return {"detail": "已删除 / Deleted"}


@router.get("/{conv_id}/messages", response_model=list[MessageResponse])
def get_messages(
    conv_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter(Conversation.id == conv_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="对话不存在 / Conversation not found")
    msgs = (
        db.query(Message)
        .filter(Message.conversation_id == conv_id)
        .order_by(Message.created_at.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [MessageResponse.model_validate(m) for m in msgs]
