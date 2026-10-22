"""Restore the current cabin and snake libraries independently."""
from pathlib import Path
import argparse
import sys

ART = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ART))
from source_archive import restore as restore_file

ASSETS = {
    'ferry-cabin': ART / 'scenes/ferry-cabin/source',
    'boaedon-capensis': ART / 'snakes/boaedon-capensis/source',
}


def restore_assets(asset=None, destination=None):
    if destination is not None and asset is None:
        raise ValueError('Choose one asset when specifying a restoration destination.')
    names = [asset] if asset is not None else ASSETS
    paths = []
    for name in names:
        path = restore_file(ASSETS[name], destination)
        paths.append(path)
        print('Editable library is ready: ' + str(path))
    return paths


def restore(destination=None, asset=None):
    """Restore libraries; the former combined scene is no longer a source."""
    return restore_assets(asset=asset, destination=destination)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--asset', choices=ASSETS)
    parser.add_argument('--destination', type=Path)
    args = parser.parse_args()
    if args.destination is not None and args.asset is None:
        parser.error('--destination requires --asset')
    restore_assets(args.asset, args.destination)
