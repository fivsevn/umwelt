"""Independently reopen the distant facade PXO in actual Pixelorama."""
from pathlib import Path
import hashlib
import json
import runpy
import zipfile
import numpy as np
from PIL import Image

HERE=Path(__file__).resolve().parent
NATIVE=runpy.run_path(str(HERE/'paint-pixelorama.py'))
GD='''extends Node
func _ready():
 if "--rooftop-far-check" in OS.get_cmdline_user_args():
  Global.pixelorama_opened.connect(check_source,CONNECT_ONE_SHOT)
func check_source():
 var path=""
 for arg in OS.get_cmdline_user_args():
  if arg.begins_with("--book-dir="):path=arg.trim_prefix("--book-dir=")
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
'''


def inspect():
    # Reuse extension safety/saver infrastructure but open the distant project.
    # The launcher accepts terrace-book.pxo; its native callback explicitly
    # opens the saved distant PXO before verification (no image transformation).
    gd=GD.replace('var project=Global.current_project','OpenSave.open_pxo_file(path.path_join("distance-facades.pxo"))\n var project=Global.current_project')
    NATIVE['run_native'](gd,'--rooftop-far-check','RooftopDistantCheck')
    with zipfile.ZipFile(HERE/'distance-facades.pxo') as archive:
        data=json.loads(archive.read('data.json'))
        cel=archive.read('image_data/frames/1/layer_1')
    images=[]
    for name in ('distance-facades.png','native-reopened-distance-facades.png','before-distance-facades.png'):
        with Image.open(HERE/name) as im:images.append(np.asarray(im.convert('RGBA')))
    current,reopened,before=images
    assert [data['size_x'],data['size_y']]==[2048,2048]
    assert cel==current.tobytes()==reopened.tobytes()
    assert np.array_equal(current[:,:,3],before[:,:,3]), 'Distant alpha coverage must stay exact'
    assert np.array_equal(current[before[:,:,3]==0],before[before[:,:,3]==0]), 'Transparent padding unchanged'
    mask=HERE.parents[2]/'rooftop/assets/background/distance-lights.png'
    assert mask.read_bytes()==(HERE/'before-distance-lights.png').read_bytes()
    colors=np.unique(current[current[:,:,3]>0,:3],axis=0)
    report={'nativeSoftware':'Pixelorama','nativePxoReopened':True,'nativeCelEqualsPngAndReopenedPng':True,'dimensions':[2048,2048],'rgbColorCountExcludingTransparent':len(colors),'alphaCoverageExactlyPreserved':True,'transparentPaddingExactlyPreserved':True,'lightMaskBytesExactlyPreserved':True,'changedPixels':int(np.count_nonzero(np.any(current!=before,axis=2))),'pxoSha256':hashlib.sha256((HERE/'distance-facades.pxo').read_bytes()).hexdigest(),'pngSha256':hashlib.sha256((HERE/'distance-facades.png').read_bytes()).hexdigest()}
    (HERE/'pixelorama-distant-scope-check.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report))


if __name__=='__main__':inspect()
