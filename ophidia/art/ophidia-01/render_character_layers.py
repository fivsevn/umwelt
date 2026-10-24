"""Render close head-focused portraits without changing the current background.

The foreground lens pushes forward slightly and follows each pose's head. Its
weak depth of field leaves face/textiles clear and gently softens the rear coil.
"""
import bpy,sys,json,shutil,hashlib
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parent;sys.path.insert(0,str(ROOT))
from character_portrait import CHARACTER_SCALE,CHARACTER_OFFSET,transparent_camera_surface
from character_shadow import begin_receiver_pass
from compose_scene import compose
compose();scene=bpy.context.scene
SNAKE_SOURCE=ROOT.parent/'snakes/boaedon-capensis/boaedon-capensis.blend'
source_sha=hashlib.sha256(SNAKE_SOURCE.read_bytes()).hexdigest()
BG=bpy.data.objects['Portrait game camera'];FG=bpy.data.objects['Foreground portrait camera']
assert BG.data.dof.use_dof and FG.data.dof.use_dof
poses={p:bpy.data.collections['Snake · '+p] for p in ['normal','curious','away','tongue']}
CABIN=bpy.data.collections['01 · Ferry cabin / wood, vinyl, metal'];OUTSIDE=bpy.data.collections['02 · Cold estuary / winter light']
review=bpy.data.collections['Review · new saloon complementary cameras']
review_samples=int(sys.argv[sys.argv.index('--review-samples')+1]) if '--review-samples' in sys.argv else 64
portrait_samples=int(sys.argv[sys.argv.index('--portrait-samples')+1]) if '--portrait-samples' in sys.argv else 128
def pose(name):
 for p,c in poses.items():c.hide_render=p!=name;c.hide_viewport=p!=name
 FG.data.dof.focus_object=bpy.data.objects[poses[name]['portrait_focus_object']]
 bpy.context.view_layer.update()
def render(name,cam,width=1280,height=800):
 scene.camera=cam;scene.render.resolution_x=width;scene.render.resolution_y=height
 scene.cycles.samples=portrait_samples if width==720 else review_samples
 roles=set();states=[]
 if name in ['complete-booth','booth-reverse','grey-booth']:roles={'near_wall','ceiling','upper_deck','outer_columns'}
 if name=='booth-reverse':roles.add('saloon_end')
 if name in ['vessel-overview','vessel-plan']:roles={'near_wall','ceiling','upper_deck','outer_columns','saloon_end','entrance_bulkhead'}
 for o in CABIN.objects:
  if o.get('cabin_role') in roles or name in ['vessel-overview','vessel-plan'] and 'Aisle handrail' in o.name:
   states.append((o,o.visible_camera,o.visible_shadow));o.visible_camera=False;o.visible_shadow=False
 if name in ['vessel-overview','vessel-plan','complete-booth','booth-reverse','grey-booth']:
  for o in OUTSIDE.objects:states.append((o,o.visible_camera,o.visible_shadow));o.visible_camera=False;o.visible_shadow=False
 scene.render.filepath=str(ROOT/'renders'/(name+'.png'));bpy.ops.render.render(write_still=True)
 for o,c,s in states:o.visible_camera=c;o.visible_shadow=s
for o in review.objects:
 if o.type=='LIGHT':o.hide_render=True
assert (ROOT/'renders/cabin.png').is_file(), 'Missing current cabin background'
scene.render.film_transparent=True
focus_depths={}
for p in poses:
 pose(p)
 optical_axis=FG.matrix_world.to_quaternion()@Vector((0,0,-1))
 focus_depths[p]=optical_axis.dot(FG.data.dof.focus_object.matrix_world.translation-FG.matrix_world.translation)
 restore_receivers,shadow_record=begin_receiver_pass(scene,CABIN,OUTSIDE)
 render('snake-'+p+'-receivers',FG,720,1280)
 restore_receivers()
 # A second native pass retains exactly the clear animal silhouette. It
 # lets the exporter suppress low-alpha catcher sampling noise without
 # thresholding fine cloth fibres or the animal's antialiased edge.
 layer=scene.view_layers[0]
 layer.layer_collection.children[CABIN.name].holdout=True
 layer.layer_collection.children[OUTSIDE.name].holdout=True
 glass_states=[(o,o.visible_camera) for o in CABIN.objects if transparent_camera_surface(o)]
 for o,_ in glass_states:o.visible_camera=False
 render('snake-'+p+'-portrait',FG,720,1280)
 for o,old in glass_states:o.visible_camera=old
 layer.layer_collection.children[CABIN.name].holdout=False
 layer.layer_collection.children[OUTSIDE.name].holdout=False
scene.render.film_transparent=False;pose('normal')
# The outer exporter creates the raw two-pass preview with Pillow; Blender's
# bundled Python remains self-contained and needs no added image libraries.
if '--portrait-only' not in sys.argv:
 for o in review.objects:
  if o.type=='LIGHT':o.hide_render=False
 cams={'complete-booth':'Review · complete booth','booth-reverse':'Review · reverse booth','interior-overall':'Review · actual saloon','saloon-depth':'Review · continuous aisle','cup-detail':'Review · real-scale ceramic','vessel-overview':'Review · vessel restaurant cutaway','vessel-plan':'Review · vessel floor plan','exterior-deck':'Review · sheltered exterior deck','service-counter':'Review · working service counter','entrance-fittings':'Review · passenger threshold and fittings','snake-detail':'Review · snake natural anatomy'}
 for name,cam in cams.items():render(name,bpy.data.objects[cam])
 for name,cam in [('character-face-detail','Character anatomy detail camera'),('character-cloth-detail','Character textile detail camera')]:
  if bpy.data.objects.get(cam):render(name,bpy.data.objects[cam])
for o in review.objects:
 if o.type=='LIGHT':o.hide_render=True
scene.camera=BG;scene.render.resolution_x=360;scene.render.resolution_y=640;scene.cycles.samples=96
scene.render.filepath='//renders/source-preview.png'
# Render passes are temporary. Keep the generated composition and both libraries untouched.
assert source_sha==hashlib.sha256(SNAKE_SOURCE.read_bytes()).hexdigest(), 'Snake source changed during portrait rendering'
(ROOT/'portrait-layer-render.json').write_text(json.dumps({'source_reopened':True,'snake_source_sha256':source_sha,'background_camera':BG.name,'background_native_dof':True,'background_focus_distance':BG.data.dof.focus_distance,'background_fstop':BG.data.dof.aperture_fstop,'background_raw_preserved':'renders/cabin.png','foreground_camera':FG.name,'foreground_native_dof':FG.data.dof.use_dof,'foreground_fstop':FG.data.dof.aperture_fstop,'foreground_focus_axial_depth_m':focus_depths,'foreground_focus_objects':{p:c['portrait_focus_object'] for p,c in poses.items()},'foreground_camera_push_m':.10,'foreground_raw_resolution':[720,1280],'foreground_lens_and_orientation_same_as_background':True,'foreground_projection_same_as_background':False,'four_poses_rendered':list(poses),'foreground_glazing_camera_rays_temporarily_excluded':shadow_record['glazing_camera_rays_temporarily_excluded'],'all_glazing_visibility_restored_before_save':True,'native_contact_shadows':shadow_record,'character_presentation_scale':CHARACTER_SCALE,'character_translation':list(CHARACTER_OFFSET),'raw_preview':'Native character and physical booth receiver shadows over preserved cabin, before pixel finishing.'},ensure_ascii=False,indent=2)+'\n')
print('SAVED_SHARP_CHARACTER_LAYERS')
import runpy
runpy.run_path(str(ROOT/'render_table_occluder.py'),run_name='__main__')
