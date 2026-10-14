"""Independent native-source contact checks for the corrected iron frames."""
import bpy,json
from pathlib import Path
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'everyday/everyday.blend'))
def bounds(obj):
 points=[obj.matrix_world@v.co for v in obj.data.vertices]
 return ([min(p[k] for p in points) for k in range(3)],[max(p[k] for p in points) for k in range(3)])
def overlap(a,b):
 alo,ahi=bounds(a);blo,bhi=bounds(b)
 return [min(ahi[k],bhi[k])-max(alo[k],blo[k]) for k in range(3)]
rows=[]
for levels in (3,4):
 for color in ('black','silver'):
  asset=f'iron-{levels}-{color}'
  parts={o.name.split('/')[-1]:o for o in bpy.data.objects if o.type=='MESH' and o.get('asset_id')==asset}
  for level in range(1,levels+1):
   for ix in (0,1):
    for iy in (0,1):
     joint=parts[f'L{level}-joint-{ix}-{iy}']
     neighbors=[parts[f'post-{ix}-{iy}'],parts[f'L{level}-rim-frontback-{-1 if iy==0 else 1}'],parts[f'L{level}-rim-side-{-1 if ix==0 else 1}']]
     contacts=[overlap(joint,n) for n in neighbors]
     rows.append(dict(asset=asset,level=level,corner=[ix,iy],overlapMetres=contacts,connected=all(min(c)>1e-6 for c in contacts)))
assert all(r['connected'] for r in rows),rows
parts={o.name.split('/')[-1]:o for o in bpy.data.objects if o.type=='MESH' and o.get('asset_id')=='wood-square-table'}
points=[o.matrix_world@v.co for name,o in parts.items() if name.startswith('top-board') for v in o.data.vertices]
if not points:
 points=[o.matrix_world@v.co for name,o in parts.items() if o.get('part_role')=='wood-top' for v in o.data.vertices]
assert points,'Missing actual tabletop geometry'
width=max(p.x for p in points)-min(p.x for p in points);depth=max(p.y for p in points)-min(p.y for p in points)
assert abs(width-depth)<1e-5,(width,depth)
report=dict(passed=True,independentNativeSource=True,ironCornersChecked=len(rows),contacts=rows,squareTabletopMetres=[width,depth])
(ROOT/'everyday/connection-check.json').write_text(json.dumps(report,indent=2))
print('SOURCE JOINTS VERIFIED',len(rows),'square tabletop',width,depth)
