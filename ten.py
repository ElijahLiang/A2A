import asyncio
import uuid
import random
import re
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Callable
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from contextlib import asynccontextmanager
import json
import uvicorn
from loguru import logger
import dashscope
from dashscope import Generation

# ======================== 核心配置 ========================
class Config:
    DASHSCOPE_API_KEY = "sk-e805d4e8dcfe446ab8176c0734aa3ac7"  # 替换为有效密钥
    MAX_DIALOG_ROUNDS = 10
    DIALOG_TIMEOUT = 30
    MAX_CONCURRENT_TASKS = 20  # 提升并发支持多智能体互动
    API_CALL_DELAY = 0.1
    MATCH_SCORE_THRESHOLD = 80
    UVICORN_WORKERS = 2
    AUTO_INTERACTION_INTERVAL = 0.5  # 自主互动间隔（秒）
config = Config()

# ======================== 情感词典 & 人格常量 ========================
MBTI_TYPES = {"INTP","INTJ","INFP","INFJ","ISTP","ISTJ","ISFP","ISFJ",
              "ENTP","ENTJ","ENFP","ENFJ","ESTP","ESTJ","ESFP","ESFJ"}

# 核心拓展：16种校园人格配置（一一对应MBTI）
CAMPUS_PERSONALITIES = {
    "INTP": {"name": "吴兆通", "signature": "解构世界的逻辑，偏爱深度思辨", "tags": ["INTP", "编程", "逻辑学", "小众书籍"], 
             "preferences": "哲学讨论，代码调试，深夜思考，独立研究", "restrictions": "避免情绪化表达，拒绝无意义闲聊",
             "lucky_place": "图书馆研讨室", "gender": "男", "grade": "大三", "department": "计算机学院"},
    "INTJ": {"name": "武曌通", "signature": "以终为始，偏爱高效精准的交流", "tags": ["INTJ", "规划", "战略", "效率"], 
             "preferences": "目标拆解，时间管理，学术竞赛，跨专业合作", "restrictions": "拒绝拖延，讨厌模糊的表达",
             "lucky_place": "校史馆会议室", "gender": "女", "grade": "大四", "department": "商学院"},
    "INFP": {"name": "五昭通", "signature": "以温柔解构世界，偏爱灵魂共鸣", "tags": ["INFP", "诗歌", "心理学", "公益"], 
             "preferences": "诗歌创作，心理倾诉，公益活动，星空漫步", "restrictions": "拒绝尖锐批评，讨厌功利性交流",
             "lucky_place": "校园湖畔", "gender": "女", "grade": "大二", "department": "文学院"},
    "INFJ": {"name": "无照同", "signature": "洞察人心，偏爱深度且有温度的连接", "tags": ["INFJ", "洞察", "写作", "冥想"], 
             "preferences": "深度访谈，创意写作，冥想疗愈，职业规划", "restrictions": "拒绝表面寒暄，讨厌敷衍的回应",
             "lucky_place": "校园咖啡馆", "gender": "男", "grade": "大三", "department": "社会学系"},
    "ISTP": {"name": "梧桐", "signature": "动手验证真理，偏爱即时反馈的交流", "tags": ["ISTP", "手工", "电竞", "机械"], 
             "preferences": "手工制作，电竞组队，机械拆解，户外探险", "restrictions": "拒绝空谈理论，讨厌繁文缛节",
             "lucky_place": "创客空间", "gender": "男", "grade": "大二", "department": "机械工程学院"},
    "ISTJ": {"name": "吴彤", "signature": "以规则守护稳定，偏爱严谨的沟通", "tags": ["ISTJ", "整理", "复盘", "传统"], 
             "preferences": "档案整理，流程优化，晨读打卡，传统技艺", "restrictions": "拒绝无序，讨厌临时变更计划",
             "lucky_place": "校图书馆", "gender": "女", "grade": "大三", "department": "历史学系"},
    "ISFP": {"name": "林果儿", "signature": "沉浸当下感受，偏爱具象的美好", "tags": ["ISFP", "绘画", "摄影", "美食"], 
             "preferences": "街头摄影，手作咖啡，油画创作，探店打卡", "restrictions": "拒绝抽象讨论，讨厌压力式交流",
             "lucky_place": "校园艺术长廊", "gender": "女", "grade": "大二", "department": "美术学院"},
    "ISFJ": {"name": "白依然", "signature": "以温柔关照他人，偏爱贴心的互动", "tags": ["ISFJ", "烘焙", "倾听", "志愿服务"], 
             "preferences": "烘焙分享，学业辅导，节日祝福，宿舍聚餐", "restrictions": "拒绝冲突，讨厌忽视他人感受",
             "lucky_place": "学生活动中心", "gender": "男", "grade": "大四", "department": "教育学院"},
    "ENTP": {"name": "买买提", "signature": "碰撞观点火花，偏爱开放式讨论", "tags": ["ENTP", "辩论", "创业", "脑洞"], 
             "preferences": "辩论赛，创业路演，脑洞风暴，跨学科辩论", "restrictions": "拒绝刻板思维，讨厌墨守成规",
             "lucky_place": "校辩论社活动室", "gender": "男", "grade": "大三", "department": "法学院"},
    "ENTJ": {"name": "万里亭", "signature": "引领方向，偏爱结果导向的沟通", "tags": ["ENTJ", "领导", "演讲", "资源整合"], 
             "preferences": "社团管理，公开演讲，项目统筹，人脉拓展", "restrictions": "拒绝低效，讨厌犹豫不决",
             "lucky_place": "行政楼报告厅", "gender": "女", "grade": "大四", "department": "公共管理学院"},
    "ENFP": {"name": "玉素普", "signature": "点燃创意火花，偏爱鲜活的互动", "tags": ["ENFP", "创意", "社交", "旅行"], 
             "preferences": "创意市集，校园音乐节，随机探店，主题聚会", "restrictions": "拒绝枯燥，讨厌一成不变",
             "lucky_place": "校园文创店", "gender": "女", "grade": "大二", "department": "新闻传播学院"},
    "ENFJ": {"name": "李婉臻", "signature": "理解他人需求，偏爱有温度的引领", "tags": ["ENFJ", "共情", "策划", "心理疏导"], 
             "preferences": "心理沙龙，活动策划，朋辈辅导，公益演讲", "restrictions": "拒绝冷漠，讨厌利用他人",
             "lucky_place": "心理咨询中心", "gender": "男", "grade": "大三", "department": "心理学系"},
    "ESTP": {"name": "谭粤", "signature": "拥抱新鲜体验，偏爱即时的快乐", "tags": ["ESTP", "极限运动", "桌游", "社交"], 
             "preferences": "滑板社团，桌游局，校园夜市，即兴表演", "restrictions": "拒绝冗长准备，讨厌循规蹈矩",
             "lucky_place": "校园运动场", "gender": "男", "grade": "大二", "department": "体育学院"},
    "ESTJ": {"name": "杨俊杰", "signature": "落地目标，偏爱高效的团队协作", "tags": ["ESTJ", "执行", "管理", "规则"], 
             "preferences": "团队打卡，任务拆解，校园招聘会，实习内推", "restrictions": "拒绝推诿，讨厌无计划的行动",
             "lucky_place": "就业指导中心", "gender": "女", "grade": "大四", "department": "管理学院"},
    "ESFP": {"name": "吴若愚", "signature": "点燃现场氛围，偏爱热闹的互动", "tags": ["ESFP", "舞蹈", "主持", "美食"], 
             "preferences": "校园晚会，街头快闪，美食探店，拍照打卡", "restrictions": "拒绝独处，讨厌压抑的氛围",
             "lucky_place": "校园礼堂", "gender": "女", "grade": "大二", "department": "音乐学院"},
    "ESFJ": {"name": "吴钊同", "signature": "连接彼此，偏爱温暖的集体互动", "tags": ["ESFJ", "社交", "组织", "关怀"], 
             "preferences": "班级聚会，节日策划，生日惊喜，学业互助", "restrictions": "拒绝孤立，讨厌冷漠的态度",
             "lucky_place": "宿舍楼下小花园", "gender": "男", "grade": "大三", "department": "社会工作系"},
}

EMOTION_KEYWORDS = {
    "positive": ["开心", "喜欢", "舒服", "有趣", "棒", "好", "甜", "暖", "合拍", "聊得来", "超", "巨", "贼", "懂"],
    "negative": ["无聊", "烦", "讨厌", "尬", "累", "差", "冷", "不合拍", "没话聊", "无语", "emo"],
    "neutral": ["一般", "普通", "还行", "随便", "哦", "嗯", "啊", "额"]
}

# ======================== 数据结构 ========================
@dataclass
class UserAgentData:
    virtual_name: str
    signature: str
    gender: str
    grade: str
    department: str
    tags: List[str]
    restrictions: str
    preferences: str
    campus_personality: str
    long_term_memory: List[str]
    lucky_place: str = ""

def create_user_agent_data(**kwargs) -> UserAgentData:
    return UserAgentData(**kwargs)

@dataclass
class DialogMessage:
    speaker_id: str
    receiver_id: str
    content: str
    message_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    round_num: int = 0
    scene: str = "campus"
    timestamp: datetime = field(default_factory=datetime.now)
    emotion: str = "neutral"

# 新增：搭子关系数据结构
@dataclass
class BuddyRelation:
    agent1_name: str
    agent2_name: str
    create_time: datetime = field(default_factory=datetime.now)
    match_score: float = 0.0
    interaction_count: int = 0  # 互动次数
    common_activity: str = ""  # 共同约定的活动

# ======================== 全局对话历史 ========================
class GlobalDialogHistory:
    """全局对话存储，精准识别对方发言"""
    def __init__(self):
        self.history: Dict[str, List[DialogMessage]] = {}  # key: dialog_id
        self.lock = asyncio.Lock()

    async def add_message(self, dialog_id: str, msg: DialogMessage):
        async with self.lock:
            if dialog_id not in self.history:
                self.history[dialog_id] = []
            self.history[dialog_id].append(msg)

    async def get_opponent_last_message(
        self,
        dialog_id: str,
        my_name: str,
        opponent_name: str
    ) -> Optional[DialogMessage]:
        async with self.lock:
            if dialog_id not in self.history:
                return None
            opponent_msgs = [
                msg for msg in self.history[dialog_id]
                if msg.speaker_id == opponent_name
            ]
            return opponent_msgs[-1] if opponent_msgs else None

    async def get_history(self, dialog_id: str) -> List[DialogMessage]:
        async with self.lock:
            return self.history.get(dialog_id, [])

# ======================== 智能体类（核心修复域） ========================
class CampusAgent:
    def __init__(self, user_data: UserAgentData):
        self.user_data = user_data
        self.mbti_type = next((tag for tag in user_data.tags if len(tag)==4 and tag.isupper()), "INFP")

    def get_topic_hint(self, round_num: int, meeting_num: int = 1, other: "CampusAgent" = None) -> str:
        talents = "、".join([t for t in self.user_data.tags if t not in MBTI_TYPES])
        if round_num <= 2:
            if meeting_num == 1:
                return f"第一次见面，在{self.user_data.lucky_place}自然打招呼，围绕【{self.user_data.signature}】展开"
            else:
                return f"第{meeting_num}次见面，自然提及上次聊过的内容，续上话题"
        elif round_num >= config.MAX_DIALOG_ROUNDS - 3:
            if meeting_num >= 3:
                return "现在必须自然地向对方提出搭子邀请，说出具体想一起做的事，用自己的话表达，禁止重复对方刚才说的邀请；若对方已提出邀请，则热情回应并补充一个具体细节（时间/地点/带什么）"
            else:
                return "自然收尾：先回应对方的话，再补充一个新细节或感受，最后表达期待下次见面，禁止只说同意"
        else:
            if other:
                other_talents = "、".join([t for t in other.user_data.tags if t not in MBTI_TYPES])
                other_prefs = other.user_data.preferences
                return (
                    f"先直接回答对方的问题，再结合自己的【{talents}】或【{self.user_data.preferences}】经历延伸，"
                    f"然后从对方的【{other_talents}】或【{other_prefs}】中选一个对方还没提过的话题提问"
                )
            return f"围绕天赋点【{talents}】或偏好【{self.user_data.preferences}】深入聊"

    def analyze_emotion(self, text: str, last_emotion: str = "neutral") -> str:
        text = text.lower()
        pos_count = len([k for k in EMOTION_KEYWORDS["positive"] if k in text])
        neg_count = len([k for k in EMOTION_KEYWORDS["negative"] if k in text])

        if pos_count >= 1:
            return "positive"
        elif neg_count >= 1:
            return "negative"
        else:
            return last_emotion

    async def generate_msg(
        self,
        other: "CampusAgent",
        round_num: int,
        scene: str,
        dialog_id: str,
        global_history: GlobalDialogHistory,
        meeting_num: int = 1,
        meeting_summary: str = ""
    ) -> Optional[DialogMessage]:
        """生成消息（彻底放弃纯文本Prompt，改用原生Role区分）"""
        await asyncio.sleep(config.API_CALL_DELAY)

        my_name = self.user_data.virtual_name
        opponent_name = other.user_data.virtual_name

        # 获取完整历史，用作构建大模型的上下文记忆
        all_history = await global_history.get_history(dialog_id)

        # 1. 构建 System 级指令
        memory_str = "；".join(self.user_data.long_term_memory)
        talent_str = "、".join([t for t in self.user_data.tags if t not in MBTI_TYPES])
        other_talent_str = "、".join([t for t in other.user_data.tags if t not in MBTI_TYPES])
        # 提取历史中已说过的句子，告知模型避免重复提问
        talked_keywords = "；".join(msg.content for msg in all_history)[:400]
        topic_hint = self.get_topic_hint(round_num, meeting_num, other)

        # 最近两条消息，用于回显检测
        last_opponent_content = next((m.content for m in reversed(all_history) if m.speaker_id == opponent_name), "")
        last_my_content = next((m.content for m in reversed(all_history) if m.speaker_id == my_name), "")

        system_prompt = (
            f"你是【{my_name}】。\n"
            f"身份：{self.user_data.gender}，{self.user_data.grade}{self.user_data.department}\n"
            f"人格气质：{self.user_data.signature}\n"
            f"校园人格：{self.user_data.campus_personality}\n"
            f"天赋点：{talent_str}\n"
            f"偏好：{self.user_data.preferences}\n"
            f"长期记忆：{memory_str}\n"
            f"与【{opponent_name}】的见面记录：{meeting_summary or '初次见面'}\n"
            f"对方【{opponent_name}】的天赋点：{other_talent_str}，偏好：{other.user_data.preferences}\n"
            f"【已聊过的内容，严禁再次提问或重复这些话题】：{talked_keywords or '无'}\n"
            f"正在和【{opponent_name}】在{scene}聊天（第{meeting_num}次见面）。\n"
            f"限定：{self.user_data.restrictions}\n"
            f"【当前阶段】{topic_hint}\n"
            + (f"【绝对禁止】不得输出与以下内容相同或相似的话——对方刚说：「{last_opponent_content}」；你上次说：「{last_my_content}」\n" if last_opponent_content else "")
            + f"【最高铁律】必须针对对方的话进行回复，但禁止重复对方原话。输出格式：回复正文|情绪标签，情绪标签只能是positive/negative/neutral之一。20-35字，严禁重复上文任何内容！"
        )

        # 2. 核心修复：按大模型底层训练格式构造消息组
        messages = [{"role": "system", "content": system_prompt}]

        # 提取最近的对话记录注入记忆，让模型自动分辨"我"和"对方"
        for msg in all_history[-10:]:
            if msg.speaker_id == my_name:
                # 自己说过的话，标记为 assistant
                messages.append({"role": "assistant", "content": msg.content})
            else:
                # 对方说过的话，标记为 user
                messages.append({"role": "user", "content": msg.content})

        # 如果是第一轮，加一个 user 提示让它开场
        if not all_history:
            messages.append({"role": "user", "content": f"（系统指令：请主动和{opponent_name}打招呼，聊聊{scene}相关的）"})
        else:
            # 修复：确保 messages 末尾永远是 user（对方的话），否则模型会续写自己
            if messages[-1]["role"] == "assistant":
                opponent_msgs = [m for m in all_history if m.speaker_id == opponent_name]
                if opponent_msgs:
                    messages.append({"role": "user", "content": opponent_msgs[-1].content})
                else:
                    messages.append({"role": "user", "content": f"（{opponent_name}在等你说话）"})

        try:
            dashscope.api_key = config.DASHSCOPE_API_KEY
            content = ""
            emotion = "neutral"
            for attempt in range(3):
                resp = Generation.call(
                    model="qwen-turbo",
                    messages=messages,
                    temperature=1.2,
                    top_p=0.9,
                    max_tokens=80,
                    presence_penalty=1.5,
                    frequency_penalty=1.5
                )

                if not resp or resp.status_code != 200:
                    logger.error(f"API调用失败: {resp.status_code if resp else '无响应'}")
                    return None

                # 清理前缀，解析 内容|情绪 格式（兼容全角竖线｜）
                raw = getattr(getattr(resp, 'output', None), 'text', "").strip()
                raw = raw.replace(f"{my_name}：", "").replace(f"{my_name}:", "").replace("回复：", "").strip()
                raw = raw.replace("｜", "|")  # 全角竖线统一转ASCII

                if "|" in raw:
                    parts = raw.rsplit("|", 1)
                    content = parts[0].strip()
                    # 清除内容中残留的 |emotion 标记（模型有时输出多句）
                    content = re.sub(r'\|(positive|negative|neutral)\s*', '', content).strip()
                    emotion_raw = parts[1].strip()
                    emotion = emotion_raw if emotion_raw in ("positive", "negative", "neutral") else self.analyze_emotion(content, all_history[-1].emotion if all_history else "neutral")
                else:
                    content = raw
                    emotion = self.analyze_emotion(content, all_history[-1].emotion if all_history else "neutral")

                if not content:
                    continue

                # 回显检测：若与最近3条消息相同，重试
                recent_contents = [m.content for m in all_history[-3:]]
                if content in recent_contents:
                    logger.warning(f"回显检测触发（第{attempt+1}次），重试生成")
                    messages[-1]["content"] += f"（注意：绝对不能说「{content}」，必须说完全不同的新内容）"
                    continue
                break  # 内容合格，跳出重试

            if not content:
                logger.error("API返回空内容")
                return None

            # 生成消息并保存
            msg = DialogMessage(
                speaker_id=my_name,
                receiver_id=opponent_name,
                content=content,
                round_num=round_num,
                scene=scene,
                emotion=emotion
            )

            await global_history.add_message(dialog_id, msg)
            return msg

        except Exception as e:
            logger.error(f"生成消息失败: {str(e)[:100]}")
            return None

    def calc_static_match(self, other: "CampusAgent") -> float:
        """静态匹配分（只算一次，不依赖对话历史）"""
        common_tags = len(set(self.user_data.tags) & set(other.user_data.tags))
        tag_match = min(common_tags * 6, 30)

        preference_match = 0
        for pref in self.user_data.preferences.split('，'):
            if pref and pref.strip() in other.user_data.preferences:
                preference_match += 5
        preference_match = min(preference_match, 20)

        personality_match = 20 if self.user_data.campus_personality in other.user_data.campus_personality else 10

        compatible_keywords = ["浪漫理想家", "哲学沉思者", "幕后造梦人", "孤独思辨者", "逻辑解构者", "战略规划师"]
        role_bonus = 15 if any(k in other.user_data.campus_personality for k in compatible_keywords) else 0

        return round(tag_match + preference_match + personality_match + role_bonus, 2)

    async def calc_dynamic_match(self, other: "CampusAgent", global_history: GlobalDialogHistory, dialog_id: str) -> float:
        """动态匹配分（基于当次对话情绪和质量）"""
        history = await global_history.get_history(dialog_id)
        if not history:
            return 0.0

        positive_emotions = len([msg for msg in history if msg.emotion == "positive"])
        negative_emotions = len([msg for msg in history if msg.emotion == "negative"])
        emotion_match = max(min(positive_emotions * 4 - negative_emotions * 2, 20), 0)

        dialog_length = sum(len(msg.content) for msg in history)
        dialog_quality = min(dialog_length // 10, 10)

        return round(emotion_match + dialog_quality, 2)

# ======================== 智能体池（拓展多智能体自主互动） ========================
class AgentPool:
    def __init__(self):
        self.agents: Dict[str, CampusAgent] = {}  # key: 虚拟人名（如"逻辑解构者"）
        self.global_history = GlobalDialogHistory()
        self.lock = asyncio.Lock()
        self.semaphore = asyncio.Semaphore(config.MAX_CONCURRENT_TASKS)
        self.dialog_status: Dict[str, Dict] = {}
        self.meeting_records: Dict[str, List[Dict]] = {}  # key: "name1_name2"
        self.buddy_relations: List[BuddyRelation] = []  # 搭子关系列表
        self.auto_interaction_task: Optional[asyncio.Task] = None  # 自主互动任务

    async def init_16_agents(self):
        """初始化16个智能体（对应16种校园人格）"""
        async with self.lock:
            for mbti, config in CAMPUS_PERSONALITIES.items():
                # 构造UserAgentData
                user_data = create_user_agent_data(
                    virtual_name=config["name"],
                    signature=config["signature"],
                    gender=config["gender"],
                    grade=config["grade"],
                    department=config["department"],
                    tags=config["tags"],
                    restrictions=config["restrictions"],
                    preferences=config["preferences"],
                    campus_personality=config["name"],
                    long_term_memory=[f"我的MBTI是{mbti}", f"我喜欢{config['preferences'].split('，')[0]}"],
                    lucky_place=config["lucky_place"]
                )
                self.agents[config["name"]] = CampusAgent(user_data)
        logger.success(f"成功初始化{len(self.agents)}个智能体")

    async def add_agent(self, user_data: UserAgentData):
        async with self.lock:
            self.agents[user_data.virtual_name] = CampusAgent(user_data)
        return self.agents[user_data.virtual_name]

    def stop_dialog(self, dialog_id: str, reason: str = "用户主动终止"):
        if dialog_id in self.dialog_status:
            self.dialog_status[dialog_id]["running"] = False
            self.dialog_status[dialog_id]["reason"] = reason

    async def run_dialog(self, virtual_name1: str, virtual_name2: str, scene: str, dialog_id: str, meeting_num: int = 1, user_continue: bool = True) -> Dict:
        async with self.semaphore:
            self.dialog_status[dialog_id] = {"running": user_continue, "reason": ""}

            async with self.lock:
                a1 = self.agents.get(virtual_name1)
                a2 = self.agents.get(virtual_name2)
                if not a1 or not a2:
                    raise HTTPException(status_code=404, detail="虚拟人不存在")

            # scene 按见面次数轮番取两人幸运地点
            if not scene:
                scene = a1.user_data.lucky_place if meeting_num % 2 == 1 else a2.user_data.lucky_place
                scene = scene or "校园"

            # 取历次见面摘要
            pair_key = f"{virtual_name1}_{virtual_name2}"
            past = self.meeting_records.get(pair_key, [])
            meeting_summary = "；".join([
                f"第{r['meeting']}次在{r['scene']}，聊得{'愉快' if r['emotion_ratio'] > 0.6 else '一般'}"
                for r in past
            ])

            dialogs = []
            stop_reason = ""

            try:
                for round_num in range(1, config.MAX_DIALOG_ROUNDS + 1):
                    if not self.dialog_status[dialog_id]["running"]:
                        stop_reason = self.dialog_status[dialog_id]["reason"]
                        break

                    # 严格交替发言
                    if round_num % 2 == 1:
                        msg = await a1.generate_msg(a2, round_num, scene, dialog_id, self.global_history, meeting_num, meeting_summary)
                    else:
                        msg = await a2.generate_msg(a1, round_num, scene, dialog_id, self.global_history, meeting_num, meeting_summary)

                    if not msg:
                        stop_reason = "消息生成失败"
                        break
                    dialogs.append(msg)

                    match_score = await a1.calc_dynamic_match(a2, self.global_history, dialog_id)
                    if match_score >= config.MATCH_SCORE_THRESHOLD:
                        stop_reason = f"匹配分达标（{match_score}分≥{config.MATCH_SCORE_THRESHOLD}分）"
                        self.stop_dialog(dialog_id, stop_reason)
                        # 触发搭子关系
                        self._create_buddy_relation(virtual_name1, virtual_name2, match_score, dialogs[-1].content)
                        break

                final_score = await a1.calc_dynamic_match(a2, self.global_history, dialog_id)
                static_score = a1.calc_static_match(a2)
                history = await self.global_history.get_history(dialog_id)
                pos_ratio = len([m for m in history if m.emotion == "positive"]) / max(len(history), 1)
                buddy_triggered = meeting_num >= 3 and pos_ratio > 0.6

                # 写入本次见面摘要
                dialog_content = [
                    {"speaker": msg.speaker_id, "content": msg.content, "emotion": msg.emotion, "round": msg.round_num}
                    for msg in dialogs
                ]
                self.meeting_records.setdefault(pair_key, []).append({
                    "meeting": meeting_num, "scene": scene,
                    "score": final_score, "emotion_ratio": pos_ratio,
                    "dialog_content": dialog_content
                })

                cumulative_score = static_score + sum(r["score"] for r in self.meeting_records[pair_key])

                return {
                    "dialog_id": dialog_id,
                    "meeting_num": meeting_num,
                    "rounds": len(dialogs),
                    "stop_reason": stop_reason if stop_reason else "达到最大轮数",
                    "match_score": final_score,
                    "cumulative_score": round(cumulative_score, 2),
                    "buddy_triggered": buddy_triggered,
                    "dialog_content": dialog_content,
                    "score_threshold": config.MATCH_SCORE_THRESHOLD,
                    "agent1": virtual_name1,
                    "agent2": virtual_name2,
                    "scene": scene
                }

            except Exception as e:
                logger.error(f"对话执行失败: {str(e)}")
                raise HTTPException(status_code=500, detail=f"对话执行失败: {str(e)[:50]}")

    def _create_buddy_relation(self, agent1: str, agent2: str, match_score: float, common_activity: str):
        """创建搭子关系（去重）"""
        # 避免重复创建（不区分顺序）
        exists = any(
            (r.agent1_name == agent1 and r.agent2_name == agent2) or 
            (r.agent1_name == agent2 and r.agent2_name == agent1)
            for r in self.buddy_relations
        )
        if not exists:
            self.buddy_relations.append(
                BuddyRelation(
                    agent1_name=agent1,
                    agent2_name=agent2,
                    match_score=match_score,
                    common_activity=common_activity,
                    interaction_count=1
                )
            )
            logger.info(f"新增搭子关系：{agent1} ↔ {agent2}（匹配分：{match_score}）")
        else:
            # 更新互动次数
            for r in self.buddy_relations:
                if (r.agent1_name == agent1 and r.agent2_name == agent2) or (r.agent1_name == agent2 and r.agent2_name == agent1):
                    r.interaction_count += 1
                    break

    async def auto_interact(self):
        """智能体自主互动逻辑：随机配对、自动对话"""
        while True:
            try:
                async with self.lock:
                    agent_names = list(self.agents.keys())
                    if len(agent_names) < 2:
                        await asyncio.sleep(config.AUTO_INTERACTION_INTERVAL)
                        continue
                    # 随机选两个不同的智能体
                    agent1, agent2 = random.sample(agent_names, 2)
                    # 生成对话ID
                    dialog_id = f"auto_{uuid.uuid4().hex[:8]}"
                    # 获取该配对的见面次数
                    pair_key = f"{agent1}_{agent2}"
                    meeting_num = len(self.meeting_records.get(pair_key, [])) + 1

                # 执行自动对话
                await self.run_dialog(
                    virtual_name1=agent1,
                    virtual_name2=agent2,
                    scene="",  # 自动使用幸运地点
                    dialog_id=dialog_id,
                    meeting_num=meeting_num,
                    user_continue=True
                )
                logger.info(f"自主互动完成：{agent1} ↔ {agent2}（见面次数：{meeting_num}）")
                await asyncio.sleep(config.AUTO_INTERACTION_INTERVAL)
            except Exception as e:
                logger.error(f"自主互动失败: {str(e)}")
                await asyncio.sleep(config.AUTO_INTERACTION_INTERVAL)

    def start_auto_interaction(self):
        """启动自主互动任务"""
        if not self.auto_interaction_task or self.auto_interaction_task.done():
            self.auto_interaction_task = asyncio.create_task(self.auto_interact())
            logger.success("智能体自主互动任务已启动")

    async def get_all_dialog_records(self):
      """获取所有对话记录（调试用）"""
      async with self.lock:
        all_records = {}
        for pair_key, records in self.meeting_records.items():
            all_records[pair_key] = records
        return all_records
# ======================== FastAPI 服务 ========================
class UTF8JSONResponse(JSONResponse):
    def render(self, content: any) -> bytes:
        return json.dumps(
            content,
            ensure_ascii=False,
            allow_nan=False,
            indent=2,
            separators=(",", ": ")
        ).encode("utf-8")

# 全局智能体池
agent_pool = AgentPool()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 初始化16个智能体
    await agent_pool.init_16_agents()
    # 启动自主互动
    agent_pool.start_auto_interaction()
    yield
    # 关闭自主互动任务
    if agent_pool.auto_interaction_task:
        agent_pool.auto_interaction_task.cancel()
        await agent_pool.auto_interaction_task

app = FastAPI(lifespan=lifespan, default_response_class=UTF8JSONResponse)

# 跨域配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 核心接口：启动对话
@app.post("/api/start_dialog")
async def start_dialog(
    agent1: str = Query(..., description="智能体1名称"),
    agent2: str = Query(..., description="智能体2名称"),
    scene: str = Query("", description="对话场景"),
    meeting_num: int = Query(1, description="见面次数")
):
    dialog_id = f"manual_{uuid.uuid4().hex[:8]}"
    result = await agent_pool.run_dialog(
        virtual_name1=agent1,
        virtual_name2=agent2,
        scene=scene,
        dialog_id=dialog_id,
        meeting_num=meeting_num,
        user_continue=True
    )
    return {"code": 200, "data": result, "msg": "对话启动成功"}

# 终止对话
@app.post("/api/stop_dialog")
async def stop_dialog(dialog_id: str = Query(..., description="对话ID")):
    agent_pool.stop_dialog(dialog_id)
    return {"code": 200, "msg": f"对话{dialog_id}已终止"}

# 获取见面记录
@app.get("/api/get_meeting_records")
async def get_meeting_records(agent1: str, agent2: str):
    pair_key = f"{agent1}_{agent2}"
    records = agent_pool.meeting_records.get(pair_key, [])
    return {"code": 200, "data": records, "msg": "查询成功"}

# 获取匹配分
@app.get("/api/get_match_score")
async def get_match_score(dialog_id: str, agent1: str, agent2: str):
    async with agent_pool.lock:
        a1 = agent_pool.agents.get(agent1)
        a2 = agent_pool.agents.get(agent2)
        if not a1 or not a2:
            raise HTTPException(status_code=404, detail="智能体不存在")
    static_score = a1.calc_static_match(a2)
    dynamic_score = await a1.calc_dynamic_match(a2, agent_pool.global_history, dialog_id)
    return {
        "code": 200,
        "data": {"static_score": static_score, "dynamic_score": dynamic_score, "total": static_score + dynamic_score},
        "msg": "查询成功"
    }

# 新增：获取所有智能体信息
@app.get("/api/get_all_agents")
async def get_all_agents():
    async with agent_pool.lock:
        agent_info = [
            {
                "name": name,
                "mbti": agent.mbti_type,
                "signature": agent.user_data.signature,
                "department": agent.user_data.department,
                "lucky_place": agent.user_data.lucky_place,
                "preferences": agent.user_data.preferences
            }
            for name, agent in agent_pool.agents.items()
        ]
    return {"code": 200, "data": agent_info, "msg": "查询成功"}

# 新增：获取所有搭子关系
@app.get("/api/get_buddy_relations")
async def get_buddy_relations():
    async with agent_pool.lock:
        relation_info = [
            {
                "agent1": r.agent1_name,
                "agent2": r.agent2_name,
                "match_score": r.match_score,
                "interaction_count": r.interaction_count,
                "common_activity": r.common_activity,
                "create_time": r.create_time.strftime("%Y-%m-%d %H:%M:%S")
            }
            for r in agent_pool.buddy_relations
        ]
    return {"code": 200, "data": relation_info, "msg": "查询成功"}

@app.get("/api/get_all_dialogs")
async def get_all_dialogs():
    all_records = await agent_pool.get_all_dialog_records()
    return {"code": 200, "data": all_records, "msg": "所有对话记录查询成功"}

# 兼容旧接口
@app.get("/api/dialog")
async def dialog_redirect():
    return RedirectResponse(url="/api/start_dialog")

# 启动服务
if __name__ == "__main__":
    uvicorn.run(
        "ten:app",
        host="127.0.0.1",
        port=8000,
        workers=config.UVICORN_WORKERS,
        reload=True
    )