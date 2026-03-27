"""简单内存事件总线（WebSocket 可订阅）。"""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from typing import Any

_listeners: list[Callable[[str, dict[str, Any]], Awaitable[None]]] = []
_lock = asyncio.Lock()


async def subscribe(handler: Callable[[str, dict[str, Any]], Awaitable[None]]) -> None:
    async with _lock:
        _listeners.append(handler)


async def unsubscribe(handler: Callable[[str, dict[str, Any]], Awaitable[None]]) -> None:
    async with _lock:
        if handler in _listeners:
            _listeners.remove(handler)


async def publish(event_type: str, data: dict[str, Any]) -> None:
    async with _lock:
        handlers = list(_listeners)
    for h in handlers:
        try:
            await h(event_type, data)
        except Exception:
            pass
