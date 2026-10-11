"""Read-only full native material/UV coverage inventory of the fixed scene."""
import bpy
import collections
import hashlib
import json
import sys
from pathlib import Path

HERE=Path(__file__).resolve().parent
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
source=Path(args[0]).resolve() if args else HERE/'before.blend'
output=Path(args[1]).resolve() if len(args)>1 else HERE/'material-coverage-before.json'
bpy.ops.wm.open_mainfile(filepath=str(source))
scope=json.loads((HERE/'atlas-scope.json').read_text())
scope=scope.get('allowedRects',scope)
fields=json.loads(bpy.context.scene['textureFields'])
stats={}
def label(normal):
    axes=[abs(n)for n in normal];axis=axes.index(max(axes))
    if axes[axis]<.99:return 'sloped'
    return [('west','east'),('south','north'),('bottom','top')][axis][normal[axis]>0]
for obj in bpy.data.objects:
    if obj.type!='MESH':continue
    mesh=obj.data
    for polygon in mesh.polygons:
        material=mesh.materials[polygon.material_index]
        field=material.get('runtime_field',material.name)
        style=material.get('runtime_style','pixelbook')
        key=(field,style)
        row=stats.setdefault(key,{'field':field,'style':style,'nativeObjects':set(),'polygons':0,'normalDirections':collections.Counter(),'uvCharts':set(),'allHaveUvs':True,'images':set(),'materials':set(),'hiddenObjects':set()})
        row['nativeObjects'].add(obj.name);row['polygons']+=1;row['normalDirections'][label(polygon.normal)]+=1
        row['uvCharts'].update(uv.name for uv in mesh.uv_layers);row['allHaveUvs'] &= bool(mesh.uv_layers.active)
        row['materials'].add(material.name)
        if obj.hide_render or obj.hide_viewport:row['hiddenObjects'].add(obj.name)
        if material.node_tree:
            row['images'].update(node.image.name for node in material.node_tree.nodes if hasattr(node,'image') and node.image)
rows=[]
for (field,style),row in sorted(stats.items()):
    row['nativeObjects']=len(row['nativeObjects']);row['hiddenObjects']=len(row['hiddenObjects'])
    row['normalDirections']=dict(row['normalDirections'])
    row['uvCharts']=sorted(row['uvCharts']);row['images']=sorted(row['images']);row['materials']=sorted(row['materials'])
    row['rect']=fields.get(field);row['scopeCovered']=row['rect'] in scope.values() if row['rect'] else False
    rows.append(row)
images=[]
for image in bpy.data.images:
    if image.packed_file:
        images.append({'name':image.name,'size':list(image.size),'sha256':hashlib.sha256(bytes(image.packed_file.data)).hexdigest(),'colorSpace':image.colorspace_settings.name,'alphaMode':image.alpha_mode})
report={'source':str(source.relative_to(HERE.parent)),'meshObjects':sum(obj.type=='MESH'for obj in bpy.data.objects),'uniqueMeshData':len(bpy.data.meshes),'allMeshDataHaveUvs':all(mesh.uv_layers.active for mesh in bpy.data.meshes),'smoothPolygons':sum(p.use_smooth for mesh in bpy.data.meshes for p in mesh.polygons),'fieldInventory':rows,'packedImages':images,'texelsPerMetre':int(bpy.context.scene['texelsPerMetre']),'texelMetresPerUnit':json.loads(bpy.context.scene['texelMetresPerUnit']),'hiddenDirectMeshObjects':sum(obj.type=='MESH'and(obj.hide_render or obj.hide_viewport)for obj in bpy.data.objects),'collectionsHiddenRender':sum(c.hide_render for c in bpy.data.collections),'collectionsHiddenViewport':sum(c.hide_viewport for c in bpy.data.collections),'allNativePixelbookFieldsCovered':all(r['scopeCovered']for r in rows if r['style']=='pixelbook'),'allFacesUseAuditedBindings':sum(r['polygons']for r in rows)==sum(len(obj.data.polygons)for obj in bpy.data.objects if obj.type=='MESH')}
output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False),flush=True)
