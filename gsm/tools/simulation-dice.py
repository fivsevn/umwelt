#!/usr/bin/env python3
"""Small, persistent dice for the text simulation; never publishes posts."""
import argparse
import json
import os
import secrets
from pathlib import Path


def save(path, record):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + '.tmp')
    with temporary.open('x', encoding='utf-8') as stream:
        json.dump(record, stream, ensure_ascii=False, indent=2)
        stream.write('\n')
    os.replace(temporary, path)


def choose(options, count, randbelow=secrets.randbelow):
    pool = list(options)
    result = []
    for _ in range(count):
        ticket = randbelow(sum(weight for _, weight in pool))
        for index, (label, weight) in enumerate(pool):
            if ticket < weight:
                result.append(label)
                pool.pop(index)
                break
            ticket -= weight
    return result


def execute(path, round_id, baseline, key=None, options=None, count=1):
    # A local lock avoids two simultaneous callers drawing different results.
    lock = path.with_name(path.name + '.lock')
    path.parent.mkdir(parents=True, exist_ok=True)
    with lock.open('x'):
        try:
            old = json.loads(path.read_text()) if path.exists() else None
            if key is None:
                if old and old['round'] == round_id:
                    if old['baseline'] != baseline:
                        raise ValueError('Existing round has a different baseline; do not redraw')
                    return old
                if old and not old.get('closed'):
                    raise ValueError('Close the previous round before starting another')
                record = {'version': 1, 'round': round_id, 'baseline': baseline,
                          'target_posts': secrets.randbelow(7) + 1,
                          'closed': False, 'draws': {}}
                save(path, record)
                return record
            if not old or old['round'] != round_id:
                raise ValueError('Start this round first, or restore its existing receipt')
            if old['closed']:
                raise ValueError('Round is closed; recovery must not create new candidates')
            if key == '__close__':
                old['closed'] = True
                save(path, old)
                return old
            if not isinstance(options, dict) or not options:
                raise ValueError('Options must be a nonempty JSON object')
            if any(not isinstance(k, str) or not k or type(v) is not int or v <= 0
                   for k, v in options.items()):
                raise ValueError('Use unique labels with positive integer weights')
            if type(count) is not int or not 1 <= count <= len(options):
                raise ValueError('Count must be between 1 and the pool size')
            spec = {'options': options, 'count': count}
            existing = old['draws'].get(key)
            if existing:
                if existing['input'] != spec:
                    raise ValueError('This key already has different inputs; do not redraw')
                return existing
            result = {'input': spec, 'result': choose(sorted(options.items()), count)}
            old['draws'][key] = result
            save(path, old)
            return result
        finally:
            lock.unlink()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--record', type=Path, required=True)
    parser.add_argument('--round', required=True)
    commands = parser.add_subparsers(dest='command', required=True)
    start = commands.add_parser('start')
    start.add_argument('--baseline', required=True)
    draw = commands.add_parser('draw')
    draw.add_argument('--key', required=True)
    draw.add_argument('--options', required=True, help='JSON object of label: integer weight')
    draw.add_argument('--count', type=int, default=1)
    commands.add_parser('close')
    args = parser.parse_args()
    try:
        result = execute(args.record, args.round, getattr(args, 'baseline', None),
                         '__close__' if args.command == 'close' else getattr(args, 'key', None),
                         json.loads(args.options) if args.command == 'draw' else None,
                         getattr(args, 'count', 1))
    except (ValueError, OSError, KeyError) as error:
        parser.exit(1, f'{error}\n')
    print(json.dumps(result, ensure_ascii=False, sort_keys=True))


if __name__ == '__main__':
    main()
