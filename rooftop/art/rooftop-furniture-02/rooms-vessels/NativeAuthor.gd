extends Node
func _ready():
 if "--furniture-native" in OS.get_cmdline_user_args():Global.pixelorama_opened.connect(run_native, CONNECT_ONE_SHOT)
func run_native():
 var dir=""
 var check=false
 for arg in OS.get_cmdline_user_args():
  if arg.begins_with("--furniture-dir="):dir=arg.trim_prefix("--furniture-dir=")
  if arg=="--check-source":check=true
 var record=JSON.parse_string(FileAccess.get_file_as_string(dir.path_join("pencil-strokes.json")))
 var size=int(record.size)
 if check:
  var p=Global.current_project
  var error=p.frames[0].cels[0].get_image().save_png(dir.path_join("reopened.png"))
  print("NATIVE REOPEN ",JSON.stringify({"nativePxoReopened":true,"size":[p.size.x,p.size.y],"exported":error==OK}))
  get_tree().quit(0 if error==OK else 3)
  return
 OpenSave.open_image_as_new_tab("atlas.png",Image.create(size,size,false,Image.FORMAT_RGBA8))
 var p=Global.current_project
 p.name="furniture-atlas"
 p.layers[0].name="New native Pencil faces / uniform 16px per metre"
 p.current_layer=0;p.selected_cels=[Vector2i(0,0)]
 Tools.assign_tool("Pencil",MOUSE_BUTTON_LEFT)
 Tools.alpha_locked=false
 var pencil=Tools._slots[MOUSE_BUTTON_LEFT].tool_node
 pencil._brush_size=1;pencil._brush_density=100;pencil._strength=1.0;pencil._overwrite=true;pencil.update_brush()
 for mark in record.strokes:
  pencil.tool_slot.color=Color(mark.color)
  pencil.draw_start(Vector2i(mark.points[0][0],mark.points[0][1]))
  for point in mark.points.slice(1):pencil.draw_move(Vector2i(point[0],point[1]))
  pencil.draw_end(Vector2i(mark.points[-1][0],mark.points[-1][1]))
 p.set_meta("texelsPerMetre",16)
 var saved=OpenSave.save_pxo_file(dir.path_join("atlas.pxo"),false,true,p)
 var error=p.frames[0].cels[0].get_image().save_png(dir.path_join("atlas.png"))
 var report={"software":"Pixelorama","version":Global.current_version,"tool":"Pencil","brush":1,"strokes":record.strokes.size(),"nativeSaved":saved,"nativePngExport":error==OK,"texelsPerMetre":16,"size":size}
 var file=FileAccess.open(dir.path_join("pixelorama-authoring.json"),FileAccess.WRITE)
 file.store_string(JSON.stringify(report,"  "))
 print("NATIVE AUTHOR ",JSON.stringify(report))
 get_tree().quit(0 if saved and error==OK else 3)
