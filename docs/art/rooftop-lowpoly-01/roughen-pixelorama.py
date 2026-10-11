"""Second native pass after the user approved the 4186 rack reference.

Keep the same one-pixel metric. Read the saved first pass; Pixelorama groups
pigments and draws small connected chips within existing worn boundaries.
"""
from collections import Counter
from pathlib import Path
from random import Random
import hashlib
import json
import runpy
import shutil
import sys
import zipfile

HERE=Path(__file__).resolve().parent
FIRST=runpy.run_path(str(HERE/'paint-pixelorama.py'))
FIELDS=FIRST['FIELDS']


def prepare():
    if (HERE/'pixelorama-pass02-authoring.json').exists() and '--replay-from-pass01' not in sys.argv:
        raise SystemExit('Saved second pass exists. Protect hand edits; explicit --replay-from-pass01 is required.')
    for name in ('terrace-book.pxo','terrace-book.png','palette-pencil-plan.json','pixelorama-authoring.json'):
        snapshot=HERE/('pass01-'+name)
        if not snapshot.exists():
            shutil.copyfile(HERE/name,snapshot)
    shutil.copyfile(HERE/'pass01-terrace-book.pxo',HERE/'terrace-book.pxo')
    with zipfile.ZipFile(HERE/'pass01-terrace-book.pxo') as archive:
        source=archive.read('image_data/frames/1/layer_1')
    rgb,hexcolor=FIRST['rgb'],FIRST['hexcolor']
    rng=Random(57101202)
    fields,strokes=[],[]
    for index,(field,rect) in enumerate(FIELDS.items()):
        x,y,w,h=rect
        def pigment(px,py):
            start=(py*1024+px)*4
            return source[start:start+4]
        counts=Counter(pigment(px,py) for py in range(y,y+h) for px in range(x,x+w))
        base=rgb(counts.most_common(1)[0][0])
        slots=8 if index<6 or 'roof' in field else min(8,len(counts))
        if len(counts)>slots:
            mapping=FIRST['roof_palette'](counts,slots)
        else:
            mapping={hexcolor(c):hexcolor(rgb(c)) for c in counts}
        colors=sorted({bytes.fromhex(c) for c in mapping.values()},key=sum)
        fields.append({'name':field,'rect':rect,'palette':mapping,'beforeColors':len(counts),'afterColors':len(colors)})
        if index>=8:
            continue
        candidates=[]
        for py in range(y+2,y+h-2):
            for px in range(x+2,x+w-2):
                c=pigment(px,py)
                delta=max(abs(a-b) for a,b in zip(rgb(c),base))
                if 7<=delta<=32 and (c!=pigment(px-1,py) or c!=pigment(px,py-1)):
                    candidates.append((px,py,c))
        rng.shuffle(candidates)
        chosen=[]
        for px,py,c in candidates:
            if any(abs(px-a)+abs(py-b)<5 for a,b in chosen):
                continue
            mapped=bytes.fromhex(mapping[hexcolor(c)])
            below=sum(rgb(c))<sum(base)
            alternatives=[tone for tone in colors if (sum(tone)<sum(mapped) if below else sum(tone)>sum(mapped)) and 4<=max(abs(a-b) for a,b in zip(tone,mapped))<=18]
            if not alternatives:
                continue
            tone=min(alternatives,key=lambda color:sum((a-b)**2 for a,b in zip(color,mapped)))
            chosen.append((px,py))
            points=[[px,py]]
            dx,dy=rng.choice([(1,0),(0,1),(1,1),(-1,1)])
            # Connect two existing worn pixels occasionally, never paint past
            # the underlying photo-led patch footprint or widen a crack.
            if index<6 and rng.random()<.60 and pigment(px+dx,py+dy)==c:
                points.append([px+dx,py+dy])
            if len(points)==1:points.append(points[0][:])
            strokes.append({'color':'#'+hexcolor(tone),'points':points})
            if len(chosen)>=(110 if index<6 else 70):break
    record={'fields':fields,'strokes':strokes,'brush':1,'texelsPerMetre':16,'sourcePxoSha256':hashlib.sha256((HERE/'pass01-terrace-book.pxo').read_bytes()).hexdigest(),'reference':'http://127.0.0.1:4186/','referenceDensity':16,'method':'Limited pigment groups, connected two-texel chips within existing material wear'}
    (HERE/'palette-pencil-plan.json').write_text(json.dumps(record,indent=2)+'\n')
    return record


if __name__=='__main__':
    record=prepare()
    gd=FIRST['GD'].replace('--rooftop-lowpoly-paint','--rooftop-lowpoly-rougher').replace('pixelorama-authoring.json','pixelorama-pass02-authoring.json').replace('Native cel pigment regrouping','Native limited pigment groups and connected mineral chips').replace('var point=Vector2i(mark.points[0][0],mark.points[0][1])\n  pencil.draw_start(point)\n  pencil.draw_end(point)','var point=Vector2i(mark.points[0][0],mark.points[0][1])\n  pencil.draw_start(point)\n  for p in mark.points.slice(1):pencil.draw_move(Vector2i(p[0],p[1]))\n  pencil.draw_end(Vector2i(mark.points[-1][0],mark.points[-1][1]))')
    FIRST['run_native'](gd,'--rooftop-lowpoly-rougher','RooftopRougherPaint')
    report=json.loads((HERE/'pixelorama-pass02-authoring.json').read_text())
    report['source']='rooftop-lowpoly-01/pass01-terrace-book.pxo'
    report['reference']='http://127.0.0.1:4186/'
    report['allNativePencilStrokes']=760+len(record['strokes'])
    (HERE/'pixelorama-authoring.json').write_text(json.dumps(report,indent=2)+'\n')
    print('Second pass native fields:',len(record['fields']),'Connected 1px strokes:',len(record['strokes']))
