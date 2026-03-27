"""PostgreSQL 连接池与 V2 Schema 初始化。"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

import asyncpg

from config import config

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)

_pool: asyncpg.Pool | None = None

SCHEMA_SQL = """
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone           VARCHAR(20) UNIQUE NOT NULL,
    bio             TEXT NOT NULL,
    agent_name      VARCHAR(30) NOT NULL,
    agent_avatar    VARCHAR(10) DEFAULT '🐱',
    api_key_enc     TEXT,
    api_base_url    TEXT,
    api_model       VARCHAR(50),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_personas (
    agent_name      VARCHAR(30) PRIMARY KEY,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    is_npc          BOOLEAN DEFAULT FALSE,
    bio_raw         TEXT,
    personality     TEXT,
    interests       TEXT[],
    communication_style TEXT,
    lucky_place     VARCHAR(50),
    gender          VARCHAR(10) DEFAULT '未知',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memory_stream (
    id              BIGSERIAL PRIMARY KEY,
    agent_name      VARCHAR(30) NOT NULL,
    memory_type     VARCHAR(15) NOT NULL,
    content         TEXT NOT NULL,
    importance      SMALLINT DEFAULT 5,
    embedding       vector(1536),
    access_count    INT DEFAULT 0,
    last_accessed   TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_relationships (
    id              BIGSERIAL PRIMARY KEY,
    agent_a         VARCHAR(30) NOT NULL,
    agent_b         VARCHAR(30) NOT NULL,
    affinity        SMALLINT DEFAULT 30,
    status          VARCHAR(20) DEFAULT 'stranger',
    interaction_count INT DEFAULT 0,
    last_topic      TEXT,
    friendship_notified BOOLEAN DEFAULT FALSE,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agent_a, agent_b)
);

CREATE TABLE IF NOT EXISTS dialog_logs (
    id              BIGSERIAL PRIMARY KEY,
    dialog_id       VARCHAR(40) NOT NULL,
    agent_a         VARCHAR(30) NOT NULL,
    agent_b         VARCHAR(30) NOT NULL,
    speaker         VARCHAR(30) NOT NULL,
    content         TEXT NOT NULL,
    emotion         VARCHAR(10) DEFAULT 'neutral',
    scene           VARCHAR(50),
    round_num       SMALLINT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS letters (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_agent      VARCHAR(30),
    to_user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
    letter_type     VARCHAR(20) NOT NULL,
    subject         TEXT,
    content         TEXT NOT NULL,
    related_agent   VARCHAR(30),
    related_user_id UUID,
    status          VARCHAR(10) DEFAULT 'unread',
    expires_at      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meetup_appointments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id       UUID REFERENCES users(id),
    user_b_id       UUID REFERENCES users(id),
    agent_a         VARCHAR(30),
    agent_b         VARCHAR(30),
    venue           VARCHAR(50),
    activity_type   VARCHAR(30),
    status          VARCHAR(20) DEFAULT 'pending',
    letter_a_id     UUID,
    letter_b_id     UUID,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memory_stream_agent ON memory_stream(agent_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_stream_type ON memory_stream(agent_name, memory_type);
CREATE INDEX IF NOT EXISTS idx_relationships_pair ON agent_relationships(agent_a, agent_b);
CREATE INDEX IF NOT EXISTS idx_letters_user ON letters(to_user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dialog_logs_id ON dialog_logs(dialog_id);
"""


async def init_pool() -> asyncpg.Pool | None:
    global _pool
    if _pool is not None:
        return _pool
    dsn = config.DATABASE_URL.strip()
    if not dsn:
        logger.warning("DATABASE_URL 未设置，跳过 PostgreSQL 初始化")
        return None
    try:
        _pool = await asyncpg.create_pool(dsn, min_size=1, max_size=10)
        async with _pool.acquire() as conn:
            await conn.execute(SCHEMA_SQL)
        logger.info("PostgreSQL 已连接并完成 Schema 初始化")
    except Exception as e:
        logger.warning("PostgreSQL 连接失败: %s (将仅使用内存 NPC 模式)", e)
        _pool = None
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


async def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("数据库未初始化，请设置 DATABASE_URL 并启动 PostgreSQL")
    return _pool


def pool_available() -> bool:
    return _pool is not None
