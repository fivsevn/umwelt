"""Native Blender top-down RGBA render with exact existing 2D contacts."""
import bpy,json
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
from png_output import sanitize_png
p=Path(__file__).resolve().parent;root=p.parent;U=5.6/3;density=16*U
bpy.ops.wm.open_mainfile(filepath=str(p/'room-background.blend'))
for col in bpy.data.collections:col.hide_viewport=False;col.hide_render=False
bpy.ops.object.camera_add(location=((320-300)/density,-(260-216)/density,10))
cam=bpy.context.object;cam.rotation_euler=(0,0,0);cam.data.type='ORTHO';cam.data.sensor_fit='HORIZONTAL';cam.data.ortho_scale=640/density;bpy.context.scene.camera=cam
for loc,power,size in [((-3,-5,10),400,7),((3,5,9),250,6)]:
 bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.data.energy=power;light.data.size=size;light.rotation_euler=(-light.location).to_track_quat('-Z','Y').to_euler()
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48;scene.world.color=(.5,.5,.5);scene.render.resolution_x=640;scene.render.resolution_y=520;scene.render.resolution_percentage=100;scene.render.pixel_aspect_x=scene.render.pixel_aspect_y=1;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.image_settings.color_depth='8';scene.render.film_transparent=True;scene.render.use_stamp=False;scene.view_settings.view_transform='Standard';scene.render.filepath=str(root/'preview/assets/room-background-2d.png');scene.update_tag();bpy.context.view_layer.update()
rows=[]
for x,z,expected in [(-5,-7,[220,104]),(5,-7,[380,104]),(5,7,[380,328]),(-5,7,[220,328]),(0,0,[300,216])]:
 q=world_to_camera_view(scene,cam,Vector((x/U,-z/U,.0105/U)));pixel=[q.x*640,(1-q.y)*520]
 rows.append(dict(runtime=[x,z],expected=expected,actual=pixel,matches=all(abs(pixel[k]-expected[k])<.0001 for k in range(2))))
report=dict(source='Native Blender saved-source orthographic render; no Python raster drawing',sourceBlend='room-background.blend',image='preview/assets/room-background-2d.png',size=[640,520],rgbaTransparentExterior=True,floorPixelBounds=[220,104,380,328],floorPixelSize=[160,224],floorCentrePixels=[300,216],screenPixelsPerRuntimeUnit=16,runtimeUnitsPerMetre=U,cameraSourcePosition=list(cam.location),orthographicWidthMetres=cam.data.ortho_scale,coordinateChecks=rows,passed=all(row['matches'] for row in rows))
if not report['passed']:raise RuntimeError('Fallback contact projection mismatch')
bpy.ops.render.render(write_still=True)
report.update(sanitize_png(scene.render.filepath),nativeRenderComplete=True)
(p/'fallback-render-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report))
