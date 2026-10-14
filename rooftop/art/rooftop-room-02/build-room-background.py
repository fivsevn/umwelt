"""Complete fixed room section, native Blender and physical 16 px/metre UVs.

Every coordinate begins with the exact legacy runtime room coordinate. Author
source coordinates are metres, Blender Z-up; exported GLB is Y-up. The runtime
scales the complete result by ITEM_METRES_TO_UNITS once. No furniture or actors.
"""
import sys,json,math,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parent
COMMON=ROOT.parent/'rooftop-furniture-02'
sys.path.insert(0,str(COMMON))
import assetlib
assetlib.ROOT=ROOT
from assetlib import Builder,PALETTE,MODE,verify_saved
import bpy,bmesh
U=5.6/3
FAMILY='room-background'
WALL_H=2.7*U
DOOR_H=2.1*U
DOOR_W=.8*U
DOOR_D=.04*U
WIN_BOTTOM=.85*U
WIN_TOP=(.85+1.45)*U
WIN_MIDDLE=(WIN_BOTTOM+WIN_TOP)/2
DOOR_OPEN=[4-DOOR_W/2-.03,4+DOOR_W/2+.03]
PALETTE.update({
 'room-plaster-sage':'#a9b1a9',
 'room-floor-timber':'#9b998d','room-floor-structure':'#858d83',
 'room-joinery':'#b8bbae','room-skirting':'#a4aaa0',
 'room-door-steel':'#84938d','room-door-paint':'#a4ada3',
 'room-door-edge':'#76857e','room-hardware':'#a6afaa',
 'room-blind':'#b7bbaa','room-map-paper':'#d7d0b4','room-map-sea':'#a3b5b1','room-curtain':'#b7bbaa','room-lamp-shade':'#9ca898',
 'room-lamp-bracket':'#727d73','room-lamp-glow':'#ded5b7',
 'glass':'#adbfbb',
})

def native(p):
 x,y,z=p;return (x/U,-z/U,y/U)
def dims(d):
 w,h,depth=d;return (w/U,depth/U,h/U)
def box(a,name,center,size,mat,role,bevel=0,angle=0):
 return a.box(name,dims(size),native(center),mat,role,bevel/U,rotation=(0,0,angle))
def beam(a,name,start,end,width,mat,role):
 return a.beam(name,native(start),native(end),width/U,mat=mat,role=role)
def frame_point(p):
 x,y,z=p;angle=-math.pi/2;c=math.cos(angle);s=math.sin(angle)
 return (-4.9+c*x+s*z,.02+y,4-s*x+c*z)
def door_box(a,name,p,size,mat,role='room-door-leaf',bevel=0):
 return box(a,name,frame_point(p),size,mat,role,bevel,-math.pi/2)
def curtain(a,name,cx):
 # A closed pleated textile volume, including its reverse, top and lower hems.
 front=[(cx-.08,-6.81),(cx-.04,-6.75),(cx,-6.80),(cx+.04,-6.75),(cx+.08,-6.81)]
 outline=front+[(x,z+.016) for x,z in reversed(front)]
 verts=[native((x,y,z)) for y in (WIN_BOTTOM+.04,WIN_TOP-.04) for x,z in outline];n=len(outline)
 faces=[tuple(range(n)),tuple(reversed(range(n,n*2)))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 return a.mesh(name,verts,faces,'room-curtain','room-curtain')

def build(b):
 door=dict(frameOriginRuntime=[-4.9,.02,4],projectionCenterRuntime=[-4.9,.02,4],frameRotationY=-math.pi/2,hingeLocalRuntime=[-DOOR_W/2,0,0],hingeWorldRuntime=[-4.9,.02,4-DOOR_W/2],heightRuntime=DOOR_H,leafWidthRuntime=DOOR_W,leafThicknessRuntime=DOOR_D,heightMetres=2.1,widthMetres=.8,thicknessMetres=.04,leafRole='room-door-leaf',frameRole='room-door-frame',legacyAnimation='doors.room.hinge.rotation.y = -doorProgress * .58',retainProjectedFrame=True,originalNarrowHingeWorldRuntime=[-4.9,.02,3.49],hingeAdaptation='Door centre retained; pivot moves by half the added real-width door as agreed with runtime loader')
 a=b.asset(FAMILY,'东东房间建筑背景','固定建筑','fixed',runtimeUnitsPerMetre=U,coordinateSystem='Source Blender XYZ = [runtime X, -runtime Z, runtime Y] / unitsPerMetre; GLB Y-up; scale once in runtime',containsFurniture=False,containsActors=False,displaySection='Original open south side, low east wall and roofless architectural section retained for the existing room camera',sourceRuntime='rooftop/3d/scene3d.mjs:roomShell and door',door=door)
 # Original slabs and painted-floor height. No automatic grounding/recentering.
 box(a,'floor-structure',(0,-.13,0),(10,.25,14),'room-floor-structure','room-floor-structure')
 box(a,'floor-finish',(0,.003,0),(10,.015,14),'room-floor-timber','room-floor')
 for tag,x in [('west',-3.4),('east',3.4)]:box(a,'back-wall-'+tag,(x,WALL_H/2,-7),(3.2,WALL_H,.15),'room-plaster-sage','room-wall-back')
 box(a,'back-wall-below-window',(0,WIN_BOTTOM/2,-7),(3.6,WIN_BOTTOM,.15),'room-plaster-sage','room-wall-back')
 box(a,'back-wall-window-lintel',(0,(WIN_TOP+WALL_H)/2,-7),(3.6,WALL_H-WIN_TOP,.15),'room-plaster-sage','room-wall-back')
 # The old left wall occupied the door's complete volume. A real slot, same
 # exterior wall extent and same original hinge, now lets the native door open.
 for tag,lo,hi in [('rear',-7,DOOR_OPEN[0]),('front',DOOR_OPEN[1],7)]:
  box(a,'left-wall-'+tag,(-5,WALL_H/2,(lo+hi)/2),(.15,WALL_H,hi-lo),'room-plaster-sage','room-wall-left')
 door_head=DOOR_H+.24
 box(a,'left-wall-door-lintel',(-5,(door_head+WALL_H)/2,4),(.15,WALL_H-door_head,DOOR_OPEN[1]-DOOR_OPEN[0]),'room-plaster-sage','room-wall-left')
 box(a,'right-low-wall',(5,.23,0),(.15,.45,14),'room-plaster-sage','room-wall-right')
 # Small fixed joinery follows the existing wall boundary rather than adding
 # movable props. Each component is a solid with a real reverse and underside.
 box(a,'back-skirting',(0,.075,-6.905),(10,.13,.04),'room-skirting','room-skirting')
 for tag,lo,hi in [('rear',-7,4-DOOR_W/2-.18),('front',4+DOOR_W/2+.18,7)]:
  box(a,'left-skirting-'+tag,(-4.905,.075,(lo+hi)/2),(.035,.13,hi-lo),'room-skirting','room-skirting')
 box(a,'right-skirting',(4.905,.075,0),(.035,.13,14),'room-skirting','room-skirting')
 # Four independently transparent glass solids in the original daylight hole.
 # Fixed pane edges preserve the original 3.4 x 1.5 overall glass rectangle.
 for ix,(lo,hi) in enumerate([(-1.7,-.0325),(.0325,1.7)]):
  for iy,(bottom,top) in enumerate([(WIN_BOTTOM+.04,WIN_MIDDLE-.0325),(WIN_MIDDLE+.0325,WIN_TOP-.04)]):
   o=box(a,f'window-glass-{ix}-{iy}',((lo+hi)/2,(bottom+top)/2,-6.92),(hi-lo,top-bottom,.012),'glass','room-window-glass');o['transparentArchitecture']=True
 for i,x in enumerate([-1.75,0,1.75]):box(a,'window-vertical-'+str(i),(x,WIN_MIDDLE,-6.86),(.065,WIN_TOP-WIN_BOTTOM+.06,.055),'room-joinery','room-window-frame')
 box(a,'window-crossbar',(0,WIN_MIDDLE,-6.85),(3.5,.065,.055),'room-joinery','room-window-frame')
 for name,y in [('lower',WIN_BOTTOM),('upper',WIN_TOP)]:box(a,'window-'+name+'-rail',(0,y,-6.86),(3.56,.065,.10),'room-joinery','room-window-frame')
 box(a,'window-sill',(0,WIN_BOTTOM-.045,-6.76),(3.7,.09,.44),'room-joinery','room-window-sill')
 # Venetian blinds remain raised, with folded slats and side pull cords.
 box(a,'blind-headbox',(0,WIN_TOP+.10,-6.69),(3.72,.14,.21),'room-joinery','room-blind')
 for k in range(6):box(a,'blind-raised-slat-'+str(k),(0,WIN_TOP-.015-k*.039,-6.67),(3.5,.026,.23),'room-blind','room-blind')
 box(a,'blind-bottom-rail',(0,WIN_TOP-.275,-6.67),(3.54,.05,.23),'room-joinery','room-blind')
 for x in [-1.94,1.94]:box(a,'blind-pull-'+str(x),(x,WIN_TOP-.65,-6.65),(.023,1.35,.023),'room-hardware','room-blind-cord')
 # World map pasted on the left wall; complete backing, paper and reverse.
 box(a,'world-map-backing',(-4.892,3.06,-3.32),(.036,1.73,3.20),'room-map-paper','room-world-map-frame')
 box(a,'world-map-paper',(-4.867,3.06,-3.32),(.009,1.59,3.06),'room-map-sea','room-world-map')
 # Original fixed wall lamp, with a closed-thickness open shade and a bulb.
 lamp_y=2.18*U
 beam(a,'lamp-bracket',[-4.92,lamp_y-.14,-.8],[-4.45,lamp_y+.04,-.8],.05,'room-lamp-bracket','room-wall-lamp')
 profile=[(.12,lamp_y-.125),(.19,lamp_y+.125),(.173,lamp_y+.125),(.103,lamp_y-.125)]
 verts=[native((-4.45+r*math.cos(j*math.tau/16),z,-.8+r*math.sin(j*math.tau/16))) for r,z in profile for j in range(16)]
 faces=[(k*16+j,k*16+(j+1)%16,((k+1)%4)*16+(j+1)%16,((k+1)%4)*16+j) for k in range(4) for j in range(16)]
 a.mesh('lamp-shade',verts,faces,'room-lamp-shade','room-wall-lamp')
 bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,location=native((-4.45,lamp_y-.12,-.8)))
 bulb=bpy.context.object;bulb.name=a.id+'/lamp-bulb';bulb.scale=dims((.085,.065,.085));a._finish(bulb,'room-lamp-glow','room-wall-lamp',0)
 glow=b.material('room-lamp-glow').node_tree.nodes.get('Principled BSDF');glow.inputs['Emission Color'].default_value=(.72,.66,.45,1);glow.inputs['Emission Strength'].default_value=.28
 # Static original door frame and threshold. All leaf parts remain separate.
 for name,x in [('hinge',-DOOR_W/2-.09),('latch',DOOR_W/2+.09)]:door_box(a,'door-frame-'+name,(x,(DOOR_H+.14)/2,0),(.15,DOOR_H+.14,.3),'room-joinery','room-door-frame')
 door_box(a,'door-frame-head',(0,DOOR_H+.14,0),(DOOR_W+.36,.16,.34),'room-joinery','room-door-frame')
 door_box(a,'door-threshold',(0,.06,.12),(DOOR_W+.48,.12,.7),'room-floor-structure','room-door-frame')
 door_box(a,'door-leaf-body',(0,DOOR_H/2,0),(DOOR_W,DOOR_H,DOOR_D),'room-door-steel',bevel=.014)
 for face,sign in [('exterior',1),('interior',-1)]:
  door_box(a,'door-panel-'+face,(0,DOOR_H*.508,sign*(DOOR_D/2+.006)),(DOOR_W*.843,DOOR_H*.908,.011),'room-door-paint')
  for tag,x in [('hinge',-DOOR_W/2+.028),('latch',DOOR_W/2-.028)]:door_box(a,'door-edge-'+face+'-'+tag,(x,DOOR_H/2,sign*(DOOR_D/2+.006)),(.037,DOOR_H-.18,.011),'room-door-edge')
  door_box(a,'door-handle-plate-'+face,(DOOR_W/2-.20,1.0*U,sign*(DOOR_D/2+.026)),(.075,.19,.026),'room-door-edge',bevel=.006)
  door_box(a,'door-handle-'+face,(DOOR_W/2-.20,1.0*U,sign*(DOOR_D/2+.045)),(.055,.17,.045),'room-hardware',bevel=.008)
 for k,y in enumerate([.35*U,1.05*U,1.78*U]):
  barrel=a.cyl('door-hinge-barrel-'+str(k),.024/U,.18/U,native(frame_point((-DOOR_W/2,y,0))),'room-hardware','room-door-leaf',vertices=12)
  barrel['hingeAxisRuntime']=[0,1,0]
 for o in a.objects:
  if o.get('part_role')=='room-door-leaf':o['dynamicHinge']='doors.room.hinge';o['hingeWorldMetres']=list(native(door['hingeWorldRuntime']))
 # Correct closed mesh face orientation before final physical UV recording.
 b.fields=[]
 for o in a.objects:
  bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-7);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free();o.data.update();b.record(a,o,o['finish'],o['part_role'])
 a.surface('room-ground','房间地面',.0105/U,10/U,14/U,shape='rectangle',bearing='ground',runtimeHeight=.0105)
 a.surface('window-sill','固定窗台',WIN_BOTTOM/U,3.7/U,.44/U,center=(0,6.76/U),shape='rectangle',bearing='object',runtimeHeight=WIN_BOTTOM)
 a.meta.update(doorLeafParts=[o.name for o in a.objects if o['part_role']=='room-door-leaf'],doorFrameParts=[o.name for o in a.objects if o['part_role']=='room-door-frame'],floorRuntime=dict(width=10,depth=14,top=.0105,scenePolygonPixels=[[220,104],[380,104],[380,328],[220,328]]),wallHeightMetres=2.7,wallHeightRuntime=WALL_H,windowRuntime=dict(openingX=[-1.8,1.8],openingY=[WIN_BOTTOM,WIN_TOP],openingHeightMetres=1.45,sillHeightMetres=.85,wallZ=-7,glassBoundsX=[-1.7,1.7],glassBoundsY=[WIN_BOTTOM+.04,WIN_TOP-.04],glassCenterZ=-6.92),preservedRoomCamera=dict(theta=-.18,phi=.9,zoom=1.07,target=[-.4,.2,-.8],heightMayBeAdaptedToNewRealWall=True),preservedActorPixels=dict(person=[300,240],pig=[260,260],sceneSpawn=[300,290]))
 return a

def frozen_builder():
 # Final export comes from the saved editable layout, rather than replaying a
 # sphere/BMesh authoring operation that can rotate equal-length face loops.
 bpy.ops.wm.open_mainfile(filepath=str(ROOT/FAMILY/(FAMILY+'-layout.blend')))
 b=object.__new__(Builder);b.family=FAMILY;b.path=ROOT/FAMILY;b.atlas=ROOT/'preview/assets'/(FAMILY+'-atlas.png');b.fields=[]
 b.materials={m['finish']:m for m in bpy.data.materials if m.get('finish')}
 a=object.__new__(assetlib.Asset);a.b=b;a.id=FAMILY;a.col=bpy.data.collections[FAMILY];a.objects=list(a.col.objects);a.meta=json.loads((b.path/'catalog.json').read_text())['items'][0];a.surfaces=a.meta['surfaces'];b.assets=[a]
 original_uv={o.name:[tuple(uv.uv) for uv in o.data.uv_layers.active.data] for o in a.objects}
 for o in a.objects:b.record(a,o,o['finish'],o['part_role'])
 b.pack()
 assert all(tuple(uv.uv)==original_uv[o.name][i] for o in a.objects for i,uv in enumerate(o.data.uv_layers.active.data)),'Frozen source UVs must remain exact'
 return b,a

if MODE=='verify':verify_saved(FAMILY)
else:
 if MODE=='final':b,a=frozen_builder()
 else:b=Builder(FAMILY);a=build(b)
 glass=b.material('glass');glass.node_tree.nodes.get('Principled BSDF').inputs['Alpha'].default_value=.16;glass.diffuse_color=(*glass.diffuse_color[:3],.16)
 b.finish()
 sha=hashlib.sha256((ROOT/FAMILY/'texture-layout.json').read_bytes()).hexdigest()
 if MODE=='final':assert sha==json.loads((ROOT/FAMILY/'layout-source-inspection.json').read_text())['layoutSha256'],'Final manifest must match native painting mapping'
 (ROOT/FAMILY/'mapping-freeze.json').write_text(json.dumps(dict(family=FAMILY,state='layout frozen; native Pixelorama pending' if MODE!='final' else 'final source saved; same frozen physical UVs',layoutSha256=sha,source='room-background/'+FAMILY+('-layout.blend' if MODE!='final' else '.blend'),charts=len(b.fields),objects=len(a.objects),texelsPerMetre=16,runtimeUnitsPerMetre=U,containsFurniture=False,containsActors=False,doorLeafParts=a.meta['doorLeafParts'],doorFrameParts=a.meta['doorFrameParts']),ensure_ascii=False,indent=2))
 (ROOT/FAMILY/'pattern-guide.json').write_text(json.dumps(dict(palette={k:v for k,v in PALETTE.items() if k.startswith('room-') or k=='glass'},styleSource='Current native terrace-book palette: plaster #a3aba3, cement #929a92, trim #baae9a; indoor sage walls, raised blinds and world map',physicalGrid='Every chart 16 native Pixelorama texels per metre; no screen-grain changes in geometry',paintEntry='patterns.py:pattern_color(field,point,base)',aging='Sparse interior floor wear, timber joints, contact scuffs, subdued joinery edge wear, hand use around both door handles. No rain marks, algae, repeated dirt tiles or random blanket noise.',door=a.meta['door'],metadataOnlyBoundary='obstacle-boundaries.json; no movable furniture or actors'),ensure_ascii=False,indent=2))
