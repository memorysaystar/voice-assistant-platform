# ==============================================
# 唯一需要你修改的地方：替换为你的完整API密钥
# ==============================================
import os
MIMO_API_KEY = os.environ.get("MIMO_API_KEY", "")  # 从环境变量读取，或在 .env 文件中配置
MIMO_BASE_URL = "https://token-plan-cn.xiaomimimo.com/v1"

# 默认配置（可以根据需要调整）
DEFAULT_MODEL = "mimo-v2.5-pro"  # 最强通用模型
DEFAULT_TTS_MODEL = "mimo-v2.5-tts"
DEFAULT_TTS_VOICE = "冰糖"  # 内置音色：冰糖/茉莉/苏打/白桦/Mia/Chloe/Milo/Dean
DEFAULT_TTS_SPEED = 1.0
DEFAULT_TEMPERATURE = 0.7
DEFAULT_MAX_TOKENS = 2048

# TTS内置音色列表
TTS_VOICES = {
    "冰糖": "冰糖",
    "茉莉": "茉莉",
    "苏打": "苏打",
    "白桦": "白桦",
    "Mia": "Mia",
    "Chloe": "Chloe",
    "Milo": "Milo",
    "Dean": "Dean",
    "默认": "mimo_default",
}