"""Save the current edited Blender scene as the repository's single archive."""
from pathlib import Path
import hashlib,json,os
ROOT=Path(__file__).resolve().parent

def archive():
    source=ROOT/'ophidia.blend'
    if not source.exists():raise RuntimeError('Restore the editable Blender scene before archiving it.')
    folder=ROOT/'source';folder.mkdir(exist_ok=True)
    parts=[];whole=hashlib.sha256();total=0
    with source.open('rb') as f:
        for i,data in enumerate(iter(lambda:f.read(6*1024*1024),b''),1):
            name=f'ophidia.blend.part{i:02d}';target=folder/name
            temporary=target.with_name(target.name+'.tmp');temporary.write_bytes(data);os.replace(temporary,target)
            parts.append({'file':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
            whole.update(data);total+=len(data)
    manifest={'source':'ophidia.blend','bytes':total,'sha256':whole.hexdigest(),'parts':parts}
    temporary=folder/'manifest.json.tmp';temporary.write_text(json.dumps(manifest,indent=2)+'\n');os.replace(temporary,folder/'manifest.json')
    names={part['file'] for part in parts}
    for old in folder.glob('ophidia.blend.part*'):
        if old.name not in names:old.unlink()
    print(f'Archived current Blender scene: {len(parts)} parts, SHA256 {whole.hexdigest()}')
    return manifest
if __name__=='__main__':archive()
