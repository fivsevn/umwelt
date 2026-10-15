"""Build the shared game wardrobe as native, UV-mapped Blender models."""
import bpy,bmesh,json,math,sys,hashlib
from pathlib import Path
from mathutils import Matrix,Euler,Vector
root=Path(__file__).parent
source=root/'fashion-records.json'
data=json.loads(source.read_text());U=data['unitsPerMetre']
blend=root/'fashion-actors.blend'
if '--verify' in sys.argv:
 bpy.ops.wm.open_mainfile(filepath=str(blend))
 meshes=[o for o in bpy.data.objects if o.type=='MESH'];bad=[];inward=[];uvbad=[];densitybad=[]
 for obj in meshes:
  bm=bmesh.new();bm.from_mesh(obj.data)
  if any(not edge.is_manifold for edge in bm.edges):bad.append(obj.name)
  if bm.calc_volume(signed=True)<=0:inward.append(obj.name)
  if not obj.data.uv_layers.active:uvbad.append(obj.name)
  bm.free()
  uv=obj.data.uv_layers.active
  if uv:
   for face in obj.data.polygons:
    indices=list(face.loop_indices)
    for i,li in enumerate(indices):
     lj=indices[(i+1)%len(indices)]
     a=obj.matrix_world@obj.data.vertices[obj.data.loops[li].vertex_index].co
     b=obj.matrix_world@obj.data.vertices[obj.data.loops[lj].vertex_index].co
     if abs((uv.data[li].uv-uv.data[lj].uv).length*512-(a-b).length*16)>.002:densitybad.append(obj.name)
 assert not densitybad,densitybad[:8]
 assert not bad and not inward and not uvbad,(bad[:8],inward[:8],uvbad[:8])
 assert len([c for c in bpy.data.collections if c.get('look')])==len(data['assets'])
 assert all(image.packed_file for image in bpy.data.images if image.type=='IMAGE' and image.has_data)
 print(json.dumps({'independentlyReopened':True,'pairedLooks':len(data['assets']),'meshParts':len(meshes),'closedMeshes':True,'outwardFaces':True,'physicalUVs':True,'recordHash':hashlib.sha256(source.read_bytes()).hexdigest()}))
 sys.exit(0)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for col in list(bpy.data.collections):
 if col.name!='Collection':bpy.data.collections.remove(col)
C=Matrix(((1,0,0),(0,0,-1),(0,1,0)))
image=bpy.data.images.load(str(root.parents[2]/'assets/pixel/material-book.png'));image.pack();image.filepath='//../../../assets/pixel/material-book.png'
bpy.context.preferences.filepaths.save_version=0
fields=json.loads((root.parent/'pixelorama-fields.json').read_text());materials={}
for ai,asset in enumerate(data['assets']):
 col=bpy.data.collections.new(asset['id']);bpy.context.scene.collection.children.link(col);col['look']=asset['id'];nodes={};roots=[]
 for r in asset['records']:
  if r['type'] in ['joint','native-prop']:obj=bpy.data.objects.new(asset['id']+'/joint-'+str(r['id']),None);obj.empty_display_size=.05;obj.scale=r.get('scale',[1,1,1])
  else:
   if r['type']=='box':
    w,h,d=r['size'];verts=[(x*w/2,y*h/2,z*d/2)for x,y,z in [(-1,-1,-1),(1,-1,-1),(1,-1,1),(-1,-1,1),(-1,1,-1),(1,1,-1),(1,1,1),(-1,1,1)]]
    faces=[[1,2,3,0],[7,6,5,4],[4,5,1,0],[5,6,2,1],[6,7,3,2],[7,4,0,3]]
   else:verts=r['vertices'];faces=r['faces']
   mesh=bpy.data.meshes.new(asset['id']+'/part-'+str(r['id']));mesh.from_pydata([(x/U,-z/U,y/U)for x,y,z in verts],[],faces);mesh.update()
   bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
   parent=r
   while parent['parent'] is not None:parent=asset['records'][parent['parent']]
   factor=parent.get('scale',[1])[0]
   uv=mesh.uv_layers.new(name='Pixelorama 16 texels per metre');field=fields.get(r['kind'],fields['paint'])
   for face in mesh.polygons:
    normal=face.normal;ref=Vector((1,0,0)) if abs(normal.z)>.98 else Vector((0,0,1));tangent=(ref-normal*ref.dot(normal)).normalized();bitangent=normal.cross(tangent)
    for li in face.loop_indices:
     point=mesh.vertices[mesh.loops[li].vertex_index].co
     uv.data[li].uv=((field['x']+16+point.dot(tangent)*16*factor)/512,1-(field['y']+16+point.dot(bitangent)*16*factor)/512)
   obj=bpy.data.objects.new(asset['id']+'/part-'+str(r['id']),mesh)
   key=r['color']+':'+r['kind']
   if key not in materials:
    mat=bpy.data.materials.new(key);rgb=[int(r['color'][i:i+2],16)/255 for i in (1,3,5)];mat.diffuse_color=(*rgb,1);mat.use_nodes=True
    mat['pixeloramaSource']='rooftop/art/rooftop-game/material-book.pxo'
    tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image;tex.interpolation='Closest'
    mix=mat.node_tree.nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;mix.inputs[1].default_value=(*rgb,1)
    mat.node_tree.links.new(tex.outputs['Color'],mix.inputs[2]);mat.node_tree.links.new(mix.outputs[0],mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color']);mat.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.9;materials[key]=mat
   mesh.materials.append(materials[key]);obj['materialKind']=r['kind'];obj['sourcePart']=r['id']
  if r['type']=='native-prop':obj['sharedNativeProp']='rooftop/assets/items/'+r['model']+'.glb'
  col.objects.link(obj);nodes[r['id']]=obj
  if r['parent'] is not None:obj.parent=nodes[r['parent']]
  else:roots.append(obj)
  x,y,z=r['position'];obj.location=(x/U,-z/U,y/U);obj.rotation_euler=(C@Euler(r['rotation'],'XYZ').to_matrix()@C.inverted()).to_euler();obj['look']=asset['id']
 # Arrange complete pairs in a compact native editable lookbook.
 for ri,obj in enumerate(roots):obj.location.x+=(ai%10)*2.2+(0 if ri==0 else .80);obj.location.y+=(ai//10)*2.2
bpy.context.scene['source']='Shared 60-look game wardrobe and paired accessories'
bpy.context.scene['sharedPixelorama']='rooftop/art/rooftop-game/material-book.pxo'
bpy.context.scene['unitsPerMetre']=U
bpy.context.scene.unit_settings.system='METRIC'
for screen in bpy.data.screens:
 for area in screen.areas:
  if area.type=='VIEW_3D':
   area.spaces.active.shading.type='MATERIAL';area.spaces.active.region_3d.view_distance=12;area.spaces.active.region_3d.view_location=Vector((4,1,.6))
bpy.ops.wm.save_as_mainfile(filepath=str(blend),compress=True)
print('Saved',len(data['assets']),'complete paired looks:',blend.name)
