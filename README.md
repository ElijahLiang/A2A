# A2A — Avatar To Avatar

> AI Agent 驱动的线下社交撮合平台。用户由各自的 AI 分身（Avatar）先行沟通，在像素小镇完成破冰、匹配和邀约，最终促成真实线下见面。

---

## 目录

- [功能概述](#功能概述)
- [技术栈](#技术栈)
- [方式一：运行可执行文件（推荐，无需安装环境）](#方式一运行可执行文件推荐无需安装环境)
  - [macOS 运行步骤](#macos-运行步骤)
  - [Windows 运行步骤](#windows-运行步骤)
- [方式二：开发模式运行（需要完整环境）](#方式二开发模式运行需要完整环境)
  - [前置条件](#前置条件)
  - [macOS / Linux 启动步骤](#macos--linux-启动步骤)
  - [Windows 启动步骤](#windows-启动步骤)
- [方式三：自行打包可执行文件](#方式三自行打包可执行文件)
  - [macOS / Linux 打包](#macos--linux-打包)
  - [Windows 打包](#windows-打包)
- [环境变量说明](#环境变量说明)
- [核心 API 端点](#核心-api-端点)
- [项目结构](#项目结构)

---

## 功能概述

| 模块 | 功能描述 |
|------|---------|
| **开机动画** | 像素风格 Landing 页，A2A LOGO 逐步渲染，点击门进入 |
| **小镇通行证** | 手机号 + 验证码登录（MVP 阶段本地模拟，随意填写） |
| **人格测试** | 5 题 MBTI 快测，映射到 4 位 AI 分身（Mira / Kai / Luca / Yuki） |
| **像素小镇** | 1200×780 像素地图，9 座放大建筑，Agent 在道路上自由行走 |
| **建筑交互** | 图书馆 / 咖啡馆 / 餐厅等发布活动意图，邮局查看并操作匹配报告 |
| **Agent 自主对话** | 后端多 Agent 每隔 8 秒自动两两对话，气泡实时显示在角色头上 |
| **Agent 聊天** | 点击地图上的 Agent 角色，可与其实时对话 |

---

## 技术栈

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19 | UI 框架 |
| TypeScript | 5.9 | 类型系统 |
| Vite | 8 | 构建工具 |
| React Router DOM | 7 | 客户端路由 |

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.10+ | 运行时 |
| FastAPI | 0.115 | API 框架 |
| Uvicorn | 0.32 | ASGI 服务器 |
| OpenAI SDK | 1.57 | 异步 LLM 调用 |
| Pydantic | 2.10 | 数据校验 |

### AI 模型

| 模型 | 用途 |
|------|------|
| DeepSeek-V3.2 | Agent 自主对话 + 用户聊天 |

### 打包工具

| 工具 | 用途 |
|------|------|
| PyInstaller | 将后端 + 前端静态资源打包为单个可执行文件 |

---

## 方式一：运行可执行文件（推荐，无需安装环境）

> 分发的可执行文件已内置 Python 解释器和完整前端，对方**不需要**安装 Node.js、Python 或任何依赖。

### macOS 运行步骤

**第 1 步：找到可执行文件**

```
release/
├── A2A          ← 可执行文件（macOS arm64，M1/M2/M3 芯片）
└── start.sh     ← 启动脚本
```

**第 2 步：赋予执行权限**（只需第一次运行时执行）

打开终端（Terminal），进入 release 目录：

```bash
cd /path/to/release
chmod +x A2A start.sh
```

**第 3 步：设置 API Key 并启动**

```bash
export DEEPSEEK_API_KEY=你的DeepSeek密钥
./start.sh
```

或者一行命令直接运行：

```bash
DEEPSEEK_API_KEY=你的DeepSeek密钥 ./A2A
```

**第 4 步：在浏览器中访问**

程序启动后会**自动打开浏览器**，若未自动打开，手动访问：

```
http://127.0.0.1:8000
```

**停止游戏：** 在终端按 `Ctrl + C`

---

> **macOS 安全提示**：首次运行时系统可能提示"无法验证开发者"。
> 解决方法：
> ```bash
> xattr -dr com.apple.quarantine ./A2A
> ```
> 然后再运行 `./start.sh`

---

### Windows 运行步骤

> ⚠️ **当前 release 目录中的 `A2A` 文件是 macOS 版本（arm64）。**
> Windows 版本需要在 Windows 机器上自行打包（见[方式三：Windows 打包](#windows-打包)），
> 打包完成后会生成 `A2A.exe`。

**第 1 步：找到可执行文件**

```
release\
└── A2A.exe      ← 可执行文件（Windows x64）
```

**第 2 步：设置 API Key 并启动**

打开「命令提示符」（CMD）或「PowerShell」，进入 release 目录：

**CMD 方式：**
```cmd
cd C:\path\to\release
set DEEPSEEK_API_KEY=你的DeepSeek密钥
A2A.exe
```

**PowerShell 方式：**
```powershell
cd C:\path\to\release
$env:DEEPSEEK_API_KEY = "你的DeepSeek密钥"
.\A2A.exe
```

**第 3 步：在浏览器中访问**

程序启动后会**自动打开浏览器**，若未自动打开，手动访问：

```
http://127.0.0.1:8000
```

**停止游戏：** 关闭命令提示符窗口，或按 `Ctrl + C`

---

> **Windows 安全提示**：首次运行时 Windows Defender 可能拦截。
> 点击「更多信息」→「仍要运行」即可。

---

## 方式二：开发模式运行（需要完整环境）

适合开发者本地调试，前端支持热更新，后端支持 `reload`。

### 前置条件

| 工具 | 版本要求 | 下载地址 |
|------|---------|---------|
| Node.js | >= 20 | https://nodejs.org/ |
| pnpm | >= 9 | `npm install -g pnpm` |
| Python | >= 3.10 | https://www.python.org/downloads/ |

获取 DeepSeek API Key：https://platform.deepseek.com/

---

### macOS / Linux 启动步骤

**第 1 步：克隆项目**

```bash
git clone <仓库地址>
cd A2A
```

**第 2 步：配置环境变量**

```bash
cp .env.example .env
```

用任意文本编辑器打开 `.env`，至少填写：

```dotenv
DEEPSEEK_API_KEY=你的DeepSeek密钥
```

**第 3 步：启动后端（打开第一个终端窗口）**

```bash
# 进入 agent 目录
cd apps/agent

# 创建 Python 虚拟环境（只需执行一次）
python3 -m venv .venv

# 激活虚拟环境
source .venv/bin/activate

# 安装依赖（只需执行一次）
pip install -r requirements.txt

# 导出环境变量并启动
export DEEPSEEK_API_KEY=你的DeepSeek密钥
python server.py
```

后端运行在 `http://127.0.0.1:8000`，终端会显示：

```
INFO:     Uvicorn running on http://127.0.0.1:8000
Initialized 4 agents
```

**第 4 步：启动前端（打开第二个终端窗口）**

```bash
# 回到项目根目录
cd apps/web

# 安装依赖（只需执行一次）
pnpm install

# 启动开发服务器
pnpm dev
```

前端运行在 `http://localhost:5173`，在浏览器打开该地址即可。

---

### Windows 启动步骤

**第 1 步：克隆项目**

```cmd
git clone <仓库地址>
cd A2A
```

**第 2 步：配置环境变量**

在项目根目录复制 `.env.example` 为 `.env`，并填写：

```
DEEPSEEK_API_KEY=你的DeepSeek密钥
```

**第 3 步：启动后端（打开第一个 CMD / PowerShell 窗口）**

```cmd
cd apps\agent

:: 创建虚拟环境（只需执行一次）
python -m venv .venv

:: 激活虚拟环境
.venv\Scripts\activate

:: 安装依赖（只需执行一次）
pip install -r requirements.txt

:: 设置 API Key（CMD 方式）
set DEEPSEEK_API_KEY=你的DeepSeek密钥

:: 启动
python server.py
```

PowerShell 方式：

```powershell
cd apps\agent
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:DEEPSEEK_API_KEY = "你的DeepSeek密钥"
python server.py
```

**第 4 步：启动前端（打开第二个 CMD / PowerShell 窗口）**

```cmd
cd apps\web
pnpm install
pnpm dev
```

浏览器访问 `http://localhost:5173`

---

## 方式三：自行打包可执行文件

将前端 + 后端打包成单个可独立分发的二进制文件。

### macOS / Linux 打包

**前置条件：** Node.js >= 20、pnpm >= 9、Python >= 3.10

```bash
# 在项目根目录执行
chmod +x build.sh
./build.sh
```

脚本自动完成以下步骤：

| 步骤 | 内容 |
|------|------|
| 1 | `pnpm install` + `vite build` 构建前端 |
| 2 | 将 `dist/` 复制到 `apps/agent/dist/` |
| 3 | 创建 Python venv，安装依赖 + PyInstaller |
| 4 | PyInstaller 生成单文件可执行程序 |
| 5 | 输出到 `release/A2A` |

打包完成后运行：

```bash
cd release
export DEEPSEEK_API_KEY=你的DeepSeek密钥
./start.sh
```

---

### Windows 打包

**前置条件：** Node.js >= 20、pnpm >= 9、Python >= 3.10

打开 PowerShell（建议以管理员身份运行）：

**第 1 步：构建前端**

```powershell
cd apps\web
pnpm install
pnpm run build
```

**第 2 步：复制前端产物**

```powershell
cd ..\..\        # 回到项目根目录
Remove-Item -Recurse -Force apps\agent\dist -ErrorAction SilentlyContinue
Copy-Item -Recurse apps\web\dist apps\agent\dist
```

**第 3 步：安装 Python 依赖和 PyInstaller**

```powershell
cd apps\agent
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install pyinstaller
```

**第 4 步：执行打包**

```powershell
pyinstaller a2a.spec --noconfirm --clean
```

**第 5 步：找到可执行文件**

打包完成后，可执行文件位于：

```
apps\agent\dist\A2A.exe
```

将 `A2A.exe` 复制到任意目录即可分发运行：

```powershell
$env:DEEPSEEK_API_KEY = "你的DeepSeek密钥"
.\A2A.exe
```

---

## 环境变量说明

| 变量名 | 必填 | 默认值 | 说明 |
|--------|:----:|--------|------|
| `DEEPSEEK_API_KEY` | ✅ | — | DeepSeek API 密钥，缺失时服务拒绝启动 |
| `DEEPSEEK_BASE_URL` | | `https://www.aiping.cn/api/v1` | API 端点地址 |
| `DEEPSEEK_MODEL` | | `DeepSeek-V3.2` | 使用的模型名称 |
| `CORS_ORIGINS` | | `http://localhost:5173,...` | 允许跨域的前端地址（开发模式用） |
| `PORT` | | `8000` | 后端监听端口 |
| `HOST` | | `127.0.0.1` | 后端监听地址 |

> **安全提示**：API Key 仅在服务端设置，绝不提交到代码仓库。`.env` 已加入 `.gitignore`。

---

## 核心 API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/agents` | 获取所有 Agent 信息列表 |
| `POST` | `/api/dialog?agent1=X&agent2=Y` | 触发两个 Agent 之间的完整对话 |
| `GET` | `/api/events?since=N` | 轮询最新对话事件（前端每 2 秒一次） |
| `POST` | `/api/chat` | 用户与指定 Agent 实时聊天（后端代理 LLM） |

---

## 项目结构

```
A2A/
├── apps/
│   ├── web/                    # React 前端
│   │   ├── src/
│   │   │   ├── pages/          # Landing / Login / PersonaQuiz / TownMap
│   │   │   ├── components/     # PixelMap / Building / AgentSprite / LetterDialog …
│   │   │   ├── hooks/          # useAgentEvents / useAgentWalker
│   │   │   ├── services/       # agentApi.ts（HTTP 请求封装）
│   │   │   ├── data/           # agents.ts（小镇 NPC 配置）
│   │   │   └── styles/         # 全局 CSS 变量与组件样式
│   │   └── public/             # 静态资源（sprites / buildings / 地图背景）
│   └── agent/                  # Python 后端
│       ├── server.py           # FastAPI 主服务（Agent Runtime）
│       ├── requirements.txt    # Python 依赖（锁定版本）
│       └── a2a.spec            # PyInstaller 打包配置
├── release/                    # 打包输出目录
│   ├── A2A                     # macOS 可执行文件
│   └── start.sh                # macOS 启动脚本
├── infra/
│   └── docker-compose.dev.yml  # PostgreSQL + Redis + MinIO（扩展用）
├── build.sh                    # macOS/Linux 一键打包脚本
├── .env.example                # 环境变量模板（复制为 .env 后填写）
├── package.json                # Monorepo 根配置（pnpm workspace）
└── PRD.md                      # 产品需求文档（唯一事实来源）
```

---

## 游戏操作指南

| 步骤 | 操作 |
|------|------|
| 1 | 在开机画面等待 LOGO 动画完成，点击发光的**门**进入 |
| 2 | 输入任意 11 位数字当手机号，点"发送"后随意填 4 位验证码，点"进入人格测试" |
| 3 | 完成 5 道 MBTI 题，等待信封动画，确认分配的 AI 分身名字，点"进入 A2A 小镇" |
| 4 | 在像素地图中**点击建筑**打开对话框，完成发布意图、查看匹配、确认见面等操作 |
| 5 | 点击地图上**行走的 Agent 角色**，可与其直接实时聊天 |
| 6 | 底部工具栏点击**"离开小镇"**退出登录 |

---

## License

MIT
