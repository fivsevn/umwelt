"""Explicit crisp 1 px Pencil painting for the unchanged eight atlas regions.

The user supplied a retro station and an aged pixel laboratory.  Their concrete
and painted surfaces read through small connected, angular colour clusters and
material-specific pigments, rather than large round washed-out surface blobs.
This script describes marks; it creates no raster image.  All actual painting
is performed by the native Pixelorama Pencil in repaint-materials-pixelorama.py.
"""

from random import Random

RECTS = {
    'north-floor': [512, 0, 128, 256],
    'south-floor': [640, 0, 128, 128],
    'plaster': [0, 512, 768, 64],
    'stained-plaster': [0, 576, 768, 64],
    'metal': [768, 0, 256, 64],
    'rust-iron': [768, 64, 256, 64],
    'cap': [768, 128, 256, 64],
    'cement': [768, 192, 256, 64],
}

# Deliberately authored small angular chip silhouettes, at the single-pixel
# grid.  '#' is the connected pigment mass; '+' is an exposed edge accent.
# Empty positions remain untouched.  There is no smoothing or scaled brush.
CHIPS = [
    ['..##..', '.#####', '##+###', '.###..', '..#+..'],
    ['.#....', '####..', '###++.', '.#####', '..##..'],
    ['..###...', '.######.', '##+###..', '.#######', '...##+##', '.....##.'],
    ['..##..', '####..', '.##+##', '..####', '...##.'],
    ['.##..', '####.', '#+###', '.###.', '..#..'],
    ['...#...', '.####..', '###++##', '..#####', '.###...', '..##...'],
    ['.###....', '###..##.', '.##+####', '..######', '....#+..'],
    ['.#..', '####', '##+.', '.###', '..#.'],
]
MICRO = [
    ['##.', '.##'],
    ['.#.', '###'],
    ['##', '.#'],
    ['.#', '##', '#.'],
    ['#..', '###'],
    ['###', '.#.'],
]


def material_plan(field, w, h, seed):
    if field not in RECTS or [w, h] != RECTS[field][2:]:
        raise ValueError('Use the unchanged atlas field dimensions')
    r = Random(seed)
    strokes = []

    def mark(color, points):
        pts = []
        for x, y in points:
            xy = [max(0, min(w - 1, int(x))), max(0, min(h - 1, int(y)))]
            if not pts or xy != pts[-1]:
                pts.append(xy)
        if len(pts) == 1:
            pts.append(pts[0][:])
        if pts:
            strokes.append({'color': color, 'points': pts})

    def line(color, x, y, x1, y1):
        mark(color, [[x, y], [x1, y1]])

    def fill(color):
        points = []
        for y in range(h):
            a, b = (0, w - 1) if y % 2 == 0 else (w - 1, 0)
            points.extend([[a, y], [b, y]])
        mark(color, points)

    def chip(x, y, color, accent, n=None, flip=False, micro=False):
        patterns = MICRO if micro else CHIPS
        pattern = patterns[r.randrange(len(patterns)) if n is None else n % len(patterns)]
        for yy, row in enumerate(pattern):
            if flip:
                row = row[::-1]
            for char, pigment in [('#', color), ('+', accent)]:
                start = None
                for xx, token in enumerate(row + '.'):
                    if token == char and start is None:
                        start = xx
                    elif token != char and start is not None:
                        if 0 <= y + yy < h and x + start < w and x + xx - 1 >= 0:
                            line(pigment, x + start, y + yy, x + xx - 1, y + yy)
                        start = None

    def polygon(color, vertices):
        for y in range(max(0, min(v[1] for v in vertices)), min(h - 1, max(v[1] for v in vertices)) + 1):
            cuts = []
            for a, b in zip(vertices, vertices[1:] + vertices[:1]):
                if a[1] <= y < b[1] or b[1] <= y < a[1]:
                    cuts.append(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]))
            cuts.sort()
            for a, b in zip(cuts[::2], cuts[1::2]):
                line(color, round(a), y, round(b), y)

    if field.endswith('floor'):
        # Light grey-green slab cement; a restrained clear distinction from
        # lime plaster, cap stone and blue-grey iron survives the game lighting.
        fill('#9ba49b')
        north = h == 256
        # Small irregular trowelled areas with stair-step corners.  No circles,
        # large washed rings or complete per-tile colour fills are used.
        repairs = [(24, 30, 2), (63, 122, 6), (87, 62, 3), (17, 203, 1), (92, 228, 5)] if north else [(26, 24, 2), (77, 68, 6), (101, 110, 1)]
        for i, (x, y, n) in enumerate(repairs):
            chip(x, y, '#89998b', '#a6aea1', n, i % 2 == 1)
            chip(x + 3, y + 5, '#939f90', '#b1b59f', (n + 3) % len(CHIPS), i % 2 == 0)
            if i in (0, 3):
                chip(x + 1, y + 2, '#afa991', '#c0b79d', 7)
            chip(x - 3, y + 7, '#8c9d8d', '#9aa897', micro=True)
        # A few quiet irregular material masses, only 8–13 source pixels wide.
        patches = [(45, 52), (103, 112), (31, 163), (80, 193), (47, 234)] if north else [(15, 57), (58, 45), (90, 101)]
        for i, (x, y) in enumerate(patches):
            polygon('#95a094', [[x,y+2],[x+4,y],[x+7,y],[x+7,y+2],[x+11,y+2],[x+11,y+6],[x+8,y+6],[x+8,y+9],[x+3,y+9],[x+3,y+7],[x,y+7]])
            chip(x + 2, y + 3, '#9ba49b', '#9fa99d', i % len(CHIPS), i % 2 == 0)
            chip(x + 9, y + 1, '#a4ad9f', '#b0b7a7', micro=True)
        # Concrete slab joints have a structural direction but survive only as
        # very thin, displaced, interrupted fragments.  No repeating strip.
        joint_spans = [
            [(21,4),(21,14),(20,21)], [(20,32),(20,42),(21,49)],
            [(53,11),(54,17),(54,28)], [(54,44),(53,51),(53,59)],
            [(91,4),(91,13),(90,19)], [(92,35),(91,44),(91,52)],
            [(7,27),(17,27),(23,28)], [(36,29),(46,28),(51,28)],
            [(64,31),(71,31),(78,30)], [(104,28),(113,28),(121,29)],
            [(5,59),(13,58),(20,58)], [(31,61),(39,61),(47,62)],
            [(69,60),(76,61),(83,61)], [(98,60),(104,59),(115,60)],
            [(26,78),(25,87),(25,98)], [(56,88),(55,97),(55,106)],
            [(96,81),(96,89),(95,100)], [(6,108),(13,107),(21,108)],
            [(34,112),(43,111),(50,112)], [(66,109),(73,110),(83,109)],
        ]
        if north:
            joint_spans += [
                [(18,119),(18,130),(17,138)], [(50,136),(51,142),(50,150)],
                [(93,121),(94,129),(94,138)], [(5,151),(16,150),(24,151)],
                [(38,152),(47,151),(56,151)], [(71,153),(78,154),(86,153)],
                [(104,151),(111,150),(121,151)], [(24,163),(25,175),(24,181)],
                [(57,168),(58,176),(58,184)], [(101,166),(101,179),(100,185)],
                [(7,187),(15,188),(22,187)], [(36,190),(45,190),(53,191)],
                [(75,188),(83,187),(91,188)], [(107,191),(116,192),(123,191)],
                [(19,207),(19,215),(20,226)], [(60,211),(59,220),(59,229)],
                [(98,202),(98,212),(97,222)], [(4,235),(13,235),(23,234)],
                [(36,238),(45,237),(52,237)], [(69,236),(79,235),(87,236)],
            ]
        for i, points in enumerate(joint_spans):
            mark('#8f9d8f' if i % 4 == 0 else '#949f92', points)
            if i % 5 == 2:
                a = points[1]
                line('#b1b7a8', a[0]+1, a[1]+1, a[0]+3, a[1]+1)
        cracks = [[(52,83),(56,88),(55,94),(60,100),(60,107),(63,113),(61,122),(66,130),(63,137),(64,144),(60,151)],
                  [(61,122),(54,124),(51,121),(45,122),(41,118)],
                  [(66,130),(73,135),(77,135),(82,142)],
                  [(15,194),(19,202),(17,210),(23,216),(22,222)]] if north else [
                  [(89,40),(84,47),(85,53),(81,59),(81,65),(77,70),(79,77),(73,82),(71,89)],
                  [(77,70),(71,71),(68,75),(63,77),(59,82)],
                  [(79,77),(86,80),(91,85),(97,84)]]
        for points in cracks:
            mark('#819482', points)
            for i, (a,b) in enumerate(zip(points,points[1:])):
                if i % 3 == 1:
                    mark('#6f8676', [a,b])
                if i % 4 == 2:
                    chip(a[0]+1,a[1]-1,'#97a58f','#b4b6a1',micro=True)
        # Washing is expressed as short cornered abrasion clusters in a few
        # sites, with a little mineral white only on broken chips, never disks.
        wear = [(32,68),(102,126),(51,159),(20,222),(76,239)] if north else [(35,66),(62,50),(102,115)]
        for i, (cx,cy) in enumerate(wear):
            for n in range(5):
                chip(cx+r.randint(-5,5),cy+r.randint(-5,5),'#a9b19f','#b8bdab',(n+i)%len(CHIPS), n%2==0, micro=n>1)
            for n in range(4):
                chip(cx+r.randint(-8,8),cy+r.randint(-7,7),'#899a88','#a2ae9b',micro=True)
        # A few small pore clusters remain attached to the site's wear palette.
        for cx,cy in repairs_to_centres(repairs):
            for _ in range(3):
                chip(cx+r.randint(-7,7),cy+r.randint(-5,5),'#8c9c8b','#9ba49b',micro=True)

    elif field in ('plaster','stained-plaster'):
        stained = field == 'stained-plaster'
        base = '#a5b09f' if stained else '#aeb7a8'
        fill(base)
        # Surface pigments differ in clearly shaped, small connected areas.
        # Positions intentionally break regular cadence along the long wall.
        sites = [(8,11),(33,44),(56,19),(83,28),(117,7),(143,49),(176,22),
                 (205,39),(241,14),(264,52),(301,25),(328,10),(353,38),
                 (387,17),(416,45),(453,24),(481,8),(509,36),(543,51),
                 (572,19),(608,43),(639,9),(671,30),(698,48),(732,21),(755,7)]
        for i,(x,y) in enumerate(sites):
            chip(x,y,'#93a28d' if stained else '#a0ae9b','#bdc0ac',i%len(CHIPS),i%2==1)
            if i%3 == 0:
                chip(x+3,y+4,'#b8b99f','#c7c4aa',(i+2)%len(CHIPS),i%2==0)
            if i%2 == 0:
                chip(x-3,y+8,'#a5af9a','#c1c5b2',micro=True)
        # Damp is local to irregular lower wall sites, with angled/cornered
        # eroded boundaries.  The rest of the bottom is unchanged base pigment.
        feet = [(5,14),(47,8),(103,11),(159,16),(226,9),(293,14),
                (371,10),(432,17),(494,9),(556,12),(623,16),(702,11),(746,8)]
        for i,(x,span) in enumerate(feet):
            height = [4,7,3,6,5][i%5] + (2 if stained and i%3==0 else 0)
            polygon('#8c9e85' if stained else '#98a98f',
                    [[x,0],[x+span,0],[x+span,height-2],[x+span-3,height-2],
                     [x+span-3,height],[x+5,height],[x+5,height+2],[x+1,height+2],[x+1,3],[x,3]])
            chip(x+3,height-1,base,'#b8c0ab',i%len(CHIPS),i%2==1)
            if i%3 == 1:
                chip(x+span-2,1,'#768f77','#99aa8f',micro=True)
        # A few roof-runoff fissures, interrupted along their course.  Their
        # varying length never forms the old repeated long vertical bars.
        for i,(x,y) in enumerate([(62,51),(189,55),(318,46),(460,52),(599,57),(718,48)]):
            mark('#91a38e',[(x,y),(x+1,y-3),(x,y-6),(x+2,y-10)])
            line('#bec4b1',x+2,y-2,x+3,y-4)
            chip(x-2,y-8,'#9fac99','#c1c4aa',micro=True)

    elif field in ('metal','rust-iron'):
        rusty = field == 'rust-iron'
        fill('#627579' if not rusty else '#67777a')
        # Cool iron retains broad quiet paint, with sharp little worn edges.
        sites = [(5,3),(29,59),(52,1),(77,44),(106,8),(137,58),(162,4),(187,39),(218,2),(246,55)]
        for i,(x,y) in enumerate(sites):
            chip(x,y,'#84979a','#9aaba8',i%len(CHIPS),i%2==0, micro=i%3==2)
            line('#50666c',x+1,y+4,x+4,y+4)
        # Rust starts at selected joins or cut edges and breaks into angular
        # rust paint chips.  It is never random orange confetti over every rail.
        rustsites = [(12,0),(56,56),(113,0),(168,52),(225,1)] if rusty else [(54,58),(163,1),(223,2)]
        for i,(x,y) in enumerate(rustsites):
            chip(x,y,'#806951','#a17c57',(i+2)%len(CHIPS),i%2==0)
            chip(x+2,y+3,'#705e4e','#8d7255',micro=True)
            if y < 8:
                mark('#7d6954',[(x+3,y+4),(x+3,y+7),(x+4,y+9)])
            else:
                mark('#7d6954',[(x+3,y-2),(x+4,y-5),(x+4,y-7)])
        for x,y in [(34,25),(98,29),(154,22),(208,32)]:
            line('#73878b',x,y,x+3,y)

    elif field in ('cap','cement'):
        cap = field == 'cap'
        fill('#b3bcab' if cap else '#919f96')
        sites = [(8,3),(31,42),(59,12),(89,55),(117,26),(151,5),(176,45),(209,17),(237,53)]
        for i,(x,y) in enumerate(sites):
            chip(x,y,'#9ba992' if cap else '#809585','#c4c7b1' if cap else '#a8b19e',i%len(CHIPS),i%2==1)
            if i%3==0:
                chip(x+3,y+3,'#b9b49d' if cap else '#b0aa94','#d0c9af' if cap else '#bfb59b',7)
            chip(x-4,y+7,'#a8b49e' if cap else '#9ca997','#bbc3ad',micro=True)
        # Broken little edge chips catch light separately from the main stone.
        for i,(x,y) in enumerate([(4,1),(41,61),(73,0),(105,60),(147,1),(193,61),(234,0)]):
            chip(x,y,'#c1c8b4' if cap else '#a3b09e','#ccd0bc' if cap else '#b7bea8',micro=True)
        if not cap:
            for points in [[(45,13),(48,20),(47,26),(51,30)],[(184,37),(189,40),(194,39),(198,44)]]:
                mark('#788e7f',points)
                chip(points[1][0]+1,points[1][1],'#99a792','#b6b6a0',micro=True)
    return strokes


def repairs_to_centres(repairs):
    return [(x+3,y+4) for x,y,n in repairs]
