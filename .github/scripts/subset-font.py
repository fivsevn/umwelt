#!/usr/bin/env python3
"""Build a deployment-only WOFF2 subset from the characters used by the public site."""

from __future__ import annotations

import argparse
import os
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

FONT_RELATIVE_PATH = Path("assets/fonts/fusion-pixel-12px-monospaced-zh_hans.ttf.woff2")
TEXT_SUFFIXES = {".html", ".css", ".js", ".mjs", ".md", ".json", ".svg", ".xml", ".webmanifest"}
BASIC_ASCII = "".join(chr(codepoint) for codepoint in range(0x20, 0x7F))
EXTRA_RUNTIME_CHARS = "\u00a0"


def collect_characters(root: Path) -> set[str]:
    characters = set(BASIC_ASCII + EXTRA_RUNTIME_CHARS)
    for path in root.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        try:
            characters.update(path.read_text(encoding="utf-8"))
        except UnicodeDecodeError:
            continue
    return characters


def build_subset(root: Path, output: Path | None = None) -> tuple[int, int, int, int]:
    font_path = root / FONT_RELATIVE_PATH
    if not font_path.is_file():
        raise SystemExit(f"font not found: {font_path}")

    original_size = font_path.stat().st_size
    characters = collect_characters(root)

    font = TTFont(font_path, recalcBBoxes=False, recalcTimestamp=False)
    cmap = set((font.getBestCmap() or {}).keys())
    requested = {ord(char) for char in characters}
    supported = requested & cmap

    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    options.name_legacy = True
    options.recalc_bounds = False
    options.recalc_timestamp = False

    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=supported)
    subsetter.subset(font)
    font.flavor = "woff2"

    target = output or font_path
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_name(target.name + ".tmp")
    font.save(temporary)
    os.replace(temporary, target)

    subset_size = target.stat().st_size
    return original_size, subset_size, len(supported), len(requested - cmap)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", nargs="?", default="_site", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    root = args.root.resolve()
    output = args.output.resolve() if args.output else None
    before, after, glyphs, missing = build_subset(root, output)
    ratio = after / before if before else 1
    saved = before - after
    print(
        f"[font-subset] {before:,} -> {after:,} bytes "
        f"({ratio:.1%} of original, saved {saved:,} bytes); "
        f"{glyphs:,} supported codepoints retained; {missing:,} source characters use fallback fonts."
    )


if __name__ == "__main__":
    main()
