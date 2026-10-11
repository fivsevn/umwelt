extends Node
func _ready():
 if "--terrace-shell" in OS.get_cmdline_user_args():
  Global.pixelorama_opened.connect(paint, CONNECT_ONE_SHOT)
func paint():
 var path = ""
 for arg in OS.get_cmdline_user_args():
  if arg.begins_with("--book-dir="): path=arg.trim_prefix("--book-dir=")
 var record=JSON.parse_string(FileAccess.get_file_as_string(path.path_join("pencil-strokes.json")))
 OpenSave.open_image_as_new_tab("terrace-book.png",Image.create(512,512,false,Image.FORMAT_RGBA8))
 var project=Global.current_project
 project.name="terrace-book"
 project.layers[0].name="Unique old floors and architectural pigments"
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
  pencil.draw_start(Vector2i(mark.points[0][0],mark.points[0][1]))
  pencil.draw_move(Vector2i(mark.points[1][0],mark.points[1][1]))
  pencil.draw_end(Vector2i(mark.points[1][0],mark.points[1][1]))
 Tools.assign_tool("Text",MOUSE_BUTTON_LEFT)
 var text_tool=Tools._slots[MOUSE_BUTTON_LEFT].tool_node
 var native_font=FontFile.new()
 native_font.load_dynamic_font("/System/Library/Fonts/STHeiti Medium.ttc")
 native_font.antialiasing=TextServer.FONT_ANTIALIASING_NONE
 text_tool.font.base_font=native_font
 text_tool.text_size=14
 text_tool.tool_slot.color=Color("#e0ddd0")
 for sign in record.signs:
  text_tool.draw_start(Vector2i(sign.x+2,sign.y))
  text_tool.text_edit.text=sign.text
  text_tool.text_edit.position=Vector2(sign.x+2,sign.y)
  text_tool.text_edit.custom_minimum_size=Vector2.ZERO
  text_tool.text_edit.size=Vector2(126,16)
  text_tool.text_to_pixels()
 Tools.assign_tool("Pencil",MOUSE_BUTTON_LEFT)
 var saved=OpenSave.save_pxo_file(path.path_join("terrace-book.pxo"),false,true,project)
 var exported=project.frames[0].cels[0].get_image().save_png(path.path_join("../../../rooftop/assets/background/terrace-book.png"))
 var file=FileAccess.open(path.path_join("pixelorama-authoring.json"),FileAccess.WRITE)
 file.store_string(JSON.stringify({"software":"Pixelorama","version":Global.current_version,"tool":"Pencil and Text","strokes":record.strokes.size(),"native_text_signs":record.signs.size(),"native_saved":saved,"native_png_export":exported==OK,"texels_per_unit":8},"  "))
 print("TERRACE BOOK saved=",saved," export=",exported)
 get_tree().quit(0 if saved and exported==OK else 3)
