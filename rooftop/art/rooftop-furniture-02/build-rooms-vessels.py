"""All-new complete room furniture and eight museum-informed ceramic vessels.

This authoring file never reads or copies old runtime geometry or paint commands.
The museum research JSON is provenance and dimensional reference only.
"""
import sys, math, json, types
import bpy
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from assetlib import Builder, PALETTE, MODE, verify_saved

FAMILY='rooms-vessels'
ROOT=Path(__file__).resolve().parent

PALETTE.update({
 'chrome-room':'#b4bcb7', 'chrome-room-dark':'#697570',
 'sofa-leather':'#59514b', 'sofa-cloth':'#778579',
 'mattress-ivory':'#d4d3c6', 'pillow-ivory':'#dfded1', 'blanket-sage':'#879084',
 'wardrobe-oak':'#968062', 'wardrobe-back':'#867254',
 'shino-outer':'#d8cbb4','shino-inner':'#e0d2b8','shino-rim':'#d9cdb7','shino-foot':'#b8a78d',
 'nezumi-outer':'#61483c','nezumi-inner':'#4f3d32','nezumi-rim':'#6a4e3d','nezumi-foot':'#97795f',
 'shino-square-outer':'#dfd4c1','shino-square-inner':'#d9cfbb','shino-square-rim':'#e2d8c7','shino-square-foot':'#b9ad92',
 'nabeshima-outer':'#dee0d5','nabeshima-inner':'#e5e5db','nabeshima-rim':'#d8ddd4','nabeshima-foot':'#c9cec3',
 'nabeshima-dish-outer':'#e0e4dc','nabeshima-dish-inner':'#a8bdc3','nabeshima-dish-rim':'#dce4df','nabeshima-dish-foot':'#c3cac0',
 'kutani-outer':'#e0d7c2','kutani-inner':'#e3d7bd','kutani-rim':'#aa8261','kutani-foot':'#c3b391',
 'celadon-outer':'#b8cec3','celadon-inner':'#bad0c5','celadon-rim':'#cbdad0','celadon-foot':'#99b5a7',
 'oribe-outer':'#d0c4ac','oribe-inner':'#c5b89f','oribe-rim':'#c7b89d','oribe-foot':'#aa987d',
})

def quad_band(asset,name,ring_a,ring_b,material,role):
 n=len(ring_a);verts=ring_a+ring_b;faces=[]
 for j in range(n):
  k=(j+1)%n
  if math.dist(ring_a[j],ring_a[k])<1e-9:
   faces.append((j,n+k,n+j))
  elif math.dist(ring_b[j],ring_b[k])<1e-9:
   faces.append((j,k,n+j))
  else:faces.append((j,k,n+k,n+j))
 return asset.mesh(name,verts,faces,material,role)

def shell(asset,profile,materials,roles,sides=20,radial=None,drain_hole=0):
 """One closed, measurable volume split only for independent native painting."""
 if drain_hole:
  # Replace the two solid axis disks with annular faces and a real cylindrical
  # channel through floor thickness. This is a horticultural adaptation.
  profile=[(drain_hole if r==0 else r,z) for r,z in profile]
  roles=list(roles);materials=list(materials);roles[-1]='drainage-wall'
  materials[-1]=materials[-1].rsplit('-',1)[0]+'-foot'
 rings=[]
 for k,(radius,z) in enumerate(profile):
  ring=[]
  for j in range(sides):
   theta=j*math.tau/sides
   scale=radial(theta,k) if radial else 1
   ring.append((radius*scale*math.cos(theta),radius*scale*math.sin(theta),z))
  rings.append(ring)
 for k in range(len(rings)-1):
  if profile[k][0]==profile[k+1][0]==0:continue
  quad_band(asset,f'ceramic-{roles[k]}-{k}',rings[k],rings[k+1],materials[k],roles[k])

def circle_foot(asset,radius,height,material,sides=20):
 profile=[(radius*.85,0),(radius,0),(radius,height),(radius*.78,height),(radius*.78,0),(radius*.85,0)]
 shell(asset,profile,[material]*5,['foot-bottom','foot-outer','foot-upper','foot-inner','foot-bottom'],sides)

def three_feet(asset,radius,height,material,kimen=False):
 for j in range(3):
  theta=-math.pi/2+j*math.tau/3;x=radius*math.cos(theta);y=radius*math.sin(theta)
  if kimen:
   # A thick shield-shaped ceramic mask gives a physical three-point support.
   # Only the broad brow/nose form is geometric; fine face carving is pigment.
   front=[(-.054,height*.90),(-.049,height*.48),(-.025,.008),(0,0),(.025,.008),(.049,height*.48),(.054,height*.90)]
   verts=[(x+px*math.cos(theta)-q*math.sin(theta),y+px*math.sin(theta)+q*math.cos(theta),z) for q in (-.027,.027) for px,z in front]
   n=len(front);faces=[tuple(reversed(range(n))),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
   asset.mesh(f'kimen-foot-{j}',verts,faces,material,'foot:kimen')
   # A small raised nose and eyebrow occupy the outward face and do not float.
   asset.box(f'kimen-nose-{j}',(.025,.027,.033),(x-.021*math.sin(theta),y+.021*math.cos(theta),height*.57),material,'foot:kimen-relief',bevel=.008,rotation=(0,0,theta))
  else:
   asset.cyl(f'foot-{j}',height*.39,height,(x,y,height/2),material,'foot',vertices=12,radius_top=height*.51)

def simple_bowl(asset,prefix,diameter,height,base_radius,foot_height=0,shape=None,sides=20,three=False,drain_hole=0):
 r=diameter/2;bottom=max(foot_height,.014);thick=max(.015,min(.027,r*.072))
 outer_bottom=base_radius
 profile=[(0,bottom),(outer_bottom,bottom),(r*.82,height*.42),(r*.975,height*.88),(r,height),
  (r-thick,height),(r*.90,height*.83),(r*.70,bottom+thick*1.8),(outer_bottom*.65,bottom+thick),(0,bottom+thick),(0,bottom)]
 roles=['outer-bottom','outer-lower','outer-mid','outer-upper','rim','inner-upper','inner-wall','inner-lower','inner-floor','axis']
 mats=[prefix+'-outer']*4+[prefix+'-rim']+[prefix+'-inner']*4+[prefix+'-inner']
 if shape=='square':
  radial=lambda theta,k:1/(abs(math.cos(theta))**6+abs(math.sin(theta))**6)**(1/6) if 1<=k<=7 else 1
 elif shape=='nezumi':
  radial=lambda theta,k:1/(abs(math.cos(theta))**5+abs(math.sin(theta))**5)**(1/5) if 1<=k<=6 else 1
 elif shape=='scallop':
  radial=lambda theta,k:(1+.036*math.cos(10*theta))/1.036 if 3<=k<=6 else 1
 else:radial=None
 shell(asset,profile,mats,roles,sides,radial,drain_hole=drain_hole)
 if foot_height and not three:circle_foot(asset,base_radius*.96,foot_height,prefix+'-foot',sides)
 if three:three_feet(asset,base_radius*.76,bottom,prefix+'-foot',shape=='scallop')
 floor=bottom+thick
 asset.surface('inside','器物内底',floor,base_radius*1.18,base_radius*1.18,shape='circle',container=True,headroom=height-floor,rimHeight=height)
 asset.meta.update(interiorFloorHeight=floor,wallThickness=thick,rimHeight=height,opening=dict(width=2*(r-thick),depth=2*(r-thick),shape='round-square' if shape in ('square','nezumi') else 'circle'),hasRealInterior=True,empty=True)

def build_vessels(b):
 research=json.loads((ROOT/'vessels-research.json').read_text())
 lookup={v['id']:v for v in research['items']}
 originals={v['id']:v for v in json.loads((ROOT/'retained-pot-records.json').read_text())}
 defs=[('antique-shino','shino',.625,.064/.28,'shallow',20),
  ('antique-nezumi','nezumi',.50,.058/.14,'nezumi',20),
  ('antique-shino-square','shino-square',.4375,.092/.085,'square',20),
  ('antique-nabeshima','nabeshima',.5625,.102/.213,'octagon',8),
  ('antique-nabeshima-dish','nabeshima-dish',.5625,.051/.206,'shallow',24),
  ('antique-kutani-red','kutani',.875,.27,'bowl',24),
  ('antique-celadon','celadon',.6875,.0826/.2889,'scallop',40),
  ('antique-oribe-jar','oribe',.50,.208/.216,'jar',24)]
 guides=[]
 for id,prefix,diam,ratio,shape,sides in defs:
  ref=lookup[id];original=originals[id];height=diam*ratio
  museum_width=ref['museumDimensionsCm'].get('diameter',ref['museumDimensionsCm'].get('bodyDiameter',ref['museumDimensionsCm'].get('mouthWidth')))
  a=b.asset(id,original['name'],'收藏','both',museumDimensionsCm=ref['museumDimensionsCm'],gameScaleFactor=diam*100/museum_width,
   sources=original['sources'],referenceUnknown=ref['unverified'],geometryRebuilt=True,originalId=id,originalVesselRecord=original,
   note=original.get('note',''),adaptationNote='馆藏器形和已见内外纹饰的原创低多边形园艺转译。'+(' 馆方未公布高度，游戏腹深为适配推定。' if id=='antique-kutani-red' else ''),period=ref['period'])
  if shape=='jar':
   r=diam/2;h=height;mouth_r=r*(.097/.216);base_r=r*(.135/.216);wall=.018
   shoulder=[(r,h*.35),(r*.92,h*.55),(r*.68,h*.70)]
   def shoulder_radius(z):
    for (ra,za),(rb,zb) in zip(shoulder,shoulder[1:]):
     if za<=z<=zb:return ra+(rb-ra)*(z-za)/(zb-za)
    return shoulder[-1][0]
   groove_centres=[h*t for t in (.46,.48,.54,.60,.62)]
   for z in groove_centres:
    for dz,dr in [(-.003,0),(0,-.004),(.003,0)]:
     shoulder.append((shoulder_radius(z+dz)+dr,z+dz))
   shoulder.sort(key=lambda p:p[1])
   outer=[(0,0),(base_r,0),(r*.92,h*.15)]+shoulder+[(mouth_r*.60,h*.75),(mouth_r*.64,h*.86),(mouth_r,h)]
   inner=[(mouth_r-wall,h),(mouth_r*.64-wall,h*.85),(mouth_r*.60-wall,h*.75),
    (r*.67,h*.67),(r-wall,h*.35),(base_r*.85,.045),(0,.045),(0,0)]
   profile=outer+inner
   roles=(['outer-bottom','outer-lower']+['outer-shoulder']*(len(outer)-5)+['outer-neck','outer-lip','rim']+
    ['inner-neck','inner-neck','inner-shoulder','inner-wall','inner-lower','inner-floor','axis'])
   mats=[prefix+'-outer']*(len(outer)-1)+[prefix+'-rim']+[prefix+'-inner']*(len(inner)-1)
   shell(a,profile,mats,roles,sides)
   # Five actual shallow depressions in the shell, grouped 2–1–2.
   a.surface('inside','花器内底',.045,base_r*1.25,base_r*1.25,shape='circle',container=True,rimHeight=h,headroom=h-.045,openingWidth=2*(mouth_r-wall))
   a.meta.update(interiorFloorHeight=.045,wallThickness=wall,rimHeight=h,hasRealInterior=True,empty=True,opening=dict(width=2*(mouth_r-wall),depth=2*(mouth_r-wall),shape='circle'),shoulderGrooveGroup=[2,1,2],shoulderGrooveDepth=.004,shoulderGrooveCentres=groove_centres)
  elif shape=='square':
   r=diam/2;wall=.022;bottom=.024
   profile=[(0,.006),(r*.90,.006),(r*.98,bottom),(r,height*.94),(r,height),(r-wall,height),
    (r-wall,bottom+.015),(r*.52,bottom+.015),(0,bottom+.015),(0,.006)]
   roles=['outer-bottom','outer-lower','outer-wall','outer-lip','rim','inner-wall','inner-lower','inner-floor','axis']
   mats=[prefix+'-outer']*4+[prefix+'-rim']+[prefix+'-inner']*4
   radial=lambda theta,k:1/(abs(math.cos(theta))**6+abs(math.sin(theta))**6)**(1/6) if 1<=k<=6 else 1
   shell(a,profile,mats,roles,20,radial,drain_hole=.03125)
   circle_foot(a,r*.68,.006,prefix+'-foot',20)
   a.surface('inside','器物内底',bottom+.015,diam*.66,diam*.66,shape='circle',container=True,rimHeight=height,headroom=height-bottom-.015)
   a.meta.update(interiorFloorHeight=bottom+.015,wallThickness=wall,rimHeight=height,hasRealInterior=True,empty=True,opening=dict(width=diam-2*wall,depth=diam-2*wall,shape='round-square'))
  else:
   base=diam*(.27 if shape=='octagon' else .31 if shape=='nezumi' else .29 if shape=='bowl' else .34)
   foot=height*(.18 if shape=='octagon' else .22 if shape=='nezumi' else .29 if shape=='scallop' else .23)
   simple_bowl(a,prefix,diam,height,base,foot_height=foot,shape=shape,sides=sides,three=shape in ('nezumi','scallop'),drain_hole=.03125)
  if shape!='jar':
   holes=[dict(shape='circle',center=[0,0],radius=.03125)]
   a.meta.update(holes=holes,hasRealDrainage=True,drainageAdaptation=True,drainageDiameter=.0625)
   for surface in a.surfaces:surface['holes']=holes
  guides.append(dict(id=id,materialPrefix=prefix,shape=shape,diameter=diam,height=height,inside=ref['observedInterior'],outside=ref['observedExterior'],referenceUnknown=ref['unverified'],innerMaterial=prefix+'-inner',outerMaterial=prefix+'-outer',rimMaterial=prefix+'-rim',footMaterial=prefix+'-foot',nativeTextureDensity=16,
   paintingRule='Draw original coarse motifs with native Pixelorama Pencil using face physical paintOrigin/uAxis/vAxis; only known compositions. Preserve material-specific low-contrast glaze, omit invisible fine cracks/noise. Interior floor uses asset XY to align across its face charts; exterior uses angle atan2(Y,X) and Z height.'))
 return guides

def rounded_rectangle_path(width,depth,z,radius=.05):
 r=radius;pts=[]
 for cx,cy,start in [(width/2-r,depth/2-r,0),(-width/2+r,depth/2-r,math.pi/2),(-width/2+r,-depth/2+r,math.pi),(width/2-r,-depth/2+r,math.pi*1.5)]:
  for j in range(4):
   theta=start+j*math.pi/6;pts.append((cx+r*math.cos(theta),cy+r*math.sin(theta),z))
 return pts

def build_sofa(b,id,name,width,count,finish):
 depth=.78;height=.79;arm_x=width/2-.040
 a=b.asset(id,name,'桌椅与居室','floor',construction='原创现代镀铬管钢沙发，独立软垫；完整背管、软垫背面、底面及受力支撑。',sources=[dict(label='Thonet S 5000 · 管钢与独立垫结构参考',url='https://www.thonet.de/fileadmin/media/09-service/Brochures/Thonet_Produktbroschuere_S_5000.pdf'),dict(label='Thonet S 411 · 管钢与软垫结构参考',url='https://www.thonet.de/en/all-products/detail/s-411')],replica=False)
 # Two closed side frames, with connected base, uprights and arm-height rails.
 for side in (-1,1):
  x=side*arm_x
  path=[(x,-.31,.035),(x,.31,.035),(x,.355,.085),(x,.355,.56),(x,.31,.605),(x,-.28,.605),(x,-.325,.56),(x,-.325,.085)]
  a.tube('side-frame-'+str(side),path,.021,'chrome-room','frame',sides=20,closed=True)
  for y in (-.26,.26):a.box('floor-glide-'+str(side)+str(y),(.065,.10,.015),(x,y,.0075),'rubber','foot',bevel=.006)
  a.box('arm-pad-'+str(side),(.11,.62,.060),(x,.005,.635),finish,'arm:contact',bevel=.021)
 # Seat support rectangle and back support connect both sides visibly.
 a.tube('seat-support',rounded_rectangle_path(width-.10,.61,.30,.06),.020,'chrome-room-dark','seat-support',sides=20,closed=True)
 a.tube('back-support-upper',[(-arm_x,.33,.715),(arm_x,.33,.715)],.021,'chrome-room','rear-support',sides=20)
 a.tube('back-support-lower',[(-arm_x,.30,.45),(arm_x,.30,.45)],.021,'chrome-room','rear-support',sides=20)
 for x in (-arm_x*.5,arm_x*.5):a.beam('back-connector-'+str(x),(x,.30,.31),(x,.33,.70),.027,mat='chrome-room-dark',role='rear-support')
 a.box('seat-deck',(width-.11,.62,.042),(0,-.01,.325),'chrome-room-dark','underside')
 inner_width=width-.20;piece=inner_width/count
 for i in range(count):
  x=-inner_width/2+piece*(i+.5)
  a.box('seat-cushion-'+str(i),(piece-.015,.60,.145),(x,-.033,.423),finish,'seat:contact',bevel=.031)
  a.box('back-cushion-'+str(i),(piece-.018,.152,.372),(x,.248,.59),finish,'back:contact',bevel=.032,rotation=(-.09,0,0))
 # Stay within the flat cushion crown, clear of the sloping back cushion.
 a.surface('seat','座垫上面',.495,inner_width-.085,.40,center=(0,-.08),headroom=10)
 a.meta.update(seatCount=count,seatHeight=.495,frameTubeDiameter=.042,completeBack=True,completeUnderside=True)
 return a

def build_rooms(b):
 a=b.asset('bed-modern','木框床','桌椅与居室','floor',construction='完整木床框、板排、床垫、枕头和折毯；床底支脚与受力中梁。')
 w=1.0625;d=1.9375
 for x in (-w/2+.052,w/2-.052):
  for y in (-d/2+.07,d/2-.07):a.box(f'leg-{x}-{y}',(.085,.085,.26),(x,y,.13),'wood-dark','foot',bevel=.013)
 for x in (-w/2+.036,w/2-.036):a.box('side-rail-'+str(x),(.07,d,.17),(x,0,.292),'wood','rail',bevel=.012)
 for y in (-d/2+.025,d/2-.025):a.box('end-rail-'+str(y),(w-.07,.06,.17),(0,y,.292),'wood','rail',bevel=.011)
 a.box('center-support',(.055,d-.10,.055),(0,0,.272),'wood-dark','underside')
 for i in range(12):a.box('slat-'+str(i),(w-.13,.105,.036),(0,-.86+i*.156,.332),'wood-light','slat',bevel=.003)
 a.box('headboard',(w,.075,.49),(0,d/2-.025,.516),'wood','headboard',bevel=.018)
 for x in (-w/2+.046,w/2-.046):a.box('headboard-post-'+str(x),(.085,.087,.76),(x,d/2-.028,.38),'wood-dark','post',bevel=.012)
 a.box('mattress',(w-.145,d-.19,.165),(0,-.025,.433),'mattress-ivory','mattress',bevel=.039)
 a.box('pillow',(.61,.32,.095),(0,.655,.56),'pillow-ivory','pillow:contact',bevel=.035)
 a.box('folded-blanket',(.91,.57,.044),(0,-.43,.536),'blanket-sage','blanket:fold',bevel=.016)
 # The folded blanket occupies the foot of the mattress; its own top is
 # higher. Expose two real, non-overlapping bearing surfaces.
 a.surface('mattress','露出床垫',.5155,.83,.60,center=(0,.17),headroom=10)
 a.surface('blanket','折毯上面',.558,.87,.53,center=(0,-.43),headroom=10)
 a.meta.update(completeSlattedBase=True,completeUnderside=True)

 build_sofa(b,'sofa-two','管钢双人沙发',1.4375,2,'sofa-leather')
 build_sofa(b,'sofa-one','管钢单人沙发',.8125,1,'sofa-cloth')

 # Closed cupboards still have actual sides, a full back, floor and interior.
 a=b.asset('wardrobe-wood','双门木衣柜','桌椅与居室','floor',construction='完整木柜体与后板、底板、双门与把手；柜顶为真实承托面。')
 w=.875;d=.50;h=1.6875
 a.box('plinth',(w-.07,d-.05,.10),(0,0,.05),'wood-dark','base',bevel=.012)
 for x in (-w/2+.026,w/2-.026):a.box('side-'+str(x),(.052,d,h-.10),(x,0,(h+.10)/2),'wardrobe-oak','side',bevel=.009)
 a.box('floor',(w-.075,d,.042),(0,0,.12),'wardrobe-oak','inner-floor',bevel=.005)
 a.box('top',(w+.016,d+.014,.048),(0,0,h-.024),'wardrobe-oak','top',bevel=.011)
 a.box('back',(w-.062,.027,h-.17),(0,d/2-.014,.875),'wardrobe-back','rear',bevel=.003)
 a.box('inner-shelf',(w-.11,d-.07,.028),(0,.006,1.352),'wardrobe-back','interior-shelf')
 a.cyl('hanging-rail',.012,w-.145,(0,.018,1.26),'chrome-room-dark','interior-rail',vertices=12,rotation=(0,math.pi/2,0))
 for sign in (-1,1):
  x=sign*(w/4-.020)
  a.box('door-'+str(sign),(w/2-.032,.034,h-.177),(x,-d/2-.007,.863),'wardrobe-oak','door',bevel=.009)
  # Inset panel is genuine shallow joinery, not a painted floating rectangle.
  a.box('door-panel-'+str(sign),(w/2-.107,.018,h-.292),(x,-d/2-.030,.863),'wood-light','door-panel',bevel=.006)
  hx=sign*.066
  a.tube('handle-'+str(sign),[(hx,-d/2-.039,.79),(hx,-d/2-.072,.815),(hx,-d/2-.072,.94),(hx,-d/2-.039,.965)],.011,'steel-dark','handle',sides=12)
  for z in (.32,1.34):a.box('hinge-'+str(sign)+str(z),(.018,.042,.061),(sign*(w/2-.063),-d/2-.016,z),'steel-dark','hardware')
 a.surface('top','柜顶',h,w-.055,d-.045,headroom=10)
 a.meta.update(completeBack=True,completeBottom=True,realDoors=True)

 a=b.asset('dresser-wood','三屉木斗柜','桌椅与居室','floor',construction='完整侧板、后板、底板、独立抽屉与把手；柜顶为真实承托面。')
 w=.6875;d=.4375;h=.78125
 a.box('plinth',(w-.05,d-.04,.09),(0,0,.045),'wood-dark','base',bevel=.010)
 for x in (-w/2+.023,w/2-.023):a.box('side-'+str(x),(.046,d,h-.09),(x,0,(h+.09)/2),'wardrobe-oak','side',bevel=.007)
 a.box('back',(w-.054,.024,h-.12),(0,d/2-.012,(h+.12)/2),'wardrobe-back','rear',bevel=.003)
 a.box('bottom',(w-.063,d-.012,.035),(0,0,.111),'wardrobe-back','bottom',bevel=.003)
 a.box('top',(w+.024,d+.020,.046),(0,0,h-.023),'wood-light','top',bevel=.009)
 for i in range(3):
  z=.225+i*.204
  a.box('drawer-front-'+str(i),(w-.097,.032,.186),(0,-d/2-.006,z),'wardrobe-oak','drawer-front',bevel=.008)
  # A small separate drawer box lies fully inside its housing.
  a.box('drawer-floor-'+str(i),(w-.144,d-.087,.020),(0,.005,z-.075),'wardrobe-back','drawer-bottom')
  for x in (-w/2+.082,w/2-.082):a.box('drawer-side-'+str(i)+str(x),(.018,d-.095,.14),(x,.007,z),'wardrobe-back','drawer-interior')
  a.box('drawer-back-'+str(i),(w-.14,.018,.14),(0,d/2-.055,z),'wardrobe-back','drawer-interior')
  a.tube('drawer-handle-'+str(i),[(-.067,-d/2-.026,z),(-.050,-d/2-.062,z),(.050,-d/2-.062,z),(.067,-d/2-.026,z)],.010,'steel-dark','handle',sides=12)
 a.surface('top','柜顶',h,w-.048,d-.036,headroom=10)
 a.meta.update(drawerCount=3,completeBack=True,completeBottom=True)

def preserve_unchanged_uv_pack(b):
 previous_path=ROOT/FAMILY/'texture-layout.json'
 previous=json.loads(previous_path.read_text());old={f['id']:f for f in previous['fields']}
 kept=[];changed=[]
 for f in b.fields:
  p=old.get(f['id']);same=p is not None
  if same:
   for key in ('material','role','w','h'):same=same and f[key]==p[key]
   for key in ('uMetres','vMetres'):same=same and abs(f[key]-p[key])<.0000001
   for key in ('paintOrigin','uAxis','vAxis'):same=same and max(abs(a-c) for a,c in zip(f[key],p[key]))<.0000001
  if same:f['x']=p['x'];f['y']=p['y'];kept.append(f)
  else:changed.append(f)
 shelves=[];offset=previous['usedRows']
 for f in sorted(changed,key=lambda f:(-(f['h']+2),-(f['w']+2),f['id'])):
  pw,ph=f['w']+2,f['h']+2;row=next((r for r in shelves if r['h']>=ph and r['x']+pw<=2048),None)
  if row is None:row=dict(x=0,y=offset+sum(r['h'] for r in shelves),h=ph);shelves.append(row)
  assert row['y']+ph<=2048,'Atlas overflow'
  f['x']=row['x']+1;f['y']=row['y']+1;row['x']+=pw
 for f in b.fields:
  mesh=bpy.data.objects[f['object']].data
  for li,(u,v) in zip(f['loopIndices'],f['uvMetres']):mesh.uv_layers.active.data[li].uv=((f['x']+u*16)/2048,1-(f['y']+v*16)/2048)
 b.usedRows=offset+sum(r['h'] for r in shelves)
 furniture={'bed-modern','sofa-two','sofa-one','wardrobe-wood','dresser-wood'}
 assert not any(f['asset'] in furniture for f in changed),'Unrequested furniture chart change'
 (ROOT/FAMILY/'uv-preservation.json').write_text(json.dumps(dict(preservedCharts=len(kept),newOrChangedDrainageCharts=len(changed),oldRowsReserved=offset,newUsedRows=b.usedRows,allFiveFurnitureUVChartsPreserved=True,changedAssets=sorted({f['asset'] for f in changed})),ensure_ascii=False,indent=2))

def main():
 if MODE=='verify':
  verify_saved(FAMILY);return
 b=Builder(FAMILY)
 guides=build_vessels(b)
 build_rooms(b)
 (ROOT/FAMILY/'pattern-guide.json').write_text(json.dumps(dict(
  texelsPerMetre=16,source='Primary museum references inspected, original Pixelorama Pencil translation required',
  vesselItems=guides,roomFinishes={
   'chrome-room':'Low-saturation silver. Sparse lost gloss around side bends and floor glides. Never orange full-frame rust.',
   'sofa-leather':'Deep brown contiguous large surfaces, very subtle seat-front touch wear and cushion folds. No checkerboard noise or stitched grids.',
   'sofa-cloth':'Muted grey green; fold shade near contact seams, mostly intact planes.',
   'wardrobe-oak':'Warm restrained grain follows actual board axis, 1–2 low-contrast short strokes; drawer/door front handling may fade at edges.',
   'blanket-sage':'Fold shading concentrated at fold/front edge, pillow kept plain.'}),ensure_ascii=False,indent=2)+'\n')
 b.pack=types.MethodType(preserve_unchanged_uv_pack,b)
 b.finish()

if __name__=='__main__':main()
