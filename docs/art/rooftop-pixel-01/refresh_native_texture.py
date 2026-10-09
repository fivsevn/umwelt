"""Reload the Pixelorama export in the saved Blend, preserving all scene data."""
from pathlib import Path
import bpy,json,hashlib
ROOT=Path(__file__).resolve().parent
SOURCE=ROOT/'garden-sample.blend'
ATLAS=ROOT.parents[2]/'rooftop/previews/pixel-01/assets/garden-atlas.png'
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))

def signature():
    meshes=[]
    for mesh in bpy.data.meshes:
        meshes.append({'name':mesh.name,'vertices':[list(v.co) for v in mesh.vertices],
          'edges':[list(e.vertices) for e in mesh.edges],
          'polygons':[(list(p.vertices),p.material_index,p.use_smooth) for p in mesh.polygons],
          'uv':{l.name:[list(p.uv) for p in l.data] for l in mesh.uv_layers},
          'colour':{l.name:[list(p.color) for p in l.data] for l in mesh.color_attributes}})
    objects=[{'name':o.name,'matrix':[list(row) for row in o.matrix_world],
        'data':o.data.name if o.data else None,'hide_render':o.hide_render,'hide_viewport':o.hide_viewport,
        'collections':sorted(c.name for c in o.users_collection)} for o in bpy.data.objects]
    collections=[(c.name,c.hide_render,c.hide_viewport,sorted(o.name for o in c.objects)) for c in bpy.data.collections]
    cameras=[(c.name,c.type,c.ortho_scale,c.lens,c.clip_start,c.clip_end) for c in bpy.data.cameras]
    shaders=[]
    for mat in bpy.data.materials:
        if not mat.use_nodes:continue
        nodes=[]
        for n in mat.node_tree.nodes:
            inputs=[]
            for i in n.inputs:
                if hasattr(i,'default_value'):
                    v=i.default_value
                    inputs.append((i.name,list(v) if hasattr(v,'__len__') and not isinstance(v,str) else v))
            nodes.append((n.name,n.bl_idname,inputs,getattr(n,'interpolation',None),getattr(n,'layer_name',None)))
        shaders.append((mat.name,nodes,[(l.from_node.name,l.from_socket.name,l.to_node.name,l.to_socket.name) for l in mat.node_tree.links]))
    encoded=json.dumps({'meshes':meshes,'objects':objects,'collections':collections,'cameras':cameras,'shaders':shaders},sort_keys=True).encode()
    return hashlib.sha256(encoded).hexdigest()

before=signature()
images={n.image for name in ['Shared_pixel_atlas','Warm_glass'] for n in bpy.data.materials[name].node_tree.nodes if n.type=='TEX_IMAGE'}
assert len(images)==1
image=next(iter(images))
if image.packed_file:image.unpack(method='REMOVE')
image.filepath=str(ATLAS);image.reload()
assert list(image.size)==[128,128]
image.pack();image.filepath=bpy.path.relpath(str(ATLAS),start=str(ROOT))
assert bytes(image.packed_file.data)==ATLAS.read_bytes()
assert signature()==before,'Texture refresh changed scene data.'
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE),compress=True)
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
assert signature()==before,'Saved scene differs from the approved geometry/UV/shading.'
SOURCE.with_suffix('.blend1').unlink(missing_ok=True)
check=json.loads((ROOT/'facet-source-check.json').read_text())
check['revision']=8
check['revision_7_geometry_retained']=True
check['texture_only_refresh']={'scene_geometry_uv_placements_camera_shaders_unchanged':True,'scene_data_sha256':before,
 'packed_atlas_sha256':hashlib.sha256(ATLAS.read_bytes()).hexdigest(),'packed_bytes_equal_native_export':True,
 'source_saved_and_reopened_in_actual_blender':True,'atlas_dimensions':[128,128]}
(ROOT/'facet-source-check.json').write_text(json.dumps(check,indent=2)+'\n')
print('Verified texture-only saved-source refresh:',before)
