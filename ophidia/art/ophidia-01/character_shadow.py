"""Bake native seat/backrest contact shadows into the transparent portrait.

Use the real first booth as Cycles shadow receivers, retaining its geometry,
materials and the existing vessel lighting. Restore every temporary property
before saving or rendering native review views. No painted screen-space oval.
"""
import bpy
from character_portrait import transparent_camera_surface

def begin_receiver_pass(scene, cabin, outside):
    layer=scene.view_layers[0]
    collections=[layer.layer_collection.children[c.name] for c in (cabin,outside)]
    old_collections=[c.holdout for c in collections]
    old_pass=layer.cycles.use_pass_shadow_catcher
    # The Combined RGBA approximation preserves the actual soft contact
    # shadows while the separate full reflection pass is unnecessary here.
    layer.cycles.use_pass_shadow_catcher=False
    for c in collections:c.holdout=False
    states=[];receivers=[];glass=[]
    for obj in list(cabin.objects)+list(outside.objects):
        if obj.type not in ('MESH','CURVE','SURFACE','FONT'):continue
        states.append((obj,obj.is_holdout,obj.is_shadow_catcher,obj.visible_camera))
        receiver=(obj.name.startswith('Fresh · aft window booth') and obj.type=='MESH'
                  and ('stitched seat cushion' in obj.name or 'pliant back upholstery' in obj.name))
        # Every pre-existing vessel surface belongs to the photographed
        # plate. Treat it as a catcher even when its camera rays are hidden,
        # so static booth trim cannot cast a second shadow into the overlay.
        obj.is_shadow_catcher=True
        obj.is_holdout=False
        obj.visible_camera=receiver
        if receiver:receivers.append(obj.name)
        if transparent_camera_surface(obj):
            obj.visible_camera=False;glass.append(obj.name)
    def restore():
        for obj,holdout,catcher,camera in states:
            obj.is_holdout=holdout;obj.is_shadow_catcher=catcher;obj.visible_camera=camera
        for c,old in zip(collections,old_collections):c.holdout=old
        layer.cycles.use_pass_shadow_catcher=old_pass
    return restore,{'native_receiver_meshes':receivers,'receiver_count':len(receivers),
        'method':'Cycles Combined RGBA native shadow catcher on original first booth meshes',
        'glazing_camera_rays_temporarily_excluded':len(glass),
        'receiver_geometry_materials_unchanged':True,'temporary_properties_restored_before_save':True}
