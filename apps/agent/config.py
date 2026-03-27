"""应用配置（环境变量）。"""

import os
from pathlib import Path

# 向上查找 .env：优先 apps/agent/.env，其次项目根目录 .env
def _load_env() -> None:
    try:
        from dotenv import load_dotenv
    except ImportError:
        return  # python-dotenv 未安装时静默跳过

    _here = Path(__file__).resolve().parent
    for candidate in (_here / ".env", _here.parent.parent / ".env"):
        if candidate.exists():
            load_dotenv(candidate, override=False)
            print(f"[config] 已加载 {candidate}")
            return

_load_env()


class Config:
    DEEPSEEK_BASE_URL: str = os.getenv("DEEPSEEK_BASE_URL", "https://www.aiping.cn/api/v1")
    DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "")
    DEEPSEEK_MODEL: str = os.getenv("DEEPSEEK_MODEL", "DeepSeek-V3.2")
    MAX_DIALOG_ROUNDS: int = int(os.getenv("MAX_DIALOG_ROUNDS", "8"))
    DIALOG_TIMEOUT: int = int(os.getenv("DIALOG_TIMEOUT", "30"))
    MAX_CONCURRENT_TASKS: int = int(os.getenv("MAX_CONCURRENT_TASKS", "10"))
    API_CALL_DELAY: float = float(os.getenv("API_CALL_DELAY", "0.3"))
    MATCH_SCORE_THRESHOLD: int = int(os.getenv("MATCH_SCORE_THRESHOLD", "80"))
    AUTO_INTERACTION_INTERVAL: int = int(os.getenv("AUTO_INTERACTION_INTERVAL", "8"))
    CORS_ORIGINS: list[str] = [
        x.strip()
        for x in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://[::1]:5173",
        ).split(",")
        if x.strip()
    ]
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://a2a:dev_password@127.0.0.1:5432/a2a_dev",
    )
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")


config = Config()
