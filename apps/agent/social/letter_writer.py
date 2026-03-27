"""
Agent 向真实用户写信。
"""

from __future__ import annotations

import asyncio

from agents.memory import get_recent_observations
from db.pg_client import get_pool, pool_available
from llm.gateway import call_llm_with_system_key


async def write_friendship_letter(
    writer_agent: str,
    other_agent: str,
    scene: str,
    last_topic: str,
    other_user_id: str,
) -> str:
    all_memories = await get_recent_observations(writer_agent, limit=10)
    related = [m for m in all_memories if other_agent in m][:3]
    memory_text = "；".join(related) if related else f"我们在{scene}相遇"

    personality = ""
    comm_style = "自然真诚"
    if pool_available():
        pool = await get_pool()
        async with pool.acquire() as conn:
            persona_row = await conn.fetchrow(
                "SELECT personality, communication_style FROM agent_personas WHERE agent_name=$1",
                writer_agent,
            )
        if persona_row:
            personality = persona_row["personality"] or ""
            comm_style = persona_row["communication_style"] or comm_style

    prompt = f"""你是「{writer_agent}」，正在给自己的真实用户写一封信。
你的人格：{personality}
你的说话风格：{comm_style}

事情经过：你在{scene}认识了「{other_agent}」，聊到了"{last_topic}"，感觉很合拍。
你对这段经历的记忆：{memory_text}

请以你（{writer_agent}）的视角，给你的主人写一封简短的信（80-120字）：
1. 用第一人称，真实自然，体现你的性格
2. 说说你们怎么认识的、聊了什么、你的感受
3. 最后问一下主人：要不要约对方出来见面？
4. 不要格式化，像真实的消息一样

只写信的正文，不加称呼和落款。"""

    try:
        content = await call_llm_with_system_key(prompt, max_tokens=200, temperature=0.9)
        return content.strip()
    except Exception as e:
        print(f"[letter_writer] Failed: {e}")
        return (
            f"主人，我在{scene}认识了{other_agent}，"
            f"我们聊了很多，感觉挺合拍的。"
            f"要不要约Ta出来见面？"
        )


async def save_letter_to_db(
    from_agent: str,
    to_user_id: str,
    letter_type: str,
    content: str,
    subject: str,
    related_agent: str | None = None,
    related_user_id: str | None = None,
) -> str:
    if not pool_available():
        return ""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO letters (from_agent, to_user_id, letter_type, subject, content, related_agent, related_user_id)
            VALUES ($1, $2::uuid, $3, $4, $5, $6, $7::uuid)
            RETURNING id
            """,
            from_agent,
            to_user_id,
            letter_type,
            subject,
            content,
            related_agent,
            related_user_id,
        )
    return str(row["id"])


async def send_friendship_invitation(
    agent_a: str,
    user_a_id: str,
    agent_b: str,
    user_b_id: str,
    scene: str,
    last_topic: str,
) -> tuple[str, str]:
    content_a, content_b = await asyncio.gather(
        write_friendship_letter(agent_a, agent_b, scene, last_topic, user_b_id),
        write_friendship_letter(agent_b, agent_a, scene, last_topic, user_a_id),
    )

    subject = f"我在{scene}交到了新朋友！"

    letter_a_id, letter_b_id = await asyncio.gather(
        save_letter_to_db(
            agent_a,
            user_a_id,
            "friendship_invite",
            content_a,
            subject,
            agent_b,
            user_b_id,
        ),
        save_letter_to_db(
            agent_b,
            user_b_id,
            "friendship_invite",
            content_b,
            subject,
            agent_a,
            user_a_id,
        ),
    )

    print(f"[LetterWriter] Sent friendship invite: {agent_a}→{user_a_id}, {agent_b}→{user_b_id}")
    return letter_a_id, letter_b_id
