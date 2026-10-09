"""Export an edited native PXO with installed Pixelorama, preserving editable layers."""
from pathlib import Path
from tempfile import TemporaryDirectory
import subprocess, shutil, json, hashlib
from PIL import Image
import argparse
parser=argparse.ArgumentParser()
parser.add_argument('--pixelorama',default='/Applications/Pixelorama.app/Contents/MacOS/Pixelorama')
args=parser.parse_args()
ROOT=Path(__file__).resolve().parent
TARGET=ROOT.parents[2]/'rooftop/previews/pixel-01/assets/garden-atlas.png'
with TemporaryDirectory(prefix='umwelt-pixelorama-') as directory:
 result=subprocess.run([args.pixelorama,'--headless','--quit','--','--export','--output',str(Path(directory)/'export.png'),str(ROOT/'garden-atlas.pxo')],capture_output=True,text=True,check=True)
 exported=Path(directory)/'garden-atlas.png'
 if not exported.exists():raise RuntimeError(result.stdout+result.stderr)
 image=Image.open(exported).convert('RGBA')
 if image.size!=(128,128):raise ValueError('Keep the shared atlas at 128 x 128, or update model UVs first.')
 shutil.copyfile(exported,TARGET)
 report={'software':'Pixelorama','native_project':'garden-atlas.pxo','dimensions':[128,128],'exported_by_actual_pixelorama':True,'png_sha256':hashlib.sha256(TARGET.read_bytes()).hexdigest()}
 (ROOT/'pixelorama-export.json').write_text(json.dumps(report,indent=2)+'\n')
print('Pixelorama exported:',TARGET)
