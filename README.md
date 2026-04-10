# A2A — Avatar To Avatar

> **校园沙盒 V2**：每位用户注册后拥有一个由**自己 API Key** 驱动的具身 Agent，在像素小镇中自主社交、积累关系；达到条件时 Agent 向真实用户发信，促成线下「搭子」约定。系统侧仍保留 **4 名 NPC**（Mira / Kai / Luca / Yuki）作为世界种子。

产品事实来源以 `PRD.md`、`docs/DEV_SPEC_V2.md` 为准。

---

## 目录

- [功能概述](#功能概述)
- [技术栈](#技术栈)
- [方式一：运行可执行文件（推荐，无需安装环境）](#方式一运行可执行文件推荐无需安装环境)
  - [macOS 运行步骤](#macos-运行步骤)
  - [Windows 运行步骤](#windows-运行步骤)
- [方式二：开发模式运行（需要完整环境）](#方式二开发模式运行需要完整环境)
  - [前置条件](#前置条件)
  - [基础设施（PostgreSQL / Redis）](#基础设施postgresql--redis)
  - [macOS / Linux 启动步骤](#macos--linux-启动步骤)
  - [Windows 启动步骤](#windows-启动步骤)
- [方式三：自行打包可执行文件](#方式三自行打包可执行文件)
  - [macOS / Linux 打包](#macos--linux-打包)
  - [Windows 打包](#windows-打包)
- [环境变量说明](#环境变量说明)
- [核心 API 端点](#核心-api-端点)
- [项目结构](#项目结构)
- [用户操作指南（V2）](#用户操作指南v2)

---

## 功能概述

| 模块 | 功能描述 |
|------|---------|
| **开机动画** | 像素风格 Landing 页，A2A LOGO 逐步渲染，点击门进入 |
| **小镇通行证** | 手机号 + 验证码登录（MVP 本地模拟，随意填写） |
| **人格与注册（V2）** | 一句话 bio + **用户自带 API Key**（可选 Base URL）；服务端加密存储，LLM 生成专属分身昵称与人格；**不再使用 5 题 MBTI 映射固定四人格** |
| **像素小镇** | 像素地图，建筑交互，Agent 在道路上行走 |
| **NPC 种子** | 4 名固定 NPC 与注册用户 Agent 共同参与世界 |
| **Agent 自主对话** | 后端调度多 Agent 自动两两对话；对话可走**用户 Key**（用户 Agent）或**系统 Key**（NPC / 降级） |
| **生成式循环** | 感知 → 记忆流（PostgreSQL）→ 反思 → 好感度与关系状态机 |
| **信件与搭子** | 关系达阈值时 Agent 向用户发 `friendship_invite` 类信件；双方确认后生成约定（`meetup_appointments`） |
| **Agent 聊天** | 点击地图上的 Agent，与其代理对话（路由至对应 Key） |

---

## 技术栈

### 前端

| 技术 | 用途 |
|------|------|
| React + TypeScript + Vite | UI 与构建 |
| React Router DOM | 路由 |

### 后端（`apps/agent`）

| 技术 | 用途 |
|------|------|
| Python 3.10+ | 运行时 |
| FastAPI + Uvicorn | API 服务 |
| OpenAI SDK（兼容端点） | LLM 调用 |
| asyncpg | PostgreSQL 异步访问 |
| Redis（可选） | 反思计数等 |
| cryptography | 用户 API Key AES-GCM 加密 |

### 数据与 AI

| 组件 | 说明 |
|------|------|
| PostgreSQL 16 + pgvector（推荐） | 用户、人格、记忆流、关系、信件、约定等（见 `docs/DEV_SPEC_V2.md` Schema） |
| Redis 7 | 可选；不可用时记忆模块有进程内降级 |
| DeepSeek / 兼容 OpenAI API | 系统 Key：人格生成、NPC、降级；**用户 Key**：该用户 Agent 的对话 |

### 打包

| 工具 | 说明 |
|------|------|
| PyInstaller | `a2a.spec` 入口为 `main.py`，单文件分发 |

---

## 方式一：运行可执行文件（推荐，无需安装环境）

> 分发的可执行文件已内置 Python 与前端静态资源，对方**不需要**安装 Node.js。

**说明（V2）**：完整体验（信件持久化、记忆流、约定写入库）依赖 **PostgreSQL**（及可选 Redis）。若**未启动数据库**，后端在**更新到最新代码并重启**后，仍支持 **内存开发注册**（`/api/register` 可成功，分身进入小镇；**重启进程后用户数据丢失**，信件等仍无法落库）。生产环境请使用 Docker + Postgres。

### macOS 运行步骤

**第 1 步：找到可执行文件**

```
release/
├── A2A          ← 可执行文件（macOS arm64）
└── start.sh     ← 启动脚本
```

**第 2 步：赋予执行权限**（首次）

```bash
cd /path/to/release
chmod +x A2A start.sh
```

**第 3 步：设置环境变量并启动**

```bash
export DEEPSEEK_API_KEY=你的系统侧DeepSeek密钥
# 若已部署数据库：
# export DATABASE_URL=postgresql://用户:密码@127.0.0.1:5432/a2a_dev
./start.sh
```

或：

```bash
DEEPSEEK_API_KEY=你的密钥 ./A2A
```

**第 4 步：浏览器访问** `http://127.0.0.1:8000`

**停止：** 终端 `Ctrl + C`

> **macOS 安全提示**：若提示无法验证开发者：`xattr -dr com.apple.quarantine ./A2A` 后再运行。

### Windows 运行步骤

> release 中若为 macOS 构建，Windows 需在 Windows 上按 [方式三](#windows-打包) 自行打包得到 `A2A.exe`。

```cmd
cd C:\path\to\release
set DEEPSEEK_API_KEY=你的密钥
A2A.exe
```

或 PowerShell：

```powershell
$env:DEEPSEEK_API_KEY = "你的密钥"
.\A2A.exe
```

浏览器访问 `http://127.0.0.1:8000`。

---

## 方式二：开发模式运行（需要完整环境）

适合热更新调试：前端 `pnpm dev`，后端建议 `uvicorn main:app --reload`。

### 前置条件

| 工具 | 版本要求 |
|------|---------|
| Node.js | >= 20 |
| pnpm | >= 9 |
| Python | >= 3.10 |

系统侧 LLM Key（人格生成、NPC、用户 Key 失效时降级）：自行准备 DeepSeek 或兼容 OpenAI 的 Key。

### 基础设施（PostgreSQL / Redis）

推荐使用仓库内 Compose（仅数据库与 Redis，不含应用）：

```bash
cd infra
docker compose -f docker-compose.dev.yml up -d
```

默认连接串示例（与 `apps/agent/config.py` 默认一致）：

- `DATABASE_URL=postgresql://a2a:dev_password@127.0.0.1:5432/a2a_dev`
- `REDIS_URL=redis://127.0.0.1:6379/0`

首次启动后端成功连接数据库时会**自动执行** V2 Schema 初始化（`apps/agent/db/pg_client.py`）。

### macOS / Linux 启动步骤

```bash
git clone <仓库地址>
cd A2A
cp .env.example .env   # 若存在；否则直接设置环境变量
```

**终端 1 — 后端**

```bash
cd apps/agent
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DEEPSEEK_API_KEY=你的系统密钥
export DATABASE_URL=postgresql://a2a:dev_password@127.0.0.1:5432/a2a_dev
# export REDIS_URL=redis://127.0.0.1:6379/0
python main.py
# 或：uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

日志出现 PostgreSQL 已连接即表示持久化就绪。

**终端 2 — 前端**

```bash
cd apps/web
pnpm install
pnpm dev
```

浏览器打开 **`http://localhost:5173`**。开发模式下 API 使用**相对路径 `/api`**，由 **Vite 代理**到 `http://127.0.0.1:8000`，避免跨域与系统代理劫持本机请求（见 `vite.config.ts`、`src/config/apiBase.ts`）。

**若注册或请求仍失败：** 先确认后端已在 8000 端口运行；不要用「只打开静态 html」的方式访问前端，须使用 `pnpm dev`。打包后的前端若与 API 不同源，可设置环境变量 `VITE_API_BASE=http://127.0.0.1:8000` 后重新 build。

### Windows 启动步骤

```cmd
cd apps\agent
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
set DEEPSEEK_API_KEY=你的系统密钥
set DATABASE_URL=postgresql://a2a:dev_password@127.0.0.1:5432/a2a_dev
python main.py
```

第二终端：

```cmd
cd apps\web
pnpm install
pnpm dev
```

---

## 方式三：自行打包可执行文件

### macOS / Linux 打包

```bash
chmod +x build.sh
./build.sh
# 等价: chmod +x scripts/build-all.sh && ./scripts/build-all.sh
```

产物见 `release/`；入口逻辑以 `apps/agent/main.py` 为准，`a2a.spec` 已指向 `main.py`。

### Windows 打包

1. `cd apps/web && pnpm install && pnpm run build`
2. 将 `apps/web/dist` 复制为 `apps/agent/dist`
3. `cd apps/agent`，venv 内 `pip install -r requirements.txt pyinstaller`
4. `pyinstaller a2a.spec --noconfirm --clean`
5. 可执行文件通常在 `apps/agent/dist/A2A.exe`（以 spec 为准）

---

## 环境变量说明

| 变量名 | 必填 | 默认值 | 说明 |
|--------|:----:|--------|------|
| `DEEPSEEK_API_KEY` | ✅（启动） | — | 系统侧 LLM 密钥；缺失时 `main` 入口会报错 |
| `DEEPSEEK_BASE_URL` | | `https://www.aiping.cn/api/v1` | 兼容 OpenAI 的 Base URL |
| `DEEPSEEK_MODEL` | | `DeepSeek-V3.2` | 系统侧默认模型名 |
| `DATABASE_URL` | 推荐 | 见 `config.py` | PostgreSQL；不填或连接失败时仅 NPC 模式 |
| `REDIS_URL` | | `redis://127.0.0.1:6379/0` | 可选 |
| `KEY_VAULT_MASTER_KEY` | | 开发占位 | 加密用户 API Key 的主密钥，**生产务必更换** |
| `CORS_ORIGINS` | | `http://localhost:5173,...` | 跨域 |
| `PORT` | | `8000` | 监听端口 |
| `HOST` | | `127.0.0.1` | 监听地址 |

勿将任何密钥提交到 Git；`.env` 应已忽略。

### Windows：`WinError 10013`（绑定端口失败）

多为 **8000 等端口被占用或落入系统保留段**。当前仓库已做如下处理：

1. **后端 `python main.py`（未设置 `PORT` 时）**  
   在 Windows 上会自动从 **18080、23456、8080…** 中挑选**第一个能绑定**的端口；并**写入** `apps/web/.env.development.local`（`VITE_AGENT_PORT=实际端口`，已被 `*.local` 忽略），便于 Vite 代理一致。

2. **默认关闭 uvicorn 热重载**（减少 Windows 套接字问题）。需要热重载：`set UVICORN_RELOAD=1`。

3. **若仍报错**：手动指定高位端口，例如：

   ```powershell
   $env:PORT = "34567"
   $env:DEEPSEEK_API_KEY = "你的密钥"
   python main.py
   ```

   在 `apps/web` 的 `.env.development.local` 中写 `VITE_AGENT_PORT=34567`，再重启 `pnpm dev`。

4. **查占用**：`netstat -ano | findstr :8000`（或你使用的端口），结束对应 PID 后再试。

| 变量（前端 `apps/web`） | 说明 |
|-------------------------|------|
| `VITE_AGENT_PORT` | 与后端监听端口一致；未设置时 Windows 下 Vite 默认假设 **18080** |
| `VITE_AGENT_API` | 完整后端根地址，如 `http://127.0.0.1:34567` |

---

## 核心 API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/agents` | Agent 列表（含用户 Agent 与 NPC） |
| `POST` | `/api/register` | 注册：phone、bio、`api_key`、可选 `api_base_url` / `api_model` |
| `POST` | `/api/dialog?agent1=&agent2=` | 触发两 Agent 多轮对话（含好感与生成式循环侧效应） |
| `GET` | `/api/events?since=` | 轮询对话事件（前端气泡） |
| `POST` | `/api/chat` | 用户与指定 Agent 聊天（按 Agent 路由用户 Key） |
| `GET` | `/api/letters/{user_id}` | 用户信件列表 |
| `POST` | `/api/letters/accept` | 接受搭子邀约（body: `user_id`, `letter_id`） |
| `POST` | `/api/letters/decline` | 拒绝邀约 |

实时 **WebSocket** 与完整事件推送见 `docs/DEV_SPEC_V2.md`（当前前端对话气泡仍以轮询为主）。

---

## 项目结构

```
A2A/
├── apps/
│   ├── web/                         # React 前端（@a2a/web）
│   │   └── src/
│   │       ├── pages/               # Landing / Login / PersonaQuiz / TownMap …
│   │       ├── components/
│   │       ├── hooks/               # useAgentEvents（轮询 /api/events）
│   │       ├── services/            # agentApi、mailApi、request
│   │       └── contexts/            # Auth、Mail、Game …
│   └── agent/                       # Python Agent Runtime
│       ├── main.py                  # FastAPI 应用入口（推荐）
│       ├── server.py                # 兼容 `from main import app`
│       ├── config.py
│       ├── db/                      # pg_client、redis_client
│       ├── security/                # vault（API Key 加密）
│       ├── llm/                     # gateway（按 agent 路由 Key）
│       ├── agents/                  # scheduler、memory、relationship、generative_loop、persona_builder …
│       ├── social/                  # letter_writer、meetup_manager
│       ├── world/                   # grid、event_bus
│       ├── requirements.txt
│       └── a2a.spec                 # PyInstaller，入口 main.py
├── packages/                        # 共享 TS 包（pnpm workspace）
│   ├── a2a-types/                   # @a2a/types 领域类型
│   └── a2a-client/                  # @a2a/client 浏览器 HTTP / 存储工具
├── docs/
│   ├── DEV_SPEC_V2.md               # V2 开发规格
│   └── 信息架构-IPO.md               # 信息架构说明
├── design/
│   ├── figma/                       # 设计令牌、Figma 导出清单
│   ├── ui-specs/                    # UI 规范大图（组件/色板/地图元素等）
│   ├── reference/
│   │   ├── building-sprites/        # 历史建筑位图参考（非线上资源）
│   │   └── mockups/                 # 流程/mock 截图
│   └── third-party/                 # 第三方素材许可说明（如 Mana Seed 示例）
├── scripts/
│   ├── build-all.sh                 # 完整打包（原根目录逻辑）
│   └── figma-*.mjs                  # 设计令牌同步等
├── templates/                       # 新模块脚手架模板
├── deliverables/                    # 设计系统交付物脚本等
├── infra/
│   └── docker-compose.dev.yml       # Postgres + Redis + MinIO
├── build.sh                         # 调用 scripts/build-all.sh
├── PRD.md
└── README.md
```

---

## 用户操作指南（V2）

| 步骤 | 操作 |
|------|------|
| 1 | Landing 等待动画，点击**门**进入 |
| 2 | 登录页填写 **11 位手机号**（会保存用于注册），验证码可本地模拟 |
| 3 | **人格页**：用一句话介绍自己，填写 **API Key**（及可选高级 Base URL），提交后由服务端生成专属分身与人格，进入小镇 |
| 4 | 地图上浏览建筑、邮局信件；Agent 自动对话气泡可由 `useAgentEvents` 展示 |
| 5 | 点击 **Agent** 可与其代理聊天（消耗用户或系统 Key 视路由而定） |
| 6 | 收到搭子类信件时，在邮局内确认或拒绝；双方确认后生成约定（后端 `meetup_appointments`） |

---

## License

MIT
