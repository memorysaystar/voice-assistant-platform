from __future__ import annotations
import logging
from openai import OpenAI
from app.config import settings

logger = logging.getLogger(__name__)

_client_cache: dict[str, OpenAI] = {}


def get_mimo_client(user_api_key: str | None = None) -> OpenAI:
    """获取或创建OpenAI客户端（支持用户自定义密钥）"""
    """Get or create an OpenAI client (supports per-user API keys)."""
    key = user_api_key or settings.mimo_api_key
    if key not in _client_cache:
        _client_cache[key] = OpenAI(base_url=settings.mimo_base_url, api_key=key)
        logger.debug("已创建新的OpenAI客户端，密钥前缀: %s... / Created new OpenAI client for key: %s...", key[:10], key[:10])
    return _client_cache[key]
