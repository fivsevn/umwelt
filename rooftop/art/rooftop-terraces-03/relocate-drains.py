"""Edit the saved third revision: two circular drains and north material depth.
Do not replay on the finished fourth revision. Original architecture is read-only.
"""
import bpy,bmesh,sys,math,json,hashlib
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'rooftop-furniture-02'))
import assetlib as lib
lib.ROOT=HERE;lib.SIZE=1024
lib.PALETTE.update({'drain-iron':'#737c70','drain-recess':'#3d4941'})
mode=lib.MODE
sx,sy,sz=.2707537401739019,.4638375014617893,.5357142857142857
V=lib.Vector
bpy.ops.wm.open_mainfile(filepath=str(HERE/'terraces'/('terraces.blend' if mode=='layout' else 'terraces-layout.blend')))
b=lib.Builder.__new__(lib.Builder);b.family='terraces';b.fields=[];b.materials={};b.path=HERE/'terraces';b.atlas=HERE/'preview/assets/terraces-atlas.png'
a=lib.Asset.__new__(lib.Asset);a.b=b;a.id='terraces';a.col=bpy.data.collections['terraces'];a.surfaces=[]
a.objects=[o for o in a.col.objects if o.type=='MESH'];b.assets=[a];a.meta=json.loads((b.path/'catalog.json').read_text())['items'][0]
for mat in bpy.data.materials:
 if 'finish' in mat:b.materials[mat['finish']]=mat
layout=json.loads((b.path/'texture-layout.json').read_text())

def digest(ob):
 data=[list(ob.matrix_world),[list(v.co) for v in ob.data.vertices],[list(p.vertices) for p in ob.data.polygons],[list(x.uv)for x in ob.data.uv_layers.active.data]]
 return hashlib.sha256(str(data).encode()).hexdigest()
def normals(ob):
 bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(ob.data);bm.free();ob.data.update()

if mode=='layout':
 assert bpy.context.scene.get('detailRevision')==3,'Open the current approved third revision only.'
 before={ob.name:digest(ob) for ob in a.objects};removed=[];shifted=[]
 # Delete the previous three rectangular grates, their shoulders and the two
 # channels leading to obsolete positions. House downpipes remain in place.
 for ob in list(a.objects):
  if ob.get('part_role') in ('drain-interior','drain-rim','drain-bar','drain-surround','channel-bottom','channel-lip'):
   removed.append(ob.name);a.objects.remove(ob);bpy.data.objects.remove(ob,do_unlink=True)
 # A 2 mm rise of the independent continuous finish covers the old original
 # drain tops (0.0401 game units) without editing their protected source mesh.
 lift=.002
 for ob in a.objects:
  if ob.name.endswith(('/north-floor-finish','/south-floor-finish')) or ob.get('part_role')=='floor-repair':
   for v in ob.data.vertices:v.co.z+=lift
   ob.data.update();shifted.append(ob.name)
 top=.038*sz+lift
 bpy.context.scene['floorSurfaceHeight']=top
 # User-marked corners: north projection's inner return; south outer corner.
 centres=[('north',-.72*sx,8.9*sy),('south',-8.9*sx,-35.15*sy)]
 radius=.18;sides=16
 for region,cx,cy in centres:
  # Solid circular rebate, sloping lip and a genuinely open grate above its bed.
  profile=[(radius,top+.0005),(radius,top+.005),(.161,top+.010),(.143,top+.010),(.143,top+.001),(radius,top+.0005)]
  ring=a.lathe(region+'-round-drain-ring',profile,'drain-iron','round-drain-rim',sides=sides,center=(cx,cy,0));ring['drainCentre']=[cx,cy]
  a.cyl(region+'-round-drain-bed',.144,.001,(cx,cy,top+.001),'drain-recess','round-drain-interior',vertices=sides)
  # Three individually clipped bars fit within the round opening.
  for j,offset in enumerate([-.078,0,.078]):
   half=.014;left=offset-half;right=offset+half
   yl=math.sqrt(.145**2-left**2);yr=math.sqrt(.145**2-right**2)
   poly=[(left,-yl),(right,-yr),(right,yr),(left,yl)]
   points=[(cx+x,cy+y,z)for z in (top+.002,top+.009)for x,y in poly]
   ob=a.mesh(region+f'-round-drain-bar-{j}',points,[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],'drain-iron','round-drain-bar')
  for ob in a.objects:
   if ob.name.startswith('terraces/'+region+'-round-drain'):normals(ob)
 # Append new charts, leaving existing UV addresses and native painting intact.
 new=[ob for ob in a.objects if '-round-drain-' in ob.name]
 b.fields=[]
 for ob in new:b.record(a,ob,ob['finish'],ob['part_role'])
 b.pack();newfields=b.fields
 for f in newfields:
  f['y']+=layout['usedRows'];uv=bpy.data.objects[f['object']].data.uv_layers.active
  for li in f['loopIndices']:uv.data[li].uv.y-=layout['usedRows']/1024
 b.usedRows+=layout['usedRows'];assert b.usedRows<=1024
 kept=[]
 for f in layout['fields']:
  name=f['id'].rsplit(':',1)[0]
  if name in removed:continue
  f['object']=name
  if name in shifted:f['paintOrigin'][2]+=lift;f['center'][2]+=lift
  kept.append(f)
 b.fields=kept+newfields;b.plans()
 selected=[f['id']for f in b.fields if f in newfields or f['material']in ('north-wash','north-repair','old-mortar','concrete','south-concrete')]
 (b.path/'revision-four-fields.json').write_text(json.dumps(selected))
 unchanged={name:sha for name,sha in before.items()if name not in removed+shifted}
 assert all(digest(bpy.data.objects[name])==sha for name,sha in unchanged.items())
 report=dict(removed=removed,raisedContinuousFloorsAndInlays=shifted,unmodifiedObjectsVerified=len(unchanged),roundDrainCentres={region:[x,y]for region,x,y in centres},floorRiseMetres=lift,paintedCharts=len(selected),newCharts=len(newfields))
 (HERE/'drain-revision.json').write_text(json.dumps(report,indent=2)+'\n')
 bpy.context.scene['detailRevision']=4
 bpy.ops.wm.save_as_mainfile(filepath=str(b.path/'terraces-layout.blend'))
 print('LOCAL DRAIN REVISION',len(a.objects),'parts;',len(selected),'painted charts;',b.usedRows,'rows')
else:
 assert bpy.context.scene.get('detailRevision')==4
 for mat in b.materials.values():
  for node in list(mat.node_tree.nodes):
   if node.type=='TEX_IMAGE':mat.node_tree.nodes.remove(node)
 for im in list(bpy.data.images):
  if im.packed_file:bpy.data.images.remove(im)
 b.apply_atlas()
 parent=bpy.data.objects.new('Terrace metric-to-game conversion',None);bpy.context.scene.collection.objects.link(parent);parent.scale=(1/sx,1/sy,1/sz)
 for ob in a.objects:ob.parent=parent
 bpy.ops.object.select_all(action='DESELECT')
 for ob in a.objects:ob.select_set(True)
 parent.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(HERE/'preview/assets/terraces.glb'),export_format='GLB',use_selection=True,export_yup=True,export_extras=True)
 for ob in a.objects:ob.parent=None
 bpy.data.objects.remove(parent,do_unlink=True)
 for im in bpy.data.images:
  if im.packed_file:im.filepath='//terraces-atlas.png'
 bpy.ops.wm.save_as_mainfile(filepath=str(b.path/'terraces.blend'))
 b.validate('terraces.blend')
