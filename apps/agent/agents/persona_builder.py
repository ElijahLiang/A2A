"""
从用户 bio 生成 Agent 人格。
"""

from __future__ import annotations

import json
import random
import re

from llm.gateway import call_llm_with_system_key

NAME_POOL = [
    "Alex",
    "River",
    "Sky",
    "Robin",
    "Sage",
    "Quinn",
    "Remi",
    "Lark",
    "Wren",
    "Echo",
    "Finn",
    "Nova",
    "Cleo",
    "Bay",
    "Sloane",
    "Reed",
]

BUILDING_TAGS = {
    "cafe": ["咖啡", "美食", "轻松", "社交", "休闲"],
    "library": ["阅读", "学习", "安静", "思考", "技术", "代码"],
    "art_studio": ["绘画", "摄影", "创意", "美学", "设计"],
    "debate_hall": ["辩论", "思想", "演讲", "逻辑", "创业"],
    "psych_center": ["心理", "共情", "倾诉", "公益", "情感"],
    "square": ["活动", "社交", "展览", "聚集", "认识新人"],
}


async def build_persona_from_bio(bio: str, used_names: set[str]) -> dict:
    available_names = [n for n in NAME_POOL if n not in used_names]
    pool_hint = ", ".join(available_names) if available_names else "Alex"

    prompt = f"""用户介绍自己：「{bio}」

请为这位用户生成一个校园小镇 AI 分身的人格档案，返回严格的 JSON（只返回 JSON）：

{{
  "agent_name": "从以下名字池中选一个未被占用的英文名：{pool_hint}",
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
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            data = json.loads(match.group())
            name = data.get("agent_name", "")
            if name in used_names or name not in NAME_POOL:
                available = [n for n in NAME_POOL if n not in used_names]
                name = random.choice(available) if available else f"Agent{len(used_names)}"
                data["agent_name"] = name

            place_map = {
                "咖啡馆": "cafe",
                "图书馆": "library",
                "艺术工作室": "art_studio",
                "辩论厅": "debate_hall",
                "心理中心": "psych_center",
                "小镇广场": "square",
            }
            lucky_cn = data.get("lucky_place", "咖啡馆")
            data["lucky_place_building"] = place_map.get(lucky_cn, "cafe")
            data["lucky_place_display"] = lucky_cn

            return data
    except Exception as e:
        print(f"[persona_builder] LLM failed: {e}")

    return _fallback_persona(bio, used_names)


def _fallback_persona(bio: str, used_names: set[str]) -> dict:
    available = [n for n in NAME_POOL if n not in used_names]
    name = random.choice(available) if available else "Alex"

    interests: list[str] = []
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
        "lucky_place_building": "cafe",
        "lucky_place_display": "咖啡馆",
        "gender": "未知",
    }
