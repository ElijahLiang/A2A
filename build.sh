#!/usr/bin/env bash
# =============================================================================
# A2A Build Script — 将前端 + 后端打包成单个可执行文件
# 用法:
#   chmod +x build.sh
#   DEEPSEEK_API_KEY=<your-key> ./build.sh
#   或者先导出环境变量再运行: export DEEPSEEK_API_KEY=xxx && ./build.sh
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$REPO_ROOT/apps/web"
AGENT_DIR="$REPO_ROOT/apps/agent"
DIST_TARGET="$AGENT_DIR/dist"
OUTPUT_DIR="$REPO_ROOT/release"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[A2A Build]${NC} $*"; }
warn() { echo -e "${YELLOW}[A2A Build]${NC} $*"; }
err()  { echo -e "${RED}[A2A Build]${NC} $*" >&2; exit 1; }

# ── 0. 检查必要工具 ───────────────────────────────────────────────────────────
log "检查依赖工具..."
command -v node    >/dev/null 2>&1 || err "未找到 node，请先安装 Node.js >= 20"
command -v pnpm    >/dev/null 2>&1 || err "未找到 pnpm，请运行: npm install -g pnpm"
command -v python3 >/dev/null 2>&1 || err "未找到 python3，请先安装 Python >= 3.10"

NODE_VER=$(node -e "process.stdout.write(process.versions.node)")
PYTHON_VER=$(python3 -c "import sys; print('.'.join(map(str,sys.version_info[:2])))")
log "Node.js: $NODE_VER  |  Python: $PYTHON_VER"

# ── 1. 构建前端 ───────────────────────────────────────────────────────────────
log "Step 1/4 — 安装前端依赖..."
cd "$WEB_DIR"
pnpm install --frozen-lockfile

log "Step 2/4 — 构建前端 (vite build)..."
pnpm run build

# 将构建产物复制到 agent 目录，供 PyInstaller 打包
log "复制 dist/ 到 $DIST_TARGET ..."
rm -rf "$DIST_TARGET"
cp -r "$WEB_DIR/dist" "$DIST_TARGET"

# ── 2. 准备 Python 环境 ───────────────────────────────────────────────────────
log "Step 3/4 — 安装 Python 依赖..."
cd "$AGENT_DIR"

# 优先使用 venv
VENV_DIR="$AGENT_DIR/.venv"
if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv "$VENV_DIR"
fi

# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
pip install pyinstaller --quiet

# ── 3. 执行 PyInstaller ───────────────────────────────────────────────────────
log "Step 4/4 — PyInstaller 打包中，请稍候..."
cd "$AGENT_DIR"
pyinstaller a2a.spec --noconfirm --clean

# ── 4. 复制到 release 目录 ────────────────────────────────────────────────────
mkdir -p "$OUTPUT_DIR"
cp "$AGENT_DIR/dist/A2A" "$OUTPUT_DIR/A2A"
chmod +x "$OUTPUT_DIR/A2A"

# 生成一个运行脚本，方便用户传入 API Key
cat > "$OUTPUT_DIR/start.sh" << 'EOF'
#!/usr/bin/env bash
# 用法: ./start.sh  (需要先设置 DEEPSEEK_API_KEY)
if [ -z "${DEEPSEEK_API_KEY:-}" ]; then
  echo "请先设置 DEEPSEEK_API_KEY 环境变量:"
  echo "  export DEEPSEEK_API_KEY=your-key"
  echo "  ./start.sh"
  exit 1
fi
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$DIR/A2A"
EOF
chmod +x "$OUTPUT_DIR/start.sh"

echo ""
log "✅ 打包完成！输出目录: $OUTPUT_DIR"
log "可执行文件: $OUTPUT_DIR/A2A"
echo ""
warn "运行方式:"
warn "  export DEEPSEEK_API_KEY=<your-key>"
warn "  $OUTPUT_DIR/start.sh"
echo ""
warn "或者直接:"
warn "  DEEPSEEK_API_KEY=<your-key> $OUTPUT_DIR/A2A"
