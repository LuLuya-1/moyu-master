#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
LOCAL_NODE="$ROOT/.tools/node-v22.22.3-linux-x64/bin/node"

if command -v node >/dev/null 2>&1; then
  exec node "$ROOT/server.js"
fi

if [[ -x "$LOCAL_NODE" ]]; then
  exec "$LOCAL_NODE" "$ROOT/server.js"
fi

printf '%s\n' "没有找到 Node.js。请先安装 Node.js 22 或更高版本。" >&2
exit 1
