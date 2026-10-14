#!/bin/zsh
cd -- "$(dirname -- "$0")"
if lsof -nP -iTCP:8765 -sTCP:LISTEN >/dev/null 2>&1; then
  open 'http://localhost:8765/rooftop/tests/browser/rooftop.html?mode=item'
  exit 0
fi
python3 start-preview.py &
preview_pid=$!
for attempt in {1..40}; do
  if lsof -nP -iTCP:8765 -sTCP:LISTEN >/dev/null 2>&1; then
    open 'http://localhost:8765/rooftop/tests/browser/rooftop.html?mode=item'
    break
  fi
  kill -0 "$preview_pid" 2>/dev/null || break
  sleep 0.1
done
wait "$preview_pid"
