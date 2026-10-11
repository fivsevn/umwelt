"""Read actual Pixelorama export for coverage; never draw or save any bitmap."""
from pathlib import Path
from collections import Counter
import json
import runpy
from PIL import Image

HERE=Path(__file__).resolve().parent
plan=runpy.run_path(str(HERE/'material-pencil-plan.py'))
report={}
with Image.open(HERE/'terrace-book.png') as source:
    image=source.convert('RGB')
    for field,(x,y,w,h) in plan['RECTS'].items():
        pigment=plan['PALETTES'][field]
        base=tuple(bytes.fromhex(pigment[0][1:]))
        histogram=Counter(image.crop((x,y,x+w,y+h)).getdata())
        amount=w*h
        base_count=histogram[base]
        coverage=(amount-base_count)/amount
        report[field]={
            'sourceDimensions':[w,h],
            'nativePaletteColors':len(histogram),
            'palette':pigment,
            'basePixels':base_count,
            'nonBasePixels':amount-base_count,
            'basePercent':round(100-coverage*100,2),
            'nonBaseCoveragePercent':round(coverage*100,2),
            'colorPixels':{'#'+bytes(color).hex():count for color,count in histogram.items()},
            'within20to35Percent':.20<=coverage<=.35,
        }
(HERE/'pigment-coverage.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({key:{'coveragePercent':value['nonBaseCoveragePercent'],'colors':value['nativePaletteColors'],'targetPassed':value['within20to35Percent']} for key,value in report.items()}))
assert all(v['nativePaletteColors']==6 for v in report.values()),'Every material uses its six deliberate colours'
assert all(v['within20to35Percent'] for v in report.values()),'Actual PNG pigment coverage must be 20–35%'
