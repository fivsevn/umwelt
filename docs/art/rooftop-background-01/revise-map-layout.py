"""Revise the native neighbourhood while preserving authored private terraces."""
import bpy,math,json,struct,hashlib,sys,ast
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[2];DEST=ROOT/'rooftop/assets/background'
if '--apply-map-revision' not in sys.argv:raise SystemExit('Use --apply-map-revision after saving any manual model changes.')
bpy.ops.wm.open_mainfile(filepath=str(HERE/'empty-rooftop.blend'))
owned=['Opposite older residences','South matching terrace residences','Mapped outer old residences','Distant skyline','Courtyard','Road and parking','Street greenery','Parked vehicles','Vehicle templates','Ground-floor shops','Parked bicycles']
owned_collections=[bpy.data.collections[name] for name in owned if name in bpy.data.collections]
bpy.data.batch_remove(ids=list({o for c in owned_collections for o in c.all_objects}))
bpy.data.batch_remove(ids=owned_collections)
bpy.data.batch_remove(ids=[c for c in bpy.data.collections if c.users==0])
bpy.data.batch_remove(ids=[m for m in bpy.data.meshes if m.users==0])
full=(HERE/'build-shell.py').read_text();exec(full[full.index('fields='):full.index('# The private terrace')])
collections.update({c.name:c for c in bpy.data.collections})
EAVE=5.6;RIDGE=13.2;BASE=-28.15;homes=[(0,1),(-20,-1),(52,1),(32,-1),(-52,1),(-72,-1)]
for node in ast.parse(full).body:
 if isinstance(node,ast.FunctionDef) and node.name in ['distant_building','transform_native','residential_tower']:
  exec(compile(ast.Module(body=[node],type_ignores=[]),str(HERE/'build-shell.py'),'exec'))
for im in list(bpy.data.images):
 if im!=image and im.users==0:bpy.data.images.remove(im)
exec((HERE/'mapped-neighborhood.py').read_text())
exec((HERE/'street-life.py').read_text())
bpy.data.batch_remove(ids=[m for m in bpy.data.meshes if m.users==0])
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'empty-rooftop.blend'),compress=True)
exec((HERE/'export-native.py').read_text())
