"""Revision 7 native Blender edit: primary folded planes and painted detail.
Keep the original saved source, its authorable objects, and hidden history.
"""
from pathlib import Path
import bpy,math,json,struct,ast,hashlib
from mathutils import Vector
ROOT=Path(__file__).resolve().parent;ASSETS=ROOT.parents[2]/'rooftop/previews/pixel-01/assets'
SOURCE=ROOT/'garden-sample.blend';D=8.;TILE=32;ATLAS=128
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
assert 'REFERENCE_FACETS_V6' not in bpy.data.collections,'Revision 7 edit already applied.'
reference=bpy.data.collections.new('REFERENCE_FACETS_V6');bpy.context.scene.collection.children.link(reference)
reference.hide_render=True;reference.hide_viewport=True
names=['ceramic-pot','ceramic-pot-small','ceramic-pot-medium','metal-rack','doorway','scene-set']
groups={name:list(bpy.data.collections[name].objects) for name in names}
for objects in groups.values():
 for src in objects:
  old=src.copy();old.data=src.data;old.name='V6 / '+src.name;reference.objects.link(old)
demo=bpy.data.collections['COMPOSED_PREVIEW']
for obj in list(demo.objects):reference.objects.link(obj);demo.objects.unlink(obj)
removed=[]
def archive(obj,asset):
 reference.objects.link(obj);bpy.data.collections[asset].objects.unlink(obj)
 groups[asset].remove(obj);removed.append(obj.name)
for asset,objects in list(groups.items()):
 for obj in list(objects):
  if (obj.name.startswith('Roof / tile seam') or obj.name.startswith('Rack / exposed fastener') or
      any(obj.name.startswith(n) for n in ['Door / vertical stile','Door / horizontal rail','Door / raised panel','Door / hinge','Door / brass backplate']) or
      (obj.name.startswith('Stage / paving.') )):archive(obj,asset)

def replace(obj,vertices,faces):
 materials=list(obj.data.materials)
 mesh=bpy.data.meshes.new(obj.data.name+' / primary folded planes');mesh.from_pydata(vertices,[],faces);mesh.update()
 for m in materials:mesh.materials.append(m)
 # A real initial UV layer is needed by the shared square-grid mapper.
 mesh.uv_layers.new(name='SquarePixels_8pxPerMetre');obj.data=mesh
 return mesh

def profile(obj,rings):
 count=8
 vertices=[(r*math.cos(2*math.pi*j/count),r*math.sin(2*math.pi*j/count),z) for r,z in rings for j in range(count)]
 faces=[(k*count+j,k*count+(j+1)%count,(k+1)*count+(j+1)%count,(k+1)*count+j) for k in range(len(rings)-1) for j in range(count)]
 replace(obj,vertices,faces);obj['radial_segments']=8

pot=groups['ceramic-pot']
profile(next(o for o in pot if 'tapered vessel' in o.name),[(.06,.04),(.22,.04),(.315,.475),(.28,.475),(.20,.09),(.06,.09)])
profile(next(o for o in pot if 'rolled lip' in o.name),[(.28,.455),(.34,.455),(.34,.535),(.28,.535),(.28,.455)])
profile(next(o for o in pot if 'raised foot' in o.name),[(.20,0),(.23,0),(.23,.04),(.20,.04),(.20,0)])
for asset,scale in [('ceramic-pot-small',.4),('ceramic-pot-medium',.6)]:
 for obj,src in zip(groups[asset],pot):
  obj.data=src.data.copy()
  for v in obj.data.vertices:v.co*=scale
  obj['radial_segments']=8

# Existing bounds/transforms keep the scene composition. All bevel strips are
# replaced by the six principal planes of the same existing box object.
box_faces=[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
for asset,objects in groups.items():
 for obj in objects:
  if asset.startswith('ceramic-pot') or 'angular leaf' in obj.name or obj.name=='Lamp / pitched cap' or obj.name=='Stage / paving':continue
  points=[v.co.copy() for v in obj.data.vertices]
  lo=[min(v[k] for v in points) for k in range(3)];hi=[max(v[k] for v in points) for k in range(3)]
  if asset=='metal-rack':
   for k in range(3):
    if hi[k]-lo[k]<.05:
     mid=(hi[k]+lo[k])/2;lo[k]=mid-.025;hi[k]=mid+.025
  if obj.name.startswith('Lamp / corner'):
   for k in [0,1]:
    mid=(hi[k]+lo[k])/2;lo[k]=mid-.025;hi[k]=mid+.025
  if obj.name.startswith('Lamp / rail'):
   mid=(hi[2]+lo[2])/2;lo[2]=mid-.035;hi[2]=mid+.035
  vertices=[(lo[0],lo[1],lo[2]),(hi[0],lo[1],lo[2]),(hi[0],hi[1],lo[2]),(lo[0],hi[1],lo[2]),
            (lo[0],lo[1],hi[2]),(hi[0],lo[1],hi[2]),(hi[0],hi[1],hi[2]),(lo[0],hi[1],hi[2])]
  replace(obj,vertices,box_faces)
floor=next(o for o in groups['scene-set'] if o.name=='Stage / paving')
floor.location=(-.08,-.05,-.005)
replace(floor,[(-1.9765,-1.3165,.015),(1.9765,-1.3165,.015),(1.9765,1.3165,.015),(-1.9765,1.3165,.015)],[(0,1,2,3)])

# Reuse only the previously verified native face mapper, not the earlier
# migration or scene builder. Eight facets now have eight integer phases.
parsed=ast.parse((ROOT/'restore_faceted_surfaces.py').read_text())
definitions=[n for n in parsed.body if isinstance(n,ast.FunctionDef) and n.name in ['clip','unwrap']]
code=ast.unparse(ast.Module(body=definitions,type_ignores=[])).replace('3 + poly.index % 16','3 + 2 * (poly.index % 8)').replace('poly.index == 51','poly.index == 11')
metric_error=0.;max_planarity=0.;slanted_faces=0;source_faces=0;wrap_cuts=0;uv_examples=[]
exec(compile(code,'<native square surface mapper>','exec'))
for objects in groups.values():
 for obj in objects:unwrap(obj)
assert metric_error<.00001 and max_planarity<.00001

# Four flat face shades: no specular, smooth reflection, AO or continuous
# lighting gradient. The same corner colours are exported to the browser.
light_direction=Vector((-.4,-.6,.7)).normalized()
for objects in groups.values():
 for obj in objects:
  mesh=obj.data;col=mesh.color_attributes.new(name='FacetShade',type='FLOAT_COLOR',domain='CORNER')
  mesh.color_attributes.active_color_index=0;mesh.color_attributes.render_color_index=0
  matrix=obj.matrix_basis.to_3x3()
  for poly in mesh.polygons:
   n=(matrix@poly.normal).normalized();amount=n.dot(light_direction)
   shade=1.0 if amount>=.5 else .82 if amount>=.1 else .66 if amount>=-.3 else .52
   if obj.data.materials[0].name=='Warm_glass':shade=1.
   for li in poly.loop_indices:col.data[li].color=(shade,shade,shade,1.)

image=bpy.data.images['garden-atlas.png']
if image.packed_file:image.unpack(method='REMOVE')
image.filepath=str(ASSETS/'garden-atlas.png');image.reload();image.pack()
image.filepath=bpy.path.relpath(str(ASSETS/'garden-atlas.png'))
assert tuple(image.size)==(128,128)
for name in ['Shared_pixel_atlas','Warm_glass']:
 mat=bpy.data.materials[name];mat.use_nodes=True;nodes=mat.node_tree.nodes;nodes.clear();links=mat.node_tree.links
 texture=nodes.new('ShaderNodeTexImage');texture.image=image;texture.interpolation='Closest'
 attribute=nodes.new('ShaderNodeVertexColor');attribute.layer_name='FacetShade'
 shaded=nodes.new('ShaderNodeMixRGB');shaded.blend_type='MULTIPLY';shaded.inputs[0].default_value=1
 tint=nodes.new('ShaderNodeMixRGB');tint.name='SurfaceTint';tint.blend_type='MULTIPLY';tint.inputs[0].default_value=1;tint.inputs[2].default_value=(1,1,1,1)
 emission=nodes.new('ShaderNodeEmission');emission.inputs['Strength'].default_value=1
 output=nodes.new('ShaderNodeOutputMaterial')
 links.new(texture.outputs['Color'],shaded.inputs[1]);links.new(attribute.outputs['Color'],shaded.inputs[2])
 links.new(shaded.outputs[0],tint.inputs[1]);links.new(tint.outputs[0],emission.inputs['Color']);links.new(emission.outputs[0],output.inputs['Surface'])

manifest_path=ASSETS/'asset-manifest.json';manifest=json.loads(manifest_path.read_text())
placements=[(p['asset'],p['position_blender']) for p in manifest['placements']]
demo.hide_viewport=False;demo.hide_render=False
for asset,pos in placements:
 for src in groups[asset]:
  obj=src.copy();obj.data=src.data;demo.objects.link(obj);obj.location=src.location+Vector(pos);obj.scale=(1,1,1)
stats=[]
for asset,objects in groups.items():
 col=bpy.data.collections[asset];col.hide_viewport=False;col.hide_render=True;bpy.context.view_layer.update();exported=[]
 for mat_name in ['Shared_pixel_atlas','Warm_glass']:
  bpy.ops.object.select_all(action='DESELECT');copies=[]
  for src in objects:
   if src.data.materials[0].name!=mat_name:continue
   obj=src.copy();obj.data=src.data.copy();col.objects.link(obj);obj.select_set(True);copies.append(obj)
  if not copies:continue
  bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join();joined=bpy.context.object
  joined.name=asset+('/Warm_glass' if mat_name=='Warm_glass' else '/Atlas');exported.append(joined)
 bpy.ops.object.select_all(action='DESELECT')
 for obj in exported:obj.select_set(True)
 bpy.context.view_layer.objects.active=exported[0];path=ASSETS/(asset+'.glb')
 bpy.ops.export_scene.gltf(filepath=str(path),use_selection=True,export_format='GLB',export_materials='NONE',export_yup=True,
  export_texcoords=True,export_normals=True,export_extras=True,export_vertex_color='ACTIVE',export_active_vertex_color_when_no_material=True)
 blob=path.read_bytes();length=struct.unpack_from('<I',blob,12)[0];gltf=json.loads(blob[20:20+length])
 assert all('COLOR_0' in p['attributes'] for m in gltf['meshes'] for p in m['primitives'])
 tris=sum(gltf['accessors'][p['indices']]['count']//3 for m in gltf['meshes'] for p in m['primitives'])
 stats.append({'id':asset,'bytes':len(blob),'triangles':tris,'meshes':len(exported),'editable_parts':len(objects),'texels_per_metre':D})
 for obj in exported:bpy.data.objects.remove(obj,do_unlink=True)
 col.hide_viewport=True
scene=bpy.context.scene;scene.view_settings.look='None'
scene['sample_status']='Revision 7: coarse native pixel material fields on simplified folded planes; awaiting review; no game integration'
scene['atlas_workflow']='Actual Pixelorama 1px Pencil redraw in original PXO; 128px atlas; 32px cells; uniform 8 square texels/metre'
scene['shading_workflow']='Four flat vertex colour shade levels, emissive surface; no smooth lighting, specular or AO'
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE),compress=True);SOURCE.with_suffix('.blend1').unlink(missing_ok=True)
manifest.update(version=7,status='coarse-painted-folded-planes-review-pending',assets=stats,geometry='primary folded planes; minor detail painted in pixels',shading='four flat face shades; unlit vertex-colour texture')
manifest['atlas'].update(bytes=(ASSETS/'garden-atlas.png').stat().st_size,plaster_tones=4,full_native_colour_fields=True)
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
report={'revision':7,'software':'Blender '+bpy.app.version_string,'edited_existing_source':True,'previous_iteration_preserved_hidden':True,
 'fine_geometry_removed_from_visible_assets':removed,'roof_seams_are_texture_only':True,'no_geometry_bevel_strips':True,
 'pot_radial_facets':8,'density_texels_per_metre':D,'surface_texel_metres':1/D,'source_faces':source_faces,
 'slanted_faces':slanted_faces,'coplanar_uv_wrap_cuts':wrap_cuts,'max_unfolded_metric_error_pixels':metric_error,
 'max_face_nonplanarity_metres':max_planarity,'instances_are_scale_one':True,'face_shade_levels':[.52,.66,.82,1.],
 'continuous_lighting_gradient':False,'packed_png_identical_to_pixelorama_export':hashlib.sha256(bytes(image.packed_file.data)).digest()==hashlib.sha256((ASSETS/'garden-atlas.png').read_bytes()).digest(),
 'assets':stats,'uv_examples':uv_examples}
(ROOT/'facet-source-check.json').write_text(json.dumps(report,indent=2)+'\n')
print('Saved simplified native source:',len(removed),'fine parts archived; uniform square texture metric error',metric_error)
