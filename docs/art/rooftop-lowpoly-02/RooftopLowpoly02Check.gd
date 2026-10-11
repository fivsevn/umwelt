extends Node
func _ready():
 if "--rooftop-lowpoly-02-check" in OS.get_cmdline_user_args():
  Global.pixelorama_opened.connect(check_source,CONNECT_ONE_SHOT)
func check_source():
 var path=""
 for arg in OS.get_cmdline_user_args():
  if arg.begins_with("--book-dir="):path=arg.trim_prefix("--book-dir=")
 var project=Global.current_project
 if project.name!="terrace-book" or project.size!=Vector2i(1024,1024):
  get_tree().quit(2)
  return
 var main_png=project.frames[0].cels[0].get_image().save_png(path.path_join("native-reopened-atlas.png"))
 OpenSave.open_pxo_file(path.path_join("distance-facades.pxo"))
 project=Global.current_project
 if project.name!="distance-facades" or project.size!=Vector2i(2048,2048):
  get_tree().quit(3)
  return
 var far_png=project.frames[0].cels[0].get_image().save_png(path.path_join("native-reopened-distance-facades.png"))
 var report={"software":"Pixelorama","version":Global.current_version,"nativeMainPxoReopened":true,"nativeFarPxoReopened":true,"nativeMainReopenedPngExport":main_png==OK,"nativeFarReopenedPngExport":far_png==OK}
 var file=FileAccess.open(path.path_join("pixelorama-native-reopened.json"),FileAccess.WRITE)
 file.store_string(JSON.stringify(report,"  "))
 print("NATIVE LOWPOLY 02 SOURCES REOPENED ",JSON.stringify(report))
 get_tree().quit(0 if main_png==OK and far_png==OK else 4)
