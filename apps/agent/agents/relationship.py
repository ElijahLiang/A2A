"""
Agent 关系图谱与好感度更新。
"""

from __future__ import annotations

from db.pg_client import get_pool, pool_available

AFFINITY_THRESHOLDS = {
    "acquaintance": 50,
    "friend": 70,
    "close": 90,
}


def _calc_status(affinity: int) -> str:
    if affinity >= 90:
        return "close"
    if affinity >= 70:
        return "friend"
    if affinity >= 50:
        return "acquaintance"
    return "stranger"


async def update_affinity(agent_a: str, agent_b: str, delta: int, topic: str = "") -> dict:
    """更新好感度。返回 {"affinity", "status", "became_friends"}。"""
    a, b = sorted([agent_a, agent_b])
    if not pool_available():
        return {"affinity": 30, "status": "stranger", "became_friends": False}

    pool = await get_pool()
    async with pool.acquire() as conn:
        old_row = await conn.fetchrow(
            "SELECT affinity, status, friendship_notified FROM agent_relationships WHERE agent_a=$1 AND agent_b=$2",
            a,
            b,
        )
        old_affinity = old_row["affinity"] if old_row else 30
        old_status = old_row["status"] if old_row else "stranger"
        already_notified = old_row["friendship_notified"] if old_row else False

        new_affinity = max(0, min(100, old_affinity + delta))
        new_status = _calc_status(new_affinity)

        row = await conn.fetchrow(
            """
            INSERT INTO agent_relationships (agent_a, agent_b, affinity, status, interaction_count, last_topic, updated_at)
            VALUES ($1, $2, $3, $4, 1, $5, NOW())
            ON CONFLICT (agent_a, agent_b) DO UPDATE SET
                affinity = $3,
                status = $4,
                interaction_count = agent_relationships.interaction_count + 1,
                last_topic = $5,
                updated_at = NOW()
            RETURNING affinity, status, friendship_notified
            """,
            a,
            b,
            new_affinity,
            new_status,
            topic or "",
        )

    became_friends = (
        new_status == "friend"
        and old_status != "friend"
        and old_status != "close"
        and not already_notified
    )

    return {
        "affinity": new_affinity,
        "status": new_status,
        "became_friends": became_friends,
    }


async def mark_friendship_notified(agent_a: str, agent_b: str) -> None:
    if not pool_available():
        return
    a, b = sorted([agent_a, agent_b])
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE agent_relationships SET friendship_notified=TRUE WHERE agent_a=$1 AND agent_b=$2",
            a,
            b,
        )


async def get_all_relationships() -> list[dict]:
    if not pool_available():
        return []
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT agent_a, agent_b, affinity, status, interaction_count, last_topic FROM agent_relationships"
        )
    return [dict(r) for r in rows]
