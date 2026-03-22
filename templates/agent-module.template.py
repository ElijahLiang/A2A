"""
[模板] Agent 功能模块模板

使用方式：复制到 apps/agent/src/agents/ 并重命名
示例：apps/agent/src/agents/intent_parser.py
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


# ── 数据模型 ───────────────────────────────────────────────

@dataclass
class ModuleInput:
    """模块输入"""
    user_id: str
    raw_text: str
    context: dict = field(default_factory=dict)


@dataclass
class ModuleOutput:
    """模块输出"""
    success: bool
    result: dict = field(default_factory=dict)
    error: str | None = None


# ── 模块实现 ───────────────────────────────────────────────

class AgentModule:
    """
    Agent 功能模块基类。
    每个模块负责 Agent 流水线中的一个环节。
    """

    def __init__(self, llm_gateway, config: dict | None = None):
        self.llm = llm_gateway
        self.config = config or {}

    async def process(self, input_data: ModuleInput) -> ModuleOutput:
        """
        处理入口。子类应覆写 _execute 方法。
        此方法负责统一的日志、错误处理和指标上报。
        """
        logger.info(
            "Processing %s for user %s",
            self.__class__.__name__,
            input_data.user_id,
        )

        try:
            result = await self._execute(input_data)
            return ModuleOutput(success=True, result=result)
        except Exception as e:
            logger.exception("Module %s failed", self.__class__.__name__)
            return ModuleOutput(success=False, error=str(e))

    async def _execute(self, input_data: ModuleInput) -> dict:
        """子类实现具体逻辑"""
        raise NotImplementedError

    def _build_prompt(self, input_data: ModuleInput) -> list[dict]:
        """
        构建 LLM 调用的 messages。
        子类按需覆写。
        """
        return [
            {"role": "system", "content": self._system_prompt()},
            {"role": "user", "content": input_data.raw_text},
        ]

    def _system_prompt(self) -> str:
        """子类提供 system prompt"""
        raise NotImplementedError


# ── 使用示例 ───────────────────────────────────────────────
#
# class IntentParser(AgentModule):
#     def _system_prompt(self) -> str:
#         return "你是一个 Intent 解析器..."
#
#     async def _execute(self, input_data: ModuleInput) -> dict:
#         messages = self._build_prompt(input_data)
#         result = await self.llm.call(
#             model="deepseek-chat",
#             messages=messages,
#             response_format="json",
#         )
#         return result
