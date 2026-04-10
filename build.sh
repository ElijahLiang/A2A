#!/usr/bin/env bash
# 薄封装：保持仓库根目录 `./build.sh` 可用，实际逻辑在 scripts/build-all.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$ROOT/scripts/build-all.sh" "$@"
