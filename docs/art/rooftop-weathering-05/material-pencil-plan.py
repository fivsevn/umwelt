"""Connected six-colour 1 px Pencil layers, not isolated scattered wear dots.

The supplied station reference is read as layered grey-green concrete/plaster:
joined pigment masses, light old mortar, darker damp mineral areas and fine
joints.  This plan describes explicit strokes only.  Pixelorama owns the actual
painting and export.  Existing 16 px/m UVs and all other atlas fields stay fixed.
"""

from random import Random

RECTS = {
    'north-floor': [512, 0, 128, 256],
    'south-floor': [640, 0, 128, 128],
    'plaster': [0, 512, 768, 64],
    'stained-plaster': [0, 576, 768, 64],
    'cap': [768, 128, 256, 64],
    'cement': [768, 192, 256, 64],
}
PALETTES = {
    'north-floor': ['#99a699','#b5bfa9','#c1c7b1','#819681','#647d6c','#aca58c'],
    'south-floor': ['#99a699','#b5bfa9','#c1c7b1','#819681','#647d6c','#aca58c'],
    'plaster': ['#a9b5a0','#bbc2aa','#c8ccb5','#91a18a','#728b74','#b5ad91'],
    'stained-plaster': ['#a0ad98','#b3bda4','#c3c9ae','#859b84','#687e68','#afa78a'],
    'cap': ['#b1bbaa','#c7cbb5','#d2d3bc','#97a68e','#7e927c','#b5ab8f'],
    'cement': ['#929f92','#adb7a1','#bcc2a9','#7a917c','#5f7868','#a99f87'],
}

# Explicitly authored angular old-layer boundaries.  Their related, joined
# masses are drawn at different dimensions and turns; these are not tile cells.
BOUNDARIES = [
    [(0,5),(7,5),(7,1),(15,1),(15,3),(24,3),(24,14),(19,14),(19,22),(9,22),(9,19),(0,19)],
    [(0,8),(4,8),(4,0),(12,0),(12,5),(17,5),(17,3),(24,3),(24,15),(15,15),(15,24),(6,24),(6,18),(0,18)],
    [(0,3),(10,3),(10,0),(18,0),(18,7),(24,7),(24,19),(15,19),(15,24),(4,24),(4,15),(0,15)],
    [(0,0),(13,0),(13,4),(22,4),(22,11),(24,11),(24,18),(17,18),(17,24),(9,24),(9,16),(4,16),(4,9),(0,9)],
    [(2,0),(16,0),(16,6),(24,6),(24,14),(20,14),(20,20),(13,20),(13,24),(0,24),(0,13),(5,13),(5,8),(2,8)],
    [(0,4),(6,4),(6,0),(18,0),(18,3),(24,3),(24,10),(20,10),(20,16),(13,16),(13,24),(4,24),(4,18),(0,18)],
]


def material_plan(field, w, h, seed):
    if field not in RECTS or [w,h] != RECTS[field][2:]:
        raise ValueError('Only the six unchanged atlas fields are painted')
    r = Random(seed)
    base, old, mineral, damp, fissure, warm = PALETTES[field]
    marks = []

    def mark(color, points):
        pts = []
        for x,y in points:
            xy = [max(0,min(w-1,int(x))),max(0,min(h-1,int(y)))]
            if not pts or xy != pts[-1]:
                pts.append(xy)
        if len(pts)==1:
            pts.append(pts[0][:])
        if pts:
            marks.append({'color':color,'points':pts})

    def line(color,x,y,x1,y1):
        mark(color,[(x,y),(x1,y1)])

    def polygon(color,vertices):
        for y in range(max(0,min(v[1] for v in vertices)),min(h-1,max(v[1] for v in vertices))+1):
            cuts=[]
            for a,b in zip(vertices,vertices[1:]+vertices[:1]):
                if a[1]<=y<b[1] or b[1]<=y<a[1]:
                    cuts.append(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]))
            cuts.sort()
            for a,b in zip(cuts[::2],cuts[1::2]):
                if b>=0 and a<w:
                    line(color,round(a),y,round(b),y)

    def micro(color,x,y,shape=0):
        paths = [[(0,0),(2,0),(2,1),(3,1)],[(0,0),(0,2),(1,2),(1,3)],
                 [(0,1),(1,1),(1,0),(3,0)],[(0,0),(2,0),(2,2),(1,2)]]
        mark(color,[(x+a,y+b) for a,b in paths[shape%4]])

    def patch(x,y,pw,ph,kind,index):
        # One larger previous pigment layer is eroded by visible base islands
        # and intersects a second, offset layer.  No concentric outline or coin.
        pw=max(8,round(pw*(0.84 if field=='south-floor' else 0.89)))
        ph=max(8,round(ph*0.88))
        verts=BOUNDARIES[index%len(BOUNDARIES)]
        flipx=index%3==1
        flipy=index%4==2
        def shape(vertices,ox,oy,sw,sh):
            pts=[]
            for a,b in vertices:
                if flipx:a=24-a
                if flipy:b=24-b
                pts.append((ox+round(a*sw/24),oy+round(b*sh/24)))
            return pts
        main = old if kind=='washed' else damp
        other = mineral if kind=='washed' else fissure
        polygon(main,shape(verts,x,y,pw,ph))
        # Chipped base colour intrudes from one side and makes a bounded old
        # layer, rather than a flat uniform stain.  The cut is offset per site.
        notch=[(0,1),(12,1),(12,5),(19,5),(19,12),(10,12),(10,19),(0,19)]
        polygon(base,shape(notch,x-3 if index%2==0 else x+pw//2,y+ph//3,max(8,pw//2),max(8,ph//2)))
        # Adjacent pigment remnant has a visibly different layer level.  It
        # crosses the parent's edge at a selected corner, joining two masses.
        remnant=[(2,0),(15,0),(15,6),(24,6),(24,15),(18,15),(18,21),(8,21),(8,24),(0,24),(0,8),(2,8)]
        polygon(other,shape(remnant,x+pw//2,y+ph//7,max(5,pw//3),max(4,ph//4)))
        if index%5==2:
            polygon(damp if kind=='washed' else old,
                    shape(remnant,x+pw*2//3,y+ph*2//3,max(7,pw//2),max(6,ph//3)))
        # Warm exposed mortar is concentrated at a few historical repair sites.
        if index%5==0:
            warm_shape=[(0,3),(5,3),(5,0),(13,0),(13,4),(19,4),(19,12),(11,12),(11,17),(3,17),(3,9),(0,9)]
            polygon(warm,shape(warm_shape,x+pw//3,y+ph//3,8+index%4,7+index%3))
        # Mineral-edge chips and recessed pores sit on the larger old layers.
        # They cluster at eroded corners rather than filling the whole surface.
        for n in range(4):
            edge_x = x+round(pw*(0.18+0.12*n)) + r.choice([-1,0,1])
            edge_y = y+round(ph*(0.16 if n%2 else 0.79)) + r.choice([-2,0,1])
            micro(mineral if kind=='washed' and n%3 else main,edge_x,edge_y,n+index)
        for n in range(2):
            micro(main,x+pw//3+r.randint(-3,3),y+ph//2+r.randint(-3,3),n+index)

    pts=[]
    for y in range(h):
        a,b=(0,w-1) if y%2==0 else (w-1,0)
        pts.extend([(a,y),(b,y)])
    mark(base,pts)

    if field.endswith('floor'):
        north=h==256
        sites=[
            (0,3,39,19,'washed'),(62,0,29,38,'damp'),(93,12,36,22,'damp'),
            (17,21,40,25,'washed'),(45,34,25,29,'washed'),(85,42,35,33,'damp'),
            (0,68,25,38,'washed'),(38,73,42,25,'damp'),(64,94,35,24,'damp'),
            (100,106,29,19,'damp'),(8,115,40,31,'washed'),
        ]
        if not north:
            sites=[(0,0,25,37,'damp'),(37,4,42,23,'washed'),(76,18,40,27,'washed'),
                   (12,36,36,29,'damp'),(46,41,36,19,'damp'),(100,49,29,37,'washed'),
                   (0,81,36,31,'washed'),(30,87,41,21,'washed'),(60,64,30,41,'damp'),
                   (78,103,43,26,'damp'),(34,110,34,19,'washed')]
        if north:
            sites += [(47,128,39,34,'damp'),(82,147,42,19,'damp'),
                      (0,162,37,23,'washed'),(28,177,29,35,'washed'),
                      (66,185,43,28,'damp'),(103,201,25,29,'damp'),
                      (8,216,43,27,'washed'),(44,234,29,23,'washed'),(77,235,35,22,'damp')]
        for i,site in enumerate(sites):
            patch(*site,i+1)
        # Fine structural joints remain readable against connected pigment
        # fields.  Their unequal lengths end under old plaster and repair layers.
        joints=[[(21,3),(21,15),(20,24)],[(53,10),(54,18),(54,28)],
                [(91,3),(91,14),(90,23)],[(5,29),(17,28),(25,29)],
                [(37,30),(48,30),(57,29)],[(76,29),(84,28),(95,29)],
                [(106,29),(117,28),(126,29)],[(20,37),(20,47),(21,56)],
                [(54,43),(53,51),(53,61)],[(92,36),(91,46),(91,56)],
                [(5,62),(16,61),(23,62)],[(37,63),(48,63),(57,64)],
                [(71,61),(82,62),(95,62)],[(108,61),(118,60),(127,61)],
                [(26,79),(25,89),(25,102)],[(56,88),(55,98),(55,109)],
                [(96,82),(96,92),(95,104)],[(5,111),(17,110),(28,111)],
                [(38,114),(49,113),(62,114)],[(77,111),(88,112),(99,111)]]
        if north:
            joints += [[(18,121),(18,132),(17,142)],[(50,138),(51,146),(50,157)],
                       [(94,121),(95,132),(95,144)],[(4,154),(17,153),(28,154)],
                       [(41,155),(53,154),(65,154)],[(82,156),(92,157),(105,156)],
                       [(24,168),(25,179),(24,189)],[(58,172),(59,181),(59,193)],
                       [(102,168),(102,179),(101,190)],[(7,191),(19,192),(31,191)],
                       [(43,194),(53,194),(66,195)],[(81,191),(94,190),(105,191)],
                       [(19,211),(19,222),(20,234)],[(61,213),(60,223),(60,234)],
                       [(99,206),(99,217),(98,227)],[(3,239),(17,239),(28,238)],
                       [(40,242),(51,241),(63,241)],[(81,239),(91,238),(107,239)]]
        for i,points in enumerate(joints):
            mark(damp,points)
            if i%4==0:mark(fissure,points[:2])
            if i%5==1:
                a=points[1]
                line(mineral,a[0]+1,a[1]+1,a[0]+3,a[1]+1)
        cracks=[[(52,83),(56,88),(55,94),(60,100),(60,108),(63,114),(61,123),(66,132),(63,140),(64,146),(60,153)],
                [(61,123),(54,126),(50,122),(43,123),(38,119)],
                [(66,132),(73,138),(78,138),(84,144)],
                [(15,198),(20,206),(18,214),(24,221),(22,228)]] if north else [
                [(89,40),(84,48),(85,54),(81,60),(81,67),(77,72),(79,79),(73,84),(71,93)],
                [(77,72),(70,73),(67,77),(61,79),(56,84)],
                [(79,79),(86,82),(92,87),(98,86)]]
        for points in cracks:
            mark(fissure,points)
            for i,a in enumerate(points[1::3]):
                micro(old,a[0]+1,a[1]-1,i)

    elif field in ('plaster','stained-plaster'):
        # Several old wall layers extend across neighbouring smaller clusters,
        # with unequal gaps and heights.  Plaster stays one level above floor.
        positions=[(0,2,42,21),(23,24,37,33),(67,6,29,39),(95,31,38,29),
                   (131,0,43,24),(150,26,28,30),(194,13,46,35),(225,2,31,23),
                   (277,30,37,30),(296,8,38,24),(345,0,36,39),(371,32,41,31),
                   (424,10,28,45),(450,28,42,27),(495,1,44,22),(518,21,38,40),
                   (572,6,27,43),(598,35,37,26),(639,2,41,24),(658,24,36,34),
                   (714,15,35,34),(739,0,30,23)]
        for i,(x,y,pw,ph) in enumerate(positions):
            patch(x,y,pw,ph,'damp' if (i//2+int(field=='stained-plaster'))%3==0 else 'washed',i+3)
        # An irregular damp relation touches the foot locally and disappears
        # elsewhere; it is distinct from a continuous bottom stripe.
        for i,(x,span) in enumerate([(9,19),(72,24),(162,17),(245,27),(357,21),(441,28),(545,24),(654,19),(734,21)]):
            polygon(damp,[(x,0),(x+span,0),(x+span,3),(x+span-5,3),(x+span-5,8),(x+7,8),(x+7,11),(x+2,11),(x+2,4),(x,4)])
            micro(fissure,x+6,2,i)
            micro(old,x+span-3,7,i+1)
        for i,(x,y) in enumerate([(45,55),(167,47),(297,56),(420,49),(554,56),(690,48)]):
            mark(damp,[(x,y),(x+1,y-4),(x,y-9),(x+2,y-14)])
            line(mineral,x+2,y-2,x+3,y-5)

    else:
        sites=[(0,2,35,29,'washed'),(31,28,31,33,'damp'),(58,5,36,33,'washed'),
               (91,30,32,34,'damp'),(122,1,36,31,'washed'),(155,24,33,34,'washed'),
               (186,6,37,32,'damp'),(219,29,36,34,'washed')]
        for i,site in enumerate(sites):
            patch(*site,i+6)
        for i,(x,y) in enumerate([(7,1),(48,59),(88,0),(125,61),(166,1),(201,60),(238,0)]):
            micro(mineral,x,y,i)
            micro(damp,x+5,y+2,i+1)
        if field=='cement':
            for points in [[(45,14),(49,21),(48,28),(53,32)],[(182,36),(188,40),(195,39),(201,45)]]:
                mark(fissure,points)
                a=points[1]
                micro(warm,a[0]+1,a[1],1)
    return marks
