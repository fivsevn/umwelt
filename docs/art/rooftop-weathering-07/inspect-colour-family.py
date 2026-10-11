"""Read native-export PNG pigments without drawing or changing any image."""
from collections import Counter
from pathlib import Path
import json
import runpy
from PIL import Image

HERE=Path(__file__).resolve().parent
PLAN=runpy.run_path(str(HERE/'material-pencil-plan.py'))


def inspect():
    with Image.open(HERE/'terrace-book.png') as source:
        image=source.convert('RGB')
    fields={}
    for name,(x,y,w,h) in PLAN['RECTS'].items():
        counts=Counter(image.crop((x,y,x+w,y+h)).get_flattened_data())
        palette=[tuple(bytes.fromhex(c[1:])) for c in PLAN['PALETTES'][name]]
        assert set(counts)<=set(palette), 'Native material must only use its twelve planned pigments'
        total=w*h
        groups={'base':[0],'nearFourAndEight':[1,2,3,4],'midTwelveAndSixteen':[5,6,7,8],
                'rareFissureMineralAndWarmMortar':[9,10,11]}
        fields[name]={
            'nativeColorsUsed':len(counts),
            'percentByRole':{role:round(sum(counts[palette[i]] for i in indices)/total*100,3)
                             for role,indices in groups.items()},
            'palettePercent':{color:round(counts[pigment]/total*100,3)
                              for color,pigment in zip(PLAN['PALETTES'][name],palette)},
        }
    report={'source':'terrace-book.png','readOnly':True,
            'note':'Pigment families describe the painted material; they are not style acceptance scores.',
            'materials':fields}
    (HERE/'colour-family-readback.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({name:field['percentByRole'] for name,field in fields.items()},indent=2))


if __name__=='__main__':inspect()
