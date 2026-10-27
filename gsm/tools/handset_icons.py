"""The final flat mark, projected as non-emissive pigment inside key plastic.

Blender owns the lighting; the encoder only BOX-samples the completed render.
No low-resolution icon is composited over the finished handset.
"""
import json
import math
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
RUNTIME = HERE.parent
KEYS = ('Home key', 'Stream concave key', 'Settings key')
IDS = ('home', 'stream', 'settings')
SIZES = (12, 15, 12)
GAZES = (-1, 0, 1)
SAFE_INSET = 2


def load_brand():
    return json.loads((RUNTIME / 'brand.mjs').read_text().split('=', 1)[1].strip().rstrip(';'))


def load_inks(path=RUNTIME / 'handsets.mjs'):
    inks = {}
    for fields in re.findall(r'\{([^{}]+)\}', Path(path).read_text()):
        identifier = re.search(r"\bid\s*:\s*['\"]([a-z0-9-]+)['\"]", fields)
        color = re.search(r"\bink\s*:\s*['\"](#[0-9a-fA-F]{6})['\"]", fields)
        if identifier and color:
            inks[identifier.group(1)] = color.group(1)
    return inks


def frame(wide=False):
    return ((660, 450), (165, 112)) if wide else ((470, 830), (118, 208))


def gaze_rows(brand, gaze):
    rows = [list(row) for row in brand['rows']]
    eyes = [(x, y) for left, top, w, h in brand['avatarEyes']
            for y in range(top, top + h) for x in range(left, left + w) if rows[y][x] == '.']
    for x, y in eyes:
        rows[y][x] = '#'
    for x, y in eyes:
        if not 0 <= x + gaze < len(rows[y]):
            raise ValueError('Brand eye leaves the master canvas')
        rows[y][x + gaze] = '.'
    return rows


def _inside(x, y, outline):
    result, previous = False, outline[-1]
    for point in outline:
        ax, ay = previous
        bx, by = point
        if (ay > y) != (by > y) and x < ax + (y - ay) * (bx - ax) / (by - ay):
            result = not result
        previous = point
    return result


def control_projection(wide, outline, export=False):
    """Measure the actual key caps, never their old HTML hit rectangles."""
    import bpy
    from mathutils import Vector
    from mathutils.bvhtree import BVHTree
    logical, native = frame(wide)
    lw, lh = logical
    nw, nh = native
    def point(x, y):
        return Vector(((x / nw - .5) * lw / 100, (.5 - y / nh) * lh / 100, 10))
    def save_mask(filename, mask):
        image = bpy.data.images.new(filename, width=nw, height=nh, alpha=True)
        image.colorspace_settings.name = 'Non-Color'
        image.pixels = [c for y in reversed(range(nh)) for x in range(nw)
                        for c in (mask[y][x], mask[y][x], mask[y][x], 1)]
        image.filepath_raw, image.file_format = str(HERE / 'handset-source' / filename), 'PNG'
        image.save()
        bpy.data.images.remove(image)
    orientation = 'wide' if wide else 'portrait'
    data = {'orientation': orientation, 'nativeSize': native, 'logicalImageSize': logical,
            'bodyMarginLogical': 20, 'keys': [], 'ink': {'source': '../../brand.mjs',
            'sizes': SIZES, 'gazes': GAZES, 'safeInsetNative': SAFE_INSET}}
    masks = []
    deps = bpy.context.evaluated_depsgraph_get()
    for identifier, name in zip(IDS, KEYS):
        obj = bpy.data.objects[name]
        bvh = BVHTree.FromObject(obj, deps)
        coords = [obj.matrix_world @ v.co for v in obj.data.vertices]
        bounds = [(min(v.x for v in coords) * 100 / lw + .5) * nw,
                  (.5 - max(v.y for v in coords) * 100 / lh) * nh,
                  (max(v.x for v in coords) * 100 / lw + .5) * nw,
                  (.5 - min(v.y for v in coords) * 100 / lh) * nh]
        mask = [[0] * nw for _ in range(nh)]
        total = sx = sy = 0
        for y in range(math.floor(bounds[1]), math.ceil(bounds[3])):
            for x in range(math.floor(bounds[0]), math.ceil(bounds[2])):
                mask[y][x] = int(bvh.ray_cast(point(x + .5, y + .5), Vector((0, 0, -1)))[0] is not None)
                for iy in range(4):
                    for ix in range(4):
                        px, py = x + (ix + .5) / 4, y + (iy + .5) / 4
                        if bvh.ray_cast(point(px, py), Vector((0, 0, -1)))[0] is not None:
                            total += 1
                            sx += px
                            sy += py
        occupied = [(x, y) for y, row in enumerate(mask) for x, v in enumerate(row) if v]
        box = [min(x for x, y in occupied), min(y for x, y in occupied),
               max(x for x, y in occupied) + 1, max(y for x, y in occupied) + 1]
        center = [sx / total, sy / total]
        filename = f'controls-{orientation}-{identifier}-mask.png'
        if export:
            save_mask(filename, mask)
        data['keys'].append({'id': identifier, 'object': name, 'mask': filename,
             'geometryBoundsNative': bounds, 'maskBoundsNative': box, 'centroidNative': center,
             'areaNative': total / 16, 'bodyBoundsLogical': [box[0] * lw / nw - 20, box[1] * lh / nh - 20,
                                                           box[2] * lw / nw - 20, box[3] * lh / nh - 20],
             'bodyCenterLogical': [center[0] * lw / nw - 20, center[1] * lh / nh - 20]})
        masks.append(mask)
    slot = [[int(_inside(point(x + .5, y + .5).x, point(x + .5, y + .5).y, outline))
             for x in range(nw)] for y in range(nh)]
    data['slotMask'] = f'controls-{orientation}-slot-mask.png'
    if export:
        save_mask(data['slotMask'], slot)
    return data, masks


def _ink_atlas(brand, data, masks, raw_size):
    """Scale only on the raw Blender grid; preserve the original 16px eye holes."""
    lw, lh = data['logicalImageSize']
    nw, nh = data['nativeSize']
    rw, rh = raw_size
    atlas = bytearray(rw * rh)
    centers = ((37, 180), (59, 180), (81, 180)) if data['orientation'] == 'portrait' else None
    placements = []
    for index, (size, gaze, cap) in enumerate(zip(SIZES, GAZES, masks)):
        rows = gaze_rows(brand, gaze)
        extent = round(size * 4 * rw / lw)
        # Match the authoring rasterizer's nearest-neighbour center accumulation.
        indices = []
        source = .5 * 16 / extent
        for _ in range(extent):
            indices.append(min(15, int(source)))
            source += 16 / extent
        cy = centers[index][1] if centers else round(data['keys'][index]['centroidNative'][1])
        y0 = round(cy * rh / nh - extent * 8.5 / 16)
        def support(x0):
            pixels = set()
            for gy in range(extent):
                for gx in range(extent):
                    if rows[indices[gy]][indices[gx]] == '#':
                        for y in range(math.floor((y0 + gy) * nh / rh), math.ceil((y0 + gy + 1) * nh / rh)):
                            for x in range(math.floor((x0 + gx) * nw / rw), math.ceil((x0 + gx + 1) * nw / rw)):
                                pixels.add((x, y))
            return pixels
        preferred = round((centers[index][0] if centers else data['keys'][index]['centroidNative'][0]) * rw / nw - extent / 2)
        candidates = [preferred] if centers else range(preferred - 16, preferred + 17)
        valid = []
        for x0 in candidates:
            pixels = support(x0)
            if all(0 <= x + dx < nw and 0 <= y + dy < nh and cap[y + dy][x + dx]
                   for x, y in pixels for dy in range(-SAFE_INSET, SAFE_INSET + 1)
                   for dx in range(-SAFE_INSET, SAFE_INSET + 1)):
                valid.append(x0)
        if not valid:
            raise ValueError(f"{data['orientation']} {IDS[index]} cannot preserve the approved ink with two-texel clearance")
        x0 = min(valid, key=lambda x: (abs(x - preferred), x))
        for gy in range(extent):
            for gx in range(extent):
                if rows[indices[gy]][indices[gx]] == '#':
                    atlas[(y0 + gy) * rw + x0 + gx] = 1
        placements.append({'centerNative': [(x0 + extent / 2) * nw / rw, cy], 'size': size,
                           'gaze': gaze, 'rawOrigin': [x0, y0], 'rawSize': extent})
    data['ink']['placements'] = placements
    return atlas


def apply_hardware_ink(theme, wide, outline, export=False):
    import bpy
    data, masks = control_projection(wide, outline, export)
    scene = bpy.context.scene
    rw, rh = scene.render.resolution_x, scene.render.resolution_y
    atlas = _ink_atlas(load_brand(), data, masks, (rw, rh))
    image = bpy.data.images.new('Flat brand print atlas', width=rw, height=rh, alpha=True)
    image.colorspace_settings.name = 'Non-Color'
    image.pixels = [c for y in reversed(range(rh)) for x in range(rw)
                    for c in (atlas[y * rw + x],) * 3 + (1,)]
    image.pack()
    keys = [bpy.data.objects[name] for name in KEYS]
    original_material = keys[0].data.materials[0]
    material = original_material.copy()
    material.name = f'{theme} printed key plastic'
    for key in keys:
        key.data.materials[0] = material
    nodes, links = material.node_tree.nodes, material.node_tree.links
    surface = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')
    base = surface.inputs['Base Color']
    original = base.links[0].from_socket if base.is_linked else None
    mix = nodes.new('ShaderNodeMixRGB');mix.name = 'Flat brand pigment';mix.blend_type = 'MIX'
    mix.inputs[1].default_value = base.default_value
    if original:
        links.new(original, mix.inputs[1])
    color = load_inks()[theme].lstrip('#')
    def linear(v):
        return v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4
    mix.inputs[2].default_value = tuple(linear(int(color[i:i + 2], 16) / 255) for i in (0, 2, 4)) + (1,)
    position = nodes.new('ShaderNodeNewGeometry');position.name = 'Flat world projection'
    scale = nodes.new('ShaderNodeVectorMath');scale.operation = 'MULTIPLY'
    scale.inputs[1].default_value = (100 / data['logicalImageSize'][0], 100 / data['logicalImageSize'][1], 0)
    offset = nodes.new('ShaderNodeVectorMath');offset.operation = 'ADD';offset.inputs[1].default_value = (.5, .5, 0)
    texture = nodes.new('ShaderNodeTexImage');texture.name = 'Flat print mask';texture.image = image
    texture.interpolation, texture.extension = 'Closest', 'CLIP'
    links.new(position.outputs['Position'], scale.inputs[0]);links.new(scale.outputs['Vector'], offset.inputs[0])
    links.new(offset.outputs['Vector'], texture.inputs['Vector']);links.new(texture.outputs['Color'], mix.inputs[0])
    links.new(mix.outputs['Color'], base)
    surface.inputs['Emission Strength'].default_value = 0
    if not original_material.users:
        bpy.data.materials.remove(original_material)
    if export:
        target = HERE / 'handset-source' / f"controls-{data['orientation']}.json"
        target.write_text(json.dumps(data, indent=2) + '\n')
    return data
