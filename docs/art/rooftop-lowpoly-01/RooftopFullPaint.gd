extends Node
func _ready():
 if "--rooftop-all-scene-paint" in OS.get_cmdline_user_args():
  Global.pixelorama_opened.connect(paint,CONNECT_ONE_SHOT)
func paint():
 var path=""
 for arg in OS.get_cmdline_user_args():
  if arg.begins_with("--book-dir="):path=arg.trim_prefix("--book-dir=")
 var record=JSON.parse_string(FileAccess.get_file_as_string(path.path_join("all-scene-palette-plan.json")))
 var project=Global.current_project
 if project.name!="terrace-book" or project.size!=Vector2i(1024,1024):
  get_tree().quit(2)
  return
 var cel=project.frames[0].cels[0].get_image()
 var changed=0
 for field in record.fields:
  var r=field.rect
  for y in range(int(r[1]),int(r[1]+r[3])):
   for x in range(int(r[0]),int(r[0]+r[2])):
    var old=cel.get_pixel(x,y)
    var revised=Color(field.palette[old.to_html(false)])
    revised.a=old.a
    if revised!=old:cel.set_pixel(x,y,revised);changed+=1
 project.set_meta("all_scene_material_review","All 28 real atlas charts reviewed; no visibility crop; hidden sides/bottoms use the same native charts. Single-pigment glass/lamp/tire charts retain deliberately limited colours.")
 var main_saved=OpenSave.save_pxo_file(path.path_join("terrace-book.pxo"),false,true,project)
 var main_png=cel.save_png(path.path_join("terrace-book.png"))
 var far=Image.load_from_file(path.path_join(record.farSource))
 if far==null or far.get_size()!=Vector2i(2048,2048):
  get_tree().quit(3)
  return
 OpenSave.open_image_as_new_tab("distance-facades.png",far)
 project=Global.current_project
 project.name="distance-facades"
 cel=project.frames[0].cels[0].get_image()
 var far_changed=0
 for y in range(2048):
  for x in range(2048):
   var old=cel.get_pixel(x,y)
   if old.a<=0:continue
   var key=old.to_html(false)
   if not record.farPalette.has(key):continue
   var revised=Color(record.farPalette[key])
   revised.a=old.a
   if revised!=old:cel.set_pixel(x,y,revised);far_changed+=1
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
 for mark in record.farPencilStrokes:
  var point=Vector2i(mark.points[0][0],mark.points[0][1])
  pencil.tool_slot.color=Color(mark.color)
  pencil.draw_start(point)
  pencil.draw_end(point)
 project.set_meta("far_scene_material_review","Imported original Blender facade bake, limited pigment groups and sparse native 1px Pencil flecks. Preserve physical mesh/UV, original atlas dimensions and alpha; no camera-specific painting.")
 var far_saved=OpenSave.save_pxo_file(path.path_join("distance-facades.pxo"),false,true,project)
 var far_png=cel.save_png(path.path_join("distance-facades.png"))
 var report={"software":"Pixelorama","version":Global.current_version,"mainNativeSaved":main_saved,"mainNativePngExport":main_png==OK,"distantNativeSaved":far_saved,"distantNativePngExport":far_png==OK,"allReviewedFields":record.allReviewedFields,"mainExtraChangedPixels":changed,"farChangedPixels":far_changed,"farPencilStrokes":record.farPencilStrokes.size(),"farMainColorsAfter":record.farMainColorsAfter,"brush":1,"lightMaskUntouched":true}
 var file=FileAccess.open(path.path_join("pixelorama-all-scene-authoring.json"),FileAccess.WRITE)
 file.store_string(JSON.stringify(report,"  "))
 print("ALL SCENE NATIVE MATERIALS ",JSON.stringify(report))
 get_tree().quit(0 if main_saved and far_saved and main_png==OK and far_png==OK else 4)
