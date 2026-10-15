"""Export the saved current source; never replay a historical layout builder.

Blender --background --python export-current.py -- [--publish] [--output FILE]
--output exports a verification copy without saving or publishing the source.
"""
import argparse
import shutil
import sys
from pathlib import Path

import bpy

HERE = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--publish', action='store_true')
parser.add_argument('--output', type=Path)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
assert not (args.publish and args.output), 'Use --output or --publish, not both.'
source = HERE / 'terraces/terraces.blend'
bpy.ops.wm.open_mainfile(filepath=str(source))
assert bpy.context.scene.get('detailRevision', 0) >= 5, 'Use the current saved source.'
parts = list(bpy.data.collections['terraces'].objects)
assert parts and all(o.type == 'MESH' and o.parent is None for o in parts)
atlas = bpy.data.images.load(str(HERE / 'terraces/atlas.png'), check_existing=False)
atlas.pack()
atlas['sourceSoftware'] = 'Pixelorama'
for material in {m for o in parts for m in o.data.materials}:
    for node in material.node_tree.nodes:
        if node.type == 'TEX_IMAGE':
            node.image = atlas
            node.interpolation = 'Closest'
for image in list(bpy.data.images):
    if image != atlas and image.users == 0:
        bpy.data.images.remove(image)
parent = bpy.data.objects.new('Terrace metric-to-game conversion', None)
bpy.context.scene.collection.objects.link(parent)
parent.scale = (1 / .2707537401739019, 1 / .4638375014617893, 1 / .5357142857142857)
bpy.ops.object.select_all(action='DESELECT')
for obj in parts:
    obj.parent = parent
    obj.select_set(True)
parent.select_set(True)
output = args.output or HERE / 'preview/assets/terraces.glb'
output.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(output), export_format='GLB', use_selection=True,
                          export_yup=True, export_extras=True)
for obj in parts:
    obj.parent = None
bpy.data.objects.remove(parent, do_unlink=True)
atlas.filepath = '//atlas.png'
if not args.output:
    bpy.ops.wm.save_as_mainfile(filepath=str(source))
    shutil.copyfile(HERE / 'terraces/atlas.png', HERE / 'preview/assets/terraces-atlas.png')
    shutil.copyfile(HERE / 'terraces/atlas.pxo', HERE / 'terraces/terraces-atlas.pxo')
if args.publish:
    shutil.copyfile(output, HERE.parents[1] / 'assets/terraces/terraces.glb')
