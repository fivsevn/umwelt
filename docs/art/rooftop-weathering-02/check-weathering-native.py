"""Reopen both saved Blender files and verify a texture-only revision.

Read-only: this script never saves or exports a Blender file.
Run after revision and export:
  Blender --background --python check-weathering-native.py -- runtime_folder
The runtime folder defaults to the repository's rooftop/assets/background.
"""
import hashlib
import json
import runpy
import struct
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

HERE = Path(__file__).resolve().parent
helpers = runpy.run_path(str(HERE / "revise-native.py"), run_name="weathering_verification_helpers")
geometry_digest = helpers["digest_geometry"]
transform_state = helpers["scene_transform_state"]
field_name = helpers["field_name"]
CHANGE = helpers["CHANGE"]
UNIQUE_FIELDS = helpers["UNIQUE_FIELDS"]
runtime = Path(sys.argv[sys.argv.index("--") + 1]) if "--" in sys.argv and len(sys.argv) > sys.argv.index("--") + 1 else HERE.parents[2] / "rooftop/assets/background"


def packed_hash(name):
    return hashlib.sha256(bytes(bpy.data.images[name].packed_file.data)).hexdigest()


def exported_png_hash(name):
    """Account for the exporter's documented ancillary-metadata filtering."""
    raw = bytes(bpy.data.images[name].packed_file.data)
    output = bytearray(raw[:8])
    position = 8
    while position < len(raw):
        length = struct.unpack_from(">I", raw, position)[0]
        end = position + length + 12
        if raw[position + 4:position + 8] in {b"IHDR", b"PLTE", b"IDAT", b"IEND", b"tRNS", b"sRGB", b"gAMA", b"cHRM", b"pHYs"}:
            output.extend(raw[position:end])
        position = end
    return hashlib.sha256(output).hexdigest()


bpy.ops.wm.open_mainfile(filepath=str(HERE / "before.blend"))
before_geometry = geometry_digest(bpy.context.scene)
before_transforms = transform_state(bpy.context.scene)
before_distance = {name: packed_hash(name) for name in ("distance-facades.png", "distance-lights.png")}
before_export_distance = {name: exported_png_hash(name) for name in before_distance}
bpy.ops.wm.open_mainfile(filepath=str(HERE / "game-environment.blend"))
scene = bpy.context.scene
after_geometry = geometry_digest(scene)
assert before_geometry == after_geometry, "Native vertices, polygons, or occurrence transforms changed"
assert before_transforms == transform_state(scene), "Scene, camera, or light transform changed"
assert before_distance == {name: packed_hash(name) for name in before_distance}, "Distant bake changed"
assert int(scene["texelsPerMetre"]) == 16
image = bpy.data.images["terrace-book.png"]
assert tuple(image.size) == (1024, 1024)
assert bytes(image.packed_file.data) == (HERE / "terrace-book.png").read_bytes(), "Packed PNG differs from Pixelorama export"
report = json.loads((HERE / "native-weathering-check.json").read_text())
assert report["geometryBefore"] == before_geometry
assert report["geometryAfter"] == after_geometry

metres = json.loads(scene["texelMetresPerUnit"])
fields = json.loads(scene["textureFields"])
pixel_data = image.pixels[:]
sign_colours = {}
for name, (x, y, width, height) in fields.items():
    if not name.startswith("sign-"):
        continue
    colours = set()
    for py in range(y, y + height):
        for px in range(x, x + width):
            index = ((image.size[1] - 1 - py) * image.size[0] + px) * 4
            colours.add(tuple(round(pixel_data[index + c] * 255) for c in range(4)))
    sign_colours[name] = len(colours)
    assert len(colours) == 1, f"Old shop lettering is not fully cleared in {name}"
del pixel_data
scale = Matrix.Diagonal(Vector((*metres, 1)))
occurrences = []
for obj in scene.objects:
    if obj.instance_type == "COLLECTION" and obj.instance_collection:
        occurrences.extend((child, obj.matrix_world, obj.name) for child in obj.instance_collection.objects if child.type == "MESH")
    elif obj.type == "MESH":
        occurrences.append((obj, Matrix.Identity(4), "direct"))
max_uv_error = 0
uv_meshes = 0
boxes = 0
materials_seen = set()
floor_densities = []
for obj, outer, occurrence in occurrences:
    mesh = obj.data
    if mesh.materials[0].get("runtime_style") == "baked":
        continue
    for material in mesh.materials:
        if material in materials_seen:
            continue
        materials_seen.add(material)
        assert int(material["texelsPerMetre"]) == 16
        assert material.node_tree is not None
        for node in material.node_tree.nodes:
            if node.type == "TEX_IMAGE":
                assert node.image == image and node.interpolation == "Closest"
    if obj.get("runtime_box"):
        boxes += 1
        assert field_name(mesh.materials[0]) not in UNIQUE_FIELDS
        assert mesh.materials[0]["chart"] == "physical world face projection"
        continue
    uv_meshes += 1
    physical = scale @ CHANGE @ outer @ obj.matrix_world
    uv = mesh.uv_layers.active.data
    for polygon in mesh.polygons:
        name = field_name(mesh.materials[polygon.material_index])
        points = [physical @ mesh.vertices[mesh.loops[li].vertex_index].co for li in polygon.loop_indices]
        normal = (physical.to_3x3().inverted().transposed() @ polygon.normal).normalized()
        if abs(normal.y) > 0.98:
            u, v = Vector((1, 0, 0)), Vector((0, 0, 1))
        else:
            u = Vector((0, 1, 0)).cross(normal).normalized()
            v = normal.cross(u).normalized()
        expected = [Vector((p.dot(u) * 16, p.dot(v) * 16)) for p in points]
        if name in UNIQUE_FIELDS:
            origin = Vector((min(q.x for q in expected), min(q.y for q in expected)))
            expected = [q - origin for q in expected]
            actual = [uv[li].uv for li in polygon.loop_indices]
            assert min(q.x for q in actual) >= -0.001 and min(q.y for q in actual) >= -0.001
            assert max(q.x for q in actual) < fields[name][2]
            assert max(q.y for q in actual) < fields[name][3]
        for li, target in zip(polygon.loop_indices, expected):
            max_uv_error = max(max_uv_error, (uv[li].uv - target).length)
        if name in {"north-floor", "south-floor"}:
            # Floor charts use positive physical X/Z with a unique minimum.
            assert mesh.materials[polygon.material_index]["chart"] == "authored physical UV"
            actual = [uv[li].uv for li in polygon.loop_indices]
            for index, point in enumerate(points):
                length = (points[(index + 1) % len(points)] - point).length
                if length > 1e-6:
                    floor_densities.append((actual[(index + 1) % len(actual)] - actual[index]).length / length)
assert max_uv_error < 0.02, f"World projection and saved UV differ by {max_uv_error} pixels"
assert floor_densities and max(abs(d - 16) for d in floor_densities) < 0.001

main_instance = bpy.data.objects["Near row 04"]
roof = next(o for o in main_instance.instance_collection.objects if o.name.startswith("Native component 102594 · Near row 04"))
ridge = next(o for o in main_instance.instance_collection.objects if o.name.startswith("Native component 104606 · Near row 04"))
assert len(roof.data.polygons) == 2 and not roof.get("runtime_box")
assert [field_name(roof.data.materials[p.material_index]) for p in roof.data.polygons] == ["home-roof-north", "home-roof-south"]
roof_world = CHANGE @ main_instance.matrix_world @ roof.matrix_world
centres_z = [sum((roof_world @ roof.data.vertices[i].co).z for i in p.vertices) / len(p.vertices) for p in roof.data.polygons]
assert centres_z[0] < centres_z[1], "Roof materials are reversed"
assert field_name(ridge.data.materials[0]) == "home-roof-north" and not ridge.get("runtime_box")
for row in ("Near row 02", "Near row 03"):
    assert all(not field_name(m).startswith("home-roof-") for o in bpy.data.objects[row].instance_collection.objects if o.type == "MESH" for m in o.data.materials), "Neighbour roof was recoloured"

manifest_text = (runtime / "empty-rooftop.mjs").read_text()
manifest = json.loads(manifest_text.split("Object.freeze(", 1)[1].rsplit(");", 1)[0])
binary = (runtime / manifest["binary"]).read_bytes()
assert hashlib.sha256(binary).hexdigest() == manifest["sha256"]
assert manifest["texelsPerMetre"] == 16
assert manifest["texelMetresPerUnit"] == metres
assert manifest["stride"] == 8
assert manifest["sixthFloor"] == json.loads(scene["sixthFloor"])
assert manifest["row"] == json.loads(scene["row"])
roof_parts = {p["field"]: p for p in manifest["parts"] if p["field"].startswith("home-roof-")}
assert set(roof_parts) == {"home-roof-north", "home-roof-south"}
for name, part in roof_parts.items():
    assert part["rect"] == fields[name]
    assert part["mode"] == "meshInstances" and part["count"] == 1
    # Both actual mesh UV and material separation reach the runtime binary.
    values = struct.unpack_from("<" + "f" * part["vertices"] * 8, binary, part["offset"])
    assert min(values[6::8]) >= -0.001 and min(values[7::8]) >= -0.001
    assert max(values[6::8]) < fields[name][2] and max(values[7::8]) < fields[name][3]
for entry in manifest["textures"]:
    data = (runtime / entry["file"]).read_bytes()
    assert hashlib.sha256(data).hexdigest() == entry["sha256"]
    assert len(data) == entry["bytes"]
    if entry["file"] == "terrace-book.png":
        assert (entry["width"], entry["height"]) == (1024, 1024)
    else:
        # Exported PNG ancillary metadata is filtered, so packed bytes can
        # differ while visible image data remains the original export.
        assert entry["sha256"] == before_export_distance[entry["file"]]
result = {
    "savedSourceReopened": True,
    "geometryPreserved": before_geometry,
    "cameraLightAndSceneTransformsPreserved": True,
    "packedPixeloramaPngMatches": True,
    "clearedShopSignColourCounts": sign_colours,
    "texelsPerMetre": 16,
    "floorDensityRange": [min(floor_densities), max(floor_densities)],
    "worldChartVsStoredUvMaxErrorPixels": max_uv_error,
    "calibratedMeshOccurrences": uv_meshes,
    "sharedBoxOccurrences": boxes,
    "mainRoofSlopeDirectionCorrect": True,
    "mainRoofRuntimeFields": sorted(roof_parts),
    "neighbourRoofColoursPreserved": True,
    "runtimeBinaryAndTextureHashesMatch": True,
}
print("READ-ONLY SAVED SOURCE CHECK", json.dumps(result, ensure_ascii=False), flush=True)
