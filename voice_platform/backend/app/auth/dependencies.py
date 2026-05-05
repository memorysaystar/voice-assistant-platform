from __future__ import annotations
import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import User, UserRole
from app.auth.service import decode_token

logger = logging.getLogger(__name__)
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    if payload is None:
        logger.warning("认证失败: 无效token / Authentication failed: invalid token")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id = int(payload.get("sub", 0))
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        logger.warning("认证失败: 用户不存在 (id=%d) / Authentication failed: user not found (id=%d)", user_id, user_id)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    if not user.is_active:
        logger.warning("认证失败: 用户已停用 %s (id=%d) / Authentication failed: user inactive %s (id=%d)", user.username, user_id, user.username, user_id)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        logger.warning("授权失败: 非管理员访问 %s (id=%d) / Authorization failed: non-admin access %s (id=%d)", current_user.username, current_user.id, current_user.username, current_user.id)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


def get_user_from_token(token: str, db: Session) -> User | None:
    """用于WebSocket认证（无法使用依赖注入）"""
    """For WebSocket auth (no dependency injection available)."""
    payload = decode_token(token)
    if payload is None:
        return None
    user_id = int(payload.get("sub", 0))
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    return user
