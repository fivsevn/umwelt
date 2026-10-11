"""Soften and narrow only the two red roof paintings in the saved native PXO."""
from pathlib import Path
import json, random, math, subprocess, zipfile
HERE=Path(__file__).resolve().parent
marks=[]
def mark(c,points):marks.append({'color':c,'points':points})
def line(x,y,x1,y1,c):mark(c,[[x,y],[x1,y1]])
def rect(x,y,w,h,c):
    pts=[]
    for yy in range(y,y+h):
        a,b=(x,x+w-1) if (yy-y)%2==0 else (x+w-1,x)
        pts.extend([[a,yy],[b,yy]])
    mark(c,pts)
def shift(c,d):return '#'+''.join(f'{max(0,min(255,int(c[i:i+2],16)+d)):02x}' for i in (1,3,5))
for oy,seed in [(640,5757),(768,5763)]:
    r=random.Random(seed)
    rect(0,oy,704,128,'#805b4b')
    for yy in range(0,128,6):
        for xx in range(-(2 if yy//6%2 else 0),704,4):
            c=r.choice(['#926453','#966953','#9c6d59','#8e6253','#996958','#946757'])
            c=shift(c,int(3*math.sin(xx*.014+yy*.033)+2*math.cos(xx*.031)))
            a=max(0,xx);b=min(703,xx+2);height=min(5,128-yy)
            if a<=b:rect(a,oy+yy,b-a+1,height,c)
            if 0<=xx+1<704:line(xx+1,oy+yy,xx+1,oy+yy+height-1,shift(c,5))
            if 0<=xx+2<704:line(xx+2,oy+yy,xx+2,oy+yy+height-1,shift(c,-4))
            if r.random()<.31:
                px=xx+r.choice([0,1,2]);py=oy+yy+r.randrange(height)
                if 0<=px<704:line(px,py,px,py,r.choice(['#a17e63','#a88467','#95735b']))
            if r.random()<.05 and height>3 and 0<=xx+1<704:
                line(xx+1,oy+yy+height-1,xx+1,oy+yy+height-1,'#815d4c')
    for _ in range(34):
        sx=r.randrange(3,700);sy=r.randrange(4,100);length=r.randrange(10,26)
        c=r.choice(['#95785f','#896f58','#a28365'])
        for d in range(length):
            if r.random()<.4:line(sx+d//13,oy+sy+d,sx+d//13,oy+sy+d,c)
(HERE/'roof-pencil-strokes.json').write_text(json.dumps({'strokes':marks},separators=(',',':')))
gd='''extends Node
func _ready():
 if "--rooftop-roof-refine" in OS.get_cmdline_user_args():
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
 var record=JSON.parse_string(FileAccess.get_file_as_string(path.path_join("roof-pencil-strokes.json")))
 for mark in record.strokes:
  pencil.tool_slot.color=Color(mark.color)
  pencil.draw_start(Vector2i(mark.points[0][0],mark.points[0][1]))
  for point in mark.points.slice(1):pencil.draw_move(Vector2i(point[0],point[1]))
  pencil.draw_end(Vector2i(mark.points[-1][0],mark.points[-1][1]))
 project.set_meta("roof_refinement","Narrow aged clay tiles; soft seams; native 1 px Pencil")
 var saved=OpenSave.save_pxo_file(path.path_join("terrace-book.pxo"),false,true,project)
 var png=project.frames[0].cels[0].get_image().save_png(path.path_join("terrace-book.png"))
 var report={"software":"Pixelorama","version":Global.current_version,"tool":"Pencil","brush":1,"strokes":record.strokes.size(),"nativeSaved":saved,"nativePngExport":png==OK,"changedOnly":[[0,640,704,128],[0,768,704,128]]}
 var file=FileAccess.open(path.path_join("pixelorama-roof-refinement.json"),FileAccess.WRITE)
 file.store_string(JSON.stringify(report,"  "))
 print("NATIVE ROOF REFINEMENT ",JSON.stringify(report))
 get_tree().quit(0 if saved and png==OK else 3)
'''
(HERE/'RoofMain.gd').write_text(gd)
(HERE/'RoofMain.tscn').write_text('[gd_scene load_steps=2 format=3]\n[ext_resource type="Script" path="res://src/Extensions/RooftopRoof/RoofMain.gd" id="1"]\n[node name="RooftopRoof" type="Node"]\nscript = ExtResource("1")\n')
(HERE/'roof-extension.json').write_text(json.dumps({'name':'RooftopRoof','display_name':'Rooftop roof refinement','description':'Native Pencil roof edit','author':'五月七日','version':'0.1','supported_api_versions':[8],'license':'MIT','nodes':['RoofMain.tscn']}))
config=Path('/Users/d/Library/Application Support/Pixelorama/config.ini')
backup=config.read_bytes();extension=config.parent/'extensions/RooftopRoof.zip'
assert not extension.exists()
with zipfile.ZipFile(extension,'w',zipfile.ZIP_DEFLATED) as z:
    z.write(HERE/'RoofMain.gd','src/Extensions/RooftopRoof/RoofMain.gd')
    z.write(HERE/'RoofMain.tscn','src/Extensions/RooftopRoof/RoofMain.tscn')
    z.write(HERE/'roof-extension.json','src/Extensions/RooftopRoof/extension.json')
config.write_bytes(backup+b'\n[extensions]\nRooftopRoof=true\n')
try:
    p=subprocess.run(['/Applications/Pixelorama.app/Contents/MacOS/Pixelorama','--headless','--',str(HERE/'terrace-book.pxo'),'--rooftop-roof-refine','--book-dir='+str(HERE)],capture_output=True,text=True,timeout=360)
    print(p.stdout[-1600:]);print(p.stderr[-800:]);assert p.returncode==0
finally:
    config.write_bytes(backup);extension.unlink(missing_ok=True)
print('Edited the two original native roof rectangles with',len(marks),'Pencil strokes')
