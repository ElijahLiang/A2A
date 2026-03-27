"""NPC 定义与 AgentData 数据类。"""

from __future__ import annotations

from dataclasses import dataclass, field

MBTI_TYPES = {
    "INTP",
    "INTJ",
    "INFP",
    "INFJ",
    "ISTP",
    "ISTJ",
    "ISFP",
    "ISFJ",
    "ENTP",
    "ENTJ",
    "ENFP",
    "ENFJ",
    "ESTP",
    "ESTJ",
    "ESFP",
    "ESFJ",
}


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
    interest_vector: list[str] = field(default_factory=list)
    home_building: str = "square"
    is_npc: bool = True
    user_id: str | None = None


# 校园 NPC：补充 home_building（与 grid 建筑 id 对齐）
CAMPUS_PERSONALITIES: dict[str, dict] = {
    "INFP": {
        "name": "Mira",
        "signature": "以温柔解构世界，偏爱灵魂共鸣",
        "tags": ["INFP", "诗歌", "心理学", "公益"],
        "preferences": "诗歌创作，心理倾诉，公益活动，星空漫步",
        "restrictions": "拒绝尖锐批评",
        "lucky_place": "校园湖畔",
        "gender": "女",
        "grade": "大二",
        "department": "文学院",
        "home_building": "psych_center",
        "interest_vector": ["诗歌", "心理学", "公益", "安静"],
    },
    "ENTP": {
        "name": "Kai",
        "signature": "碰撞观点火花，偏爱开放式讨论",
        "tags": ["ENTP", "辩论", "创业", "脑洞"],
        "preferences": "辩论赛，创业路演，脑洞风暴，跨学科讨论",
        "restrictions": "拒绝刻板思维",
        "lucky_place": "辩论社活动室",
        "gender": "男",
        "grade": "大三",
        "department": "法学院",
        "home_building": "debate_hall",
        "interest_vector": ["辩论", "创业", "脑洞", "社交"],
    },
    "ISFP": {
        "name": "Luca",
        "signature": "沉浸当下感受，偏爱具象的美好",
        "tags": ["ISFP", "绘画", "摄影", "美食"],
        "preferences": "街头摄影，手作咖啡，油画创作，探店打卡",
        "restrictions": "拒绝抽象讨论",
        "lucky_place": "艺术长廊",
        "gender": "男",
        "grade": "大二",
        "department": "美术学院",
        "home_building": "art_studio",
        "interest_vector": ["绘画", "摄影", "美食", "创意"],
    },
    "ENFJ": {
        "name": "Yuki",
        "signature": "理解他人需求，偏爱有温度的引领",
        "tags": ["ENFJ", "共情", "策划", "心理疏导"],
        "preferences": "心理沙龙，活动策划，朋辈辅导，公益演讲",
        "restrictions": "拒绝冷漠",
        "lucky_place": "心理咨询中心",
        "gender": "女",
        "grade": "大三",
        "department": "心理学系",
        "home_building": "psych_center",
        "interest_vector": ["共情", "策划", "心理", "公益"],
    },
}
