from __future__ import annotations
import logging
import bcrypt as _bcrypt
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from app.config import settings

logger = logging.getLogger(__name__)

# 修复bcrypt 4.0+对超过72字节密码的限制（passlib内部检测会触发）
# Fix bcrypt 4.0+ strict 72-byte limit (passlib's internal bug detection triggers it)
_original_hashpw = _bcrypt.hashpw
def _patched_hashpw(password, salt):
    if isinstance(password, bytes) and len(password) > 72:
        password = password[:72]
    elif isinstance(password, str) and len(password.encode("utf-8")) > 72:
        password = password.encode("utf-8")[:72].decode("utf-8", errors="ignore")
    return _original_hashpw(password, salt)
_bcrypt.hashpw = _patched_hashpw

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: int, role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": str(user_id), "role": role, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as e:
        logger.warning("JWT解码失败: %s / JWT decode failed: %s", str(e), str(e))
        return None
