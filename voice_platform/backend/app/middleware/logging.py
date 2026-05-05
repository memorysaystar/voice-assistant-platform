from __future__ import annotations
import time
import uuid
import logging
from starlette.types import ASGIApp, Receive, Scope, Send

logger = logging.getLogger("request")


class RequestLoggingMiddleware:
    """ASGI中间件，支持HTTP和WebSocket / ASGI middleware supporting both HTTP and WebSocket."""

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        # WebSocket请求直接透传
        # Pass through WebSocket requests directly
        if scope["type"] == "websocket":
            await self.app(scope, receive, send)
            return

        # HTTP请求记录日志
        # Log HTTP requests
        request_id = str(uuid.uuid4())[:8]
        start = time.time()
        method = scope.get("method", "?")
        path = scope.get("path", "?")

        logger.info("[%s] 收到请求 %s %s / [%s] %s %s", request_id, method, path, request_id, method, path)

        # 用于捕获响应状态码
        # Capture response status code
        status_code = 500

        async def send_wrapper(message):
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message.get("status", 500)
                message.setdefault("headers", [])
                message["headers"].append((b"x-request-id", request_id.encode()))
            await send(message)

        await self.app(scope, receive, send_wrapper)

        duration_ms = int((time.time() - start) * 1000)
        logger.info("[%s] 响应 %d (耗时%dms) / [%s] %d (%dms)", request_id, status_code, duration_ms, request_id, status_code, duration_ms)
