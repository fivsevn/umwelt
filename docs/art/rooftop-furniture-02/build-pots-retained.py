"""Independent complete Blender models for the retained 20 + 9 pot catalogue.

Only original reference records and broad proportions are consulted. Runtime
meshes, old profile arrays and old painting functions are never imported.
Every hollow body has an interior floor and a real, open drainage channel.
"""
import sys,json,math,argparse
from pathlib import Path
ROOT=Path(__file__).resolve().parent
if str(ROOT) not in sys.path:sys.path.insert(0,str(ROOT))
from assetlib import Builder,verify_saved

# Each entry supplies a fresh physical silhouette, not a palette variant.
DESIGNS={
 'tokoname':dict(radius=.220,height=.105,foot=.018,shape='oval',aspect=.69,sides=24,wall=.012,base=.69,belly=.86,mouth=1,lip='out',feet=4),
 'shigaraki':dict(radius=.186,height=.197,foot=.011,shape='round',sides=20,wall=.016,base=.45,belly=.93,mouth=1,lip='thick'),
 'bizen':dict(radius=.183,height=.238,foot=.012,shape='round',sides=20,wall=.013,base=.53,belly=1,mouth=.78,lip='low'),
 'mashiko':dict(radius=.181,height=.179,foot=.014,shape='fluted',sides=24,wall=.013,base=.48,belly=.77,mouth=1,lip='flare'),
 'kasama':dict(radius=.166,height=.201,foot=.009,shape='round',sides=20,wall=.011,base=.84,belly=.93,mouth=.97,lip='flat'),
 'mino':dict(radius=.177,height=.135,foot=.025,shape='square',sides=8,wall=.014,base=.71,belly=.90,mouth=1,lip='square',feet=4),
 'seto':dict(radius=.174,height=.128,foot=.018,shape='round',sides=24,wall=.009,base=.40,belly=.80,mouth=1,lip='thin'),
 'kutani':dict(radius=.218,height=.086,foot=.013,shape='mokko',aspect=.78,sides=32,wall=.009,base=.74,belly=.90,mouth=1,lip='thin',feet=4),
 'arita':dict(radius=.188,height=.140,foot=.019,shape='scallop',lobes=6,scallop=.064,sides=36,wall=.009,base=.41,belly=.78,mouth=1,lip='thin'),
 'imari':dict(radius=.181,height=.180,foot=.041,shape='round',sides=24,wall=.011,base=.49,belly=.89,mouth=1,lip='thin'),
 'hasami':dict(radius=.146,height=.158,foot=.006,shape='round',sides=20,wall=.009,base=.62,belly=.83,mouth=1,lip='flat'),
 'kyoto':dict(radius=.189,height=.184,foot=.070,shape='scallop',lobes=12,scallop=.047,sides=48,wall=.009,base=.34,belly=.82,mouth=1,lip='thin'),
 'hagi':dict(radius=.180,height=.172,foot=.054,shape='scallop',lobes=8,scallop=.078,sides=40,wall=.013,base=.45,belly=.79,mouth=1,lip='soft'),
 'karatsu':dict(radius=.183,height=.145,foot=.023,shape='round',sides=20,wall=.013,base=.42,belly=.85,mouth=1,lip='soft'),
 'tobe':dict(radius=.180,height=.174,foot=.021,shape='round',sides=24,wall=.015,base=.42,belly=.85,mouth=.98,lip='rolled'),
 'koishiwara':dict(radius=.184,height=.165,foot=.014,shape='round',sides=24,wall=.012,base=.48,belly=.75,mouth=1,lip='out'),
 'ontayaki':dict(radius=.197,height=.204,foot=.014,shape='faceted',sides=10,wall=.014,base=.60,belly=1,mouth=.84,lip='flat'),
 'iga':dict(radius=.192,height=.181,foot=.013,shape='irregular',sides=24,wall=.016,base=.51,belly=.93,mouth=1,lip='soft'),
 'echizen':dict(radius=.200,height=.272,foot=.013,shape='round',sides=20,wall=.015,base=.57,belly=1,mouth=.70,lip='neck'),
 'tsuboya':dict(radius=.199,height=.201,foot=.020,shape='round',sides=24,wall=.016,base=.46,belly=.88,mouth=1,lip='rolled'),
 'terra':dict(radius=.163,height=.207,foot=.007,shape='round',sides=16,wall=.012,base=.63,belly=.85,mouth=1,lip='out'),
 'plastic':dict(radius=.105,height=.173,foot=.008,shape='ribbed',sides=24,wall=.005,base=.68,belly=.88,mouth=1,lip='plastic'),
 'white':dict(radius=.158,height=.218,foot=.009,shape='round',sides=20,wall=.006,base=.73,belly=.87,mouth=1,lip='plastic'),
 'shallow':dict(radius=.185,height=.078,foot=.007,shape='round',sides=24,wall=.014,base=.63,belly=.85,mouth=1,lip='thick'),
 'growbag':dict(radius=.207,height=.381,foot=0,shape='bag',sides=24,wall=.008,base=.83,belly=1,mouth=.96,lip='fabric'),
 'deep':dict(radius=.249,height=.447,foot=.012,shape='round',sides=24,wall=.021,base=.54,belly=.79,mouth=1,lip='thick'),
 'basket':dict(radius=.186,height=.238,foot=.010,shape='basket',sides=24,wall=.009,base=.53,belly=.84,mouth=1,lip='plastic'),
 'foam':dict(width=.610,depth=.409,height=.251,wall=.030,floor=.028),
 'trough':dict(width=.762,depth=.284,height=.237,wall=.015,floor=.018),
}

def outward(vertices,faces):
    volume=0
    for face in faces:
        a=vertices[face[0]]
        for i in range(1,len(face)-1):
            b=vertices[face[i]];c=vertices[face[i+1]]
            volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6
    return [tuple(reversed(face)) for face in faces] if volume<0 else faces

def ring_point(theta,r,z,d,body_fraction=1):
    shape=d['shape'];aspect=d.get('aspect',1)
    factor=1;dx=dy=dz=0
    if shape=='square':factor=1/max(abs(math.cos(theta)),abs(math.sin(theta)))
    elif shape=='mokko':factor=1+.115*math.cos(theta*4)
    elif shape=='scallop':
        # Lobes increase towards the rim; the interior echoes the same actual form.
        amplitude=d['scallop']*(.16+.84*body_fraction**2)
        factor=1+amplitude*math.cos(d['lobes']*theta)
        dz=.0015*body_fraction**4*math.cos(d['lobes']*theta)
    elif shape=='irregular':
        factor=1+.034*math.cos(3*theta+.7)+.023*math.sin(5*theta-.4)
        dx=.010*body_fraction;dy=-.006*body_fraction
        dz=.0035*body_fraction**2*math.cos(2*theta-.8)
    elif shape=='fluted':factor=1+.029*math.cos(theta*12)*body_fraction
    elif shape=='ribbed':factor=1+.030*math.cos(theta*12)
    elif shape=='bag':factor=1+.022*math.cos(theta*7+.4)+.014*math.sin(theta*3)
    elif shape=='basket':factor=1+.013*math.cos(theta*12)
    return (r*factor*math.cos(theta)+dx,r*factor*math.sin(theta)*aspect+dy,z+dz)

def closed_revolution(asset,name,profile,d,mat,role='pot-shell'):
    # The profile closes cyclically without duplicated seam vertices, so the whole
    # shell is a single closed solid with an intentionally open central bore.
    sides=d['sides'];vertices=[]
    foot=d.get('foot',0);height=d['height']
    for radius,z in profile:
        t=max(0,min(1,(z-foot)/max(.01,height-foot)))
        # Drain channels and foot rings use circular holes even in shaped pots.
        local=d if radius>.025 else {**d,'shape':'round','aspect':1}
        vertices.extend(ring_point(i*math.tau/sides,radius,z,local,t) for i in range(sides))
    faces=[]
    for j in range(len(profile)):
        jj=(j+1)%len(profile)
        for i in range(sides):faces.append((j*sides+i,j*sides+(i+1)%sides,jj*sides+(i+1)%sides,jj*sides+i))
    return asset.mesh(name,vertices,outward(vertices,faces),mat,role)

def body_profile(d,id):
    radius=d['radius'];height=d['height'];foot=d.get('foot',0);wall=d['wall']
    base=radius*d['base'];belly=radius*d['belly'];mouth=radius*d['mouth']
    z0=foot+.004 if foot>0 else 0;floor=z0+max(.009,wall*.8);span=height-z0
    if id in ['bizen','echizen','ontayaki']:
        outer=[(base,z0),(base*1.12,z0+span*.11),(belly,z0+span*.48),(belly*.97,z0+span*.71),(mouth,height-.012)]
    elif id in ['kasama','hasami','terra','plastic','white','deep','growbag','koishiwara','mashiko']:
        outer=[(base,z0),(base+wall*.35,z0+span*.07),(belly,z0+span*.57),(mouth,height-.012)]
    else:
        outer=[(base,z0),(base+(belly-base)*.28,z0+span*.12),(belly,z0+span*.57),(mouth,height-.012)]
    lip=d['lip']
    if lip=='rolled':
        outer[-1]=(mouth-wall*.18,height-wall*.85)
        rim=[(mouth+wall*.55,height-wall*.62),(mouth+wall*.72,height-wall*.20),
             (mouth+wall*.45,height+wall*.11),(mouth-wall*.1,height+wall*.18),(mouth-wall*.72,height-wall*.14)]
    elif lip in ['out','flare','thick']:
        rim=[(mouth+wall*.45,height-.010),(mouth+wall*.45,height),(mouth-wall*.68,height)]
    elif lip=='neck':rim=[(mouth,height-.002),(mouth+.003,height+.006),(mouth-wall,height+.006)]
    elif lip=='plastic':rim=[(mouth+.008,height-.011),(mouth+.008,height),(mouth-wall,height)]
    elif lip=='fabric':rim=[(mouth+.004,height-.010),(mouth+.004,height),(mouth-wall,height)]
    else:rim=[(mouth,height),(mouth-wall,height)]
    inner=[]
    for r,z in reversed(outer[1:]):inner.append((max(.022,r-wall),max(floor,z-.002)))
    # The actual floor surrounds the bore; the final underside returns to the body.
    hole=.012 if radius>.19 else .010
    profile=outer+rim+inner+[(max(.030,base-wall),floor),(hole,floor),(hole,z0)]
    return profile,floor,hole,mouth,base

def foot_ring(a,d,radius,base_color):
    foot=d.get('foot',0)
    if foot<=0:return
    r=radius*.73;wall=min(.014,r*.22)
    local={**d,'shape':'round','aspect':1,'sides':16}
    closed_revolution(a,'complete-open-foot-ring',[(r,0),(r,foot+.004),(r-wall,foot+.004),(r-wall,0)],local,base_color,'foot ring')

def four_feet(a,d,base,base_color):
    foot=d['foot'];aspect=d.get('aspect',1)
    span=base*.65
    for i,(x,y) in enumerate([(-span,-span*aspect),(span,-span*aspect),(span,span*aspect),(-span,span*aspect)]):
        a.box('short-solid-foot-'+str(i+1),(.035,.029,foot+.004),(x,y,(foot+.004)/2),base_color,'foot',bevel=.002)

def round_pot(b,record):
    id=record['id'];d=DESIGNS[id];category='收藏' if record['kind']=='ceramic' else '栽培与盛放'
    a=b.asset('vessel-'+id,record['name'],category,placement='both',originalVesselId=id,originalRuntimeId='vessel-'+id,
        ja=record.get('ja',''),note=record['note'],sources=record['sources'],pattern=record.get('pattern','plain'),
        originalColor=record['color'],originalRim=record['rim'],originalInk=record['ink'],shape=record['shape'],
        originalKind=record['kind'],shapeLabel=record.get('shapeLabel',''),retainedOriginalRecord=True,antique=False,
        sourceGeometryReused=False,empty=True,plantContainer=True)
    profile,floor,hole,mouth,base=body_profile(d,id)
    closed_revolution(a,'complete-inner-outer-shell-with-drainage',profile,d,record['color'])
    if d.get('feet'):four_feet(a,d,base,record['color'])
    else:foot_ring(a,d,base,record['color'])
    if id=='growbag':
        for side in [-1,1]:
            path=[(-.057,side*.190,d['height']-.081),(-.057,side*.199,d['height']+.060),
                  (.057,side*.199,d['height']+.060),(.057,side*.190,d['height']-.081)]
            a.tube('complete-fabric-loop-'+str(side),path,.008,record['rim'],'cloth handle',sides=8)
        a.beam('visible-vertical-bag-seam',(0,-.205,.031),(0,-.205,.350),.007,.003,record['rim'],'seam')
    if id=='basket':
        for i in range(3):
            theta=i*math.tau/3+.35
            a.tube('three-way-hanging-cord-'+str(i+1),[(math.cos(theta)*mouth*.93,math.sin(theta)*mouth*.93,d['height']-.011),
                    (math.cos(theta)*.026,math.sin(theta)*.026,d['height']+.328)],.0045,record['ink'],'hanging cord',sides=8)
        a.tube('open-hanging-eye',[(.029*math.cos(i*math.tau/12),0,d['height']+.35+.029*math.sin(i*math.tau/12)) for i in range(12)],.004,record['ink'],'hanging eye',8,True)
    if id=='white':
        for i in range(6):
            theta=i*math.tau/6
            a.beam('raised-base-fin-'+str(i+1),(base*.88*math.cos(theta),base*.88*math.sin(theta),.008),
                   (base*.93*math.cos(theta),base*.93*math.sin(theta),.046),.006,.005,record['color'],'base foot')
    aspect=d.get('aspect',1)
    shape='rectangle' if d['shape']=='square' else 'ellipse' if aspect!=1 else 'circle'
    surface_radius=base-d['wall']-.006
    a.surface('inside','盆内底',floor,surface_radius*2,surface_radius*2*aspect,shape=shape,container=True,
              rimHeight=d['height'],headroom=d['height']-floor,openingWidth=2*(mouth-d['wall']),openingDepth=2*(mouth-d['wall'])*aspect,
              holes=[dict(shape='circle',center=[0,0],radius=hole)])
    return a

def box_pot(b,record):
    id=record['id'];d=DESIGNS[id];w,depth,h,wall,floor=[d[k] for k in ['width','depth','height','wall','floor']]
    a=b.asset('vessel-'+id,record['name'],'栽培与盛放',placement='both',originalVesselId=id,originalRuntimeId='vessel-'+id,
        note=record['note'],sources=record['sources'],pattern='plain',originalColor=record['color'],originalRim=record['rim'],originalInk=record['ink'],
        shape=record['shape'],originalKind=record['kind'],retainedOriginalRecord=True,antique=False,sourceGeometryReused=False,
        empty=True,plantContainer=True)
    # Solid panels meet at their corners, with two actual unfilled square drainage holes.
    a.box('back-complete-wall',(w,wall,h-floor),(0,(depth-wall)/2,(h+floor)/2),record['color'],'outer wall',bevel=.002 if id=='trough' else 0)
    a.box('front-complete-wall',(w,wall,h-floor),(0,-(depth-wall)/2,(h+floor)/2),record['color'],'outer wall',bevel=.002 if id=='trough' else 0)
    a.box('left-complete-wall',(wall,depth-2*wall,h-floor),(-(w-wall)/2,0,(h+floor)/2),record['color'],'outer wall')
    a.box('right-complete-wall',(wall,depth-2*wall,h-floor),((w-wall)/2,0,(h+floor)/2),record['color'],'outer wall')
    holes=[-w*.21,w*.21];half=.012 if id=='foam' else .010
    xs=[-w/2,holes[0]-half,holes[0]+half,holes[1]-half,holes[1]+half,w/2];ys=[-depth/2,-half,half,depth/2]
    for i in range(len(xs)-1):
        for j in range(len(ys)-1):
            if i in [1,3] and j==1:continue
            a.box('drained-floor-panel-'+str(i)+'-'+str(j),(xs[i+1]-xs[i],ys[j+1]-ys[j],floor),((xs[i]+xs[i+1])/2,(ys[j]+ys[j+1])/2,floor/2),record['color'],'interior floor')
    rim_height=.017 if id=='foam' else .013
    a.box('back-top-rim',(w+.008,wall+.009,rim_height),(0,(depth-wall)/2,h-rim_height/2),record['rim'],'rim')
    a.box('front-top-rim',(w+.008,wall+.009,rim_height),(0,-(depth-wall)/2,h-rim_height/2),record['rim'],'rim')
    for side in [-1,1]:
        a.box('end-top-rim-'+str(side),(wall+.009,depth-2*wall,rim_height),(side*(w-wall)/2,0,h-rim_height/2),record['rim'],'rim')
    if id=='foam':
        for side in [-1,1]:
            a.box('thick-end-grip-'+str(side),(.018,.109,.039),(side*(w/2+.003),0,h-.062),record['color'],'moulded handle',bevel=.003)
    else:
        for side in [-1,1]:
            for i in range(5):a.box('long-wall-stiffening-rib-'+str(side)+'-'+str(i),(.012,.008,h*.58),(-w*.37+i*w*.185,side*(depth/2+.002),h*.40),record['color'],'stiffening rib')
    a.surface('inside','盆内底',floor,w-2*wall,depth-2*wall,shape='rectangle',container=True,rimHeight=h,headroom=h-floor,
        openingWidth=w-2*wall,openingDepth=depth-2*wall,holes=[dict(shape='rectangle',center=[x,0],width=half*2,depth=half*2) for x in holes])
    return a

def main():
    parser=argparse.ArgumentParser();parser.add_argument('mode',choices=['layout','final','verify'],default='layout',nargs='?')
    args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else sys.argv[1:])
    if args.mode=='verify':verify_saved('pots-retained');return
    records=[a for a in json.loads((ROOT/'retained-pot-records.json').read_text()) if not a.get('antique')]
    assert len(records)==29 and {a['id'] for a in records}==set(DESIGNS)
    b=Builder('pots-retained')
    for record in records:
        if record['id'] in ['foam','trough']:box_pot(b,record)
        else:round_pot(b,record)
    b.finish(args.mode)
    guide={id:{k:v for k,v in design.items()} for id,design in DESIGNS.items()}
    (b.path/'shape-guide.json').write_text(json.dumps(guide,ensure_ascii=False,indent=2)+'\n')
    (b.path/'record-preservation.json').write_text(json.dumps({'originalRecords':records,'ids':['vessel-'+a['id'] for a in records],
        'plantsChanged':False,'oldGeometryReused':False,'antiqueMuseumRecordsHandledSeparately':8,
        'categories':{'收藏':20,'栽培与盛放':9},'emptyFoamDistinctFromFilledFoam':True},ensure_ascii=False,indent=2)+'\n')

if __name__=='__main__':main()
