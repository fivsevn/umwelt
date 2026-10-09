"""Explicit pixel strokes for a 128px atlas; import the layered ORA in Pixelorama.
No photographs, noise filters, gradients, or image generation are used.
Run with Python + Pillow. Pixelorama is used for final edits and native PXO saving.
"""
from pathlib import Path
from PIL import Image, ImageDraw
from io import BytesIO
import zipfile
import json

ROOT = Path(__file__).resolve().parent
OUT = ROOT.parents[2] / 'rooftop/previews/pixel-01/assets'
OUT.mkdir(parents=True, exist_ok=True)
PALETTES = [
 ('terracotta', '#b87958', '#9c624a', '#cf9770'),
 ('rim', '#cc956f', '#b57a58', '#dfac81'),
 ('iron', '#343c3a', '#262e2d', '#4d5850'),
 ('iron_edge', '#526157', '#39483f', '#748072'),
 ('plaster', '#c4c6aa', '#adb298', '#d7d8be'),
 ('door', '#738b7d', '#5b7367', '#91a291'),
 ('paving', '#b8afa0', '#a09688', '#cfc6b5'),
 ('stone_trim', '#d5c9af', '#beb197', '#e7dcc4'),
 ('soil', '#605446', '#4c433a', '#80705a'),
 ('leaf', '#6e8c60', '#4f7050', '#91ab74'),
 ('lamp_glass', '#d5b977', '#b49556', '#f0d996'),
 ('roof_clay', '#a1755d', '#865b4a', '#ba8c6c'),
 ('foundation', '#8d998d', '#768476', '#a6af9e'),
 ('brass', '#b9a273', '#958453', '#d5bf87'),
 ('panel_variant', '#738b7d', '#5b7367', '#91a291'),
 ('wall_patch', '#c4c6aa', '#adb298', '#d7d8be'),
]
base = Image.new('RGBA', (128,128))
marks = Image.new('RGBA', (128,128))
wear = Image.new('RGBA', (128,128))
db, dm = ImageDraw.Draw(base), ImageDraw.Draw(marks)
dw = ImageDraw.Draw(wear)
def patch(tile,points,color):
 """Authored stair-step silhouettes, kept inside each 32px material tile."""
 x,y=(tile%4)*32,(tile//4)*32
 dw.polygon([(x+a,y+b) for a,b in points],fill=color)
def chips(tile,rectangles,color):
 x,y=(tile%4)*32,(tile//4)*32
 for a,b,c,d in rectangles:dw.rectangle((x+a,y+b,x+c,y+d),fill=color)
for i, (name, ground, dark, light) in enumerate(PALETTES):
 x, y = (i%4)*32, (i//4)*32
 db.rectangle((x,y,x+31,y+31), fill=ground)
 # Structure and edge strokes remain separate from the editable weathering layer.
 if name == 'terracotta':
  # Kiln marks follow the vessel circumference; bottom wear stays at the foot.
  dm.rectangle((x+1,y+26,x+30,y+30),fill=dark)
  for xx,yy,w,h,col in [(2,5,6,2,light),(8,6,3,1,light),(19,4,5,1,light),
                       (22,5,3,2,light),(12,17,3,2,dark),(14,19,2,1,dark),
                       (26,21,3,1,light),(4,27,4,1,ground)]:
   dm.rectangle((x+xx,y+yy,x+xx+w-1,y+yy+h-1),fill=col)
 elif name == 'rim':
  dm.rectangle((x+1,y+25,x+30,y+30),fill=dark)
  for xx,w in [(1,7),(11,4),(18,8)]:dm.rectangle((x+xx,y+5,x+xx+w-1,y+6),fill=light)
  for xx,yy,w in [(8,7,2),(25,9,3),(15,18,2)]:dm.rectangle((x+xx,y+yy,x+xx+w-1,y+yy+1),fill=dark)
 elif name in ('door','panel_variant'):
  # Broad panel field with a broken 1px recess; sparse grain instead of slats.
  dm.line((x+2,y+2,x+16,y+2),fill=dark)
  dm.line((x+2,y+2,x+2,y+27),fill=dark)
  dm.line((x+4,y+28,x+29,y+28),fill=light)
  dm.line((x+29,y+4,x+29,y+27),fill=light)
  grain=[(8,8,6,dark),(9,10,3,light),(15,19,5,dark),(23,4,4,light),(24,18,7,dark),(6,23,3,light)] if name=='door' else [(6,4,5,dark),(7,7,3,light),(18,13,8,dark),(26,5,3,light),(11,22,4,dark)]
  for xx,yy,length,col in grain:
   dm.line((x+xx,y+yy,x+xx,y+yy+length),fill=col)
 elif name == 'paving':
  dm.rectangle((x,y,x+31,y+1),fill=dark)
  dm.rectangle((x,y,x+1,y+31),fill=dark)
  dm.line((x+2,y+2,x+29,y+2),fill=light)
  for xx,yy in [(8,11),(19,22),(23,7)]: dm.rectangle((x+xx,y+yy,x+xx+2,y+yy),fill=dark)
 elif name == 'iron':
  # Long faces use narrow strips, so paint follows each bar rather than stretching.
  for xx,yy,h,col in [(2,2,11,light),(2,20,8,light),(3,6,4,light),
                      (5,15,5,dark),(13,3,5,dark),(16,22,5,light)]:
   dm.rectangle((x+xx,y+yy,x+xx,y+yy+h-1),fill=col)
 elif name in ('iron_edge','brass'):
  dm.line((x+2,y+3,x+2,y+24),fill=light)
  dm.line((x+3,y+3,x+14,y+3),fill=light)
  for xx,yy,w in [(12,18,3),(21,25,4)]:dm.rectangle((x+xx,y+yy,x+xx+w-1,y+yy),fill=dark)
 elif name in ('plaster','wall_patch'):
  # Broad accumulated dirt, faded plaster, short drips and isolated edge chips.
  # The base hue is unchanged; five nearby values show age without a noise filter.
  middle,deep='#b6b99e','#9fa58e'
  if name=='plaster':
   patch(i,[(1,1),(30,1),(30,4),(26,4),(26,6),(23,6),(23,4),(18,4),
            (18,8),(16,8),(16,5),(11,5),(11,3),(5,3),(5,5),(1,5)],dark)
   patch(i,[(1,25),(5,25),(5,23),(8,23),(8,26),(13,26),(13,24),(17,24),
            (17,22),(20,22),(20,25),(24,25),(24,21),(27,21),(27,24),
            (30,24),(30,30),(1,30)],middle)
   patch(i,[(1,28),(4,28),(4,26),(7,26),(7,28),(11,28),(11,30),(1,30)],deep)
   patch(i,[(17,27),(20,27),(20,25),(23,25),(23,28),(27,28),(27,26),
            (30,26),(30,30),(17,30)],dark)
   patch(i,[(3,9),(7,9),(7,7),(11,7),(11,10),(14,10),(14,15),(12,15),
            (12,17),(7,17),(7,15),(4,15),(4,12),(3,12)],light)
   patch(i,[(21,11),(24,11),(24,9),(28,9),(28,15),(26,15),(26,18),
            (23,18),(23,15),(21,15)],middle)
   chips(i,[(15,10,15,14),(16,13,16,16),(28,5,29,10)],dark)
   chips(i,[(2,19,3,20),(5,18,5,18),(14,22,15,22),(25,19,26,20)],light)
   chips(i,[(6,8,6,8),(12,17,13,17),(18,23,19,23),(27,25,27,26)],dark)
  else:
   patch(i,[(1,1),(30,1),(30,3),(24,3),(24,6),(21,6),(21,4),(14,4),
            (14,7),(12,7),(12,3),(6,3),(6,4),(1,4)],dark)
   patch(i,[(1,24),(4,24),(4,21),(7,21),(7,24),(12,24),(12,26),
            (18,26),(18,23),(22,23),(22,25),(25,25),(25,22),
            (30,22),(30,30),(1,30)],middle)
   patch(i,[(2,29),(2,27),(6,27),(6,25),(8,25),(8,27),(14,27),(14,29),
            (19,29),(19,27),(23,27),(23,26),(27,26),(27,28),(30,28),
            (30,30),(2,30)],dark)
   chips(i,[(1,29,6,30),(26,29,30,30),(5,26,6,27),(27,27,29,27)],deep)
   patch(i,[(16,9),(20,9),(20,7),(25,7),(25,10),(28,10),(28,14),
            (24,14),(24,17),(21,17),(21,15),(17,15),(17,12),(16,12)],light)
   patch(i,[(3,10),(6,10),(6,8),(9,8),(9,13),(7,13),(7,17),(4,17),
            (4,14),(3,14)],middle)
   chips(i,[(10,6,10,9),(11,8,11,12),(28,16,29,20)],dark)
   chips(i,[(13,20,15,21),(23,18,24,18),(2,18,2,19),(9,23,10,23)],light)
   chips(i,[(16,11,16,11),(25,8,26,8),(18,24,19,24)],dark)
 elif name == 'stone_trim':
  dm.line((x+2,y+2,x+27,y+2),fill=light)
  dm.line((x+2,y+3,x+2,y+26),fill=light)
  for xx,yy,w,h,col in [(1,10,6,1,dark),(1,21,7,1,dark),(7,11,2,1,light),
                       (19,7,3,1,dark),(25,24,4,2,dark),(26,26,2,1,light)]:
   dm.rectangle((x+xx,y+yy,x+xx+w-1,y+yy+h-1),fill=col)
 elif name == 'leaf':
  dm.line((x+15,y+3,x+15,y+28),fill=dark)
  for yy in [9,16,23]: dm.line((x+16,y+yy,x+22,y+yy-3),fill=light)
 elif name == 'lamp_glass':
  dm.rectangle((x+3,y+3,x+6,y+27),fill=light)
  dm.rectangle((x+28,y+1,x+30,y+30),fill=dark)
 elif name == 'roof_clay':
  for yy in [10,22]:
   dm.line((x+1,y+yy,x+30,y+yy),fill=dark)
   dm.line((x+2,y+yy+1,x+17,y+yy+1),fill=light)
  for xx,yy,h in [(7,1,9),(21,12,10),(10,24,6)]:dm.line((x+xx,y+yy,x+xx,y+yy+h),fill=dark)
  for xx,yy,w in [(3,5,3),(13,17,6),(25,27,3)]:dm.line((x+xx,y+yy,x+xx+w,y+yy),fill=light)
 else:
  for xx,yy,w,h,col in [(4,5,5,1,light),(21,9,3,2,dark),(10,18,4,1,light),(25,26,2,1,dark),(5,28,1,1,dark)]:
   dm.rectangle((x+xx,y+yy,x+xx+w-1,y+yy+h-1),fill=col)
 # Smaller supporting wear keeps the wall as the main change.
 if name=='terracotta':
  patch(i,[(2,22),(6,22),(6,20),(8,20),(8,24),(12,24),(12,27),(2,27)],dark)
  patch(i,[(19,7),(24,7),(24,9),(27,9),(27,11),(23,11),(23,10),(19,10)],light)
  chips(i,[(11,12,13,13),(12,14,15,14),(27,23,29,24),(3,16,4,16)],dark)
 elif name=='rim':
  patch(i,[(1,5),(6,5),(6,7),(9,7),(9,8),(5,8),(5,7),(1,7)],light)
  chips(i,[(7,12,9,13),(8,14,10,14),(23,6,24,8),(15,26,17,27)],dark)
 elif name=='door':
  patch(i,[(3,22),(5,22),(5,24),(8,24),(8,26),(11,26),(11,28),(3,28)],dark)
  patch(i,[(22,14),(25,14),(25,17),(27,17),(27,22),(25,22),(25,20),(22,20)],dark)
  patch(i,[(11,4),(15,4),(15,6),(17,6),(17,10),(15,10),(15,8),(11,8)],light)
  chips(i,[(4,24,5,25),(7,27,9,27),(24,17,24,19),(27,25,28,26)],'#b6b99e')
 elif name=='panel_variant':
  patch(i,[(17,22),(21,22),(21,24),(25,24),(25,27),(28,27),(28,28),
           (19,28),(19,26),(17,26)],dark)
  patch(i,[(5,9),(8,9),(8,12),(10,12),(10,16),(7,16),(7,13),(5,13)],dark)
  patch(i,[(14,6),(18,6),(18,8),(22,8),(22,10),(17,10),(17,9),(14,9)],light)
  chips(i,[(18,24,19,25),(25,27,27,27),(6,12,6,14),(9,17,10,18)],'#b6b99e')
 elif name=='stone_trim':
  patch(i,[(1,25),(5,25),(5,23),(7,23),(7,27),(11,27),(11,30),(1,30)],dark)
  chips(i,[(2,26,4,27),(6,29,8,30),(23,23,26,24),(25,25,27,25)],'#9fa58e')
 elif name=='iron_edge':
  chips(i,[(4,25,5,27),(6,26,7,27),(25,6,27,7)],'#897258')
 elif name=='roof_clay':
  patch(i,[(11,13),(17,13),(17,15),(20,15),(20,18),(15,18),(15,17),(11,17)],dark)
  chips(i,[(4,25,6,26),(5,27,8,27),(26,5,28,6)],light)
 elif name=='paving':
  patch(i,[(5,23),(7,23),(7,21),(9,21),(9,25),(11,25),(11,26),(7,26),
           (7,25),(5,25)],dark)
  chips(i,[(5,4,7,4),(7,5,9,5),(24,15,26,15),(25,16,27,16)],light)
base.save(ROOT/'atlas-base.png')
marks.save(ROOT/'atlas-strokes.png')
wear.save(ROOT/'atlas-weathering.png')
merged=Image.alpha_composite(Image.alpha_composite(base,marks),wear)
merged.save(OUT/'garden-atlas.png',optimize=True)
def png(im):
 b=BytesIO(); im.save(b,format='PNG'); return b.getvalue()
with zipfile.ZipFile(ROOT/'garden-atlas.ora','w') as z:
 z.writestr('mimetype','image/openraster',compress_type=zipfile.ZIP_STORED)
 z.writestr('stack.xml','<image w="128" h="128" name="Garden atlas"><stack><layer name="Weathering patches" x="0" y="0" src="data/weathering.png" opacity="1.0" visibility="visible" composite-op="svg:src-over"/><layer name="Pixel strokes" x="0" y="0" src="data/strokes.png" opacity="1.0" visibility="visible" composite-op="svg:src-over"/><layer name="Material base" x="0" y="0" src="data/base.png" opacity="1.0" visibility="visible" composite-op="svg:src-over"/></stack></image>')
 z.writestr('data/strokes.png',png(marks)); z.writestr('data/base.png',png(base))
 z.writestr('data/weathering.png',png(wear))
 z.writestr('mergedimage.png',png(merged))
 z.writestr('Thumbnails/thumbnail.png',png(merged))
(ROOT/'palette.txt').write_text('\n'.join(f'{i:02d} {n}: {a} {b} {c}' for i,(n,a,b,c) in enumerate(PALETTES))+'\nWeathering extras: #b6b99e #9fa58e #897258\n')
# Native Pixelorama v6 container. Open and export this file in actual Pixelorama.
data={'pixelorama_version':'v1.2.3-stable','pxo_version':6,'size_x':128,'size_y':128,'color_mode':5,
 'layers':[{'name':name,'visible':True,'locked':False,'blend_mode':0,'parent':-1,'opacity':1,'type':0,'new_cels_linked':False,'metadata':{}} for name in ['Material base','Pixel strokes','Weathering patches']],
 'frames':[{'cels':[{'opacity':1,'z_index':0,'metadata':{}} for _ in range(3)],'duration':1,'metadata':{}}],
 'current_frame':0,'current_layer':2,'fps':1,'tags':[],'guides':[],'brushes':[],'palettes':[],'reference_images':[],'tilesets':[],'metadata':{},
 'user_data':'Explicit authored pixel coordinates. 16 material tiles; aged plaster uses 5 nearby values. Editable weathering layer. No generated imagery or random texture noise.'}
with zipfile.ZipFile(ROOT/'garden-atlas.pxo','w',compression=zipfile.ZIP_DEFLATED) as z:
 z.writestr('data.json',json.dumps(data));z.writestr('mimetype','application/x-pixelorama')
 z.writestr('preview.png',png(merged))
 for i,im in enumerate([base,marks,wear],1):z.writestr(f'image_data/frames/1/layer_{i}',im.tobytes())
print(OUT/'garden-atlas.png')
