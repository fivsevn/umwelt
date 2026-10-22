"""Archive the current cabin and snake libraries independently."""
from pathlib import Path
import argparse
import sys

ART = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ART))
from source_archive import archive as archive_file

ASSETS = {
    'ferry-cabin': ART / 'scenes/ferry-cabin/ferry-cabin.blend',
    'boaedon-capensis': ART / 'snakes/boaedon-capensis/boaedon-capensis.blend',
}


def archive_assets(asset=None):
    names = [asset] if asset is not None else ASSETS
    manifests = {}
    for name in names:
        manifest = archive_file(ASSETS[name])
        manifests[name] = manifest
        print(f"Archived {name}: {len(manifest['parts'])} parts, SHA256 {manifest['sha256']}")
    return manifests


def archive(asset=None):
    return archive_assets(asset)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--asset', choices=ASSETS)
    args = parser.parse_args()
    archive_assets(args.asset)
