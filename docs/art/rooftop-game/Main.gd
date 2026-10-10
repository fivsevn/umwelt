extends Node
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
 file.store_string(JSON.stringify(report,"  ")+"\n")
 file.close()
 print("NATIVE GAME BOOK: ",record.strokes.size()," Pencil strokes; saved=",saved,"; PNG=",png)
 get_tree().quit(0 if saved and png==OK else 3)
