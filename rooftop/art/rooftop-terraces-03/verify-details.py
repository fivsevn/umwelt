"""Read-only independent Blender reopening and scope/UV/export checks."""
import bpy,sys,json,hashlib,struct
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'rooftop-furniture-02'))
import assetlib as lib
lib.ROOT=HERE;lib.SIZE=1024
lib.verify_saved('terraces')
sx,sy,sz=.2707537401739019,.4638375014617893,.5357142857142857
errors=[];counts={'north':0,'south':0};fractures=0;repairs=0;regionalDetails={s:{'fractures':0,'repairs':0} for s in ('north','south')}
for ob in bpy.context.scene.objects:
 if ob.type!='MESH':continue
 p=[ob.matrix_world@v.co for v in ob.data.vertices]
 game=[(q.x/sx,q.y/sy,q.z/sz)for q in p]
 north=all(-10.4<x<10.4 and -12.4<y<12.4 and .0<z<5.64 for x,y,z in game)
 south=all(-10.4<x<10.4 and -36.4<y<-27.8 and .0<z<5.64 for x,y,z in game)
 if not(north or south):errors.append(ob.name)
 else:counts['north' if north else 'south']+=1
 if ob.get('part_role')=='fracture-bevel':
  fractures+=1
  regionalDetails['north' if north else 'south']['fractures']+=1
  outward=lib.Vector(ob['finishFrontNormal'])
  assert all(f.normal.dot(outward)>0 for f in ob.data.polygons),ob.name+': reversed fracture face'
 if ob.get('part_role')=='floor-repair':
  repairs+=1
  regionalDetails['north' if north else 'south']['repairs']+=1
  assert max(v.co.z for v in ob.data.vertices)-.0206<.02,ob.name+': raised floor repair'
  if bpy.context.scene.get('detailRevision',0)>=3:
   assert abs(max(v.co.z for v in ob.data.vertices)-bpy.context.scene.get('floorSurfaceHeight',.038*sz))<.0005,ob.name+': repair must lie flush with the floor'
if bpy.context.scene.get('detailRevision',0)>=3:
 assert regionalDetails=={'north':{'fractures':3,'repairs':2},'south':{'fractures':0,'repairs':0}},regionalDetails
if bpy.context.scene.get('detailRevision',0)>=4:
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
 assert not any(o.get('part_role') in ('drain-interior','drain-rim','drain-bar','drain-surround','channel-bottom','channel-lip') for o in meshes)
 rings=[o for o in meshes if o.get('part_role')=='round-drain-rim']
 assert len(rings)==2 and all(sum(o.name.startswith('terraces/'+side) for o in rings)==1 for side in ('north','south'))
 expected={'north':(-.72*sx,8.9*sy),'south':(-8.9*sx,-35.15*sy)}
 for o in rings:
  side='north' if '/north-' in o.name else 'south';centre=o['drainCentre']
  assert all(abs(x-y)<.00001 for x,y in zip(centre,expected[side]))
  if bpy.context.scene.get('detailRevision')==4:
   radii=[((v.co.x-centre[0])**2+(v.co.y-centre[1])**2)**.5 for v in o.data.vertices]
   assert abs(max(radii)-.18)<.00001
  else:
   radii=[(((v.co.x-centre[0])/sx)**2+((v.co.y-centre[1])/sy)**2)**.5 for v in o.data.vertices]
   assert all(min(abs(r-target) for target in (.45,.435,.405))<.00001 for r in radii)
   diameters=[(max(v.co[k] for v in o.data.vertices)-min(v.co[k] for v in o.data.vertices))/scale for k,scale in ((0,sx),(1,sy))]
   assert all(abs(d-.9)<.00001 for d in diameters),diameters
   assert abs(max(v.co.z for v in o.data.vertices)-bpy.context.scene['floorSurfaceHeight']-.0025)<.00001
 assert bpy.context.scene['floorSurfaceHeight']/sz>.0401
png=(HERE/'terraces/atlas.png').read_bytes()
packed=[i for i in bpy.data.images if i.packed_file]
assert len(packed)==1 and bytes(packed[0].packed_file.data)==png
assert not errors,errors
raw=(HERE/'preview/assets/terraces.glb').read_bytes();n,kind=struct.unpack_from('<II',raw,12);g=json.loads(raw[20:20+n]);off=20+n;ln,kind=struct.unpack_from('<II',raw,off);binary=raw[off+8:off+8+ln]
for im in g['images']:
 view=g['bufferViews'][im['bufferView']];assert binary[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']]==png
report=dict(software=bpy.app.version_string,sourceReopened=True,scopeParts=counts,allVerticesConfinedToTwoTerraces=True,packedAndGlbPngEqualNativePixelorama=True,physicalPlasterOpenings=fractures,shallowFloorRepairs=repairs,regionalDetails=regionalDetails,triangles=sum(len(p.vertices)-2 for o in bpy.context.scene.objects if o.type=='MESH'for p in o.data.polygons),glbBytes=len(raw))
if bpy.context.scene.get('detailRevision',0)>=4:report['circularDrains']={'north':1,'south':1};report['obsoleteRectangularDrainsAndChannels']=0
if bpy.context.scene.get('detailRevision')==5:report['equalSceneDiameters']=.9;report['drainLipRiseMetres']=.0025
(HERE/'scope-verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
