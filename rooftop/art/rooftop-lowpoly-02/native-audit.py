"""Read-only native audit for the existing Blender scene and Pixelorama book.

No source-building helper is imported. Geometry, explicit/derived normals, UVs,
material bindings, object transforms, cameras, lights and render settings are
audited independently. Only the two packed colour atlas bytes may change; window mask stays exact.
"""
import hashlib
import json
import struct
from pathlib import Path

import bpy

HERE = Path(__file__).resolve().parent


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def manifest(path):
    text = Path(path).read_text()
    return json.loads(text.split("Object.freeze(", 1)[1].rsplit(");", 1)[0])


def value(item):
    if item is None or isinstance(item, (str, int, float, bool)):
        return item
    if isinstance(item, bpy.types.ID):
        return {"idType": item.bl_rna.identifier, "name": item.name}
    if hasattr(item, "to_dict"):
        return {key: value(val) for key, val in sorted(item.to_dict().items())}
    if hasattr(item, "items"):
        return {key: value(val) for key, val in sorted(item.items())}
    return [value(val) for val in item]


def properties(item):
    return {key: value(item[key]) for key in sorted(item.keys())}


def digest_json(data):
    return hashlib.sha256(json.dumps(data, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def matrix(mat):
    return [[float(v) for v in row] for row in mat]


def mesh_state(mesh):
    geometry = hashlib.sha256()
    normals = hashlib.sha256()
    uv = hashlib.sha256()
    material = hashlib.sha256()
    for vertex in mesh.vertices:
        geometry.update(struct.pack("<3d", *vertex.co))
        normals.update(struct.pack("<3d", *vertex.normal))
    for edge in mesh.edges:
        geometry.update(struct.pack("<2I", *edge.vertices))
    for polygon in mesh.polygons:
        geometry.update(struct.pack("<I", len(polygon.vertices)))
        geometry.update(struct.pack("<" + "I" * len(polygon.vertices), *polygon.vertices))
        normals.update(struct.pack("<3d?", *polygon.normal, polygon.use_smooth))
        material.update(struct.pack("<I", polygon.material_index))
    for loop in mesh.loops:
        geometry.update(struct.pack("<2I", loop.vertex_index, loop.edge_index))
    for corner in mesh.corner_normals:
        normals.update(struct.pack("<3d", *corner.vector))
    uv.update(struct.pack("<i", mesh.uv_layers.active_index))
    for layer in mesh.uv_layers:
        uv.update(layer.name.encode() + b"\0")
        for coordinate in layer.data:
            uv.update(struct.pack("<2d", *coordinate.uv))
    for mat in mesh.materials:
        material.update((mat.name if mat else "<empty>").encode() + b"\0")
    return {
        "geometrySha256": geometry.hexdigest(),
        "normalSha256": normals.hexdigest(),
        "uvSha256": uv.hexdigest(),
        "bindingSha256": material.hexdigest(),
        "vertices": len(mesh.vertices),
        "edges": len(mesh.edges),
        "polygons": len(mesh.polygons),
        "loops": len(mesh.loops),
        "properties": properties(mesh),
    }


def material_state(mat):
    nodes = []
    links = []
    if mat.node_tree:
        for node in sorted(mat.node_tree.nodes, key=lambda n: n.name):
            inputs = []
            for socket in node.inputs:
                if hasattr(socket, "default_value"):
                    inputs.append([socket.identifier, value(socket.default_value)])
            state = {"name": node.name, "type": node.bl_idname, "inputs": inputs}
            for key in ("operation", "blend_type", "interpolation", "projection", "extension", "uv_map", "attribute_name"):
                if hasattr(node, key):
                    state[key] = value(getattr(node, key))
            if hasattr(node, "image"):
                state["image"] = node.image.name if node.image else None
            nodes.append(state)
        links = sorted([link.from_node.name, link.from_socket.identifier, link.to_node.name, link.to_socket.identifier] for link in mat.node_tree.links)
    return {"properties": properties(mat), "useNodes": mat.use_nodes, "diffuseColor": list(mat.diffuse_color), "nodes": nodes, "links": links}


def source_state(scene):
    meshes = {mesh.name: mesh_state(mesh) for mesh in sorted(bpy.data.meshes, key=lambda m: m.name)}
    objects = {}
    for obj in sorted(bpy.data.objects, key=lambda o: o.name):
        objects[obj.name] = {
            "type": obj.type, "data": obj.data.name if obj.data else None,
            "matrixWorld": matrix(obj.matrix_world), "matrixLocal": matrix(obj.matrix_local),
            "parent": obj.parent.name if obj.parent else None,
            "instanceType": obj.instance_type,
            "instanceCollection": obj.instance_collection.name if obj.instance_collection else None,
            "hideRender": obj.hide_render, "hideViewport": obj.hide_viewport,
            "modifiers": [[mod.name, mod.type] for mod in obj.modifiers],
            "materials": [[slot.link, slot.material.name if slot.material else None] for slot in obj.material_slots],
            "properties": properties(obj),
        }
    cameras = {c.name: {key: value(getattr(c, key)) for key in ("type", "lens", "ortho_scale", "clip_start", "clip_end", "shift_x", "shift_y", "sensor_width", "sensor_height", "sensor_fit")} for c in bpy.data.cameras}
    lights = {light.name: {"type": light.type, "energy": light.energy, "color": list(light.color), "properties": properties(light)} for light in bpy.data.lights}
    materials = {mat.name: material_state(mat) for mat in sorted(bpy.data.materials, key=lambda m: m.name)}
    geometry = {name: {key: val for key, val in entry.items() if key not in ("uvSha256", "bindingSha256", "properties")} for name, entry in meshes.items()}
    return {
        "geometry": {"sha256": digest_json(geometry), "meshDataBlocks": len(meshes), "vertices": sum(m["vertices"] for m in meshes.values()), "polygons": sum(m["polygons"] for m in meshes.values())},
        "normalsSha256": digest_json({name: m["normalSha256"] for name, m in meshes.items()}),
        "uvSha256": digest_json({name: m["uvSha256"] for name, m in meshes.items()}),
        "materialAssignmentsSha256": digest_json({name: m["bindingSha256"] for name, m in meshes.items()}),
        "meshes": meshes, "objects": objects, "materials": materials,
        "cameras": cameras, "lights": lights,
        "collections": {c.name: {"objects": sorted(o.name for o in c.objects), "children": sorted(child.name for child in c.children), "hideRender": c.hide_render, "hideViewport": c.hide_viewport, "properties": properties(c)} for c in bpy.data.collections},
        "texelsPerMetre": int(scene["texelsPerMetre"]),
        "texelMetresPerUnit": scene["texelMetresPerUnit"],
        "textureFields": scene["textureFields"],
        "sceneProperties": properties(scene),
        "activeCamera": scene.camera.name if scene.camera else None,
        "engine": scene.render.engine,
        "viewTransform": scene.view_settings.view_transform, "look": scene.view_settings.look,
        "exposure": scene.view_settings.exposure, "gamma": scene.view_settings.gamma,
    }


def packed_image_hashes():
    result = {}
    for name in ("distance-facades.png", "distance-lights.png"):
        image = bpy.data.images[name]
        assert image.packed_file, "Distant image is not packed: " + name
        result[name] = hashlib.sha256(bytes(image.packed_file.data)).hexdigest()
    return result
