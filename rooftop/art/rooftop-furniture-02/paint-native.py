"""Actual Pixelorama Pencil authoring, saving and independent native reopening.
Python prepares integer Pencil paths and reads image bytes for verification.
It never creates or edits raster images. One physical texel = 1/16 metre.
"""
from pathlib import Path
import json,sys,random,hashlib,math,subprocess,zipfile,shutil,importlib.util
ROOT=Path(__file__).resolve().parent
NAME='UmweltFurnitureAuthor02'
FAMILY=sys.argv[1]
HERE=ROOT/FAMILY
LAYOUT=json.loads((HERE/'texture-layout.json').read_text());SIZE=LAYOUT['size'];DENSITY=16
EXTRA_PATTERN=None
if (HERE/'patterns.py').exists():
 spec=importlib.util.spec_from_file_location('native_ceramic_patterns',HERE/'patterns.py')
 module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
 EXTRA_PATTERN=module.pattern_color

def shade(hex,factor):
 return '#'+''.join(f'{max(0,min(255,round(int(hex[i:i+2],16)*factor))):02x}' for i in (1,3,5))
def line(x,y,a,b,c,d,th=.04):
 vx=c-a;vy=d-b;l=vx*vx+vy*vy
 t=max(0,min(1,((x-a)*vx+(y-b)*vy)/l)) if l else 0
 return math.hypot(x-(a+t*vx),y-(b+t*vy))<th

def vessel_color(f,point,base):
 if EXTRA_PATTERN:return EXTRA_PATTERN(f,point,base)
 id=f['asset'];role=f['role'].lower();x,y,z=point
 r=math.hypot(x,y);theta=math.atan2(y,x);inner='inner' in role or 'interior' in role
 outer='outer' in role or 'exterior' in role
 if not (inner or outer):return base
 # Pigments occupy whole physical texture pixels, including interior floors.
 if id=='antique-shino' and inner:
  for a,b,c,d in [(-.17,-.10,.02,.16),(-.05,-.08,.08,.14),(-.16,.02,-.12,.17)]:
   if line(x,y,a,b,c,d,.018):return '#795743'
  if ((x+.10)**2+(y-.09)**2<.055**2) or ((x-.045)**2+(y-.04)**2<.032**2):return '#946e54'
 elif id=='antique-nezumi' and inner:
  if (line(x,y,-.16,-.14,.08,.17,.024) or line(x,y,-.02,-.17,-.08,.15,.025)
      or line(x,y,.07,-.08,.17,.06,.023) or (.14<r<.19 and -.4<theta<1.7)):
   return '#e0d5bd'
 elif id=='antique-shino-square' and outer:
  nx,ny,_=f['faceNormal'];u=x if abs(ny)>.5 else y
  if ny<-.5:
   if abs(((u+.25)% .125)-.0625)<.025 or abs(((z+.1)% .125)-.0625)<.025:return '#70563f'
  elif nx>.5:
   if abs(u)<.055 and .10<z<.35:return '#74533f'
  elif ny>.5:
   if line(u,z,-.12,.08,.025,.30,.022) or ((u-.08)**2+(z-.28)**2<.035**2):return '#71543d'
  else:
   if line(u,z,0,.06,.075,.32,.022) or line(u,z,-.10,.12,.015,.21,.022):return '#775b42'
 elif id=='antique-nabeshima' and outer:
  t=((theta+.4+math.pi/3)%(math.tau/3))-math.pi/3
  if abs(t)<.17 and .08<z<.20:return '#bec9bf'
  if abs(t)<.36 and .18<z<.23:return '#537c7c'
 elif id=='antique-nabeshima-dish':
  if inner:
   if .16<r<.20 or .235<r<.265:return '#486784'
   if .09<r<.145 and abs(math.sin(theta*4))>.60:return '#456481'
   if r<.08 and (abs(x)<.025 or abs(y)<.025):return '#456481'
  elif outer:
   t=((theta+math.pi/3)%(math.tau/3))-math.pi/3
   if abs(t)<.2 and z>.035:return '#506d84'
 elif id=='antique-kutani-red' and inner:
  if .34<r<.38 or .22<r<.27:return '#a3503d'
  if .285<r<.312:return '#b39a64'
  # A deliberately block-shaped, newly drawn shishi inside the central roundel.
  glyph=['..RR.....','..RRR..R.','RRRRRRRR.','RRRRRR.R.','.RRRRR...','..R.R.R..','..R...R..']
  gx=int((x+.28125)*16);gy=int((y+.21875)*16)
  if 0<=gy<len(glyph) and 0<=gx<9 and glyph[gy][gx]=='R':return '#a65a43'
  if .30<r<.345 and math.sin(theta*6)>.65:return '#a55c45'
 elif id=='antique-celadon' and inner:
  if (line(x,y,-.08,-.07,.09,-.07,.018) or line(x,y,-.08,.08,.09,.08,.018) or line(x,y,-.11,.09,0,.15,.018) or line(x,y,0,.15,.13,.09,.018)
      or line(x,y,-.04,-.08,-.04,.08,.018) or line(x,y,.05,-.08,.05,.08,.018)
      or line(x,y,-.24,-.12,-.10,-.12,.018) or line(x,y,.18,-.1,.18,.13,.018)):return '#91aea0'
 elif id=='antique-oribe-jar' and outer:
  if y<0 and (line(x,z,-.1,.12,.05,.39,.02) or line(x,z,-.04,.22,-.15,.30,.02)):return '#75614c'
  if y>0 and (line(x,z,-.11,.15,.11,.23,.022) or line(x,z,.11,.23,-.03,.36,.022)):return '#735f4a'
 return EXTRA_PATTERN(f,point,base) if EXTRA_PATTERN else base

def plan():
 strokes=[];count=0
 for f in LAYOUT['fields']:
  x,y,w,h=[int(f[k]) for k in ('x','y','w','h')]
  seed=int(hashlib.sha256(f['id'].encode()).hexdigest()[:12],16);rng=random.Random(seed)
  base=f.get('baseColor','#a1a79c');mat=f['material'];role=f['role'].lower()
  # Only actual timber boards vary softly between components, never between faces.
  timber=mat.startswith('wood') or mat in ('wardrobe-oak','wardrobe-back')
  fabric=mat.startswith('cloth') or mat in ('sofa-cloth','sofa-leather','blanket-sage')
  if timber:
   s=int(hashlib.sha256((f['asset']+f['component']).encode()).hexdigest()[:6],16)
   base=shade(base,(.96,1,1.035)[s%3])
  pts=[]
  for row,yy in enumerate(range(y-1,y+h+1)):
   pts.extend([[x-1,yy],[x+w,yy]] if row%2==0 else [[x+w,yy],[x-1,yy]])
  strokes.append({'color':base,'points':pts});count+=1
  colors={}
  def pixel(i,j,c):
   if 0<=i<w and 0<=j<h and c!=base:colors[i,j]=c
  length,width=(w,h) if w>=h else (h,w)
  def along(start,stop,cross,color):
   for k in range(start,stop+1):pixel(k,cross,color) if w>=h else pixel(cross,k,color)
  if timber and length>3:
   lines=min(2,max(1,width//4))
   for index in range(lines):
    start=rng.randrange(max(1,length//3));stop=min(length-1,start+rng.randint(2,max(3,length//2)))
    along(start,stop,rng.randrange(width),shade(base,.85 if index%2==0 else 1.07))
   if any(s in role for s in ('foot','board','end')) and rng.random()<.12:along(max(0,length-2),length-1,0,shade(base,.87))
  elif mat in ('steel','steel-dark','iron-black','iron-silver') and length>4:
   if any(s in role for s in ('edge','rim','joint','handle','post','foot')) and rng.random()<.12:
    along(0,min(length-1,1),rng.randrange(width),shade(base,1.18 if 'black' in mat else .86))
  elif mat.startswith('plastic') and length>5 and any(s in role for s in ('rim','handle','edge')) and rng.random()<.10:
   along(max(0,length-2),length-1,0,shade(base,1.08))
  elif mat=='soil':
   for _ in range(max(1,w*h//12)):pixel(rng.randrange(w),rng.randrange(h),rng.choice(['#75624d','#5c4c40','#806d55']))
  elif mat=='foam' and w*h>8:
   for _ in range(max(1,w*h//26)):pixel(rng.randrange(w),rng.randrange(h),shade(base,.965))
  elif fabric and w*h>20 and any(s in role for s in ('seat','cushion','blanket')):
   along(0,min(length-1,2),0,shade(base,.92))
  if f['asset'].startswith('antique-') or EXTRA_PATTERN:
   origin=f['paintOrigin'];u=f['uAxis'];v=f['vAxis']
   for j in range(h):
    for i in range(w):
     point=[origin[k]+u[k]*(i+.5)/16+v[k]*(j+.5)/16 for k in range(3)]
     pixel(i,j,vessel_color(f,point,base))
  # Contiguous integer runs are painted by the native one-pixel Pencil.
  for j in range(h):
   i=0
   while i<w:
    color=colors.get((i,j));start=i;i+=1
    if color is None:continue
    while i<w and colors.get((i,j))==color:i+=1
    strokes.append({'color':color,'points':[[x+start,y+j],[x+i-1,y+j]]});count+=1
 (HERE/'pencil-strokes.json').write_text(json.dumps(dict(size=SIZE,strokes=strokes),separators=(',',':')))
 print(FAMILY, 'prepared',count,'actual native Pencil paths',flush=True)

GD='''extends Node
func _ready():
 if "--furniture-native" in OS.get_cmdline_user_args():Global.pixelorama_opened.connect(run_native, CONNECT_ONE_SHOT)
func run_native():
 var dir=""
 var check=false
 for arg in OS.get_cmdline_user_args():
  if arg.begins_with("--furniture-dir="):dir=arg.trim_prefix("--furniture-dir=")
  if arg=="--check-source":check=true
 if check:
  var p=Global.current_project
  var error=p.frames[0].cels[0].get_image().save_png(dir.path_join("reopened.png"))
  print("NATIVE REOPEN ",JSON.stringify({"nativePxoReopened":true,"size":[p.size.x,p.size.y],"exported":error==OK}))
  get_tree().quit(0 if error==OK else 3)
  return
 var record=JSON.parse_string(FileAccess.get_file_as_string(dir.path_join("pencil-strokes.json")))
 var size=int(record.size)
 OpenSave.open_image_as_new_tab("atlas.png",Image.create(size,size,false,Image.FORMAT_RGBA8))
 var p=Global.current_project
 p.name="furniture-atlas"
 p.layers[0].name="New native Pencil faces / uniform 16px per metre"
 p.current_layer=0;p.selected_cels=[Vector2i(0,0)]
 Tools.assign_tool("Pencil",MOUSE_BUTTON_LEFT)
 Tools.alpha_locked=false
 var pencil=Tools._slots[MOUSE_BUTTON_LEFT].tool_node
 pencil._brush_size=1;pencil._brush_density=100;pencil._strength=1.0;pencil._overwrite=true;pencil.update_brush()
 for mark in record.strokes:
  pencil.tool_slot.color=Color(mark.color)
  pencil.draw_start(Vector2i(mark.points[0][0],mark.points[0][1]))
  for point in mark.points.slice(1):pencil.draw_move(Vector2i(point[0],point[1]))
  pencil.draw_end(Vector2i(mark.points[-1][0],mark.points[-1][1]))
 p.set_meta("texelsPerMetre",16)
 var saved=OpenSave.save_pxo_file(dir.path_join(dir.get_file() + "-atlas.pxo"),false,true,p)
 var error=p.frames[0].cels[0].get_image().save_png(dir.path_join("atlas.png"))
 var report={"software":"Pixelorama","version":Global.current_version,"tool":"Pencil","brush":1,"strokes":record.strokes.size(),"nativeSaved":saved,"nativePngExport":error==OK,"texelsPerMetre":16,"size":size}
 var file=FileAccess.open(dir.path_join("pixelorama-authoring.json"),FileAccess.WRITE)
 file.store_string(JSON.stringify(report,"  "))
 print("NATIVE AUTHOR ",JSON.stringify(report))
 get_tree().quit(0 if saved and error==OK else 3)
'''

def native(check=False):
 config=Path.home()/'Library/Application Support/Pixelorama/config.ini';backup=config.read_bytes()
 extension=config.parent/'extensions'/(NAME+'.zip');assert not extension.exists()
 scene='[gd_scene load_steps=2 format=3]\n[ext_resource type="Script" path="res://src/Extensions/'+NAME+'/NativeAuthor.gd" id="1"]\n[node name="'+NAME+'" type="Node"]\nscript = ExtResource("1")\n'
 info=dict(name=NAME,display_name='Furniture native Pencil authoring',description='New complete furniture source',author='五月七日',version='0.1',supported_api_versions=[8],license='MIT',nodes=['NativeAuthor.tscn'])
 with zipfile.ZipFile(extension,'w',zipfile.ZIP_DEFLATED) as z:
  z.writestr('src/Extensions/'+NAME+'/NativeAuthor.gd',GD)
  z.writestr('src/Extensions/'+NAME+'/NativeAuthor.tscn',scene)
  z.writestr('src/Extensions/'+NAME+'/extension.json',json.dumps(info))
 config.write_bytes(backup+('\n[extensions]\n'+NAME+'=true\n').encode())
 try:
  args=['/Applications/Pixelorama.app/Contents/MacOS/Pixelorama','--headless','--']
  if check:args += [str(HERE/(FAMILY+'-atlas.pxo')),'--check-source']
  args += ['--furniture-native','--furniture-dir='+str(HERE)]
  # Large botanical families still use real native Pencil strokes. Allow time
  # proportional to the actual stroke count rather than interrupting a source.
  stroke_count=0 if check else len(json.loads((HERE/'pencil-strokes.json').read_text())['strokes'])
  native_timeout=600 if check else max(600,180+stroke_count*.025)
  result=subprocess.run(args,capture_output=True,text=True,timeout=native_timeout)
  print('\n'.join(l for l in result.stdout.splitlines() if 'NATIVE' in l or 'Time Pixelorama' in l),flush=True)
  (HERE/('native-reopen.log' if check else 'native-author.log')).write_text(result.stdout+result.stderr)
  assert result.returncode==0,'Pixelorama authoring failed, see native log'
 finally:config.write_bytes(backup);extension.unlink(missing_ok=True)
 assert config.read_bytes()==backup

if '--verify' not in sys.argv:
 assert not (HERE/(FAMILY+'-atlas.pxo')).exists(),'Source already exists; preserve revision before editing'
 plan();native()
native(True)
from PIL import Image
with zipfile.ZipFile(HERE/(FAMILY+'-atlas.pxo')) as z:
 data=json.loads(z.read('data.json'));cel=z.read('image_data/frames/1/layer_1')
assert data['size_x']==data['size_y']==SIZE
for name in ('atlas.png','reopened.png'):
 with Image.open(HERE/name) as im:assert im.size==(SIZE,SIZE) and im.convert('RGBA').tobytes()==cel
if '--verify' not in sys.argv:
 author=json.loads((HERE/'pixelorama-authoring.json').read_text());assert author['nativeSaved'] and author['nativePngExport']
shutil.copyfile(HERE/'atlas.png',ROOT/'preview'/'assets'/(FAMILY+'-atlas.png'))
(HERE/'pixelorama-source-check.json').write_text(json.dumps(dict(nativePxoReopened=True,nativeCelEqualsPngAndReopenedPng=True,
 texelsPerMetre=16,size=SIZE,fields=len(LAYOUT['fields']),pngSha256=hashlib.sha256((HERE/'atlas.png').read_bytes()).hexdigest(),
 pxoSha256=hashlib.sha256((HERE/(FAMILY+'-atlas.pxo')).read_bytes()).hexdigest(),originalConfigRestored=True),indent=2))
print(FAMILY,'native editable source and independent reopen verified',flush=True)

for name in ('pencil-strokes.json','pixelorama-authoring.json','reopened.png'):
 (HERE/name).unlink(missing_ok=True)
