import sys,json
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT))
import bpy
from assetlib import present_source,verify_saved
family=sys.argv[sys.argv.index('--')+1]
item=json.loads((ROOT/family/'catalog.json').read_text())['items'][0]
path=ROOT/family/(family+'.blend')
bpy.ops.wm.open_mainfile(filepath=str(path))
present_source(item['id'],item)
bpy.ops.wm.save_as_mainfile(filepath=str(path))
verify_saved(family)
