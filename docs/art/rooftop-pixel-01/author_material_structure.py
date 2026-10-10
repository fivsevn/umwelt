"""Revision 8: authored material structure replayed with real Pixelorama Pencil.
Only nine native atlas regions change. No raster-generation library is used.
"""
from pathlib import Path
import json, zipfile, subprocess, hashlib

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'pixelorama-materials'
SOURCE = ROOT / 'garden-atlas.pxo'
REPORT = ROOT / 'pixelorama-material-authoring.json'
assert not REPORT.exists(), 'This one-time source edit has already completed.'
OUT.mkdir(exist_ok=True)
before = SOURCE.read_bytes()
with zipfile.ZipFile(SOURCE) as archive:
    native_before = archive.read('image_data/frames/1/layer_3')
    lower_before = [archive.read('image_data/frames/1/layer_'+str(i)) for i in (1, 2)]

palettes = {
    2:['343c3a','414b43','2c3331','596257'],
    3:['526157','626f61','47574b','788575'],
    4:['c0c3a7','c7c9b0','b1b99f','98a48d','cfccb0'],
    5:['738b7d','819584','60796b','4f665c','94a28b'],
    6:['b8afa0','c2b8a6','aea796','999584','858779','cec3ad'],
    7:['c7bea7','d0c8b0','b6b29c','a5ab93'],
    12:['8d998d','9daa97','7e8e7e','6e826e'],
    14:['738b7d','819584','60796b','4f665c','94a28b'],
    15:['c0c3a7','c7c9b0','b1b99f','98a48d','cfccb0'],
}
grids = {tile:[[0]*32 for _ in range(32)] for tile in palettes}

def rect(tile, x0, y0, x1, y1, ink):
    for y in range(y0,y1+1):
        for x in range(x0,x1+1):
            if 0 <= x < 32 and 0 <= y < 32:
                grids[tile][y][x] = ink

def patch(tile,x0,y0,rows):
    """Explicit integer cells; dots preserve the already authored substrate."""
    for dy,row in enumerate(rows):
        for dx,ink in enumerate(row):
            if ink != '.': rect(tile,x0+dx,y0+dy,x0+dx,y0+dy,int(ink))

# Plaster: broad, close-value trowelled areas, a few connected flaked patches,
# and a lower damp boundary. No repeating motif or scattered speckle field.
for tile in (4,15):
    patch(tile,0,9,['11111...','111111..','111111..','11111...','11111...','1111....','1111....','111.....','11......'])
    patch(tile,23,9,['..11111.','.111111.','1111111.','111111..','111111..','11111...','1111....','11......'])
    patch(tile,10,2,['111111111...','1111111111..','11111111111.','1111111111..','111111111...'])
    # Plaster beneath the roof stays coherent, rather than camouflage.
    patch(tile,1,22,['22.......','222......','2222.....','2222.....','222......','22.......'])
    patch(tile,4,19,['.44','444','44.'])
    patch(tile,25,22,['..44','4444','444.'])
    heights = [2,2,3,3,2,2,1,1,2,2,2,1,1,2,3,3,2,2,2,1,1,1,2,2,3,3,3,2,2,2,1,2]
    for x,h in enumerate(heights):
        rect(tile,x,32-h,x,31,3)
    patch(tile,6,28,['22....','222...','2222..'])
    patch(tile,27,27,['2....','22...','222..','2222.'])
    if tile==15:
        # Adjacent return has its own quiet connected plaster repairs.
        rect(tile,2,13,5,17,0)
        patch(tile,2,15,['.11','111','11.','1..'])
        rect(tile,25,22,28,24,0)
        patch(tile,26,24,['44.','.44'])

# Paving: four-by-four 1m slabs. Each native square remains 0.125m.
# Most pixels are stone faces; a 1px joint, lower edge and a few chips identify
# the material. No stone is filled with the old all-over patch motifs.
stone_layout = ['0102','2010','1021','0201']
for row in range(4):
    for col in range(4):
        x,y=col*8,row*8
        tone=int(stone_layout[row][col])
        rect(6,x,y,x+7,y+7,4)
        rect(6,x+1,y+1,x+7,y+7,tone)
        rect(6,x+2,y+1,x+6,y+1,5)
        rect(6,x+1,y+7,x+6,y+7,3)
        if (row,col) in [(0,1),(1,3),(2,0),(3,2)]:
            patch(6,x+1,y+5,['33.','3..'])
        if (row,col) in [(1,1),(2,2),(3,0)]:
            patch(6,x+5,y+3,['55','5.'])

# Painted door: the four panels are drawn at the UV area used by the leaf.
for tile in (5,14):
    rect(tile,0,0,31,1,2)
    rect(tile,0,30,31,31,2)
    for x0,x1,y0,y1 in [(11,16,16,22),(18,23,16,22),(11,16,24,30),(18,23,24,30)]:
        rect(tile,x0,y0,x1,y1,2)
        rect(tile,x0+1,y0+1,x1-1,y1-1,0)
        rect(tile,x0,y0,x1-1,y0,1)
        rect(tile,x0,y0,x0,y1-1,1)
        rect(tile,x0+1,y1,x1,y1,3)
        rect(tile,x1,y0+1,x1,y1,3)
    patch(tile,12,26,['44','4.'])
    patch(tile,20,29,['.44','44.'])
    rect(tile,9,14,9,29,2)
    rect(tile,25,14,25,29,2)

# Stone frame and foundation: intact body, small edge wear and foot damp.
for tile in (7,12):
    rect(tile,0,1,31,2,1)
    rect(tile,0,30,31,31,2)
    patch(tile,2,26,['11..','111.','.11.'])
    patch(tile,24,14,['22.','222','22.'])
    patch(tile,12,7,['.11','111','11.'])
    if tile==12:
        heights=[1,1,2,2,1,1,1,2,2,2,1,1,1,1,2,2,2,1,1,1,2,2,1,1,1,2,2,2,1,1,1,1]
        for x,h in enumerate(heights): rect(tile,x,32-h,x,31,3)

# Iron: long uninterrupted painted runs, sparse rubbed edges. Preserve the
# black/green direction, instead of treating metal as another stone texture.
for tile in (2,3):
    rect(tile,1,0,1,31,1)
    rect(tile,30,0,31,31,2)
    patch(tile,5,27,['11..','111.'])
    patch(tile,24,6,['..11','.111','11..'])
    patch(tile,15,18,['33','3.'])

strokes=[]
for tile,grid in grids.items():
    for y,row in enumerate(grid):
        start=0
        while start<32:
            end=start
            while end+1<32 and row[end+1]==row[start]:end+=1
            strokes.append({'tile':tile,'color':palettes[tile][row[start]],'points':[[start,y],[end,y]]})
            start=end+1
record={'revision':8,'atlas_size':128,'tile_size':32,'brush_size':1,'layer':'Weathering patches',
        'target_tiles':list(grids),'palettes':palettes,'native_design_rows':{k:[''.join(map(str,row)) for row in grid] for k,grid in grids.items()},
        'painted_native_cells':len(grids)*1024,'strokes':strokes,
        'design':'Connected plaster and foot damp; intact paving slabs and joints; flat door panels; sparse metal edge wear'}
(OUT/'strokes.json').write_text(json.dumps(record,separators=(',',':'))+'\n')
gd='''extends Node
func _ready():
 if not "--umwelt-materials" in OS.get_cmdline_user_args():
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
 var record = JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("pixelorama-materials/strokes.json")))
 for mark in record.strokes:
  var tile = int(mark.tile)
  var offset = Vector2i((tile % 4)*32, (tile / 4)*32)
  pencil.tool_slot.color = Color(mark.color)
  pencil.draw_start(offset + Vector2i(mark.points[0][0],mark.points[0][1]))
  pencil.draw_move(offset + Vector2i(mark.points[-1][0],mark.points[-1][1]))
  pencil.draw_end(offset + Vector2i(mark.points[-1][0],mark.points[-1][1]))
 project.set_meta("revision_8_author", "Material-specific integer strokes; actual Pixelorama Pencil")
 var saved = OpenSave.save_pxo_file(source_path, false, true, project)
 var report = {"revision":8,"software":"Pixelorama","version":Global.current_version,"actual_tool":"Pencil","brush_size":1,"integer_coordinates":true,"stroke_count":record.strokes.size(),"painted_native_cells":record.painted_native_cells,"atlas_size":128,"tile_size":32,"target_tiles":record.target_tiles,"native_resolution_unchanged":true,"saved_by_native_software":saved,"method":"Author-specified integer stroke replay through software Pencil; no external raster generation"}
 var file = FileAccess.open(source_dir.path_join("pixelorama-material-authoring.json"),FileAccess.WRITE)
 file.store_string(JSON.stringify(report,"  ")+"\\n")
 file.close()
 print("NATIVE MATERIALS: ", record.strokes.size(), " strokes; saved=",saved)
 get_tree().quit(0 if saved else 3)
'''
(OUT/'Main.gd').write_text(gd)
(OUT/'Main.tscn').write_text('[gd_scene load_steps=2 format=3]\n[ext_resource type="Script" path="res://src/Extensions/UmweltMaterials/Main.gd" id="1"]\n[node name="UmweltMaterials" type="Node"]\nscript = ExtResource("1")\n')
(OUT/'extension.json').write_text(json.dumps({'name':'UmweltMaterials','display_name':'Umwelt material structure authoring','description':'Material-specific integer Pencil strokes, original native project.','author':'五月七日','version':'0.1','supported_api_versions':[8],'license':'MIT','nodes':['Main.tscn']},indent=2)+'\n')
config=Path('/Users/d/Library/Application Support/Pixelorama/config.ini')
backup=config.read_bytes()
extension=config.parent/'extensions/UmweltMaterials.zip'
assert not extension.exists()
with zipfile.ZipFile(extension,'w',zipfile.ZIP_DEFLATED) as archive:
    for name in ['Main.gd','Main.tscn','extension.json']:archive.write(OUT/name,'src/Extensions/UmweltMaterials/'+name)
config.write_text(config.read_text()+'\n[extensions]\n\nUmweltMaterials=true\n')
try:
    result=subprocess.run(['/Applications/Pixelorama.app/Contents/MacOS/Pixelorama','--headless','--',str(SOURCE),'--umwelt-materials'],capture_output=True,text=True,timeout=60)
    print(result.stdout[-1500:]);print(result.stderr[-500:]);assert result.returncode==0
    report=json.loads(REPORT.read_text());assert report['saved_by_native_software']
finally:
    config.write_bytes(backup);extension.unlink(missing_ok=True)
assert config.read_bytes()==backup
with zipfile.ZipFile(SOURCE) as archive:
    native_after=archive.read('image_data/frames/1/layer_3')
    assert all(archive.read('image_data/frames/1/layer_'+str(i))==lower_before[i-1] for i in (1,2))
def tile_bytes(raw,tile):
    ox,oy=(tile%4)*32,(tile//4)*32
    return b''.join(raw[((oy+y)*128+ox)*4:((oy+y)*128+ox+32)*4] for y in range(32))
preserved=[t for t in range(16) if t not in grids]
assert all(tile_bytes(native_after,t)==tile_bytes(native_before,t) for t in preserved)
def count_edges(raw):
    cells=[raw[i:i+4] for i in range(0,len(raw),4)]
    return sum(cells[y*32+x]!=cells[y*32+x+1] for y in range(32) for x in range(31))+sum(cells[y*32+x]!=cells[(y+1)*32+x] for y in range(31) for x in range(32))
materials=[]
for tile in grids:
    a,b=tile_bytes(native_before,tile),tile_bytes(native_after,tile)
    materials.append({'tile':tile,'before_colour_edges':count_edges(a),'after_colour_edges':count_edges(b),'native_colours':len(set(b[i:i+4] for i in range(0,len(b),4)))})
report.update({'pxo_before_sha256':hashlib.sha256(before).hexdigest(),'pxo_after_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'preserved_tiles':preserved,'untouched_tiles_byte_identical':True,'base_and_strokes_layers_byte_identical':True,'materials':materials,'user_configuration_restored':True})
REPORT.write_text(json.dumps(report,indent=2)+'\n')
print('Native Pixelorama saved material refinement:',len(strokes),'strokes;',materials)
