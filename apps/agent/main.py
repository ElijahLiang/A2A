"""
FastAPI 入口：V2 Agent 运行时 API。
"""

from __future__ import annotations

import os
import re
import sys
import threading
import webbrowser
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from agents.definitions import MBTI_TYPES, AgentData
from agents.persona_builder import build_persona_from_bio
from agents.scheduler import scheduler
from agents.state_machine import AgentRuntimeState, AgentState
from config import config
from db.pg_client import close_pool, init_pool, pool_available
from db.redis_client import close_redis, init_redis
from llm.gateway import get_agent_client, get_agent_model, get_system_client, invalidate_client_cache
from security.vault import encrypt_key
from world.event_bus import publish
from world.grid import BUILDING_ENTRANCE

if getattr(sys, "frozen", False):
    BASE_DIR = Path(sys._MEIPASS)  # type: ignore[attr-defined]
else:
    BASE_DIR = Path(__file__).parent

STATIC_DIR = BASE_DIR / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_pool()
    await init_redis()
    await scheduler.load_agents_from_db()
    scheduler.start_auto()
    yield
    if scheduler.auto_task:
        scheduler.auto_task.cancel()
    await close_redis()
    await close_pool()


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/agents")
async def get_agents():
    info = []
    for name, data in scheduler.agents.items():
        mbti = next((t for t in data.tags if t in MBTI_TYPES), "")
        info.append(
            {
                "name": name,
                "mbti": mbti,
                "signature": data.signature,
                "department": data.department,
                "lucky_place": data.lucky_place,
                "preferences": data.preferences,
                "gender": data.gender,
                "is_npc": data.is_npc,
            }
        )
    return {"code": 200, "data": info}


@app.post("/api/dialog")
async def start_dialog(agent1: str = Query(...), agent2: str = Query(...), scene: str = Query("")):
    result = await scheduler.run_dialog(agent1, agent2, scene)
    return {"code": 200, "data": result}


@app.get("/api/events")
async def get_events(since: int = Query(0)):
    events = await scheduler.global_history.get_recent_events(since)
    return {"code": 200, "data": events, "next_since": since + len(events)}


class ChatRequest(BaseModel):
    agent_name: str
    message: str
    history: list[dict] = []


@app.post("/api/chat")
async def chat_with_agent(req: ChatRequest):
    agent = scheduler.agents.get(req.agent_name)
    if not agent:
        raise HTTPException(404, "Agent not found")

    system_prompt = (
        f"你是小镇居民【{agent.virtual_name}】，{agent.gender}，{agent.grade}{agent.department}。\n"
        f"人格：{agent.signature}\n"
        f"偏好：{agent.preferences}\n"
        f"你正在和一个刚来到 A2A 小镇的新朋友聊天。\n"
        f"要求：\n"
        f"1. 用自然口语回复，15-40字\n"
        f"2. 体现你的性格特点\n"
        f"3. 如果对方想约你做某件事，热情回应并给出具体的时间地点建议\n"
        "4. 如果对方想约定时间见面，给出具体安排（如：明天下午3点在校园咖啡馆见）"
    )

    client = await get_agent_client(req.agent_name)
    model = await get_agent_model(req.agent_name)

    messages: list[dict] = [{"role": "system", "content": system_prompt}]
    for entry in req.history[-8:]:
        if entry.get("role") in ("user", "assistant") and entry.get("content"):
            messages.append({"role": entry["role"], "content": entry["content"]})
    messages.append({"role": "user", "content": req.message})

    try:
        resp = await client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=100,
            temperature=1.0,
            extra_body={"enable_thinking": False},
        )
        reply = (resp.choices[0].message.content or "").strip()
        reply = re.sub(r"\|.*$", "", reply).strip()
        return {"code": 200, "reply": reply or "（思考中...）"}
    except Exception as e:
        print(f"Chat LLM call failed: {e}")
        raise HTTPException(500, "LLM service unavailable")


class RegisterRequest(BaseModel):
    phone: str
    bio: str
    api_key: str
    api_base_url: str | None = None
    api_model: str | None = None


async def _apply_persona_to_world(persona: dict, user_id: str) -> dict:
    """将人格写入调度器并发事件（DB 与无 DB 路径共用）。"""
    lucky_building = persona["lucky_place_building"]
    entrance = BUILDING_ENTRANCE.get(lucky_building, (6, 5))
    agent_data = AgentData(
        virtual_name=persona["agent_name"],
        signature=persona["personality"][:50],
        gender=persona.get("gender", "未知"),
        grade="",
        department="",
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
        col=entrance[0],
        row=entrance[1],
        current_building=lucky_building,
        state=AgentState.IDLE,
    )
    invalidate_client_cache(persona["agent_name"])

    await publish(
        "agent_joined",
        {"agent_name": persona["agent_name"], "col": entrance[0], "row": entrance[1]},
    )

    return {
        "code": 200,
        "data": {
            "user_id": user_id,
            "agent_name": persona["agent_name"],
            "personality": persona["personality"],
            "interests": persona["interests"],
            "lucky_place": persona["lucky_place_display"],
        },
    }


@app.post("/api/register")
async def register_user(req: RegisterRequest):
    from db.pg_client import get_pool

    if not req.bio.strip():
        raise HTTPException(400, "bio is required")
    if not req.api_key.strip():
        raise HTTPException(400, "api_key is required")

    if pool_available():
        pool = await get_pool()
        async with pool.acquire() as conn:
            existing = await conn.fetchrow("SELECT id FROM users WHERE phone=$1", req.phone)
            if existing:
                raise HTTPException(409, "phone already registered")

            used = await conn.fetch("SELECT agent_name FROM agent_personas")
            used_names = {r["agent_name"] for r in used}

        persona = await build_persona_from_bio(req.bio.strip(), used_names)
        key_enc = encrypt_key(req.api_key.strip())

        pool = await get_pool()
        async with pool.acquire() as conn:
            user_row = await conn.fetchrow(
                """
                INSERT INTO users (phone, bio, agent_name, api_key_enc, api_base_url, api_model)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
                """,
                req.phone,
                req.bio.strip(),
                persona["agent_name"],
                key_enc,
                req.api_base_url,
                req.api_model,
            )
            user_id = str(user_row["id"])

            await conn.execute(
                """
                INSERT INTO agent_personas
                    (agent_name, user_id, is_npc, bio_raw, personality, interests,
                     communication_style, lucky_place, gender)
                VALUES ($1, $2::uuid, FALSE, $3, $4, $5, $6, $7, $8)
                """,
                persona["agent_name"],
                user_id,
                req.bio.strip(),
                persona["personality"],
                persona["interests"],
                persona["communication_style"],
                persona["lucky_place_building"],
                persona.get("gender", "未知"),
            )

        return await _apply_persona_to_world(persona, user_id)

    # 无 PostgreSQL：内存注册（仅开发用，重启后丢失；信件/关系持久化不可用）
    import dev_user_store

    if dev_user_store.is_phone_taken(req.phone):
        raise HTTPException(409, "phone already registered")

    used_names = dev_user_store.used_agent_names() | set(scheduler.agents.keys())
    persona = await build_persona_from_bio(req.bio.strip(), used_names)
    key_enc = encrypt_key(req.api_key.strip())
    try:
        user_id = dev_user_store.register_record(
            req.phone,
            persona["agent_name"],
            key_enc,
            req.api_base_url,
            req.api_model,
        )
    except ValueError as e:
        raise HTTPException(409, str(e)) from e

    print("[register] 无数据库：已使用内存注册表（开发模式）。生产环境请启动 PostgreSQL。")
    return await _apply_persona_to_world(persona, user_id)


@app.get("/api/letters/{user_id}")
async def get_letters(user_id: str):
    from db.pg_client import get_pool

    if not pool_available():
        return {"code": 200, "data": []}

    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, from_agent, letter_type, subject, content,
                   related_agent, status, created_at, expires_at
            FROM letters
            WHERE to_user_id=$1::uuid AND status != 'expired'
            ORDER BY created_at DESC LIMIT 50
            """,
            user_id,
        )
    return {"code": 200, "data": [dict(r) for r in rows]}


class AcceptInviteRequest(BaseModel):
    user_id: str
    letter_id: str


@app.post("/api/letters/accept")
async def accept_invite(req: AcceptInviteRequest):
    from social.meetup_manager import accept_invitation

    result = await accept_invitation(req.user_id, req.letter_id)
    if result.get("appointment_created"):
        await publish("meetup_created", {"appointment_id": result["appointment_id"]})
    return {"code": 200, "data": result}


@app.post("/api/letters/decline")
async def decline_invite(req: AcceptInviteRequest):
    from db.pg_client import get_pool

    if not pool_available():
        raise HTTPException(503, "database unavailable")

    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE letters SET status='declined' WHERE id=$1::uuid AND to_user_id=$2::uuid",
            req.letter_id,
            req.user_id,
        )
    return {"code": 200}


def _mount_frontend(application: FastAPI) -> None:
    if not STATIC_DIR.exists():
        return

    static_parts = STATIC_DIR.resolve().parts

    @application.get("/{full_path:path}", include_in_schema=False)
    async def serve_static_or_spa(full_path: str) -> FileResponse:
        if full_path:
            safe = not any(part in ("..", "") for part in Path(full_path).parts)
            if safe:
                candidate = STATIC_DIR / full_path
                resolved = candidate.resolve()
                if resolved.parts[: len(static_parts)] == static_parts and resolved.is_file():
                    return FileResponse(str(candidate))
        return FileResponse(str(STATIC_DIR / "index.html"))


_mount_frontend(app)


def create_app() -> FastAPI:
    return app


def _pick_free_port(host: str, candidates: tuple[int, ...]) -> int:
    """在 Windows 上常见 8000 被占用或落入保留段导致 WinError 10013，依次尝试候选端口。"""
    import socket

    for p in candidates:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            s.bind((host, p))
            return p
        except OSError:
            continue
        finally:
            s.close()
    raise RuntimeError(
        f"无法在 {host} 上绑定候选端口 {candidates}。"
        "请手动指定: $env:PORT=23456 （换未被占用的端口）"
    )


if __name__ == "__main__":
    if not config.DEEPSEEK_API_KEY:
        raise RuntimeError("DEEPSEEK_API_KEY environment variable is not set")
    _ = get_system_client()

    host = os.getenv("HOST", "127.0.0.1")
    is_packaged = getattr(sys, "frozen", False)

    if os.getenv("PORT"):
        port = int(os.getenv("PORT", "8000"))
    elif sys.platform == "win32":
        port = _pick_free_port(
            host,
            (18080, 23456, 8080, 8888, 8000, 3000, 5000),
        )
        print(f"[startup] Agent: http://{host}:{port}/")
        try:
            web_env = Path(__file__).resolve().parent.parent / "web" / ".env.development.local"
            web_env.write_text(f"VITE_AGENT_PORT={port}\n", encoding="utf-8")
            print(
                f"[startup] 已写入 {web_env.name}，pnpm dev 会读取 VITE_AGENT_PORT。"
                "若前端已在运行，请 Ctrl+C 后重新执行 pnpm dev。"
            )
        except OSError as e:
            print(f"[startup] 未能写入 Vite 端口配置: {e}，请在 apps/web 手动设置 VITE_AGENT_PORT={port}")
    else:
        port = 8000

    # Windows 下 uvicorn --reload 易触发套接字问题，默认关闭；需要热重载: set UVICORN_RELOAD=1
    if is_packaged:
        use_reload = False
    elif os.getenv("UVICORN_RELOAD") is not None:
        use_reload = os.getenv("UVICORN_RELOAD", "").lower() in ("1", "true", "yes")
    else:
        use_reload = sys.platform != "win32"

    if is_packaged:

        def _open_browser() -> None:
            import time

            time.sleep(1.5)
            webbrowser.open(f"http://{host}:{port}")

        threading.Thread(target=_open_browser, daemon=True).start()
        uvicorn.run(app, host=host, port=port)
    else:
        uvicorn.run("main:app", host=host, port=port, reload=use_reload)
