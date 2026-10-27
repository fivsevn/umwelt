#!/usr/bin/env python3
"""Keep the full Blender silhouette resolution and native pixel-paint density."""
import argparse
from pathlib import Path
from PIL import Image

parser=argparse.ArgumentParser()
parser.add_argument('source',type=Path)
parser.add_argument('--destination',type=Path,default=Path(__file__).resolve().parents[1]/'assets')
parser.add_argument('--theme',action='append')
args=parser.parse_args();args.destination.mkdir(exist_ok=True,parents=True)
for path in sorted(args.source.glob('pocket-*.png')):
    if args.theme and path.stem.removeprefix('pocket-').removesuffix('-wide') not in args.theme:continue
    image=Image.open(path).convert('RGBA')
    expected=(1720,1060) if path.stem.endswith('-wide') else (1120,1640)
    if image.size!=expected:raise ValueError(f'{path}: expected {expected}, got {image.size}')
    target=args.destination/(path.stem+'.webp')
    image.save(target,'WEBP',lossless=True,method=6,exact=True)
    if not path.stem.endswith('-wide'):
        image.thumbnail((168,246),Image.Resampling.LANCZOS)
        image.save(args.destination/(path.stem+'-thumb.webp'),'WEBP',quality=95,method=6,exact=True)
    print(target.name,target.stat().st_size)
