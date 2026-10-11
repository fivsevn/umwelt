extends Node
func _ready():
 if "--rooftop-floor-check" in OS.get_cmdline_user_args():
  Global.pixelorama_opened.connect(check_source, CONNECT_ONE_SHOT)
func check_source():
 var path=""
 for arg in OS.get_cmdline_user_args():
  if arg.begins_with("--book-dir="):path=arg.trim_prefix("--book-dir=")
 var project=Global.current_project
 if project.name!="terrace-book" or project.size!=Vector2i(1024,1024):
  push_error("Expected saved terrace-book native source")
  get_tree().quit(2)
  return
 var cel=project.frames[0].cels[0].get_image()
 var png=cel.save_png(path.path_join("native-reopened-atlas.png"))
 var north=cel.get_region(Rect2i(512,0,128,256))
 north.resize(512,1024,Image.INTERPOLATE_NEAREST)
 var south=cel.get_region(Rect2i(640,0,128,128))
 south.resize(512,512,Image.INTERPOLATE_NEAREST)
 var north_status=north.save_png(path.path_join("north-floor-review.png"))
 var south_status=south.save_png(path.path_join("south-floor-review.png"))
 var report={"software":"Pixelorama","version":Global.current_version,"nativePxoReopened":true,"projectSize":[project.size.x,project.size.y],"frames":project.frames.size(),"layers":project.layers.size(),"nativeReopenedPngExport":png==OK,"reviewCropsNearestScale":4,"reviewCropsExported":north_status==OK and south_status==OK}
 var file=FileAccess.open(path.path_join("pixelorama-native-reopened.json"),FileAccess.WRITE)
 file.store_string(JSON.stringify(report,"  "))
 print("NATIVE PXO REOPENED ",JSON.stringify(report))
 get_tree().quit(0 if png==OK else 3)
