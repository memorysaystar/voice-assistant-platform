import logging
from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("未处理异常: %s / Unhandled exception: %s", str(exc), str(exc))
    return JSONResponse(
        status_code=500,
        content={"detail": "服务器内部错误 / Internal server error", "error": str(exc)},
    )


async def http_exception_handler(request: Request, exc):
    if exc.status_code in (401, 403):
        logger.warning("安全事件 [%d]: %s %s -> %s / Security event [%d]: %s %s -> %s",
                        exc.status_code, request.method, request.url.path, exc.detail,
                        exc.status_code, request.method, request.url.path, exc.detail)
    elif exc.status_code >= 400:
        logger.warning("HTTP异常 [%d]: %s %s -> %s / HTTP exception [%d]: %s %s -> %s",
                        exc.status_code, request.method, request.url.path, exc.detail,
                        exc.status_code, request.method, request.url.path, exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )
