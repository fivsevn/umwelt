#!/usr/bin/env python3
"""Compatibility command for GSM's independent v2 engine. No legacy draws run."""
import os
from pathlib import Path
import shutil
import sys

if __name__ == '__main__':
    node = os.environ.get('GSM_NODE') or shutil.which('node')
    if not node:
        raise SystemExit('GSM needs Node.js 22+; run node gsm/tools/update.mjs after installing it.')
    args = sys.argv[1:]
    if args and args[0] in {'validate', 'build'}:
        script = 'publish.mjs'
    elif args and args[0] == 'ingest':
        raise SystemExit('Use node gsm/tools/publish.mjs ingest /outside/operation.json --reviewed --ai')
    else:
        script = 'update.mjs'
    os.execv(node, [node, str(Path(__file__).with_name(script)), *args])
