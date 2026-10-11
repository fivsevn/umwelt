"""Read-only verification of the reopened material revision and runtime export."""
import hashlib
import json
import runpy
from pathlib import Path

import bpy

HERE = Path(__file__).resolve().parent
RUNTIME = HERE.parents[2] / "rooftop/assets/background"
audit = runpy.run_path(str(HERE / "native-audit.py"), run_name="native_floor_check_helpers")
baseline = json.loads((HERE / "integration-baseline.json").read_text())
bpy.ops.wm.open_mainfile(filepath=str(HERE / "before.blend"))
before = audit["source_state"](bpy.context.scene)
before_pixels = audit["pixel_array"](bpy.data.images["terrace-book.png"])
before_distance = audit["packed_image_hashes"]()
bpy.ops.wm.open_mainfile(filepath=str(HERE / "game-environment.blend"))
after = audit["source_state"](bpy.context.scene)
assert before == after, "Saved geometry, UVs, transforms, materials, or cameras changed"
image = bpy.data.images["terrace-book.png"]
assert tuple(image.size) == (1024, 1024)
assert bytes(image.packed_file.data) == (HERE / "terrace-book.png").read_bytes()
assert before_distance == audit["packed_image_hashes"]()
scope = audit["compare_atlas_scope"](before_pixels, audit["pixel_array"](image))
manifest = audit["manifest"](RUNTIME / "empty-rooftop.mjs")
old_manifest = baseline["runtimeManifest"]
assert hashlib.sha256((RUNTIME / "empty-rooftop.bin").read_bytes()).hexdigest() == baseline["runtimeBinarySha256"] == manifest["sha256"], "Runtime geometry or UV payload changed"
for key in ("format", "stride", "cube", "parts", "triangles", "objects", "bytes", "sixthFloor", "row", "texelMetresPerUnit", "texelsPerMetre", "layers", "neighbourhood", "authoring"):
    assert manifest[key] == old_manifest[key], "Runtime geometry/material configuration changed: " + key
assert manifest["texelsPerMetre"] == 16
for texture in manifest["textures"]:
    raw = (RUNTIME / texture["file"]).read_bytes()
    assert hashlib.sha256(raw).hexdigest() == texture["sha256"]
    assert len(raw) == texture["bytes"]
    if texture["file"] == "terrace-book.png":
        assert raw == (HERE / "terrace-book.png").read_bytes(), "Runtime PNG differs from Pixelorama source"
        assert (texture["width"], texture["height"]) == (1024, 1024)
    else:
        old_texture = next(t for t in old_manifest["textures"] if t["file"] == texture["file"])
        assert texture == old_texture, "Distant image export changed"
result = {
    "savedSourceReopened": True,
    "sourceRevision": "rooftop-weathering-04",
    "sourceGeometrySha256": before["geometry"]["sha256"],
    "savedGeometrySha256": after["geometry"]["sha256"],
    "uvSha256": after["uvSha256"],
    "sourceGeometryUvsTransformsMaterialsAndCamerasExactlyPreserved": True,
    "packedPixeloramaPngMatches": True,
    "runtimePixeloramaPngMatches": True,
    "runtimeBinaryExactlyPreserved": True,
    "runtimeBinarySha256": manifest["sha256"],
    "texelsPerMetre": 16,
    "atlasScope": scope,
    "distantPackedAndRuntimeTexturesPreserved": True,
}
(HERE / "native-source-check.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
print("SAVED MATERIAL SOURCE AND RUNTIME CHECK", json.dumps(result, ensure_ascii=False), flush=True)
