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
 ('wood', '#897258', '#6f5c49', '#a58c6b'),
 ('wall_patch', '#b6b99e', '#9fa58e', '#ced0b7'),
]
base = Image.new('RGBA', (128,128))
marks = Image.new('RGBA', (128,128))
db, dm = ImageDraw.Draw(base), ImageDraw.Draw(marks)
for i, (name, ground, dark, light) in enumerate(PALETTES):
 x, y = (i%4)*32, (i//4)*32
 db.rectangle((x,y,x+31,y+31), fill=ground)
 # Deliberate, sparse strokes; only three paint values per material.
 if name == 'door':
  for xx in [6,15,24]:
   dm.rectangle((x+xx,y+2,x+xx,y+29),fill=dark)
   dm.rectangle((x+xx+1,y+3,x+xx+1,y+28),fill=light)
  for xx, yy, length in [(3,9,4),(19,20,6),(28,14,3)]:
   dm.line((x+xx,y+yy,x+xx,y+yy+length),fill=dark)
 elif name == 'paving':
  dm.rectangle((x,y,x+31,y+1),fill=dark)
  dm.rectangle((x,y,x+1,y+31),fill=dark)
  dm.line((x+2,y+2,x+29,y+2),fill=light)
  for xx,yy in [(8,11),(19,22),(23,7)]: dm.rectangle((x+xx,y+yy,x+xx+2,y+yy),fill=dark)
 elif name in ('iron','iron_edge','brass'):
  for xx,yy,w in [(4,6,4),(20,23,5),(11,17,2)]:
   dm.rectangle((x+xx,y+yy,x+xx+w,y+yy),fill=light)
  dm.rectangle((x+18,y+10,x+19,y+11),fill=dark)
 elif name == 'leaf':
  dm.line((x+15,y+3,x+15,y+28),fill=dark)
  for yy in [9,16,23]: dm.line((x+16,y+yy,x+22,y+yy-3),fill=light)
 elif name == 'lamp_glass':
  dm.rectangle((x+3,y+3,x+6,y+27),fill=light)
  dm.rectangle((x+28,y+1,x+30,y+30),fill=dark)
 elif name == 'roof_clay':
  for yy in [8,20]:
   dm.line((x+1,y+yy,x+30,y+yy),fill=dark)
   dm.line((x+2,y+yy+1,x+29,y+yy+1),fill=light)
 else:
  for xx,yy,w,h,col in [(4,5,5,1,light),(21,9,3,2,dark),(10,18,4,1,light),(25,26,2,1,dark),(5,28,1,1,dark)]:
   dm.rectangle((x+xx,y+yy,x+xx+w-1,y+yy+h-1),fill=col)
base.save(ROOT/'atlas-base.png')
marks.save(ROOT/'atlas-strokes.png')
Image.alpha_composite(base,marks).save(OUT/'garden-atlas.png',optimize=True)
def png(im):
 b=BytesIO(); im.save(b,format='PNG'); return b.getvalue()
with zipfile.ZipFile(ROOT/'garden-atlas.ora','w') as z:
 z.writestr('mimetype','image/openraster',compress_type=zipfile.ZIP_STORED)
 z.writestr('stack.xml','<image w="128" h="128" name="Garden atlas"><stack><layer name="Pixel strokes" x="0" y="0" src="data/strokes.png" opacity="1.0" visibility="visible" composite-op="svg:src-over"/><layer name="Material base" x="0" y="0" src="data/base.png" opacity="1.0" visibility="visible" composite-op="svg:src-over"/></stack></image>')
 z.writestr('data/strokes.png',png(marks)); z.writestr('data/base.png',png(base))
 z.writestr('mergedimage.png',png(Image.alpha_composite(base,marks)))
 z.writestr('Thumbnails/thumbnail.png',png(Image.alpha_composite(base,marks)))
(ROOT/'palette.txt').write_text('\n'.join(f'{i:02d} {n}: {a} {b} {c}' for i,(n,a,b,c) in enumerate(PALETTES))+'\n')
# Native Pixelorama v6 container. Open and export this file in actual Pixelorama.
data={'pixelorama_version':'v1.2.3-stable','pxo_version':6,'size_x':128,'size_y':128,'color_mode':5,
 'layers':[{'name':name,'visible':True,'locked':False,'blend_mode':0,'parent':-1,'opacity':1,'type':0,'new_cels_linked':False,'metadata':{}} for name in ['Material base','Pixel strokes']],
 'frames':[{'cels':[{'opacity':1,'z_index':0,'metadata':{}} for _ in range(2)],'duration':1,'metadata':{}}],
 'current_frame':0,'current_layer':1,'fps':1,'tags':[],'guides':[],'brushes':[],'palettes':[],'reference_images':[],'tilesets':[],'metadata':{},
 'user_data':'Explicit hand-designed pixel coordinates. 16 material tiles, 3 values each. No generated imagery or random texture noise.'}
with zipfile.ZipFile(ROOT/'garden-atlas.pxo','w',compression=zipfile.ZIP_DEFLATED) as z:
 z.writestr('data.json',json.dumps(data));z.writestr('mimetype','application/x-pixelorama')
 z.writestr('preview.png',png(Image.alpha_composite(base,marks)))
 for i,im in enumerate([base,marks],1):z.writestr(f'image_data/frames/1/layer_{i}',im.tobytes())
print(OUT/'garden-atlas.png')
