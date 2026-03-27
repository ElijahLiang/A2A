"""Agent 运行时状态。"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class AgentState(str, Enum):
    IDLE = "idle"
    MOVING = "moving"
    CHATTING = "chatting"


@dataclass
class AgentRuntimeState:
    name: str
    col: int
    row: int
    current_building: str
    state: AgentState
