"""Check scarf continuity, body clearance and retained snake/hat geometry."""
import argparse
import hashlib
import json
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils.bvhtree import BVHTree

sys.path.insert(0, str(Path(__file__).resolve().parent))
from scarf_textile import POSES, protected_fingerprint, topology
from scarf_structure import tying_structure, self_intersections

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--source', type=Path, required=True)
p.add_argument('--baseline', type=Path)
p.add_argument('--report', type=Path, required=True)
a = p.parse_args(sys.argv[sys.argv.index('--')+1:])
bpy.ops.wm.open_mainfile(filepath=str(a.source)); bpy.context.view_layer.update()
protected = protected_fingerprint()
report = {'source': a.source.name, 'sha256': hashlib.sha256(a.source.read_bytes()).hexdigest(), 'poses': {}}
textures = [im for im in bpy.data.images if im.name.startswith('poly_wool_herringbone_')]
assert len(textures) == 3 and all(im.packed_file for im in textures), 'Scarf maps must be packed in the editable model.'
report['packed_texture_maps'] = sorted(im.name for im in textures)
for pose in POSES:
    col = bpy.data.collections['Snake · '+pose]
    skin = next(o for o in col.objects if o.get('snake_complete_skin'))
    scarf = next(o for o in col.objects if o.get('scarf_continuous'))
    bvh = BVHTree.FromPolygons([v.co for v in skin.data.vertices], [list(p.vertices) for p in skin.data.polygons])
    transform = skin.matrix_world.inverted()@scarf.matrix_world
    clearance = []
    for v in scarf.data.vertices:
        q = transform@v.co; hit, n, _, _ = bvh.find_nearest(q)
        clearance.append((q-hit).dot(n))
    components = [o for o in col.objects if o.get('snake_garment') == 'scarf']
    for o in components:
        co = np.empty(len(o.data.vertices)*3); o.data.vertices.foreach_get('co', co)
        assert np.isfinite(co).all(), (pose, o.name, 'non-finite coordinates')
    stats = {**topology(scarf), 'minimum_skin_clearance': min(clearance),
             'vertices_inside_skin_beyond_0_2mm': sum(d<-.0002 for d in clearance),
             'garment_components': len(components), 'finite_coordinates': True,
             'detail_paths': {o.name: o.get('fibre_paths', 0) for o in components if o != scarf}}
    assert stats['vertices_inside_skin_beyond_0_2mm'] == 0, (pose, 'cloth penetrates skin', stats)
    assert len(components) == 5
    if scarf.get('scarf_retie_revision'):
        stats['tying_structure'] = tying_structure(scarf)
        stats['nonadjacent_triangle_intersections'] = self_intersections(scarf.data)
        assert stats['nonadjacent_triangle_intersections'] == 0, (pose, 'scarf intersects itself', stats)
    report['poses'][pose] = stats
    print('SCARF_VALIDATED', pose, stats['minimum_skin_clearance'], flush=True)
if a.baseline:
    bpy.ops.wm.open_mainfile(filepath=str(a.baseline)); bpy.context.view_layer.update()
    assert protected_fingerprint() == protected, 'Accepted snake or hat geometry changed.'
    report['protected_geometry_unchanged'] = True
    report['baseline_sha256'] = hashlib.sha256(a.baseline.read_bytes()).hexdigest()
report['protected_geometry_sha256'] = protected
report['scope'] = 'Scarf topology, finite coordinates, clearance at cloth vertices from continuous skin, and optional retained geometry comparison. Native renders review folds, fabric, self-contact and detail.'
a.report.write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
