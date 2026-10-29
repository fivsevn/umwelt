import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('simulation_dice', Path(__file__).parents[1] / 'tools' / 'simulation-dice.py')
dice = importlib.util.module_from_spec(spec)
spec.loader.exec_module(dice)


class SimulationDiceTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / 'receipt.json'

    def start(self):
        return dice.execute(self.path, 'round-a', 'baseline-a')

    def test_target_endpoints_and_resume_never_redraw(self):
        with patch.object(dice.secrets, 'randbelow', return_value=6) as source:
            self.assertEqual(self.start()['target_posts'], 7)
            self.assertEqual(self.start()['target_posts'], 7)
            source.assert_called_once_with(7)
        with self.assertRaises(ValueError):
            dice.execute(self.path, 'round-a', 'changed-baseline')
        with patch.object(dice.secrets, 'randbelow', return_value=0):
            self.assertEqual(dice.execute(self.path.with_name('other.json'), 'round-b', 'base')['target_posts'], 1)

    def test_weight_intervals_cover_exact_integer_mass(self):
        results = [dice.choose([('a', 2), ('b', 3), ('c', 1)], 1, lambda n, i=i: i)[0] for i in range(6)]
        self.assertEqual(results, ['a', 'a', 'b', 'b', 'b', 'c'])

    def test_replay_rejects_changed_pool_without_touching_receipt(self):
        self.start()
        first = dice.execute(self.path, 'round-a', None, 'author', {'a': 1, 'b': 2})
        before = self.path.read_bytes()
        with patch.object(dice.secrets, 'randbelow', side_effect=AssertionError('redraw')):
            self.assertEqual(dice.execute(self.path, 'round-a', None, 'author', {'b': 2, 'a': 1}), first)
        with self.assertRaises(ValueError):
            dice.execute(self.path, 'round-a', None, 'author', {'a': 9, 'b': 2})
        self.assertEqual(before, self.path.read_bytes())

    def test_sample_without_replacement(self):
        self.assertEqual(dice.choose([('a', 1), ('b', 1), ('c', 1)], 3, lambda n: 0), ['a', 'b', 'c'])

    def test_invalid_inputs_and_round_lifecycle(self):
        self.start()
        for options, count in [({}, 1), ({'a': 0}, 1), ({'a': -1}, 1), ({'a': True}, 1), ({'a': 1.5}, 1), ({'a': 1}, 2)]:
            with self.assertRaises(ValueError):
                dice.execute(self.path, 'round-a', None, 'invalid', options, count)
        with self.assertRaises(ValueError):
            dice.execute(self.path, 'round-b', 'base')
        dice.execute(self.path, 'round-a', None, '__close__')
        with self.assertRaises(ValueError):
            dice.execute(self.path, 'round-a', None, 'new', {'a': 1})
        self.assertEqual(dice.execute(self.path, 'round-b', 'base')['round'], 'round-b')

    def test_existing_lock_prevents_a_second_caller(self):
        lock = self.path.with_name(self.path.name + '.lock')
        lock.touch()
        with self.assertRaises(FileExistsError):
            self.start()
        self.assertFalse(self.path.exists())
        self.assertTrue(lock.exists())


if __name__ == '__main__':
    unittest.main()
