"""Pack the scoped Pixelorama material atlas without revising native geometry.

The saved source is based on the current weathering-02 source snapshot.
This script does not rebuild or recalibrate any mesh, UV, material or camera.
Usage: Blender --background --python replace-atlas.py
"""
import hashlib
import json
import runpy
from pathlib import Path

import bpy

HERE = Path(__file__).resolve().parent
audit = runpy.run_path(str(HERE / "native-audit.py"), run_name="native_atlas_audit")
PNG = HERE / "terrace-book.png"
PXO = HERE / "terrace-book.pxo"
SOURCE = HERE / "before.blend"
TARGET = HERE / "game-environment.blend"
for path in (PNG, PXO, SOURCE):
    if not path.is_file():
        raise FileNotFoundError("Completed source is required: " + str(path))
baseline = json.loads((HERE / "integration-baseline.json").read_text())
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == baseline["nativeSha256"]
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
scene = bpy.context.scene
before = audit["source_state"](scene)
assert before["texelsPerMetre"] == 16
distance_before = audit["packed_image_hashes"]()
original = bpy.data.images["terrace-book.png"]
assert bytes(original.packed_file.data) == (HERE / "before-terrace-book.png").read_bytes()
old_pixels = audit["pixel_array"](original)
fresh = bpy.data.images.load(str(PNG), check_existing=False)
fresh.colorspace_settings.name = original.colorspace_settings.name
fresh.alpha_mode = original.alpha_mode
scope = audit["compare_atlas_scope"](old_pixels, audit["pixel_array"](fresh))
fresh.pack()
original.user_remap(fresh)
bpy.data.images.remove(original)
fresh.name = "terrace-book.png"
fresh.filepath = "//terrace-book.png"
assert bytes(fresh.packed_file.data) == PNG.read_bytes()
after = audit["source_state"](scene)
assert before == after, "Native source state changed outside packed atlas"
assert distance_before == audit["packed_image_hashes"](), "A distant texture changed"
bpy.ops.wm.save_as_mainfile(filepath=str(TARGET), compress=True)
report = {
    "software": "Blender",
    "version": bpy.app.version_string,
    "sourceRevision": "rooftop-weathering-03",
    "sourceSha256": baseline["nativeSha256"],
    "savedSource": "game-environment.blend",
    "geometryBefore": before["geometry"],
    "geometryAfter": after["geometry"],
    "allRenderedGeometryPreserved": True,
    "allVisibleObjectTransformsPreserved": True,
    "allUvsExactlyPreserved": True,
    "uvSha256": after["uvSha256"],
    "materialAssignmentsSha256": after["materialAssignmentsSha256"],
    "camerasLightsAndColorManagementPreserved": True,
    "texelsPerMetre": 16,
    "packedPixeloramaPngMatches": True,
    "pixeloramaPngSha256": hashlib.sha256(PNG.read_bytes()).hexdigest(),
    "pixeloramaPxoSha256": hashlib.sha256(PXO.read_bytes()).hexdigest(),
    "distanceImageHashesPreserved": distance_before,
    "atlasScope": scope,
}
(HERE / "native-texture-integration.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
print("EXISTING NATIVE SOURCE ATLAS UPDATE", json.dumps(report, ensure_ascii=False), flush=True)
