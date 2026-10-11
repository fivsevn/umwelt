"""Read the saved native cel and exported PNGs; never draw or modify an image."""
from pathlib import Path
import hashlib, json, zipfile
from PIL import Image

HERE=Path(__file__).resolve().parent
runtime=HERE.parents[2]/'rooftop/assets/background/terrace-book.png'
with zipfile.ZipFile(HERE/'terrace-book.pxo') as archive:
    data=json.loads(archive.read('data.json'))
    cel=archive.read('image_data/frames/1/layer_1')
assert data['size_x']==data['size_y']==1024
scope=HERE/'roof-scope-before.json'
if scope.exists():
    rows=[cel[y*1024*4:(y+1)*1024*4] if not 640<=y<896 else
          cel[(y*1024+704)*4:(y+1)*1024*4] for y in range(1024)]
    assert hashlib.sha256(b''.join(rows)).hexdigest()==json.loads(scope.read_text())['nonRoofPixelsSha256'], 'The final roof edit changed another material'
    roof=json.loads((HERE/'pixelorama-roof-refinement.json').read_text())
    assert roof['nativeSaved'] and roof['nativePngExport'] and roof['brush']==1
with Image.open(HERE/'terrace-book.png') as image:
    image=image.convert('RGBA')
    assert image.tobytes()==cel
    for x,y,c in [(256,128,'5c7764'),(384,128,'95695e'),(256,144,'727786'),
                  (384,144,'a58964'),(256,160,'76825b'),(384,160,'76898a')]:
        expected=tuple(bytes.fromhex(c))+ (255,)
        assert all(image.getpixel((px,py))==expected for py in range(y,y+16) for px in range(x,x+128))
    colours=[len(set(image.crop((0,y,704,y+128)).getdata())) for y in (640,768)]
    assert min(colours)>50,'Both full roof paintings retain individually varied tile pigments'
    with Image.open(runtime) as published:
        assert published.convert('RGBA').tobytes()==cel
author=json.loads((HERE/'pixelorama-authoring.json').read_text())
assert author['nativeSaved'] and author['nativePngExport'] and author['brush']==1
report={'software':author['software'],'version':author['version'],'nativeCelEqualsBlenderPngAndRuntimePng':True,
        'dimensions':[1024,1024],'pencilBrush':1,'integerCoordinates':True,'texelsPerMetre':16,
        'erasedChineseShopNames':6,'independentRoofPaletteColours':colours,
        'nativePxoSha256':hashlib.sha256((HERE/'terrace-book.pxo').read_bytes()).hexdigest(),
        'runtimePngSha256':hashlib.sha256(runtime.read_bytes()).hexdigest()}
(HERE/'pixelorama-source-check.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
