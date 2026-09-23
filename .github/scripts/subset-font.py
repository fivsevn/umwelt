#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
from pathlib import Path

from fontTools import subset

TEXT_SUFFIXES = {
    ".html", ".htm", ".css", ".js", ".mjs", ".json", ".txt", ".md",
    ".svg", ".xml", ".webmanifest",
}

# Keep printable ASCII even if a future minifier or data move makes a character
# disappear from the scanned source tree.
BASE_TEXT = "".join(chr(code) for code in range(0x20, 0x7F))
BASE_TEXT += "\n\r\t\u00a0\u3000\ufffd"
# Retired MORNING prose can survive as literal text in historical saves. Keep the
# four glyphs no longer present in active source after removing that unused pool.
BASE_TEXT += "凝吃址铺"


def collect_text(root: Path) -> str:
    chars = set(BASE_TEXT)
    for path in root.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        try:
            chars.update(path.read_text(encoding="utf-8", errors="ignore"))
        except OSError:
            continue
    return "".join(sorted(chars))


def subset_font(font_path: Path, scan_root: Path) -> tuple[int, int, int]:
    before = font_path.stat().st_size
    text = collect_text(scan_root)

    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.name_legacy = True
    options.name_languages = ["*"]
    options.notdef_glyph = True
    options.notdef_outline = True
    options.recommended_glyphs = True

    font = subset.load_font(str(font_path), options)
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text=text)
    subsetter.subset(font)

    tmp_path = font_path.with_name(font_path.name + ".subset")
    subset.save_font(font, str(tmp_path), options)
    os.replace(tmp_path, font_path)

    after = font_path.stat().st_size
    return before, after, len(text)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Subset the deployed Pixel font to characters used by the public site."
    )
    parser.add_argument("--scan-root", required=True, type=Path)
    parser.add_argument("--font", required=True, type=Path)
    args = parser.parse_args()

    scan_root = args.scan_root.resolve()
    font_path = args.font.resolve()
    if not scan_root.is_dir():
        raise SystemExit(f"scan root not found: {scan_root}")
    if not font_path.is_file():
        raise SystemExit(f"font not found: {font_path}")

    before, after, character_count = subset_font(font_path, scan_root)
    reduction = (1 - after / before) * 100 if before else 0
    print(
        f"[font-subset] {font_path.name}: "
        f"{before:,} -> {after:,} bytes "
        f"({reduction:.1f}% smaller), "
        f"{character_count:,} unique source characters"
    )

    if after >= before:
        raise SystemExit("subset font is not smaller than the source font")


if __name__ == "__main__":
    main()
