"""Explicit 1 px Pencil instructions for the two worn rooftop concrete floors.

This file creates no bitmap or Pixelorama document.  `floor_plan` returns strokes
for the Pixelorama Pencil, with integer coordinates, opacity 100%, brush size
1 px and no interpolation/antialiasing.  Paint these in the returned order.

Reference interpretation:
  Photo 1: large, faint concrete slab joints; narrow irregular darker repairs;
           small aggregate specks and pale marks from washing/trowelling.
  Photo 2: a few warmer exposed repairs, rubbed scrape bands and local pale
           residue.  Large unbroken white patches are intentionally absent.

Suggested independent sources, subject to the mesh's actual UV aspect ratio:
  north = floor_plan(256, 192, 5711)
  south = floor_plan(192, 128, 5732)
Keep the same texels per metre when assigning the two maps.  Dimensions above
are examples, not a request to stretch a texture to fill either floor.
The unbroken first stroke lays a muted warm/green-grey concrete base.  The
remaining rows/strokes build visual masses from that same 1 px unit.
"""

from math import sin, pi
from random import Random


FLOOR_PALETTE = {
    "base": "#898d85",
    "trowel_light": "#93968e",
    "trowel_mid": "#8e9188",
    "trowel_dark": "#82877e",
    "joint": "#797f75",
    "joint_faint": "#81867c",
    "joint_light": "#93978d",
    "repair": "#72796f",
    "repair_mid": "#7a8176",
    "crack": "#646d63",
    "aggregate_dark": "#777e73",
    "aggregate_light": "#a0a195",
    "wash": "#9c9e92",
    "wash_faint": "#94988d",
    "chalk": "#aaab9c",
    "exposed_plaster": "#a29f8b",
    "exposed_plaster_edge": "#969783",
}


def floor_plan(w, h, seed):
    """Return a finite, non-repeating floor painting, never a rendered image.

    Each entry is {'color': '#rrggbb', 'points': [[x,y], ...]}.  Consecutive
    points are connected by Pixelorama's 1 px Pencil.  A single-pixel dab has
    equal start and end points.  Do not enlarge the Pencil for any category.
    """
    if not isinstance(w, int) or not isinstance(h, int) or w < 64 or h < 64:
        raise ValueError("Use integer canvas dimensions of at least 64 pixels")
    rng = Random(seed)
    p = FLOOR_PALETTE
    strokes = []
    area = w * h

    def add(color, points):
        clipped = []
        for x, y in points:
            xy = [max(0, min(w - 1, int(x))), max(0, min(h - 1, int(y)))]
            if not clipped or xy != clipped[-1]:
                clipped.append(xy)
        if not clipped:
            return
        if len(clipped) == 1:
            clipped.append(clipped[0][:])
        strokes.append({"color": color, "points": clipped})

    def row(color, y, x0, x1):
        if 0 <= y < h and x1 >= 0 and x0 < w and x1 >= x0:
            add(color, [[x0, y], [x1, y]])

    # A single serpentine Pencil stroke covers the canvas.  No generated raster
    # is involved and each neighbouring row remains exactly one pixel apart.
    base_points = []
    for y in range(h):
        ends = (0, w - 1) if y % 2 == 0 else (w - 1, 0)
        base_points.extend([[ends[0], y], [ends[1], y]])
    add(p["base"], base_points)

    # Sparse trowel colour, with shallow ragged contours instead of equal tile
    # fills.  Their contrast is only a small step from the concrete base.
    for _ in range(max(5, area // 5000)):
        cx = rng.randrange(5, w - 5)
        cy = rng.randrange(5, h - 5)
        width = rng.randint(16, min(46, w // 3))
        height = rng.randint(4, 13)
        color = rng.choice([p["trowel_light"], p["trowel_mid"], p["trowel_dark"]])
        drift = rng.choice([-1, 0, 1])
        left_jitter = right_jitter = 0
        for dy in range(-height // 2, height // 2 + 1):
            taper = abs(dy) / max(1, height / 2)
            left_jitter += rng.choice([-1, 0, 0, 1])
            right_jitter += rng.choice([-1, 0, 0, 1])
            half = round(width * (1 - 0.43 * taper) / 2)
            x0 = cx - half + left_jitter + drift * dy
            x1 = cx + half + right_jitter + drift * dy
            row(color, cy + dy, x0, x1)
            if dy % 3 == 0 and rng.random() < 0.60:
                row(p["trowel_mid"], cy + dy, x0 + 3, x1 - 5)

    # Underlying slabs are large and not perfectly regular.  Old joints partly
    # disappear under wear and patching; a dark full square grid is avoided.
    xs, ys = [], []
    pos = rng.randint(24, 42)
    while pos < w - 8:
        xs.append(pos)
        pos += rng.randint(43, 66)
    pos = rng.randint(21, 39)
    while pos < h - 8:
        ys.append(pos)
        pos += rng.randint(39, 64)

    def fragmented_joint(vertical, axis):
        length = h if vertical else w
        t = rng.randint(0, 10)
        offset = 0
        while t < length:
            run = rng.randint(6, 18)
            offset = max(-1, min(1, offset + rng.choice([-1, 0, 0, 1])))
            end = min(length - 1, t + run)
            tone = p["joint_faint"] if rng.random() < 0.72 else p["joint"]
            if vertical:
                add(tone, [[axis + offset, t], [axis + offset, end]])
                if rng.random() < 0.20:
                    add(p["joint_light"], [[axis + offset + 1, t + 2],
                                            [axis + offset + 1, min(end, t + 5)]])
            else:
                row(tone, axis + offset, t, end)
                if rng.random() < 0.18:
                    row(p["joint_light"], axis + offset + 1, t + 2, min(end, t + 5))
            # Broad missing stretches break the impression of a tiled overlay.
            t = end + rng.randint(4, 18)

    for x in xs:
        fragmented_joint(True, x)
    for y in ys:
        fragmented_joint(False, y)

    # At only a few positions the old seam cracked and was repaired.  These
    # repairs are irregular narrow ribbons, not identical repeating symbols.
    repair_count = max(2, area // 17000)
    for index in range(repair_count):
        cx = rng.choice(xs) if xs and index % 2 == 0 else rng.randrange(w // 6, 5 * w // 6)
        cy = rng.randrange(h // 6, 5 * h // 6)
        length = rng.randint(17, min(48, h // 2))
        drift = rng.choice([-1, 1])
        centers = []
        x = cx
        for dy in range(length):
            if dy % rng.randint(3, 6) == 0:
                x += rng.choice([-1, 0, drift, drift])
            y = cy - length // 2 + dy
            centers.append([x, y])
            half = rng.choice([0, 1, 1, 2])
            row(p["repair_mid"], y, x - half - 1, x + half + 1)
            if rng.random() < 0.72:
                row(p["repair"], y, x - half, x + half)
        # The crack is interrupted, allowing the repair to read as filled
        # mortar in some places and as an open fissure in others.
        for start in range(0, length, 9):
            if rng.random() < 0.65:
                add(p["crack"], centers[start:min(length, start + rng.randint(3, 7))])
        if centers:
            root = centers[rng.randrange(len(centers))]
            bx, by = root
            add(p["joint"], [[bx, by], [bx + drift * 4, by - 3],
                              [bx + drift * 6, by - 3], [bx + drift * 8, by - 6]])
            # A handful of washed-out specks beside the repair, like Photo 1.
            for _ in range(3):
                sx = bx + rng.randint(-5, 5)
                sy = by + rng.randint(-7, 7)
                row(p["chalk"], sy, sx, sx + rng.choice([0, 1]))

    # Small rubbed wash marks: a few parallel 1 px traces in irregular groups,
    # with large empty intervals.  Their length and position differ by group.
    for _ in range(max(7, area // 3500)):
        cx = rng.randrange(8, w - 8)
        cy = rng.randrange(7, h - 7)
        span = rng.randint(9, min(29, w // 3))
        rows = rng.randint(3, 7)
        for dy in range(rows):
            if rng.random() < 0.34:
                continue
            x0 = cx - span // 2 + rng.randint(-3, 3) + dy // 2
            x1 = cx + span // 2 - rng.randint(0, 6) + dy // 2
            tone = p["wash_faint"] if dy % 3 else p["wash"]
            row(tone, cy + dy, x0, x1)
            if dy == rows // 2 and rng.random() < 0.42:
                row(p["aggregate_light"], cy + dy, x0 + 3, min(x1, x0 + 6))

    # Very limited warm plaster exposure seen in Photo 2.  Separate little
    # islands, less than about 1% of the canvas; never a single enormous patch.
    for _ in range(max(1, area // 45000)):
        cx = rng.randrange(12, w - 12)
        cy = rng.randrange(12, h - 12)
        rx, ry = rng.randint(6, 11), rng.randint(3, 6)
        for dy in range(-ry, ry + 1):
            half = max(1, round(rx * (1 - abs(dy) / (ry + 1))))
            left = cx - half + rng.choice([-2, -1, 0, 1])
            right = cx + half + rng.choice([-1, 0, 1, 2])
            row(p["exposed_plaster_edge"], cy + dy, left - 1, right + 1)
            row(p["exposed_plaster"], cy + dy, left + rng.randint(0, 2), right - rng.randint(0, 2))
        for _ in range(3):
            sy = cy + rng.randint(-ry - 2, ry + 2)
            sx = cx + rng.randint(-rx - 3, rx + 3)
            row(p["exposed_plaster_edge"], sy, sx, sx + rng.randint(0, 2))

    # Fine aggregate and isolated scuff chips, kept sparse.  Most are single
    # pixels, with some two-pixel grains.  Concentration is naturally uneven.
    for _ in range(max(60, area // 170)):
        x = rng.randrange(w)
        y = rng.randrange(h)
        if rng.random() < 0.60:
            tone = p["aggregate_dark"]
        else:
            tone = p["aggregate_light"] if rng.random() < 0.62 else p["wash_faint"]
        row(tone, y, x, x + (1 if rng.random() < 0.12 else 0))

    # A few partial residue arcs, rather than repeated complete pot rings.
    # These are pale rubbed flecks, not explicit placed furniture outlines.
    for _ in range(max(1, area // 33000)):
        cx = rng.randrange(14, w - 14)
        cy = rng.randrange(14, h - 14)
        radius = rng.randint(5, 9)
        start = rng.random() * 2 * pi
        for n in range(rng.randint(5, 10)):
            if rng.random() < 0.22:
                continue
            a = start + n * 0.13
            x = cx + round(radius * sin(a + pi / 2))
            y = cy + round(radius * 0.70 * sin(a))
            row(p["wash_faint"] if n % 3 else p["wash"], y, x, x + rng.choice([0, 0, 1]))

    return strokes


# Usage only; this intentionally does not save a PNG, PXO, JSON or any other
# output.  The main agent will call floor_plan and feed its explicit strokes to
# Pixelorama, then save the application-authored document and export there.
