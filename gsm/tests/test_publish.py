import importlib.util
import json
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import sys
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
from pathlib import Path

from PIL import Image

spec = importlib.util.spec_from_file_location('publish', Path(__file__).parents[1] / 'tools/publish.py')
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)
sys.modules['publish'] = p
spec = importlib.util.spec_from_file_location('inbox', Path(__file__).parents[1] / 'tools/inbox.py')
inbox = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inbox)
spec = importlib.util.spec_from_file_location('verify_live', Path(__file__).parents[1] / 'tools/verify-live.py')
live = importlib.util.module_from_spec(spec)
spec.loader.exec_module(live)


def picture(fmt='PNG', color='red'):
    out = BytesIO()
    Image.new('RGB', (17, 9), color).save(out, format=fmt)
    return out.getvalue()


USER_TABLE_HEADER = """# 用户管理

<!-- users:start -->
| username | 昵称 | 启用 | 可随机分配 | 头像原图（选填） | 个性签名（选填） |
| --- | --- | --- | --- | --- | --- |
"""


def user_table_row(username, profile):
    name = profile['name'].replace('|', r'\|').replace('\n', ' ')
    bio = profile.get('bio', '').replace('|', r'\|').replace('\n', ' ')
    return (f'| {username} | {name} | {"是" if profile.get("active", True) else "否"} '
            f'| {"是" if profile.get("random_assignable", False) else "否"} '
            f'| {profile.get("avatar_source", "")} | {bio} |\n')


def write_user_table(root, users):
    p.write(root / 'users/README.md', USER_TABLE_HEADER + ''.join(user_table_row(k, v) for k, v in sorted(users.items())) + '<!-- users:end -->\n')


class Publishing(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.repo = Path(self.temp.name)
        self.root = self.repo / 'gsm'
        self.root.mkdir()
        self.state = {'last_digest': None}
        for username in ['poola', 'poolb']:
            p.write(self.root/'users'/username/'profile.json', p.json_text({'name': username, 'active': True, 'random_assignable': True}))
        p.write(self.root/'users/gecko7/profile.json', p.json_text({'name': '叶背', 'active': True, 'random_assignable': False}))
        write_user_table(self.root, p.users_for(self.root))

    def tearDown(self):
        self.temp.cleanup()

    def trigger(self, body='你好。', **meta):
        return p.document({'username': 'gecko7', 'name': '叶背', 'status': 'published', **meta}, body)

    def publish(self, text, event='one'):
        return p.import_trigger(self.root, text, lambda name: p.local_path(self.root, name).read_bytes(), '2026-10-19T12:00:00+08:00', event, self.state)

    def commit(self, message):
        p.git(self.repo, 'add', '.')
        p.git(self.repo, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', message)

    def edit_user(self, username, **fields):
        users = p.users_for(self.root)
        users.setdefault(username, {}).update(fields)
        write_user_table(self.root, users)
        p.sync_users(self.root)

    def start_git(self, trigger=''):
        p.git(self.repo, 'init', '-q')
        p.write(self.root/'trigger.md', trigger)
        self.commit('initial')
        cursor = p.git(self.repo, 'rev-parse', 'HEAD').decode().strip()
        p.write(self.root/'.publishing/state.json', p.json_text({'version': 1, 'cursor': cursor, 'last_digest': None}))

    def test_random_identity_is_permanent_and_fixed_or_inactive_users_are_excluded(self):
        self.edit_user('fixed7', name='固定角色', active=True, random_assignable=False)
        folder = self.publish('没有填用户名的文字。', 'random-post')
        before = (folder/'index.md').read_bytes()
        meta, _ = p.split(before.decode())
        self.assertIn(meta['username'], ['poola', 'poolb'])
        self.assertEqual(meta['author_assignment'], 'random')
        for username in ['poola', 'poolb']:
            self.edit_user(username, active=False, random_assignable=False)
        retry = p.import_trigger(self.root, '没有填用户名的文字。', lambda _: None, '2026-10-20T12:00:00+08:00', 'random-post', {})
        self.assertEqual(retry, folder)
        self.assertEqual((folder/'index.md').read_bytes(), before)
        self.assertEqual(p.build(self.root)[0]['author'], meta['username'])
        with self.assertRaisesRegex(ValueError, '没有可随机'):
            self.publish('另一条。', 'new')
        with self.assertRaisesRegex(ValueError, '已停用'):
            self.publish(p.document({'username': meta['username']}, '不能发新帖。'), 'disabled')
        explicit = self.publish(p.document({'username': 'fixed7'}, '可以指定固定用户。'), 'fixed')
        self.assertEqual(p.split((explicit/'index.md').read_text())[0]['username'], 'fixed7')

    def test_user_management_add_rename_disable_delete(self):
        self.edit_user('newuser8', name='新角色', active=True, random_assignable=False)
        folder = self.publish(self.trigger(username='newuser8', name='新角色'))
        profile = self.root/'users/newuser8/profile.json'
        assigned = json.loads(profile.read_text())
        self.assertEqual({key: assigned[key] for key in ['name', 'active', 'random_assignable', 'avatar_source']},
                         {'name': '新角色', 'active': True, 'random_assignable': False, 'avatar_source': ''})
        self.assertEqual(assigned['avatar']['kind'], 'generated')
        self.edit_user('newuser8', name='改名之后', active=False, random_assignable=True)
        p.build(self.root)
        self.assertIn('改名之后', (self.root/'data/feed.mjs').read_text())
        users = p.users_for(self.root); users.pop('poola'); write_user_table(self.root, users)
        p.build(self.root)
        self.assertFalse((self.root/'users/poola').exists())
        self.assertFalse((self.root/'assets/avatars/poola.webp').exists())
        users.pop('newuser8'); write_user_table(self.root, users)
        with self.assertRaisesRegex(ValueError, '历史帖子仍引用'):
            p.build(self.root)
        self.assertTrue((folder/'index.md').exists())

    def test_public_bio_is_managed_by_the_existing_user_table_and_keeps_identity(self):
        self.edit_user('gecko7', bio='先看看。')
        folder = self.publish(self.trigger())
        before_post = (folder/'index.md').read_bytes()
        avatar = self.root/'assets/avatars/gecko7.webp'
        before_avatar = avatar.read_bytes()
        before_profile = json.loads((self.root/'users/gecko7/profile.json').read_text())
        table = self.root/'users/README.md'
        with patch.object(p, 'generated_avatar', side_effect=AssertionError('bio edits must not redraw avatars')):
            self.edit_user('gecko7', bio='叶子 | 这边 <也能写字>。')
            p.write(table, table.read_text() + '\n## 角色档案\n\n内部设定不应出现在主页。\n')
            p.build(self.root)
        profile = json.loads((self.root/'users/gecko7/profile.json').read_text())
        self.assertEqual(profile['bio'], '叶子 | 这边 <也能写字>。')
        self.assertEqual({k: v for k, v in profile.items() if k != 'bio'},
                         {k: v for k, v in before_profile.items() if k != 'bio'})
        source = (self.root/'data/feed.mjs').read_text()
        exported = json.loads(source.split('export const profiles = ', 1)[1].split(';\n', 1)[0])
        self.assertEqual(exported['gecko7']['bio'], profile['bio'])
        self.assertEqual(set(exported['gecko7']), {'handle', 'name', 'bio', 'avatarImage', 'color'})
        self.assertNotIn('内部设定', source)
        self.assertEqual((folder/'index.md').read_bytes(), before_post)
        self.assertEqual(avatar.read_bytes(), before_avatar)
        # Generated JSON is never an alternate source for this public field.
        profile['bio'] = '不从这里维护。'
        p.write(self.root/'users/gecko7/profile.json', p.json_text(profile))
        p.build(self.root)
        self.assertEqual(p.users_for(self.root)['gecko7']['bio'], '叶子 | 这边 <也能写字>。')
        self.edit_user('gecko7', bio='')
        p.build(self.root)
        source = (self.root/'data/feed.mjs').read_text()
        exported = json.loads(source.split('export const profiles = ', 1)[1].split(';\n', 1)[0])
        self.assertEqual(exported['gecko7']['bio'], '')
        self.assertNotIn('叶子 | 这边', source)
        self.assertEqual(avatar.read_bytes(), before_avatar)

    def test_legacy_five_column_users_have_an_empty_bio(self):
        table = self.root/'users/README.md'
        legacy = [line.rsplit('|', 2)[0] + ' |' if line.startswith('|') else line
                  for line in table.read_text().splitlines()]
        p.write(table, '\n'.join(legacy) + '\n')
        self.assertEqual(p.sync_users(self.root)['gecko7']['bio'], '')
        self.publish(self.trigger())
        p.build(self.root)
        exported = json.loads((self.root/'data/feed.mjs').read_text().split('export const profiles = ', 1)[1].split(';\n', 1)[0])
        self.assertEqual(exported['gecko7']['bio'], '')

    def test_unescaped_bio_column_separator_is_rejected_before_user_updates(self):
        p.sync_users(self.root)
        before = {file: file.read_bytes() for file in (self.root/'users').glob('*/profile.json')}
        table = self.root/'users/README.md'
        p.write(table, table.read_text().replace('| gecko7 | 叶背 |', '| gecko7 | 改了昵称 |')
                .replace('| gecko7 | 改了昵称 | 是 | 否 |  |  |', '| gecko7 | 改了昵称 | 是 | 否 |  | 一边 | 另一边 |'))
        with self.assertRaisesRegex(ValueError, '六列'):
            p.sync_users(self.root)
        self.assertEqual({file: file.read_bytes() for file in before}, before)

    def test_posting_never_creates_users_or_changes_the_management_table(self):
        table = (self.root/'users/README.md').read_bytes()
        profiles = {f: f.read_bytes() for f in (self.root/'users').glob('*/profile.json')}
        folder = self.publish(self.trigger(username='notregistered', name='不能通过发帖建档'), 'unknown')
        meta, _ = p.split((folder/'index.md').read_text())
        self.assertIn(meta['username'], ['poola', 'poolb'])
        self.assertFalse((self.root/'users/notregistered').exists())
        self.publish(self.trigger(username='gecko7', name='不能通过发帖改名'), 'specified')
        self.assertEqual((self.root/'users/README.md').read_bytes(), table)
        self.assertEqual({f: f.read_bytes() for f in (self.root/'users').glob('*/profile.json')}, profiles)

    def test_markdown_table_assigns_avatar_before_first_post_and_keeps_identity(self):
        table = self.root/'users/README.md'
        p.write(table, table.read_text().replace('<!-- users:end -->', '| username | 一位新角色 | 是 | 是 | |\n<!-- users:end -->'))
        self.assertFalse((self.root/'users/username').exists())
        p.sync_users(self.root)
        profile = self.root/'users/username/profile.json'
        self.assertEqual(json.loads(profile.read_text())['name'], '一位新角色')
        self.assertEqual(sorted(f.name for f in profile.parent.iterdir()), ['profile.json'])
        avatar = self.root/'assets/avatars/username.webp'
        original = avatar.read_bytes()
        with Image.open(avatar) as check:
            self.assertEqual(check.format, 'WEBP')
        self.assertFalse((self.root/'posts').exists())
        self.edit_user('username', name='成为固定角色', random_assignable=False)
        self.assertEqual(avatar.read_bytes(), original)
        p.build(self.root)
        self.assertEqual(avatar.read_bytes(), original)
        self.publish(p.document({'username': 'username'}, '第一条帖子。'))
        p.build(self.root)
        self.assertEqual(sorted(f.name for f in profile.parent.iterdir()), ['profile.json'])
        self.assertTrue((self.root/'assets/avatars/username.webp').is_file())
        self.assertEqual(avatar.read_bytes(), original)
        before = profile.read_bytes()
        p.write(table, table.read_text().replace('<!-- users:end -->', '| username | 重复 | 是 | 是 | |\n<!-- users:end -->'))
        with self.assertRaisesRegex(ValueError, '必须唯一'):
            p.sync_users(self.root)
        self.assertEqual(profile.read_bytes(), before)

    def test_registered_user_without_any_posts_has_a_public_profile_and_avatar(self):
        self.edit_user('newuser8', name='还没发帖', bio='先看看。', active=True, random_assignable=False)
        source = self.root/'users/poolb/photo.png'
        p.write(source, picture())
        self.edit_user('poolb', avatar_source='photo.png')
        self.edit_user('poolb', avatar_source='')
        custom = (self.root/'assets/avatars/poolb.webp').read_bytes()
        self.assertFalse((self.root/'posts').exists())
        self.assertEqual(p.build(self.root), [])
        exported = json.loads((self.root/'data/feed.mjs').read_text().split('export const profiles = ', 1)[1].split(';\n', 1)[0])
        self.assertEqual(set(exported), set(p.users_for(self.root)))
        self.assertEqual(exported['newuser8']['name'], '还没发帖')
        self.assertEqual(exported['newuser8']['bio'], '先看看。')
        self.assertTrue(exported['newuser8']['avatarImage'].startswith('/gsm/assets/avatars/newuser8.webp?v='))
        public = json.loads((self.root/'.publishing/public.json').read_text())
        self.assertIn('gsm/assets/avatars/newuser8.webp', public)
        self.assertEqual(sorted(path.name for path in (self.root/'users/newuser8').iterdir()), ['profile.json'])
        self.assertEqual((self.root/'assets/avatars/poolb.webp').read_bytes(), custom)
        self.assertEqual(p.users_for(self.root)['poolb']['avatar']['kind'], 'custom')
        with patch.object(p, 'generated_avatar', side_effect=AssertionError('an empty feed must reuse assigned avatars')):
            self.assertEqual(p.build(self.root), [])

    def test_assigned_avatars_are_reused_without_running_the_generator(self):
        p.sync_users(self.root)
        avatar = self.root/'assets/avatars/poola.webp'
        original, modified = avatar.read_bytes(), avatar.stat().st_mtime_ns
        # Also migrate an existing portrait that predates assignment metadata.
        profile = self.root/'users/poola/profile.json'
        fields = json.loads(profile.read_text()); fields.pop('avatar')
        p.write(profile, p.json_text(fields))
        with patch.object(p, 'generated_avatar', side_effect=AssertionError('must not redraw')):
            self.edit_user('poola', name='新的昵称', active=False, random_assignable=False)
            self.edit_user('poola', active=True, random_assignable=True)
            p.build(self.root)
        self.assertEqual(avatar.read_bytes(), original)
        self.assertEqual(avatar.stat().st_mtime_ns, modified)

    def test_user_guide_tables_are_not_treated_as_user_records(self):
        table = self.root/'users/README.md'
        guide = '\n## 操作说明\n\n| 操作 | 结果 |\n| --- | --- |\n| 改昵称 | 保留头像 |\n'
        p.write(table, table.read_text() + guide)
        p.sync_users(self.root)
        self.assertEqual(set(p.users_for(self.root)), {'poola', 'poolb', 'gecko7'})
        valid = table.read_text()
        p.write(table, valid.replace('| poola |', 'poola |'))
        with self.assertRaisesRegex(ValueError, '分隔符'):
            p.sync_users(self.root)
        self.assertEqual(set(p.users_for(self.root)), {'poola', 'poolb', 'gecko7'})
        p.write(table, valid)
        p.write(table, table.read_text().replace('<!-- users:end -->', ''))
        with self.assertRaisesRegex(ValueError, '注释标记'):
            p.sync_users(self.root)
        self.assertEqual(set(p.users_for(self.root)), {'poola', 'poolb', 'gecko7'})

    def test_custom_avatar_only_reconverts_when_image_or_crop_changes(self):
        p.sync_users(self.root)
        source = self.root/'users/poola/photo.png'
        avatar = self.root/'assets/avatars/poola.webp'
        p.write(source, picture())
        self.edit_user('poola', avatar_source='photo.png')
        assigned = avatar.read_bytes()
        with patch.object(p, 'webp', side_effect=AssertionError('unchanged image must not reconvert')):
            self.edit_user('poola', name='改昵称', random_assignable=False)
            p.write(source.parent/'unused.png', picture('PNG', 'green'))
            p.sync_users(self.root)
        self.assertEqual(avatar.read_bytes(), assigned)
        p.write(source, picture('PNG', 'blue'))
        with patch.object(p, 'webp', wraps=p.webp) as convert:
            p.sync_users(self.root)
            self.assertEqual(convert.call_count, 1)
        self.assertNotEqual(avatar.read_bytes(), assigned)
        profile = source.parent/'profile.json'
        fields = json.loads(profile.read_text()); fields['avatar_pixels'] = 16
        p.write(profile, p.json_text(fields))
        with patch.object(p, 'webp', wraps=p.webp) as convert:
            p.sync_users(self.root)
            self.assertEqual(convert.call_count, 1)
        with Image.open(avatar) as check:
            self.assertEqual(check.size, (16, 16))

    def test_clearing_custom_avatar_field_keeps_face_and_missing_source_is_an_error(self):
        p.sync_users(self.root)
        source = self.root/'users/poola/photo.png'
        avatar = self.root/'assets/avatars/poola.webp'
        p.write(source, picture())
        self.edit_user('poola', avatar_source='photo.png')
        assigned = avatar.read_bytes()
        source.unlink()
        with self.assertRaises(FileNotFoundError):
            p.sync_users(self.root)
        self.assertEqual(avatar.read_bytes(), assigned)
        with patch.object(p, 'generated_avatar', side_effect=AssertionError('must keep custom face')):
            self.edit_user('poola', avatar_source='')
            p.build(self.root)
        self.assertEqual(avatar.read_bytes(), assigned)

    def test_image_only_commits_ignore_stale_trigger_author_use_caption_and_preserve_retries(self):
        self.start_git(self.trigger('上一条内容。', username='previous9', name='上一位'))
        p.write(self.root/'uploads/照片一.PNG', picture())
        p.write(self.root/'uploads/照片二.jpg', picture('JPEG', 'blue'))
        self.commit('Add files via upload\n\n今天占领了树枝。')
        folders = p.ingest(self.root, 'git')
        self.assertEqual(len(folders), 2)
        for folder in folders:
            meta, body = p.split((folder/'index.md').read_text())
            self.assertIn(meta['username'], ['poola', 'poolb'])
            self.assertEqual(meta['author_assignment'], 'random')
            self.assertIn('今天占领了树枝。', body)
            self.assertNotIn('上一条', body)
            self.assertEqual(len(list((folder/'assets').glob('*.webp'))), 1)
        before = [path.read_bytes() for path in sorted((self.root/'posts').glob('**/index.md'))]
        self.assertEqual(p.ingest(self.root, 'git'), [])
        self.assertEqual(before, [path.read_bytes() for path in sorted((self.root/'posts').glob('**/index.md'))])
        (self.root/'uploads/照片一.PNG').unlink(); self.commit('Clear verified G-stream upload inbox')
        self.assertEqual(p.ingest(self.root, 'git'), [])
        p.write(self.root/'uploads/照片一.PNG', picture())
        self.commit('Add files via upload')
        last = p.ingest(self.root, 'git')
        self.assertEqual(len(last), 1)
        self.assertNotIn('Add files', p.split((last[0]/'index.md').read_text())[1])
        self.assertEqual(len(p.build(self.root)), 3)

    def test_caption_can_specify_registered_author_and_likes_without_trigger(self):
        self.edit_user('fixed7', name='固定用户', active=True, random_assignable=False)
        self.start_git()
        p.write(self.root/'uploads/photo.webp', picture('WEBP'))
        self.commit('Upload files\n\n---\nusername: fixed7\nlikes: 31\n---\n\n晒太阳。')
        folder = p.ingest(self.root, 'git')[0]
        meta, body = p.split((folder/'index.md').read_text())
        self.assertEqual((meta['username'], meta['likes']), ('fixed7', 31))
        self.assertIn('晒太阳。', body)

    def test_trigger_and_images_form_one_post_without_duplicate_image_posts(self):
        self.start_git()
        p.write(self.root/'trigger.md', p.document({'username': 'poola', 'likes': 12}, '图一之前。\n\n![一](uploads/a.png)\n\n两图之间。\n\n![二](uploads/b.png)'))
        p.write(self.root/'uploads/a.png', picture())
        p.write(self.root/'uploads/b.png', picture(color='blue'))
        self.commit('mixed post')
        self.assertEqual(len(p.ingest(self.root, 'git')), 1)
        post = p.build(self.root)[0]
        self.assertEqual(post['author'], 'poola')
        self.assertEqual(post['likes'], 12)
        self.assertEqual([b['type'] for b in post['blocks']['zh']], ['text', 'image', 'text', 'image'])
        p.write(self.root/'trigger.md', '没有手动放图片位置。')
        p.write(self.root/'uploads/c.png', picture())
        self.commit('attach automatically')
        self.assertEqual(len(p.ingest(self.root, 'git')), 1)
        self.assertEqual(len(p.build(self.root)), 2)

    def test_local_image_preview_then_commit_has_no_duplicate_and_missing_user_uses_pool(self):
        self.start_git()
        p.write(self.root/'uploads/a.png', picture())
        p.write(self.root/'trigger.md', p.document({'username': 'unknown7'}, ''))
        self.assertEqual(len(p.ingest(self.root, 'local')), 1)
        self.assertEqual(p.ingest(self.root, 'local'), [])
        self.commit('Add files via upload')
        self.assertEqual(p.ingest(self.root, 'git'), [])
        self.assertIn(p.build(self.root)[0]['author'], ['poola', 'poolb'])

    def test_replacing_a_broken_upload_recovers_without_republishing_valid_earlier_images(self):
        self.start_git()
        p.write(self.root/'uploads/a.png', picture())
        self.commit('first valid image')
        p.write(self.root/'uploads/b.png', b'broken image')
        self.commit('Add files via upload')
        state = (self.root/'.publishing/state.json').read_bytes()
        with self.assertRaises(OSError):
            p.ingest(self.root, 'git')
        self.assertEqual((self.root/'.publishing/state.json').read_bytes(), state)
        before = [path.read_bytes() for path in (self.root/'posts').glob('**/index.md')]
        self.assertEqual(len(before), 1)
        p.write(self.root/'uploads/b.png', picture(color='blue'))
        self.commit('repaired photo')
        p.ingest(self.root, 'git')
        self.assertEqual(len(p.build(self.root)), 2)
        self.assertIn(before[0], [path.read_bytes() for path in (self.root/'posts').glob('**/index.md')])
        self.assertEqual(p.ingest(self.root, 'git'), [])

    def test_metadata_only_trigger_assigns_images_and_empty_trigger_never_publishes(self):
        self.start_git()
        self.edit_user('fixed7', name='固定', active=True, random_assignable=False)
        p.write(self.root/'trigger.md', p.document({'username': 'fixed7', 'likes': 9}, ''))
        p.write(self.root/'uploads/a.png', picture())
        self.commit('Add files via upload')
        folder = p.ingest(self.root, 'git')[0]
        meta, _ = p.split((folder/'index.md').read_text())
        self.assertEqual((meta['username'], meta['likes']), ('fixed7', 9))
        p.write(self.root/'trigger.md', p.document({'username': ''}, ''))
        self.commit('reset blank trigger')
        self.assertEqual(p.ingest(self.root, 'git'), [])

    def test_real_http_verification_precedes_cleanup_and_new_uploads_and_drafts_are_kept(self):
        p.write(self.root/'uploads/picture.png', picture())
        self.publish(self.trigger('![图](uploads/picture.png)'), 'public')
        p.write(self.root/'uploads/draft.png', picture())
        self.publish(self.trigger('![](uploads/draft.png)', status='draft'), 'draft')
        p.write(self.root/'uploads/newer.png', picture())
        self.publish(self.trigger('![](uploads/newer.png)'), 'newer')
        p.build(self.root)
        p.write(self.root/'uploads/newer.png', picture(color='blue'))
        site = self.repo/'site'
        files = ['gsm/index.html','gsm/settings/index.html','gsm/style.css','gsm/app.mjs']
        for path in files:
            p.write(site/path, 'test page')
        files += ['gsm/data/feed.mjs'] + json.loads((self.root/'.publishing/public.json').read_text())
        for path in files[4:]:
            p.write(site/path, (self.repo/path).read_bytes())
        with self.assertRaises(FileNotFoundError):
            inbox.clear_verified(self.root, site)
        class QuietHandler(SimpleHTTPRequestHandler):
            def log_message(self, *_): pass
        with ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(site))) as server:
            thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
            try:
                live.verify(self.root, site, 'http://127.0.0.1:' + str(server.server_port), attempts=1, delay=0)
            finally:
                server.shutdown(); thread.join()
        self.assertEqual(inbox.clear_verified(self.root, site), 1)
        self.assertFalse((self.root/'uploads/picture.png').exists())
        self.assertTrue((self.root/'uploads/draft.png').exists())
        self.assertTrue((self.root/'uploads/newer.png').exists())
        self.assertEqual(inbox.clear_verified(self.root, site), 0)
        p.write(site/'gsm/data/feed.mjs', 'changed artifact')
        with self.assertRaises(ValueError):
            inbox.clear_verified(self.root, site)

    def test_packages_retries_manual_edits_and_real_order(self):
        first = self.publish(self.trigger())
        self.assertIsNone(self.publish(self.trigger(), 'retry'))
        second = self.publish(self.trigger('晚一点。', date='2026-10-19T13:00:00+08:00'), 'two')
        meta, _ = p.split((first / 'index.md').read_text())
        p.write(first / 'index.md', p.document(meta, '直接修改的旧帖。'))
        posts = p.build(self.root)
        self.assertEqual(len(posts), 2)
        self.assertEqual(posts[0]['id'], second.name)
        self.assertEqual(posts[1]['blocks']['zh'][0]['text'], '直接修改的旧帖。')
        self.assertEqual(posts[1]['blocks']['en'], posts[1]['blocks']['zh'])
        self.assertEqual(posts[0]['createdAt'], 1792386000000)

    def test_trigger_likes_survive_archiving_building_and_direct_edits(self):
        folder = self.publish(self.trigger(likes=24))
        meta, body = p.split((folder / 'index.md').read_text())
        self.assertEqual(meta['likes'], 24)
        self.assertEqual(p.build(self.root)[0]['likes'], 24)
        meta['likes'] = 7
        p.write(folder / 'index.md', p.document(meta, body))
        self.assertEqual(p.build(self.root)[0]['likes'], 7)
        for value in [-1, 1.5, True, '24', None, 2**53]:
            with self.assertRaises(ValueError):
                self.publish(self.trigger(likes=value), 'invalid')
        self.assertEqual(len(list((self.root / 'posts').glob('**/index.md'))), 1)

    def test_adding_zero_likes_to_an_old_trigger_does_not_publish_a_duplicate(self):
        self.publish(self.trigger())
        self.assertIsNone(self.publish(self.trigger(likes=0), 'zero-default'))
        self.assertEqual(p.build(self.root)[0]['likes'], 0)

    def test_draft_and_hidden_sources_never_enter_public_manifest(self):
        self.publish(self.trigger('公开。'))
        p.write(self.root / 'uploads/secret.png', picture())
        self.publish(self.trigger('![草稿图](uploads/secret.png)', status='draft', username='private7'), 'draft')
        self.publish(self.trigger('隐藏。', status='hidden', username='hidden7'), 'hidden')
        posts = p.build(self.root)
        self.assertEqual(len(posts), 1)
        manifest = (self.root / '.publishing/public.json').read_text()
        self.assertNotIn('posts/', manifest)
        self.assertNotIn('private7', manifest)
        self.assertNotIn('hidden7', manifest)

    def test_images_are_owned_by_each_package_and_keep_authored_order(self):
        p.write(self.root / 'uploads/照片.png', picture())
        folder = self.publish(self.trigger('之前\n\n![图](uploads/照片.png)\n\n之后'))
        self.assertEqual(len(list((folder / 'assets').glob('*.webp'))), 1)
        (self.root / 'uploads/照片.png').unlink()
        blocks = p.build(self.root)[0]['blocks']['zh']
        self.assertEqual([b['type'] for b in blocks], ['text', 'image', 'text'])
        self.assertTrue(blocks[1]['src'].endswith('.webp'))
        self.assertEqual((blocks[1]['width'], blocks[1]['height']), (17, 9))

    def test_image_conversion_preserves_animation_transparency_and_orientation(self):
        out = BytesIO()
        Image.new('RGBA', (8, 8), (255,0,0,0)).save(out, format='PNG')
        with Image.open(BytesIO(p.webp(out.getvalue()))) as check:
            self.assertEqual(check.getpixel((0,0))[3], 0)
        out = BytesIO()
        Image.new('RGB',(8,8),'red').save(out, format='GIF', save_all=True,
            append_images=[Image.new('RGB',(8,8),'blue')], duration=[100,200], loop=0)
        animated = p.webp(out.getvalue())
        with Image.open(BytesIO(animated)) as check:
            self.assertEqual(check.n_frames, 2)
            self.assertEqual(check.info['loop'], 0)
            check.seek(0); check.load(); self.assertEqual(check.info['duration'], 100)
            check.seek(1); check.load(); self.assertEqual(check.info['duration'], 200)
        self.assertEqual(p.webp(animated), animated)
        image = Image.new('RGB', (17,9), 'red'); exif = image.getexif(); exif[274] = 6
        out = BytesIO(); image.save(out, format='JPEG', exif=exif)
        with Image.open(BytesIO(p.webp(out.getvalue()))) as check:
            self.assertEqual(check.size, (9,17))
        with self.assertRaises(Exception):
            p.webp(b'broken photo')

    def test_generated_avatars_are_stable_and_registration_overrides(self):
        self.assertEqual(p.generated_avatar('gecko7'), p.generated_avatar('gecko7'))
        self.assertNotEqual(p.generated_avatar('gecko7'), p.generated_avatar('gecko8'))
        self.publish(self.trigger())
        p.write(self.root / 'users/gecko7/profile.json', p.json_text({'name':'新昵称','avatar_source':'photo.png','avatar_pixels':32}))
        write_user_table(self.root, p.users_for(self.root))
        p.write(self.root / 'users/gecko7/photo.png', picture())
        p.build(self.root)
        self.assertIn('新昵称', (self.root / 'data/feed.mjs').read_text())
        with Image.open(self.root / 'assets/avatars/gecko7.webp') as check:
            self.assertEqual(check.size, (32,32))
            self.assertEqual(check.format, 'WEBP')

    def test_logo_default_variants_use_one_color_and_stable_username_selection(self):
        master = p.brand_master()
        variants = {p.avatar_variant('user' + str(number))['id'] for number in range(60)}
        self.assertEqual(variants, {'gaze-left', 'gaze-center', 'gaze-right', 'turn-left', 'turn-right', 'tilt'})
        renderings = set()
        for variant in master['avatarVariants']:
            username = next('user' + str(number) for number in range(60)
                            if p.avatar_variant('user' + str(number))['id'] == variant['id'])
            image_data = p.generated_avatar(username)
            self.assertEqual(image_data, p.generated_avatar(username))
            with Image.open(BytesIO(image_data)) as image:
                self.assertEqual(image.size, (16, 16))
                pixels = image.convert('RGBA')
                actual_rows = [''.join('#' if pixels.getpixel((x, y))[3] else '.' for x in range(16)) for y in range(16)]
                self.assertEqual(actual_rows, variant['rows'])
                self.assertEqual({pixels.getpixel((x, y)) for y in range(16) for x in range(16)
                                  if pixels.getpixel((x, y))[3]}, {(40, 59, 32, 255)})
            renderings.add(image_data)
        self.assertEqual(len(renderings), 6)
        self.assertEqual(master['rows'], next(v['rows'] for v in master['avatarVariants'] if v['id'] == 'gaze-center'))

    def test_explicit_default_avatar_migration_preserves_custom_faces_and_identity(self):
        self.edit_user('gecko7', bio='先看看。')
        folder = self.publish(self.trigger())
        source = self.root/'users/poolb/photo.png'
        p.write(source, picture())
        profile_path = self.root/'users/poolb/profile.json'
        profile = json.loads(profile_path.read_text())
        profile.update({'avatar_pixels': 8, 'avatar_crop': [0, 0, 8, 8], 'color': 'rose'})
        p.write(profile_path, p.json_text(profile))
        self.edit_user('poolb', avatar_source='photo.png')
        # A cleared source still belongs to the custom image and must stay untouched.
        self.edit_user('poolb', avatar_source='')
        custom_profile, custom_image = profile_path.read_bytes(), (self.root/'assets/avatars/poolb.webp').read_bytes()
        original_source, original_post = source.read_bytes(), (folder/'index.md').read_bytes()
        old_image = picture('WEBP', 'green')
        for username in ['poola', 'gecko7']:
            path = self.root/'users'/username/'profile.json'
            profile = json.loads(path.read_text())
            profile['avatar'] = {'kind': 'generated', 'sha256': p.digest(old_image)}
            p.write(path, p.json_text(profile))
            p.write(self.root/'assets/avatars'/(username+'.webp'), old_image)
        identities = {username: {key: value for key, value in profile.items() if key != 'avatar'}
                      for username, profile in p.users_for(self.root).items()}
        with patch.object(p, 'generated_avatar', side_effect=AssertionError('normal build must keep the old face')):
            p.build(self.root)
        self.assertEqual((self.root/'assets/avatars/poola.webp').read_bytes(), old_image)
        self.assertEqual(set(p.migrate_default_avatars(self.root)), {'poola', 'gecko7'})
        for username in ['poola', 'gecko7']:
            profile = p.users_for(self.root)[username]
            self.assertEqual(profile['avatar']['kind'], 'generated')
            self.assertEqual(profile['avatar']['generator'], 'flat-v1')
            self.assertEqual(profile['avatar']['variant'], p.avatar_variant(username)['id'])
            self.assertEqual((self.root/'assets/avatars'/(username+'.webp')).read_bytes(), p.generated_avatar(username))
        self.assertEqual({username: {key: value for key, value in profile.items() if key != 'avatar'}
                          for username, profile in p.users_for(self.root).items()}, identities)
        self.assertEqual(profile_path.read_bytes(), custom_profile)
        self.assertEqual((self.root/'assets/avatars/poolb.webp').read_bytes(), custom_image)
        self.assertEqual(source.read_bytes(), original_source)
        self.assertEqual((folder/'index.md').read_bytes(), original_post)
        times = {file: file.stat().st_mtime_ns for file in (self.root/'assets/avatars').glob('*.webp')}
        with patch.object(p, 'generated_avatar', side_effect=AssertionError('migration is one-time and ordinary builds reuse files')):
            self.assertEqual(p.migrate_default_avatars(self.root), [])
            p.build(self.root)
        self.assertEqual({file: file.stat().st_mtime_ns for file in times}, times)
        self.assertEqual(profile_path.read_bytes(), custom_profile)

    def test_username_path_date_and_duplicate_id_validation(self):
        for username in ['a.b', 'a_b', '@abc', '中文', 'a-b', 'a b']:
            with self.assertRaises(ValueError):
                self.publish(self.trigger(username=username))
        with self.assertRaises(ValueError):
            self.publish(self.trigger(date='2026-10-19T12:00:00'))
        with self.assertRaises(ValueError):
            self.publish(self.trigger('![](../secret.png)'))
        folder = self.publish(self.trigger(username='GECKO7'))
        self.assertEqual(p.split((folder/'index.md').read_text())[0]['username'], 'gecko7')
        p.write(self.root/'posts/copy/index.md', (folder/'index.md').read_bytes())
        with self.assertRaises(ValueError):
            p.build(self.root)

    def test_git_import_catches_every_commit_and_does_not_duplicate_local_preview(self):
        p.git(self.repo, 'init', '-q')
        p.write(self.repo/'README.md','initial'); self.commit('initial')
        cursor = p.git(self.repo, 'rev-parse','HEAD').decode().strip()
        p.write(self.root/'.publishing/state.json', p.json_text({'version':1,'cursor':cursor,'last_digest':None}))
        p.write(self.root/'trigger.md', self.trigger('本地预览。'))
        p.ingest(self.root,'local'); self.commit('preview')
        p.write(self.root/'trigger.md', self.trigger('第二条。')); self.commit('second')
        p.write(self.root/'trigger.md', self.trigger('第三条。')); self.commit('third')
        self.assertEqual(len(p.ingest(self.root,'git')), 2)
        self.assertEqual(len(p.build(self.root)), 3)
        self.assertEqual(p.ingest(self.root,'git'), [])
        self.assertEqual(len(p.build(self.root)), 3)

    def test_failed_media_import_does_not_advance_cursor_or_leave_half_post(self):
        p.write(self.root/'trigger.md', self.trigger('![缺图](uploads/missing.png)'))
        with self.assertRaises(FileNotFoundError):
            p.ingest(self.root,'local')
        self.assertFalse((self.root/'.publishing/state.json').exists())
        self.assertEqual(list((self.root/'posts').glob('**/index.md')), [])


if __name__ == '__main__':
    unittest.main()
