"""New fragmented mineral layers painted by Pixelorama's native 1 px Pencil.

No BOUNDARIES, macro stamps or scaled 05 silhouettes are reused.  Every short
fragment has a fresh 2–7 px footprint.  Nearby fragments share adjoining tone
levels and a material-directed walk, so dense weathering has internal layers
instead of being a uniform field of isolated dots.  No raster is made here.
"""

from random import Random

RECTS = {
    'north-floor':[512,0,128,256], 'south-floor':[640,0,128,128],
    'plaster':[0,512,768,64], 'stained-plaster':[0,576,768,64],
    'cap':[768,128,256,64], 'cement':[768,192,256,64],
}
BASES = {
    'north-floor':'#99a199','south-floor':'#99a199',
    'plaster':'#a4aca4','stained-plaster':'#9fa79f',
    'cap':'#adb5ad','cement':'#939b93',
}
OFFSETS = [(0,0,0),(-4,-4,-4),(-8,-8,-8),(4,4,4),(8,8,8),
           (-12,-12,-12),(12,12,12),(-16,-16,-16),(16,16,16),
           (-39,-35,-37),(32,30,27),(27,16,6)]
PALETTES = {field:['#'+''.join(f'{max(0,min(255,a+d)):02x}' for a,d in zip(bytes.fromhex(base[1:]),offset))
                     for offset in OFFSETS] for field,base in BASES.items()}


def material_plan(field,w,h,seed):
    if field not in RECTS or [w,h] != RECTS[field][2:]:
        raise ValueError('Keep the six existing atlas rectangles unchanged')
    r=Random(seed)
    colors=PALETTES[field]
    marks=[]

    def mark(index,points):
        pts=[]
        for x,y in points:
            xy=[max(0,min(w-1,int(x))),max(0,min(h-1,int(y)))]
            if not pts or xy!=pts[-1]:pts.append(xy)
        if len(pts)==1:pts.append(pts[0][:])
        if pts:marks.append({'color':colors[index],'points':pts})

    def line(index,x,y,x1,y1):mark(index,[(x,y),(x1,y1)])

    def fragment(index,x,y,fw=None,fh=None):
        # Every outline is drawn afresh: lengths, row offsets and broken corner
        # sizes differ.  All constituent Pencil rows remain exactly one pixel.
        fw=r.randint(2,6) if fw is None else fw
        fh=r.choice([1,2,2,3]) if fh is None else fh
        if not 0<=x<w or not 0<=y<h:return
        points=[]
        start=0
        end=fw-1
        for dy in range(fh):
            if dy:
                start=max(0,min(2,start+r.choice([-1,0,1])))
                end=max(start+1,min(6,end+r.choice([-1,0,0,1])))
            a,b=(start,end) if dy%2==0 else (end,start)
            points.extend([(x+a,y+dy),(x+b,y+dy)])
        mark(index,points)

    def chain(x,y,steps,indices,vertical=False,reach=12):
        # Connected short remnants follow the same local material layer.  The
        # palette moves only to a neighbour, rather than choosing far-apart
        # light/dark values for every mark or outlining a solid coloured island.
        originx,originy=x,y
        level=r.randrange(len(indices))
        for n in range(steps):
            if n:level=max(0,min(len(indices)-1,level+r.choice([-1,0,0,1])))
            fragment(indices[level],x,y)
            if vertical:
                x+=r.choice([-2,-1,0,1,2]);y+=r.randint(1,3)
            else:
                x+=r.randint(1,4);y+=r.choice([-2,-1,0,1,2])
            if abs(x-originx)>reach or abs(y-originy)>reach:
                x=originx+r.randint(-3,3);y=originy+r.randint(-3,3)

    def region(cx,cy,rx,ry,chains,indices,vertical=False):
        # A physical wear site has unequal density: denser near a scar and
        # broken near its margin.  Its interior is always several small pigment
        # remnants with neighbouring values, never one painted polygon.
        for n in range(chains):
            dx=round((r.uniform(-1,1)+r.uniform(-1,1))*rx/2)
            dy=round((r.uniform(-1,1)+r.uniform(-1,1))*ry/2)
            chain(cx+dx,cy+dy,r.randint(3,7),indices,vertical,reach=r.randint(5,11))

    # The new substrate is a quiet grey-green mineral family.
    points=[]
    for y in range(h):
        a,b=(0,w-1) if y%2==0 else (w-1,0)
        points.extend([(a,y),(b,y)])
    mark(0,points)

    floor=field.endswith('floor')
    wall=field in ('plaster','stained-plaster')
    # Near-base dry mineral layers are denser in some zones and quieter in
    # others.  Their connected small remnants use only +/-4 and +/-8 colours.
    # Randomness varies outline and spacing; it does not paint independent
    # high-contrast noise over the full surface.
    for n in range(w*h//57):
        x=r.randrange(1,w-7);y=r.randrange(1,h-4)
        if floor:
            # Larger untouched regions sit between the actual repair/wash
            # sites.  Their skewed boundaries only change mark density and
            # never become a filled silhouette or visible contour.
            quiet=(43<x<101 and 27<y<78 and y<94-x//4) or (h==256 and 32<x<72 and 166<y<208-x//8)
            crowded=x<14 or x>108 or (h==256 and 49<x<71 and 85<y<146) or (h==128 and 65<x<92 and 51<y<95)
            density=.22 if quiet else (.94 if crowded else .72)
            if r.random()>density:continue
            vertical=False
        elif wall:
            quiet=20<y<48 and (41<x<113 or 266<x<349 or 586<x<680)
            density=.30 if quiet else (.93 if y<17 else .68)
            if r.random()>density:continue
            vertical=n%3!=0
        else:
            if (80<x<150 and 24<y<48 and r.random()<.65) or r.random()>.82:continue
            vertical=n%5==0
        chain(x,y,r.randint(4,7),[1,2,1,3,4],vertical,reach=r.randint(7,14))

    if floor:
        north=h==256
        # Mortar seams and rubbed slab edges, distinct north/south compositions.
        joints=[[(21,3),(21,15),(20,25)],[(53,9),(54,17),(54,28)],
                [(91,4),(91,14),(90,23)],[(5,29),(17,28),(25,29)],
                [(39,31),(48,31),(56,30)],[(74,29),(84,28),(95,29)],
                [(106,29),(117,28),(125,29)],[(20,38),(20,48),(21,57)],
                [(54,43),(53,52),(53,62)],[(92,37),(91,46),(91,57)],
                [(5,63),(16,62),(24,63)],[(38,64),(48,64),(57,65)],
                [(72,62),(82,63),(94,63)],[(108,62),(117,61),(126,62)],
                [(26,80),(25,90),(25,102)],[(56,89),(55,99),(55,109)],
                [(96,83),(96,93),(95,104)],[(5,112),(17,111),(28,112)],
                [(39,115),(49,114),(62,115)],[(78,112),(88,113),(99,112)]]
        if north:
            joints += [[(18,121),(18,133),(17,144)],[(50,139),(51,147),(50,157)],
                       [(94,122),(95,133),(95,144)],[(4,155),(17,154),(28,155)],
                       [(42,156),(53,155),(65,155)],[(82,157),(92,158),(105,157)],
                       [(24,169),(25,180),(24,190)],[(58,173),(59,182),(59,193)],
                       [(102,169),(102,180),(101,191)],[(7,192),(19,193),(31,192)],
                       [(43,195),(53,195),(66,196)],[(81,192),(94,191),(105,192)],
                       [(19,212),(19,223),(20,235)],[(61,214),(60,224),(60,235)],
                       [(99,207),(99,218),(98,228)],[(3,240),(17,240),(28,239)],
                       [(40,243),(51,242),(63,242)],[(81,240),(91,239),(107,240)]]
        for i,points in enumerate(joints):
            if i%3==0:mark(5,points)
            else:mark(2,points)
            if i%5==1:
                a=points[1]
                fragment(6,a[0]+1,a[1],3,1)
            # Only a few joint edges retain a second narrow mortar level.
            if i%6==2:
                a=points[0]
                chain(a[0]+2,a[1]+2,3,[1,2,5],False,6)
        repairs=[(58,96,7,17),(62,127,8,14),(18,204,7,12),(100,40,8,10)] if north else [(80,65,8,14),(67,80,8,9),(26,26,9,6)]
        for i,(cx,cy,rx,ry) in enumerate(repairs):
            region(cx,cy,rx,ry,22 if i<2 else 12,[1,2,5,7],False)
            region(cx+2,cy-1,max(3,rx-2),max(3,ry-3),10,[3,4,6],False)
            if i in (1,2):
                fragment(11,cx-1,cy+2,3,2)
                fragment(6,cx+1,cy+3,3,1)
        # Unequal old water/washing sites are fragmented graded material
        # remnants.  No circular/polygon puddle area or full outline is painted.
        damp=[(15,40,12,10),(109,112,13,16),(32,179,15,11),(111,235,13,18)] if north else [(12,15,9,9),(104,107,14,10),(56,55,15,9)]
        wash=[(36,65,14,11),(81,153,14,12),(28,228,13,12),(83,219,11,12)] if north else [(39,70,12,10),(88,30,12,12),(42,114,13,7)]
        for cx,cy,rx,ry in damp:
            region(cx,cy,rx,ry,21,[1,2,5,7],False)
        for cx,cy,rx,ry in wash:
            region(cx,cy,rx,ry,19,[3,4,6,8],False)
            # Sparse mineral edge glints do not fill the abrasion site.
            for n in range(5):
                fragment(10,cx+r.randint(-rx,rx),cy+r.randint(-ry,ry),r.choice([2,3]),1)
        cracks=[[(52,84),(56,89),(55,95),(60,101),(60,109),(63,115),(61,124),(66,133),(63,141),(64,147),(60,154)],
                [(61,124),(54,127),(50,123),(43,124),(38,120)],
                [(66,133),(73,139),(78,139),(84,145)],
                [(15,199),(20,207),(18,215),(24,222),(22,229)]] if north else [
                [(89,41),(84,49),(85,55),(81,61),(81,68),(77,73),(79,80),(73,85),(71,94)],
                [(77,73),(70,74),(67,78),(61,80),(56,85)],
                [(79,80),(86,83),(92,88),(98,87)]]
        for points in cracks:
            mark(7,points)
            for i,(a,b) in enumerate(zip(points,points[1:])):
                if i%3==1:mark(9,[a,b])
                if i%4==0:fragment(6,a[0]+1,a[1],2,1)
        # Grains are concentrated beside scars and abrasion, with little quiet
        # substrate aggregate.  No full-surface single-pixel peppering.
        for cx,cy,rx,ry in repairs+wash:
            for n in range(6):
                fragment(7 if n%2 else 6,cx+r.randint(-rx,rx),cy+r.randint(-ry,ry),2,1)

    elif wall:
        # Vertical mineral wash and little wall-foot scars, location-driven.
        weather=[(15,5,13,4),(73,10,10,7),(144,4,14,4),(203,13,8,8),
                 (282,6,15,5),(364,12,11,8),(457,5,16,4),(532,11,9,8),
                 (616,5,15,5),(688,12,11,8),(753,4,14,4)]
        for i,(cx,cy,rx,ry) in enumerate(weather):
            region(cx,cy,rx,ry,14 if field=='plaster' else 21,[1,2,5,7],True)
            if i%3==1:
                fragment(9,cx,cy,2,1)
                fragment(11,cx+2,cy+1,3,2)
        # Old limework: adjacent subtle light remnants, not repeated pale spots.
        for i,(cx,cy) in enumerate([(36,25),(127,42),(237,30),(319,49),(397,25),(508,42),(597,27),(723,45)]):
            region(cx,cy,10+i%4,6+i%3,17,[3,4,6,8],False)
            if i%3==0:
                fragment(11,cx+2,cy+1,4,2)
            for n in range(3):fragment(10,cx+r.randint(-7,7),cy+r.randint(-5,5),2,1)
        # Short, interrupted 1–3 px runoff strings, separately graded.
        for i,(x,y) in enumerate([(49,54),(166,50),(297,58),(422,51),(553,57),(697,49)]):
            chain(x,y-13,5,[1,2,5],True,10)
            line(7,x+1,y-8,x+1,y-6)
            fragment(6,x+2,y-3,2,1)

    else:
        for i,(cx,cy) in enumerate([(13,5),(51,42),(85,19),(121,54),(159,12),(196,37),(236,7)]):
            region(cx,cy,12+i%4,7+i%3,15,[1,2,5,7],False)
            region(cx+4,cy+1,7,5,10,[3,4,6,8],False)
            if i%3==0:fragment(11,cx,cy,3,2)
            for n in range(3):fragment(10,cx+r.randint(-9,9),cy+r.randint(-5,5),2,1)
        for i,(x,y) in enumerate([(6,1),(45,62),(79,0),(127,61),(167,1),(203,62),(242,0)]):
            chain(x,y,4,[1,2,5],False,7)
            fragment(10,x+1,y,3,1)
        if field=='cement':
            for points in [[(45,15),(49,22),(48,29),(53,33)],[(182,37),(188,41),(195,40),(201,46)]]:
                mark(7,points)
                mark(9,points[:2])
    return marks
