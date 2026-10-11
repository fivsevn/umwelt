extends Node
func _ready():
 if "--rooftop-floor-repaint" in OS.get_cmdline_user_args():
  Global.pixelorama_opened.connect(paint, CONNECT_ONE_SHOT)
func paint():
 var path=""
 for arg in OS.get_cmdline_user_args():
  if arg.begins_with("--book-dir="):path=arg.trim_prefix("--book-dir=")
 var project=Global.current_project
 if project.name!="terrace-book" or project.size!=Vector2i(1024,1024):
  push_error("Expected saved terrace-book native source")
  get_tree().quit(2)
  return
 project.current_layer=0
 project.selected_cels=[Vector2i(0,0)]
 Tools.assign_tool("Pencil",MOUSE_BUTTON_LEFT)
 Tools.alpha_locked=false
 var pencil=Tools._slots[MOUSE_BUTTON_LEFT].tool_node
 pencil._brush_size=1
 pencil._brush_density=100
 pencil._strength=1.0
 pencil._overwrite=true
 pencil.update_brush()
 var record=JSON.parse_string(FileAccess.get_file_as_string(path.path_join("material-pencil-strokes.json")))
 for mark in record.strokes:
  pencil.tool_slot.color=Color(mark.color)
  pencil.draw_start(Vector2i(mark.points[0][0],mark.points[0][1]))
  for point in mark.points.slice(1):pencil.draw_move(Vector2i(point[0],point[1]))
  pencil.draw_end(Vector2i(mark.points[-1][0],mark.points[-1][1]))
 project.set_meta("material_refinement","Fresh 2–7 px adjoining mineral remnants and twelve neighbouring grey-green tones; sparse fissures and peel edges; native 1 px Pencil at 16 px/m")
 var saved=OpenSave.save_pxo_file(path.path_join("terrace-book.pxo"),false,true,project)
 var png=project.frames[0].cels[0].get_image().save_png(path.path_join("terrace-book.png"))
 var report={"software":"Pixelorama","version":Global.current_version,"tool":"Pencil","brush":1,"strokes":record.strokes.size(),"nativeSaved":saved,"nativePngExport":png==OK,"texelsPerMetre":16,"changedOnly":[[512,0,128,256],[640,0,128,128],[0,512,768,64],[0,576,768,64],[768,128,256,64],[768,192,256,64]]}
 var file=FileAccess.open(path.path_join("pixelorama-material-refinement.json"),FileAccess.WRITE)
 file.store_string(JSON.stringify(report,"  "))
 print("NATIVE MATERIAL REFINEMENT ",JSON.stringify(report))
 get_tree().quit(0 if saved and png==OK else 3)
