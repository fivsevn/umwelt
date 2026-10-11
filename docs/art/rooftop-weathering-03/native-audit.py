"""Read-only audit helpers for the ground-only Pixelorama revision."""
import hashlib
import json
import runpy
import struct
from pathlib import Path

import bpy
import numpy as np

HERE = Path(__file__).resolve().parent
helpers = runpy.run_path(str(HERE.parent / "rooftop-weathering-02/revise-native.py"), run_name="source_audit_helpers")
FLOORS = {"north-floor": [512, 0, 128, 256], "south-floor": [640, 0, 128, 128]}


def visible_meshes(scene):
    meshes = set()
    for obj in scene.objects:
        if obj.instance_type == "COLLECTION" and obj.instance_collection:
            meshes.update(child.data for child in obj.instance_collection.objects if child.type == "MESH")
        elif obj.type == "MESH":
            meshes.add(obj.data)
    return sorted(meshes, key=lambda mesh: mesh.name)


def uv_hash(scene):
    h = hashlib.sha256()
    for mesh in visible_meshes(scene):
        h.update(mesh.name.encode("utf-8") + b"\0")
        h.update(struct.pack("<i", mesh.uv_layers.active_index))
        for layer in mesh.uv_layers:
            h.update(layer.name.encode("utf-8") + b"\0")
            for coordinate in layer.data:
                h.update(struct.pack("<2f", *coordinate.uv))
    return h.hexdigest()


def source_state(scene):
    assignments = hashlib.sha256()
    for mesh in visible_meshes(scene):
        assignments.update(mesh.name.encode("utf-8") + b"\0")
        for material in mesh.materials:
            assignments.update(material.name.encode("utf-8") + b"\0")
        for polygon in mesh.polygons:
            assignments.update(struct.pack("<I", polygon.material_index))
    cameras = {
        c.name: {key: getattr(c, key) for key in ("type", "lens", "ortho_scale", "clip_start", "clip_end", "shift_x", "shift_y", "sensor_width", "sensor_height")}
        for c in bpy.data.cameras
    }
    lights = {
        light.name: {"type": light.type, "energy": light.energy, "color": list(light.color)}
        for light in bpy.data.lights
    }
    return {
        "geometry": helpers["digest_geometry"](scene),
        "transforms": helpers["scene_transform_state"](scene),
        "uvSha256": uv_hash(scene),
        "materialAssignmentsSha256": assignments.hexdigest(),
        "texelsPerMetre": int(scene["texelsPerMetre"]),
        "texelMetresPerUnit": scene["texelMetresPerUnit"],
        "textureFields": scene["textureFields"],
        "activeCamera": scene.camera.name if scene.camera else None,
        "cameras": cameras,
        "lights": lights,
        "engine": scene.render.engine,
        "viewTransform": scene.view_settings.view_transform,
        "look": scene.view_settings.look,
        "exposure": scene.view_settings.exposure,
        "gamma": scene.view_settings.gamma,
    }


def packed_image_hashes():
    return {
        name: hashlib.sha256(bytes(bpy.data.images[name].packed_file.data)).hexdigest()
        for name in ("distance-facades.png", "distance-lights.png")
    }


def pixel_array(image):
    data = np.empty(len(image.pixels), dtype=np.float32)
    image.pixels.foreach_get(data)
    return data.reshape((image.size[1], image.size[0], 4))


def compare_floor_scope(old, new):
    assert old.shape == new.shape == (1024, 1024, 4), "Atlas size changed"
    mask = np.ones((1024, 1024), dtype=bool)
    floor_changes = {}
    for name, (x, y, width, height) in FLOORS.items():
        rows = slice(1024 - y - height, 1024 - y)
        columns = slice(x, x + width)
        mask[rows, columns] = False
        old_region, new_region = old[rows, columns], new[rows, columns]
        changes = np.any(old_region != new_region, axis=2)
        floor_changes[name] = int(np.count_nonzero(changes))
        assert floor_changes[name] > 0, name + " painting has not changed"
    assert np.array_equal(old[mask], new[mask]), "A non-floor atlas region changed"
    digest = hashlib.sha256(old[mask].tobytes()).hexdigest()
    return {"allowedRects": FLOORS, "changedFloorPixels": floor_changes, "nonFloorPixelsExactlyPreserved": True, "nonFloorFloatRgbaSha256": digest}


def manifest(path):
    text = path.read_text()
    return json.loads(text.split("Object.freeze(", 1)[1].rsplit(");", 1)[0])
