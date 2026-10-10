"""Read-only native Pixelorama cel verification. Does not create raster pixels."""
from pathlib import Path
import hashlib, json, zipfile
from PIL import Image
HERE=Path(__file__).resolve().parent
PNG=HERE.parents[2]/'rooftop/assets/pixel/material-book.png'
with zipfile.ZipFile(HERE/'material-book.pxo') as archive:
    project=json.loads(archive.read('data.json'))
    cel=archive.read('image_data/frames/1/layer_1')
with Image.open(PNG) as image:
    assert image.size==(512,512)
    assert image.convert('RGBA').tobytes()==cel
assert project['size_x']==512 and project['size_y']==512
layout=json.loads((HERE/'book-layout.json').read_text())
record=json.loads((HERE/'pixelorama-authoring.json').read_text())
assert record['native_saved'] and record['native_png_export']
assert record['fields']==len(layout['fields'])
report={'software':'Pixelorama','native_cel_equals_png_rgba':True,'native_dimensions':[512,512],
    'fields':record['fields'],'native_pencil_strokes':record['strokes'],
    'png_bytes':PNG.stat().st_size,'pxo_bytes':(HERE/'material-book.pxo').stat().st_size,
    'png_sha256':hashlib.sha256(PNG.read_bytes()).hexdigest()}
(HERE/'native-source-check.json').write_text(json.dumps(report,indent=2)+'\n')
print(report)
