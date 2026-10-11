extends Node
func _ready():
 if "--rooftop-lowpoly-rougher" in OS.get_cmdline_user_args():
  Global.pixelorama_opened.connect(paint,CONNECT_ONE_SHOT)
func paint():
 var path=""
 for arg in OS.get_cmdline_user_args():
  if arg.begins_with("--book-dir="):path=arg.trim_prefix("--book-dir=")
 var project=Global.current_project
 if project.name!="terrace-book" or project.size!=Vector2i(1024,1024):
  push_error("Expected saved native atlas")
  get_tree().quit(2)
  return
 var record=JSON.parse_string(FileAccess.get_file_as_string(path.path_join("palette-pencil-plan.json")))
 var cel=project.frames[0].cels[0].get_image()
 var changed=0
 for field in record.fields:
  var r=field.rect
  for y in range(int(r[1]),int(r[1]+r[3])):
   for x in range(int(r[0]),int(r[0]+r[2])):
    var old=cel.get_pixel(x,y)
    var key=old.to_html(false)
    if field.palette.has(key):
     var revised=Color(field.palette[key])
     revised.a=old.a
     if revised!=old:
      cel.set_pixel(x,y,revised)
      changed+=1
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
 for mark in record.strokes:
  pencil.tool_slot.color=Color(mark.color)
  var point=Vector2i(mark.points[0][0],mark.points[0][1])
  pencil.draw_start(point)
  for p in mark.points.slice(1):pencil.draw_move(Vector2i(p[0],p[1]))
  pencil.draw_end(Vector2i(mark.points[-1][0],mark.points[-1][1]))
 project.set_meta("rough_surface_refinement","Restrained pigment separation and native one-pixel mineral-edge Pencil accents; original photo-led cracks/repairs/water footprints retained; geometry/UV unchanged; 16 texels per metre")
 var saved=OpenSave.save_pxo_file(path.path_join("terrace-book.pxo"),false,true,project)
 var png=project.frames[0].cels[0].get_image().save_png(path.path_join("terrace-book.png"))
 var report={"software":"Pixelorama","version":Global.current_version,"nativeSaved":saved,"nativePngExport":png==OK,"effect":"Native limited pigment groups and connected mineral chips","paletteChangedPixels":changed,"tool":"Pencil","brush":1,"strokes":record.strokes.size(),"texelsPerMetre":16,"source":"rooftop-weathering-07/terrace-book.pxo"}
 var file=FileAccess.open(path.path_join("pixelorama-pass02-authoring.json"),FileAccess.WRITE)
 file.store_string(JSON.stringify(report,"  "))
 print("NATIVE ROUGH SURFACE ",JSON.stringify(report))
 get_tree().quit(0 if saved and png==OK else 3)
