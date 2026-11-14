"""Read GSM's native archives for the independent forum engine; never rewrite them."""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

import publish as p


def regular(root, path, directory=False):
    root = Path(root)
    path = Path(path)
    relative = path.relative_to(root)
    current = root
    for part in relative.parts:
        current /= part
        if current.is_symlink():
            raise ValueError('Storage paths cannot be symbolic links: ' + str(path))
    if not (path.is_dir() if directory else path.is_file()):
        raise ValueError('Storage needs a regular file or directory: ' + str(path))
    return path


def user_documents(root):
    users, profiles, supplements = [], {}, {}
    regular(root, root / 'users', directory=True)
    for path in sorted((root / 'users').glob('*/profile.md')):
        regular(root, path)
        ident, source = path.parent.name, path.read_text()
        settings = p.read_user_document(path)
        reserved = settings['ai_scope'] == '作者保留'
        users.append({
            'id': ident, 'handle': ident, 'name': settings['name'], 'bio': settings['bio'],
            'avatar': '', 'enabled': settings['active'], 'aiScope': 'none' if reserved else 'daily',
            'profileStatus': 'approved', 'kind': 'admin' if reserved else 'character',
            'sourceWork': '', 'inFollowing': False,
            'allowPosts': False if reserved else settings['allow_posts'],
            'allowReplies': False if reserved else settings['allow_replies'],
        })
        def section(heading):
            match = re.search(r'^## ' + re.escape(heading) + r'\s*\n(.*?)(?=^## |\Z)', source, re.M | re.S)
            return match[1].strip() if match else ''
        profiles[ident] = {
            'version': 1, 'userId': ident,
            'basics': {'age': '', 'occupation': '', 'location': '', 'worldview': '',
                       'interests': [section('关注与选择')], 'personality': [],
                       'timezone': 'Asia/Shanghai', 'activeHours': settings['active_periods'],
                       **({'postingMode': 'manual', 'postingWindows': []} if reserved else {})},
            'voice': [section('表达与交往')], 'postingHabits': [section('表达与交往')],
            'relationships': [section('关系与知情')], 'knowledgeScope': [section('身体与生活')],
            'boundaries': ['作者保留，AI 不得代写或更改身份。'] if reserved else [],
            'notes': source, 'activityWeight': settings['weight'], 'tags': [],
            'currentStatus': section('近期生活'), 'topics': [], 'voiceExamples': [],
        }
        supplements[ident] = []
        for extra in sorted(path.parent.rglob('*.md')):
            regular(root, extra)
            if extra != path:
                supplements[ident].append({'path': extra.relative_to(root).as_posix(), 'text': extra.read_text()})
    if not users:
        raise ValueError('GSM needs at least one native user dossier')
    return {'registry': {'version': 1, 'users': users}, 'profiles': profiles,
            'supplementalDocuments': supplements}


def post_documents(root):
    records = {}
    for path in p.post_documents(root):
        regular(root, path)
        source = path.read_text()
        # New engine packages are parsed strictly by JavaScript. The bridge is
        # only for the historical GSM schema and manual trigger packages.
        meta, body = p.split(source)
        if meta.get('_engine') or 'username' not in meta:
            continue
        author = p.validate(meta, body)
        if meta.get('status', 'published') != 'published':
            records[path.relative_to(root).as_posix()] = {'sha256': p.digest(source.encode()), 'post': None}
            continue
        media = []
        for match in p.IMAGE.finditer(body):
            value = match[2]
            if '\\' in value or ':' in value or value.startswith('/'):
                raise ValueError('Native media must stay inside its thread package')
            target = (path.parent / value).resolve()
            package = path.parent.parent if path.parent.name == 'replies' else path.parent
            if not target.is_relative_to(package.resolve()):
                raise ValueError('Native media must stay inside its thread package')
            regular(root, target)
            media.append({'src': target.relative_to(root).as_posix(), 'alt': match[1]})
        post = {'id': meta['id'], 'author': author, 'createdAt': p.date_value(meta['date']),
                'replyTo': meta.get('reply_to') or None, 'text': p.IMAGE.sub('', body).strip(),
                'likes': p.initial_likes(meta), 'canon': 'derivative', 'media': media}
        if meta.get('guest') is not None:
            post['guest'] = {'name': meta['guest']['name']}
        records[path.relative_to(root).as_posix()] = {
            'sha256': p.digest(source.encode()), 'post': post,
            **({'guest': {'name': meta['guest']['name'], 'bio': meta['guest'].get('bio', '')}}
               if meta.get('guest') is not None else {})}
    return records


if __name__ == '__main__':
    command, supplied_root = sys.argv[1:]
    root = Path(supplied_root)
    if root.is_symlink():
        raise ValueError('Project root cannot be a symbolic link')
    root = root.resolve()
    if command not in {'users', 'posts'}:
        raise ValueError('Use storage.py users|posts ROOT')
    print(json.dumps((user_documents if command == 'users' else post_documents)(root), ensure_ascii=False))
