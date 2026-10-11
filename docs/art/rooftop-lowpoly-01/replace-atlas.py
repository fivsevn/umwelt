"""Pack the completed genuine Pixelorama PNG into a copy of weathering-07.

Does not redraw, rebuild, recalibrate, simplify or reposition any native data.
Usage: Blender --background --python-exit-code 1 --python replace-atlas.py
"""
import hashlib
import json
import runpy
from pathlib import Path

import bpy

HERE = Path(__file__).resolve().parent
audit = runpy.run_path(str(HERE / "native-audit.py"), run_name="native_atlas_audit")
PNG = HERE / "terrace-book.png"
FAR_PNG = HERE / "distance-facades.png"
SOURCE = HERE / "before.blend"
TARGET = HERE / "game-environment.blend"
for path in (PNG, FAR_PNG, SOURCE, HERE / "terrace-book.pxo", HERE / "distance-facades.pxo"):
    if not path.is_file():
        raise FileNotFoundError("Completed native source is required: " + str(path))
baseline = json.loads((HERE / "integration-baseline.json").read_text())
assert audit["sha256"](SOURCE) == baseline["nativeSha256"]
assert audit["sha256"](HERE / "before-terrace-book.png") == baseline["pixeloramaPngSha256"]
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
scene = bpy.context.scene
before = audit["source_state"](scene)
assert before["texelsPerMetre"] == 16
distance_before = audit["packed_image_hashes"]()
original = bpy.data.images["terrace-book.png"]
assert original.packed_file
assert bytes(original.packed_file.data) == (HERE / "before-terrace-book.png").read_bytes()
assert tuple(original.size) == (1024, 1024)
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
far_original = bpy.data.images["distance-facades.png"]
assert bytes(far_original.packed_file.data) == (HERE / "before-distance-facades.png").read_bytes()
assert tuple(far_original.size) == (2048, 2048)
far_pixels = audit["pixel_array"](far_original)
far_fresh = bpy.data.images.load(str(FAR_PNG), check_existing=False)
far_fresh.colorspace_settings.name = far_original.colorspace_settings.name
far_fresh.alpha_mode = far_original.alpha_mode
far_new_pixels = audit["pixel_array"](far_fresh)
assert far_pixels.shape == far_new_pixels.shape == (2048, 2048, 4), "Far facade atlas size changed"
assert (far_pixels[:, :, 3] == far_new_pixels[:, :, 3]).all(), "Far facade alpha coverage changed"
far_changed = int(((far_pixels != far_new_pixels).any(axis=2)).sum())
assert far_changed > 0, "Pixelorama distant facade painting has not changed"
far_fresh.pack()
far_original.user_remap(far_fresh)
bpy.data.images.remove(far_original)
far_fresh.name = "distance-facades.png"
far_fresh.filepath = "//distance-facades.png"
assert bytes(far_fresh.packed_file.data) == FAR_PNG.read_bytes()
after = audit["source_state"](scene)
assert before == after, "Native source state changed outside the two packed albedo atlases"
distance_after = audit["packed_image_hashes"]()
assert distance_before["distance-lights.png"] == distance_after["distance-lights.png"], "Distant window mask changed"
bpy.ops.wm.save_as_mainfile(filepath=str(TARGET), compress=True)
report = {
    "software": "Blender", "version": bpy.app.version_string,
    "sourceRevision": "rooftop-weathering-07", "sourceSha256": baseline["nativeSha256"],
    "savedSource": "game-environment.blend", "geometryBefore": before["geometry"], "geometryAfter": after["geometry"],
    "allRenderedGeometryPreserved": True, "allObjectTransformsPreserved": True,
    "allNormalsExactlyPreserved": True, "normalsSha256": after["normalsSha256"],
    "allUvsExactlyPreserved": True, "uvSha256": after["uvSha256"],
    "materialAssignmentsSha256": after["materialAssignmentsSha256"],
    "materialsCamerasLightsAndColorManagementPreserved": True, "texelsPerMetre": 16,
    "packedPixeloramaPngMatches": True, "pixeloramaPngSha256": audit["sha256"](PNG),
    "distantWindowMaskExactlyPreserved": True, "distanceImageHashesBefore": distance_before,
    "distanceImageHashesAfter": distance_after, "packedPixeloramaFarPngMatches": True,
    "pixeloramaFarPngSha256": audit["sha256"](FAR_PNG),
    "farAtlasScope": {"dimensions": [2048, 2048], "changedPixelsTotal": far_changed, "alphaExactlyPreserved": True},
    "atlasScope": scope,
}
(HERE / "native-texture-integration.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
print("EXISTING NATIVE SOURCE ATLAS UPDATE", json.dumps(report, ensure_ascii=False), flush=True)
