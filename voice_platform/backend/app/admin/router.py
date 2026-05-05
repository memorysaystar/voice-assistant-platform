from __future__ import annotations
import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.connection import get_db
from app.database.models import User, Conversation, Message, UsageLog, SystemConfig
from app.auth.dependencies import require_admin
from app.admin.schemas import (
    UserListItem, UserUpdateRequest, AnalyticsOverview,
    UsageByDay, UsageByAction, ConfigItem, ConfigUpdateRequest,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# --- 用户管理 ---
# --- User Management ---

@router.get("/users", response_model=list[UserListItem])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: str = Query("", description="按用户名或邮箱搜索 / Search by username or email"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    logger.debug("管理员查询用户列表: admin=%s, search='%s' / Admin listing users: admin=%s, search='%s'", admin.username, search, admin.username, search)
    query = db.query(User)
    if search:
        query = query.filter(
            (User.username.contains(search)) | (User.email.contains(search))
        )
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for u in users:
        conv_count = db.query(Conversation).filter(Conversation.user_id == u.id).count()
        usage_count = db.query(UsageLog).filter(UsageLog.user_id == u.id).count()
        item = UserListItem.model_validate(u)
        item.conversation_count = conv_count
        item.usage_count = usage_count
        result.append(item)
    return result


@router.get("/users/{user_id}", response_model=UserListItem)
def get_user(user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    logger.debug("管理员查询用户详情: admin=%s, target_id=%d / Admin viewing user: admin=%s, target_id=%d", admin.username, user_id, admin.username, user_id)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在 / User not found")
    conv_count = db.query(Conversation).filter(Conversation.user_id == user.id).count()
    usage_count = db.query(UsageLog).filter(UsageLog.user_id == user.id).count()
    item = UserListItem.model_validate(user)
    item.conversation_count = conv_count
    item.usage_count = usage_count
    return item


@router.put("/users/{user_id}", response_model=UserListItem)
def update_user(
    user_id: int,
    req: UserUpdateRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在 / User not found")
    if req.role is not None:
        user.role = req.role
    if req.is_active is not None:
        user.is_active = req.is_active
    db.commit()
    db.refresh(user)
    logger.info("管理员已更新用户%d: 角色=%s, 状态=%s / Admin updated user %d: role=%s, active=%s", user_id, user.role, user.is_active, user_id, user.role, user.is_active)
    return UserListItem.model_validate(user)


@router.delete("/users/{user_id}")
def deactivate_user(user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在 / User not found")
    user.is_active = False
    db.commit()
    logger.info("管理员已停用用户%d / Admin deactivated user %d", user_id, user_id)
    return {"detail": "用户已停用 / User deactivated"}


# --- 数据分析 ---
# --- Analytics ---

@router.get("/analytics/overview", response_model=AnalyticsOverview)
def analytics_overview(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    return AnalyticsOverview(
        total_users=db.query(User).count(),
        active_users=db.query(User).filter(User.is_active == True).count(),
        total_conversations=db.query(Conversation).count(),
        total_messages=db.query(Message).count(),
        total_api_calls=db.query(UsageLog).count(),
        calls_today=db.query(UsageLog).filter(UsageLog.created_at >= today).count(),
    )


@router.get("/analytics/usage", response_model=list[UsageByDay])
def usage_by_day(
    days: int = Query(30, ge=1, le=365),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    cutoff = datetime.utcnow() - timedelta(days=days)
    rows = (
        db.query(func.date(UsageLog.created_at).label("date"), func.count().label("count"))
        .filter(UsageLog.created_at >= cutoff)
        .group_by(func.date(UsageLog.created_at))
        .order_by(func.date(UsageLog.created_at))
        .all()
    )
    return [UsageByDay(date=str(r.date), count=r.count) for r in rows]


@router.get("/analytics/actions", response_model=list[UsageByAction])
def usage_by_action(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    rows = (
        db.query(UsageLog.action, func.count().label("count"))
        .group_by(UsageLog.action)
        .all()
    )
    return [UsageByAction(action=r[0], count=r[1]) for r in rows]


# --- 系统配置 ---
# --- System Config ---

@router.get("/config", response_model=list[ConfigItem])
def list_config(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    configs = db.query(SystemConfig).order_by(SystemConfig.key).all()
    return [ConfigItem(key=c.key, value=c.value, description=c.description) for c in configs]


@router.put("/config/{key}", response_model=ConfigItem)
def update_config(key: str, req: ConfigUpdateRequest, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    config = db.query(SystemConfig).filter(SystemConfig.key == key).first()
    if not config:
        raise HTTPException(status_code=404, detail="配置项不存在 / Config key not found")
    config.value = req.value
    db.commit()
    db.refresh(config)
    logger.info("管理员已更新配置: %s = %s / Admin updated config: %s = %s", key, req.value, key, req.value)
    return ConfigItem(key=config.key, value=config.value, description=config.description)
