import sys
import os
import io

# Windows控制台UTF-8编码，解决中文乱码
# Windows console UTF-8 encoding, fixes Chinese garbled output
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

import uvicorn
from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info",
    )
