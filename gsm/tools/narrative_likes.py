#!/usr/bin/env python3
"""Reviewable, bounded fictional reactions. Never runs during a page build."""
import argparse
import hashlib
import json
import re
import secrets
from datetime import datetime
from pathlib import Path

import publish as publishing

VERSION = 1
REACH = {'quiet': 8, 'ordinary': 18, 'broad': 32}
RESONANCE = {'low': .10, 'everyday': .26, 'strong': .45}
RELATIONSHIP = {'none': 0, 'familiar': .04, 'exchange': .09}
ATTENTION = {'quiet': .8, 'steady': 1., 'busy': .6}
DIMENSIONS = {'reach': REACH, 'resonance': RESONANCE,
              'relationship': RELATIONSHIP, 'attention': ATTENTION}


def timestamp(value):
    return datetime.fromisoformat(publishing.date_value(value))


def assessment(value):
    if not isinstance(value, dict) or set(value) != {*DIMENSIONS, 'reason'}:
        raise ValueError('Assessment needs reach, resonance, relationship, attention and reason')
    for key, choices in DIMENSIONS.items():
        if not isinstance(value[key], str) or value[key] not in choices:
            raise ValueError(f'Invalid {key}: {value[key]}')
    if not isinstance(value['reason'], str) or not value['reason'].strip():
        raise ValueError('Explain content, contact opportunities and attention before drawing')
    return value


def uniform(seed, label):
    return int(hashlib.sha256(f'narrative-v1:{seed}:{label}'.encode()).hexdigest()[:13], 16) / 2**52


def schedule(seed, context):
    """Finite anonymous opportunities; one lifetime draw, with a cold branch."""
    assessment(context)
    if not isinstance(seed, str) or not re.fullmatch(r'[0-9a-f]{32}', seed):
        raise ValueError('Expected a saved 128-bit seed')
    if uniform(seed, 'missed') < .12:
        return []
    chance = ((RESONANCE[context['resonance']] + RELATIONSHIP[context['relationship']])
              * ATTENTION[context['attention']] * (.6 + .8 * uniform(seed, 'spread')))
    delays = []
    for reader in range(REACH[context['reach']]):
        if uniform(seed, f'like/{reader}') < chance:
            ticket = uniform(seed, f'delay/{reader}')
            # Reactions can be immediate, but all settle within three days.
            delays.append(next(hour for limit, hour in [( .10, 0), (.20, .25), (.35, 1),
                                                         (.65, 6), (.90, 24), (1., 72)] if ticket < limit))
    return sorted(delays)


def count_at(entry, at):
    age = (timestamp(at) - timestamp(entry['source']['date'])).total_seconds() / 3600
    if age < 0:
        raise ValueError('Cannot simulate reactions before the post date')
    return max(entry['floor'], sum(delay <= age for delay in schedule(entry['seed'], entry['assessment'])))


def source_for(meta, body):
    if not meta.get('username') or not meta.get('date'):
        raise ValueError('Set a fixed username and timezone-aware date first')
    source = {'username': str(meta['username']).lower(), 'date': publishing.date_value(meta['date']),
              'body_sha256': publishing.digest(body.encode())}
    key = publishing.digest(publishing.json_text(source).encode())
    return key, source


def replace_likes(text, value):
    # Change only this front-matter scalar, preserving every other byte.
    match = re.match(r'\A---\s*\n(.*?)\n---', text, re.S)
    if not match:
        raise ValueError('Explicit front matter required')
    front = match[1]
    fields = list(re.finditer(r'^likes:.*$', front, re.M))
    if len(fields) > 1:
        raise ValueError('Duplicate likes fields')
    if fields:
        field = fields[0]
        front = front[:field.start()] + f'likes: {value}' + front[field.end():]
    else:
        front += f'\nlikes: {value}'
    return text[:match.start(1)] + front + text[match.end(1):]


def apply(root, plan, at, *, seed_factory=lambda: secrets.token_hex(16)):
    root = root.resolve()
    timestamp(at)
    if not isinstance(plan, list) or not plan:
        raise ValueError('Plan must be a nonempty list of path / assessment objects')
    record_path = root / 'docs/narrative-likes.json'
    record_path.parent.mkdir(parents=True, exist_ok=True)
    lock = record_path.with_suffix('.lock')
    with lock.open('x'):
        try:
            record = json.loads(record_path.read_text()) if record_path.exists() else {'version': VERSION, 'entries': {}}
            if record.get('version') != VERSION:
                raise ValueError('Unsupported receipt version')
            changes, seen = [], set()
            for item in plan:
                if not isinstance(item, dict) or set(item) - {'path', 'assessment'}:
                    raise ValueError('Each plan item needs path and optional assessment')
                path = publishing.local_path(root, item['path'])
                if not (path == root / 'trigger.md' or
                        (path.is_relative_to(root / 'posts') and path.name == 'index.md')):
                    raise ValueError('Only trigger.md or posts/**/index.md may be changed')
                text = path.read_text()
                meta, body = publishing.split(text)
                publishing.validate(meta, body, require_author=False)
                if meta.get('status', 'published') != 'published':
                    raise ValueError('Only published posts may receive narrative reactions')
                if path == root / 'trigger.md' and publishing.IMAGE.search(body):
                    raise ValueError('For media posts, assess the archived package after conversion')
                # Reject duplicate scalars even if the current value would not change.
                replace_likes(text, publishing.initial_likes(meta))
                key, source = source_for(meta, body)
                if key in seen:
                    raise ValueError('Duplicate post in plan')
                seen.add(key)
                old = record['entries'].get(key)
                if old is None:
                    if any(e['source']['username'] == source['username'] and e['source']['date'] == source['date']
                           for e in record['entries'].values()):
                        raise ValueError('Post text changed; review the old receipt instead of drawing again')
                    context = assessment(item.get('assessment'))
                    old = {'source': source, 'assessment': context, 'seed': seed_factory(),
                           'floor': publishing.initial_likes(meta), 'previous': publishing.initial_likes(meta)}
                elif item.get('assessment', old['assessment']) != old['assessment']:
                    raise ValueError('Existing assessment is frozen; do not redraw or retune a post')
                if 'at' in old and timestamp(at) < timestamp(old['at']):
                    raise ValueError('Cannot move a receipt backwards in time')
                current = publishing.initial_likes(meta)
                # previous permits recovery after the receipt was saved but a post write failed.
                if current not in {old['previous'], old.get('likes', old['floor'])}:
                    raise ValueError('Likes changed outside this receipt; review instead of overwriting')
                value = count_at(old, at)
                entry = {**old, 'previous': current, 'at': publishing.date_value(at), 'likes': value}
                record['entries'][key] = entry
                changes.append((path, text, replace_likes(text, value), current, value))
            # Check the whole plan before writing; persist the random choices first for retry.
            for path, before, *_ in changes:
                if path.read_text() != before:
                    raise ValueError('Source changed while assessing; reload the current main')
            publishing.write(record_path, publishing.json_text(record))
            for path, before, after, _, _ in changes:
                if path.read_text() != before:
                    raise ValueError('Source changed after receipt save; review before retry')
                publishing.write(path, after)
            return [{'path': str(p.relative_to(root)), 'before': old, 'likes': new}
                    for p, _, _, old, new in changes]
        finally:
            lock.unlink()


def check(root):
    """Read-only CI check; pending trigger receipts may precede their archive."""
    record_path = root / 'docs/narrative-likes.json'
    if not record_path.exists():
        return 0
    record = json.loads(record_path.read_text())
    if record.get('version') != VERSION:
        raise ValueError('Unsupported receipt version')
    sources = {}
    for key, entry in record['entries'].items():
        if key != publishing.digest(publishing.json_text(entry['source']).encode()):
            raise ValueError('Receipt source key mismatch')
        for field in ['floor', 'previous', 'likes']:
            publishing.initial_likes({'likes': entry[field]})
        if entry['likes'] != count_at(entry, entry['at']):
            raise ValueError('Receipt result does not match saved draw and time')
        source = entry['source']
        pair = (source['username'], source['date'])
        if pair in sources:
            raise ValueError('Duplicate source identity in receipts')
        sources[pair] = key
    checked = 0
    for path in sorted((root / 'posts').glob('**/index.md')):
        meta, body = publishing.split(path.read_text())
        key, source = source_for(meta, body)
        pair = (source['username'], source['date'])
        if pair not in sources:
            continue
        if sources[pair] != key:
            raise ValueError(f'Reconcile the saved receipt after editing {path}')
        if publishing.initial_likes(meta) != record['entries'][key]['likes']:
            raise ValueError(f'Post likes differ from receipt: {path}')
        checked += 1
    return checked


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=publishing.ROOT)
    parser.add_argument('--check', action='store_true', help='Validate saved draws and archived likes without writing')
    parser.add_argument('--plan', type=Path, help='JSON list of paths and first-time assessments')
    parser.add_argument('--at', help='Explicit simulated observation time with timezone')
    args = parser.parse_args()
    try:
        if args.check:
            result = {'checked_posts': check(args.root)}
        else:
            if not args.plan or not args.at:
                raise ValueError('--plan and --at are required unless using --check')
            result = apply(args.root, json.loads(args.plan.read_text()), args.at)
    except (ValueError, OSError, KeyError, TypeError) as error:
        parser.exit(1, f'{error}\n')
    print(publishing.json_text(result), end='')


if __name__ == '__main__':
    main()
