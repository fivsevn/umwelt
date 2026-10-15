"""Independent, additive finish model for only the two protagonist terraces.
The complete environment Blend and its exported assets are read-only.
Run with Blender --background --python-exit-code 1 --python this-file -- layout|final.
"""
import sys,math,json,hashlib
from pathlib import Path
import bpy
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'rooftop-furniture-02'))
import assetlib as lib
lib.ROOT=HERE;lib.SIZE=1024
lib.PALETTE.update({'limewash':'#b0b0a1','render':'#96998d','flashing':'#7b817b','concrete':'#a3a79e','south-concrete':'#b0aca0','coping':'#bab8a7','pipe':'#929d95','rust':'#7c6751','grate':'#626f69','void':'#48534e'})
b=lib.Builder('terraces');a=b.asset('terraces','两处天台结构细化','固定建筑')
sx,sy,sz=.2707537401739019,.4638375014617893,.5357142857142857
P=lambda x,y,z:(x*sx,y*sy,z*sz)
def box(n,lo,hi,m,role=None,bevel=0):
 lo=P(*lo);hi=P(*hi)
 return a.box(n,tuple(hi[i]-lo[i]for i in range(3)),tuple((lo[i]+hi[i])/2 for i in range(3)),m,role or n,bevel)
def strip(n,start,end,width,height,m,z=0,bevel=0):
 x1,y1=start;x2,y2=end
 return a.beam(n,(x1,y1,z+height/2),(x2,y2,z+height/2),width,height,m,n,bevel)
# Very thin, closed resurfacing skin: preserves the exact playable outline.
outline=[(-10,8),(-2,8),(-2,12),(6,12),(6,8),(10,8),(10,-12),(6,-12),(6,-4),(-10,-4)]
def floor(name,poly,mat):
 pts=[P(x,y,z)for z in (.023,.038)for x,y in poly];n=len(poly)
 faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n)for i in range(n)]
 a.mesh(name,pts,faces,mat,name)
floor('north-floor-finish',outline,'concrete')
floor('south-floor-finish',[(-10,-36),(10,-36),(10,-28),(-10,-28)],'south-concrete')
# Plaster skins stay behind the original window reveals and preserve every opening.
box('north-house-render',(-10,-4,.04),(6,-3.977,5.54),'limewash')
box('north-entry-return',(6,-12,.04),(6.045,-4,5.54),'limewash')
box('north-entry-back',(6,-12,.04),(10,-11.977,5.54),'limewash')
box('south-house-render',(-10,-28.023,.04),(10,-28,5.54),'limewash')
# Inward plaster faces and shallow angled waterproof upstand at the foot.
north=[((-10,8),(-2,8),(0,-1),1.926),((-2,8),(-2,12),(1,0),1.926),((-2,12),(6,12),(0,-1),1.926),((6,12),(6,8),(-1,0),1.926),((6,8),(10,8),(0,-1),1.926),((10,8),(10,-12),(-1,0),1.926),((10,-12),(6,-12),(0,1),1.926),((-10,8),(-10,-4),(1,0),1.926)]
south=[((-10,-36),(10,-36),(0,1),1.9107),((-10,-36),(-10,-28),(1,0),3.2231),((10,-36),(10,-28),(-1,0),3.2231)]
for scene,edges in [('north',north),('south',south)]:
 for idx,(start,end,normal,h)in enumerate(edges):
  start=lib.Vector(P(*start,0));end=lib.Vector(P(*end,0));n=lib.Vector(normal+(0,));direction=(end-start).normalized();length=(end-start).length
  # Existing wall is 0.24 game units, with anisotropic authoring conversion.
  half=.125*(sx if normal[0] else sy);inner=half+.009
  p0=start+n*inner;p1=end+n*inner
  skin=[tuple(p0+lib.Vector((0,0,.025))),tuple(p1+lib.Vector((0,0,.025))),tuple(p1+lib.Vector((0,0,(h-.22)*sz))),tuple(p0+lib.Vector((0,0,(h-.22)*sz)))]
  ob=a.mesh(f'{scene}-wall-{idx}',skin,[(0,1,2,3)],'limewash',f'{scene}-parapet')
  # Give every wall finish a real back and edges (9 mm), rather than a decal.
  bpy.context.view_layer.objects.active=ob;ob.select_set(True);mod=ob.modifiers.new('Render thickness','SOLIDIFY');mod.thickness=.009;bpy.ops.object.modifier_apply(modifier=mod.name);ob.select_set(False)
  # Re-record after the native solidify changes topology.
  b.fields=[f for f in b.fields if f['object']!=ob.name];b.record(a,ob,'limewash',f'{scene}-parapet')
  # 12 cm high waterproof cove, with a 4 cm outward toe.
  pts=[]
  for p in (p0,p1):
   pts.extend([tuple(p+lib.Vector((0,0,.025))),tuple(p+n*.045+lib.Vector((0,0,.025))),tuple(p+n*.018+lib.Vector((0,0,.155))),tuple(p+lib.Vector((0,0,.17)))])
  a.mesh(f'{scene}-cove-{idx}',pts,[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],'flashing','waterproof-cove')
  # Coping has a small overhang, bevel, mortar gaps and physical unevenness.
  count=max(1,math.ceil(length/.69));step=length/count;thick=.048
  for j in range(count):
   p=start+direction*((j+.5)*step);p.z=h*sz+.024
   width=.34*(sx if normal[0] else sy)+.034
   dims=(step-.012,width,thick) if abs(direction.x)>.5 else (width,step-.012,thick)
   a.box(f'{scene}-coping-{idx}-{j}',dims,p,'coping','coping-top',bevel=.009)
# Small servicing details along house walls: plaster does not remain a blank plane.
for sc,x,y,sign in [('north',5.35,-3.77,1),('south',9.0,-28.27,-1)]:
 pos=P(x,y,0);px,py,_=pos
 a.tube(sc+'-rainwater-downpipe',[(px,py,2.90),(px,py,.31),(px-.10,py+sign*.12,.16)],.047,'pipe','downpipe',sides=8)
 for z in [.43,1.43,2.53]:
  a.box(sc+'-pipe-wall-mount-'+str(z),(.17,.055,.055),(px,py-sign*.035,z),'grate','pipe-bracket',bevel=.005)
  a.cyl(sc+'-pipe-collar-'+str(z),.056,.04,(px,py,z),'pipe','pipe-collar',vertices=8)
 # A capped service point, small surface conduit, and mounting feet.
 bx=4.25*sx if sc=='south' else px-.52
 a.box(sc+'-service-box',(.23,.095,.28),(bx,py-sign*.025,1.18),'pipe','service-box',bevel=.012)
 a.box(sc+'-service-cover',(.205,.018,.245),(bx,py+sign*.032,1.18),'coping','service-cover',bevel=.006)
 a.tube(sc+'-service-conduit',[(bx,py,1.32),(bx,py,2.97)],.014,'grate','conduit',sides=6)
 for xoff in [-.078,.078]:a.cyl(sc+'-cover-screw-'+str(xoff),.012,.018,(bx+xoff,py+sign*.048,1.18),'grate','screw',vertices=6,rotation=(math.pi/2,0,0))
# Replace the visual upper surfaces of existing drains without altering the floor mesh.
for i,(x,y)in enumerate([(-9.15,7.05),(8.95,-10.95),(8.85,-35.1)]):
 px,py,_=P(x,y,0);w,d=.34,.37
 a.box('drain-well-'+str(i),(w,d,.008),(px,py,.024),'void','drain-interior')
 for dx in [-w/2,w/2]:a.box('drain-side-'+str((i,dx)),(.026,d,.025),(px+dx,py,.034),'grate','drain-rim',bevel=.004)
 for dy in [-d/2,d/2]:a.box('drain-edge-'+str((i,dy)),(w,.026,.025),(px,py+dy,.034),'grate','drain-rim',bevel=.004)
 for j in range(5):a.box('drain-bars-'+str((i,j)),(.023,d-.05,.024),(px+(j-2)*.058,py,.033),'grate','drain-bar',bevel=.003)
# Shallow perimeter channels connect to the real drain positions.
for name,x,y0,y1 in [('north',-9.3,-3.7,7.0),('south',9.1,-35.1,-28.45)]:
 p0=P(x,y0,.045);p1=P(x,y1,.045)
 a.beam(name+'-drainage-channel',p0,p1,.072,.009,'flashing','channel-bottom')
 for dx in [-.048,.048]:a.beam(name+'-channel-lip',(p0[0]+dx,p0[1],.027),(p1[0]+dx,p1[1],.027),.015,.022,'render','channel-lip',bevel=.003)
# Narrow threshold cap in the recessed north entry, kept clear of the door lane.
box('north-entry-threshold',(6.2,-10.0,.04),(9.7,-9.55,.115),'coping','threshold',bevel=.006)
# Native chart packing / editable source. No existing source is saved or exported.
import bmesh
b.fields=[]
for ob in a.objects:
 bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(ob.data);bm.free();ob.data.update()
 b.record(a,ob,ob['finish'],ob['part_role'])
b.pack();b.plans()
mode=lib.MODE
if mode=='final':
 b.apply_atlas()
 # Keep the editable model in physical metres. Export conversion is on a parent,
 # so every part retains its real geometry and physical UV chart.
 parent=bpy.data.objects.new('Terrace metric-to-game conversion',None);bpy.context.scene.collection.objects.link(parent)
 parent.scale=(1/sx,1/sy,1/sz)
 for ob in a.objects:ob.parent=parent
 bpy.ops.object.select_all(action='DESELECT')
 for ob in a.objects:ob.select_set(True)
 parent.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(HERE/'preview/assets/terraces.glb'),export_format='GLB',use_selection=True,export_yup=True,export_extras=True)
 for ob in a.objects:ob.parent=None
 bpy.data.objects.remove(parent,do_unlink=True)
 for im in bpy.data.images:
  if im.packed_file:im.filepath='//terraces-atlas.png'
for c in bpy.data.collections:c.hide_viewport=False;c.hide_render=False
bpy.context.scene['scope']='Only protagonist north terrace and south balcony; independent local preview additions'
bpy.context.scene['texelsPerMetre']=16
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'terraces'/('terraces.blend' if mode=='final' else 'terraces-layout.blend')))
b.validate('terraces.blend')
print('TERRACES',len(a.objects),'parts',len(b.fields),'face charts',b.usedRows,'rows')
