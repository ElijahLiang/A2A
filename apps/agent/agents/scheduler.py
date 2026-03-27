"""
Agent 调度：对话、好感度、生成式循环与搭子邀约。
"""

from __future__ import annotations

import asyncio
import random
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from fastapi import HTTPException

from agents.definitions import MBTI_TYPES, AgentData, CAMPUS_PERSONALITIES
from agents.generative_loop import generative_loop
from agents.relationship import update_affinity
from agents.state_machine import AgentRuntimeState, AgentState
from config import config
from db.pg_client import get_pool, pool_available
from llm.gateway import generate_dialog_turn
from world.grid import BUILDING_ENTRANCE, building_display


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


class GlobalDialogHistory:
    def __init__(self) -> None:
        self.history: dict[str, list[DialogMessage]] = {}
        self.lock = asyncio.Lock()
        self.recent_events: list[dict] = []

    async def add_message(self, dialog_id: str, msg: DialogMessage) -> None:
        async with self.lock:
            if dialog_id not in self.history:
                self.history[dialog_id] = []
            self.history[dialog_id].append(msg)
            self.recent_events.append(
                {
                    "type": "dialog",
                    "dialog_id": dialog_id,
                    "speaker": msg.speaker_id,
                    "receiver": msg.receiver_id,
                    "content": msg.content,
                    "emotion": msg.emotion,
                    "scene": msg.scene,
                    "timestamp": msg.timestamp,
                }
            )
            if len(self.recent_events) > 100:
                self.recent_events = self.recent_events[-50:]

    async def get_history(self, dialog_id: str) -> list[DialogMessage]:
        async with self.lock:
            return list(self.history.get(dialog_id, []))

    async def get_recent_events(self, since_index: int = 0) -> list[dict]:
        async with self.lock:
            return self.recent_events[since_index:]


def _emotion_delta(emotion: str) -> int:
    if emotion == "positive":
        return 5
    if emotion == "negative":
        return -2
    return 1


class AgentScheduler:
    def __init__(self) -> None:
        self.agents: dict[str, AgentData] = {}
        self.states: dict[str, AgentRuntimeState] = {}
        self.global_history = GlobalDialogHistory()
        self.lock = asyncio.Lock()
        self.semaphore = asyncio.Semaphore(config.MAX_CONCURRENT_TASKS)
        self.auto_task: Optional[asyncio.Task] = None

    async def load_agents_from_db(self) -> None:
        npc_start_positions = {
            "Mira": (2, 7),
            "Kai": (10, 7),
            "Luca": (2, 3),
            "Yuki": (6, 7),
        }
        for mbti, cfg in CAMPUS_PERSONALITIES.items():
            name = cfg["name"]
            data = AgentData(
                virtual_name=name,
                signature=cfg["signature"],
                gender=cfg["gender"],
                grade=cfg["grade"],
                department=cfg["department"],
                tags=cfg["tags"],
                restrictions=cfg["restrictions"],
                preferences=cfg["preferences"],
                lucky_place=cfg["lucky_place"],
                interest_vector=list(cfg.get("interest_vector", [])),
                home_building=cfg.get("home_building", "square"),
                is_npc=True,
                user_id=None,
            )
            self.agents[name] = data
            col, row = npc_start_positions.get(name, (6, 5))
            hb = data.home_building
            self.states[name] = AgentRuntimeState(
                name=name,
                col=col,
                row=row,
                current_building=hb,
                state=AgentState.IDLE,
            )

        if not pool_available():
            print(
                f"[Scheduler] DB 不可用，仅加载 NPC：{len(self.agents)} agents"
            )
            return

        pool = await get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT ap.agent_name, ap.user_id, ap.personality, ap.interests,
                       ap.communication_style, ap.lucky_place, u.phone
                FROM agent_personas ap
                JOIN users u ON ap.user_id = u.id
                WHERE ap.is_npc = FALSE
                """
            )

        user_rows = list(rows)
        for row in user_rows:
            name = row["agent_name"]
            lucky_building = row["lucky_place"] or "cafe"
            entrance = BUILDING_ENTRANCE.get(lucky_building, (6, 5))
            interests = list(row["interests"] or [])
            data = AgentData(
                virtual_name=name,
                signature=(row["personality"] or "")[:80],
                gender="未知",
                grade="",
                department="",
                tags=interests,
                restrictions="",
                preferences=", ".join(interests),
                lucky_place=lucky_building,
                interest_vector=interests,
                home_building=lucky_building,
                is_npc=False,
                user_id=str(row["user_id"]),
            )
            self.agents[name] = data
            self.states[name] = AgentRuntimeState(
                name=name,
                col=entrance[0],
                row=entrance[1],
                current_building=lucky_building,
                state=AgentState.IDLE,
            )

        print(
            f"[Scheduler] 已加载 {len(self.agents)} 个 Agent（含 {len(user_rows)} 个用户 Agent + {len(CAMPUS_PERSONALITIES)} 个 NPC）"
        )

    async def _generate_msg(
        self,
        speaker: AgentData,
        listener: AgentData,
        round_num: int,
        scene: str,
        dialog_id: str,
    ) -> Optional[DialogMessage]:
        my_name = speaker.virtual_name
        other_name = listener.virtual_name
        all_history = await self.global_history.get_history(dialog_id)
        talent_str = "、".join(t for t in speaker.tags if t not in MBTI_TYPES)
        other_talent_str = "、".join(t for t in listener.tags if t not in MBTI_TYPES)

        system_prompt = (
            f"你是【{my_name}】，{speaker.gender}，{speaker.grade}{speaker.department}。\n"
            f"人格：{speaker.signature}\n"
            f"天赋：{talent_str}，偏好：{speaker.preferences}\n"
            f"正在和【{other_name}】在{scene}聊天。对方天赋：{other_talent_str}，偏好：{listener.preferences}\n"
            f"限定：{speaker.restrictions}\n"
            f"要求：用自然口语回复，15-30字，体现你的性格。输出格式：回复内容|情绪(positive/negative/neutral)"
        )

        messages: list[dict] = []
        for msg in all_history[-6:]:
            role = "assistant" if msg.speaker_id == my_name else "user"
            messages.append({"role": role, "content": msg.content})

        if not all_history:
            messages.append({"role": "user", "content": f"（在{scene}遇到了{other_name}，打个招呼吧）"})
        elif messages and messages[-1]["role"] == "assistant":
            messages.append({"role": "user", "content": f"（{other_name}在等你说话）"})

        content, emotion = await generate_dialog_turn(
            my_name,
            system_prompt,
            messages,
            max_tokens=80,
            temperature=1.1,
        )
        if not content:
            return None

        msg = DialogMessage(
            speaker_id=my_name,
            receiver_id=other_name,
            content=content,
            round_num=round_num,
            scene=scene,
            emotion=emotion,
        )
        await self.global_history.add_message(dialog_id, msg)
        return msg

    async def _get_persona_dict(self, agent_name: str) -> dict:
        if pool_available():
            pool = await get_pool()
            async with pool.acquire() as conn:
                row = await conn.fetchrow(
                    "SELECT personality, interests, communication_style FROM agent_personas WHERE agent_name=$1",
                    agent_name,
                )
            if row:
                return dict(row)
        data = self.agents.get(agent_name)
        if data:
            return {
                "personality": data.signature,
                "interests": data.tags,
                "communication_style": "",
            }
        return {"personality": "", "interests": [], "communication_style": ""}

    async def _send_friendship_invitation(
        self,
        agent_a: str,
        agent_b: str,
        scene: str,
        last_topic: str,
    ) -> None:
        from agents.relationship import mark_friendship_notified
        from social.letter_writer import send_friendship_invitation

        if not pool_available():
            return

        pool = await get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT agent_name, user_id FROM agent_personas
                WHERE agent_name = ANY($1) AND is_npc = FALSE AND user_id IS NOT NULL
                """,
                [agent_a, agent_b],
            )

        if len(rows) < 2:
            print(
                f"[Scheduler] Skipping friendship invite: one or both are NPCs ({agent_a}, {agent_b})"
            )
            return

        user_map = {r["agent_name"]: str(r["user_id"]) for r in rows}
        user_a_id = user_map.get(agent_a)
        user_b_id = user_map.get(agent_b)
        if not user_a_id or not user_b_id:
            return

        await send_friendship_invitation(
            agent_a,
            user_a_id,
            agent_b,
            user_b_id,
            scene,
            last_topic,
        )
        await mark_friendship_notified(agent_a, agent_b)

    async def run_dialog(self, name1: str, name2: str, scene: str = "") -> dict:
        async with self.semaphore:
            a1 = self.agents.get(name1)
            a2 = self.agents.get(name2)
            if not a1 or not a2:
                raise HTTPException(404, "Agent not found")

            building = scene or random.choice([a1.home_building, a2.home_building]) or "square"
            scene_label = building_display(building)

            dialog_id = f"auto_{uuid.uuid4().hex[:8]}"
            dialogs: list[dict] = []
            affinity_delta = 0
            last_topic = ""

            for rnd in range(1, config.MAX_DIALOG_ROUNDS + 1):
                speaker, listener = (a1, a2) if rnd % 2 == 1 else (a2, a1)
                msg = await self._generate_msg(speaker, listener, rnd, scene_label, dialog_id)
                if not msg:
                    break
                affinity_delta += _emotion_delta(msg.emotion)
                last_topic = msg.content[:40]
                dialogs.append(
                    {
                        "speaker": msg.speaker_id,
                        "receiver": msg.receiver_id,
                        "content": msg.content,
                        "emotion": msg.emotion,
                        "scene": msg.scene,
                        "round": msg.round_num,
                        "timestamp": msg.timestamp,
                    }
                )

            event_desc = f"与{name2}进行了{len(dialogs)}轮对话，聊到了：{last_topic or '日常'}"
            await generative_loop.perceive(name1, scene_label, [name2], event_desc)
            event_desc2 = f"与{name1}进行了{len(dialogs)}轮对话，聊到了：{last_topic or '日常'}"
            await generative_loop.perceive(name2, scene_label, [name1], event_desc2)

            persona1 = await self._get_persona_dict(name1)
            persona2 = await self._get_persona_dict(name2)
            asyncio.create_task(generative_loop.reflect(name1, persona1))
            asyncio.create_task(generative_loop.reflect(name2, persona2))

            rel_result = await update_affinity(name1, name2, affinity_delta, last_topic)
            if rel_result["became_friends"]:
                asyncio.create_task(
                    self._send_friendship_invitation(name1, name2, scene_label, last_topic)
                )

            return {
                "dialog_id": dialog_id,
                "agent1": name1,
                "agent2": name2,
                "scene": scene_label,
                "building_id": building,
                "rounds": len(dialogs),
                "dialog_content": dialogs,
            }

    async def auto_interact(self) -> None:
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

    def start_auto(self) -> None:
        if not self.auto_task or self.auto_task.done():
            self.auto_task = asyncio.create_task(self.auto_interact())


scheduler = AgentScheduler()
