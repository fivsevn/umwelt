"""Refine the saved atlas inside the real Pixelorama editor.

Python only reads native cel bytes and prepares a palette/stroke prescription.
Pixelorama applies a native cel palette effect, draws 1 px Pencil accents, and
saves both the editable PXO and PNG. No Python raster drawing or generation.
"""
from collections import Counter
from pathlib import Path
from random import Random
import hashlib
import json
import shutil
import subprocess
import sys
import zipfile

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent / 'rooftop-weathering-07'
FIELDS = {
    'north-floor': [512, 0, 128, 256],
    'south-floor': [640, 0, 128, 128],
    'north-plaster': [0, 512, 768, 64],
    'stained-plaster': [0, 576, 768, 64],
    'cap': [768, 128, 256, 64],
    'cement': [768, 192, 256, 64],
    'metal': [768, 0, 256, 64],
    'rust-iron': [768, 64, 256, 64],
    'home-roof-north': [0, 640, 704, 128],
    'home-roof-south': [0, 768, 704, 128],
    'roof': [0, 896, 704, 128],
    'foliage': [320, 384, 64, 64],
    'ground': [384, 384, 128, 128],
    'road': [128, 384, 128, 128],
    'awning': [256, 384, 64, 64],
    'garage-door': [448, 0, 64, 64],
    'facade': [768, 256, 256, 256],
    'tower-trim': [256, 448, 64, 64],
}


def rgb(color):
    return tuple(color[:3])


def hexcolor(color):
    return ''.join(f'{c:02x}' for c in color[:3])


def separated(color, base, factor):
    return tuple(max(0, min(255, round(b + (c-b)*factor))) for c, b in zip(color, base))


def roof_palette(counts, slots=12):
    """Weighted pigment grouping, without rebuilding the tile pattern."""
    colors = sorted(counts, key=lambda c: sum(rgb(c)))
    centers = [rgb(colors[round(i*(len(colors)-1)/(slots-1))]) for i in range(slots)]
    for _ in range(20):
        groups = [[] for _ in centers]
        for c, weight in counts.items():
            index = min(range(len(centers)), key=lambda i: sum((a-b)**2 for a,b in zip(rgb(c), centers[i])))
            groups[index].append((rgb(c), weight))
        revised = [tuple(round(sum(c[channel]*n for c,n in group)/sum(n for _,n in group)) for channel in range(3)) if group else center for group, center in zip(groups, centers)]
        if revised == centers:
            break
        centers = revised
    base = rgb(counts.most_common(1)[0][0])
    centers = [separated(c, base, 1.16) for c in centers]
    return {hexcolor(c): hexcolor(min(centers, key=lambda center: sum((a-b)**2 for a,b in zip(rgb(c),center)))) for c in counts}


def prepare():
    HERE.mkdir(exist_ok=True)
    for name in ('terrace-book.pxo', 'terrace-book.png'):
        shutil.copyfile(SOURCE / name, HERE / name)
    with zipfile.ZipFile(SOURCE / 'terrace-book.pxo') as archive:
        source = archive.read('image_data/frames/1/layer_1')
        data = json.loads(archive.read('data.json'))
    assert [data['size_x'], data['size_y']] == [1024, 1024]
    rng = Random(571012)
    fields, strokes = [], []
    for field, rect in FIELDS.items():
        x,y,w,h = rect
        def pigment(px, py):
            return source[(py*1024+px)*4:(py*1024+px)*4+4]
        counts = Counter(pigment(px,py) for py in range(y,y+h) for px in range(x,x+w))
        base = rgb(counts.most_common(1)[0][0])
        if field.startswith('home-roof') or field == 'roof':
            mapping = roof_palette(counts)
        else:
            factor = 1.85 if field in list(FIELDS)[:6] else 1.25
            mapping = {hexcolor(c): hexcolor(separated(rgb(c),base, factor if max(abs(a-b) for a,b in zip(rgb(c),base)) <= 24 else 1.08)) for c in counts}
        fields.append({'name':field, 'rect':rect, 'palette':mapping, 'beforeColors':len(counts), 'afterColors':len(set(mapping.values()))})
        if field not in list(FIELDS)[:6]:
            continue
        # Sparse pin-sized accents follow already authored mineral boundaries.
        # They do not scatter new large patches across the quiet substrate.
        candidates = []
        for py in range(y+2,y+h-2):
            for px in range(x+2,x+w-2):
                c = pigment(px,py)
                delta = max(abs(a-b) for a,b in zip(rgb(c),base))
                if 4 <= delta <= 24 and (c != pigment(px-1,py) or c != pigment(px,py-1)):
                    candidates.append((px,py,c))
        rng.shuffle(candidates)
        chosen = []
        for px,py,c in candidates:
            if any(abs(px-a)+abs(py-b)<5 for a,b in chosen):
                continue
            chosen.append((px,py))
            mapped = bytes.fromhex(mapping[hexcolor(c)])
            direction = -1 if sum(rgb(c)) < sum(base) else 1
            color = tuple(max(0,min(255,a+direction*3)) for a in mapped)
            strokes.append({'color':'#'+hexcolor(color), 'points':[[px,py],[px,py]]})
            if len(chosen) >= (100 if 'floor' in field else 140):
                break
    record = {'fields':fields, 'strokes':strokes, 'brush':1, 'texelsPerMetre':16, 'sourcePxoSha256':hashlib.sha256((SOURCE/'terrace-book.pxo').read_bytes()).hexdigest(), 'sourcePngSha256':hashlib.sha256((SOURCE/'terrace-book.png').read_bytes()).hexdigest()}
    (HERE/'palette-pencil-plan.json').write_text(json.dumps(record, indent=2)+'\n')
    (HERE/'atlas-scope.json').write_text(json.dumps(FIELDS, indent=2)+'\n')
    return record


GD = '''extends Node
func _ready():
 if "--rooftop-lowpoly-paint" in OS.get_cmdline_user_args():
  Global.pixelorama_opened.connect(paint,CONNECT_ONE_SHOT)
func paint():
 var path=""
 for arg in OS.get_cmdline_user_args():
  if arg.begins_with("--book-dir="):path=arg.trim_prefix("--book-dir=")
 var project=Global.current_project
 if project.name!="terrace-book" or project.size!=Vector2i(1024,1024):
  push_error("Expected saved native atlas")
  get_tree().quit(2)
  return
 var record=JSON.parse_string(FileAccess.get_file_as_string(path.path_join("palette-pencil-plan.json")))
 var cel=project.frames[0].cels[0].get_image()
 var changed=0
 for field in record.fields:
  var r=field.rect
  for y in range(int(r[1]),int(r[1]+r[3])):
   for x in range(int(r[0]),int(r[0]+r[2])):
    var old=cel.get_pixel(x,y)
    var key=old.to_html(false)
    if field.palette.has(key):
     var revised=Color(field.palette[key])
     revised.a=old.a
     if revised!=old:
      cel.set_pixel(x,y,revised)
      changed+=1
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
 for mark in record.strokes:
  pencil.tool_slot.color=Color(mark.color)
  var point=Vector2i(mark.points[0][0],mark.points[0][1])
  pencil.draw_start(point)
  pencil.draw_end(point)
 project.set_meta("rough_surface_refinement","Restrained pigment separation and native one-pixel mineral-edge Pencil accents; original photo-led cracks/repairs/water footprints retained; geometry/UV unchanged; 16 texels per metre")
 var saved=OpenSave.save_pxo_file(path.path_join("terrace-book.pxo"),false,true,project)
 var png=project.frames[0].cels[0].get_image().save_png(path.path_join("terrace-book.png"))
 var report={"software":"Pixelorama","version":Global.current_version,"nativeSaved":saved,"nativePngExport":png==OK,"effect":"Native cel pigment regrouping","paletteChangedPixels":changed,"tool":"Pencil","brush":1,"strokes":record.strokes.size(),"texelsPerMetre":16,"source":"rooftop-weathering-07/terrace-book.pxo"}
 var file=FileAccess.open(path.path_join("pixelorama-authoring.json"),FileAccess.WRITE)
 file.store_string(JSON.stringify(report,"  "))
 print("NATIVE ROUGH SURFACE ",JSON.stringify(report))
 get_tree().quit(0 if saved and png==OK else 3)
'''


def run_native(gd, flag, name):
    (HERE/f'{name}.gd').write_text(gd)
    (HERE/f'{name}.tscn').write_text(f'[gd_scene load_steps=2 format=3]\n[ext_resource type="Script" path="res://src/Extensions/{name}/{name}.gd" id="1"]\n[node name="{name}" type="Node"]\nscript = ExtResource("1")\n')
    config = Path('/Users/d/Library/Application Support/Pixelorama/config.ini')
    backup = config.read_bytes()
    extension = config.parent / f'extensions/{name}.zip'
    assert not extension.exists(), 'Never overwrite an existing author extension'
    with zipfile.ZipFile(extension,'w',zipfile.ZIP_DEFLATED) as z:
        for suffix in ('gd','tscn'):
            z.write(HERE/f'{name}.{suffix}',f'src/Extensions/{name}/{name}.{suffix}')
        z.writestr(f'src/Extensions/{name}/extension.json',json.dumps({'name':name,'display_name':'Rooftop native rough surface refinement','description':'Saved atlas pigment effect and 1 px Pencil authoring','author':'五月七日','version':'0.1','supported_api_versions':[8],'license':'MIT','nodes':[f'{name}.tscn']}))
    config.write_bytes(backup+f'\n[extensions]\n{name}=true\n'.encode())
    try:
        result = subprocess.run(['/Applications/Pixelorama.app/Contents/MacOS/Pixelorama','--headless','--',str(HERE/'terrace-book.pxo'),flag,'--book-dir='+str(HERE)],capture_output=True,text=True,timeout=360)
        (HERE/f'{name}.log').write_text(result.stdout+'\n'+result.stderr)
        print(result.stdout[-2000:])
        print(result.stderr[-500:])
        assert result.returncode==0
    finally:
        config.write_bytes(backup)
        extension.unlink(missing_ok=True)


if __name__=='__main__':
    if (HERE/'pixelorama-authoring.json').exists() and '--replay-from-07' not in sys.argv:
        raise SystemExit('Saved native source exists. Use --replay-from-07 only to deliberately replace it from the preserved 07 baseline.')
    record=prepare()
    run_native(GD,'--rooftop-lowpoly-paint','RooftopRoughPaint')
    print('Native palette fields:',len(record['fields']),'Native 1px accents:',len(record['strokes']))
