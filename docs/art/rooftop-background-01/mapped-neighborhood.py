"""Build only footprints traced in map-layout.json, with editable native meshes."""
map_layout=json.loads((HERE/'map-layout.json').read_text())
mapped_blocks=[];map_towers=[]
trace=map_layout['nearTrace'];angle=trace['rowAngle'];co=math.cos(angle);si=math.sin(angle)
def near_point(px,py):
 dx=px-trace['anchorPixel'][0];dz=py-trace['anchorPixel'][1];k=trace['unitsPerPixel']
 return (round(trace['anchorWorld'][0]+k*(dx*co+dz*si),1),round(trace['anchorWorld'][1]+k*(-dx*si+dz*co),1))
def aerial_point(t,px,py):
 # North-up Web Mercator screenshots; map area excludes the 72px left rail.
 lat,lon=t['camera'];metres=156543.03392*math.cos(math.radians(lat))/(2**t['zoom'])
 home=map_layout['districtTrace']['homeMapAnchor'];centre=t['viewportCentre']
 east=(lon-home[1])*111320*math.cos(math.radians(home[0]))+(px-centre[0])*metres
 south=(home[0]-lat)*111320+(py-centre[1])*metres
 k=map_layout['districtTrace']['unitsPerMetre']
 return (round((east*co+south*si)*k,1),round((-east*si+south*co)*k,1))
def add_block(name,cx,cz,width,depth,kind,source_pixel):
 mapped_blocks.append({'id':name,'x':cx,'z':cz,'width':width,'depth':depth,'angle':0,'storeys':6,'kind':kind,'sourcePixel':source_pixel})
def library_from_objects(name,objects):
 c=bpy.data.collections.new(name);c.asset_mark();c['aerial_footprint_trace']=True
 for obj in objects:
  for parent in list(obj.users_collection):parent.objects.unlink(obj)
  c.objects.link(obj)
 return c
def assembly(name,template,x,z,section,scale=1):
 obj=bpy.data.objects.new(name,None);obj.instance_type='COLLECTION';obj.instance_collection=template
 obj.location=(x,-z,0);obj.scale=(scale,1,1);collection(section).objects.link(obj)
 return obj
near_template=library_from_objects('North reference apartment asset',distant_building('North reference asset',0,0,132,22,6,detail=True))
quiet_template=library_from_objects('Neighbour apartment asset',distant_building('Neighbour apartment asset',0,0,132,22,6,detail=False))
home_source=[o for c in ['Main building','User terraces','Neighbour terraces']for o in collection(c).objects if o.type=='MESH']
south_template=bpy.data.collections.new('Paired terrace apartment asset');south_template.asset_mark();south_template['aerial_footprint_trace']=True
for original in home_source:
 obj=bpy.data.objects.new('Paired apartment asset '+original.name,original.data)
 if original.get('runtime_box'):obj['runtime_box']=True
 south_template.objects.link(obj)
for name,px,py,width,kind in trace['roofCentres']:
 cx,cz=near_point(px,py)
 if kind=='matching':
  dx=cx+8;dz=cz-16;assembly(name,south_template,dx,dz,'South matching terrace residences')
  box(name+' private entry door',6+dx,1.38,8.4+dz,.1,2.75,2.14,'dark-glass','South matching terrace residences')
  add_block(name,cx,cz,148,48,kind,[px,py])
 else:
  assembly(name,near_template if abs(cz-16)<150 and abs(cx)<240 else quiet_template,cx,cz,'Opposite older residences',width/132)
  add_block(name,cx,cz,width,27,kind,[px,py])
 print('MAPPED ROW',name,cx,cz,flush=True)
def quiet_old_block(name,x,z,w,roof='roof'):
 sec='Mapped outer old residences';h=33.6;top=BASE+h;d=22
 box(name+' old residential body',x,BASE+h/2,z,w,h,d,'facade',sec)
 mesh(name+' finite pitched roof',[(x-w/2-.5,top,z-11.4),(x+w/2+.5,top,z-11.4),(x-w/2-.5,top,z+11.4),(x+w/2+.5,top,z+11.4),(x-w/2+11,top+4.6,z),(x+w/2-11,top+4.6,z)],[(0,4,5,1),(4,2,3,5),(0,2,4),(1,5,3)],roof,sec)
 n=max(4,int(w/15))
 for side in [-1,1]:
  for f in range(6):
   y=BASE+2.8+f*5.6
   box(name+' storey belt',x,y-2.65,z+side*11.13,w,.12,.18,'cap',sec)
   for b in range(n):
    xx=x-w/2+(b+.5)*w/n
    box(name+' enclosed balcony apron',xx,y-1.8,z+side*11.6,6.9,1.15,1.25,'plaster',sec)
    window(name+' residential window',xx,y+.14,z+side*12.25,6.7,2.6,side,sec,glass='blue-glass' if (b+f)%6==0 else 'glass',divisions=3)
    box(name+' white tiled awning',xx,y+1.8,z+side*11.9,7.2,.17,2.7,'awning',sec,rx=-side*.19)
 for end in [-1,1]:
  for f in range(6):
   box(name+' end window',x+end*(w/2+.03),BASE+2.8+f*5.6,z,.025,2.8,2.6,'glass',sec)
outer=map_layout['districtTrace']
before=set(bpy.data.objects);quiet_old_block('Outer apartment asset',0,0,148)
outer_template=library_from_objects('Outer old apartment asset',list(set(bpy.data.objects)-before))
before=set(bpy.data.objects);quiet_old_block('Red tile apartment asset',0,0,148,'red-roof')
red_template=library_from_objects('Red tile old apartment asset',list(set(bpy.data.objects)-before))
for i,(px,py,metre_width)in enumerate(outer['oldRoofCentres']):
 x,z=aerial_point(outer,px,py);w=round(metre_width*outer['unitsPerMetre'],1)
 # Overlapping observations at different map zooms are the same building,
 # not a second block. Keep the more detailed close trace in those cases.
 if any(abs(x-b['x'])<(w+b['width'])/2+8 and abs(z-b['z'])<(27+b['depth'])/2+8 for b in mapped_blocks):continue
 if abs(x+8)<(w+148)/2+8 and abs(z-16)<40:continue
 name='district-roof-'+str(i);assembly(name,red_template if i in outer['redRoofIndices'] else outer_template,x,z,'Mapped outer old residences',w/148);add_block(name,x,z,w,27,'district-reference',[px,py])
 print('MAPPED DISTRICT',name,x,z,flush=True)
towers=map_layout['northTowerTrace']
for name,px,py,w,d,storeys in towers['roofCentres']:
 x,z=aerial_point(towers,px,py);k=outer['unitsPerMetre'];h=storeys*5.6
 residential_tower(name,x,z,w*k,d*k,h,'tower' if storeys>=26 else 'cool-tower',far=True)
 map_towers.append({'id':name,'x':x,'z':z,'width':w*k,'depth':d*k,'height':h,'storeys':storeys,'angle':0,'sourcePixel':[px,py]})
 print('MAPPED TOWER',name,x,z,flush=True)
for name in ['Opposite older residences','South matching terrace residences','Mapped outer old residences','Distant skyline']:
 c=collection(name);c['source']='map-layout.json';c['aerial_footprint_trace']=True
