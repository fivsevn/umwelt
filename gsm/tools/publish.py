"""Trigger -> editable post packages -> static G-stream data. No account service."""
from __future__ import annotations

import argparse
from contextlib import contextmanager
import fcntl
import hashlib
import json
import math
import os
import re
import shutil
import subprocess
import tempfile
import time
from datetime import datetime
from functools import lru_cache
from io import BytesIO
from pathlib import Path
from zoneinfo import ZoneInfo

import yaml
from PIL import Image, ImageColor, ImageOps
from pillow_heif import register_heif_opener

register_heif_opener()
ROOT = Path(__file__).resolve().parents[1]
ZONE = ZoneInfo('Asia/Shanghai')
IMAGE = re.compile(r'!\[([^\]\n]*)\]\(([^)\n]+)\)')
USERNAME = re.compile(r'^[A-Za-z0-9]{1,32}$')
GUEST = re.compile(r'^guest-[a-z0-9][a-z0-9-]{0,57}$')
STATUSES = {'published', 'draft', 'hidden'}
EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    data = data.encode('utf8') if isinstance(data, str) else data
    if path.exists() and path.read_bytes() == data:
        return
    temporary = path.with_name(path.name + '.tmp')
    temporary.write_bytes(data)
    temporary.replace(path)


def json_text(value):
    return json.dumps(value, ensure_ascii=False, indent=2, default=str) + '\n'


def split(text):
    if not text.strip():
        return {}, ''
    if not text.lstrip().startswith('---'):
        return {}, text.strip()
    match = re.match(r'\A---\s*\n(.*?)\n---\s*\n?(.*)\Z', text, re.S)
    if not match:
        raise ValueError('帖子需要开头的 --- 配置区')
    meta = yaml.safe_load(match[1]) or {}
    if not isinstance(meta, dict):
        raise ValueError('配置区必须是字段和值')
    if 'author' in meta or 'createdAt' in meta:
        required = {'id', 'author', 'createdAt', 'replyTo', 'likes', 'canon', 'media'}
        if required - meta.keys() or set(meta) - required - {'guest', 'deleted'}:
            raise ValueError('独立引擎帖子配置字段不完整或含未知字段')
        if not isinstance(meta['media'], list) or meta['canon'] not in {'sample', 'derivative'}:
            raise ValueError('独立引擎帖子媒体或归档类型无效')
        # Render the local engine's packages through the established handheld
        # output contract. The source is preserved byte for byte.
        meta = {**meta, 'username': meta['author'], 'date': meta['createdAt'],
                'name': meta.get('guest', {}).get('name', meta['author']),
                'reply_to': meta['replyTo'], 'status': 'published', '_engine': True}
    return meta, match[2].strip()


def document(meta, body):
    return '---\n' + yaml.safe_dump(meta, allow_unicode=True, sort_keys=False) + '---\n\n' + body.strip() + '\n'


def validate(meta, body, *, require_author=True):
    username = str(meta.get('username') or '').strip()
    guest = meta.get('guest')
    if guest is not None:
        if (not GUEST.fullmatch(username) or not isinstance(guest, dict)
                or not isinstance(guest.get('name'), str) or not guest['name'].strip()
                or len(guest['name']) > 40 or not isinstance(guest.get('bio', ''), str)):
            raise ValueError('临时守宫需要 guest- 编号与 guest.name 网名')
    elif (username or require_author) and not USERNAME.fullmatch(username):
        raise ValueError('username 只能填写 1–32 位英文字母和数字，不含 @、空格或标点')
    if require_author and (not isinstance(meta.get('name'), str) or not meta['name'].strip()):
        raise ValueError('请填写 name（显示昵称）')
    if meta.get('status', 'published') not in STATUSES:
        raise ValueError('status 只能是 published、draft 或 hidden')
    if not body.strip() and not (meta.get('_engine') and meta.get('media')):
        raise ValueError('请在配置区下方填写正文或图片')
    if meta.get('date'):
        date_value(meta['date'])
    initial_likes(meta)
    return username.lower()


def initial_likes(meta):
    likes = meta.get('likes', 0)
    if not isinstance(likes, int) or isinstance(likes, bool) or not 0 <= likes < 2**53 - 1:
        raise ValueError('likes 必须填写非负整数，例如 likes: 24')
    return likes


def date_value(value):
    date = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
    if date.tzinfo is None:
        raise ValueError('date 必须包含时区，例如 2026-10-19T13:00:00+08:00')
    return date.astimezone(ZONE).isoformat(timespec='seconds')


def local_path(base, value):
    # Only owned local media, never remote URLs or paths outside the package.
    if not isinstance(value, str) or '\\' in value or ':' in value or value.startswith('/'):
        raise ValueError(f'图片必须使用相对路径: {value}')
    result = (base / value).resolve()
    if not result.is_relative_to(base.resolve()):
        raise ValueError(f'图片路径不能离开当前目录: {value}')
    return result


def webp(data, *, pixels=None, crop=None):
    with Image.open(BytesIO(data)) as image:
        fmt = image.format
        if fmt not in {'JPEG', 'MPO', 'PNG', 'GIF', 'WEBP', 'HEIF'}:
            raise ValueError(f'不支持的图片格式: {fmt}')
        animated = fmt in {'GIF', 'PNG', 'WEBP'} and getattr(image, 'is_animated', False)
        frames, durations = [], []
        loop = image.info.get('loop')
        start = 1 if image.info.get('default_image') else 0
        for n in range(start, image.n_frames if animated else 1):
            image.seek(n)
            frame = ImageOps.exif_transpose(image).convert('RGBA')
            if pixels:
                frame = frame.crop(tuple(crop)) if crop else ImageOps.fit(frame, (min(frame.size),) * 2)
                frame = frame.resize((int(pixels), int(pixels)), Image.Resampling.BOX)
            frames.append(frame)
            durations.append(image.info.get('duration', 100) or 100)
        if fmt == 'WEBP' and not pixels:
            return data  # Already decoded every frame; do not recompress uploads.
        lossless = bool(pixels)
        options = dict(format='WEBP', lossless=lossless, quality=75 if lossless else 82, method=4 if lossless else 6)
        if animated:
            repeats = (0 if loop == 0 else (loop + 1 if loop is not None else 1)) if fmt == 'GIF' else (loop or 0)
            options.update(save_all=True, append_images=frames[1:], duration=durations, loop=repeats)
        out = BytesIO()
        frames[0].save(out, **options)
        return out.getvalue()


def state_for(root):
    path = root / '.publishing/state.json'
    return json.loads(path.read_text()) if path.exists() else {'version': 1, 'cursor': None, 'last_digest': None}


@contextmanager
def content_lock(root):
    # Python manual imports and the independent JavaScript engine share one
    # publication lock. The engine invokes this renderer while owning it.
    engine_lock = root / '.publish.lock'
    owns_engine_lock = os.environ.get('GSM_ENGINE_LOCK_HELD') != '1'
    if owns_engine_lock:
        try:
            engine_lock.mkdir()
        except FileExistsError as error:
            raise ValueError('内容正在归档或构建，请沿原操作稍后重试') from error
    path = root / '.publishing/.update.lock'
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        if path.is_symlink():
            raise ValueError('内容锁不能是符号链接')
        with path.open('a+b') as stream:
            try:
                fcntl.flock(stream, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError as error:
                raise ValueError('内容正在归档或构建，请沿原操作稍后重试') from error
            try:
                yield
            finally:
                fcntl.flock(stream, fcntl.LOCK_UN)
    finally:
        if owns_engine_lock:
            engine_lock.rmdir()


def users_for(root):
    users = {}
    for path in sorted((root / 'users').glob('*/profile.json')):
        username = path.parent.name
        if not USERNAME.fullmatch(username) or username != username.lower():
            raise ValueError(f'用户目录必须是小写英文数字用户名: {username}')
        profile = json.loads(path.read_text())
        if not isinstance(profile.get('name'), str) or not profile['name'].strip():
            raise ValueError(f'用户缺少昵称: {username}')
        for flag, default in [('random_assignable', False), ('active', True)]:
            if not isinstance(profile.get(flag, default), bool):
                raise ValueError(f'{flag} 必须是 true 或 false: {username}')
        users[username] = profile
    return users


def post_documents(root):
    """The original packages and replies share one content reader."""
    return sorted(path for path in {*(root / 'posts').glob('**/index.md'), *(root / 'posts').glob('**/replies/*.md')}
                  if not path.name.endswith(('.en.md', '.ja.md')))


def read_user_document(path):
    section = re.search(r'^## 账号与开关\s*\n(.*?)(?=^## |\Z)', path.read_text(), re.M | re.S)
    if not section:
        raise ValueError(f'用户档案缺少“账号与开关”: {path}')
    values = {}
    for line in section[1].splitlines():
        if not line.strip().startswith('|'):
            continue
        cells = [part.strip().replace(r'\|', '|').replace('&#124;', '|')
                 for part in re.split(r'(?<!\\)\|', line.strip())[1:-1]]
        if len(cells) != 2:
            raise ValueError(f'账号表应为属性与内容两列: {path}')
        key, value = cells
        if key in {'属性', '项目'} or re.fullmatch(r':?-+:?', key):
            continue
        if key in values:
            raise ValueError(f'重复账号属性 {key}: {path}')
        values[key] = value
    required = {'稳定 ID', '用户名', '网名', '公开简介', '头像原图', '启用账号', '可随机分配',
                'AI 使用范围', '允许发主帖', '允许回复', '抽取权重', '上线时间范围'}
    if required - values.keys():
        raise ValueError(f'用户档案缺少账号属性 {sorted(required - values.keys())}: {path}')
    username = path.parent.name
    if (not USERNAME.fullmatch(username) or username != username.lower()
            or values['稳定 ID'] != username or values['用户名'] != username):
        raise ValueError(f'稳定 ID、用户名与小写英文数字目录应一致: {path}')
    if not values['网名'] or values['AI 使用范围'] not in {'日常', '作者保留'}:
        raise ValueError(f'网名或 AI 使用范围无效: {path}')
    flags = {}
    for label, field in [('启用账号', 'active'), ('可随机分配', 'random_assignable'),
                         ('允许发主帖', 'allow_posts'), ('允许回复', 'allow_replies')]:
        if values[label] not in {'是', '否'}:
            raise ValueError(f'{label} 必须为是或否: {path}')
        flags[field] = values[label] == '是'
    weight = float(values['抽取权重'])
    if not math.isfinite(weight) or not 0 <= weight <= 10:
        raise ValueError(f'抽取权重必须是 0–10: {path}')
    if values['头像原图']:
        local_path(path.parent, values['头像原图'])
    return {'name': values['网名'], 'bio': values['公开简介'], 'avatar_source': values['头像原图'],
            'ai_scope': values['AI 使用范围'], 'weight': weight,
            'active_periods': values['上线时间范围'], **flags}


def sync_users(root):
    documents = sorted((root / 'users').glob('*/profile.md'))
    if not documents:
        # Old authoring checkouts and archived importer fixtures remain readable.
        return sync_legacy_users(root)
    registry = {path.parent.name: read_user_document(path) for path in documents}
    directory_path = root / 'users/README.md'
    text = directory_path.read_text()
    start, end = '<!-- users:start -->', '<!-- users:end -->'
    if text.count(start) != 1 or text.count(end) != 1 or text.index(start) >= text.index(end):
        raise ValueError('用户目录需保留唯一成对的 users:start / users:end 标记')
    used = {str(split(post.read_text())[0].get('username', '')).lower()
            for post in post_documents(root) if split(post.read_text())[0].get('guest') is None}
    missing = (used | set(users_for(root))) - registry.keys()
    if missing:
        raise ValueError('请恢复缺失的独立用户档案: ' + ', '.join(sorted(missing)))
    for path in documents:
        if path.is_symlink() or path.parent.is_symlink():
            raise ValueError('用户档案和目录不能是符号链接')
    for username, fields in registry.items():
        config = root / 'users' / username / 'profile.json'
        profile = json.loads(config.read_text()) if config.exists() else {}
        profile.update(fields)
        write(config, json_text(profile))
    registry = users_for(root)
    sync_user_avatars(root, registry)
    accounts = [{'id': username, 'enabled': profile['active'], 'aiScope': profile['ai_scope'],
                 'allowPosts': profile['allow_posts'], 'allowReplies': profile['allow_replies'],
                 'activityWeight': profile['weight'], 'activeHours': profile['active_periods']}
                for username, profile in registry.items()]
    write(root / 'accounts.json', json_text({'version': 1, 'users': accounts}))
    groups = []
    for scope, label in [('日常', '日常守宫'), ('作者保留', '其他守宫')]:
        group = [(username, p) for username, p in registry.items() if p['ai_scope'] == scope]
        links = '，'.join('[' + p['name'].replace('\\', '\\\\').replace('[', '\\[').replace(']', '\\]')
                         + f'](./{username}/profile.md)' for username, p in group)
        title = f'{label}：{len(group)}只'
        groups.append(f'### {title}\n\n{links}')
    listing = f'\n\n## 用户总目录\n\n合计：{len(registry)}个账号。\n\n' + '\n\n'.join(groups) + '\n\n'
    write(directory_path, text.split(start)[0] + start + listing + end + text.split(end)[1])
    return registry


def sync_legacy_users(root):
    path = root / 'users/README.md'
    if not path.exists():
        raise ValueError('缺少 users/README.md 用户管理表')
    text = path.read_text()
    start, end = '<!-- users:start -->', '<!-- users:end -->'
    if text.count(start) != 1 or text.count(end) != 1 or text.index(start) >= text.index(end):
        raise ValueError('用户表需要保留唯一且成对的 users:start / users:end 注释标记')
    section = text.split(start, 1)[1].split(end, 1)[0]
    users = {}
    for line in section.splitlines():
        line = line.strip()
        if not line:
            continue
        if not line.startswith('|') or not line.endswith('|'):
            raise ValueError('用户表每行需保留开头和结尾的 | 分隔符')
        cells = [part.strip().replace(r'\|', '|') for part in re.split(r'(?<!\\)\|', line)[1:-1]]
        if cells and (cells[:2] == ['username', '昵称'] or re.fullmatch(r':?-+:?', cells[0])):
            continue
        if len(cells) not in {5, 6}:
            raise ValueError('用户表每行需填写六列：username、昵称、启用、可随机分配、头像原图、个性签名（旧五列仍可读取）')
        username, name, active, random, avatar = cells[:5]
        bio = cells[5] if len(cells) == 6 else ''
        if not USERNAME.fullmatch(username) or username != username.lower() or username in users:
            raise ValueError(f'用户表 username 必须唯一，且只含小写英文和数字：{username}')
        if not name or active not in {'是', '否'} or random not in {'是', '否'}:
            raise ValueError(f'请填写 {username} 的昵称和两个“是/否”开关')
        if avatar:
            local_path(root / 'users' / username, avatar)
        users[username] = {'name': name, 'active': active == '是', 'random_assignable': random == '是', 'avatar_source': avatar, 'bio': bio}
    used = {str(split(post.read_text())[0].get('username', '')).lower() for post in (root / 'posts').glob('**/index.md')}
    missing = used - set(users)
    if missing:
        raise ValueError('历史帖子仍引用 ' + ', '.join('@' + u for u in sorted(missing)) + '；请恢复用户表中的行，退出使用可将“启用”改为“否”')
    # Validate everything before changing any managed folders.
    for username, fields in users.items():
        folder = root / 'users' / username
        if folder.is_symlink():
            raise ValueError('用户目录不能是符号链接')
        config = folder / 'profile.json'
        profile = json.loads(config.read_text()) if config.exists() else {}
        profile.update(fields)
        write(config, json_text(profile))
    for folder in (root / 'users').iterdir():
        if folder.is_dir() and not folder.is_symlink() and folder.name not in users and (folder / 'profile.json').is_file():
            shutil.rmtree(folder)
    registry = users_for(root)
    sync_user_avatars(root, registry)
    return registry


def assign_author(root, meta, seed):
    users = users_for(root)
    username = str(meta.get('username') or '').strip().lower()
    if username in users:
        if not users[username].get('active', True):
            raise ValueError(f'用户 {username} 已停用；恢复 active 后才能发新帖')
        return username, users[username]['name'], 'specified'
    pool = sorted(name for name, profile in users.items() if profile.get('active', True) and profile.get('random_assignable', False))
    if not pool:
        raise ValueError('没有可随机分配的用户，请指定已注册 username，或开启某个用户的 random_assignable')
    username = pool[int(digest(seed.encode()), 16) % len(pool)]
    return username, users[username]['name'], 'random'


def input_digest(meta, body):
    fields = dict(meta)
    if initial_likes(meta) == 0:
        fields.pop('likes', None)
    return digest(json_text({'meta': fields, 'body': body}).encode())


def import_trigger(root, text, read_media, event_date, event, state, *, remember=True, trigger_digest=None):
    root = root.resolve()
    meta, body = split(text)
    validate(meta, body, require_author=False)
    media = {match[1]: read_media(match[1]) for match in IMAGE.findall(body)}
    dedup_meta = dict(meta)
    # Adding the optional zero default to an older trigger is not a new post.
    if initial_likes(meta) == 0:
        dedup_meta.pop('likes', None)
    canonical = json_text({'meta': dedup_meta, 'body': body, 'media': {k: digest(v) for k, v in media.items()}})
    fingerprint = digest(canonical.encode())
    if remember and fingerprint == state.get('last_digest'):
        return None
    date = date_value(meta.get('date') or event_date)
    ident = datetime.fromisoformat(date).strftime('%Y%m%d-%H%M%S') + '-' + digest(event.encode())[:10]
    folder = root / 'posts' / date[:4] / date[5:7] / ident
    # A local preview retry can happen at a later wall-clock time after a partial failure.
    for previous in (root / 'posts').glob('**/index.md'):
        if split(previous.read_text())[0].get('source_event') == event:
            folder = previous.parent
            break
    converted = {name: webp(data) for name, data in media.items()}
    names = {name: f'assets/{i:02d}-{digest(data)[:12]}.webp' for i, (name, data) in enumerate(converted.items(), 1)}
    archived_body = IMAGE.sub(lambda m: f'![{m[1]}]({names[m[2]]})', body)
    if folder.exists():
        # A retry after a partial import must not overwrite a later manual edit.
        old, _ = split((folder / 'index.md').read_text())
        if old.get('source_event') != event:
            raise ValueError(f'帖子编号冲突: {ident}')
    else:
        username, name, assignment = assign_author(root, meta, event + ':' + fingerprint)
        package = {'id': ident, 'date': date, 'username': username, 'name': name,
                   'status': meta.get('status', 'published'), 'likes': initial_likes(meta),
                   'source_event': event, 'author_assignment': assignment}
        uploads = [{'path': name, 'sha256': digest(media[name]), 'file': names[name],
                    'file_sha256': digest(converted[name])} for name in media if name.startswith('uploads/')]
        if trigger_digest:
            package['trigger_sha256'] = trigger_digest
        if uploads:
            package['uploads'] = uploads
        folder.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(dir=folder.parent, prefix='.import-') as temp:
            staging = Path(temp) / ident
            for original, data in converted.items():
                write(staging / names[original], data)
            write(staging / 'index.md', document(package, archived_body))
            staging.rename(folder)
    if remember:
        state['last_digest'] = fingerprint
    return folder


def git(repo, *args):
    return subprocess.check_output(['git', *args], cwd=repo)


def commit_caption(message):
    subject, _, description = message.partition('\n')
    if description.strip():
        return split(description.strip())
    # GitHub/Working Copy default upload messages are bookkeeping, not captions.
    if re.match(r'^(?:add files via upload|upload(?:ed)? (?:files?|images?|photos?)|(?:create|update|delete) .+\.(?:md|jpe?g|png|webp|gif|heic|heif))\.?$', subject.strip(), re.I):
        return {}, ''
    return {}, subject.strip()


def process_inputs(root, text, trigger_changed, uploads, removed, read_media, date, event, state, caption=({}, ''), superseded=frozenset()):
    created, consumed = [], set()
    known = state.setdefault('upload_digests', {})
    for path in removed:
        known.pop(path, None)
    media = {path: read_media(path) for path in uploads}
    invalid = set()
    for path in set(uploads) & superseded:
        try:
            webp(media[path])
        except (ValueError, OSError):
            invalid.add(path)
            print(f'跳过已被替换或删除的损坏图片: {path}', flush=True)
    uploads = [path for path in uploads if path not in invalid]
    uploads = [path for path in uploads if known.get(path) != digest(media[path])]
    meta, body = split(text) if trigger_changed else ({}, '')
    changed = trigger_changed and input_digest(meta, body) != state.get('last_trigger_input')
    if invalid & {path for _, path in IMAGE.findall(body)}:
        body = ''  # Keep the malformed historical input in Git; do not publish it.
    if changed and body:
        # A text+upload submission without explicit placement is one combined post.
        if uploads and not IMAGE.search(body):
            body += '\n\n' + '\n\n'.join(f'![]({path})' for path in uploads)
        folder = import_trigger(root, document(meta, body), read_media, date, event, state,
                                trigger_digest=input_digest(*split(text)))
        consumed = {path for _, path in IMAGE.findall(body)}
        if folder:
            created.append(folder)
    for path in uploads:
        if path in consumed:
            known[path] = digest(media[path])
            continue
        image_meta = dict(meta) if changed and not body else {}
        image_meta.update(caption[0])
        image_body = f'![]({path})'
        if caption[1]:
            image_body += '\n\n' + caption[1]
        folder = import_trigger(root, document(image_meta, image_body), read_media, date,
                                event + ':image:' + path, state, remember=False)
        created.append(folder)
        known[path] = digest(media[path])
    if trigger_changed:
        original_meta, original_body = split(text)
        state['last_trigger_input'] = input_digest(original_meta, original_body)
    return created


def ingest(root, mode):
    with content_lock(root):
        return _ingest_unlocked(root, mode)


def _ingest_unlocked(root, mode):
    root = root.resolve()
    sync_users(root)
    state = state_for(root)
    created = []
    if mode == 'git':
        repo = root.parent
        cursor = state.get('cursor')
        if not cursor:
            raise ValueError('缺少导入起点 cursor；请先初始化，避免重新导入整个历史')
        subprocess.run(['git', 'merge-base', '--is-ancestor', cursor, 'HEAD'], cwd=repo, check=True)
        commits = git(repo, 'log', '--first-parent', '--reverse', '--format=%H', f'{cursor}..HEAD', '--', 'gsm/trigger.md', 'gsm/uploads').decode().split()
        snapshots = []
        last_change = {}
        for index, commit in enumerate(commits):
            paths = git(repo, 'diff', '--name-status', '--no-renames', '-z', commit + '^', commit).decode().strip('\0').split('\0')
            changed = dict(zip(paths[1::2], paths[::2]))
            snapshots.append((commit, changed))
            last_change.update({path: index for path in changed})
        for index, (commit, changed) in enumerate(snapshots):
            # A deletion/cleanup does not replay the last trigger or republish images.
            superseded = {path.removeprefix('gsm/') for path in changed if last_change[path] > index}
            trigger_changed = changed.get('gsm/trigger.md') in {'A', 'M'}
            text = git(repo, 'show', f'{commit}:gsm/trigger.md').decode() if trigger_changed else ''
            uploads, removed = [], []
            for path, status in changed.items():
                if not path.startswith('gsm/uploads/'):
                    continue
                relative = path.removeprefix('gsm/')
                if status == 'D':
                    removed.append(relative)
                elif Path(path).name not in {'README.md', '.gitkeep', '.keep'}:
                    if Path(path).suffix.lower() not in EXTENSIONS:
                        if relative in superseded:
                            continue
                        raise ValueError(f'不支持的上传文件: {path}')
                    uploads.append(relative)
            def read_media(value):
                relative = local_path(root, value).relative_to(root).as_posix()
                return git(repo, 'show', f'{commit}:gsm/{relative}')
            date = git(repo, 'show', '-s', '--format=%cI', commit).decode().strip()
            caption = commit_caption(git(repo, 'show', '-s', '--format=%B', commit).decode())
            created += process_inputs(root, text, trigger_changed, sorted(uploads), removed,
                                      read_media, date, commit, state, caption, superseded)
        state['cursor'] = git(repo, 'rev-parse', 'HEAD').decode().strip()
    else:
        date = datetime.now(ZONE).isoformat(timespec='seconds')
        text = (root / 'trigger.md').read_text() if (root / 'trigger.md').exists() else ''
        uploads = sorted(path.relative_to(root).as_posix() for path in (root / 'uploads').rglob('*')
                         if path.is_file() and path.suffix.lower() in EXTENSIONS)
        read_media = lambda value: local_path(root, value).read_bytes()
        removed = set(state.get('upload_digests', {})) - set(uploads)
        fingerprint = json_text({'trigger': input_digest(*split(text)), 'uploads': {path: digest(read_media(path)) for path in uploads}})
        created += process_inputs(root, text, True, uploads, removed, read_media, date,
                                  'local:' + digest(fingerprint.encode()), state)
    write(root / '.publishing/state.json', json_text(state))
    return created


@lru_cache(maxsize=1)
def brand_master():
    """The runtime mark and avatar generator share one checked-in pixel master."""
    source = (ROOT / 'brand.mjs').read_text()
    brand = json.loads(source.split('export const brand = ', 1)[1].strip().removesuffix(';'))
    variants = brand['avatarVariants']
    if len(variants) != 6 or len({variant['id'] for variant in variants}) != 6:
        raise ValueError('默认头像母版需要六种稳定变化')
    for variant in variants:
        if len(variant['rows']) != 16 or any(len(row) != 16 or set(row) - set('.#') for row in variant['rows']):
            raise ValueError('默认头像母版必须为 16 × 16 整数像素')
    return brand


def avatar_variant(username):
    # Stable username selection, independent of registry or posting order.
    value = 0
    for character in username:
        value = (value * 31 + ord(character)) & 0xffffffff
    variants = brand_master()['avatarVariants']
    return variants[value % len(variants)]


def generated_avatar(username):
    """One-color flat-head mark; eyes and small poses distinguish six variants."""
    brand = brand_master()
    rows = avatar_variant(username)['rows']
    image = Image.new('RGBA', (16, 16))
    image.putdata([(*ImageColor.getrgb(brand['ink']), 255) if cell == '#' else (0, 0, 0, 0) for row in rows for cell in row])
    out = BytesIO()
    image.save(out, format='WEBP', lossless=True, exact=True)
    return out.getvalue()


def generated_avatar_record(username, data):
    return {'kind': 'generated', 'generator': brand_master()['version'],
            'variant': avatar_variant(username)['id'], 'sha256': digest(data)}


def migrate_default_avatars(root):
    """Explicit, idempotent migration; a blank source never identifies a default."""
    updates = []
    for username, profile in users_for(root).items():
        previous = profile.get('avatar', {})
        if previous.get('kind') != 'generated':
            continue
        if profile.get('avatar_source'):
            raise ValueError(f'@{username} 有待同步的自定义头像；请先同步用户表')
        target = root / 'assets/avatars' / (username + '.webp')
        existing = target.read_bytes() if target.exists() else None
        if (previous.get('generator') == brand_master()['version']
                and previous.get('variant') == avatar_variant(username)['id']
                and existing is not None and previous.get('sha256') == digest(existing)):
            continue
        data = generated_avatar(username)
        profile['avatar'] = generated_avatar_record(username, data)
        updates.append((username, profile, target, data))
    for username, profile, target, data in updates:
        write(target, data)
        write(root / 'users' / username / 'profile.json', json_text(profile))
    return [username for username, _, _, _ in updates]


def sync_user_avatars(root, registry):
    """Assign every registered user an avatar, independently of their posts."""
    for username, profile in registry.items():
        target = root / 'assets/avatars' / (username + '.webp')
        previous = profile.get('avatar', {})
        existing = target.read_bytes() if target.exists() else None
        if profile.get('avatar_source'):
            original = local_path(root / 'users' / username, profile['avatar_source'])
            source = original.read_bytes()
            fingerprint = digest(json_text({'source': digest(source), 'pixels': profile.get('avatar_pixels'),
                                           'crop': profile.get('avatar_crop')}).encode())
            if existing is not None and previous.get('source_fingerprint') == fingerprint and previous.get('sha256') == digest(existing):
                continue
            data = webp(source, pixels=profile.get('avatar_pixels'), crop=profile.get('avatar_crop'))
            assigned = {'kind': 'custom', 'source_fingerprint': fingerprint, 'sha256': digest(data)}
        elif existing is not None:
            # Blank means keep the assigned face, including a previous custom portrait.
            # A nickname, flag or generator-code change must never redraw an existing user.
            if previous.get('sha256') == digest(existing):
                continue
            with Image.open(BytesIO(existing)) as check:
                if check.format != 'WEBP':
                    raise ValueError(f'用户 {username} 的现有头像不是有效 WebP')
                check.verify()
            data = existing
            assigned = {'kind': previous.get('kind', 'generated'), 'sha256': digest(data)}
        else:
            data = generated_avatar(username)
            assigned = generated_avatar_record(username, data)
        write(target, data)
        profile['avatar'] = assigned
        write(root / 'users' / username / 'profile.json', json_text(profile))
    guest_handles = {str(split(path.read_text())[0].get('username', '')) for path in post_documents(root)
                     if split(path.read_text())[0].get('guest') is not None}
    for old in (root / 'assets/avatars').glob('*.webp'):
        if old.stem not in registry and old.stem not in guest_handles:
            old.unlink()


def blocks_for(root, folder, body, public, *, package_root=None, replacements=None):
    blocks, position = [], 0
    for match in IMAGE.finditer(body):
        if body[position:match.start()].strip():
            blocks.append({'type': 'text', 'text': body[position:match.start()].strip()})
        if package_root is None:
            original = local_path(folder, match[2])
        else:
            value = match[2]
            if '\\' in value or ':' in value or value.startswith('/'):
                raise ValueError(f'图片必须使用根串内相对路径: {value}')
            original = (folder / value).resolve()
            if not original.is_relative_to(package_root.resolve()):
                raise ValueError(f'回复图片不能离开所属根串: {value}')
        source_bytes = original.read_bytes()
        converted = webp(source_bytes)
        target = original if original.suffix.lower() == '.webp' else original.with_name(original.stem + '-' + digest(converted)[:12] + '.webp')
        write(target, converted)
        if replacements is not None and target != original:
            replacements[original] = {'target': target, 'sha256': digest(source_bytes), 'target_sha256': digest(converted)}
        relative = target.relative_to(root).as_posix()
        public.add('gsm/' + relative)
        with Image.open(BytesIO(converted)) as image:
            blocks.append({'type': 'image', 'src': '/gsm/' + relative, 'alt': match[1], 'width': image.width, 'height': image.height})
        position = match.end()
    if body[position:].strip():
        blocks.append({'type': 'text', 'text': body[position:].strip()})
    return blocks


def referenced_post_images(root):
    references = set()
    for path in (root / 'posts').rglob('*.md'):
        for _, value in IMAGE.findall(path.read_text()):
            references.add((path.parent / value).resolve())
        if re.search(r'^author:', path.read_text(), re.M):
            meta, _ = split(path.read_text())
            for media in meta.get('media', []):
                references.add(local_path(root, media['src']))
    return references


def engine_blocks_for(root, package_root, meta, body, public):
    """Project canonical engine media into unchanged GSM image/text blocks."""
    blocks = [{'type': 'text', 'text': body}] if body else []
    catalog_path = root / 'assets/emotes/gsm/manifest.json'
    catalog = json.loads(catalog_path.read_text()) if catalog_path.exists() else {'items': []}
    emotes = {item['src'] for item in catalog['items']}
    for media in meta['media']:
        if not isinstance(media, dict) or set(media) - {'src', 'alt', 'fit', 'kind'}:
            raise ValueError('独立引擎媒体字段无效')
        value = media.get('src')
        target = local_path(root, value)
        if target.suffix != '.webp' or (value not in emotes and not target.is_relative_to(package_root.resolve() / 'media')):
            raise ValueError('独立引擎媒体需先转换为所属根串 WebP 或已登记本站表情')
        current = root
        for part in Path(value).parts:
            current /= part
            if current.is_symlink():
                raise ValueError('独立引擎媒体路径不能包含符号链接')
        if not isinstance(media.get('alt'), str) or not media['alt'].strip():
            raise ValueError('独立引擎媒体需要文字说明')
        with Image.open(target) as image:
            if image.format != 'WEBP':
                raise ValueError('独立引擎媒体不是 WebP')
            image.load()
            blocks.append({'type': 'image', 'src': '/gsm/' + value, 'alt': media['alt'],
                           'width': image.width, 'height': image.height})
        public.add('gsm/' + value)
    return blocks


def clean_image_sources(root, sources):
    """Remove converted inputs only after every source document points at WebP."""
    references = referenced_post_images(root)
    for original, item in sources.items():
        target = item['target']
        if (original != target and original not in references and original.is_file()
                and not original.is_symlink() and target.is_file()
                and digest(original.read_bytes()) == item['sha256']
                and (not item.get('target_sha256') or digest(target.read_bytes()) == item['target_sha256'])):
            original.unlink()


def rewrite_image_links(text, folder, replacements):
    def replace(match):
        item = replacements.get((folder / match[2]).resolve())
        if not item:
            return match[0]
        relative = Path(os.path.relpath(item['target'], folder)).as_posix()
        return f'![{match[1]}]({relative})'
    return IMAGE.sub(replace, text)


def refresh_archive_receipts(root, changed_paths, renamed=None, owned_hashes=None):
    """Receipts keep hashes and paths, never another copy of the post body."""
    renamed = renamed or {}
    for path in (root / '.publishing/operations').glob('*.json'):
        receipt = json.loads(path.read_text())
        if 'files' not in receipt:
            continue
        changed = False
        for item in receipt['files']:
            previous = item['path']
            relative = renamed.get(previous, previous)
            if relative in changed_paths or relative != previous:
                if owned_hashes is not None and item['sha256'] not in set(owned_hashes[relative].values()):
                    continue
                item['path'] = relative
                item['sha256'] = digest(local_path(root, relative).read_bytes())
                changed = True
        if changed:
            write(path, json_text(receipt))


def build(root):
    with content_lock(root):
        return _build_unlocked(root)


def _build_unlocked(root):
    root = root.resolve()
    if (root / '.publishing/update-pending.json').exists() or (root / '.publish-pending.json').exists():
        raise ValueError('AI 批次尚未完成归档；请用原操作恢复导入后再构建')
    posts, profiles, public, ids = [], {}, set(), set()
    registry = sync_users(root)
    characters = dict(registry)
    # A canonical reply may sit in an older root package than the guest's first
    # native post. Resolve native biographies before walking package order.
    native_guests = {}
    for path in post_documents(root):
        meta, _ = split(path.read_text())
        if meta.get('_engine') or not meta.get('guest') or meta.get('status', 'published') != 'published':
            continue
        guest = {'name': meta['guest']['name'], 'bio': meta['guest'].get('bio', '')}
        username = str(meta['username']).lower()
        if username in native_guests and native_guests[username] != guest:
            raise ValueError(f'临时守宫身份不一致: {username}')
        native_guests[username] = guest
    def add_profile(username):
        character = characters[username]
        portrait = root / 'assets/avatars' / (username + '.webp')
        public.add('gsm/' + portrait.relative_to(root).as_posix())
        tone = character.get('color') or ['sage', 'sand', 'rose'][hashlib.sha256(username.encode()).digest()[1] % 3]
        if tone not in {'sage', 'sand', 'rose', 'isopoda'}:
            raise ValueError(f'@{username} 的 color 只能是 sage、sand、rose 或 isopoda')
        profiles[username] = {'handle': username, 'name': character['name'], 'bio': character.get('bio', ''),
                              'avatarImage': '/gsm/assets/avatars/' + username + '.webp?v=' + character['avatar']['sha256'][:12], 'color': tone}
    packages = []
    for path in post_documents(root):
        meta, body = split(path.read_text())
        username = validate(meta, body)
        guest = meta.get('guest')
        if meta.get('_engine') and guest is not None and username in native_guests:
            native = native_guests[username]
            if guest['name'] != native['name']:
                raise ValueError(f'临时守宫身份不一致: {username}')
            guest = {**guest, 'bio': native['bio']}
        if username not in registry and guest is None:
            raise ValueError(f'历史帖子仍引用 @{username}，请恢复 users/{username}/profile.json；退出使用可设置 active: false')
        if meta.get('status', 'published') != 'published':
            continue
        ident = meta.get('id')
        if not isinstance(ident, str) or not re.fullmatch(r'[A-Za-z0-9-]+', ident) or ident in ids:
            raise ValueError(f'帖子 id 必须唯一且只含英文数字和连字符: {path}')
        ids.add(ident)
        date = date_value(meta['date'])
        if meta.get('_engine'):
            # New engine operations may carry millisecond timestamps. Preserve
            # those instants in the handheld projection as well as the archive.
            instant = datetime.fromisoformat(str(meta['date']).replace('Z', '+00:00')).astimezone(ZONE)
            date = instant.isoformat(timespec='milliseconds' if instant.microsecond else 'seconds')
        if guest is not None:
            previous = characters.get(username)
            if previous and (previous['name'] != guest['name'] or previous.get('bio', '') != guest.get('bio', '')):
                raise ValueError(f'临时守宫身份不一致: {username}')
            avatar = generated_avatar(username)
            write(root / 'assets/avatars' / (username + '.webp'), avatar)
            characters[username] = {'name': guest['name'], 'bio': guest.get('bio', ''),
                                    'avatar': {'sha256': digest(avatar)}}
        packages.append((date, ident, username, meta, body, path))
    by_id = {package[1]: package for package in packages}
    for date, ident, username, meta, body, path in packages:
        current, seen = ident, set()
        while by_id[current][3].get('reply_to'):
            if current in seen:
                raise ValueError(f'回复形成循环: {ident}')
            seen.add(current)
            parent = by_id[current][3]['reply_to']
            if parent not in by_id or by_id[current][0] < by_id[parent][0]:
                raise ValueError(f'回复父帖缺失或时间早于父帖: {ident}')
            current = parent
        if path.parent.name == 'replies' and path.parent.parent != by_id[current][-1].parent:
            raise ValueError(f'回复必须归档在原根串: {ident}')
    normalization_path = root / '.publishing/image-normalization.json'
    journal = json.loads(normalization_path.read_text()) if normalization_path.exists() else {'sources': [], 'documents': {}}
    replacements = {local_path(root, item['path']):
                    {'target': local_path(root, item['target']), 'sha256': item['sha256'], 'target_sha256': item['target_sha256']}
                    for item in journal['sources']}
    documents = {}
    for date, ident, username, meta, body, path in sorted(packages, reverse=True):
        if username not in profiles:
            add_profile(username)
        likes = initial_likes(meta)
        folder = path.parent
        package_root = folder.parent if folder.name == 'replies' else folder
        localized = {'zh': engine_blocks_for(root, package_root, meta, body, public) if meta.get('_engine') else
                     blocks_for(root, folder, body, public, package_root=package_root, replacements=replacements)}
        documents[path] = path.read_text()
        for lang in ('en', 'ja'):
            translation = path.with_name(path.stem + f'.{lang}.md')
            localized[lang] = blocks_for(root, folder, translation.read_text().strip(), public, package_root=package_root, replacements=replacements) if translation.exists() else localized['zh']
            if translation.exists():
                documents[translation] = translation.read_text()
        item = {'id': ident, 'date': date, 'createdAt': int(datetime.fromisoformat(date).timestamp()*1000),
                'author': username, 'likes': likes, 'blocks': localized}
        if meta.get('reply_to'):
            item['replyTo'] = meta['reply_to']
        posts.append(item)
    for username in registry:
        if username not in profiles:
            add_profile(username)
    source = '// Generated from gsm/posts and gsm/users; edit those sources, not this file.\n'
    source += 'export const profiles = ' + json_text(profiles).rstrip() + ';\n'
    source += 'export const posts = ' + json_text(posts).rstrip() + ';\n'
    rewrites = {}
    for path, original in documents.items():
        relative = path.relative_to(root).as_posix()
        rewritten = rewrite_image_links(original, path.parent, replacements)
        hashes = {'before': digest(original.encode()), 'after': digest(rewritten.encode())}
        saved = journal['documents'].get(relative)
        if saved and (hashes['before'] not in set(saved.values()) or hashes['after'] != saved['after']):
            raise ValueError('图片转换期间帖子有手工变化，保留转换记录: ' + relative)
        if rewritten != original:
            rewrites[path] = rewritten
            journal['documents'].setdefault(relative, hashes)
    for original, item in replacements.items():
        if original.exists() and digest(original.read_bytes()) != item['sha256']:
            raise ValueError('图片转换期间原图已变化，保留最新原图: ' + str(original))
    journal['sources'] = [{'path': original.relative_to(root).as_posix(),
                           'target': item['target'].relative_to(root).as_posix(),
                           'sha256': item['sha256'], 'target_sha256': item['target_sha256']}
                          for original, item in replacements.items()]
    if journal['sources']:
        write(normalization_path, json_text(journal))
    for path, rewritten in rewrites.items():
        write(path, rewritten)
    refresh_archive_receipts(root, set(journal['documents']), owned_hashes=journal['documents'])
    write(root / 'data/feed.mjs', source)
    write(root / '.publishing/public.json', json_text(sorted(public)))
    clean_image_sources(root, replacements)
    normalization_path.unlink(missing_ok=True)
    return posts


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['publish', 'ingest', 'build', 'watch', 'migrate-default-avatars'])
    parser.add_argument('--root', type=Path, default=ROOT)
    args = parser.parse_args()
    while True:
        try:
            if args.command == 'migrate-default-avatars':
                sync_users(args.root)
                migrated = migrate_default_avatars(args.root)
                print(f'已迁移 {len(migrated)} 个默认头像', flush=True)
            if args.command in {'publish', 'watch', 'ingest'}:
                folders = ingest(args.root, 'git' if args.command == 'ingest' else 'local')
                for folder in folders:
                    print(f'已归档: {folder}', flush=True)
            posts = build(args.root)
            if args.command != 'watch':
                print(f'已生成 {len(posts)} 条公开帖子', flush=True)
        except Exception as error:
            if args.command != 'watch':
                raise
            print(f'暂未导入: {error}', flush=True)
        if args.command != 'watch':
            break
        time.sleep(2)


if __name__ == '__main__':
    main()
