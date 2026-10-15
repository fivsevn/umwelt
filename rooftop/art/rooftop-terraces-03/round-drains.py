"""Locally correct the two saved drains for the scene's anisotropic conversion.
Keep their centres and every other mesh/UV unchanged. Native charts remain 16px/m.
"""
from pathlib import Path
HERE=Path(__file__).resolve().parent
# Reuse source-opening/material-binding helpers, never the previous layout edits.
previous=(HERE/'relocate-drains.py').read_text()
exec(compile(previous.split("if mode=='layout':",1)[0],str(HERE/'relocate-drains.py'),'exec'))

if mode=='layout':
 assert bpy.context.scene.get('detailRevision')==4,'Edit only the approved fourth revision.'
 changed=[ob for ob in a.objects if '-round-drain-' in ob.name]
 assert len(changed)==10
 names={ob.name for ob in changed}
 before={ob.name:digest(ob) for ob in a.objects if ob.name not in names}
 top=bpy.context.scene['floorSurfaceHeight'];centres={}
 for side in ('north','south'):
  ring=bpy.data.objects[f'terraces/{side}-round-drain-ring']
  cx,cy=ring['drainCentre'];centres[side]=[cx,cy]
  for ob in changed:
   if not ob.name.startswith('terraces/'+side):continue
   role=ob['part_role']
   for vertex in ob.data.vertices:
    p=vertex.co;dx,dy=p.x-cx,p.y-cy;r=math.hypot(dx,dy)
    if role=='round-drain-rim':
     old=min((.18,.161,.143),key=lambda value:abs(r-value))
     radius={.18:.45,.161:.435,.143:.405}[old]
     p.x=cx+dx/r*radius*sx;p.y=cy+dy/r*radius*sy
    else:
     scale=.406/.144 if role=='round-drain-interior' else .407/.145
     p.x=cx+dx*scale*sx;p.y=cy+dy*scale*sy
    p.z=top+(p.z-top)*.25
   normals(ob)
  ring['sceneRadius']=.45;ring['sceneRoundnessCorrected']=True
 b.fields=[]
 for ob in changed:b.record(a,ob,ob['finish'],ob['part_role'])
 b.pack();newfields=b.fields
 for f in newfields:
  f['y']+=layout['usedRows'];uv=bpy.data.objects[f['object']].data.uv_layers.active
  for li in f['loopIndices']:uv.data[li].uv.y-=layout['usedRows']/1024
 b.usedRows+=layout['usedRows'];assert b.usedRows<=1024
 kept=[]
 for f in layout['fields']:
  name=f['id'].rsplit(':',1)[0]
  if name in names:continue
  f['object']=name;kept.append(f)
 b.fields=kept+newfields;b.plans()
 (b.path/'revision-five-fields.json').write_text(json.dumps([f['id']for f in newfields]))
 assert all(digest(bpy.data.objects[name])==sha for name,sha in before.items())
 report=dict(editedObjects=sorted(names),untouchedGeometryAndUv=len(before),centresUnchanged=centres,
  sceneDiameter=.9,previousSceneDiameters=[.36/sx,.36/sy],outerAreaRatio=.45**2/(.18**2/sx/sy),
  lipRiseMetres=.0025,previousLipRiseMetres=.010,paintedCharts=len(newfields))
 (HERE/'round-drain-revision.json').write_text(json.dumps(report,indent=2)+'\n')
 bpy.context.scene['detailRevision']=5
 bpy.ops.wm.save_as_mainfile(filepath=str(b.path/'terraces-layout.blend'))
 print('ROUND DRAIN REVISION',len(changed),'edited meshes;',len(before),'preserved meshes;',len(newfields),'new charts')
else:
 # The final phase only binds the current native atlas and exports saved geometry.
 final=previous.split("\nelse:\n assert bpy.context.scene.get('detailRevision')==4",1)[1]
 final="assert bpy.context.scene.get('detailRevision')==5\n"+''.join(line[1:]+'\n' if line.startswith(' ') else line+'\n' for line in final.splitlines())
 exec(compile(final,str(HERE/'relocate-drains.py'),'exec'))
