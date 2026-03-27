"""
基于 PostgreSQL memory_stream 表的记忆系统。
Redis 不可用时使用进程内计数器作为反思触发降级。
"""

from __future__ import annotations

import asyncio

from db.pg_client import get_pool, pool_available
from db.redis_client import redis_available

REFLECTION_TRIGGER_COUNT = 10

_reflect_counter_mem: dict[str, int] = {}
_reflect_lock = asyncio.Lock()


async def _incr_reflect_counter(agent_name: str) -> None:
    if redis_available():
        try:
            from db.redis_client import get_redis

            r = await get_redis()
            await r.incr(f"reflect:counter:{agent_name}")
            return
        except Exception:
            pass
    async with _reflect_lock:
        _reflect_counter_mem[agent_name] = _reflect_counter_mem.get(agent_name, 0) + 1


async def _reset_reflect_counter(agent_name: str) -> None:
    if redis_available():
        try:
            from db.redis_client import get_redis

            r = await get_redis()
            await r.set(f"reflect:counter:{agent_name}", "0")
            return
        except Exception:
            pass
    async with _reflect_lock:
        _reflect_counter_mem[agent_name] = 0


async def _get_reflect_count(agent_name: str) -> int:
    if redis_available():
        try:
            from db.redis_client import get_redis

            r = await get_redis()
            v = await r.get(f"reflect:counter:{agent_name}")
            return int(v or 0)
        except Exception:
            pass
    async with _reflect_lock:
        return _reflect_counter_mem.get(agent_name, 0)


async def add_observation(agent_name: str, content: str, importance: int = 5) -> None:
    if not pool_available():
        return
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO memory_stream (agent_name, memory_type, content, importance) VALUES ($1, 'observation', $2, $3)",
            agent_name,
            content,
            importance,
        )
    await _incr_reflect_counter(agent_name)


async def add_reflection(agent_name: str, content: str, importance: int = 8) -> None:
    if not pool_available():
        return
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO memory_stream (agent_name, memory_type, content, importance) VALUES ($1, 'reflection', $2, $3)",
            agent_name,
            content,
            importance,
        )
    await _reset_reflect_counter(agent_name)


async def should_trigger_reflection(agent_name: str) -> bool:
    c = await _get_reflect_count(agent_name)
    return c >= REFLECTION_TRIGGER_COUNT


async def get_recent_observations(agent_name: str, limit: int = 15) -> list[str]:
    if not pool_available():
        return []
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT content FROM memory_stream WHERE agent_name=$1 AND memory_type='observation' ORDER BY created_at DESC LIMIT $2",
            agent_name,
            limit,
        )
    return [r["content"] for r in rows]


async def get_relevant_memories(agent_name: str, context: str, limit: int = 6) -> list[str]:
    if not pool_available():
        return []
    pool = await get_pool()
    async with pool.acquire() as conn:
        observations = await conn.fetch(
            "SELECT content FROM memory_stream WHERE agent_name=$1 AND memory_type='observation' ORDER BY created_at DESC LIMIT 3",
            agent_name,
        )
        reflections = await conn.fetch(
            "SELECT content FROM memory_stream WHERE agent_name=$1 AND memory_type='reflection' ORDER BY importance DESC, created_at DESC LIMIT 3",
            agent_name,
        )
    result = [r["content"] for r in observations] + [r["content"] for r in reflections]
    return result[:limit]


async def build_memory_context(agent_name: str) -> str:
    memories = await get_relevant_memories(agent_name, "", limit=6)
    if not memories:
        return ""
    obs = [m for m in memories[:3]]
    ref = [m for m in memories[3:]]
    parts = []
    if obs:
        parts.append("【近期经历】" + "；".join(obs))
    if ref:
        parts.append("【内心感悟】" + "；".join(ref))
    return "\n".join(parts)
