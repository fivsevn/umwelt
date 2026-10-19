"""Trigger -> editable post packages -> static G-stream data. No account service."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
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
    match = re.match(r'\A---\s*\n(.*?)\n---\s*\n?(.*)\Z', text, re.S)
    if not match:
        raise ValueError('帖子需要开头的 --- 配置区')
    meta = yaml.safe_load(match[1])
    if not isinstance(meta, dict):
        raise ValueError('配置区必须是字段和值')
    return meta, match[2].strip()


def document(meta, body):
    return '---\n' + yaml.safe_dump(meta, allow_unicode=True, sort_keys=False) + '---\n\n' + body.strip() + '\n'


def validate(meta, body):
    username = str(meta.get('username', ''))
    if not USERNAME.fullmatch(username):
        raise ValueError('username 只能填写 1–32 位英文字母和数字，不含 @、空格或标点')
    if not isinstance(meta.get('name'), str) or not meta['name'].strip():
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


def import_trigger(root, text, read_media, event_date, event, state):
    root = root.resolve()
    meta, body = split(text)
    username = validate(meta, body)
    media = {match[1]: read_media(match[1]) for match in IMAGE.findall(body)}
    dedup_meta = dict(meta)
    # Adding the optional zero default to an older trigger is not a new post.
    if initial_likes(meta) == 0:
        dedup_meta.pop('likes', None)
    canonical = json_text({'meta': dedup_meta, 'body': body, 'media': {k: digest(v) for k, v in media.items()}})
    fingerprint = digest(canonical.encode())
    if fingerprint == state.get('last_digest'):
        return None
    date = date_value(meta.get('date') or event_date)
    ident = datetime.fromisoformat(date).strftime('%Y%m%d-%H%M%S') + '-' + digest(event.encode())[:10]
    folder = root / 'posts' / date[:4] / date[5:7] / ident
    converted = {name: webp(data) for name, data in media.items()}
    names = {name: f'assets/{i:02d}-{digest(data)[:12]}.webp' for i, (name, data) in enumerate(converted.items(), 1)}
    archived_body = IMAGE.sub(lambda m: f'![{m[1]}]({names[m[2]]})', body)
    package = {'id': ident, 'date': date, 'username': username, 'name': meta['name'].strip(),
               'status': meta.get('status', 'published'), 'likes': initial_likes(meta), 'source_event': event}
    if folder.exists():
        # A retry after a partial import must not overwrite a later manual edit.
        old, _ = split((folder / 'index.md').read_text())
        if old.get('source_event') != event:
            raise ValueError(f'帖子编号冲突: {ident}')
    else:
        folder.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(dir=folder.parent, prefix='.import-') as temp:
            staging = Path(temp) / ident
            for original, data in converted.items():
                write(staging / names[original], data)
            write(staging / 'index.md', document(package, archived_body))
            staging.rename(folder)
    state['last_digest'] = fingerprint
    return folder


def git(repo, *args):
    return subprocess.check_output(['git', *args], cwd=repo)


def ingest(root, mode):
    root = root.resolve()
    state = state_for(root)
    created = []
    if mode == 'git':
        repo = root.parent
        cursor = state.get('cursor')
        if not cursor:
            raise ValueError('缺少导入起点 cursor；请先初始化，避免重新导入整个历史')
        subprocess.run(['git', 'merge-base', '--is-ancestor', cursor, 'HEAD'], cwd=repo, check=True)
        commits = git(repo, 'log', '--reverse', '--format=%H', f'{cursor}..HEAD', '--', 'gsm/trigger.md', 'gsm/uploads').decode().split()
        for commit in commits:
            try:
                text = git(repo, 'show', f'{commit}:gsm/trigger.md').decode()
            except subprocess.CalledProcessError:
                continue  # Removing the trigger is not a post.
            def read_media(value):
                relative = local_path(root, value).relative_to(root).as_posix()
                return git(repo, 'show', f'{commit}:gsm/{relative}')
            date = git(repo, 'show', '-s', '--format=%cI', commit).decode().strip()
            folder = import_trigger(root, text, read_media, date, commit, state)
            if folder:
                created.append(folder)
        state['cursor'] = git(repo, 'rev-parse', 'HEAD').decode().strip()
    else:
        now = datetime.now(ZONE).isoformat(timespec='microseconds')
        folder = import_trigger(root, (root / 'trigger.md').read_text(), lambda value: local_path(root, value).read_bytes(), now, 'local:' + now, state)
        if folder:
            created.append(folder)
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
    registry = {}
    for path in sorted((root / 'characters').glob('*.json')):
        if not USERNAME.fullmatch(path.stem) or path.stem != path.stem.lower():
            raise ValueError(f'角色文件名必须是小写英文数字用户名: {path.name}')
        registry[path.stem] = json.loads(path.read_text())
    packages = []
    for path in sorted((root / 'posts').glob('**/index.md')):
        meta, body = split(path.read_text())
        username = validate(meta, body)
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
            character = registry.get(username, {})
            portrait = root / 'assets/avatars' / (username + '.webp')
            if character.get('avatar_source'):
                original = local_path(root, character['avatar_source'])
                data = webp(original.read_bytes(), pixels=character.get('avatar_pixels'), crop=character.get('avatar_crop'))
            else:
                data = generated_avatar(username)
            write(portrait, data)
            public.add('gsm/' + portrait.relative_to(root).as_posix())
            tone = ['sage', 'sand', 'rose'][hashlib.sha256(username.encode()).digest()[1] % 3]
            profiles[username] = {'handle': username, 'name': character.get('name', meta['name']),
                                  'avatarImage': '/gsm/assets/avatars/' + portrait.name, 'color': tone}
        likes = initial_likes(meta)
        localized = {'zh': blocks_for(root, folder, body, public)}
        for lang in ('en', 'ja'):
            translation = folder / f'index.{lang}.md'
            localized[lang] = blocks_for(root, folder, translation.read_text().strip(), public) if translation.exists() else localized['zh']
        posts.append({'id': ident, 'date': date, 'createdAt': int(datetime.fromisoformat(date).timestamp()*1000),
                      'author': username, 'likes': likes, 'blocks': localized})
    source = '// Generated from gsm/posts and gsm/characters; edit those sources, not this file.\n'
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
