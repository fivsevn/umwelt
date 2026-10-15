"""Sync audited native portraits without replacing placement metadata."""
from pathlib import Path
import hashlib
import json
import math

HERE = Path(__file__).resolve().parent
ROOF = HERE.parents[1]
audit_path = HERE / 'audit.json'
catalog_path = ROOF / 'item-data.mjs'
source = catalog_path.read_text()
prefix, payload = source.split('export const ITEM_DATA = ', 1)
items = json.loads(payload.rstrip().removesuffix(';'))
records = json.loads(audit_path.read_text())
by_id = {record['id']: record for record in records}
assert len(by_id) == len(items) == len(records)

for item in items:
    record = by_id[item['id']]
    for field, digest in [('thumbnail', 'pngSha256'), ('file', 'sourceModelSha256'), ('atlas', 'atlasSha256')]:
        assert hashlib.sha256((ROOF / item[field]).read_bytes()).hexdigest() == record[digest], item['id']
    projection = dict(record['projection'])
    step = projection['metresPerPixel']
    anchor = projection['anchor']
    left, top, right, bottom = record['alphaBounds']
    assert step > 0 and all(math.isfinite(v) for v in [step, *anchor])
    assert 0 <= left <= right < 144 and 0 <= top <= bottom < 144
    # Alpha bounds include the final pixel; its far edge is one pixel farther.
    projection['min'] = [(left - anchor[0]) * step, (top - anchor[1]) * step]
    projection['max'] = [(right + 1 - anchor[0]) * step, (bottom + 1 - anchor[1]) * step]
    record['projection'] = projection
    item['thumbnailProjection'] = projection

catalog_path.write_text(prefix + 'export const ITEM_DATA = ' + json.dumps(items, ensure_ascii=False, separators=(',', ':')) + ';\n')
audit_path.write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')
print(f'Synced {len(items)} audited portrait projections; placement metadata preserved.')
