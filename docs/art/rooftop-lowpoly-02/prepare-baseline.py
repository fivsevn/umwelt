"""Snapshot the verified lowpoly-01 source; never modify original or runtime.

Run with normal Python before native packing. Existing identical snapshots are
accepted; differing snapshots cause an error rather than being overwritten.
"""
import hashlib
import json
import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent / "rooftop-lowpoly-01"
RUNTIME = HERE.parents[2] / "rooftop/assets/background"


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def snapshot(source, name):
    target = HERE / name
    if target.exists():
        assert target.read_bytes() == source.read_bytes(), "Existing baseline differs: " + name
    else:
        shutil.copyfile(source, target)
    return digest(target)


def read_manifest(path):
    text = path.read_text()
    return json.loads(text.split("Object.freeze(", 1)[1].rsplit(");", 1)[0])


verified = json.loads((SOURCE / "native-source-check.json").read_text())
assert digest(SOURCE / "game-environment.blend") == verified["savedSourceSha256"]
assert digest(SOURCE / "terrace-book.png") == verified["pixeloramaPngSha256"]
assert digest(SOURCE / "distance-facades.png") == verified["pixeloramaFarPngSha256"]
assert digest(RUNTIME / "empty-rooftop.bin") == verified["runtimeBinarySha256"]
assert (RUNTIME / "terrace-book.png").read_bytes() == (SOURCE / "terrace-book.png").read_bytes()
manifest = read_manifest(RUNTIME / "empty-rooftop.mjs")
assert manifest["source"] == "docs/art/rooftop-lowpoly-01/game-environment.blend"
assert manifest["texelsPerMetre"] == 16
for texture in manifest["textures"]:
    assert digest(RUNTIME / texture["file"]) == texture["sha256"]
baseline = {
    "sourceRevision": "rooftop-lowpoly-01",
    "nativeSha256": snapshot(SOURCE / "game-environment.blend", "before.blend"),
    "pixeloramaPngSha256": snapshot(SOURCE / "terrace-book.png", "before-terrace-book.png"),
    "pixeloramaPxoSha256": snapshot(SOURCE / "terrace-book.pxo", "before-terrace-book.pxo"),
    "farPixeloramaPxoSha256": snapshot(SOURCE / "distance-facades.pxo", "before-distance-facades.pxo"),
    "original07NativeSha256": digest(HERE.parent / "rooftop-weathering-07/game-environment.blend"),
    "runtimeBinarySha256": snapshot(RUNTIME / "empty-rooftop.bin", "before-empty-rooftop.bin"),
    "runtimeManifestSha256": snapshot(RUNTIME / "empty-rooftop.mjs", "before-empty-rooftop.mjs"),
    "runtimeManifest": manifest,
    "distantRuntimeSha256": {name: snapshot(RUNTIME / name, "before-" + name) for name in ("distance-facades.png", "distance-lights.png")},
}
target = HERE / "integration-baseline.json"
if target.exists():
    assert json.loads(target.read_text()) == baseline, "Existing integration baseline differs"
else:
    target.write_text(json.dumps(baseline, ensure_ascii=False, indent=2) + "\n")
scope_target = HERE / "atlas-scope.json"
if not scope_target.exists():
    rects = {}
    for part in manifest["parts"]:
        if "rect" in part:
            if part["field"] in rects:
                assert rects[part["field"]] == part["rect"]
            rects[part["field"]] = part["rect"]
    scope_target.write_text(json.dumps({"sourceRevision": "rooftop-lowpoly-01", "allowedRects": rects, "preserveAllOtherPixels": True, "texelsPerMetre": 16}, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({key: val for key, val in baseline.items() if key != "runtimeManifest"}, ensure_ascii=False, indent=2))
