"""Redis 异步客户端（可选）。"""

from __future__ import annotations

import logging
from typing import Any

import redis.asyncio as redis_async

from config import config

logger = logging.getLogger(__name__)

_redis: redis_async.Redis | None = None


async def init_redis() -> redis_async.Redis | None:
    global _redis
    if _redis is not None:
        return _redis
    try:
        _redis = redis_async.from_url(config.REDIS_URL, decode_responses=True)
        await _redis.ping()
        logger.info("Redis 已连接")
    except Exception as e:
        logger.warning("Redis 不可用: %s，将使用内存降级", e)
        _redis = None
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None


async def get_redis() -> Any:
    if _redis is None:
        raise RuntimeError("Redis 未初始化")
    return _redis


def redis_available() -> bool:
    return _redis is not None
