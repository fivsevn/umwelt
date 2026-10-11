"""Independently reopen native PXO, export its cel in Pixelorama, then compare.

PIL is used for read-only byte inspection, never raster drawing or saving.
The two enlarged review crops are exported inside Pixelorama with nearest
neighbour interpolation and have no effect on the native source.
"""

from pathlib import Path
import hashlib
import json
import subprocess
import zipfile
from PIL import Image

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent / 'rooftop-weathering-02'
GD = '''extends Node
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
'''


def inspect():
    config = Path('/Users/d/Library/Application Support/Pixelorama/config.ini')
    backup = config.read_bytes()
    extension = config.parent / 'extensions/RooftopFloorCheck.zip'
    assert not extension.exists()
    (HERE / 'FloorCheck.gd').write_text(GD)
    (HERE / 'FloorCheck.tscn').write_text('[gd_scene load_steps=2 format=3]\n[ext_resource type="Script" path="res://src/Extensions/RooftopFloorCheck/FloorCheck.gd" id="1"]\n[node name="RooftopFloorCheck" type="Node"]\nscript = ExtResource("1")\n')
    (HERE / 'floor-check-extension.json').write_text(json.dumps({
        'name': 'RooftopFloorCheck', 'display_name': 'Native floor source verification',
        'description': 'Read saved PXO and export its native cel', 'author': '五月七日',
        'version': '0.1', 'supported_api_versions': [8], 'license': 'MIT', 'nodes': ['FloorCheck.tscn'],
    }))
    with zipfile.ZipFile(extension, 'w', zipfile.ZIP_DEFLATED) as z:
        for local, packed in [
            ('FloorCheck.gd', 'src/Extensions/RooftopFloorCheck/FloorCheck.gd'),
            ('FloorCheck.tscn', 'src/Extensions/RooftopFloorCheck/FloorCheck.tscn'),
            ('floor-check-extension.json', 'src/Extensions/RooftopFloorCheck/extension.json'),
        ]:
            z.write(HERE / local, packed)
    config.write_bytes(backup + b'\n[extensions]\nRooftopFloorCheck=true\n')
    try:
        result = subprocess.run([
            '/Applications/Pixelorama.app/Contents/MacOS/Pixelorama', '--headless', '--',
            str(HERE / 'terrace-book.pxo'), '--rooftop-floor-check', '--book-dir=' + str(HERE),
        ], capture_output=True, text=True, timeout=90)
        print(result.stdout[-1700:])
        print(result.stderr[-300:])
        assert result.returncode == 0
    finally:
        config.write_bytes(backup)
        extension.unlink(missing_ok=True)

    with zipfile.ZipFile(HERE / 'terrace-book.pxo') as archive:
        data = json.loads(archive.read('data.json'))
        cel = archive.read('image_data/frames/1/layer_1')
    with zipfile.ZipFile(SOURCE / 'terrace-book.pxo') as archive:
        before = archive.read('image_data/frames/1/layer_1')
    with Image.open(HERE / 'terrace-book.png') as im:
        exported = im.convert('RGBA').tobytes()
    with Image.open(HERE / 'native-reopened-atlas.png') as im:
        reopened = im.convert('RGBA').tobytes()
    assert data['size_x'] == data['size_y'] == 1024
    assert cel == exported == reopened, 'Saved native cel, export and reopened export must agree'
    changed, outside = [0, 0], 0
    rects = [(512, 0, 128, 256), (640, 0, 128, 128)]
    for y in range(1024):
        for x in range(1024):
            index = (y * 1024 + x) * 4
            if cel[index:index + 4] != before[index:index + 4]:
                region = next((n for n, (a, b, w, h) in enumerate(rects)
                               if a <= x < a + w and b <= y < b + h), None)
                if region is None:
                    outside += 1
                else:
                    changed[region] += 1
    assert outside == 0, 'A non-floor atlas pixel changed'
    author = json.loads((HERE / 'pixelorama-floor-refinement.json').read_text())
    assert author['nativeSaved'] and author['nativePngExport'] and author['brush'] == 1
    # Shop signs were already blank in 02.  Verify their exact saved pigments.
    signs = [(256, 128, '5c7764'), (384, 128, '95695e'),
             (256, 144, '727786'), (384, 144, 'a58964'),
             (256, 160, '76825b'), (384, 160, '76898a')]
    for sx, sy, color in signs:
        rgba = bytes.fromhex(color) + b'\xff'
        assert all(cel[(y * 1024 + x) * 4:(y * 1024 + x) * 4 + 4] == rgba
                   for y in range(sy, sy + 16) for x in range(sx, sx + 128))
    report = {
        'software': 'Pixelorama', 'version': author['version'],
        'nativeCelEqualsPngAndReopenedPng': True, 'dimensions': [1024, 1024],
        'nativePxoReopened': True, 'pencilBrush': 1, 'integerCoordinates': True,
        'texelsPerMetre': 16, 'changedOnly': rects, 'floorChangedPixels': changed,
        'changedPixelsOutsideFloor': outside, 'sourceRoofAndErasedSignsExactlyPreserved': True,
        'erasedChineseShopNames': 6,
        'nativePxoSha256': hashlib.sha256((HERE / 'terrace-book.pxo').read_bytes()).hexdigest(),
        'pngSha256': hashlib.sha256((HERE / 'terrace-book.png').read_bytes()).hexdigest(),
    }
    (HERE / 'floor-pixel-scope-check.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report))


if __name__ == '__main__':
    inspect()
