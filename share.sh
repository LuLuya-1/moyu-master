#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
CLOUDFLARED="$ROOT/.tools/bin/cloudflared"

if [[ ! -x "$CLOUDFLARED" ]]; then
  printf '%s\n' "没有找到 cloudflared，请先完成安装。" >&2
  exit 1
fi

exec "$CLOUDFLARED" tunnel --protocol http2 --edge-ip-version 4 --url http://localhost:8765
