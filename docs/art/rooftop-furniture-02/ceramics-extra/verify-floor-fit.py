"""Read-only native source check for metadata-only floor fits."""
import bpy,json,hashlib,struct,math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
p=Path(__file__).resolve().parent
def object_hashes():
 out={}
 for o in bpy.data.objects:
  if o.type!='MESH' or 'asset_id' not in o:continue
  h=hashlib.sha256()
  for v in o.data.vertices:h.update(struct.pack('<3f',*v.co))
  for f in o.data.polygons:h.update(struct.pack('<I',len(f.vertices)));h.update(struct.pack('<'+'I'*len(f.vertices),*f.vertices))
  for uv in o.data.uv_layers.active.data:h.update(struct.pack('<2f',*uv.uv))
  out[o.name]=h.hexdigest()
 return out
bpy.ops.wm.open_mainfile(filepath=str(p/'ceramics-extra-layout.blend'));before=object_hashes()
bpy.ops.wm.open_mainfile(filepath=str(p/'ceramics-extra.blend'));after=object_hashes()
cat=json.loads((p/'catalog.json').read_text())['items'];rows=[]
for a in cat:
 sf=next(s for s in a['surfaces'] if s['id']=='inside');verts=[];faces=[]
 for o in bpy.data.collections[a['id']].objects:
  if o.get('part_role')!='body:inner-floor':continue
  offset=len(verts);verts.extend(tuple(v.co) for v in o.data.vertices);faces.extend(tuple(offset+i for i in f.vertices) for f in o.data.polygons)
 tree=BVHTree.FromPolygons(verts,faces,all_triangles=False);hits=0;maxerr=0
 for j in range(256):
  t=j*math.tau/256;x=sf['center'][0]+sf['width']/2*math.cos(t);y=sf['center'][1]+sf['depth']/2*math.sin(t)
  loc,norm,face,d=tree.ray_cast(Vector((x,y,sf['height']+.002)),Vector((0,0,-1)),.004)
  if loc is not None:hits+=1;maxerr=max(maxerr,abs(loc.z-sf['height']))
 rows.append(dict(id=a['id'],shape=sf['shape'],ellipsePerimeterRays=256,floorHits=hits,maxHeightError=maxerr,passed=hits==256 and maxerr<1e-6))
freeze=json.loads((p/'mapping-freeze.json').read_text());layoutsha=hashlib.sha256((p/'texture-layout.json').read_bytes()).hexdigest()
report=dict(source='Independent native Blender reopening of frozen layout and final source',geometryAndUVIdentical=before==after,objectsCompared=len(after),frozenLayoutSha256=layoutsha,mappingUnchanged=layoutsha==freeze['layoutSha256'],floorFits=rows,allFloorFitsVerified=all(r['passed'] for r in rows))
report['passed']=report['geometryAndUVIdentical'] and report['mappingUnchanged'] and report['allFloorFitsVerified']
(p/'floor-fit-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False))
if not report['passed']:raise RuntimeError('Floor fit or unchanged geometry verification failed')
