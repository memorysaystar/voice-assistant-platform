from __future__ import annotations
import logging
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.database.models import User, Conversation, Message, UsageLog
from app.auth.dependencies import get_user_from_token
from app.mimo_bridge.chat_adapter import stream_chat

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_or_create_conversation(db: Session, user_id: int, conversation_id: int | None) -> Conversation:
    if conversation_id:
        conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user_id).first()
        if conv:
            return conv
    conv = Conversation(user_id=user_id)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


def _build_messages(conv: Conversation, new_message: str) -> list[dict]:
    messages = [{"role": "system", "content": conv.system_prompt}]
    # 取最近50条消息作为上下文
    # Last 50 messages for context
    for msg in conv.messages[-50:]:
        m = {"role": msg.role, "content": msg.content or ""}
        messages.append(m)
    messages.append({"role": "user", "content": new_message})
    return messages


@router.websocket("/ws")
async def websocket_chat(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="需要Token / Token required")
        return

    db = SessionLocal()
    try:
        user = get_user_from_token(token, db)
        if not user:
            await websocket.close(code=4001, reason="Token无效 / Invalid token")
            return

        await websocket.accept()
        logger.info("WebSocket已连接: 用户=%s (id=%d) / WebSocket connected: user=%s (id=%d)", user.username, user.id, user.username, user.id)

        while True:
            data = await websocket.receive_json()
            content = data.get("content", "")
            conversation_id = data.get("conversation_id")
            model = data.get("model")

            if not content.strip():
                await websocket.send_json({"type": "error", "message": "消息不能为空 / Empty message"})
                continue

            conv = _get_or_create_conversation(db, user.id, conversation_id)
            messages = _build_messages(conv, content)

            # 保存用户消息
            # Save user message
            user_msg = Message(conversation_id=conv.id, role="user", content=content)
            db.add(user_msg)
            db.commit()

            # 用第一条消息更新对话标题
            # Update conversation title from first message
            if len(conv.messages) <= 1:
                conv.title = content[:50]
                db.commit()

            start = time.time()
            full_response = ""

            try:
                await websocket.send_json({"type": "conversation_id", "id": conv.id})

                async for token_text in stream_chat(
                    messages=messages,
                    model=model or conv.model,
                    user_api_key=user.mimo_api_key,
                ):
                    await websocket.send_json({"type": "token", "content": token_text})
                    full_response += token_text

                # 保存助手回复
                # Save assistant message
                assistant_msg = Message(conversation_id=conv.id, role="assistant", content=full_response)
                db.add(assistant_msg)
                db.commit()
                db.refresh(assistant_msg)

                await websocket.send_json({
                    "type": "done",
                    "full_content": full_response,
                    "message_id": assistant_msg.id,
                    "conversation_id": conv.id,
                })

                duration_ms = int((time.time() - start) * 1000)
                db.add(UsageLog(
                    user_id=user.id,
                    action="stream_chat",
                    model=model or conv.model,
                    duration_ms=duration_ms,
                    success=True,
                ))
                db.commit()

            except Exception as e:
                logger.error("用户%d流式对话出错: %s / Stream error for user %d: %s", user.id, str(e), user.id, str(e))
                await websocket.send_json({"type": "error", "message": str(e)})
                duration_ms = int((time.time() - start) * 1000)
                db.add(UsageLog(
                    user_id=user.id,
                    action="stream_chat",
                    model=model or conv.model,
                    duration_ms=duration_ms,
                    success=False,
                    error_msg=str(e),
                ))
                db.commit()

    except WebSocketDisconnect:
        logger.info("WebSocket已断开 / WebSocket disconnected")
    finally:
        db.close()
