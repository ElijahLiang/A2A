# 代码模板（部分为未落地蓝图）

本目录包含历史脚手架模板。**当前实装只有 `apps/web` + `apps/agent`。**

| 模板 | 状态 | 说明 |
|------|------|------|
| `fastapi-router.template.py` | 可用参考 | 目标宜改为 `apps/agent/` 下路由模块 |
| `agent-module.template.py` | 可用参考 | 目标 `apps/agent/agents/` |
| `fastify-route.template.ts` | **蓝图** | `apps/api` 未落地，勿按此创建工程 |
| `fastify-service.template.ts` | **蓝图** | 同上 |
| `rn-screen.template.tsx` | **蓝图** | `apps/mobile` 未落地 |
| `rn-component.template.tsx` | **蓝图** | 同上 |
| `zustand-store.template.ts` | **蓝图** | 同上 |
| `migration.template.sql` | **蓝图** | Schema 现由 `apps/agent/db/pg_client.py` 初始化 |

新 Web 功能请直接在 `apps/web/src`（含 `domains/`、`lib/world/`）开发，不必套用 RN/Fastify 模板。
