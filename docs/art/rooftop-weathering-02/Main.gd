extends Node
func _ready():
 if "--rooftop-weathering" in OS.get_cmdline_user_args():
  Global.pixelorama_opened.connect(paint, CONNECT_ONE_SHOT)
func paint():
 var path=""
 for arg in OS.get_cmdline_user_args():
  if arg.begins_with("--book-dir="): path=arg.trim_prefix("--book-dir=")
 var record=JSON.parse_string(FileAccess.get_file_as_string(path.path_join("pencil-strokes.json")))
 OpenSave.open_image_as_new_tab("terrace-book.png",Image.create(1024,1024,false,Image.FORMAT_RGBA8))
 var project=Global.current_project
 project.name="terrace-book"
 project.layers[0].name="Concrete, limewash, old brick-red tiles and iron / 1 px"
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
 var stroke_index=0
 for mark in record.strokes:
  pencil.tool_slot.color=Color(mark.color)
  var points=mark.points
  pencil.draw_start(Vector2i(points[0][0],points[0][1]))
  for point in points.slice(1): pencil.draw_move(Vector2i(point[0],point[1]))
  pencil.draw_end(Vector2i(points[-1][0],points[-1][1]))
  stroke_index+=1
  if stroke_index%5000==0:
   var progress=FileAccess.open(path.path_join("paint-progress.json"),FileAccess.WRITE)
   progress.store_string(JSON.stringify({"painted":stroke_index,"total":record.strokes.size()}))
   progress.close()
 project.set_meta("weathering_revision","Photo-guided native 1 px Pencil; 16 px/metre; no shop lettering")
 var saved=OpenSave.save_pxo_file(path.path_join("terrace-book.pxo"),false,true,project)
 var exported=project.frames[0].cels[0].get_image().save_png(path.path_join("terrace-book.png"))
 var file=FileAccess.open(path.path_join("pixelorama-authoring.json"),FileAccess.WRITE)
 file.store_string(JSON.stringify({"software":"Pixelorama","version":Global.current_version,"tool":"Pencil","brush":1,"integerCoordinates":true,"strokes":record.strokes.size(),"nativeSaved":saved,"nativePngExport":exported==OK,"texelsPerMetre":16,"erasedChineseShopNames":6},"  "))
 print("NATIVE WEATHERING saved=",saved," export=",exported," strokes=",record.strokes.size())
 get_tree().quit(0 if saved and exported==OK else 3)
