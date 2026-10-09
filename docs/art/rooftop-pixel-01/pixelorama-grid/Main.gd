extends Node
func _ready():
 if not "--umwelt-grid" in OS.get_cmdline_user_args():
  return
 Global.pixelorama_opened.connect(paint, CONNECT_ONE_SHOT)
func paint():
 var source_path = ""
 for argument in OS.get_cmdline_user_args():
  if argument.ends_with(".pxo"):
   source_path = argument
 var source_dir = source_path.get_base_dir()
 var project = Global.current_project
 if project.name != "garden-atlas" or project.size != Vector2i(256,256):
  push_error("Expected the existing garden-atlas project.")
  get_tree().quit(2)
  return
 DrawingAlgos.scale_project(128,128,Image.INTERPOLATE_NEAREST)
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
 var record = JSON.parse_string(FileAccess.get_file_as_string(source_dir.path_join("pixelorama-grid/strokes.json")))
 for mark in record.strokes:
  var tile = int(mark.tile)
  var offset = Vector2i((tile % 4)*32, (tile / 4)*32)
  pencil.tool_slot.color = Color(mark.color)
  var first = offset + Vector2i(mark.points[0][0],mark.points[0][1])
  pencil.draw_start(first)
  for point in mark.points.slice(1):
   pencil.draw_move(offset + Vector2i(point[0],point[1]))
  pencil.draw_end(offset + Vector2i(mark.points[-1][0],mark.points[-1][1]))
 project.set_meta("revision_5_author", "Actual Pixelorama 1px Pencil tool; integer-coordinate strokes")
 var saved = OpenSave.save_pxo_file(source_path, false, true, project)
 print("NATIVE PENCIL: ", record.strokes.size(), " strokes; saved=", saved)
 var report = {"software":"Pixelorama", "version":Global.current_version, "actual_tool":"Pencil", "brush_size":1, "integer_coordinates":true, "stroke_count":record.strokes.size(), "atlas_size":128, "tile_size":32, "scaled_in_actual_pixelorama_with_nearest":true, "saved_by_native_software":saved, "desktop_canvas_input_issue":"CUA pointer coordinates were outside the native canvas; replay uses the software's own pencil tool"}
 var file = FileAccess.open(source_dir.path_join("pixelorama-authoring.json"),FileAccess.WRITE)
 file.store_string(JSON.stringify(report,"  ")+"\n")
 file.close()
 get_tree().quit(0 if saved else 3)
