#!/usr/bin/env bash
# Reduced-motion screenshot helper for the bench (settles rAF/keyframe animations so the END STATE is
# captured, and validates the prefers-reduced-motion contract at once). Usage same as _shot.sh:
#   bash _shot-rm.sh "/lab/bench?w=ng-explosion&theme=dark&play=1" [out.png] [WxH] [budgetMs]
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
ROOT="C:\\Projects\\adrian-v2-web"
URL="http://localhost:3000${1}"
OUT="${2:-_shot.png}"
SIZE="${3:-900,820}"
BUDGET="${4:-6000}"
rm -f "$OUT"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-prefers-reduced-motion=reduce \
  --force-color-profile=srgb --window-size="$SIZE" --virtual-time-budget="$BUDGET" \
  --screenshot="${ROOT}\\${OUT}" "$URL" >/dev/null 2>&1
ls -la "$OUT" 2>&1
