"""Repository-independent source archive checks, using disposable assets only."""
from pathlib import Path
import hashlib
import importlib.util
import json
import tempfile
import unittest
from unittest.mock import patch

MODULE_PATH = Path(__file__).resolve().parents[1] / 'art/source_archive.py'
SPEC = importlib.util.spec_from_file_location('ophidia_source_archive', MODULE_PATH)
archive_tool = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(archive_tool)


class SourceArchiveTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name).resolve()

    def asset(self, name='ferry-cabin', data=b'editable native model'):
        source = self.root / name / (name + '.blend')
        source.parent.mkdir(parents=True)
        source.write_bytes(data)
        manifest = archive_tool.archive(source)
        return source, source.parent / 'source', manifest

    def assert_no_temporary_files(self):
        self.assertEqual([], [path for path in self.root.rglob('*')
                              if path.name.startswith('.source-archive-')
                              or path.name.endswith('.restoring')])

    def test_two_libraries_restore_independently_with_full_size_parts(self):
        cabin_data = b'CABIN\0' * (archive_tool.PART_BYTES // 6) + b'cabin final part'
        cabin, cabin_folder, cabin_manifest = self.asset(data=cabin_data)
        snake_data = b'SNAKE\0hat\0scarf\0' * 100
        snake, snake_folder, snake_manifest = self.asset('boaedon-capensis', snake_data)
        self.assertEqual([archive_tool.PART_BYTES, len(b'cabin final part')],
                         [part['bytes'] for part in cabin_manifest['parts']])
        self.assertEqual(hashlib.sha256(cabin_data).hexdigest(), cabin_manifest['sha256'])
        cabin.unlink()
        snake.unlink()
        # Copying just one source/ directory is sufficient for restoration.
        detached = self.root / 'detached' / 'source'
        detached.parent.mkdir()
        cabin_folder.rename(detached)
        restored_cabin = archive_tool.restore(detached)
        self.assertEqual(cabin_data, restored_cabin.read_bytes())
        self.assertFalse(snake.exists())
        self.assertEqual(snake, archive_tool.restore(snake_folder))
        self.assertEqual(snake_data, snake.read_bytes())
        self.assertEqual(snake_manifest, json.loads((snake_folder / 'manifest.json').read_text()))
        self.assert_no_temporary_files()

    def test_matching_existing_file_is_reused_and_archive_is_still_verified(self):
        source, folder, manifest = self.asset()
        before = source.stat().st_mtime_ns
        self.assertEqual(source, archive_tool.restore(folder))
        self.assertEqual(before, source.stat().st_mtime_ns)
        (folder / manifest['parts'][0]['file']).write_bytes(b'corrupt part')
        with self.assertRaisesRegex(RuntimeError, 'archive verification failed'):
            archive_tool.restore(folder)
        self.assertEqual(b'editable native model', source.read_bytes())
        self.assert_no_temporary_files()

    def test_edited_source_is_never_overwritten(self):
        source, folder, _ = self.asset()
        source.write_bytes(b'unsaved-to-archive author edits')
        with self.assertRaisesRegex(RuntimeError, 'edited source already exists'):
            archive_tool.restore(folder)
        self.assertEqual(b'unsaved-to-archive author edits', source.read_bytes())
        self.assert_no_temporary_files()

    def test_corrupt_part_does_not_publish_or_leave_temporary_output(self):
        source, folder, manifest = self.asset()
        source.unlink()
        part = folder / manifest['parts'][0]['file']
        part.write_bytes(b'x' * part.stat().st_size)
        with self.assertRaisesRegex(RuntimeError, 'archive verification failed'):
            archive_tool.restore(folder)
        self.assertFalse(source.exists())
        self.assert_no_temporary_files()

    def test_missing_part_does_not_publish_or_leave_temporary_output(self):
        source, folder, manifest = self.asset()
        source.unlink()
        (folder / manifest['parts'][0]['file']).unlink()
        with self.assertRaisesRegex(RuntimeError, 'Cannot read source part'):
            archive_tool.restore(folder)
        self.assertFalse(source.exists())
        self.assert_no_temporary_files()

    def test_complete_hash_is_checked_separately_from_part_hashes(self):
        source, folder, manifest = self.asset()
        source.unlink()
        manifest['sha256'] = '0' * 64
        (folder / 'manifest.json').write_text(json.dumps(manifest))
        with self.assertRaisesRegex(RuntimeError, 'Complete source verification failed'):
            archive_tool.restore(folder)
        self.assertFalse(source.exists())
        self.assert_no_temporary_files()

    def test_manifest_cannot_escape_source_directory(self):
        source, folder, manifest = self.asset()
        source.unlink()
        manifest['parts'][0]['file'] = '../../outside.blend'
        (folder / 'manifest.json').write_text(json.dumps(manifest))
        with self.assertRaisesRegex(RuntimeError, 'plain filenames'):
            archive_tool.restore(folder)
        self.assert_no_temporary_files()

    def test_rearchive_replaces_stale_parts_and_restores_current_edits(self):
        source, folder, old_manifest = self.asset(data=b'a' * (archive_tool.PART_BYTES + 3))
        source.write_bytes(b'current smaller model')
        current = archive_tool.archive(source)
        self.assertEqual(1, len(current['parts']))
        self.assertFalse((folder / old_manifest['parts'][1]['file']).exists())
        source.unlink()
        self.assertEqual(b'current smaller model', archive_tool.restore(folder).read_bytes())
        self.assert_no_temporary_files()

    def test_failed_archive_publication_keeps_previous_archive(self):
        source, folder, manifest = self.asset()
        old_manifest = (folder / 'manifest.json').read_bytes()
        source.write_bytes(b'new edited model')
        replace = archive_tool.os.replace

        def fail_new_archive(src, dst):
            if Path(src).name == 'current':
                raise OSError('simulated publication failure')
            return replace(src, dst)

        with patch.object(archive_tool.os, 'replace', side_effect=fail_new_archive):
            with self.assertRaisesRegex(OSError, 'simulated publication failure'):
                archive_tool.archive(source)
        self.assertEqual(old_manifest, (folder / 'manifest.json').read_bytes())
        self.assertEqual(manifest['parts'][0]['sha256'],
                         hashlib.sha256((folder / manifest['parts'][0]['file']).read_bytes()).hexdigest())
        self.assert_no_temporary_files()

    def test_destination_created_during_restore_is_not_overwritten(self):
        source, folder, _ = self.asset()
        source.unlink()
        link = archive_tool.os.link

        def competing_creation(src, dst):
            Path(dst).write_bytes(b'concurrent author edit')
            return link(src, dst)

        with patch.object(archive_tool.os, 'link', side_effect=competing_creation):
            with self.assertRaisesRegex(RuntimeError, 'was not overwritten'):
                archive_tool.restore(folder)
        self.assertEqual(b'concurrent author edit', source.read_bytes())
        self.assert_no_temporary_files()

    def test_custom_destination_and_empty_source_round_trip(self):
        _, folder, _ = self.asset(data=b'')
        destination = self.root / 'elsewhere' / 'copied.blend'
        self.assertEqual(destination, archive_tool.restore(folder, destination))
        self.assertEqual(b'', destination.read_bytes())
        self.assert_no_temporary_files()


if __name__ == '__main__':
    unittest.main()
