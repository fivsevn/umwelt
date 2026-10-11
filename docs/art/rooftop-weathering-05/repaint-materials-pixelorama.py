"""Repaint only six authorized material UVs through Pixelorama's real 1 px Pencil.

Python prepares explicit strokes and installs a temporary native extension.
It never draws, modifies or creates raster pixels.  The current saved PXO from
weathering-04 supplies every unchanged material, including the revised roofs
and the already erased Chinese shop names.
"""

from pathlib import Path
import hashlib
import json
import runpy
import shutil
import subprocess
import zipfile

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent / 'rooftop-weathering-04'
FIELDS = runpy.run_path(str(HERE / 'material-pencil-plan.py'))['RECTS']
RECTS = list(FIELDS.values())


def outside_authorized(cel):
    rows = []
    for y in range(1024):
        intervals = sorted((x, x+w) for x, ry, w, h in RECTS if ry <= y < ry+h)
        x0 = 0
        for a, b in intervals:
            if a > x0:
                rows.append(cel[(y*1024+x0)*4:(y*1024+a)*4])
            x0 = max(x0, b)
        if x0 < 1024:
            rows.append(cel[(y*1024+x0)*4:(y+1)*1024*4])
    return b''.join(rows)


def prepare():
    for name in ('terrace-book.pxo', 'terrace-book.png'):
        shutil.copyfile(SOURCE / name, HERE / name)
    with zipfile.ZipFile(SOURCE / 'terrace-book.pxo') as archive:
        data = json.loads(archive.read('data.json'))
        before = archive.read('image_data/frames/1/layer_1')
    assert data['size_x'] == data['size_y'] == 1024
    evidence = {
        'source': str(SOURCE / 'terrace-book.pxo'),
        'rectangles': RECTS,
        'outsideAuthorizedPixelsSha256': hashlib.sha256(outside_authorized(before)).hexdigest(),
        'sourcePxoSha256': hashlib.sha256((SOURCE / 'terrace-book.pxo').read_bytes()).hexdigest(),
        'sourcePngSha256': hashlib.sha256((SOURCE / 'terrace-book.png').read_bytes()).hexdigest(),
    }
    (HERE / 'material-scope-before.json').write_text(json.dumps(evidence, indent=2) + '\n')
    fn = runpy.run_path(str(HERE / 'material-pencil-plan.py'))['material_plan']
    strokes = []
    for index, (field, rect) in enumerate(FIELDS.items()):
        x, y, w, h = rect
        local = fn(field, w, h, 5741+index*37)
        for stroke in local:
            points = [[x+px,y+py] for px,py in stroke['points']]
            assert all(type(v) == int for point in points for v in point)
            assert all(x <= px < x+w and y <= py < y+h for px,py in points)
            strokes.append({'color':stroke['color'], 'points':points})
    (HERE / 'material-pencil-strokes.json').write_text(json.dumps({'strokes': strokes}, separators=(',', ':')))
    return strokes


GD = '''extends Node
func _ready():
 if "--rooftop-floor-repaint" in OS.get_cmdline_user_args():
  Global.pixelorama_opened.connect(paint, CONNECT_ONE_SHOT)
func paint():
 var path=""
 for arg in OS.get_cmdline_user_args():
  if arg.begins_with("--book-dir="):path=arg.trim_prefix("--book-dir=")
 var project=Global.current_project
 if project.name!="terrace-book" or project.size!=Vector2i(1024,1024):
  push_error("Expected saved terrace-book native source")
  get_tree().quit(2)
  return
 project.current_layer=0
 project.selected_cels=[Vector2i(0,0)]
 Tools.assign_tool("Pencil",MOUSE_BUTTON_LEFT)
 Tools.alpha_locked=false
 var pencil=Tools._slots[MOUSE_BUTTON_LEFT].tool_node
 pencil._brush_size=1
 pencil._brush_density=100
 pencil._strength=1.0
 pencil._overwrite=true
 pencil.update_brush()
 var record=JSON.parse_string(FileAccess.get_file_as_string(path.path_join("material-pencil-strokes.json")))
 for mark in record.strokes:
  pencil.tool_slot.color=Color(mark.color)
  pencil.draw_start(Vector2i(mark.points[0][0],mark.points[0][1]))
  for point in mark.points.slice(1):pencil.draw_move(Vector2i(point[0],point[1]))
  pencil.draw_end(Vector2i(mark.points[-1][0],mark.points[-1][1]))
 project.set_meta("material_refinement","Reference-led joined two-layer grey-green mineral clusters, 20–35 percent pigment coverage, six-colour material ramps; native 1 px Pencil at 16 px/m")
 var saved=OpenSave.save_pxo_file(path.path_join("terrace-book.pxo"),false,true,project)
 var png=project.frames[0].cels[0].get_image().save_png(path.path_join("terrace-book.png"))
 var report={"software":"Pixelorama","version":Global.current_version,"tool":"Pencil","brush":1,"strokes":record.strokes.size(),"nativeSaved":saved,"nativePngExport":png==OK,"texelsPerMetre":16,"changedOnly":[[512,0,128,256],[640,0,128,128],[0,512,768,64],[0,576,768,64],[768,128,256,64],[768,192,256,64]]}
 var file=FileAccess.open(path.path_join("pixelorama-material-refinement.json"),FileAccess.WRITE)
 file.store_string(JSON.stringify(report,"  "))
 print("NATIVE MATERIAL REFINEMENT ",JSON.stringify(report))
 get_tree().quit(0 if saved and png==OK else 3)
'''


def paint():
    marks = prepare()
    (HERE / 'FloorMain.gd').write_text(GD)
    (HERE / 'FloorMain.tscn').write_text('[gd_scene load_steps=2 format=3]\n[ext_resource type="Script" path="res://src/Extensions/RooftopFloor/FloorMain.gd" id="1"]\n[node name="RooftopFloor" type="Node"]\nscript = ExtResource("1")\n')
    (HERE / 'floor-extension.json').write_text(json.dumps({
        'name': 'RooftopFloor', 'display_name': 'Rooftop concrete floor repaint',
        'description': 'Native 1 px Pencil floor edit only', 'author': '五月七日',
        'version': '0.1', 'supported_api_versions': [8], 'license': 'MIT', 'nodes': ['FloorMain.tscn'],
    }))
    config = Path('/Users/d/Library/Application Support/Pixelorama/config.ini')
    backup = config.read_bytes()
    extension = config.parent / 'extensions/RooftopFloor.zip'
    assert not extension.exists(), 'Do not overwrite a pre-existing author extension'
    with zipfile.ZipFile(extension, 'w', zipfile.ZIP_DEFLATED) as z:
        for local, packed in [
            ('FloorMain.gd', 'src/Extensions/RooftopFloor/FloorMain.gd'),
            ('FloorMain.tscn', 'src/Extensions/RooftopFloor/FloorMain.tscn'),
            ('floor-extension.json', 'src/Extensions/RooftopFloor/extension.json'),
        ]:
            z.write(HERE / local, packed)
    config.write_bytes(backup + b'\n[extensions]\nRooftopFloor=true\n')
    try:
        result = subprocess.run([
            '/Applications/Pixelorama.app/Contents/MacOS/Pixelorama', '--headless', '--',
            str(HERE / 'terrace-book.pxo'), '--rooftop-floor-repaint', '--book-dir=' + str(HERE),
        ], capture_output=True, text=True, timeout=360)
        print(result.stdout[-1800:])
        print(result.stderr[-900:])
        assert result.returncode == 0
    finally:
        config.write_bytes(backup)
        extension.unlink(missing_ok=True)
    print('Repainted exactly six authorized material regions with', len(marks), 'native Pencil strokes')


if __name__ == '__main__':
    paint()
