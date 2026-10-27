"""Individually authored species pigment for the pocket shell and gecko charms.

This module has no Blender dependency. ``paint`` returns bottom-first RGB hex
pixels ready for a packed Non-Color image and Closest texture interpolation.
Shapes are connected finite-color pigment islands, never photographic noise.
The shell adapts each animal's dorsal/mask/tail motifs onto the visible frame;
the charm keeps their anatomical placement on its native .9 x 1.65 map.
"""
import math


# Key cap colors and printed icon inks are the approved originals. Only the
# casing/charm pigment colors are newly selected from the living species.
PALETTES = {
    'leopard': dict(base='dabb70', light='f0dba3', shade='ad9256', spot='453d30', rear='817557', key='e6d9b5', center='9c604d', ink='4a493c', pigment='92764b', pale='e7d4a8'),
    'tokay': dict(base='8aadb9', light='c4d3cd', shade='648794', spot='c76f4c', rear='516d7b', key='dfdfc1', center='b88066', ink='334b4e', pigment='9c5541', pale='d8dcc7'),
    'day': dict(base='66ac68', light='afd2aa', shade='40845d', spot='b84338', rear='3c685f', key='dfd7af', center='b97856', ink='314d43', pigment='8a3736', pale='a3c580'),
    'crested': dict(base='ad8967', light='e1d1a4', shade='83664c', spot='6a4d39', rear='6c6255', key='dfd0af', center='92715b', ink='4c453a', pigment='cbb184', pale='e2cea2'),
    'fat-tail': dict(base='b68d6a', light='e2c89e', shade='89664d', spot='544035', rear='655749', key='e2cfaa', center='ad7758', ink='4c4338', pigment='7b5341', pale='ebd7b3'),
    'mossy': dict(base='90977b', light='d5d7b4', shade='6b7764', spot='4e594a', rear='576b60', key='dbd5b5', center='818a65', ink='394c3f', pigment='967860', pale='c0c3a2'),
    'electric': dict(base='4a9dc1', light='a1bfca', shade='337b9f', spot='24444b', rear='394f66', key='d5d6bd', center='af9670', ink='344858', pigment='368eaf', pale='79b4c8'),
    'stone': dict(base='aba997', light='e0ddc5', shade='858b7e', spot='666c61', rear='626e6a', key='e5dfc6', center='898b7b', ink='434e49', pigment='959582', pale='c9c9ae'),
}


def _mix_hex(a,b,weight):
    aa=[int(a[i:i+2],16) for i in (0,2,4)]
    bb=[int(b[i:i+2],16) for i in (0,2,4)]
    return ''.join(f'{round(x+(y-x)*weight):02x}' for x,y in zip(aa,bb))


def _muted(hex_color,amount=.22):
    rgb=[int(hex_color[i:i+2],16) for i in (0,2,4)]
    grey=round(rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722)
    return _mix_hex(hex_color,f'{grey:02x}'*3,amount)


# Return to the approved dyed-plastic base colors. The later species pass had
# increased saturation and pigment coverage simultaneously, flattening the
# cover. Key caps and all original screen-print ink entries remain exact.
_APPROVED_BASE={
    'leopard':'ddc182','tokay':'98b7b9','day':'6ba894','crested':'c5ad89',
    'fat-tail':'b29475','mossy':'a5b294','electric':'658caa','stone':'bab9aa'}
for _theme,_p in PALETTES.items():
    _p['base']=_muted(_APPROVED_BASE[_theme])
    for _key in ['shade','spot','pigment','pale','rear']:_p[_key]=_muted(_p[_key])


class _Canvas:
    def __init__(self, theme, width, height):
        self.w, self.h = int(width), int(height)
        if self.w < 1 or self.h < 1:
            raise ValueError('Pixel paint needs positive dimensions')
        self.p = PALETTES[theme]
        self.pixels = [self.p['base']] * (self.w * self.h)
        self.shell_wide = False

    def put(self, x, y, color):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.pixels[y * self.w + x] = self.p.get(color, color)

    def polygon(self, points, color):
        """Normalized coordinates, rasterized once at the native texel size."""
        if self.shell_wide:
            # The landscape screen leaves slimmer side rails. Move anatomical
            # flank motifs onto those rails instead of losing them behind LCD.
            # Crown/heel composition remains independent of this adaptation.
            adapted=[]
            for x,y in points:
                weight=min(1,max(0,(y-.10)/.08),max(0,(.90-y)/.08))
                rail_x=x*.63 if x<.22 else (1-(1-x)*.63 if x>.78 else x)
                adapted.append((x+(rail_x-x)*weight,y))
            points=adapted
        points = [(x*self.w, y*self.h) for x,y in points]
        x0, x1 = max(0, math.floor(min(p[0] for p in points))), min(self.w-1, math.ceil(max(p[0] for p in points)))
        y0, y1 = max(0, math.floor(min(p[1] for p in points))), min(self.h-1, math.ceil(max(p[1] for p in points)))
        for y in range(y0, y1+1):
            py = y+.5
            for x in range(x0, x1+1):
                px, inside = x+.5, False
                for a,b in zip(points,points[1:]+points[:1]):
                    if (a[1] > py) != (b[1] > py) and px < (b[0]-a[0])*(py-a[1])/(b[1]-a[1])+a[0]:
                        inside = not inside
                if inside: self.put(x,y,color)

    def island(self, u, v, rx, ry, color, phase=0):
        """Uneven solid spot with a few large lobes, radii in native texels."""
        points=[]
        for i in range(14):
            a=i*2*math.pi/14
            edge=1+.13*math.sin(3*a+phase)+.09*math.cos(5*a-phase*.7)
            points.append((u+rx*edge*math.cos(a)/self.w,v+ry*edge*math.sin(a)/self.h))
        self.polygon(points,color)

    def line(self, points, radius, color):
        """A connected pixel stroke with rounded ends, not a noisy one-pixel line."""
        for (ax,ay),(bx,by) in zip(points,points[1:]):
            steps=max(1,math.ceil(math.hypot((bx-ax)*self.w,(by-ay)*self.h)))
            for i in range(steps+1):
                t=i/steps
                self.island(ax+(bx-ax)*t,ay+(by-ay)*t,radius,radius,color)

    def lichen(self, u, v, rx, ry, color, phase=0):
        """Branched camouflage edge, distinct from solid rounded animal spots."""
        points=[]
        for i in range(24):
            a=i*2*math.pi/24
            edge=1+.28*math.sin(3*a+phase)+.19*math.cos(5*a-phase*.7)+.10*math.sin(7*a+phase)
            points.append((u+rx*edge*math.cos(a)/self.w,v+ry*edge*math.sin(a)/self.h))
        self.polygon(points,color)


def _charm_xy(x,y):
    return .5+x/.9,.5+y/1.65


def _leopard(c):
    # Solid black spots on head, trunk and limbs; tail retains broken bands.
    spots=[(-.12,.39,1.7),(.10,.36,1.9),(-.02,.27,1.5),(.025,.43,1.3),(-.15,.30,1.4),
           (-.085,.14,1.8),(.075,.10,2.2),(-.055,-.015,1.7),(.08,-.09,1.6),
           (-.08,-.16,2.0),(.02,-.22,1.6),(-.25,.09,1.4),(.25,.09,1.5),
           (-.24,-.29,1.5),(.24,-.30,1.3)]
    for i,(x,y,r) in enumerate(spots):
        u,v=_charm_xy(x,y);c.island(u,v,r,r*.83,'spot',i*.8)
    for i,(y,shift) in enumerate([(-.35,.04),(-.47,.12),(-.58,.14),(-.69,.045)]):
        u,v=_charm_xy(shift,y)
        c.island(u,v,6.0-i*.65,2.4,'spot',.4+i)


def _tokay(c):
    for i,(x,y,r) in enumerate([(-.12,.40,2.0),(.09,.34,2.2),(-.06,.25,1.7),(.07,.15,2.2),
                              (-.07,.04,2.4),(.10,-.04,1.8),(-.07,-.16,2.0),(.065,-.25,1.8),
                              (.11,-.38,1.6),(.13,-.51,1.7),(.08,-.64,1.4),
                              (-.25,.10,1.5),(.25,-.27,1.6)]):
        u,v=_charm_xy(x,y);c.island(u,v,r,r*.88,'spot',i*.65)
    for i,(x,y) in enumerate([(.015,.39),(-.13,.29),(.12,.22),(-.10,.12),(.03,-.06),(-.10,-.23),(.15,-.43),(.04,-.57)]):
        u,v=_charm_xy(x,y);c.island(u,v,.9,1.0,'pale',i)


def _day(c):
    # Giant day gecko red pigment is concentrated dorsally, with eye masks.
    for i,(x,y,rx,ry) in enumerate([(.035,.14,3.0,2.4),
                                  (-.025,.045,3.4,2.0),(.028,-.06,2.7,1.8),(-.020,-.17,2.0,1.3)]):
        u,v=_charm_xy(x,y);c.island(u,v,rx,ry,'spot',1+i)
    for side in [-1,1]:
        # A narrow snout-to-eye red line runs diagonally across each cheek.
        # Leave the central forehead green, so it cannot read as a red stamp.
        c.line([_charm_xy(side*.018,.425),_charm_xy(side*.066,.380),
                _charm_xy(side*.111,.322)],.95,'pigment')


def _crested(c):
    # Twin cream crest borders; the tan dorsal field has irregular tiger
    # branches, distinct from fat-tail's broad closed dark body bands.
    left=[(-.16,.45),(-.195,.33),(-.14,.18),(-.13,.02),(-.115,-.15),(-.075,-.30),
          (-.052,-.29),(-.084,-.13),(-.101,.025),(-.108,.18),(-.161,.33),(-.13,.44)]
    c.polygon([_charm_xy(x,y) for x,y in left],'pale')
    c.polygon([_charm_xy(-x,y) for x,y in left],'pigment')
    branches=[(-.15,.10,-.028,.13),(.15,.015,.025,.060),(-.14,-.09,-.035,-.060),(.13,-.18,.015,-.135)]
    for i,(x1,y1,x2,y2) in enumerate(branches):
        c.line([_charm_xy(x1,y1),_charm_xy((x1+x2)*.6,(y1+y2)/2),_charm_xy(x2,y2)],1.4,'spot')
    for i,(y,x) in enumerate([(-.34,.02),(-.46,.07),(-.59,.10)]):
        u,v=_charm_xy(x,y);c.island(u,v,4.0,1.6,'spot',i)


def _fat_tail(c):
    # Three broad dark saddles, dark head cap and short thick banded tail.
    for y,half in [(.25,.055),(.03,.058),(-.18,.058),(-.41,.045),(-.58,.042),(-.72,.035)]:
        u,v=_charm_xy(0,y)
        c.island(u,v,18,half/1.65*c.h,'spot',y*8)
    c.line([_charm_xy(0,.455),_charm_xy(.008,.30),_charm_xy(-.006,.10),
            _charm_xy(.006,-.12),_charm_xy(-.020,-.34),_charm_xy(-.062,-.49),_charm_xy(-.092,-.63)],1.0,'pale')


def _mossy(c):
    # Interlocking charcoal/rust/grey-olive patches and a patchy pale nape.
    patches=[(-.09,.37,5,4,'pale'),(.09,.33,5,5,'spot'),(-.045,.15,8,5,'spot'),
             (.095,.075,7,7,'pigment'),(-.09,-.01,6,8,'pale'),(.025,-.12,7,5,'spot'),
             (-.08,-.22,5,4,'pigment'),(.10,-.34,5,5,'pale'),(.13,-.49,5,5,'spot'),(.035,-.64,4,5,'pigment')]
    for i,(x,y,rx,ry,key) in enumerate(patches):
        u,v=_charm_xy(x,y);c.lichen(u,v,rx,ry,key,1.2+i*.9)
    for i,(x,y) in enumerate([(-.03,.31),(.055,.12),(-.04,-.10),(.11,-.45)]):
        u,v=_charm_xy(x,y);c.lichen(u,v,2.5,2.0,'base',i+.6)


def _electric(c):
    # Adult male blue dwarf geckos have a mostly blue dorsum. Dark markings
    # belong to the face/neck/flank; do not invent full-body racing stripes.
    for side in [-1,1]:
        c.line([_charm_xy(side*.085,.445),_charm_xy(side*.155,.365),
                _charm_xy(side*.142,.275),_charm_xy(side*.10,.215)],1.9,'spot')
    c.line([_charm_xy(-.068,.420),_charm_xy(0,.340),_charm_xy(.068,.420)],1.1,'spot')
    c.line([_charm_xy(-.105,.15),_charm_xy(-.14,.07),_charm_xy(-.13,-.04)],1.0,'pigment')


def _stone(c):
    for i,(x,y) in enumerate([(-.01,.32),(.012,.12),(-.005,-.065),(.025,-.24),(-.025,-.41),(-.075,-.57),(-.17,-.71)]):
        u,v=_charm_xy(x,y);c.island(u,v,12 if y>-.3 else 6,3.0,'spot',i*.8)
        c.island(u+.03,v+.015,5,1.6,'shade',i*.7)
    # Ordered, broken dorsal tubercle rows, tiny centers rather than dust.
    for side in [-1,1]:
        for i,y in enumerate([.20,.08,-.045,-.17,-.285]):
            u,v=_charm_xy(side*(.08+(i%2)*.015),y)
            c.island(u,v,1.25,1.4,'pale',i)
            c.island(u,v,.55,.65,'spot',i)


_DRAW = {'leopard':_leopard,'tokay':_tokay,'day':_day,'crested':_crested,
         'fat-tail':_fat_tail,'mossy':_mossy,'electric':_electric,'stone':_stone}



def _shell_finish(theme,width,height):
    """Quiet dyed ABS first; each species pigment is a secondary surface detail.

    The continuous broad side shade and uninterrupted chin restore the approved
    rounded cover. Smaller species-specific pigment groups leave that lighting
    legible. Full anatomical patterns remain independently drawn on the charms.
    """
    c=_Canvas(theme,width,height);c.p=dict(PALETTES[theme]);base=c.p['base']
    # Ink is suspended in aged plastic, not a high-contrast printed skin wrap.
    strength={'leopard':.72,'tokay':.70,'day':.62,'crested':.46,
              'fat-tail':.46,'mossy':.40,'electric':.51,'stone':.43}[theme]
    c.p['spot']=_mix_hex(base,c.p['spot'],strength)
    c.p['pigment']=_mix_hex(base,c.p['pigment'],.56)
    c.p['pale']=_mix_hex(base,c.p['light'],.36)
    c.p['shade']=_mix_hex(base,c.p['shade'],.66)
    # The old broad fields provide a clear plane hierarchy beneath reflections.
    # No per-pixel noise or full-surface dirt is introduced here.
    c.pixels=[c.p['shade'] if x/c.w<.105 or x/c.w>.90 else base
              for y in range(c.h) for x in range(c.w)]
    c.shell_wide=width>height
    if theme=='leopard':
        points=[(.314,.950,2.2),(.570,.973,2.6),(.681,.931,1.8),
                (.065,.746,2.1),(.084,.569,2.3),(.056,.357,1.8),
                (.923,.829,1.9),(.936,.663,2.4),(.909,.452,1.9),(.931,.255,2.0),
                (.284,.060,2.0),(.603,.054,2.5),(.760,.081,1.6)]
        for i,(u,v,r) in enumerate(points):c.island(u,v,r,r*.88,'spot',i*.9)
        for i,(u,v) in enumerate([(.089,.526),(.917,.624),(.742,.044)]):c.island(u,v,.9,1.1,'spot',i)
    elif theme=='tokay':
        points=[(.268,.958,2.1),(.421,.943,1.6),(.620,.969,2.3),(.759,.927,1.9),
                (.067,.794,1.8),(.087,.612,2.0),(.058,.435,1.8),(.104,.254,1.5),
                (.929,.730,2.1),(.914,.562,1.7),(.939,.367,2.0),
                (.298,.067,1.8),(.559,.049,2.1),(.737,.079,1.8)]
        for i,(u,v,r) in enumerate(points):
            c.island(u,v,r,r*.90,'spot',i*.7)
            if i in [0,3,5,8,12]:c.island(u-.022,v+.013,.8,.95,'pale',i)
    elif theme=='day':
        # Small dorsal red groups and cheek streaks leave broad green planes.
        for i,(u,v,rx,ry) in enumerate([(.350,.954,3.1,1.8),(.592,.969,2.3,2.0),(.751,.926,2.0,1.9),
                                       (.074,.677,1.3,2.7),(.925,.422,1.5,2.8),(.336,.058,2.1,1.5)]):
            c.island(u,v,rx,ry,'spot',i+.5)
        c.line([(.149,.890),(.132,.872),(.117,.846)],.8,'pigment')
        c.line([(.854,.894),(.879,.869),(.891,.843)],.8,'pigment')
    elif theme=='crested':
        # Restrained broken cream ridges, echoing actual paired crests without
        # covering the whole inflated shell in two flat graphic ribbons.
        c.line([(.252,.933),(.327,.957),(.405,.966)],1.3,'pale')
        c.line([(.743,.935),(.678,.955),(.600,.965)],1.15,'pale')
        for a,b in [((.122,.829),(.111,.723)),((.109,.615),(.100,.513)),
                    ((.889,.778),(.901,.675)),((.901,.474),(.910,.369))]:c.line([a,b],.8,'pale')
        for i,(u,v) in enumerate([(.079,.787),(.075,.571),(.099,.303),(.923,.726),(.932,.517),(.904,.252)]):
            c.polygon([(u-.010,v+.014),(u+.022,v-.002),(u+.007,v-.018),(u-.014,v-.005)],'spot')
        c.island(.284,.056,3.8,1.5,'pigment',1.2)
        c.island(.695,.050,3.0,1.8,'spot',2.1)
    elif theme=='fat-tail':
        # Two slim, broken saddle echoes preserve the broad original cover.
        for i,(v,half) in enumerate([(.845,.019),(.213,.016)]):
            c.polygon([(-.02,v-half),(.18,v-half*.8),(.37,v-half*1.1),(.62,v-half*.65),
                       (.81,v-half),(1.02,v-half*.85),(1.02,v+half),(.78,v+half*.7),
                       (.59,v+half*.9),(.35,v+half*.65),(.13,v+half),(-.02,v+half*.7)],'spot')
        c.line([(.498,.997),(.501,.944),(.497,.914)],.85,'pale')
        c.line([(.501,.082),(.497,.039),(.501,.009)],.80,'pale')
        for i,(u,v) in enumerate([(.309,.958),(.701,.941),(.076,.585),(.925,.373),(.292,.058)]):
            c.island(u,v,1.4,1.2,'pigment',i)
    elif theme=='mossy':
        patches=[(.304,.959,5.0,2.6,'pigment'),(.573,.966,4.3,2.3,'spot'),(.756,.925,3.9,3.0,'pale'),
                 (.080,.812,3.4,5.3,'spot'),(.063,.631,3.5,5.0,'pigment'),(.101,.454,3.8,5.8,'pale'),
                 (.079,.264,3.6,4.7,'spot'),(.925,.773,4.0,5.0,'pale'),(.934,.578,3.6,5.6,'spot'),
                 (.909,.350,3.6,5.0,'pigment'),(.300,.061,4.2,2.6,'spot'),(.644,.047,4.8,2.4,'pale')]
        for i,(u,v,rx,ry,key) in enumerate(patches):c.lichen(u,v,rx,ry,key,i*.79)
        for i,(u,v) in enumerate([(.072,.634),(.930,.578),(.298,.060)]):c.lichen(u,v,1.5,1.8,'base',i+.7)
    elif theme=='electric':
        # The localized facial V becomes a slim crown trace, not a bold logo.
        c.line([(.332,.969),(.418,.949),(.500,.943),(.584,.951),(.674,.970)],1.1,'spot')
        c.line([(.122,.847),(.108,.819),(.100,.774)],.8,'spot')
        c.line([(.877,.847),(.893,.818),(.901,.777)],.8,'spot')
        c.island(.075,.490,1.8,4.4,'pigment',1)
        c.island(.925,.287,1.7,3.7,'pigment',2)
        c.island(.327,.051,2.4,1.3,'pigment',2.4)
    else:
        # Moorish gecko saddles remain two narrow interrupted bands, similar
        # in restraint to the approved grey device, not an all-over camo wrap.
        for v,half in [(.842,.019),(.208,.016)]:
            c.polygon([(-.02,v-half),(.13,v-half*.8),(.32,v-half),(.52,v-half*.6),
                       (.76,v-half*.9),(1.02,v-half*.7),(1.02,v+half),(.81,v+half*.6),
                       (.58,v+half*.9),(.33,v+half*.7),(.11,v+half),(-.02,v+half*.8)],'spot')
        for i,(u,v) in enumerate([(.326,.958),(.650,.945),(.068,.666),(.100,.406),(.923,.710),(.914,.489),(.300,.058),(.672,.043)]):
            c.island(u,v,1.4 if i%3 else 1.9,1.4,'spot',i*.8)
        for i,(u,v) in enumerate([(.090,.742),(.075,.382),(.932,.606),(.911,.298)]):
            c.island(u,v,.8,1.1,'pale',i)
    # A few connected corner rubs retained from the approved native paint.
    # Larger physical handling wear is handled by the plastic shader/geometry.
    for x,y in [(29,231),(17,73),(161,40)]:
        x,y=round(x*width/192),round(y*height/256)
        for dx,dy in [(0,0),(1,0),(2,0),(0,-1)]:c.put(x+dx,y+dy,'pale')
        c.put(x+2,y-1,'shade')
    return c.pixels

def paint(theme, width, height, surface='shell'):
    """Return ``width*height`` six-digit hex colors, bottom row first.

    ``surface`` is ``shell`` or ``charm``. Each species has independent layout
    logic, not a common spot generator with a palette replacement.
    """
    if theme not in PALETTES: raise KeyError(theme)
    if surface not in ('shell','charm'): raise ValueError(surface)
    if surface=='shell':return _shell_finish(theme,width,height)
    canvas=_Canvas(theme,width,height)
    _DRAW[theme](canvas)
    return canvas.pixels
