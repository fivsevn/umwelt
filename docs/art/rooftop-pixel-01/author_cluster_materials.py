"""Replay deliberately specified coarse pixels through Pixelorama's real Pencil.
Edits the original 128px, three-layer PXO. No external raster synthesis.
"""
from pathlib import Path
import json,zipfile,subprocess,hashlib
ROOT=Path(__file__).resolve().parent
OUT=ROOT/'pixelorama-clusters';OUT.mkdir(exist_ok=True)
SOURCE=ROOT/'garden-atlas.pxo'
assert not (ROOT/'pixelorama-cluster-authoring.json').exists(),'One-time source edit already completed.'
# Four-pixel motifs are authored colour clusters, each made from native 1px
# cells. A complete 32px field is painted, not a blank base plus spare dots.
motifs=[['0011','0021','3002','3300'],['1122','1012','0013','0333'],
 ['2200','2300','1301','1111'],['3322','3022','1002','1100'],
 ['1003','1103','2110','2210'],['0112','0012','3001','3300'],
 ['2211','2011','0013','0033'],['3100','3110','0221','0222']]
layout=['05126347','63270415','14750632','70623154','26341570','41507623','57063241','32415706']
palettes=[['b87958','c58a66','a76b50','986044'],['cc956f','dead82','bb805d','a96d50'],
 ['343c3a','46534b','2c3331','596257'],['526157','6b7869','3c4b42','809080'],
 ['c0c3a7','d1d2b8','aeb69c','98a48d'],['738b7d','8d9e8b','60796b','4f665c'],
 ['b8afa0','cec3ad','a69e8c','8d897a'],['c7bea7','ddd5bd','b1ac94','929b85'],
 ['605446','79634e','4c433a','8a755b'],['6e8c60','91a774','4f7050','3b5941'],
 ['e8c65b','fff080','dba341','b48038'],['a1755d','bb8b67','895e4b','724b3e'],
 ['8d998d','a7b19b','768476','596d5b'],['b9a273','d5bf87','958453','806d49'],
 ['738b7d','8d9e8b','60796b','4f665c'],['c0c3a7','d1d2b8','aeb69c','98a48d']]
grids=[]
for tile,palette in enumerate(palettes):
 grid=[[int(motifs[int(layout[y//4][(x//4+tile)%8])][y%4][x%4]) for x in range(32)] for y in range(32)]
 if tile in (4,15,7,12):
  # Connected lower damp/moss patches step through the exact same native grid.
  for x,height in enumerate([2,2,3,1,1,2,4,4,3,1,2,2,3,3,1,2,4,3,2,2,1,3,3,4,2,1,2,2,4,3,2,2]):
   for y in range(32-height,32):grid[y][x]=3 if tile in (4,15,7) else 2
 if tile in (5,14):
  # Flat door panels are drawn in pixels where the leaf UV actually samples.
  for x in [2,7,12,17,22,27]:
   for y in range(32):grid[y][x]=3 if y%7<5 else 2
  for x0,x1,y0,y1 in [(11,16,16,22),(18,23,16,22),(11,16,24,30),(18,23,24,30)]:
   for x in range(x0,x1+1):grid[y0][x]=1;grid[y1][x]=3
   for y in range(y0,y1+1):grid[y][x0]=1;grid[y][x1]=3
 if tile==11:
  # Tile overlap, grout, chips and shade live on a SINGLE folded roof slab.
  for y in range(32):
   for x in range(32):
    seam=(x+(2 if (y//3)%2 else 0))%5==0 or y%3==0
    grid[y][x]=3 if seam else (1 if (x+y*2)%7<2 else (2 if (x//5+y//3)%3==0 else 0))
 if tile==6:
  for y in range(32):
   for x in range(32):
    if y%4==0 or (x+(2 if (y//4)%2 else 0))%5==0:grid[y][x]=3
 grids.append(grid)
strokes=[]
for tile,grid in enumerate(grids):
 for y,row in enumerate(grid):
  start=0
  while start<32:
   end=start
   while end+1<32 and row[end+1]==row[start]:end+=1
   strokes.append({'tile':tile,'color':palettes[tile][row[start]],'points':[[start,y],[end,y]]})
   start=end+1
record={'revision':7,'atlas_size':128,'tile_size':32,'brush_size':1,'layer':'Weathering patches',
 'motifs':motifs,'layout':layout,'palettes':palettes,'painted_native_cells':16384,'strokes':strokes}
(OUT/'strokes.json').write_text(json.dumps(record,separators=(',',':'))+'\n')
gd='''extends Node
func _ready():
 if not "--umwelt-clusters" in OS.get_cmdline_user_args():
  return
 Global.pixelorama_opened.connect(paint, CONNECT_ONE_SHOT)
func paint():
 var source_path = ""
 for argument in OS.get_cmdline_user_args():
  if argument.ends_with(".pxo"):
   source_path = argument
 var source_dir = source_path.get_base_dir()
 var project = Global.current_project
 if project.name != "garden-atlas" or project.size != Vector2i(128,128):
  push_error("Expected the existing native 128px garden-atlas.")
  get_tree().quit(2)
  return
 project.current_layer = 2
 project.selected_cels = [Vector2i(0,2)]
 Tools.assign_tool("Pencil", MOUSE_BUTTON_LEFT)
 Tools.alpha_locked = false
 var pencil = Tools._slots[MOUSE_BUTTON_LEFT].tool_node
 pencil._brush_size = 1
 pencil._brush_density = 100
 pencil._strength = 1.0
 pencil._overwrite = true
 pencil.update_brush()
 var record = JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("pixelorama-clusters/strokes.json")))
 for mark in record.strokes:
  var tile = int(mark.tile)
  var offset = Vector2i((tile % 4)*32, (tile / 4)*32)
  pencil.tool_slot.color = Color(mark.color)
  pencil.draw_start(offset + Vector2i(mark.points[0][0],mark.points[0][1]))
  pencil.draw_move(offset + Vector2i(mark.points[-1][0],mark.points[-1][1]))
  pencil.draw_end(offset + Vector2i(mark.points[-1][0],mark.points[-1][1]))
 project.set_meta("revision_7_author", "Complete native 1px colour-cluster fields; actual Pixelorama Pencil")
 var saved = OpenSave.save_pxo_file(source_path, false, true, project)
 var report = {"revision":7,"software":"Pixelorama","version":Global.current_version,"actual_tool":"Pencil","brush_size":1,"integer_coordinates":true,"stroke_count":record.strokes.size(),"painted_native_cells":record.painted_native_cells,"atlas_size":128,"tile_size":32,"native_resolution_unchanged":true,"saved_by_native_software":saved,"method":"Author-specified integer stroke replay through software Pencil; no external raster generation"}
 var file = FileAccess.open(source_dir.path_join("pixelorama-cluster-authoring.json"),FileAccess.WRITE)
 file.store_string(JSON.stringify(report,"  ")+"\\n")
 file.close()
 print("NATIVE CLUSTERS: ", record.strokes.size(), " strokes; saved=",saved)
 get_tree().quit(0 if saved else 3)
'''
(OUT/'Main.gd').write_text(gd)
(OUT/'Main.tscn').write_text('[gd_scene load_steps=2 format=3]\n[ext_resource type="Script" path="res://src/Extensions/UmweltClusters/Main.gd" id="1"]\n[node name="UmweltClusters" type="Node"]\nscript = ExtResource("1")\n')
(OUT/'extension.json').write_text(json.dumps({'name':'UmweltClusters','display_name':'Umwelt native coarse material authoring','description':'Complete native integer-pixel material fields, through actual Pencil.','author':'五月七日','version':'0.1','supported_api_versions':[8],'license':'MIT','nodes':['Main.tscn']},indent=2))
config=Path('/Users/d/Library/Application Support/Pixelorama/config.ini');backup=config.read_bytes()
extension=config.parent/'extensions/UmweltClusters.zip'
assert not extension.exists()
with zipfile.ZipFile(extension,'w',zipfile.ZIP_DEFLATED) as archive:
 for name in ['Main.gd','Main.tscn','extension.json']:archive.write(OUT/name,'src/Extensions/UmweltClusters/'+name)
config.write_text(config.read_text()+'\n[extensions]\n\nUmweltClusters=true\n')
try:
 result=subprocess.run(['/Applications/Pixelorama.app/Contents/MacOS/Pixelorama','--headless','--',str(SOURCE),'--umwelt-clusters'],capture_output=True,text=True,timeout=60)
 print(result.stdout[-2000:]);print(result.stderr[-2000:]);assert result.returncode==0
 assert json.loads((ROOT/'pixelorama-cluster-authoring.json').read_text())['saved_by_native_software']
finally:
 config.write_bytes(backup);extension.unlink(missing_ok=True)
print('Native Pixelorama saved the original PXO:',len(strokes),'strokes')
