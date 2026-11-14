#!/usr/bin/env python3
"""One recoverable AI update: source reading, stable draws, review and publication."""
from __future__ import annotations

import argparse
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
import fcntl
import hashlib
import json
import math
import os
from pathlib import Path
import re
import secrets
import subprocess
import tempfile
import unicodedata
from urllib.parse import unquote_plus, urlsplit, urlunsplit
from urllib.request import Request, urlopen

import publish as p

ROOT = p.ROOT
ID = re.compile(r'^[a-z0-9][a-z0-9-]{1,63}$')
GUEST = re.compile(r'^guest-[a-z0-9][a-z0-9-]{0,56}$')
DAY = timedelta(days=1)
DEFAULT_POLICY = {'version': 1, 'automaticPosting': True, 'timezone': 'Asia/Shanghai',
                  'maxBatchPosts': 120, 'replyLottery': {
                      'bands': [{'weight': 90, 'min': 0, 'max': 10},
                                {'weight': 10, 'min': 21, 'max': 60}], 'maxReplies': 100}}


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


def digest(value):
    return hashlib.sha256(canonical(value).encode()).hexdigest()


def clock(now=None):
    return datetime.now(timezone.utc) if now is None else moment(now) if isinstance(now, str) else now.astimezone(timezone.utc)


def moment(value):
    if not isinstance(value, str) or not re.fullmatch(r'\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)', value):
        raise ValueError('Use a real ISO timestamp with timezone')
    return datetime.fromisoformat(value.replace('Z', '+00:00')).astimezone(timezone.utc)


def iso(value):
    return value.astimezone(p.ZONE).isoformat(timespec='seconds')


def bounded(value, limit=4000, empty=False):
    return isinstance(value, str) and len(value) <= limit and (empty or bool(value.strip()))


def fields(value, allowed, required=()):
    if not isinstance(value, dict) or set(value) - set(allowed) or set(required) - set(value):
        raise ValueError('Unexpected or missing fields: ' + ', '.join(allowed))


def regular(path):
    if path.is_symlink() or not path.is_file():
        raise ValueError('Expected a regular file: ' + str(path))
    return path.read_bytes()


def owned(root, relative):
    if not isinstance(relative, str) or '\\' in relative or ':' in relative or relative.startswith('/'):
        raise ValueError('Use an owned relative path')
    path = root / relative
    if '..' in Path(relative).parts or not path.resolve().is_relative_to(root.resolve()):
        raise ValueError('Path leaves its owned directory')
    for ancestor in [path, *path.parents]:
        if ancestor == root.parent:
            break
        if ancestor.is_symlink():
            raise ValueError('Symlinks are not allowed: ' + str(ancestor))
    return path


def atomic(path, content):
    content = content.encode() if isinstance(content, str) else content
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.is_symlink():
        raise ValueError('Refusing to replace a symlink: ' + str(path))
    fd, temporary = tempfile.mkstemp(prefix='.' + path.name + '-', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        Path(temporary).unlink(missing_ok=True)


def save(path, value):
    atomic(path, p.json_text(value))


@contextmanager
def locked(path):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.is_symlink():
        raise ValueError('Lock cannot be a symlink')
    with path.open('a+b') as stream:
        try:
            fcntl.flock(stream, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as error:
            raise ValueError('This update is busy; retry after the active command finishes') from error
        try:
            yield
        finally:
            fcntl.flock(stream, fcntl.LOCK_UN)


def checked_root(root):
    root = Path(root)
    if root.is_symlink() or not root.is_dir():
        raise ValueError('The G-stream root must be a regular directory')
    return root.resolve()


def work_folder(root, work=None):
    path = Path(work or os.environ.get('UMWELT_GSM_WORK_DIR') or
                Path.home() / '.local/state/umwelt/gsm/current').expanduser()
    if path.is_symlink() or path.resolve().is_relative_to(root.parent):
        raise ValueError('Keep update work files outside the repository')
    path.mkdir(parents=True, exist_ok=True)
    return path.resolve()


def policy_for(root):
    value = json.loads(regular(root / 'publication.json'))
    fields(value, ['version', 'automaticPosting', 'timezone', 'maxBatchPosts', 'replyLottery'], DEFAULT_POLICY)
    if value['version'] != 1 or type(value['automaticPosting']) is not bool or value['timezone'] != 'Asia/Shanghai' or type(value['maxBatchPosts']) is not int or not 1 <= value['maxBatchPosts'] <= 120:
        raise ValueError('Invalid publication policy')
    validate_lottery(value['replyLottery'])
    return value


def validate_lottery(value):
    fields(value, ['bands', 'maxReplies'], ['bands', 'maxReplies'])
    if type(value['maxReplies']) is not int or not 0 <= value['maxReplies'] <= 120 or not isinstance(value['bands'], list) or not 1 <= len(value['bands']) <= 10:
        raise ValueError('Invalid reply lottery')
    for band in value['bands']:
        fields(band, ['weight', 'min', 'max'], ['weight', 'min', 'max'])
        if isinstance(band['weight'], bool) or not isinstance(band['weight'], (float, int)) or not math.isfinite(band['weight']) or not 0 < band['weight'] <= 1000000 or type(band['min']) is not int or type(band['max']) is not int or not 0 <= band['min'] <= band['max'] <= 120:
            raise ValueError('Invalid reply lottery band')


def random_for(seed):
    state = int.from_bytes(hashlib.sha256(seed.encode()).digest()[:4], 'little') or 1
    def draw():
        nonlocal state
        state ^= (state << 13) & 0xffffffff
        state ^= state >> 17
        state ^= (state << 5) & 0xffffffff
        state &= 0xffffffff
        return state / 4294967296
    return draw


def ready(user):
    return user.get('active', True) and user.get('ai_scope') in {'日常', 'daily'} and user.get('weight', 1) > 0 and (user.get('allow_posts', True) or user.get('allow_replies', True))


def draw_plan(users, history, seed, policy, requested_count=None):
    if requested_count is not None and (type(requested_count) is not int or not 1 <= requested_count <= 20 or requested_count > policy['maxBatchPosts']):
        raise ValueError('The explicit total count must be an integer from 1 to 20 within the hard limit')
    random = random_for(seed)
    budget = 1 + int(random() * 10)
    recent = {post['author'] for post in sorted(history.values(), key=lambda post: moment(post['createdAt']), reverse=True)[:7]}
    pool = sorted(key for key, user in users.items() if ready(user))
    selected = []
    while pool and len(selected) < 3:
        weights = [users[key].get('weight', 1) * (0.5 if key in recent else 1) for key in pool]
        ticket = random() * sum(weights)
        index = len(pool) - 1
        for index, weight in enumerate(weights):
            ticket -= weight
            if ticket < 0:
                break
        selected.append(pool.pop(index))
    return {'seed': seed, 'budget': budget, 'selectedIds': selected,
            'totalBudget': requested_count if requested_count is not None else policy['maxBatchPosts'],
            'replyLottery': json.loads(canonical(policy['replyLottery'])),
            **({'requestedCount': requested_count} if requested_count is not None else {})}


def seal(operation):
    return digest({'id': operation['id'], 'root': operation['root'],
                   'plan': {key: value for key, value in operation['plan'].items() if key != 'seal'}})


def read_operation(root, work):
    operation = json.loads(regular(work / 'operation.json'))
    required = ['version', 'id', 'root', 'preparedAt', 'plan', 'sourceDigest', 'research', 'posts', 'status']
    fields(operation, required, required)
    if operation['version'] != 1 or not ID.fullmatch(operation['id']) or operation['root'] != str(root) or operation['status'] not in {'prepared', 'awaiting-online', 'published'} or not re.fullmatch(r'[a-f0-9]{64}', operation['sourceDigest']) or not isinstance(operation['posts'], list) or not isinstance(operation['research'], list):
        raise ValueError('Invalid operation record')
    moment(operation['preparedAt'])
    plan = operation['plan']
    fields(plan, ['seed', 'budget', 'selectedIds', 'totalBudget', 'replyLottery', 'requestedCount', 'seal'], ['seed', 'budget', 'selectedIds', 'totalBudget', 'replyLottery', 'seal'])
    if not bounded(plan['seed'], 200) or type(plan['budget']) is not int or plan['budget'] != 1 + int(random_for(plan['seed'])() * 10) or not isinstance(plan['selectedIds'], list) or len(plan['selectedIds']) > 3 or len(set(plan['selectedIds'])) != len(plan['selectedIds']) or any(not isinstance(key, str) or not p.USERNAME.fullmatch(key) for key in plan['selectedIds']) or type(plan['totalBudget']) is not int or not 1 <= plan['totalBudget'] <= 120 or plan['seal'] != seal(operation):
        raise ValueError('The saved draw changed; restore the original operation')
    if 'requestedCount' in plan and (type(plan['requestedCount']) is not int or not 1 <= plan['requestedCount'] <= 20 or plan['totalBudget'] != plan['requestedCount']):
        raise ValueError('Invalid saved explicit count')
    validate_lottery(plan['replyLottery'])
    return operation


def post_paths(root):
    return p.post_documents(root)


def source(root, operation_id=None):
    policy = policy_for(root)
    users = p.sync_users(root)
    documents = []
    paths = {root / 'publication.json'}
    if (root / 'accounts.json').exists():
        paths.add(root / 'accounts.json')
    paths.update(root / relative for relative in ['docs/README.md', 'docs/writing.md', 'docs/publishing.md']
                 if (root / relative).is_file())
    for directory in ['environment', 'users']:
        paths.update((root / directory).rglob('*.md'))
    history, archived_ids = {}, set()
    for path in post_paths(root):
        raw = regular(path).decode()
        meta, body = p.split(raw)
        p.validate(meta, body)
        ident = meta.get('id')
        if not isinstance(ident, str) or not ID.fullmatch(ident) or ident in archived_ids:
            raise ValueError('Invalid or duplicate archived post ID: ' + str(path))
        archived_ids.add(ident)
        if operation_id and meta.get('operation_id') == operation_id:
            continue
        paths.add(path)
        if meta.get('status', 'published') == 'published':
            history[ident] = {'id': ident, 'author': str(meta['username']).lower(), 'createdAt': p.date_value(meta['date']),
                              'replyTo': meta.get('reply_to'), 'text': body, 'guest': meta.get('guest'), 'path': path}
    for path in sorted(paths):
        owned(root, path.relative_to(root).as_posix())
        documents.append({'path': path.relative_to(root).as_posix(), 'text': regular(path).decode()})
    for ident in history:
        thread_root(ident, history)
    return {'policy': policy, 'users': users, 'history': history, 'documents': documents,
            'sourceDigest': digest({'policy': policy, 'users': users, 'documents': documents})}


def reading(operation, data):
    plan = operation['plan']
    lead = f"# 本次更新阅读材料\n\n操作：{operation['id']}；新主帖上限：{plan['budget']}；发言总上限：{plan['totalBudget']}；主动候选：{'、'.join(plan['selectedIds']) or '无'}。\n\n"
    lead += '这是完整资料快照；生成不代表执行者已经读完。按来源逐段读取角色、环境、规则和全部归档；先确定新主帖与接续旧串，再用 replies 查看各串新增回复额度。实际发言至少一半来自 guest，候选可以沉默，其他合资格角色可以回复。\n\n'
    lead += '## 当前账号权限\n\n| 账号 | 日常资格 | 可开串 | 可回复 | 主动候选 |\n| --- | --- | --- | --- | --- |\n'
    for key, user in data['users'].items():
        lead += f"| {key} | {'可用' if ready(user) else '不可用'} | {'是' if user.get('allow_posts', True) else '否'} | {'是' if user.get('allow_replies', True) else '否'} | {'是' if key in plan['selectedIds'] else '否'} |\n"
    return lead + '\n' + '\n\n'.join('---\n\n## 原文路径：' + doc['path'] + '\n\n' + doc['text'] for doc in data['documents']) + '\n'


def prepare(root=ROOT, work=None, requested_count=None, now=None, entropy=None):
    root = checked_root(root)
    work = work_folder(root, work)
    now = clock(now)
    with locked(work / '.update.lock'), locked(owned(root, '.publishing/.update.lock')):
        operation = read_operation(root, work) if (work / 'operation.json').exists() else None
        if operation and requested_count is not None and operation['plan'].get('requestedCount') != requested_count:
            raise ValueError('Resume the original count; do not redraw')
        data = source(root, operation['id'] if operation else None)
        if not data['policy']['automaticPosting']:
            raise ValueError('AI updates are disabled by publication.json')
        status = 'resumed' if operation else 'prepared'
        if not operation:
            seed = (entropy or (lambda: secrets.token_hex(32)))()
            if not bounded(seed, 200):
                raise ValueError('Invalid random seed')
            ident = 'gsm-' + now.strftime('%Y%m%d%H%M%S') + '-' + digest(seed)[:8]
            operation = {'version': 1, 'id': ident, 'root': str(root), 'preparedAt': iso(now),
                         'plan': draw_plan(data['users'], data['history'], seed, data['policy'], requested_count),
                         'sourceDigest': data['sourceDigest'], 'research': [], 'posts': [], 'status': 'prepared'}
            operation['plan']['seal'] = seal(operation)
        else:
            operation['preparedAt'] = iso(now)
            operation['sourceDigest'] = data['sourceDigest']
        atomic(work / 'reading.md', reading(operation, data))
        save(work / 'operation.json', operation)
        return {'status': status, 'id': operation['id'], 'budget': operation['plan']['budget'], 'budgetScope': 'roots',
                'totalBudget': operation['plan']['totalBudget'], 'selectedIds': operation['plan']['selectedIds'],
                'operationPath': str(work / 'operation.json'), 'readingPath': str(work / 'reading.md')}


def post_index(posts, history):
    result = dict(history)
    seen = set()
    for post in posts:
        if not isinstance(post, dict) or not isinstance(post.get('id'), str) or not ID.fullmatch(post['id']) or post['id'] in seen or not (post.get('replyTo') is None or isinstance(post['replyTo'], str) and ID.fullmatch(post['replyTo'])):
            raise ValueError('Posts need distinct IDs and a real parent or null')
        seen.add(post['id'])
        result[post['id']] = post
    return result


def thread_root(ident, posts):
    seen = set()
    while True:
        if ident in seen:
            raise ValueError('Reply cycle')
        seen.add(ident)
        post = posts.get(ident)
        if not post:
            raise ValueError('Missing reply parent: ' + str(ident))
        parent = post.get('replyTo')
        if parent is None:
            return post
        if not isinstance(parent, str) or not ID.fullmatch(parent):
            raise ValueError('Invalid reply parent')
        ident = parent


def reply_count(seed, root_id, lottery):
    validate_lottery(lottery)
    random = random_for(seed + '\0replies\0' + root_id)
    ticket = random() * sum(band['weight'] for band in lottery['bands'])
    chosen = lottery['bands'][-1]
    for chosen in lottery['bands']:
        ticket -= chosen['weight']
        if ticket < 0:
            break
    return chosen['min'] + int(random() * (chosen['max'] - chosen['min'] + 1))


def replies(root=ROOT, work=None, thread_ids=()):
    root = checked_root(root)
    work = work_folder(root, work)
    with locked(work / '.update.lock'), locked(owned(root, '.publishing/.update.lock')):
        operation = read_operation(root, work)
        data = source(root, operation['id'])
        index = post_index(operation['posts'], data['history'])
        roots = {thread_root(post['id'], index)['id'] for post in operation['posts']}
        for ident in thread_ids:
            if not isinstance(ident, str) or not ID.fullmatch(ident):
                raise ValueError('Use valid continuation post IDs')
            roots.add(thread_root(ident, index)['id'])
        plan = operation['plan']
        return {'id': operation['id'], 'rootBudget': plan['budget'],
                'totalBudget': min(plan['totalBudget'], data['policy']['maxBatchPosts']),
                'maxReplies': min(plan['replyLottery']['maxReplies'], data['policy']['replyLottery']['maxReplies']),
                'threads': [{'rootId': ident, 'replyCount': reply_count(plan['seed'], ident, plan['replyLottery'])} for ident in sorted(roots)]}


def presentation(seed, posts):
    post_index(posts, {})
    def rank(post):
        return hashlib.sha256((seed + '\0image\0' + post['id']).encode()).hexdigest(), post['id']
    images = [post['id'] for post in sorted(posts, key=rank)[:math.ceil(len(posts) / 2)]]
    likes = []
    for post in posts:
        random = random_for(seed + '\0likes\0' + post['id'])
        tier = random()
        root = post.get('replyTo') is None
        integer = lambda lower, upper: lower + int(random() * (upper - lower + 1))
        if tier < (0.2 if root else 0.35):
            count = 0
        elif tier < (0.93 if root else 0.97):
            count = integer(1, 20 if root else 12)
        elif tier < 0.99:
            count = integer(21 if root else 13, 60 if root else 35)
        else:
            count = integer(61 if root else 36, 160 if root else 90)
        likes.append({'id': post['id'], 'likes': count})
    return {'imagePostIds': images, 'likes': likes}


def suggest(root=ROOT, work=None):
    root = checked_root(root)
    work = work_folder(root, work)
    with locked(work / '.update.lock'), locked(owned(root, '.publishing/.update.lock')):
        operation = read_operation(root, work)
        return {'id': operation['id'], 'count': len(operation['posts']), **presentation(operation['plan']['seed'], operation['posts'])}


def domain(hostname):
    parts = hostname.lower().split('.')
    suffixes = {'co.uk', 'org.uk', 'ac.uk', 'com.cn', 'net.cn', 'org.cn', 'gov.cn', 'co.jp', 'co.kr', 'com.au', 'com.hk'}
    return '.'.join(parts[-3:] if '.'.join(parts[-2:]) in suffixes else parts[-2:])


def validate_research(entries, now, post_ids):
    if not isinstance(entries, list) or not 3 <= len(entries) <= 50:
        raise ValueError('Research needs at least three actually read pages')
    categories, domains, urls = set(), set(), set()
    thread = recent = False
    for entry in entries:
        fields(entry, ['category', 'kind', 'url', 'visitedAt', 'publishedAt', 'summary', 'adaptedPostIds', 'purpose'], ['category', 'kind', 'url', 'visitedAt', 'publishedAt', 'summary'])
        url = urlsplit(entry['url']) if isinstance(entry['url'], str) else None
        if not url or url.scheme != 'https' or not url.hostname or '.' not in url.hostname or url.username or url.password or not bounded(entry['url'], 2000) or entry['category'] not in {'news', 'trend', 'daily'} or entry['kind'] not in {'feed', 'thread'} or not bounded(entry['summary']):
            raise ValueError('Invalid research page')
        visited = moment(entry['visitedAt'])
        if visited > now + timedelta(minutes=5) or now - visited > 2 * DAY:
            raise ValueError('Research page is stale or in the future')
        normalized = urlunsplit((url.scheme, url.netloc.lower(), url.path, url.query, ''))
        if normalized in urls:
            raise ValueError('Research pages must be distinct')
        urls.add(normalized)
        domains.add(domain(url.hostname))
        categories.add(entry['category'])
        thread |= entry['kind'] == 'thread'
        if entry['publishedAt'] is not None:
            published = moment(entry['publishedAt'])
            if published > now + timedelta(minutes=5):
                raise ValueError('Source publication date is in the future')
            recent |= now - published <= 7 * DAY
        if entry.get('purpose') not in {None, 'meme'}:
            raise ValueError('Optional research purpose must be meme')
        adapted = entry.get('adaptedPostIds', [])
        if not isinstance(adapted, list) or len(set(adapted)) != len(adapted) or any(ident not in post_ids for ident in adapted):
            raise ValueError('Adapted references must name this update')
    if categories != {'news', 'trend', 'daily'} or len(domains) < 2 or not thread or not recent:
        raise ValueError('Research needs three categories, two domains, one thread and one item from the last seven days')


def receipt_path(root, operation):
    return owned(root, '.publishing/operations/' + operation['id'] + '.json')


def batch_digest(operation):
    return digest({'id': operation['id'], 'posts': operation['posts']})


def content_fingerprint(author, parent, text):
    normalized = re.sub(r'\s+', ' ', unicodedata.normalize('NFKC', text)).strip()
    return digest([author, parent, normalized])


def validate_update(root, operation, data, now, backfill=False):
    if type(backfill) is not bool:
        raise ValueError('Historical updates require an explicit boolean backfill option')
    if not data['policy']['automaticPosting']:
        raise ValueError('AI updates are disabled by publication.json')
    if operation['sourceDigest'] != data['sourceDigest']:
        raise ValueError('Source material changed; prepare again without redrawing')
    if now - moment(operation['preparedAt']) > 2 * DAY or moment(operation['preparedAt']) > now + timedelta(minutes=5):
        raise ValueError('The operation is stale; prepare again to refresh reading')
    posts = operation['posts']
    if not posts:
        return post_index([], data['history'])
    validate_research(operation['research'], now, {post['id'] for post in posts})
    plan, policy = operation['plan'], data['policy']
    index = post_index(posts, data['history'])
    roots = [post for post in posts if post.get('replyTo') is None]
    responses = [post for post in posts if post.get('replyTo') is not None]
    if len(posts) > min(plan['totalBudget'], policy['maxBatchPosts']) or len(roots) > plan['budget'] or len(responses) > min(plan['replyLottery']['maxReplies'], policy['replyLottery']['maxReplies']):
        raise ValueError('The update exceeds its saved or current publication budget')
    counts = {}
    for post in responses:
        root_id = thread_root(post['id'], index)['id']
        counts[root_id] = counts.get(root_id, 0) + 1
    if any(count > reply_count(plan['seed'], root_id, plan['replyLottery']) for root_id, count in counts.items()):
        raise ValueError('A thread exceeds its saved reply allowance')
    guests = 0
    guest_names = {}
    used_names = {unicodedata.normalize('NFKC', user['name']).strip().casefold(): key for key, user in data['users'].items()}
    for archived in data['history'].values():
        if archived.get('guest'):
            guest_names[archived['author']] = archived['guest']
            used_names[unicodedata.normalize('NFKC', archived['guest']['name']).strip().casefold()] = archived['author']
    fingerprints = {content_fingerprint(post['author'], post.get('replyTo'), p.IMAGE.sub('', post['text']))
                    for post in data['history'].values()}
    latest = max((moment(post['createdAt']) for post in data['history'].values()), default=datetime.min.replace(tzinfo=timezone.utc))
    resuming = receipt_path(root, operation).exists() or (owned(root, '.publishing/update-pending.json')).exists()
    for post in posts:
        fields(post, ['id', 'author', 'guest', 'createdAt', 'replyTo', 'text', 'likes', 'canon', 'media'], ['id', 'author', 'createdAt', 'replyTo', 'text', 'likes', 'media'])
        if post['id'] in data['history'] or not isinstance(post['author'], str) or not (post['author'] in data['users'] or GUEST.fullmatch(post['author'])) or not bounded(post['text'], 10000, empty=True) or p.IMAGE.search(post['text']) or post.get('canon', 'derivative') != 'derivative' or not isinstance(post['media'], list) or len(post['media']) > 4 or not (post['text'].strip() or post['media']):
            raise ValueError('Invalid new post or reused historical ID')
        p.initial_likes(post)
        at = moment(post['createdAt'])
        if at > now or not backfill and not resuming and (now - at > 2 * DAY or at < latest):
            raise ValueError('Posts must append the current real timeline unless explicitly backfilling history')
        if post['replyTo'] is not None and moment(index[post['replyTo']]['createdAt']) > at:
            raise ValueError('A reply cannot precede its actual parent')
        fingerprint = content_fingerprint(post['author'], post['replyTo'], post['text'])
        if fingerprint in fingerprints:
            raise ValueError('Duplicate content in this update or archived history')
        fingerprints.add(fingerprint)
        user = data['users'].get(post['author'])
        if 'guest' in post:
            guest = post['guest']
            fields(guest, ['name', 'bio'], ['name'])
            if user or not GUEST.fullmatch(post['author']) or not bounded(guest['name'], 40) or guest['name'] != guest['name'].strip() or not bounded(guest.get('bio', ''), 240, empty=True):
                raise ValueError('Guests need a reserved unique identity and a public name')
            name = unicodedata.normalize('NFKC', guest['name']).casefold()
            if post['author'] in guest_names and guest_names[post['author']] != guest or name in used_names and used_names[name] != post['author']:
                raise ValueError('Guest identity changed or impersonates another author')
            guest_names[post['author']] = guest
            used_names[name] = post['author']
            guests += 1
        elif not user or not ready(user) or not user.get('allow_posts' if post['replyTo'] is None else 'allow_replies', True) or post['replyTo'] is None and post['author'] not in plan['selectedIds']:
            raise ValueError('Only selected eligible users can open threads; other eligible users can reply')
        folder = thread_folder(root, thread_root(post['id'], index))
        for media in post['media']:
            fields(media, ['src', 'alt'], ['src', 'alt'])
            if not bounded(media['alt'], 1000) or re.search(r'[\]\r\n]', media['alt']) or not isinstance(media['src'], str) or not media['src'].startswith(folder.relative_to(root).as_posix() + '/media/'):
                raise ValueError('Media belongs in the root thread media directory and needs alt text')
            path = owned(root, media['src'])
            if path.parent != folder / 'media' or path.suffix.lower() not in {'.png', '.jpg', '.jpeg', '.webp'}:
                raise ValueError('Use one owned image file in this root thread')
            p.webp(regular(path))
    if guests < math.ceil(len(posts) / 2):
        raise ValueError('At least half of actual posts must be guests')
    targets = set(presentation(plan['seed'], posts)['imagePostIds'])
    if any(not post['media'] for post in posts if post['id'] in targets):
        raise ValueError('Complete the stable half-of-posts image targets before importing')
    return index


def thread_folder(root, post):
    date = p.date_value(post['createdAt'])
    return owned(root, f"posts/{date[:4]}/{date[5:7]}/{post['id']}")


def archive_files(root, operation, data, index, sources=None):
    files = {}
    for post in operation['posts']:
        folder = thread_folder(root, thread_root(post['id'], index))
        path = folder / ('index.md' if post['replyTo'] is None else 'replies/' + post['id'] + '.md')
        body = post['text'].strip()
        for media in post['media']:
            original = owned(root, media['src'])
            source_bytes = regular(original)
            converted = p.webp(source_bytes)
            target = folder / 'media' / ('image-' + p.digest(converted)[:20] + '.webp')
            relative = target.relative_to(root).as_posix()
            if sources is not None and relative != media['src']:
                sources[media['src']] = {'path': media['src'], 'sha256': p.digest(source_bytes), 'target': relative, 'target_sha256': p.digest(converted)}
            if relative in files and files[relative] != converted:
                raise ValueError('Image output collision')
            files[relative] = converted
            link = os.path.relpath(target, path.parent).replace(os.sep, '/')
            body += ('\n\n' if body else '') + f"![{media['alt']}]({link})"
        name = post['guest']['name'] if 'guest' in post else data['users'][post['author']]['name']
        meta = {'id': post['id'], 'date': p.date_value(post['createdAt']), 'username': post['author'], 'name': name,
                'status': 'published', 'likes': post['likes'], 'source_event': 'ai:' + operation['id'] + ':' + post['id'],
                'author_assignment': 'guest' if 'guest' in post else 'specified', 'operation_id': operation['id']}
        if post['replyTo'] is not None:
            meta['reply_to'] = post['replyTo']
        if 'guest' in post:
            meta['guest'] = post['guest']
        files[path.relative_to(root).as_posix()] = p.document(meta, body).encode()
    return files


def normalized_operation(operation, sources):
    normalized = json.loads(json.dumps(operation, ensure_ascii=False))
    for post in normalized['posts']:
        for media in post['media']:
            if media['src'] in sources:
                media['src'] = sources[media['src']]['target']
    return normalized


def matching_batch(receipt, operation):
    return batch_digest(operation) in {receipt['batchDigest'], receipt.get('normalizedBatchDigest')}


def complete_image_import(root, work, operation, receipt):
    sources = {item['path']: item for item in receipt.get('sourceMedia', [])}
    operation = normalized_operation(operation, sources)
    save(work / 'operation.json', operation)
    p._build_unlocked(root)
    p.clean_image_sources(root, {owned(root, value['path']):
                                {'target': owned(root, value['target']), 'sha256': value['sha256'], 'target_sha256': value.get('target_sha256')}
                                for value in sources.values()})


def archive_write(root, relative, content):
    path = owned(root, relative)
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        if regular(path) != content:
            raise ValueError('Archive already exists with different content: ' + relative)
        return
    fd, temporary = tempfile.mkstemp(prefix='.update-', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        try:
            os.link(temporary, path)
        except FileExistsError:
            if regular(path) != content:
                raise ValueError('Archive changed during import: ' + relative)
    finally:
        Path(temporary).unlink(missing_ok=True)


def verify_files(root, receipt):
    for item in receipt['files']:
        path = owned(root, item['path'])
        if p.digest(regular(path)) != item['sha256']:
            raise ValueError('Imported archive changed; keep the operation and inspect ' + item['path'])


def ingest(root=ROOT, work=None, reviewed=False, now=None, backfill=False):
    if reviewed is not True:
        raise ValueError('Review the actual reading, drafts and images, then pass --reviewed')
    root = checked_root(root)
    work = work_folder(root, work)
    now = clock(now)
    with locked(work / '.update.lock'), locked(owned(root, '.publishing/.update.lock')):
        operation = read_operation(root, work)
        if not operation['posts']:
            raise ValueError('Use finish to close an update with no posts')
        data = source(root, operation['id'])
        index = validate_update(root, operation, data, now, backfill)
        sources = {}
        files = archive_files(root, operation, data, index, sources)
        receipt_file = receipt_path(root, operation)
        pending = owned(root, '.publishing/update-pending.json')
        if receipt_file.exists():
            receipt = json.loads(regular(receipt_file))
            if receipt['id'] != operation['id'] or not matching_batch(receipt, operation) or {item['path']: item['sha256'] for item in receipt['files']} != {path: p.digest(content) for path, content in files.items()}:
                raise ValueError('This operation was already archived with different content')
            verify_files(root, receipt)
            if pending.exists():
                journal = json.loads(regular(pending))
                if canonical(journal) != canonical(receipt):
                    raise ValueError('Pending import does not match the completed receipt; preserve both operations')
                pending.unlink()
            complete_image_import(root, work, operation, receipt)
            return {'id': operation['id'], 'status': 'already-archived', 'count': len(operation['posts'])}
        if pending.exists():
            journal = json.loads(regular(pending))
            if journal['id'] != operation['id'] or journal['batchDigest'] != batch_digest(operation) or {item['path']: item['sha256'] for item in journal['files']} != {path: p.digest(content) for path, content in files.items()}:
                raise ValueError('Recover or cancel the original unfinished import before rewriting')
        else:
            journal = {'version': 1, 'id': operation['id'], 'batchDigest': batch_digest(operation),
                       'normalizedBatchDigest': batch_digest(normalized_operation(operation, sources)),
                       'sourceMedia': list(sources.values()), 'files': []}
            for relative, content in files.items():
                target = owned(root, relative)
                if target.exists() and regular(target) != content:
                    raise ValueError('Refusing to overwrite an existing archive: ' + relative)
                journal['files'].append({'path': relative, 'sha256': p.digest(content), 'created': not target.exists()})
            save(pending, journal)
        for relative, content in files.items():
            archive_write(root, relative, content)
        verify_files(root, journal)
        if source(root, operation['id'])['sourceDigest'] != data['sourceDigest']:
            raise ValueError('Source changed during import; preserve pending files and prepare again')
        save(receipt_file, journal)
        pending.unlink()
        complete_image_import(root, work, operation, journal)
        return {'id': operation['id'], 'status': 'archived', 'count': len(operation['posts'])}


def validate(root=ROOT, work=None, now=None, backfill=False):
    root = checked_root(root)
    if (owned(root, '.publishing/update-pending.json')).exists():
        raise ValueError('An unfinished import must be recovered first')
    work = work_folder(root, work)
    with locked(work / '.update.lock'), locked(owned(root, '.publishing/.update.lock')):
        operation = read_operation(root, work) if (work / 'operation.json').exists() else None
        data = source(root, operation['id'] if operation else None)
        if operation:
            validate_update(root, operation, data, clock(now), backfill)
        return {'status': 'valid', 'count': len(operation['posts']) if operation else len(data['history'])}


def feed_values(text):
    text = text.decode() if isinstance(text, bytes) else text
    decoder = json.JSONDecoder()
    values = []
    for name in ['profiles', 'posts']:
        marker = 'export const ' + name + ' = '
        position = text.find(marker)
        if position < 0:
            raise ValueError('Missing G-stream feed export: ' + name)
        value, _ = decoder.raw_decode(text[position + len(marker):].lstrip())
        values.append(value)
    if not isinstance(values[0], dict) or not isinstance(values[1], list):
        raise ValueError('Invalid G-stream feed')
    return values


def fetch_bytes(url):
    with urlopen(Request(url, headers={'User-Agent': 'Umwelt-Gstream-update', 'Cache-Control': 'no-cache'}), timeout=20) as response:
        return response.read()


def asset_identity(url):
    # Deployment stamps only replace the local asset version. Other URL parts
    # still identify real content and must compare exactly.
    if not isinstance(url, str):
        return url
    parts = urlsplit(url)
    if parts.scheme or parts.netloc or not parts.path.startswith('/gsm/'):
        return url
    query = '&'.join(part for part in parts.query.split('&')
                     if part and unquote_plus(part.partition('=')[0]) != 'v')
    return urlunsplit((parts.scheme, parts.netloc, parts.path, query, parts.fragment))


def public_identity(value):
    if isinstance(value, list):
        return [public_identity(item) for item in value]
    if isinstance(value, dict):
        return {key: asset_identity(item) if key in {'src', 'avatarImage'} else public_identity(item)
                for key, item in value.items()}
    return value


def finish(root=ROOT, work=None, now=None, fetch=None):
    root = checked_root(root)
    work = work_folder(root, work)
    with locked(work / '.update.lock'), locked(owned(root, '.publishing/.update.lock')):
        operation = read_operation(root, work)
        if (owned(root, '.publishing/update-pending.json')).exists():
            raise ValueError('Recover the unfinished import before finishing')
        before = canonical(operation)
        reading_file = work / 'reading.md'
        reading_before = regular(reading_file) if reading_file.exists() or reading_file.is_symlink() else None
        def unchanged():
            current_reading = regular(reading_file) if reading_file.exists() or reading_file.is_symlink() else None
            if canonical(read_operation(root, work)) != before or current_reading != reading_before:
                raise ValueError('The operation or reading changed during verification; keep the latest working files')
        if operation['posts']:
            receipt = json.loads(regular(receipt_path(root, operation)))
            if not matching_batch(receipt, operation):
                raise ValueError('Drafts changed after import; preserve the original operation')
            verify_files(root, receipt)
            profiles, local = feed_values(regular(root / 'data/feed.mjs'))
            wanted = {post['id'] for post in operation['posts']}
            selected = {post['id']: post for post in local if post['id'] in wanted}
            if set(selected) != wanted:
                raise ValueError('Local generated feed does not yet contain this update')
            unchanged()
            operation['status'] = 'awaiting-online'
            save(work / 'operation.json', operation)
            before = canonical(operation)
            url = 'https://umwelt.fivsevn.com/gsm/data/feed.mjs?verify=' + operation['id'] + '-' + str(int(clock(now).timestamp()))
            online_profiles, online = feed_values((fetch or fetch_bytes)(url))
            actual = {post['id']: post for post in online if post['id'] in wanted}
            authors = {post['author'] for post in selected.values()}
            if public_identity(actual) != public_identity(selected) or any(public_identity(online_profiles.get(author)) != public_identity(profiles.get(author)) for author in authors):
                raise ValueError('Online content does not match this update; keep its working files')
            media = {block['src'] for post in actual.values() for blocks in post['blocks'].values()
                     for block in blocks if block['type'] == 'image'}
            media.update(online_profiles[author]['avatarImage'] for author in authors)
            for src in sorted(media):
                parts = urlsplit(src)
                if parts.scheme or parts.netloc or not parts.path.startswith('/gsm/'):
                    raise ValueError('Unexpected public image path; keep the working update')
                expected = regular(owned(root, parts.path.removeprefix('/gsm/')))
                query = parts.query + ('&' if parts.query else '') + 'verify=' + p.digest(expected)[:16]
                image_url = 'https://umwelt.fivsevn.com' + urlunsplit(('', '', parts.path, query, ''))
                if (fetch or fetch_bytes)(image_url) != expected:
                    raise ValueError('Online image is missing or differs; keep the working update')
        elif receipt_path(root, operation).exists() or any(p.split(path.read_text())[0].get('operation_id') == operation['id'] for path in post_paths(root)):
            raise ValueError('An archived update cannot be closed as empty')
        unchanged()
        (work / 'reading.md').unlink(missing_ok=True)
        (work / 'operation.json').unlink()
        return {'id': operation['id'], 'status': 'published' if operation['posts'] else 'no-posts', 'count': len(operation['posts'])}


def tracked(root, relative):
    result = subprocess.run(['git', '-C', str(root), 'ls-files', '--error-unmatch', '--', relative], capture_output=True)
    if result.returncode == 0:
        return True
    if result.returncode != 1:
        raise ValueError('Cannot verify unfinished files against Git; preserve them')
    # A removed index entry can still be part of the committed tree.
    repo = Path(subprocess.run(['git', '-C', str(root), 'rev-parse', '--show-toplevel'], capture_output=True, text=True, check=True).stdout.strip())
    full_path = (root / relative).relative_to(repo).as_posix()
    result = subprocess.run(['git', '-C', str(repo), 'ls-tree', '-r', '--name-only', 'HEAD', '--', full_path], capture_output=True, text=True)
    return bool(result.stdout.strip())


def cancel(root=ROOT, work=None, now=None):
    root = checked_root(root)
    work = work_folder(root, work)
    with locked(work / '.update.lock'), locked(owned(root, '.publishing/.update.lock')):
        operation = read_operation(root, work)
        pending = owned(root, '.publishing/update-pending.json')
        if receipt_path(root, operation).exists():
            raise ValueError('This update is already archived; finish publishing or edit its original posts')
        removed = 0
        if pending.exists():
            journal = json.loads(regular(pending))
            if journal['id'] != operation['id']:
                raise ValueError('The unfinished import belongs to another operation')
            removals = []
            for item in journal['files']:
                path = owned(root, item['path'])
                if not item['created']:
                    continue
                if tracked(root, item['path']):
                    raise ValueError('Unfinished archive entered Git; preserve ' + item['path'])
                if not path.exists():
                    continue
                if p.digest(regular(path)) != item['sha256']:
                    raise ValueError('Unfinished archive changed or entered Git; preserve ' + item['path'])
                removals.append(path)
            for path in removals:
                path.unlink()
                removed += 1
            pending.unlink()
        elif any(p.split(path.read_text())[0].get('operation_id') == operation['id'] for path in post_paths(root)):
            raise ValueError('Archived posts exist; finish the original update')
        operation['posts'] = []
        operation['status'] = 'prepared'
        operation['preparedAt'] = iso(clock(now))
        data = source(root, operation['id'])
        operation['sourceDigest'] = data['sourceDigest']
        atomic(work / 'reading.md', reading(operation, data))
        save(work / 'operation.json', operation)
        return {'id': operation['id'], 'status': 'cancelled', 'removedFiles': removed,
                'budget': operation['plan']['budget'], 'selectedIds': operation['plan']['selectedIds'],
                'operationPath': str(work / 'operation.json'), 'readingPath': str(work / 'reading.md')}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['prepare', 'replies', 'suggest', 'ingest', 'validate', 'finish', 'cancel'])
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--work', type=Path)
    parser.add_argument('--count', type=int)
    parser.add_argument('--thread', action='append', default=[])
    parser.add_argument('--reviewed', action='store_true')
    parser.add_argument('--ai', action='store_true', help='Optional explicit marker; this command always enforces AI policy')
    parser.add_argument('--backfill', action='store_true')
    args = parser.parse_args()
    if args.count is not None and args.command != 'prepare' or args.thread and args.command != 'replies' or args.reviewed and args.command != 'ingest' or args.backfill and args.command not in {'ingest', 'validate'}:
        parser.error('Use count for prepare, thread for replies, reviewed for ingest and backfill for ingest/validate')
    options = {'root': args.root, 'work': args.work}
    if args.command == 'prepare':
        options['requested_count'] = args.count
    elif args.command == 'replies':
        options['thread_ids'] = args.thread
    elif args.command in {'ingest', 'validate'}:
        options['backfill'] = args.backfill
        if args.command == 'ingest':
            options['reviewed'] = args.reviewed
    try:
        print(p.json_text(globals()[args.command](**options)), end='')
    except (ValueError, OSError, KeyError, TypeError, json.JSONDecodeError) as error:
        parser.exit(1, f'{error}\n')


if __name__ == '__main__':
    raise SystemExit('Archived GSM v1 recovery library; use ../update.mjs for current updates')
