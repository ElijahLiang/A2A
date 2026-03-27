# A2A 校园沙盒 V2 — 用户具身 Agent 开发规格文档

> **核心产品逻辑**：每个用户注册后拥有一个由自己 API Key 驱动的具身 Agent，
> Agent 在小镇中像斯坦福小镇（Generative Agents）那样自主生活、社交、形成关系，
> 当 Agent 发展出真实友谊时，向真实用户发出"搭子邀约"。

---

## 与 V1 规格的核心差异

| 维度 | V1（旧） | V2（本文档）|
|------|---------|------------|
| Agent 来源 | 4个固定 NPC（Mira/Kai/Luca/Yuki）| 每个注册用户生成1个专属 Agent |
| API Key | 系统统一 Key | **用户自带 Key**，驱动自己的 Agent |
| 4个固定 Agent | 主角 | 降为 NPC 种子（世界不空洞）|
| Agent 行为 | 随机配对对话 | **斯坦福小镇式**：感知→记忆→反思→计划→行动 |
| 用户与 Agent 关系 | 用户旁观 Agent | **Agent 向用户汇报社交结果 + 发出邀约** |
| 信箱 | 活动匹配邀请 | **Agent 主动写信给用户**（已实现 MailContext）|

---

## 核心用户故事（给 Cursor 理解产品意图）

```
1. 用户小A 填写：「我喜欢安静写代码，偶尔也想找人喝一杯。」
   → 系统生成 Agent「Alex」，性格：内敛/技术控/偶尔社交

2. 用户小B 填写：「喜欢摄影和咖啡，喜欢认识有趣的人。」
   → 系统生成 Agent「Bea」，性格：艺术/开朗/喜欢社交

3. Alex 和 Bea 在小镇咖啡馆相遇（引力场驱动），
   用 各自用户的 API Key 进行 LLM 对话，
   聊了 4 轮，情绪均为 positive，好感度达到 75

4. 系统触发"成为朋友"事件：
   → Alex 写信给小A：「我在咖啡馆认识了 Bea，她喜欢摄影，
     我们聊得很开心。Ta 的真实用户也是你的同学，要一起约个搭子吗？」
   → Bea 写信给小B：同上（Bea 视角）

5. 小A 点「确认约搭子」→ 小B 也确认 → 系统生成线下约定
```

---

## 数据库 Schema（替换 V1 Schema）

```sql
-- 执行顺序必须如下（有外键依赖）

CREATE EXTENSION IF NOT EXISTS pgvector;

-- 用户表（增加 api_key_enc 字段）
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone           VARCHAR(20) UNIQUE NOT NULL,
    bio             TEXT NOT NULL,              -- 用户一句话简介
    agent_name      VARCHAR(30) NOT NULL,       -- 生成的 Agent 昵称
    agent_avatar    VARCHAR(10) DEFAULT '🐱',   -- Emoji 头像
    api_key_enc     TEXT,                       -- AES-256 加密后的用户 API Key
    api_base_url    TEXT,                       -- 用户自定义 Base URL（可选）
    api_model       VARCHAR(50),                -- 用户指定的模型（可选）
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Agent 人格表（从用户 bio 生成，独立存储便于扩展）
CREATE TABLE IF NOT EXISTS agent_personas (
    agent_name      VARCHAR(30) PRIMARY KEY,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    is_npc          BOOLEAN DEFAULT FALSE,       -- TRUE=系统NPC, FALSE=用户Agent
    bio_raw         TEXT,                        -- 原始一句话
    personality     TEXT,                        -- LLM生成的详细人格描述
    interests       TEXT[],                      -- 兴趣标签数组
    communication_style TEXT,                   -- 说话风格
    lucky_place     VARCHAR(50),                 -- 偏好地点
    gender          VARCHAR(10) DEFAULT '未知',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Agent 记忆流（斯坦福小镇核心：每条观察/反思/计划都是一条记录）
CREATE TABLE IF NOT EXISTS memory_stream (
    id              BIGSERIAL PRIMARY KEY,
    agent_name      VARCHAR(30) NOT NULL,
    memory_type     VARCHAR(15) NOT NULL,    -- 'observation'|'reflection'|'plan'
    content         TEXT NOT NULL,
    importance      SMALLINT DEFAULT 5,      -- 1-10，反思时用
    embedding       vector(1536),            -- 可选，后续语义检索
    access_count    INT DEFAULT 0,           -- 被检索次数（决定遗忘）
    last_accessed   TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Agent 关系图谱
CREATE TABLE IF NOT EXISTS agent_relationships (
    id              BIGSERIAL PRIMARY KEY,
    agent_a         VARCHAR(30) NOT NULL,
    agent_b         VARCHAR(30) NOT NULL,
    affinity        SMALLINT DEFAULT 30,     -- 0-100（陌生人默认30）
    status          VARCHAR(20) DEFAULT 'stranger', -- stranger|acquaintance|friend|close
    interaction_count INT DEFAULT 0,
    last_topic      TEXT,
    friendship_notified BOOLEAN DEFAULT FALSE, -- 是否已发出搭子邀约
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agent_a, agent_b)
);

-- 对话记录
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

-- 信件表（用于 Agent→用户 通知和搭子邀约）
CREATE TABLE IF NOT EXISTS letters (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_agent      VARCHAR(30),             -- 写信的 Agent
    to_user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
    letter_type     VARCHAR(20) NOT NULL,    -- 'friendship_invite'|'activity_report'|'system'
    subject         TEXT,                    -- 信件标题
    content         TEXT NOT NULL,           -- 信件正文（Agent 第一人称）
    related_agent   VARCHAR(30),             -- 涉及的另一个 Agent
    related_user_id UUID,                    -- 涉及的另一个用户
    status          VARCHAR(10) DEFAULT 'unread', -- unread|read|accepted|declined|expired
    expires_at      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 约定表（双方确认后生成）
CREATE TABLE IF NOT EXISTS meetup_appointments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id       UUID REFERENCES users(id),
    user_b_id       UUID REFERENCES users(id),
    agent_a         VARCHAR(30),
    agent_b         VARCHAR(30),
    venue           VARCHAR(50),             -- 线下约定地点建议（Agent生成）
    activity_type   VARCHAR(30),             -- 'coffee'|'study'|'photo_walk' 等
    status          VARCHAR(20) DEFAULT 'pending', -- pending|confirmed|completed|cancelled
    letter_a_id     UUID,                    -- 触发约定的信件ID（用户A）
    letter_b_id     UUID,                    -- 触发约定的信件ID（用户B）
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_memory_stream_agent ON memory_stream(agent_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_stream_type ON memory_stream(agent_name, memory_type);
CREATE INDEX IF NOT EXISTS idx_relationships_pair ON agent_relationships(agent_a, agent_b);
CREATE INDEX IF NOT EXISTS idx_letters_user ON letters(to_user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dialog_logs_id ON dialog_logs(dialog_id);
```

---

## 后端目录结构（基于 V1 调整）

```
apps/agent/
├── main.py                      # FastAPI 入口 + WebSocket
├── config.py                    # 配置
├── db/
│   ├── redis_client.py
│   └── pg_client.py             # 含上方 Schema SQL
├── world/
│   ├── grid.py                  # 12x10 网格（同 V1）
│   ├── loop.py                  # 世界循环（同 V1）
│   └── event_bus.py             # 事件总线（同 V1）
├── agents/
│   ├── definitions.py           # NPC 定义 + AgentPersona 数据类
│   ├── state_machine.py         # Agent 状态机（同 V1）
│   ├── scheduler.py             # ★ 重点改造：支持用户 Agent
│   ├── generative_loop.py       # ★ 新增：斯坦福小镇感知→反思→计划
│   ├── attraction.py            # 兴趣引力场（同 V1）
│   ├── affinity.py              # 亲和力计算（同 V1）
│   ├── memory.py                # ★ 重点改造：记忆流系统
│   ├── relationship.py          # ★ 重点改造：关系状态机 + 触发邀约
│   └── persona_builder.py       # ★ 新增：从用户 bio 生成 Agent 人格
├── llm/
│   └── gateway.py               # ★ 改造：按 agent_name 路由到对应用户 Key
├── social/
│   ├── __init__.py
│   ├── letter_writer.py         # ★ 新增：Agent 第一人称写信给用户
│   └── meetup_manager.py        # ★ 新增：约定生命周期管理
└── security/
    ├── __init__.py
    └── vault.py                 # ★ 新增：AES-256 Key 加解密
```

---

## 模块实现规格

---

### 模块 A：安全层 — `security/vault.py`

用户 API Key 用 AES-256-GCM 加密后存入 PostgreSQL，绝不明文落库。

```python
"""
AES-256-GCM 加密存储用户 API Key。
Master Key 从环境变量读取，生产环境应使用 KMS。
"""
import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def _get_master_key() -> bytes:
    raw = os.getenv("KEY_VAULT_MASTER_KEY", "dev_master_key_change_in_prod_32b")
    # 保证32字节
    return raw.encode()[:32].ljust(32, b'\x00')

def encrypt_key(plaintext: str) -> str:
    """加密 API Key，返回 base64 编码的 nonce+ciphertext"""
    aesgcm = AESGCM(_get_master_key())
    nonce = os.urandom(12)
    ct = aesgcm.encrypt(nonce, plaintext.encode(), None)
    return base64.b64encode(nonce + ct).decode()

def decrypt_key(encoded: str) -> str:
    """解密，返回明文 API Key"""
    aesgcm = AESGCM(_get_master_key())
    raw = base64.b64decode(encoded.encode())
    nonce, ct = raw[:12], raw[12:]
    return aesgcm.decrypt(nonce, ct, None).decode()
```

---

### 模块 B：人格构建 — `agents/persona_builder.py`

从用户一句话 bio 用 LLM 生成完整 Agent 人格，**注册时调用一次**。

```python
"""
从用户 bio 生成 Agent 人格。
这是注册流程的核心步骤，决定 Agent 的一切行为倾向。
"""
import re
import json
import random
from llm.gateway import call_llm_with_system_key

# 可用的 Agent 名字池（中性昵称，避免MBTI标签）
NAME_POOL = [
    "Alex", "River", "Sky", "Robin", "Sage", "Quinn", "Remi", "Lark",
    "Wren", "Echo", "Finn", "Nova", "Cleo", "Bay", "Sloane", "Reed",
]

# 建筑兴趣标签（与 grid.py 保持一致）
BUILDING_TAGS = {
    "cafe":         ["咖啡", "美食", "轻松", "社交", "休闲"],
    "library":      ["阅读", "学习", "安静", "思考", "技术", "代码"],
    "art_studio":   ["绘画", "摄影", "创意", "美学", "设计"],
    "debate_hall":  ["辩论", "思想", "演讲", "逻辑", "创业"],
    "psych_center": ["心理", "共情", "倾诉", "公益", "情感"],
    "square":       ["活动", "社交", "展览", "聚集", "认识新人"],
}

async def build_persona_from_bio(bio: str, used_names: set[str]) -> dict:
    """
    输入用户一句话 bio，输出完整 Agent 人格字典。

    返回格式：
    {
        "agent_name": str,           # 英文昵称
        "personality": str,          # 一段话人格描述（给 LLM 做 system prompt 用）
        "interests": list[str],      # 兴趣标签，3-6个
        "communication_style": str,  # 说话风格描述
        "lucky_place": str,          # 偏好地点（建筑名）
        "gender": str,               # '男'|'女'|'未知'
    }
    """
    prompt = f"""用户介绍自己：「{bio}」

请为这位用户生成一个校园小镇 AI 分身的人格档案，返回严格的 JSON（只返回 JSON）：

{{
  "agent_name": "从名字池中选一个合适的：{[n for n in NAME_POOL if n not in used_names]}",
  "personality": "2-3句话描述这个分身的性格，要从bio中提炼，真实体现用户特质",
  "interests": ["兴趣1", "兴趣2", "兴趣3"],
  "communication_style": "说话风格，例如：说话简洁直接，喜欢用代码类比事物",
  "lucky_place": "最喜欢的地点，只能是以下之一：咖啡馆/图书馆/艺术工作室/辩论厅/心理中心/小镇广场",
  "gender": "根据bio推断，不确定就写未知"
}}

注意：interests 要具体，从以下关键词中选择与bio最相关的：
咖啡、美食、社交、阅读、学习、技术、代码、绘画、摄影、创意、辩论、逻辑、心理、共情、公益、安静、轻松、设计"""

    try:
        raw = await call_llm_with_system_key(prompt, max_tokens=300, temperature=0.7)
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            data = json.loads(match.group())
            # 验证 agent_name 不重复
            name = data.get("agent_name", "")
            if name in used_names or name not in NAME_POOL:
                available = [n for n in NAME_POOL if n not in used_names]
                name = random.choice(available) if available else f"Agent{len(used_names)}"
                data["agent_name"] = name

            # 映射 lucky_place 到 building_id
            place_map = {
                "咖啡馆": "cafe", "图书馆": "library",
                "艺术工作室": "art_studio", "辩论厅": "debate_hall",
                "心理中心": "psych_center", "小镇广场": "square",
            }
            lucky_cn = data.get("lucky_place", "咖啡馆")
            data["lucky_place_building"] = place_map.get(lucky_cn, "cafe")
            data["lucky_place_display"] = lucky_cn

            return data
    except Exception as e:
        print(f"[persona_builder] LLM failed: {e}")

    # 降级：关键词匹配
    return _fallback_persona(bio, used_names)

def _fallback_persona(bio: str, used_names: set[str]) -> dict:
    """LLM 失败时的关键词降级方案"""
    available = [n for n in NAME_POOL if n not in used_names]
    name = random.choice(available) if available else "Alex"

    # 简单关键词匹配
    interests = []
    for building_interests in BUILDING_TAGS.values():
        for tag in building_interests:
            if tag in bio and tag not in interests:
                interests.append(tag)
    if not interests:
        interests = ["社交", "学习", "咖啡"]

    return {
        "agent_name": name,
        "personality": f"一个{bio[:20]}...的人，在小镇里寻找共鸣。",
        "interests": interests[:4],
        "communication_style": "自然真诚，说话不绕弯",
        "lucky_place": "café",
        "lucky_place_building": "cafe",
        "lucky_place_display": "咖啡馆",
        "gender": "未知",
    }
```

---

### 模块 C：LLM 网关改造 — `llm/gateway.py`

**关键改变**：每个用户 Agent 使用自己的 API Key，网关按 agent_name 路由。

```python
"""
LLM API 网关。
- 用户 Agent：使用该用户注册时提供的 API Key（从数据库读取解密）
- NPC Agent：使用系统环境变量中的 Key
- 网关层统一做重试、超时、格式清洗
"""
import re
import asyncio
from openai import AsyncOpenAI
from config import config
from security.vault import decrypt_key
from db.pg_client import get_pool

# NPC 使用系统 Key
_system_client: AsyncOpenAI | None = None

# 用户 Agent 客户端缓存（内存，进程级别）
# key: agent_name, value: AsyncOpenAI
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
    """
    获取 Agent 对应的 LLM 客户端。
    用户 Agent → 解密用户 API Key
    NPC → 系统 Key
    """
    if agent_name in _user_clients:
        return _user_clients[agent_name]

    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT u.api_key_enc, u.api_base_url, u.api_model
            FROM users u
            JOIN agent_personas ap ON ap.user_id = u.id
            WHERE ap.agent_name = $1 AND ap.is_npc = FALSE
        """, agent_name)

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

    # 降级到系统 Key（NPC 或 Key 失效时）
    return get_system_client()

async def call_llm_with_system_key(
    prompt: str,
    max_tokens: int = 200,
    temperature: float = 0.7,
) -> str:
    """用系统 Key 做单次调用（人格生成、信件写作等后台任务）"""
    client = get_system_client()
    resp = await client.chat.completions.create(
        model=config.DEEPSEEK_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=temperature,
        extra_body={"enable_thinking": False},
    )
    return resp.choices[0].message.content.strip()

async def generate_dialog_turn(
    agent_name: str,
    system_prompt: str,
    messages: list[dict],
    max_tokens: int = 80,
    temperature: float = 1.1,
) -> tuple[str, str]:
    """
    生成一轮对话，自动路由到正确的 LLM 客户端。
    返回 (content, emotion)。
    """
    client = await get_agent_client(agent_name)

    # 从数据库获取该 Agent 的模型偏好
    model = await _get_agent_model(agent_name)

    await asyncio.sleep(config.API_CALL_DELAY)
    resp = await client.chat.completions.create(
        model=model,
        messages=[{"role": "system", "content": system_prompt}] + messages,
        max_tokens=max_tokens,
        temperature=temperature,
        extra_body={"enable_thinking": False},
    )
    raw = resp.choices[0].message.content.strip()
    raw = re.sub(r'^[\u4e00-\u9fff\w]+[：:]\s*', '', raw).replace("｜", "|")

    if "|" in raw:
        parts = raw.rsplit("|", 1)
        content = re.sub(r'\|(positive|negative|neutral)\s*$', '', parts[0]).strip()
        emotion_raw = parts[1].strip()
        emotion = emotion_raw if emotion_raw in ("positive", "negative", "neutral") else _analyze_emotion(content)
    else:
        content = raw
        emotion = _analyze_emotion(content)

    return content or "（沉默）", emotion

async def _get_agent_model(agent_name: str) -> str:
    """获取 Agent 使用的模型，用户可自定义"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT u.api_model FROM users u
            JOIN agent_personas ap ON ap.user_id = u.id
            WHERE ap.agent_name = $1
        """, agent_name)
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

def invalidate_client_cache(agent_name: str):
    """用户更新 API Key 后调用，清除缓存"""
    _user_clients.pop(agent_name, None)
```

---

### 模块 D：斯坦福小镇 Generative Loop — `agents/generative_loop.py`

这是 V2 的核心创新。实现论文中的：**感知 → 记忆检索 → 反思 → 计划 → 行动**。

```python
"""
斯坦福小镇式生成式 Agent 循环。

参考论文：Generative Agents: Interactive Simulacra of Human Behavior
Park et al., 2023

实现简化版（不做向量检索，用时间+重要性排序）：
- 感知（Perceive）：观察周围发生了什么
- 记忆检索（Retrieve）：从记忆流中取相关记忆
- 反思（Reflect）：积累足够观察后生成高阶洞察
- 计划（Plan）：决定接下来做什么
- 行动（Act）：生成具体的对话/移动/活动行为
"""
import asyncio
from datetime import datetime
from agents.memory import (
    add_observation, get_recent_observations,
    add_reflection, get_relevant_memories,
    should_trigger_reflection
)
from llm.gateway import call_llm_with_system_key, get_agent_client
from db.pg_client import get_pool

class GenerativeAgentLoop:

    async def perceive(
        self, agent_name: str, scene: str, other_agents: list[str], event: str
    ) -> str:
        """
        感知当前环境，生成一条观察记录写入记忆流。

        参数：
        - scene: 当前所在建筑（"咖啡馆"）
        - other_agents: 同一场景的其他 Agent 名字列表
        - event: 发生的事件描述（"与 Bea 完成了一轮对话"）

        返回：observation 字符串
        """
        others_str = "、".join(other_agents) if other_agents else "没有其他人"
        observation = f"[{datetime.now().strftime('%H:%M')}] 在{scene}，{others_str}也在这里。{event}"
        await add_observation(agent_name, observation, importance=5)
        return observation

    async def retrieve(self, agent_name: str, context: str, limit: int = 6) -> list[str]:
        """
        从记忆流检索与当前上下文相关的记忆。
        当前实现：取最近N条 + 重要性最高的M条（简化版，不做向量检索）
        """
        return await get_relevant_memories(agent_name, context, limit)

    async def reflect(self, agent_name: str, persona: dict) -> list[str]:
        """
        反思：当积累了足够多的观察（通常10条），生成更高阶的洞察。
        例如：多次观察到 Bea 喜欢摄影 → 反思：Bea 是个艺术气质的人，和我审美相近

        返回新生成的反思列表。
        """
        if not await should_trigger_reflection(agent_name):
            return []

        recent = await get_recent_observations(agent_name, limit=15)
        if len(recent) < 5:
            return []

        observations_text = "\n".join(f"- {o}" for o in recent)
        prompt = f"""以下是校园小镇居民「{agent_name}」最近的生活观察记录：

{observations_text}

请基于这些观察，生成3条更深层的洞察/反思（每条不超过30字），
要有真实的心理活动，不要太表面。
格式：每行一条，不加编号。"""

        try:
            raw = await call_llm_with_system_key(prompt, max_tokens=200, temperature=0.8)
            reflections = [line.strip() for line in raw.split('\n') if line.strip()][:3]
            for r in reflections:
                await add_reflection(agent_name, r, importance=8)
            print(f"[Reflect] {agent_name} generated {len(reflections)} reflections")
            return reflections
        except Exception as e:
            print(f"[Reflect] Failed for {agent_name}: {e}")
            return []

    async def plan(self, agent_name: str, persona: dict, current_scene: str) -> str:
        """
        计划：根据人格、记忆、当前位置，决定接下来要做什么。
        返回行动描述字符串（给 scheduler 解析）。

        简化实现：不做完整日程规划，只做"下一步行动"决策。
        """
        memories = await self.retrieve(agent_name, f"在{current_scene}想做什么", limit=4)
        memory_text = "；".join(memories) if memories else "（暂无相关记忆）"

        prompt = f"""你是「{agent_name}」，{persona.get('personality', '')}
当前在：{current_scene}
近期记忆：{memory_text}

请决定接下来最想做什么（一句话，15字以内，从以下选择）：
- 继续待在这里休息
- 去咖啡馆/图书馆/艺术工作室/辩论厅/心理中心/小镇广场
- 和附近的人打招呼

只回复决定，不解释。"""

        try:
            decision = await call_llm_with_system_key(prompt, max_tokens=30, temperature=0.9)
            return decision.strip()
        except Exception:
            return "继续待在这里休息"

# 全局单例
generative_loop = GenerativeAgentLoop()
```

---

### 模块 E：记忆系统改造 — `agents/memory.py`

V2 记忆系统基于数据库的记忆流（memory_stream 表），而非 Redis List。

```python
"""
基于 PostgreSQL memory_stream 表的记忆系统。

记忆类型：
- observation：实时感知（自动生成，每次交互都有）
- reflection：反思洞察（10条观察后触发LLM生成）
- plan：计划（暂时用不到，留接口）

Redis 仍用于：临时状态缓存（Agent位置、世界快照）
"""
from db.pg_client import get_pool
from db.redis_client import get_redis

REFLECTION_TRIGGER_COUNT = 10  # 积累多少条观察触发反思

async def add_observation(agent_name: str, content: str, importance: int = 5) -> None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO memory_stream (agent_name, memory_type, content, importance) VALUES ($1, 'observation', $2, $3)",
            agent_name, content, importance
        )
    # 更新 Redis 中的反思触发计数器
    r = await get_redis()
    await r.incr(f"reflect:counter:{agent_name}")

async def add_reflection(agent_name: str, content: str, importance: int = 8) -> None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO memory_stream (agent_name, memory_type, content, importance) VALUES ($1, 'reflection', $2, $3)",
            agent_name, content, importance
        )
    # 重置反思计数器
    r = await get_redis()
    await r.set(f"reflect:counter:{agent_name}", 0)

async def should_trigger_reflection(agent_name: str) -> bool:
    """检查是否该触发反思（每积累10条观察触发一次）"""
    r = await get_redis()
    count = await r.get(f"reflect:counter:{agent_name}")
    return int(count or 0) >= REFLECTION_TRIGGER_COUNT

async def get_recent_observations(agent_name: str, limit: int = 15) -> list[str]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT content FROM memory_stream WHERE agent_name=$1 AND memory_type='observation' ORDER BY created_at DESC LIMIT $2",
            agent_name, limit
        )
    return [r["content"] for r in rows]

async def get_relevant_memories(agent_name: str, context: str, limit: int = 6) -> list[str]:
    """
    检索相关记忆。
    简化版：取最近观察 + 重要性最高的反思（不做向量检索）
    后续可接 pgvector 做语义检索。
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        # 最近3条观察
        observations = await conn.fetch(
            "SELECT content FROM memory_stream WHERE agent_name=$1 AND memory_type='observation' ORDER BY created_at DESC LIMIT 3",
            agent_name
        )
        # 重要性最高的3条反思
        reflections = await conn.fetch(
            "SELECT content FROM memory_stream WHERE agent_name=$1 AND memory_type='reflection' ORDER BY importance DESC, created_at DESC LIMIT 3",
            agent_name
        )
    result = [r["content"] for r in observations] + [r["content"] for r in reflections]
    return result[:limit]

async def build_memory_context(agent_name: str) -> str:
    """构建给 LLM prompt 用的记忆上下文字符串"""
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
```

---

### 模块 F：关系状态机 — `agents/relationship.py`

关系有明确的状态转移，达到 `friend` 状态时触发向真实用户发邀约信。

```python
"""
Agent 关系图谱。

关系状态转移：
stranger(30) → acquaintance(50) → friend(70) → close(90)

触发搭子邀约条件：
1. 关系状态变为 'friend'（affinity 首次超过 70）
2. 且 friendship_notified = FALSE（只发一次）
"""
from db.pg_client import get_pool
from social.letter_writer import write_friendship_letter

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

async def update_affinity(
    agent_a: str, agent_b: str, delta: int, topic: str = ""
) -> dict:
    """
    更新好感度。返回 {"affinity": int, "status": str, "became_friends": bool}
    became_friends=True 时调用方需要触发邀约流程。
    """
    a, b = sorted([agent_a, agent_b])
    pool = await get_pool()
    async with pool.acquire() as conn:
        old_row = await conn.fetchrow(
            "SELECT affinity, status, friendship_notified FROM agent_relationships WHERE agent_a=$1 AND agent_b=$2",
            a, b
        )
        old_affinity = old_row["affinity"] if old_row else 30
        old_status = old_row["status"] if old_row else "stranger"
        already_notified = old_row["friendship_notified"] if old_row else False

        new_affinity = max(0, min(100, old_affinity + delta))
        new_status = _calc_status(new_affinity)

        row = await conn.fetchrow("""
            INSERT INTO agent_relationships (agent_a, agent_b, affinity, status, interaction_count, last_topic, updated_at)
            VALUES ($1, $2, $3, $4, 1, $5, NOW())
            ON CONFLICT (agent_a, agent_b) DO UPDATE SET
                affinity = $3,
                status = $4,
                interaction_count = agent_relationships.interaction_count + 1,
                last_topic = $5,
                updated_at = NOW()
            RETURNING affinity, status, friendship_notified
        """, a, b, new_affinity, new_status, topic or "")

    # 判断是否刚成为朋友（首次）
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

async def mark_friendship_notified(agent_a: str, agent_b: str):
    """标记已发出邀约，防止重复发送"""
    a, b = sorted([agent_a, agent_b])
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE agent_relationships SET friendship_notified=TRUE WHERE agent_a=$1 AND agent_b=$2",
            a, b
        )

async def get_all_relationships() -> list[dict]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT agent_a, agent_b, affinity, status, interaction_count, last_topic FROM agent_relationships"
        )
    return [dict(r) for r in rows]
```

---

### 模块 G：信件写作 — `social/letter_writer.py`

Agent 以第一人称向用户写信，是整个产品情感体验的核心。

```python
"""
Agent 向真实用户写信。
信件从 Agent 第一人称出发，有温度、有细节，不是系统通知。

信件类型：
1. friendship_invite：成为朋友，邀请真实用户约搭子
2. activity_report：Agent 汇报今日动态（可定时触发）
"""
import re
from llm.gateway import call_llm_with_system_key
from db.pg_client import get_pool
from agents.memory import get_recent_observations

async def write_friendship_letter(
    writer_agent: str,      # 写信的 Agent
    other_agent: str,       # 交到的朋友 Agent
    scene: str,             # 相识场景
    last_topic: str,        # 最后聊的话题
    other_user_id: str,     # 对方用户 ID
) -> str:
    """
    让 writer_agent 以第一人称写一封"交到朋友"的信给自己的用户。
    返回信件正文。
    """
    # 取写信 Agent 关于 other_agent 的近期记忆
    all_memories = await get_recent_observations(writer_agent, limit=10)
    related = [m for m in all_memories if other_agent in m][:3]
    memory_text = "；".join(related) if related else f"我们在{scene}相遇"

    # 获取 writer_agent 的人格信息
    pool = await get_pool()
    async with pool.acquire() as conn:
        persona_row = await conn.fetchrow(
            "SELECT personality, communication_style FROM agent_personas WHERE agent_name=$1",
            writer_agent
        )
    personality = persona_row["personality"] if persona_row else ""
    comm_style = persona_row["communication_style"] if persona_row else "自然真诚"

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
    """将信件保存到数据库，返回信件 ID"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO letters (from_agent, to_user_id, letter_type, subject, content, related_agent, related_user_id)
            VALUES ($1, $2::uuid, $3, $4, $5, $6, $7::uuid)
            RETURNING id
        """, from_agent, to_user_id, letter_type, subject, content,
            related_agent, related_user_id)
    return str(row["id"])

async def send_friendship_invitation(
    agent_a: str, user_a_id: str,
    agent_b: str, user_b_id: str,
    scene: str, last_topic: str,
) -> tuple[str, str]:
    """
    双向发送搭子邀约信：
    - agent_a 写信给 user_a
    - agent_b 写信给 user_b

    返回 (letter_a_id, letter_b_id)
    """
    # 并行生成两封信
    content_a, content_b = await asyncio.gather(
        write_friendship_letter(agent_a, agent_b, scene, last_topic, user_b_id),
        write_friendship_letter(agent_b, agent_a, scene, last_topic, user_a_id),
    )

    subject = f"我在{scene}交到了新朋友！"

    # 并行保存
    letter_a_id, letter_b_id = await asyncio.gather(
        save_letter_to_db(
            agent_a, user_a_id, "friendship_invite",
            content_a, subject, agent_b, user_b_id
        ),
        save_letter_to_db(
            agent_b, user_b_id, "friendship_invite",
            content_b, subject, agent_a, user_a_id
        ),
    )

    print(f"[LetterWriter] Sent friendship invite: {agent_a}→{user_a_id}, {agent_b}→{user_b_id}")
    return letter_a_id, letter_b_id

import asyncio  # 补充 import（放文件顶部）
```

---

### 模块 H：约定管理 — `social/meetup_manager.py`

```python
"""
搭子约定生命周期。

流程：
用户A 接受邀约 → 等待用户B确认 → 双方确认 → 生成约定
"""
from db.pg_client import get_pool

async def accept_invitation(
    user_id: str,
    letter_id: str,
) -> dict:
    """
    用户接受搭子邀约。
    检查对方是否已接受，如是则创建约定。
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        # 获取信件详情
        letter = await conn.fetchrow(
            "SELECT * FROM letters WHERE id=$1::uuid AND to_user_id=$2::uuid",
            letter_id, user_id
        )
        if not letter:
            return {"success": False, "error": "letter not found"}

        # 标记当前用户已接受
        await conn.execute(
            "UPDATE letters SET status='accepted' WHERE id=$1::uuid",
            letter_id
        )

        # 检查对方是否也接受了（查对方的信件）
        other_letter = await conn.fetchrow("""
            SELECT id, status, to_user_id FROM letters
            WHERE from_agent = $1
              AND related_agent = $2
              AND related_user_id = $3::uuid
              AND letter_type = 'friendship_invite'
            ORDER BY created_at DESC LIMIT 1
        """, letter["related_agent"], letter["from_agent"], user_id)

        both_accepted = other_letter and other_letter["status"] == "accepted"

        if both_accepted:
            # 双方都接受，创建约定
            appt_id = await _create_appointment(conn, letter, other_letter)
            return {"success": True, "appointment_created": True, "appointment_id": appt_id}

    return {"success": True, "appointment_created": False, "waiting_for_partner": True}

async def _create_appointment(conn, letter_a, letter_b) -> str:
    """在数据库中创建约定记录"""
    # 让 LLM 生成一个约定建议（场所 + 活动类型）
    from llm.gateway import call_llm_with_system_key
    agent_a = letter_a["from_agent"]
    agent_b = letter_b["from_agent"]

    suggestion_prompt = f"""「{agent_a}」和「{agent_b}」成为了朋友，真实用户决定见面。
请建议一个校园约定：
- venue（地点，选一个：咖啡馆/图书馆/艺术工作室/辩论厅/广场）
- activity_type（活动，选一个：coffee/study/photo_walk/debate/walk）

只返回 JSON：{{"venue": "...", "activity_type": "..."}}"""

    try:
        import json, re
        raw = await call_llm_with_system_key(suggestion_prompt, max_tokens=60, temperature=0.5)
        match = re.search(r'\{.*\}', raw)
        suggestion = json.loads(match.group()) if match else {}
    except Exception:
        suggestion = {"venue": "咖啡馆", "activity_type": "coffee"}

    row = await conn.fetchrow("""
        INSERT INTO meetup_appointments
            (user_a_id, user_b_id, agent_a, agent_b, venue, activity_type, status, letter_a_id, letter_b_id)
        VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, 'confirmed', $7::uuid, $8::uuid)
        RETURNING id
    """,
        str(letter_a["to_user_id"]), str(letter_b["to_user_id"]),
        agent_a, agent_b,
        suggestion.get("venue", "咖啡馆"),
        suggestion.get("activity_type", "coffee"),
        str(letter_a["id"]), str(letter_b["id"])
    )
    return str(row["id"])
```

---

### 模块 I：Agent 调度器改造 — `agents/scheduler.py`（关键改动）

在 V1 调度器基础上，改造以下部分：

```python
"""
在 V1 调度器基础上改造的核心部分（其余保持不变）。
主要改动：
1. init_agents 从数据库加载用户 Agent + 静态 NPC
2. _run_chat_session 结束后触发 Generative Loop
3. 好感度达到 friend 阈值时触发邀约信
"""

# 在 AgentScheduler 类中，替换或新增以下方法：

async def load_agents_from_db(self):
    """
    启动时从数据库加载所有 Agent（NPC + 用户 Agent）。
    同时加载静态 NPC 定义（4个固定 Agent）。
    """
    from agents.definitions import CAMPUS_PERSONALITIES, AgentData
    from world.grid import BUILDING_ENTRANCE

    # 1. 加载静态 NPC
    npc_start_positions = {
        "Mira": (2, 7), "Kai": (10, 7), "Luca": (2, 3), "Yuki": (6, 7),
    }
    for mbti, cfg in CAMPUS_PERSONALITIES.items():
        name = cfg["name"]
        data = AgentData(
            virtual_name=name, signature=cfg["signature"],
            gender=cfg["gender"], grade=cfg["grade"], department=cfg["department"],
            tags=cfg["tags"], restrictions=cfg["restrictions"],
            preferences=cfg["preferences"], lucky_place=cfg["lucky_place"],
            interest_vector=cfg["interest_vector"], home_building=cfg["home_building"],
            is_npc=True, user_id=None,
        )
        self.agents[name] = data
        col, row = npc_start_positions.get(name, (6, 5))
        self.states[name] = AgentRuntimeState(name=name, col=col, row=row,
                                               current_building=cfg["home_building"],
                                               state=AgentState.IDLE)

    # 2. 从数据库加载用户 Agent
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT ap.agent_name, ap.user_id, ap.personality, ap.interests,
                   ap.communication_style, ap.lucky_place, u.phone
            FROM agent_personas ap
            JOIN users u ON ap.user_id = u.id
            WHERE ap.is_npc = FALSE
        """)

    for row in rows:
        name = row["agent_name"]
        lucky_building = row["lucky_place"] or "cafe"
        entrance = BUILDING_ENTRANCE.get(lucky_building, (6, 5))
        data = AgentData(
            virtual_name=name, signature=row["personality"][:50] if row["personality"] else "",
            gender="未知", grade="", department="",
            tags=list(row["interests"] or []),
            restrictions="", preferences=", ".join(row["interests"] or []),
            lucky_place=lucky_building, interest_vector=list(row["interests"] or []),
            home_building=lucky_building, is_npc=False, user_id=str(row["user_id"]),
        )
        self.agents[name] = data
        self.states[name] = AgentRuntimeState(name=name, col=entrance[0], row=entrance[1],
                                               current_building=lucky_building, state=AgentState.IDLE)

    print(f"[Scheduler] Loaded {len(self.agents)} agents ({len(rows)} user agents + {len(CAMPUS_PERSONALITIES)} NPCs)")

async def _run_chat_session(self, name1: str, name2: str, building: str):
    """在 V1 基础上增加：
    1. Generative Loop 感知
    2. 好感度达标触发邀约
    """
    # ... V1 的对话逻辑 ...
    # 对话结束后：

    # A. Generative Loop：双方各记录一次感知
    event_desc = f"与{name2}进行了{len(dialog_history)}轮对话，聊到了：{last_topic}"
    await generative_loop.perceive(name1, building, [name2], event_desc)
    event_desc2 = f"与{name1}进行了{len(dialog_history)}轮对话，聊到了：{last_topic}"
    await generative_loop.perceive(name2, building, [name1], event_desc2)

    # B. 异步触发反思（不阻塞）
    persona1 = await self._get_persona_dict(name1)
    persona2 = await self._get_persona_dict(name2)
    asyncio.create_task(generative_loop.reflect(name1, persona1))
    asyncio.create_task(generative_loop.reflect(name2, persona2))

    # C. 更新好感度并检查是否触发邀约
    rel_result = await update_affinity(name1, name2, affinity_delta, last_topic)
    if rel_result["became_friends"]:
        asyncio.create_task(
            self._send_friendship_invitation(name1, name2, building, last_topic)
        )

async def _send_friendship_invitation(
    self, agent_a: str, agent_b: str, scene: str, last_topic: str
):
    """触发搭子邀约：查询双方用户ID，写信，标记已通知"""
    from social.letter_writer import send_friendship_invitation
    from agents.relationship import mark_friendship_notified

    pool = await get_pool()
    async with pool.acquire() as conn:
        # 获取两个 Agent 的用户 ID（NPC 无用户 ID，跳过）
        rows = await conn.fetch("""
            SELECT agent_name, user_id FROM agent_personas
            WHERE agent_name = ANY($1) AND is_npc = FALSE AND user_id IS NOT NULL
        """, [agent_a, agent_b])

    if len(rows) < 2:
        print(f"[Scheduler] Skipping friendship invite: one or both are NPCs ({agent_a}, {agent_b})")
        return

    user_map = {r["agent_name"]: str(r["user_id"]) for r in rows}
    user_a_id = user_map.get(agent_a)
    user_b_id = user_map.get(agent_b)
    if not user_a_id or not user_b_id:
        return

    await send_friendship_invitation(
        agent_a, user_a_id, agent_b, user_b_id, scene, last_topic
    )
    await mark_friendship_notified(agent_a, agent_b)

async def _get_persona_dict(self, agent_name: str) -> dict:
    """获取 Agent 人格信息（用于 Generative Loop）"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT personality, interests, communication_style FROM agent_personas WHERE agent_name=$1",
            agent_name
        )
    if row:
        return dict(row)
    # NPC 降级
    data = self.agents.get(agent_name)
    return {"personality": data.signature if data else "", "interests": [], "communication_style": ""}
```

---

### 模块 J：注册 API — `main.py` 新增端点

```python
# 在 main.py 中新增以下端点：

class RegisterRequest(BaseModel):
    phone: str
    bio: str
    api_key: str                    # 用户自带 API Key
    api_base_url: str | None = None
    api_model: str | None = None

@app.post("/api/register")
async def register_user(req: RegisterRequest):
    """
    用户注册：
    1. 验证手机号唯一
    2. 加密存储 API Key
    3. LLM 生成 Agent 人格
    4. 将 Agent 加入世界
    5. 返回 Agent 信息
    """
    from security.vault import encrypt_key
    from agents.persona_builder import build_persona_from_bio

    if not req.bio.strip():
        raise HTTPException(400, "bio is required")
    if not req.api_key.strip():
        raise HTTPException(400, "api_key is required")

    pool = await get_pool()
    async with pool.acquire() as conn:
        # 检查手机号是否已注册
        existing = await conn.fetchrow("SELECT id FROM users WHERE phone=$1", req.phone)
        if existing:
            raise HTTPException(409, "phone already registered")

        # 获取已用 Agent 名
        used = await conn.fetch("SELECT agent_name FROM agent_personas")
        used_names = {r["agent_name"] for r in used}

    # 生成 Agent 人格（调用 LLM）
    persona = await build_persona_from_bio(req.bio.strip(), used_names)

    # 加密 API Key
    key_enc = encrypt_key(req.api_key.strip())

    pool = await get_pool()
    async with pool.acquire() as conn:
        # 插入用户
        user_row = await conn.fetchrow("""
            INSERT INTO users (phone, bio, agent_name, api_key_enc, api_base_url, api_model)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        """, req.phone, req.bio.strip(), persona["agent_name"],
            key_enc, req.api_base_url, req.api_model)

        user_id = str(user_row["id"])

        # 插入 Agent 人格
        await conn.execute("""
            INSERT INTO agent_personas
                (agent_name, user_id, is_npc, bio_raw, personality, interests,
                 communication_style, lucky_place, gender)
            VALUES ($1, $2::uuid, FALSE, $3, $4, $5, $6, $7, $8)
        """,
            persona["agent_name"], user_id, req.bio.strip(),
            persona["personality"], persona["interests"],
            persona["communication_style"],
            persona["lucky_place_building"],
            persona.get("gender", "未知")
        )

    # 将新 Agent 加入运行中的调度器
    from agents.definitions import AgentData
    from agents.state_machine import AgentRuntimeState, AgentState
    from world.grid import BUILDING_ENTRANCE

    lucky_building = persona["lucky_place_building"]
    entrance = BUILDING_ENTRANCE.get(lucky_building, (6, 5))
    agent_data = AgentData(
        virtual_name=persona["agent_name"],
        signature=persona["personality"][:50],
        gender=persona.get("gender", "未知"),
        grade="", department="",
        tags=persona["interests"],
        restrictions="",
        preferences=", ".join(persona["interests"]),
        lucky_place=persona["lucky_place_display"],
        interest_vector=persona["interests"],
        home_building=lucky_building,
        is_npc=False,
        user_id=user_id,
    )
    scheduler.agents[persona["agent_name"]] = agent_data
    scheduler.states[persona["agent_name"]] = AgentRuntimeState(
        name=persona["agent_name"],
        col=entrance[0], row=entrance[1],
        current_building=lucky_building,
        state=AgentState.IDLE,
    )

    # 广播新 Agent 加入事件
    await event_bus.publish("agent_joined", {
        "agent_name": persona["agent_name"],
        "col": entrance[0], "row": entrance[1],
    })

    return {
        "code": 200,
        "data": {
            "user_id": user_id,
            "agent_name": persona["agent_name"],
            "personality": persona["personality"],
            "interests": persona["interests"],
            "lucky_place": persona["lucky_place_display"],
        }
    }

@app.get("/api/letters/{user_id}")
async def get_letters(user_id: str, status: str = "unread"):
    """获取用户的信件列表"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id, from_agent, letter_type, subject, content,
                   related_agent, status, created_at, expires_at
            FROM letters
            WHERE to_user_id=$1::uuid AND status != 'expired'
            ORDER BY created_at DESC LIMIT 50
        """, user_id)
    return {"code": 200, "data": [dict(r) for r in rows]}

class AcceptInviteRequest(BaseModel):
    user_id: str
    letter_id: str

@app.post("/api/letters/accept")
async def accept_invite(req: AcceptInviteRequest):
    """用户接受搭子邀约"""
    from social.meetup_manager import accept_invitation
    result = await accept_invitation(req.user_id, req.letter_id)
    if result.get("appointment_created"):
        await event_bus.publish("meetup_created", {
            "appointment_id": result["appointment_id"]
        })
    return {"code": 200, "data": result}

@app.post("/api/letters/decline")
async def decline_invite(req: AcceptInviteRequest):
    """用户拒绝邀约"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE letters SET status='declined' WHERE id=$1::uuid AND to_user_id=$2::uuid",
            req.letter_id, req.user_id
        )
    return {"code": 200}
```

---

## 注册流程（用户视角）

```
用户打开 App
  ↓
[Login.tsx] 手机号登录（现有流程）
  ↓
[PersonaQuiz.tsx] 输入「一句话形容自己」+ 填写 API Key
  ↓ POST /api/register
后端：
  1. 加密 API Key → 存 users 表
  2. LLM 分析 bio → 生成 Agent 人格
  3. 创建 agent_personas 记录
  4. Agent 进入世界（scheduler.agents 热插入）
  5. WebSocket 广播 agent_joined
  ↓
前端收到 world_snapshot 更新，地图上出现用户专属 Agent
```

---

## PersonaQuiz.tsx 改造说明

**在现有 UI 结构不变的前提下，增加 API Key 输入框**：

```typescript
// 在 PersonaQuiz.tsx 中：
// 1. bio 输入框已有 → 保留
// 2. 新增 apiKey 输入框（type="password"）
// 3. 新增 apiBaseUrl 输入框（可折叠的"高级设置"）
// 4. handleSubmit 改为调用 POST /api/register 而非本地推断

// 修改后的 handleSubmit：
const handleSubmit = async () => {
  const trimmed = bio.trim()
  if (!trimmed || !apiKey.trim() || flipping) return
  setFlipping(true)

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: user?.phone || '',
        bio: trimmed,
        api_key: apiKey.trim(),
        api_base_url: apiBaseUrl.trim() || undefined,
      }),
    })
    const data = await res.json()
    if (data.code === 200) {
      updateBio(trimmed)
      setResult({
        agentName: data.data.agent_name,
        mbti: '',  // V2 不强调 MBTI
        traits: data.data.interests,
        summary: data.data.personality,
        agentDesc: data.data.personality,
        catHint: '',
      })
      setTimeout(() => setRevealPhase(1), 500)
      setTimeout(() => setRevealPhase(2), 1500)
      setTimeout(() => setRevealPhase(3), 2500)
    }
  } catch (e) {
    setFlipping(false)
    // 显示错误提示
  }
}
```

---

## WebSocket 消息类型（V2 新增）

| type | 触发时机 | data |
|------|---------|------|
| `world_snapshot` | 新连接时 | 同 V1 |
| `agent_joined` | 新用户注册 | `{ agent_name, col, row }` |
| `dialog_message` | Agent 说一句话 | 同 V1 |
| `agent_move` | Agent 开始移动 | 同 V1 |
| `agent_arrived` | Agent 到达建筑 | 同 V1 |
| `friendship_formed` | 两 Agent 成为朋友 | `{ agent_a, agent_b, scene }` |
| `letter_sent` | Agent 写信给用户 | `{ to_user_id, from_agent, letter_type }` |
| `meetup_created` | 约定生成 | `{ appointment_id }` |

---

## 已有代码复用说明（不要重写）

| 文件 | 状态 | 说明 |
|------|------|------|
| `PersonaQuiz.tsx` UI | 复用 | 只改 handleSubmit 逻辑，增加 apiKey 输入 |
| `inferPersonaFromBio.ts` | 可删除 | V2 改为服务端 LLM 生成，本地推断不再需要 |
| `MailContext.tsx` | 复用 | 已有信件系统，改 fetchMailRemote 指向 `/api/letters/{user_id}` |
| `useAgentEvents.ts` | 改造 | 改为 WebSocket 订阅（同 V1 规格） |
| `AgentSprite.tsx` | 复用 | 位置数据改用 WebSocket world_snapshot 驱动 |
| `AuthContext.tsx` | 改造 | 注册成功后存 user_id 和 agent_name |
| `infra/docker-compose.dev.yml` | 复用 | 不变 |

---

## 实现顺序（给 Cursor 的建议顺序）

```
Step 1: security/vault.py               （5分钟，纯加密逻辑）
Step 2: db/pg_client.py Schema           （V2 Schema替换V1）
Step 3: agents/persona_builder.py        （注册时生成人格）
Step 4: llm/gateway.py                   （按agent路由Key）
Step 5: agents/memory.py                 （记忆流改PG）
Step 6: agents/relationship.py           （关系状态机）
Step 7: social/letter_writer.py          （写信给用户）
Step 8: social/meetup_manager.py         （约定管理）
Step 9: agents/generative_loop.py        （感知→反思）
Step 10: agents/scheduler.py             （整合改造）
Step 11: main.py 新增端点               （register + letters）
Step 12: PersonaQuiz.tsx 改造           （加 apiKey 输入）
Step 13: MailContext.tsx fetchMail 改造  （指向新接口）
Step 14: useAgentEvents.ts WebSocket化   （同V1规格）
```

---

## 关键设计原则

1. **API Key 隔离**：每个用户的 Agent 只用该用户的 Key，失败时降级到系统 Key，不影响全局
2. **NPC 兜底**：4个固定 NPC（Mira/Kai/Luca/Yuki）保证世界不空洞，新用户注册前也有活动
3. **信件是情感核心**：Agent 写信要有温度，不能是系统通知风格，LLM 温度用 0.9
4. **邀约不重复**：`friendship_notified` 字段保证同对 Agent 只触发一次邀约
5. **用户无感运行**：用户不在线时 Agent 继续活动，上线后查信件即可
