extends Node
func _ready():
 if "--rooftop-far-check" in OS.get_cmdline_user_args():
  Global.pixelorama_opened.connect(check_source,CONNECT_ONE_SHOT)
func check_source():
 var path=""
 for arg in OS.get_cmdline_user_args():
  if arg.begins_with("--book-dir="):path=arg.trim_prefix("--book-dir=")
 OpenSave.open_pxo_file(path.path_join("distance-facades.pxo"))
 var project=Global.current_project
 if project.name!="distance-facades" or project.size!=Vector2i(2048,2048):
  get_tree().quit(2)
  return
 var png=project.frames[0].cels[0].get_image().save_png(path.path_join("native-reopened-distance-facades.png"))
 var report={"software":"Pixelorama","version":Global.current_version,"nativePxoReopened":true,"name":project.name,"dimensions":[2048,2048],"frames":project.frames.size(),"layers":project.layers.size(),"nativeReopenedPngExport":png==OK}
 var file=FileAccess.open(path.path_join("pixelorama-distant-reopened.json"),FileAccess.WRITE)
 file.store_string(JSON.stringify(report,"  "))
 print("NATIVE DISTANT PXO REOPENED ",JSON.stringify(report))
 get_tree().quit(0 if png==OK else 3)
