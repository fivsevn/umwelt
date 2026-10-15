"""Third local revision: edit the saved terrace source, retaining existing UVs.
New topology uses spare atlas space; Pixelorama revises the existing native cel.
"""
import bpy,bmesh,sys,math,json
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'rooftop-furniture-02'))
import assetlib as lib
lib.ROOT=HERE;lib.SIZE=1024
lib.PALETTE.update({'north-wash':'#b5b7a9','south-wash':'#bbb9a8',
 'soft-fracture':'#b2b1a1','old-mortar':'#9a9d8b','north-repair':'#aaa99b'})
V=lib.Vector;mode=lib.MODE
sx,sy,sz=.2707537401739019,.4638375014617893,.5357142857142857
bpy.ops.wm.open_mainfile(filepath=str(HERE/'terraces'/('terraces.blend' if mode=='layout' else 'terraces-layout.blend')))
b=lib.Builder.__new__(lib.Builder);b.family='terraces';b.fields=[];b.materials={};b.path=HERE/'terraces';b.atlas=HERE/'preview/assets/terraces-atlas.png'
a=lib.Asset.__new__(lib.Asset);a.b=b;a.id='terraces';a.col=bpy.data.collections['terraces'];a.surfaces=[]
a.objects=[o for o in a.col.objects if o.type=='MESH'];b.assets=[a];a.meta=json.loads((b.path/'catalog.json').read_text())['items'][0]
for mat in bpy.data.materials:
 if 'finish' in mat:b.materials[mat['finish']]=mat
layout=json.loads((b.path/'texture-layout.json').read_text());old_fields=layout['fields'];old_rows=layout['usedRows']
changed=set()

def normals(ob,outward=None):
 bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
 if outward is not None and sum(f.normal.dot(outward)*f.calc_area() for f in bm.faces)<0:bmesh.ops.reverse_faces(bm,faces=list(bm.faces))
 bm.to_mesh(ob.data);bm.free();ob.data.update()
def remove(ob):
 changed.add(ob.name);a.objects.remove(ob);bpy.data.objects.remove(ob,do_unlink=True)
def prism(name,poly,origin,u,v,normal,d0,d1,mat,role):
 origin,u,v,normal=map(V,(origin,u,v,normal));n=len(poly)
 points=[tuple(origin+u*x+v*y+normal*d) for d in (d0,d1) for x,y in poly]
 faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 ob=a.mesh(name,points,faces,mat,role);normals(ob);changed.add(ob.name);return ob
def cut(ob,cutter):
 bpy.context.view_layer.objects.active=ob;mod=ob.modifiers.new('Local material opening','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
 bpy.ops.object.modifier_apply(modifier=mod.name);remove(cutter);normals(ob);changed.add(ob.name)
def bounds(ob):return [(min(v.co[k] for v in ob.data.vertices),max(v.co[k] for v in ob.data.vertices)) for k in range(3)]
def face_frame(ob):
 bb=bounds(ob);axis=min(range(2),key=lambda k:bb[k][1]-bb[k][0]);normal=V((0,0,0))
 name=ob.name.split('/',1)[-1];substrate=bpy.data.objects[ob.name.replace('-finish','-substrate')];sb=bounds(substrate)
 normal[axis]=1 if sum(bb[axis])>sum(sb[axis]) else -1
 u=V((1,0,0)) if axis==1 else V((0,1,0));origin=V((bb[0][0],bb[1][0],bb[2][0]));origin[axis]=bb[axis][1] if normal[axis]>0 else bb[axis][0]
 return origin,u,normal,bb[1-axis][1]-bb[1-axis][0],bb[2][1]-bb[2][0]

if mode=='layout':
 assert bpy.context.scene.get('detailRevision')==2,'This revision requires the saved second revision; do not replay it.'
 # Remove the uniformly repeated damage and all five raised patch/rim pairs.
 for ob in list(a.objects):
  if ob.get('part_role') in ('fracture-bevel','exposed-brick','exposed-mortar','floor-repair','floor-repair-edge'):remove(ob)
 # Restore every render surface as a complete, closed layer. Retain its original
 # outer plane and the protected underlying large environment.
 skins={}
 for ob in list(a.objects):
  if not(ob.name.endswith('-finish') and ob.get('finish')=='limewash'):continue
  name=ob.name.split('/',1)[-1];origin,u,n,w,h=face_frame(ob);remove(ob)
  mat='south-wash' if name.startswith('south') else 'north-wash'
  skin=prism(name,[(0,0),(w,0),(w,h),(0,h)],origin,u,(0,0,1),n,-.024,0,mat,name[:-7]);skins[name]=(skin,origin,u,n)
 # Three hand-shaped north losses: low horizontal abrasion, a narrow eave chip,
 # and an asymmetric parapet scar. There are no south plaster openings.
 losses=[
 ('north-house-render-finish',2.12,.29,[(-.48,-.08),(-.31,-.13),(-.12,-.11),(.05,-.15),(.33,-.10),(.46,-.02),(.40,.07),(.14,.09),(-.03,.15),(-.18,.08),(-.40,.09)]),
 ('north-house-render-finish',1.45,2.70,[(-.31,-.04),(-.18,-.07),(.03,-.045),(.22,-.055),(.29,.012),(.17,.05),(-.06,.039),(-.22,.066),(-.28,.022)]),
 ('north-parapet-7-finish',3.20,.40,[(-.17,-.23),(-.09,-.25),(.07,-.14),(.13,-.15),(.16,.03),(.09,.10),(.11,.21),(.01,.25),(-.06,.16),(-.13,.09),(-.09,-.04),(-.18,-.10)])]
 for idx,(name,cx,cz,shape) in enumerate(losses):
  skin,origin,u,n=skins[name];v=V((0,0,1));outer=[(cx+x,cz+y) for x,y in shape];inner=[(cx+x*.90,cz+y*.90)for x,y in shape]
  cutter=prism('north-loss-cutter',outer,origin,u,v,n,-.06,.02,'old-mortar','temporary');cut(skin,cutter)
  prism(f'north-weathered-bed-{idx}',inner,origin,u,v,n,-.025,-.018,'old-mortar','recessed-render')
  points=[tuple(origin+u*x+v*y+n*d) for poly,d in ((outer,0),(inner,-.018)) for x,y in poly];count=len(inner)
  rim=a.mesh(f'north-natural-fracture-{idx}',points,[(i,(i+1)%count,(i+1)%count+count,i+count) for i in range(count)],'soft-fracture','fracture-bevel')
  normals(rim,n);rim['finishFrontNormal']=list(n);changed.add(rim.name)
 # Two north repairs are inlaid into the existing finish, with no dark outline
 # or separate perimeter strip. Their surfaces are within 0.5 mm of the floor.
 floor=bpy.data.objects['terraces/north-floor-finish'];top=max(v.co.z for v in floor.data.vertices)
 patches=[
  [(-.62,.84),(-.41,.80),(-.16,.82),(.04,.76),(.32,.81),(.56,.79),(.58,1.12),(.51,1.29),(.57,1.62),(.46,1.86),(.11,1.91),(-.14,1.84),(-.48,1.88),(-.59,1.56),(-.54,1.27)],
  [(-2.01,-1.62),(-1.71,-1.65),(-1.42,-1.60),(-1.43,-1.33),(-1.49,-1.19),(-1.42,-.95),(-1.52,-.73),(-1.78,-.69),(-1.98,-.79),(-1.92,-1.05)]]
 for idx,poly in enumerate(patches):
  cutter=prism('north-inlay-cutter',poly,(0,0,0),(1,0,0),(0,1,0),(0,0,1),.001,.05,'north-repair','temporary');cut(floor,cutter)
  inset=prism(f'north-inlaid-repair-{idx}',poly,(0,0,0),(1,0,0),(0,1,0),(0,0,1),.0125,top+(.00035 if idx==0 else -.00025),'north-repair','floor-repair')
  inset['repairOutline']=json.dumps(poly)
 # Most coping stones keep simple worn corners. Retain only a few small bites,
 # breaking the previous every-third-stone repeating chipped silhouette.
 for ob in list(a.objects):
  if ob.get('part_role')!='chipped-coping' or len(ob.data.vertices)!=22:continue
  name=ob.name.split('/',1)[-1];ids=name.split('-');j=int(ids[-1]);edge=int(ids[-2]);bb=bounds(ob)
  if (j+edge*3)%7==1:
   # The existing four notch vertices move halfway back toward the outside edge.
   axis=0 if bb[0][1]-bb[0][0]>bb[1][1]-bb[1][0] else 1;side=1-axis
   mid=(bb[side][0]+bb[side][1])/2
   for v in ob.data.vertices:
    if abs(v.co[axis]-(bb[axis][0]+bb[axis][1])/2)<.09:
     edgepos=bb[side][0] if v.co[side]<mid else bb[side][1];v.co[side]=(v.co[side]+edgepos)/2
   normals(ob);changed.add(ob.name)
  else:
   axis=0 if bb[0][1]-bb[0][0]>bb[1][1]-bb[1][0] else 1;u=V((1,0,0)) if axis==0 else V((0,1,0));v=V((0,1,0)) if axis==0 else V((1,0,0))
   w=bb[axis][1]-bb[axis][0];d=bb[1-axis][1]-bb[1-axis][0];center=V(((bb[0][0]+bb[0][1])/2,(bb[1][0]+bb[1][1])/2,bb[2][0]));height=bb[2][1]-bb[2][0]
   poly=[(-w/2+.012,-d/2),(w/2-.016,-d/2),(w/2,-d/2+.016),(w/2,d/2-.012),(w/2-.012,d/2),(-w/2+.009,d/2),(-w/2,d/2-.009),(-w/2,-d/2+.012)]
   remove(ob);prism(name,poly,center,u,v,(0,0,1),0,height,'coping','chipped-coping')
 # Keep every unchanged chart at its saved coordinates. Append only revised
 # topology into spare atlas space; the existing native painting stays intact.
 b.fields=[]
 for ob in a.objects:
  if ob.name in changed:b.record(a,ob,ob['finish'],ob['part_role'])
 # Floor pours share one world-aligned texel phase across the actual cutout.
 for f in b.fields:
  if f['material'] not in ('concrete','north-repair') or f['faceNormal'][2]<.99:continue
  ob=bpy.data.objects[f['object']];face=ob.data.polygons[f['polygon']];pts=[ob.data.vertices[i].co for i in face.vertices]
  x0=math.floor(min(p.x for p in pts)*16)/16;y0=math.floor(min(p.y for p in pts)*16)/16
  us=max(p.x for p in pts)-x0;vs=max(p.y for p in pts)-y0
  f.update(paintOrigin=[x0,y0,pts[0].z],uAxis=[1,0,0],vAxis=[0,1,0],uMetres=us,vMetres=vs,w=max(1,math.ceil(us*16)),h=max(1,math.ceil(vs*16)),uvMetres=[(p.x-x0,p.y-y0) for p in pts])
 b.pack();new_fields=b.fields
 for f in new_fields:
  f['y']+=old_rows
  uv=bpy.data.objects[f['object']].data.uv_layers.active
  for li in f['loopIndices']:uv.data[li].uv.y-=old_rows/1024
 b.usedRows+=old_rows;assert b.usedRows<=1024
 kept=[]
 for f in old_fields:
  name=f['id'].rsplit(':',1)[0]
  if name in changed or name not in bpy.data.objects:continue
  f['object']=name;kept.append(f)
 b.fields=kept+new_fields;b.plans()
 paint=[f['id'] for f in b.fields if f in new_fields or f['material'] in ('concrete','south-concrete','coping','reveal','render','flashing')]
 (b.path/'revision-paint-fields.json').write_text(json.dumps(paint))
 bpy.context.scene['detailRevision']=3
 bpy.ops.wm.save_as_mainfile(filepath=str(b.path/'terraces-layout.blend'))
 print('NATURALIZED',len(a.objects),'parts',len(new_fields),'new charts',len(paint),'painted charts',b.usedRows,'rows')
else:
 assert bpy.context.scene.get('detailRevision')==3
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
