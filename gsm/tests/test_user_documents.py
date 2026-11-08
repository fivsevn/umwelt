import json
import sys
import tempfile
import unittest
from io import BytesIO
from pathlib import Path
from unittest.mock import patch

from PIL import Image

sys.path.insert(0, str(Path(__file__).parents[1] / 'tools'))
import publish as p


def user_document(username='gecko7', name='叶背', **changes):
    values = {'稳定 ID': username, '用户名': username, '网名': name, '公开简介': '看看这里。',
              '头像原图': '', '启用账号': '是', '可随机分配': '是', 'AI 使用范围': '日常',
              '允许发主帖': '是', '允许回复': '是', '抽取权重': '1', '上线时间范围': ''}
    values.update(changes)
    return '# 守宫档案\n\n## 账号与开关\n\n| 属性 | 内容 |\n| --- | --- |\n' + ''.join(
        f'| {key} | {value} |\n' for key, value in values.items()) + '\n## 身体与生活\n\n各自生活。\n'


class UserDocuments(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name) / 'gsm'
        p.write(self.root / 'users/README.md', '# 守宫资料\n<!-- users:start -->\n<!-- users:end -->\n\n## 研究\n留在这里。\n')
        self.profile = self.root / 'users/gecko7/profile.md'
        p.write(self.profile, user_document())

    def tearDown(self):
        self.temp.cleanup()

    def post(self, ident='old', username='gecko7', text='以前的发言。', **extra):
        path = self.root / f'posts/2026/11/{ident}/index.md'
        p.write(path, p.document({'id': ident, 'username': username, 'name': extra.get('guest', {}).get('name', '叶背'),
                                'date': '2026-11-01T12:00:00+08:00', 'likes': 0, **extra}, text))
        return path

    def test_individual_document_controls_identity_and_directory_without_losing_avatar_settings(self):
        registry = p.sync_users(self.root)
        config = self.profile.with_suffix('.json')
        cached = registry['gecko7']
        avatar = (self.root / 'assets/avatars/gecko7.webp').read_bytes()
        cached.update(name='过时缓存', color='rose', avatar_crop=[0, 0, 1, 1])
        p.write(config, p.json_text(cached))
        p.write(self.profile, user_document(name='新网名', **{'公开简介': '新简介', '抽取权重': '0.5'}))
        source = self.profile.read_bytes()
        registry = p.sync_users(self.root)
        self.assertEqual(self.profile.read_bytes(), source)
        self.assertEqual(registry['gecko7']['name'], '新网名')
        self.assertEqual(registry['gecko7']['bio'], '新简介')
        self.assertEqual(registry['gecko7']['color'], 'rose')
        self.assertEqual(registry['gecko7']['avatar_crop'], [0, 0, 1, 1])
        self.assertEqual((self.root / 'assets/avatars/gecko7.webp').read_bytes(), avatar)
        self.assertIn('[新网名](./gecko7/profile.md)', (self.root / 'users/README.md').read_text())
        self.assertIn('## 研究\n留在这里。', (self.root / 'users/README.md').read_text())
        self.assertEqual(json.loads((self.root / 'accounts.json').read_text())['users'][0]['activityWeight'], 0.5)

    def test_invalid_document_does_not_partially_sync_other_profiles(self):
        p.sync_users(self.root)
        before = self.profile.with_suffix('.json').read_bytes()
        p.write(self.profile, user_document(name='不应写入缓存'))
        p.write(self.root / 'users/gecko8/profile.md', user_document('gecko8', **{'启用账号': '也许'}))
        with self.assertRaisesRegex(ValueError, '是或否'):
            p.sync_users(self.root)
        self.assertEqual(self.profile.with_suffix('.json').read_bytes(), before)

    def test_missing_document_preserves_directory_and_historical_author(self):
        p.sync_users(self.root)
        self.post()
        p.write(self.root / 'users/gecko8/profile.md', user_document('gecko8'))
        self.profile.unlink()
        with self.assertRaisesRegex(ValueError, '缺失的独立用户档案'):
            p.sync_users(self.root)
        self.assertTrue(self.profile.with_suffix('.json').exists())

    def test_migration_preserves_public_feed_and_all_old_posts_byte_for_byte(self):
        self.profile.unlink()
        p.write(self.root / 'users/README.md', '<!-- users:start -->\n| username | 昵称 | 启用 | 可随机分配 | 头像 | 简介 |\n| --- | --- | --- | --- | --- | --- |\n| gecko7 | 叶背 | 是 | 是 | | 看看这里。 |\n<!-- users:end -->\n')
        source = self.post()
        p.build(self.root)
        before = (self.root / 'data/feed.mjs').read_bytes()
        old = source.read_bytes()
        p.write(self.profile, user_document())
        p.build(self.root)
        self.assertEqual((self.root / 'data/feed.mjs').read_bytes(), before)
        self.assertEqual(source.read_bytes(), old)

    def test_guest_replies_and_same_thread_media_use_original_cards_without_permanent_users(self):
        main = self.post('root', 'guest-visitor', text='看这个。', guest={'name': '路过看看'})
        reply = main.parent / 'replies/reply-01.md'
        image = BytesIO()
        Image.new('RGB', (10, 7), 'green').save(image, format='PNG')
        p.write(main.parent / 'media/detail.png', image.getvalue())
        p.write(reply, p.document({'id': 'reply-01', 'username': 'gecko7', 'name': '叶背',
                                  'date': '2026-11-01T12:01:00+08:00', 'reply_to': 'root', 'likes': 1},
                                 '是这个位置吗？\n\n![旁边的细节](../media/detail.png)'))
        posts = p.build(self.root)
        self.assertEqual(posts[0]['replyTo'], 'root')
        self.assertEqual(posts[0]['blocks']['zh'][-1]['width'], 10)
        self.assertIn('guest-visitor', (self.root / 'data/feed.mjs').read_text())
        self.assertFalse((self.root / 'users/guest-visitor').exists())
        self.assertEqual(len(p.post_documents(self.root)), 2)
        p.sync_users(self.root)
        self.assertTrue((self.root / 'assets/avatars/guest-visitor.webp').exists())
        p.write(reply.with_name('reply-01.en.md'), 'Is it this spot?')
        self.assertEqual(len(p.post_documents(self.root)), 2)
        self.assertEqual(p.build(self.root)[0]['blocks']['en'][0]['text'], 'Is it this spot?')

    def test_reply_parent_and_media_cannot_leave_original_thread(self):
        main = self.post('root')
        reply = main.parent / 'replies/reply-01.md'
        p.write(reply, p.document({'id': 'reply-01', 'username': 'gecko7', 'name': '叶背',
                                  'date': '2026-11-01T11:00:00+08:00', 'reply_to': 'root'}, '太早。'))
        with self.assertRaisesRegex(ValueError, '早于父帖'):
            p.build(self.root)
        p.write(reply, p.document({'id': 'reply-01', 'username': 'gecko7', 'name': '叶背',
                                  'date': '2026-11-01T12:01:00+08:00', 'reply_to': 'root'},
                                 '![外部图](../../other/media/photo.webp)'))
        with self.assertRaisesRegex(ValueError, '不能离开所属根串'):
            p.build(self.root)

    def test_unfinished_batch_cannot_build_a_partial_feed(self):
        p.write(self.root / '.publishing/update-pending.json', '{}')
        with self.assertRaisesRegex(ValueError, '尚未完成归档'):
            p.build(self.root)
        self.assertFalse((self.root / 'data/feed.mjs').exists())

    def test_export_and_manual_import_share_the_ai_archive_lock(self):
        self.post()
        original = p.sync_users
        def check_lock(root):
            with self.assertRaisesRegex(ValueError, '正在归档或构建'):
                with p.content_lock(root):
                    self.fail('Exporter released its archive lock before reading content')
            return original(root)
        with patch.object(p, 'sync_users', side_effect=check_lock):
            self.assertEqual(len(p.build(self.root)), 1)
        with p.content_lock(self.root):
            with self.assertRaisesRegex(ValueError, '正在归档或构建'):
                p.build(self.root)
            with self.assertRaisesRegex(ValueError, '正在归档或构建'):
                p.ingest(self.root, 'local')


if __name__ == '__main__':
    unittest.main()
