"""
LLM API 网关。
- 用户 Agent：使用该用户注册时提供的 API Key（从数据库读取解密）
- NPC Agent：使用系统环境变量中的 Key
"""

from __future__ import annotations

import asyncio
import re

from openai import AsyncOpenAI

from config import config
from db.pg_client import get_pool, pool_available
from security.vault import decrypt_key

import dev_user_store

_system_client: AsyncOpenAI | None = None
_user_clients: dict[str, AsyncOpenAI] = {}


def get_system_client() -> AsyncOpenAI:
    global _system_client
    if _system_client is None:
        _system_client = AsyncOpenAI(
            base_url=config.DEEPSEEK_BASE_URL,
            api_key=config.DEEPSEEK_API_KEY,
        )
    return _system_client


async def get_agent_client(agent_name: str) -> AsyncOpenAI:
    if agent_name in _user_clients:
        return _user_clients[agent_name]

    dev = dev_user_store.get_credential(agent_name)
    if dev and dev.api_key_enc:
        try:
            plaintext_key = decrypt_key(dev.api_key_enc)
            client = AsyncOpenAI(
                base_url=dev.api_base_url or config.DEEPSEEK_BASE_URL,
                api_key=plaintext_key,
            )
            _user_clients[agent_name] = client
            return client
        except Exception as e:
            print(f"[gateway] Dev store key failed for {agent_name}: {e}")

    if not pool_available():
        return get_system_client()

    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT u.api_key_enc, u.api_base_url, u.api_model
            FROM users u
            JOIN agent_personas ap ON ap.user_id = u.id
            WHERE ap.agent_name = $1 AND ap.is_npc = FALSE
            """,
            agent_name,
        )

    if row and row["api_key_enc"]:
        try:
            plaintext_key = decrypt_key(row["api_key_enc"])
            client = AsyncOpenAI(
                base_url=row["api_base_url"] or config.DEEPSEEK_BASE_URL,
                api_key=plaintext_key,
            )
            _user_clients[agent_name] = client
            return client
        except Exception as e:
            print(f"[gateway] Failed to load user key for {agent_name}: {e}")

    return get_system_client()


async def call_llm_with_system_key(
    prompt: str,
    max_tokens: int = 200,
    temperature: float = 0.7,
) -> str:
    client = get_system_client()
    resp = await client.chat.completions.create(
        model=config.DEEPSEEK_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=temperature,
        extra_body={"enable_thinking": False},
    )
    return (resp.choices[0].message.content or "").strip()


async def generate_dialog_turn(
    agent_name: str,
    system_prompt: str,
    messages: list[dict],
    max_tokens: int = 80,
    temperature: float = 1.1,
) -> tuple[str, str]:
    client = await get_agent_client(agent_name)
    model = await get_agent_model(agent_name)
    await asyncio.sleep(config.API_CALL_DELAY)
    resp = await client.chat.completions.create(
        model=model,
        messages=[{"role": "system", "content": system_prompt}] + messages,
        max_tokens=max_tokens,
        temperature=temperature,
        extra_body={"enable_thinking": False},
    )
    raw = (resp.choices[0].message.content or "").strip()
    raw = re.sub(r"^[\u4e00-\u9fff\w]+[：:]\s*", "", raw).replace("｜", "|")

    if "|" in raw:
        parts = raw.rsplit("|", 1)
        content = re.sub(r"\|(positive|negative|neutral)\s*$", "", parts[0]).strip()
        emotion_raw = parts[1].strip()
        emotion = (
            emotion_raw if emotion_raw in ("positive", "negative", "neutral") else _analyze_emotion(content)
        )
    else:
        content = raw
        emotion = _analyze_emotion(content)

    return content or "（沉默）", emotion


async def get_agent_model(agent_name: str) -> str:
    dev = dev_user_store.get_credential(agent_name)
    if dev and dev.api_model:
        return dev.api_model
    if not pool_available():
        return config.DEEPSEEK_MODEL
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT u.api_model FROM users u
            JOIN agent_personas ap ON ap.user_id = u.id
            WHERE ap.agent_name = $1
            """,
            agent_name,
        )
    if row and row["api_model"]:
        return row["api_model"]
    return config.DEEPSEEK_MODEL


def _analyze_emotion(text: str) -> str:
    pos = ["开心", "喜欢", "舒服", "有趣", "棒", "好", "甜", "暖", "合拍", "哈哈", "超", "巨"]
    neg = ["无聊", "烦", "讨厌", "尬", "累", "差", "冷", "不合拍", "无语", "emo"]
    if any(k in text for k in pos):
        return "positive"
    if any(k in text for k in neg):
        return "negative"
    return "neutral"


def invalidate_client_cache(agent_name: str) -> None:
    _user_clients.pop(agent_name, None)
