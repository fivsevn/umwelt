"""Reopen the actual saved PXO in Pixelorama and independently inspect bytes."""
from pathlib import Path
import hashlib
import json
import runpy
import zipfile
from PIL import Image

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent / 'rooftop-weathering-07'
AUTHOR = runpy.run_path(str(HERE / 'paint-pixelorama.py'))
FIELDS = json.loads((HERE / 'atlas-scope.json').read_text())
CHECK = runpy.run_path(str(SOURCE / 'check-materials-pixelorama.py'))['GD']
CHECK = CHECK.replace('--rooftop-floor-check', '--rooftop-rough-check')


def check():
    AUTHOR['run_native'](CHECK, '--rooftop-rough-check', 'RooftopRoughCheck')
    with zipfile.ZipFile(HERE/'terrace-book.pxo') as archive:
        data = json.loads(archive.read('data.json'))
        cel = archive.read('image_data/frames/1/layer_1')
    with zipfile.ZipFile(SOURCE/'terrace-book.pxo') as archive:
        before = archive.read('image_data/frames/1/layer_1')
    with Image.open(HERE/'terrace-book.png') as png:
        exported = png.convert('RGBA').tobytes()
    with Image.open(HERE/'native-reopened-atlas.png') as png:
        reopened = png.convert('RGBA').tobytes()
    assert [data['size_x'],data['size_y']]==[1024,1024]
    assert cel==exported==reopened
    changed={name:0 for name in FIELDS}
    outside=0
    for y in range(1024):
        for x in range(1024):
            offset=(y*1024+x)*4
            assert cel[offset+3]==before[offset+3], 'Alpha coverage must stay unchanged'
            if cel[offset:offset+4]==before[offset:offset+4]:
                continue
            field=next((name for name,(a,b,w,h) in FIELDS.items() if a<=x<a+w and b<=y<b+h),None)
            if field is None:
                outside+=1
            else:
                changed[field]+=1
    assert outside==0 and sum(changed.values())>0
    # Entire cleared sign strips remain byte identical, including blank fields.
    for sx,sy in [(256,128),(384,128),(256,144),(384,144),(256,160),(384,160)]:
        assert all(cel[(y*1024+sx)*4:(y*1024+sx+128)*4]==before[(y*1024+sx)*4:(y*1024+sx+128)*4] for y in range(sy,sy+16))
    plan=json.loads((HERE/'palette-pencil-plan.json').read_text())
    assert plan['brush']==1 and plan['texelsPerMetre']==16
    assert all(type(v)==int for stroke in plan['strokes'] for p in stroke['points'] for v in p)
    author=json.loads((HERE/'pixelorama-authoring.json').read_text())
    native=json.loads((HERE/'pixelorama-native-reopened.json').read_text())
    assert author['nativeSaved'] and author['nativePngExport'] and native['nativePxoReopened']
    report={'nativeSoftware':'Pixelorama','version':author['version'],'nativePxoReopened':True,'nativeCelEqualsPngAndReopenedPng':True,'dimensions':[1024,1024],'texelsPerMetre':16,'pencilBrush':1,'integerStrokeCoordinates':True,'alphaCoverageUnchanged':True,'erasedShopSignStripsByteIdentical':True,'changedPixelsOutsideAuthorizedScope':outside,'fieldChangedPixels':changed,'paletteCounts':{f['name']:{'before':f['beforeColors'],'after':f['afterColors']} for f in plan['fields']},'pxoSha256':hashlib.sha256((HERE/'terrace-book.pxo').read_bytes()).hexdigest(),'pngSha256':hashlib.sha256((HERE/'terrace-book.png').read_bytes()).hexdigest()}
    (HERE/'pixelorama-scope-check.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report))


if __name__=='__main__':
    check()
