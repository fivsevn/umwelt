"""Editable Blender asset library and real software review renders.

The mesh import comes from the game's shared model builders. Pixelorama owns
the texture; Blender never creates or retouches that raster. Surface pixels
are sampled on the same 1/8-unit metric grid as the runtime.
"""
from pathlib import Path
import bpy, gzip, json, math, struct, hashlib
from mathutils import Vector

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
SOURCE = HERE / 'game-assets.blend'
TEXTURE = ROOT / 'rooftop/assets/pixel/material-book.png'
data = json.loads(gzip.decompress((HERE / 'model-authoring.json.gz').read_bytes()))
book = json.loads((HERE / 'book-layout.json').read_text())['fields']
edited_existing=SOURCE.exists()
if edited_existing: bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
else: bpy.ops.wm.read_factory_settings(use_empty=True)
image = bpy.data.images.get('Pixelorama / material-book / native 512')
if image:
    if image.packed_file: image.unpack(method='REMOVE')
    image.filepath=str(TEXTURE); image.reload()
else: image = bpy.data.images.load(str(TEXTURE), check_existing=True)
image.name = 'Pixelorama / material-book / native 512'
image.colorspace_settings.name = 'sRGB'
image.pack()

material = bpy.data.materials.get('Native Pixelorama / square metric grid') or bpy.data.materials.new('Native Pixelorama / square metric grid')
material.use_nodes = True
material.surface_render_method = 'DITHERED'
nodes, links = material.node_tree.nodes, material.node_tree.links
nodes.clear()
def node(kind, label=''):
    n = nodes.new(kind)
    if label: n.label = label
    return n
def scalar(op, a, b=None):
    n = node('ShaderNodeMath'); n.operation = op
    for i, value in enumerate([a, b]):
        if value is None: continue
        if isinstance(value, (int, float)): n.inputs[i].default_value = value
        else: links.new(value, n.inputs[i])
    return n.outputs[0]
def vector(op, a, b=None):
    n = node('ShaderNodeVectorMath'); n.operation = op
    links.new(a, n.inputs[0])
    if b is not None:
        if isinstance(b, (tuple, list)): n.inputs[1].default_value = b
        else: links.new(b, n.inputs[1])
    return n.outputs['Value' if op == 'DOT_PRODUCT' else 'Vector']
def separate(a):
    n = node('ShaderNodeSeparateXYZ'); links.new(a, n.inputs[0])
    return n.outputs['X'], n.outputs['Y'], n.outputs['Z']
def combine(x, y, z=0):
    n = node('ShaderNodeCombineXYZ')
    for i, value in enumerate([x, y, z]):
        if isinstance(value, (int, float)): n.inputs[i].default_value = value
        else: links.new(value, n.inputs[i])
    return n.outputs[0]
def attribute(name, color=False):
    n = node('ShaderNodeAttribute', name); n.attribute_name = name
    return n.outputs['Color' if color else 'Vector']
def factor(name):
    n = node('ShaderNodeAttribute', name); n.attribute_name = name
    return n.outputs['Fac']
def mix(a, b, f, op='MIX'):
    n = node('ShaderNodeMixRGB'); n.blend_type = op
    if isinstance(f, (int, float)): n.inputs[0].default_value = f
    else: links.new(f, n.inputs[0])
    links.new(a, n.inputs[1]); links.new(b, n.inputs[2])
    return n.outputs[0]

plane = attribute('pixel_plane')
pixel=vector('MODULO',vector('FLOOR',vector('ADD',vector('MULTIPLY',plane,(8,8,8)),attribute('pixel_phase'))),(32,32,1))
u,v,_=separate(pixel)
cell=combine(scalar('DIVIDE',scalar('ADD',u,.5),32),scalar('DIVIDE',scalar('ADD',scalar('SUBTRACT',31,v),.5),32))
cell = vector('MINIMUM', vector('MAXIMUM', cell, (.5/32, .5/32, 0)), (31.5/32, 31.5/32, 0))
uv_top = vector('ADD', vector('MULTIPLY', cell, (32/512, 32/512, 0)), attribute('pixel_region'))
u, v, _ = separate(uv_top)
texture = node('ShaderNodeTexImage', 'Actual native PNG / Closest'); texture.image = image
texture.interpolation = 'Closest'; texture.extension = 'CLIP'
links.new(combine(u, scalar('SUBTRACT', 1, v)), texture.inputs['Vector'])
rgb = node('ShaderNodeSeparateColor'); rgb.mode = 'RGB'
links.new(texture.outputs['Color'], rgb.inputs[0])
channels = [rgb.outputs['Red'], rgb.outputs['Green'], rgb.outputs['Blue']]
high = scalar('MAXIMUM', scalar('MAXIMUM', channels[0], channels[1]), channels[2])
low = scalar('MINIMUM', scalar('MINIMUM', channels[0], channels[1]), channels[2])
pigment = scalar('GREATER_THAN', scalar('SUBTRACT', high, low), .001)
body = mix(attribute('pixel_body', True), texture.outputs['Color'], 1, 'MULTIPLY')
color = mix(body, texture.outputs['Color'], pigment)
color = mix(color, attribute('pixel_shade', True), 1, 'MULTIPLY')
emission = node('ShaderNodeEmission'); links.new(color, emission.inputs['Color'])
transparent = node('ShaderNodeBsdfTransparent')
surface = node('ShaderNodeMixShader')
links.new(scalar('MULTIPLY', texture.outputs['Alpha'], factor('pixel_opacity')), surface.inputs[0])
links.new(transparent.outputs[0], surface.inputs[1]); links.new(emission.outputs[0], surface.inputs[2])
output = node('ShaderNodeOutputMaterial'); links.new(surface.outputs[0], output.inputs['Surface'])

def corner(mesh, name, kind, values):
    a = mesh.attributes.new(name, kind, 'CORNER')
    a.data.foreach_set('color' if kind == 'FLOAT_COLOR' else 'vector' if kind == 'FLOAT_VECTOR' else 'value', values)

def import_mesh(part, name, collection):
    positions = part['positions']; vertex_map = {}; vertices = []; indices = []
    for i in range(0, len(positions), 3):
        xyz = tuple(positions[i:i+3])
        if xyz not in vertex_map:
            vertex_map[xyz] = len(vertices)
            vertices.append((xyz[0], -xyz[2], xyz[1]))
        indices.append(vertex_map[xyz])
    triangles = [indices[i:i+3] for i in range(0, len(indices), 3)]
    mesh = bpy.data.meshes.new(name); mesh.from_pydata(vertices, [], triangles); mesh.update()
    obj = collection.objects.get(name)
    if obj and obj.type=='MESH':
        previous=obj.data;obj.data=mesh
        if not previous.users:bpy.data.meshes.remove(previous)
    else:
        obj=bpy.data.objects.new(name,mesh);collection.objects.link(obj)
    mesh.materials.append(material)
    plane_values = []; body = []; shade = []; region = []; opacity = []
    field = part['field']; info = book[field]
    for j in range(len(triangles)):
        first = j*3; points = [part['planes'][(first+k)*2:(first+k)*2+2] for k in range(3)]
        inner = info['mode'] == 'vessel' and part['interiors'][first]>.5
        area = book[field+'-interior'] if inner else info
        for k in range(3):
            index = first+k
            plane_values.extend((*points[k], 0))
            body.extend((*part['colors'][index*3:index*3+3], 1))
            shade.extend((part['shade'][index],)*3+(1,))
            region.extend((area['x']/512, area['y']/512, 0)); opacity.append(part['opacity'])
    corner(mesh, 'pixel_plane', 'FLOAT_VECTOR', plane_values)
    corner(mesh, 'pixel_region', 'FLOAT_VECTOR', region)
    corner(mesh, 'pixel_body', 'FLOAT_COLOR', body); corner(mesh, 'pixel_shade', 'FLOAT_COLOR', shade)
    corner(mesh, 'pixel_opacity', 'FLOAT', opacity)
    corner(mesh,'pixel_phase','FLOAT_VECTOR',[v for i in range(len(indices)) for v in (*part['phases'][i*2:i*2+2],0)])
    grid_uv=mesh.uv_layers.new(name='Square surface grid / 8 px per unit')
    grid_uv.data.foreach_set('uv',[v for i in range(len(indices)) for v in ((part['planes'][i*2]*8+part['phases'][i*2])/32,(part['planes'][i*2+1]*8+part['phases'][i*2+1])/32)])
    uv_layer = mesh.uv_layers.new(name='Original editable UV')
    uv_layer.data.foreach_set('uv', [v for i in range(len(indices)) for v in (part['uvs'][i*2], 1-part['uvs'][i*2+1])])
    obj['original_field'] = field; obj['texels_per_unit'] = 8
    return obj

library = bpy.data.scenes.get('Asset library / 304 original IDs') or bpy.context.scene; library.name = 'Asset library / 304 original IDs'
bpy.context.window.scene=library
library.render.engine = 'BLENDER_EEVEE_NEXT'
library.view_settings.view_transform = 'Standard'
collections = {}
for index, a in enumerate(data['assets']):
    col=bpy.data.collections.get(a['id']+' / '+a['name'])
    if col is None:
        col=bpy.data.collections.new(a['id']+' / '+a['name']);library.collection.children.link(col)
    collections[a['id']] = col
    names={a['id']+'/'+str(number)+'/'+part['field'] for number,part in enumerate(a['meshes'])}
    for obj in list(col.objects):
        if obj.type=='MESH' and obj.name not in names:bpy.data.objects.remove(obj,do_unlink=True)
    for number,part in enumerate(a['meshes']): import_mesh(part,a['id']+'/'+str(number)+'/'+part['field'],col)
    empty=col.objects.get(a['id']+' / asset identity')
    if empty is None:
        empty=bpy.data.objects.new(a['id']+' / asset identity',None);col.objects.link(empty)
    for obj in list(col.objects):
        if obj != empty: obj.parent = empty
    empty.location = ((index%16)*5, (index//16)*5, 0)
    empty['asset_id'] = a['id']; empty['original_name'] = a['name']; empty['editable_source'] = True

review=bpy.data.scenes.get('Review / representative native assets') or bpy.data.scenes.new('Review / representative native assets')
review.render.engine = 'BLENDER_EEVEE_NEXT'; review.view_settings.view_transform = 'Standard'
review.render.resolution_x = 1200; review.render.resolution_y = 820; review.render.resolution_percentage = 100
review.render.image_settings.file_format = 'PNG'; review.render.film_transparent = False
review.world=bpy.data.worlds.get('Warm neutral background') or bpy.data.worlds.new('Warm neutral background');review.world.use_nodes=True
review.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.72,.70,.64,1)
review.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .8

def instance(asset_id, location):
    obj = bpy.data.objects.new('Review / '+asset_id, None)
    obj.instance_type = 'COLLECTION'; obj.instance_collection = collections[asset_id]
    # Library positions live on the asset root; invert that display-only offset.
    root = next(o for o in collections[asset_id].objects if o.type == 'EMPTY')
    collections[asset_id].instance_offset = root.location
    obj.location = location; review.collection.objects.link(obj)
    return obj

def set_review(items):
    for obj in list(review.objects):
        if obj.name.startswith('Review / '): bpy.data.objects.remove(obj, do_unlink=True)
    for asset_id, location in items: instance(asset_id, location)

camera=review.objects.get('Review camera')
if camera is None:
    camera_data=bpy.data.cameras.new('Review camera');camera=bpy.data.objects.new('Review camera',camera_data);review.collection.objects.link(camera)
else: camera_data=camera.data
camera_data.type='ORTHO';review.camera=camera
def camera_at(eye, target, scale):
    camera.location = eye; camera.rotation_euler = (Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler(); camera_data.ortho_scale = scale

output_dir = HERE/'review'; output_dir.mkdir(exist_ok=True)
views = [
 ('rack-and-plants', [('shelf',(-1.8,.4,0)),('mint',(1.1,.4,0)),('broadleaf',(3.0,.4,0)),('new-aucampiae',(1.1,-1.5,0)),('vessel-antique-nezumi',(3.0,-1.4,0))], (9,-12,9),(0.8,0,1),8.8),
 ('rack-openings', [('shelf',(0,0,0))],(5,-7,6),(0,0,1.4),5.8),
 ('plants', [('broadleaf',(-2,0,0)),('snake',(0,0,0)),('new-aucampiae',(2,0,0)),('mint',(3.4,0,0))],(6,-10,7),(.5,0,1.1),7.8),
 ('vessels', [('vessel-antique-nezumi',(-1.5,0,0)),('vessel-antique-shino',(.1,0,0)),('vessel-tokoname',(1.8,0,0))],(4,-7,6),(.2,0,.4),5.1),
]
renders = []
for title, items, eye, target, scale in views:
    set_review(items); camera_at(eye,target,scale)
    review.render.filepath = str(output_dir/(title+'.png'))
    bpy.ops.render.render(write_still=True, scene=review.name)
    renders.append({'name':title,'path':'review/'+title+'.png','bytes':Path(review.render.filepath).stat().st_size})

set_review(views[0][1]); camera_at(views[0][2],views[0][3],views[0][4])
bpy.context.window.scene = review
bpy.data.orphans_purge(do_local_ids=True,do_linked_ids=False,do_recursive=True)
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE), compress=True)
SOURCE.with_suffix('.blend1').unlink(missing_ok=True)
report = { 'software':'Blender','edited_existing_source':edited_existing,'revision':2,'version':bpy.app.version_string,'assets':len(data['assets']),
    'triangles':data['report']['triangles'],'texture_sha256':hashlib.sha256(TEXTURE.read_bytes()).hexdigest(),
    'native_source_bytes':SOURCE.stat().st_size,'grid':{'texels_per_unit':8,'nearest':True,'framebuffer_downsampling':False},
    'renders':renders,'view_scope':'Software asset reviews, not browser game screenshots',
    'runtime_geometry':'Shared builders remain the published source of mesh topology; editing this native library requires a subsequent export/integration.'}
(HERE/'blender-authoring.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('Native Blender saved:',SOURCE.stat().st_size,'bytes;',len(data['assets']),'editable assets')
