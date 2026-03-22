#!/usr/bin/env bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -z "${DEEPSEEK_API_KEY:-}" ]; then
  echo "=========================================="
  echo "  A2A — Avatar To Avatar"
  echo "=========================================="
  echo ""
  echo "请先设置 DEEPSEEK_API_KEY 后运行："
  echo "  export DEEPSEEK_API_KEY=你的Key"
  echo "  ./start.sh"
  echo ""
  exit 1
fi
echo "启动 A2A 小镇，浏览器稍后自动打开..."
exec "$DIR/A2A"
