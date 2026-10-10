"""Edit revision-3's original .blend in actual Blender; never rebuild the scene.

Only change four plaster meshes' UVs, and refresh their existing packed atlas.
Geometry, object names, collections, transforms, cameras and lights are preserved.
"""
from pathlib import Path
import bpy, hashlib, json, struct

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT.parents[2] / 'rooftop/previews/pixel-01/assets'
SOURCE = ROOT / 'garden-sample.blend'
EXPECTED = '85699bcb781c36b1a2ff89a6c6cdc49ef9cb8dafcc892f246108b08c88e55cad'
if hashlib.sha256(SOURCE.read_bytes()).hexdigest() != EXPECTED:
    raise SystemExit('This one-time source edit requires the saved revision-3 .blend.')
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
bpy.context.view_layer.update()

def signature():
    objects = {o.name: {'type':o.type, 'matrix':list(v for row in o.matrix_basis for v in row),
                      'collections':sorted(c.name for c in o.users_collection)} for o in bpy.data.objects}
    meshes = {m.name: {'vertices':[list(v.co) for v in m.vertices],
                       'faces':[list(p.vertices) for p in m.polygons]} for m in bpy.data.meshes}
    cameras = {c.name: {'ortho_scale':c.ortho_scale, 'type':c.type, 'lens':c.lens} for c in bpy.data.cameras}
    lights = {l.name: {'energy':l.energy, 'color':list(l.color), 'type':l.type} for l in bpy.data.lights}
    return hashlib.sha256(json.dumps([objects,meshes,cameras,lights],sort_keys=True).encode()).hexdigest()

before = signature()
wall_tiles = {'Wall / left plaster pier':4, 'Wall / right plaster pier':15,
              'Wall / lintel':4, 'Wall / short return':15}
records = []
for name,tile in wall_tiles.items():
    obj=bpy.data.objects[name]
    assert obj.parent is None, 'UV height expects the existing unparented wall objects.'
    coords=[v.co for v in obj.data.vertices]
    minima=[min(v[k] for v in coords) for k in range(3)]
    uv=obj.data.uv_layers.active.data
    for polygon in obj.data.polygons:
        axis=max(range(3),key=lambda k:abs(polygon.normal[k]))
        axes=[k for k in range(3) if k!=axis]
        for loop in polygon.loop_indices:
            v=obj.data.vertices[obj.data.loops[loop].vertex_index].co
            if axis != 2:
                horizontal=axes[0]
                u=2+(v[horizontal]-minima[horizontal])*25
                # Shared world-height anchoring puts lower dirt at the real foot
                # of each wall, including the short return; square 4cm texels.
                y=60-(obj.matrix_basis@v).z*25
            else:
                # Top surfaces are physically shallow, so use a small quiet field.
                u=33+(v[0]-minima[0])*6
                y=37+(v[1]-minima[1])*6
            u=max(2,min(60,u));y=max(2,min(60,y))
            uv[loop].uv=((tile%4*64+u)/256,1-(tile//4*64+y)/256)
    records.append({'object':name,'tile':tile,'vertical_face_texels_per_metre':25})

image=bpy.data.images['garden-atlas.png']
if image.packed_file: image.unpack(method='REMOVE')
image.filepath=str(ASSETS/'garden-atlas.png');image.reload();image.pack()
assert tuple(image.size)==(256,256)
image.filepath=bpy.path.relpath(str(ASSETS/'garden-atlas.png'))
scene=bpy.context.scene
scene['atlas_workflow']='Original PXO edited in place; sixteen 64px cells in a 256px shared atlas; five plaster tones; 25 square texels/metre on walls; nearest sampling'
scene['revision_4_source_sha256']=EXPECTED
assert signature()==before, 'Original geometry, transforms, lights or camera changed.'
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE),compress=True)

# Export temporary copies of the original doorway objects, keeping all editable
# parts and linked composition meshes in the source file untouched.
collection=bpy.data.collections['doorway']
collection.hide_viewport=False
objects=list(collection.objects)
exported=[]
for material_name in ['Shared_pixel_atlas','Warm_glass']:
    material=bpy.data.materials[material_name]
    bpy.ops.object.select_all(action='DESELECT')
    copies=[]
    for original in objects:
        if original.data.materials[0]!=material:continue
        duplicate=original.copy();duplicate.data=original.data.copy()
        collection.objects.link(duplicate);duplicate.select_set(True);copies.append(duplicate)
    if not copies:continue
    bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join()
    joined=bpy.context.object
    joined.name='doorway'+('/Warm_glass' if material_name=='Warm_glass' else '/Atlas')
    exported.append(joined)
bpy.ops.object.select_all(action='DESELECT')
for obj in exported:obj.select_set(True)
bpy.context.view_layer.objects.active=exported[0]
path=ASSETS/'doorway.glb'
bpy.ops.export_scene.gltf(filepath=str(path),use_selection=True,export_format='GLB',
    export_materials='NONE',export_texcoords=True,export_normals=True,export_extras=True,export_yup=True)
blob=path.read_bytes();length=struct.unpack_from('<I',blob,12)[0]
gltf=json.loads(blob[20:20+length])
triangles=sum(gltf['accessors'][p['indices']]['count']//3 for m in gltf['meshes'] for p in m['primitives'])
assert triangles==1576
for obj in exported:bpy.data.objects.remove(obj,do_unlink=True)

manifest_path=ASSETS/'asset-manifest.json'
manifest=json.loads(manifest_path.read_text())
manifest['version']=4
manifest['status']='direction-approved-fine-pixel-weathering-review-pending'
manifest['atlas'].update(width=256,height=256,tile=64,bytes=(ASSETS/'garden-atlas.png').stat().st_size)
manifest['atlas']['wall_texels_per_metre']=25
for asset in manifest['assets']:
    asset['bytes']=(ASSETS/(asset['id']+'.glb')).stat().st_size
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(ROOT/'native-source-edit.json').write_text(json.dumps({
    'revision':4,'blender':bpy.app.version_string,'opened_existing_source':True,
    'input_blend_sha256':EXPECTED,'geometry_transforms_lights_camera_unchanged':True,
    'source_geometry_signature':before,'edited_uv_objects':records,
    'packed_atlas_dimensions':list(image.size),'separate_editable_parts_preserved':True,
    'source_saved_before_temporary_export_copies':True,
},indent=2)+'\n')
backup=SOURCE.with_suffix('.blend1')
if backup.exists():backup.unlink()
print('Edited and saved original Blender source:',SOURCE)
