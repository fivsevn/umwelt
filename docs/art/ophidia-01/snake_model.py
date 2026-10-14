"""Editable mesh, UV, material and curve primitives for the current character."""
import math
import bpy
from mathutils import Vector
_TAU=math.tau

def _mesh(name, verts, faces, collection, mats, uvs=None, indices=None):
    data = bpy.data.meshes.new(name + ' · editable mesh')
    data.from_pydata(verts, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    collection.objects.link(obj)
    for mat in mats:
        data.materials.append(mat)
    for face in data.polygons:
        face.use_smooth = True
        if indices:
            face.material_index = indices[face.index]
    if uvs:
        layer = data.uv_layers.new(name='Anatomical UV')
        for face in data.polygons:
            for li, xy in zip(face.loop_indices, uvs[face.index]):
                layer.data[li].uv = xy
    return obj


def _catmull(points, steps=10):
    values = [Vector(p) for p in points]
    pad = [values[0]] + values + [values[-1]]
    result = []
    for i in range(1, len(pad)-2):
        a, b, c, d = pad[i-1:i+3]
        for j in range(steps):
            t = j / steps
            result.append(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t))
    result.append(values[-1])
    return result


def _node_material(name, color, roughness=.64):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    p = mat.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = roughness
    return mat


def _ramp(nodes, stops):
    ramp = nodes.new('ShaderNodeValToRGB')
    for element, (position, color) in zip(ramp.color_ramp.elements, stops[:2]):
        element.position = position
        element.color = (*color, 1)
    for position, color in stops[2:]:
        element = ramp.color_ramp.elements.new(position)
        element.color = (*color, 1)
    return ramp


def _scaled(nodes, links, source, scale):
    node = nodes.new('ShaderNodeVectorMath')
    node.operation = 'MULTIPLY'
    node.inputs[1].default_value = scale
    links.new(source, node.inputs[0])
    return node.outputs['Vector']


def _tube(name, points, radii, collection, materials, rings=28, steps=10, flatten=.82):
    """One continuous skinned centerline, with lengthwise/circumferential UV."""
    samples = _catmull(points, steps)
    rs = []
    for i in range(len(radii)-1):
        for j in range(steps):
            t = j / steps
            # Cubic smoothing makes joins continuous without abrupt neck collars.
            t = t*t*(3-2*t)
            rs.append(radii[i]*(1-t) + radii[i+1]*t)
    rs.append(radii[-1])
    verts, faces, uvs, material_indices = [], [], [], []
    lengths = [0.0]
    for i in range(1, len(samples)):
        lengths.append(lengths[-1]+(samples[i]-samples[i-1]).length)
    for i, (point, radius) in enumerate(zip(samples, rs)):
        tangent = (samples[min(i+1, len(samples)-1)]-samples[max(0, i-1)]).normalized()
        side = tangent.cross(Vector((0, 0, 1)))
        if side.length < .05:
            side = Vector((1, 0, 0))
        side.normalize()
        up = side.cross(tangent).normalized()
        for j in range(rings):
            a = _TAU*j/rings
            # Near-ground coils have a slightly flattened belly.
            zshape = math.sin(a)
            if zshape < -.78:
                zshape = -.78+(zshape+.78)*.45
            verts.append(tuple(point + side*radius*math.cos(a) + up*radius*flatten*zshape))
    for i in range(len(samples)-1):
        for j in range(rings):
            k = (j+1) % rings
            faces.append((i*rings+j, i*rings+k, (i+1)*rings+k, (i+1)*rings+j))
            uvs.append(((lengths[i], j/rings), (lengths[i], (j+1)/rings),
                        (lengths[i+1], (j+1)/rings), (lengths[i+1], j/rings)))
            # The ventral surface is along the underside, not an arbitrary side.
            ventral_limit=-.32 if i>len(samples)-60 else -.58
            material_indices.append(1 if len(materials)>1 and math.sin(_TAU*(j+.5)/rings)<ventral_limit else 0)
    faces += [tuple(range(rings-1, -1, -1)), tuple((len(samples)-1)*rings+j for j in range(rings))]
    uvs += [tuple((0, j/rings) for j in range(rings)), tuple((lengths[-1], j/rings) for j in range(rings))]
    material_indices += [0, 0]
    return _mesh(name, verts, faces, collection, materials, uvs, material_indices)


def _ellipsoid(name, center, axes, radii, mat, collection, n=20, m=12):
    forward, side, up = axes
    verts, faces = [], []
    for i in range(m+1):
        phi = math.pi * i/m
        for j in range(n):
            a = _TAU*j/n
            verts.append(tuple(center+forward*(radii[0]*math.sin(phi)*math.cos(a))
                               +side*(radii[1]*math.sin(phi)*math.sin(a))+up*(radii[2]*math.cos(phi))))
    for i in range(m):
        for j in range(n):
            faces.append((i*n+j, i*n+(j+1)%n, (i+1)*n+(j+1)%n, (i+1)*n+j))
    return _mesh(name, verts, faces, collection, [mat])
