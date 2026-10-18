extends Node

func _ready():
	if "--umwelt-icon" in OS.get_cmdline_user_args():
		Global.pixelorama_opened.connect(author_icon, CONNECT_ONE_SHOT)

func author_icon():
	var directory = ""
	var check = "--check-source" in OS.get_cmdline_user_args()
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--icon-dir="):
			directory = arg.trim_prefix("--icon-dir=")
	if check:
		var project = Global.current_project
		var error = project.frames[0].cels[0].get_image().save_png(directory.path_join("reopened.png"))
		get_tree().quit(0 if error == OK else 3)
		return
	var record = JSON.parse_string(FileAccess.get_file_as_string(directory.path_join("pencil-strokes.json")))
	OpenSave.open_image_as_new_tab("icon.png", Image.create(record.size, record.size, false, Image.FORMAT_RGBA8))
	var project = Global.current_project
	project.name = record.name
	project.layers[0].name = "Placeholder icon / native Pencil"
	project.current_layer = 0
	project.selected_cels = [Vector2i(0, 0)]
	Tools.assign_tool("Pencil", MOUSE_BUTTON_LEFT)
	Tools.alpha_locked = false
	var pencil = Tools._slots[MOUSE_BUTTON_LEFT].tool_node
	pencil._brush_size = 1
	pencil._brush_density = 100
	pencil._strength = 1.0
	pencil._overwrite = true
	pencil.update_brush()
	for stroke in record.strokes:
		pencil.tool_slot.color = Color(stroke.color)
		pencil.draw_start(Vector2i(stroke.points[0][0], stroke.points[0][1]))
		for point in stroke.points.slice(1):
			pencil.draw_move(Vector2i(point[0], point[1]))
		pencil.draw_end(Vector2i(stroke.points[-1][0], stroke.points[-1][1]))
	var saved = OpenSave.save_pxo_file(directory.path_join("icon.pxo"), false, true, project)
	var exported = project.frames[0].cels[0].get_image().save_png(directory.path_join("../../assets/icon.png")) == OK
	var report = {"software": "Pixelorama", "version": Global.current_version, "tool": "Pencil", "size": record.size, "nativeSaved": saved, "nativePngExport": exported}
	var file = FileAccess.open(directory.path_join("authoring.json"), FileAccess.WRITE)
	file.store_string(JSON.stringify(report, "  "))
	print(JSON.stringify(report))
	get_tree().quit(0 if saved and exported else 3)
