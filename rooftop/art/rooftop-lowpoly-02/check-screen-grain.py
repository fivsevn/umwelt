"""Read-only audit of actual browser screenshots; never modifies image pixels.

Regions are CSS-screen rectangles, excluding DOM controls/cards. Capture PNG
directly through CUA CDP Page.captureScreenshot: the ordinary browser screenshot
helper compresses to JPEG, which changes pixels and cannot prove exact blocks.
Arguments are filename:devicePixelRatio:targetCssStep:x0,y0,x1,y1.
For an embedded canvas, append :originX,originY in physical device pixels.
The actual block is round(targetCssStep * devicePixelRatio) physical pixels.
No image resizing is used.
"""
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parent
results = []
for argument in sys.argv[1:]:
    parts = argument.split(":")
    name, scale_text, target_text, bounds = parts[:4]
    origin_x, origin_y = map(int, parts[4].split(",")) if len(parts) == 5 else (0, 0)
    scale = float(scale_text)
    target = float(target_text)
    x0, y0, x1, y1 = map(int, bounds.split(","))
    source = Image.open(root / name)
    assert source.format == "PNG", "Exact grid checks require lossless PNG"
    pixels = np.array(source.convert("RGB"))
    x0, y0, x1, y1 = [round(value * scale) for value in (x0, y0, x1, y1)]
    step = int(target * scale + 0.5)
    assert 0 <= x0 < x1 <= pixels.shape[1]
    assert 0 <= y0 < y1 <= pixels.shape[0]
    start_x = origin_x + (x0 - origin_x + step - 1) // step * step
    start_y = origin_y + (y0 - origin_y + step - 1) // step * step
    end_x = origin_x + (x1 - origin_x) // step * step
    end_y = origin_y + (y1 - origin_y) // step * step
    region = pixels[start_y:end_y, start_x:end_x]
    cells = region.reshape(region.shape[0] // step, step,
                           region.shape[1] // step, step, 3)
    constant = np.all(cells == cells[:, :1, :, :1, :], axis=(1, 3, 4))
    result = {"screenshot": name, "dimensions": [pixels.shape[1], pixels.shape[0]],
              "physicalBounds": [start_x, start_y, end_x, end_y],
              "physicalGridOrigin": [origin_x, origin_y],
              "devicePixelRatio": scale, "targetCssPixelStep": target,
              "physicalPixelStep": step, "resolvedCssPixelStep": step / scale,
              "cells": int(constant.size), "constantCells": int(constant.sum()),
              "mismatchedCells": int((~constant).sum())}
    results.append(result)
print(json.dumps(results, indent=2))
