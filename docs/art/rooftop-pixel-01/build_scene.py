"""Blender 4.5 source authoring + compact GLB export. All dimensions in metres.
Run: blender --background --python docs/art/rooftop-pixel-01/build_scene.py
Rebuild does not overwrite the Pixelorama PNG/PXO.
"""
import bpy, math, json, struct
from mathutils import Vector
from pathlib import Path
ROOT = Path(__file__).resolve().parent
OUT = ROOT.parents[2] / 'rooftop/previews/pixel-01'
ASSETS = OUT / 'assets'
ASSETS.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
for c in list(bpy.data.collections):
 if c.name != 'Collection': bpy.data.collections.remove(c)
image = bpy.data.images.load(str(ASSETS/'garden-atlas.png')); image.pack()
mat=bpy.data.materials.new('Shared_pixel_atlas'); mat.use_nodes=True
bs=mat.node_tree.nodes.get('Principled BSDF'); bs.inputs['Roughness'].default_value=.92
tex=mat.node_tree.nodes.new('ShaderNodeTexImage'); tex.image=image; tex.interpolation='Closest'
mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
glow=mat.copy(); glow.name='Warm_glass'
gbs=glow.node_tree.nodes.get('Principled BSDF')
gbs.inputs['Emission Color'].default_value=(.55,.35,.10,1); gbs.inputs['Emission Strength'].default_value=.3
groups={}
def collection(name):
 c=bpy.data.collections.new(name); bpy.context.scene.collection.children.link(c); groups[name]=[]; return c
cols={n:collection(n) for n in ['ceramic-pot','metal-rack','doorway','scene-set']}
def finish(obj,name,group,tile,uvmode='cube',emissive=False,uvturn=0):
 obj.name=name
 for c in list(obj.users_collection): c.objects.unlink(obj)
 cols[group].objects.link(obj); groups[group].append(obj)
 obj.data.materials.append(glow if emissive else mat)
 if not obj.data.uv_layers: obj.data.uv_layers.new(name='AtlasUV')
 uv=obj.data.uv_layers.active.data
 # For authored lathe/leaf UVs use the existing per-loop coordinates.
 for p in obj.data.polygons:
  rect=(1,1,30,30)
  if uvmode=='cube':
   axis=max(range(3),key=lambda k:abs(p.normal[k])); axes=[k for k in range(3) if k!=axis]
   # Shared object bounds keep the bevels in the same pixel field as broad faces.
   points=[obj.data.vertices[obj.data.loops[j].vertex_index].co for j in p.loop_indices]
   all_points=[v.co for v in obj.data.vertices]
   if tile==2 or (tile==5 and any(part in name for part in ['stile','rail'])) or (tile==7 and 'jamb' in name):
    axes.sort(key=lambda k:max(v[k] for v in all_points)-min(v[k] for v in all_points))
    if tile==2:rect=(1,1,6,30) if p.normal[axis]>0 else (12,1,17,30)
    elif tile==5:rect=(18,2,25,29)
    else:rect=(1,1,8,30)
   mins=[min(v[k] for v in all_points) for k in axes]; maxs=[max(v[k] for v in all_points) for k in axes]
   for j,v in zip(p.loop_indices,points):
    q=[(v[k]-mins[h])/max(maxs[h]-mins[h],.001) for h,k in enumerate(axes)]
    uv[j].uv=q
  for j in p.loop_indices:
   u,v=uv[j].uv
   for _ in range(uvturn%4):u,v=1-v,u
   # 1px gutters; the tile borders never sample adjacent materials.
   u0,v0,u1,v1=rect
   uv[j].uv=((tile%4*32+u0+u*(u1-u0))/128,(128-(tile//4*32+v1)+v*(v1-v0))/128)
 return obj
def box(name,group,pos,size,tile,bevel=0,emissive=False,uvturn=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=pos); o=bpy.context.object
 o.dimensions=size; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  mod=o.modifiers.new('Single step edges','BEVEL'); mod.width=bevel; mod.segments=1
  bpy.ops.object.modifier_apply(modifier=mod.name)
 return finish(o,name,group,tile,emissive=emissive,uvturn=uvturn)
def rod(name,group,a,b,width,tile=2):
 a,b=Vector(a),Vector(b); o=box(name,group,(a+b)/2,(width,width,(b-a).length),tile)
 o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler(); return o
def lathe(name,group,rings,tile,segments=16):
 verts=[(r*math.cos(2*math.pi*j/segments),r*math.sin(2*math.pi*j/segments),z) for r,z in rings for j in range(segments)]
 faces=[(k*segments+j,k*segments+(j+1)%segments,(k+1)*segments+(j+1)%segments,(k+1)*segments+j) for k in range(len(rings)-1) for j in range(segments)]
 mesh=bpy.data.meshes.new(name); mesh.from_pydata(verts,[],faces); mesh.update()
 o=bpy.data.objects.new(name,mesh); cols[group].objects.link(o)
 mesh.uv_layers.new(name='AtlasUV')
 low=min(z for r,z in rings);high=max(z for r,z in rings)
 for p in mesh.polygons:
  j=p.index%segments; k=p.index//segments
  v0=(rings[k][1]-low)/max(high-low,.001);v1=(rings[k+1][1]-low)/max(high-low,.001)
  for loop,q in zip(p.loop_indices,[(j/segments,v0),((j+1)/segments,v0),((j+1)/segments,v1),(j/segments,v1)]):
   mesh.uv_layers.active.data[loop].uv=q
 return finish(o,name,group,tile,'lathe')
# One shell with a real inner wall, recessed bottom, drainage hole, and a separate thick lip.
lathe('Terracotta / tapered vessel','ceramic-pot',[(.047,.035),(.22,.035),(.235,.07),(.285,.39),(.318,.475),(.318,.49),(.28,.49),(.252,.395),(.208,.087),(.047,.087)],0)
lathe('Terracotta / rolled lip','ceramic-pot',[(.278,.463),(.328,.463),(.343,.478),(.343,.525),(.331,.542),(.278,.542),(.27,.528),(.27,.48),(.278,.463)],1)
lathe('Terracotta / raised foot','ceramic-pot',[(.198,0),(.221,0),(.226,.025),(.222,.045),(.198,.045),(.198,0)],0)
# Two slatted bearing surfaces; board tops at .30 and 1.08, stable feet at z=0.
for x in [-.67,.67]:
 for y in [-.28,.28]:
  rod('Rack / square upright','metal-rack',(x,y,.025),(x,y,1.17),.035)
  box('Rack / foot cap','metal-rack',(x,y,.025),(.075,.075,.05),3,.008)
for z in [.28,1.06]:
 for y in [-.29,.29]: box('Rack / cross rail','metal-rack',(0,y,z),(1.40,.035,.04),2)
 for x in [-.68,.68]: box('Rack / side rail','metal-rack',(x,0,z),(.035,.60,.04),2)
 for y in [-.24,-.12,0,.12,.24]: box('Rack / shelf slat','metal-rack',(0,y,z+.015),(1.32,.067,.01),2)
for a,b in [((-.66,.30,.30),(.66,.30,1.06)),((.66,.30,.30),(-.66,.30,1.06))]: rod('Rack / X brace','metal-rack',a,b,.022)
for x in [-.69,.69]:
 rod('Rack / top end handle','metal-rack',(x,-.28,1.17),(x,.28,1.17),.035,3)
 for y in [-.305,.305]:
  for z in [.28,1.06]: box('Rack / exposed fastener','metal-rack',(x,y,z),(.048,.012,.045),3,.004)
# Doorway vignette; wall segments preserve a real opening, with a return wall.
box('Wall / left plaster pier','doorway',(-1.35,1.03,1.17),(1.1,.22,2.34),4,.018)
box('Wall / right plaster pier','doorway',(1.36,1.03,1.17),(.70,.22,2.34),4,.018)
# Meet the piers at their edges; coplanar overlaps made black rectangles in Cycles.
box('Wall / lintel','doorway',(.105,1.03,2.185),(1.81,.22,.31),4,.015)
box('Wall / short return','doorway',(-1.84,.60,.48),(.16,1.06,.96),4,.015)
box('Wall / return coping','doorway',(-1.84,.60,.99),(.22,1.11,.07),7,.008)
for x in [-.80,1.005]: box('Door / stone jamb','doorway',(x,.862,1.0025),(.11,.15,2.005),7,.007)
box('Door / stone head','doorway',(.102,.862,2.06),(1.91,.15,.11),7,.008)
box('Door / shadow recess','doorway',(.10,1.10,1.0),(1.72,.05,2.0),8)
box('Door / sage leaf','doorway',(.10,.997,1.01),(1.66,.095,1.96),5,.004)
for x in [-.56,.76]: box('Door / vertical stile','doorway',(x,.927,1.015),(.095,.04,1.94),5,.004)
for z in [.17,.88,1.86]: box('Door / horizontal rail','doorway',(.10,.912,z),(1.36,.06,.09),5,.004)
for x in [-.27,.37]:
 for z,h in [(.515,.58),(1.37,.86)]: box('Door / raised panel','doorway',(x,.938,z),(.54,.018,h),5,.008)
box('Door / brass backplate','doorway',(.68,.877,1.005),(.045,.025,.14),13,.005)
rod('Door / brass pull','doorway',(.68,.846,.96),(.68,.846,1.06),.027,13)
box('Door / threshold','doorway',(.10,.83,.037),(1.86,.45,.074),7,.008)
for x in [-.64,.86]:
 for z in [.30,1.70]: box('Door / hinge','doorway',(x,.888,z),(.052,.02,.10),2,.003)
box('Roof / eave shadow','doorway',(-.12,1.00,2.36),(3.58,.43,.075),8)
roof=box('Roof / pitched clay strip','doorway',(-.12,1.015,2.45),(3.67,.62,.065),11,.009); roof.rotation_euler.x=.18
for x in [-1.8+i*.23 for i in range(16)]:
 o=box('Roof / tile seam','doorway',(x,.995,2.487),(.022,.61,.011),11);o.rotation_euler.x=.18
# Courtyard lantern: thick metal silhouette and opaque honey glass, no blend sorting.
cx,cy,cz=1.37,.72,1.66
box('Lamp / wall mount','doorway',(cx,.905,cz),(.12,.055,.32),2,.014)
rod('Lamp / bracket','doorway',(cx,.88,cz+.20),(cx,.60,cz+.20),.043)
box('Lamp / honey glass','doorway',(cx,.60,cz),(.235,.20,.285),10,.012,True)
for x in [cx-.132,cx+.132]:
 for y in [.485,.715]: rod('Lamp / corner','doorway',(x,y,cz-.16),(x,y,cz+.16),.025)
for z in [cz-.16,cz+.16]: box('Lamp / rail','doorway',(cx,.60,z),(.285,.255,.035),2,.009)
bpy.ops.mesh.primitive_cone_add(vertices=4,radius1=.24,radius2=.055,depth=.12,location=(cx,.60,cz+.235),rotation=(0,0,math.pi/4))
finish(bpy.context.object,'Lamp / pitched cap','doorway',2)
# Presentation slab. Decorative foliage is explicitly sample-only, never a species replacement.
box('Stage / foundation','scene-set',(-.10,-.05,-.10),(3.98,2.76,.20),12,.035)
for ix in range(9):
 for iy in range(6):
  box('Stage / paving','scene-set',(-1.84+ix*.44,-1.15+iy*.44,-.005),(.433,.433,.03),6,uvturn=(ix+2*iy)%4)
def sprig(pos,scale):
 x,y,z=pos
 rod('Demo-only / stem','scene-set',(x,y,z),(x+.03*scale,y,z+.58*scale),.017*scale,9)
 for k in range(6):
  angle=k*2.399; h=(.13+k*.065)*scale; a=Vector((x,y,z+h)); b=a+Vector((math.cos(angle)*.24*scale,math.sin(angle)*.24*scale,.09*scale))
  perp=Vector((-math.sin(angle),math.cos(angle),0))*.065*scale
  verts=[a,a+(b-a)*.48+perp,b,a+(b-a)*.48-perp]
  me=bpy.data.meshes.new('Demo leaf'); me.from_pydata(verts,[],[(0,1,2,3),(3,2,1,0)]); me.update()
  ob=bpy.data.objects.new('Demo leaf',me); cols['scene-set'].objects.link(ob); me.uv_layers.new()
  for p in me.polygons:
   for li,q in zip(p.loop_indices,[(0,.5),(.5,1),(1,.5),(.5,0)]):me.uv_layers.active.data[li].uv=q
  finish(ob,'Demo-only / angular leaf','scene-set',9,'leaf')
sprig((-1.35,.06,1.28),.56);sprig((-.73,.03,1.28),.72)
sprig((-.99,-.04,.52),.60)
placements=[
 {'asset':'ceramic-pot','position':[-1.35,.03,1.10],'scale':.40},
 {'asset':'ceramic-pot','position':[-.73,.03,1.10],'scale':.40},
 {'asset':'ceramic-pot','position':[-.99,-.04,.32],'scale':.40},
 {'asset':'ceramic-pot','position':[.35,-.69,.01],'scale':1.0},
 {'asset':'ceramic-pot','position':[1.12,-.75,.01],'scale':.61},
 {'asset':'metal-rack','position':[-1.04,.04,.01],'scale':1.0},
 {'asset':'doorway','position':[0,0,.01],'scale':1.0},
 {'asset':'scene-set','position':[0,0,0],'scale':1.0},
]
# Export pristine, local-origin assets. Strip images from GLBs; the preview assigns one shared PNG.
stats=[]
for name,objects in groups.items():
 # Join temporary export copies only. Editable parts stay separate in the .blend.
 exported=[]
 for material in [mat,glow]:
  bpy.ops.object.select_all(action='DESELECT')
  copies=[]
  for source in objects:
   if source.data.materials[0]!=material:continue
   copy=source.copy();copy.data=source.data.copy();cols[name].objects.link(copy)
   copy.select_set(True);copies.append(copy)
  if not copies:continue
  bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join()
  joined=bpy.context.object;joined.name=name+('/Warm_glass' if material==glow else '/Atlas')
  exported.append(joined)
 bpy.ops.object.select_all(action='DESELECT')
 for o in exported:o.select_set(True)
 bpy.context.view_layer.objects.active=exported[0]
 path=ASSETS/(name+'.glb')
 bpy.ops.export_scene.gltf(filepath=str(path),use_selection=True,export_format='GLB',export_materials='NONE',export_texcoords=True,export_normals=True,export_extras=True,export_yup=True)
 blob=path.read_bytes();json_length=struct.unpack_from('<I',blob,12)[0]
 gltf=json.loads(blob[20:20+json_length])
 tris=sum(gltf['accessors'][primitive['indices']]['count']//3 for mesh in gltf['meshes'] for primitive in mesh['primitives'])
 stats.append({'id':name,'bytes':path.stat().st_size,'triangles':tris,'meshes':len(exported),'editable_parts':len(objects),'bounds':'metres, floor origin, Blender Z up; GLB Y up'})
 for obj in exported:bpy.data.objects.remove(obj,do_unlink=True)
# Save a composed scene for editing and rendering, using linked copies of the originals.
for c in cols.values():c.hide_render=True;c.hide_viewport=True
demo=collection('COMPOSED_PREVIEW')
for entry in placements:
 for src in groups[entry['asset']]:
  ob=src.copy();ob.data=src.data;demo.objects.link(ob)
  ob.location=src.location*entry['scale']+Vector(entry['position']);ob.scale*=entry['scale']
  ob.hide_render=False;ob.hide_viewport=False
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48
scene.render.resolution_x=1600;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.view_settings.view_transform='Standard';scene.view_settings.look='Medium High Contrast'
scene.world.color=(.30,.30,.30)
world=scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.77,.79,.72,1);world.node_tree.nodes['Background'].inputs[1].default_value=.7
bpy.ops.object.light_add(type='AREA',location=(-3,-4,7));light=bpy.context.object;light.name='Preview / broad daylight';light.data.energy=450;light.data.shape='DISK';light.data.size=4
light.rotation_euler=(Vector((0,0,1))-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(5,-7,4.8));camera=bpy.context.object;camera.name='Preview / orthographic camera';camera.data.type='ORTHO';camera.data.ortho_scale=5.75
camera.data.ortho_scale=6.3
camera.rotation_euler=(Vector((-.10,.05,1.10))-camera.location).to_track_quat('-Z','Y').to_euler();scene.camera=camera
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
scene['sample_status']='Direction approved; material refinement from 13 reference GIFs awaiting visual review. Not integrated into the game.'
scene['reference_refinement']='Authored ceramic kiln marks, metal edge strips, broad door panels, stone joints and tile strokes; original palette, geometry and placements preserved.'
scene['atlas_workflow']='128px atlas; sixteen 32px material tiles; nearest texture sampling; no screen pixelation'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'garden-sample.blend'),compress=True)
scene.render.filepath=str(ROOT/'blender-preview.png');bpy.ops.render.render(write_still=True)
(ASSETS/'asset-manifest.json').write_text(json.dumps({'version':2,'status':'direction-approved-refinement-pending','atlas':{'file':'garden-atlas.png','width':128,'height':128,'tile':32,'bytes':(ASSETS/'garden-atlas.png').stat().st_size},'assets':stats,'placements':placements},ensure_ascii=False,indent=2)+'\n')
print(json.dumps(stats))
