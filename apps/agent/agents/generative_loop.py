"""
斯坦福小镇式生成式 Agent 循环（简化版）。
"""

from __future__ import annotations

from datetime import datetime

from agents.memory import (
    add_observation,
    add_reflection,
    get_recent_observations,
    get_relevant_memories,
    should_trigger_reflection,
)
from llm.gateway import call_llm_with_system_key


class GenerativeAgentLoop:
    async def perceive(
        self,
        agent_name: str,
        scene: str,
        other_agents: list[str],
        event: str,
    ) -> str:
        others_str = "、".join(other_agents) if other_agents else "没有其他人"
        observation = f"[{datetime.now().strftime('%H:%M')}] 在{scene}，{others_str}也在这里。{event}"
        await add_observation(agent_name, observation, importance=5)
        return observation

    async def retrieve(self, agent_name: str, context: str, limit: int = 6) -> list[str]:
        return await get_relevant_memories(agent_name, context, limit)

    async def reflect(self, agent_name: str, persona: dict) -> list[str]:
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
            reflections = [line.strip() for line in raw.split("\n") if line.strip()][:3]
            for r in reflections:
                await add_reflection(agent_name, r, importance=8)
            print(f"[Reflect] {agent_name} generated {len(reflections)} reflections")
            return reflections
        except Exception as e:
            print(f"[Reflect] Failed for {agent_name}: {e}")
            return []

    async def plan(self, agent_name: str, persona: dict, current_scene: str) -> str:
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


generative_loop = GenerativeAgentLoop()
