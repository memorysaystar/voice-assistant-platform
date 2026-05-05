import sys
import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import HTTPException

# 添加父目录到路径，以便导入 voice_asstist
# Add parent directory to path so we can import voice_asstist
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from app.config import settings
from app.core.logging import setup_logging
from app.database.connection import create_tables, SessionLocal
from app.database.seed import run_seed
from app.middleware.logging import RequestLoggingMiddleware
from app.middleware.error_handler import global_exception_handler, http_exception_handler

from app.auth.router import router as auth_router
from app.chat.router import router as chat_router
from app.chat.ws_router import router as ws_router
from app.tts.router import router as tts_router
from app.conversations.router import router as conversations_router
from app.admin.router import router as admin_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动阶段
    # Startup
    setup_logging(debug=settings.debug)
    logger.info("=" * 60)
    logger.info("语音助手平台正在启动... / Voice Assistant Platform starting up...")
    logger.info("=" * 60)

    create_tables()
    logger.info("数据库表已创建/验证 / Database tables created/verified")

    db = SessionLocal()
    try:
        run_seed(db)
    finally:
        db.close()

    logger.info("服务已就绪 http://%s:%d / Server ready at http://%s:%d", settings.host, settings.port, settings.host, settings.port)
    logger.info("API文档 http://%s:%d/docs / API docs at http://%s:%d/docs", settings.host, settings.port, settings.host, settings.port)

    yield

    # 关闭阶段
    # Shutdown
    logger.info("语音助手平台正在关闭... / Voice Assistant Platform shutting down...")


app = FastAPI(
    title="Voice Assistant Platform / 语音助手平台",
    description="企业级语音助手平台：聊天、语音合成、语音克隆、音色设计 / Enterprise voice assistant platform with chat, TTS, voice cloning, and voice design",
    version="1.0.0",
    lifespan=lifespan,
)

# 跨域配置
# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 开发期间允许所有来源，生产环境需限制 / Allow all for dev, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 请求日志中间件
# Request logging middleware
app.add_middleware(RequestLoggingMiddleware)

# 全局异常处理
# Exception handlers
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)

# 注册路由
# Register routers
app.include_router(auth_router, prefix="/auth", tags=["认证 / Authentication"])
app.include_router(chat_router, prefix="/chat", tags=["聊天 / Chat"])
app.include_router(ws_router, prefix="/chat", tags=["WebSocket聊天 / WebSocket Chat"])
app.include_router(tts_router, prefix="/tts", tags=["语音合成 / TTS"])
app.include_router(conversations_router, prefix="/conversations", tags=["对话管理 / Conversations"])
app.include_router(admin_router, prefix="/admin", tags=["管理后台 / Admin"])


@app.get("/")
def root():
    return {
        "name": "语音助手平台 / Voice Assistant Platform",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running / 运行中",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
