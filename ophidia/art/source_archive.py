"""Archive and restore one editable file using only the Python standard library.

This tool can travel with a copied asset and run outside the repository:
    python3 source_archive.py archive /path/to/asset.blend
    python3 source_archive.py restore /path/to/source

Each asset owns its sibling source/ directory. Restored files are never
overwritten, and failed operations leave no temporary files behind.
"""
from pathlib import Path
import argparse
import hashlib
import json
import os
import re
import tempfile

PART_BYTES = 6 * 1024 * 1024
_READ_BYTES = 1024 * 1024


def _sha(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for data in iter(lambda: stream.read(_READ_BYTES), b''):
            digest.update(data)
    return digest.hexdigest()


def _filename(value):
    if (not isinstance(value, str) or not value or value in ('.', '..')
            or '/' in value or '\\' in value or '\x00' in value):
        raise RuntimeError('Archive filenames must be plain filenames.')
    return value


def _count(value):
    if type(value) is not int or value < 0:
        raise RuntimeError('Invalid byte count in source manifest.')
    return value


def _digest(value):
    if not isinstance(value, str) or re.fullmatch(r'[0-9a-f]{64}', value) is None:
        raise RuntimeError('Invalid SHA256 in source manifest.')
    return value


def _manifest(folder):
    try:
        manifest = json.loads((folder / 'manifest.json').read_text(encoding='utf-8'))
        _filename(manifest['source'])
        _count(manifest['bytes'])
        _digest(manifest['sha256'])
        if not isinstance(manifest['parts'], list):
            raise RuntimeError('Invalid source part list.')
        names = set()
        total = 0
        for part in manifest['parts']:
            name = _filename(part['file'])
            if name == 'manifest.json' or name in names:
                raise RuntimeError('Duplicate or invalid source part filename.')
            names.add(name)
            total += _count(part['bytes'])
            _digest(part['sha256'])
        if total != manifest['bytes']:
            raise RuntimeError('Source part sizes do not match the complete source size.')
    except (KeyError, TypeError, ValueError) as error:
        raise RuntimeError('Invalid source manifest: ' + str(folder / 'manifest.json')) from error
    return manifest


def _read_parts(folder, manifest, output=None):
    whole = hashlib.sha256()
    total = 0
    for part in manifest['parts']:
        path = folder / part['file']
        digest = hashlib.sha256()
        size = 0
        try:
            with path.open('rb') as stream:
                for data in iter(lambda: stream.read(_READ_BYTES), b''):
                    size += len(data)
                    digest.update(data)
                    whole.update(data)
                    if output is not None:
                        output.write(data)
        except OSError as error:
            raise RuntimeError('Cannot read source part: ' + part['file']) from error
        if size != part['bytes'] or digest.hexdigest() != part['sha256']:
            raise RuntimeError('Source archive verification failed: ' + part['file'])
        total += size
    if total != manifest['bytes'] or whole.hexdigest() != manifest['sha256']:
        raise RuntimeError('Complete source verification failed.')


def archive(source: Path):
    """Publish a verified sibling source/ archive and return its manifest."""
    source = Path(source).resolve()
    if not source.is_file():
        raise RuntimeError('Save the editable source before archiving it: ' + str(source))
    folder = source.parent / 'source'
    if folder.is_symlink():
        raise RuntimeError('The source archive directory must not be a symbolic link.')
    if folder.exists() and not folder.is_dir():
        raise RuntimeError('The source archive path is not a directory: ' + str(folder))
    # Refuse to remove unexpected files when replacing an existing archive.
    if folder.exists() and any(folder.iterdir()):
        old_manifest = _manifest(folder)
        expected = {'manifest.json', *(part['file'] for part in old_manifest['parts'])}
        unexpected = {path.name for path in folder.iterdir()} - expected
        if unexpected:
            raise RuntimeError('Unexpected files in source archive: ' + ', '.join(sorted(unexpected)))
    before = source.stat()
    with tempfile.TemporaryDirectory(prefix='.source-archive-', dir=source.parent) as temporary:
        temporary = Path(temporary)
        staged = temporary / 'current'
        staged.mkdir()
        whole = hashlib.sha256()
        parts = []
        total = 0
        with source.open('rb') as stream:
            for number, data in enumerate(iter(lambda: stream.read(PART_BYTES), b''), 1):
                name = f'{source.name}.part{number:02d}'
                (staged / name).write_bytes(data)
                parts.append({'file': name, 'bytes': len(data),
                              'sha256': hashlib.sha256(data).hexdigest()})
                whole.update(data)
                total += len(data)
        after = source.stat()
        if ((before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns)
                or total != after.st_size):
            raise RuntimeError('The editable source changed while being archived. Save it and retry.')
        manifest = {'source': source.name, 'bytes': total,
                    'sha256': whole.hexdigest(), 'parts': parts}
        (staged / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
        _read_parts(staged, _manifest(staged))
        previous = temporary / 'previous'
        if folder.exists():
            os.replace(folder, previous)
        try:
            os.replace(staged, folder)
        except BaseException:
            if previous.exists():
                os.replace(previous, folder)
            raise
    return manifest


def restore(folder: Path, destination=None):
    """Verify source/ and restore its file beside it, or to an explicit path."""
    folder = Path(folder).resolve()
    manifest = _manifest(folder)
    destination = Path(destination) if destination is not None else folder.parent / manifest['source']
    if destination.exists() or destination.is_symlink():
        if (destination.is_file() and destination.stat().st_size == manifest['bytes']
                and _sha(destination) == manifest['sha256']):
            _read_parts(folder, manifest)
            return destination
        raise RuntimeError('An edited source already exists. Preserve it before restoring: ' + str(destination))
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode='wb', prefix='.' + destination.name + '.',
                                         suffix='.restoring', dir=destination.parent,
                                         delete=False) as output:
            temporary = Path(output.name)
            _read_parts(folder, manifest, output)
        # Publish atomically without overwriting a file created meanwhile.
        try:
            os.link(temporary, destination)
        except FileExistsError as error:
            raise RuntimeError('The destination appeared during restoration; it was not overwritten: '
                               + str(destination)) from error
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
    return destination


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    save = commands.add_parser('archive', help='Archive one editable file.')
    save.add_argument('source', type=Path)
    load = commands.add_parser('restore', help='Restore one source/ archive.')
    load.add_argument('folder', type=Path)
    load.add_argument('--destination', type=Path)
    args = parser.parse_args()
    if args.command == 'archive':
        manifest = archive(args.source)
        print(f"Archived {manifest['source']}: {len(manifest['parts'])} parts, SHA256 {manifest['sha256']}")
    else:
        print('Editable source is ready: ' + str(restore(args.folder, args.destination)))


if __name__ == '__main__':
    main()
