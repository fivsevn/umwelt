"""110 retained botanical records, fresh native Blender solid low-poly specimens.
Production plant meshes/functions are not imported or loaded. Proportions are
review estimates from the approved morphology notes, not measured specimens.
"""
import sys,math,json,hashlib,random
from pathlib import Path
from mathutils import Vector,geometry
sys.path.insert(0,str(Path(__file__).resolve().parent))
from assetlib import Builder,MODE,verify_saved
if MODE=='verify':verify_saved('plants-retained');raise SystemExit
ROOT=Path(__file__).resolve().parent
RECORDS=json.loads((ROOT/'retained-plant-records.json').read_text())
b=Builder('plants-retained')
T=math.tau

class Plant:
 def __init__(self,record,index):
  self.p=record;self.i=index;self.id=record['id'];self.rng=random.Random(7321+index*37);self.n=0
  raw={k:v for k,v in record.items() if k not in ('id','name','category','family')}
  self.a=b.asset(record['id'],record['name'],'植物','both',**raw,botany=record,scientificName=record['scientific'],botanicalCategory=record['category'],botanicalFamily=record['family'],retainedRecordChecksum=hashlib.sha256(json.dumps(record,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),review='新低模植株；盆为展示用简素红陶盆，不替换原containers选择；形态及比例依据已批准表型记录推定，非实测植株。',reviewVessel='independent solid terracotta presentation vessel',geometrySource='new Blender meshes; no production plant function or mesh loaded')
  self.green=record['leaf'];self.flower=record['flower'];self.wood='#71644b';self.pale='#b9b79c';self.phase=index*.137
  family=record['family'];self.pr=.135 if family=='large' else .095 if family!='moss' else .125
  self.ph=.210 if family=='large' else .230 if family=='hanging' or record['form'] in ('exp-segments','exp-fishbone','exp-threads','exp-beadtail') else .0625 if family=='moss' else .140
  r=self.pr;h=self.ph
  self.a.lathe('review-terra-vessel',[(r*.70,0),(r*.73,.012),(r*.90,h*.80),(r,h-.016),(r,h),(r-.011,h),(r-.016,h-.018),(r*.69,.022),(0,.022),(0,.008),(r*.70,0)],mat='#a16b50',role='review-pot',sides=12)
  self.a.cyl('review-rooted-soil',r-.018,.026,(0,0,h-.024),mat='soil',role='review-soil',vertices=12)
  self.z=h-.011;self.origin=Vector((0,0,self.z));self.a.meta['reviewSoilTop']=self.z
 def name(self,s):self.n+=1;return f'{s}-{self.n:03d}'
 def stem(self,points,r=.003,mat=None,role='stem'):
  return self.a.tube(self.name(role),[tuple(p) for p in points],r,mat or self.green,role,sides=5)
 def rod(self,p,q,r=.003,mat=None,role='petiole'):return self.stem([p,q],r,mat,role)
 def leaf(self,p,q,w,kind='oval',mat=None,thick=.0025,role='leaf',turn=0):
  p,q=Vector(p),Vector(q);axis=q-p;u=axis.normalized();v=u.cross(Vector((0,0,1)))
  if v.length<.1:v=u.cross(Vector((0,1,0)))
  v.normalize();normal=u.cross(v).normalized()
  if turn:v=math.cos(turn)*v+math.sin(turn)*normal;normal=u.cross(v).normalized()
  shapes={'oval':[(0,0),(.23,.40),(.66,.5),(1,0),(.66,-.5),(.23,-.40)],'round':[(0,0),(.15,.40),(.45,.5),(.85,.35),(1,0),(.85,-.35),(.45,-.5),(.15,-.40)],'lance':[(0,0),(.30,.38),(.58,.5),(1,0),(.58,-.5),(.30,-.38)],'sword':[(0,0),(.08,.38),(.45,.5),(1,0),(.45,-.5),(.08,-.38)],'triangle3':[(0,0),(1,.5),(1,-.5)],'triangle':[(0,0),(.62,.5),(1,0),(.62,-.5)],'spoon':[(0,0),(.45,.27),(.70,.50),(.93,.42),(1,.13),(1,-.13),(.93,-.42),(.70,-.50),(.45,-.27)],'ivy':[(0,0),(.18,.24),(.18,.52),(.42,.29),(.66,.42),(.64,.14),(1,0),(.64,-.14),(.66,-.42),(.42,-.29),(.18,-.52),(.18,-.24)],'teeth':[(0,0),(.15,.24),(.24,.40),(.31,.32),(.45,.50),(.55,.40),(.68,.48),(.74,.31),(1,0),(.74,-.31),(.68,-.48),(.55,-.40),(.45,-.50),(.31,-.32),(.24,-.40),(.15,-.24)],'paw':[(0,0),(.25,.42),(.73,.50),(.90,.43),(.86,.32),(1,.25),(.89,.12),(1,0),(.89,-.12),(1,-.25),(.86,-.32),(.90,-.43),(.73,-.50),(.25,-.42)],'fishbone':[(0,0),(.12,.13),(.20,.49),(.31,.18),(.39,.48),(.48,.15),(.56,.44),(.64,.13),(.72,.35),(.82,.12),(1,0),(.82,-.12),(.72,-.35),(.64,-.13),(.56,-.44),(.48,-.15),(.39,-.48),(.31,-.18),(.20,-.49),(.12,-.13)]}
  outline=list(reversed(shapes[kind]));n=len(outline);verts=[tuple(p+axis*x+v*w*y+normal*off) for off in (-thick/2,thick/2) for x,y in outline]
  faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(k,(k+1)%n,(k+1)%n+n,k+n)for k in range(n)]
  return self.a.mesh(self.name(role),verts,faces,mat or self.green,role)
 def sphere(self,c,dim,mat=None,role='fruit',sides=8,rings=3):
  c=Vector(c);rx,ry,rz=[d/2 for d in dim];verts=[tuple(c+Vector((0,0,-rz)))]
  for row in range(1,rings+1):
   th=math.pi*row/(rings+1);verts.extend([tuple(c+Vector((rx*math.sin(th)*math.cos(k*T/sides),ry*math.sin(th)*math.sin(k*T/sides),-rz*math.cos(th))))for k in range(sides)])
  verts.append(tuple(c+Vector((0,0,rz))));top=len(verts)-1;faces=[(0,1+(k+1)%sides,1+k)for k in range(sides)]
  for row in range(rings-1):
   base=1+row*sides;nb=base+sides
   faces.extend([(base+k,base+(k+1)%sides,nb+(k+1)%sides,nb+k)for k in range(sides)])
  faces.extend([(top,1+(rings-1)*sides+k,1+(rings-1)*sides+(k+1)%sides)for k in range(sides)])
  return self.a.mesh(self.name(role),verts,faces,mat or self.green,role)
 def blossom(self,c,r=.025,petals=5,layers=1,mat=None,normal=(0,0,1),centerMat='#c9b466'):
  c=Vector(c);n=Vector(normal).normalized();u=n.cross(Vector((0,1,0)))
  if u.length<.1:u=n.cross(Vector((1,0,0)))
  u.normalize();v=n.cross(u).normalized()
  for layer in range(layers):
   radius=r*(1-layer*.29)
   for k in range(petals):
    ang=k*T/petals+layer*.33;d=u*math.cos(ang)+v*math.sin(ang)
    self.leaf(c+n*.003*layer,c+d*radius+n*(.002+layer*.004),radius*.68,'spoon',mat or self.flower,.0015,'petal')
  self.rod(c,c+n*(.006+(layers-1)*.003),max(.001,r*.08),centerMat,'flower-axis');self.sphere(c+n*.006,(r*.32,r*.32,r*.18),centerMat,'flower-center',6,2)
 def funnel(self,c,r=.033,length=.030,mat=None,normal=(0,0,1),lobes=5):
  c=Vector(c);n=Vector(normal).normalized();u=n.cross(Vector((0,1,0)))
  if u.length<.1:u=n.cross(Vector((1,0,0)))
  u.normalize();v=n.cross(u).normalized();verts=[];sides=lobes*2
  for radius,z in [(r*.15,-length),(r,0),(r-.002,0),(r*.1,-length+.003)]:
   for k in range(sides):
    rr=radius*(1 if k%2==0 else .88);verts.append(tuple(c+n*z+(u*math.cos(k*T/sides)+v*math.sin(k*T/sides))*rr))
  faces=[(row*sides+k,row*sides+(k+1)%sides,((row+1)%4)*sides+(k+1)%sides,((row+1)%4)*sides+k)for row in range(4)for k in range(sides)]
  self.a.mesh(self.name('hollow-corolla'),verts,faces,mat or self.flower,'hollow-corolla');self.sphere(c-n*(length-.002),(r*.25,r*.25,.004),'#a09262','flower-throat',5,2)
 def petiole_leaf(self,base,direction,length,width,kind='oval',mat=None,thick=.0025):
  base=Vector(base);d=Vector(direction).normalized();p=base+d*length*.16;self.rod(base,p,.0025);return self.leaf(p,base+d*length,width,kind,mat,thick)
 def radial_leaf(self,angle,length,width,lift=.09,kind='sword',thick=.006,base=None,mat=None):
  c=Vector(base)if base is not None else self.origin;end=c+Vector((math.cos(angle)*length,math.sin(angle)*length,lift));return self.leaf(c,end,width,kind,mat,thick)
 def body(self,c,r,h,ribs=8,tall=False,wavy=False,mat=None):
  c=Vector(c);segments=ribs*2;profile=[(.60,0),(.95,.18),(1,.50),(.82,.83),(.27,1)] if not tall else [(.78,0),(1,.15),(1,.64),(.83,.89),(.30,1)]
  verts=[]
  for rr,z in profile:
   for k in range(segments):
    angle=k*T/segments+(math.sin(z*7)*.06 if wavy else 0);ridge=1 if k%2==0 else (.90 if ribs>20 else .78)
    verts.append(tuple(c+Vector((r*rr*ridge*math.cos(angle),r*rr*ridge*math.sin(angle),h*z))))
  verts.extend([tuple(c),tuple(c+Vector((0,0,h)))]);bottom=len(verts)-2;top=len(verts)-1
  faces=[(bottom,(k+1)%segments,k)for k in range(segments)]+[(top,(len(profile)-1)*segments+k,(len(profile)-1)*segments+(k+1)%segments)for k in range(segments)]
  for row in range(len(profile)-1):faces.extend([(row*segments+k,row*segments+(k+1)%segments,(row+1)*segments+(k+1)%segments,(row+1)*segments+k)for k in range(segments)])
  self.a.mesh(self.name('ribbed-stem'),verts,faces,mat or self.green,'ribbed-stem');return c+Vector((0,0,h))
 def areoles(self,c,r,h,count=12,wool=False,red=False,hook=False,ribs=8):
  c=Vector(c)
  for k in range(count):
   per=min(6,ribs);ang=round((k%per)*ribs/per)*T/ribs;z=h*(.25+.31*(k//per));pt=c+Vector((r*math.cos(ang),r*math.sin(ang),z));col='#dbd5b7'if wool else '#b6a176';self.sphere(pt,(.008,.006,.009),col,'areole',5,2)
   if not wool:
    q=pt+Vector((math.cos(ang)*.013,math.sin(ang)*.013,.010));self.rod(pt,q,.0015,'#a17055'if red else '#bca16d','spine')
    if hook:self.rod(q,q+Vector((-.007*math.cos(ang),-.007*math.sin(ang),-.012)),.002,'#8b5946','hook-spine')
 def tuft(self,center,leaves=8,length=.13,width=.025,lift=.10,kind='sword',thick=.003,mat=None):
  center=Vector(center)
  for k in range(leaves):self.radial_leaf(k*T/leaves+self.phase,length*(.83+.17*(k%3)/2),width,lift*(.6+.4*(k%4)/3),kind,thick,center,mat)

def cactus(s):
 p=s.p;f=p['form'];z=s.z;r=.069;h=.135
 if f=='column':
  for k,(x,y,ht)in enumerate([(-.035,0,.40),(.036,.023,.31),(.012,-.033,.26)]):
   base=s.origin+Vector((x,y,0));s.body(base,.036,ht,3,True);s.rod(s.origin,base+Vector((0,0,.06)),.016,s.green,'rooted-joint');s.areoles(base,.035,ht,6,ribs=3)
  return
 if f=='pads':
  joints=[((0,0,.065),(.11,.033,.14)),((-.046,0,.172),(.071,.027,.103)),((.047,.003,.182),(.075,.028,.110)),((.084,.005,.249),(.05,.023,.07))]
  for center,dim in joints:s.sphere(s.origin+Vector(center),dim,s.green,'flat-stem-pad',10,3)
  for k in range(15):
   x=(k%3-1)*.018;zz=.03+.025*(k//3);s.sphere(s.origin+Vector((x,-.017,zz)),(.004,.005,.006),'#d7d3b4','glochid-pad',5,1)
  return
 group=f in ('cluster','exp-fingers','exp-woolball','exp-thimbles','exp-peanuts','exp-offsets');tall=f in ('exp-fingers','exp-thimbles','exp-redcolumn','exp-goldcolumn','exp-haircolumn')
 ribs={'barrel':16,'exp-star':5,'exp-flatstar':8,'exp-ribbed':8,'exp-chin':8,'exp-chinflower':8,'exp-smooth':10,'exp-bluebarrel':12,'exp-hooked':11,'exp-wavy':24}.get(f,8)
 if f=='exp-flatstar':r=.074;h=.063
 elif f=='exp-star':r=.058;h=.130
 elif f in ('exp-chin','exp-chinflower'):r=.07;h=.090
 elif f=='exp-ribbed':r=.060;h=.18
 elif f=='exp-wavy':r=.065;h=.130
 elif tall:r=.038 if f=='exp-goldcolumn'else .042;h=.265 if f=='exp-goldcolumn'else .245
 if f=='exp-goldcolumn':ribs=14
 count=(5 if f in ('exp-woolball','exp-thimbles','exp-offsets')else 4) if group else 1
 for k in range(count):
  a=k*T/count+.25;center=s.origin+Vector((math.cos(a)*.037 if group else 0,math.sin(a)*.035 if group else 0,0));rr=r*(.55 if group else 1);hh=h*(.72+(.24 if k==0 else -.02*k))if group else h
  if f=='exp-peanuts':rr=.023;hh=.075+.019*(k%2)
  top=s.body(center,rr,hh,ribs,tall,f=='exp-wavy');wool=f in ('cluster','exp-woolball','exp-thimbles','exp-haircolumn','exp-star','exp-flatstar');s.areoles(center,rr*.98,hh,6 if group else 12,wool,f=='exp-redcolumn',f=='exp-hooked',ribs=ribs)
  if f in ('cluster','exp-woolball'):
   for j in range(4):s.blossom(top+Vector((math.cos(j*T/4)*rr*.70,math.sin(j*T/4)*rr*.70,-hh*.08)),.010,5)
  elif f in ('exp-chinflower','exp-peanuts','exp-offsets','exp-bluebarrel'):
   pos=top if f!='exp-offsets'else center+Vector((rr,0,hh*.45));s.funnel(pos+Vector((0,0,.018)),.021,.021)
 if f=='barrel':s.sphere(s.origin+Vector((0,0,h)),(.044,.044,.015),'#c4b489','woolly-crown',10,2)

def split_leaf_pair(s,c,r,h,windowColor):
 c=Vector(c);segments=8;gap=.004 if h<.05 else .007
 for sign in (-1,1):
  outline=[(sign*(gap/2+r*math.sin(k*math.pi/segments)),r*math.cos(k*math.pi/segments))for k in range(segments+1)]
  area=sum(outline[k][0]*outline[(k+1)%len(outline)][1]-outline[(k+1)%len(outline)][0]*outline[k][1]for k in range(len(outline)))
  if area<0:outline.reverse()
  n=len(outline);verts=[tuple(c+Vector((x*scale,y*scale,z)))for scale,z in[(.78,0),(1,h*.48),(.94,h)]for x,y in outline]
  faces=[tuple(reversed(range(n))),tuple(2*n+k for k in range(n))]+[(row*n+k,row*n+(k+1)%n,(row+1)*n+(k+1)%n,(row+1)*n+k)for row in range(2)for k in range(n)]
  ob=s.a.mesh(s.name('fused-leaf-half-real-cleft'),verts,faces,s.green,'paired-thick-leaf-real-central-cleft');ob.data.materials.append(b.material(windowColor));ob.data.polygons[1].material_index=1
  for f in b.fields[-len(ob.data.polygons):]:
   if f['object']==ob.name and f['polygon']==1:f.update(material=windowColor,baseColor=b.materials[windowColor]['base_hex'],role='flat-leaf-window')

def succulent(s):
 f=s.p['form'];o=s.origin
 if f in ('exp-stones','exp-splitrock'):
  if f=='exp-stones':
   positions=[(-.036,-.019),(.034,-.017),(0,.034)]if s.id=='new-aucampiae'else[(-.038,-.022),(.032,-.012),(-.009,.035)]
   for dx,dy in positions:split_leaf_pair(s,o+Vector((dx,dy,.001)),.027 if s.id=='new-aucampiae'else .025,.033 if s.id=='new-aucampiae'else .029,'#a79877'if s.id=='new-aucampiae'else '#949974')
  else:split_leaf_pair(s,o,.044,.081,s.green)
  return
 if f=='exp-bubble':
  for k in range(12):
   a=k*2.399;rr=.032 if k<8 else .016;c=o+Vector((math.cos(a)*rr,math.sin(a)*rr,.016));ob=s.sphere(c,(.025,.025,.034),s.green,'inflated-fleshy-window-leaf',7,3);ob.data.materials.append(b.material('#b3c3aa'));chosen={p.index for p in ob.data.polygons if p.center.z>c.z+.008}
   for p in ob.data.polygons:
    if p.index in chosen:p.material_index=1
   for field in b.fields[-len(ob.data.polygons):]:
    if field['object']==ob.name and field['polygon']in chosen:field.update(material='#b3c3aa',baseColor='#b3c3aa',role='rounded-leaf-window')
  return
 if f=='exp-windows':
  for k in range(9):
   a=k*2.399;c=o+Vector((math.cos(a)*.047*(k/9),math.sin(a)*.047*(k/9),0));h=.055+.008*(k%3);s.a.cyl(s.name('cylindrical-leaf'),.012,h,tuple(c+Vector((0,0,h/2))),mat=s.green,role='fleshy-leaf',vertices=7,radius_top=.010);s.a.cyl(s.name('leaf-window'),.010,.002,tuple(c+Vector((0,0,h))),mat='#c3cdb0',role='leaf-window',vertices=7)
  return
 if f=='exp-fan':
  for k in range(7):
   c=o+Vector(((k-3)*.019,0,0));h=.039+.008*(3-abs(k-3));s.a.box(s.name('fan-thick-leaf'),(.016,.047,h),tuple(c+Vector((0,0,h/2))),mat=s.green,role='two-row-leaf');s.a.box(s.name('flat-leaf-window'),(.016,.047,.002),tuple(c+Vector((0,0,h+.001))),mat='#9aaf94',role='leaf-window')
  return
 if f in ('jade','exp-velvet','exp-felt','exp-paws','beads','exp-scales','exp-stacked','exp-paddles','exp-tree'):
  branches=3 if f not in ('beads','exp-tree')else 4
  for k in range(branches):
   ang=k*T/branches+s.phase;tip=o+Vector((math.cos(ang)*.035,math.sin(ang)*.035,.135+.019*(k%2)));s.stem([o,o+Vector((0,0,.05)),tip],.006,s.wood if f in ('jade','exp-tree','exp-velvet')else s.green)
   if f=='exp-tree':s.tuft(tip,10,.063,.027,.009,'spoon',.005);continue
   nodes=7 if f in ('beads','exp-scales','exp-stacked')else 3
   for j in range(nodes):
    base=o.lerp(tip,(j+1)/(nodes+1))
    if f=='beads':
     for side in (-1,1):
      c=base+Vector((math.cos(ang+j)*side*.018,math.sin(ang+j)*side*.018,.006));s.sphere(c,(.022 if s.id=='sedum'else .032,.015 if s.id=='sedum'else .025,.035),s.green,'ovoid-leaf',7,2)
     continue
    for side in (-1,1):
     angle=ang+(j%2)*math.pi/2+side*math.pi/2;length=.062 if f in ('jade','exp-felt','exp-paws','exp-velvet')else .070 if f=='exp-paddles'else .022 if f=='exp-stacked'else .012;kind='lance'if f=='exp-felt'else 'paw'if f=='exp-paws'else 'triangle'if f=='exp-stacked'else 'round'if f=='exp-paddles'else 'oval';width=length*.58 if f!='exp-paddles'else .065
     s.petiole_leaf(base,(math.cos(angle),math.sin(angle),.20 if f!='exp-paddles'else .9),length,width,kind,s.green,.009 if f!='exp-scales'else .003)
  return
 if f=='kalanchoe':
  for k in range(3):
   ang=k*T/3;tip=o+Vector((math.cos(ang)*.038,math.sin(ang)*.038,.11));s.rod(o,tip,.005)
   for j in range(2):
    pt=o.lerp(tip,.3+j*.35)
    for side in(-1,1):s.petiole_leaf(pt,(side*math.cos(ang),side*math.sin(ang),.35),.065,.043,'teeth',thick=.006)
   for j in range(3):s.blossom(tip+Vector((math.cos(j*T/3)*.017,math.sin(j*T/3)*.017,.016)),.012,4)
  return
 if f in ('swords','agave','snake','zebra','rosette','exp-bubble','exp-triangle','exp-ridged','exp-pointed','exp-powder','exp-jaws','exp-crinkle'):
  counts={'swords':10,'agave':11,'snake':5,'zebra':9,'rosette':15,'exp-bubble':12,'exp-triangle':9,'exp-ridged':11,'exp-pointed':13,'exp-powder':16,'exp-jaws':6,'exp-crinkle':7};n=counts[f]
  for k in range(n):
   angle=k*2.399+s.phase;outer=k<n*.65;length=.165 if s.id=='yucca'else .145 if f in ('swords','agave')else .045+.020*(k%3)/2 if f in ('exp-bubble','exp-triangle')else .054 if f in ('zebra','exp-ridged')else .075 if f!='snake'else .017
   lift=.32+.039*(k%3) if f=='snake'else .13 if s.id=='yucca'else .10 if f=='agave'else .095 if f=='swords'else .047 if f in ('zebra','exp-ridged','exp-jaws')else .013+.028*(not outer)
   width=.020 if s.id=='yucca'else .045 if f in ('swords','agave','snake')else .026 if f!='exp-jaws'else .042
   kind='sword'if f in ('swords','agave','snake','zebra','exp-ridged')else 'triangle'if f in ('exp-jaws','exp-triangle','exp-pointed')else 'teeth'if f=='exp-crinkle'else 'spoon';s.radial_leaf(angle,length,width,lift,kind,.007 if f!='snake'else .005)
   if f in ('swords','agave','exp-jaws'):
    for side in(-1,1):
     for t in(.33,.64):
      v=Vector((math.cos(angle),math.sin(angle),0));u=Vector((-math.sin(angle),math.cos(angle),0));c=o+v*length*t+u*width*.48*side+Vector((0,0,lift*t));s.leaf(c,c+u*.009*side,.006,'triangle','#c3c0a3',.002,'marginal-tooth')
  return
 raise ValueError('missing succulent '+f)

def ribbon(s,points,widths,mat=None,thick=.002,role='arching-leaf'):
 points=[Vector(p)for p in points];verts=[];lastv=None
 for i,c in enumerate(points):
  tangent=(points[min(i+1,len(points)-1)]-points[max(0,i-1)]).normalized();v=tangent.cross(Vector((0,0,1)))
  if v.length<.1:v=lastv.copy()if lastv is not None else tangent.cross(Vector((0,1,0)))
  v.normalize()
  if lastv is not None and v.dot(lastv)<0:v=-v
  lastv=v.copy();n=tangent.cross(v).normalized()
  verts.extend([tuple(c+v*side*widths[i]/2+n*height*thick/2)for height,side in[(-1,-1),(-1,1),(1,1),(1,-1)]])
 faces=[(3,2,1,0),tuple(4*(len(points)-1)+k for k in range(4))]
 for j in range(len(points)-1):faces.extend([(4*j+k,4*j+(k+1)%4,4*(j+1)+(k+1)%4,4*(j+1)+k)for k in range(4)])
 return s.a.mesh(s.name(role),verts,faces,mat or s.green,role)

def trailing(s):
 f=s.p['form'];o=s.origin
 if f=='spider':
  for k in range(11):
   a=k*T/11+s.phase;d=Vector((math.cos(a),math.sin(a),0));ribbon(s,[o,o+d*.045+Vector((0,0,.085)),o+d*.13+Vector((0,0,.075)),o+d*.19-Vector((0,0,.07))],[.009,.020,.014,.002])
  end=o+Vector((.20,.04,-.13));s.stem([o,o+Vector((.11,.025,.05)),end],.0025);s.tuft(end,5,.038,.008,.012,'sword',.002)
  return
 for k in range(3 if f!='exp-threads'else 5):
  ang=k*T/(3 if f!='exp-threads'else 5)+s.phase;d=Vector((math.cos(ang),math.sin(ang),0));points=[o,o+d*.052+Vector((0,0,.045)),o+d*.125+Vector((0,0,.035)),o+d*.155-Vector((0,0,.064)),o+d*.175-Vector((0,0,.165-.012*(k%2)))]
  if f=='tails':
   s.stem(points,.012,'#a4aa89','pendent-fleshy-stem')
   for j in range(4):
    c=points[2].lerp(points[-1],(j+1)/5);s.rod(c,c+Vector((.008,.007,0)),.002,'#d2d1b8','wool-spine')
   if k==0:s.funnel(points[-1],.021,.022,normal=(.4,0,-.9))
  elif f=='exp-beadtail':
   s.stem(points,.004)
   for j in range(12):
    frac=j/11*3;seg=min(2,int(frac));c=points[seg+1].lerp(points[seg+2],frac-seg)
    a=j*2.4;tip=c+Vector((math.cos(a)*.020,math.sin(a)*.020,-.005));s.leaf(c,tip,.016,'spoon',thick=.009,role='pendent-fleshy-leaf')
  elif f in ('exp-segments','exp-fishbone'):
   for j in range(3):
    p,q=points[j+1],points[j+2];s.leaf(p,q,.031 if f=='exp-segments'else .060,'teeth'if f=='exp-segments'else 'fishbone',thick=.004,role='flattened-stem-segment');s.rod(points[j],p,.004)
   if f=='exp-segments':s.funnel(points[-1]+Vector((0,0,-.015)),.024,.030,normal=(.45,0,-.9));s.leaf(points[-1],points[-1]+Vector((.02,0,-.042)),.013,'lance',s.flower,.002,'outer-tepal')
  elif f=='exp-threads':
   s.stem(points,.0028)
   for j in range(2):
    c=points[2+j];q=c+d*.042-Vector((0,0,.044));s.rod(c,q,.0024);s.sphere(q,(.006,.006,.006),'#d1d3b2','white-berry',6,2)
  else:
   s.stem(points,.0035,s.wood)
   for j in range(7):
    frac=j/6*3;seg=min(2,int(frac));c=points[seg+1].lerp(points[seg+2],frac-seg);angle=ang+(-1 if j%2 else 1)*.9;s.petiole_leaf(c,(math.cos(angle),math.sin(angle),.24),.045,.041,'ivy')

def hollow_leaf(s,p,q,r=.004):
 p,q=Vector(p),Vector(q);u=(q-p).normalized();v=u.cross(Vector((1,0,0)))
 if v.length<.1:v=u.cross(Vector((0,1,0)))
 v.normalize();n=u.cross(v);verts=[];sides=7
 for c,rad in [(p,r),(q,r*.85),(q,r*.55),(p,r*.58)]:verts.extend([tuple(c+(v*math.cos(k*T/sides)+n*math.sin(k*T/sides))*rad)for k in range(sides)])
 faces=[(j*sides+k,j*sides+(k+1)%sides,((j+1)%4)*sides+(k+1)%sides,((j+1)%4)*sides+k)for j in range(4)for k in range(sides)];s.a.mesh(s.name('hollow-tubular-leaf'),verts,faces,s.green,'hollow-tubular-leaf')

def herb(s):
 f=s.p['form'];o=s.origin;pid=s.id
 if f=='onion':
  for k in range(9 if pid=='grass'else 12):
   a=k*2.399;rr=.008+.022*(k%3)/2;c=o+Vector((rr*math.cos(a),rr*math.sin(a),0));ht=.25+.015*(k%3)if pid=='grass'else .175+.017*(k%4);q=c+Vector((math.cos(a)*.025,math.sin(a)*.025,ht));s.rod(c,c.lerp(q,.10),.0045,'#c1c5a6','white-sheath');hollow_leaf(s,c.lerp(q,.10),q,.0045 if pid=='grass'else .003)
  if pid=='chives':
   tip=o+Vector((.02,-.015,.265));s.rod(o,tip,.0027)
   for k in range(7):a=k*T/7;s.blossom(tip+Vector((math.cos(a)*.016,math.sin(a)*.016,.009*(k%2))),.010,5,mat=s.flower)
  return
 if f=='lettuce':
  for k in range(11):
   a=k*2.399;d=Vector((math.cos(a),math.sin(a),0));p=o+d*.035+Vector((0,0,.045));q=o+d*(.072 if k<7 else .035)+Vector((0,0,.05 if k<7 else .10));ribbon(s,[o,p,q],[.009,.065 if k<7 else .046,.034],thick=.003);s.leaf(p,q,.060,'teeth',thick=.003)
  return
 if f=='radish':
  s.sphere(o+Vector((0,0,.008)),(.068,.068,.052),'#aa6155','exposed-root-shoulder',10,3);s.stem([o-Vector((0,0,.025)),o-Vector((0,0,.075))],.004,'#c6c2a9','taproot')
  for k in range(6):
   a=k*T/6;s.petiole_leaf(o+Vector((0,0,.022)),(math.cos(a),math.sin(a),1.15),.12,.050,'teeth')
  return
 if f in ('parsley','cosmos'):
  stems=6 if f=='parsley'else 3
  for k in range(stems):
   a=k*T/stems+s.phase;tip=o+Vector((math.cos(a)*.06,math.sin(a)*.06,.12 if f=='parsley'else .30+.02*(k%2)));s.rod(o,tip,.0028)
   for j in range(3):
    c=o.lerp(tip,.38+j*.18)
    for side in(-1,1):
     angle=a+side*1.2;end=c+Vector((math.cos(angle)*.040,math.sin(angle)*.040,.012));s.rod(c,end,.0017)
     for m in range(3):
      ca=c.lerp(end,(m+1)/3);s.petiole_leaf(ca,(math.cos(angle+.7*side),math.sin(angle+.7*side),.2),.025,.004 if f=='cosmos'else .021 if pid=='parsley'else .017,'sword'if f=='cosmos'else 'teeth')
   if f=='cosmos':s.blossom(tip,.036,8,1)
   elif pid=='coriander'and k==0:
    top=tip+Vector((0,0,.025));s.rod(tip,top,.002)
    for m in range(5):ang=m*T/5;q=top+Vector((math.cos(ang)*.025,math.sin(ang)*.025,.01));s.rod(top,q,.0015);s.blossom(q,.007,5,mat='#d9d5c3')
  return
 if f=='strawberry':
  for k in range(5):
   a=k*T/5;tip=o+Vector((math.cos(a)*.057,math.sin(a)*.057,.06+.015*(k%2)));s.rod(o,tip,.003)
   for j in range(3):ang=a+(j-1)*1.05;s.petiole_leaf(tip,(math.cos(ang),math.sin(ang),.25),.043,.030,'teeth')
  for k in range(2):
   c=o+Vector(((k*2-1)*.112,.03,.01));s.stem([o,o+Vector(((k*2-1)*.08,.025,.05)),c],.0025);s.sphere(c-Vector((0,0,.012)),(.031,.030,.040),'#ab5c50','strawberry-fruit',8,3);s.tuft(c,5,.014,.006,.002,'lance',.001)
  for k in range(2):c=o+Vector((-.035+k*.065,-.024,.12));s.rod(o,c,.0027);s.blossom(c,.021,5,mat='#dedbd0')
  return
 if f=='needles':
  for k in range(3):
   a=k*T/3;tip=o+Vector((math.cos(a)*.043,math.sin(a)*.043,.24+.023*(k%2)));s.rod(o,tip,.0035,s.wood)
   for j in range(7):
    c=o.lerp(tip,.14+.11*j)
    for side in(-1,1):s.petiole_leaf(c,(math.cos(a+side*1.4),math.sin(a+side*1.4),.45),.036,.005,'sword')
   if k<2:s.blossom(tip-Vector((0,0,.025)),.009,5,mat='#a7b0c2')
  return
 if f=='spikes':
  s.tuft(o,11,.083,.008,.064,'sword',.0018,'#97a393')
  for k in range(3):
   c=o+Vector(((k-1)*.03,.018*(k%2),.255+.025*(k%2)));s.rod(o,c,.0028)
   for j in range(4):s.sphere(c+Vector((0,0,j*.012)),(.018,.018,.019),s.flower,'flower-spike',7,2)
  return
 low=f=='tiny';stemcount=5 if low else 3;height=.080 if low else .20 if pid in('mint','peppermint')else .24 if pid=='basil'else .18 if pid=='lemonbalm'else .25 if pid=='shiso'else .22
 for k in range(stemcount):
  a=k*T/stemcount+s.phase;tip=o+Vector((math.cos(a)*(.062 if low else .038),math.sin(a)*(.062 if low else .038),height+.013*(k%2)));s.stem([o,o+Vector((0,0,.035)),tip],.0028 if low else .0035,'#786973'if pid=='peppermint'else s.green)
  for j in range(3):
   c=o.lerp(tip,.25+.24*j)
   for side in(-1,1):
    angle=a+side*math.pi/2+(j%2)*.35;l=.018 if low else .052 if pid in('mint','peppermint')else .070 if pid in('shiso','lemonbalm')else .058;w=.012 if low else .046 if pid=='shiso'else .034 if pid=='basil'else .035 if pid=='lemonbalm'else .026
    s.petiole_leaf(c,(math.cos(angle),math.sin(angle),.30),l,w,'teeth'if pid in('mint','peppermint','shiso','lemonbalm')else 'oval')
  if pid not in('lemonbalm','shiso'):
   if pid in('mint','peppermint','basil','sage'):
    for j in range(3):pos=tip+Vector((0,0,j*.010));s.sphere(pos,(.016,.016,.014),s.flower,'terminal-flower-whorl',6,2)
   else:
    for j in range(2):s.blossom(tip+Vector((j*.010,0,.010)),.007,5)

def woody_fruit(s):
 o=s.origin;f=s.p['form'];height=.48 if f=='tomato'else .42 if f=='berries'else .40;trunk=o+Vector((.004,0,height));s.stem([o,o+Vector((-.008,.005,height*.45)),trunk],.005,s.wood if f=='berries'else s.green)
 if f=='tomato':s.a.cyl('review-tomato-stake',.004,height+.03,(-.034,0,s.z+(height+.03)/2),mat='#9c876b',role='review-support',vertices=5)
 for k in range(4):
  ang=k*2.399+s.phase;base=o+Vector((.002,0,height*(.25+k*.15)));tip=base+Vector((math.cos(ang)*.12,math.sin(ang)*.12,.055));s.rod(base,tip,.0038,s.wood if f=='berries'else s.green)
  if f=='tomato':
   for j in range(3):
    c=base.lerp(tip,.35+j*.27)
    for side in(-1,1):s.petiole_leaf(c,(math.cos(ang+side*1.2),math.sin(ang+side*1.2),.2),.061,.024,'teeth')
  else:
   for j in range(3):
    c=base.lerp(tip,.35+j*.25);side=(-1)**j;s.petiole_leaf(c,(math.cos(ang+side*.9),math.sin(ang+side*.9),.65),.055 if f=='berries'else .071,.023 if f=='berries'else .028,'oval'if f=='berries'else 'lance')
  if k%2==0:
   fruitbase=tip-Vector((0,0,.023));s.rod(tip,fruitbase,.0025)
   if f=='berries':
    for j in range(3):pos=fruitbase+Vector((math.cos(j*T/3)*.012,math.sin(j*T/3)*.012,-.008));s.rod(fruitbase,pos,.0018);s.sphere(pos,(.017,.017,.017),'#667c99','blueberry',8,2)
   elif f=='tomato':
    for j in range(2):pos=fruitbase+Vector((j*.029,0,-.025));s.rod(fruitbase,pos,.002);s.sphere(pos,(.043,.043,.040),'#a75e4e','tomato-fruit',8,3);s.tuft(pos+Vector((0,0,.019)),5,.014,.006,.002,'lance',.001)
    s.blossom(tip+Vector((0,0,.017)),.011,5,mat='#c8b65c')
   else:
    ribbon(s,[fruitbase,fruitbase+Vector((.008,0,-.026)),fruitbase+Vector((.024,0,-.065))],[.007,.020,.002],mat='#b46750',thick=.013,role='curved-pepper-fruit');s.blossom(tip+Vector((-.011,0,.014)),.009,5,mat='#d4d5bf')

def fenestrated_leaf(s,p,q,width):
 p,q=Vector(p),Vector(q);axis=q-p;u=axis.normalized();v=u.cross(Vector((0,0,1))).normalized();n=u.cross(v).normalized();length=axis.length
 # One continuous heart-shaped lamina. Deep margin cuts are part of its
 # outline; the two enclosed holes are actually removed by native tessellation.
 side=[(0,0),(.11,.29),(.23,.48),(.30,.45),(.30,.12),(.38,.12),(.43,.44),(.50,.38),(.49,.12),(.57,.12),(.61,.36),(.68,.29),(.67,.11),(.75,.11),(.79,.23),(.88,.13),(1,0)]
 outline=side+[(x,-y)for x,y in reversed(side[1:-1])];outline.reverse()
 loops=[[Vector((x*length,y*width,0))for x,y in outline]]
 for sign in (-1,1):loops.append([Vector((.20*length+math.cos(k*T/6)*length*.027,sign*.19*width+math.sin(k*T/6)*width*.045,0))for k in reversed(range(6))])
 flat=[pt for loop in loops for pt in loop];count=len(flat);verts=[tuple(p+u*pt.x+v*pt.y+n*off)for off in(-.0018,.0018)for pt in flat];tris=geometry.tessellate_polygon(loops);faces=[]
 for tri in tris:
  ids=tuple(tri)
  if (flat[ids[1]]-flat[ids[0]]).cross(flat[ids[2]]-flat[ids[0]]).z<0:ids=tuple(reversed(ids))
  faces.extend([tuple(reversed(ids)),tuple(i+count for i in ids)])
 offset=0
 for loop in loops:
  for k in range(len(loop)):i=offset+k;j=offset+(k+1)%len(loop);faces.append((i,j,j+count,i+count))
  offset+=len(loop)
 s.a.mesh(s.name('solid-heart-split-leaf'),verts,faces,s.green,'heart-leaf-deep-cuts-two-real-holes');s.a.meta['leafFenestrations']='Two through-holes in each continuous, solid, deeply cut heart leaf'

def foliage(s):
 o=s.origin;f=s.p['form']
 if f=='fern':
  for k in range(7):
   a=k*T/7+s.phase;d=Vector((math.cos(a),math.sin(a),0));points=[o,o+d*.044+Vector((0,0,.10)),o+d*.115+Vector((0,0,.11)),o+d*.175+Vector((0,0,.035))];s.stem(points,.0026,s.green,'frond-rachis')
   for j in range(7):
    t=j/6*2;seg=min(1,int(t));c=points[seg+1].lerp(points[seg+2],t-seg);length=.040*(1-.68*j/7)
    for side in(-1,1):v=Vector((-math.sin(a),math.cos(a),0))*side;q=c+v*length+d*.005-Vector((0,0,.006));s.leaf(c,q,length*.27,'lance',thick=.0018,role='fern-pinna')
  return
 if f=='split':
  for k in range(5):
   a=k*2.399+s.phase;d=Vector((math.cos(a),math.sin(a),0));c=o+d*.07+Vector((0,0,.26+.045*(k%2)));s.stem([o,o+d*.03+Vector((0,0,.16)),c],.006,s.green,'long-petiole');fenestrated_leaf(s,c,c+d*.23-Vector((0,0,.04)),.19)
  return
 if f=='oxalis':
  for k in range(7):
   a=k*2.399;tip=o+Vector((math.cos(a)*.045,math.sin(a)*.045,.10+.012*(k%3)));s.rod(o,tip,.0022)
   for j in range(3):angle=a+j*T/3;s.leaf(tip,tip+Vector((math.cos(angle)*.041,math.sin(angle)*.041,.006)),.040,'triangle3',thick=.0018,role='triangular-trifoliate-leaf')
  c=o+Vector((.012,.02,.185));s.rod(o,c,.002);s.blossom(c,.012,5,mat=s.flower)
  return
 if f=='hosta':
  for k in range(8):
   a=k*2.399+s.phase;d=Vector((math.cos(a),math.sin(a),0));c=o+d*.046+Vector((0,0,.065));s.rod(o,c,.0045);s.leaf(c,c+d*.20+Vector((0,0,.115)),.095,'oval',thick=.0035)
  tip=o+Vector((.045,0,.48));s.stem([o,o+Vector((.018,0,.25)),tip],.004)
  for j in range(3):base=tip-Vector((0,0,j*.05));end=base+Vector((.026,0,.008));s.rod(base,end,.002);s.funnel(end,.017,.040,normal=(.9,0,.3),mat='#deddd0')
  return
 if f=='coleus':
  for k in range(3):
   a=k*T/3;tip=o+Vector((math.cos(a)*.034,math.sin(a)*.034,.22));s.rod(o,tip,.004)
   for j in range(3):
    c=o.lerp(tip,.30+j*.25)
    for side in(-1,1):
     d=Vector((math.cos(a+side*1.3),math.sin(a+side*1.3),.4)).normalized();p=c+d*.010;q=c+d*.09;s.rod(c,p,.003);s.leaf(p,q,.054,'teeth','#9eaa76',.003);s.leaf(p+d*.004+Vector((0,0,.002)),q-d*.007+Vector((0,0,.002)),.039,'teeth',s.green,.001,'variegated-leaf-center')
  return
 raise ValueError('missing foliage '+f)

def flowering(s):
 o=s.origin;f=s.p['form'];pid=s.id
 if f=='round':
  for k in range(6):
   a=k*T/6+s.phase;tip=o+Vector((math.cos(a)*.062,math.sin(a)*.062,.065+.016*(k%2)));s.rod(o,tip,.003)
   if pid=='nasturtium':s.sphere(tip,(.071,.071,.003),s.green,'peltate-round-leaf',10,1)
   else:s.leaf(tip-Vector((.027,0,0)),tip+Vector((.035,0,.012)),.069,'teeth',thick=.0025)
  for k in range(2):
   tip=o+Vector(((k*2-1)*.035,-.028,.155));s.rod(o,tip,.003)
   if pid=='nasturtium':s.blossom(tip,.030,5,mat=s.flower);s.rod(tip,tip+Vector((-.012,0,-.017)),.003,s.flower,'flower-spur')
   else:
    for j in range(7):a=j*2.399;s.blossom(tip+Vector((math.cos(a)*.028,math.sin(a)*.028,.012*(j%2))),.014,5)
  return
 if f=='trumpet':
  for k in range(4):
   a=k*T/4;tip=o+Vector((math.cos(a)*.078,math.sin(a)*.078,.070+.025*(k%2)));s.stem([o,o+Vector((math.cos(a)*.038,math.sin(a)*.038,.035)),tip],.003)
   for j in range(2):s.petiole_leaf(o.lerp(tip,.38+j*.3),(math.cos(a+(-1)**j),math.sin(a+(-1)**j),.3),.047,.024)
   s.funnel(tip+Vector((0,0,.027)),.032,.032,normal=(math.cos(a)*.3,math.sin(a)*.3,.9))
  return
 if f=='portulaca':
  for k in range(5):
   a=k*T/5;tip=o+Vector((math.cos(a)*.09,math.sin(a)*.09,.025));s.rod(o,tip,.003)
   for j in range(3):
    c=o.lerp(tip,.3+j*.23)
    for side in(-1,1):s.petiole_leaf(c,(math.cos(a+side*1.1),math.sin(a+side*1.1),.5),.022,.005,'sword',thick=.004)
   s.blossom(tip+Vector((0,0,.010)),.022,6)
  return
 if f=='pansy':
  for k in range(5):
   a=k*T/5;s.petiole_leaf(o,(math.cos(a),math.sin(a),.6),.064,.035,'round')
  for k in range(2):
   c=o+Vector(((k*2-1)*.03,.01,.11));s.rod(o,c,.0025)
   for j in range(5):a=j*T/5;length=.026 if j<2 else .022;s.leaf(c,c+Vector((math.cos(a)*length,math.sin(a)*length,.006)),length*.9,'spoon',s.flower,.0015,'pansy-petal')
   s.blossom(c+Vector((0,0,.003)),.009,5,mat='#6f657b',centerMat='#b9ab63')
  return
 if f in ('daisy','marigold'):
  for k in range(3):
   a=k*T/3;tip=o+Vector((math.cos(a)*.04,math.sin(a)*.04,.26+.022*(k%2)));s.rod(o,tip,.0035)
   for j in range(2):
    c=o.lerp(tip,.3+j*.3)
    for side in(-1,1):
     angle=a+side*1.2
     if f=='daisy':s.petiole_leaf(c,(math.cos(angle),math.sin(angle),.3),.062,.027,'oval')
     else:
      end=c+Vector((math.cos(angle)*.066,math.sin(angle)*.066,.015));s.rod(c,end,.002)
      for m in range(3):
       p=c.lerp(end,.3+.22*m)
       for sg in(-1,1):s.petiole_leaf(p,(math.cos(angle+sg*1.2),math.sin(angle+sg*1.2),.15),.023,.008,'lance')
   s.blossom(tip,.034 if f=='daisy'else .026,9 if f=='daisy'else 7,2 if f=='daisy'else 3)
  return
 # Distinct woody flower habits, leaf arrangements and blossom architectures.
 height=.44 if f in('hydrangea','hibiscus','bougainvillea')else .36;branches=3 if f not in('rose','hydrangea')else 2
 trunk=o+Vector((0,0,height*.72));s.rod(o,trunk,.007,s.wood)
 for k in range(branches):
  a=k*T/branches+s.phase;base=o+Vector((0,0,height*.24));tip=o+Vector((math.cos(a)*.115,math.sin(a)*.115,height+.024*(k%2)));s.stem([base,o+Vector((math.cos(a)*.045,math.sin(a)*.045,height*.6)),tip],.0045,s.wood)
  for j in range(3):
   c=base.lerp(tip,.22+.25*j)
   if f=='rose':
    end=c+Vector((math.cos(a+1.1)*.072,math.sin(a+1.1)*.072,.025));s.rod(c,end,.002)
    for m in range(3):
     pt=c.lerp(end,.4+.24*m)
     for side in(-1,1):s.petiole_leaf(pt,(math.cos(a+1.1+side*.85),math.sin(a+1.1+side*.85),.15),.024,.014,'teeth')
    s.leaf(c,c+Vector((-.007,.008,-.005)),.008,'triangle',s.wood,.003,'thorn')
   else:
    paired=f in('gardenia','jasmine','fuchsia','hydrangea');sides=(-1,1)if paired else ((-1)**j,)
    for side in sides:
     ang=a+side*1.10;le=.108 if f=='hydrangea'else .091 if f=='hibiscus'else .060 if f=='bougainvillea'else .065 if f=='fuchsia'else .076;w=.064 if f=='hydrangea'else .044 if f=='hibiscus'else .026 if f=='fuchsia'else .034;s.petiole_leaf(c,(math.cos(ang),math.sin(ang),.35),le,w,'teeth'if f in('hydrangea','hibiscus')else 'oval',thick=.003)
  if f=='hydrangea':
   for j in range(11):ang=j*2.399;radius=.054*math.sqrt(j/11);pos=tip+Vector((math.cos(ang)*radius,math.sin(ang)*radius,.02+.030*math.sqrt(max(0,1-(radius/.06)**2))));s.rod(tip,pos,.0018);s.blossom(pos,.017,4)
  elif f in('rose','camellia','gardenia'):s.blossom(tip,.039 if f!='rose'else .035,7 if f!='camellia'else 9,3 if f!='camellia'else 2,centerMat='#c8b46c')
  elif f=='hibiscus':
   s.blossom(tip,.056,5,1,normal=(.3,-.2,1));q=tip+Vector((.015,-.011,.065));s.rod(tip,q,.0025,'#c0ac6a','protruding-style')
   for j in range(4):s.sphere(q+Vector((math.cos(j*T/4)*.007,math.sin(j*T/4)*.007,-.006)),(.006,.006,.006),'#c9b568','anther',5,1)
  elif f=='jasmine':s.blossom(tip,.026,7,2,mat='#d5d5be')
  elif f=='bougainvillea':
   for j in range(2):
    c=tip+Vector((j*.021,0,.015));s.rod(tip,c,.002)
    for m in range(3):ang=m*T/3;s.leaf(c,c+Vector((math.cos(ang)*.030,math.sin(ang)*.030,.008)),.028,'triangle3',s.flower,.0015,'papery-bract')
    s.funnel(c+Vector((0,0,.01)),.005,.009,mat='#d7d8c4')
  elif f=='fuchsia':
   c=tip+Vector((.016,0,-.063));s.stem([tip,tip+Vector((.014,0,-.026)),c],.002);s.funnel(c-Vector((0,0,.018)),.017,.021,normal=(0,0,-1),mat='#8f728c')
   for j in range(4):ang=j*T/4;s.leaf(c,c+Vector((math.cos(ang)*.026,math.sin(ang)*.026,-.023)),.012,'lance','#aa626b',.0015,'reflexed-sepal')
  else:raise ValueError('missing flowering '+f)

def moss(s):
 f=s.p['form'];o=s.origin;count=10 if f in('exp-cushion','exp-silver')else 7
 if f in('exp-feather','exp-fern-moss','exp-two-row'):
  for k in range(5):
   a=k*.65+s.phase;base=o+Vector((-.070+k*.030,-.032,.002));tip=base+Vector((math.cos(a)*.09,math.sin(a)*.09,.012));s.rod(base,tip,.0016,role='moss-axis')
   for j in range(4):
    c=base.lerp(tip,.15+.22*j)
    for side in(-1,1):
     d=Vector((-math.sin(a),math.cos(a),0))*side
     if f=='exp-two-row':s.leaf(c,c+d*.025+Vector((0,0,.004)),.010,'lance',thick=.0012,role='two-row-moss-leaf')
     else:
      branch=c+d*.033; s.rod(c,branch,.0012,role='moss-branch')
      for m in range(3):
       pt=c.lerp(branch,.3+.3*m);s.leaf(pt,pt+Vector((math.cos(a)*.012,math.sin(a)*.012,.004)),.006 if f=='exp-fern-moss'else .009,'lance',thick=.001,role='moss-pinna')
  return
 for k in range(count):
  ang=k*2.399;rr=.055*math.sqrt((k+.5)/count);base=o+Vector((math.cos(ang)*rr,math.sin(ang)*rr,0));ht=.020 if f in('exp-cushion','exp-silver')else .043 if f in('exp-stars','exp-redstars','exp-sphagnum')else .031;tip=base+Vector((.004 if f=='exp-swept'else 0,0,ht));s.rod(base,tip,.0015,role='moss-stem')
  leaves=5 if f not in('exp-broad-moss','exp-swept')else 4
  for j in range(leaves):
   a=j*T/leaves+k*.14;d=Vector((math.cos(a),math.sin(a),0));c=base.lerp(tip,.45+.45*(j%2));length=.016 if f in('exp-cushion','exp-silver')else .024 if f in('exp-broad-moss','exp-bent')else .020;lift=-.009 if f=='exp-bent'else .005 if f in('exp-stars','exp-redstars')else .015 if f in('exp-cushion','exp-silver')else .008;direction=Vector((.016,.002,.011))if f=='exp-swept'else d*length+Vector((0,0,lift));s.leaf(c,c+direction,.010 if f=='exp-broad-moss'else .005 if f not in('exp-cushion','exp-silver')else .006,'oval'if f=='exp-broad-moss'else 'lance',thick=.0012,role='moss-leaf')
   if f in('exp-silver','exp-redstars','exp-hairpoints'):end=c+direction;s.rod(end,end+d*.005+Vector((0,0,.003)),.0008,'#c0c2ab'if f!='exp-redstars'else '#a37057','moss-leaf-tip')
  if f=='exp-sphagnum':
   for j in range(3):a=j*T/3;c=base.lerp(tip,.4);end=c+Vector((math.cos(a)*.029,math.sin(a)*.029,-.007));s.rod(c,end,.0014,role='pendent-moss-branch');s.leaf(end,end+Vector((0,0,.015)),.005,'lance',thick=.001)
  if f=='exp-hairpoints'and k%3==0:
   cap=base+Vector((.006,.003,.065));s.rod(base,cap,.0009,'#8e7158','sporophyte-seta');s.sphere(cap,(.006,.005,.012),'#93755d','spore-capsule',6,2)

CACTI={'barrel','column','pads','cluster','exp-star','exp-flatstar','exp-ribbed','exp-fingers','exp-woolball','exp-thimbles','exp-redcolumn','exp-chin','exp-chinflower','exp-smooth','exp-peanuts','exp-bluebarrel','exp-goldcolumn','exp-offsets','exp-hooked','exp-wavy','exp-haircolumn'}
TRAIL={'tails','ivy','spider','exp-segments','exp-fishbone','exp-threads','exp-beadtail'}
SUCC={'swords','agave','snake','zebra','rosette','beads','jade','kalanchoe','exp-stones','exp-windows','exp-splitrock','exp-jaws','exp-bubble','exp-fan','exp-triangle','exp-ridged','exp-pointed','exp-powder','exp-velvet','exp-stacked','exp-scales','exp-felt','exp-paddles','exp-paws','exp-crinkle','exp-tree'}
HERBS={'herb','tiny','needles','parsley','onion','spikes','lettuce','radish','strawberry','cosmos'}
FOLIAGE={'fern','split','oxalis','coleus','hosta'}
MOSS={'exp-cushion','exp-swept','exp-feather','exp-fern-moss','exp-stars','exp-redstars','exp-silver','exp-hairpoints','exp-bent','exp-broad-moss','exp-two-row','exp-sphagnum'}
for index,record in enumerate(RECORDS):
 s=Plant(record,index);f=record['form']
 if f in CACTI:cactus(s)
 elif f in TRAIL:trailing(s)
 elif f in SUCC:succulent(s)
 elif f in HERBS:herb(s)
 elif f in FOLIAGE:foliage(s)
 elif f in MOSS:moss(s)
 elif f in('berries','tomato','pepper'):woody_fruit(s)
 else:flowering(s)
 s.a.meta['footprint']={'width':s.pr*1.4,'depth':s.pr*1.4,'shape':'circle','bearing':'actual review-vessel bottom; foliage canopy excluded'}
 s.a.meta['morphologyWorkflowGroup']=('cactus'if f in CACTI else 'succulent'if f in SUCC else 'trailing'if f in TRAIL else 'moss'if f in MOSS else 'foliage'if f in FOLIAGE else 'herb'if f in HERBS else 'fruit'if f in('berries','tomato','pepper')else 'flowering')
 lo,hi,dim=b.measure(s.a);shift=Vector(((lo[0]+hi[0])/2,(lo[1]+hi[1])/2,lo[2]))
 for ob in s.a.objects:
  for v in ob.data.vertices:v.co-=shift
  ob.data.update()
 for field in b.fields:
  if field['asset']==s.id:
   for key in('center','paintOrigin'):field[key]=[field[key][k]-shift[k]for k in range(3)]
 s.a.meta['reviewSoilTop']-=shift.z;s.a.meta['reviewVesselCenter']=[-shift.x,-shift.y]
 print('PLANT_AUTHORED',index+1,record['id'],len(s.a.objects),flush=True)
assert len(b.assets)==110
if MODE=='final':
 b.pack();expected=json.loads((ROOT/'plants-retained/texture-layout.json').read_text());public=[{k:v for k,v in field.items()if k not in('loopIndices','object','polygon','uvMetres')}for field in b.fields]
 assert expected['fields']==public and expected['usedRows']==b.usedRows,'Frozen plant geometry/UV changed before final export'
 print('FROZEN PLANT LAYOUT EXACTLY MATCHED',flush=True)
b.finish()
