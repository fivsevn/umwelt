"""Draw a new architectural book through Pixelorama's native Pencil.
The floor charts are unique paintings, not a repeating repair tile.
"""
from pathlib import Path
import json, random, zipfile, subprocess, sys
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
if (HERE/'terrace-book.pxo').exists() and '--replay-existing' not in sys.argv:
 raise SystemExit('Native source exists. Edit in Pixelorama, or explicitly replay this authoring plan with --replay-existing.')
TARGET=ROOT/'rooftop/assets/background/terrace-book.png'
R=random.Random(920604)
W=512
pixels=[['#aaa99f']*W for _ in range(W)]
def dot(x,y,c):
 if 0<=x<W and 0<=y<W:pixels[y][x]=c
def rect(x,y,w,h,c):
 for yy in range(y,y+h):
  for xx in range(x,x+w):dot(xx,yy,c)
def line(x,y,x1,y1,c):
 n=max(abs(x1-x),abs(y1-y))+1
 for i in range(n):dot(round(x+(x1-x)*i/max(1,n-1)),round(y+(y1-y)*i/max(1,n-1)),c)
def polygon(points,c):
 for y in range(min(p[1] for p in points),max(p[1] for p in points)+1):
  cuts=[]
  for a,b in zip(points,points[1:]+points[:1]):
   if (a[1]<=y<b[1])or(b[1]<=y<a[1]):cuts.append(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]))
  cuts.sort()
  for a,b in zip(cuts[::2],cuts[1::2]):line(round(a),y,round(b),y,c)
def grain(x,y,w,h,colors,count):
 for _ in range(count):
  xx=R.randrange(x,x+w);yy=R.randrange(y,y+h)
  rect(xx,yy,R.choice([1,1,2,3]),R.choice([1,1,2]),R.choice(colors))
def floor(x,y,w,h):
 rect(x,y,w,h,'#a4a7a1')
 # uneven slab joints, softened through years of cement washing
 for yy in range(0,h,16):
  for xx in range(0,w,16):
   c=R.choice(['#a7aaa4','#a1a59f','#a9aca6','#a3a7a1','#adb0a9'])
   rect(x+xx,y+yy,min(16,w-xx),min(16,h-yy),c)
   line(x+xx,y+yy,x+min(w-1,xx+15),y+yy,'#949991')
   line(x+xx,y+yy,x+xx,y+min(h-1,yy+15),'#92988f')
   line(x+xx+2,y+yy+2,x+min(w-1,xx+13),y+yy+2,'#b2b5ad')
 # continuous patches obscure the joints; their shape does not repeat
 for pts,c in [([(16,62),(54,60),(57,81),(45,97),(14,93)],'#959c94'), ([(100,81),(133,79),(147,105),(140,137),(110,149),(97,117)],'#b6b5a9'), ([(146,12),(166,10),(170,29),(158,40),(143,31)],'#9c9f96'), ([(52,143),(90,141),(91,179),(79,191),(49,177)],'#aeb2aa')]:
  if max(p[0] for p in pts)<w and max(p[1] for p in pts)<h:polygon([(x+a,y+b)for a,b in pts],c)
 for yy in range(6,h-8,7):
  for _ in range(4):
   xx=R.randrange(3,w-8)
   line(x+xx,y+yy,x+xx+R.randrange(3,8),y+yy+1,R.choice(['#a0a69d','#b0b4ac','#aaaea7']))
 grain(x+1,y+1,w-4,h-4,['#929a91','#aab0a6','#b5b8b0'],w*h//85)
 for pts in [[(22,44),(24,51),(21,56),(25,63),(26,70)],[(62,115),(68,117),(71,122),(78,121)],[(147,156),(151,161),(149,170),(156,175)]]:
  if max(p[0]for p in pts)<w and max(p[1]for p in pts)<h:
   for a,b in zip(pts,pts[1:]):line(x+a[0],y+a[1],x+b[0],y+b[1],'#858e83')
floor(0,0,256,256);floor(256,0,192,128)
rect(0,256,128,128,'#c1c0b4')
# lime-plaster: broad weather stains, discrete cement fixes, quiet scraped edges
for _ in range(90):
 x=R.randrange(0,121);y=R.randrange(258,372)
 rect(x,y,R.randrange(3,9),R.randrange(3,12),R.choice(['#b6b9aa','#b9bbad','#c6c5b9','#bfc2b3']))
for x in range(6,128,19):
 for y in range(259,287,4):rect(x,y,2,4,R.choice(['#aeb3a2','#b4b8a6']))
polygon([(18,319),(38,317),(42,330),(31,341),(15,337)],'#a6aea1')
polygon([(79,347),(96,344),(103,362),(91,365),(78,358)],'#ccd0c2')
grain(1,257,124,124,['#b2b7a8','#cacabd','#bfc4b4'],200)
rect(128,256,128,128,'#535b5a')
for y in range(256,384,4):
 for x in range(128-3 if (y//4)%2 else 128,256,7):
  a=max(128,x);b=min(255,x+6)
  line(a,y,b,y,'#384341');line(a,y+1,b,y+1,R.choice(['#616966','#5d6663','#586260']))
  line(a,y+3,b,y+3,'#48524f')
grain(129,257,124,124,['#657169','#788075','#475951'],65)
rect(256,256,32,32,'#6a706b');grain(256,256,30,30,['#8d7760','#9b8266','#4b5a54'],95)
rect(288,256,32,32,'#75888a')
for x in [6,17,24]:rect(288+x,256,2,32,'#9da6a0')
rect(320,256,96,128,'#b7b6ac');grain(321,257,92,124,['#c3c1b4','#a8afa2','#afb3a6'],240)
rect(416,256,96,128,'#99887a')
for yy in range(258,384,14):
 for xx in range(420,512,12):
  rect(xx,yy,7,min(9,384-yy),'#718181')
  rect(xx+3,yy,1,min(9,384-yy),'#b4ab98')
  line(xx,yy+10,min(xx+9,511),yy+10,'#b9aa96')
for xx in range(419,512,24):rect(xx,256,2,128,'#c0b4a1')
rect(256,288,32,32,'#b0b3a7');grain(256,288,30,30,['#8f9b88','#bdc3b2','#a7b59a'],80)
rect(288,288,32,32,'#879087');grain(288,288,30,30,['#929d91','#737f74'],65)
rect(256,320,32,32,'#d6bf91');rect(263,320,2,32,'#899792');rect(279,320,2,32,'#a1a694')
rect(320,384,64,64,'#667564');grain(320,384,61,61,['#7e896c','#576959','#879078'],230)
rect(384,384,128,128,'#969d92');grain(384,384,125,125,['#8b9587','#a3a797','#6f8574'],200)
rect(0,384,128,128,'#b0b3a4')
for _ in range(80):
 x=R.randrange(0,120);y=R.randrange(384,485)
 rect(x,y,R.randrange(1,4),R.randrange(8,26),R.choice(['#919f8a','#9da992','#a4b09c','#bdc0af']))
rect(128,384,128,128,'#66726e');grain(129,385,124,124,['#5c6964','#788178','#61796a'],90)
rect(288,320,32,32,'#527789')
for x in [291,304,314]:rect(x,320,2,32,'#688e9b')
rect(288,352,32,32,'#4f6264')
for x in [292,309]:rect(x,352,2,32,'#728282')
rect(256,352,32,32,'#705952');grain(256,352,30,30,['#896e57','#9a7858','#584f47'],85)
rect(256,384,64,64,'#d4d0c2')
for y in range(384,448,4):line(256,y,319,y,'#bdbfb5')
for x in range(256,320,4):line(x,384,x,447,'#c1c4b9')
rect(320,448,64,64,'#9d9e96')
for y in range(450,512,10):
 for x in range(322,384,9):
  rect(x,y,5,min(7,512-y),'#6e8186');line(x,y+7,min(383,x+6),y+7,'#b6b8ac')
rect(256,448,64,64,'#baae9a');grain(256,448,60,60,['#c8bca8','#ac9c8c','#b4a993'],55)
rect(448,0,64,64,'#7b8781')
for y in range(0,64,3):
 line(448,y,511,y,'#63736d');line(448,y+1,511,y+1,'#919a90')
grain(449,1,60,60,['#777f74','#a3a695','#828d81'],65)
signs=[('sign-fresh',256,128,'大腾新迎生鲜超市','#5c7764'),('sign-convenience',384,128,'慧友便民超市','#95695e'),('sign-barber',256,144,'阿狄造型','#727786'),('sign-noodles',384,144,'红烧牛肉粉','#a58964'),('sign-bikes',256,160,'绿能电动车','#76825b'),('sign-repair',384,160,'汽车美容','#76898a')]
for _,x,y,_,c in signs:rect(x,y,128,16,c)
for x,c in [(256,'#cfcdc1'),(288,'#9aaba9'),(320,'#657f8c'),(352,'#98665e'),(384,'#424e4a'),(416,'#d6d4bc'),(448,'#a76956'),(480,'#75847c')]:
 rect(x,176,32,32,c)
 if x<384:grain(x,176,30,30,[c,'#afb7ad'],20)
fields={'north-floor':[0,0,256,256],'south-floor':[256,0,192,128],'plaster':[0,256,128,128],'roof':[128,256,128,128],'metal':[256,256,32,32],'glass':[288,256,32,32],'facade':[320,256,96,128],'tower':[416,256,96,128],'cap':[256,288,32,32],'cement':[288,288,32,32],'lit-window':[256,320,32,32],'foliage':[320,384,64,64],'ground':[384,384,128,128],'stained-plaster':[0,384,128,128],'road':[128,384,128,128]}
fields.update({'blue-glass':[288,320,32,32],'dark-glass':[288,352,32,32],'rust-iron':[256,352,32,32],'awning':[256,384,64,64],'cool-tower':[320,448,64,64],'tower-trim':[256,448,64,64],'garage-door':[448,0,64,64]})
for name,x,y,_,_ in signs:fields[name]=[x,y,128,16]
for name,x in [('car-ivory',256),('car-silver',288),('car-blue',320),('car-red',352),('tire',384),('headlamp',416),('taillamp',448),('paving',480)]:fields[name]=[x,176,32,32]
# The red-tile rows south-west of the district are visible in the aerial.
rect(384,208,128,48,'#80665a')
for yy in range(208,256,4):
 for xx in range(384-(3 if (yy//4)%2 else 0),512,7):
  a=max(384,xx);b=min(511,xx+6)
  line(a,yy,b,yy,'#64594f');line(a,yy+1,b,yy+1,'#9a7a64');line(a,yy+3,b,yy+3,'#776253')
fields['red-roof']=[384,208,128,48]
strokes=[]
for y,row in enumerate(pixels):
 start=0
 for x in range(1,W+1):
  if x==W or row[x]!=row[start]:
   strokes.append({'color':row[start],'points':[[start,y],[x-1,y]]});start=x
(HERE/'pencil-strokes.json').write_text(json.dumps({'fields':fields,'strokes':strokes,'signs':[{'x':x,'y':y,'text':word}for _,x,y,word,_ in signs]},separators=(',',':')))
# This extension is loaded only for this one authoring run and config is restored.
gd='''extends Node
func _ready():
 if "--terrace-shell" in OS.get_cmdline_user_args():
  Global.pixelorama_opened.connect(paint, CONNECT_ONE_SHOT)
func paint():
 var path = ""
 for arg in OS.get_cmdline_user_args():
  if arg.begins_with("--book-dir="): path=arg.trim_prefix("--book-dir=")
 var record=JSON.parse_string(FileAccess.get_file_as_string(path.path_join("pencil-strokes.json")))
 OpenSave.open_image_as_new_tab("terrace-book.png",Image.create(512,512,false,Image.FORMAT_RGBA8))
 var project=Global.current_project
 project.name="terrace-book"
 project.layers[0].name="Unique old floors and architectural pigments"
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
  pencil.draw_start(Vector2i(mark.points[0][0],mark.points[0][1]))
  pencil.draw_move(Vector2i(mark.points[1][0],mark.points[1][1]))
  pencil.draw_end(Vector2i(mark.points[1][0],mark.points[1][1]))
 Tools.assign_tool("Text",MOUSE_BUTTON_LEFT)
 var text_tool=Tools._slots[MOUSE_BUTTON_LEFT].tool_node
 var native_font=FontFile.new()
 native_font.load_dynamic_font("/System/Library/Fonts/STHeiti Medium.ttc")
 native_font.antialiasing=TextServer.FONT_ANTIALIASING_NONE
 text_tool.font.base_font=native_font
 text_tool.text_size=14
 text_tool.tool_slot.color=Color("#e0ddd0")
 for sign in record.signs:
  text_tool.draw_start(Vector2i(sign.x+2,sign.y))
  text_tool.text_edit.text=sign.text
  text_tool.text_edit.position=Vector2(sign.x+2,sign.y)
  text_tool.text_edit.custom_minimum_size=Vector2.ZERO
  text_tool.text_edit.size=Vector2(126,16)
  text_tool.text_to_pixels()
 Tools.assign_tool("Pencil",MOUSE_BUTTON_LEFT)
 var saved=OpenSave.save_pxo_file(path.path_join("terrace-book.pxo"),false,true,project)
 var exported=project.frames[0].cels[0].get_image().save_png(path.path_join("../../../rooftop/assets/background/terrace-book.png"))
 var file=FileAccess.open(path.path_join("pixelorama-authoring.json"),FileAccess.WRITE)
 file.store_string(JSON.stringify({"software":"Pixelorama","version":Global.current_version,"tool":"Pencil and Text","strokes":record.strokes.size(),"native_text_signs":record.signs.size(),"native_saved":saved,"native_png_export":exported==OK,"texels_per_unit":8},"  "))
 print("TERRACE BOOK saved=",saved," export=",exported)
 get_tree().quit(0 if saved and exported==OK else 3)
'''
(HERE/'Main.gd').write_text(gd)
(HERE/'Main.tscn').write_text('[gd_scene load_steps=2 format=3]\n[ext_resource type="Script" path="res://src/Extensions/TerraceShell/Main.gd" id="1"]\n[node name="TerraceShell" type="Node"]\nscript = ExtResource("1")\n')
(HERE/'extension.json').write_text(json.dumps({'name':'TerraceShell','display_name':'Terrace architectural painting','description':'Native Pencil authoring','author':'五月七日','version':'0.1','supported_api_versions':[8],'license':'MIT','nodes':['Main.tscn']}))
config=Path('/Users/d/Library/Application Support/Pixelorama/config.ini')
backup=config.read_bytes();extension=config.parent/'extensions/TerraceShell.zip'
assert not extension.exists()
with zipfile.ZipFile(extension,'w',zipfile.ZIP_DEFLATED)as z:
 for name in ['Main.gd','Main.tscn','extension.json']:z.write(HERE/name,'src/Extensions/TerraceShell/'+name)
config.write_text(config.read_text()+'\n[extensions]\nTerraceShell=true\n')
try:
 p=subprocess.run(['/Applications/Pixelorama.app/Contents/MacOS/Pixelorama','--','--terrace-shell','--book-dir='+str(HERE)],capture_output=True,text=True,timeout=300)
 print(p.stdout[-1200:]);print(p.stderr[-1200:]);assert p.returncode==0
finally:
 config.write_bytes(backup);extension.unlink(missing_ok=True)
assert config.read_bytes()==backup
assert TARGET.exists() and (HERE/'terrace-book.pxo').exists()
print('Native Pencil strokes',len(strokes),'PNG bytes',TARGET.stat().st_size)
