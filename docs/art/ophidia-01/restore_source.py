"""Restore the current editable Blender scene from its repository archive."""
from pathlib import Path
import hashlib,json,os
ROOT=Path(__file__).resolve().parent

def restore(destination=None):
    destination=Path(destination) if destination else ROOT/'ophidia.blend'
    manifest=json.loads((ROOT/'source/manifest.json').read_text())
    def sha(path):
        h=hashlib.sha256()
        with path.open('rb') as f:
            for data in iter(lambda:f.read(1024*1024),b''):h.update(data)
        return h.hexdigest()
    if destination.exists():
        if destination.stat().st_size==manifest['bytes'] and sha(destination)==manifest['sha256']:
            print('Current Blender scene is ready: '+destination.name);return destination
        raise RuntimeError('An edited Blender scene already exists. Preserve it before restoring the archive.')
    destination.parent.mkdir(parents=True,exist_ok=True)
    temporary=destination.with_name(destination.name+'.restoring')
    try:
        with temporary.open('wb') as out:
            for part in manifest['parts']:
                path=ROOT/'source'/part['file']
                if path.stat().st_size!=part['bytes'] or sha(path)!=part['sha256']:
                    raise RuntimeError('Source archive verification failed: '+part['file'])
                with path.open('rb') as f:
                    for data in iter(lambda:f.read(1024*1024),b''):out.write(data)
        assert temporary.stat().st_size==manifest['bytes']
        if sha(temporary)!=manifest['sha256']:raise RuntimeError('Complete source verification failed')
        os.replace(temporary,destination)
    finally:
        temporary.unlink(missing_ok=True)
    print('Restored editable Blender scene: '+destination.name)
    return destination
if __name__=='__main__':restore()
