from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    # MIMO API 配置
    # MIMO API configuration
    mimo_api_key: str = ""
    mimo_base_url: str = "https://token-plan-cn.xiaomimimo.com/v1"
    mimo_default_model: str = "mimo-v2.5-pro"
    mimo_tts_model: str = "mimo-v2.5-tts"
    mimo_tts_voice: str = "冰糖"
    mimo_tts_speed: float = 1.0
    mimo_temperature: float = 0.7
    mimo_max_tokens: int = 2048

    # 认证配置
    # Authentication configuration
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24  # 24小时过期 / 24 hours expiry

    # 数据库配置
    # Database configuration
    database_url: str = "sqlite:///./voice_platform.db"

    # 服务器配置
    # Server configuration
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True

    # 文件存储路径
    # File storage paths
    upload_dir: str = "./uploads"
    audio_output_dir: str = "./audio_output"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

# 确保目录存在
# Ensure directories exist
os.makedirs(settings.upload_dir, exist_ok=True)
os.makedirs(settings.audio_output_dir, exist_ok=True)
os.makedirs("logs", exist_ok=True)
