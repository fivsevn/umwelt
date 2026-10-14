import bpy,bmesh,json,re
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
p=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(p/'ceramics-extra-layout.blend'))
cat=json.loads((p/'catalog.json').read_text())['items'];report=dict(shells=[],ports=[],innerFloors=[],lids=[],smokeHoles=[])
for a in cat:
 bm=bmesh.new()
 for o in bpy.data.collections[a['id']].objects:
  if not o.name.split('/')[-1].startswith('vessel-'):continue
  used={i for f in o.data.polygons for i in f.vertices};vs={i:bm.verts.new(o.data.vertices[i].co) for i in used}
  for f in o.data.polygons:
   try:bm.faces.new([vs[i] for i in f.vertices])
   except ValueError:pass
 bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001)
 bm.normal_update()
 loc,norm,face,dist=BVHTree.FromBMesh(bm).ray_cast(Vector((0,0,a['height']+1)),Vector((0,0,-1)),a['height']+2)
 report['innerFloors'].append(dict(id=a['id'],actualHitHeight=loc.z if loc is not None else None,declaredHeight=a['interiorFloorHeight'],matches=loc is not None and abs(loc.z-a['interiorFloorHeight'])<.00001))
 report['shells'].append(dict(id=a['id'],faces=len(bm.faces),boundaryEdges=sum(e.is_boundary for e in bm.edges),nonManifoldEdges=sum(not e.is_manifold for e in bm.edges),volume=round(abs(bm.calc_volume()),8)))
 if a['id'] in ('antique-oribe-ewer','antique-banko-teapot','antique-arita-coffee'):
  sx,sy,sz=a['geometryCalibration']['axisFactors']
  if a['id']=='antique-oribe-ewer':origin=Vector((.175,0,.215));direction=Vector((1,0,.7))
  elif a['id']=='antique-banko-teapot':origin=Vector((.097,0,.158));direction=Vector((1,0,.7))
  else:origin=Vector((.119,0,.17));direction=Vector((1,0,0))
  origin=Vector((origin.x*sx,origin.y*sy,origin.z*sz));direction=Vector((direction.x*sx,direction.y*sy,direction.z*sz)).normalized()
  loc,norm,face,d=BVHTree.FromBMesh(bm).ray_cast(origin,direction,.15)
  report['ports'].append(dict(id=a['id'],rayFromChamberHitsWall=loc is not None,distance=d))
 bm.free()
 if a['removableParts']:
  bm=bmesh.new()
  for o in bpy.data.collections[a['id']].objects:
   if not re.fullmatch(r'lid-\d+',o.name.split('/')[-1]):continue
   used={i for f in o.data.polygons for i in f.vertices};vs={i:bm.verts.new(o.data.vertices[i].co) for i in used}
   for f in o.data.polygons:
    try:bm.faces.new([vs[i] for i in f.vertices])
    except ValueError:pass
  bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001);bm.normal_update()
  if a['id']=='antique-kiyomizu-incense':
   sx,sy,sz=a['geometryCalibration']['axisFactors'];tree=BVHTree.FromBMesh(bm)
   for x,y in [(-.060,0),(.060,0),(0,-.060),(0,.060)]:
    loc,norm,face,dist=tree.ray_cast(Vector((x*sx,y*sy,.27*sz)),Vector((0,0,1)),.30)
    report['smokeHoles'].append(dict(position=[x*sx,y*sy],rayHitsCover=loc is not None))
  report['lids'].append(dict(id=a['id'],boundaryEdges=sum(e.is_boundary for e in bm.edges),nonManifoldEdges=sum(not e.is_manifold for e in bm.edges),volume=round(abs(bm.calc_volume()),8)))
  bm.free()
report['allShellsClosed']=all(not x['nonManifoldEdges'] and x['volume']>0 for x in report['shells'])
report['allDeclaredFloorsVerified']=all(x['matches'] for x in report['innerFloors'])
report['allSmokeHolesOpen']=len(report['smokeHoles'])==4 and all(not x['rayHitsCover'] for x in report['smokeHoles'])
report['allLidsClosed']=all(not x['nonManifoldEdges'] and x['volume']>0 for x in report['lids'])
(p/'shell-inspection.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False))
