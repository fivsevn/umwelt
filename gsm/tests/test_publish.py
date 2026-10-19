import importlib.util
import json
import subprocess
import tempfile
import unittest
from io import BytesIO
from pathlib import Path

from PIL import Image

spec = importlib.util.spec_from_file_location('publish', Path(__file__).parents[1] / 'tools/publish.py')
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)


def picture(fmt='PNG', color='red'):
    out = BytesIO()
    Image.new('RGB', (17, 9), color).save(out, format=fmt)
    return out.getvalue()


class Publishing(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.repo = Path(self.temp.name)
        self.root = self.repo / 'gsm'
        self.root.mkdir()
        self.state = {'last_digest': None}

    def tearDown(self):
        self.temp.cleanup()

    def trigger(self, body='你好。', **meta):
        return p.document({'username': 'gecko7', 'name': '叶背', 'status': 'published', **meta}, body)

    def publish(self, text, event='one'):
        return p.import_trigger(self.root, text, lambda name: p.local_path(self.root, name).read_bytes(), '2026-10-19T12:00:00+08:00', event, self.state)

    def commit(self, message):
        p.git(self.repo, 'add', '.')
        p.git(self.repo, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', message)

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
        p.write(self.root / 'characters/gecko7.json', p.json_text({'name':'新昵称','avatar_source':'art/photo.png','avatar_pixels':32}))
        p.write(self.root / 'art/photo.png', picture())
        p.build(self.root)
        self.assertIn('新昵称', (self.root / 'data/feed.mjs').read_text())
        with Image.open(self.root / 'assets/avatars/gecko7.webp') as check:
            self.assertEqual(check.size, (32,32))
            self.assertEqual(check.format, 'WEBP')

    def test_username_path_date_and_duplicate_id_validation(self):
        for username in ['a.b', 'a_b', '@abc', '中文', 'a-b', 'a b', '']:
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
