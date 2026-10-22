"""Render the real table matte through the preserved background camera.

Independent sharp portrait staging uses a slight camera dolly. The original
background table must still occlude it at the original 2px pixel boundary.
Read-only: restore by closing the file without saving any scene change.
"""
import bpy
from pathlib import Path
ROOT=Path(__file__).resolve().parent
import sys
sys.path.insert(0,str(ROOT))
from compose_scene import asset_source
bpy.ops.wm.open_mainfile(filepath=str(asset_source('../scenes/ferry-cabin/ferry-cabin.blend')))
scene=bpy.context.scene
visible=[]
for obj in bpy.data.objects:
    if obj.type not in ('MESH','CURVE','SURFACE','FONT'):continue
    keep=obj.name in ('Fresh · real dining tabletop',
        'Fresh · dark fine tabletop edge binding','Fresh · under-top rounded support')
    obj.visible_camera=keep
    if keep:visible.append(obj.name)
scene.camera=bpy.data.objects['Portrait game camera']
scene.render.film_transparent=True
scene.render.resolution_x=180;scene.render.resolution_y=320
scene.render.resolution_percentage=100;scene.cycles.samples=32
scene.render.filepath=str(ROOT/'renders/foreground-table-matte.png')
bpy.ops.render.render(write_still=True)
print('ACTUAL_TABLE_MATTE',len(visible),scene.camera.name)
