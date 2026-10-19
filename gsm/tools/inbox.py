"""Remove only upload originals whose archived posts and WebP files were verified live."""
import argparse
import json
from pathlib import Path

from publish import digest, local_path, split


def clear_verified(root, site):
    root, site = root.resolve(), site.resolve()
    receipt = json.loads((site / '.gsm-verified.json').read_text())
    if receipt['source_feed'] != digest((root / 'data/feed.mjs').read_bytes()):
        raise ValueError('信息流在上线核验后已变化，保留上传原图')
    for path, expected in receipt['files'].items():
        if digest(local_path(site, path).read_bytes()) != expected:
            raise ValueError('发布包与核验记录不符，保留上传原图')
    pending = set()
    for entry in (root / 'posts').glob('**/index.md'):
        meta, _ = split(entry.read_text())
        if meta.get('status', 'published') != 'published':
            continue
        for upload in meta.get('uploads', []):
            original = local_path(root, upload['path'])
            archived = local_path(entry.parent, upload['file'])
            if (not original.is_relative_to(root / 'uploads') or not archived.is_relative_to(entry.parent / 'assets')
                    or (root / upload['path']).is_symlink() or (entry.parent / upload['file']).is_symlink()):
                raise ValueError('不安全的上传清理路径')
            if not original.is_file() or not archived.is_file():
                continue
            if digest(original.read_bytes()) != upload['sha256'] or digest(archived.read_bytes()) != upload['file_sha256']:
                continue
            public_path = 'gsm/' + archived.relative_to(root).as_posix()
            if receipt['files'].get(public_path) != upload['file_sha256']:
                raise ValueError(f'这张图片尚未核验上线: {public_path}')
            pending.add(original)
    for original in sorted(pending):
        original.unlink()
        parent = original.parent
        while parent != root / 'uploads' and not any(parent.iterdir()):
            parent.rmdir()
            parent = parent.parent
    return len(pending)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--site', type=Path, default=Path('_site'))
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    print(f'已清理 {clear_verified(args.root, args.site)} 张已核验上线的上传原图。')
