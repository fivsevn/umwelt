"""Render review images in actual Blender without changing the editable source scene.
Run with Blender --background --python docs/art/rooftop-pixel-01/render_review.py.
These are offline material previews, not browser screenshots.
"""
from pathlib import Path
import bpy, json
from mathutils import Vector, Matrix

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'garden-sample.blend'))
scene=bpy.context.scene
camera=scene.camera
original_camera=camera.matrix_world.copy()
original_scale=camera.data.ortho_scale
daylight=bpy.data.objects['Preview / broad daylight']
background=scene.world.node_tree.nodes['Background']
glass=bpy.data.materials['Warm_glass'].node_tree.nodes['Principled BSDF']
bpy.ops.object.light_add(type='POINT',location=(1.37,.44,1.66))
lamp=bpy.context.object;lamp.data.color=(1,.66,.30);lamp.data.shadow_soft_size=.12
scene.render.resolution_x=1280;scene.render.resolution_y=960
scene.render.image_settings.file_format='JPEG';scene.render.image_settings.color_mode='RGB'
scene.render.image_settings.quality=93
scene.use_nodes=True
nodes=scene.node_tree.nodes;nodes.clear()
render=nodes.new('CompositorNodeRLayers')
flat=nodes.new('CompositorNodeRGB')
over=nodes.new('CompositorNodeAlphaOver')
output=nodes.new('CompositorNodeComposite')
scene.node_tree.links.new(flat.outputs[0],over.inputs[1])
scene.node_tree.links.new(render.outputs['Image'],over.inputs[2])
scene.node_tree.links.new(over.outputs[0],output.inputs[0])

def linear(value):return value/12.92 if value<=.04045 else ((value+.055)/1.055)**2.4
def lighting(dusk):
 background.inputs[0].default_value=(.49,.55,.60,1) if dusk else (.77,.79,.72,1)
 background.inputs[1].default_value=.38 if dusk else .7
 daylight.data.energy=150 if dusk else 450
 glass.inputs['Emission Strength'].default_value=2.0 if dusk else .3
 lamp.data.energy=18 if dusk else 0
 flat.outputs[0].default_value=tuple(linear(v/255) for v in ((219,222,216) if dusk else (234,229,219)))+(1,)

def view(asset):
 composed=bpy.data.collections['COMPOSED_PREVIEW'];composed.hide_render=asset!='scene';composed.hide_viewport=asset!='scene'
 for name in ['ceramic-pot','metal-rack','doorway','scene-set']:
  bpy.data.collections[name].hide_render=name!=asset
  bpy.data.collections[name].hide_viewport=name!=asset
 bpy.context.view_layer.update()
 if asset=='scene':
  camera.matrix_world=original_camera;camera.data.ortho_scale=original_scale;return
 graph=bpy.context.evaluated_depsgraph_get()
 evaluated=[obj.evaluated_get(graph) for obj in bpy.data.collections[asset].objects]
 points=[obj.matrix_world@Vector(p) for obj in evaluated for p in obj.bound_box]
 center=Vector([(min(p[i] for p in points)+max(p[i] for p in points))/2 for i in range(3)])
 direction=Vector((5,-7,4.8)).normalized()
 rotation=(-direction).to_track_quat('-Z','Y').to_matrix()
 camera.matrix_world=Matrix.Translation(center+direction*10)@rotation.to_4x4()
 right=rotation@Vector((1,0,0));up=rotation@Vector((0,1,0))
 projected=[((p-center).dot(right),(p-center).dot(up)) for p in points]
 width=max(p[0] for p in projected)-min(p[0] for p in projected)
 height=max(p[1] for p in projected)-min(p[1] for p in projected)
 camera.data.ortho_scale=max(width,height*(1280/960))*1.25

records=[]
for filename,asset,dusk in [('scene-day','scene',False),('scene-dusk','scene',True),
                             ('ceramic-pot','ceramic-pot',False),('metal-rack','metal-rack',False),
                             ('doorway-dusk','doorway',True),('doorway-day','doorway',False)]:
 view(asset);lighting(dusk)
 scene.render.filepath=str(ROOT/'review'/(filename+'.jpg'))
 bpy.ops.render.render(write_still=True)
 records.append({'file':'review/'+filename+'.jpg','asset':asset,'dusk':dusk,'dimensions':[1280,960]})
(ROOT/'render-review.json').write_text(json.dumps({'revision':3,'software':'Blender '+bpy.app.version_string,'source':'garden-sample.blend','kind':'offline material preview; browser lighting can differ','images':records},indent=2)+'\n')
