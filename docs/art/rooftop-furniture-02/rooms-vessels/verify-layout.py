"""Independent native source reopening before Pixelorama painting freezes UVs."""
import bpy,json,hashlib
from pathlib import Path
p=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(p/'rooms-vessels-layout.blend'))
report=dict(source='Independent native Blender reopening',file='rooms-vessels-layout.blend',texelsPerMetre=16,assets=[],errors=[])
for col in bpy.data.collections:
 objs=[o for o in col.objects if o.type=='MESH' and o.get('asset_id')]
 if not objs:continue
 errs=0;maxerr=0;maxabs=0;edges=0
 for o in objs:
  if o.modifiers:report['errors'].append(o.name+':unapplied modifier')
  mesh=o.data;uv=mesh.uv_layers.active
  if uv is None:report['errors'].append(o.name+':missing UV');continue
  for f in mesh.polygons:
   if f.use_smooth:report['errors'].append(o.name+':smooth face')
   if f.area<1e-10:continue
   ids=list(f.loop_indices)
   for i,li in enumerate(ids):
    lj=ids[(i+1)%len(ids)];a=mesh.vertices[mesh.loops[li].vertex_index].co;c=mesh.vertices[mesh.loops[lj].vertex_index].co;metres=(c-a).length
    if metres<1e-7:continue
    pixels=(uv.data[lj].uv-uv.data[li].uv).length*2048;err=abs(pixels/metres-16);maxerr=max(maxerr,err);maxabs=max(maxabs,abs(pixels-metres*16));edges+=1
    if err>.03 and abs(pixels-metres*16)>.0003:errs+=1
 if errs:report['errors'].append(col.name+':UV mismatch')
 report['assets'].append(dict(id=objs[0]['asset_id'],objects=len(objs),triangles=sum(len(f.vertices)-2 for o in objs for f in o.data.polygons),UVEdgesChecked=edges,invalidUVEdges=errs,maxDensityError=maxerr,maxAbsoluteTexelError=maxabs))
drain=json.loads((p/'drainage-inspection.json').read_text())
report.update(completeDrainage=drain['passed'],unchangedFurnitureAndVaseUV=all(x['UVPreserved'] for x in drain['unchangedSource']),originalMuseumMetadata=drain['originalMuseumMetadataPreserved'],layoutSha256=hashlib.sha256((p/'texture-layout.json').read_bytes()).hexdigest())
report['passed']=not report['errors'] and report['completeDrainage'] and report['unchangedFurnitureAndVaseUV'] and report['originalMuseumMetadata']
(p/'layout-reopened.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));assert report['passed'],report['errors'];print('REOPENED DRAINAGE LAYOUT VERIFIED',len(report['assets']),sum(x['UVEdgesChecked'] for x in report['assets']),max(x['maxAbsoluteTexelError'] for x in report['assets']))
