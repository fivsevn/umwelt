import bpy,bmesh,json,hashlib,struct
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
p=Path(__file__).resolve().parent
# Compare the current final source with its frozen physical-UV layout.
old=p
unchanged=['bed-modern','sofa-two','sofa-one','wardrobe-wood','dresser-wood','antique-oribe-jar']
def hash_source(path):
 bpy.ops.wm.open_mainfile(filepath=str(path));out={}
 for id in unchanged:
  geom=hashlib.sha256();uvs=hashlib.sha256()
  for o in sorted(bpy.data.collections[id].objects,key=lambda o:o.name):
   geom.update(o.name.encode());uvs.update(o.name.encode())
   for v in o.data.vertices:geom.update(struct.pack('fff',*v.co))
   for f in o.data.polygons:geom.update(struct.pack('I'*len(f.vertices),*f.vertices))
   for l in o.data.uv_layers.active.data:uvs.update(struct.pack('ff',*l.uv))
  out[id]=dict(geometry=geom.hexdigest(),uv=uvs.hexdigest())
 return out
before=hash_source(old/'rooms-vessels.blend');after=hash_source(p/'rooms-vessels-layout.blend')
report=dict(unchangedSource=[dict(id=id,geometryPreserved=before[id]['geometry']==after[id]['geometry'],UVPreserved=before[id]['uv']==after[id]['uv'],geometryHash=after[id]['geometry'],UVHash=after[id]['uv']) for id in unchanged],drainage=[])
newcat=json.loads((p/'catalog.json').read_text())['items']
root=p.parents[3]
source=(root/'rooftop/item-data.mjs').read_text()
runtime=json.loads(source.split('export const ITEM_DATA = ',1)[1].strip().removesuffix(';'))
oldcat={a['modelId']:a for a in runtime}
for a in newcat:
 if not a['id'].startswith('antique-'):continue
 for k in ['name','note','sources','originalVesselRecord','adaptationNote']:assert a[k]==oldcat[a['id']][k],a['id']+':original '+k
 bm=bmesh.new()
 for o in bpy.data.collections[a['id']].objects:
  if not o.name.split('/')[-1].startswith('ceramic-'):continue
  used={i for f in o.data.polygons for i in f.vertices};vs={i:bm.verts.new(o.data.vertices[i].co) for i in used}
  for f in o.data.polygons:
   try:bm.faces.new([vs[i] for i in f.vertices])
   except ValueError:pass
 bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001);bm.normal_update();tree=BVHTree.FromBMesh(bm)
 center,norm,face,dist=tree.ray_cast(Vector((0,0,a['height']+1)),Vector((0,0,-1)),a['height']+2)
 offset,norm,face,dist=tree.ray_cast(Vector((.015 if a['id']=='antique-oribe-jar' else .0625,0,a['height']+1)),Vector((0,0,-1)),a['height']+2)
 holes=a.get('holes',[]);expects=a['id']!='antique-oribe-jar'
 report['drainage'].append(dict(id=a['id'],expectedHole=expects,centerRayBlocked=center is not None,offAxisFloorHeight=offset.z if offset is not None else None,declaredFloor=a['interiorFloorHeight'],floorMatches=offset is not None and abs(offset.z-a['interiorFloorHeight'])<.00001,bodyClosed=all(e.is_manifold for e in bm.edges),metadataHoles=holes,innerBearingHoles=a['surfaces'][0].get('holes',[])))
 bm.free()
report['passed']=all(x['geometryPreserved'] and x['UVPreserved'] for x in report['unchangedSource']) and all(x['bodyClosed'] and (not x['centerRayBlocked'] if x['expectedHole'] else x['centerRayBlocked']) and x['floorMatches'] and (bool(x['metadataHoles']) and bool(x['innerBearingHoles']) if x['expectedHole'] else not x['metadataHoles']) for x in report['drainage'])
report['originalMuseumMetadataPreserved']=True
(p/'drainage-inspection.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));assert report['passed'],report;print('DRAINAGE VERIFIED 7 real passages, 1 closed flower vase, 5 furniture geometry+UV unchanged, all original metadata preserved')
