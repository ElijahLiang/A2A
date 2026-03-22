"""
[模板] FastAPI 路由模板

使用方式：复制到 apps/agent/src/api/ 并重命名
示例：apps/agent/src/api/matching.py
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/agent", tags=["agent"])


# ── Request/Response 模型 ──────────────────────────────────

class ProcessIntentRequest(BaseModel):
    user_id: str
    intent_text: str = Field(..., min_length=1, max_length=500)
    geo_fence_id: str


class ProcessIntentResponse(BaseModel):
    intent_id: str
    parsed: dict
    status: str


class MatchResult(BaseModel):
    match_id: str
    partner_user_id: str
    toc_score: float
    surprise_factor: float
    report_summary: str


# ── 路由定义 ───────────────────────────────────────────────

@router.post(
    "/process-intent",
    response_model=ProcessIntentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def process_intent(request: ProcessIntentRequest):
    """解析用户 Intent 并启动匹配流程"""
    # TODO: 调用 intent_parser
    # parsed = await intent_parser.parse(request.intent_text)

    # TODO: 触发异步匹配任务
    # await task_queue.enqueue("match", {"user_id": request.user_id, ...})

    return ProcessIntentResponse(
        intent_id="placeholder",
        parsed={},
        status="matching",
    )


@router.post("/match/{user_id}", response_model=MatchResult)
async def trigger_matching(user_id: str):
    """为指定用户触发 A2A 匹配"""
    # TODO: 调用 matcher
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Matching engine not yet implemented",
    )
