"""Continue the saved 01 native PXOs with modest palette and 1px Pencil edits.

Python reads pixel bytes and prepares instructions, never produces a raster.
The installed Pixelorama application applies the edits and saves both PXOs and
their PNG exports. Existing 02 source is never reset or replayed automatically.
"""
from collections import Counter
from pathlib import Path
from random import Random
import hashlib
import json
import runpy
import sys
import zipfile

HERE = Path(__file__).resolve().parent
NATIVE = runpy.run_path(str(HERE/'pixelorama-native.py'))
FIELDS = json.loads((HERE/'atlas-scope.json').read_text())


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def hexcolor(color):
    return bytes(color[:3]).hex()


def pixel_data(path):
    with zipfile.ZipFile(path) as archive:
        data = json.loads(archive.read('data.json'))
        return archive.read('image_data/frames/1/layer_1'), [data['size_x'],data['size_y']]


def palette_groups(counts, slots, factor=1, preserve_black=False):
    """Merge adjacent pigments, keeping dominant, darkest and lightest groups.

    Groups retain their original membership, so base paint and rare crack or
    window-edge extremes are never lost to a globally averaged palette.
    """
    dominant = counts.most_common(1)[0][0]
    ordered = sorted(counts, key=lambda c: (sum(c), c))
    protected = {dominant, ordered[0], ordered[-1]}
    if preserve_black:
        protected.add(b'\0\0\0')
    groups = [{'members':[c], 'color':tuple(c), 'weight':n, 'locked':c in protected}
              for c,n in counts.items()]
    while len(groups)>slots:
        choices=[]
        for i,a in enumerate(groups):
            for j,b in enumerate(groups[i+1:], i+1):
                if a['locked'] or b['locked']:
                    continue
                distance=sum((x-y)**2 for x,y in zip(a['color'],b['color']))
                choices.append((distance, i, j))
        assert choices, 'Insufficient editable pigments to meet palette target'
        _,i,j=min(choices)
        a,b=groups[i],groups[j]
        weight=a['weight']+b['weight']
        merged={'members':a['members']+b['members'], 'weight':weight, 'locked':False,
                'color':tuple(round((x*a['weight']+y*b['weight'])/weight)
                              for x,y in zip(a['color'],b['color']))}
        groups[i]=merged
        groups.pop(j)
    base=tuple(dominant)
    mapping={}
    for group in groups:
        color=group['color']
        if preserve_black and color==(0,0,0):
            revised=color
        else:
            revised=tuple(max(0,min(255,round(b+(c-b)*factor))) for c,b in zip(color,base))
        for old in group['members']:
            mapping[hexcolor(old)]=hexcolor(revised)
    return mapping


def pencil_flecks(source, width, rect, mapping, rng, limit):
    x,y,w,h=rect
    def pixel(px,py):
        i=(py*width+px)*4
        return source[i:i+4]
    counts=Counter(pixel(px,py)[:3] for py in range(y,y+h) for px in range(x,x+w))
    base=tuple(counts.most_common(1)[0][0])
    colors={tuple(bytes.fromhex(color)) for color in mapping.values()}
    candidates=[]
    for py in range(y+2,y+h-2):
        for px in range(x+2,x+w-2):
            color=pixel(px,py)
            delta=max(abs(a-b) for a,b in zip(color[:3],base))
            neighbours=[pixel(px-1,py),pixel(px+1,py),pixel(px,py-1),pixel(px,py+1)]
            if color[3]==255 and 7<=delta<=42 and any(n!=color for n in neighbours) and sum(n==color for n in neighbours)>=2:
                candidates.append((px,py,color))
    rng.shuffle(candidates)
    marks=[]
    chosen=[]
    for px,py,color in candidates:
        if any(abs(px-a)+abs(py-b)<7 for a,b in chosen):
            continue
        mapped=tuple(bytes.fromhex(mapping[hexcolor(color)]))
        dark=sum(color[:3])<sum(base)
        choices=[tone for tone in colors
                 if (sum(tone)<sum(mapped) if dark else sum(tone)>sum(mapped))
                 and 4<=max(abs(a-b)for a,b in zip(tone,mapped))<=20]
        if not choices:
            continue
        tone=min(choices,key=lambda c:sum((a-b)**2 for a,b in zip(c,mapped)))
        marks.append({'color':'#'+hexcolor(tone),'points':[[px,py],[px,py]]})
        chosen.append((px,py))
        if len(marks)>=limit:
            break
    return marks


def prepare():
    if (HERE/'pixelorama-authoring.json').exists():
        raise SystemExit('02 has saved native source. Do not replay or replace hand edits.')
    baseline=json.loads((HERE/'integration-baseline.json').read_text())
    assert digest(HERE/'terrace-book.pxo')==baseline['pixeloramaPxoSha256']
    assert digest(HERE/'distance-facades.pxo')==baseline['farPixeloramaPxoSha256']
    source,size=pixel_data(HERE/'terrace-book.pxo')
    assert size==[1024,1024]
    rng=Random(571012204)
    fields,strokes=[],[]
    mineral={'north-floor','south-floor','north-plaster','stained-plaster','cap','cement','facade'}
    roofs={'home-roof-north','home-roof-south','roof'}
    for name,rect in FIELDS.items():
        x,y,w,h=rect
        counts=Counter(source[(py*1024+px)*4:(py*1024+px)*4+3]for py in range(y,y+h)for px in range(x,x+w))
        if name in mineral:
            slots=min(len(counts),7)
            factor=1.035
            limit=20
        elif name in roofs:
            slots=min(len(counts),6 if name.startswith('home-') else 7)
            factor=1.025
            limit=12
        elif name in {'metal','rust-iron'}:
            slots=min(len(counts),6)
            factor=1.03
            limit=8
        else:
            slots=len(counts)
            factor=1
            limit=0
        mapping=palette_groups(counts,slots,factor)
        fields.append({'name':name,'rect':rect,'palette':mapping,'beforeColors':len(counts),
                       'afterColors':len(set(mapping.values())),'contrastFactor':factor,
                       'reviewedRetained':all(a==b for a,b in mapping.items())})
        if limit:
            strokes.extend(pencil_flecks(source,1024,rect,mapping,rng,limit))
    far,far_size=pixel_data(HERE/'distance-facades.pxo')
    assert far_size==[2048,2048]
    counts=Counter(far[i:i+3]for i in range(0,len(far),4)if far[i+3]>0)
    far_mapping=palette_groups(counts,37,1,preserve_black=True)
    colors={tuple(bytes.fromhex(c)) for c in far_mapping.values()}
    far_marks=[]
    for _ in range(40000):
        x,y=rng.randrange(2,2046),rng.randrange(2,2046)
        offset=(y*2048+x)*4
        old=far[offset:offset+4]
        if old[3]!=255 or not (148<=old[0]<=192 and 142<=old[1]<=193 and 133<=old[2]<=185):
            continue
        mapped=tuple(bytes.fromhex(far_mapping[hexcolor(old)]))
        alternatives=[c for c in colors if 6<=max(abs(a-b)for a,b in zip(c,mapped))<=14 and abs(c[0]-c[1])<24]
        if not alternatives:
            continue
        # Stay inside an existing small worn cluster; preserve quiet base areas.
        neighbours=[far[((y+dy)*2048+x+dx)*4:((y+dy)*2048+x+dx)*4+4]for dx,dy in [(-1,0),(1,0),(0,-1),(0,1)]]
        if sum(n==old for n in neighbours)<2 or not any(n!=old for n in neighbours):
            continue
        tone=min(alternatives,key=lambda c:sum((a-b)**2 for a,b in zip(c,mapped)))
        far_marks.append({'color':'#'+hexcolor(tone),'points':[[x,y],[x,y]]})
        if len(far_marks)>=64:
            break
    plan={'sourceRevision':'rooftop-lowpoly-01','fields':fields,'strokes':strokes,
          'farPalette':far_mapping,'farStrokes':far_marks,'farColorsBefore':len(counts),
          'farColorsAfter':len(set(far_mapping.values())),'brush':1,'texelsPerMetre':16,
          'preserveAlpha':True,'sourcePxoSha256':baseline['pixeloramaPxoSha256'],
          'sourceFarPxoSha256':baseline['farPixeloramaPxoSha256'],
          'method':'Merge neighbouring pigment groups, keep base and luminance extremes; sparse native Pencil pin chips inside existing wear, no new patch footprints'}
    (HERE/'palette-pencil-plan.json').write_text(json.dumps(plan,indent=2)+'\n')
    return plan


GD='''extends Node
func _ready():
 if "--rooftop-lowpoly-02-paint" in OS.get_cmdline_user_args():
  Global.pixelorama_opened.connect(paint,CONNECT_ONE_SHOT)
func palette(cel:Image, mapping:Dictionary, rect:Array) -> int:
 var changed=0
 for y in range(int(rect[1]),int(rect[1]+rect[3])):
  for x in range(int(rect[0]),int(rect[0]+rect[2])):
   var old=cel.get_pixel(x,y)
   if old.a<=0:continue
   var key=old.to_html(false)
   if not mapping.has(key):continue
   var revised=Color(mapping[key])
   revised.a=old.a
   if revised!=old:
    cel.set_pixel(x,y,revised)
    changed+=1
 return changed
func pencil_marks(project, marks:Array):
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
 for mark in marks:
  pencil.tool_slot.color=Color(mark.color)
  var point=Vector2i(mark.points[0][0],mark.points[0][1])
  pencil.draw_start(point)
  pencil.draw_end(point)
func paint():
 var path=""
 for arg in OS.get_cmdline_user_args():
  if arg.begins_with("--book-dir="):path=arg.trim_prefix("--book-dir=")
 var record=JSON.parse_string(FileAccess.get_file_as_string(path.path_join("palette-pencil-plan.json")))
 var project=Global.current_project
 if project.name!="terrace-book" or project.size!=Vector2i(1024,1024):
  get_tree().quit(2)
  return
 var cel=project.frames[0].cels[0].get_image()
 var main_changed=0
 for field in record.fields:main_changed+=palette(cel,field.palette,field.rect)
 pencil_marks(project,record.strokes)
 project.set_meta("lowpoly_02_refinement","Continued saved 01 PXO. Modest adjacent pigment grouping, retain photo-led crack/repair/stain silhouettes, native 1px Pencil pin chips. No model or UV edits; 16 texels/metre.")
 var main_saved=OpenSave.save_pxo_file(path.path_join("terrace-book.pxo"),false,true,project)
 var main_png=project.frames[0].cels[0].get_image().save_png(path.path_join("terrace-book.png"))
 OpenSave.open_pxo_file(path.path_join("distance-facades.pxo"))
 project=Global.current_project
 if project.name!="distance-facades" or project.size!=Vector2i(2048,2048):
  get_tree().quit(3)
  return
 cel=project.frames[0].cels[0].get_image()
 var far_changed=palette(cel,record.farPalette,[0,0,2048,2048])
 pencil_marks(project,record.farStrokes)
 project.set_meta("lowpoly_02_refinement","Continued saved 01 distant PXO; limited adjacent pigments and sparse 1px Pencil chips. Preserve alpha, dimensions, UV layout and window-mask bytes.")
 var far_saved=OpenSave.save_pxo_file(path.path_join("distance-facades.pxo"),false,true,project)
 var far_png=project.frames[0].cels[0].get_image().save_png(path.path_join("distance-facades.png"))
 var report={"software":"Pixelorama","version":Global.current_version,"sourceRevision":"rooftop-lowpoly-01","nativeSaved":main_saved,"nativePngExport":main_png==OK,"farNativeSaved":far_saved,"farNativePngExport":far_png==OK,"paletteChangedPixels":main_changed,"farPaletteChangedPixels":far_changed,"strokes":record.strokes.size(),"farStrokes":record.farStrokes.size(),"tool":"Pencil","brush":1,"texelsPerMetre":16,"reviewedFields":record.fields.size(),"farPaletteColors":record.farColorsAfter}
 var file=FileAccess.open(path.path_join("pixelorama-authoring.json"),FileAccess.WRITE)
 file.store_string(JSON.stringify(report,"  "))
 print("LOWPOLY 02 NATIVE AUTHORING ",JSON.stringify(report))
 get_tree().quit(0 if main_saved and far_saved and main_png==OK and far_png==OK else 4)
'''


if __name__=='__main__':
    record=prepare()
    print(json.dumps({'fields':len(record['fields']),'mainStrokes':len(record['strokes']),
                      'farStrokes':len(record['farStrokes']),'farColors':record['farColorsAfter']},indent=2),flush=True)
    if '--prepare-only' not in sys.argv:
        NATIVE['run_native'](GD,'--rooftop-lowpoly-02-paint','RooftopLowpoly02Paint')
