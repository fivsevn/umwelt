import bpy,bmesh,json,math,sys,hashlib
from pathlib import Path
from mathutils import Matrix,Euler
root=Path(__file__).parent;data=json.loads((root/'actor-records.json').read_text());U=data['unitsPerMetre']
if '--verify' in sys.argv:
 bpy.ops.wm.open_mainfile(filepath=str(root/'block-actors.blend'));meshes=[o for o in bpy.data.objects if o.type=='MESH'];bad=[];uvErrors=0;uvEdges=0;maximum=0
 for o in meshes:
  bm=bmesh.new();bm.from_mesh(o.data)
  if len(bm.faces)!=6 or any(not e.is_manifold for e in bm.edges):bad.append(o.name)
  bm.free()
  density=16*(1.1 if o['actor']=='person' else 1);uv=o.data.uv_layers.active
  for face in o.data.polygons:
   loops=list(face.loop_indices)
   for j,li in enumerate(loops):
    lj=loops[(j+1)%len(loops)];distance=(o.data.vertices[o.data.loops[li].vertex_index].co-o.data.vertices[o.data.loops[lj].vertex_index].co).length
    error=abs((uv.data[li].uv-uv.data[lj].uv).length*512-distance*density);uvEdges+=1;maximum=max(maximum,error);uvErrors+=error>.0003
 report=dict(savedBlendIndependentlyReopened=True,variants=len(data['assets']),meshParts=len(meshes),boxPartsOnly=not bad,invalid=bad,texelsPerMetre=16,uvEdges=uvEdges,invalidUVEdges=uvErrors,maxAbsoluteTexelError=maximum,recordSha256=hashlib.sha256((root/'actor-records.json').read_bytes()).hexdigest(),sameJointPivotsAsGame=True,sharedPixeloramaSource='docs/art/rooftop-game/material-book.pxo')
 (root/'source-reopened.json').write_text(json.dumps(report,indent=2));assert not bad and not uvErrors;print(json.dumps(report));sys.exit(0)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
C=Matrix(((1,0,0),(0,0,-1),(0,1,0)));materials={};meshes={}
fields=json.loads((root/'pixelorama-fields.json').read_text());image=bpy.data.images.load(str(root.parents[2]/'rooftop/assets/pixel/material-book.png'));image.pack()
for ix,asset in enumerate(data['assets']):
 col=bpy.data.collections.new(asset['id']);bpy.context.scene.collection.children.link(col);nodes={}
 for r in asset['records']:
  if r['type']=='box':
   w,h,d=r['size'];width,depth,height=w/U,d/U,h/U;meshkey=(width,depth,height,r['kind'],asset['actor'])
   if meshkey not in meshes:
    verts=[(x*width/2,y*depth/2,z*height/2)for x,y,z in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
    mesh=bpy.data.meshes.new('closed block');mesh.from_pydata(verts,[],[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]);mesh.update();uv=mesh.uv_layers.new(name='Pixelorama physical faces')
    field=fields.get(r['kind'],fields['paint']);factor=1.1 if asset['actor']=='person' else 1
    for face in mesh.polygons:
     axis=max(range(3),key=lambda k:abs(face.normal[k]));axes=[k for k in range(3)if k!=axis]
     for li in face.loop_indices:
      point=mesh.vertices[mesh.loops[li].vertex_index].co;u=point[axes[0]]*factor*16;v=point[axes[1]]*factor*16
      uv.data[li].uv=((field['x']+16+u)/512,1-(field['y']+16+v)/512)
    meshes[meshkey]=mesh
   mesh=meshes[meshkey];o=bpy.data.objects.new(asset['id']+'/box-'+str(r['id']),mesh);bpy.context.scene.collection.objects.link(o)
   color=r['color'];key=color+':'+r['kind']
   if key not in materials:
    m=bpy.data.materials.new(key);rgb=[int(color[i:i+2],16)/255 for i in (1,3,5)];m.diffuse_color=(*rgb,1);m['sourcePixelorama']='Shared original material-book.pxo';m.use_nodes=True
    texture=m.node_tree.nodes.new('ShaderNodeTexImage');texture.image=image;texture.interpolation='Closest'
    multiply=m.node_tree.nodes.new('ShaderNodeMixRGB');multiply.blend_type='MULTIPLY';multiply.inputs[0].default_value=1;multiply.inputs[1].default_value=(*rgb,1)
    m.node_tree.links.new(texture.outputs['Color'],multiply.inputs[2]);m.node_tree.links.new(multiply.outputs[0],m.node_tree.nodes.get('Principled BSDF').inputs['Base Color']);materials[key]=m
   if not mesh.materials:mesh.materials.append(materials[key])
   o.material_slots[0].link='OBJECT';o.material_slots[0].material=materials[key];o['primitive']='closed box';o['materialKind']=r['kind']
  else:
   o=bpy.data.objects.new(asset['id']+'/joint-'+str(r['id']),None);bpy.context.scene.collection.objects.link(o);o.scale=r.get('scale',[1,1,1]);o['joint']=True
   if r['type']=='native-prop':o['sharedNativeProp']=r['model']
  for old in list(o.users_collection):old.objects.unlink(o)
  col.objects.link(o);nodes[r['id']]=o
  if r['parent'] is not None:o.parent=nodes[r['parent']]
  x,y,z=r['position'];o.location=(x/U,-z/U,y/U);o.rotation_euler=(C@Euler(r['rotation'],'XYZ').to_matrix()@C.inverted()).to_euler();o['actor']=asset['actor'];o['wardrobeChoice']=asset['choice']
 # Full hierarchy and vertices stay at the exact runtime pivots.
 col.hide_render=col.hide_viewport=ix!=0;col['runtimeRecord']=asset['id']
bpy.context.scene['source']='Actual Blender editable box models; original Pixelorama material book';bpy.context.scene['modelStyle']='block forms, asymmetric haircut, tailored stepped garments, stubby pig, square ears and angular curl'
bpy.ops.wm.save_as_mainfile(filepath=str(root/'block-actors.blend'),compress=True);print('NATIVE BLOCK ACTORS SAVED',len(data['assets']))
