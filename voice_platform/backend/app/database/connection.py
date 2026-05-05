from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
    echo=settings.debug,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI数据库会话依赖注入"""
    """FastAPI dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """启动时创建所有数据表"""
    """Create all tables on startup."""
    from app.database import models  # noqa: F401 - 确保模型被导入 / ensure models are imported
    Base.metadata.create_all(bind=engine)
