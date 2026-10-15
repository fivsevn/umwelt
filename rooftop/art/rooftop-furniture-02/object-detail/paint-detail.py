"""Paint scoped refinements on existing Pixelorama sources with its real Pencil.

Python prepares integer pencil runs and verifies bytes; Pixelorama opens, edits,
saves and exports the source. Protected chart regions are compared byte-for-byte.
Usage: python paint-detail.py FAMILY --baseline /path/to/revision-backup
"""
from pathlib import Path
import argparse, json, hashlib, math, zipfile, subprocess, shutil

HERE=Path(__file__).resolve().parent
ROOT=HERE.parent
p=argparse.ArgumentParser();p.add_argument('family');p.add_argument('--baseline',type=Path,required=True)
p.add_argument('--revision',type=int,choices=(1,2,3),default=1)
args=p.parse_args();family=args.family;folder=ROOT/family;backup=args.baseline/family
layout=json.loads((folder/'texture-layout.json').read_text());size=layout['size']
scope=json.loads((HERE/('scope-round3.json' if args.revision==3 else 'scope.json')).read_text());ids={i['modelId'] for i in scope if i['family']==family}
with zipfile.ZipFile(backup/(family+'-atlas.pxo')) as z:original=z.read('image_data/frames/1/layer_1')
if args.revision in (2,3):
    import runpy
    refinement=runpy.run_path(str(HERE/('material-round3.py' if args.revision==3 else 'material-round2.py')))
    part_bounds=refinement['prepare'](layout['fields'])
    if args.revision==3:refinement['configure'](family,json.loads((folder/'catalog.json').read_text())['items'])

def seed(s):return int(hashlib.sha256(s.encode()).hexdigest()[:8],16)
def noise(x,y,z,s):
    n=(int(x)*374761393+int(y)*668265263+int(z)*2147483647+s*1274126177)&0xffffffff
    n=((n^(n>>13))*1274126177)&0xffffffff
    return ((n^(n>>16))&0xffff)/65535
def shade(c,f):return tuple(max(0,min(255,round(v*f))) for v in c)
def mix(a,b,t):return tuple(round(v*(1-t)+w*t) for v,w in zip(a,b))
def hx(c):return '#'+''.join(f'{v:02x}' for v in c)

strokes=[];allowed=bytearray(size*size);changed={id:0 for id in ids}
for f in layout['fields']:
    if f['asset'] not in ids:continue
    mat,role,id=f['material'],f['role'],f['asset']
    # Transparent panes, live foliage, water, soil and emitters keep their paint.
    if args.revision==3:
        if mat in ('glass','water','light') or role in ('review-pot','review-soil','review-support'):continue
    elif mat in ('glass','water','soil','light','leaf','leaf-dark','stem') or any(k in role for k in ('leaf','petal','seedling')):continue
    x,y,w,h=[f[k] for k in ('x','y','w','h')]
    timber=mat.startswith('wood') or mat.startswith('wardrobe')
    fabric=mat.startswith('cloth') or mat in ('sofa-cloth','sofa-leather','blanket-sage','leather') or id=='vessel-growbag'
    plastic=mat.startswith('plastic') or id in ('vessel-plastic','vessel-white','vessel-basket','vessel-trough')
    metal=any(k in mat for k in ('iron','steel','chrome','brass'))
    foam=mat=='foam' or id=='vessel-foam'
    ceramic=mat in ('porcelain','ceramic','enamel','enamel-blue') or id in ('vessel-terra','vessel-deep','vessel-shallow','ceramic-fish-bowl')
    s=seed(id);cs=seed(id+'/'+f['component']);longAxis=max(range(3),key=lambda k:abs(f['uAxis'][k]))
    if role in ('post','side','door','door-panel') and timber:longAxis=2
    crossAxis=next((k for k in range(3) if k!=longAxis and abs(f['faceNormal'][k])<.7),(longAxis+1)%3)
    grid={}
    for j in range(h):
        for i in range(w):
            point=[f['paintOrigin'][k]+f['uAxis'][k]*(i+.5)/16+f['vAxis'][k]*(j+.5)/16 for k in range(3)]
            gx,gy,gz=[math.floor(v*16+.0001) for v in point]
            n=noise(gx,gy,gz,s);coarse=noise(gx//3,gy//3,gz//3,s)
            idx=((y+j)*size+x+i)*4
            base=tuple(original[idx:idx+3]) if original[idx+3] else tuple(int(f['baseColor'][k:k+2],16) for k in (1,3,5))
            if args.revision in (2,3):
                color=refinement['colour'](f,base,point,i,j,part_bounds)
                grid[i,j]=color
                if tuple(original[idx:idx+3])!=color or original[idx+3]!=255:changed[id]+=1
                continue
            color=base;value=1
            if timber:
                along=point[longAxis]*16;cross=point[crossAxis]*16
                grain=math.floor(cross+.42*math.sin(along*.34+cs%17))
                band=.76*noise(grain,0,0,cs)+.24*noise(grain,math.floor(along/6),0,cs)
                value=1+(band-.5)*.40+(coarse-.5)*.025
                if band<.17 and n<.79:value-=.075
                if band>.8 and n>.22:value+=.045
                # Sparse end wear and darker lower end, without a uniform border.
                if point[2]<.11 and role in ('post','brace','base'):value-=.07*(1-point[2]/.11)
                if (i in (0,w-1) or j in (0,h-1)) and w*h>16 and n>.83:value+=.09
            elif metal:
                value=1+(coarse-.5)*.13+(n-.5)*.045
                if role in ('joint','hardware','pressed-rib','handle-ear'):value*=.92 if 'silver' in mat else 1.14
                if any(k in role for k in ('rim','edge','handle','post','brace','tube','frame')):
                    if n>.77 and coarse>.48:value+=.19 if 'black' in mat or 'dark' in mat else .09
                    if point[2]<.10 or (coarse<.20 and role in ('joint','shelf-edge','post')):
                        color=mix(base,(112,91,69),.24 if 'black' in mat else .16)
                if 'bucket' in id:
                    # Zinc crystals remain broad quiet patches, unlike red rust.
                    value=1+(coarse-.5)*.21
                    if point[2]<.06:color=mix(base,(122,117,99),.18)
            elif plastic:
                value=1+(coarse-.5)*.12
                if role in ('rim','corner','handle','moulded-panel','seat'):value+=.045
                if point[2]<.04 and n<.57:value-=.10
                if n>.84 and role in ('rim','handle','corner'):color=mix(base,(205,207,190),.17)
                if 'wall-rib' in role:value-=.07
            elif fabric:
                # Broken runs around the folds, not a checkerboard fabric filter.
                fold=math.sin(point[0]*19+point[1]*8+cs%19)*math.cos(point[2]*13+cs%7)
                value=1+fold*.085+(coarse-.5)*.09
                if 'seam' in role:value-=.15
                if n>.89 and 'contact' in role:value+=.08
            elif foam:
                value=1+(coarse-.5)*.09
                if point[2]<.075 and n<.65:color=mix(base,(168,159,134),.17)
                elif n<.13:value-=.065
            elif ceramic:
                value=1+(coarse-.5)*.11+(n-.5)*.025
                if id in ('vessel-terra','vessel-deep','vessel-shallow') and .035<point[2]<.10 and n>.48:
                    color=mix(base,(178,162,126),.20 if coarse>.35 else .1)
                elif mat.startswith('enamel') and role in ('rim','basin-shell') and n>.92:
                    color=mix(base,(112,122,116),.19)
            else:
                value=1+(coarse-.5)*.09
                if 'gravel' in role:value=1+(n-.5)*.26
                if 'rubber' in mat:value=1+(coarse-.5)*.13
            # Modest stochastic rounding breaks regular transitions at the
            # unchanged physical pixel size; no fixed checkerboard or outlines.
            step=.035;v=value/step;value=(math.floor(v)+(1 if n<(v%1) else 0))*step
            color=shade(color,value)
            grid[i,j]=color
            if tuple(original[idx:idx+3])!=color or original[idx+3]!=255:changed[id]+=1
    # Extend the painted boundary into each chart's own one-pixel gutter.
    for j in range(-1,h+1):
        colors=[grid[min(max(i,0),w-1),min(max(j,0),h-1)] for i in range(-1,w+1)]
        i=0
        while i<len(colors):
            start=i;c=colors[i];i+=1
            while i<len(colors) and colors[i]==c:i+=1
            strokes.append({'color':hx(c),'points':[[x+start-1,y+j],[x+i-2,y+j]]})
        for i in range(-1,w+1):allowed[(y+j)*size+x+i]=1
plan={'size':size,'strokes':strokes}
(folder/'detail-pencil-strokes.json').write_text(json.dumps(plan,separators=(',',':')))

GD='''extends Node
func _ready():
 if "--object-detail" in OS.get_cmdline_user_args():Global.pixelorama_opened.connect(run_detail, CONNECT_ONE_SHOT)
func run_detail():
 var dir=""
 var check=false
 for arg in OS.get_cmdline_user_args():
  if arg.begins_with("--detail-dir="):dir=arg.trim_prefix("--detail-dir=")
  if arg=="--check-detail":check=true
 var p=Global.current_project
 if check:
  var result=p.frames[0].cels[0].get_image().save_png(dir.path_join("detail-reopened.png"))
  print("DETAIL REOPEN ",result)
  get_tree().quit(0 if result==OK else 3)
  return
 var record=JSON.parse_string(FileAccess.get_file_as_string(dir.path_join("detail-pencil-strokes.json")))
 assert(p.size==Vector2(record.size,record.size))
 p.current_layer=0;p.selected_cels=[Vector2i(0,0)]
 Tools.assign_tool("Pencil",MOUSE_BUTTON_LEFT)
 Tools.alpha_locked=false
 var pencil=Tools._slots[MOUSE_BUTTON_LEFT].tool_node
 pencil._brush_size=1;pencil._brush_density=100;pencil._strength=1.0;pencil._overwrite=true;pencil.update_brush()
 # One native undo transaction for the edit. Separate Pencil runs use the
 # same draw_tool/draw_fill_gap path as the interactive Pencil, without
 # copying the full 2048-square cel into undo history for every tiny run.
 var first=record.strokes[0]
 pencil.tool_slot.color=Color(first.color)
 pencil.draw_start(Vector2i(first.points[0][0],first.points[0][1]))
 for mark in record.strokes:
  pencil.tool_slot.color=Color(mark.color)
  pencil._drawer.reset()
  var from=Vector2i(mark.points[0][0],mark.points[0][1])
  pencil.draw_tool(from)
  for point in mark.points.slice(1):
   var to=Vector2i(point[0],point[1])
   pencil.draw_fill_gap(from,to)
   from=to
 pencil.draw_end(Vector2i(first.points[0][0],first.points[0][1]))
 p.set_meta("objectDetailRevision","2026-10-16-local")
 var saved=OpenSave.save_pxo_file(dir.path_join("detail-edited.pxo"),false,true,p)
 var result=p.frames[0].cels[0].get_image().save_png(dir.path_join("detail-edited.png"))
 print("DETAIL AUTHOR ",JSON.stringify({"saved":saved,"exported":result==OK,"pencilRuns":record.strokes.size()}))
 get_tree().quit(0 if saved and result==OK else 3)
'''
name='UmweltScopedObjectDetail'
config=Path.home()/'Library/Application Support/Pixelorama/config.ini';config_bytes=config.read_bytes()
extension=config.parent/'extensions'/(name+'.zip');assert not extension.exists()
scene='[gd_scene load_steps=2 format=3]\n[ext_resource type="Script" path="res://src/Extensions/'+name+'/Author.gd" id="1"]\n[node name="'+name+'" type="Node"]\nscript = ExtResource("1")\n'
info=dict(name=name,display_name='Scoped object detail Pencil edit',description='Incremental current source edit',author='五月七日',version='0.1',supported_api_versions=[8],license='MIT',nodes=['Author.tscn'])
with zipfile.ZipFile(extension,'w',zipfile.ZIP_DEFLATED) as z:
    for n,data in [('Author.gd',GD),('Author.tscn',scene),('extension.json',json.dumps(info))]:z.writestr('src/Extensions/'+name+'/'+n,data)
config.write_bytes(config_bytes+('\n[extensions]\n'+name+'=true\n').encode())
try:
    for check in (False,True):
        source=folder/'detail-edited.pxo' if check else backup/(family+'-atlas.pxo')
        cmd=['/Applications/Pixelorama.app/Contents/MacOS/Pixelorama','--headless','--',str(source),'--object-detail','--detail-dir='+str(folder)]
        if check:cmd.append('--check-detail')
        result=subprocess.run(cmd,capture_output=True,text=True,timeout=max(600,len(strokes)*.025))
        (folder/('detail-reopen.log' if check else 'detail-author.log')).write_text(result.stdout+result.stderr)
        print('\n'.join(l for l in result.stdout.splitlines() if 'DETAIL' in l),flush=True)
        assert result.returncode==0, result.stderr[-1500:]
finally:
    config.write_bytes(config_bytes);extension.unlink(missing_ok=True)

from PIL import Image
with zipfile.ZipFile(folder/'detail-edited.pxo') as z:edited=z.read('image_data/frames/1/layer_1')
for n in ('detail-edited.png','detail-reopened.png'):
    assert Image.open(folder/n).convert('RGBA').tobytes()==edited
for i,ok in enumerate(allowed):
    if not ok:assert original[i*4:i*4+4]==edited[i*4:i*4+4], 'Protected atlas pixel changed'
shutil.copy2(folder/'detail-edited.pxo',folder/(family+'-atlas.pxo'))
shutil.copy2(folder/'detail-edited.png',folder/'atlas.png')
shutil.copy2(folder/'atlas.png',ROOT.parents[1]/'assets/items'/(family+'-atlas.png'))
for n in ('detail-edited.pxo','detail-edited.png','detail-reopened.png'):(folder/n).unlink()
report={'software':'Pixelorama','tool':'Pencil','openedExistingSource':True,'independentlyReopened':True,
 'nativeCelEqualsExport':True,'protectedPixelsUnchanged':sum(1 for a in allowed if not a),'texelsPerMetre':16,
 'pencilRuns':len(strokes),'changedPixelsByItem':changed,'originalConfigRestored':config.read_bytes()==config_bytes}
report['revision']=args.revision
(HERE/(family+('-round'+str(args.revision) if args.revision>1 else '')+'-paint-check.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2))
(folder/'detail-pencil-strokes.json').unlink()
print('DETAIL VERIFIED',family,len(strokes),'Pencil runs',sum(changed.values()),'changed chart pixels',flush=True)
