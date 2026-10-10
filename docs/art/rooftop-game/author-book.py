"""Save the book through Pixelorama's native 1px Pencil and native PNG writer.
The stroke plan is editable and deterministic; no raster generation service is used.
"""
from pathlib import Path
import json, zipfile, subprocess, sys
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
TARGET=ROOT/'rooftop/assets/pixel/material-book.png'
REPORT=HERE/'pixelorama-authoring.json'
if REPORT.exists() and '--replay-existing' not in sys.argv: raise SystemExit('Original already authored. Edit the PXO in Pixelorama; do not replay over later changes.')
gd='''extends Node
func _ready():
 if "--umwelt-game-book" in OS.get_cmdline_user_args():
  Global.pixelorama_opened.connect(paint, CONNECT_ONE_SHOT)
func paint():
 var path = ""
 for arg in OS.get_cmdline_user_args():
  if arg.begins_with("--book-dir="):
   path = arg.trim_prefix("--book-dir=")
 var record = JSON.parse_string(FileAccess.get_file_as_string(path.path_join("pencil-strokes.json")))
 if Global.current_project.name != "material-book":
  OpenSave.open_image_as_new_tab("material-book.png", Image.create(512,512,false,Image.FORMAT_RGBA8))
 var project = Global.current_project
 project.name = "material-book"
 project.layers[0].name = "32px materials and vessel interiors"
 project.current_layer = 0
 project.selected_cels = [Vector2i(0,0)]
 Tools.assign_tool("Pencil", MOUSE_BUTTON_LEFT)
 Tools.alpha_locked = false
 var pencil = Tools._slots[MOUSE_BUTTON_LEFT].tool_node
 pencil._brush_size = 1
 pencil._brush_density = 100
 pencil._strength = 1.0
 pencil._overwrite = true
 pencil.update_brush()
 for mark in record.strokes:
  pencil.tool_slot.color = Color(mark.color)
  pencil.draw_start(Vector2i(mark.points[0][0],mark.points[0][1]))
  pencil.draw_move(Vector2i(mark.points[1][0],mark.points[1][1]))
  pencil.draw_end(Vector2i(mark.points[1][0],mark.points[1][1]))
 project.set_meta("physical_texels_per_unit",8)
 project.set_meta("field_layout",record.fields)
 var saved = OpenSave.save_pxo_file(path.path_join("material-book.pxo"),false,true,project)
 var png = project.frames[0].cels[0].get_image().save_png(path.path_join("../../../rooftop/assets/pixel/material-book.png"))
 var report = {"software":"Pixelorama","version":Global.current_version,"tool":"Pencil","brush":1,"integer_coordinates":true,"size":512,"field_size":32,"physical_texels_per_unit":8,"fields":record.fields.size(),"strokes":record.strokes.size(),"native_saved":saved,"native_png_export":png==OK,"method":"Author specified stroke replay in actual native Pencil; no AI image generation"}
 var file = FileAccess.open(path.path_join("pixelorama-authoring.json"),FileAccess.WRITE)
 file.store_string(JSON.stringify(report,"  ")+"\\n")
 file.close()
 print("NATIVE GAME BOOK: ",record.strokes.size()," Pencil strokes; saved=",saved,"; PNG=",png)
 get_tree().quit(0 if saved and png==OK else 3)
'''
(HERE/'Main.gd').write_text(gd)
(HERE/'Main.tscn').write_text('[gd_scene load_steps=2 format=3]\n[ext_resource type="Script" path="res://src/Extensions/UmweltGameBook/Main.gd" id="1"]\n[node name="UmweltGameBook" type="Node"]\nscript = ExtResource("1")\n')
(HERE/'extension.json').write_text(json.dumps({'name':'UmweltGameBook','display_name':'Umwelt native game material authoring','description':'Native 1px Pencil stroke plan.','author':'五月七日','version':'0.1','supported_api_versions':[8],'license':'MIT','nodes':['Main.tscn']},indent=2)+'\n')
config=Path('/Users/d/Library/Application Support/Pixelorama/config.ini')
backup=config.read_bytes()
extension=config.parent/'extensions/UmweltGameBook.zip'
assert not extension.exists()
with zipfile.ZipFile(extension,'w',zipfile.ZIP_DEFLATED) as archive:
 for name in ['Main.gd','Main.tscn','extension.json']: archive.write(HERE/name,'src/Extensions/UmweltGameBook/'+name)
config.write_text(config.read_text()+'\n[extensions]\n\nUmweltGameBook=true\n')
try:
 original=HERE/'material-book.pxo'
 args=[str(original)] if original.exists() else []
 result=subprocess.run(['/Applications/Pixelorama.app/Contents/MacOS/Pixelorama','--headless','--',*args,'--umwelt-game-book','--book-dir='+str(HERE)],capture_output=True,text=True,timeout=300)
 print(result.stdout[-1200:]); print(result.stderr[-400:]); assert result.returncode==0
 assert json.loads(REPORT.read_text())['native_png_export']
finally:
 config.write_bytes(backup); extension.unlink(missing_ok=True)
assert config.read_bytes()==backup
assert TARGET.is_file()
print('Pixelorama source:',(HERE/'material-book.pxo').stat().st_size,'bytes; PNG:',TARGET.stat().st_size,'bytes')
