import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).parents[1] / 'tools'))
import narrative_likes as n
import publish as p

CONTEXT = {'reach': 'ordinary', 'resonance': 'everyday', 'relationship': 'none',
           'attention': 'steady', 'reason': '普通生活细节可被偶遇读者理解；没有已知往返，注意力平稳。'}
DATE = '2026-11-01T12:00:00+08:00'
LATER = '2026-11-05T12:00:00+08:00'


class Model(unittest.TestCase):
    def entry(self, seed, context=CONTEXT, floor=0):
        return {'source': {'date': DATE}, 'seed': f'{seed:032x}', 'assessment': context, 'floor': floor}

    def test_bounded_monotone_and_settled_even_years_later(self):
        for seed in range(100):
            entry = self.entry(seed)
            counts = [n.count_at(entry, at) for at in [DATE, '2026-11-01T18:00:00+08:00',
                       '2026-11-02T12:00:00+08:00', '2026-11-04T12:00:00+08:00', '2030-01-01T00:00:00+08:00']]
            self.assertEqual(counts, sorted(counts))
            self.assertEqual(counts[-1], counts[-2])
            self.assertLessEqual(counts[-1], 18)

    def test_differences_and_zeros_without_uniform_quota(self):
        counts = [n.count_at(self.entry(seed), LATER) for seed in range(500)]
        self.assertIn(0, counts)
        self.assertGreater(len(set(counts)), 8)
        self.assertGreater(sum(value > 0 for value in counts), 350)
        self.assertLess(sum(value > 0 for value in counts), 490)

    def test_context_changes_opportunities_not_identity_or_post_length(self):
        def total(**changes):
            context = {**CONTEXT, **changes}
            return sum(n.count_at(self.entry(seed, context), LATER) for seed in range(100))
        ordinary = total()
        self.assertLess(total(reach='quiet'), ordinary)
        self.assertGreater(total(reach='broad'), ordinary)
        self.assertLess(total(resonance='low'), ordinary)
        self.assertGreater(total(relationship='exchange'), ordinary)
        self.assertLess(total(attention='busy'), ordinary)

    def test_existing_likes_are_a_floor_not_an_additive_growth_baseline(self):
        entry = self.entry(1, floor=94)
        self.assertEqual(n.count_at(entry, LATER), 94)
        with self.assertRaises(ValueError):
            n.count_at(entry, '2026-11-01T11:59:59+08:00')

    def test_explicit_context_seed_and_timezone_required(self):
        for context in [{}, {**CONTEXT, 'reason': ''}, {**CONTEXT, 'reach': 'viral'}, {**CONTEXT, 'extra': 1}]:
            with self.assertRaises(ValueError):
                n.schedule('0' * 32, context)
        with self.assertRaises(ValueError):
            n.schedule('redraw', CONTEXT)
        with self.assertRaises(ValueError):
            n.timestamp('2026-11-01T12:00:00')


class Workflow(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()
        self.path = self.root / 'trigger.md'
        self.text = p.document({'username': 'gecko7', 'name': '叶背', 'date': DATE,
                                'status': 'published', 'likes': 0}, '今天绕了一小段路。')
        p.write(self.path, self.text)
        self.plan = [{'path': 'trigger.md', 'assessment': CONTEXT}]
        self.record = self.root / 'docs/narrative-likes.json'

    def tearDown(self):
        self.temp.cleanup()

    def apply(self, plan=None, at=LATER):
        return n.apply(self.root, self.plan if plan is None else plan, at, seed_factory=lambda: f'{1:032x}')

    def test_only_likes_changes_and_retries_do_not_redraw(self):
        result = self.apply()
        value = result[0]['likes']
        self.assertGreater(value, 0)
        self.assertEqual(self.path.read_text(), self.text.replace('likes: 0', f'likes: {value}'))
        with patch.object(n.secrets, 'token_hex', side_effect=AssertionError('redraw')):
            self.apply()
        after = self.record.read_bytes()
        self.apply()
        self.assertEqual(self.record.read_bytes(), after)
        self.assertEqual(len(json.loads(after)['entries']), 1)

    def test_archiving_and_builds_preserve_value_then_later_age_uses_same_seed(self):
        self.apply(at=DATE)
        registry = '# Users\n<!-- users:start -->\n| gecko7 | 叶背 | 是 | 否 | | |\n<!-- users:end -->\n'
        p.write(self.root / 'users/README.md', registry)
        p.sync_users(self.root)
        folder = p.import_trigger(self.root, self.path.read_text(), lambda _: b'', DATE, 'test:event', {})
        old = p.split((folder / 'index.md').read_text())[0]['likes']
        self.assertEqual(p.build(self.root)[0]['likes'], old)
        self.assertEqual(p.build(self.root)[0]['likes'], old)
        result = self.apply([{'path': str((folder / 'index.md').relative_to(self.root))}])
        self.assertGreaterEqual(result[0]['likes'], old)
        self.assertEqual(len(json.loads(self.record.read_text())['entries']), 1)
        self.assertEqual(p.build(self.root)[0]['likes'], result[0]['likes'])
        self.assertEqual(len(list((self.root / 'posts').glob('**/index.md'))), 1)

    def test_no_retuning_backward_time_or_overwriting_manual_likes(self):
        self.apply()
        for plan, at in [([{'path': 'trigger.md', 'assessment': {**CONTEXT, 'reach': 'broad'}}], LATER),
                         (self.plan, DATE)]:
            with self.assertRaises(ValueError):
                self.apply(plan, at)
        p.write(self.path, n.replace_likes(self.path.read_text(), 99))
        with self.assertRaises(ValueError):
            self.apply()
        self.assertEqual(p.split(self.path.read_text())[0]['likes'], 99)

    def test_whole_plan_validated_before_receipt_or_posts_change(self):
        with self.assertRaises(ValueError):
            self.apply(self.plan + [{'path': '../outside.md', 'assessment': CONTEXT}])
        self.assertEqual(self.path.read_text(), self.text)
        self.assertFalse(self.record.exists())
        with self.assertRaises(ValueError):
            self.apply(self.plan * 2)
        self.assertFalse(self.record.exists())

    def test_partial_write_recovery_uses_saved_random_result(self):
        original_write = p.write
        def fail_post(path, data):
            if path == self.path:
                raise OSError('interrupted')
            original_write(path, data)
        with patch.object(p, 'write', side_effect=fail_post):
            with self.assertRaises(OSError):
                self.apply()
        entry = next(iter(json.loads(self.record.read_text())['entries'].values()))
        with patch.object(n.secrets, 'token_hex', side_effect=AssertionError('redraw')):
            result = self.apply()
        self.assertEqual(result[0]['likes'], entry['likes'])

    def test_text_changes_cannot_obtain_a_new_draw(self):
        self.apply()
        p.write(self.path, self.path.read_text().replace('绕了一小段路', '换了一个地方'))
        with self.assertRaises(ValueError):
            self.apply()

    def test_audit_detects_invalid_receipt_or_post_value_without_writing(self):
        self.apply()
        post = self.root / 'posts/2026/11/test/index.md'
        p.write(post, self.path.read_text())
        self.assertEqual(n.check(self.root), 1)
        p.write(post, n.replace_likes(post.read_text(), 99))
        before = self.record.read_bytes()
        with self.assertRaises(ValueError):
            n.check(self.root)
        self.assertEqual(before, self.record.read_bytes())

    def test_lock_hidden_media_duplicate_and_unfixed_date_rejected(self):
        self.record.parent.mkdir(parents=True)
        lock = self.record.with_suffix('.lock')
        lock.touch()
        with self.assertRaises(FileExistsError):
            self.apply()
        self.assertTrue(lock.exists())
        lock.unlink()
        for text in [self.text.replace('published', 'hidden'), self.text + '\n![图](uploads/a.png)',
                     self.text.replace('likes: 0', 'likes: 0\nlikes: 2'),
                     p.document({'username': 'gecko7'}, '没有固定时间')]:
            p.write(self.path, text)
            with self.assertRaises(ValueError):
                self.apply()
        self.assertFalse(self.record.exists())


class RepositoryReceipts(unittest.TestCase):
    def test_committed_draws_and_managed_posts_agree(self):
        n.check(Path(__file__).parents[1])


if __name__ == '__main__':
    unittest.main()
