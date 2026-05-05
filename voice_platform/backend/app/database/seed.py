from __future__ import annotations
import os
import logging
from sqlalchemy.orm import Session
from app.database.models import User, UserRole, SystemConfig
from app.auth.service import hash_password

logger = logging.getLogger(__name__)

DEFAULT_CONFIGS = [
    ("default_model", "mimo-v2.5-pro", "Default AI model for chat"),
    ("default_tts_voice", "冰糖", "Default TTS voice"),
    ("max_conversation_length", "100", "Max messages per conversation"),
    ("enable_function_calling", "true", "Enable function calling (weather, calculator)"),
    ("enable_voice_clone", "true", "Enable voice cloning feature"),
    ("enable_voice_design", "true", "Enable voice design feature"),
]


def seed_admin(db: Session):
    """创建默认管理员用户（如果不存在）"""
    """Create default admin user if not exists."""
    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if not admin:
        admin_email = os.environ.get("ADMIN_EMAIL", "admin@voiceplatform.com")
        admin_password = os.environ.get("ADMIN_PASSWORD", "changeme123")
        admin = User(
            username="admin",
            email=admin_email,
            hashed_password=hash_password(admin_password),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        logger.info("已创建默认管理员 / Default admin user created (email=%s)", admin_email)
    else:
        logger.info("管理员已存在，跳过初始化 / Admin user already exists, skipping seed")


def seed_config(db: Session):
    """创建默认系统配置（如果不存在）"""
    """Create default system config entries if not exist."""
    for key, value, description in DEFAULT_CONFIGS:
        existing = db.query(SystemConfig).filter(SystemConfig.key == key).first()
        if not existing:
            db.add(SystemConfig(key=key, value=value, description=description))
    db.commit()
    logger.info("系统配置已初始化 (%d 条) / System config seeded (%d entries)", len(DEFAULT_CONFIGS), len(DEFAULT_CONFIGS))


def run_seed(db: Session):
    """执行所有初始化操作"""
    """Run all seed operations."""
    seed_admin(db)
    seed_config(db)
