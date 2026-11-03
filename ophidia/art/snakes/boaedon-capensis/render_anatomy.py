"""Neutral, unclothed anatomy views; never saves temporary inspection settings."""
import argparse,sys
from pathlib import Path
import bpy
from mathutils import Vector,Matrix
p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--views',nargs='+',default=['side','dorsal','ventral']);p.add_argument('--samples',type=int,default=48)
a=p.parse_args(sys.argv[sys.argv.index('--')+1:]);bpy.ops.wm.open_mainfile(filepath=str(a.source))
c=bpy.data.collections['Snake · normal']
for cc in bpy.data.collections:
 if cc.name.startswith('Snake ·'):cc.hide_render=cc!=c;cc.hide_viewport=cc!=c
for ob in c.objects:
 if ob.get('snake_garment'):ob.hide_render=True
skin=next(o for o in c.objects if o.get('snake_complete_skin'))
bpy.context.view_layer.update()
origin=Vector(c['final_head_frame_origin']);b=list(c['final_head_frame_basis']);B=Matrix((b[:3],b[3:6],b[6:]));M=skin.matrix_world.copy()
def W(v):return M@(origin+B@Vector(v))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=a.samples;scene.cycles.use_denoising=True
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=0
scene.render.resolution_x=1440;scene.render.resolution_y=960;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
world=bpy.data.worlds.new('Anatomy neutral studio');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.11,.12,.14,1);world.node_tree.nodes['Background'].inputs[1].default_value=.5;scene.world=world
for name,position,power,size in [('key',(-.08,-.28,.35),30,.22),('fill',(.12,.18,.12),18,.16),('edge',(-.25,.05,.20),28,.18),('underside',(.04,-.15,-.28),10,.18)]:
 data=bpy.data.lights.new(name,'AREA');data.energy=power*.25;data.shape='DISK';data.size=size
 ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob);ob.location=W(position);ob.rotation_euler=(W((-.04,0,0))-ob.location).to_track_quat('-Z','Y').to_euler()
cam=bpy.data.objects.new('Anatomy camera',bpy.data.cameras.new('Anatomy camera'));scene.collection.objects.link(cam);cam.data.type='ORTHO';cam.data.ortho_scale=.33;cam.data.lens=70;scene.camera=cam
views={'side':((.005,-.5,.035),(-.04,0,0)), 'dorsal':((-.04,0,.55),(-.04,0,0)), 'ventral':((-.04,-.015,-.18),(-.04,0,0)), 'three-quarter':((.22,-.5,.16),(-.04,0,0))}
a.output.mkdir(exist_ok=True,parents=True)
for name in a.views:
 position,target=views[name];cam.location=W(position);cam.rotation_euler=(W(target)-cam.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(a.output/(name+'.png'));bpy.ops.render.render(write_still=True);print('ANATOMY_VIEW',scene.render.filepath,flush=True)
