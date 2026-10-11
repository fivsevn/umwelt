"""Author the empty residential scene in actual Blender and export its meshes.
Runtime uses a compact binary of the evaluated Blender mesh; no duplicate builder.
"""
import bpy, math, json, struct, hashlib
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent; ROOT=HERE.parents[2]
DEST=ROOT/'rooftop/assets/background'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for d in list(bpy.data.materials):bpy.data.materials.remove(d)
fields=json.loads((HERE/'pencil-strokes.json').read_text())['fields']
image=bpy.data.images.load(str(DEST/'terrace-book.png'));image.pack()
materials={}
for name,(x,y,w,h)in fields.items():
 m=bpy.data.materials.get(name)or bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;n.clear();l=m.node_tree.links
 uv=n.new('ShaderNodeTexCoord');divide=n.new('ShaderNodeVectorMath');divide.operation='DIVIDE';divide.inputs[1].default_value=(w,h,1);l.new(uv.outputs['UV'],divide.inputs[0])
 fract=n.new('ShaderNodeVectorMath');fract.operation='FRACTION';l.new(divide.outputs['Vector'],fract.inputs[0])
 scale=n.new('ShaderNodeVectorMath');scale.operation='MULTIPLY';scale.inputs[1].default_value=(w/512,-h/512,1);l.new(fract.outputs['Vector'],scale.inputs[0])
 offset=n.new('ShaderNodeVectorMath');offset.operation='ADD';offset.inputs[1].default_value=(x/512,1-y/512,0);l.new(scale.outputs['Vector'],offset.inputs[0])
 tex=n.new('ShaderNodeTexImage');tex.image=image;tex.interpolation='Closest';l.new(offset.outputs['Vector'],tex.inputs['Vector'])
 bs=n.new('ShaderNodeBsdfPrincipled');bs.inputs['Roughness'].default_value=.95;l.new(tex.outputs['Color'],bs.inputs['Base Color']);out=n.new('ShaderNodeOutputMaterial');l.new(bs.outputs['BSDF'],out.inputs['Surface'])
 materials[name]=m
collections={}
def collection(name):
 if name not in collections:
  c=bpy.data.collections.new(name);bpy.context.scene.collection.children.link(c);collections[name]=c
 return collections[name]
def mesh(name,vertices,faces,kind,section,uv=None):
 data=bpy.data.meshes.new(name);data.from_pydata([(x,-z,y)for x,y,z in vertices],[],faces);data.materials.append(materials[kind]);data.update()
 o=bpy.data.objects.new(name,data);collection(section).objects.link(o)
 layer=data.uv_layers.new(name='Pixelorama metric chart')
 for poly in data.polygons:
  # face metric is computed in the physical plane; eight square texels/unit
  coords=[vertices[i]for i in poly.vertices];a=Vector(coords[0]);b=Vector(coords[1]);c=Vector(coords[2]);normal=(b-a).cross(c-a).normalized()
  u=Vector((1,0,0)) if abs(normal.y)>.98 else Vector((0,1,0)).cross(normal).normalized()
  u=(u-normal*u.dot(normal)).normalized();v=normal.cross(u)
  for loop in poly.loop_indices:
   p=Vector(vertices[data.loops[loop].vertex_index])
   if uv is not None:tx,ty=uv(p)
   else:tx,ty=p.dot(u)*8,p.dot(v)*8
   layer.data[loop].uv=(tx,ty)
 return o
def box(name,x,y,z,w,h,d,kind='plaster',section='Main building',rx=0,ry=0):
 points=[]
 for xx,yy,zz in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]:
  a,b,c=xx*w/2,yy*h/2,zz*d/2
  b,c=b*math.cos(rx)-c*math.sin(rx),b*math.sin(rx)+c*math.cos(rx)
  a,c=a*math.cos(ry)+c*math.sin(ry),-a*math.sin(ry)+c*math.cos(ry)
  points.append((x+a,y+b,z+c))
 o=mesh(name,points,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(3,7,6,2),(0,4,7,3),(1,2,6,5)],kind,section)
 o['runtime_box']=True
 return o
def slab(name,points,y,kind,section,uv=None):
 # Blender triangulates a concave ngon on export.
 return mesh(name,[(x,y,z)for x,z in points],[tuple(reversed(range(len(points))))],kind,section,uv)
def window(name,x,y,z,w,h,side=1,section='Main building',small=False,glass='glass',divisions=2):
 box(name+' recess',x,y,z,w+.22,h+.2,.12,'cement',section)
 box(name+' glass',x,y,z+side*.08,w,h,.025,glass,section)
 for i in range(divisions+1):box(name+' mullion',x-w/2+i*w/divisions,y,z+side*.13,.055,h+.13,.065,'cap',section)
 for yy in [-h/2,h/2]:box(name+' frame',x,y+yy,z+side*.13,w+.15,.065,.09,'cap',section)
 box(name+' sill',x,y-h/2-.09,z+side*.20,w+.35,.12,.45,'cap',section)
def parapet(name,x,y,z,w,h,d,kind='stained-plaster',section='Main building'):
 box(name,x,y+h/2,z,w,h,d,kind,section);box(name+' coping',x,y+h+.06,z,w+.1,.12,d+.1,'cap',section)
def rail(name,x,z,w,y=0,section='Main building'):
 for i in range(int(w/.85)+1):box(name+' picket',x-w/2+i*.85,y+1.2,z,.045,1.55,.045,'metal',section)
 box(name+' upper',x,y+1.94,z,w,.055,.07,'rust-iron',section);box(name+' lower',x,y+.65,z,w,.055,.07,'rust-iron',section)
def beam(name,a,b,width,kind='rust-iron',section='Opposite older residences'):
 a=Vector(a);b=Vector(b);v=b-a;u=v.cross(Vector((0,0,1)))
 if u.length<1e-5:u=v.cross(Vector((1,0,0)))
 u=u.normalized()*width;w=u.cross(v).normalized()*width;c=(a+b)/2
 points=[tuple(c+(u*i+v*j+w*k)/2)for i,j,k in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
 o=mesh(name,points,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(3,7,6,2),(0,4,7,3),(1,2,6,5)],kind,section);o['runtime_box']=True
def air_conditioner(name,x,y,z,side,section):
 box(name+' housing',x,y,z,1.15,.85,.55,'cap',section)
 for xx in [-.38,.38]:box(name+' bracket',x+xx,y-.49,z-.15*side,.08,.08,.9,'rust-iron',section)
 # The round fan is actual geometry, with four visible spokes.
 zz=z+side*.29;verts=[(x,y,zz)]+[(x+math.cos(i*math.tau/12)*.31,y+math.sin(i*math.tau/12)*.31,zz)for i in range(12)]
 faces=[(0,i+1,(i+1)%12+1)if side==1 else(0,(i+1)%12+1,i+1)for i in range(12)]
 mesh(name+' round fan',verts,faces,'dark-glass',section)
 for i in range(4):
  a=i*math.pi/4;beam(name+' fan guard',(x-math.cos(a)*.31,y-math.sin(a)*.31,zz+side*.02),(x+math.cos(a)*.31,y+math.sin(a)*.31,zz+side*.02),.035,'cement',section)
 for yy in [-.24,-.12,0,.12,.24]:box(name+' vent',x+.43,y+yy,zz,.12,.025,.035,'cement',section)
def enclosed_balcony(name,x,y,wall,w,side,variant,section='Opposite older residences',depth=1.7,detail=True):
 z=wall+side*depth;glass=['glass','blue-glass','dark-glass','glass'][variant%4]
 # An enclosed projecting room, with an opaque apron and glazing on three sides.
 box(name+' lower apron',x,y-1.76,(wall+z)/2,w,1.1,depth,'facade',section)
 box(name+' floor belt',x,y-2.35,(wall+z)/2,w+.25,.18,depth+.12,'cap',section)
 for xx in [x-w/2,x+w/2]:
  box(name+' concrete return',xx,y-.25,(wall+z)/2,.18,3.85,depth,'plaster',section)
  box(name+' side glazing',xx+(1 if xx>x else -1)*.10,y+.25,(wall+z)/2,.025,2.6,max(.1,depth-.30),glass,section)
 window(name+' balcony glazing',x,y+.12,z,w-.35,2.65,side,section,glass=glass,divisions=(4 if variant%3 else 5)if detail else 2)
 if variant%4==1:box(name+' half blue curtain',x-w*.24,y+.12,z+side*.10,w*.27,2.4,.018,'blue-glass',section)
 # White small-tile awnings have a sloping top and a distinct front fascia.
 box(name+' sloping tiled awning',x,y+1.97,wall+side*(depth*.65),w+.38,.15,depth+1.05,'awning',section,rx=-side*.19)
 box(name+' awning fascia',x,y+1.70,z+side*.52,w+.4,.33,.13,'awning',section)
 for xx in [-w*.32,w*.32]:beam(name+' awning brace',(x+xx,y+1.2,wall+side*.18),(x+xx,y+1.8,z+side*.3),.05,'rust-iron',section)
 if not detail:return
 # Open drying racks are thin cantilevers. Some households enclose theirs in a cage.
 front=z+side*1.1;bottom=y-1.37
 for i in range(5):
  xx=x-w/2+i*w/4
  beam(name+' drying rack spoke',(xx,bottom,z+side*.2),(xx,bottom,front),.045,section=section)
 for yy in [bottom,bottom+.24]:box(name+' drying rack front',x,yy,front,w+.18,.045,.045,'rust-iron',section)
 for xx in [-w*.42,w*.42]:beam(name+' drying rack diagonal',(x+xx,bottom-.67,z+side*.12),(x+xx,bottom,front),.045,section=section)
 if variant%7 in [1,5]:
  for i in range(11):box(name+' security vertical',x-w/2+i*w/10,y+.12,z+side*.29,.035,2.68,.035,'metal',section)
  for yy in [-1.12,-.44,.24,.92,1.43]:box(name+' security horizontal',x,y+yy,z+side*.31,w,.04,.04,'metal',section)
# The private terrace contour is unchanged. Every adjacent home repeats that
# contour in mirrored pairs; the twelve-unit setbacks belong to the building.
EAVE=5.6;RIDGE=13.2;BASE=-28.15;Z1=28;X0=-82;X1=66
homes=[(0,1),(-20,-1),(52,1),(32,-1),(-52,1),(-72,-1)]
pairs=[(-30,10),(22,62),(-82,-42)]
north=[(-10,-8),(-2,-8),(-2,-12),(6,-12),(6,-8),(10,-8),(10,12),(6,12),(6,4),(-10,4)]
box('Five floors central body',(X0+X1)/2,(BASE-.4)/2,16,X1-X0,-.4-BASE,24,'facade')
box('Intact sixth-floor rear body',(X0+X1)/2,2.8,20,X1-X0,5.6,16,'plaster')
# The pitched roof stays continuous; occupied facade bays interrupt the terrace
# strip between pairs, as in the aerial reference.
mesh('Dark tiled pitched roof',[(X0-1,EAVE,3.4),(X1+1,EAVE,3.4),(X0-1,RIDGE,16),(X1+1,RIDGE,16),(X0-1,EAVE,28.6),(X1+1,EAVE,28.6)],[(0,2,3,1),(2,4,5,3)],'roof','Main building')
for x in [X0,X1]:mesh('End gable',[(x,EAVE,4),(x,EAVE,28),(x,RIDGE,16)],[(0,1,2)if x==X0 else(0,2,1)],'plaster','Main building')
box('Ridge cap',(X0+X1)/2,RIDGE+.1,16,X1-X0+2,.22,.35,'roof')
for z in [3.65,28.35]:box('Eaves and rain gutter',(X0+X1)/2,EAVE-.04,z,X1-X0+2,.28,.48,'cap')
for home,(cx,mirror)in enumerate(homes):
 section='User terraces' if home==0 else 'Neighbour terraces'
 pts=[(cx+mirror*x,z)for x,z in north]
 if mirror<0:pts.reverse()
 slab(('North terrace unique patched floor' if home==0 else 'Neighbour north paired floor '+str(home)),pts,.012 if home==0 else 0,'north-floor',section,lambda p,cx=cx,mirror=mirror:(((p.x-cx)*mirror+14)*8,(p.z+16)*8))
 # Structural thickness follows all projections rather than a floating sheet.
 slab('North concrete underside '+str(home),pts,-.27,'cement',section)
 for i,(a,b)in enumerate(zip(pts,pts[1:]+pts[:1])):
  local_x=((a[0]+b[0])/2-cx)*mirror;z=(a[1]+b[1])/2
  if z==4 or(local_x==6 and z>4):continue
  w=abs(a[0]-b[0]);d=abs(a[1]-b[1])
  parapet('North patched edge '+str(home)+' '+str(i),(a[0]+b[0])/2,0,z,max(w,.24),.95 if home==0 else .87,max(d,.24),section=section)
 # Mirror the complete indoor wall and entry recess too.
 core=(cx-10,cx+6)if mirror==1 else(cx-6,cx+10)
 box('Sixth-floor room front '+str(home),sum(core)/2,2.8,8,core[1]-core[0],5.6,8,'plaster',section)
 window('Basin-side small window '+str(home),cx-mirror*2.9,2.42,3.89,2.3,1.65,-1,section,True)
 window('Sixth-floor north room window '+str(home),cx-mirror*7.4,2.5,3.89,3,2.55,-1,section)
 portal=cx+mirror*6
 for z,d in [(5.75,3.5),(10.875,2.25)]:box('Entry return '+str(home),portal,2.8,z,.25,5.6,d,'plaster',section)
 box('Entry lintel '+str(home),portal,4.2,8.4,.25,2.8,2.25,'plaster',section)
 if home>0:box('Neighbour inset door '+str(home),portal,1.38,8.4,.10,2.75,2.14,'dark-glass',section)
 south=[(cx-10,28),(cx+10,28),(cx+10,36),(cx-10,36)]
 slab(('South balcony unique patched floor' if home==0 else 'Neighbour south paired floor '+str(home)),south,.015 if home==0 else 0,'south-floor',section,lambda p,cx=cx:((p.x-cx+12)*8,(p.z-24)*8))
 slab('South concrete underside '+str(home),south,-.27,'cement',section)
 parapet('South outer edge '+str(home),cx,0,36,20,.87,.24,section=section)
 for x in [cx-10,cx+10]:parapet('South side divider '+str(home),x,0,32,.24,1.55,8,section=section)
 rail('South rusty railing '+str(home),cx,36,19.5,section=section)
 for xx in [-5,1.6,6.9]:window('South sixth-floor window '+str(home),cx+mirror*xx,2.5,28.1,3.4,2.5,1,section)
 # Same north projection under every household, reaching the lower floors.
 box('Paired north supporting body '+str(home),cx,(BASE-.4)/2,-2,20,-.4-BASE,12,'facade')
 px=cx+mirror*2
 box('North projecting bay support '+str(home),px,(BASE-.4)/2,-10,8,-.4-BASE,4,'facade')
 box('Paired south supporting body '+str(home),cx,(BASE-.4)/2,32,20,-.4-BASE,8,'facade')
 for f in range(5):
  y=-3.2-f*5.6
  enclosed_balcony('Home north projecting bay '+str(home)+' '+str(f),px,y,-12.02,7.1,-1,home*3+f,'Main building',.22)
  window('Home narrow north window',cx-mirror*6.5,y,-8.07,2.6,3.0,-1,glass='dark-glass' if(f+home)%3==0 else 'glass')
  enclosed_balcony('Home south bay '+str(home)+' '+str(f),cx+mirror*2,y,36.02,6.7,1,home+f*2,'Main building',.22)
  window('Home narrow south window',cx-mirror*6.5,y,36.07,2.5,3.0,1)
  if(f+home)%2==0:air_conditioner('Home AC',cx-mirror*4.5,y-1.1,-8.6,-1,'Main building')
 # Real rain pipes continue past the six-floor terrace floor.
 for z in [-7.92,36.14]:box('Home rainwater pipe',cx-mirror*8.7,(BASE+EAVE)/2,z,.14,EAVE-BASE,.14,'cement')
# Neighbour households meet in mirrored pairs; inter-pair slots fit two garages.
for a,b in pairs:
 parapet('Shared north party wall',(a+b)/2,0,-2,.25,1.8,12,section='Neighbour terraces')
for x in [-36,16]:
 box('Occupied bay between terrace pairs',x,2.8,5.8,12,5.6,12.4,'plaster')
 box('Southern recessed bay between pairs',x,2.8,30,12,5.6,4,'plaster')
 window('Inter-pair stairwell window',x,2.7,-.46,1.55,2.6,-1)
 window('Inter-pair south window',x,2.7,32.06,1.55,2.6,1)
 for f in range(5):
  window('Inter-pair lower stair window',x,-3.2-f*5.6,3.84,1.65,2.65,-1)
  window('Inter-pair lower south window',x,-3.2-f*5.6,28.16,1.65,2.65,1)
# The pair gaps descend to two ground-floor storage garages side by side.
for x in [-36,16]:
 for dx in [-3,3]:
  gx=x+dx;gy=BASE+2.5
  box('Ground-floor small garage recess',gx,gy,3.85,5.35,5,.16,'cement')
  box('Ground-floor garage shutter',gx,gy,3.73,4.9,4.7,.10,'garage-door')
  for xx in [-2.57,2.57]:box('Garage concrete jamb',gx+xx,gy,3.60,.17,5.15,.30,'cap')
  box('Garage lintel',gx,gy+2.57,3.60,5.45,.17,.30,'cap')
  box('Garage small lock',gx+.16,gy-1.6,3.64,.13,.16,.045,'rust-iron')
 box('Inter-pair ground landing',x,BASE+.03,-1,12,.15,10,'cement')
# End facade windows face across the alley, with visible surrounds and sills.
for f in range(6):
 y=2.8-f*5.6
 for z in [15,23]:
  box('East-end recess',X1+.10,y,z,.10,2.85,2.7,'cement')
  box('East-end glazing',X1+.16,y,z,.025,2.65,2.5,'glass')
  for zz in [z-1.3,z,z+1.3]:box('East-end mullion',X1+.20,y,zz,.05,2.8,.06,'cap')
  for yy in [y-1.4,y+1.4]:box('East-end frame',X1+.20,yy,z,.07,.08,2.8,'cap')
# Opposite six-storey blocks have projecting enclosed balcony rooms, narrow
# stairwell windows, tile awnings, mixed glazing, drying racks, cages and ACs.
def distant_building(label,cx,cz,width,depth,storeys,base=BASE,detail=True):
 before=set(bpy.data.objects)
 section='Opposite older residences';h=storeys*5.6;top=base+h;pitch=4.6
 box(label+' main volume',cx,base+h/2,cz,width,h,depth,'facade',section)
 mesh(label+' finite hipped gray roof',[(cx-width/2-.5,top,cz-depth/2-.4),(cx+width/2+.5,top,cz-depth/2-.4),(cx-width/2-.5,top,cz+depth/2+.4),(cx+width/2+.5,top,cz+depth/2+.4),(cx-width/2+depth/2,top+pitch,cz),(cx+width/2-depth/2,top+pitch,cz)],[(0,4,5,1),(4,2,3,5),(0,2,4),(1,5,3)],'roof',section)
 for x in [cx-width/2,cx+width/2]:box(label+' end eave fascia',x,top-.17,cz,.45,.52,depth+.6,'plaster',section)
 for side in [-1,1]:
  wall=cz+side*depth/2
  box(label+' eave fascia',cx,top-.17,wall+side*.23,width+.65,.52,.40,'plaster',section)
  n=int(width/11.8);spacing=width/n
  for b in range(n):
   x=cx-width/2+(b+.5)*spacing
   # Stained risers divide the households, not a uniform wall of windows.
   box(label+' vertical bay seam',x-spacing/2+.1,base+h/2,wall+side*.025,.14,h,.075,'cement',section)
   box(label+' downpipe',x+spacing*.40,base+h/2,wall+side*.18,.13,h,.13,'cement',section)
   for f in range(storeys):
    y=base+2.8+f*5.6;variant=b*5+f*3+(1 if side>0 else 0)
    enclosed_balcony(label+' balcony '+str(b)+' '+str(f),x-1.25,y,wall,6.9,side,variant,section,detail=detail)
    window(label+' narrow stairwell window',x+4.22,y+.05,wall+side*.06,2.1,3.1,side,section,glass='dark-glass' if variant%3==0 else 'glass')
    if detail and variant%4!=0:air_conditioner(label+' AC '+str(b)+' '+str(f),x+3.75,y-1.5,wall+side*.55,side,section)
    if detail and variant%8==3:
     for i in range(6):box(label+' narrow window security bars',x+3.2+i*.4,y+.05,wall+side*.3,.035,3.15,.04,'metal',section)
  for f in range(storeys):
   y=base+f*5.6
   box(label+' storey seam',cx,y,wall+side*.05,width,.09,.10,'cement',section)
 # End elevation carries two narrow windows on each floor and exposed pipes.
 for end in [-1,1]:
  xx=cx+end*(width/2+.04)
  for f in range(storeys):
   y=base+2.8+f*5.6
   for zz in [cz-4.4,cz+4.4]:
    box(label+' end window recess',xx,y,zz,.13,3.15,2.85,'cement',section)
    box(label+' end glazing',xx+end*.09,y,zz,.025,2.95,2.65,'dark-glass',section)
    for dd in [-1.34,0,1.34]:box(label+' end window frame',xx+end*.13,y,zz+dd,.065,3.16,.06,'cap',section)
    box(label+' end sill',xx+end*.22,y-1.64,zz,.45,.12,3.05,'cap',section)
  box(label+' end pipe',xx+end*.12,base+h/2,cz+7,.16,h,.16,'cement',section)
 return list(set(bpy.data.objects)-before)
def transform_native(objects,dx,dz,angle=0):
 for obj in objects:
  for v in obj.data.vertices:
   x,y,z=v.co.x,v.co.z,-v.co.y
   nx=x*math.cos(angle)+z*math.sin(angle)+dx;nz=-x*math.sin(angle)+z*math.cos(angle)+dz
   v.co=(nx,-nz,y)
  obj.data.update()
# Residential high rises retain individually authored window/balcony structure.
# Their positions are taken from the aerial trace below, never a radial backdrop.
def residential_tower(label,x,z,w,d,h,kind='tower',far=False):
 section='Distant skyline';floor=5.6;floors=int(h/floor)
 box(label+' body',x,BASE+h/2,z,w,h,d,kind,section)
 for xx in [-w/2,w/2]:box(label+' corner pier',x+xx,BASE+h/2,z,.75,h,d+.30,'tower-trim',section)
 for side in [-1,1]:
  wall=z+side*d/2
  bays=3 if w>22 else 2;spacing=(w-2)/bays
  for bay in range(bays):
   xx=x-w/2+1+(bay+.5)*spacing;bw=spacing*.66
   for f in range(floors):
    yy=BASE+2.25+f*floor
    box(label+' recessed residential window',xx,yy,wall+side*.09,bw,2.45,.06,'dark-glass' if(bay+f)%4==0 else 'glass',section)
    box(label+' balcony apron',xx,yy-1.52,wall+side*.30,bw+.35,.58,.62,'tower-trim',section)
    box(label+' balcony upper ledge',xx,yy+1.42,wall+side*.27,bw+.45,.18,.63,'tower-trim',section)
    for div in [-bw/2,0,bw/2]:box(label+' window upright',xx+div,yy,wall+side*.16,.065,2.52,.06,'tower-trim',section)
    if not far:
     box(label+' balcony handrail',xx,yy-.82,wall+side*.57,bw+.15,.04,.05,'metal',section)
     for div in [-bw*.35,0,bw*.35]:box(label+' balcony picket',xx+div,yy-1.02,wall+side*.57,.035,.42,.035,'metal',section)
  for f in range(floors):box(label+' thin storey belt',x,BASE+f*floor,wall+side*.08,w,.08,.15,'tower-trim',section)
 # Side walls also have individual windows rather than blank colour slabs.
 for end in [-1,1]:
  for f in range(floors):
   for dz in [-d*.24,d*.24]:
    yy=BASE+2.3+f*floor;xx=x+end*(w/2+.05)
    box(label+' side glazing',xx,yy,z+dz,.04,2.6,2.7,'glass',section)
    box(label+' side sill',xx+end*.13,yy-1.4,z+dz,.30,.15,3.0,'tower-trim',section)
 for xx in [-w*.30,w*.30]:
  box(label+' stepped crown',x+xx,BASE+h+.3,z,w*.43,.9,d+.9,'tower-trim',section)
  box(label+' inset roof room',x+xx,BASE+h+1.05,z,w*.31,.8,d*.46,'cement',section)
exec((HERE/'mapped-neighborhood.py').read_text())
exec((HERE/'street-life.py').read_text())
# Blender source cameras, materials and collections remain editable.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16
scene.world.color=(.7,.75,.8)
bpy.ops.object.light_add(type='AREA',location=(4,20,50));sun=bpy.context.object;sun.name='Large overcast sky';sun.data.energy=2200;sun.data.shape='DISK';sun.data.size=50
bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam
cam.location=(36,52,32);target=Vector((-5,0,2));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=65
scene.render.resolution_x=1400;scene.render.resolution_y=950;scene.render.resolution_percentage=100
scene.view_settings.view_transform='Standard'
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'empty-rooftop.blend'),compress=True)
exec((HERE/'export-native.py').read_text())
