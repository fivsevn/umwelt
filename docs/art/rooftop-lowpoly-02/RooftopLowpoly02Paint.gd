extends Node
func _ready():
 if "--rooftop-lowpoly-02-paint" in OS.get_cmdline_user_args():
  Global.pixelorama_opened.connect(paint,CONNECT_ONE_SHOT)
func palette(cel:Image, mapping:Dictionary, rect:Array) -> int:
 var changed=0
 for y in range(int(rect[1]),int(rect[1]+rect[3])):
  for x in range(int(rect[0]),int(rect[0]+rect[2])):
   var old=cel.get_pixel(x,y)
   if old.a<=0:continue
   var key=old.to_html(false)
   if not mapping.has(key):continue
   var revised=Color(mapping[key])
   revised.a=old.a
   if revised!=old:
    cel.set_pixel(x,y,revised)
    changed+=1
 return changed
func pencil_marks(project, marks:Array):
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
 for mark in marks:
  pencil.tool_slot.color=Color(mark.color)
  var point=Vector2i(mark.points[0][0],mark.points[0][1])
  pencil.draw_start(point)
  pencil.draw_end(point)
func paint():
 var path=""
 for arg in OS.get_cmdline_user_args():
  if arg.begins_with("--book-dir="):path=arg.trim_prefix("--book-dir=")
 var record=JSON.parse_string(FileAccess.get_file_as_string(path.path_join("palette-pencil-plan.json")))
 var project=Global.current_project
 if project.name!="terrace-book" or project.size!=Vector2i(1024,1024):
  get_tree().quit(2)
  return
 var cel=project.frames[0].cels[0].get_image()
 var main_changed=0
 for field in record.fields:main_changed+=palette(cel,field.palette,field.rect)
 pencil_marks(project,record.strokes)
 project.set_meta("lowpoly_02_refinement","Continued saved 01 PXO. Modest adjacent pigment grouping, retain photo-led crack/repair/stain silhouettes, native 1px Pencil pin chips. No model or UV edits; 16 texels/metre.")
 var main_saved=OpenSave.save_pxo_file(path.path_join("terrace-book.pxo"),false,true,project)
 var main_png=project.frames[0].cels[0].get_image().save_png(path.path_join("terrace-book.png"))
 OpenSave.open_pxo_file(path.path_join("distance-facades.pxo"))
 project=Global.current_project
 if project.name!="distance-facades" or project.size!=Vector2i(2048,2048):
  get_tree().quit(3)
  return
 cel=project.frames[0].cels[0].get_image()
 var far_changed=palette(cel,record.farPalette,[0,0,2048,2048])
 pencil_marks(project,record.farStrokes)
 project.set_meta("lowpoly_02_refinement","Continued saved 01 distant PXO; limited adjacent pigments and sparse 1px Pencil chips. Preserve alpha, dimensions, UV layout and window-mask bytes.")
 var far_saved=OpenSave.save_pxo_file(path.path_join("distance-facades.pxo"),false,true,project)
 var far_png=project.frames[0].cels[0].get_image().save_png(path.path_join("distance-facades.png"))
 var report={"software":"Pixelorama","version":Global.current_version,"sourceRevision":"rooftop-lowpoly-01","nativeSaved":main_saved,"nativePngExport":main_png==OK,"farNativeSaved":far_saved,"farNativePngExport":far_png==OK,"paletteChangedPixels":main_changed,"farPaletteChangedPixels":far_changed,"strokes":record.strokes.size(),"farStrokes":record.farStrokes.size(),"tool":"Pencil","brush":1,"texelsPerMetre":16,"reviewedFields":record.fields.size(),"farPaletteColors":record.farColorsAfter}
 var file=FileAccess.open(path.path_join("pixelorama-authoring.json"),FileAccess.WRITE)
 file.store_string(JSON.stringify(report,"  "))
 print("LOWPOLY 02 NATIVE AUTHORING ",JSON.stringify(report))
 get_tree().quit(0 if main_saved and far_saved and main_png==OK and far_png==OK else 4)
