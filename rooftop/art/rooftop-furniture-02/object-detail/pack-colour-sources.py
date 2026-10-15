"""Blender: repack the current atlas, without changing models or materials.

blender --background --python pack-colour-sources.py -- <work-directory>
Both final and layout sources are saved and independently reopened.
"""
import array
import hashlib
import json
import sys
from pathlib import Path
import bpy

ROOT = Path(__file__).resolve().parent.parent
FAMILIES = ('everyday', 'rooms-vessels', 'plants-retained', 'pots-retained')


def plain(value):
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if isinstance(value, bpy.types.ID):
        return value.name
    if hasattr(value, 'items'):
        return {k: plain(v) for k, v in value.items()}
    return [plain(v) for v in value]


def digest(value):
    return hashlib.sha256(json.dumps(plain(value), sort_keys=True).encode()).hexdigest()


def values(collection, prop, width, kind='f'):
    data = array.array(kind, [0]) * (len(collection) * width)
    collection.foreach_get(prop, data)
    return hashlib.sha256(data.tobytes()).hexdigest()


def fingerprints():
    objects, materials = {}, {}
    for obj in bpy.data.objects:
        record = {'type': obj.type, 'matrix': [list(r) for r in obj.matrix_world],
                  'properties': dict(obj.items()),
                  'materials': [s.material.name if s.material else None for s in obj.material_slots]}
        if obj.type == 'MESH':
            mesh = obj.data
            record.update(vertices=values(mesh.vertices, 'co', 3),
                          corners=values(mesh.loops, 'vertex_index', 1, 'i'),
                          polygons=values(mesh.polygons, 'loop_total', 1, 'i'),
                          materialIndices=values(mesh.polygons, 'material_index', 1, 'i'),
                          normals=values(mesh.corner_normals, 'vector', 3),
                          uv=[(layer.name, values(layer.data, 'uv', 2)) for layer in mesh.uv_layers])
        objects[obj.name] = digest(record)
    for mat in bpy.data.materials:
        record = {'diffuse': list(mat.diffuse_color), 'metallic': mat.metallic,
                  'roughness': mat.roughness, 'properties': dict(mat.items())}
        if mat.node_tree:
            record['nodes'] = [(n.name, n.bl_idname,
                                [(s.name, plain(s.default_value)) for s in n.inputs if hasattr(s, 'default_value')],
                                n.image.name if n.type == 'TEX_IMAGE' and n.image else None)
                               for n in mat.node_tree.nodes]
            record['links'] = [(l.from_node.name, l.from_socket.name, l.to_node.name, l.to_socket.name)
                               for l in mat.node_tree.links]
        materials[mat.name] = digest(record)
    return {'objects': objects, 'materials': materials}


def run(work, baseline=None):
    reports = []
    bpy.context.preferences.filepaths.save_version = 0
    for family in FAMILIES:
        atlas = ROOT / family / 'atlas.png'
        expected = hashlib.sha256(atlas.read_bytes()).hexdigest()
        for suffix in ('', '-layout'):
            path = ROOT / family / (family + suffix + '.blend')
            reference = None
            if baseline:
                bpy.ops.wm.open_mainfile(filepath=str(baseline / family / path.name))
                reference = fingerprints()
            bpy.ops.wm.open_mainfile(filepath=str(path))
            before = fingerprints()
            if reference:
                assert before == reference, 'Current source differs from original model/material'
            images = [img for img in bpy.data.images if img.type == 'IMAGE' and img.source == 'FILE']
            assert len(images) == 1, (path.name, [(i.name, i.filepath) for i in images])
            old = images[0]
            name, space, alpha = old.name, old.colorspace_settings.name, old.alpha_mode
            properties = dict(old.items())
            new = bpy.data.images.load(str(atlas), check_existing=False)
            new.colorspace_settings.name = space
            new.alpha_mode = alpha
            for key, value in properties.items():
                new[key] = value
            old.user_remap(new)
            bpy.data.images.remove(old)
            new.name = name
            new.pack()
            new.filepath = '//atlas.png'
            assert fingerprints() == before, 'Model or material changed before save'
            bpy.ops.wm.save_as_mainfile(filepath=str(path))
            bpy.ops.wm.open_mainfile(filepath=str(path))
            assert fingerprints() == before, 'Model or material changed after reopen'
            final = bpy.data.images[name]
            assert final.packed_file and final.filepath == '//atlas.png'
            assert hashlib.sha256(final.packed_file.data).hexdigest() == expected
            reports.append({'source': str(path.relative_to(ROOT)), 'reopened': True,
                            'objectsPreserved': len(before['objects']),
                            'materialsPreserved': len(before['materials']),
                            'meshUvNormalsTransformsPreserved': True, 'packedAtlasSha256': expected})
            print('SOURCE VERIFIED', path.name, flush=True)
    (work / 'blender-check.json').write_text(json.dumps(reports, indent=2))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:]
    run(Path(args[0]), Path(args[1]) if len(args) > 1 else None)
