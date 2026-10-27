#!/usr/bin/env python3
"""BOX-sample the complete, physically printed Blender handset render."""
import argparse
import ast
import math
from pathlib import Path
from PIL import Image

# Read palette names without importing Blender's bpy-only material module.
palette_tree=ast.parse(Path(__file__).with_name('handset_materials.py').read_text())
themes=next(ast.literal_eval(statement.value) for statement in palette_tree.body
            if isinstance(statement,ast.Assign)
            and any(isinstance(target,ast.Name) and target.id=='THEMES' for target in statement.targets))
runtime=Path(__file__).resolve().parents[1]

parser=argparse.ArgumentParser()
parser.add_argument('source',type=Path)
parser.add_argument('--destination',type=Path,default=Path(__file__).resolve().parents[1]/'assets')
parser.add_argument('--pixel-step',type=float,default=4,
                    help='logical CSS pixels per artwork texel; 4 is the pixel finish, 0.5 keeps the 2x render')
parser.add_argument('--theme',choices=list(themes),action='append',
                    help='encode one palette; repeat to select several (default: all)')
parser.add_argument('--preserve-housing-from',type=Path,
                    help='Keep these existing handset pixels outside the actual control recess')
args=parser.parse_args()
if not math.isfinite(args.pixel_step) or args.pixel_step<=0:
 parser.error('--pixel-step must be a finite positive number')
args.destination.mkdir(parents=True,exist_ok=True)
for theme in dict.fromkeys(args.theme or themes):
 for wide in (False,True):
  name=f'handset-{theme}'+('-wide' if wide else '')
  image=Image.open(args.source/(name+'.png')).convert('RGBA')
  # Area averaging preserves rendered light, pigment and alpha coverage without
  # sharpening halos or quantizing the paint colors. CSS uses pixelated scaling.
  size=tuple(max(1,round(dimension/(2*args.pixel_step))) for dimension in image.size)
  if image.size!=size:image=image.resize(size,Image.Resampling.BOX)
  mask=None
  if args.preserve_housing_from:
   previous=Image.open(args.preserve_housing_from/(name+'.webp')).convert('RGBA')
   orientation='wide' if wide else 'portrait'
   mask=Image.open(Path(__file__).with_name('handset-source')/f'controls-{orientation}-slot-mask.png').convert('L')
   if previous.size!=image.size or mask.size!=image.size:
    raise ValueError(f'{name}: housing preservation requires the original four-logical-pixel sampling grid')
   image=Image.composite(image,previous,mask)
  target=args.destination/(name+'.webp')
  image.save(target,'WEBP',lossless=True,method=6,exact=True)
  print(target.name,image.size,target.stat().st_size)
  if not wide:
   image.thumbnail((112,208),Image.Resampling.NEAREST)
   thumb=args.destination/f'handset-{theme}-thumb.webp'
   if mask is not None:
    previous=Image.open(args.preserve_housing_from/thumb.name).convert('RGBA')
    if previous.size!=image.size:raise ValueError(f'{thumb.name}: thumbnail grid changed')
    image=Image.composite(image,previous,mask.resize(image.size,Image.Resampling.NEAREST))
   image.save(thumb,'WEBP',lossless=True,method=6,exact=True)
   print(thumb.name,image.size,thumb.stat().st_size)
