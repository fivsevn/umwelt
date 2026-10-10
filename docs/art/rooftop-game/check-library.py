"""Reopen the saved Blender source and inspect packed native data."""
from pathlib import Path
import bpy, json, hashlib, math
HERE=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(HERE/'game-assets.blend'))
identities=[o for o in bpy.data.objects if o.get('asset_id')]
assert len(identities)==304 and len({o['asset_id'] for o in identities})==304
image=bpy.data.images['Pixelorama / material-book / native 512']
assert image.packed_file
source=(HERE.parents[2]/'rooftop/assets/pixel/material-book.png').read_bytes()
assert bytes(image.packed_file.data)==source
count=0
for o in bpy.data.objects:
    if o.type!='MESH': continue
    for v in o.data.vertices: assert all(math.isfinite(p) for p in v.co)
    for name in ['pixel_plane','pixel_body','pixel_shade','pixel_phase','pixel_region']:
        assert name in o.data.attributes
    uv=o.data.uv_layers['Square surface grid / 8 px per unit']
    for polygon in o.data.polygons:
        corners=list(polygon.loop_indices)
        vertices=[o.data.vertices[o.data.loops[i].vertex_index].co for i in corners]
        if (vertices[1]-vertices[0]).cross(vertices[2]-vertices[0]).length<1e-8:continue
        for i,j in [(0,1),(1,2),(0,2)]:
            difference=abs((uv.data[corners[i]].uv-uv.data[corners[j]].uv).length*4-(vertices[i]-vertices[j]).length)
            assert difference<2e-5,(o.name,polygon.index,difference,vertices)
    count+=len(o.data.polygons)
report={'reopened_by_actual_blender':True,'assets':304,'triangles':count,
    'packed_png_equals_pixelorama_export':True,'texture_sha256':hashlib.sha256(source).hexdigest(),
    'editable_uv_and_surface_grid_attributes':True,'native_uv_metric_lengths_verified':True}
(HERE/'blender-source-check.json').write_text(json.dumps(report,indent=2)+'\n')
print(report)
