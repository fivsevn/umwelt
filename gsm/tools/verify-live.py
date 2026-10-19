"""Verify the public artifact before recording a receipt for upload cleanup."""
import argparse
import hashlib
import json
import time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import quote


def digest(data):
    return hashlib.sha256(data).hexdigest()


def verify(root, site, url, *, attempts=12, delay=10):
    marker = site / '.gsm-verified.json'
    marker.unlink(missing_ok=True)
    files = ['gsm/index.html', 'gsm/settings/index.html', 'gsm/style.css', 'gsm/app.mjs', 'gsm/data/feed.mjs']
    files += json.loads((root / '.publishing/public.json').read_text())
    expected = {path: (site / path).read_bytes() for path in files}
    pending = dict(expected)
    for attempt in range(attempts):
        for path, content in list(pending.items()):
            try:
                req = Request(url.rstrip('/') + '/' + quote(path) + '?verify=' + digest(content)[:16],
                              headers={'User-Agent': 'Umwelt-Gstream-publish'})
                with urlopen(req, timeout=20) as response:
                    if response.read() != content:
                        raise ValueError('CDN still serves another revision')
                del pending[path]
            except Exception as error:
                print(f'Waiting for {path}: {error}', flush=True)
        if not pending:
            receipt = {'files': {path: digest(data) for path, data in expected.items()},
                       'source_feed': digest((root / 'data/feed.mjs').read_bytes())}
            marker.write_text(json.dumps(receipt, indent=2) + '\n')
            print(f'Verified {len(files)} live G-stream files and WebP images.')
            return receipt
        if attempt + 1 < attempts:
            time.sleep(delay)
    raise RuntimeError('Live deployment did not match: ' + ', '.join(pending))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--site', type=Path, default=Path('_site'))
    parser.add_argument('--url', default='https://umwelt.fivsevn.com')
    args = parser.parse_args()
    verify(Path(__file__).resolve().parents[1], args.site, args.url)
