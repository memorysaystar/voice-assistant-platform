from __future__ import annotations
import logging
import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import User, Conversation, Message, UsageLog
from app.auth.dependencies import get_current_user
from app.chat.schemas import ChatRequest, ChatResponse, FunctionChatRequest, FunctionChatResponse, ToolCallInfo
from app.mimo_bridge.chat_adapter import single_chat, chat_with_functions

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_or_create_conversation(db: Session, user_id: int, conversation_id: int | None, title: str | None = None) -> Conversation:
    if conversation_id:
        conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user_id).first()
        if conv:
            return conv
    conv = Conversation(user_id=user_id, title=title or "新对话 / New Conversation")
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


def _build_messages(conv: Conversation, new_message: str) -> list[dict]:
    messages = [{"role": "system", "content": conv.system_prompt}]
    for msg in conv.messages:
        m = {"role": msg.role, "content": msg.content or ""}
        if msg.tool_calls:
            m["tool_calls"] = msg.tool_calls
        if msg.tool_call_id:
            m["tool_call_id"] = msg.tool_call_id
        messages.append(m)
    messages.append({"role": "user", "content": new_message})
    return messages


def _log_usage(db: Session, user_id: int, action: str, model: str, duration_ms: int, success: bool, error_msg: str | None = None):
    db.add(UsageLog(
        user_id=user_id,
        action=action,
        model=model,
        duration_ms=duration_ms,
        success=success,
        error_msg=error_msg,
    ))
    db.commit()


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    start = time.time()
    model = req.model or "mimo-v2.5-pro"
    logger.info("聊天请求开始: 用户=%s(id=%d), 模型=%s / Chat request started: user=%s(id=%d), model=%s",
                current_user.username, current_user.id, model, current_user.username, current_user.id, model)
    conv = _get_or_create_conversation(db, current_user.id, req.conversation_id, req.message[:50])
    messages = _build_messages(conv, req.message)

    # 保存用户消息
    # Save user message
    user_msg = Message(conversation_id=conv.id, role="user", content=req.message)
    db.add(user_msg)
    db.commit()

    try:
        response_text = await single_chat(
            prompt=req.message,
            messages=messages,
            model=req.model or conv.model,
            temperature=req.temperature,
            max_tokens=req.max_tokens,
            user_api_key=current_user.mimo_api_key,
        )

        assistant_msg = Message(conversation_id=conv.id, role="assistant", content=response_text)
        db.add(assistant_msg)
        db.commit()
        db.refresh(assistant_msg)

        duration_ms = int((time.time() - start) * 1000)
        _log_usage(db, current_user.id, "chat", req.model or conv.model, duration_ms, True)
        logger.info("聊天请求完成: 用户=%s(id=%d), 耗时=%dms / Chat request completed: user=%s(id=%d), duration=%dms",
                     current_user.username, current_user.id, duration_ms, current_user.username, current_user.id, duration_ms)

        return ChatResponse(response=response_text, conversation_id=conv.id, message_id=assistant_msg.id)
    except Exception as e:
        duration_ms = int((time.time() - start) * 1000)
        _log_usage(db, current_user.id, "chat", req.model or conv.model, duration_ms, False, str(e))
        logger.exception("聊天请求失败: 用户=%s(id=%d), 耗时=%dms / Chat request failed: user=%s(id=%d), duration=%dms",
                          current_user.username, current_user.id, duration_ms, current_user.username, current_user.id, duration_ms)
        raise


@router.post("/functions", response_model=FunctionChatResponse)
async def chat_funcs(req: FunctionChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    start = time.time()
    model = req.model or "mimo-v2.5-pro"
    logger.info("函数调用请求开始: 用户=%s(id=%d), 模型=%s / Function chat request started: user=%s(id=%d), model=%s",
                current_user.username, current_user.id, model, current_user.username, current_user.id, model)
    conv = _get_or_create_conversation(db, current_user.id, req.conversation_id, req.message[:50])
    messages = _build_messages(conv, req.message)

    user_msg = Message(conversation_id=conv.id, role="user", content=req.message)
    db.add(user_msg)
    db.commit()

    try:
        result = await chat_with_functions(
            messages=messages,
            model=req.model or conv.model,
            user_api_key=current_user.mimo_api_key,
        )

        tool_calls_data = result["tool_calls_made"]

        # 保存工具调用消息
        # Save tool call messages
        for tc in tool_calls_data:
            db.add(Message(
                conversation_id=conv.id,
                role="tool",
                content=tc["result"],
                tool_calls=[{"name": tc["name"], "args": tc["args"]}],
            ))

        assistant_msg = Message(conversation_id=conv.id, role="assistant", content=result["content"])
        db.add(assistant_msg)
        db.commit()
        db.refresh(assistant_msg)

        duration_ms = int((time.time() - start) * 1000)
        _log_usage(db, current_user.id, "function_chat", req.model or conv.model, duration_ms, True)
        logger.info("函数调用请求完成: 用户=%s(id=%d), 工具调用=%d次, 耗时=%dms / Function chat completed: user=%s(id=%d), tools=%d, duration=%dms",
                     current_user.username, current_user.id, len(tool_calls_data), duration_ms,
                     current_user.username, current_user.id, len(tool_calls_data), duration_ms)

        return FunctionChatResponse(
            response=result["content"],
            tool_calls=[ToolCallInfo(**tc) for tc in tool_calls_data],
            conversation_id=conv.id,
            message_id=assistant_msg.id,
        )
    except Exception as e:
        duration_ms = int((time.time() - start) * 1000)
        _log_usage(db, current_user.id, "function_chat", req.model or conv.model, duration_ms, False, str(e))
        logger.exception("函数调用请求失败: 用户=%s(id=%d), 耗时=%dms / Function chat failed: user=%s(id=%d), duration=%dms",
                          current_user.username, current_user.id, duration_ms, current_user.username, current_user.id, duration_ms)
        raise
