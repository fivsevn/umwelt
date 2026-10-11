"""Independent native read-only room geometry/physical-UV verification."""
import bpy,bmesh,json,math,struct,hashlib,sys
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
p=Path(__file__).resolve().parent;final='final' in sys.argv;U=5.6/3
source=p/('room-background.blend' if final else 'room-background-layout.blend')
bpy.ops.wm.open_mainfile(filepath=str(source));a=json.loads((p/'catalog.json').read_text())['items'][0];objects=list(bpy.data.collections['room-background'].objects)
def native(point):return Vector((point[0]/U,-point[2]/U,point[1]/U))
def tree_for(role):
 verts=[];faces=[]
 for o in objects:
  if o.get('part_role')!=role:continue
  off=len(verts);verts.extend(tuple(o.matrix_world@v.co) for v in o.data.vertices);faces.extend(tuple(off+i for i in face.vertices) for face in o.data.polygons)
 return BVHTree.FromPolygons(verts,faces,all_triangles=False)
report=dict(source='Independent native Blender reopening',sourceFile=source.name,meshes=[],uvEdges=0,invalidUVEdges=0,maxAbsoluteTexelError=0,windowRays=[],doorRays=[])
for o in objects:
 bm=bmesh.new();bm.from_mesh(o.data);bm.normal_update()
 report['meshes'].append(dict(name=o.name,role=o['part_role'],boundaryEdges=sum(e.is_boundary for e in bm.edges),nonManifoldEdges=sum(not e.is_manifold for e in bm.edges),volume=bm.calc_volume()))
 bm.free();uv=o.data.uv_layers.active
 for f in o.data.polygons:
  loops=list(f.loop_indices)
  for j,li in enumerate(loops):
   lj=loops[(j+1)%len(loops)];vi=o.data.loops[li].vertex_index;vj=o.data.loops[lj].vertex_index;dist=(o.data.vertices[vi].co-o.data.vertices[vj].co).length
   if dist<1e-8:continue
   pixels=(uv.data[li].uv-uv.data[lj].uv).length*2048;error=abs(pixels-dist*16)
   report['uvEdges']+=1;report['maxAbsoluteTexelError']=max(report['maxAbsoluteTexelError'],error)
   if abs(pixels/dist-16)>.03 and error>.0003:report['invalidUVEdges']+=1
back=tree_for('room-wall-back')
bottom,top=a['windowRuntime']['openingY'];middle=(bottom+top)/2
for x in [-.86,.86]:
 for y in [(bottom+middle)/2,(middle+top)/2]:
  hit=back.ray_cast(native((x,y,-7.3)),Vector((0,-1,0)),.4)[0]
  report['windowRays'].append(dict(runtimePoint=[x,y,-7],wallBlocks=hit is not None))
left=tree_for('room-wall-left')
for y,expect_wall in [(a['door']['heightRuntime']/2,False),(4.75,True)]:
 hit=left.ray_cast(native((-5.3,y,4)),Vector((1,0,0)),.5)[0]
 report['doorRays'].append(dict(runtimePoint=[-5,y,4],wallBlocks=hit is not None,expectedWall=expect_wall,passed=(hit is not None)==expect_wall))
body=next(o for o in objects if o.name.endswith('/door-leaf-body'));coords=[o.matrix_world@v.co for v in body.data.vertices]
runtime=[[v.x*U,v.z*U,-v.y*U] for v in coords];mi=[min(v[k] for v in runtime) for k in range(3)];ma=[max(v[k] for v in runtime) for k in range(3)]
w=a['door']['leafWidthRuntime'];h=a['door']['heightRuntime'];expectedMin=[-4.9-a['door']['leafThicknessRuntime']/2,.02,4-w/2];expectedMax=[-4.9+a['door']['leafThicknessRuntime']/2,.02+h,4+w/2]
report['doorBody']=dict(runtimeMin=mi,runtimeMax=ma,expectedMin=expectedMin,expectedMax=expectedMax,matches=all(abs(mi[k]-expectedMin[k])<2e-6 and abs(ma[k]-expectedMax[k])<2e-6 for k in range(3)))
report['doorLeafParts']=[o.name for o in objects if o['part_role']=='room-door-leaf'];report['doorFrameParts']=[o.name for o in objects if o['part_role']=='room-door-frame']
# Export a material-only check from the saved native source. This does not
# modify the Blend or its mapping. Final runtime export remains ROOT handoff.
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.hide_set(False);o.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
check=p/('final-material-check.glb' if final else 'layout-material-check.glb')
bpy.ops.export_scene.gltf(filepath=str(check),export_format='GLB',use_selection=True,export_yup=True,export_texcoords=True,export_normals=True,export_materials='EXPORT',export_extras=True)
raw=check.read_bytes();size,kind=struct.unpack_from('<II',raw,12);gltf=json.loads(raw[20:20+size]);glass=[m for m in gltf['materials'] if m['name'].endswith(':glass')]
report['glassExport']=dict(materials=glass,passed=len(glass)==1 and glass[0].get('alphaMode')=='BLEND' and abs(glass[0]['pbrMetallicRoughness']['baseColorFactor'][3]-.16)<1e-6)
report['completeClosedSolids']=all(m['nonManifoldEdges']==0 and m['volume']>0 for m in report['meshes'])
report['layoutSha256']=hashlib.sha256((p/'texture-layout.json').read_bytes()).hexdigest()
report['passed']=report['completeClosedSolids'] and not report['invalidUVEdges'] and all(not r['wallBlocks'] for r in report['windowRays']) and all(r['passed'] for r in report['doorRays']) and report['doorBody']['matches'] and report['glassExport']['passed'] and len(report['doorLeafParts'])==len(a['doorLeafParts']) and len(report['doorFrameParts'])==len(a['doorFrameParts'])
(p/('final-source-inspection.json' if final else 'layout-source-inspection.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False))
if not report['passed']:raise RuntimeError('Independent room source inspection failed')
