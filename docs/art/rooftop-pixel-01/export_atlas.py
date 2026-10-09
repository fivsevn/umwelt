"""Export an edited native PXO with installed Pixelorama, preserving editable layers."""
from pathlib import Path
from tempfile import TemporaryDirectory
import subprocess, shutil, json, hashlib, zipfile, copy
from PIL import Image
import argparse
parser=argparse.ArgumentParser()
parser.add_argument('--pixelorama',default='/Applications/Pixelorama.app/Contents/MacOS/Pixelorama')
args=parser.parse_args()
ROOT=Path(__file__).resolve().parent
TARGET=ROOT.parents[2]/'rooftop/previews/pixel-01/assets/garden-atlas.png'
source=ROOT/'garden-atlas.pxo'
with zipfile.ZipFile(source) as archive:
 members={name:archive.read(name) for name in archive.namelist()}
data=json.loads(members['data.json'])
dimensions=(data['size_x'],data['size_y'])
def export(project,directory):
 result=subprocess.run([args.pixelorama,'--headless','--quit','--','--export','--output',str(directory/'export.png'),str(project)],capture_output=True,text=True,check=True)
 exported=directory/(project.stem+'.png')
 if not exported.exists():raise RuntimeError(result.stdout+result.stderr)
 if Image.open(exported).size!=dimensions:raise ValueError('Native project and software export dimensions differ.')
 return exported
with TemporaryDirectory(prefix='umwelt-pixelorama-') as directory:
 directory=Path(directory)
 exported=export(source,directory)
 shutil.copyfile(exported,TARGET)
 # Software-export each native layer, rather than synthesising layer PNGs.
 for index,name in enumerate(['base','strokes','weathering']):
  single=copy.deepcopy(data)
  for i,layer in enumerate(single['layers']):layer['visible']=i==index
  project=directory/('atlas-'+name+'.pxo')
  with zipfile.ZipFile(project,'w',compression=zipfile.ZIP_DEFLATED) as archive:
   for entry,content in members.items():archive.writestr(entry,json.dumps(single) if entry=='data.json' else content)
  shutil.copyfile(export(project,directory),ROOT/('atlas-'+name+'.png'))
 members['preview.png']=TARGET.read_bytes()
 temporary=source.with_suffix('.pxo.tmp')
 with zipfile.ZipFile(temporary,'w',compression=zipfile.ZIP_DEFLATED) as archive:
  for entry,content in members.items():archive.writestr(entry,content)
 temporary.replace(source)
 # Refresh the existing layered interchange file using software-exported pixels.
 ora=ROOT/'garden-atlas.ora'
 with zipfile.ZipFile(ora) as archive:ora_members={name:archive.read(name) for name in archive.namelist()}
 import re
 xml=ora_members['stack.xml'].decode()
 xml=re.sub(r' w="\d+" h="\d+"',f' w="{dimensions[0]}" h="{dimensions[1]}"',xml,count=1)
 ora_members['stack.xml']=xml.encode()
 for name in ['base','strokes','weathering']:ora_members['data/'+name+'.png']=(ROOT/('atlas-'+name+'.png')).read_bytes()
 ora_members['mergedimage.png']=ora_members['Thumbnails/thumbnail.png']=TARGET.read_bytes()
 with zipfile.ZipFile(ora,'w',compression=zipfile.ZIP_DEFLATED) as archive:
  for entry,content in ora_members.items():archive.writestr(entry,content)
 report={'software':'Pixelorama','native_project':'garden-atlas.pxo','dimensions':dimensions,'exported_by_actual_pixelorama':True,'layers_exported_by_actual_pixelorama':True,'png_sha256':hashlib.sha256(TARGET.read_bytes()).hexdigest()}
 (ROOT/'pixelorama-export.json').write_text(json.dumps(report,indent=2)+'\n')
print('Pixelorama exported:',TARGET)
