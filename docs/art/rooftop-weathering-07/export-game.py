"""Export this anonymous native Blender source into a small static web asset.
Usage: Blender --background --python export-game.py -- source.blend output_folder
Only geometry, authoring calibration and an explicit anonymous metadata allowlist
are written; no source map records or original authoring paths are embedded.
"""
import bpy,sys,json,math,hashlib,struct
from pathlib import Path
from collections import defaultdict
from mathutils import Matrix,Vector
args=sys.argv[sys.argv.index('--')+1:]
source=Path(args[0]).resolve();dest=Path(args[1]).resolve();dest.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(source));scene=bpy.context.scene
fields=json.loads(scene['textureFields']);change=Matrix(((1,0,0,0),(0,0,1,0),(0,-1,0,0),(0,0,0,1)))
segments=defaultdict(list);direct_boxes=defaultdict(list);assembly_boxes=defaultdict(list);worlds=defaultdict(list);library_meshes=defaultdict(list)
objects=0;cube=None
for o in scene.objects:
    if o.instance_type=='COLLECTION' and o.instance_collection:worlds[o.instance_collection].append(change@o.matrix_world@change.inverted())

def material_key(me,layer,material_index=0):
    m=me.materials[material_index]
    return (m.get('runtime_field',m.name),layer,m.get('runtime_style','pixelbook'),m.get('runtime_texture',''),m.get('lamp_mask',''))
def box_matrix(o):
    global cube
    me=o.data;points=[change@o.matrix_world@v.co for v in me.vertices]
    center=sum(points,Vector())/8;axes=[points[1]-points[0],points[3]-points[0],points[4]-points[0]]
    values=[*axes[0],0,*axes[1],0,*axes[2],0,*center,1]
    if cube is None:
        cube=[];me.calc_loop_triangles();norm=(change@o.matrix_world).to_3x3().inverted().transposed()
        for tri in me.loop_triangles:
            nn=(norm@tri.normal).normalized()
            for li in tri.loops:
                p=points[me.loops[li].vertex_index]-center;q=[p.dot(axis)/axis.length_squared for axis in axes];n=[nn.dot(axis.normalized()) for axis in axes];cube.extend([*q,*n,0,0])
    return values

def mesh_values(o,material_index=0):
    me=o.data;me.calc_loop_triangles();values=[];world=change@o.matrix_world;norm=world.to_3x3().inverted().transposed();uv=me.uv_layers.active.data
    for tri in me.loop_triangles:
        if me.polygons[tri.polygon_index].material_index!=material_index:continue
        n=(norm@tri.normal).normalized()
        for li in tri.loops:
            p=world@me.vertices[me.loops[li].vertex_index].co;q=uv[li].uv;v=(1-q.y) if me.materials[material_index].get('runtime_style')=='baked' else q.y;values.extend([*p,*n,q.x,v])
    return values
for c,ws in worlds.items():
    for o in c.objects:
        if o.type!='MESH':continue
        objects+=len(ws);key=material_key(o.data,'near' if 'vehicle'not in c.name else 'ground')
        if o.get('runtime_box'):assembly_boxes[(c,key)].extend(box_matrix(o))
        else:
            # Two main roof slopes retain their native polygons and use two
            # material slots, rather than altering the mesh's topology.
            for mi in sorted({p.material_index for p in o.data.polygons}):
                key=material_key(o.data,'near' if 'vehicle'not in c.name else 'ground',mi)
                library_meshes[(c,key)].extend(mesh_values(o,mi))
for o in scene.objects:
    if o.type!='MESH':continue
    objects+=1;key=material_key(o.data,o.get('layer','near'))
    if o.get('runtime_box'):direct_boxes[key].extend(box_matrix(o))
    else:
        for mi in sorted({p.material_index for p in o.data.polygons}):
            key=material_key(o.data,o.get('layer','near'),mi)
            segments[key].extend(mesh_values(o,mi))
if cube is None:raise RuntimeError('Expected authored native box primitives')
data=bytearray();parts=[]
def append(values):
    if any(not math.isfinite(v) for v in values):raise ValueError('Invalid native geometry')
    offset=len(data);data.extend(struct.pack('<'+'f'*len(values),*values));return offset
cube_offset=append(cube)
world_sections={}
for c,ws in worlds.items():
    values=[m[row][col]for m in ws for col in range(4) for row in range(4)]
    world_sections[c]={'worldOffset':append(values),'worldCount':len(ws)}
def part_fields(key):
    kind,layer,style,texture,mask=key
    part={'field':kind,'layer':layer}
    if style=='baked':part.update({'style':'baked','texture':texture,'lampMask':mask,'shading':'orientation'})
    else:part['rect']=fields[kind]
    return part
for key in dict.fromkeys([*direct_boxes,*[key for _,key in assembly_boxes]]):
    values=direct_boxes.get(key,[]);count=len(values)//16;part={**part_fields(key),'mode':'instances','offset':append(values),'directCount':count,'count':count,'assemblies':[]}
    for (c,k),vs in assembly_boxes.items():
        if k!=key:continue
        group={'sourceOffset':append(vs),'sourceCount':len(vs)//16,**world_sections[c]};part['assemblies'].append(group);part['count']+=group['sourceCount']*group['worldCount']
    parts.append(part)
for (c,key),values in library_meshes.items():
    part={**part_fields(key),'mode':'meshInstances','offset':append(values),'vertices':len(values)//8,'matricesOffset':world_sections[c]['worldOffset'],'count':world_sections[c]['worldCount']};parts.append(part)
for key,values in segments.items():parts.append({**part_fields(key),'mode':'mesh','offset':append(values),'vertices':len(values)//8})
triangles=sum(p['count']*12 if p['mode']=='instances'else p['vertices']//3*(p['count']if p['mode']=='meshInstances'else 1)for p in parts)
bylayer={layer:sum(p['count']*12 if p['mode']=='instances'else p['vertices']//3*(p['count']if p['mode']=='meshInstances'else 1)for p in parts if p['layer']==layer)for layer in ['near','far','ground']}
textures=[]
for name in ['terrace-book.png','distance-facades.png','distance-lights.png']:
    im=bpy.data.images[name]
    if not im.packed_file:raise RuntimeError('Source texture must be packed')
    raw=bytes(im.packed_file.data);chunks=bytearray(raw[:8]);at=8
    while at<len(raw):
        length=struct.unpack('>I',raw[at:at+4])[0];end=at+length+12
        if raw[at+4:at+8] in {b'IHDR',b'PLTE',b'IDAT',b'IEND',b'tRNS',b'sRGB',b'gAMA',b'cHRM',b'pHYs'}:chunks.extend(raw[at:end])
        at=end
    bytes_=raw if name=='terrace-book.png' else bytes(chunks);(dest/name).write_bytes(bytes_);textures.append({'file':name,'sha256':hashlib.sha256(bytes_).hexdigest(),'bytes':len(bytes_),'width':im.size[0],'height':im.size[1]})
(dest/'empty-rooftop.bin').write_bytes(data)
manifest={'format':'blender-environment-v2','stride':8,'cube':{'offset':cube_offset,'vertices':len(cube)//8},'source':'docs/art/rooftop-weathering-07/game-environment.blend','texture':'terrace-book.png','binary':'empty-rooftop.bin','textures':textures,'parts':parts,'triangles':triangles,'objects':objects,'bytes':len(data),'sixthFloor':json.loads(scene['sixthFloor']),'row':json.loads(scene['row']),'sha256':hashlib.sha256(data).hexdigest(),'textureSha256':textures[0]['sha256'],'texelMetresPerUnit':json.loads(scene['texelMetresPerUnit']),'texelsPerMetre':int(scene.get('texelsPerMetre',8)),'layers':{'triangles':bylayer,'nearBlocks':scene['nearBlocks'],'cityVolumes':scene['cityVolumes'],'neighbours':'fixed household details','far':'native silhouettes with Blender-baked facade and window-mask atlases'},'neighbourhood':{'north':'finite enclosed-balcony apartments','south':'matching paired-terrace apartments','skylineDirections':360,'nativeStreetLife':True,'homeShops':0,'parkedCars':scene['parkedCars'],'streetTrees':scene['streetTrees'],'layoutSource':'private native reference; local geometry only'},'authoring':{'geometry':'Blender','pixelbook':'Pixelorama','facades':'Blender orthographic albedo bake','privacy':'anonymous local coordinates; no address or source map metadata'}}
(dest/'empty-rooftop.mjs').write_text('export const BACKGROUND = Object.freeze('+json.dumps(manifest,ensure_ascii=False,indent=2)+');\n')
report={'software':'Blender','version':bpy.app.version_string,'native_source_saved':True,'runtime_from_evaluated_native_mesh':True,'triangles':triangles,'byLayer':bylayer,'authored_mesh_objects':sum(o.type=='MESH' for o in bpy.data.objects),'evaluated_mesh_objects':objects,'binaryBytes':len(data),'textureBytes':sum(t['bytes']for t in textures),'runtimePayloadBytes':len(data)+sum(t['bytes']for t in textures),'drawCalls':len(parts),'neighbours':'fixed','interactiveAreas':['north rooftop','south balcony'],'addressesIncluded':False}
(source.parent/'export-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('ANONYMOUS GAME EXPORT',json.dumps(report),flush=True)
