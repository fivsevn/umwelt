"""New, closed-volume low-poly collection props, authored in Blender.

No runtime meshes or sprite drawings are imported. Catalogue metadata alone is read.
Axes during construction: X length, Y thickness, Z vertical. All sizes are metres.
"""
from __future__ import annotations
import argparse
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:sys.path.insert(0,str(ROOT))
M = {'steel':'steel-dark','iron':'iron-black','bright':'steel-light','wood':'wood',
     'walnut':'wood-dark','brass':'brass','bronze':'#92916a','ivory':'#c8c3a4',
     'polymer':'iron-black','green':'plastic-green','leather':'leather',
     'cord':'cloth-dark','string':'cloth'}

def add(a,b): return tuple(x+y for x,y in zip(a,b))
def sub(a,b): return tuple(x-y for x,y in zip(a,b))
def mul(a,k): return tuple(x*k for x in a)
def dot(a,b): return sum(x*y for x,y in zip(a,b))
def cross(a,b): return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def unit(a):
    length=math.sqrt(dot(a,a))
    if length<1e-8: raise ValueError('zero-length geometric direction')
    return mul(a,1/length)

class Recipe:
    def __init__(self,record):
        self.record=record
        self.parts=[]
        self.features=[]
    def mesh(self,name,vertices,faces,material='steel'):
        signed_volume=sum(dot(vertices[face[0]],cross(vertices[face[i]],vertices[face[i+1]]))/6
                          for face in faces for i in range(1,len(face)-1))
        if signed_volume<0:faces=[tuple(reversed(face)) for face in faces]
        self.parts.append({'name':name,'vertices':vertices,'faces':faces,'material':M[material]})
    def feature(self,*names): self.features.extend(names)
    def profile(self,name,points,depth,material='steel',y=0):
        area=sum(points[i][0]*points[(i+1)%len(points)][1]-points[(i+1)%len(points)][0]*points[i][1] for i in range(len(points)))
        if area<0:points=list(reversed(points))
        n=len(points)
        vertices=[(x,y-depth/2,z) for x,z in points]+[(x,y+depth/2,z) for x,z in points]
        faces=[tuple(range(n)),tuple(reversed(range(n,2*n)))]
        faces += [(i,i+n,(i+1)%n+n,(i+1)%n) for i in range(n)]
        self.mesh(name,vertices,faces,material)
    def box(self,name,center,size,material='steel',bevel=0):
        x,y,z=center; dx,dy,dz=[a/2 for a in size]
        if bevel:
            b=min(bevel,dx*.35,dz*.35)
            points=[(x-dx+b,z-dz),(x+dx-b,z-dz),(x+dx,z-dz+b),(x+dx,z+dz-b),
                    (x+dx-b,z+dz),(x-dx+b,z+dz),(x-dx,z+dz-b),(x-dx,z-dz+b)]
            self.profile(name,points,size[1],material,y)
        else:
            points=[(x-dx,z-dz),(x+dx,z-dz),(x+dx,z+dz),(x-dx,z+dz)]
            self.profile(name,points,size[1],material,y)
    def tube(self,name,start,end,radius,material='steel',sides=12,radius_end=None):
        axis=unit(sub(end,start)); temporary=(0,0,1) if abs(axis[2])<.9 else (0,1,0)
        u=unit(cross(axis,temporary));v=cross(axis,u)
        r1=radius if radius_end is None else radius_end
        vertices=[]
        for point,r in [(start,radius),(end,r1)]:
            for i in range(sides):
                angle=2*math.pi*i/sides
                vertices.append(add(point,add(mul(u,math.cos(angle)*r),mul(v,math.sin(angle)*r))))
        faces=[tuple(reversed(range(sides))),tuple(range(sides,sides*2))]
        faces += [(i,(i+1)%sides,(i+1)%sides+sides,i+sides) for i in range(sides)]
        self.mesh(name,vertices,faces,material)
    def path(self,name,points,radius=.004,material='steel',sides=8,closed=False):
        pairs=list(zip(points,points[1:]))
        if closed: pairs.append((points[-1],points[0]))
        for i,(start,end) in enumerate(pairs): self.tube(f'{name}-{i+1}',start,end,radius,material,sides)
    def ring(self,name,center,rx,rz,material='steel',tube=.004,segments=12,plane='xz'):
        x,y,z=center
        if plane=='xz': points=[(x+rx*math.cos(i*2*math.pi/segments),y,z+rz*math.sin(i*2*math.pi/segments)) for i in range(segments)]
        elif plane=='yz': points=[(x,y+rx*math.cos(i*2*math.pi/segments),z+rz*math.sin(i*2*math.pi/segments)) for i in range(segments)]
        else: points=[(x+rx*math.cos(i*2*math.pi/segments),y+rz*math.sin(i*2*math.pi/segments),z) for i in range(segments)]
        self.path(name,points,tube,material,6,True)
    def blade(self,name,stations,thickness=.006,material='bright',y=0):
        # Each cross section is a real diamond: two edges and two raised faces.
        vertices=[]
        for x,z,width in stations:
            t=min(thickness,max(.001,width*.22))
            vertices.extend([(x,y,z-width/2),(x,y+t/2,z),(x,y,z+width/2),(x,y-t/2,z)])
        faces=[(3,2,1,0),tuple(range(len(vertices)-4,len(vertices)))]
        for j in range(len(stations)-1):
            for k in range(4): faces.append((4*j+k,4*j+(k+1)%4,4*(j+1)+(k+1)%4,4*(j+1)+k))
        self.mesh(name,vertices,faces,material)
    def grip(self,name,x,z,length=.10,width=.032,material='wood',lean=.025,y=0):
        # Eight chamfered sides around a flattened grip, not a cylindrical dowel.
        dx=max(.034,width*1.4)/2;dy=width/2;c=min(.004,dy*.28)
        outline=[(-dx+c,-dy),(dx-c,-dy),(dx,-dy+c),(dx,dy-c),
                 (dx-c,dy),(-dx+c,dy),(-dx,dy-c),(-dx,-dy+c)]
        vertices=[(x+xx,y+yy,z) for xx,yy in outline]
        vertices.extend((x-lean+xx*.94,y+yy*.94,z-length) for xx,yy in outline)
        faces=[tuple(range(8)),tuple(reversed(range(8,16)))]
        faces.extend((i,(i+1)%8,(i+1)%8+8,i+8) for i in range(8))
        self.mesh(name,vertices,faces,material)
        self.box(name+'-heel',(x-lean,y,z-length),(dx*1.92,width*.94,.009),material,.0015)
    def guard(self,name,x,z,width=.061,height=.046,material='steel',y=0):
        # An open air volume surrounds the trigger. This is not a solid painted patch.
        points=[(x-width*.5,y,z),(x+width*.5,y,z),(x+width*.52,y,z-height*.5),
                (x+width*.31,y,z-height),(x-width*.3,y,z-height),(x-width*.52,y,z-height*.6)]
        self.path(name,points,.0038,material,6,True)
        self.path(name+'-trigger',[(x-.005,y,z-.007),(x+.003,y,z-.024),(x+.009,y,z-.025)],.0023,'steel',6)
    def side_plate(self,name,x,z,size,material='steel',y=.025):
        self.box(name+'-right',(x,y,z),size,material,.001)
        self.box(name+'-left',(x,-y,z),size,material,.001)

def barrel(r,name,x0,x1,z=.19,radius=.012,y=0,sides=12,material='steel',flare=None):
    r.tube(name,(x0,y,z),(x1,y,z),radius,material,sides,radius_end=flare)
    # A shallow dark endcap is only the visible muzzle marking; no internal mechanism.
    front_radius=radius if flare is None else flare
    r.tube(name+'-end-rim',(x1-.004,y,z),(x1+.001,y,z),front_radius*1.04,material,sides)
    r.tube(name+'-dark-end',(x1+.001,y,z),(x1+.0015,y,z),front_radius*.63,'iron',sides)

def sights(r,xrear,xfront,z=.21,hood=False):
    r.box('rear-sight',(xrear,0,z),(.018,.030,.013),'steel',.001)
    if hood:r.ring('front-sight-ring',(xfront,0,z+.008),.015,.015,'steel',.002,12,'yz')
    else:r.box('front-sight',(xfront,0,z),(.008,.008,.016),'steel',.001)

# The listed sizes distinguish the real outer proportions; detailed dimensions are
# intentionally approximate prop scale except the museum lengths cited in references.
REVOLVERS={
 'colt-1849':(.230,.093,.086,.021,False,'brass',False),
 'colt-1851':(.350,.180,.112,.026,False,'brass',False),
 'colt-1860':(.355,.182,.119,.029,False,'brass',True),
 'colt-saa':(.279,.124,.108,.027,True,'steel',True),
 'webley-v':(.286,.113,.126,.033,True,'steel',False),
 'adams-1851':(.286,.134,.110,.029,True,'steel',False),
 'colt-new-service':(.290,.132,.125,.030,True,'steel',True),
 'webley-fosbery':(.280,.138,.116,.030,True,'steel',False),
 'remington-army':(.343,.180,.112,.027,True,'brass',False),
 'enfield-no2':(.260,.110,.103,.026,True,'steel',False),
}

def revolver(r,key):
    total,b_len,g_len,c_rad,closed,g_mat,round_barrel=REVOLVERS[key]
    axis=.148;x0=-.010; barrel_start=.035; end=barrel_start+b_len
    r.box('lower-frame',(-.027,0,.12),(.125,.032,.035),'steel',.002)
    r.tube('fluted-cylinder',(-.046,0,axis),(.026,0,axis),c_rad,'steel',12)
    for i in range(6):
        a=i*math.pi/3
        yy=math.cos(a)*(c_rad+.0005);zz=axis+math.sin(a)*(c_rad+.0005)
        r.tube('cylinder-long-flute-'+str(i),(-.036,yy,zz),(.017,yy,zz),.0032,'iron',6)
    barrel(r,'barrel',barrel_start,end,axis,.011,sides=12 if round_barrel else 8)
    r.box('frame-rear',(-.068,0,axis),(.025,.035,.063),'steel',.0015)
    if closed:r.box('continuous-top-strap',(-.010,0,axis+c_rad+.007),(.128,.028,.012),'steel',.001)
    if not closed:r.box('open-frame-barrel-lug',(.035,0,axis-.021),(.038,.032,.027),'steel',.0015)
    r.grip('eight-sided-wood-grip',-.069,.115,g_len,.037,'walnut',.032)
    r.side_plate('grip-plaque',-.084,.065,(.028,.003,.058),'wood',.021)
    r.guard('hollow-trigger-guard',-.010,.109,.066,.044,g_mat)
    r.path('external-hammer',[(-.080,0,.170),(-.075,0,.185),(-.085,0,.191)],.006,'steel',8)
    sights(r,-.055,end-.013,axis+.022)
    if key in ['colt-1849','colt-1851','colt-1860','remington-army']:
        r.tube('under-barrel-rod',(.046,0,axis-.025),(end-.018,0,axis-.025),.004,'steel',8)
        r.box('rod-front-lug',(end-.020,0,axis-.013),(.012,.013,.025),'steel')
    if key=='colt-saa':r.tube('offset-side-housing',(.053,-.014,axis-.008),(end-.022,-.014,axis-.008),.005,'steel',8)
    if key in ['webley-v','webley-fosbery','enfield-no2','colt-new-service']:
        r.ring('grip-bottom-loop',(-.102,0,.114-g_len-.006),.011,.009,'steel',.0025,8)
    if key in ['webley-v','enfield-no2']:r.side_plate('top-break-hinge',.035,.122,(.026,.005,.022),'steel',.021)
    if key=='webley-fosbery':
        r.box('separate-upper-slide',(-.023,0,.114),(.157,.042,.013),'steel',.001)
        for side in [-1,1]:
            r.path('zigzag-cylinder-groove-'+str(side),[(-.039,side*c_rad,.151),(-.019,side*c_rad,.164),(.006,side*c_rad,.148),(.023,side*c_rad,.159)],.0022,'bright',6)
    if key=='adams-1851':r.box('heavy-rear-grip-curve',(-.105,0,.034),(.025,.030,.026),'wood',.006)
    r.feature('12-sided volumetric cylinder','8-sided grip','open trigger guard',
              'continuous upper frame' if closed else 'open upper frame',
              'model-specific barrel and grip proportions')

PISTOLS={
 'colt-1903':(.205,.031,.087,'enclosed','walnut'),
 'm1911':(.216,.031,.107,'enclosed','wood'),
 'mauser-c96':(.312,.032,.130,'broom','wood'),
 'luger-p08':(.222,.029,.112,'toggle','wood'),
 'nambu-14':(.231,.029,.110,'nambu','wood'),
 'hi-power':(.197,.031,.111,'enclosed','wood'),
 'walther-p38':(.216,.031,.114,'exposed','polymer'),
 'walther-ppks':(.159,.029,.091,'compact','polymer'),
 'beretta-1934':(.152,.030,.095,'open-slide','walnut'),
 'glock-17':(.202,.032,.111,'glock','polymer'),
 'glock-19':(.185,.032,.101,'glock','polymer'),
 'glock-26':(.163,.033,.079,'glock','polymer'),
 'glock-34':(.222,.032,.111,'glock-mos','polymer'),
 'glock-43':(.159,.024,.083,'glock-slim','polymer'),
 'glock-43x':(.165,.024,.111,'glock-rail','polymer'),
}

def pistol(r,key):
    length,depth,g_len,style,gmat=PISTOLS[key]
    rear=-length*.45;front=length*.55;axis=.140
    grip_x=rear+.033;lean=.028 if style in ['toggle','nambu'] else .014
    r.grip('eight-sided-grip',grip_x,axis-.017,g_len,depth,gmat,lean)
    r.box('lower-frame',((rear+front)/2-.013,0,axis-.009),(length*.87,depth,.025),'steel',.002)
    guard_width=.054 if style!='nambu' else .061
    r.guard('hollow-trigger-guard',grip_x+.046,axis-.027,guard_width,.037,'steel')
    if style in ['toggle','nambu','broom','exposed']:
        body_end=front-(.111 if style=='broom' else .086 if style=='exposed' else .071)
        r.box('rear-receiver',((rear+body_end)/2,0,axis+.005),(body_end-rear,depth*.95,.038),'steel',.003)
        barrel(r,'exposed-round-barrel',body_end,front,axis+.009,.0105)
        if style=='toggle':
            for xx in [rear+.037,rear+.066]:r.tube('toggle-knuckle-'+str(xx),(xx,-depth*.58,axis+.025),(xx,depth*.58,axis+.025),.011,'steel',12)
            r.box('toggle-upper-link',(rear+.049,0,axis+.024),(.032,.024,.014),'steel',.001)
        if style=='nambu':
            r.tube('round-bolt-tail',(rear-.003,0,axis+.008),(rear+.024,0,axis+.008),.017,'steel',12)
            r.box('grip-frame-shoulder',(rear+.041,0,axis-.007),(.038,.041,.022),'steel',.002)
        if style=='broom':
            r.box('forward-magazine-box',(body_end-.019,0,axis-.048),(.046,.033,.085),'steel',.002)
            r.path('external-ring-hammer',[(rear,0,axis+.013),(rear-.012,0,axis+.033)],.006,'steel',8)
            r.ring('round-hammer-hole',(rear-.010,0,axis+.034),.010,.010,'steel',.0025,8)
        if style=='exposed':r.box('open-front-bridge',(body_end-.010,0,axis+.011),(.033,.038,.042),'steel',.002)
    elif style=='open-slide':
        r.box('rear-slide',(rear+.030,0,axis+.010),(.060,depth,.036),'steel',.002)
        barrel(r,'barrel-in-open-slide',rear+.045,front,axis+.009,.009)
        for side in [-1,1]:r.box('open-slide-side-rail-'+str(side),(.017,side*depth*.47,axis),(.109,.006,.015),'steel',.001)
        r.box('front-slide-band',(front-.009,0,axis+.007),(.018,depth,.025),'steel',.001)
        r.box('forward-grip-heel',(grip_x+.003,0,axis-.018-g_len),(.044,depth,.010),'polymer',.002)
    else:
        slide_depth=depth if not style.startswith('glock-slim') else depth*.95
        r.box('flat-slide',((rear+front)/2,0,axis+.009),(length,slide_depth,.034),'bright' if style=='compact' else 'steel',.0015)
        r.tube('muzzle-dark-disc',(front+.001,0,axis+.008),(front+.002,0,axis+.008),.007,'iron',12)
        r.side_plate('slide-rear-serrations',rear+.022,axis+.010,(.022,.0018,.021),'iron',slide_depth*.515)
        if key=='hi-power':r.profile('tapered-slide-nose',[(front-.033,axis+.026),(front,axis+.020),(front,axis-.003),(front-.033,axis-.006)],depth*.8,'steel')
        if style=='glock-mos':r.box('top-cover-plate',(rear+.038,0,axis+.028),(.043,.025,.003),'bright')
        if style=='glock-rail':r.box('visible-front-lower-rail',(front-.028,0,axis-.023),(.043,.022,.006),'steel')
        if key=='m1911':r.box('external-backstrap-tail',(rear+.003,0,axis-.012),(.024,.028,.019),'steel',.002)
    sights(r,rear+.013,front-.012,axis+.033)
    if not style.startswith('glock'):
        r.side_plate('independent-grip-panels',grip_x-lean*.47,axis-.028-g_len*.46,(.029,.003,g_len*.68),gmat,depth*.51)
    r.feature('separate full-depth grip','open trigger guard',style,'distinct total length and grip length')

def antique_pistol(r,key):
    wheellock=key=='wheellock';duel=key=='duelling'
    length=.816 if wheellock else .400 if duel else .385
    rear=-length*.43;front=length*.57;axis=.165
    grip_points=[(rear,.160),(rear+.025,.142),(rear+.046,.086),(rear+.031,.038),
                 (rear-.006,.035),(rear-.038,.061),(rear-.031,.107),(rear-.015,.152)]
    r.profile('sculpted-curved-wood-butt',grip_points,.039,'walnut')
    woodend=front-.034 if wheellock else front-.095
    r.profile('long-slender-wood-stock',[(rear,.130),(woodend,.130),(woodend,.151),(rear+.008,.173)],.034,'wood')
    barrel(r,'long-early-barrel',rear+.024,front,axis,.009 if wheellock else .0115,sides=12 if not duel else 8)
    r.guard('hollow-brass-guard',rear+.067,.127,.071,.043,'brass')
    r.side_plate('lock-plate',rear+.082,.152,(.087,.003,.020),'brass' if wheellock else 'steel',.021)
    if wheellock:
        r.tube('circular-wheel-cover',(rear+.077,-.024,.155),(rear+.077,-.032,.155),.021,'brass',12)
        r.path('outer-wheel-dog',[(rear+.090,-.029,.171),(rear+.087,-.029,.202),(rear+.105,-.029,.216)],.004,'steel',8)
        for xx in [rear+.013,rear+.055,rear+.112]:r.side_plate('pale-inlay-'+str(xx),xx,.141,(.014,.002,.005),'ivory',.019)
    else:
        r.path('external-flint-cock',[(rear+.064,-.024,.166),(rear+.048,-.024,.192),(rear+.063,-.024,.211),(rear+.077,-.024,.208)],.004,'steel',8)
        r.box('lock-upright', (rear+.110,-.024,.188),(.012,.011,.034),'steel',.001)
    sights(r,rear+.035,front-.014,axis+.017)
    r.feature('curved full-depth wooden grip','hollow brass trigger guard','long wheel-lock proportions' if wheellock else 'external flintlock silhouette')

RIFLES={
 'matchlock':(1.02,.76,'matchlock'), 'blunderbuss':(.770,.400,'flared'),
 'brown-bess':(1.57,1.05,'flintlock'),'enfield-1853':(1.39,.995,'three-band'),
 'lee-enfield':(1.130,.740,'no4'),'mosin':(1.305,.970,'straight-bolt'),
 'kar98k':(1.110,.640,'bent-bolt'),'arisaka-38':(1.280,.930,'arisaka'),
 'garand':(1.105,.690,'garand'),'m1-carbine':(.905,.530,'carbine'),
 'henry':(1.090,.780,'henry'),'winchester':(1.060,.740,'winchester'),
 'dreyse-1841':(1.420,1.030,'needle'),'chassepot':(1.310,.970,'chassepot'),
 'snider':(1.250,.925,'snider'),'martini-henry':(1.250,.860,'martini'),
 'springfield-1903':(1.100,.690,'springfield'),'spencer':(1.200,.800,'spencer'),
 'winchester-1897':(1.000,.700,'pump'),'double-shotgun':(1.105,.775,'double'),
}

def rifle_stock(r,length,material='wood',short=False):
    butt=-length*.5;receiver=-length*.18
    r.profile('shaped-solid-butt',[(butt,.165),(butt,.065),(butt+.13,.065),(receiver-.025,.127),
             (receiver+.035,.142),(receiver+.035,.174),(receiver-.035,.183),(butt+.12,.159)],.044,material)
    r.box('butt-end-plate',(butt+.003,0,.116),(.009,.049,.103),'brass' if material=='brass' else 'steel',.001)

def rifle(r,key):
    length,wood_len,style=RIFLES[key];rear=-length*.5;front=length*.5;axis=.183
    rifle_stock(r,length)
    receiver=-length*.17
    r.box('central-receiver',(receiver+.052,0,.171),(.174,.044,.051),'brass' if style=='henry' else 'steel',.002)
    for_end=front-(.155 if style not in ['flintlock','three-band','needle','chassepot','arisaka'] else .075)
    for_start=receiver+.060
    r.profile('tapered-full-depth-forend',[(for_start,.131),(for_end,.144),(for_end,.170),(for_start,.179)],.041,'wood')
    barrel(r,'long-barrel',receiver+.040,front,axis,.012 if style!='flared' else .018,flare=.050 if style=='flared' else None,material='brass' if style=='flared' else 'steel')
    if style!='double':r.guard('air-through-trigger-guard',receiver+.055,.133,.077,.040,'brass' if style in ['flintlock','three-band','henry'] else 'steel')
    if style in ['three-band','chassepot']:
        bands=[for_start+.10,(for_start+for_end)/2,for_end-.026]
    else:bands=[for_start+(for_end-for_start)*.46,for_end-.025]
    for i,x in enumerate(bands):r.box('stock-band-'+str(i),(x,0,.166),(.016,.050,.053),'steel',.001)
    sights(r,receiver+.110,front-.025,axis+.025)
    if style in ['flintlock','three-band','flared','matchlock','snider']:
        r.side_plate('external-lockplate',receiver+.040,.154,(.105,.004,.029),'brass' if style=='matchlock' else 'steel',.026)
        if style=='matchlock':r.path('serpentine-match-holder',[(receiver+.010,-.030,.166),(receiver-.019,-.030,.202),(receiver+.012,-.030,.224)],.004,'brass',8)
        else:r.path('outer-hammer',[(receiver-.023,-.032,.17),(receiver-.030,-.032,.203),(receiver-.011,-.032,.215)],.004,'steel',8)
    if style in ['straight-bolt','bent-bolt','arisaka','needle','chassepot','springfield','no4']:
        bolt_x=receiver+.060
        bend=.035 if style in ['bent-bolt','springfield','no4'] else .010
        r.path('visible-bolt-handle',[(bolt_x,-.024,.188),(bolt_x,-.065,.183),(bolt_x,-.065,.183-bend)],.004,'steel',8)
        r.tube('bolt-handle-knob',(bolt_x,-.065,.174-bend),(bolt_x,-.065,.185-bend),.010,'steel',8)
        r.tube('receiver-top-cylinder',(receiver-.010,0,.187),(receiver+.115,0,.187),.019,'steel',12)
    if style in ['no4','carbine']:
        r.profile('box-magazine',[(receiver+.087,.140),(receiver+.152,.140),(receiver+.147,.062),(receiver+.100,.060)],.038,'steel')
    if style in ['henry','winchester','martini','spencer']:
        r.path('open-lever-loop',[(receiver-.023,0,.134),(receiver-.037,0,.073),(receiver+.082,0,.069),(receiver+.119,0,.115)],.004,'brass' if style=='henry' else 'steel',8,True)
    if style in ['henry','winchester','pump']:
        r.tube('under-barrel-long-tube',(receiver+.131,0,.146),(front-.042,0,.146),.008,'brass' if style=='henry' else 'steel',12)
    if style=='pump':
        r.box('short-ribbed-pump-wood',(front-.320,0,.144),(.150,.053,.054),'wood',.004)
        for i in range(4):r.box('pump-grip-ridge-'+str(i),(front-.370+i*.028,0,.145),(.007,.057,.056),'walnut',.001)
    if style=='double':
        # Remove the central single tube and replace it with two truly side-by-side tubes.
        r.parts=[part for part in r.parts if not part['name'].startswith('long-barrel')]
        for side in [-1,1]:barrel(r,'paired-barrel-'+str(side),receiver+.06,front,axis,.0115,side*.0125)
        r.guard('double-trigger-guard',receiver+.059,.133,.082,.040,'steel')
    if style=='garand':r.box('exposed-receiver-top',(receiver+.063,0,.196),(.127,.037,.021),'steel',.002)
    if style=='snider':r.box('side-opening-block-shape',(receiver+.051,-.029,.187),(.083,.017,.030),'steel',.002)
    if style=='arisaka':r.tube('rounded-bolt-end',(receiver-.006,0,.188),(receiver+.023,0,.188),.022,'steel',12)
    r.feature('solid shaped rifle butt','three-dimensional forend','hollow trigger guard',style)

LONG_GUNS={
 'thompson':(.850,'thompson'),'sten':(.760,'sten'),'mp40':(.833,'mp40'),
 'ppsh':(.843,'ppsh'),'ak47':(.870,'ak'),'l1a1':(1.140,'fal'),
 'g3':(1.025,'g3'),'m16':(.990,'m16'),'l85a1':(.785,'l85'),
 'aug':(.790,'aug'),'mp5':(.680,'mp5'),'pam1':(.745,'pam'),
 'bren':(1.155,'bren'),'lewis':(1.280,'lewis'),'vickers':(1.100,'vickers'),
 'maxim':(1.070,'maxim'),'bar':(1.215,'bar'),'hotchkiss':(.920,'hotchkiss'),
}

def curved_magazine(r,name,x,z,length=.190,width=.060,material='steel',curve=.032,depth=.043,upper=False):
    sign=1 if upper else -1
    stations=[(x,z),(x+width,z),(x+width+curve*.3,z+sign*length*.5),
              (x+width+curve,z+sign*length),(x+curve-width*.15,z+sign*length),
              (x-width*.06+curve*.22,z+sign*length*.5)]
    r.profile(name,stations,depth,material)

def wire_stock(r,rear,join,z=.185,style='wire'):
    if style=='mp40':
        for side in [-1,1]:r.path('folding-stock-rail-'+str(side),[(join,side*.031,z),(rear,side*.031,z-.030),(rear,side*.031,z-.105)],.006,'steel',8)
        r.path('folding-butt-bridge',[(rear,-.031,z-.105),(rear,.031,z-.105)],.006,'steel',8)
    else:
        r.path('open-wire-stock',[(join,-.020,z),(rear,-.020,z),(rear,-.020,z-.092),(join,-.020,z-.048)],.0045,'steel',8)
        r.path('far-wire-support',[(join,.020,z),(rear,.020,z)],.0045,'steel',8)
        r.path('wire-butt-width',[(rear,-.020,z-.092),(rear,.020,z-.092)],.0045,'steel',8)

def carry_handle(r,x,z,width=.113,height=.042,material='steel'):
    r.path('open-carry-handle',[(x-width/2,0,z),(x-width/2+.011,0,z+height),(x+width/2-.010,0,z+height),(x+width/2,0,z)],.008,material,8)

def long_gun(r,key):
    length,style=LONG_GUNS[key];rear=-length*.5;front=length*.5;axis=.272
    heavy=style in ['vickers','maxim'];bull=style in ['l85','aug'];wire=style in ['sten','mp40','pam','mp5']
    body_x=-length*.11;body_len=.300 if heavy else .235 if bull else .215
    if heavy:
        r.box('large-rear-receiver',(rear+.187,0,axis),(.290,.136,.163),'steel',.006)
        r.box('mounting-base',(rear+.199,0,.142),(.102,.115,.071),'steel',.002)
        for side in [-1,1]:r.tube('rear-paired-grip-'+str(side),(rear+.020,side*.070,.193),(rear+.020,side*.070,.306),.014,'wood',8)
        r.path('grip-rear-bridge',[(rear+.027,-.070,.255),(rear+.027,.070,.255)],.009,'steel',8)
        barrel(r,'water-jacket',rear+.330,front-.040,axis,.061,material='steel')
        barrel(r,'protruding-short-end',front-.045,front,axis,.019)
        for xx in [rear+.342,front-.063]:r.tube('jacket-brass-ring-'+str(xx),(xx,0,axis),(xx+.012,0,axis),.064,'brass',12)
        if style=='maxim':r.box('raised-top-cover',(rear+.184,0,axis+.094),(.243,.130,.025),'steel',.003)
        else:r.box('narrow-top-sight',(rear+.17,0,axis+.098),(.048,.026,.031),'steel',.001)
        r.feature('water-cooled full-depth jacket','paired rear handles','receiver mounting base',style)
        return
    if style in ['sten','pam']:
        r.tube('round-tubular-receiver',(body_x-.135,0,axis),(body_x+.145,0,axis),.027,'steel',12)
    else:r.box('full-depth-receiver',(body_x,0,axis), (body_len,.054 if not bull else .068,.060),'steel',.0025)
    if bull:
        butt_points=[(rear,axis+.005),(rear,axis-.104),(rear+.188,axis-.109),(body_x+.14,axis-.047),(body_x+.126,axis+.031),(rear+.070,axis+.052)]
        r.profile('continuous-bullpup-body',butt_points,.070,'green')
        grip_x=body_x+.115
    elif wire:
        wire_stock(r,rear,body_x-.100,axis,'mp40' if style=='mp40' else 'wire');grip_x=body_x-.081
    elif style=='hotchkiss':grip_x=body_x-.083
    else:
        stock_mat='polymer' if style=='m16' else 'wood'
        rifle_stock(r,length,stock_mat);grip_x=body_x-.083
        # Raise the rifle butt to the receiver centreline for this family.
        for part in r.parts:
            if part['name'] in ['shaped-solid-butt','butt-end-plate']:part['vertices']=[(x,y,z+.092) for x,y,z in part['vertices']]
    grip_material='green' if bull or style=='g3' else 'wood' if style in ['thompson','bren','lewis','bar','hotchkiss'] else 'polymer'
    r.grip('distinct-eight-sided-pistol-grip',grip_x,axis-.025,.112,.036,grip_material,.022)
    r.guard('full-open-trigger-guard',grip_x+.051,axis-.041,.068,.042,'green' if bull else 'steel')
    barrel_start=body_x+.090
    barrel(r,'round-barrel',barrel_start,front,axis,.013)
    if style=='sten':
        r.box('left-side-magazine',(.002,-.142,axis),(.048,.234,.029),'steel',.001)
        r.tube('short-barrel-collar',(front-.19,0,axis),(front-.055,0,axis),.031,'steel',12)
        r.path('simple-under-grip',[(-.057,0,axis-.015),(-.084,0,axis-.087)],.008,'steel',8)
    elif style=='thompson':
        r.tube('wide-drum',(.036,-.042,axis-.091),(.036,.042,axis-.091),.078,'steel',12)
        r.grip('wood-vertical-front-grip',front-.23,axis-.024,.11,.034,'wood',0)
        r.box('front-grip-mount',(front-.25,0,axis-.017),(.170,.033,.023),'steel')
        for i in range(7):r.tube('barrel-cooling-ring-'+str(i),(front-.30+i*.020,0,axis),(front-.29+i*.020,0,axis),.022,'steel',12)
        barrel(r,'distinct-wide-muzzle-compensator',front-.037,front+.020,axis,.020)
    elif style=='ppsh':
        r.tube('drum',(.040,-.043,axis-.089),(.040,.043,axis-.089),.084,'steel',12)
        r.tube('long-barrel-shroud',(body_x+.120,0,axis),(front,0,axis),.035,'steel',12)
        for side in [-1,1]:
            for i in range(5):r.box('visible-shroud-slot-'+str(side)+'-'+str(i),(front-.253+i*.043,side*.035,axis+.005),(.028,.002,.010),'iron')
        r.profile('slanted-shroud-mouth',[(front-.020,axis-.034),(front+.012,axis-.022),(front+.012,axis+.039),(front-.020,axis+.032)],.069,'steel')
    elif style=='lewis':
        r.tube('broad-round-barrel-shroud',(body_x+.064,0,axis),(front-.024,0,axis),.047,'steel',12)
        r.tube('top-pan-magazine',(body_x+.030,0,axis+.034),(body_x+.030,0,axis+.060),.115,'steel',12)
        r.feature('horizontal top pan magazine')
    elif style=='bren':
        curved_magazine(r,'upright-curved-top-magazine',body_x-.020,axis+.026,.216,.053,'steel',.050,.042,True)
        carry_handle(r,body_x+.115,axis+.035,.088,.058)
        for side in [-1,1]:r.path('deployed-bipod-'+str(side),[(front-.224,side*.013,axis-.005),(front-.283,side*.105,.031)],.006,'steel',8)
        r.box('long-wood-forepart',(body_x+.123,0,axis-.031),(.206,.048,.028),'wood',.002)
    elif style=='hotchkiss':
        for i in range(11):r.tube('cooling-fin-'+str(i),(body_x+.057+i*.024,0,axis),(body_x+.064+i*.024,0,axis),.038,'steel',12)
        r.box('thin-side-feed-strip',(body_x+.047,-.121,axis+.004),(.033,.222,.006),'brass')
        r.box('unstocked-rear-end',(body_x-.127,0,axis),(.040,.054,.043),'steel',.001)
        r.feature('unstocked museum example','radial cooling fins','side strip silhouette')
    else:
        mag_x=body_x+.039 if not bull else rear+.145
        mag_length=.148 if style not in ['ak','mp40','pam','fal','g3'] else .187
        mag_curve=.045 if style in ['ak','mp5','aug'] else .010
        curved_magazine(r,'distinct-detachable-magazine',mag_x,axis-.025,mag_length,.057,'steel',mag_curve)
    if style in ['ak','fal','g3','m16','mp5','bar','l85','aug','mp40']:
        hand_start=body_x+.107;hand_end=front-(.217 if style in ['fal','g3'] else .145)
        hand_material='wood' if style in ['ak','fal','bar'] else 'green' if bull else 'polymer'
        if style=='m16':r.profile('triangular-early-handguard',[(hand_start,axis+.018),(hand_end,axis-.015),(hand_start,axis-.043)],.056,'polymer')
        else:r.box('independent-forehandguard',((hand_start+hand_end)/2,0,axis-.009),(hand_end-hand_start,.062,.060),hand_material,.004)
        if style=='ak':r.tube('exposed-upper-gas-line',(body_x+.108,0,axis+.043),(front-.078,0,axis+.043),.010,'steel',12)
        if style=='g3':
            for side in [-1,1]:
                for i in range(3):r.box('forehandguard-vent-'+str(side)+'-'+str(i),(hand_start+.035+i*.056,side*.032,axis+.006),(.035,.002,.010),'iron')
    if style=='m16':
        carry_handle(r,body_x-.012,axis+.041,.153,.051)
        r.path('triangular-front-sight',[(front-.087,0,axis+.005),(front-.100,0,axis+.092),(front-.125,0,axis+.005)],.005,'steel',8)
        r.box('straight-stock-top-line',(rear+.13,0,axis),(.24,.048,.035),'polymer',.002)
    elif bull:
        carry_handle(r,body_x+.035,axis+.056,.128,.042,'green' if style=='aug' else 'steel')
        barrel(r,'top-fixed-optical-shape',body_x-.049,body_x+.150,axis+.111,.018,material='steel')
        if style=='aug':
            r.grip('front-folding-grip',front-.160,axis-.034,.105,.026,'green',.004)
            r.guard('large-open-bullpup-hand-loop',body_x+.152,axis-.043,.127,.095,'green')
    else:sights(r,body_x-.053,front-.035,axis+.049,style in ['mp5','g3'])
    if style=='pam':r.path('right-side-folded-handle',[(body_x+.055,-.031,axis),(body_x+.075,-.047,axis-.045)],.005,'steel',8)
    r.feature('full-width receiver','open trigger guard',style,
              'rear-magazine bullpup proportions' if bull else 'model-specific stock and magazine')

BLADES={
 'bronze-sword':(.570,.130,'bronze'), 'rapier':(1.155,.153,'rapier'),
 'basket-sword':(.825,.160,'basket'), 'sabre':(.850,.165,'sabre'),
 'stiletto':(.290,.113,'stiletto'), 'kukri':(.330,.124,'kukri'),
 'jian':(.705,.175,'jian'),'katana':(.730,.280,'katana'),
 'wakizashi':(.480,.175,'wakizashi'),'tanto':(.220,.135,'tanto'),
 'kris':(.360,.142,'kris'),'katar':(.270,.200,'katar'),
 'talwar':(.790,.150,'talwar'),'shamshir':(.825,.160,'shamshir'),
}

def sword(r,key,y=0,xshift=0,part_suffix=''):
    length,grip_len,style=BLADES[key];blade_mat='bronze' if style=='bronze' else 'bright'
    base=.023 if style in ['rapier','stiletto'] else .039 if style in ['katana','wakizashi','tanto'] else .047
    stations=[]
    for i in range(9):
        t=i/8;x=xshift+t*length
        width=base*(1-.50*t)
        z=.105
        if style=='bronze':width=.018+math.sin(t*math.pi)*.046
        if style in ['katana','wakizashi']:z+=.048*t*t; width=.032*(1-.30*t)
        if style=='tanto':z+=.005*t; width=.029*(1-.15*t)
        if style in ['sabre','talwar','shamshir']:
            curve=.165 if style=='shamshir' else .110 if style=='talwar' else .078
            z+=curve*t*t;width=(.029 if style=='shamshir' else .040)*(1-.4*t)
        if style=='kukri':z-=.113*t*t; width=.031+math.sin(t*math.pi*.9)*.053
        if style=='kris':z+=math.sin(t*math.pi*7)*.012; width=.059*(1-.86*t)
        if style=='katar':width=.120*(1-t)
        if i==8:width=.002
        stations.append((x,z,width))
    if style in ['katana','wakizashi','tanto']:
        x,z,width=stations[-2]
        stations[-2]=(x,z,.024 if style!='tanto' else .023)
        stations[-1]=(xshift+length,.105+(.048 if style!='tanto' else .005),.001)
    if style=='stiletto':stations=[(xshift,.105,.015),(xshift+length*.83,.105,.009),(xshift+length,.105,.001)]
    r.blade('faceted-distinct-blade'+part_suffix,stations,.008 if style in ['kukri','katar'] else .0055,blade_mat,y)
    if style=='katar':
        for side in [-1,1]:r.box('parallel-wrist-rail-'+str(side),(xshift-grip_len*.46,y,.105+side*.061),(grip_len,.018,.018),'brass',.002)
        for xx in [xshift-.087,xshift-.139]:r.tube('transverse-double-grip-'+str(xx),(xx,y,.048),(xx,y,.164),.011,'brass',8)
        r.feature('H-shaped transverse double grip','parallel wrist rails','diamond blade cross section');return
    grip_mat='cord' if style in ['katana','wakizashi','tanto','jian'] else 'ivory' if style=='sabre' else 'wood' if style in ['kris','kukri'] else 'leather'
    r.tube('eight-sided-handle'+part_suffix,(xshift-grip_len,y,.105),(xshift-.018,y,.105),.013 if style!='kukri' else .018,grip_mat,8)
    r.tube('handle-end-pommel'+part_suffix,(xshift-grip_len-.017,y,.105),(xshift-grip_len+.001,y,.105),.019,'brass' if style in ['jian','talwar','bronze'] else 'steel',8)
    if style in ['katana','wakizashi','tanto']:
        r.tube('round-tsuba'+part_suffix,(xshift-.016,y,.105),(xshift-.007,y,.105),.040 if style=='katana' else .033 if style=='wakizashi' else .024,'steel',12)
        r.box('short-blade-collar'+part_suffix,(xshift+.008,y,.105),(.026,.016,.030),'brass')
    elif style in ['kukri','kris']:
        if style=='kris':r.profile('asymmetric-bent-keris-pommel',[(xshift-grip_len,.103),(xshift-grip_len-.049,.088),(xshift-grip_len-.064,.123),(xshift-grip_len-.021,.141)],.030,'wood',y)
        r.box('small-handle-ferrule'+part_suffix,(xshift-.012,y,.105),(.022,.026,.027),'brass',.002)
    else:r.box('transverse-crossguard'+part_suffix,(xshift-.009,y,.105),(.018,.022,.103 if style!='stiletto' else .074),'brass' if style in ['bronze','jian','talwar'] else 'steel',.002)
    if style=='talwar':r.tube('large-disc-pommel',(xshift-grip_len-.018,y,.105),(xshift-grip_len-.008,y,.105),.047,'brass',12)
    if style in ['sabre','talwar']:
        r.path('open-knuckle-bow',[(xshift-.009,y,.060),(xshift-.050,y,.032),(xshift-grip_len+.020,y,.030),(xshift-grip_len-.008,y,.094)],.0045,'brass' if style=='talwar' else 'steel',8)
    if style=='rapier':
        for side in [-1,1]:
            r.ring('three-dimensional-side-ring-'+str(side),(xshift-.060,y+side*.027,.105),.047,.054,'steel',.0035,10,'xz')
            r.path('swept-rapier-branch-'+str(side),[(xshift-.013,y,.150),(xshift-.060,y+side*.048,.164),(xshift-grip_len,y,.114)],.0035,'steel',8)
        r.ring('rapier-forward-ring',(xshift+.008,y,.105),.054,.054,'steel',.0032,10,'yz')
    if style=='basket':
        for side in [-1,1]:
            for zz in [-.031,.031]:r.path('basket-outer-strut-'+str(side)+'-'+str(zz),[(xshift-.010,y,.105+zz),(xshift-.056,y+side*.049,.105+zz*1.5),(xshift-grip_len+.008,y,.105+zz)],.0045,'steel',8)
            r.ring('basket-side-ribs-'+str(side),(xshift-.077,y+side*.046,.105),.054,.056,'steel',.004,10,'xz')
        r.ring('basket-top-rear',(xshift-grip_len+.015,y,.105),.044,.049,'steel',.004,10,'yz')
    r.feature('raised diamond-section blade','eight-sided handle',style,'complete two-sided thickness')

def polearm(r,key):
    if key=='halberd':length=2.066;shaft=1.77
    elif key=='battle-axe':length=1.35;shaft=1.20
    elif key=='war-hammer':length=.680;shaft=.59
    else:length=.610;shaft=.50
    # Long axes follow X like the swords, while all heads remain volumetric.
    r.tube('eight-sided-long-shaft',(-shaft/2,0,.120),(shaft/2,0,.120),.017 if key=='halberd' else .020,'wood' if key!='mace' else 'steel',8)
    x=shaft/2-.035
    if key=='halberd':
        r.profile('broad-axe-blade',[(x-.064,.140),(x+.078,.178),(x+.138,.266),(x+.079,.380),(x-.024,.342),(x-.032,.222)],.011,'steel')
        r.blade('apical-long-spike',[(x,.120,.042),(shaft/2+.13,.120,.026),(shaft/2+.29,.120,.002)],.011,'bright')
        r.profile('rear-curved-beak',[(x-.068,.105),(x+.087,.062),(x+.137,-.012),(x+.039,.034),(x-.064,.055)],.018,'steel')
        r.box('off-centre-head-socket',(x-.021,0,.120),(.138,.049,.045),'steel',.002)
    elif key=='battle-axe':
        r.profile('wide-bearded-axe-head',[(x-.076,.157),(x+.035,.161),(x+.107,.252),(x+.114,.328),(x+.052,.372),(x-.095,.344),(x-.087,.210)],.022,'steel')
        r.box('full-depth-axe-eye',(x-.047,0,.158),(.087,.061,.086),'steel',.003)
    elif key=='war-hammer':
        r.box('square-hammer-face',(x,0,.213),(.089,.062,.095),'steel',.003)
        r.profile('hooked-rear-pick',[(x-.044,.138),(x-.044,.103),(x+.107,.082),(x+.147,.033),(x+.114,.109),(x+.037,.137)],.025,'steel')
        r.blade('small-top-spike',[(x+.032,.130,.025),(x+.119,.130,.014),(x+.153,.130,.002)],.012,'steel')
        for xx in [-.20,.08,.19]:r.tube('shaft-metal-band-'+str(xx),(xx,0,.120),(xx+.016,0,.120),.023,'brass',8)
    else:
        r.tube('mace-head-core',(x-.025,0,.120),(x+.110,0,.120),.024,'brass',8)
        for i in range(6):
            angle=i*math.pi/3
            # A true radiating vane with finite thickness, rather than a flat sprite.
            vertices=[]
            for tangential in [-.004,.004]:
                for xx,radial in [(x-.036,.021),(x+.006,.063),(x+.086,.063),(x+.120,.021)]:
                    vertices.append((xx,math.cos(angle)*radial-math.sin(angle)*tangential,.120+math.sin(angle)*radial+math.cos(angle)*tangential))
            r.mesh('radial-metal-vane-'+str(i),vertices,[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],'brass')
        r.tube('wrapped-mace-handle',(-shaft/2,0,.120),(-shaft/2+.142,0,.120),.023,'leather',8)
    r.feature('three-dimensional solid shaft','model-specific non-symmetric head',key)

def bow(r,key):
    if key=='longbow':
        points=[]
        for i in range(15):
            t=i/14;x=-.84+1.68*t;z=.027+.205*math.sin(t*math.pi)
            points.append((x,0,z))
        for i,(a,b) in enumerate(zip(points,points[1:])):
            radius=.009+(.005 if 5<=i<=8 else .001)
            r.tube('octagonal-bow-limb-'+str(i),a,b,radius,'wood',8)
        r.path('complete-bow-string',[points[0],points[-1]],.0022,'string',6)
        r.tube('central-dark-grip',(-.088,0,.225),(.088,0,.225),.017,'leather',8)
        r.feature('long continuous curved wood limbs','real bow string','volumetric central grip')
    else:
        r.profile('sculpted-crossbow-tiller',[(-.430,.041),(.376,.041),(.425,.073),(.379,.121),(-.343,.111),(-.430,.087)],.075,'wood')
        limbs=[(.325,-.420,.104),(.360,-.290,.117),(.400,-.150,.126),(.416,0,.129),(.400,.150,.126),(.360,.290,.117),(.325,.420,.104)]
        r.path('steel-crossbow-limbs',limbs,.013,'steel',8)
        r.path('triangular-crossbow-string',[limbs[0],(-.036,0,.128),limbs[-1]],.0025,'string',6)
        r.box('central-limb-saddle',(.395,0,.125),(.102,.130,.035),'steel',.002)
        r.ring('front-stirrup',(.447,0,.104),.095,.076,'steel',.005,12,'yz')
        r.path('underside-release-shaped-prop',[(-.204,0,.041),(-.253,0,-.033),(-.162,0,-.035),(-.112,0,.022)],.006,'steel',8)
        r.feature('wide independent bow limbs','complete tiller thickness','triangular string','open front stirrup')

def construct(record):
    r=Recipe(record);key=record['id'].removeprefix('weapon-')
    if key in REVOLVERS:revolver(r,key)
    elif key in PISTOLS:pistol(r,key)
    elif key in ['wheellock','flintlock','duelling']:antique_pistol(r,key)
    elif key in RIFLES:rifle(r,key)
    elif key in LONG_GUNS:long_gun(r,key)
    elif key=='jian':sword(r,key,-.034,.019,'-first');sword(r,key,.034,-.034,'-second');r.feature('two independently positioned jian')
    elif key in BLADES:sword(r,key)
    elif key in ['halberd','battle-axe','mace','war-hammer']:polearm(r,key)
    elif key in ['longbow','crossbow']:bow(r,key)
    else:raise ValueError('Missing independent recipe: '+key)
    return r

def geometric_summary(recipe):
    vertices=[v for part in recipe.parts for v in part['vertices']]
    mins=[min(v[i] for v in vertices) for i in range(3)]
    maxs=[max(v[i] for v in vertices) for i in range(3)]
    return {'id':recipe.record['id'],'name':recipe.record['name'],'category':collection_category(recipe.record),'placement':'both',
            'parts':len(recipe.parts),'vertices':len(vertices),
            'triangles':sum(max(0,len(face)-2) for part in recipe.parts for face in part['faces']),
            'dimensions':[round(maxs[i]-mins[i],5) for i in range(3)],
            'features':recipe.features,'sourceGeometryReused':False,'texelsPerMetre':16}

def collection_category(record):
    original=record.get('sourceCategory')
    if original=='枪械':return '枪械'
    if original=='武器':return '兵器'
    raise ValueError('Unrecognised original collection group: '+str(original))

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('mode',nargs='?',default='layout',choices=['layout','final','verify'])
    parser.add_argument('--layout-only',action='store_true')
    parser.add_argument('--id',action='append',default=[])
    parser.add_argument('--inspect-recipes',action='store_true')
    args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else sys.argv[1:])
    records=json.loads((ROOT/'weapons-records.json').read_text())
    recipes=[construct(record) for record in records if not args.id or record['id'] in args.id]
    summaries=[geometric_summary(recipe) for recipe in recipes]
    if args.inspect_recipes:
        (ROOT/'collection').mkdir(exist_ok=True)
        (ROOT/'collection'/'geometry-recipes.json').write_text(json.dumps(summaries,ensure_ascii=False,indent=2)+'\n')
        print(json.dumps({'recipes':len(recipes),'ids':len(set(r.record['id'] for r in recipes)),'triangles':sum(s['triangles'] for s in summaries)}))
        return
    from assetlib import Builder,verify_saved
    if args.mode=='verify':verify_saved('collection');return
    b=Builder('collection')
    for recipe,summary in zip(recipes,summaries):
        record=recipe.record
        a=b.asset(record['id'],record['name'],collection_category(record),placement='both',
                  scientific=record.get('scientific',''),origin=record.get('origin',''),era=record.get('era',''),
                  note=record.get('note',''),sources=record.get('sources',[]),aliases=record.get('aliases',''),
                  originalCategory=record.get('sourceCategory',''),weapon=True,detail=True,
                  features=recipe.features,displayOrientation='lying-flat',sourceGeometryReused=False)
        # Rotate the sculpted side view onto the placement plane before physical UV
        # charts are recorded. Front/back thickness becomes real vertical volume.
        # Lay the right side down, so the Sten magazine and Hotchkiss lateral strip
        # project upward instead of acting as improbable supports below the body.
        orient=(lambda x,y,z:(x,y,z)) if record['id']=='weapon-crossbow' else (lambda x,y,z:(x,z,-y))
        transformed=[orient(x,y,z) for part in recipe.parts for x,y,z in part['vertices']]
        bounds_min=[min(v[i] for v in transformed) for i in range(3)]
        bounds_max=[max(v[i] for v in transformed) for i in range(3)]
        center_x=(bounds_min[0]+bounds_max[0])/2;center_y=(bounds_min[1]+bounds_max[1])/2
        for part in recipe.parts:
            vertices=[(x-center_x,y-center_y,z-bounds_min[2]) for x,y,z in (orient(*v) for v in part['vertices'])]
            a.mesh(part['name'],vertices,part['faces'],mat=part['material'],role='collection-prop')
    (b.path/'geometry-recipes.json').write_text(json.dumps(summaries,ensure_ascii=False,indent=2)+'\n')
    b.finish('layout' if args.layout_only else args.mode)

if __name__=='__main__':main()
