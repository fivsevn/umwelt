"""Append or revise street life in the saved native scene without rebuilding the blocks."""
import bpy,math,json,struct,hashlib,sys
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[2];DEST=ROOT/'rooftop/assets/background'
bpy.ops.wm.open_mainfile(filepath=str(HERE/'empty-rooftop.blend'))
if bpy.data.collections.get('Ground-floor shops') and '--replay-street-life' not in sys.argv:
 raise SystemExit('Street assets exist. Use Blender for edits, or explicitly --replay-street-life.')
owned=['Courtyard','Road and parking','Street greenery','Parked vehicles','Vehicle templates','Ground-floor shops','Parked bicycles']
cs=[bpy.data.collections[n] for n in owned if n in bpy.data.collections]
bpy.data.batch_remove(ids=list({o for c in cs for o in c.all_objects}))
bpy.data.batch_remove(ids=cs)
bpy.data.batch_remove(ids=[c for c in bpy.data.collections if c.users==0])
full=(HERE/'build-shell.py').read_text()
exec(full[full.index('fields='):full.index('# The private terrace')])
collections.update({c.name:c for c in bpy.data.collections})
# All previous materials now point to the updated packed Pixelorama book.
for im in list(bpy.data.images):
 if im!=image and im.users==0:bpy.data.images.remove(im)
a=full.index('def transform_native(');b=full.index('# Residential high rises',a)
exec(full[a:b])
manifest=json.loads((DEST/'empty-rooftop.mjs').read_text().split('Object.freeze(',1)[1].rsplit(');',1)[0])
EAVE=manifest['sixthFloor']['eave'];RIDGE=manifest['sixthFloor']['ridge'];BASE=manifest['sixthFloor']['base']
homes=list(zip(manifest['row']['centres'],manifest['row']['mirrors']))
mapped_blocks=manifest['neighbourhood']['oldBlocks'];map_towers=manifest['neighbourhood']['towers']
map_layout=json.loads((HERE/'map-layout.json').read_text())
exec((HERE/'street-life.py').read_text())
if not bpy.data.objects.get('Neighbourhood source overview'):
 bpy.ops.object.camera_add(location=(175,-175,125));overview=bpy.context.object;overview.name='Neighbourhood source overview'
 overview.rotation_euler=(Vector((-8,-16,-5))-overview.location).to_track_quat('-Z','Y').to_euler();overview.data.type='ORTHO';overview.data.ortho_scale=330
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'empty-rooftop.blend'),compress=True)
exec((HERE/'export-native.py').read_text())
