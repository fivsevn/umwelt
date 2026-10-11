"""Sixteen newly authored complete museum-informed Japanese collection vessels.
Native Blender geometry, original physical 16 px/m Pixelorama painting.
"""
import sys,math,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from assetlib import Builder,PALETTE,MODE,verify_saved
import bpy,bmesh
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
FAMILY='ceramics-extra'
PALETTE.update({
 'shigaraki-fired':'#9e654a','shigaraki-inner':'#88654e','shigaraki-clay':'#77543e',
 'bizen-blue':'#87948b','bizen-inner':'#7a8379','bizen-clay':'#656c61',
 'karatsu-dark':'#514c43','karatsu-inner':'#5c574a','karatsu-clay':'#78634e',
 'hagi-cream':'#d6c3a0','hagi-inner':'#ddccad','hagi-clay':'#977858',
 'kiyomizu-brown':'#88705c','kiyomizu-inner':'#aa957a','kiyomizu-clay':'#706049',
 'kenzan-brown':'#79543c','kenzan-inner':'#bfaa84','kenzan-clay':'#977551',
 'kakiemon-white':'#e5e1cd','kakiemon-inner':'#ddd9c6','kakiemon-clay':'#c3bdab',
 'tokoname-ash':'#928c75','tokoname-inner':'#8d7c61','tokoname-clay':'#70604b',
 'oribe-ewer-white':'#d9c7a6','oribe-ewer-green':'#426b53','oribe-ewer-inner':'#aaa084','oribe-ewer-clay':'#887452',
 'banko-fired':'#a87b55','banko-inner':'#926b49','banko-clay':'#855e3f',
 'iga-fired':'#906747','iga-inner':'#816e50','iga-clay':'#6d513b',
 'tamba-ochre':'#aaa082','tamba-inner':'#867a5d','tamba-clay':'#7e704f',
 'echizen-fired':'#a26d52','echizen-inner':'#98745a','echizen-clay':'#79563e',
 'seto-brown':'#624935','seto-inner':'#886a48','seto-clay':'#ac8960','seto-ivory':'#d9d0b4',
 'tsuboya-slip':'#cbbb97','tsuboya-inner':'#9b8164','tsuboya-clay':'#97805e',
 'arita-white':'#e0e3d7','arita-inner':'#d3d9cc','arita-clay':'#b8bcad','arita-silver':'#88918b',
})
REF={r['id']:r for r in json.loads((ROOT/FAMILY/'research.json').read_text())['items']}

# Real closed shell volumes, split into native semantic painting parts only after
# any structural openings have been cut through the complete solid wall.
def revolve(a,name,profile,outer_count,outer_mat,inner_mat,clay_mat,sides=20,radial=None,cutters=None,part='body',rim_mat=None):
 verts=[]
 for k,(r,z) in enumerate(profile):
  for j in range(sides):
   t=j*math.tau/sides;s=radial(t,k) if radial else 1
   verts.append((r*s*math.cos(t),r*s*math.sin(t),z))
 faces=[];groups=[];labels=[]
 for k in range(len(profile)-1):
  if profile[k][0]==profile[k+1][0]==0:continue
  role=(part+':underside' if k==0 else part+':outer' if k<outer_count-1 else part+':rim' if k==outer_count-1 else part+':inner-floor' if k==len(profile)-3 else part+':inner')
  mat=clay_mat if k==0 else outer_mat if k<outer_count-1 else (rim_mat or outer_mat) if k==outer_count-1 else inner_mat
  group=len(labels);labels.append((role,mat,k))
  for j in range(sides):
   n=(j+1)%sides
   if profile[k][0]==0:face=(k*sides+j,(k+1)*sides+n,(k+1)*sides+j)
   elif profile[k+1][0]==0:face=(k*sides+j,k*sides+n,(k+1)*sides+j)
   else:face=(k*sides+j,k*sides+n,(k+1)*sides+n,(k+1)*sides+j)
   faces.append(face);groups.append(group)
 if cutters:
  mesh=bpy.data.meshes.new('temporary complete cuttable shell');mesh.from_pydata(verts,[],faces);mesh.update()
  obj=bpy.data.objects.new('temporary shell',mesh);bpy.context.scene.collection.objects.link(obj)
  for role,mat,k in labels:mesh.materials.append(a.b.material(mat))
  for f,g in zip(mesh.polygons,groups):f.material_index=g
  bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0000001);bm.normal_update();bm.to_mesh(mesh);bm.free();mesh.update()
  for center,direction,radius,depth in cutters:
   bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=radius,depth=depth,location=center)
   tool=bpy.context.object;tool.rotation_euler=Vector(direction).to_track_quat('Z','Y').to_euler()
   bpy.context.view_layer.objects.active=obj;obj.select_set(True);tool.select_set(False)
   mod=obj.modifiers.new('Real communicating opening','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=tool
   bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(tool,do_unlink=True)
  # Repair only unintended exact-Boolean triangular seams. Real channels
  # through a closed solid have no boundary edges and remain open.
  bm=bmesh.new();bm.from_mesh(obj.data);bad=[e for e in bm.edges if e.is_boundary]
  if bad:bmesh.ops.holes_fill(bm,edges=bad,sides=0)
  bm.normal_update();bm.to_mesh(obj.data);bm.free();obj.data.update()
  verts=[tuple(v.co) for v in obj.data.vertices];faces=[tuple(p.vertices) for p in obj.data.polygons];groups=[p.material_index for p in obj.data.polygons]
  bpy.data.objects.remove(obj,do_unlink=True)
 objects=[]
 for g,(role,mat,k) in enumerate(labels):
  ff=[f for f,fg in zip(faces,groups) if fg==g]
  if ff:objects.append(a.mesh(f'{name}-{k}',verts,ff,mat,role))
 return objects

def vessel(a,outer,prefix,height,wall=.017,floor=.028,sides=20,radial=None,cutters=None,foot=0,inner=None,outer_mat=None):
 # Outer profile excludes the axis base; the inside follows actual shoulder/neck.
 bottom=foot
 outside=[(0,bottom)]+[(r,z+bottom) for r,z in outer]
 if inner is None:
  inside=[(max(.005,r-wall),max(floor+bottom,z+bottom)) for r,z in reversed(outer[1:])]
  inside += [(max(.018,outer[0][0]-wall),floor+bottom)]
 else:inside=[(r,z+bottom) for r,z in inner]
 profile=outside+inside+[(0,floor+bottom),(0,bottom)]
 om=outer_mat or prefix+'-fired';im=prefix+'-inner';cm=prefix+'-clay'
 revolve(a,'vessel',profile,len(outside),om,im,cm,sides,radial,cutters)
 if foot:ring_foot(a,outer[0][0]*.92,foot,cm,sides)
 opening=max(.008,outer[-1][0]-wall)
 a.meta.update(wallThickness=wall,interiorFloorHeight=floor+bottom,rimHeight=height+bottom,hasRealInterior=True,hasRealUnderside=True,empty=True,opening=dict(width=2*opening,depth=2*opening,shape='hexagon' if sides==6 else 'circle'))
 a.surface('inside','器物内底',floor+bottom,2*max(.018,outer[0][0]-wall)*.82,2*max(.018,outer[0][0]-wall)*.82,shape='circle',container=True,headroom=height-floor,rimHeight=height+bottom,openingWidth=2*opening)
 return height+bottom

def ring_foot(a,r,h,mat,sides=20):
 revolve(a,'ring-foot',[(r*.78,0),(r,0),(r,h),(r*.76,h),(r*.76,0),(r*.78,0)],3,mat,mat,mat,sides,part='foot')

def feet(a,r,h,mat,wide=False):
 for j in range(3):
  t=-math.pi/2+j*math.tau/3
  if wide:a.box('foot-'+str(j),(.057,.052,h),(r*math.cos(t),r*math.sin(t),h/2),mat,'foot',bevel=.010,rotation=(0,0,t))
  else:a.cyl('foot-'+str(j),h*.42,h,(r*math.cos(t),r*math.sin(t),h/2),mat,'foot',vertices=12,radius_top=h*.65)

def lid(a,r,z,h,mat,inner,clay,knob=.025,sides=20,radial=None,concave=False,holes=None):
 start=len(a.objects);thick=.014
 if concave:profile=[(0,z+thick),(r*.85,z+thick),(r,z+thick),(r,z+h),(r*.76,z+h*.86),(r*.25,z+h*.42),(0,z+h*.40),(0,z+thick)]
 else:profile=[(0,z),(r*.84,z),(r*.97,z+thick*.3),(r,z+thick),(r*.85,z+h*.42),(r*.43,z+h*.85),(0,z+h),(0,z)]
 # Profile starts at lid underside and circles over actual exterior dome.
 revolve(a,'lid',profile,7,mat,inner,inner,sides,radial,holes,part='lid',rim_mat=mat)
 # Correct lid side roles: underside at axis floor, all other dome surfaces outer.
 for o in a.objects[start:]:
  if o['part_role'].endswith('inner-floor') or o['part_role'].endswith('inner'):o['part_role']='lid:underside'
 if knob:
  a.cyl('lid-knob-stem',knob*.55,h*.33,(0,0,z+h+h*.14),mat,'lid:knob',vertices=12)
  a.cyl('lid-knob',knob,h*.58,(0,0,z+h+h*.53),mat,'lid:knob',vertices=12,radius_top=knob*.54)
 a.meta['removableParts']=[o.name for o in a.objects[start:]]
 a.meta['lidUndersideComplete']=True
 return start

def hollow_tube(a,name,path,radii,wall,mat,inner,sides=12):
 pts=[Vector(p) for p in path];verts=[]
 for i,p in enumerate(pts):
  tangent=(pts[min(i+1,len(pts)-1)]-pts[max(0,i-1)]).normalized();u=tangent.cross(Vector((0,1,0))).normalized();v=tangent.cross(u).normalized()
  for r in (radii[i],radii[i]-wall):
   verts.extend(tuple(p+r*(u*math.cos(j*math.tau/sides)+v*math.sin(j*math.tau/sides))) for j in range(sides))
 outer=[];inside=[];rim=[]
 for i in range(len(pts)-1):
  for j in range(sides):
   n=(j+1)%sides;base=i*sides*2;nextb=(i+1)*sides*2
   outer.append((base+j,base+n,nextb+n,nextb+j));inside.append((base+sides+j,nextb+sides+j,nextb+sides+n,base+sides+n))
 for i in (0,len(pts)-1):
  base=i*sides*2
  for j in range(sides):rim.append((base+j,base+sides+j,base+sides+(j+1)%sides,base+(j+1)%sides))
 a.mesh(name+'-outer',verts,outer,mat,'spout:outer');a.mesh(name+'-inner',verts,inside,inner,'spout:inner');a.mesh(name+'-open-rims',verts,rim,mat,'spout:rim')


def asset(b,slug):
 ref=REF['antique-'+slug];a=b.asset(ref['id'],ref['name'],'收藏','both',sources=[dict(label=ref['museum']+' · '+ref['accession'],url=ref['source'])],museumTitle=ref['museumTitle'],museumDimensionsCm=ref['museumDimensionsCm'],period=ref['period'],referenceUnknown=ref['referenceUnknown'],previousReferenceReuse=ref['previousReferenceReuse'],sourceProvenance=ref['sourceProvenance'],geometryRebuilt=True,replica=False,removableParts=[],note='馆藏名目、器形与可见纹饰的原创低多边形转译；未见内外面为朴素推定。')
 return a

def build(b):
 # Large storage jar: thick thrown lip and broad coil-built shoulder.
 a=asset(b,'shigaraki-jar');r=.3125;h=.625*.467/.394
 vessel(a,[(r*.55,0),(r*.69,h*.10),(r*.94,h*.38),(r,h*.60),(r*.95,h*.75),(r*.65,h*.86),(r*.44,h*.90),(r*.43,h*.965),(r*.48,h*.985),(r*.48,h),(r*.42,h)],'shigaraki',h,wall=.027,floor=.040,radial=lambda t,k:1+.016*math.sin(t*3+.4))
 a.meta['gameScaleFactor']=.625/.394
 # Bizen gourd: two distinct vessels of curvature, continuous actual interior.
 a=asset(b,'bizen-gourd');r=.21875;h=.4375*.182/.115
 vessel(a,[(r*.59,0),(r*.91,h*.08),(r,h*.25),(r*.93,h*.40),(r*.63,h*.53),(r*.29,h*.60),(r*.26,h*.65),(r*.48,h*.69),(r*.59,h*.77),(r*.53,h*.84),(r*.31,h*.90),(r*.17,h*.93),(r*.17,h*.985),(r*.20,h),(r*.15,h)],'bizen',h,wall=.017,floor=.03,outer_mat='bizen-blue')
 a.meta['gameScaleFactor']=.4375/.115
 # Karatsu and Hagi are separate profiles, fired glaze palettes and foot proportions.
 a=asset(b,'karatsu-bowl');r=.25;h=.5*.071/.14;f=.025
 vessel(a,[(r*.45,0),(r*.61,h*.11),(r*.85,h*.35),(r*.97,h*.69),(r,h-f)],'karatsu',h-f,wall=.02,floor=.027,foot=f,outer_mat='karatsu-dark',radial=lambda t,k:1+.016*math.sin(t*3))
 a.meta['gameScaleFactor']=.5/.14
 a=asset(b,'hagi-bowl');r=.25;h=.5*.079/.127;f=.057
 vessel(a,[(r*.48,0),(r*.54,h*.10),(r*.80,h*.34),(r*.97,h*.64),(r,h-f)],'hagi',h-f,wall=.022,floor=.023,foot=f,outer_mat='hagi-cream',radial=lambda t,k:1+.02*math.sin(t*5+.9))
 a.meta['gameScaleFactor']=.5/.127
 # Kiyomizu incense burner: body chamber, pierced removable cover, two ears, tripod.
 a=asset(b,'kiyomizu-incense');h=.4375*.086/.097;r=.4375*.076/.097/2;fh=.041;bodytop=h*.79
 vessel(a,[(r*.86,0),(r*.97,.016),(r,bodytop-fh-.013),(r*1.015,bodytop-fh),(r*.93,bodytop-fh)],'kiyomizu',bodytop-fh,wall=.020,floor=.024,foot=0,outer_mat='kiyomizu-brown')
 # Raise shell to real tripod height, including physical paint coordinates.
 for o in a.objects:
  for v in o.data.vertices:v.co.z+=fh
 # Re-record newly moved geometry once; no packed mappings yet.
 b.fields=[f for f in b.fields if f['asset']!=a.id]
 for o in a.objects:b.record(a,o,o['finish'],o['part_role'])
 a.surfaces[0]['height']+=fh;a.surfaces[0]['rimHeight']+=fh;a.meta['interiorFloorHeight']+=fh;a.meta['rimHeight']+=fh
 feet(a,r*.73,fh,'kiyomizu-clay')
 for side in (-1,1):a.tube('ear-'+str(side),[(side*r*.96,0,bodytop*.59),(side*(r+.052),0,bodytop*.65),(side*(r+.052),0,bodytop*.73),(side*r*.96,0,bodytop*.79)],.018,'kiyomizu-brown','ear',sides=12)
 holes=[((x,y,bodytop+.026),(0,0,1),.025,.18) for x,y in [(-.060,0),(.060,0),(0,-.060),(0,.060)]]
 lid(a,r*1.005,bodytop-.004,h-bodytop-.012,'kiyomizu-brown','kiyomizu-inner','kiyomizu-clay',knob=0,holes=holes)
 a.meta.update(gameScaleFactor=.4375/.097,smokeHoles=4)
 # Chestnut box: asymmetrical nut shell, true lower cavity and matching cover.
 a=asset(b,'kenzan-chestnut');r=.1875;h=.375*.032/.058;bodyh=.375*.015/.058
 def chestnut(t,k):return .88+.12*math.cos(t)-.055*math.cos(2*t)
 vessel(a,[(r*.53,0),(r*.89,.018),(r,bodyh*.78),(r*.94,bodyh)],'kenzan',bodyh,wall=.017,floor=.022,radial=chestnut,outer_mat='kenzan-brown')
 lid(a,r*.965,bodyh-.011,h-bodyh,'kenzan-brown','kenzan-inner','kenzan-clay',knob=0,radial=chestnut)
 a.meta.update(gameScaleFactor=.375/.058,opening=dict(width=r*1.7,depth=r*1.75,shape='organic'),profileInferred=True)
 # Hexagonal slab-built covered jar, conservative known proportions.
 a=asset(b,'kakiemon-hex');r=.21875;h=.4375*.31/.16;bodytop=h*.80
 vessel(a,[(r*.70,0),(r*.83,h*.04),(r,h*.18),(r,h*.54),(r*.87,h*.68),(r*.53,h*.75),(r*.48,bodytop)],'kakiemon',bodytop,wall=.019,floor=.029,sides=6,outer_mat='kakiemon-white',foot=.021)
 lid(a,r*.51,bodytop+.010,h-bodytop-.053,'kakiemon-white','kakiemon-inner','kakiemon-clay',knob=.03,sides=6)
 a.meta.update(gameScaleFactor=.4375/.16,profileInferred=True)
 # Tokoname sutra jar: three actual shallow incised shoulder rings.
 a=asset(b,'tokoname-sutra');r=.28125;h=.5625*.248/.191
 outer=[(r*.55,0),(r*.72,h*.12),(r*.95,h*.38),(r,h*.61),(r*.94,h*.73),(r*.67,h*.84)]
 for z in [h*.53,h*.65,h*.77]:
  def radius_at(t):
   for (ra,za),(rb,zb) in zip(outer,outer[1:]):
    if za<=t<=zb:return ra+(rb-ra)*(t-za)/(zb-za)
   return outer[-1][0]
  rr=radius_at(z);outer.extend([(rr+.001,z-.004),(rr-.004,z),(rr+.001,z+.004)]);outer.sort(key=lambda p:p[1])
 outer.extend([(r*.51,h*.87),(r*.51,h*.98),(r*.54,h),(r*.49,h)])
 vessel(a,outer,'tokoname',h,wall=.025,floor=.037,outer_mat='tokoname-ash',radial=lambda t,k:1+.012*math.sin(t*3+.7))
 a.meta.update(gameScaleFactor=.5625/.191,incisedGrooves=3,incisionDepth=.004)
 # Oribe kettle: complete bail and continuous spout-body cavity; photo front/back.
 a=asset(b,'oribe-ewer');h=.625;r=.625*.21/.255/2;bh=h*.60;mouth=r*.88;portz=bh*.66
 holes=[((r*.94,0,portz),(1,0,.7),.031,.14)]
 vessel(a,[(r*.78,0),(r*.96,bh*.10),(r,bh*.27),(r*.91,bh*.72),(r*.82,bh*.75),(r*.88,bh*.94),(r*.88,bh)],'oribe-ewer',bh,wall=.025,floor=.038,outer_mat='oribe-ewer-white',cutters=holes)
 for o in a.objects:
  if o['part_role']=='body:outer' and max(o.data.vertices[i].co.z for p in o.data.polygons for i in p.vertices)>bh*.73:
   # Native field material for upper green glaze: whole exterior collar band.
   o.data.materials.clear();o.data.materials.append(b.material('oribe-ewer-green'));o['finish']='oribe-ewer-green'
 b.fields=[f for f in b.fields if f['asset']!=a.id]
 for o in a.objects:b.record(a,o,o['finish'],o['part_role'])
 hollow_tube(a,'spout',[(r*.80,0,portz-.014),(r*1.11,0,portz+.035),(.345,0,.418)], [.046,.047,.044],.012,'oribe-ewer-green','oribe-ewer-inner',12)
 # Bail has actual joined pads on both ends and an elliptical arch rising above lid.
 path=[(-mouth*math.cos(j*math.pi/16),0,bh-.045+(h-bh+.024)*math.sin(j*math.pi/16)) for j in range(17)]
 a.tube('bail-handle',path,.025,'oribe-ewer-green','handle',sides=16)
 for side in(-1,1):a.box('bail-pad-'+str(side),(.060,.043,.092),(side*mouth,0,bh-.044),'oribe-ewer-green','handle:connection',bevel=.015)
 lid(a,mouth*.91,bh-.006,.019,'oribe-ewer-green','oribe-ewer-inner','oribe-ewer-clay',knob=.033)
 a.meta.update(gameScaleFactor=.625/.255,communicatingSpout=True)
 # Banko kyusu: open tubular side handle, loop terminal, thin-walled spout.
 a=asset(b,'banko-teapot');h=.4375*.068/.083;r=.4375*.064/.083/2*.85;bh=h*.83;pz=bh*.62
 vessel(a,[(r*.78,0),(r*.96,bh*.12),(r,bh*.60),(r*.92,bh*.81),(r*.80,bh*.88),(r*.83,bh)],'banko',bh,wall=.016,floor=.022,cutters=[((r*.95,0,pz),(1,0,.7),.025,.12)])
 hollow_tube(a,'spout',[(r*.84,0,pz-.007),(r*1.17,0,pz+.026),(.246,0,.280)],[.033,.034,.032],.009,'banko-fired','banko-inner')
 hollow_tube(a,'side-handle',[(-r*.91,0,bh*.71),(-r*1.20,0,bh*.83),(-.237,0,bh*.91)],[.037,.035,.037],.012,'banko-fired','banko-inner')
 path=[(-.235,.033*math.cos(j*math.tau/12),bh*.83+.043*math.sin(j*math.tau/12)) for j in range(12)]
 a.tube('handle-terminal-loop',path,.010,'banko-fired','handle',sides=10,closed=True)
 lid(a,r*.785,bh-.009,.019,'banko-fired','banko-inner','banko-clay',knob=.026)
 a.meta.update(gameScaleFactor=.4375/.083,communicatingSpout=True)
 # Iga: lobed four-direction mouth, paired ears, real two neck grooves.
 a=asset(b,'iga-lobed');h=.6875;r=.225;mr=.6875*.1245/.28/2;base=.6875*.13/.28/2
 outer=[(base,0),(r*.93,h*.16),(r,h*.39),(r*.97,h*.61),(mr*.95,h*.75),(mr*.96,h*.815),(mr*.93,h*.82),(mr*.96,h*.825),(mr*.99,h*.86),(mr*.96,h*.865),(mr*.99,h*.87),(mr,h*.96),(mr*1.02,h)]
 radial=lambda t,k:(1+.13*math.cos(4*t))/1.13 if k>=5 else 1+.035*math.sin(3*t+.7)
 vessel(a,outer,'iga',h,wall=.026,floor=.033,radial=radial)
 for side in(-1,1):a.tube('ear-'+str(side),[(side*r*.91,0,h*.58),(side*(r+.024),0,h*.63),(side*(r+.024),0,h*.68),(side*r*.79,0,h*.69)],.022,'iga-fired','ear',sides=12)
 a.meta.update(gameScaleFactor=.6875/.28,maximumBodyDiameterInferred=True,neckGrooves=2)
 # Tamba: broad mouth with localized gold repairs only where actually seen.
 a=asset(b,'tamba-jar');r=.28125;h=.5625*.237/.233
 vessel(a,[(r*.63,0),(r*.84,h*.10),(r*.98,h*.35),(r,h*.61),(r*.91,h*.78),(r*.64,h*.88),(r*.55,h*.91),(r*.55,h*.985),(r*.58,h),(r*.51,h)],'tamba',h,wall=.024,floor=.035,outer_mat='tamba-ochre')
 a.meta['gameScaleFactor']=.5625/.233
 # Echizen: exact published ratio, folded heavy N-profile mouth.
 a=asset(b,'echizen-jar');r=.21875;h=.4375*.267/.167;mr=.4375*.13/.167/2;base=.4375*.093/.167/2
 vessel(a,[(base,0),(r*.73,h*.11),(r*.94,h*.38),(r,h*.62),(r*.94,h*.73),(mr*.72,h*.84),(mr*.73,h*.925),(mr,h*.945),(mr,h*.970),(mr*.76,h*.978),(mr*.93,h),(mr*.72,h)],'echizen',h,wall=.022,floor=.031)
 a.meta['gameScaleFactor']=.4375/.167
 # Named Seto tea caddy: flat footless underside and concave ivory lid.
 a=asset(b,'seto-hitorine');r=.15625;h=.3125*.076/.06;bh=h*.88;mr=r*.55
 vessel(a,[(r*.72,0),(r*.88,bh*.10),(r,bh*.30),(r*.98,bh*.62),(r*.82,bh*.76),(mr,bh*.86),(mr,bh)],'seto',bh,wall=.017,floor=.023,outer_mat='seto-brown')
 lid(a,mr*1.02,bh-.008,.027,'seto-ivory','seto-ivory','seto-ivory',knob=.022,concave=True)
 a.meta.update(gameScaleFactor=.3125/.06,footless=True)
 # Tsuboya: straight full-height incised cylindrical vase, thick mouth and base.
 a=asset(b,'tsuboya-dragon');r=.1875;h=.375*.27/.139
 vessel(a,[(r*.85,0),(r*.96,h*.023),(r*.98,h*.09),(r,h*.90),(r,h*.978),(r*1.018,h),(r*.98,h)],'tsuboya',h,wall=.024,floor=.034,outer_mat='tsuboya-slip')
 a.meta['gameScaleFactor']=.375/.139
 # Arita coffee pot: cone wall with low real tap, full loop handle, three feet.
 a=asset(b,'arita-coffee');h=.625*.314/.27;r=.625*.152/.27/2;fh=.038;bh=h*.80-fh;mouth=r*.62;tapz=.17
 vessel(a,[(r*.96,0),(r,bh*.04),(r*.89,bh*.35),(r*.75,bh*.72),(mouth,bh*.965),(mouth,bh)],'arita',bh,wall=.018,floor=.028,outer_mat='arita-white',cutters=[((r*.94,0,tapz-fh),(1,0,0),.016,.11)])
 # Raise full pot onto three real connected porcelain feet before charts are packed.
 for o in a.objects:
  for v in o.data.vertices:v.co.z+=fh
 b.fields=[f for f in b.fields if f['asset']!=a.id]
 for o in a.objects:b.record(a,o,o['finish'],o['part_role'])
 a.surfaces[0]['height']+=fh;a.surfaces[0]['rimHeight']+=fh;a.meta['interiorFloorHeight']+=fh;a.meta['rimHeight']+=fh
 feet(a,r*.79,fh,'arita-white',wide=True)
 handle=[(-mouth*.95,0,bh+fh-.048),(-.226,0,bh+fh-.028),(-.275,0,bh+fh-.105),(-.278,0,.345),(-.23,0,.25),(-r*.87,0,.216)]
 a.tube('loop-handle',handle,.018,'arita-white','handle',sides=16)
 hollow_tube(a,'silver-tap',[(r*.82,0,tapz),(.23,0,tapz),(.285,0,tapz-.016),(.301,0,tapz-.041)],[.021,.022,.021,.020],.006,'arita-silver','steel-dark',12)
 a.cyl('tap-valve-collar',.025,.044,(.235,0,tapz+.015),'arita-silver','tap',vertices=12)
 a.cyl('tap-valve-stem',.010,.071,(.235,0,tapz+.066),'arita-silver','tap',vertices=10)
 a.extrude('tap-foliate-lever',[(-.018,0),(-.035,.026),(-.016,.059),(0,.068),(.022,.046),(.027,.025),(.011,0)],.013,'arita-silver','tap',center=(.235,0,tapz+.09))
 lidstart=lid(a,mouth*1.06,bh+fh-.008,.057,'arita-white','arita-inner','arita-clay',knob=.022)
 # Silver rim and chain attachments belong to removable lid, hide together.
 ring_verts=[];sides=20;zr=bh+fh+.004
 for rad,z in [(mouth*1.075,zr-.010),(mouth*1.075,zr+.003),(mouth*1.02,zr+.003),(mouth*1.02,zr-.010)]:
  ring_verts.extend((rad*math.cos(j*math.tau/sides),rad*math.sin(j*math.tau/sides),z) for j in range(sides))
 ringfaces=[(k*sides+j,k*sides+(j+1)%sides,((k+1)%4)*sides+(j+1)%sides,((k+1)%4)*sides+j) for k in range(4) for j in range(sides)]
 a.mesh('lid-silver-rim',ring_verts,ringfaces,'arita-silver','lid:rim')
 for j in range(9):
  x=-mouth-.014-j*.010;z=bh+fh-.003-.025*math.sin(j*math.pi/9)
  if j%2:path=[(x+.010*math.cos(t),.006*math.sin(t),z) for t in [k*math.tau/8 for k in range(8)]]
  else:path=[(x+.009*math.cos(t),0,z+.009*math.sin(t)) for t in [k*math.tau/8 for k in range(8)]]
  a.tube('lid-chain-'+str(j),path,.0028,'arita-silver','lid:chain',sides=6,closed=True)
 a.meta['removableParts']=[o.name for o in a.objects[lidstart:]]
 a.meta.update(gameScaleFactor=.625/.27,communicatingTap=True)

def calibrate_to_museum_bounds(b):
 # Published dimensions apply to the complete assembled object, including lids,
 # spouts, handles and feet. Internal profiles on unshown faces are adaptation.
 scale_rows={}
 for a in b.assets:
  d=a.meta['museumDimensionsCm'];scale=a.meta['gameScaleFactor']
  if 'diameter' in d:target=[d['diameter']/100*scale]*2+[d['height']/100*scale]
  elif 'bodyDiameter' in d:target=[d['bodyDiameter']/100*scale]*2+[d['height']/100*scale]
  elif 'width' in d:
   target=[d['width']/100*scale,d.get('depth',d['width'])/100*scale,d['height']/100*scale]
  else:target=[None,None,d['height']/100*scale]
  mi,ma,dim=b.measure(a);factors=[target[k]/dim[k] if target[k] else 1 for k in range(3)]
  for o in a.objects:
   for v in o.data.vertices:
    for k in range(3):v.co[k]*=factors[k]
   o.data.update()
  for sf in a.surfaces:
   sf['height']*=factors[2];sf['width']*=factors[0];sf['depth']*=factors[1]
   sf['center']=[sf['center'][0]*factors[0],sf['center'][1]*factors[1]]
   for key in ('headroom','rimHeight'):
    if key in sf:sf[key]*=factors[2]
   if 'openingWidth' in sf:sf['openingWidth']*=factors[0]
  for key in ('interiorFloorHeight','rimHeight'):
   if key in a.meta:a.meta[key]*=factors[2]
  op=a.meta.get('opening')
  if op:op['width']*=factors[0];op['depth']*=factors[1]
  if op and op['shape']=='circle' and abs(op['width']-op['depth'])>1e-6:op['shape']='ellipse'
  a.meta['wallThicknessRange']=[a.meta['wallThickness']*min(factors),a.meta['wallThickness']*max(factors)]
  a.meta['geometryCalibration']=dict(publishedOverallBounds=target,axisFactors=factors,unknownInteriorProfileIsAdaptation=True)
  scale_rows[a.id]=factors
 # The placement engine supports ellipses. Fit the declared footprint against
 # the actual lowpoly inner-floor edges after museum dimension calibration.
 # This changes metadata only; geometry, painting coordinates and UVs stay put.
 floor_rows=[]
 for a in b.assets:
  sf=next((s for s in a.surfaces if s['id']=='inside'),None)
  if sf is None:continue
  cx,cy=sf['center'];points=set()
  for o in a.objects:
   if o.get('part_role')!='body:inner-floor':continue
   used={i for face in o.data.polygons for i in face.vertices}
   for i in used:
    v=o.data.vertices[i].co
    if math.hypot(v.x-cx,v.y-cy)>1e-6:points.add((round(v.x,9),round(v.y,9)))
  ring=sorted(points,key=lambda p:math.atan2(p[1]-cy,p[0]-cx))
  if len(ring)<3:raise RuntimeError('Missing physical inner-floor contour: '+a.id)
  rx,ry=sf['width']/2,sf['depth']/2;limits=[]
  for j,p in enumerate(ring):
   q=ring[(j+1)%len(ring)];dx,dy=q[0]-p[0],q[1]-p[1];length=math.hypot(dx,dy)
   if length<1e-9:continue
   nx,ny=dy/length,-dx/length;distance=abs(nx*(p[0]-cx)+ny*(p[1]-cy))
   support=math.hypot(nx*rx,ny*ry)
   limits.append(distance/support)
  factor=min(1,min(limits))*(1-1e-6)
  previous=dict(width=sf['width'],depth=sf['depth'])
  sf['width']*=factor;sf['depth']*=factor
  sf['shape']='ellipse' if abs(sf['width']-sf['depth'])>1e-6 else 'circle'
  xs=[p[0] for p in ring];ys=[p[1] for p in ring]
  floor_shape='organic polygon' if a.id=='antique-kenzan-chestnut' else 'hexagon' if len(ring)==6 else 'ellipse' if sf['shape']=='ellipse' else 'circle'
  sf.update(floorShape=floor_shape,actualFloorWidth=max(xs)-min(xs),actualFloorDepth=max(ys)-min(ys),actualFloorContour=[list(p) for p in ring],nominalFloorSpan=previous,conservativeFit=dict(method='ellipse contained by every physical lowpoly floor edge',scaleFactor=factor,preservesAxisRatio=True,polygonSides=len(ring)))
  floor_rows.append(dict(id=a.id,shape=sf['shape'],floorShape=floor_shape,width=sf['width'],depth=sf['depth'],actualFloorWidth=sf['actualFloorWidth'],actualFloorDepth=sf['actualFloorDepth'],conservativeFit=sf['conservativeFit']))
 (ROOT/FAMILY/'floor-fit.json').write_text(json.dumps(floor_rows,ensure_ascii=False,indent=2))
 # UV charts are recorded after dimensional calibration at exactly 16 px/m.
 b.fields=[]
 for a in b.assets:
  for o in a.objects:b.record(a,o,o['finish'],o['part_role'])
 (ROOT/FAMILY/'geometry-scale.json').write_text(json.dumps(scale_rows,indent=2))

if MODE=='verify':verify_saved(FAMILY)
else:
 b=Builder(FAMILY);build(b);calibrate_to_museum_bounds(b);b.finish()
 # Painting guide shares verified catalogue dimensions; no mapping mutations.
 guides=[]
 for a in b.assets:
  ref=REF[a.id];guides.append(dict(id=a.id,name=a.meta['name'],museumTitle=ref['museumTitle'],sources=a.meta['sources'],boundsMin=a.meta['boundsMin'],boundsMax=a.meta['boundsMax'],observed=ref['observed'],referenceUnknown=ref['referenceUnknown'],removableParts=a.meta.get('removableParts',[]),nativeTextureDensity=16,paintingRule='Pure Python pattern_color uses original physical point; root paints original glyphs with native Pixelorama Pencil. Unknown faces stay base. No photo tracing or increased density.'))
 (ROOT/FAMILY/'pattern-guide.json').write_text(json.dumps(guides,ensure_ascii=False,indent=2))
