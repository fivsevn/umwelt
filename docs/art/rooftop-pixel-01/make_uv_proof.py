"""Vector overlay of saved Blender UV coordinates on the native Pixelorama PNG.
Does not create or edit raster art. Read the saved facet-source-check.json.
"""
from pathlib import Path
import json,base64
ROOT=Path(__file__).resolve().parent
ASSETS=ROOT.parents[2]/'rooftop/previews/pixel-01/assets'
data=json.loads((ROOT/'facet-source-check.json').read_text())
png=base64.b64encode((ASSETS/'garden-atlas.png').read_bytes()).decode()
chosen=[]
for name,label in [('Wall / left plaster pier','墙面展开'),('Terracotta / tapered vessel','陶盆斜面展开'),('Lamp / pitched cap','灯罩斜面展开')]:
 values=[x for x in data['uv_examples'] if x['object']==name]
 assert values,name
 # Broadest face is the most useful view, excluding tiny bevel faces.
 chosen.append((max(values,key=lambda p:abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(p['local_pixels'],p['local_pixels'][1:]+p['local_pixels'][:1])))),label))
svg=['<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1060" height="440" viewBox="0 0 1060 440">',
 '<rect width="1060" height="440" fill="#eae5db"/>',
 '<style>text{font-family:Arial,"PingFang SC",sans-serif;fill:#334039;font-size:17px}.small{font-size:14px}</style>',
 '<text x="20" y="29">同一张原生贴图 · 每格 1 像素 · 展开后每格代表 0.125 米</text>',
 '<defs><image id="native" width="1280" height="1280" image-rendering="pixelated" xlink:href="data:image/png;base64,'+png+'"/>']
for i in range(3):svg.append(f'<clipPath id="cell{i}"><rect width="320" height="320"/></clipPath>')
svg.append('</defs>')
for i,(entry,label) in enumerate(chosen):
 tile=entry['tile'];x=20+350*i
 svg.append(f'<text x="{x}" y="60">{label}</text><g transform="translate({x},75)">')
 svg.append(f'<g clip-path="url(#cell{i})"><use xlink:href="#native" x="{-(tile%4)*320}" y="{-(tile//4)*320}"/></g>')
 for n in range(33):
  svg.append(f'<path d="M {n*10} 0 V 320 M 0 {n*10} H 320" fill="none" stroke="#283b34" stroke-opacity=".18" stroke-width=".5"/>')
 points=' '.join(f'{u*10:.4f},{(32-v)*10:.4f}' for u,v in entry['local_pixels'])
 svg.append(f'<polygon points="{points}" fill="#fff" fill-opacity=".08" stroke="#f2cb77" stroke-width="2"/>')
 svg.append('<rect width="320" height="320" fill="none" stroke="#334039"/><text class="small" x="0" y="347">32×32 原生材质；黄线为实际贴面边界</text></g>')
svg.append('</svg>')
(ROOT/'review/unfolded-grid.svg').write_text('\n'.join(svg)+'\n')
print('Saved source UV overlay; native PNG unchanged.')
