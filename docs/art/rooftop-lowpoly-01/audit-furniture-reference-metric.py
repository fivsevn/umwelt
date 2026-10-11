"""Read-only measurement of the independent 4186 furniture reference.

Writes only into rooftop-lowpoly-01. Furniture sources and exported bytes are
never modified. Measures actual GLB triangle UVs after node world transforms;
catalogue density is recorded as a claim, not used in the calculation.
"""
import hashlib
import io
import json
import math
import statistics
import struct
import zipfile
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
REFERENCE = HERE.parent / 'rooftop-furniture-01'
PREVIEW = REFERENCE / 'preview'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def multiply(a, b):
    return [sum(a[k * 4 + r] * b[c * 4 + k] for k in range(4))
            for c in range(4) for r in range(4)]


IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]


def node_matrix(node):
    if 'matrix' in node:
        return node['matrix']
    x, y, z, w = node.get('rotation', [0, 0, 0, 1])
    sx, sy, sz = node.get('scale', [1, 1, 1])
    tx, ty, tz = node.get('translation', [0, 0, 0])
    return [(1-2*y*y-2*z*z)*sx, (2*x*y+2*w*z)*sx, (2*x*z-2*w*y)*sx, 0,
            (2*x*y-2*w*z)*sy, (1-2*x*x-2*z*z)*sy, (2*y*z+2*w*x)*sy, 0,
            (2*x*z+2*w*y)*sz, (2*y*z-2*w*x)*sz, (1-2*x*x-2*y*y)*sz, 0,
            tx, ty, tz, 1]


def point(matrix, value):
    return [sum(matrix[c*4+r]*value[c] for c in range(3))+matrix[12+r]
            for r in range(3)]


def read_glb(path):
    raw = path.read_bytes()
    magic, version, size = struct.unpack_from('<III', raw)
    assert magic == 0x46546c67 and version == 2 and size == len(raw)
    chunks = {}
    cursor = 12
    while cursor < len(raw):
        length, kind = struct.unpack_from('<II', raw, cursor)
        chunks[kind] = raw[cursor+8:cursor+8+length]
        cursor += length+8
    return json.loads(chunks[0x4e4f534a]), chunks[0x004e4942], raw


def accessor(document, binary, index):
    value = document['accessors'][index]
    assert 'sparse' not in value, 'Sparse accessor needs an independent decoder'
    view = document['bufferViews'][value['bufferView']]
    assert view.get('buffer', 0) == 0
    components = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[value['type']]
    scalar, width = {5120: ('b', 1), 5121: ('B', 1), 5122: ('h', 2),
                     5123: ('H', 2), 5125: ('I', 4), 5126: ('f', 4)}[value['componentType']]
    stride = view.get('byteStride', components*width)
    offset = view.get('byteOffset', 0)+value.get('byteOffset', 0)
    rows = [struct.unpack_from('<'+scalar*components, binary, offset+i*stride)
            for i in range(value['count'])]
    return [row[0] for row in rows] if components == 1 else rows


def texture_image(document, binary, path, material):
    ref = document['materials'][material]['pbrMetallicRoughness']['baseColorTexture']
    texture = document['textures'][ref['index']]
    image = document['images'][texture['source']]
    if 'bufferView' in image:
        view = document['bufferViews'][image['bufferView']]
        start = view.get('byteOffset', 0)
        raw = binary[start:start+view['byteLength']]
    else:
        raw = (path.parent / image['uri']).read_bytes()
    decoded = Image.open(io.BytesIO(raw)).convert('RGBA')
    return decoded, raw, ref.get('texCoord', 0), ref.get('extensions', {})


def length(vector):
    return math.sqrt(sum(component*component for component in vector))


def summary(values):
    return {'min': min(values), 'median': statistics.median(values), 'max': max(values)}


def audit_item(item, source_pixels):
    path = PREVIEW / item['file']
    document, binary, raw = read_glb(path)
    metrics = {'densityU': [], 'densityV': [], 'angleDegrees': [], 'anisotropy': []}
    bounds = [[], [], []]
    texture_checks = {}
    errors = []
    triangle_count = 0
    nonidentity = 0
    node_count = 0
    failed = []

    def visit(index, parent):
        nonlocal triangle_count, nonidentity, node_count
        node = document['nodes'][index]
        matrix = multiply(parent, node_matrix(node))
        nonidentity += matrix != IDENTITY
        if 'mesh' in node:
            node_count += 1
            for primitive_index, primitive in enumerate(document['meshes'][node['mesh']]['primitives']):
                assert primitive.get('mode', 4) == 4
                image, image_raw, texcoord, extensions = texture_image(document, binary, path, primitive['material'])
                assert not extensions, 'Texture transform requires additional UV composition'
                width, height = image.size
                texture_checks[primitive['material']] = {'size': [width, height], 'sha256': sha(image_raw),
                    'rgbaEqualsNativePng': image.tobytes() == source_pixels}
                positions = [point(matrix, value) for value in accessor(document, binary, primitive['attributes']['POSITION'])]
                uvs = accessor(document, binary, primitive['attributes'][f'TEXCOORD_{texcoord}'])
                indices = accessor(document, binary, primitive['indices']) if 'indices' in primitive else list(range(len(positions)))
                for value in positions:
                    for k in range(3):
                        bounds[k].append(value[k])
                for start in range(0, len(indices), 3):
                    ids = indices[start:start+3]
                    p = [positions[i] for i in ids]
                    uv = [[uvs[i][0]*width, uvs[i][1]*height] for i in ids]
                    du1, dv1 = [uv[1][k]-uv[0][k] for k in range(2)]
                    du2, dv2 = [uv[2][k]-uv[0][k] for k in range(2)]
                    det = du1*dv2-du2*dv1
                    triangle_count += 1
                    if abs(det) < 1e-12:
                        errors.append(f'Degenerate UV {node["name"]} triangle {start//3}')
                        continue
                    e1 = [p[1][k]-p[0][k] for k in range(3)]
                    e2 = [p[2][k]-p[0][k] for k in range(3)]
                    uvec = [(e1[k]*dv2-e2[k]*dv1)/det for k in range(3)]
                    vvec = [(e2[k]*du1-e1[k]*du2)/det for k in range(3)]
                    u, v = length(uvec), length(vvec)
                    density_u, density_v = 1/u, 1/v
                    cosine = sum(a*b for a, b in zip(uvec, vvec))/(u*v)
                    angle = math.degrees(math.acos(max(-1, min(1, cosine))))
                    metrics['densityU'].append(density_u)
                    metrics['densityV'].append(density_v)
                    metrics['angleDegrees'].append(angle)
                    metrics['anisotropy'].append(max(u, v)/min(u, v))
                    if abs(density_u-16) >= .002 or abs(density_v-16) >= .002 or abs(angle-90) >= .02:
                        failed.append({'node': node['name'], 'primitive': primitive_index, 'triangle': start//3,
                                       'density': [density_u, density_v], 'angleDegrees': angle})
        for child in node.get('children', []):
            visit(child, matrix)

    for index in document['scenes'][document.get('scene', 0)]['nodes']:
        visit(index, IDENTITY)
    sizes = [max(axis)-min(axis) for axis in bounds]
    expected = [item['width'], item['height'], item['depth']]
    return {'item': item['id'], 'file': str(path.relative_to(HERE.parent.parent.parent)), 'sha256': sha(raw),
            'meshNodes': node_count, 'nonIdentityWorldTransforms': nonidentity,
            'triangles': triangle_count, 'measuredSizesMetresXYZ': sizes,
            'catalogSizesMetresXYZ': expected, 'dimensionsMatch': all(abs(a-b)<1e-5 for a, b in zip(sizes, expected)),
            'textures': list(texture_checks.values()), 'metrics': {key: summary(value) for key, value in metrics.items()},
            'allSquare16PxPerMetre': not failed and not errors,
            'outlierTriangles': failed, 'errors': errors}


def main():
    catalog = json.loads((PREVIEW/'assets/catalog.json').read_text())
    png_raw = (REFERENCE/'rack-atlas.png').read_bytes()
    png = Image.open(io.BytesIO(png_raw)).convert('RGBA')
    pxo_raw = (REFERENCE/'rack-atlas.pxo').read_bytes()
    with zipfile.ZipFile(io.BytesIO(pxo_raw)) as archive:
        data = json.loads(archive.read('data.json'))
        cel = archive.read('image_data/frames/1/layer_1')
    native = {'pxoSha256': sha(pxo_raw), 'pngSha256': sha(png_raw),
              'size': [data['size_x'], data['size_y']], 'singleLayer': len(data['layers']) == 1,
              'singleFrame': len(data['frames']) == 1, 'nativeCelEqualsPng': cel == png.tobytes()}
    items = [audit_item(item, png.tobytes()) for item in catalog['items']]
    report = {'method': 'Actual GLB triangle position/UV inverse Jacobian, full hierarchical node world transforms, embedded base-colour image dimensions. Viewer leaves model transforms unchanged and uses metres for dimensions.',
              'reference': str(REFERENCE), 'declaredCatalogTexelsPerMetre': catalog['texelsPerMetre'],
              'tolerance': {'densityPxPerMetre': .002, 'orthogonalityDegrees': .02,
                            'note': 'Allows Float32 export rounding. Reports raw measured ranges rather than rounding them to 16.'},
              'nativePixelorama': native, 'items': items,
              'allActualReferenceTrianglesSquare16PxPerMetre': all(item['allSquare16PxPerMetre'] for item in items),
              'totalTriangles': sum(item['triangles'] for item in items),
              'allEmbeddedColoursEqualNativePng': all(t['rgbaEqualsNativePng'] for item in items for t in item['textures'])}
    (HERE/'furniture-reference-pixel-metric-audit.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps({'all16': report['allActualReferenceTrianglesSquare16PxPerMetre'],
                      'triangles': report['totalTriangles'], 'native': native,
                      'embeddedMatch': report['allEmbeddedColoursEqualNativePng'],
                      'items': [{key: item[key] for key in ['item', 'triangles', 'dimensionsMatch', 'metrics', 'allSquare16PxPerMetre']} for item in items]}, indent=2))


if __name__ == '__main__':
    main()
