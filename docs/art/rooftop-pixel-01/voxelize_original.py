"""Edit the existing Blender source to a strict shared cube lattice.
The prior editable low-poly parts are retained as hidden reference objects.
Every visible vertex, placement and texture sample uses the same 0.1m unit.
"""
from pathlib import Path
import bpy,math,json,struct
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parent;SOURCE=ROOT/'garden-sample.blend'
ASSETS=ROOT.parents[2]/'rooftop/previews/pixel-01/assets'
G=.1;TILE=32;ATLAS=128
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
assert 'REFERENCE_LOW_POLY' not in bpy.data.collections,'One-time revision-5 source conversion already applied.'
reference=bpy.data.collections.new('REFERENCE_LOW_POLY');bpy.context.scene.collection.children.link(reference)
reference.hide_render=True;reference.hide_viewport=True
names=['ceramic-pot','metal-rack','doorway','scene-set']
originals={name:list(bpy.data.collections[name].objects) for name in names}
variants=[('ceramic-pot',1.),('ceramic-pot-small',.4),('ceramic-pot-medium',.6),('metal-rack',1.),('doorway',1.),('scene-set',1.)]
materials={name:bpy.data.materials[name] for name in ['Shared_pixel_atlas','Warm_glass']}
# +X, -X, +Y, -Y, +Z, -Z. All corners are integer lattice positions.
faces=[((1,0,0),[(1,0,0),(1,1,0),(1,1,1),(1,0,1)]),
       ((-1,0,0),[(0,1,0),(0,0,0),(0,0,1),(0,1,1)]),
       ((0,1,0),[(1,1,0),(0,1,0),(0,1,1),(1,1,1)]),
       ((0,-1,0),[(0,0,0),(1,0,0),(1,0,1),(0,0,1)]),
       ((0,0,1),[(0,0,1),(1,0,1),(1,1,1),(0,1,1)]),
       ((0,0,-1),[(0,1,0),(1,1,0),(1,0,0),(0,0,0)])]

def inside(tree,point):
 direction=Vector((1,.00013,.00007));count=0;start=point.copy()
 for _ in range(40):
  hit,normal,index,distance=tree.ray_cast(start,direction,10)
  if hit is None:break
  count+=1;start=hit+direction*.000001
 return count%2==1

def occupancy(group,scale):
 occupied={}
 for obj in originals[group]:
  vertices=[(obj.matrix_basis@v.co)*scale for v in obj.data.vertices]
  polys=[list(p.vertices) for p in obj.data.polygons]
  tree=BVHTree.FromPolygons(vertices,polys)
  uv=obj.data.uv_layers.active.data
  center=sum((v.uv for v in uv),Vector((0,0)))/len(uv)
  tile=int(center.x*4)+4*int((1-center.y)*4)
  material='Warm_glass' if obj.data.materials[0].name=='Warm_glass' else 'Shared_pixel_atlas'
  lo=[math.floor(min(v[k] for v in vertices)/G+1e-6) for k in range(3)]
  hi=[math.ceil(max(v[k] for v in vertices)/G-1e-6) for k in range(3)]
  for x in range(lo[0],max(lo[0]+1,hi[0])):
   for y in range(lo[1],max(lo[1]+1,hi[1])):
    for z in range(lo[2],max(lo[2]+1,hi[2])):
     key=(x,y,z);point=Vector([(a+.5)*G for a in key])
     hit,n,i,distance=tree.find_nearest(point)
     if hit is not None and (distance<=G*.56 or inside(tree,point)):
      occupied[key]=(tile,material)
 return occupied

def make_grid_mesh(name,occupied,collection):
 made=[]
 for material,mat in materials.items():
  verts=[];polys=[];samples=[]
  for (x,y,z),(tile,m) in sorted(occupied.items()):
   if m!=material:continue
   for normal,corners in faces:
    adjacent=(x+normal[0],y+normal[1],z+normal[2])
    if adjacent in occupied:continue
    index=len(verts)
    verts.extend([((x+a)*G,(y+b)*G,(z+c)*G) for a,b,c in corners]);polys.append(tuple(range(index,index+4)))
    # One native atlas texel colours one entire smallest cube face. The
    # coordinate comes from the global integer lattice, with 32px repetition.
    if normal[2]:u=x%TILE;v=y%TILE
    elif normal[1]:u=x%TILE;v=(31-z)%TILE
    else:u=y%TILE;v=(31-z)%TILE
    samples.append(((tile%4*TILE+u+.5)/ATLAS,1-(tile//4*TILE+v+.5)/ATLAS))
  if not polys:continue
  mesh=bpy.data.meshes.new(name+' / integer cubes');mesh.from_pydata(verts,[],polys);mesh.update()
  mesh.uv_layers.new(name='OneTexelPerCube')
  for poly,sample in zip(mesh.polygons,samples):
   for loop in poly.loop_indices:mesh.uv_layers.active.data[loop].uv=sample
  obj=bpy.data.objects.new(name+('/Warm_glass' if material=='Warm_glass' else '/Atlas'),mesh)
  collection.objects.link(obj);mesh.materials.append(mat)
  obj['minimum_cube_metres']=G;obj['integer_lattice']=True;obj['atlas_texel_per_cube_face']=1
  made.append(obj)
 return made

# Preserve the former originals and composed models in a hidden reference group.
for obj in list(bpy.data.collections['COMPOSED_PREVIEW'].objects):
 reference.objects.link(obj)
 for c in list(obj.users_collection):
  if c!=reference:c.objects.unlink(obj)
for group,objects in originals.items():
 for obj in objects:
  reference.objects.link(obj)
  for c in list(obj.users_collection):
   if c!=reference:c.objects.unlink(obj)
new_objects={};stats=[]
for asset,scale in variants:
 group='ceramic-pot' if asset.startswith('ceramic-pot') else asset
 collection=bpy.data.collections.get(asset)
 if collection is None:
  collection=bpy.data.collections.new(asset);bpy.context.scene.collection.children.link(collection)
 occupied=occupancy(group,scale);made=make_grid_mesh(asset,occupied,collection);new_objects[asset]=made
 collection.hide_render=True;collection.hide_viewport=False;bpy.context.view_layer.update()
 bpy.ops.object.select_all(action='DESELECT')
 for obj in made:obj.select_set(True)
 bpy.context.view_layer.objects.active=made[0]
 path=ASSETS/(asset+'.glb')
 bpy.ops.export_scene.gltf(filepath=str(path),use_selection=True,export_format='GLB',export_materials='NONE',
    export_texcoords=True,export_normals=True,export_extras=True,export_yup=True)
 blob=path.read_bytes();length=struct.unpack_from('<I',blob,12)[0];gltf=json.loads(blob[20:20+length])
 triangles=sum(gltf['accessors'][p['indices']]['count']//3 for m in gltf['meshes'] for p in m['primitives'])
 stats.append({'id':asset,'bytes':len(blob),'triangles':triangles,'meshes':len(made),'editable_parts':len(made),'occupied_cubes':len(occupied),'minimum_cube_metres':G})
 collection.hide_viewport=True
placements=[('ceramic-pot-small',(-1.3,0,1.1)),('ceramic-pot-small',(-.7,0,1.1)),
 ('ceramic-pot-small',(-1.,0,.3)),('ceramic-pot',(.4,-.7,0)),('ceramic-pot-medium',(1.1,-.8,0)),
 ('metal-rack',(-1.,0,0)),('doorway',(0,0,0)),('scene-set',(0,0,0))]
demo=bpy.data.collections['COMPOSED_PREVIEW'];demo.hide_render=False;demo.hide_viewport=False
for asset,position in placements:
 for src in new_objects[asset]:
  obj=src.copy();obj.data=src.data;demo.objects.link(obj)
  obj.location=position;obj.scale=(1,1,1)
# Hard cube faces, no bevels or interpolated raster detail.
for mat in materials.values():
 mat.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=1.
 for node in mat.node_tree.nodes:
  if node.type=='TEX_IMAGE':node.interpolation='Closest'
scene=bpy.context.scene
scene['minimum_visual_unit_metres']=G;scene['integer_grid_origin']=(0.,0.,0.)
scene['sample_status']='All visible geometry, placement and material samples use identical integer cubes; awaiting review; no gameplay integration'
scene['atlas_workflow']='Actual Pixelorama Pencil: 32px cells, 128px shared atlas; one native texel per 0.1m cube face'
all_visible=[obj for objects in new_objects.values() for obj in objects]+list(demo.objects)
max_error=0
for obj in all_visible:
 for v in obj.data.vertices:
  point=obj.matrix_basis@v.co
  for c in point:max_error=max(max_error,abs(c/G-round(c/G)))
assert max_error<.00001,max_error
assert all(tuple(o.scale)==(1,1,1) for o in all_visible)
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE),compress=True)
SOURCE.with_suffix('.blend1').unlink(missing_ok=True)
manifest_path=ASSETS/'asset-manifest.json';manifest=json.loads(manifest_path.read_text())
manifest.update(version=5,status='strict-integer-cube-grid-review-pending',minimum_cube_metres=G,grid_origin=[0,0,0],assets=stats)
manifest['atlas'].update(width=128,height=128,tile=32,texels_per_metre=10,texel_size_metres=G,bytes=(ASSETS/'garden-atlas.png').stat().st_size,one_texel_per_cube_face=True)
manifest['placements']=[{'asset':a,'position_blender':p,'scale':1} for a,p in placements]
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(ROOT/'grid-source-check.json').write_text(json.dumps({'revision':5,'software':'Blender '+bpy.app.version_string,
 'edited_existing_source':True,'hidden_original_parts_preserved':len(reference.objects),'minimum_cube_metres':G,
 'integer_world_grid_origin':[0,0,0],'all_visible_vertices_and_placements_on_integer_grid':True,
 'maximum_grid_unit_error':max_error,'all_visible_scales_are_one':True,'cube_faces_sample_one_native_texel':True,
 'geometry_changed_with_explicit_user_authorization':True,'assets':stats},indent=2)+'\n')
print('Strict common cube lattice:',G,'metres. Maximum float error:',max_error)
