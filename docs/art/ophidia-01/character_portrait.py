"""Close portrait with a gentle head-focused lens over the preserved ferry."""
import bpy,json
from mathutils import Vector

FG_CAMERA='Foreground portrait camera'
CHARACTER_SCALE=1.40
ANCHOR=Vector((.50,.53,.830))
CHARACTER_OFFSET=Vector((.030,-.075,0))
FOREGROUND_DOLLY=.10
FOREGROUND_FSTOP=2.8

def transparent_camera_surface(obj):
    for slot in obj.material_slots:
        material=slot.material
        if not material or not material.use_nodes:continue
        for node in material.node_tree.nodes:
            if node.bl_idname in ['ShaderNodeBsdfGlass','ShaderNodeBsdfTransparent']:return True
            if node.bl_idname=='ShaderNodeBsdfPrincipled':
                transmission=node.inputs.get('Transmission Weight')
                if transmission and (transmission.is_linked or transmission.default_value>0):return True
    return False

def prepare_character_portrait(scene,collections):
    visibility={p:c.hide_viewport for p,c in collections.items()}
    for c in collections.values():c.hide_viewport=False
    bpy.context.view_layer.update()
    portrait=bpy.data.objects['Portrait game camera']
    if not bpy.data.objects.get(FG_CAMERA):
        camera=bpy.data.objects.new(FG_CAMERA,portrait.data.copy())
        scene.collection.objects.link(camera)
    else:camera=bpy.data.objects[FG_CAMERA]
    camera.matrix_world=portrait.matrix_world.copy()
    axis=portrait.matrix_world.to_quaternion()@Vector((0,0,-1))
    camera.location+=axis*FOREGROUND_DOLLY
    camera.data.dof.use_dof=True
    camera.data.dof.aperture_fstop=FOREGROUND_FSTOP
    camera['render_role']='Independent close character portrait: 10cm lens push, focus on head/cap/scarf, gentle rear-coil defocus'
    for pose,col in collections.items():
        if col.get('portrait_stage_revision'):raise ValueError('Character presentation scale already applied: '+pose)
        objects=list(col.objects)
        rig=bpy.data.objects.new('PortraitCharacter · '+pose+' seat-anchored presentation',None)
        col.objects.link(rig);rig.location=ANCHOR;rig.empty_display_type='PLAIN_AXES';rig.empty_display_size=.08
        bpy.context.view_layer.update()
        for obj in objects:
            world=obj.matrix_world.copy();obj.parent=rig;obj.matrix_world=world
        rig.scale=(CHARACTER_SCALE,)*3
        rig.location=ANCHOR+CHARACTER_OFFSET
        rig['role']='Presentation scale, not a claimed specimen size'
        focus=bpy.data.objects.new('Character focus · '+pose,None)
        col.objects.link(focus);focus.parent=rig
        focus.location=Vector(col['anatomy_head_center'])-ANCHOR+Vector((0,0,.015))
        focus.empty_display_size=.012
        focus['render_role']='Optical focus plane through head, cap edge and near scarf'
        col['portrait_focus_object']=focus.name
        col['portrait_stage_revision']='1.40x character, raised head and seat-anchored receiver shadows'
    camera.data.dof.focus_object=bpy.data.objects[collections['normal']['portrait_focus_object']]
    scene['character_layer_render']=json.dumps({'camera':FG_CAMERA,'raw_resolution':[720,1280],
        'use_dof':True,'fstop':FOREGROUND_FSTOP,'focus_objects':{p:c['portrait_focus_object'] for p,c in collections.items()},
        'scale':CHARACTER_SCALE,'character_translation':list(CHARACTER_OFFSET),'camera_dolly':FOREGROUND_DOLLY,
        'background_camera':portrait.name,
        'background_source':'ophidia/assets/cabin.webp','background_unchanged':True,
        'character_output_grid':[360,640],'background_output_grid':[180,320]},ensure_ascii=False)
    scene['snake_revision']='warm sand-brown skin and muted rust scarf, upright forebody and compact coils'
    for p,c in collections.items():c.hide_viewport=visibility[p]
    bpy.context.view_layer.update()
    return camera
