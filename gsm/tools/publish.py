"""Trigger -> editable post packages -> static G-stream data. No account service."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import tempfile
import time
from datetime import datetime
from io import BytesIO
from pathlib import Path
from zoneinfo import ZoneInfo

import yaml
from PIL import Image, ImageDraw, ImageOps
from pillow_heif import register_heif_opener

register_heif_opener()
ROOT = Path(__file__).resolve().parents[1]
ZONE = ZoneInfo('Asia/Shanghai')
IMAGE = re.compile(r'!\[([^\]\n]*)\]\(([^)\n]+)\)')
USERNAME = re.compile(r'^[A-Za-z0-9]{1,32}$')
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
    return meta, match[2].strip()


def document(meta, body):
    return '---\n' + yaml.safe_dump(meta, allow_unicode=True, sort_keys=False) + '---\n\n' + body.strip() + '\n'


def validate(meta, body, *, require_author=True):
    username = str(meta.get('username') or '').strip()
    if (username or require_author) and not USERNAME.fullmatch(username):
        raise ValueError('username 只能填写 1–32 位英文字母和数字，不含 @、空格或标点')
    if require_author and (not isinstance(meta.get('name'), str) or not meta['name'].strip()):
        raise ValueError('请填写 name（显示昵称）')
    if meta.get('status', 'published') not in STATUSES:
        raise ValueError('status 只能是 published、draft 或 hidden')
    if not body.strip():
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
        lossless = bool(pixels) or fmt in {'PNG', 'GIF', 'WEBP'}
        options = dict(format='WEBP', lossless=lossless, quality=75 if lossless else 85, method=4)
        if animated:
            repeats = (0 if loop == 0 else (loop + 1 if loop is not None else 1)) if fmt == 'GIF' else (loop or 0)
            options.update(save_all=True, append_images=frames[1:], duration=durations, loop=repeats)
        out = BytesIO()
        frames[0].save(out, **options)
        return out.getvalue()


def state_for(root):
    path = root / '.publishing/state.json'
    return json.loads(path.read_text()) if path.exists() else {'version': 1, 'cursor': None, 'last_digest': None}


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


def sync_users(root):
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
        if len(cells) != 5:
            raise ValueError('用户表每行需填写五列：username、昵称、启用、可随机分配、头像原图')
        username, name, active, random, avatar = cells
        if not USERNAME.fullmatch(username) or username != username.lower() or username in users:
            raise ValueError(f'用户表 username 必须唯一，且只含小写英文和数字：{username}')
        if not name or active not in {'是', '否'} or random not in {'是', '否'}:
            raise ValueError(f'请填写 {username} 的昵称和两个“是/否”开关')
        if avatar:
            local_path(root / 'users' / username, avatar)
        users[username] = {'name': name, 'active': active == '是', 'random_assignable': random == '是', 'avatar_source': avatar}
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


def import_trigger(root, text, read_media, event_date, event, state, *, remember=True):
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
        folder = import_trigger(root, document(meta, body), read_media, date, event, state)
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


def generated_avatar(username):
    """Stable integer-grid gecko portrait; the username is the only random seed."""
    seed = hashlib.sha256(username.encode()).digest()
    palettes = [('#e8d49d', '#ad945b', '#f6ecd6'), ('#b9cb9b', '#6f8b70', '#f2edcb'),
                ('#dfb7a4', '#a77a71', '#fff0d5'), ('#bcb3ce', '#827793', '#f0e4d3')]
    skin, shade, light = palettes[seed[0] % len(palettes)]
    ink = '#3d514a'
    image = Image.new('RGBA', (32, 32), ['#c8d6ad', '#e9bdb8', '#c9d9cc'][seed[1] % 3])
    draw = ImageDraw.Draw(image)
    # Raised brow, long snout, pale jaw and slit pupil in a 24 px portrait.
    draw.polygon([(13,5),(21,5),(21,7),(24,7),(24,10),(26,10),(26,22),(24,22),(24,26),(17,26),(17,24),(13,24),(13,22),(9,22),(9,20),(5,20),(5,18),(3,18),(3,13),(5,13),(5,11),(8,11),(8,9),(11,9),(11,7),(13,7)], fill=ink)
    draw.polygon([(14,6),(20,6),(20,8),(23,8),(23,11),(25,11),(25,21),(23,21),(23,25),(18,25),(18,23),(14,23),(14,21),(10,21),(10,19),(6,19),(6,17),(4,17),(4,14),(6,14),(6,12),(9,12),(9,10),(12,10),(12,8),(14,8)], fill=skin)
    draw.rectangle((22,12,24,21), fill=shade)
    draw.polygon([(5,17),(9,18),(14,19),(20,18),(23,19),(22,23),(18,24),(14,22),(10,20),(6,19)], fill=light)
    draw.line([(6,16),(9,17),(15,18),(21,17)], fill=shade, width=1)
    draw.rectangle((15,9,21,16), fill=shade)
    draw.rectangle((16,9,20,15), fill=light)
    draw.rectangle((18,10,19,14), fill=ink)
    draw.point((16,10), fill='#ffffff')
    draw.point((6,14), fill=ink)
    for i, (x,y) in enumerate([(11,11),(14,8),(19,7),(10,15),(22,9),(20,22)]):
        if seed[3+i] % 3:
            draw.rectangle((x,y,x+seed[3+i]%2,y), fill=shade)
    if seed[12] % 2:
        image = image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    out = BytesIO()
    image.save(out, format='WEBP', lossless=True)
    return out.getvalue()


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
            assigned = {'kind': 'generated', 'sha256': digest(data)}
        write(target, data)
        profile['avatar'] = assigned
        write(root / 'users' / username / 'profile.json', json_text(profile))
    for old in (root / 'assets/avatars').glob('*.webp'):
        if old.stem not in registry:
            old.unlink()


def blocks_for(root, folder, body, public):
    blocks, position = [], 0
    for match in IMAGE.finditer(body):
        if body[position:match.start()].strip():
            blocks.append({'type': 'text', 'text': body[position:match.start()].strip()})
        original = local_path(folder, match[2])
        converted = webp(original.read_bytes())
        target = original if original.suffix.lower() == '.webp' else original.with_name(original.stem + '-' + digest(converted)[:12] + '.webp')
        write(target, converted)
        relative = target.relative_to(root).as_posix()
        public.add('gsm/' + relative)
        with Image.open(BytesIO(converted)) as image:
            blocks.append({'type': 'image', 'src': '/gsm/' + relative, 'alt': match[1], 'width': image.width, 'height': image.height})
        position = match.end()
    if body[position:].strip():
        blocks.append({'type': 'text', 'text': body[position:].strip()})
    return blocks


def build(root):
    root = root.resolve()
    posts, profiles, public, ids = [], {}, set(), set()
    registry = sync_users(root)
    packages = []
    for path in sorted((root / 'posts').glob('**/index.md')):
        meta, body = split(path.read_text())
        username = validate(meta, body)
        if username not in registry:
            raise ValueError(f'历史帖子仍引用 @{username}，请恢复 users/{username}/profile.json；退出使用可设置 active: false')
        if meta.get('status', 'published') != 'published':
            continue
        ident = meta.get('id')
        if not isinstance(ident, str) or not re.fullmatch(r'[A-Za-z0-9-]+', ident) or ident in ids:
            raise ValueError(f'帖子 id 必须唯一且只含英文数字和连字符: {path}')
        ids.add(ident)
        date = date_value(meta['date'])
        packages.append((date, ident, username, meta, body, path.parent))
    for date, ident, username, meta, body, folder in sorted(packages, reverse=True):
        if username not in profiles:
            character = registry[username]
            portrait = root / 'assets/avatars' / (username + '.webp')
            public.add('gsm/' + portrait.relative_to(root).as_posix())
            tone = character.get('color') or ['sage', 'sand', 'rose'][hashlib.sha256(username.encode()).digest()[1] % 3]
            if tone not in {'sage', 'sand', 'rose', 'isopoda'}:
                raise ValueError(f'@{username} 的 color 只能是 sage、sand、rose 或 isopoda')
            profiles[username] = {'handle': username, 'name': character.get('name', meta['name']),
                                  'avatarImage': '/gsm/assets/avatars/' + username + '.webp?v=' + character['avatar']['sha256'][:12], 'color': tone}
        likes = initial_likes(meta)
        localized = {'zh': blocks_for(root, folder, body, public)}
        for lang in ('en', 'ja'):
            translation = folder / f'index.{lang}.md'
            localized[lang] = blocks_for(root, folder, translation.read_text().strip(), public) if translation.exists() else localized['zh']
        posts.append({'id': ident, 'date': date, 'createdAt': int(datetime.fromisoformat(date).timestamp()*1000),
                      'author': username, 'likes': likes, 'blocks': localized})
    source = '// Generated from gsm/posts and gsm/users; edit those sources, not this file.\n'
    source += 'export const profiles = ' + json_text(profiles).rstrip() + ';\n'
    source += 'export const posts = ' + json_text(posts).rstrip() + ';\n'
    write(root / 'data/feed.mjs', source)
    write(root / '.publishing/public.json', json_text(sorted(public)))
    return posts


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['publish', 'ingest', 'build', 'watch'])
    parser.add_argument('--root', type=Path, default=ROOT)
    args = parser.parse_args()
    while True:
        try:
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
