extends Node
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
 file.store_string(JSON.stringify(report,"  ")+"\n")
 file.close()
 print("NATIVE MATERIALS: ", record.strokes.size(), " strokes; saved=",saved)
 get_tree().quit(0 if saved else 3)
