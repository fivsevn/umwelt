"""Reopen and inspect the retained pots without modifying the saved source."""
import bpy,bmesh,json,hashlib,math,sys
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT/'pots-retained-layout.blend'
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
catalog=json.loads((ROOT/'catalog.json').read_text())['items']
records={r['id']:r for r in json.loads((ROOT.parent/'retained-pot-records.json').read_text()) if not r.get('antique')}
report={'source':'Independent native Blender reopening','family':'pots-retained','assets':[],'errors':[],
        'texelsPerMetre':16,'layoutSHA256':hashlib.sha256((ROOT/'texture-layout.json').read_bytes()).hexdigest()}
checks=['name','note','sources','shape','pattern']
for item in catalog:
    id=item['id'];original=records[item['originalVesselId']]
    objects=[o for o in bpy.data.collections[id].objects if o.type=='MESH']
    result={'id':id,'parts':len(objects),'triangles':sum(len(p.vertices)-2 for o in objects for p in o.data.polygons),
            'closedSolids':True,'maxAbsoluteTexelError':0,'invalidUVEdges':0,'recordsRetained':True}
    for key in checks:
        if item[key]!=original.get(key,'plain' if key=='pattern' else ''):
            report['errors'].append(id+': source record '+key);result['recordsRetained']=False
    for obj in objects:
        bm=bmesh.new();bm.from_mesh(obj.data)
        invalid=[e for e in bm.edges if len(e.link_faces)!=2]
        volume=bm.calc_volume(signed=True)
        if invalid or volume<=0:
            report['errors'].append(obj.name+': closed solid / outward winding '+str((len(invalid),volume)))
            result['closedSolids']=False
        bm.free()
        uv=obj.data.uv_layers.active
        if uv is None:report['errors'].append(obj.name+': missing UV');continue
        for face in obj.data.polygons:
            if face.use_smooth:report['errors'].append(obj.name+': smooth shading')
            loops=list(face.loop_indices)
            for i,li in enumerate(loops):
                lj=loops[(i+1)%len(loops)]
                metres=(obj.data.vertices[obj.data.loops[li].vertex_index].co-obj.data.vertices[obj.data.loops[lj].vertex_index].co).length
                if metres<1e-7:continue
                pixels=(uv.data[li].uv-uv.data[lj].uv).length*2048
                absolute=abs(pixels-16*metres)
                result['maxAbsoluteTexelError']=max(result['maxAbsoluteTexelError'],absolute)
                if abs(pixels/metres-16)>.03 and absolute>.0003:result['invalidUVEdges']+=1
    if result['invalidUVEdges']:report['errors'].append(id+': physical UV')
    # Rays exercise the saved real cavity and drainage, independently of metadata.
    verts=[];faces=[]
    for obj in objects:
        if obj.get('part_role') not in ['pot-shell','interior floor']:continue
        start=len(verts);verts.extend(tuple(obj.matrix_world@v.co) for v in obj.data.vertices)
        faces.extend(tuple(start+i for i in p.vertices) for p in obj.data.polygons)
    tree=BVHTree.FromPolygons(verts,faces,all_triangles=False)
    z=item['surfaces'][0]['height'];origin_z=item['height']+.5
    surface=item['surfaces'][0]
    if original['id'] in ['foam','trough']:
        holes=surface['holes'];hole_xy=holes[0]['center'];floor_xy=(0,.045)
    else:hole_xy=(0,0);floor_xy=(.033,0)
    empty=tree.ray_cast(Vector((hole_xy[0],hole_xy[1],origin_z)),Vector((0,0,-1)),origin_z+.1)[0] is None
    loc,normal,_,_=tree.ray_cast(Vector((floor_xy[0],floor_xy[1],origin_z)),Vector((0,0,-1)),origin_z+.1)
    floor_ok=loc is not None and abs(loc.z-z)<.001 and normal.z>.9
    result['openDrainage']=empty;result['interiorFloorCorrect']=floor_ok
    if not empty:report['errors'].append(id+': drainage ray blocked')
    if not floor_ok:report['errors'].append(id+': interior floor ray '+str(tuple(loc) if loc is not None else None))
    if abs(item['boundsMin'][2])>1e-5:report['errors'].append(id+': placement bottom')
    report['assets'].append(result)
report['categories']={c:sum(a['category']==c for a in catalog) for c in ['收藏','栽培与盛放']}
report['parts']=sum(a['parts'] for a in report['assets'])
report['totalTriangles']=sum(a['triangles'] for a in report['assets'])
report['passed']=not report['errors']
(ROOT/'layout-reopened.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('RETAINED POT LAYOUT VERIFIED',len(report['assets']),report['parts'],'parts',report['categories'],report['passed'])
assert report['passed'],report['errors']

if '--render' in sys.argv:
    # Temporary presentation coordinates only; the native source is never saved.
    for i,item in enumerate(catalog):
        x=(i%6-2.5)*1.08;y=(2-i//6)*1.13
        col=bpy.data.collections[item['id']];col.hide_render=False;col.hide_viewport=False
        for obj in col.objects:obj.hide_set(False);obj.location+=Vector((x,y,0))
    for mat in bpy.data.materials:
        color=mat.get('base_hex','#a1a79c')
        mat.diffuse_color=tuple(int(color[k:k+2],16)/255 for k in (1,3,5))+(1,)
    scene=bpy.context.scene
    bpy.ops.object.camera_add(location=(0,-9,11))
    camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,.05))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.type='ORTHO';camera.data.ortho_scale=7.10;scene.camera=camera
    scene.render.engine='BLENDER_WORKBENCH';scene.render.resolution_x=1536;scene.render.resolution_y=1152;scene.render.resolution_percentage=100
    scene.display.shading.light='STUDIO';scene.display.shading.studio_light='paint.sl'
    scene.display.shading.color_type='MATERIAL';scene.display.shading.show_shadows=True
    scene.display.shading.show_cavity=True;scene.display.shading.cavity_type='WORLD'
    scene.display.shading.background_type='WORLD';scene.world.color=(.74,.72,.67)
    scene.render.image_settings.file_format='PNG';scene.render.filepath=str(ROOT/'geometry-review.png')
    bpy.ops.render.render(write_still=True)
