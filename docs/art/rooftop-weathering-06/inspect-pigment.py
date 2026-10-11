"""Read-only material diagnostics; no image drawing or rewriting."""
from collections import Counter
from pathlib import Path
import json
import sys
from PIL import Image

HERE = Path(__file__).resolve().parent
RECTS = {
    'north-floor': (512, 0, 128, 256),
    'south-floor': (640, 0, 128, 128),
    'plaster': (0, 512, 768, 64),
    'stained-plaster': (0, 576, 768, 64),
    'cap': (768, 128, 256, 64),
    'cement': (768, 192, 256, 64),
}

def inspect(path):
    image = Image.open(path).convert('RGB')
    result = {}
    for name, (x0, y0, w, h) in RECTS.items():
        pixels = list(image.crop((x0, y0, x0 + w, y0 + h)).get_flattened_data())
        counts = Counter(pixels)
        base = counts.most_common(1)[0][0]
        high = [max(abs(c - b) for c, b in zip(p, base)) > 20 for p in pixels]
        near = sum(max(abs(c - b) for c, b in zip(p, base)) <= 12 and p != base for p in pixels)
        previous = [0] * (w + 1)
        largest = 0
        for y in range(h):
            current = [0] * (w + 1)
            for x in range(w):
                if high[y * w + x]:
                    current[x + 1] = 1 + min(previous[x], previous[x + 1], current[x])
                    largest = max(largest, current[x + 1])
            previous = current
        jumps = edges = 0
        for y in range(h):
            for x in range(w):
                p = pixels[y * w + x]
                for dx, dy in [(1, 0), (0, 1)]:
                    if x + dx < w and y + dy < h:
                        q = pixels[(y + dy) * w + x + dx]
                        edges += 1
                        jumps += max(abs(a - b) for a, b in zip(p, q)) >= 24
        result[name] = {
            'dimensions': [w, h],
            'paletteCount': len(counts),
            'base': '#' + ''.join(f'{v:02x}' for v in base),
            'basePercent': round(counts[base] / len(pixels) * 100, 2),
            'nearBaseLayerPercent': round(near / len(pixels) * 100, 2),
            'highContrastAccentPercent': round(sum(high) / len(pixels) * 100, 2),
            'largestSolidHighContrastSquareSideTexels': largest,
            'largeAdjacentValueJumpPercent': round(jumps / edges * 100, 2),
        }
    return result

if __name__ == '__main__':
    source, output = map(Path, sys.argv[1:3])
    report = {'source': str(source), 'definition': 'High contrast means more than 20 RGB channel values from the most common local pigment. Near layers differ by at most 12. These diagnose broad hard blocks, not a style acceptance score.', 'materials': inspect(source)}
    output.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report['materials'], indent=2))
