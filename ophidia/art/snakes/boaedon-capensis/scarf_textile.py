"""Shared scarf material, surface sampling, fibre construction and mesh checks."""
import hashlib
import math
from pathlib import Path

import bpy
import bmesh
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.geometry import barycentric_transform

ROOT = Path(__file__).resolve().parent
REV = '2026-11-04-soft-woven-scarf'
POSES = ('normal', 'curious', 'away', 'tongue')


def smooth(a, b, x):
    t = np.clip((x-a)/(b-a), 0, 1)
    return t*t*(3-2*t)


def protected_fingerprint():
    h = hashlib.sha256()
    for pose in POSES:
        for o in sorted(bpy.data.collections['Snake · '+pose].objects, key=lambda o: o.name):
            if o.get('snake_garment') == 'scarf':
                continue
            h.update(o.name.encode())
            h.update(np.asarray(o.matrix_world, dtype=np.float64).tobytes())
            if o.type == 'MESH':
                a = np.empty(len(o.data.vertices)*3, dtype=np.float32)
                o.data.vertices.foreach_get('co', a)
                h.update(a.tobytes())
                h.update(str((len(o.data.polygons), [m.name for m in o.data.materials])).encode())
    return h.hexdigest()


def material(name, fibre=False):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    n, l = m.node_tree.nodes, m.node_tree.links
    p = n.get('Principled BSDF')
    p.inputs['Roughness'].default_value = .86
    p.inputs['Specular IOR Level'].default_value = .14
    p.inputs['Sheen Weight'].default_value = .28
    p.inputs['Sheen Tint'].default_value = (.22, .14, .09, 1)
    p.inputs['Sheen Roughness'].default_value = .68
    uv = n.new('ShaderNodeTexCoord')
    noise = n.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 280
    noise.inputs['Detail'].default_value = 2
    l.new(uv.outputs['Object'], noise.inputs['Vector'])
    tint = n.new('ShaderNodeValToRGB')
    tint.color_ramp.elements[0].color = (.078, .019, .008, 1)
    tint.color_ramp.elements[1].color = (.135, .044, .019, 1)
    l.new(noise.outputs['Fac'], tint.inputs[0])
    l.new(tint.outputs[0], p.inputs['Base Color'])
    rough = n.new('ShaderNodeMapRange')
    rough.inputs['To Min'].default_value = .88
    rough.inputs['To Max'].default_value = .98
    l.new(noise.outputs['Fac'], rough.inputs['Value'])
    l.new(rough.outputs[0], p.inputs['Roughness'])
    if not fibre:
        # Scanned poly-wool surface, mapped in metres and tinted to retain
        # the original rust colour. Source and licence accompany the maps.
        mapping = n.new('ShaderNodeVectorMath'); mapping.operation = 'MULTIPLY'
        mapping.inputs[1].default_value = (1/.2700788549, 1/.2757000029, 1)
        l.new(uv.outputs['UV'], mapping.inputs[0])
        def texture(filename, noncolor=False):
            image = bpy.data.images.get(filename)
            if image is None:
                image = bpy.data.images.load(str(ROOT/'textures/wool'/filename), check_existing=True)
            if noncolor:
                image.colorspace_settings.name = 'Non-Color'
            image.pack()
            tex = n.new('ShaderNodeTexImage'); tex.image = image
            l.new(mapping.outputs[0], tex.inputs['Vector'])
            return tex
        color = texture('poly_wool_herringbone_diff_2k.jpg')
        normal = texture('poly_wool_herringbone_nor_gl_2k.png', True)
        scanned_rough = texture('poly_wool_herringbone_rough_1k.png', True)
        bw = n.new('ShaderNodeRGBToBW'); l.new(color.outputs['Color'], bw.inputs[0])
        value = n.new('ShaderNodeMapRange'); value.clamp = True
        value.inputs['From Min'].default_value = .03; value.inputs['From Max'].default_value = .42
        value.inputs['To Min'].default_value = .65; value.inputs['To Max'].default_value = 1.35
        l.new(bw.outputs[0], value.inputs['Value'])
        rust = n.new('ShaderNodeMixRGB'); rust.blend_type = 'MULTIPLY'; rust.inputs[0].default_value = 1
        rust.inputs[1].default_value = (.113, .028, .012, 1)
        l.new(value.outputs[0], rust.inputs[2]); l.new(rust.outputs[0], p.inputs['Base Color'])
        relief = n.new('ShaderNodeNormalMap'); relief.inputs['Strength'].default_value = .85
        relief.uv_map = 'Textile physical UV'
        l.new(normal.outputs['Color'], relief.inputs['Color']); l.new(relief.outputs[0], p.inputs['Normal'])
        rr = n.new('ShaderNodeMapRange'); rr.inputs['To Min'].default_value = .76; rr.inputs['To Max'].default_value = .98
        l.new(scanned_rough.outputs['Color'], rr.inputs['Value']); l.new(rr.outputs[0], p.inputs['Roughness'])
        m['surface_source'] = 'https://polyhaven.com/a/poly_wool_herringbone'
        m['surface_license'] = 'CC0-1.0'
    return m


class Surface:
    def __init__(self, obj):
        me = obj.data; me.calc_loop_triangles()
        self.tables = []
        for side in [1, -1]:
            uvverts, positions, normals = [], [], []
            for tri in me.loop_triangles:
                uv = [Vector((*me.uv_layers.active.data[i].uv, 0)) for i in tri.loops]
                area = (uv[1]-uv[0]).cross(uv[2]-uv[0]).z
                if side*area <= 1e-12:
                    continue
                uvverts.extend(uv)
                positions.append([me.vertices[i].co.copy() for i in tri.vertices])
                normals.append([me.vertices[i].normal.copy() for i in tri.vertices])
            bvh = BVHTree.FromPolygons(uvverts, [(i*3, i*3+1, i*3+2) for i in range(len(positions))], all_triangles=True)
            self.tables.append((bvh, uvverts, positions, normals))

    def sample(self, u, v, side=0):
        bvh, uv, positions, normals = self.tables[side]
        hit, _, k, _ = bvh.ray_cast(Vector((float(u), float(v), 1)), Vector((0, 0, -1)), 2)
        if hit is None:
            return None
        p = barycentric_transform(hit, *uv[k*3:k*3+3], *positions[k])
        n = barycentric_transform(hit, *uv[k*3:k*3+3], *normals[k]).normalized()
        return p, n


class Tubes:
    def __init__(self):
        self.vertices, self.faces = [], []
        self.count = 0

    def add(self, points, radius, sides=4, taper=False):
        if len(points) < 2:
            return
        offset = len(self.vertices)
        for i, p in enumerate(points):
            tangent = (points[min(i+1, len(points)-1)]-points[max(0, i-1)]).normalized()
            ref = Vector((0, 0, 1)) if abs(tangent.z) < .9 else Vector((1, 0, 0))
            a = tangent.cross(ref).normalized(); b = tangent.cross(a).normalized()
            r = radius*(1-.65*i/(len(points)-1)) if taper else radius
            for j in range(sides):
                theta = 2*math.pi*j/sides
                self.vertices.append(p+r*(a*math.cos(theta)+b*math.sin(theta)))
        for i in range(len(points)-1):
            for j in range(sides):
                a = offset+i*sides+j; b = offset+i*sides+(j+1)%sides
                self.faces.append((a, b, b+sides, a+sides))
        self.faces.extend([tuple(offset+j for j in range(sides-1, -1, -1)), tuple(offset+(len(points)-1)*sides+j for j in range(sides))])
        self.count += 1

    def object(self, name, col, host, mat):
        me = bpy.data.meshes.new(name); me.from_pydata(self.vertices, [], self.faces); me.update()
        obj = bpy.data.objects.new(name, me); col.objects.link(obj)
        obj.parent = host.parent; obj.matrix_basis = host.matrix_basis.copy()
        me.materials.append(mat)
        for p in me.polygons:
            p.use_smooth = True
        obj['snake_garment'] = 'scarf'; obj['cloth_component'] = True; obj['scarf_revision'] = REV
        obj['fibre_paths'] = self.count
        return obj


def textile_details(col, host, width, length, fibre):
    surf = Surface(host); rng = np.random.default_rng(5704)
    edge, yarn, nap, fringe = Tubes(), Tubes(), Tubes(), Tubes()
    for side in [0, 1]:
        for u in [.0005, width-.0005]:
            pts = []
            for v in np.linspace(.001, length-.001, 460):
                sample = surf.sample(u, v, side)
                if sample:
                    p, n = sample; pts.append(p+n*.00008)
                else:
                    edge.add(pts, .00012); pts = []
            edge.add(pts, .00012)
        # Fine raised fibres complement the finer UV weave, with no rigid grid.
        for u in np.arange(.002, width-.001, .0034):
            pts = []
            for v in np.linspace(.001, length-.001, 350):
                sample = surf.sample(u+.00012*math.sin(v*54+u*311), v, side)
                if sample:
                    p, n = sample; pts.append(p+n*(.000045+.000025*math.sin(v*1300+u*2800)))
                else:
                    yarn.add(pts, .000045); pts = []
            yarn.add(pts, .000045)
        for _ in range(3000):
            u, v = rng.uniform(.0005, width-.0005), rng.uniform(.001, length-.001)
            sample = surf.sample(u, v, side)
            if sample is None:
                continue
            p, n = sample
            tangent = n.cross(Vector((.31, .17, 1))).normalized()
            tangent = (tangent*math.cos(float(rng.uniform(-math.pi, math.pi)))+n.cross(tangent)*math.sin(float(rng.uniform(-math.pi, math.pi)))).normalized()
            size = float(rng.uniform(.00035, .0011))
            pts = [p+n*.000035+tangent*(size*t)+n*(size*.25*math.sin(math.pi*t)) for t in [0, .33, .66, 1]]
            nap.add(pts, float(rng.uniform(.000009, .000017)), sides=3, taper=True)
    for end, sign in [(.0007, -1), (length-.0007, 1)]:
        for i, u in enumerate(np.linspace(.0014, width-.0014, 25)):
            sample = surf.sample(u, end, 0)
            second = surf.sample(u, end-sign*.001, 0)
            if sample is None or second is None:
                continue
            p, n = sample
            tangent = (p-second[0]).normalized()
            fall = (tangent*.70+Vector((0, 0, -1))*.30).normalized()
            across = fall.cross(n).normalized(); normal = across.cross(fall).normalized()
            size = .011+.003*(.5+.5*math.sin(i*2.31))+.0015*float(rng.random())
            for strand in range(3):
                pts = []
                for t in np.linspace(0, 1, 13):
                    phase = strand*2*math.pi/3+t*math.pi*4.4
                    center = p+fall*(size*t)+across*(.0012*math.sin(i*1.7)*t*t)+n*(.0015*t*t)
                    pts.append(center+.00013*(across*math.cos(phase)+normal*math.sin(phase)))
                fringe.add(pts, .000095, sides=5, taper=True)
    pose = col.name.split(' · ')[-1]
    for label, tubes in [('soft scarf selvedges', edge), ('raised woven scarf yarn', yarn), ('short wool scarf nap', nap), ('twisted wool scarf fringe', fringe)]:
        tubes.object('Wool Snake · '+pose+' · '+label, col, host, fibre)
    return {'selvedge_paths': edge.count, 'raised_yarn_paths': yarn.count, 'short_fibres': nap.count, 'fringe_strands': fringe.count}


def topology(obj):
    bm = bmesh.new(); bm.from_mesh(obj.data)
    boundary = sum(e.is_boundary for e in bm.edges)
    nonmanifold = sum(not e.is_manifold for e in bm.edges)
    volume = bm.calc_volume(signed=True)
    unseen = set(bm.verts); components = 0
    while unseen:
        components += 1; todo = [unseen.pop()]
        while todo:
            v = todo.pop()
            for e in v.link_edges:
                other = e.other_vert(v)
                if other in unseen:
                    unseen.remove(other); todo.append(other)
    bm.free()
    assert boundary == 0 and nonmanifold == 0 and components == 1 and volume > 0, (obj.name, boundary, nonmanifold, components, volume)
    return {'boundary_edges': boundary, 'nonmanifold_edges': nonmanifold, 'connected_components': components, 'signed_volume': volume}
