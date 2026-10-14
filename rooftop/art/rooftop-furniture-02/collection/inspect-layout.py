"""Independent native layout reopening and physical UV checks."""
import bpy,json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'collection-layout.blend'))
report={'source':'Independent native Blender reopening before Pixelorama authoring','assets':[],
        'maxDensityError':0,'maxPixelLengthError':0,'edgesChecked':0,'errors':[]}
for col in bpy.data.collections:
    objects=[obj for obj in col.objects if obj.type=='MESH' and obj.get('asset_id')]
    if not objects:continue
    entry={'id':objects[0]['asset_id'],'objects':len(objects),'maxDensityError':0,'maxPixelLengthError':0,'edgesChecked':0}
    points=[obj.matrix_world@v.co for obj in objects for v in obj.data.vertices]
    entry['dimensions']=[max(p[i] for p in points)-min(p[i] for p in points) for i in range(3)]
    if abs(min(p.z for p in points))>1e-6:report['errors'].append(col.name+':ground origin')
    for obj in objects:
        if obj.modifiers:report['errors'].append(obj.name+':unapplied modifiers')
        mesh=obj.data;uv=mesh.uv_layers.active
        if not uv:report['errors'].append(obj.name+':missing physical UV');continue
        for polygon in mesh.polygons:
            if polygon.area<1e-10:continue
            ids=list(polygon.loop_indices)
            for i,left in enumerate(ids):
                right=ids[(i+1)%len(ids)]
                a=mesh.vertices[mesh.loops[left].vertex_index].co;b=mesh.vertices[mesh.loops[right].vertex_index].co
                metres=(b-a).length
                if metres<1e-7:continue
                pixels=(uv.data[right].uv-uv.data[left].uv).length*2048
                density_error=abs(pixels/metres-16)
                pixel_error=abs(pixels-16*metres)
                entry['maxDensityError']=max(entry['maxDensityError'],density_error)
                entry['maxPixelLengthError']=max(entry['maxPixelLengthError'],pixel_error)
                entry['edgesChecked']+=1
    report['assets'].append(entry)
    report['maxDensityError']=max(report['maxDensityError'],entry['maxDensityError'])
    report['maxPixelLengthError']=max(report['maxPixelLengthError'],entry['maxPixelLengthError'])
    report['edgesChecked']+=entry['edgesChecked']
report['passed']=not report['errors'] and report['maxPixelLengthError']<.0003
(ROOT/'layout-reopened.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('LAYOUT REOPENED',json.dumps({k:v for k,v in report.items() if k!='assets'}))
