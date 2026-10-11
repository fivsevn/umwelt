import bpy,json,hashlib
from pathlib import Path
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[2]
bpy.ops.wm.open_mainfile(filepath=str(HERE/'empty-rooftop.blend'))
meshes=[o for o in bpy.data.objects if o.type=='MESH']
assert len([i for i in bpy.context.evaluated_depsgraph_get().object_instances if i.object.type=='MESH' and not i.object.get('export_skip')])==json.loads((HERE/'blender-authoring.json').read_text())['mesh_objects']
assert all(o.data.uv_layers.active for o in meshes)
images=[im for im in bpy.data.images if im.packed_file]
assert len(images)==1 and bytes(images[0].packed_file.data)==(ROOT/'rooftop/assets/background/terrace-book.png').read_bytes()
assert len(bpy.data.collections['Neighbour terraces'].objects)>100
assert not any('storefront' in o.name.lower() or 'shopframe' in o.name.lower() for n in ['Main building','User terraces','Neighbour terraces']for o in bpy.data.collections[n].objects)
assert bpy.data.collections['Opposite older residences'].get('aerial_footprint_trace')
report={'actual_blender_reopened':True,'mesh_objects':len(meshes),'packed_texture_equals_runtime_png':True,'floor_charts':['North terrace unique patched floor','South balcony unique patched floor'],'collections':[c.name for c in bpy.data.collections],'native_bytes':(HERE/'empty-rooftop.blend').stat().st_size}
(HERE/'blender-source-check.json').write_text(json.dumps(report,indent=2));print(report)
