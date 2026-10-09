"""Use actual Pixelorama to export the saved native project and its three layers."""
from pathlib import Path
from tempfile import TemporaryDirectory
import subprocess,shutil,json,hashlib,zipfile,re
from PIL import Image
import argparse
parser=argparse.ArgumentParser();parser.add_argument('--pixelorama',default='/Applications/Pixelorama.app/Contents/MacOS/Pixelorama');args=parser.parse_args()
ROOT=Path(__file__).resolve().parent;TARGET=ROOT.parents[2]/'rooftop/previews/pixel-01/assets/garden-atlas.png';source=ROOT/'garden-atlas.pxo'
with zipfile.ZipFile(source) as z:members={name:z.read(name) for name in z.namelist()}
data=json.loads(members['data.json']);dimensions=(data['size_x'],data['size_y'])
def export(directory,split=False):
 directory.mkdir()
 command=[args.pixelorama,'--headless','--quit','--','--export']
 if split:command.append('--split-layers')
 command.extend(['--output',str(directory/'export.png'),str(source)])
 result=subprocess.run(command,capture_output=True,text=True,check=True)
 files=list(directory.glob('*.png'))
 if len(files)!=(len(data['layers']) if split else 1):raise RuntimeError(result.stdout+result.stderr+str(files))
 for path in files:
  if Image.open(path).size!=dimensions:raise ValueError('Native project and software export dimensions differ.')
 return files
with TemporaryDirectory(prefix='umwelt-pixelorama-') as folder:
 directory=Path(folder);shutil.copyfile(export(directory/'full')[0],TARGET)
 layer_files=export(directory/'layers',split=True)
 for index,name in enumerate(['base','strokes','weathering']):
  native_name=data['layers'][index]['name']
  exported=next(p for p in layer_files if '('+native_name+')' in p.name)
  # Read-only verification against the native RGBA cel, never synthesize pixels.
  with Image.open(exported) as png:
   assert png.convert('RGBA').tobytes()==members[f'image_data/frames/1/layer_{index+1}']
  shutil.copyfile(exported,ROOT/('atlas-'+name+'.png'))
 members['preview.png']=TARGET.read_bytes()
 temporary=source.with_suffix('.pxo.tmp')
 with zipfile.ZipFile(temporary,'w',zipfile.ZIP_DEFLATED) as archive:
  for entry,content in members.items():archive.writestr(entry,content)
 temporary.replace(source)
 ora=ROOT/'garden-atlas.ora'
 with zipfile.ZipFile(ora) as archive:ora_members={name:archive.read(name) for name in archive.namelist()}
 xml=re.sub(r' w="\d+" h="\d+"',f' w="{dimensions[0]}" h="{dimensions[1]}"',ora_members['stack.xml'].decode(),count=1)
 ora_members['stack.xml']=xml.encode()
 for name in ['base','strokes','weathering']:ora_members['data/'+name+'.png']=(ROOT/('atlas-'+name+'.png')).read_bytes()
 ora_members['mergedimage.png']=ora_members['Thumbnails/thumbnail.png']=TARGET.read_bytes()
 with zipfile.ZipFile(ora,'w',zipfile.ZIP_DEFLATED) as archive:
  for entry,content in ora_members.items():archive.writestr(entry,content)
 report={'software':'Pixelorama','native_project':'garden-atlas.pxo','dimensions':dimensions,'exported_by_actual_pixelorama':True,'layers_exported_by_actual_pixelorama':True,'native_cels_equal_exported_layer_rgba':True,'png_sha256':hashlib.sha256(TARGET.read_bytes()).hexdigest()}
 (ROOT/'pixelorama-export.json').write_text(json.dumps(report,indent=2)+'\n')
print('Pixelorama exported and verified all native layers:',TARGET)
