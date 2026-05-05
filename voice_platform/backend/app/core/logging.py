import logging
import sys
import os
from logging.handlers import RotatingFileHandler


def setup_logging(debug: bool = True):
    level = logging.DEBUG if debug else logging.INFO

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)-25s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # 控制台输出
    # Console handler
    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(formatter)

    # 文件输出（轮转，最大10MB，保留5个备份）
    # File handler (rotating, 10MB max, keep 5 backups)
    log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "logs")
    os.makedirs(log_dir, exist_ok=True)
    file_handler = RotatingFileHandler(
        os.path.join(log_dir, "voice_platform.log"),
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)

    # 应用到根日志器
    # Apply to root logger
    root = logging.getLogger()
    root.setLevel(level)
    root.addHandler(console)
    root.addHandler(file_handler)

    # 屏蔽第三方库的多余日志
    # Quiet noisy libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

    logging.info("日志系统已初始化 (级别=%s) / Logging system initialized (level=%s)", "DEBUG" if debug else "INFO", "DEBUG" if debug else "INFO")
