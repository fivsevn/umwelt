"""Author the revision through actual Pixelorama 1 px Pencil, never write raster pixels.

The previous native cel supplies unchanged architectural pigments. New floor,
wall and roof paintings are explicit integer Pencil strokes at 16 texels/metre.
"""
from pathlib import Path
import hashlib, json, math, random, runpy, subprocess, sys, zipfile

HERE = Path(__file__).resolve().parent
SOURCE = Path('/Users/d/Documents/Codex/2026-10-10/wo-y/outputs/花农时代游戏环境交付/native/terrace-book.pxo')
TARGET = HERE / 'terrace-book.pxo'
if TARGET.exists() and '--revise-this-pass' not in sys.argv:
    raise SystemExit('Native revision exists; edit it in Pixelorama or explicitly revise this pass.')
with zipfile.ZipFile(SOURCE) as z:
    old = z.read('image_data/frames/1/layer_1')
    project = json.loads(z.read('data.json'))
assert project['size_x'] == project['size_y'] == 512
strokes = []
def mark(c, pts):
    strokes.append({'color': c, 'points': [[int(x), int(y)] for x,y in pts]})
def line(x,y,x1,y1,c):
    mark(c, [(x,y),(x1,y1)])
def rect(x,y,w,h,c):
    pts=[]
    for yy in range(y,y+h):
        ends=(x,x+w-1) if (yy-y)%2==0 else (x+w-1,x)
        pts.extend([(ends[0],yy),(ends[1],yy)])
    mark(c,pts)
def poly(points,c):
    for y in range(min(p[1] for p in points), max(p[1] for p in points)+1):
        cuts=[]
        for a,b in zip(points,points[1:]+points[:1]):
            if a[1]<=y<b[1] or b[1]<=y<a[1]:
                cuts.append(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]))
        cuts.sort()
        for a,b in zip(cuts[::2],cuts[1::2]):
            line(round(a),y,round(b),y,c)
def dab(x,y,c):
    line(x,y,x,y,c)
def shift(c,delta):
    return '#'+''.join(f'{max(0,min(255,int(c[i:i+2],16)+delta)):02x}' for i in (1,3,5))

# Preserve the actual original cel by replaying its run-length Pencil rows.
# Reading its native bytes is reference access; Pixelorama owns all painting.
for y in range(512):
    start=0
    for x in range(1,513):
        a=(y*512+start)*4
        if x==512 or old[(y*512+x)*4:(y*512+x)*4+4] != old[a:a+4]:
            line(start,y,x-1,y,'#'+old[a:a+3].hex())
            start=x

# Erase all six Chinese shop names, preserving each sign's original pigment.
signs=[(256,128,'#5c7764'),(384,128,'#95695e'),
       (256,144,'#727786'),(384,144,'#a58964'),
       (256,160,'#76825b'),(384,160,'#76898a')]
for x,y,c in signs:
    rect(x,y,128,16,c)

floor_ns = runpy.run_path(str(HERE / 'floor-pencil-plan.py'))
f = floor_ns['floor_plan']
floor_palette = floor_ns['FLOOR_PALETTE']
# Cool neutral cement, with the warmer exposed plaster kept local.
floor_palette.update(base='#989c97',trowel_light='#a3a6a0',trowel_mid='#9ca09a',
                     trowel_dark='#8f9690',joint='#808981',joint_faint='#8d958d',
                     joint_light='#a5aaa0',repair='#727e77',repair_mid='#828e85',
                     crack='#606e66',aggregate_dark='#818b83',aggregate_light='#afb1a7',
                     wash='#acb0a6',wash_faint='#a1a89d',chalk='#b9bbb0',
                     exposed_plaster='#b7b09b',exposed_plaster_edge='#a49f8b')
for x,y,w,h,seed in [(512,0,128,256,5711),(640,0,128,128,5732)]:
    for s in f(w,h,seed):
        mark(s['color'],[(x+a,y+b) for a,b in s['points']])
    # Old concrete slab seams at approximately 0.8-1.25 m, rather than tiles
    # made of equal repeated images. Their fragments disappear under washing.
    r=random.Random(seed+28)
    for axis in range(12,w,17):
        for t in range(0,h,21):
            if r.random()>.24:
                line(x+axis,y+t,x+axis,y+min(h-1,t+r.randint(8,17)),r.choice(['#8c958d','#929b92']))
    for axis in range(14,h,18):
        for t in range(0,w,23):
            if r.random()>.22:
                line(x+t,y+axis,x+min(w-1,t+r.randint(9,19)),y+axis,r.choice(['#8a958b','#949b91']))

def wall(x,y,w,h,seed,low=False):
    r=random.Random(seed)
    base='#b6b5a9' if not low else '#adb1a3'
    rect(x,y,w,h,base)
    # Connected, ragged stains rather than repeated rectangular stickers.
    for _ in range(w//14):
        cx=r.randrange(4,w-8);cy=r.randrange(5,h-8)
        rx=r.randrange(3,12);ry=r.randrange(2,9)
        c=r.choice(['#b0b1a4','#bbb9ad','#b2b4a7','#aeb1a2'])
        for dy in range(-ry,ry+1):
            extent=max(1,round(rx*math.sqrt(max(0,1-(dy/(ry+1))**2))))
            a=max(0,cx-extent+r.choice([-1,0,1]));b=min(w-1,cx+extent+r.choice([-1,0,1]))
            line(x+a,y+cy+dy,x+b,y+cy+dy,c)
    # Floor damp and roof runoff follow the physical wall elevation.
    for xx in range(w):
        height=1+int(2+2*math.sin(xx*.069)+r.choice([0,0,1]))
        line(x+xx,y,x+xx,y+height,'#929f8d' if low else '#a0a794')
        if xx%4==0:dab(x+xx,y+height+1,'#a8ae9c')
    for sx in range(5,w,43):
        length=r.randrange(8,22)
        for d in range(length):
            if d<length//2 or r.random()>.35:
                dab(x+sx+(1 if d>length//2 else 0),y+47-d,r.choice(['#9ca58f','#a6ad9b','#b0b3a2']))
            if d<8:dab(x+sx+1,y+47-d,'#abb09b')
    for _ in range(w//20):
        sx=r.randrange(3,w-8);sy=r.randrange(8,h-8)
        line(x+sx,y+sy,x+sx+r.randrange(2,6),y+sy,'#c1beb1')
        if r.random()<.32:
            mark('#939d8f',[(x+sx,y+sy),(x+sx+1,y+sy+3),(x+sx,y+sy+6)])
    for _ in range(w*h//180):
        dab(x+r.randrange(w),y+r.randrange(h),r.choice(['#bfc0b1','#a6ae9c','#adb29f']))
wall(0,512,768,64,5715)
wall(0,576,768,64,5779,True)

def metal(x,y,w,h,seed,rusted=False,cement=False,cap=False):
    r=random.Random(seed)
    base='#636d67' if not rusted else '#756052'
    if cement:base='#8c9690'
    if cap:base='#a8afa0'
    rect(x,y,w,h,base)
    for _ in range(w*h//210):
        sx=r.randrange(1,w-7);sy=r.randrange(1,h-6)
        if cement or cap:
            c=r.choice(['#a4aea0','#899687','#b4b9aa'])
        else:
            c=r.choice(['#86634c','#957452','#685446','#ae8a61','#4f5c55'])
        length=r.randrange(2,8)
        for d in range(length):
            width=1 if d==length-1 else r.choice([1,1,2,3])
            line(x+sx,y+sy+d,x+sx+width-1,y+sy+d,c)
        if not (cement or cap):dab(x+sx,y+sy,'#b09b77')
    for _ in range(w*h//90):
        sx=r.randrange(w);sy=r.randrange(h)
        dab(x+sx,y+sy,r.choice(['#a1aaa0','#758373','#89968b']) if cement or cap else r.choice(['#839083','#52615a','#826b51']))
metal(768,0,256,64,9711)
metal(768,64,256,64,9917,True)
metal(768,128,256,64,9931,cap=True)
metal(768,192,256,64,9949,cement=True)
wall(768,256,256,256,7315)

def roof(x,y,w,h,seed,red=True):
    r=random.Random(seed)
    colours=['#95604e','#8e5b4d','#a26954','#98634f','#8b5a4b','#9c6858'] if red else ['#58625e','#5e6862','#53615b','#667068','#606a62']
    joint='#604b40' if red else '#3f514a'
    rect(x,y,w,h,joint)
    tw,th=6,8
    for yy in range(0,h,th):
        for xx in range(-(3 if yy//th%2 else 0),w,tw):
            base=r.choice(colours)
            # Each tile uses the same 1 px grid, with differing pigment,
            # curved highlights, dusty edges and genuinely different losses.
            region=int(3*math.sin(xx*.011+yy*.018)+2*math.cos(xx*.032))
            base=shift(base,region)
            a=max(0,xx);b=min(w-1,xx+tw-2)
            if a<=b:
                rect(x+a,y+yy,b-a+1,th-2,base)
                line(x+a,y+yy+th-2,x+b,y+yy+th-2,shift(base,-5))
            if 0<=xx+1<w:
                line(x+xx+1,y+yy,x+xx+1,y+yy+4,shift(base,10))
                line(x+xx+1,y+yy+5,x+xx+1,y+yy+th-2,shift(base,4))
            if 0<=xx+tw-2<w:
                line(x+xx+tw-2,y+yy,x+xx+tw-2,y+yy+th-2,shift(base,-12))
            if r.random()<.42:
                dx=r.choice([1,2,3]);dy=r.randrange(1,th-2)
                if 0<=xx+dx<w:dab(x+xx+dx,y+yy+dy,'#b39172' if red else '#88917d')
            if r.random()<.09 and 0<=xx+2<w:
                dab(x+xx+2,y+yy+th-2,joint)
                if 0<=xx+3<w:dab(x+xx+3,y+yy+th-3,shift(base,-16))
    # Long-lived rain deposits connect several tiles, without repainting
    # every tile with one identical wear decal.
    for _ in range(26):
        sx=r.randrange(5,w-12);sy=r.randrange(4,h-30);length=r.randrange(8,28)
        tone=r.choice(['#88715a','#977a60','#6e6650']) if red else r.choice(['#738071','#859080','#4f6555'])
        for d in range(length):
            if r.random()<.48:
                dab(x+sx+(d//11),y+sy+d,tone)
                if r.random()<.18:dab(x+sx+1+(d//11),y+sy+d,tone)
roof(0,640,704,128,5757)
roof(0,768,704,128,5763)
roof(0,896,704,128,5689,False)

record={'canvas':[1024,1024],'texelsPerMetre':16,'oldSourceSHA256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        'references':['user photos 1-3','Makkon Concrete and Metal','Saint11 Metals and Making Tiles'],
        'erasedChineseShopNames':6,'strokes':strokes}
(HERE/'pencil-strokes.json').write_text(json.dumps(record,separators=(',',':')))

gd='''extends Node
func _ready():
 if "--rooftop-weathering" in OS.get_cmdline_user_args():
  Global.pixelorama_opened.connect(paint, CONNECT_ONE_SHOT)
func paint():
 var path=""
 for arg in OS.get_cmdline_user_args():
  if arg.begins_with("--book-dir="): path=arg.trim_prefix("--book-dir=")
 var record=JSON.parse_string(FileAccess.get_file_as_string(path.path_join("pencil-strokes.json")))
 OpenSave.open_image_as_new_tab("terrace-book.png",Image.create(1024,1024,false,Image.FORMAT_RGBA8))
 var project=Global.current_project
 project.name="terrace-book"
 project.layers[0].name="Concrete, limewash, old brick-red tiles and iron / 1 px"
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
 var stroke_index=0
 for mark in record.strokes:
  pencil.tool_slot.color=Color(mark.color)
  var points=mark.points
  pencil.draw_start(Vector2i(points[0][0],points[0][1]))
  for point in points.slice(1): pencil.draw_move(Vector2i(point[0],point[1]))
  pencil.draw_end(Vector2i(points[-1][0],points[-1][1]))
  stroke_index+=1
  if stroke_index%5000==0:
   var progress=FileAccess.open(path.path_join("paint-progress.json"),FileAccess.WRITE)
   progress.store_string(JSON.stringify({"painted":stroke_index,"total":record.strokes.size()}))
   progress.close()
 project.set_meta("weathering_revision","Photo-guided native 1 px Pencil; 16 px/metre; no shop lettering")
 var saved=OpenSave.save_pxo_file(path.path_join("terrace-book.pxo"),false,true,project)
 var exported=project.frames[0].cels[0].get_image().save_png(path.path_join("terrace-book.png"))
 var file=FileAccess.open(path.path_join("pixelorama-authoring.json"),FileAccess.WRITE)
 file.store_string(JSON.stringify({"software":"Pixelorama","version":Global.current_version,"tool":"Pencil","brush":1,"integerCoordinates":true,"strokes":record.strokes.size(),"nativeSaved":saved,"nativePngExport":exported==OK,"texelsPerMetre":16,"erasedChineseShopNames":6},"  "))
 print("NATIVE WEATHERING saved=",saved," export=",exported," strokes=",record.strokes.size())
 get_tree().quit(0 if saved and exported==OK else 3)
'''
(HERE/'Main.gd').write_text(gd)
(HERE/'Main.tscn').write_text('[gd_scene load_steps=2 format=3]\n[ext_resource type="Script" path="res://src/Extensions/RooftopWeathering/Main.gd" id="1"]\n[node name="RooftopWeathering" type="Node"]\nscript = ExtResource("1")\n')
(HERE/'extension.json').write_text(json.dumps({'name':'RooftopWeathering','display_name':'Rooftop material refinement','description':'Native 1 px Pencil authoring','author':'五月七日','version':'0.1','supported_api_versions':[8],'license':'MIT','nodes':['Main.tscn']}))
config=Path('/Users/d/Library/Application Support/Pixelorama/config.ini')
backup=config.read_bytes()
extension=config.parent/'extensions/RooftopWeathering.zip'
extension.parent.mkdir(exist_ok=True)
assert not extension.exists()
with zipfile.ZipFile(extension,'w',zipfile.ZIP_DEFLATED) as z:
    for name in ['Main.gd','Main.tscn','extension.json']:
        z.write(HERE/name,'src/Extensions/RooftopWeathering/'+name)
config.write_bytes(backup+b'\n[extensions]\nRooftopWeathering=true\n')
try:
    p=subprocess.run(['/Applications/Pixelorama.app/Contents/MacOS/Pixelorama','--headless','--','--rooftop-weathering','--book-dir='+str(HERE)],capture_output=True,text=True,timeout=600)
    print(p.stdout[-1600:]);print(p.stderr[-1600:])
    assert p.returncode==0
finally:
    config.write_bytes(backup)
    extension.unlink(missing_ok=True)
assert TARGET.exists() and (HERE/'terrace-book.png').exists()
print('Pixelorama native source saved:',TARGET.stat().st_size)
