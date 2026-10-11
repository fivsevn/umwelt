"""Reopen the saved native model and export; never rebuild authored geometry."""
import bpy,json,math,struct,hashlib
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[2];DEST=ROOT/'rooftop/assets/background'
bpy.ops.wm.open_mainfile(filepath=str(HERE/'empty-rooftop.blend'))
previous=json.loads((DEST/'empty-rooftop.mjs').read_text().split('Object.freeze(',1)[1].rsplit(');',1)[0])
fields=json.loads((HERE/'pencil-strokes.json').read_text())['fields'];image=next(im for im in bpy.data.images if im.packed_file)
EAVE=previous['sixthFloor']['eave'];RIDGE=previous['sixthFloor']['ridge'];BASE=previous['sixthFloor']['base']
homes=list(zip(previous['row']['centres'],previous['row']['mirrors']))
mapped_blocks=previous['neighbourhood']['oldBlocks'];map_towers=previous['neighbourhood']['towers'];map_layout=json.loads((HERE/'map-layout.json').read_text())
shop_count=previous['neighbourhood']['shops'];parkings=range(previous['neighbourhood']['parkedCars'])
exec((HERE/'export-native.py').read_text())
