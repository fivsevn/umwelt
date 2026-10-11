"""Photo-led local retouch, painted only by Pixelorama's native 1 px Pencil.

The final 06 native cel is read only to pick existing mineral pigments for
local restoration. No raster is generated or edited by Python. Quiet substrate
and untargeted pixels are retained; these are explicit Pencil stroke plans.
"""
from pathlib import Path
from random import Random
import runpy
import zipfile

HERE=Path(__file__).resolve().parent
PREVIOUS=runpy.run_path(str(HERE.parent/'rooftop-weathering-06/material-pencil-plan.py'))
RECTS=PREVIOUS['RECTS']
BASES=PREVIOUS['BASES']
PALETTES=PREVIOUS['PALETTES']


def path_pixels(points):
    """Integer coordinates for an explicit thin Pencil path, not a bitmap."""
    out=[]
    for (x,y),(xx,yy) in zip(points,points[1:]):
        dx,dy=abs(xx-x),-abs(yy-y)
        sx,sy=1 if x<xx else -1,1 if y<yy else -1
        error=dx+dy
        while True:
            if not out or out[-1]!=(x,y):out.append((x,y))
            if (x,y)==(xx,yy):break
            e=2*error
            if e>=dy:error+=dy;x+=sx
            if e<=dx:error+=dx;y+=sy
    return out


def material_plan(field,w,h,seed):
    if [w,h]!=RECTS[field][2:]:raise ValueError('Keep existing six UV rectangles')
    r=Random(seed)
    colors=PALETTES[field]
    rgba=[bytes.fromhex(c[1:])+b'\xff' for c in colors]
    with zipfile.ZipFile(HERE.parent/'rooftop-weathering-06/terrace-book.pxo') as archive:
        source=archive.read('image_data/frames/1/layer_1')
    ox,oy=RECTS[field][:2]
    marks=[]

    def pigment(x,y):
        if not 0<=x<w or not 0<=y<h:return 0
        start=((oy+y)*1024+ox+x)*4
        pixel=source[start:start+4]
        return rgba.index(pixel)

    def mark(index,points):
        points=[[max(0,min(w-1,int(x))),max(0,min(h-1,int(y)))] for x,y in points]
        if len(points)==1:points.append(points[0][:])
        if points:marks.append({'color':colors[index],'points':points})

    def dab(index,x,y):mark(index,[(x,y)])
    def line(index,x,y,x1,y1):mark(index,[(x,y),(x1,y1)])

    def local_mineral(x,y,excluded):
        # Restore the actual adjoining 06 pigment rather than smoothing every
        # old fissure pixel to one flat base or rebuilding the whole surface.
        for dx,dy in [(1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,-1),(2,1),(-2,-1),(1,2),(-1,-2)]:
            if (x+dx,y+dy) not in excluded:
                index=pigment(x+dx,y+dy)
                if index<=6:return index
        return 1

    def fade_old_fissures(paths):
        pixels=set(p for path in paths for p in path_pixels(path))
        for x,y in sorted(pixels,key=lambda p:(p[1],p[0])):
            if pigment(x,y) in (7,9):dab(local_mineral(x,y,pixels),x,y)

    def fade_site(cx,cy,rx,ry):
        # Only strong existing rectangular remnants in selected old repair/
        # water zones are reduced; all quiet/intermediate substrate stays.
        for y in range(max(0,cy-ry),min(h,cy+ry+1)):
            for x in range(max(0,cx-rx),min(w,cx+rx+1)):
                if abs(x-cx)/rx+abs(y-cy)/ry>1.48:continue
                index=pigment(x,y)
                if index in (6,8,10):dab(3 if index==6 else 4,x,y)
                elif index==7:dab(2,x,y)

    def seal(points,deep_segments=(),omitted=(),support=()):
        # A fine seal is mostly neighbour grey. Short dark sections occur at
        # intersections/turns, while skips and unequal side traces break its
        # former even zigzag. No complete bright outline follows the crack.
        for i,(a,b) in enumerate(zip(points,points[1:])):
            if i in support:
                line(3 if i%2 else 4,a[0]+1,a[1],b[0]+1,b[1])
            if i in omitted:
                if i%2:dab(2,*a)
                continue
            mark(9 if i in deep_segments else (5 if i%3==1 else 2),[a,b])
            if i in deep_segments and i%2:
                dab(5,a[0]-1,a[1])
        if len(points)>3:dab(5,*points[-2])

    def small_repair(cx,cy,rows):
        # A small old repair has a quiet continuous near-grey centre, unequal
        # edge losses and a few mineral remnants. It is not a hollow contour,
        # a contrasting central chip, or a field of independent salt grains.
        for dy,a,b in rows:
            line(3,cx+a,cy+dy,cx+b,cy+dy)
        for dx,dy,length in [(-3,0,2),(2,2,3),(-1,5,2),(3,7,2)]:
            line(4,cx+dx,cy+dy,cx+dx+length-1,cy+dy)
        for dx,dy in [(-4,2),(5,3),(-2,8),(3,-1)]:
            dab(6,cx+dx,cy+dy)
        # Tiny warm exposed mortar lives at one eroded edge, never fills centre.
        dab(11,cx-3,cy+4)
        dab(4,cx-2,cy+4)
        dab(2,cx+3,cy+5)

    def water(points,film_rows,edge_segments=(),dark_segments=()):
        # One shallow local film sits at an actual low-point, with broken
        # offset mineral residue. The edge is open and unequal, not a circle
        # or outlined polygon; the film remains close to substrate value.
        for x,y,length in film_rows:
            line(1,x,y,x+length-1,y)
        for i,(a,b) in enumerate(zip(points,points[1:])):
            if i in dark_segments:mark(5,[a,b])
            elif i%3!=1:mark(2,[a,b])
            if i in edge_segments:
                line(4,a[0]+1,a[1]+1,b[0]+1,b[1]+1)
                if i%2:dab(6,a[0]+2,a[1]+1)
        for i,(x,y) in enumerate(points):
            if i%3==0:dab(1,x-1,y+2)
            if i%4==2:dab(3,x+2,y+3)

    floor=field.endswith('floor')
    if floor:
        north=h==256
        old_cracks=[[(52,84),(56,89),(55,95),(60,101),(60,109),(63,115),(61,124),(66,133),(63,141),(64,147),(60,154)],
                    [(61,124),(54,127),(50,123),(43,124),(38,120)],
                    [(66,133),(73,139),(78,139),(84,145)],
                    [(15,199),(20,207),(18,215),(24,222),(22,229)]] if north else [
                    [(89,41),(84,49),(85,55),(81,61),(81,68),(77,73),(79,80),(73,85),(71,94)],
                    [(77,73),(70,74),(67,78),(61,80),(56,85)],
                    [(79,80),(86,83),(92,88),(98,87)]]
        fade_old_fissures(old_cracks)
        old_sites=[(58,96,9,18),(62,127,10,15),(18,204,8,13),(100,40,9,11),
                   (36,65,15,12),(81,153,15,13),(28,228,14,13),(83,219,12,13),
                   (15,40,13,11),(109,112,14,17),(32,179,16,12),(111,235,14,19)] if north else [
                   (80,65,9,15),(67,80,9,10),(26,26,10,7),(39,70,13,11),
                   (88,30,13,13),(42,114,14,8),(12,15,10,10),(104,107,15,11),(56,55,16,10)]
        for site in old_sites:fade_site(*site)

        # A few straight structural joints are rubbed partly away, retaining
        # floor slab direction without a continuous regular bar network.
        rubbed=[[(5,29),(17,28),(25,29)],[(74,29),(84,28),(95,29)],
                [(20,38),(20,48),(21,57)],[(38,64),(48,64),(57,65)],
                [(5,112),(17,111),(28,112)]]
        if north:rubbed += [[(42,156),(53,155),(65,155)],[(43,195),(53,195),(66,196)],[(81,240),(91,239),(107,240)]]
        for j,points in enumerate(rubbed):
            for i,(x,y) in enumerate(path_pixels(points)):
                if pigment(x,y) in (2,5) and ((i+2*j)%11 in (2,3,4,8)):
                    dab(local_mineral(x,y,set(path_pixels(points))),x,y)
                elif pigment(x,y)==5 and i%4==1:dab(2,x,y)

        if north:
            seal([(52,84),(53,86),(55,88),(55,91),(54,94),(55,96),(58,98),(58,100),(60,102),(59,106),(60,109),(61,111),(61,114),(63,116),(62,119),(61,122),(62,125),(64,127),(64,130),(66,133),(65,136),(63,140),(64,143),(62,146),(62,150),(60,154)],
                 (3,8,15,18),(5,10,13,21,23),(2,3,8,9,15,18,19))
            seal([(61,122),(58,125),(55,125),(53,127),(50,124),(47,125),(44,124),(42,122),(39,123)],(3,6),(1,4,7),(2,3))
            seal([(65,131),(68,134),(70,136),(72,135),(75,138),(78,138),(79,140),(82,142)],(3,),(1,5),(3,4))
            seal([(16,200),(18,203),(18,206),(21,208),(20,212),(18,214),(20,217),(21,220),(24,222),(23,225),(22,229)],(4,8),(2,6),(3,4,8))
            # Unequal little offshoots are subdued, short and mostly incomplete.
            seal([(58,100),(55,102),(54,105)],(),(1,),())
            seal([(63,140),(66,141),(68,144),(70,143)],(1,),(2,),())
            small_repair(101,35,[(0,-2,2),(1,-4,3),(2,-5,4),(3,-3,5),(4,-4,3),(5,-3,4),(6,-1,3),(7,-2,2),(8,0,2)])
            small_repair(27,179,[(0,-1,3),(1,-3,4),(2,-4,3),(3,-3,5),(4,-5,4),(5,-3,3),(6,-2,4),(7,-3,2),(8,-1,1)])
            water([(2,35),(5,36),(6,39),(5,42),(9,44),(12,44),(14,47),(18,47),(20,49)],
                  [(2,37,3),(3,38,4),(4,39,2),(4,41,4),(6,42,4),(8,43,3)],(2,4,7),(3,))
            water([(113,101),(114,104),(111,106),(113,109),(110,112),(112,115),(115,116),(116,119)],
                  [(115,104,4),(113,105,5),(114,106,3),(112,108,4),(112,110,2)],(1,4),(5,))
            water([(102,238),(105,237),(107,240),(109,240),(111,243),(116,244),(118,247)],
                  [(107,238,3),(108,239,4),(109,241,4),(111,242,3)],(0,3,5),())
            # A rubbed wash area is one low-contrast quiet layer with ragged
            # micro-remnants, not a group of light rectangular tiles.
            for x,y,length in [(30,64,3),(31,65,5),(32,66,4),(32,67,3),(34,68,4),(36,68,3),(33,70,2)]:
                line(3,x,y,x+length-1,y)
            for x,y in [(29,65),(37,66),(35,71),(39,69)]:dab(4,x,y)
        else:
            seal([(89,41),(87,44),(86,46),(84,49),(85,52),(84,55),(82,57),(83,60),(80,62),(81,65),(80,68),(78,71),(77,74),(79,77),(77,80),(76,83),(73,85),(72,88),(72,91),(70,94)],
                 (2,7,12,16),(4,9,14,17),(2,3,7,11,12,16))
            seal([(77,74),(74,74),(72,76),(69,76),(67,78),(64,80),(61,79),(58,82),(56,85)],(3,6),(1,4,7),(3,5))
            seal([(78,79),(81,81),(84,82),(87,84),(90,87),(93,86),(96,88)],(3,),(1,4),(2,3))
            seal([(84,55),(87,56),(88,59)],(),(1,),())
            small_repair(28,22,[(0,-2,1),(1,-3,3),(2,-4,4),(3,-4,2),(4,-3,4),(5,-2,3),(6,-3,2),(7,-1,2)])
            water([(3,8),(6,9),(5,11),(8,13),(9,16),(13,16),(15,19)],
                  [(4,10,3),(5,12,4),(6,13,2),(8,14,3)],(1,4),(2,))
            water([(106,105),(108,106),(109,109),(113,110),(112,113),(116,115),(119,115)],
                  [(108,107,4),(109,108,3),(111,109,4),(113,111,3)],(0,3,5),())
            for x,y,length in [(37,67,3),(36,68,4),(38,69,5),(38,70,3),(40,71,3)]:line(3,x,y,x+length-1,y)
            for x,y in [(36,66),(42,69),(39,73)]:dab(4,x,y)

    elif field in ('plaster','stained-plaster'):
        # Different-length, interrupted thin vertical mineral flows begin at
        # selected old wall-foot scars. They never clone the floor shapes.
        sites=[(72,5),(283,4),(533,8),(688,9)] if field=='stained-plaster' else [(145,4),(458,5),(616,6)]
        for n,(x,y) in enumerate(sites):
            fade_site(x,y,7,8)
            mark(2,[(x,y),(x+1,y+2),(x,y+4)])
            mark(1,[(x,y+6),(x-1,y+8),(x,y+10+n%3)])
            line(5,x,y+2,x,y+3)
            line(3,x+2,y+2,x+2,y+4)
            dab(4,x+1,y+7)
            dab(1,x-1,y+12)
            if n==1:dab(11,x+1,y+1)
    else:
        # Local cap/cement repair only, leaving nearly all 06 painting intact.
        if field=='cement':
            fade_old_fissures([[(45,15),(49,22),(48,29),(53,33)],[(182,37),(188,41),(195,40),(201,46)]])
            seal([(45,15),(47,18),(47,21),(49,23),(48,26),(49,29),(52,31),(53,33)],(2,5),(1,4),(2,5))
            seal([(182,37),(185,38),(187,41),(190,40),(193,41),(197,41),(199,44),(201,46)],(3,),(1,5),(3,))
        else:
            for x,y in [(50,42),(51,43),(52,44),(54,43),(195,37),(197,38)]:
                if pigment(x,y) in (6,8,10):dab(3,x,y)
            line(2,4,2,6,3)
            dab(4,6,4)
            dab(1,8,3)
    return marks
