"""Export authored Blender layers with a shared photographic pixel finish."""
from PIL import Image
from pathlib import Path
import json,shutil,sys
NAMES=['cabin','snake-normal','snake-curious','snake-away','snake-tongue']

source=Path(__file__).resolve().parent
if '--refresh-background' in sys.argv:
 from finish_background import refresh_background
 refresh_background(source)
runtime=source.parents[2]/'ophidia'/'assets';runtime.mkdir(parents=True,exist_ok=True)
if (source/'renders/snake-normal-receivers.png').exists():
 from compose_contact_shadows import compose
 compose(source)
sharp=Image.open(source/'renders'/'snake-normal.png').size==(720,1280)
if sharp:
 from portrait_finish import process_portraits
 background,portraits,frames,style=process_portraits(source)
 layers=[background,*portraits]
 raw_background=Image.open(source/'renders/cabin.png').convert('RGBA')
 raw_character=Image.open(source/'renders/snake-normal.png').convert('RGBA').resize((360,640),Image.Resampling.LANCZOS)
 Image.alpha_composite(raw_background,raw_character).save(source/'renders/source-preview.png')
else:
 raise ValueError('Expected current 720x1280 native character passes')
report=[]
for name,im in zip(NAMES,layers):
 target=runtime/(name+'.webp')
 if sharp and name=='cabin':pass
 else:im.save(target,format='WEBP',lossless=True,method=6)
 report.append({'file':str(target.relative_to(source.parents[2])),'bytes':target.stat().st_size,'width':360,'height':640})
frames[0].save(source/'renders'/'game-composite.png')
sheet=Image.new('RGB',(360*4,640),(30,24,20))
for i,frame in enumerate(frames):sheet.paste(frame,(i*360,0))
sheet.save(source/'renders'/'pose-sheet.png')
(source/'asset-sizes.json').write_text(json.dumps(report,indent=2)+'\n')
(source/'pixel-style-report.json').write_text(json.dumps({'selected':'two-pixel-diffusion',**style,'source':'native Blender render layers','all_four_poses_share_palette':True,'all_layers_exported':True,'layers':report},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'style':style,'layers':report,'total_bytes':sum(item['bytes'] for item in report)},indent=2))
