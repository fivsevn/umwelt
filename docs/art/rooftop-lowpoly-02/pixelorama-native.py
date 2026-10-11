"""Run a temporary extension in the installed real Pixelorama application.

Independent copy of the working 01 launcher. All work paths resolve to 02;
app config bytes are restored and the extension is removed in finally.
"""
from pathlib import Path
import json
import subprocess
import zipfile
HERE=Path(__file__).resolve().parent

def run_native(gd, flag, name):
    (HERE/f'{name}.gd').write_text(gd)
    (HERE/f'{name}.tscn').write_text(f'[gd_scene load_steps=2 format=3]\n[ext_resource type="Script" path="res://src/Extensions/{name}/{name}.gd" id="1"]\n[node name="{name}" type="Node"]\nscript = ExtResource("1")\n')
    config = Path('/Users/d/Library/Application Support/Pixelorama/config.ini')
    backup = config.read_bytes()
    extension = config.parent / f'extensions/{name}.zip'
    assert not extension.exists(), 'Never overwrite an existing author extension'
    with zipfile.ZipFile(extension,'w',zipfile.ZIP_DEFLATED) as z:
        for suffix in ('gd','tscn'):
            z.write(HERE/f'{name}.{suffix}',f'src/Extensions/{name}/{name}.{suffix}')
        z.writestr(f'src/Extensions/{name}/extension.json',json.dumps({'name':name,'display_name':'Rooftop native rough surface refinement','description':'Saved atlas pigment effect and 1 px Pencil authoring','author':'五月七日','version':'0.1','supported_api_versions':[8],'license':'MIT','nodes':[f'{name}.tscn']}))
    config.write_bytes(backup+f'\n[extensions]\n{name}=true\n'.encode())
    try:
        result = subprocess.run(['/Applications/Pixelorama.app/Contents/MacOS/Pixelorama','--headless','--',str(HERE/'terrace-book.pxo'),flag,'--book-dir='+str(HERE)],capture_output=True,text=True,timeout=360)
        (HERE/f'{name}.log').write_text(result.stdout+'\n'+result.stderr)
        print(result.stdout[-2000:])
        print(result.stderr[-500:])
        assert result.returncode==0
    finally:
        config.write_bytes(backup)
        extension.unlink(missing_ok=True)
