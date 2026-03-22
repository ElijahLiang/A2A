"""
A2A Agent Runtime - DeepSeek V3 驱动的多智能体自主社交系统
"""
import asyncio
import os
import sys
import uuid
import random
import re
import threading
import webbrowser
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pydantic import BaseModel
import uvicorn
from openai import AsyncOpenAI

# PyInstaller 打包时 __file__ 指向临时解压目录
if getattr(sys, "frozen", False):
    BASE_DIR = Path(sys._MEIPASS)  # type: ignore[attr-defined]
else:
    BASE_DIR = Path(__file__).parent

STATIC_DIR = BASE_DIR / "dist"

# ======================== 核心配置 ========================
class Config:
    DEEPSEEK_BASE_URL: str = os.getenv("DEEPSEEK_BASE_URL", "https://www.aiping.cn/api/v1")
    DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "")
    DEEPSEEK_MODEL: str = os.getenv("DEEPSEEK_MODEL", "DeepSeek-V3.2")
    MAX_DIALOG_ROUNDS: int = 8
    DIALOG_TIMEOUT: int = 30
    MAX_CONCURRENT_TASKS: int = 10
    API_CALL_DELAY: float = 0.3
    MATCH_SCORE_THRESHOLD: int = 80
    AUTO_INTERACTION_INTERVAL: int = 8
    CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")

config = Config()

if not config.DEEPSEEK_API_KEY:
    raise RuntimeError("DEEPSEEK_API_KEY environment variable is not set")

llm_client = AsyncOpenAI(
    base_url=config.DEEPSEEK_BASE_URL,
    api_key=config.DEEPSEEK_API_KEY,
)

MBTI_TYPES = {"INTP","INTJ","INFP","INFJ","ISTP","ISTJ","ISFP","ISFJ",
              "ENTP","ENTJ","ENFP","ENFJ","ESTP","ESTJ","ESFP","ESFJ"}

CAMPUS_PERSONALITIES = {
    "INFP": {"name": "Mira", "signature": "以温柔解构世界，偏爱灵魂共鸣", "tags": ["INFP", "诗歌", "心理学", "公益"],
             "preferences": "诗歌创作，心理倾诉，公益活动，星空漫步", "restrictions": "拒绝尖锐批评",
             "lucky_place": "校园湖畔", "gender": "女", "grade": "大二", "department": "文学院"},
    "ENTP": {"name": "Kai", "signature": "碰撞观点火花，偏爱开放式讨论", "tags": ["ENTP", "辩论", "创业", "脑洞"],
             "preferences": "辩论赛，创业路演，脑洞风暴，跨学科讨论", "restrictions": "拒绝刻板思维",
             "lucky_place": "辩论社活动室", "gender": "男", "grade": "大三", "department": "法学院"},
    "ISFP": {"name": "Luca", "signature": "沉浸当下感受，偏爱具象的美好", "tags": ["ISFP", "绘画", "摄影", "美食"],
             "preferences": "街头摄影，手作咖啡，油画创作，探店打卡", "restrictions": "拒绝抽象讨论",
             "lucky_place": "艺术长廊", "gender": "男", "grade": "大二", "department": "美术学院"},
    "ENFJ": {"name": "Yuki", "signature": "理解他人需求，偏爱有温度的引领", "tags": ["ENFJ", "共情", "策划", "心理疏导"],
             "preferences": "心理沙龙，活动策划，朋辈辅导，公益演讲", "restrictions": "拒绝冷漠",
             "lucky_place": "心理咨询中心", "gender": "女", "grade": "大三", "department": "心理学系"},
}

EMOTION_KEYWORDS = {
    "positive": ["开心", "喜欢", "舒服", "有趣", "棒", "好", "甜", "暖", "合拍", "聊得来", "超", "巨", "懂", "哈哈"],
    "negative": ["无聊", "烦", "讨厌", "尬", "累", "差", "冷", "不合拍", "没话聊", "无语", "emo"],
    "neutral": ["一般", "普通", "还行", "随便", "哦", "嗯"]
}

# ======================== 数据结构 ========================
@dataclass
class AgentData:
    virtual_name: str
    signature: str
    gender: str
    grade: str
    department: str
    tags: list[str]
    restrictions: str
    preferences: str
    lucky_place: str = ""

@dataclass
class DialogMessage:
    speaker_id: str
    receiver_id: str
    content: str
    message_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    round_num: int = 0
    scene: str = "campus"
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    emotion: str = "neutral"

# ======================== 全局对话历史 ========================
class GlobalDialogHistory:
    def __init__(self):
        self.history: dict[str, list[DialogMessage]] = {}
        self.lock = asyncio.Lock()
        self.recent_events: list[dict] = []

    async def add_message(self, dialog_id: str, msg: DialogMessage):
        async with self.lock:
            if dialog_id not in self.history:
                self.history[dialog_id] = []
            self.history[dialog_id].append(msg)
            self.recent_events.append({
                "type": "dialog",
                "dialog_id": dialog_id,
                "speaker": msg.speaker_id,
                "receiver": msg.receiver_id,
                "content": msg.content,
                "emotion": msg.emotion,
                "scene": msg.scene,
                "timestamp": msg.timestamp,
            })
            if len(self.recent_events) > 100:
                self.recent_events = self.recent_events[-50:]

    async def get_history(self, dialog_id: str) -> list[DialogMessage]:
        async with self.lock:
            return list(self.history.get(dialog_id, []))

    async def get_recent_events(self, since_index: int = 0) -> list[dict]:
        async with self.lock:
            return self.recent_events[since_index:]

# ======================== 智能体 ========================
class CampusAgent:
    def __init__(self, data: AgentData):
        self.data = data
        self.mbti = next((t for t in data.tags if t in MBTI_TYPES), "INFP")

    def analyze_emotion(self, text: str) -> str:
        t = text.lower()
        if any(k in t for k in EMOTION_KEYWORDS["positive"]):
            return "positive"
        if any(k in t for k in EMOTION_KEYWORDS["negative"]):
            return "negative"
        return "neutral"

    async def generate_msg(
        self, other: "CampusAgent", round_num: int, scene: str,
        dialog_id: str, history: GlobalDialogHistory
    ) -> Optional[DialogMessage]:
        await asyncio.sleep(config.API_CALL_DELAY)

        my_name = self.data.virtual_name
        other_name = other.data.virtual_name
        all_history = await history.get_history(dialog_id)
        talent_str = "、".join(t for t in self.data.tags if t not in MBTI_TYPES)
        other_talent_str = "、".join(t for t in other.data.tags if t not in MBTI_TYPES)

        system_prompt = (
            f"你是【{my_name}】，{self.data.gender}，{self.data.grade}{self.data.department}。\n"
            f"人格：{self.data.signature}\n"
            f"天赋：{talent_str}，偏好：{self.data.preferences}\n"
            f"正在和【{other_name}】在{scene}聊天。对方天赋：{other_talent_str}，偏好：{other.data.preferences}\n"
            f"限定：{self.data.restrictions}\n"
            f"要求：用自然口语回复，15-30字，体现你的性格。输出格式：回复内容|情绪(positive/negative/neutral)"
        )

        messages: list[dict] = [{"role": "system", "content": system_prompt}]
        for msg in all_history[-6:]:
            role = "assistant" if msg.speaker_id == my_name else "user"
            messages.append({"role": role, "content": msg.content})

        if not all_history:
            messages.append({"role": "user", "content": f"（在{scene}遇到了{other_name}，打个招呼吧）"})
        elif messages[-1]["role"] == "assistant":
            messages.append({"role": "user", "content": f"（{other_name}在等你说话）"})

        try:
            resp = await llm_client.chat.completions.create(
                model=config.DEEPSEEK_MODEL,
                messages=messages,
                max_tokens=80,
                temperature=1.1,
                extra_body={"enable_thinking": False},
            )
            raw = resp.choices[0].message.content.strip()
            raw = raw.replace(f"{my_name}：", "").replace(f"{my_name}:", "").replace("｜", "|")

            if "|" in raw:
                parts = raw.rsplit("|", 1)
                content = re.sub(r'\|(positive|negative|neutral)\s*', '', parts[0]).strip()
                emotion_raw = parts[1].strip()
                emotion = emotion_raw if emotion_raw in ("positive", "negative", "neutral") else self.analyze_emotion(content)
            else:
                content = raw
                emotion = self.analyze_emotion(content)

            if not content:
                return None

            msg = DialogMessage(
                speaker_id=my_name, receiver_id=other_name,
                content=content, round_num=round_num,
                scene=scene, emotion=emotion,
            )
            await history.add_message(dialog_id, msg)
            return msg

        except Exception as e:
            print(f"LLM call failed: {e}")
            return None

# ======================== 智能体池 ========================
class AgentPool:
    def __init__(self):
        self.agents: dict[str, CampusAgent] = {}
        self.global_history = GlobalDialogHistory()
        self.lock = asyncio.Lock()
        self.semaphore = asyncio.Semaphore(config.MAX_CONCURRENT_TASKS)
        self.auto_task: Optional[asyncio.Task] = None

    async def init_agents(self):
        async with self.lock:
            for mbti, cfg in CAMPUS_PERSONALITIES.items():
                data = AgentData(
                    virtual_name=cfg["name"], signature=cfg["signature"],
                    gender=cfg["gender"], grade=cfg["grade"], department=cfg["department"],
                    tags=cfg["tags"], restrictions=cfg["restrictions"],
                    preferences=cfg["preferences"],
                    lucky_place=cfg["lucky_place"],
                )
                self.agents[cfg["name"]] = CampusAgent(data)
        print(f"Initialized {len(self.agents)} agents")

    async def run_dialog(self, name1: str, name2: str, scene: str = "") -> dict:
        async with self.semaphore:
            a1 = self.agents.get(name1)
            a2 = self.agents.get(name2)
            if not a1 or not a2:
                raise HTTPException(404, "Agent not found")

            if not scene:
                scene = random.choice([a1.data.lucky_place, a2.data.lucky_place]) or "校园"

            dialog_id = f"auto_{uuid.uuid4().hex[:8]}"
            dialogs = []

            for rnd in range(1, config.MAX_DIALOG_ROUNDS + 1):
                speaker, listener = (a1, a2) if rnd % 2 == 1 else (a2, a1)
                msg = await speaker.generate_msg(listener, rnd, scene, dialog_id, self.global_history)
                if not msg:
                    break
                dialogs.append({
                    "speaker": msg.speaker_id, "receiver": msg.receiver_id,
                    "content": msg.content, "emotion": msg.emotion,
                    "scene": msg.scene, "round": msg.round_num,
                    "timestamp": msg.timestamp,
                })

            return {
                "dialog_id": dialog_id,
                "agent1": name1, "agent2": name2,
                "scene": scene, "rounds": len(dialogs),
                "dialog_content": dialogs,
            }

    async def auto_interact(self):
        while True:
            try:
                names = list(self.agents.keys())
                if len(names) >= 2:
                    a1, a2 = random.sample(names, 2)
                    result = await self.run_dialog(a1, a2)
                    print(f"Auto dialog: {a1} <-> {a2}, {result['rounds']} rounds")
            except Exception as e:
                print(f"Auto interact error: {e}")
            await asyncio.sleep(config.AUTO_INTERACTION_INTERVAL)

    def start_auto(self):
        if not self.auto_task or self.auto_task.done():
            self.auto_task = asyncio.create_task(self.auto_interact())

# ======================== FastAPI ========================
pool = AgentPool()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await pool.init_agents()
    pool.start_auto()
    yield
    if pool.auto_task:
        pool.auto_task.cancel()

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/agents")
async def get_agents():
    info = [
        {
            "name": name, "mbti": agent.mbti,
            "signature": agent.data.signature,
            "department": agent.data.department,
            "lucky_place": agent.data.lucky_place,
            "preferences": agent.data.preferences,
            "gender": agent.data.gender,
        }
        for name, agent in pool.agents.items()
    ]
    return {"code": 200, "data": info}

@app.post("/api/dialog")
async def start_dialog(agent1: str = Query(...), agent2: str = Query(...), scene: str = Query("")):
    result = await pool.run_dialog(agent1, agent2, scene)
    return {"code": 200, "data": result}

@app.get("/api/events")
async def get_events(since: int = Query(0)):
    events = await pool.global_history.get_recent_events(since)
    return {"code": 200, "data": events, "next_since": since + len(events)}


class ChatRequest(BaseModel):
    agent_name: str
    message: str
    history: list[dict] = []

@app.post("/api/chat")
async def chat_with_agent(req: ChatRequest):
    agent = pool.agents.get(req.agent_name)
    if not agent:
        raise HTTPException(404, "Agent not found")

    system_prompt = (
        f"你是小镇居民【{agent.data.virtual_name}】，{agent.data.gender}，{agent.data.grade}{agent.data.department}。\n"
        f"人格：{agent.data.signature}\n"
        f"偏好：{agent.data.preferences}\n"
        f"你正在和一个刚来到 A2A 小镇的新朋友聊天。\n"
        f"要求：\n"
        f"1. 用自然口语回复，15-40字\n"
        f"2. 体现你的性格特点\n"
        f"3. 如果对方想约你做某件事，热情回应并给出具体的时间地点建议\n"
        "4. 如果对方想约定时间见面，给出具体安排（如：明天下午3点在校园咖啡馆见）"
    )

    messages: list[dict] = [{"role": "system", "content": system_prompt}]
    for entry in req.history[-8:]:
        if entry.get("role") in ("user", "assistant") and entry.get("content"):
            messages.append({"role": entry["role"], "content": entry["content"]})
    messages.append({"role": "user", "content": req.message})

    try:
        resp = await llm_client.chat.completions.create(
            model=config.DEEPSEEK_MODEL,
            messages=messages,
            max_tokens=100,
            temperature=1.0,
            extra_body={"enable_thinking": False},
        )
        reply = resp.choices[0].message.content.strip()
        reply = re.sub(r'\|.*$', '', reply).strip()
        return {"code": 200, "reply": reply or "（思考中...）"}
    except Exception as e:
        print(f"Chat LLM call failed: {e}")
        raise HTTPException(500, "LLM service unavailable")


def _mount_frontend(application: FastAPI) -> None:
    """如果 dist/ 目录存在（生产打包），挂载前端静态资源并添加 SPA 兜底路由。

    优先返回真实文件（图片、JS、CSS 等），路由不匹配文件时才回退到 index.html。
    macOS 下 /tmp → /private/tmp 符号链接会导致 resolve().is_relative_to() 比较失败，
    因此直接用 Path.parts 做前缀检查，避免 symlink 引起的误判。
    """
    if not STATIC_DIR.exists():
        return

    static_parts = STATIC_DIR.resolve().parts

    @application.get("/{full_path:path}", include_in_schema=False)
    async def serve_static_or_spa(full_path: str) -> FileResponse:
        if full_path:
            # 拒绝目录穿越（FastAPI path 参数本身不会传入 ..，双重保险）
            safe = not any(part in ("..", "") for part in Path(full_path).parts)
            if safe:
                candidate = STATIC_DIR / full_path
                resolved = candidate.resolve()
                if resolved.parts[:len(static_parts)] == static_parts and resolved.is_file():
                    return FileResponse(str(candidate))
        # SPA 路由兜底
        return FileResponse(str(STATIC_DIR / "index.html"))


_mount_frontend(app)


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "127.0.0.1")

    # 打包后以单进程方式运行，开发模式保留 reload
    is_packaged = getattr(sys, "frozen", False)

    if is_packaged:
        def _open_browser() -> None:
            import time
            time.sleep(1.5)
            webbrowser.open(f"http://{host}:{port}")

        threading.Thread(target=_open_browser, daemon=True).start()
        uvicorn.run(app, host=host, port=port)
    else:
        uvicorn.run("server:app", host=host, port=port, reload=True)
