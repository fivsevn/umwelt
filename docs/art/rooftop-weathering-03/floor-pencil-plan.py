"""Explicit 1 px native Pencil plan for the two existing concrete floor UVs.

This module does not construct a bitmap.  Pixelorama executes its integer
strokes, saves the original PXO and exports the PNG.  The material grid stays
16 texels/metre.  No regular slab lattice or repeated texture tile is painted.

Visual reading: the supplied photos contain connected repair fissures, worn
cement surfaces, local washed chalk residue and uneven water evaporation.
The mass and edges of each mark matter more than uniform scattered grain.
"""

from math import cos, sin, pi
from random import Random


PALETTE = {
    'base': '#989d97',
    'cool': '#959c96',
    'warm': '#9ca098',
    'old_cement': '#939a93',
    'washed_cement': '#9fa49b',
    'washed_edge': '#a5a99f',
    'pale_residue': '#afb1a6',
    'damp': '#929a92',
    'damp_edge': '#87938a',
    'repair': '#89958b',
    'repair_fleck': '#97a096',
    'crack': '#738176',
    'faint_crack': '#88948a',
    'warm_repair': '#aaa797',
    'warm_repair_edge': '#9d9f90',
    'grain': '#87948a',
    'light_grain': '#a6ada1',
}


def floor_plan(w, h, seed):
    """Produce ordered {'color', 'points'} Pencil strokes, with a 1 px brush."""
    if w != 128 or h not in (128, 256):
        raise ValueError('The unchanged atlas floor rectangles are 128×128 or 128×256')
    rng = Random(seed)
    marks = []
    p = PALETTE

    def mark(color, points):
        pts = []
        for x, y in points:
            xy = [max(0, min(w - 1, int(x))), max(0, min(h - 1, int(y)))]
            if not pts or xy != pts[-1]:
                pts.append(xy)
        if len(pts) == 1:
            pts.append(pts[0][:])
        if pts:
            marks.append({'color': color, 'points': pts})

    def line(color, x, y, x1, y1):
        mark(color, [[x, y], [x1, y1]])

    def polygon(color, vertices):
        # This is a plan of horizontal Pencil runs, not a raster image.  Each
        # run belongs to one coherent irregular silhouette; no repeating bars.
        for y in range(max(0, min(v[1] for v in vertices)),
                       min(h - 1, max(v[1] for v in vertices)) + 1):
            cuts = []
            for a, b in zip(vertices, vertices[1:] + vertices[:1]):
                if a[1] <= y < b[1] or b[1] <= y < a[1]:
                    cuts.append(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]))
            cuts.sort()
            for a, b in zip(cuts[::2], cuts[1::2]):
                left, right = round(a), round(b)
                if right >= 0 and left < w:
                    line(color, left, y, right, y)

    def blob(color, cx, cy, rx, ry, angular_seed):
        rr = Random(angular_seed)
        vertices = []
        for n in range(18):
            angle = n * 2 * pi / 18
            swell = rr.choice([0.75, 0.83, 0.9, 1.0, 1.0, 1.08])
            vertices.append([round(cx + rx * cos(angle) * swell),
                             round(cy + ry * sin(angle) * swell)])
        polygon(color, vertices)
        return vertices

    def cluster(color, x, y, size=3):
        # Small cohesive 1 px L/zigzag clusters.  Two-pixel grains belong to
        # local wear groups, avoiding a uniform field of isolated noise.
        choice = rng.randrange(4)
        if choice == 0:
            mark(color, [[x, y], [x + 1, y], [x + 1, y + 1]])
        elif choice == 1:
            mark(color, [[x, y], [x, y + 1], [x - 1, y + 1]])
        elif choice == 2:
            mark(color, [[x, y], [x + 1, y]])
        else:
            mark(color, [[x, y], [x + 1, y], [x + 2, y + 1]])
        if size > 3 and rng.random() < 0.45:
            line(color, x, y + 2, x + 1, y + 2)

    # Start by repainting just this UV rectangle.  No exterior pixel is touched.
    base = []
    for y in range(h):
        a, b = (0, w - 1) if y % 2 == 0 else (w - 1, 0)
        base.extend([[a, y], [b, y]])
    mark(p['base'], base)

    north = h == 256
    if north:
        fields = [
            ('cool', [(0, 5), (19, 2), (34, 11), (32, 27), (21, 37), (6, 31), (0, 20)]),
            ('warm', [(66, 9), (84, 3), (106, 11), (115, 28), (103, 41), (89, 37), (74, 29)]),
            ('washed_cement', [(17, 57), (35, 51), (48, 61), (49, 78), (37, 93), (25, 89), (12, 75)]),
            ('old_cement', [(89, 64), (111, 58), (127, 69), (127, 93), (111, 104), (95, 93), (87, 80)]),
            ('cool', [(4, 124), (22, 118), (36, 128), (33, 150), (21, 163), (3, 154), (0, 138)]),
            ('warm', [(84, 155), (101, 147), (120, 161), (127, 184), (112, 196), (94, 186), (82, 170)]),
            ('washed_cement', [(38, 203), (57, 196), (73, 203), (81, 219), (75, 241), (56, 246), (40, 230)]),
            ('cool', [(3, 231), (17, 218), (30, 229), (30, 253), (0, 255)]),
        ]
        stains = [(18, 42, 17, 12), (101, 123, 19, 13), (35, 181, 20, 17),
                  (113, 230, 14, 21), (67, 58, 10, 13)]
        washes = [(67, 28, 13, 12), (108, 83, 11, 14), (58, 165, 13, 19),
                  (18, 217, 12, 15), (81, 217, 8, 15)]
        repair_patches = [(60, 122, 7, 14), (19, 191, 6, 9), (91, 42, 5, 7)]
        crack_paths = [
            [(55, 79), (58, 88), (57, 94), (60, 98), (61, 108), (65, 114),
             (62, 123), (65, 132), (61, 138), (62, 149), (57, 159), (54, 170)],
            [(62, 123), (56, 124), (51, 119), (47, 121), (43, 117), (37, 116), (33, 111)],
            [(65, 132), (71, 136), (76, 135), (78, 141), (84, 145), (86, 152)],
            [(18, 181), (20, 187), (18, 191), (21, 196), (20, 202), (24, 207), (23, 217)],
            [(21, 196), (15, 200), (12, 200), (9, 205)],
            [(101, 9), (103, 17), (101, 23), (105, 28), (103, 35)],
        ]
        wear_groups = [(28, 68, 10, 12, 20), (104, 130, 17, 11, 24),
                       (48, 165, 15, 13, 16), (25, 215, 13, 12, 18),
                       (94, 224, 13, 17, 14), (61, 114, 7, 14, 16)]
    else:
        fields = [
            ('warm', [(0, 4), (20, 0), (37, 6), (39, 20), (29, 34), (14, 37), (0, 28)]),
            ('cool', [(61, 3), (84, 0), (104, 11), (107, 28), (92, 40), (70, 30), (60, 17)]),
            ('washed_cement', [(9, 53), (27, 46), (43, 56), (48, 75), (35, 92), (17, 86), (4, 72)]),
            ('old_cement', [(96, 59), (116, 51), (127, 62), (127, 85), (117, 99), (102, 91), (94, 78)]),
            ('warm', [(45, 104), (61, 99), (81, 108), (86, 123), (72, 127), (48, 127)]),
        ]
        stains = [(15, 17, 12, 10), (55, 57, 20, 13), (114, 108, 13, 16)]
        washes = [(36, 70, 14, 12), (93, 32, 13, 15), (54, 113, 12, 12)]
        repair_patches = [(80, 69, 6, 11), (28, 26, 9, 6)]
        crack_paths = [
            [(89, 39), (84, 46), (86, 52), (81, 57), (82, 64), (77, 69),
             (79, 78), (74, 82), (72, 91), (67, 97)],
            [(77, 69), (71, 70), (69, 75), (63, 77), (60, 82), (54, 83)],
            [(79, 78), (87, 80), (92, 85), (98, 84), (101, 88)],
            [(6, 102), (12, 106), (17, 104), (22, 109), (28, 108), (32, 112)],
        ]
        wear_groups = [(32, 66, 12, 13, 26), (54, 47, 17, 9, 16),
                       (97, 115, 14, 9, 14), (78, 68, 8, 14, 20)]

    # Broad, quiet tonal differences, shaped as unique connected areas.  Small
    # base-colour notches make their contours eroded and irregular.
    for index, (tone, vertices) in enumerate(fields):
        polygon(p[tone], vertices)
        for x, y in vertices[::2]:
            if 2 <= x < w - 2 and 2 <= y < h - 2:
                cluster(p['base'], x + rng.choice([-1, 0, 1]), y, 4)
        if index % 2 == 0:
            cx = sum(v[0] for v in vertices) // len(vertices)
            cy = sum(v[1] for v in vertices) // len(vertices)
            blob(p['base'], cx + 3, cy - 2, 5, 7, seed + 710 + index)

    # Evaporation stains: shallow low-contrast pools, partial tide marks on one
    # side and islands of base pigment inside; no repeated complete rings.
    for index, (cx, cy, rx, ry) in enumerate(stains):
        vertices = blob(p['damp'], cx, cy, rx, ry, seed + 100 + index)
        blob(p['old_cement'],
             cx - 2, cy - 1, max(2, rx - 5), max(2, ry - 4), seed + 300 + index)
        # Only the selected lower/right arcs retain the retreating water edge.
        for n in (2, 3, 5, 7, 8):
            a, b = vertices[n], vertices[(n + 1) % len(vertices)]
            if rng.random() < 0.73:
                mid = [round((a[0] + b[0]) / 2), round((a[1] + b[1]) / 2)]
                mark(p['damp_edge'] if n in (3, 7) else p['old_cement'], [a, mid])
        for n in (4, 6, 9):
            vx, vy = vertices[n]
            cluster(p['washed_cement'], vx + 1, vy, 3)

    # Washing/scuffing makes local irregular areas and flecks.  The brush never
    # deposits long straight parallel lines across the floor.
    for index, (cx, cy, rx, ry) in enumerate(washes):
        vertices = [[cx-rx, cy-2], [cx-rx+3, cy-ry], [cx-5, cy-ry+4],
                    [cx+4, cy-ry+2], [cx+rx, cy-2], [cx+rx-3, cy+7],
                    [cx+2, cy+ry], [cx-8, cy+ry-3], [cx-rx+2, cy+4]]
        polygon(p['washed_cement'], vertices)
        for n in (1, 4, 6, 8):
            vx, vy = vertices[n]
            cluster(p['washed_edge'], vx, vy, 4)
        for n in (0, 2, 3, 5, 7):
            vx, vy = vertices[n]
            cluster(p['base'], vx, vy, 4)
        for _ in range(5):
            cluster(rng.choice([p['washed_edge'], p['base']]), cx + rng.randint(-rx + 3, rx - 3),
                    cy + rng.randint(-ry + 3, ry - 3), 3)

    # Bounded mortar patches are adjacent to fissures and erosion sites.  Their
    # irregular contours include 1 px bites, satellites and original cement.
    for index, (cx, cy, rx, ry) in enumerate(repair_patches):
        warm = not north and index == 1
        color = p['warm_repair'] if warm else p['repair']
        vertices = blob(color, cx, cy, rx, ry, seed + 900 + index)
        for n, (vx, vy) in enumerate(vertices):
            if n % 3 == 0:
                cluster(p['base'], vx, vy, 4)
            elif n % 4 == 0:
                cluster(p['warm_repair_edge'] if warm else p['repair_fleck'], vx, vy, 3)
        for _ in range(10):
            x, y = cx + rng.randint(-rx + 2, rx - 2), cy + rng.randint(-ry + 2, ry - 2)
            cluster(p['warm_repair_edge'] if warm else p['repair_fleck'], x, y, 3)

    # Deliberately placed branching crack networks.  Filled mortar disappears
    # between exposed sections, thickness varies through 1 px clusters, and
    # branches terminate instead of forming a rectangular slab pattern.
    for index, points in enumerate(crack_paths):
        mark(p['faint_crack'], points)
        for segment, (a, b) in enumerate(zip(points, points[1:])):
            if (segment + index) % 3 != 0:
                mark(p['crack'], [a, b])
            if segment % 3 == 1:
                mid = [round((a[0] + b[0]) / 2), round((a[1] + b[1]) / 2)]
                cluster(p['repair'], mid[0] + 1, mid[1], 3)
            if segment % 4 == 2:
                cluster(p['repair_fleck'], a[0] - 2, a[1] + 1, 3)

    # Keep only a few surviving, short, crooked slab-joint fragments.  The
    # supplied photos show many joints scrubbed almost entirely out of view.
    seams = [[(4, 54), (9, 53), (17, 55), (21, 54)],
             [(44, 8), (45, 14), (44, 19)],
             [(105, 45), (110, 44), (116, 46), (123, 45)],
             [(40, 115), (40, 123), (42, 126)]]
    if north:
        seams += [[(4, 102), (10, 101), (17, 103)],
                  [(96, 173), (95, 179), (97, 185)],
                  [(47, 190), (54, 191), (61, 190)],
                  [(77, 236), (82, 235), (86, 237)]]
    for points in seams:
        mark(p['cool'], points)
        if rng.random() < 0.5:
            a, b = points[0], points[1]
            mark(p['old_cement'], [a, b])

    # Aggregate and chalk chips live in sparse, uneven local wear groups.  The
    # remaining quiet floor has a handful of low-contrast grains, not grunge.
    for cx, cy, rx, ry, count in wear_groups:
        for _ in range(count):
            # Two draws put most marks near their site's centre.
            x = cx + round((rng.uniform(-1, 1) + rng.uniform(-1, 1)) * rx / 2)
            y = cy + round((rng.uniform(-1, 1) + rng.uniform(-1, 1)) * ry / 2)
            cluster(rng.choice([p['grain'], p['light_grain'], p['washed_edge']]), x, y, 3)
    for _ in range(22 if north else 13):
        cluster(rng.choice([p['old_cement'], p['washed_cement']]),
                rng.randrange(3, w - 3), rng.randrange(3, h - 3), 3)
    return marks
