"""Independent process reopens baseline and saved Blend, checking the export.

Usage: Blender --background --python-exit-code 1 --python check-native.py
Optional staging output: append -- /absolute/export/folder
"""
import hashlib
import json
import runpy
import sys
from pathlib import Path

import bpy

HERE = Path(__file__).resolve().parent
RUNTIME = Path(sys.argv[sys.argv.index("--") + 1]).resolve() if "--" in sys.argv else HERE.parents[2] / "rooftop/assets/background"
audit = runpy.run_path(str(HERE / "native-audit.py"), run_name="native_lowpoly_check_helpers")
baseline = json.loads((HERE / "integration-baseline.json").read_text())
for filename, key in (("before.blend", "nativeSha256"), ("before-terrace-book.png", "pixeloramaPngSha256"), ("before-terrace-book.pxo", "pixeloramaPxoSha256"), ("before-empty-rooftop.bin", "runtimeBinarySha256"), ("before-empty-rooftop.mjs", "runtimeManifestSha256")):
    assert audit["sha256"](HERE / filename) == baseline[key], "Baseline snapshot changed: " + filename
assert audit["manifest"](HERE / "before-empty-rooftop.mjs") == baseline["runtimeManifest"]
bpy.ops.wm.open_mainfile(filepath=str(HERE / "before.blend"))
before = audit["source_state"](bpy.context.scene)
before_pixels = audit["pixel_array"](bpy.data.images["terrace-book.png"])
before_distance = audit["packed_image_hashes"]()
original07 = HERE.parent / "rooftop-weathering-07/game-environment.blend"
assert audit["sha256"](original07) == baseline["original07NativeSha256"]
bpy.ops.wm.open_mainfile(filepath=str(original07))
assert audit["source_state"](bpy.context.scene) == before, "Native source no longer agrees with original weathering-07"
bpy.ops.wm.open_mainfile(filepath=str(HERE / "game-environment.blend"))
after = audit["source_state"](bpy.context.scene)
assert before == after, "Saved vertices, normals, UVs, transforms, materials or cameras changed"
image = bpy.data.images["terrace-book.png"]
assert tuple(image.size) == (1024, 1024)
assert image.packed_file
assert bytes(image.packed_file.data) == (HERE / "terrace-book.png").read_bytes()
after_distance = audit["packed_image_hashes"]()
assert before_distance["distance-lights.png"] == after_distance["distance-lights.png"], "Distant window mask changed"
far_image = bpy.data.images["distance-facades.png"]
assert tuple(far_image.size) == (2048, 2048)
assert bytes(far_image.packed_file.data) == (HERE / "distance-facades.png").read_bytes()
assert after_distance["distance-facades.png"] == audit["sha256"](HERE / "distance-facades.png")
old_far = bpy.data.images.load(str(HERE / "before-distance-facades.png"), check_existing=False)
old_far_pixels, far_pixels = audit["pixel_array"](old_far), audit["pixel_array"](far_image)
assert (old_far_pixels[:, :, 3] == far_pixels[:, :, 3]).all(), "Distant facade alpha changed"
far_changed = int(((old_far_pixels != far_pixels).any(axis=2)).sum())
assert far_changed > 0
scope = audit["compare_atlas_scope"](before_pixels, audit["pixel_array"](image))
current = audit["manifest"](RUNTIME / "empty-rooftop.mjs")
old = baseline["runtimeManifest"]
assert current["source"] == "docs/art/rooftop-lowpoly-02/game-environment.blend"
assert audit["sha256"](RUNTIME / "empty-rooftop.bin") == baseline["runtimeBinarySha256"] == current["sha256"], "Runtime geometry, normals or UV payload changed"
assert (RUNTIME / "empty-rooftop.bin").read_bytes() == (HERE / "before-empty-rooftop.bin").read_bytes()
expected = json.loads(json.dumps(old))
expected["source"] = current["source"]
expected["textureSha256"] = audit["sha256"](HERE / "terrace-book.png")
for texture in expected["textures"]:
    if texture["file"] in ("terrace-book.png", "distance-facades.png"):
        texture["sha256"] = audit["sha256"](HERE / texture["file"])
        texture["bytes"] = (HERE / texture["file"]).stat().st_size
assert current == expected, "Runtime manifest changed outside source path and two albedo PNG identities"
assert current["texelsPerMetre"] == 16
for texture in current["textures"]:
    raw = (RUNTIME / texture["file"]).read_bytes()
    assert hashlib.sha256(raw).hexdigest() == texture["sha256"]
    assert len(raw) == texture["bytes"]
    if texture["file"] == "terrace-book.png":
        assert raw == (HERE / "terrace-book.png").read_bytes(), "Runtime PNG differs from Pixelorama source"
        assert (texture["width"], texture["height"]) == (1024, 1024)
    elif texture["file"] == "distance-facades.png":
        assert raw == (HERE / "distance-facades.png").read_bytes(), "Runtime facade PNG differs from Pixelorama source"
        assert (texture["width"], texture["height"]) == (2048, 2048)
    else:
        assert raw == (HERE / ("before-" + texture["file"])).read_bytes(), "Distant runtime PNG changed"
result = {
    "savedSourceReopened": True, "sourceRevision": "rooftop-lowpoly-01",
    "sourceGeometrySha256": before["geometry"]["sha256"], "savedGeometrySha256": after["geometry"]["sha256"],
    "normalsSha256": after["normalsSha256"], "uvSha256": after["uvSha256"],
    "sourceVerticesNormalsUvsTransformsMaterialsAndCamerasExactlyPreserved": True,
    "alsoExactlyMatchesOriginalWeathering07": True,
    "original07NativeSha256": baseline["original07NativeSha256"],
    "packedPixeloramaPngMatches": True, "runtimePixeloramaPngMatches": True,
    "runtimeBinaryExactlyPreserved": True, "runtimeBinarySha256": current["sha256"],
    "runtimePartsExactlyPreserved": True, "runtimePartsSha256": audit["digest_json"](current["parts"]),
    "runtimePartCount": len(current["parts"]),
    "savedSourceSha256": audit["sha256"](HERE / "game-environment.blend"), "pixeloramaPngSha256": audit["sha256"](HERE / "terrace-book.png"),
    "texelsPerMetre": 16, "atlasScope": scope,
    "packedPixeloramaFarPngMatches": True, "runtimePixeloramaFarPngMatches": True,
    "pixeloramaFarPngSha256": audit["sha256"](HERE / "distance-facades.png"),
    "distantWindowMaskPackedAndRuntimeExactlyPreserved": True,
    "farAtlasScope": {"dimensions": [2048, 2048], "changedPixelsTotal": far_changed, "alphaExactlyPreserved": True},
}
(HERE / "native-source-check.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
print("SAVED MATERIAL SOURCE AND RUNTIME CHECK", json.dumps(result, ensure_ascii=False), flush=True)
