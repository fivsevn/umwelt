"""34 new outdoor and everyday low-poly objects, authored in native Blender.
No earlier furniture geometry is loaded. Complete backs, bases, cavities and joints.
"""
import sys,math
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from assetlib import Builder,MODE,verify_saved
from mathutils import Vector,Matrix

if MODE=='verify':
    verify_saved('everyday');raise SystemExit
b=Builder('everyday')
RACK='架子';HOME='桌椅与居室';HOLDER='栽培与盛放';DAILY='日用与照明'


def flatbeam(a,name,start,end,width,depth,mat='wood',role='brace'):
    p,q=Vector(start),Vector(end);z=(q-p).normalized();y=Vector((0,1,0))
    if abs(z.dot(y))>.99:y=Vector((1,0,0))
    x=y.cross(z).normalized();y=z.cross(x).normalized()
    return a.box(name,(width,depth,(q-p).length),(p+q)/2,mat,role,rotation=Matrix((x,y,z)).transposed().to_euler())


def rod(a,name,start,end,r,mat='steel',role='support',sides=8):
    p,q=Vector(start),Vector(end);v=q-p
    return a.cyl(name,r,v.length,(p+q)/2,mat,role,vertices=sides,rotation=v.to_track_quat('Z','Y').to_euler())


def planar_extrude(a,name,outline,z,thick,mat,role='body'):
    n=len(outline);verts=[(x,y,h) for h in (z,z+thick) for x,y in outline]
    faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(k,(k+1)%n,(k+1)%n+n,k+n) for k in range(n)]
    return a.mesh(name,verts,faces,mat,role)


def ring_plane(a,name,center,normal,outer,inner,depth,mat='steel',role='rim',sides=12):
    c=Vector(center);n=Vector(normal).normalized();help=Vector((0,0,1)) if abs(n.z)<.9 else Vector((0,1,0))
    u=n.cross(help).normalized();v=n.cross(u).normalized();verts=[]
    for off,r in [(-depth/2,outer),(-depth/2,inner),(depth/2,inner),(depth/2,outer)]:
        verts.extend([tuple(c+n*off+(u*math.cos(k*math.tau/sides)+v*math.sin(k*math.tau/sides))*r) for k in range(sides)])
    faces=[]
    for row in range(4):
        nr=(row+1)%4
        for k in range(sides):faces.append((row*sides+k,row*sides+(k+1)%sides,nr*sides+(k+1)%sides,nr*sides+k))
    return a.mesh(name,verts,faces,mat,role)


def rect_annulus(a,name,w,d,rx,ry,top,thick,mat,cx=0,cy=0,role='counter-top'):
    corner=math.atan2(d,w);angles=sorted(set([k*math.tau/24 for k in range(24)]+[corner,math.pi-corner,math.pi+corner,math.tau-corner]))
    verts=[];n=len(angles)
    for outer,z in [(True,top),(False,top),(False,top-thick),(True,top-thick)]:
        for th in angles:
            co,si=math.cos(th),math.sin(th)
            radius=min(w/2/max(abs(co),1e-10),d/2/max(abs(si),1e-10)) if outer else 1/math.sqrt((co/rx)**2+(si/ry)**2)
            verts.append((cx+radius*co,cy+radius*si,z))
    faces=[(row*n+k,row*n+(k+1)%n,((row+1)%4)*n+(k+1)%n,((row+1)%4)*n+k) for row in range(4) for k in range(n)]
    return a.mesh(name,verts,faces,mat,role)


def cut_level_leg(a,name,start,end,width,depth,mat='wood-dark',angle=0):
    verts=[]
    for center in (start,end):
        for dx,dy in [(-width/2,-depth/2),(width/2,-depth/2),(width/2,depth/2),(-width/2,depth/2)]:
            verts.append((center[0]+dx*math.cos(angle)-dy*math.sin(angle),center[1]+dx*math.sin(angle)+dy*math.cos(angle),center[2]))
    return a.mesh(name,verts,[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],mat,'post')


def recenter(a):
    lo,hi,dim=b.measure(a);shift=Vector(((lo[0]+hi[0])/2,(lo[1]+hi[1])/2,lo[2]))
    for o in a.objects:
        for v in o.data.vertices:v.co-=shift
        o.data.update()
    for f in b.fields:
        if f['asset']==a.id:
            for key in ('center','paintOrigin'):f[key]=[f[key][k]-shift[k] for k in range(3)]
    for s in a.surfaces:
        s['center']=[s['center'][0]-shift.x,s['center'][1]-shift.y];s['height']-=shift.z
        if s.get('rimHeight') is not None:s['rimHeight']-=shift.z
        if s.get('cavity'):
            s['container']=True
            s['headroom']=max(0,s['rimHeight']-s['height'])


def basic_rack(id,levels,mat):
    iron=mat.startswith('iron');w=1 if iron else .875;d=.4375
    heights=[.1875,.625,1.0625,1.5][:levels] if iron else ([.1875,.6875] if levels==2 else [.1875,.625,1.0625])
    h=1.5625 if iron and levels==4 else 1.125 if levels==3 else .75
    nm=('铁质' if iron else '木质')+('三层' if levels==3 else '四层' if levels==4 else '两层')+'花架'+(' · 黑色' if mat=='iron-black' else ' · 银色' if mat=='iron-silver' else '')
    a=b.asset(id,nm,RACK,'floor',material=mat,levels=levels,construction='new complete frame and real shelf structure')
    post=.028 if iron else .055;px=w/2-.020 if iron else w/2-post/2;py=d/2-.020 if iron else d/2-post/2-.0015
    for ix,x in enumerate((-px,px)):
        for iy,y in enumerate((-py,py)):
            a.box(f'post-{ix}-{iy}',(post,post,h-(.015 if iron else 0)),(x,y,(h+.015)/2 if iron else h/2),mat,'post')
            if iron:a.box(f'foot-{ix}-{iy}',(.040,.040,.015),(x,y,.0075),'rubber','foot')
    for level,zt in enumerate(heights,1):
        if iron:
            sx=px-post/2;sy=py-post/2;edge=.016
            for sign in (-1,1):
                a.box(f'L{level}-rim-frontback-{sign}',(px*2,edge,.026),(0,sign*py,zt-.013),mat,'shelf-edge')
                a.box(f'L{level}-rim-side-{sign}',(edge,py*2,.026),(sign*px,0,zt-.013),mat,'shelf-edge')
            gx=px-edge/2;gy=py-edge/2
            for k in range(9):a.box(f'L{level}-grid-depth-{k}',(.008,gy*2,.008),((k-4)*gx/5,0,zt-.004),mat,'shelf-grid')
            for k,y in enumerate((-gy*.5,0,gy*.5)):a.box(f'L{level}-grid-cross-{k}',(gx*2,.007,.007),(0,y,zt-.0115),mat,'shelf-grid')
            for ix,x in enumerate((-px,px)):
                for iy,y in enumerate((-py,py)):
                    a.box(f'L{level}-joint-{ix}-{iy}',(.034,.034,.036),(x,y,zt-.02),'steel-dark','joint')
                    rod(a,f'L{level}-bolt-{ix}-{iy}',(x,y+(-post/2 if iy==0 else post/2),zt-.018),(x,y+(-post/2-.002 if iy==0 else post/2+.002),zt-.018),.005,'steel','hardware')
        else:
            clear=d-post*2;gap=.012;bd=(clear-gap*3)/4
            for k in range(4):a.box(f'L{level}-board-{k}',(.800,bd,.025),(0,-clear/2+bd/2+k*(bd+gap),zt-.0125),'wood','wood-top')
            for sign in (-1,1):
                a.box(f'L{level}-apron-{sign}',(w-post*2,.034,.048),(0,sign*(py-.013),zt-.049),'wood-dark','wood-edge')
                a.box(f'L{level}-endbeam-{sign}',(.038,clear,.048),(sign*(px-.017),0,zt-.049),'wood','wood-edge')
            for ix,x in enumerate((-px,px)):
                for iy,y in enumerate((-py,py)):
                    rod(a,f'L{level}-screw-{ix}-{iy}',(x,y+(-post/2 if iy==0 else post/2),zt-.05),(x,y+(-post/2-.0015 if iy==0 else post/2+.0015),zt-.05),.0045,'steel-dark','hardware')
        a.surface(f'shelf-{level}',f'第{level}层',zt,w-.080 if iron else .800,d-.090 if iron else d-post*2,openGrid=iron,headroom=(heights[level]-zt-.025) if level<len(heights) else None)
    if iron:
        y=py+.009
        flatbeam(a,'rear-brace-a',(-px+.02,y,.10),(px-.02,y,h-.08),.012,.005,mat)
        flatbeam(a,'rear-brace-b',(px-.02,y,.10),(-px+.02,y,h-.08),.012,.005,mat)
    else:flatbeam(a,'rear-wood-brace',(-px+.025,py+.018,.10),(px-.025,py+.018,heights[-1]-.075),.038,.015,'wood-dark')
    return a


def step_rack():
    a=b.asset('step-rack','三阶斜式木花架',RACK,'floor',reference='User screenshot, left item',levels=3)
    w=.875;ys=[-.3125,0,.3125];tops=[.1875,.4375,.6875]
    for level,(y,zt) in enumerate(zip(ys,tops),1):
        for k in range(3):a.box(f'L{level}-broad-board-{k}',(.810,.084,.028),(0,y+(k-1)*.096,zt-.014),'wood','wood-top')
        a.box(f'L{level}-cross-support',(.775,.05,.05),(0,y,zt-.053),'wood-dark','wood-edge')
        for side in (-1,1):a.box(f'L{level}-leg-{side}',(.048,.048,zt-.028),(side*.385,y,(zt-.028)/2),'wood-dark','post')
        a.surface(f'step-{level}',f'第{level}阶板面',zt,.810,.276,center=(0,y),headroom=None)
    for side in (-1,1):
        flatbeam(a,f'side-stringer-{side}',(side*.405,-.45,.10),(side*.405,.44,.735),.05,.04)
    flatbeam(a,'rear-cross-brace',(-.385,.337,.035),(.385,.337,.635),.035,.020,'wood-dark')
    return a


def plastic_basket_rack():
    a=b.asset('plastic-basket-rack','浅白三篮筐花架',RACK,'floor',reference='User screenshot, right item',levels=3,material='polypropylene')
    w=.4375;d=.3125;h=.9375;px=w/2-.015;py=d/2-.015
    for ix,x in enumerate((-px,px)):
        for iy,y in enumerate((-py,py)):
            a.box(f'post-{ix}-{iy}',(.020,.020,h),(x,y,h/2),'plastic-white','post')
            a.box(f'foot-{ix}-{iy}',(.028,.028,.014),(x,y,.007),'plastic-white','foot')
    bw=w-.043;bd=d-.043
    for level,floor in enumerate((.18,.48,.78),1):
        rim=floor+.095
        for sign in (-1,1):
            for z,name in ((floor,'lower'),(floor+.045,'middle'),(rim,'lip')):
                a.box(f'L{level}-{name}-frontback-{sign}',(bw,.012,.013 if name!='lip' else .023),(0,sign*(bd/2),z),'plastic-white','basket-rim' if name=='lip' else 'basket-wall')
                a.box(f'L{level}-{name}-side-{sign}',(.012,bd,.013 if name!='lip' else .023),(sign*(bw/2),0,z),'plastic-white','basket-rim' if name=='lip' else 'basket-wall')
            for k in range(8):a.box(f'L{level}-frontback-rib-{sign}-{k}',(.006,.006,.093),((k-3.5)*bw/8,sign*bd/2,floor+.0465),'plastic-white','basket-wall')
            for k in range(5):a.box(f'L{level}-side-rib-{sign}-{k}',(.006,.006,.093),(sign*bw/2,(k-2)*bd/5,floor+.0465),'plastic-white','basket-wall')
        for k in range(8):a.box(f'L{level}-floor-long-{k}',(.007,bd,.009),((k-3.5)*bw/8,0,floor-.0045),'plastic-white','basket-floor')
        for k in range(5):a.box(f'L{level}-floor-cross-{k}',(bw,.007,.009),(0,(k-2)*bd/5,floor-.0045),'plastic-white','basket-floor')
        a.surface(f'basket-{level}',f'第{level}筐底',floor,bw-.020,bd-.020,cavity=True,rimHeight=rim,openGrid=True)
    return a


def wood_table():
    a=b.asset('wood-square-table','方木桌',HOME,'floor',material='wood')
    w=.875;d=.875;h=.6875
    for k in range(3):a.box(f'top-board-{k}',(w,.275,.035),(0,(k-1)*.300,h-.0175),'wood','wood-top')
    for x in (-.37,.37):
        for y in (-.37,.37):a.box(f'leg-{x}-{y}',(.055,.055,h-.035),(x,y,(h-.035)/2),'wood-dark','post')
    for sign in (-1,1):
        a.box(f'apron-long-{sign}',(.74,.038,.095),(0,sign*.37,h-.0825),'wood','wood-edge')
        a.box(f'apron-end-{sign}',(.038,.74,.095),(sign*.37,0,h-.0825),'wood','wood-edge')
        a.box(f'low-end-stretcher-{sign}',(.03,.74,.035),(sign*.37,0,.16),'wood-dark','brace')
    a.surface('table-top','桌面',h,w,d);return a


def iron_table():
    a=b.asset('iron-round-table','圆铁桌',HOME,'floor',material='iron-black')
    h=.70;r=.3125
    a.cyl('round-top',r,.023,(0,0,h-.0115),'iron-black','table-top',vertices=20)
    a.lathe('folded-round-edge',[(r-.007,h-.035),(r+.004,h-.035),(r+.004,h),(r-.007,h),(r-.007,h-.035)],'iron-black','rim',sides=20)
    for k in range(4):
        theta=math.pi/4+k*math.pi/2
        start=(.225*math.cos(theta),.225*math.sin(theta),.013);end=(.155*math.cos(theta),.155*math.sin(theta),h-.025)
        rod(a,f'leg-{k}',start,end,.014,'iron-black','post')
        a.cyl(f'rubber-foot-{k}',.018,.016,(start[0],start[1],.008),'rubber','foot',vertices=8)
        rod(a,f'under-top-spoke-{k}',(0,0,h-.045),end,.010,'iron-black','support')
    for k in range(2):
        th=math.pi/4+k*math.pi/2
        rod(a,f'low-cross-{k}',(-.197*math.cos(th),-.197*math.sin(th),.28),(.197*math.cos(th),.197*math.sin(th),.28),.010,'iron-black','brace')
    a.surface('table-top','圆桌面',h,r*2,r*2,shape='circle');return a


def wood_stool(round):
    id='wood-round-stool' if round else 'wood-square-stool';a=b.asset(id,'圆木小板凳' if round else '方木小板凳',HOME,'both',material='wood')
    h=.28125
    if round:a.cyl('seat',.164,.036,(0,0,h-.018),'wood','seat',vertices=16)
    else:a.box('seat',(.328,.328,.036),(0,0,h-.018),'wood','seat')
    for ix,x in enumerate((-.104,.104)):
        for iy,y in enumerate((-.095,.095)):
            cut_level_leg(a,f'leg-{ix}-{iy}',(x*1.12,y*1.10,0),(x,y,h-.036),.036,.036)
    for sign in (-1,1):
        a.box(f'cross-stretcher-{sign}',(.215,.024,.025),(0,sign*.098,.105),'wood-dark','brace')
        a.box(f'end-stretcher-{sign}',(.024,.198,.025),(sign*.11,0,.122),'wood-dark','brace')
    a.surface('seat','凳面',h,.328,.328 if round else .291,shape='circle' if round else 'rectangle');return a


def plastic_stool():
    a=b.asset('plastic-round-stool','塑料圆凳',HOME,'both',material='polypropylene')
    h=.40625;r=.18
    a.lathe('moulded-seat-with-finger-hole',[(.028,h-.021),(r-.007,h-.021),(r,h-.010),(r,h),(.028,h),(.028,h-.021)],'plastic-grey','seat',sides=16)
    a.lathe('underside-seat-rib',[(.120,h-.050),(.133,h-.050),(.133,h-.021),(.120,h-.021),(.120,h-.050)],'plastic-grey','underside',sides=16)
    for k in range(4):
        th=math.pi/4+k*math.pi/2
        cut_level_leg(a,f'moulded-leg-{k}',(.14*math.cos(th),.14*math.sin(th),0),(.105*math.cos(th),.105*math.sin(th),h-.021),.042,.029,'plastic-grey',th)
        rod(a,f'underside-rib-{k}',(0,0,h-.033),(.12*math.cos(th),.12*math.sin(th),h-.033),.011,'plastic-grey','underside')
    a.surface('seat','凳面',h,r*2,r*2,shape='circle',holes=[dict(shape='circle',radius=.028,center=[0,0])]);return a


def rect_bowl(a,name,cx,cy,zt,w,d,depth,mat):
    # Separate planar shell sections close a real tapered bowl and its underside.
    t=.007;bottomz=zt-depth
    rings=[(w/2,d/2,zt),(w*.42,d*.40,bottomz+t),(w*.42+t,d*.40+t,bottomz),(w/2+t,d/2+t,zt-.006)]
    verts=[(cx+x*hw,cy+y*hd,z) for hw,hd,z in rings for x,y in [(-1,-1),(1,-1),(1,1),(-1,1)]]
    faces=[]
    for row in range(3):
        for j in range(4):faces.append((row*4+j,row*4+(j+1)%4,(row+1)*4+(j+1)%4,(row+1)*4+j))
    for j in range(4):faces.append((12+j,12+(j+1)%4,(j+1)%4,j))
    a.mesh(name,verts,faces,mat,'basin-shell')
    rect_annulus(a,name+'-real-floor-with-drain',w*.84+t*2,d*.80+t*2,.018,.018,bottomz+t,t,mat,cx,cy,'basin-floor')
    ring_plane(a,name+'-drain-collar',(cx,cy,bottomz+t+.0025),(0,0,1),.031,.018,.005,'steel','drain',sides=12)
    return bottomz


def tap_and_drain(a,cx,cy,deck,floor,mat='steel'):
    a.cyl('tap-mount',.037,.021,(cx,cy,deck+.0105),'steel','tap',vertices=12)
    a.tube('gooseneck-tap',[(cx,cy,deck+.021),(cx,cy,deck+.19),(cx,cy-.014,deck+.25),(cx,cy-.055,deck+.275),(cx,cy-.112,deck+.245),(cx,cy-.133,deck+.19)],.017,mat,'tap',sides=8)
    a.cyl('tap-control',.025,.035,(cx+.060,cy,deck+.025),'steel-dark','tap',vertices=8)
    a.box('tap-control-lever',(.10,.014,.011),(cx+.062,cy,deck+.047),'steel','tap')
    a.tube('drain-trap',[(cx,0,floor-.006),(cx,0,floor-.13),(cx,.075,floor-.19),(cx,.145,floor-.17),(cx,.18,floor-.09),(cx,.25,floor-.09)],.020,'steel-dark','drain',sides=8)
    for k,z in enumerate((floor-.02,floor-.10)):a.cyl(f'drain-coupling-{k}',.026,.026,(cx,0,z),'steel','drain',vertices=8)


def washstation(steel):
    id='steel-sink' if steel else 'enamel-basin';a=b.asset(id,'不锈钢水槽' if steel else '蓝色水池台',DAILY,'floor',material='stainless steel' if steel else 'white enamel and blue basin',opening=True)
    w=1.0625 if steel else .875;d=.625;top=.8125;cx=.20 if steel else 0;bw=.50 if steel else .625;bd=.4375 if steel else .50
    mat='steel' if steel else 'enamel';body='steel-dark' if steel else 'enamel-blue'
    # Four deck slabs form a real, continuous rectangular opening.
    left=cx-bw/2;right=cx+bw/2
    if steel:
        for side,x0,x1 in [('left',-w/2,left),('right',right,w/2)]:
            if x1>x0:a.box('deck-'+side,(x1-x0,d,.027),((x0+x1)/2,0,top-.0135),mat,'counter-top')
        for sign in (-1,1):a.box('deck-frontback-'+str(sign),(bw,(d-bd)/2,.027),(cx,sign*(d+bd)/4,top-.0135),mat,'counter-top')
    else:rect_annulus(a,'continuous-white-deck',w,d,bw/2,bd/2,top,.027,mat)
    if steel:
        floor=rect_bowl(a,'pressed-steel-bowl',cx,0,top,bw,bd,.245,'steel')
        for k in range(5):a.box(f'drainboard-ridge-{k}',(.228,.012,.006),(-.382,(k-2)*.068,top+.003),'steel-light','drainboard')
    else:
        # Oval enamel basin with a closed profile; deck corners fill the circular aperture.
        a.lathe('blue-glazed-basin',[(.316,top),(.305,top-.014),(.251,top-.218),(.13,top-.234),(.017,top-.234),(.017,top-.243),(.14,top-.243),(.257,top-.226),(.323,top-.012),(.316,top)],'enamel-blue','basin-shell',sides=20,radius_scale=lambda th,k:1/math.sqrt(math.cos(th)**2+(math.sin(th)/.8)**2))
        floor=top-.234
        ring_plane(a,'basin-drain',(0,0,floor+.0025),(0,0,1),.026,.017,.005,'steel','drain',sides=12)
    for sign in (-1,1):
        a.box(f'apron-long-{sign}',(w-.02,.018,.11),(0,sign*(d/2-.012),top-.080),body,'apron')
        a.box(f'apron-end-{sign}',(.018,d-.045,.11),(sign*(w/2-.012),0,top-.080),body,'apron')
    for ix,x in enumerate((-w/2+.052,w/2-.052)):
        for iy,y in enumerate((-d/2+.052,d/2-.052)):
            a.box(f'leg-{ix}-{iy}',(.034,.034,top-.027),(x,y,(top-.027)/2),'steel','post')
            a.box(f'foot-{ix}-{iy}',(.045,.045,.020),(x,y,.01),'rubber','foot')
        a.box(f'end-stretcher-{ix}',(.025,d-.104,.026),(x,0,.23),body,'brace')
    a.box('rear-low-tie',(w-.104,.025,.026),(0,d/2-.052,.23),body,'brace')
    a.box('splashback',(w,.018,.117),(0,d/2-.014,top+.0585),mat,'splashback')
    tap_and_drain(a,cx,d/2-.07,top,floor)
    if steel:
        a.surface('drainboard','沥水台',top+.006,.228,.284,center=(-.382,0),openGrid=True)
        a.surface('side-worktop','侧边台面',top,.218,d,center=(-.159,0))
    a.surface('basin-floor','池底',floor+.007 if steel else floor,bw*.79 if steel else .26,bd*.76 if steel else .208,center=(cx,0),shape='rectangle' if steel else 'ellipse',cavity=True,rimHeight=top,holes=[dict(shape='circle',radius=.030,center=[0,0])])
    return a


def crate(id,mat,name):
    a=b.asset(id,name,HOLDER,'both',material='polypropylene',sameStructureAs='crate-blue')
    w=.50;d=.3125;h=.1875;t=.012
    a.box('solid-base',(w-.022,d-.022,.014),(0,0,.015),mat,'container-bottom')
    for ix,x in enumerate((-w/2+t/2,w/2-t/2)):
        for iy,y in enumerate((-d/2+t/2,d/2-t/2)):a.box(f'corner-{ix}-{iy}',(t,t,h),(x,y,h/2),mat,'corner')
    for sign in (-1,1):
        a.box(f'top-long-rim-{sign}',(w,.014,.017),(0,sign*(d/2-.007),h-.0085),mat,'rim')
        a.box(f'top-end-rim-{sign}',(.014,d,.017),(sign*(w/2-.007),0,h-.0085),mat,'rim')
        for k,z in enumerate((.035,.067,.099,.131)):
            a.box(f'long-band-{sign}-{k}',(w-.02,.009,.008),(0,sign*(d/2-.006),z),mat,'perforated-wall')
            a.box(f'end-band-{sign}-{k}',(.009,d-.020,.008),(sign*(w/2-.006),0,z),mat,'perforated-wall')
        for k in range(9):a.box(f'long-vertical-{sign}-{k}',(.007,.009,h-.022),((k-4)*(w-.040)/10,sign*(d/2-.006),(h+.014)/2),mat,'perforated-wall')
        for k in range(5):
            y=(k-2)*(d-.042)/6
            zh=.13 if abs(y)<.052 else h-.025
            a.box(f'end-vertical-{sign}-{k}',(.009,.009,zh-.014),(sign*(w/2-.006),y,(zh+.014)/2),mat,'perforated-wall')
        a.box(f'handhold-lower-{sign}',(.020,.11,.012),(sign*(w/2-.010),0,.13),mat,'handle')
    for sign in (-1,1):a.box(f'underside-rib-{sign}',(w-.06,.010,.008),(0,sign*.075,.004),mat,'underside')
    a.surface('inside-floor','箱底',.022,w-.031,d-.031,cavity=True,rimHeight=h);return a


def bucket(plastic):
    id='plastic-bucket' if plastic else 'galvanized-bucket';a=b.asset(id,'塑料水桶' if plastic else '镀锌铁皮水桶',HOLDER,'both',material='polypropylene' if plastic else 'galvanized metal')
    if plastic:
        profile=[(.104,0),(.115,.015),(.148,.26),(.165,.276),(.169,.292),(.154,.300),(.148,.286),(.140,.270),(.108,.021),(0,.021),(0,0),(.104,0)]
        a.lathe('moulded-hollow-bucket',profile,'plastic-blue','bucket-shell',sides=16)
        for sign in (-1,1):ring_plane(a,f'moulded-ear-{sign}',(sign*.155,0,.258),(1,0,0),.020,.007,.013,'plastic-blue','handle-ear')
        path=[(.157*math.cos(k*math.pi/8),0,.258+.168*math.sin(k*math.pi/8)) for k in range(9)]
        a.tube('plastic-carry-handle',path,.008,'plastic-grey','handle',sides=8)
        a.box('wide-plastic-grip',(.085,.025,.021),(0,0,.423),'plastic-grey','handle')
        floor=.021;mouth=.29
    else:
        profile=[(.102,0),(.118,.010),(.124,.072),(.133,.082),(.133,.091),(.128,.10),(.139,.177),(.146,.183),(.146,.193),(.142,.200),(.154,.278),(.162,.282),(.162,.294),(.153,.298),(.147,.285),(.139,.202),(.128,.105),(.117,.018),(0,.018),(0,0),(.102,0)]
        a.lathe('folded-galvanized-shell',profile,'iron-silver','bucket-shell',sides=16)
        for sign in (-1,1):
            a.box(f'pressed-handle-mount-{sign}',(.012,.034,.042),(sign*.148,0,.253),'steel','handle-ear')
            rod(a,f'handle-pivot-{sign}',(sign*.148,0,.255),(sign*.166,0,.255),.010,'steel-dark','hardware')
        path=[(.163*math.cos(k*math.pi/10),0,.255+.192*math.sin(k*math.pi/10)) for k in range(11)]
        a.tube('wire-carry-handle',path,.0045,'steel','handle',sides=6)
        rod(a,'wooden-handle-grip',(-.04,0,.442),(.04,0,.442),.010,'wood-dark','handle')
        floor=.018;mouth=.298
    a.surface('inside-floor','桶底',floor,.212,.212,shape='circle',cavity=True,rimHeight=mouth);return a


def foam_box(seedlings):
    id='foam-seedlings' if seedlings else 'foam-soil';a=b.asset(id,'泡沫育苗箱' if seedlings else '泡沫土箱',HOLDER,'both',material='foam',filled=True,emptyCavity=False)
    w=.625;d=.375;h=.2125;t=.027
    a.box('foam-floor',(w,d,.027),(0,0,.0135),'foam','container-bottom')
    for sign in (-1,1):
        a.box(f'foam-long-wall-{sign}',(w,t,h),(0,sign*(d/2-t/2),h/2),'foam','container-wall')
        a.box(f'foam-end-wall-{sign}',(t,d-t*2,h),(sign*(w/2-t/2),0,h/2),'foam','container-wall')
    a.box('filled-soil',(w-t*2,d-t*2,.153),(0,0,.1035),'soil','filled-soil')
    if seedlings:
        for ix,x in enumerate((-.18,0,.18)):
            for iy,y in enumerate((-.079,.079)):
                a.cyl(f'seedling-stem-{ix}-{iy}',.004,.068,(x,y,.209),'stem','stem',vertices=6)
                for sign in (-1,1):
                    verts=[(x,y,.232),(x+sign*.032,y-.015,.247),(x+sign*.047,y,.253),(x+sign*.032,y+.015,.247),(x,y,.230),(x+sign*.032,y-.015,.245),(x+sign*.047,y,.251),(x+sign*.032,y+.015,.245)]
                    a.mesh(f'seedling-leaf-{ix}-{iy}-{sign}',verts,[(0,1,2),(0,2,3),(7,6,4),(6,5,4),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)],'leaf','leaf')
    return a


def seed_tray():
    a=b.asset('seed-tray','育苗浅盘',HOLDER,'both',material='plastic')
    w=.50;d=.3125;h=.065;t=.009
    a.box('tray-floor',(w,d,.012),(0,0,.006),'plastic-grey','container-bottom')
    for sign in (-1,1):
        a.box(f'long-wall-{sign}',(w,t,h),(0,sign*(d/2-t/2),h/2),'plastic-grey','container-wall')
        a.box(f'end-wall-{sign}',(t,d-t*2,h),(sign*(w/2-t/2),0,h/2),'plastic-grey','container-wall')
        a.box(f'long-lip-{sign}',(w,.014,.009),(0,sign*(d/2-.004),h-.0045),'plastic-grey','rim')
        a.box(f'end-lip-{sign}',(.014,d,.009),(sign*(w/2-.004),0,h-.0045),'plastic-grey','rim')
    a.surface('inside-floor','盘底',.012,w-.03,d-.03,cavity=True,rimHeight=h);return a


def aquarium(square):
    id='aquarium-square' if square else 'aquarium-rectangle';a=b.asset(id,'正方玻璃鱼缸' if square else '长方玻璃鱼缸',HOLDER,'both',material='glass',filled=True,waterLevel=.28125 if square else .25,wallThickness=.006)
    w=.4375 if square else .625;d=.4375 if square else .3125;h=.40625 if square else .375;t=.006
    a.box('real-glass-bottom',(w,d,.008),(0,0,.004),'glass','glass-bottom')
    for sign in (-1,1):
        a.box(f'frontback-glass-{sign}',(w,t,h),(0,sign*(d/2-t/2),h/2),'glass','glass-wall')
        a.box(f'end-glass-{sign}',(t,d-t*2,h),(sign*(w/2-t/2),0,h/2),'glass','glass-wall')
    wz=a.meta['waterLevel'];a.box('water-volume',(w-t*2-.002,d-t*2-.002,wz-.015),(0,0,(wz+.015)/2),'water','water')
    a.box('fine-gravel-bottom',(w-t*2-.006,d-t*2-.006,.008),(0,0,.012),'#a2a491','gravel')
    for k,(x,y) in enumerate(((-w*.21,-d*.16),(w*.24,d*.18))):a.cyl(f'underwater-stone-{k}',.023,.024,(x,y,.027),'#939887','stone',vertices=8,radius_top=.012)
    a.cyl('water-plant-stem',.004,.125,(-w*.25,d*.22,.078),'stem','stem',vertices=6)
    for k,z in enumerate((.055,.093,.135)):
        x=-w*.25;y=d*.22
        a.mesh(f'water-leaf-{k}',[(x,y,z),(x-.034,y-.012,z+.015),(x-.05,y,z+.021),(x-.034,y+.012,z+.015)],[(0,1,2),(0,2,3),(2,1,0),(3,2,0)],'leaf-dark','water-plant')
    return a


def ceramic_fish_bowl():
    a=b.asset('ceramic-fish-bowl','圆瓷鱼缸',HOLDER,'both',material='porcelain',filled=True,waterLevel=.26)
    profile=[(.171,0),(.181,.025),(.255,.07),(.303,.16),(.3125,.235),(.296,.320),(.300,.332),(.295,.344),(.279,.339),(.275,.32),(.29,.23),(.28,.16),(.228,.08),(.128,.039),(0,.039),(0,.018),(.171,.018),(.171,0)]
    mats=['porcelain']*(len(profile)-1)
    for k in (5,6,7):mats[k]='blue-ink'
    a.lathe('complete-porcelain-bowl',profile,'porcelain','porcelain-fish-bowl',sides=24,segment_materials=mats)
    a.cyl('water-volume',.267,.19,(0,0,.165),'water','water',vertices=24,radius_top=.281)
    for k,(x,y) in enumerate(((-.075,-.045),(.09,.053))):a.cyl(f'underwater-pebble-{k}',.028,.020,(x,y,.055),'#a1a18e','stone',vertices=8,radius_top=.017)
    return a


def trowel():
    a=b.asset('trowel','园艺铲',DAILY,'both',material='wood handle and steel blade')
    outline=[(0,-.160),(.043,-.105),(.040,-.032),(.012,.014),(-.012,.014),(-.040,-.032),(-.043,-.105)]
    n=len(outline);verts=[(x,y,.022 if k!=0 else .020) for k,(x,y) in enumerate(outline)]+[(0,-.082,.012)]
    verts += [(x,y,z-.004) for x,y,z in verts]
    centre=n;faces=[];off=n+1
    for k in range(n):faces.extend([(centre,k,(k+1)%n),(centre+off,(k+1)%n+off,k+off),(k,k+off,(k+1)%n+off,(k+1)%n)])
    a.mesh('scooped-steel-blade',verts,faces,'steel','blade')
    rod(a,'neck',(0,-.003,.021),(0,.041,.027),.009,'steel-dark','ferrule')
    rod(a,'wood-handle',(0,.032,.028),(0,.150,.028),.015,'wood-dark','handle',sides=10)
    rod(a,'steel-ferrule',(0,.023,.027),(0,.052,.027),.017,'steel','ferrule',sides=10)
    return a


def pruning_shears():
    a=b.asset('pruning-shears','园艺剪',DAILY,'both',material='steel blades and plastic grips')
    planar_extrude(a,'curved-cutting-blade',[(0,-.023),(.020,-.04),(.033,-.092),(.025,-.134),(.016,-.114),(.009,-.076),(-.011,-.026)],.014,.006,'steel','blade')
    planar_extrude(a,'hooked-anvil-blade',[(.005,-.015),(-.015,-.036),(-.025,-.084),(-.013,-.113),(.008,-.115),(.014,-.099),(-.002,-.102),(-.011,-.079),(.008,-.027)],.021,.005,'steel-dark','blade')
    for sign in (-1,1):
        pts=[(sign*.014,-.009,.015),(sign*.044,.030,.015),(sign*.045,.093,.015),(sign*.028,.117,.015),(sign*.014,.107,.015),(sign*.013,.065,.015)]
        a.tube(f'loop-grip-{sign}',pts,.009,'plastic-red','handle',sides=8,closed=True)
    a.cyl('pivot-bolt',.016,.011,(0,-.015,.019),'steel','hardware',vertices=10)
    a.box('pivot-slot',(.015,.003,.002),(0,-.015,.0255),'steel-dark','hardware')
    a.tube('return-spring',[(-.014,.035,.017),(-.008,.041,.017),(-.003,.029,.017),(.003,.041,.017),(.008,.029,.017),(.014,.035,.017)],.0025,'steel','spring',sides=6)
    return a


def trigger_sprayer():
    a=b.asset('trigger-sprayer','手持喷壶',DAILY,'both',material='moulded plastic')
    a.lathe('closed-spray-bottle',[(.043,0),(.055,.012),(.060,.12),(.053,.193),(.028,.220),(.027,.242),(0,.242),(0,0),(.043,0)],'plastic-green','bottle',sides=16)
    a.cyl('screw-neck',.031,.030,(0,0,.233),'plastic-grey','cap',vertices=12)
    a.extrude('trigger-head',[(-.030,.241),(-.031,.267),(.055,.282),(.077,.274),(.071,.254),(.020,.245),(.019,.224),(-.006,.225)],.034,'plastic-grey','sprayer-head')
    a.tube('trigger-lever',[(.040,0,.257),(.044,0,.229),(.024,0,.216)],.006,'plastic-white','trigger',sides=6)
    rod(a,'nozzle',(.065,0,.268),(.092,0,.268),.012,'steel-dark','nozzle',sides=10)
    a.box('simple-front-label',(.055,.004,.056),(0,-.058,.111),'plastic-white','label')
    return a


def watering_can():
    a=b.asset('watering-can','浇水壶',DAILY,'both',material='moulded plastic',opening=True)
    # Complete reservoir shell has a real open neck and an inner bottom.
    a.lathe('open-reservoir',[(.086,0),(.116,.020),(.130,.15),(.118,.218),(.064,.246),(.061,.270),(.044,.270),(.044,.249),(.100,.211),(.112,.148),(.098,.026),(0,.026),(0,0),(.086,0)],'plastic-green','reservoir',sides=16,radius_scale=lambda th,k:1/math.sqrt((math.cos(th)/1.15)**2+(math.sin(th)/.83)**2))
    a.tube('rear-loop-handle',[(-.102,0,.045),(-.196,0,.077),(-.210,0,.145),(-.184,0,.217),(-.096,0,.235)],.015,'plastic-green','handle',sides=8)
    a.tube('top-carry-handle',[(0,-.075,.20),(0,-.073,.288),(0,-.035,.316),(0,.035,.316),(0,.073,.288),(0,.075,.20)],.013,'plastic-green','handle',sides=8)
    end=Vector((.305,0,.198));before=Vector((.233,0,.143));direction=(end-before).normalized()
    a.tube('rising-spout',[(.112,0,.052),(.185,0,.090),tuple(before),tuple(end)],.017,'plastic-green','spout',sides=8)
    ring_plane(a,'rose-rim',end,direction,.043,.033,.018,'plastic-grey','rose',sides=16)
    helper=Vector((0,1,0));v=direction.cross(helper).normalized()
    for k in range(6):
        delta=(helper*math.cos(k*math.tau/6)+v*math.sin(k*math.tau/6))*.033
        rod(a,f'rose-grid-{k}',end-direction*.009,end+delta+direction*.008,.0035,'plastic-grey','rose',sides=6)
    a.surface('reservoir-floor','壶内底',.026,.18,.13,shape='ellipse',cavity=True,rimHeight=.27,openingWidth=.10,openingDepth=.075)
    return a


def hose_coil():
    a=b.asset('hose-coil','软管卷',DAILY,'both',material='rubber hose with plastic fittings')
    pts=[]
    for k in range(49):
        theta=k*math.tau*3/48;r=.18-k*.087/48
        pts.append((r*math.cos(theta),r*math.sin(theta),.014))
    a.tube('three-turn-hose',pts,.011,'plastic-green','hose',sides=8)
    a.tube('loose-end',[(.18,0,.014),(.226,.020,.014),(.256,.070,.014)],.011,'plastic-green','hose',sides=8)
    rod(a,'hose-fitting',(.243,.048,.014),(.263,.083,.014),.016,'plastic-grey','connector')
    rod(a,'spray-tip',(.263,.083,.014),(.278,.109,.014),.021,'steel-dark','nozzle')
    rod(a,'inner-end-fitting',(.093,0,.014),(.055,0,.014),.015,'plastic-grey','connector')
    return a


def drying_rack():
    a=b.asset('drying-rack','折叠晾衣架',DAILY,'floor',material='tubular steel')
    w=.9375;top=.80
    for side,x in enumerate((-.45,.45)):
        for sign in (-1,1):
            rod(a,f'crossing-leg-{side}-{sign}',(x,sign*.245,.018),(x,-sign*.15,top),.011,'steel','post')
            rod(a,f'foot-sleeve-{side}-{sign}',(x,sign*.245,.008),(x,sign*.233,.040),.014,'rubber','foot')
        ring_plane(a,f'folding-pivot-{side}',(x,0,.405),(1,0,0),.024,.007,.012,'steel-dark','joint',sides=10)
    for sign in (-1,1):rod(a,f'top-perimeter-{sign}',(-w/2,sign*.15,top),(w/2,sign*.15,top),.012,'steel','rail')
    for side in (-1,1):rod(a,f'top-end-{side}',(side*w/2,-.15,top),(side*w/2,.15,top),.012,'steel','rail')
    for k in range(6):rod(a,f'hanging-bar-{k}',(-w/2+.01,(k-2.5)*.051,top),(w/2-.01,(k-2.5)*.051,top),.007,'steel','hanging-bar')
    return a


def clip_hanger():
    a=b.asset('clip-hanger','夹衣架',DAILY,'both',material='steel frame with plastic clips')
    pts=[(-.19,-.105,.11),(.19,-.105,.11),(.19,.105,.11),(-.19,.105,.11)]
    a.tube('closed-wire-frame',pts,.0045,'steel','frame',sides=6,closed=True)
    for k,(x,y,z) in enumerate(pts):a.tube(f'suspension-{k}',[(x,y,.11),(x*.40,y*.40,.25),(0,0,.28)],.003,'steel','hanger',sides=6)
    a.tube('open-hook',[(0,0,.267),(0,0,.318),(.016,0,.344),(.027,0,.342),(.029,0,.323),(.017,0,.313)],.005,'steel','hook',sides=8)
    for side in (-1,1):
        for k,x in enumerate((-.125,0,.125)):
            y=side*.105
            ring_plane(a,f'clip-hanger-loop-{side}-{k}',(x,y,.095),(0,1,0),.014,.009,.004,'steel','hanger',sides=8)
            for jaw in (-1,1):a.box(f'clip-jaw-{side}-{k}-{jaw}',(.014,.011,.060),(x,y+jaw*.007,.048),'plastic-white' if k!=1 else 'plastic-blue','clip')
            rod(a,f'clip-pivot-{side}-{k}',(x-.009,y,.060),(x+.009,y,.060),.006,'steel','joint',sides=8)
    return a


def towel():
    a=b.asset('towel','折叠毛巾',DAILY,'both',material='cotton')
    a.box('lower-fold',(.3125,.1875,.015),(0,0,.0075),'cloth','cloth-bottom')
    a.box('upper-fold',(.290,.1875,.010),(.01125,0,.020),'cloth','cloth-top')
    rod(a,'folded-edge',(-.141, -.09375,.014),(-.141,.09375,.014),.014,'cloth','cloth-fold',sides=8)
    for sign in (-1,1):a.box(f'woven-border-{sign}',(.277,.011,.003),(.012,sign*.078,.0265),'cloth-blue','cloth-border')
    return a


for lev in (3,4):
    for col in ('black','silver'):basic_rack(f'iron-{lev}-{col}',lev,'iron-'+col)
for lev in (2,3):basic_rack('wood-'+str(lev),lev,'wood')
step_rack();plastic_basket_rack();wood_table();iron_table();wood_stool(True);wood_stool(False);plastic_stool()
washstation(True);washstation(False)
for id,mat,name in [('crate-blue','plastic-blue','蓝色周转箱'),('crate-gray','plastic-grey','灰色周转箱'),('crate-red','plastic-red','砖红周转箱')]:crate(id,mat,name)
bucket(False);bucket(True);foam_box(False);foam_box(True);seed_tray();aquarium(False);aquarium(True);ceramic_fish_bowl()
trowel();pruning_shears();trigger_sprayer();watering_can();hose_coil();drying_rack();clip_hanger();towel()
for a in b.assets:recenter(a)
assert len(b.assets)==34,len(b.assets)
b.finish()
