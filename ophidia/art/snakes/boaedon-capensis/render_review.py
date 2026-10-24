"""Render only the snake review views in the preserved ferry lighting.

No source, camera setup or composition file is saved. --snake-source supports
an external baseline for a native before/after comparison under identical light.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parent
COMPOSITION = ROOT.parents[1]/'ophidia-01'
CAMERAS = {'face': 'Character anatomy detail camera',
           'cloth': 'Character textile detail camera',
           'full': 'Review · snake natural anatomy'}


def main():
    argv = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--snake-source', type=Path, default=ROOT/'boaedon-capensis.blend')
    parser.add_argument('--output', type=Path, default=COMPOSITION/'renders')
    parser.add_argument('--views', nargs='+', choices=CAMERAS, default=list(CAMERAS))
    parser.add_argument('--samples', type=int, default=64)
    parser.add_argument('--width', type=int, default=1280)
    parser.add_argument('--pose', choices=('normal', 'curious', 'away', 'tongue'), default='normal')
    args = parser.parse_args(argv)
    source_sha = hashlib.sha256(args.snake_source.read_bytes()).hexdigest()
    bpy.ops.wm.open_mainfile(filepath=str(COMPOSITION/'composition-setup.blend'))
    config = json.loads((COMPOSITION/'composition.json').read_text())
    for asset in config['assets']:
        path = args.snake_source if 'snakes/' in asset['source'] else (COMPOSITION/asset['source']).resolve()
        with bpy.data.libraries.load(str(path), link=True) as (available, loaded):
            loaded.collections = asset['collections']
            if asset.get('world'):
                loaded.worlds = [asset['world']]
        for collection in loaded.collections:
            bpy.context.scene.collection.children.link(collection)
        if asset.get('world'):
            bpy.context.scene.world = loaded.worlds[0]
    scene = bpy.context.scene
    for pose in ('normal', 'curious', 'away', 'tongue'):
        collection = bpy.data.collections['Snake · '+pose]
        collection.hide_render = pose != args.pose
        collection.hide_viewport = pose != args.pose
    for obj in bpy.data.collections['Review · new saloon complementary cameras'].objects:
        if obj.type == 'LIGHT':
            obj.hide_render = False
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = args.samples
    scene.cycles.use_denoising = True
    scene.render.resolution_x = args.width
    scene.render.resolution_y = round(args.width*5/8)
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    args.output.mkdir(parents=True, exist_ok=True)
    names = {'face': 'character-face-detail', 'cloth': 'character-cloth-detail', 'full': 'snake-detail'}
    for view in args.views:
        scene.camera = bpy.data.objects[CAMERAS[view]]
        scene.render.filepath = str(args.output/(names[view]+'.png'))
        bpy.ops.render.render(write_still=True)
        print('REVIEW_RENDER', scene.render.filepath, flush=True)
    assert hashlib.sha256(args.snake_source.read_bytes()).hexdigest() == source_sha, 'The snake source changed while rendering'


if __name__ == '__main__':
    main()
