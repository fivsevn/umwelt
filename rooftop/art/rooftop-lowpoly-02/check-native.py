"""Reopen the current Blend and independently export it to temporary staging.

Checks current packed atlases, material charts, physical calibration and the
complete binary/manifest/textures against runtime. No historical source is
required. No Blend or runtime asset is modified.
Usage: Blender -b --python-exit-code 1 --python check-native.py
Optional runtime directory: append -- /absolute/export/folder
"""
import hashlib
import json
import math
import runpy
import subprocess
import sys
import tempfile
from pathlib import Path
import bpy
import numpy as np

HERE = Path(__file__).resolve().parent
RUNTIME = Path(sys.argv[sys.argv.index("--") + 1]).resolve() if "--" in sys.argv else HERE.parents[2] / "rooftop/assets/background"
audit = runpy.run_path(str(HERE / "native-audit.py"), run_name="current_native_audit")
source = HERE / "game-environment.blend"
protected = {name: audit["sha256"](HERE / name) for name in (
    "game-environment.blend", "terrace-book.png", "terrace-book.pxo",
    "distance-facades.png", "distance-facades.pxo")}
current = audit["manifest"](RUNTIME / "empty-rooftop.mjs")
assert current["source"] in ("docs/art/rooftop-lowpoly-02/game-environment.blend", "rooftop/art/rooftop-lowpoly-02/game-environment.blend")
assert current["texelsPerMetre"] == 16
assert audit["sha256"](RUNTIME / "empty-rooftop.bin") == current["sha256"]
assert (RUNTIME / "empty-rooftop.bin").stat().st_size == current["bytes"]

bpy.ops.wm.open_mainfile(filepath=str(source), load_ui=False, use_scripts=False)
scene = bpy.context.scene
state = audit["source_state"](scene)
scale = np.asarray(json.loads(scene["texelMetresPerUnit"]), dtype=np.float64)
assert scale.shape == (3,) and np.isfinite(scale).all() and (scale > 0).all()
assert scale.tolist() == current["texelMetresPerUnit"]
assert int(scene["texelsPerMetre"]) == 16
fields = json.loads(scene["textureFields"])
assert fields
for name, rectangle in fields.items():
    assert len(rectangle) == 4 and all(type(value) == int for value in rectangle)
    x, y, width, height = rectangle
    assert 0 <= x < 1024 and 0 <= y < 1024 and width > 0 and height > 0
    assert x + width <= 1024 and y + height <= 1024, name
for texture in current["textures"]:
    image = bpy.data.images[texture["file"]]
    assert image.packed_file, "Unpacked current texture: " + image.name
    assert list(image.size) == [texture["width"], texture["height"]]
    raw = (RUNTIME / texture["file"]).read_bytes()
    assert hashlib.sha256(raw).hexdigest() == texture["sha256"] and len(raw) == texture["bytes"]
    if texture["file"] in ("terrace-book.png", "distance-facades.png"):
        assert bytes(image.packed_file.data) == (HERE / texture["file"]).read_bytes() == raw
for part in current["parts"]:
    if part.get("style") != "baked":
        assert part["rect"] == fields[part["field"]]

# Measure native planar charts rather than thin exported triangles, whose
# Float32 inverse Jacobian can amplify rounding. Baked far charts use the
# runtime's calibrated physical sampler and are checked by the full export.
measured = []
change = np.array([[1, 0, 0, 0], [0, 0, 1, 0], [0, -1, 0, 0], [0, 0, 0, 1]], dtype=np.float64)
for obj in scene.objects:
    if obj.type != "MESH" or obj.get("runtime_box"):
        continue
    mesh = obj.data
    assert mesh.uv_layers.active is not None
    world = change @ np.asarray(obj.matrix_world, dtype=np.float64)
    uv = mesh.uv_layers.active.data
    for polygon in mesh.polygons:
        material = mesh.materials[polygon.material_index]
        if material.get("runtime_style") == "baked":
            continue
        if material.get("runtime_field", material.name) not in (
            "north-floor", "south-floor", "north-plaster", "stained-plaster", "cap", "cement"):
            continue
        xyz = np.array([(world @ np.array([*mesh.vertices[mesh.loops[i].vertex_index].co, 1.0]))[:3] * scale for i in polygon.loop_indices])
        tex = np.array([tuple(uv[i].uv) for i in polygon.loop_indices])
        centred = xyz - xyz.mean(axis=0)
        _, singular, frame = np.linalg.svd(centred, full_matrices=False)
        if len(singular) < 2 or singular[1] < 1e-9:
            continue
        plane = centred @ frame[:2].T
        design = np.column_stack([plane, np.ones(len(plane))])
        fit = np.linalg.lstsq(design, tex, rcond=None)[0]
        if abs(np.linalg.det(fit[:2])) < 1e-9:
            continue
        inverse = np.linalg.inv(fit[:2])
        u, v = inverse[:, 0], inverse[:, 1]
        lengths = np.linalg.norm(u), np.linalg.norm(v)
        density = [1 / length for length in lengths]
        angle = math.degrees(math.acos(float(np.clip(np.dot(u, v) / np.prod(lengths), -1, 1))))
        residual = float(np.max(np.abs(design @ fit - tex)))
        assert max(abs(value - 16) for value in density) < .02, (obj.name, polygon.index, density)
        assert abs(angle - 90) < .1 and residual < .002, (obj.name, polygon.index, angle, residual)
        measured.append((density, angle, residual))
assert measured, "No material charts were measured"

with tempfile.TemporaryDirectory(prefix="rooftop-current-native-check-") as directory:
    staging = Path(directory)
    result = subprocess.run([
        bpy.app.binary_path, "--background", "--threads", "2", "--python-exit-code", "1",
        "--python", str(HERE / "export-game.py"), "--", str(source), str(staging),
    ], capture_output=True, text=True, timeout=300)
    assert result.returncode == 0, result.stdout[-3000:] + result.stderr[-3000:]
    assert audit["manifest"](staging / "empty-rooftop.mjs") == current, "Current native manifest differs from runtime"
    assert (staging / "empty-rooftop.bin").read_bytes() == (RUNTIME / "empty-rooftop.bin").read_bytes(), "Current native geometry differs from runtime"
    for texture in current["textures"]:
        assert (staging / texture["file"]).read_bytes() == (RUNTIME / texture["file"]).read_bytes(), texture["file"] + " current export differs from runtime"
assert all(audit["sha256"](HERE / name) == expected for name, expected in protected.items()), "Read-only verification changed a source"
report = {
    "savedSourceReopened": True, "currentSourceOnly": True,
    "sourceGeometrySha256": state["geometry"]["sha256"],
    "normalsSha256": state["normalsSha256"], "uvSha256": state["uvSha256"],
    "packedPixeloramaPngMatches": True, "runtimePixeloramaPngMatches": True,
    "freshNativeExportEqualsRuntime": True, "sourceFilesUnchanged": True,
    "runtimeBinarySha256": current["sha256"], "runtimePartCount": len(current["parts"]),
    "runtimePartsSha256": audit["digest_json"](current["parts"]),
    "savedSourceSha256": protected["game-environment.blend"],
    "texelsPerMetre": 16, "texelMetresPerUnit": scale.tolist(),
    "materialChartsMeasured": len(measured),
    "maximumChartDensityError": max(abs(value - 16) for density, _, _ in measured for value in density),
    "maximumChartAngleError": max(abs(angle - 90) for _, angle, _ in measured),
    "maximumChartFitResidualPixels": max(residual for _, _, residual in measured),
    "textures": current["textures"],
}
(HERE / "native-source-check.json").write_text(json.dumps(report, indent=2) + "\n")
print("CURRENT SOURCE AND EXPORT CHECK", json.dumps(report), flush=True)
