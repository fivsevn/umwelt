import copy
import importlib.util
from io import BytesIO
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
from urllib.parse import urlsplit

from PIL import Image

TOOLS = Path(__file__).parents[1] / 'tools'
sys.path.insert(0, str(TOOLS))
spec = importlib.util.spec_from_file_location('gsm_update', TOOLS / 'update.py')
u = importlib.util.module_from_spec(spec)
spec.loader.exec_module(u)
p = u.p
NOW = '2026-11-09T12:00:00+08:00'


class AIUpdates(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.base = Path(self.directory.name)
        self.root = self.base / 'repo/gsm'
        self.work = self.base / 'work'
        self.root.mkdir(parents=True)
        p.write(self.root / 'publication.json', p.json_text(u.DEFAULT_POLICY))
        p.write(self.root / 'users/README.md', '# 用户\n\n<!-- users:start -->\n<!-- users:end -->\n')
        for key in ['alpha', 'beta', 'gamma', 'delta', 'human']:
            self.user(key, scope='作者保留' if key == 'human' else '日常')
        p.write(self.root / 'docs/README.md', '# 更新入口\n全部阅读。\n')
        p.write(self.root / 'environment/README.md', '# 共同环境\n仍是守宫。\n')
        self.old = self.root / 'posts/2026/11/legacy-root/index.md'
        p.write(self.old, p.document({'id': 'legacy-root', 'date': '2026-11-08T12:00:00+08:00',
                                      'username': 'human', 'name': 'human', 'status': 'published',
                                      'likes': 13, 'source_event': 'original'}, '原帖正文保持不变。'))
        self.old_bytes = self.old.read_bytes()
        self.seed = next('seed-' + str(i) for i in range(1000)
                         if 1 + int(u.random_for('seed-' + str(i))() * 10) >= 4)
        subprocess.run(['git', 'init', '-q', str(self.root.parent)], check=True)

    def user(self, key, scope='日常', active='是', weight=1, posts='是', replies='是'):
        rows = {'稳定 ID': key, '用户名': key, '网名': key, '公开简介': '', '头像原图': '',
                '启用账号': active, '可随机分配': '是', 'AI 使用范围': scope,
                '允许发主帖': posts, '允许回复': replies, '抽取权重': weight, '上线时间范围': '傍晚'}
        text = '# ' + key + '\n\n## 账号与开关\n\n| 属性 | 内容 |\n| --- | --- |\n'
        text += ''.join(f'| {label} | {value} |\n' for label, value in rows.items())
        text += '\n## 生活与表达\n\n有自己的守宫生活。\n'
        p.write(self.root / 'users' / key / 'profile.md', text)

    def prepare(self, **kwargs):
        return u.prepare(self.root, self.work, now=NOW, entropy=lambda: self.seed, **kwargs)

    def load(self):
        return json.loads((self.work / 'operation.json').read_text())

    def store(self, operation):
        u.save(self.work / 'operation.json', operation)

    def research(self):
        return [{'category': category, 'kind': 'thread' if i == 2 else 'feed',
                 'url': 'https://' + ('source-a.example' if i < 2 else 'source-b.example') + '/' + str(i),
                 'visitedAt': '2026-11-09T11:00:00+08:00',
                 'publishedAt': '2026-11-08T11:00:00+08:00' if i == 0 else None,
                 'summary': '实际读到正文与回复，参考具体经历。'}
                for i, category in enumerate(['news', 'trend', 'daily'])]

    def post(self, ident, author='guest-one', parent=None, at='2026-11-09T11:30:00+08:00'):
        post = {'id': ident, 'author': author, 'createdAt': at, 'replyTo': parent,
                'text': ident + '：刚才在叶子下面停了一会儿。', 'likes': 2,
                'canon': 'derivative', 'media': []}
        if author.startswith('guest-'):
            post['guest'] = {'name': '路过的' + author, 'bio': '顺路看看。'}
        return post

    def fill(self, posts):
        operation = self.load()
        operation['posts'] = posts
        operation['research'] = self.research()
        index = u.post_index(posts, u.source(self.root, operation['id'])['history'])
        targets = u.presentation(operation['plan']['seed'], posts)['imagePostIds']
        for post in posts:
            if post['id'] in targets:
                folder = u.thread_folder(self.root, u.thread_root(post['id'], index))
                image = folder / 'media' / (post['id'] + '.png')
                data = BytesIO()
                Image.new('RGB', (4, 5), '#80a040').save(data, format='PNG')
                p.write(image, data.getvalue())
                post['media'] = [{'src': image.relative_to(self.root).as_posix(), 'alt': '叶子下的停留位置'}]
        self.store(operation)
        return operation

    def online(self, feed=None):
        feed = (self.root / 'data/feed.mjs').read_bytes() if feed is None else feed
        def fetch(url):
            path = urlsplit(url).path
            return feed if path.endswith('/data/feed.mjs') else (self.root / path.removeprefix('/gsm/')).read_bytes()
        return fetch

    def valid(self, operation=None, **kwargs):
        operation = operation or self.load()
        return u.validate_update(self.root, operation, u.source(self.root, operation['id']), u.clock(NOW), **kwargs)

    def test_prepare_full_reading_and_resume_freezes_plan(self):
        first = self.prepare()
        operation = self.load()
        self.assertEqual(len(first['selectedIds']), 3)
        self.assertNotIn('human', first['selectedIds'])
        text = (self.work / 'reading.md').read_text()
        for path in ['users/alpha/profile.md', 'users/human/profile.md', 'environment/README.md', 'docs/README.md', 'posts/2026/11/legacy-root/index.md']:
            self.assertIn(path, text)
        operation['research'] = self.research()
        self.store(operation)
        with patch.object(u.secrets, 'token_hex', side_effect=AssertionError('redraw')):
            second = u.prepare(self.root, self.work, now=NOW)
        self.assertEqual(second['status'], 'resumed')
        self.assertEqual(self.load()['plan'], operation['plan'])
        self.assertEqual(self.load()['research'], operation['research'])
        self.assertEqual(self.old.read_bytes(), self.old_bytes)
        with self.assertRaises(ValueError):
            u.prepare(self.root, self.work, requested_count=2, now=NOW)

    def test_reading_contains_only_current_controls_and_all_environment_and_users(self):
        self.prepare()
        before = self.load()['sourceDigest']
        for relative in ['docs/ai-updates.md', 'docs/history/old-rules.md', 'docs/research/observations.md']:
            p.write(self.root / relative, '# 旧规则与研究记录，不作为当前要求。')
        self.prepare()
        self.assertEqual(self.load()['sourceDigest'], before)
        reading = (self.work / 'reading.md').read_text()
        self.assertNotIn('旧规则与研究记录', reading)
        for relative in ['docs/writing.md', 'docs/publishing.md', 'environment/new-factor.md', 'users/alpha/experience.md']:
            p.write(self.root / relative, '# 新的当前资料。')
        self.prepare()
        reading = (self.work / 'reading.md').read_text()
        for relative in ['docs/writing.md', 'docs/publishing.md', 'environment/new-factor.md', 'users/alpha/experience.md']:
            self.assertIn(relative, reading)

    def test_default_draw_endpoints_and_recent_weight_reduction(self):
        users = {key: {'name': key, 'ai_scope': '日常', 'weight': 1} for key in ['aa', 'bb', 'cc', 'dd']}
        history = {'past': {'author': 'aa', 'createdAt': NOW}}
        with patch.object(u, 'random_for', return_value=iter([0.0, .20, 0, 0]).__next__):
            plan = u.draw_plan(users, history, 'seed', u.DEFAULT_POLICY)
        self.assertEqual(plan['budget'], 1)
        self.assertEqual(plan['selectedIds'][0], 'bb')  # aa has half the mass of each other user.
        with patch.object(u, 'random_for', return_value=iter([.999999, 0, 0, 0]).__next__):
            self.assertEqual(u.draw_plan(users, {}, 'seed', u.DEFAULT_POLICY)['budget'], 10)
        self.assertEqual(len(set(plan['selectedIds'])), 3)

    def test_permissions_zero_weight_and_explicit_total_limit(self):
        self.user('beta', active='否')
        self.user('gamma', weight=0)
        self.prepare(requested_count=1)
        operation = self.load()
        self.assertEqual(operation['plan']['totalBudget'], 1)
        self.assertEqual(set(operation['plan']['selectedIds']), {'alpha', 'delta'})
        self.assertGreaterEqual(operation['plan']['budget'], 1)
        self.fill([self.post('one-root'), self.post('two-root', author='guest-two')])
        with self.assertRaisesRegex(ValueError, 'budget'):
            self.valid()

    def test_tampering_with_saved_budget_or_candidates_is_rejected(self):
        self.prepare()
        operation = self.load()
        operation['plan']['budget'] = 1 if operation['plan']['budget'] != 1 else 2
        self.store(operation)
        with self.assertRaisesRegex(ValueError, 'saved draw'):
            u.suggest(self.root, self.work)

    def test_source_change_requires_prepare_without_redrawing(self):
        self.prepare()
        operation = self.fill([self.post('one-root')])
        p.write(self.root / 'environment/extra.md', '# 新环境\n新内容。')
        with self.assertRaisesRegex(ValueError, 'Source material changed'):
            self.valid()
        plan = operation['plan']
        self.prepare()
        self.assertEqual(self.load()['plan'], plan)
        self.assertIn('environment/extra.md', (self.work / 'reading.md').read_text())
        self.valid()

    def test_disabled_publication_stops_prepare_and_import(self):
        self.prepare()
        self.fill([self.post('one-root')])
        policy = copy.deepcopy(u.DEFAULT_POLICY)
        policy['automaticPosting'] = False
        p.write(self.root / 'publication.json', p.json_text(policy))
        for call in [self.prepare, lambda: u.ingest(self.root, self.work, reviewed=True, now=NOW)]:
            with self.assertRaisesRegex(ValueError, 'disabled'):
                call()
        self.assertFalse((self.root / '.publishing/update-pending.json').exists())

    def test_replies_use_root_of_nested_parent_and_stable_independent_lottery(self):
        self.prepare()
        operation = self.load()
        operation['posts'] = [self.post('new-root'), self.post('nested-one', parent='new-root'),
                              self.post('nested-two', parent='nested-one')]
        self.store(operation)
        before = (self.work / 'operation.json').read_bytes()
        first = u.replies(self.root, self.work, ['legacy-root'])
        self.assertEqual(first, u.replies(self.root, self.work, ['legacy-root']))
        self.assertEqual({entry['rootId'] for entry in first['threads']}, {'new-root', 'legacy-root'})
        self.assertEqual((self.work / 'operation.json').read_bytes(), before)
        for i in range(100):
            count = u.reply_count('seed-' + str(i), 'legacy-root', u.DEFAULT_POLICY['replyLottery'])
            self.assertTrue(0 <= count <= 10 or 21 <= count <= 60)
        with patch.object(u, 'random_for', return_value=iter([.9, 0]).__next__):
            self.assertEqual(u.reply_count('s', 'r', u.DEFAULT_POLICY['replyLottery']), 21)
        with patch.object(u, 'random_for', return_value=iter([.899, .999999]).__next__):
            self.assertEqual(u.reply_count('s', 'r', u.DEFAULT_POLICY['replyLottery']), 10)

    def test_reply_cycle_missing_parent_and_budget_are_rejected(self):
        self.prepare()
        operation = self.load()
        operation['posts'] = [self.post('cycle-one', parent='cycle-two'), self.post('cycle-two', parent='cycle-one')]
        self.store(operation)
        with self.assertRaisesRegex(ValueError, 'cycle'):
            u.replies(self.root, self.work)
        operation['posts'] = [self.post('missing-one', parent='missing-parent')]
        self.store(operation)
        with self.assertRaisesRegex(ValueError, 'Missing reply parent'):
            u.replies(self.root, self.work)
        operation = self.fill([self.post('one-reply', parent='legacy-root')])
        with patch.object(u, 'reply_count', return_value=0):
            with self.assertRaisesRegex(ValueError, 'reply allowance'):
                self.valid(operation)

    def test_suggestions_are_stable_half_rounded_up_and_read_only(self):
        self.prepare()
        operation = self.load()
        operation['posts'] = [self.post('post-' + str(i), author='guest-' + str(i)) for i in range(5)]
        self.store(operation)
        before = (self.work / 'operation.json').read_bytes()
        first = u.suggest(self.root, self.work)
        self.assertEqual(first, u.suggest(self.root, self.work))
        self.assertEqual(len(first['imagePostIds']), 3)
        self.assertEqual(len(set(first['imagePostIds'])), 3)
        self.assertEqual(len(first['likes']), 5)
        self.assertEqual((self.work / 'operation.json').read_bytes(), before)

    def test_guest_majority_and_selected_role_permissions(self):
        self.prepare()
        selected = self.load()['plan']['selectedIds']
        operation = self.fill([self.post('one-root', author=selected[0])])
        with self.assertRaisesRegex(ValueError, 'At least half'):
            self.valid(operation)
        operation = self.fill([self.post('one-root', author=selected[0]), self.post('two-root', author='guest-two')])
        self.valid(operation)
        operation['posts'][0]['author'] = 'human'
        with self.assertRaisesRegex(ValueError, 'eligible'):
            self.valid(operation)
        unselected = next(key for key in ['alpha', 'beta', 'gamma', 'delta'] if key not in selected)
        operation['posts'][0]['author'] = unselected
        with self.assertRaisesRegex(ValueError, 'eligible'):
            self.valid(operation)

    def test_duplicate_text_normalizes_width_and_whitespace_and_ignores_different_images(self):
        self.prepare()
        posts = [self.post('duplicate-one'), self.post('duplicate-two')]
        posts[0]['text'] = '　ＡＢＣ\n   枝头　停一下。'
        posts[1]['text'] = 'ABC  枝头 停一下。'
        operation = self.fill(posts)
        for i, post in enumerate(operation['posts']):
            folder = u.thread_folder(self.root, post)
            image = folder / 'media' / ('different-' + str(i) + '.png')
            data = BytesIO()
            Image.new('RGB', (4, 5), 'red' if i == 0 else 'blue').save(data, format='PNG')
            p.write(image, data.getvalue())
            post['media'] = [{'src': image.relative_to(self.root).as_posix(), 'alt': '不同的图片'}]
        self.assertNotEqual(operation['posts'][0]['media'], operation['posts'][1]['media'])
        self.store(operation)
        with self.assertRaisesRegex(ValueError, 'Duplicate content'):
            self.valid(operation)

    def test_history_text_repost_by_same_guest_is_rejected_but_new_parent_is_allowed(self):
        second_root = self.root / 'posts/2026/11/other-root/index.md'
        p.write(second_root, p.document({'id': 'other-root', 'date': '2026-11-08T13:00:00+08:00',
                                         'username': 'human', 'name': 'human', 'likes': 0}, '另一个独立的话题。'))
        self.seed = next('history-seed-' + str(i) for i in range(1000)
                         if u.reply_count('history-seed-' + str(i), 'legacy-root', u.DEFAULT_POLICY['replyLottery']) > 0)
        self.prepare()
        old = self.post('old-guest-reply', parent='legacy-root')
        old['text'] = '  ＯＫ\n  就在这儿。'
        self.fill([old])
        u.ingest(self.root, self.work, reviewed=True, now=NOW)
        archived = self.old.parent / 'replies/old-guest-reply.md'
        archived_bytes = archived.read_bytes()
        self.assertIn('![', archived.read_text())
        u.finish(self.root, self.work, now=NOW, fetch=self.online())
        self.seed = next('new-history-seed-' + str(i) for i in range(1000)
                         if all(u.reply_count('new-history-seed-' + str(i), ident, u.DEFAULT_POLICY['replyLottery']) > 0
                                for ident in ['legacy-root', 'other-root']))
        self.prepare()
        new = self.post('new-guest-reply', parent='legacy-root', at='2026-11-09T11:45:00+08:00')
        new['text'] = 'OK 就在这儿。'
        operation = self.fill([new])
        with self.assertRaisesRegex(ValueError, 'Duplicate content'):
            self.valid(operation)
        new['replyTo'] = 'other-root'
        operation = self.fill([new])
        self.valid(operation)
        self.assertEqual(archived.read_bytes(), archived_bytes)
        self.assertEqual(self.old.read_bytes(), self.old_bytes)

    def test_guest_identity_conflicts_and_media_targets(self):
        self.prepare()
        operation = self.fill([self.post('one-root')])
        operation['posts'][0]['guest']['name'] = 'human'
        with self.assertRaisesRegex(ValueError, 'impersonates'):
            self.valid(operation)
        operation = self.load()
        operation['posts'][0]['media'] = []
        with self.assertRaisesRegex(ValueError, 'image targets'):
            self.valid(operation)

    def test_research_requires_real_scope_domains_thread_recent_and_fresh_visits(self):
        good = self.research()
        u.validate_research(good, u.clock(NOW), {'one-root'})
        changes = [lambda entries: entries.pop(),
                   lambda entries: entries[2].update(url='https://source-a.example/2'),
                   lambda entries: entries[2].update(kind='feed'),
                   lambda entries: entries[0].update(publishedAt=None),
                   lambda entries: entries[0].update(visitedAt='2026-11-06T12:00:00+08:00'),
                   lambda entries: entries[2].update(url=entries[0]['url']),
                   lambda entries: entries[0].update(adaptedPostIds=['other-post'])]
        for change in changes:
            entries = copy.deepcopy(good)
            change(entries)
            with self.subTest(entries=entries):
                with self.assertRaises(ValueError):
                    u.validate_research(entries, u.clock(NOW), {'one-root'})

    def test_real_import_guest_reply_images_retry_and_finish_preserve_history(self):
        self.prepare()
        # Select an old root whose independent reply allowance permits a reply.
        while u.reply_count(self.seed, 'legacy-root', u.DEFAULT_POLICY['replyLottery']) == 0:
            self.seed += 'x'
            (self.work / 'operation.json').unlink()
            self.prepare()
        selected = self.load()['plan']['selectedIds'][0]
        operation = self.fill([self.post('new-root', author=selected), self.post('guest-reply', parent='legacy-root')])
        with self.assertRaisesRegex(ValueError, 'reviewed'):
            u.ingest(self.root, self.work, now=NOW)
        originals = [self.root / media['src'] for post in operation['posts'] for media in post['media']]
        result = u.ingest(self.root, self.work, reviewed=True, now=NOW)
        self.assertTrue(all(not image.exists() for image in originals))
        self.assertTrue(all(media['src'].endswith('.webp') and (self.root / media['src']).is_file()
                            for post in self.load()['posts'] for media in post['media']))
        self.assertEqual(result['count'], 2)
        self.assertTrue((self.old.parent / 'replies/guest-reply.md').is_file())
        self.assertFalse((self.root / 'users/guest-one').exists())
        profiles, posts = u.feed_values((self.root / 'data/feed.mjs').read_text())
        reply = next(post for post in posts if post['id'] == 'guest-reply')
        self.assertEqual(reply['replyTo'], 'legacy-root')
        self.assertEqual(profiles['guest-one']['name'], '路过的guest-one')
        self.assertEqual(self.old.read_bytes(), self.old_bytes)
        count = len(p.post_documents(self.root))
        self.assertEqual(u.ingest(self.root, self.work, reviewed=True, now=NOW)['status'], 'already-archived')
        self.assertEqual(len(p.post_documents(self.root)), count)
        feed = (self.root / 'data/feed.mjs').read_bytes()
        self.assertEqual(u.finish(self.root, self.work, now=NOW, fetch=self.online(feed))['status'], 'published')
        self.assertFalse((self.work / 'operation.json').exists())
        self.assertFalse((self.work / 'reading.md').exists())
        self.assertEqual(self.old.read_bytes(), self.old_bytes)

    def test_image_normalization_recovers_after_archive_before_build_failure(self):
        self.prepare()
        operation = self.fill([self.post('new-root')])
        original = self.root / operation['posts'][0]['media'][0]['src']
        with patch.object(p, '_build_unlocked', side_effect=OSError('build interrupted')):
            with self.assertRaisesRegex(OSError, 'build interrupted'):
                u.ingest(self.root, self.work, reviewed=True, now=NOW)
        self.assertTrue(original.is_file())
        normalized = self.load()['posts'][0]['media'][0]['src']
        self.assertTrue(normalized.endswith('.webp'))
        self.assertTrue((self.root / normalized).is_file())
        self.assertEqual(u.ingest(self.root, self.work, reviewed=True, now=NOW)['status'], 'already-archived')
        self.assertFalse(original.exists())
        self.assertEqual(u.finish(self.root, self.work, now=NOW, fetch=self.online())['status'], 'published')
        self.assertEqual([path.name for path in self.work.iterdir()], ['.update.lock'])

    def test_completed_receipt_recovers_only_its_matching_pending_journal(self):
        self.prepare()
        operation = self.fill([self.post('new-root')])
        u.ingest(self.root, self.work, reviewed=True, now=NOW)
        receipt = json.loads(u.receipt_path(self.root, operation).read_text())
        pending = self.root / '.publishing/update-pending.json'
        # This is the exact disk state after receipt save and before pending unlink.
        u.save(pending, receipt)
        self.assertEqual(u.ingest(self.root, self.work, reviewed=True, now=NOW)['status'], 'already-archived')
        self.assertFalse(pending.exists())
        other = copy.deepcopy(receipt)
        other['id'] = 'another-operation'
        u.save(pending, other)
        with self.assertRaisesRegex(ValueError, 'does not match'):
            u.ingest(self.root, self.work, reviewed=True, now=NOW)
        self.assertEqual(json.loads(pending.read_text()), other)
        self.assertEqual(self.old.read_bytes(), self.old_bytes)

    def stamped_feed(self):
        profiles, posts = u.feed_values((self.root / 'data/feed.mjs').read_text())
        stamp = 'e' * 40
        for profile in profiles.values():
            profile['avatarImage'] = profile['avatarImage'].split('?')[0] + '?v=' + stamp
        for post in posts:
            for blocks in post['blocks'].values():
                for block in blocks:
                    if block['type'] == 'image':
                        block['src'] = block['src'].split('?')[0] + '?v=' + stamp
        return 'export const profiles = ' + p.json_text(profiles).strip() + ';\nexport const posts = ' + p.json_text(posts).strip() + ';\n'

    def test_finish_accepts_deployment_versions_and_fetches_stamped_images_and_avatars(self):
        self.prepare()
        self.fill([self.post('new-root')])
        u.ingest(self.root, self.work, reviewed=True, now=NOW)
        feed = self.stamped_feed()
        online = self.online(feed)
        urls = []
        def fetch(url):
            urls.append(url)
            return online(url)
        self.assertEqual(u.finish(self.root, self.work, now=NOW, fetch=fetch)['status'], 'published')
        self.assertTrue(any('/posts/' in url and 'v=' + 'e' * 40 in url for url in urls))
        self.assertTrue(any('/avatars/' in url and 'v=' + 'e' * 40 in url for url in urls))
        self.assertEqual(u.asset_identity('/gsm/a.webp?x=1&v=first#here'), '/gsm/a.webp?x=1#here')
        self.assertNotEqual(u.asset_identity('/gsm/a.webp?x=1&v=first'), u.asset_identity('/gsm/a.webp?x=2&v=second'))
        self.assertEqual(u.asset_identity('https://outside.example/a.webp?v=first'), 'https://outside.example/a.webp?v=first')

    def test_finish_rejects_changed_media_avatar_content_and_other_query_parameters(self):
        self.prepare()
        self.fill([self.post('new-root')])
        u.ingest(self.root, self.work, reviewed=True, now=NOW)
        feed = self.stamped_feed()
        online = self.online(feed)
        for marker in ['/posts/', '/avatars/']:
            def fetch(url, marker=marker):
                return b'changed image bytes' if marker in url else online(url)
            with self.subTest(marker=marker):
                with self.assertRaisesRegex(ValueError, 'Online image'):
                    u.finish(self.root, self.work, now=NOW, fetch=fetch)
                self.assertTrue((self.work / 'operation.json').exists())
        with self.assertRaisesRegex(ValueError, 'Online content'):
            u.finish(self.root, self.work, now=NOW, fetch=self.online(feed.replace('?v=', '?different=1&v=')))
        self.assertEqual(u.finish(self.root, self.work, now=NOW, fetch=online)['status'], 'published')

    def test_partial_import_recovery_and_cancel_never_remove_changed_files(self):
        self.prepare()
        self.fill([self.post('new-root')])
        original_write = u.archive_write
        calls = []
        def fail_once(root, relative, content):
            calls.append(relative)
            if len(calls) == 2:
                raise OSError('interrupted')
            original_write(root, relative, content)
        with patch.object(u, 'archive_write', side_effect=fail_once):
            with self.assertRaisesRegex(OSError, 'interrupted'):
                u.ingest(self.root, self.work, reviewed=True, now=NOW)
        self.assertTrue((self.root / '.publishing/update-pending.json').exists())
        with self.assertRaisesRegex(ValueError, 'AI 批次'):
            p.build(self.root)
        self.assertEqual(u.ingest(self.root, self.work, reviewed=True, now=NOW)['status'], 'archived')
        self.assertFalse((self.root / '.publishing/update-pending.json').exists())
        self.assertEqual(self.old.read_bytes(), self.old_bytes)

    def test_cancel_preserves_draw_and_observations_and_checks_all_files_before_delete(self):
        self.prepare()
        operation = self.fill([self.post('new-root')])
        original_write = u.archive_write
        def fail_on_document(root, relative, content):
            if relative.endswith('.md'):
                raise OSError('interrupted')
            original_write(root, relative, content)
        with patch.object(u, 'archive_write', side_effect=fail_on_document):
            with self.assertRaises(OSError):
                u.ingest(self.root, self.work, reviewed=True, now=NOW)
        pending = self.root / '.publishing/update-pending.json'
        journal = json.loads(pending.read_text())
        output = self.root / next(item['path'] for item in journal['files'] if item['path'].endswith('.webp'))
        original = output.read_bytes()
        output.write_bytes(b'changed externally')
        with self.assertRaisesRegex(ValueError, 'changed'):
            u.cancel(self.root, self.work, now=NOW)
        self.assertTrue(pending.exists())
        output.write_bytes(original)
        result = u.cancel(self.root, self.work, now=NOW)
        self.assertEqual(result['status'], 'cancelled')
        self.assertFalse(output.exists())
        self.assertEqual(self.load()['plan'], operation['plan'])
        self.assertEqual(self.load()['research'], operation['research'])
        self.assertEqual(self.load()['posts'], [])
        self.assertEqual(self.old.read_bytes(), self.old_bytes)

    def test_failed_online_verification_keeps_work_and_exact_content_is_required(self):
        self.prepare()
        self.fill([self.post('new-root')])
        u.ingest(self.root, self.work, reviewed=True, now=NOW)
        feed = (self.root / 'data/feed.mjs').read_text()
        with self.assertRaisesRegex(ValueError, 'Online content'):
            u.finish(self.root, self.work, now=NOW, fetch=self.online(feed.replace('刚才', '改了')))
        self.assertTrue((self.work / 'operation.json').exists())
        self.assertEqual(self.load()['status'], 'awaiting-online')
        self.assertEqual(u.finish(self.root, self.work, now=NOW, fetch=self.online(feed))['status'], 'published')

    def test_finish_does_not_overwrite_drafts_edited_during_local_feed_decode(self):
        self.prepare()
        self.fill([self.post('new-root')])
        u.ingest(self.root, self.work, reviewed=True, now=NOW)
        original_decode = u.feed_values
        edited = []
        def decode(text):
            operation = self.load()
            operation['posts'][0]['text'] = '编辑者刚写的新稿，不应被旧快照覆盖。'
            self.store(operation)
            edited.append((self.work / 'operation.json').read_bytes())
            return original_decode(text)
        with patch.object(u, 'feed_values', side_effect=decode):
            with self.assertRaisesRegex(ValueError, 'changed during verification'):
                u.finish(self.root, self.work, now=NOW, fetch=self.online())
        self.assertEqual((self.work / 'operation.json').read_bytes(), edited[0])
        self.assertTrue((self.work / 'reading.md').exists())
        self.assertEqual(self.load()['status'], 'prepared')

    def test_finish_keeps_reading_edited_before_status_save_or_during_online_check(self):
        self.prepare()
        self.fill([self.post('new-root')])
        u.ingest(self.root, self.work, reviewed=True, now=NOW)
        reading = self.work / 'reading.md'
        original = reading.read_bytes()
        original_decode = u.feed_values
        def decode(text):
            reading.write_text('编辑者新加的阅读笔记。')
            return original_decode(text)
        with patch.object(u, 'feed_values', side_effect=decode):
            with self.assertRaisesRegex(ValueError, 'changed during verification'):
                u.finish(self.root, self.work, now=NOW, fetch=self.online())
        self.assertEqual(reading.read_text(), '编辑者新加的阅读笔记。')
        self.assertEqual(self.load()['status'], 'prepared')
        reading.write_bytes(original)
        online = self.online()
        def fetch(url):
            reading.write_text('核验期间新加的笔记。')
            return online(url)
        with self.assertRaisesRegex(ValueError, 'changed during verification'):
            u.finish(self.root, self.work, now=NOW, fetch=fetch)
        self.assertEqual(reading.read_text(), '核验期间新加的笔记。')
        self.assertTrue((self.work / 'operation.json').exists())

    def test_zero_post_finish_needs_no_images_and_does_not_publish(self):
        self.prepare()
        with patch.object(u, 'fetch_bytes', side_effect=AssertionError('no remote check')):
            self.assertEqual(u.finish(self.root, self.work, now=NOW)['status'], 'no-posts')
        self.assertEqual(p.post_documents(self.root), [self.old])
        self.assertEqual(self.old.read_bytes(), self.old_bytes)

    def test_lock_and_repository_work_path_are_rejected(self):
        self.prepare()
        with u.locked(self.work / '.update.lock'):
            with self.assertRaisesRegex(ValueError, 'busy'):
                u.prepare(self.root, self.work, now=NOW)
        with self.assertRaisesRegex(ValueError, 'outside'):
            u.prepare(self.root, self.root / 'work', now=NOW)


if __name__ == '__main__':
    unittest.main()
