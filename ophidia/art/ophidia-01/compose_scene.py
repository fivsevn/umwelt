"""Build the offline render scene from independent, relatively linked sources.

Run with Blender: blender -b --python ophidia/art/ophidia-01/compose_scene.py
The generated ophidia.blend is disposable; edit the two asset files or setup.
"""
import json
import sys
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent))
from source_archive import restore


def asset_source(relative_path):
    path = (ROOT / relative_path).resolve()
    if not path.exists():
        restore(path.parent / 'source')
    return path


def compose():
    config = json.loads((ROOT / 'composition.json').read_text())
    sources = [(asset, asset_source(asset['source'])) for asset in config['assets']]
    bpy.ops.wm.open_mainfile(filepath=str(ROOT / config['setup']))
    scene = bpy.context.scene
    for asset, path in sources:
        with bpy.data.libraries.load(str(path), link=True, relative=True) as (available, loaded):
            missing = set(asset['collections']) - set(available.collections)
            if missing:
                raise RuntimeError(f'Missing asset collections in {path.name}: {sorted(missing)}')
            loaded.collections = asset['collections']
            if asset.get('world'):
                if asset['world'] not in available.worlds:
                    raise RuntimeError(f'Missing asset world in {path.name}: {asset["world"]}')
                loaded.worlds = [asset['world']]
        for collection in loaded.collections:
            scene.collection.children.link(collection)
        if asset.get('world'):
            previous = scene.world
            scene.world = loaded.worlds[0]
            if previous is not None and previous.users == 0 and previous.library is None:
                bpy.data.worlds.remove(previous)
    scene.camera = bpy.data.objects[config['background_camera']]
    bpy.data.objects[config['foreground_camera']].data.dof.focus_object = bpy.data.objects[config['foreground_focus']]
    scene.render.filepath = '//renders/source-preview.png'
    output = ROOT / config['output']
    bpy.ops.wm.save_as_mainfile(filepath=str(output), compress=True)
    # Opening the saved file also verifies that its relative library paths resolve.
    bpy.ops.wm.open_mainfile(filepath=str(output))
    return output


if __name__ == '__main__':
    print('COMPOSED', compose())
