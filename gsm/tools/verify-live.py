"""Confirm that the deployed feed, page and every visible WebP match the artifact."""
import argparse
import hashlib
import json
import time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import quote

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--site', type=Path, default=Path('_site'))
parser.add_argument('--url', default='https://umwelt.fivsevn.com')
args = parser.parse_args()
files = ['gsm/index.html','gsm/settings/index.html','gsm/app.mjs','gsm/data/feed.mjs']
files += json.loads((Path(__file__).resolve().parents[1]/'.publishing/public.json').read_text())
pending = {path: (args.site/path).read_bytes() for path in files}
for attempt in range(12):
    for path, expected in list(pending.items()):
        version = hashlib.sha256(expected).hexdigest()[:16]
        try:
            req = Request(args.url.rstrip('/')+'/'+quote(path)+'?verify='+version, headers={'User-Agent':'Umwelt-Gstream-publish'})
            with urlopen(req, timeout=20) as response:
                if response.read() != expected:
                    raise ValueError('CDN still serves another revision')
            del pending[path]
        except Exception as error:
            print(f'Waiting for {path}: {error}', flush=True)
    if not pending:
        print(f'Verified {len(files)} live G-stream files and WebP images.')
        break
    time.sleep(10)
else:
    raise SystemExit('Live deployment did not match: '+', '.join(pending))
