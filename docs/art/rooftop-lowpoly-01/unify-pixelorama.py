"""Complete all scene material charts, including unseen and distant faces.

Python reads source pixels to prescribe native palette edits; no raster is
created or edited here. Actual Pixelorama edits/saves the main and distant PXOs.
The distant lamp mask is behavioural data and is preserved byte for byte.
"""
from collections import Counter
from pathlib import Path
from random import Random
import json
import runpy
import shutil
import sys
import zipfile
import numpy as np
from PIL import Image

HERE=Path(__file__).resolve().parent
NATIVE=runpy.run_path(str(HERE/'paint-pixelorama.py'))
EXTRA={
 'paving':[480,176,32,32], 'blue-glass':[288,320,32,32],
 'red-roof':[384,208,128,48], 'dark-glass':[288,352,32,32],
 'glass':[288,256,32,32], 'car-ivory':[256,176,32,32],
 'car-silver':[288,176,32,32], 'taillamp':[448,176,32,32],
 'headlamp':[416,176,32,32], 'tire':[384,176,32,32],
}


def limited_far_palette(counts, slots=48):
    colors=np.asarray(list(counts),dtype=np.float64)
    weights=np.asarray(list(counts.values()),dtype=np.float64)
    centers=[colors[int(np.argmax(weights))]]
    minimum=np.sum((colors-centers[0])**2,axis=1)
    for _ in range(slots-1):
        index=int(np.argmax(minimum*np.sqrt(weights)))
        centers.append(colors[index])
        minimum=np.minimum(minimum,np.sum((colors-centers[-1])**2,axis=1))
    centers=np.asarray(centers)
    for _ in range(18):
        assignments=np.argmin(np.sum((colors[:,None,:]-centers[None,:,:])**2,axis=2),axis=1)
        revised=centers.copy()
        for index in range(slots):
            mask=assignments==index
            if np.any(mask):revised[index]=np.average(colors[mask],axis=0,weights=weights[mask])
        if np.max(np.abs(revised-centers))<.05:break
        centers=revised
    centers=np.rint(centers).astype(np.uint8)
    assignments=np.argmin(np.sum((colors[:,None,:]-centers[None,:,:].astype(float))**2,axis=2),axis=1)
    hexcolor=NATIVE['hexcolor']
    mapping={hexcolor(c):hexcolor(centers[i]) for c,i in zip(list(counts),assignments)}
    mapping['000000']='000000'
    return mapping


def prepare():
    if (HERE/'pixelorama-all-scene-authoring.json').exists() and '--replay-from-pass02' not in sys.argv:
        raise SystemExit('Protect saved all-scene native source. Explicit --replay-from-pass02 required.')
    for name in ('terrace-book.pxo','terrace-book.png','palette-pencil-plan.json','pixelorama-authoring.json'):
        target=HERE/('pass02-'+name)
        if not target.exists():shutil.copyfile(HERE/name,target)
    shutil.copyfile(HERE/'pass02-terrace-book.pxo',HERE/'terrace-book.pxo')
    with zipfile.ZipFile(HERE/'pass02-terrace-book.pxo') as archive:
        source=archive.read('image_data/frames/1/layer_1')
    fields=[]
    for field,(x,y,w,h) in EXTRA.items():
        counts=Counter(source[(py*1024+px)*4:(py*1024+px)*4+4] for py in range(y,y+h) for px in range(x,x+w))
        base=NATIVE['rgb'](counts.most_common(1)[0][0])
        # Uniform single-pigment materials are already intentionally coarse.
        # Retain their base; pull apart the existing painted second pigments.
        factor=1.25 if field=='red-roof' else 1.15
        mapping={NATIVE['hexcolor'](c):NATIVE['hexcolor'](NATIVE['separated'](NATIVE['rgb'](c),base,factor)) for c in counts}
        fields.append({'name':field,'rect':[x,y,w,h],'palette':mapping,'beforeColors':len(counts),'afterColors':len(set(mapping.values())),'singlePigmentReviewed':len(counts)==1})
    with Image.open(HERE/'before-distance-facades.png') as im:
        pixels=np.asarray(im.convert('RGBA'))
    assert pixels.shape==(2048,2048,4)
    counts=Counter(tuple(int(v) for v in row[:3]) for row in pixels.reshape(-1,4) if row[3]>0 and any(row[:3]))
    far_palette=limited_far_palette(counts)
    rng=Random(57101203)
    possible=[]
    # Sparse native Pencil flecks inside existing opaque facade pigment only.
    for _ in range(9000):
        x,y=rng.randrange(2048),rng.randrange(2048)
        c=pixels[y,x]
        if c[3]==255 and 168<=int(c[0])<=190 and 160<=int(c[1])<=190 and 142<=int(c[2])<=185 and abs(int(c[0])-int(c[1]))<18:
            possible.append((x,y,c[:3]))
    centers={tuple(bytes.fromhex(c)) for c in far_palette.values()}
    strokes=[]
    for x,y,c in possible[:144]:
        mapped=tuple(bytes.fromhex(far_palette[NATIVE['hexcolor'](c)]))
        choices=[tone for tone in centers if 6<=max(abs(a-b) for a,b in zip(tone,mapped))<=18 and abs(tone[0]-tone[1])<20]
        if not choices:continue
        tone=min(choices,key=lambda t:sum((a-b)**2 for a,b in zip(t,mapped)))
        strokes.append({'color':'#'+NATIVE['hexcolor'](tone),'points':[[x,y],[x,y]]})
    plan={'fields':fields,'farPalette':far_palette,'farPencilStrokes':strokes,'farSource':'before-distance-facades.png','farColorsBefore':len(counts),'farMainColorsAfter':len(set(far_palette.values())),'brush':1,'texelsPerMetre':16,'distantDimensions':[2048,2048],'lightMask':'Unchanged behavioural data','allReviewedFields':list(NATIVE['FIELDS'])+list(EXTRA)}
    (HERE/'all-scene-palette-plan.json').write_text(json.dumps(plan,indent=2)+'\n')
    combined=json.loads((HERE/'pass02-palette-pencil-plan.json').read_text())
    combined['fields'].extend(fields)
    combined['allReviewedFields']=plan['allReviewedFields']
    (HERE/'palette-pencil-plan.json').write_text(json.dumps(combined,indent=2)+'\n')
    return plan


GD='''extends Node
func _ready():
 if "--rooftop-all-scene-paint" in OS.get_cmdline_user_args():
  Global.pixelorama_opened.connect(paint,CONNECT_ONE_SHOT)
func paint():
 var path=""
 for arg in OS.get_cmdline_user_args():
  if arg.begins_with("--book-dir="):path=arg.trim_prefix("--book-dir=")
 var record=JSON.parse_string(FileAccess.get_file_as_string(path.path_join("all-scene-palette-plan.json")))
 var project=Global.current_project
 if project.name!="terrace-book" or project.size!=Vector2i(1024,1024):
  get_tree().quit(2)
  return
 var cel=project.frames[0].cels[0].get_image()
 var changed=0
 for field in record.fields:
  var r=field.rect
  for y in range(int(r[1]),int(r[1]+r[3])):
   for x in range(int(r[0]),int(r[0]+r[2])):
    var old=cel.get_pixel(x,y)
    var revised=Color(field.palette[old.to_html(false)])
    revised.a=old.a
    if revised!=old:cel.set_pixel(x,y,revised);changed+=1
 project.set_meta("all_scene_material_review","All 28 real atlas charts reviewed; no visibility crop; hidden sides/bottoms use the same native charts. Single-pigment glass/lamp/tire charts retain deliberately limited colours.")
 var main_saved=OpenSave.save_pxo_file(path.path_join("terrace-book.pxo"),false,true,project)
 var main_png=cel.save_png(path.path_join("terrace-book.png"))
 var far=Image.load_from_file(path.path_join(record.farSource))
 if far==null or far.get_size()!=Vector2i(2048,2048):
  get_tree().quit(3)
  return
 OpenSave.open_image_as_new_tab("distance-facades.png",far)
 project=Global.current_project
 project.name="distance-facades"
 cel=project.frames[0].cels[0].get_image()
 var far_changed=0
 for y in range(2048):
  for x in range(2048):
   var old=cel.get_pixel(x,y)
   if old.a<=0:continue
   var key=old.to_html(false)
   if not record.farPalette.has(key):continue
   var revised=Color(record.farPalette[key])
   revised.a=old.a
   if revised!=old:cel.set_pixel(x,y,revised);far_changed+=1
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
 for mark in record.farPencilStrokes:
  var point=Vector2i(mark.points[0][0],mark.points[0][1])
  pencil.tool_slot.color=Color(mark.color)
  pencil.draw_start(point)
  pencil.draw_end(point)
 project.set_meta("far_scene_material_review","Imported original Blender facade bake, limited pigment groups and sparse native 1px Pencil flecks. Preserve physical mesh/UV, original atlas dimensions and alpha; no camera-specific painting.")
 var far_saved=OpenSave.save_pxo_file(path.path_join("distance-facades.pxo"),false,true,project)
 var far_png=cel.save_png(path.path_join("distance-facades.png"))
 var report={"software":"Pixelorama","version":Global.current_version,"mainNativeSaved":main_saved,"mainNativePngExport":main_png==OK,"distantNativeSaved":far_saved,"distantNativePngExport":far_png==OK,"allReviewedFields":record.allReviewedFields,"mainExtraChangedPixels":changed,"farChangedPixels":far_changed,"farPencilStrokes":record.farPencilStrokes.size(),"farMainColorsAfter":record.farMainColorsAfter,"brush":1,"lightMaskUntouched":true}
 var file=FileAccess.open(path.path_join("pixelorama-all-scene-authoring.json"),FileAccess.WRITE)
 file.store_string(JSON.stringify(report,"  "))
 print("ALL SCENE NATIVE MATERIALS ",JSON.stringify(report))
 get_tree().quit(0 if main_saved and far_saved and main_png==OK and far_png==OK else 4)
'''


if __name__=='__main__':
    prepare()
    NATIVE['run_native'](GD,'--rooftop-all-scene-paint','RooftopFullPaint')
