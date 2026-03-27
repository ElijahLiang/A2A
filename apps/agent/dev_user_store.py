"""
无 PostgreSQL 时的开发用内存注册表。
仅用于本地快速跑通 UI；进程重启后数据丢失。生产环境请使用 Docker + Postgres。
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    pass


@dataclass
class DevUserRecord:
    user_id: str
    phone: str
    agent_name: str
    api_key_enc: str
    api_base_url: str | None
    api_model: str | None


_phones: dict[str, str] = {}  # phone -> agent_name
_agents: dict[str, DevUserRecord] = {}  # agent_name -> record


def is_phone_taken(phone: str) -> bool:
    return phone in _phones


def used_agent_names() -> set[str]:
    return set(_agents.keys())


def register_record(
    phone: str,
    agent_name: str,
    api_key_enc: str,
    api_base_url: str | None,
    api_model: str | None,
) -> str:
    if phone in _phones:
        raise ValueError("phone already registered")
    user_id = str(uuid.uuid4())
    rec = DevUserRecord(
        user_id=user_id,
        phone=phone,
        agent_name=agent_name,
        api_key_enc=api_key_enc,
        api_base_url=api_base_url,
        api_model=api_model,
    )
    _phones[phone] = agent_name
    _agents[agent_name] = rec
    return user_id


def get_credential(agent_name: str) -> DevUserRecord | None:
    return _agents.get(agent_name)
