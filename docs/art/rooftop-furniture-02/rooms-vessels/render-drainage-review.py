"""Native review of final textured bowls, from above and below."""
import bpy,json
from pathlib import Path
from mathutils import Vector
p=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(p/'rooms-vessels.blend'))
cat=[a for a in json.loads((p/'catalog.json').read_text())['items'] if a['id'].startswith('antique-')]
ids={a['id'] for a in cat}
for col in bpy.data.collections:col.hide_viewport=False;col.hide_render=col.name not in ids
review=bpy.data.collections.new('Review environment');bpy.context.scene.collection.children.link(review)
def environment(o):
 for col in tuple(o.users_collection):col.objects.unlink(o)
 review.objects.link(o)
for i,a in enumerate(cat):
 for o in bpy.data.collections[a['id']].objects:o.location.x+=(i%4-1.5)*1.15;o.location.y+=(i//4-.5)*1.35
bpy.ops.object.camera_add(location=(3,-5,6));cam=bpy.context.object;environment(cam);cam.data.type='ORTHO';cam.data.ortho_scale=5.8;bpy.context.scene.camera=cam
for loc,power,size in [((2,-3,8),350,5),((-4,3,5),200,5),((0,-3,-5),300,5)]:
 bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;environment(light);light.data.energy=power;light.data.size=size;light.rotation_euler=(-light.location).to_track_quat('-Z','Y').to_euler()
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=24;s.world.color=(.45,.45,.45);s.render.resolution_x=1600;s.render.resolution_y=1000;s.render.resolution_percentage=100;s.view_settings.view_transform='Standard';s.render.image_settings.file_format='PNG'
for name,location in [('drainage-texture-review.png',(3,-5,6)),('drainage-underside-review.png',(3,-5,-5))]:
 cam.location=location;cam.rotation_euler=(Vector((0,0,.16))-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(p/name);bpy.ops.render.render(write_still=True)
