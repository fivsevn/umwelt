"""Revise the saved, independent terrace Blend; never load the large sandbox.

layout edits the current source once, preserving its servicing/floor objects.
final opens that saved layout and only attaches the native Pixelorama export.
"""
import bpy,bmesh,sys,math,json
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'rooftop-furniture-02'))
import assetlib as lib
lib.ROOT=HERE;lib.SIZE=1024
lib.PALETTE.update({'limewash':'#bcbcaf','render':'#98988a','flashing':'#7b817b',
 'concrete':'#a4a79b','south-concrete':'#b0ac9e','coping':'#bcb9a7',
 'pipe':'#929d95','rust':'#7c6751','grate':'#626f69','void':'#48534e',
 'broken-plaster':'#c7c1a9','mortar':'#77796b','brick':'#9b8065',
 'screed-patch':'#b9b7a6','patch-edge':'#888a7c','reveal':'#b8b9aa'})
sx,sy,sz=.2707537401739019,.4638375014617893,.5357142857142857
V=lib.Vector
P=lambda x,y,z:V((x*sx,y*sy,z*sz))
mode=lib.MODE
bpy.ops.wm.open_mainfile(filepath=str(HERE/'terraces'/('terraces.blend' if mode=='layout' else 'terraces-layout.blend')))
# Bind the authoring helpers to the existing native scene without resetting it.
b=lib.Builder.__new__(lib.Builder)
b.family='terraces';b.fields=[];b.materials={};b.path=HERE/'terraces';b.atlas=HERE/'preview/assets/terraces-atlas.png'
a=lib.Asset.__new__(lib.Asset);a.b=b;a.id='terraces';a.col=bpy.data.collections['terraces'];a.surfaces=[]
a.objects=[o for o in a.col.objects if o.type=='MESH'];b.assets=[a]
a.meta=json.loads((b.path/'catalog.json').read_text())['items'][0]
for mat in bpy.data.materials:
 if 'finish' in mat:
  key=mat['finish'];b.materials[key]=mat
  if key in lib.PALETTE:mat['base_hex']=lib.PALETTE[key]

def normals(ob):
 bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(ob.data);bm.free();ob.data.update()

def remove(ob):
 a.objects.remove(ob);bpy.data.objects.remove(ob,do_unlink=True)

def prism(name,poly,origin,u,v,normal,d0,d1,mat,role):
 origin,u,v,normal=map(V,(origin,u,v,normal));n=len(poly)
 points=[tuple(origin+u*x+v*y+normal*d) for d in (d0,d1) for x,y in poly]
 faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 ob=a.mesh(name,points,faces,mat,role);normals(ob);return ob

def cut(ob,cutter):
 bpy.context.view_layer.objects.active=ob
 mod=ob.modifiers.new('Local finish loss','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
 bpy.ops.object.modifier_apply(modifier=mod.name);remove(cutter);normals(ob)

def clip(poly,axis,value,above):
 out=[]
 for s,e in zip(poly,poly[1:]+poly[:1]):
  si=(s[axis]>=value) if above else (s[axis]<=value)
  ei=(e[axis]>=value) if above else (e[axis]<=value)
  if si!=ei:
   t=(value-s[axis])/(e[axis]-s[axis]);out.append(tuple(s[k]+t*(e[k]-s[k]) for k in range(2)))
  if ei:out.append(e)
 return out

def damaged_panel(name,origin,u,width,height,normal,holes):
 # Each opening has a recessed mortar bed, an angled broken edge, and the
 # unbroken render surface at a separate depth. Boolean edits affect only it.
 v=V((0,0,1));u=V(u);normal=V(normal);origin=V(origin)
 rect=[(0,0),(width,0),(width,height),(0,height)]
 prism(name+'-substrate',rect,origin,u,v,normal,0,.010,'render','aged-substrate')
 skin=prism(name+'-finish',rect,origin,u,v,normal,.010,.034,'limewash',name)
 for idx,(cx,cz,rx,rz,brick) in enumerate(holes):
  shape=[(-.96,-.35),(-.84,-.80),(-.37,-.92),(-.15,-.73),(.22,-1),(.72,-.66),(.98,-.25),(.81,.05),(1,.37),(.52,.87),(.12,.76),(-.27,1),(-.68,.67),(-.61,.33)]
  inner=[(cx+rx*x,cz+rz*y) for x,y in shape]
  outer=[(cx+rx*x*1.08,cz+rz*y*1.08) for x,y in shape]
  cutter=prism(name+'-cut',outer,origin,u,v,normal,-.015,.09,'render','temporary-cutter')
  cut(skin,cutter)
  points=[tuple(origin+u*x+v*y+normal*d) for poly,d in ((outer,.034),(inner,.012)) for x,y in poly];n=len(inner)
  rim=a.mesh(name+f'-broken-edge-{idx}',points,[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],'broken-plaster','fracture-bevel')
  if brick:
   prism(name+f'-mortar-{idx}',inner,origin,u,v,normal,.0102,.011,'mortar','exposed-mortar')
   for row in range(math.floor((cz-rz)/.13),math.ceil((cz+rz)/.13)):
    for col in range(math.floor((cx-rx)/.31)-1,math.ceil((cx+rx)/.31)+1):
     x0=col*.31+(row%2)*.155;y0=row*.13
     poly=inner
     for axis,val,above in [(0,x0+.012,True),(0,x0+.30,False),(1,y0+.012,True),(1,y0+.12,False)]:
      poly=clip(poly,axis,val,above) if poly else []
     if len(poly)<3:continue
     area=abs(sum(p[0]*q[1]-q[0]*p[1] for p,q in zip(poly,poly[1:]+poly[:1])))/2
     if area<.0001:continue
     prism(name+f'-brick-{idx}-{row}-{col}',poly,origin,u,v,normal,.0115,.017+(row+col)%3*.0018,'brick','exposed-brick')
 return skin

if mode=='layout':
 assert bpy.context.scene.get('detailRevision',1)<2,'Saved source already contains this revision; edit it directly.'
 # Preserve floor, drainage, downpipes, brackets, boxes and the entry threshold.
 for ob in list(a.objects):
  name=ob.name.split('/',1)[-1]
  if name in ('north-house-render','north-entry-return','north-entry-back','south-house-render') or '-wall-' in name or '-coping-' in name:
   remove(ob)
 damaged_panel('north-house-render',P(-10,-3.97,.04),(1,0,0),16*sx,5.50*sz,(0,1,0),
  [(.72,.36,.45,.23,False),(2.42,.31,.43,.24,True),(3.61,1.57,.32,.48,False),(1.70,2.59,.37,.17,False)])
 damaged_panel('north-entry-return',P(6.01,-12,.04),(0,1,0),8*sy,5.50*sz,(1,0,0),
  [(1.35,.36,.49,.23,False),(2.85,1.74,.30,.36,False)])
 damaged_panel('north-entry-back',P(6,-11.97,.04),(1,0,0),4*sx,5.50*sz,(0,1,0),[(.55,.39,.36,.23,True)])
 damaged_panel('south-house-render',P(-10,-28.03,.04),(1,0,0),20*sx,5.50*sz,(0,-1,0),
  [(1.54,.32,.51,.22,True),(3.28,.30,.40,.20,False),(3.82,1.46,.22,.37,False),(2.77,2.54,.47,.20,False)])
 north=[((-10,8),(-2,8),(0,-1),1.926),((-2,8),(-2,12),(1,0),1.926),((-2,12),(6,12),(0,-1),1.926),((6,12),(6,8),(-1,0),1.926),((6,8),(10,8),(0,-1),1.926),((10,8),(10,-12),(-1,0),1.926),((10,-12),(6,-12),(0,1),1.926),((-10,8),(-10,-4),(1,0),1.926)]
 south=[((-10,-36),(10,-36),(0,1),1.9107),((-10,-36),(-10,-28),(1,0),3.2231),((10,-36),(10,-28),(-1,0),3.2231)]
 for scene,edges in [('north',north),('south',south)]:
  for idx,(start,end,n,h) in enumerate(edges):
   start=P(*start,0);end=P(*end,0);normal=V(n+(0,));direction=(end-start).normalized();length=(end-start).length
   half=.125*(sx if n[0] else sy);origin=start+normal*(half+.002)+V((0,0,.027));height=(h-.22)*sz-.027
   holes=[]
   if length>1.5:
    holes.append((length*.36,min(.45,height*.51),min(.48,length*.18),min(.24,height*.31),idx%3==0))
   if length>3.2:holes.append((length*.78,min(.69,height*.70),.27,.15,False))
   damaged_panel(f'{scene}-parapet-{idx}',origin,direction,length,height,normal,holes)
   # Low-poly coping stones have individual chipped outlines, slopes and joints.
   count=max(1,math.ceil(length/.65));step=length/count;width=.34*(sx if n[0] else sy)+.045
   for j in range(count):
    w=step-.017;d=width;chip=.035+.009*((j+idx)%4)
    poly=[(-w/2,-d/2),(w/2-chip,-d/2),(w/2,-d/2+chip*.6),(w/2,d/2-.025),(w/2-.022,d/2),(-w/2+.018,d/2),(-w/2,d/2-.018)]
    if (j+idx)%3==0:
     poly=[(-w/2,-d/2),(-.08,-d/2),(-.055,-d/2+.045),(.035,-d/2+.033),(.07,-d/2),(w/2-chip,-d/2),(w/2,-d/2+chip*.6),(w/2,d/2-.025),(w/2-.022,d/2),(-w/2+.018,d/2),(-w/2,d/2-.018)]
    center=start+direction*((j+.5)*step)+V((0,0,h*sz))
    prism(f'{scene}-coping-{idx}-{j}',poly,center,direction,normal,(0,0,1),.002,.055+(j%4)*.003,'coping','chipped-coping')
   # Physical repair band: a narrow recessed joint/expansion seam in long walls.
   if length>3.2:
    for z in (.19,.65):
     center=origin+direction*(length*.62)+V((0,0,z))+normal*.036
     a.box(f'{scene}-wall-tie-{idx}-{z}',(.065,.018,.045) if abs(normal.y)>.5 else (.018,.065,.045),center,'grate','old-wall-tie',bevel=.004)
 # Stronger weathered window frames: protruding lintel and irregular sloped sills.
 for sc,y,sign,windows in [('north',-3.76,1,[(-8.9,-5.9,1.225,3.775),(-4.05,-1.75,1.595,3.245)]),('south',-28.25,-1,[(-6.7,-3.3,1.25,3.75),(-.1,3.3,1.25,3.75),(5.2,8.6,1.25,3.75)])]:
  for idx,(x0,x1,z0,z1) in enumerate(windows):
   lo=x0*sx-.072;hi=x1*sx+.072;py=y*sy
   a.box(f'{sc}-window-head-{idx}',(hi-lo,.105,.072),((lo+hi)/2,py,z1*sz+.068),'reveal','window-lintel',bevel=.008)
   # Side returns sit outside the original glass, never reducing its opening.
   for xx in (lo+.025,hi-.025):
    a.box(f'{sc}-window-jamb-{idx}-{xx}',(.05,.065,(z1-z0)*sz+.055),(xx,py-sign*.012,(z1+z0)*sz/2),'reveal','window-jamb',bevel=.006)
   span=hi-lo;poly=[(-span/2,-.042),(span/2-.055,-.042),(span/2,.004),(span/2,.15),(.11,.15),(.07,.126),(-.02,.143),(-span/2+.04,.15),(-span/2,.11)]
   prism(f'{sc}-window-sill-{idx}',poly,((lo+hi)/2,py,z0*sz-.075),(1,0,0),(0,sign,0),(0,0,1),0,.055,'coping','chipped-sill')
 # Separate thin repair pours break the floor plane. All rise less than 2 cm.
 repairs=[('north',(.25,1.18),1.04,1.50,.015),('north',(-1.73,-.95),.63,1.01,.010),('north',(1.92,-2.80),.72,1.26,.012),('south',(-.66,-14.58),1.01,1.42,.014),('south',(1.76,-15.56),.69,.90,.009)]
 for i,(sc,(cx,cy),w,d,lift) in enumerate(repairs):
  raw=[(-.5,-.39),(-.37,-.50),(.22,-.47),(.47,-.38),(.43,-.16),(.50,.09),(.42,.46),(.10,.50),(-.23,.46),(-.48,.29),(-.43,.07),(-.50,-.12)]
  poly=[(x*w,y*d) for x,y in raw]
  prism(f'{sc}-repair-rim-{i}',poly,(cx,cy,.0206),(1,0,0),(0,1,0),(0,0,1),0,lift*.45,'patch-edge','floor-repair-edge')
  poly=[(x*.965,y*.965) for x,y in poly]
  prism(f'{sc}-screed-repair-{i}',poly,(cx,cy,.0206),(1,0,0),(0,1,0),(0,0,1),.001,lift,'screed-patch','floor-repair')
 # Slender drain surrounds are embedded, with a worn beveled shoulder.
 for i,(x,y) in enumerate([(-9.15,7.05),(8.95,-10.95),(8.85,-35.1)]):
  center=P(x,y,0)
  for axis in (0,1):
   for sign in (-1,1):
    p=center.copy();p[axis]+=sign*(.208 if axis==0 else .223);p.z=.032
    dims=(.055,.48,.024) if axis==0 else (.40,.055,.024)
    a.box(f'drain-shoulder-{i}-{axis}-{sign}',dims,p,'render','drain-surround',bevel=.009)
 bpy.context.scene['detailRevision']=2

# Recalculate physical orthogonal UVs after the geometry edits.
b.fields=[]
for ob in a.objects:
 normals(ob);b.record(a,ob,ob['finish'],ob['part_role'])
b.pack()
# Open fracture bevels need an explicit outward direction; a manifold-normal
# heuristic alone can point an open ring toward the back of its wall. Reverse
# its native loops together with their UVs, preserving the authored charts.
for ob in a.objects:
 if ob.get('part_role')!='fracture-bevel':continue
 substrate=bpy.data.objects[ob.name.split('-broken-edge-')[0]+'-substrate']
 bounds=[(min(v.co[k] for v in substrate.data.vertices),max(v.co[k] for v in substrate.data.vertices)) for k in range(3)]
 axis=min(range(3),key=lambda k:bounds[k][1]-bounds[k][0]);outward=V((0,0,0))
 outward[axis]=1 if sum(v.co[axis] for v in ob.data.vertices)/len(ob.data.vertices)>sum(bounds[axis])/2 else -1
 if sum(p.normal.dot(outward)*p.area for p in ob.data.polygons)<0:
  bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.reverse_faces(bm,faces=list(bm.faces));bm.to_mesh(ob.data);bm.free();ob.data.update()
 ob['finishFrontNormal']=list(outward)
 for f in b.fields:
  if f['object']==ob.name:f['faceNormal']=list(ob.data.polygons[f['polygon']].normal)
b.plans()
if mode=='final':
 # Remove the packed previous atlas before binding the freshly authored PNG.
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
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'terraces'/('terraces.blend' if mode=='final' else 'terraces-layout.blend')))
b.validate('terraces.blend')
print('REFINED TERRACES',len(a.objects),'parts',len(b.fields),'face charts',b.usedRows,'rows')
