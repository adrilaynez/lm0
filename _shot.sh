#!/usr/bin/env bash
# Dev-only screenshot helper for the bench. Usage:
#   bash _shot.sh "/lab/bench?w=row-tally&theme=light&play=1" [out.png] [WxH] [budgetMs]
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
ROOT="C:\\Projects\\adrian-v2-web"
URL="http://localhost:3000${1}"
OUT="${2:-_shot.png}"
SIZE="${3:-820,1200}"
BUDGET="${4:-18000}"
rm -f "$OUT"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-color-profile=srgb \
  --window-size="$SIZE" --virtual-time-budget="$BUDGET" \
  --screenshot="${ROOT}\\${OUT}" "$URL" >/dev/null 2>&1
ls -la "$OUT" 2>&1
