import bpy,math,sys,json
from pathlib import Path
from mathutils import Vector
p=Path(__file__).resolve().parent
openview='open' in sys.argv
finalview='final' in sys.argv
bpy.ops.wm.open_mainfile(filepath=str(p/('ceramics-extra.blend' if finalview else 'ceramics-extra-layout.blend')))
for col in bpy.data.collections:col.hide_viewport=False;col.hide_render=False
cat=json.loads((p/'catalog.json').read_text())['items']
for i,a in enumerate(cat):
 dx=(i%4-1.5)*1.13;dy=(i//4-1.5)*1.40
 for o in bpy.data.collections[a['id']].objects:
  o.location.x+=dx;o.location.y+=dy
  if openview and o.name in a['removableParts']:o.location.z+=.45
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.006));plane=bpy.context.object
mat=bpy.data.materials.new('Neutral');mat.diffuse_color=(.73,.75,.71,1);plane.data.materials.append(mat)
bpy.ops.object.camera_add(location=(4,-7,8));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.22))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=7.7;bpy.context.scene.camera=cam
for loc,power,size in [((2,-3,8),400,6),((-4,2,6),200,5)]:
 bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.data.energy=power;l.data.shape='DISK';l.data.size=size;l.rotation_euler=(Vector((0,0,.2))-l.location).to_track_quat('-Z','Y').to_euler()
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=24;s.world.color=(.45,.45,.45);s.render.resolution_x=1800;s.render.resolution_y=1800;s.render.resolution_percentage=100;s.view_settings.view_transform='Standard';s.render.image_settings.file_format='PNG';s.render.filepath=str(p/('texture-interior-review.png' if openview else 'texture-review.png') if finalview else ('interior-review.png' if openview else 'geometry-review.png'));bpy.ops.render.render(write_still=True)
