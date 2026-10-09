"""Revision 6: edit the saved native source, restore its preserved planar shells.

Use actual Blender. All unfolded faces use one isometric 8 texel/metre grid.
The authored Pixelorama 128px atlas is retained byte for byte. Coplanar UV
wrap cuts preserve the shell silhouette; they are not voxel geometry.
"""
from pathlib import Path
import bpy, json, math, hashlib, struct
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT/'garden-sample.blend'
ASSETS=ROOT.parents[2]/'rooftop/previews/pixel-01/assets'
D=8.; TILE=32; ATLAS=128
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
assert 'REFERENCE_VOXEL_V5' not in bpy.data.collections,'This saved-source migration has already run.'
assert 'REFERENCE_LOW_POLY' in bpy.data.collections
# Names are stable native objects retained inside this very same .blend.
members=json.loads((ROOT/'original-low-poly-members.json').read_text())
ref=bpy.data.collections['REFERENCE_LOW_POLY']
voxel=bpy.data.collections.new('REFERENCE_VOXEL_V5');bpy.context.scene.collection.children.link(voxel)
voxel.hide_viewport=True;voxel.hide_render=True
names=['ceramic-pot','ceramic-pot-small','ceramic-pot-medium','metal-rack','doorway','scene-set']
def relink(obj,collection):
 if obj.name not in collection.objects:collection.objects.link(obj)
 for c in list(obj.users_collection):
  if c!=collection:c.objects.unlink(obj)
for n in names+['COMPOSED_PREVIEW']:
 for obj in list(bpy.data.collections[n].objects):relink(obj,voxel)
originals={}
for n in ['ceramic-pot','metal-rack','doorway','scene-set']:
 originals[n]=[bpy.data.objects[x] for x in members[n]]
 for obj in originals[n]:
  assert obj.parent is None
  relink(obj,bpy.data.collections[n])
  # Clear obsolete cube tags; authoring transforms are retained.
  obj.hide_render=False;obj.hide_viewport=False

def shell_signature(objects):
 return hashlib.sha256(json.dumps([(o.name,[list(o.matrix_basis@v.co) for v in o.data.vertices],
      [list(p.vertices) for p in o.data.polygons]) for o in objects],sort_keys=True).encode()).hexdigest()
before=shell_signature([o for v in originals.values() for o in v])
original_basis={o.name:o.matrix_basis.copy() for v in originals.values() for o in v}
old_meshes={o.name:o.data for v in originals.values() for o in v}
source_light=bpy.data.objects['Preview / broad daylight']
camera=bpy.context.scene.camera
lighting_signature=(list(source_light.matrix_basis),source_light.data.energy,list(source_light.data.color),
 list(camera.matrix_basis),camera.data.ortho_scale)
image=bpy.data.images['garden-atlas.png']
assert image.packed_file and hashlib.sha256(bytes(image.packed_file.data)).digest()==hashlib.sha256((ASSETS/'garden-atlas.png').read_bytes()).digest()
assert tuple(image.size)==(128,128)

# A separate copy bakes each pot's physical dimensions before unwrapping. Its
# instances remain scale=1, so no miniature can shrink the surface pixel unit.
groups=dict(originals)
for n,scale in [('ceramic-pot-small',.4),('ceramic-pot-medium',.6)]:
 groups[n]=[]
 for src in originals['ceramic-pot']:
  obj=src.copy();obj.data=src.data.copy();obj.name=n+' / '+src.name
  bpy.data.collections[n].objects.link(obj)
  for v in obj.data.vertices:v.co*=scale
  obj.location*=scale;obj.scale=(1,1,1);groups[n].append(obj)

def clip(poly,axis,bound,lower):
 result=[]
 for a,b in zip(poly,poly[1:]+poly[:1]):
  ina=a[1][axis]>=bound-1e-9 if lower else a[1][axis]<=bound+1e-9
  inb=b[1][axis]>=bound-1e-9 if lower else b[1][axis]<=bound+1e-9
  if ina:result.append(a)
  if ina!=inb:
   t=(bound-a[1][axis])/(b[1][axis]-a[1][axis])
   result.append((a[0].lerp(b[0],t),a[1].lerp(b[1],t)))
 return result

metric_error=0.;max_planarity=0.;slanted_faces=0;source_faces=0;wrap_cuts=0
uv_examples=[]
def unwrap(obj):
 global metric_error,max_planarity,slanted_faces,source_faces,wrap_cuts
 mesh=obj.data; matrix=obj.matrix_basis.copy(); inverse=matrix.inverted()
 # Existing source material assignment is kept. Read the original tile before
 # replacing UVs; no stretching a face into the whole 32px material cell.
 if 'material_tile' in obj:tile=int(obj['material_tile'])
 else:
  uv=mesh.uv_layers.active.data
  center=sum((u.uv for u in uv),Vector((0,0)))/len(uv)
  tile=min(3,int(center.x*4))+4*min(3,int((1-center.y)*4))
 vertices=[];faces=[];texcoords=[]
 for poly in mesh.polygons:
  points=[matrix@mesh.vertices[i].co for i in poly.vertices]
  n=(points[1]-points[0]).cross(points[2]-points[0]).normalized()
  assert n.length>.99,(obj.name,poly.index)
  max_planarity=max(max_planarity,max(abs((p-points[0]).dot(n)) for p in points))
  if max(abs(c) for c in n)<.9999:slanted_faces+=1
  # Orthonormal in-plane axes preserve lengths and right angles on every
  # unfolded facet, including trapezoidal pot walls and the sloped lamp cap.
  z=Vector((0,0,1));x=Vector((1,0,0))
  if abs(n.z)<.96:
   v=(z-n*z.dot(n)).normalized();u=v.cross(n).normalized();v=v
   offset_v=1
  else:
   u=(x-n*x.dot(n)).normalized();v=n.cross(u).normalized();offset_v=16
  offset_u=16
  if obj.name.startswith('Terracotta') or obj.name.startswith('ceramic-pot-'):
   # One integer chart phase per radial facet; each chart is still the same
   # physical pixel scale, without arbitrary fractional decorative squares.
   offset_u=3+poly.index%16
  if 'Roof /' in obj.name:offset_v=1-math.floor(min(p.dot(v)*D for p in points))
  coords=[Vector((p.dot(u)*D+offset_u,p.dot(v)*D+offset_v)) for p in points]
  # Wrap a large face only at native tile boundaries. This does not add bevels
  # or change the continuous original outline. No neighbour tile can bleed in.
  lower=[math.floor(min(q[k] for q in coords)/TILE) for k in range(2)]
  upper=[math.floor((max(q[k] for q in coords)-1e-8)/TILE) for k in range(2)]
  fragments=[]
  for cx in range(lower[0],max(lower[0],upper[0])+1):
   for cy in range(lower[1],max(lower[1],upper[1])+1):
    part=list(zip(points,coords))
    for ax,lo in [(0,cx*TILE),(1,cy*TILE)]:
     part=clip(part,ax,lo,True)
     if part:part=clip(part,ax,lo+TILE,False)
    if len(part)<3:continue
    # Remove duplicate boundary vertices produced by exact edge clipping.
    cleaned=[]
    for p,q in part:
     if not cleaned or (p-cleaned[-1][0]).length>1e-7:cleaned.append((p,q))
    if len(cleaned)>2 and (cleaned[0][0]-cleaned[-1][0]).length<1e-7:cleaned.pop()
    if len(cleaned)<3:continue
    area=sum((cleaned[j][0]-cleaned[0][0]).cross(cleaned[j+1][0]-cleaned[0][0]).length for j in range(1,len(cleaned)-1))
    if area<1e-10:continue
    fragments.append(cleaned)
    start=len(vertices);vertices.extend([inverse@p for p,q in cleaned]);faces.append(tuple(range(start,start+len(cleaned))))
    local=[q-Vector((cx*TILE,cy*TILE)) for p,q in cleaned]
    texcoords.append([((tile%4*TILE+q.x)/ATLAS,1-(tile//4*TILE+TILE-q.y)/ATLAS) for q in local])
    for i in range(len(cleaned)):
     for j in range(i):
      physical=(cleaned[i][0]-cleaned[j][0]).length*D
      pixel=(local[i]-local[j]).length
      metric_error=max(metric_error,abs(pixel-physical))
    if (obj.name=='Wall / left plaster pier' and n.y<-.99) or (obj.name=='Lamp / pitched cap' and abs(n.z)<.96) or (obj.name=='Terracotta / tapered vessel' and poly.index==51):
     uv_examples.append({'object':obj.name,'polygon':poly.index,'tile':tile,'local_pixels':[list(q) for q in local]})
  wrap_cuts+=max(0,len(fragments)-1);source_faces+=1
 new=bpy.data.meshes.new(mesh.name+' / square surface pixels');new.from_pydata(vertices,[],faces);new.update()
 for m in mesh.materials:new.materials.append(m)
 new.uv_layers.new(name='SquarePixels_8pxPerMetre')
 for p,values in zip(new.polygons,texcoords):
  p.use_smooth=False
  for li,uv in zip(p.loop_indices,values):new.uv_layers.active.data[li].uv=uv
 obj.data=new;obj['material_tile']=tile;obj['texels_per_metre']=D
 obj['surface_texel_metres']=1/D;obj['faceted_shell']=True

for objects in groups.values():
 for obj in objects:unwrap(obj)
assert metric_error<.00001,metric_error
assert max_planarity<.00001,max_planarity
assert slanted_faces>0
assert all(o.matrix_basis==original_basis[o.name] for v in originals.values() for o in v)

# Keep the latest approved scene layout. Fine physical shapes now fit their
# original bearing surfaces again; UV density does not depend on translation.
placements=[('ceramic-pot-small',(-1.3,0,1.1)),('ceramic-pot-small',(-.7,0,1.1)),
 ('ceramic-pot-small',(-1.,0,.3)),('ceramic-pot',(.4,-.7,0)),('ceramic-pot-medium',(1.1,-.8,0)),
 ('metal-rack',(-1.,0,0)),('doorway',(0,0,0)),('scene-set',(0,0,0))]
demo=bpy.data.collections['COMPOSED_PREVIEW'];demo.hide_viewport=False;demo.hide_render=False
for asset,pos in placements:
 for src in groups[asset]:
  obj=src.copy();obj.data=src.data;demo.objects.link(obj)
  obj.location=src.location+Vector(pos);obj.scale=(1,1,1)

stats=[]
for asset,objects in groups.items():
 col=bpy.data.collections[asset];col.hide_viewport=False;col.hide_render=True;bpy.context.view_layer.update()
 exported=[]
 for material_name in ['Shared_pixel_atlas','Warm_glass']:
  bpy.ops.object.select_all(action='DESELECT');copies=[]
  for src in objects:
   if src.data.materials[0].name!=material_name:continue
   obj=src.copy();obj.data=src.data.copy();col.objects.link(obj);obj.select_set(True);copies.append(obj)
  if not copies:continue
  bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join()
  joined=bpy.context.object;joined.name=asset+('/Warm_glass' if material_name=='Warm_glass' else '/Atlas');exported.append(joined)
 bpy.ops.object.select_all(action='DESELECT')
 for o in exported:o.select_set(True)
 bpy.context.view_layer.objects.active=exported[0]
 path=ASSETS/(asset+'.glb')
 bpy.ops.export_scene.gltf(filepath=str(path),use_selection=True,export_format='GLB',export_materials='NONE',
     export_texcoords=True,export_normals=True,export_extras=True,export_yup=True)
 blob=path.read_bytes();length=struct.unpack_from('<I',blob,12)[0];gltf=json.loads(blob[20:20+length])
 triangles=sum(gltf['accessors'][p['indices']]['count']//3 for m in gltf['meshes'] for p in m['primitives'])
 stats.append({'id':asset,'bytes':len(blob),'triangles':triangles,'meshes':len(exported),'editable_parts':len(objects),'texels_per_metre':D})
 for o in exported:bpy.data.objects.remove(o,do_unlink=True)
 col.hide_viewport=True

scene=bpy.context.scene
for key in ['minimum_visual_unit_metres','integer_grid_origin']:
 if key in scene:del scene[key]
scene['surface_texel_metres']=1/D;scene['texels_per_metre']=D
scene['sample_status']='Revision 6: origami-like planar low-poly shell, native uniform square surface pixels; review pending; no gameplay integration'
scene['atlas_workflow']='Original Pixelorama Pencil 128px atlas unchanged, 32px cells; orthonormal face UVs at 8 pixels/metre; nearest sampling'
for mat in [bpy.data.materials['Shared_pixel_atlas'],bpy.data.materials['Warm_glass']]:
 for node in mat.node_tree.nodes:
  if node.type=='TEX_IMAGE':node.interpolation='Closest'
assert lighting_signature==(list(source_light.matrix_basis),source_light.data.energy,list(source_light.data.color),list(camera.matrix_basis),camera.data.ortho_scale)
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE),compress=True)
SOURCE.with_suffix('.blend1').unlink(missing_ok=True)
manifest_path=ASSETS/'asset-manifest.json';manifest=json.loads(manifest_path.read_text())
for key in ['minimum_cube_metres','grid_origin']:manifest.pop(key,None)
manifest.update(version=6,status='faceted-uniform-surface-pixels-review-pending',geometry='planar low-poly shell with slanted faces',assets=stats)
manifest['atlas'].pop('one_texel_per_cube_face',None)
manifest['atlas'].update(texels_per_metre=D,texel_size_metres=1/D,unfolded_pixels='square, same physical size, integer painted texels')
manifest['placements']=[{'asset':a,'position_blender':p,'scale':1} for a,p in placements]
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
report={'revision':6,'software':'Blender '+bpy.app.version_string,'edited_existing_source':True,
 'restored_original_editable_parts':sum(len(v) for v in originals.values()),'voxel_revision_preserved_hidden':len(voxel.objects),
 'old_composed_reference_preserved_hidden':len(ref.objects),'source_shell_signature_before_uv_cuts':before,
 'original_transforms_camera_lighting_preserved':True,'coarse_pixelorama_png_preserved_byte_for_byte':True,
 'packed_png_identical_to_pixelorama_export':True,'density_texels_per_metre':D,'surface_texel_metres':1/D,
 'orthonormal_surface_uvs':True,'source_faces':source_faces,'slanted_faces':slanted_faces,'coplanar_uv_wrap_cuts':wrap_cuts,
 'max_unfolded_metric_error_pixels':metric_error,'max_face_nonplanarity_metres':max_planarity,
 'instances_are_scale_one':True,'texture_nearest':True,'assets':stats,'uv_examples':uv_examples}
(ROOT/'facet-source-check.json').write_text(json.dumps(report,indent=2)+'\n')
print('Faceted shells restored. Uniform square texels:',D,'px/m; metric error',metric_error,'; slanted faces',slanted_faces)
