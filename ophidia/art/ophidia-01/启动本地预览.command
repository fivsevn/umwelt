#!/bin/zsh
set -e
cd "$(dirname "$0")/../../.."
preview_port=8788
python3 -m http.server "$preview_port" --bind 127.0.0.1 &
preview_pid=$!
trap 'kill "$preview_pid" 2>/dev/null || true' EXIT INT TERM
sleep 1
open "http://127.0.0.1:$preview_port/ophidia/"
wait "$preview_pid"
