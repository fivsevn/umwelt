#!/bin/zsh
cd -- "$(dirname -- "$0")"
if lsof -nP -iTCP:4186 -sTCP:LISTEN >/dev/null 2>&1; then
  open 'http://127.0.0.1:4186/docs/art/rooftop-furniture-02/preview/'
  exit 0
fi
python3 start-preview.py &
preview_pid=$!
for attempt in {1..40}; do
  if lsof -nP -iTCP:4186 -sTCP:LISTEN >/dev/null 2>&1; then
    open 'http://127.0.0.1:4186/docs/art/rooftop-furniture-02/preview/'
    break
  fi
  kill -0 "$preview_pid" 2>/dev/null || break
  sleep 0.1
done
wait "$preview_pid"
