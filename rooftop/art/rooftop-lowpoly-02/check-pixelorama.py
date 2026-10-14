"""Reopen current PXOs in real Pixelorama and check source/runtime exports.

Sources are read only. Independent reopen PNGs and reports are disposable QA.
No previous version, stroke plan or historical proof is required.
"""
from pathlib import Path
import hashlib
import json
import runpy
import sys
import zipfile
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
RUNTIME = HERE.parents[2] / "rooftop/assets/background"
NATIVE = runpy.run_path(str(HERE / "pixelorama-native.py"))
GD = '''extends Node
func _ready():
 if "--rooftop-lowpoly-02-check" in OS.get_cmdline_user_args():
  Global.pixelorama_opened.connect(check_source, CONNECT_ONE_SHOT)
func check_source():
 var path = ""
 for arg in OS.get_cmdline_user_args():
  if arg.begins_with("--book-dir="): path = arg.trim_prefix("--book-dir=")
 var project = Global.current_project
 if project.name != "terrace-book" or project.size != Vector2i(1024, 1024):
  get_tree().quit(2)
  return
 var main_png = project.frames[0].cels[0].get_image().save_png(path.path_join("native-reopened-atlas.png"))
 OpenSave.open_pxo_file(path.path_join("distance-facades.pxo"))
 project = Global.current_project
 if project.name != "distance-facades" or project.size != Vector2i(2048, 2048):
  get_tree().quit(3)
  return
 var far_png = project.frames[0].cels[0].get_image().save_png(path.path_join("native-reopened-distance-facades.png"))
 var report = {"software":"Pixelorama", "version":Global.current_version, "nativeMainPxoReopened":true, "nativeFarPxoReopened":true, "nativeMainReopenedPngExport":main_png == OK, "nativeFarReopenedPngExport":far_png == OK}
 var file = FileAccess.open(path.path_join("pixelorama-native-reopened.json"), FileAccess.WRITE)
 file.store_string(JSON.stringify(report, "  "))
 print("CURRENT NATIVE SOURCES REOPENED ", JSON.stringify(report))
 get_tree().quit(0 if main_png == OK and far_png == OK else 4)
'''


def image(path):
    with Image.open(path) as source:
        return np.asarray(source.convert("RGBA"))


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check(reuse_verified_reopen=False):
    protected = {name: digest(HERE / name) for name in (
        "terrace-book.pxo", "terrace-book.png", "distance-facades.pxo", "distance-facades.png")}
    if not reuse_verified_reopen:
        NATIVE["run_native"](GD, "--rooftop-lowpoly-02-check", "RooftopLowpoly02Check")
        reopened = json.loads((HERE / "pixelorama-native-reopened.json").read_text())
        assert all(reopened[key] for key in (
            "nativeMainPxoReopened", "nativeFarPxoReopened",
            "nativeMainReopenedPngExport", "nativeFarReopenedPngExport"))
    reports = {}
    for name, dimensions, reopened_png, report_name in (
        ("terrace-book", (1024, 1024), "native-reopened-atlas.png", "pixelorama-scope-check.json"),
        ("distance-facades", (2048, 2048), "native-reopened-distance-facades.png", "pixelorama-distant-scope-check.json"),
    ):
        source = HERE / (name + ".pxo")
        png = HERE / (name + ".png")
        with zipfile.ZipFile(source) as archive:
            project = json.loads(archive.read("data.json"))
            assert (project["size_x"], project["size_y"]) == dimensions
            assert len(project["layers"]) == 1, "Update composite verification before adding atlas layers"
            assert not project.get("reference_images"), "Keep reference images outside the repository"
            cel = archive.read("image_data/frames/1/layer_1")
        pixels = image(png)
        assert pixels.shape == (dimensions[1], dimensions[0], 4)
        assert cel == pixels.tobytes(), name + " native/export mismatch"
        if reuse_verified_reopen:
            proof = json.loads((HERE / report_name).read_text())
            assert proof["nativePxoReopened"] and proof["nativeCelEqualsPngAndReopenedPng"]
            assert proof["pxoSha256"] == digest(source) and proof["pngSha256"] == digest(png), "Previous reopen proof does not match current source"
        else:
            assert cel == image(HERE / reopened_png).tobytes(), name + " independent reopen mismatch"
        assert png.read_bytes() == (RUNTIME / png.name).read_bytes(), name + " runtime/source mismatch"
        report = {
            "nativeSoftware": "Pixelorama", "nativePxoReopened": True,
            "nativeCelEqualsPngAndReopenedPng": True, "runtimePngByteIdentical": True,
            "dimensions": list(dimensions), "referenceImageCount": 0,
            "currentChecksumsVerified": True,
            "reopenEvidence": "Previously verified native reopen with unchanged source checksums" if reuse_verified_reopen else "Real Pixelorama reopened during this check",
            "pxoSha256": digest(source), "pngSha256": digest(png),
            "rgbColorCountExcludingTransparent": len(np.unique(pixels[pixels[:, :, 3] > 0, :3], axis=0)),
        }
        (HERE / report_name).write_text(json.dumps(report, indent=2) + "\n")
        reports[name] = report
    assert all(digest(HERE / name) == expected for name, expected in protected.items()), "Source changed during read-only verification"
    print(json.dumps(reports, indent=2))


if __name__ == "__main__":
    check(reuse_verified_reopen="--reuse-verified-reopen" in sys.argv)
