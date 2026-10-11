"""Apply the Pixelorama weathering book to the existing native environment.

Run only after Pixelorama has saved terrace-book.png at 1024 x 1024:
  Blender --background --python revise-native.py

No mesh vertices, polygons, visible object transforms, camera, or light is
changed. Independent UV copies calibrate collection instances with different
world scales. Box instances continue to share geometry and use physical world
projection in both Blender and the browser. The two main roof slopes remain
the original two polygons and receive separate material slots.
"""
import hashlib
import json
import math
import struct
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

HERE = Path(__file__).resolve().parent
SOURCE = HERE / "before.blend"
TARGET = HERE / "game-environment.blend"
PAINTING = HERE / "terrace-book.png"
TEXELS = 16
FIELD_UPDATES = {
    "north-floor": [512, 0, 128, 256],
    "south-floor": [640, 0, 128, 128],
    "plaster": [0, 512, 768, 64],
    "stained-plaster": [0, 576, 768, 64],
    "home-roof-north": [0, 640, 704, 128],
    "home-roof-south": [0, 768, 704, 128],
    "roof": [0, 896, 704, 128],
    "metal": [768, 0, 256, 64],
    "rust-iron": [768, 64, 256, 64],
    "cap": [768, 128, 256, 64],
    "cement": [768, 192, 256, 64],
    "facade": [768, 256, 256, 256],
}
UNIQUE_FIELDS = {
    "north-floor", "south-floor", "home-roof-north", "home-roof-south"
}
CHANGE = Matrix(((1, 0, 0, 0), (0, 0, 1, 0), (0, -1, 0, 0), (0, 0, 0, 1)))


def digest_geometry(scene):
    """Hash every rendered native mesh occurrence, independent of its name.

    Ordered local vertices and polygon topology plus the complete world matrix
    capture geometry exactly. Material and UV changes are deliberately omitted.
    Sorting occurrence digests permits harmless collection/object copies.
    """
    native_hashes = {}
    occurrences = []
    occurrence_count = 0
    vertex_count = 0
    polygon_count = 0

    def append_object(obj, outer):
        nonlocal occurrence_count, vertex_count, polygon_count
        mesh = obj.data
        if mesh not in native_hashes:
            h = hashlib.sha256()
            for vertex in mesh.vertices:
                h.update(struct.pack("<3d", *vertex.co))
            for polygon in mesh.polygons:
                h.update(struct.pack("<I", len(polygon.vertices)))
                h.update(struct.pack("<" + "I" * len(polygon.vertices), *polygon.vertices))
            native_hashes[mesh] = h.digest()
        world = outer @ obj.matrix_world
        h = hashlib.sha256(native_hashes[mesh])
        # No transform is recomputed or rounded. Exact float values must match.
        h.update(struct.pack("<16d", *(v for row in world for v in row)))
        occurrences.append(h.digest())
        occurrence_count += 1
        vertex_count += len(mesh.vertices)
        polygon_count += len(mesh.polygons)

    for obj in scene.objects:
        if obj.instance_type == "COLLECTION" and obj.instance_collection:
            for child in obj.instance_collection.objects:
                if child.type == "MESH":
                    append_object(child, obj.matrix_world)
        elif obj.type == "MESH":
            append_object(obj, Matrix.Identity(4))
    h = hashlib.sha256()
    for value in sorted(occurrences):
        h.update(value)
    return {
        "sha256": h.hexdigest(),
        "meshOccurrences": occurrence_count,
        "vertices": vertex_count,
        "polygons": polygon_count,
    }


def scene_transform_state(scene):
    return {
        o.name: {
            "type": o.type,
            "matrix": [[float(v) for v in row] for row in o.matrix_world],
            "hideRender": bool(o.hide_render),
            "hideViewport": bool(o.hide_viewport),
        }
        for o in scene.objects
    }


def field_name(material):
    return material.get("runtime_field", material.name)


def make_world_chart(nodes, links, metre_scale):
    """The browser's physical face projection in Blender XYZ coordinates."""
    geometry = nodes.new("ShaderNodeNewGeometry")
    physical_position = nodes.new("ShaderNodeVectorMath")
    physical_position.operation = "MULTIPLY"
    physical_position.inputs[1].default_value = metre_scale
    links.new(geometry.outputs["Position"], physical_position.inputs[0])
    corrected_normal = nodes.new("ShaderNodeVectorMath")
    corrected_normal.operation = "DIVIDE"
    corrected_normal.inputs[1].default_value = metre_scale
    links.new(geometry.outputs["True Normal"], corrected_normal.inputs[0])
    normal = nodes.new("ShaderNodeVectorMath")
    normal.operation = "NORMALIZE"
    links.new(corrected_normal.outputs["Vector"], normal.inputs[0])
    normal_axes = nodes.new("ShaderNodeSeparateXYZ")
    links.new(normal.outputs["Vector"], normal_axes.inputs[0])
    absolute = nodes.new("ShaderNodeMath")
    absolute.operation = "ABSOLUTE"
    links.new(normal_axes.outputs["Z"], absolute.inputs[0])
    is_top = nodes.new("ShaderNodeMath")
    is_top.operation = "GREATER_THAN"
    is_top.inputs[1].default_value = 0.98
    links.new(absolute.outputs[0], is_top.inputs[0])
    is_wall = nodes.new("ShaderNodeMath")
    is_wall.operation = "SUBTRACT"
    is_wall.inputs[0].default_value = 1
    links.new(is_top.outputs[0], is_wall.inputs[1])

    def vector_math(operation, left, right=None):
        node = nodes.new("ShaderNodeVectorMath")
        node.operation = operation
        if isinstance(left, tuple):
            node.inputs[0].default_value = left
        else:
            links.new(left, node.inputs[0])
        if right is not None:
            if isinstance(right, tuple):
                node.inputs[1].default_value = right
            else:
                links.new(right, node.inputs[1])
        return node.outputs["Vector"]

    wall_u = vector_math("NORMALIZE", vector_math("CROSS_PRODUCT", (0, 0, 1), normal.outputs["Vector"]))
    wall_v = vector_math("NORMALIZE", vector_math("CROSS_PRODUCT", normal.outputs["Vector"], wall_u))

    def choose_basis(wall, top):
        top_part = nodes.new("ShaderNodeVectorMath")
        top_part.operation = "SCALE"
        top_part.inputs[0].default_value = top
        links.new(is_top.outputs[0], top_part.inputs[3])
        wall_part = nodes.new("ShaderNodeVectorMath")
        wall_part.operation = "SCALE"
        links.new(wall, wall_part.inputs[0])
        links.new(is_wall.outputs[0], wall_part.inputs[3])
        return vector_math("ADD", top_part.outputs["Vector"], wall_part.outputs["Vector"])

    u = choose_basis(wall_u, (1, 0, 0))
    # Browser top UV Y is physical game Z, or minus physical Blender Y.
    v = choose_basis(wall_v, (0, -1, 0))
    combine = nodes.new("ShaderNodeCombineXYZ")
    for basis, target in ((u, "X"), (v, "Y")):
        dot = nodes.new("ShaderNodeVectorMath")
        dot.operation = "DOT_PRODUCT"
        links.new(physical_position.outputs["Vector"], dot.inputs[0])
        links.new(basis, dot.inputs[1])
        scale = nodes.new("ShaderNodeMath")
        scale.operation = "MULTIPLY"
        scale.inputs[1].default_value = TEXELS
        links.new(dot.outputs["Value"], scale.inputs[0])
        links.new(scale.outputs[0], combine.inputs[target])
    return combine.outputs["Vector"]


def rebuild_material(material, name, image, fields, metre_scale):
    material.use_nodes = True
    material["runtime_field"] = name
    material["texelsPerMetre"] = TEXELS
    material["pixeloramaSource"] = "terrace-book.pxo"
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    if name in UNIQUE_FIELDS:
        coordinates = nodes.new("ShaderNodeTexCoord")
        chart = coordinates.outputs["UV"]
        material["chart"] = "authored physical UV"
    else:
        chart = make_world_chart(nodes, links, metre_scale)
        material["chart"] = "physical world face projection"
    x, y, width, height = fields[name]
    quantize = nodes.new("ShaderNodeVectorMath")
    quantize.operation = "FLOOR"
    links.new(chart, quantize.inputs[0])
    divide = nodes.new("ShaderNodeVectorMath")
    divide.operation = "DIVIDE"
    divide.inputs[1].default_value = (width, height, 1)
    links.new(quantize.outputs["Vector"], divide.inputs[0])
    fraction = nodes.new("ShaderNodeVectorMath")
    fraction.operation = "FRACTION"
    links.new(divide.outputs["Vector"], fraction.inputs[0])
    restore = nodes.new("ShaderNodeVectorMath")
    restore.operation = "MULTIPLY"
    restore.inputs[1].default_value = (width, height, 1)
    links.new(fraction.outputs["Vector"], restore.inputs[0])
    center = nodes.new("ShaderNodeVectorMath")
    center.operation = "ADD"
    center.inputs[1].default_value = (0.5, 0.5, 0)
    links.new(restore.outputs["Vector"], center.inputs[0])
    normalize = nodes.new("ShaderNodeVectorMath")
    normalize.operation = "MULTIPLY"
    normalize.inputs[1].default_value = (1 / image.size[0], -1 / image.size[1], 1)
    links.new(center.outputs["Vector"], normalize.inputs[0])
    offset = nodes.new("ShaderNodeVectorMath")
    offset.operation = "ADD"
    offset.inputs[1].default_value = (x / image.size[0], 1 - y / image.size[1], 0)
    links.new(normalize.outputs["Vector"], offset.inputs[0])
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    texture.interpolation = "Closest"
    texture.extension = "EXTEND"
    links.new(offset.outputs["Vector"], texture.inputs["Vector"])
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Roughness"].default_value = 0.95
    links.new(texture.outputs["Color"], bsdf.inputs["Base Color"])
    output = nodes.new("ShaderNodeOutputMaterial")
    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])


def calibrate_uv(obj, outer_world, metre_scale, fields, reports):
    mesh = obj.data
    if not mesh.materials or mesh.materials[0].get("runtime_style") == "baked":
        return
    layer = mesh.uv_layers.active or mesh.uv_layers.new(name="Physical 16 px metre")
    layer.name = "Physical 16 px metre"
    world = CHANGE @ outer_world @ obj.matrix_world
    physical = Matrix.Diagonal(Vector((*metre_scale, 1))) @ world
    density = []
    for polygon in mesh.polygons:
        name = field_name(mesh.materials[polygon.material_index])
        points = [physical @ mesh.vertices[mesh.loops[li].vertex_index].co for li in polygon.loop_indices]
        normal = (physical.to_3x3().inverted().transposed() @ polygon.normal).normalized()
        if abs(normal.y) > 0.98:
            u, v = Vector((1, 0, 0)), Vector((0, 0, 1))
        else:
            u = Vector((0, 1, 0)).cross(normal).normalized()
            v = normal.cross(u).normalized()
        coords = [Vector((p.dot(u) * TEXELS, p.dot(v) * TEXELS)) for p in points]
        if name in UNIQUE_FIELDS:
            min_x = min(q.x for q in coords)
            min_y = min(q.y for q in coords)
            coords = [q - Vector((min_x, min_y)) for q in coords]
            width, height = fields[name][2:]
            if max(q.x for q in coords) >= width or max(q.y for q in coords) >= height:
                raise ValueError(f"Unique {name} painting is too small for {obj.name}")
        for li, coordinate in zip(polygon.loop_indices, coords):
            layer.data[li].uv = coordinate
        for index, point in enumerate(points):
            distance = (points[(index + 1) % len(points)] - point).length
            if distance > 1e-6:
                density.append((coords[(index + 1) % len(coords)] - coords[index]).length / distance)
    if density:
        reports.append({"object": obj.name, "field": field_name(mesh.materials[0]), "minPxPerMetre": min(density), "maxPxPerMetre": max(density)})


def main():
    if not PAINTING.is_file():
        raise FileNotFoundError("Export the completed Pixelorama painting to " + str(PAINTING))
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    scene = bpy.context.scene
    before = digest_geometry(scene)
    transforms = scene_transform_state(scene)
    original_distance_hashes = {
        name: hashlib.sha256(bytes(bpy.data.images[name].packed_file.data)).hexdigest()
        for name in ("distance-facades.png", "distance-lights.png")
    }
    metres_game = json.loads(scene["texelMetresPerUnit"])
    metres_blender = (metres_game[0], metres_game[2], metres_game[1])
    fields = json.loads(scene["textureFields"])
    fields.update(FIELD_UPDATES)
    image = bpy.data.images.get("terrace-book.png")
    if image is None:
        raise ValueError("Original packed Pixelorama book is missing")
    # Load rather than reload so the old packed PNG cannot mask the new export.
    fresh = bpy.data.images.load(str(PAINTING), check_existing=False)
    if tuple(fresh.size) != (1024, 1024):
        raise ValueError("Pixelorama painting must be exactly 1024 x 1024")
    fresh.name = "Weathering Pixelorama export"
    fresh.colorspace_settings.name = "sRGB"
    fresh.pack()
    image.user_remap(fresh)
    bpy.data.images.remove(image)
    fresh.name = "terrace-book.png"
    fresh.filepath = "//terrace-book.png"
    for name in fields:
        material = bpy.data.materials.get(name)
        if material or name in FIELD_UPDATES:
            material = material or bpy.data.materials.new(name)
            rebuild_material(material, name, fresh, fields, metres_blender)
    uv_reports = []
    copied_collections = []
    main_instance = bpy.data.objects.get("Near row 04")
    if main_instance is None or main_instance.instance_collection.name != "Home row — native asset":
        raise ValueError("Expected original main-building instance was not found")
    main_roof_found = main_ridge_found = False
    for instance in list(scene.objects):
        if instance.instance_type != "COLLECTION" or not instance.instance_collection:
            continue
        original = instance.instance_collection
        if original.instance_offset.length > 1e-8:
            raise ValueError("Existing exporter requires zero collection instance offsets: " + original.name)
        is_main = instance == main_instance
        needs_uv_copy = any(o.type == "MESH" and not o.get("runtime_box") and not o.data.materials[0].get("runtime_style") == "baked" for o in original.objects)
        if not is_main and not needs_uv_copy:
            continue
        calibrated = bpy.data.collections.new(original.name + " · " + instance.name + " physical UV")
        calibrated.instance_offset = original.instance_offset
        for obj in original.objects:
            needs_copy = obj.type == "MESH" and (not obj.get("runtime_box") or (is_main and obj.name == "Native component 104606"))
            if needs_copy:
                copy = obj.copy()
                copy.data = obj.data.copy()
                copy.name = obj.name + " · " + instance.name
                if is_main and obj.name == "Native component 102594":
                    if len(copy.data.polygons) != 2:
                        raise ValueError("The main pitched roof must retain its two original polygons")
                    copy.data.materials.clear()
                    copy.data.materials.append(bpy.data.materials["home-roof-north"])
                    copy.data.materials.append(bpy.data.materials["home-roof-south"])
                    for poly in copy.data.polygons:
                        # Original polygon 0 is north; polygon 1 is south.
                        poly.material_index = poly.index
                    main_roof_found = True
                elif is_main and obj.name == "Native component 104606":
                    copy.data.materials.clear()
                    copy.data.materials.append(bpy.data.materials["home-roof-north"])
                    # The ridge is a 12-triangle regular mesh with unique UV.
                    copy["runtime_box"] = False
                    main_ridge_found = True
                calibrated.objects.link(copy)
                if copy.type == "MESH":
                    calibrate_uv(copy, instance.matrix_world, metres_game, fields, uv_reports)
            else:
                # Shared boxes remain efficient; their charts use final world
                # position, so each instance's scale is accounted for natively.
                calibrated.objects.link(obj)
        instance.instance_collection = calibrated
        copied_collections.append({"instance": instance.name, "source": original.name, "calibrated": calibrated.name})
    if not (main_roof_found and main_ridge_found):
        raise ValueError("Main roof and ridge were not independently recoloured")
    for obj in scene.objects:
        if obj.type == "MESH" and not obj.get("runtime_box"):
            # Direct mesh datablocks are not shared with a visible instance.
            obj.data = obj.data.copy()
            calibrate_uv(obj, Matrix.Identity(4), metres_game, fields, uv_reports)
    scene["textureFields"] = json.dumps(fields, ensure_ascii=False)
    scene["texelsPerMetre"] = TEXELS
    scene["weatheringRevision"] = "Pixelorama texture and metric UV pass; native geometry preserved"
    bpy.context.view_layer.update()
    after = digest_geometry(scene)
    if before != after:
        raise AssertionError("Rendered geometry or occurrence transforms changed")
    if transforms != scene_transform_state(scene):
        raise AssertionError("Scene object, camera, or light transforms changed")
    # Far facade and light-mask images were neither reloaded nor repainted.
    distance_hashes = {
        name: hashlib.sha256(bytes(bpy.data.images[name].packed_file.data)).hexdigest()
        for name in ("distance-facades.png", "distance-lights.png")
    }
    if distance_hashes != original_distance_hashes:
        raise AssertionError("Existing distant facade or lamp-mask image changed")
    bpy.ops.wm.save_as_mainfile(filepath=str(TARGET), compress=True)
    report = {
        "software": "Blender",
        "version": bpy.app.version_string,
        "source": "before.blend",
        "savedSource": "game-environment.blend",
        "geometryBefore": before,
        "geometryAfter": after,
        "allRenderedGeometryPreserved": True,
        "sceneCameraLightTransformsPreserved": True,
        "texelsPerMetre": TEXELS,
        "textureDimensions": list(fresh.size),
        "pixeloramaPngSha256": hashlib.sha256(PAINTING.read_bytes()).hexdigest(),
        "packedDistanceHashesPreserved": distance_hashes,
        "independentInstanceCharts": copied_collections,
        "uvCharts": uv_reports,
    }
    (HERE / "native-weathering-check.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print("TEXTURE-ONLY NATIVE REVISION", json.dumps({k: v for k, v in report.items() if k not in {"uvCharts", "independentInstanceCharts"}}), flush=True)


if __name__ == "__main__":
    main()
