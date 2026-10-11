"""Read the native PXO cel and prove it equals the runtime PNG. Never paints pixels."""
from pathlib import Path
import json,zipfile,hashlib
from PIL import Image
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[2];PNG=ROOT/'rooftop/assets/background/terrace-book.png'
with zipfile.ZipFile(HERE/'terrace-book.pxo')as archive:
 project=json.loads(archive.read('data.json'));cel=archive.read('image_data/frames/1/layer_1')
with Image.open(PNG)as image:assert image.convert('RGBA').tobytes()==cel
record=json.loads((HERE/'pixelorama-authoring.json').read_text());assert record['native_saved'] and record['native_png_export']
report={'native_pxo_cel_equals_runtime_png':True,'size':[project['size_x'],project['size_y']],'sha256':hashlib.sha256(PNG.read_bytes()).hexdigest(),'bytes':PNG.stat().st_size,'native_source_bytes':(HERE/'terrace-book.pxo').stat().st_size}
(HERE/'pixelorama-source-check.json').write_text(json.dumps(report,indent=2));print(report)
