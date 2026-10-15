"""Open the existing Pixelorama source and repaint only selected native charts."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
shared=HERE.parent/'rooftop-furniture-02/paint-native.py'
source=shared.read_text().replace('ROOT=Path(__file__).resolve().parent','ROOT=Path('+repr(str(HERE))+')').replace("NAME='UmweltFurnitureAuthor02'","NAME='UmweltTerraceRevision03'")
selection='revision-five-fields.json' if '--five' in sys.argv else ('revision-four-fields.json' if '--four' in sys.argv else ('revision-touchup-fields.json' if '--touchup' in sys.argv else 'revision-paint-fields.json'))
source=source.replace('EXTRA_PATTERN=None',"SELECTED=set(json.loads((HERE/"+repr(selection)+").read_text()))\nLAYOUT['fields']=[f for f in LAYOUT['fields'] if f['id'] in SELECTED]\nEXTRA_PATTERN=None",1)
source=source.replace(' OpenSave.open_image_as_new_tab("atlas.png",Image.create(size,size,false,Image.FORMAT_RGBA8))',' # Edit the already opened native project; preserve every unselected chart.')
source=source.replace("if check:args += [str(HERE/'atlas.pxo'),'--check-source']","if check:args += [str(HERE/'atlas.pxo'),'--check-source']\n  else:args += [str(HERE/'atlas.pxo')]")
source=source.replace("assert not (HERE/'atlas.pxo').exists(),'Source already exists; preserve revision before editing'","assert (HERE/'atlas.pxo').exists(),'Open the existing native source for local revision'")
source=source.replace('p.name="furniture-atlas"','p.name="terrace-materials"')
source=source.replace("fields=len(LAYOUT['fields'])","fields=len(json.loads((HERE/'texture-layout.json').read_text())['fields']),repaintedFields=len(LAYOUT['fields'])")
sys.argv=[str(shared),'terraces']+sys.argv[1:]
exec(compile(source,str(shared),'exec'),{'__file__':str(shared),'__name__':'__main__'})
