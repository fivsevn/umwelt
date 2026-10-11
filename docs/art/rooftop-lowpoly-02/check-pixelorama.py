"""Independently reopen both saved PXOs in installed Pixelorama, then audit.

Does not redraw, re-quantize or overwrite either source PNG. Pixelorama only
exports separate reopened inspection PNGs. Python compares existing bytes.
"""
from pathlib import Path
import hashlib
import json
import runpy
import zipfile
import numpy as np
from PIL import Image

HERE=Path(__file__).resolve().parent
NATIVE=runpy.run_path(str(HERE/'pixelorama-native.py'))
GD='''extends Node
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
'''


def image(path):
    with Image.open(path) as im:
        return np.asarray(im.convert('RGBA'))


def pxo(path):
    with zipfile.ZipFile(path) as archive:
        data=json.loads(archive.read('data.json'))
        cel=archive.read('image_data/frames/1/layer_1')
    return data,cel


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check():
    NATIVE['run_native'](GD,'--rooftop-lowpoly-02-check','RooftopLowpoly02Check')
    author=json.loads((HERE/'pixelorama-authoring.json').read_text())
    reopen=json.loads((HERE/'pixelorama-native-reopened.json').read_text())
    assert author['nativeSaved'] and author['nativePngExport']
    assert author['farNativeSaved'] and author['farNativePngExport']
    assert reopen['nativeMainPxoReopened'] and reopen['nativeFarPxoReopened']
    plan=json.loads((HERE/'palette-pencil-plan.json').read_text())
    baseline=json.loads((HERE/'integration-baseline.json').read_text())
    assert plan['sourcePxoSha256']==baseline['pixeloramaPxoSha256']
    assert plan['sourceFarPxoSha256']==baseline['farPixeloramaPxoSha256']
    assert plan['brush']==1 and plan['texelsPerMetre']==16
    assert all(type(n)==int for mark in plan['strokes']+plan['farStrokes'] for point in mark['points'] for n in point)
    main=image(HERE/'terrace-book.png')
    before=image(HERE/'before-terrace-book.png')
    data,cel=pxo(HERE/'terrace-book.pxo')
    assert [data['size_x'],data['size_y']]==[1024,1024]
    assert cel==main.tobytes()==image(HERE/'native-reopened-atlas.png').tobytes()
    assert np.array_equal(main[:,:,3],before[:,:,3])
    scope=json.loads((HERE/'atlas-scope.json').read_text())
    outside=np.ones((1024,1024),dtype=bool)
    changes={}
    palette_counts={}
    for name,(x,y,w,h) in scope.items():
        outside[y:y+h,x:x+w]=False
        changes[name]=int(np.count_nonzero(np.any(main[y:y+h,x:x+w]!=before[y:y+h,x:x+w],axis=2)))
        palette_counts[name]={'before':len(np.unique(before[y:y+h,x:x+w,:3].reshape(-1,3),axis=0)),
                             'after':len(np.unique(main[y:y+h,x:x+w,:3].reshape(-1,3),axis=0))}
    assert np.array_equal(main[outside],before[outside]), 'Out-of-scope pixels changed'
    for x,y in [(256,128),(384,128),(256,144),(384,144),(256,160),(384,160)]:
        assert np.array_equal(main[y:y+16,x:x+128],before[y:y+16,x:x+128]), 'Erased sign strip changed'
    main_changed=int(np.count_nonzero(np.any(main!=before,axis=2)))
    assert main_changed>0
    main_report={'nativeSoftware':'Pixelorama','nativePxoReopened':True,
                 'nativeCelEqualsPngAndReopenedPng':True,'dimensions':[1024,1024],
                 'texelsPerMetre':16,'pencilBrush':1,'nativePencilStrokes':len(plan['strokes']),
                 'integerStrokeCoordinates':True,'alphaCoverageExactlyPreserved':True,
                 'erasedShopSignStripsByteIdentical':True,'changedPixelsOutsideAuthorizedScope':0,
                 'changedPixels':main_changed,'reviewedFields':len(scope),
                 'fieldChangedPixels':changes,'actualRgbPaletteCounts':palette_counts,
                 'pxoSha256':digest(HERE/'terrace-book.pxo'),'pngSha256':digest(HERE/'terrace-book.png')}
    (HERE/'pixelorama-scope-check.json').write_text(json.dumps(main_report,indent=2)+'\n')
    far=image(HERE/'distance-facades.png')
    old_far=image(HERE/'before-distance-facades.png')
    far_data,far_cel=pxo(HERE/'distance-facades.pxo')
    assert [far_data['size_x'],far_data['size_y']]==[2048,2048]
    assert far_cel==far.tobytes()==image(HERE/'native-reopened-distance-facades.png').tobytes()
    assert np.array_equal(far[:,:,3],old_far[:,:,3])
    assert np.array_equal(far[old_far[:,:,3]==0],old_far[old_far[:,:,3]==0])
    far_changed=int(np.count_nonzero(np.any(far!=old_far,axis=2)))
    assert far_changed>0
    mask=HERE.parents[2]/'rooftop/assets/background/distance-lights.png'
    assert mask.read_bytes()==(HERE/'before-distance-lights.png').read_bytes()
    far_report={'nativeSoftware':'Pixelorama','nativePxoReopened':True,
                'nativeCelEqualsPngAndReopenedPng':True,'dimensions':[2048,2048],
                'nativePencilStrokes':len(plan['farStrokes']),'pencilBrush':1,
                'rgbColorCountExcludingTransparent':len(np.unique(far[far[:,:,3]>0,:3],axis=0)),
                'alphaCoverageExactlyPreserved':True,'transparentPaddingExactlyPreserved':True,
                'lightMaskBytesExactlyPreserved':True,'changedPixels':far_changed,
                'pxoSha256':digest(HERE/'distance-facades.pxo'),'pngSha256':digest(HERE/'distance-facades.png')}
    (HERE/'pixelorama-distant-scope-check.json').write_text(json.dumps(far_report,indent=2)+'\n')
    print(json.dumps({'main':main_report,'far':far_report},indent=2))


if __name__=='__main__':
    check()
