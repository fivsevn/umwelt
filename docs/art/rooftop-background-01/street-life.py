"""Native Blender street assets; the same editable collections can be appended elsewhere.
This file is called by the full builder or by append-street-life.py after a model pass.
"""
import random
street_random=random.Random(920604)
# Side-street clearances are constrained by the existing apartment footprints.
section='Road and parking'
box('Continuous urban ground',-8,BASE-.3,16,4500,.35,4500,'ground',section)
for z in [-29,46]:
 box('Neighbourhood access lane',-2,BASE-.06,z,240,.13,7,'road',section)
 for d in [-4,4]:box('Lane kerb',-2,BASE+.08,z+d,240,.27,.34,'cap',section)
 for x in range(-112,119,12):
  for side in [-1,1]:
   zz=z+side*5.7
   for edge in [-4.4,4.4]:box('Parking bay end',x+edge,BASE+.04,zz,.10,.02,3.7,'awning',section)
   box('Parking bay edge',x,BASE+.04,zz+side*1.86,8.9,.02,.10,'awning',section)
# The public street stops at the perpendicular lanes, never passes through a block.
box('Guoliyuan side street',88,BASE-.07,9,13,.13,74,'road',section)
for x in [79.5,96.5]:box('Side-street pavement',x,BASE+.12,9,4,.38,74,'paving',section)
# Gongnong Road is the broad north/south road east of these parallel rows.
before=set(bpy.data.objects)
box('Gongnong mapped main road',0,BASE-.07,0,25,.13,1250,'road',section)
for x in [-15,15]:box('Main-road pavement',x,BASE+.12,0,4,.38,1250,'paving',section)
transform_native(list(set(bpy.data.objects)-before),315,90,-.266)
# Pavements and planted strips lie between kerbs and walls.
for z,w in [(-16,4),(-43,4),(38,2),(55,1.8)]:
 box('Old concrete footpath',-4,BASE+.10,z,232,.25,w,'paving',section)
# Low-poly tree crowns are actual faceted mesh, with discrete leaf pigments.
def crown(name,x,y,z,w,h,d):
 phi=(1+math.sqrt(5))/2
 raw=[(-1,phi,0),(1,phi,0),(-1,-phi,0),(1,-phi,0),(0,-1,phi),(0,1,phi),(0,-1,-phi),(0,1,-phi),(phi,0,-1),(phi,0,1),(-phi,0,-1),(-phi,0,1)]
 faces=[(0,11,5),(0,5,1),(0,1,7),(0,7,10),(0,10,11),(1,5,9),(5,11,4),(11,10,2),(10,7,6),(7,1,8),(3,9,4),(3,4,2),(3,2,6),(3,6,8),(3,8,9),(4,9,5),(2,4,11),(6,2,10),(8,6,7),(9,8,1)]
 return mesh(name,[(x+a*w/(2*phi),y+b*h/(2*phi),z+c*d/(2*phi))for a,b,c in raw],faces,'foliage','Street greenery')
def tree(x,z,index):
 box('Tree trunk '+str(index),x,BASE+3.6,z,.55,7.2,.58,'rust-iron','Street greenery')
 for dx,dz,h in [(0,0,8.8),(-1.7,.4,7.7),(1.5,-.6,8.1)]:crown('Rounded street tree '+str(index),x+dx,BASE+h,z+dz,6.2,5.3,5.6)
 box('Raised planted tree bed',x,BASE+.23,z,6.8,.46,4.9,'cement','Street greenery')
 box('Planted soil',x,BASE+.49,z,6.4,.08,4.5,'ground','Street greenery')
for i,x in enumerate([-112,-90,-68,-46,-24,0,25,49,69,109]):tree(x,-41,i)
for i,x in enumerate([-107,-76,-47,-11,30,63,107]):tree(x,-18,20+i)
for i,x in enumerate([-110,-84,-57,-8,31,58,112]):tree(x,54.6,40+i)
for i,z in enumerate([-17,3,24,41]):tree(105,z,60+i)
for x,z,w,d in [(-57,-19,14,3),(-15,-43,16,3),(49,-42,17,3),(-86,39,20,1.4),(26,39,14,1.4),(112,24,3,16)]:
 box('Street shrub planter',x,BASE+.25,z,w,.5,d,'cement','Street greenery')
 for xx in range(max(1,int(w/3))):crown('Low clipped shrubs',x-w/2+1.6+xx*3,BASE+1.0,z,3.2,1.5,d+.35)
# Authored vehicle templates remain hidden assets in the native file. Parked
# instances are actual copied native meshes, independently selectable/editable.
def wheel(name,x,y,z,r=.67):
 verts=[]
 for dz in [-.22,.22]:
  for i in range(10):verts.append((x+math.cos(i*math.tau/10)*r,y+math.sin(i*math.tau/10)*r,z+dz))
 faces=[tuple(reversed(range(10))),tuple(range(10,20))]+[(i,(i+1)%10,(i+1)%10+10,i+10)for i in range(10)]
 mesh(name,verts,faces,'tire','Vehicle templates')
 box(name+' hub',x,y,z+( .25 if z>0 else -.25),.49,.49,.035,'car-silver','Vehicle templates')
def vehicle(name,kind):
 before=set(bpy.data.objects);sec='Vehicle templates';body='car-ivory'
 length=8.3 if kind!=2 else 8.7;roof=2.9 if kind==2 else 2.45
 box(name+' chassis',0,BASE+.82,0,length,1.05,3.5,body,sec)
 # Sloped nose, windscreen and rear glass are mesh rather than texture tricks.
 points=[(-length/2,BASE+.45,-1.7),(length/2,BASE+.45,-1.7),(length/2,BASE+1.35,-1.7),(-length/2,BASE+1.45,-1.7),(-length/2,BASE+.45,1.7),(length/2,BASE+.45,1.7),(length/2,BASE+1.35,1.7),(-length/2,BASE+1.45,1.7)]
 mesh(name+' body shoulder',points,[(0,3,2,1),(4,5,6,7),(3,7,6,2),(0,1,5,4),(0,4,7,3),(1,2,6,5)],body,sec)
 cabin=[(-2.6,BASE+1.4,-1.60),(1.75,BASE+1.35,-1.60),(.8,BASE+roof,-1.35),(-1.8,BASE+roof,-1.35),(-2.6,BASE+1.4,1.60),(1.75,BASE+1.35,1.60),(.8,BASE+roof,1.35),(-1.8,BASE+roof,1.35)]
 mesh(name+' cabin',cabin,[(0,3,2,1),(4,5,6,7),(3,7,6,2),(0,1,5,4),(0,4,7,3),(1,2,6,5)],body,sec)
 for side in [-1,1]:
  verts=[(-2.42,BASE+1.48,side*1.62),(1.55,BASE+1.46,side*1.62),(.70,BASE+roof-.12,side*1.37),(-1.72,BASE+roof-.12,side*1.37)]
  mesh(name+' side glass',verts,[(0,1,2,3)if side==1 else(0,3,2,1)],'dark-glass',sec)
  box(name+' door pillar',-.5,BASE+(roof+1.43)/2,side*1.52,.14,roof-1.43,.2,body,sec)
  for xx in [-1.7,.8]:box(name+' door handle',xx,BASE+1.38,side*1.78,.32,.07,.035,'metal',sec)
  box(name+' mirror',1.27,BASE+1.63,side*1.90,.34,.19,.46,body,sec)
  for xx in [-2.62,2.65]:wheel(name+' wheel',xx,BASE+.67,side*1.74)
  box(name+' front headlight',length/2+.05,BASE+1.15,side*1.20,.07,.3,.65,'headlamp',sec)
  box(name+' tail light',-length/2-.04,BASE+1.15,side*1.20,.05,.30,.6,'taillamp',sec)
 mesh(name+' windscreen',[(1.8,BASE+1.46,-1.5),(1.8,BASE+1.46,1.5),(.79,BASE+roof-.08,1.27),(.79,BASE+roof-.08,-1.27)],[(0,1,2,3)],'glass',sec)
 mesh(name+' rear glazing',[(-2.63,BASE+1.48,-1.5),(-1.81,BASE+roof-.08,-1.27),(-1.81,BASE+roof-.08,1.27),(-2.63,BASE+1.48,1.5)],[(0,1,2,3)],'glass',sec)
 for xx in [-length/2-.08,length/2+.08]:box(name+' bumper',xx,BASE+.54,0,.22,.25,3.45,'metal',sec)
 result=list(set(bpy.data.objects)-before)
 for o in result:o['export_skip']=True;o.hide_render=True
 return result
templates=[vehicle('Compact hatchback',0),vehicle('Family sedan',1),vehicle('Neighbourhood small van',2)]
parkings=[]
for z in [-23.3,-34.7,40.3,51.7]:
 for i,x in enumerate([-109,-87,-65,-44,-21,7,32,55,77,108]):
  if (i+int(z))%5==0 or 75<x<100:continue
  parkings.append((x,z,math.pi if i%2 else 0))
for n,(x,z,angle)in enumerate(parkings):
 copies=[]
 for original in templates[n%3]:
  obj=bpy.data.objects.new('Parked car '+str(n)+' '+original.name,original.data.copy());collection('Parked vehicles').objects.link(obj)
  if original.get('runtime_box'):obj['runtime_box']=True
  if obj.data.materials[0].name=='car-ivory':obj.data.materials[0]=materials[['car-ivory','car-silver','car-ivory','car-silver','car-ivory','car-silver','car-blue','car-ivory','car-red'][n%9]]
  copies.append(obj)
 transform_native(copies,x,z,angle+(street_random.random()-.5)*.035)
# Shop fronts are complete doors, glazing, canopy, signboard and pavement stock.
# No storefront is attached to the user's building. Only adjacent mapped rows
# carrying observed commercial labels receive fronts; a map POI is not proof
# that the user's ground-floor dwelling has become a shop.
def shop(name,x,wall,side,field,w=16):
 before=set(bpy.data.objects);sec='Ground-floor shops';front=wall+side*.28;y=BASE+2.4
 box(name+' storefront backing',x,y,wall,w,4.8,.25,'cement',sec)
 box(name+' display glass',x-w*.17,BASE+2.1,front,w*.58,3.5,.04,'dark-glass',sec)
 box(name+' entrance glass',x+w*.34,BASE+1.98,front,w*.23,3.85,.05,'glass',sec)
 for xx in [-w/2,w*.15,w/2]:box(name+' metal shopframe',x+xx,BASE+2.15,front+side*.06,.11,4.2,.1,'cap',sec)
 box(name+' entrance handle',x+w*.24,BASE+1.82,front+side*.15,.045,.75,.045,'metal',sec)
 box(name+' doorway step',x+w*.34,BASE+.12,front+side*.43,w*.27,.22,1,'cement',sec)
 box(name+' solid signboard',x,BASE+4.74,front,w,1.55,.32,'cap',sec)
 zz=front+side*.18
 verts=[(x-w/2,BASE+3.98,zz),(x+w/2,BASE+3.98,zz),(x+w/2,BASE+5.49,zz),(x-w/2,BASE+5.49,zz)]
 mesh(name+' Pixelorama name',verts,[(0,1,2,3)if side==1 else(0,3,2,1)],field,sec,lambda p:(((p.x-x+w/2)if side==1 else(x+w/2-p.x))*128/w,(BASE+5.49-p.y)*16/1.51))
 box(name+' projecting canopy',x,BASE+3.75,front+side*1.1,w+.4,.14,2.6,'awning',sec,rx=-side*.13)
 for xx in [-w*.39,w*.39]:beam(name+' canopy brace',(x+xx,BASE+2.8,front),(x+xx,BASE+3.7,front+side*1.8),.06,'rust-iron',sec)
 if field=='sign-fresh':
  for xx in [-4.8,-2.5,-.2]:
   box(name+' produce crate',x+xx,BASE+.56,front+side*1.65,1.95,1.0,1.25,'tower-trim',sec)
   for j in range(3):crown(name+' vegetable pile',x+xx+(j-1)*.48,BASE+1.19,front+side*1.65,.7,.45,.7)
 elif field=='sign-noodles':
  box(name+' pavement menu board',x-w*.43,BASE+1.18,front+side*2,.78,2.0,.22,'rust-iron',sec,rx=side*.06)
 return list(set(bpy.data.objects)-before)
block_by_id={b['id']:b for b in mapped_blocks}
north_block=block_by_id['north-reference'];south_block=block_by_id['south-matching'];next_block=block_by_id['north-next']
shop('Noodle shop',north_block['x']-27,north_block['z']+11.1,1,'sign-noodles',18)
shop('Hair salon',north_block['x']+22,north_block['z']+11.1,1,'sign-barber')
shop('Car-care storefront',south_block['x']-20,south_block['z']-28.15,-1,'sign-repair',18)
shop('Electric bicycle shop',next_block['x']+14,next_block['z']+11.1,1,'sign-bikes',18)
# A few parked electric bicycles belong to the street, outside private terraces.
for i in range(6):
 x=next_block['x']+25+i*.85;z=next_block['z']+15+(i%2)*2.8;sec='Parked bicycles'
 for zz in [-.94,.94]:
  vertices=[]
  for xx in [-.08,.08]:
   for j in range(12):vertices.append((x+xx,BASE+.56+math.sin(j*math.tau/12)*.54,z+zz+math.cos(j*math.tau/12)*.54))
  faces=[tuple(reversed(range(12))),tuple(range(12,24))]+[(j,(j+1)%12,(j+1)%12+12,j+12)for j in range(12)]
  mesh('Bicycle round wheel',vertices,faces,'tire',sec)
 beam('Bicycle frame',(x,BASE+.65,z-.7),(x,BASE+1.05,z+.55),.12,'car-blue',sec)
 beam('Bicycle front fork',(x,BASE+.55,z+.95),(x,BASE+1.58,z+.68),.1,'metal',sec)
 box('Bicycle seat',x,BASE+1.35,z-.3,.58,.13,.48,'tire',sec)
 box('Bicycle handlebar',x,BASE+1.72,z+.62,.72,.08,.10,'metal',sec)
 box('Bicycle parking stand',x,BASE+.18,z,.16,.36,.16,'rust-iron',sec)
for name in ['Main building','User terraces','Neighbour terraces','Opposite older residences','South matching terrace residences','Vehicle templates','Street greenery','Ground-floor shops']:
 c=collection(name)
 if hasattr(c,'asset_mark'):c.asset_mark()
 c['reusable_source']=True
 c['units_note']='Game units. Building full sixth-floor height = 5.6. Not a surveyed metre model.'
shop_count=4
# Vehicle templates are appendable assets at a neutral ground origin, arranged
# in separate asset collections rather than three overlapping cars in the city.
parent=collection('Vehicle templates')
for i,objects in enumerate(templates):
 c=bpy.data.collections.new(['Compact hatchback asset','Family sedan asset','Small van asset'][i]);parent.children.link(c)
 for o in objects:
  parent.objects.unlink(o);c.objects.link(o)
  for v in o.data.vertices:v.co.z-=BASE
  o.hide_viewport=True
 c.asset_mark();c['reusable_source']=True
print('STREET LIFE',len(parkings),'parked native vehicles,',shop_count,'adjacent shops; home shops = 0',flush=True)
