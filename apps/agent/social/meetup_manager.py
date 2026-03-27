"""
搭子约定生命周期。
"""

from __future__ import annotations

import json
import re

from db.pg_client import get_pool, pool_available
from llm.gateway import call_llm_with_system_key


async def accept_invitation(user_id: str, letter_id: str) -> dict:
    if not pool_available():
        return {"success": False, "error": "database unavailable"}

    pool = await get_pool()
    async with pool.acquire() as conn:
        letter = await conn.fetchrow(
            "SELECT * FROM letters WHERE id=$1::uuid AND to_user_id=$2::uuid",
            letter_id,
            user_id,
        )
        if not letter:
            return {"success": False, "error": "letter not found"}

        await conn.execute(
            "UPDATE letters SET status='accepted' WHERE id=$1::uuid",
            letter_id,
        )

        other_letter = await conn.fetchrow(
            """
            SELECT * FROM letters
            WHERE from_agent = $1
              AND related_agent = $2
              AND related_user_id = $3::uuid
              AND letter_type = 'friendship_invite'
            ORDER BY created_at DESC LIMIT 1
            """,
            letter["related_agent"],
            letter["from_agent"],
            user_id,
        )

        both_accepted = bool(other_letter and other_letter["status"] == "accepted")

        if both_accepted:
            appt_id = await _create_appointment(conn, letter, other_letter)
            return {"success": True, "appointment_created": True, "appointment_id": appt_id}

    return {"success": True, "appointment_created": False, "waiting_for_partner": True}


async def _create_appointment(conn, letter_a, letter_b) -> str:
    agent_a = letter_a["from_agent"]
    agent_b = letter_b["from_agent"]

    suggestion_prompt = f"""「{agent_a}」和「{agent_b}」成为了朋友，真实用户决定见面。
请建议一个校园约定：
- venue（地点，选一个：咖啡馆/图书馆/艺术工作室/辩论厅/广场）
- activity_type（活动，选一个：coffee/study/photo_walk/debate/walk）

只返回 JSON：{{"venue": "...", "activity_type": "..."}}"""

    try:
        raw = await call_llm_with_system_key(suggestion_prompt, max_tokens=60, temperature=0.5)
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        suggestion = json.loads(match.group()) if match else {}
    except Exception:
        suggestion = {"venue": "咖啡馆", "activity_type": "coffee"}

    row = await conn.fetchrow(
        """
        INSERT INTO meetup_appointments
            (user_a_id, user_b_id, agent_a, agent_b, venue, activity_type, status, letter_a_id, letter_b_id)
        VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, 'confirmed', $7::uuid, $8::uuid)
        RETURNING id
        """,
        str(letter_a["to_user_id"]),
        str(letter_b["to_user_id"]),
        agent_a,
        agent_b,
        suggestion.get("venue", "咖啡馆"),
        suggestion.get("activity_type", "coffee"),
        str(letter_a["id"]),
        str(letter_b["id"]),
    )
    return str(row["id"])
