"""Save and export current native objects, cleaning numerical UV-cut slivers.
The 0.01mm tolerance is far below one 125mm authored surface pixel.
"""
from pathlib import Path
import bpy,bmesh,json,struct
ROOT=Path(__file__).resolve().parent;SOURCE=ROOT/'garden-sample.blend'
ASSETS=ROOT.parents[2]/'rooftop/previews/pixel-01/assets'
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
manifest=json.loads((ASSETS/'asset-manifest.json').read_text());stats=[];removed=0
for entry in manifest['assets']:
 name=entry['id'];col=bpy.data.collections[name];objects=list(col.objects)
 for obj in objects:
  before=len(obj.data.vertices);bm=bmesh.new();bm.from_mesh(obj.data)
  bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001)
  bmesh.ops.dissolve_degenerate(bm,edges=list(bm.edges),dist=.00001)
  bm.to_mesh(obj.data);bm.free();obj.data.update();removed+=before-len(obj.data.vertices)
 col.hide_viewport=False;bpy.context.view_layer.update();exported=[]
 for mat_name in ['Shared_pixel_atlas','Warm_glass']:
  bpy.ops.object.select_all(action='DESELECT');copies=[]
  for src in objects:
   if src.data.materials[0].name!=mat_name:continue
   obj=src.copy();obj.data=src.data.copy();col.objects.link(obj);obj.select_set(True);copies.append(obj)
  if not copies:continue
  bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join()
  joined=bpy.context.object;joined.name=name+('/Warm_glass' if mat_name=='Warm_glass' else '/Atlas');exported.append(joined)
 bpy.ops.object.select_all(action='DESELECT')
 for obj in exported:obj.select_set(True)
 bpy.context.view_layer.objects.active=exported[0];path=ASSETS/(name+'.glb')
 bpy.ops.export_scene.gltf(filepath=str(path),use_selection=True,export_format='GLB',export_materials='NONE',export_yup=True,
  export_texcoords=True,export_normals=True,export_extras=True,export_vertex_color='ACTIVE',export_active_vertex_color_when_no_material=True)
 blob=path.read_bytes();length=struct.unpack_from('<I',blob,12)[0];gltf=json.loads(blob[20:20+length])
 assert all('COLOR_0' in p['attributes'] for m in gltf['meshes'] for p in m['primitives'])
 tris=sum(gltf['accessors'][p['indices']]['count']//3 for m in gltf['meshes'] for p in m['primitives'])
 stats.append({'id':name,'bytes':len(blob),'triangles':tris,'meshes':len(exported),'editable_parts':len(objects),'texels_per_metre':8})
 for obj in exported:bpy.data.objects.remove(obj,do_unlink=True)
 col.hide_viewport=True
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE),compress=True);SOURCE.with_suffix('.blend1').unlink(missing_ok=True)
manifest['assets']=stats;(ASSETS/'asset-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
report=json.loads((ROOT/'facet-source-check.json').read_text());report.update(assets=stats,native_uv_cut_precision_tolerance_metres=.00001,duplicate_or_sliver_vertices_removed=removed)
(ROOT/'facet-source-check.json').write_text(json.dumps(report,indent=2)+'\n')
print('Native numerical slivers cleaned; exported current saved geometry.')
