"""Draw reproducible Pencil strokes in the installed Pixelorama; verify PXO reopening.

Usage: python3 tools/pixel-icons/author.py gtb [--check]
The check path only reopens the current source; it does not overwrite manual edits.
"""
from pathlib import Path
import argparse
import hashlib
import json
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument("game", choices=["gtb", "gsm"])
parser.add_argument("--check", action="store_true")
args = parser.parse_args()
directory = ROOT / args.game / "art/icon"
config = Path.home() / "Library/Application Support/Pixelorama/config.ini"
backup = config.read_bytes()
name = "UmweltMediaIconAuthor"
extension = config.parent / "extensions" / (name + ".zip")
if extension.exists():
    raise RuntimeError("An icon author extension already exists; leave it untouched.")
scene = f'''[gd_scene load_steps=2 format=3]
[ext_resource type="Script" path="res://src/Extensions/{name}/{name}.gd" id="1"]
[node name="{name}" type="Node"]
script = ExtResource("1")
'''
manifest = {"name": name, "display_name": "UMWELT icon author", "description": "Native Pencil icon authoring and source verification", "author": "五月七日", "version": "0.1", "supported_api_versions": [8], "license": "CC-BY-NC-SA-4.0", "nodes": [name + ".tscn"]}
try:
    extension.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(extension, "w", zipfile.ZIP_DEFLATED) as archive:
        prefix = f"src/Extensions/{name}/"
        archive.writestr(prefix + name + ".gd", Path(__file__).with_name("NativeAuthor.gd").read_text())
        archive.writestr(prefix + name + ".tscn", scene)
        archive.writestr(prefix + "extension.json", json.dumps(manifest))
    settings = backup.decode()
    if "[extensions]" in settings:
        settings = settings.replace("[extensions]", f"[extensions]\n{name}=true", 1)
    else:
        settings += f"\n[extensions]\n{name}=true\n"
    config.write_text(settings)
    command = ["/Applications/Pixelorama.app/Contents/MacOS/Pixelorama", "--headless", "--"]
    if args.check:
        command += [str(directory / "icon.pxo"), "--check-source"]
    command += ["--umwelt-icon", "--icon-dir=" + str(directory)]
    result = subprocess.run(command, capture_output=True, text=True, timeout=90)
    (directory / "pixelorama.log").write_text(result.stdout + result.stderr)
    print(result.stdout[-1800:])
    if result.returncode:
        raise RuntimeError(result.stderr[-1800:])
    if args.check:
        original = ROOT / args.game / "assets/icon.png"
        reopened = directory / "reopened.png"
        if original.read_bytes() != reopened.read_bytes():
            raise RuntimeError("Reopened PXO differs from the current PNG export.")
        print("Native PXO reopen matches PNG:", hashlib.sha256(original.read_bytes()).hexdigest())
    elif not (directory / "icon.pxo").exists():
        raise RuntimeError("Pixelorama did not save the source.")
finally:
    config.write_bytes(backup)
    extension.unlink(missing_ok=True)
