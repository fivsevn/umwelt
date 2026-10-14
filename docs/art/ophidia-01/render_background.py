"""Refresh the current cabin only after an intentional environment edit."""
import bpy,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'ophidia.blend'))
scene=bpy.context.scene
for pose in ('normal','curious','away','tongue'):
    bpy.data.collections['Snake · '+pose].hide_render=True
for obj in bpy.data.collections['Review · new saloon complementary cameras'].objects:
    if obj.type=='LIGHT':obj.hide_render=True
scene.camera=bpy.data.objects['Portrait game camera']
scene.render.film_transparent=False
scene.render.resolution_x=360;scene.render.resolution_y=640
scene.cycles.samples=128;scene.render.filepath=str(ROOT/'renders/cabin.png')
bpy.ops.render.render(write_still=True)
