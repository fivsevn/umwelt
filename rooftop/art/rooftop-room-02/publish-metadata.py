import bpy,json
from pathlib import Path
root=Path(__file__).parent;p=root/'room-background';runtime=root.parents[2]/'rooftop/assets/room'
bpy.ops.wm.open_mainfile(filepath=str(p/'room-background.blend'))
rows=[]
for o in bpy.data.collections['room-background'].objects:
 points=[o.matrix_world@v.co for v in o.data.vertices]
 rows.append(dict(name=o.name,role=o['part_role'],min=[min([v.x,v.z,-v.y][k] for v in points) for k in range(3)],max=[max([v.x,v.z,-v.y][k] for v in points) for k in range(3)]))
header="import { ITEM_METRES_TO_UNITS } from '../../item-catalog.mjs';\n// Actual parts measured from the independently reopened room-background Blend.\nconst authoredParts = "
(runtime/'room-part-bounds.mjs').write_text(header+json.dumps(rows,separators=(',',':'))+";\nexport const ROOM_PART_BOUNDS = authoredParts.map(part => ({...part,min:part.min.map(value=>value*ITEM_METRES_TO_UNITS),max:part.max.map(value=>value*ITEM_METRES_TO_UNITS)}));\n")
(root/'part-bounds.json').write_text(json.dumps(rows,indent=2))
