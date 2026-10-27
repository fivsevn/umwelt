"""Eight real species, individually modeled miniature charms with matching pigment.

Each miniature rests in the upper-right whitespace with a loose doubled cord.
The approved shell shape and original navigation artwork remain separate assets.
"""
import math
import bpy
import bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree


SPECIES={
 'leopard':dict(scientific='Eublepharis macularius',head=(.191,.147,.282,.087),body=(.139,.222,.080),neck=.080,leg=.025,foot='claw',eye='slit',size=.95,tail=[(0,-.21,.071),(.040,-.34,.081),(.115,-.47,.067),(.125,-.59,.040),(.055,-.70,.006)]),
 'tokay':dict(scientific='Gekko gecko',head=(.210,.182,.300,.095),body=(.158,.245,.086),neck=.076,leg=.034,foot='broad',eye='slit',size=1,tail=[(0,-.24,.063),(.040,-.40,.055),(.155,-.55,.042),(.225,-.72,.022),(.180,-.83,.005)]),
 'day':dict(scientific='Phelsuma grandis',head=(.148,.155,.292,.078),body=(.111,.253,.070),neck=.065,leg=.022,foot='day',eye='round',size=.97,tail=[(0,-.26,.049),(-.020,-.43,.039),(-.095,-.60,.027),(-.205,-.73,.014),(-.270,-.78,.011),(-.350,-.725,.006),(-.370,-.635,.002)]),
 'crested':dict(scientific='Correlophus ciliatus',head=(.173,.213,.303,.092),body=(.141,.232,.078),neck=.077,leg=.028,foot='broad',eye='slit',size=1,tail=[(0,-.23,.048),(.040,-.41,.040),(.150,-.59,.030),(.210,-.71,.020),(.155,-.77,.012),(.075,-.735,.004)]),
 'fat-tail':dict(scientific='Hemitheconyx caudicinctus',head=(.184,.147,.268,.085),body=(.163,.223,.092),neck=.098,leg=.030,foot='claw',eye='slit',size=.96,tail=[(0,-.23,.080),(-.025,-.36,.092),(-.060,-.48,.078),(-.100,-.60,.045),(-.075,-.70,.007)]),
 'mossy':dict(scientific='Mniarogekko chahoua',head=(.196,.148,.286,.082),body=(.171,.243,.085),neck=.123,leg=.033,foot='web',eye='slit',size=.99,tail=[(0,-.23,.069),(.045,-.40,.058),(.170,-.56,.044),(.215,-.71,.033),(.135,-.79,.023),(.035,-.745,.006)]),
 'electric':dict(scientific='Lygodactylus williamsi',head=(.130,.132,.269,.065),body=(.095,.216,.060),neck=.056,leg=.017,foot='small',eye='round',size=.83,tail=[(0,-.22,.034),(.030,-.40,.029),(.105,-.55,.020),(.205,-.70,.011),(.260,-.755,.003)]),
 'stone':dict(scientific='Tarentola mauritanica',head=(.211,.157,.278,.060),body=(.184,.232,.056),neck=.119,leg=.032,foot='leaf',eye='slit',size=.96,tail=[(0,-.23,.068),(-.020,-.40,.056),(-.075,-.56,.043),(-.170,-.71,.024),(-.205,-.82,.004)]),
}

# Each physical unit has a different way of lying beside its matching shell.
# Angles are deliberately separated, not a shared pose with tiny offsets.
# The two curve handles describe the relaxed cord on the portrait tabletop;
# landscape reflows those handles into its own safe upper-right region.
POSES={
 'leopard':dict(degrees=-21,center=(1.95,3.77),cord=((2.75,3.21),(2.72,4.24))),
 'tokay':dict(degrees=38,center=(2.04,3.76),cord=((1.91,3.57),(1.40,4.37))),
 'day':dict(degrees=-67,center=(1.96,3.72),cord=((2.40,3.20),(2.78,3.86))),
 'crested':dict(degrees=76,center=(1.98,3.80),cord=((1.15,3.34),(1.18,4.05))),
 'fat-tail':dict(degrees=-3,center=(2.08,3.75),cord=((2.70,3.42),(2.58,4.42))),
 'mossy':dict(degrees=132,center=(1.92,3.80),cord=((1.40,3.14),(1.35,3.70))),
 'electric':dict(degrees=-128,center=(2.03,3.82),cord=((2.58,3.15),(2.70,3.70))),
 'stone':dict(degrees=57,center=(1.96,3.74),cord=((1.25,3.28),(1.12,4.23))),
}

def build(wide,mats,front_height,theme):
    """Build one species with diagnostic proportions, five digits and an intact tail."""
    config=SPECIES[theme];created=[];parts=[]
    collection=bpy.data.collections.new("Gecko miniature "+theme);bpy.context.scene.collection.children.link(collection)
    def sphere(name,center,radii,mat,body=False):
        vertices=[];faces=[];segments=16;rings=10
        for j in range(rings+1):
            phi=math.pi*j/rings
            for i in range(segments):
                theta=2*math.pi*i/segments
                vertices.append((center[0]+radii[0]*math.sin(phi)*math.cos(theta),
                                 center[1]+radii[1]*math.sin(phi)*math.sin(theta),
                                 center[2]+radii[2]*math.cos(phi)))
        for j in range(rings):
            for i in range(segments):
                k=j*segments+i;n=j*segments+(i+1)%segments
                faces.append((k,n,n+segments,k+segments))
        mesh=bpy.data.meshes.new('Charm '+name);mesh.from_pydata(vertices,[],faces);mesh.update()
        bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(mesh);bm.free()
        obj=bpy.data.objects.new('Charm '+name,mesh);collection.objects.link(obj);obj['geckoTheme']=theme;mesh.materials.append(mat)
        for face in mesh.polygons:face.use_smooth=True
        created.append(obj)
        if body:parts.append(obj)
        return obj
    def tube(name,points,radii,mat,body=False,resolution=8):
        verts=[];faces=[]
        for i,point in enumerate(points):
            before=Vector(points[max(0,i-1)]);after=Vector(points[min(len(points)-1,i+1)])
            tangent=(after-before).normalized();side=tangent.cross(Vector((0,0,1))).normalized()
            up=side.cross(tangent).normalized()
            for j in range(resolution):
                a=2*math.pi*j/resolution;v=Vector(point)+radii[i]*(side*math.cos(a)+up*math.sin(a))
                verts.append(v)
        for i in range(len(points)-1):
            for j in range(resolution):
                k=i*resolution+j;n=i*resolution+(j+1)%resolution;faces.append((k,n,n+resolution,k+resolution))
        faces.extend([tuple(range(resolution-1,-1,-1)),tuple((len(points)-1)*resolution+j for j in range(resolution))])
        mesh=bpy.data.meshes.new('Charm '+name);mesh.from_pydata(verts,[],faces);mesh.update()
        bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(mesh);bm.free()
        obj=bpy.data.objects.new('Charm '+name,mesh);collection.objects.link(obj);obj['geckoTheme']=theme;mesh.materials.append(mat)
        for face in mesh.polygons:face.use_smooth=True
        created.append(obj)
        if body:parts.append(obj)
        return obj

    rx,ry,hcy,hz=config['head'];bx,by,bz=config['body']
    broad=.88 if theme in ['fat-tail','mossy','stone'] else (.55 if theme in ['crested','day'] else .70)
    outline=[(-rx*.48,hcy-ry),(-rx*.89,hcy-ry*.55),(-rx,hcy+ry*.10),(-rx*broad,hcy+ry*.72),(0,hcy+ry),
             (rx*broad,hcy+ry*.72),(rx,hcy+ry*.10),(rx*.89,hcy-ry*.55),(rx*.48,hcy-ry)]
    verts=[];faces=[];n=len(outline)
    for inset,zhead in [(1,-.018),(1,.025),(.83,hz*.73),(.40,hz),(.03,hz*1.06)]:
        verts.extend([(x*inset,hcy+(y-hcy)*inset,zhead) for x,y in outline])
    for j in range(4):
        for i in range(n):faces.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    faces.extend([tuple(range(n-1,-1,-1)),tuple(4*n+i for i in range(n))])
    mesh=bpy.data.meshes.new('Species skull '+theme);mesh.from_pydata(verts,[],faces);mesh.update()
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(mesh);bm.free()
    head=bpy.data.objects.new('Charm '+theme+' skull',mesh);collection.objects.link(head);head['geckoTheme']=theme
    mesh.materials.append(mats['charm-body']);parts.append(head);created.append(head)
    sphere('neck',(0,.135,0),(config['neck'],.127,bz*.81),mats['charm-body'],True)
    sphere('torso',(0,-.042,0),(bx,by,bz),mats['charm-body'],True)
    tail=config['tail'];tube('intact tapered tail',[(x,y,-.008) for x,y,r in tail],[r for x,y,r in tail],mats['charm-body'],True,10)
    for side in [-1,1]:
        for upper in [True,False]:
            sy=.070 if upper else -.180
            reach=.236 if theme in ['day','electric'] else (.280 if theme in ['stone','mossy'] else .257)
            py=.105 if upper else -.315
            if theme=='electric':py=.095 if upper else -.277
            elbow=.002 if upper else -.207
            tube('bent limb',[(side*bx*.62,sy,-.012),(side*reach*.80,elbow,-.018),(side*reach,py,-.014)],
                 [config['leg']*1.2,config['leg'],config['leg']*.8],mats['charm-body'],True)
            sphere('palm',(side*reach,py,-.010),(.030,.030,.025),mats['charm-body'],True)
            for digit in range(5):
                a=math.radians(-70+digit*33);length=[.066,.092,.112,.099,.074][digit]
                if config['foot']=='claw':length*=.90
                if config['foot']=='small':length*=.87
                if config['foot']=='day' and digit==0:length*=.48
                dx=math.cos(a)*length;dy=math.sin(a)*length*(1 if upper else -1)
                start=(side*reach,py,-.014);end=(side*(reach+dx),py+dy,-.014)
                r=.0075 if config['foot']=='claw' else (.008 if config['foot']=='small' else .009)
                tube('digit '+str(digit+1),[start,end],[r*1.4,r],mats['charm-body'],True)
                if config['foot']!='claw':
                    pr=.016 if config['foot']=='small' else (.025 if config['foot'] in ['leaf','broad','web'] else .022)
                    sphere('expanded pad '+str(digit+1),end,(pr,pr*.72,.012),mats['charm-body'],True)
                else:
                    tip=(end[0]+side*.018,end[1]+dy*.10,-.012)
                    tube('pointed claw '+str(digit+1),[end,tip],[.006,.001],mats['charm-claw'])
    # Union only the accessory molding. A modest decimation keeps a low-poly
    # contour while soft normals make it read as molded flexible plastic.
    bpy.ops.object.select_all(action='DESELECT')
    for obj in parts:obj.select_set(True)
    bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();animal=parts[0]
    animal.name='Charm '+theme+' species molding';animal['scientificName']=config['scientific'];animal['digitsPerFoot']=5;animal['footType']=config['foot'];animal['geckoTheme']=theme
    remesh=animal.modifiers.new('Charm one piece molded union','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.0055
    bpy.ops.object.modifier_apply(modifier=remesh.name)
    smooth=animal.modifiers.new('Charm softened molding','SMOOTH');smooth.factor=.50;smooth.iterations=2
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    reduce=animal.modifiers.new('Charm low-poly silhouette','DECIMATE');reduce.ratio=.17
    bpy.ops.object.modifier_apply(modifier=reduce.name)
    for face in animal.data.polygons:face.use_smooth=True
    # Round daytime pupils and golden nocturnal slit eyes are separate inlays.
    ex=rx*.72;ey=hcy+ry*.12
    skin=BVHTree.FromObject(animal,bpy.context.evaluated_depsgraph_get())
    for side in [-1,1]:
        hit,_,_,_=skin.ray_cast(Vector((side*ex,ey,1)),Vector((0,0,-1)))
        ez=hit.z+.012
        sphere('iris',(side*ex,ey,ez),(.032,.038,.019),mats['charm-iris'])
        pupil=(.021,.024,.007) if config['eye']=='round' else (.012,.028,.007)
        sphere(config['eye']+' pupil',(side*ex,ey+.001,ez+.018),pupil,mats['charm-ink'])
        sphere('glint',(side*ex-.006,ey+.011,ez+.025),(.004,.006,.003),mats['charm-eye'])
        if config['foot']=='claw':
            arc=[(side*ex+.034*math.cos(a),ey+.039*math.sin(a),ez+.006) for a in [i*math.pi/12 for i in range(13)]]
            tube('movable eyelid rim',arc,[.007]*len(arc),mats['charm-edge'])
    def spike(name,point,width,height,mat):
        x,y,z=point;tip=x+(1 if x>0 else -1)*height*.60 if 'eyelash' in name else x
        v=[(x-width,y-width*.65,z),(x+width,y-width*.65,z),(x,y+width,z),(tip,y,z+height)]
        m=bpy.data.meshes.new(name);m.from_pydata(v,[],[(0,1,3),(1,2,3),(2,0,3),(0,2,1)]);m.materials.append(mat)
        o=bpy.data.objects.new('Charm '+theme+' '+name,m);collection.objects.link(o);o['geckoTheme']=theme
    if theme=='crested':
        for side in [-1,1]:
            for i in range(9):
                y=.355-i*.034;x=side*(rx*.88 if y>.15 else .125)
                hit,_,_,_=skin.ray_cast(Vector((x*.88,y,1)),Vector((0,0,-1)))
                zz=hit.z if hit is not None else .048
                spike('eyelash dorsal crest',(x,y,zz),.018,.045 if i<5 else .025,mats['charm-crest'])
            for i in range(5):spike('paired back crest',(side*(.13-i*.008),.045-i*.038,.050),.012,.018,mats['charm-crest'])
    if theme=='mossy':
        for side in [-1,1]:tube('cheek fold',[(side*.17,.31,.030),(side*.18,.24,.027),(side*.12,.16,.030)],[.009,.010,.007],mats['charm-edge'])
    if theme in ['stone','leopard','tokay']:
        size=.012 if theme=='stone' else (.006 if theme=='tokay' else .007)
        columns=10 if theme=='stone' else 4
        for col in range(columns):
            x=(col-(columns-1)/2)*(.027 if theme=='stone' else .055)
            for row in range(7):
                y=.09-row*.043+(col%2)*.014;q=(x/bx)**2+((y+.042)/by)**2
                if q>.86:continue
                zz=bz*math.sqrt(1-q)
                sphere('ordered dorsal tubercle',(x,y,zz),(size,size,size*.68),mats['charm-body'])
        if theme=='stone':
            for i,(x,y,r) in enumerate(tail[:-1]):
                for side in [-1,0,1]:spike('tail scute',(x+side*r*.6,y,r*.6),.012,.014,mats['charm-edge'])
    hy=hcy+ry;eyelet=hy+.036;ring_y=hy+.110
    for name,y,rxr,ryr,r,mat in [('molded eyelet',eyelet,.029,.035,.010,mats['charm-edge']),('split ring',ring_y,.038,.046,.008,mats['charm-ring'])]:
        points=[(rxr*math.cos(i*math.pi/16),y+ryr*math.sin(i*math.pi/16),.012) for i in range(33)]
        tube(name,points,[r]*len(points),mat)
    pose=POSES[theme];angle=math.radians(pose['degrees'])
    cos,sin=math.cos(angle),math.sin(angle);z=-.57
    scale=(.77 if wide else .90)*config['size']
    # Fit the complete specimen, including toes and eyelet, into whitespace.
    # Never shrink/remodel a toe or a species tail just to achieve a new pose.
    safe=(3.10,4.17,1.50,2.75) if wide else (1.05,2.70,3.18,4.50)
    local=[v.co for obj in collection.objects for v in obj.data.vertices]
    rotated=[(v.x*cos-v.y*sin,v.x*sin+v.y*cos) for v in local]
    lo=[min(v[i] for v in rotated) for i in range(2)];hi=[max(v[i] for v in rotated) for i in range(2)]
    scale=min(scale,.98*(safe[1]-safe[0])/(hi[0]-lo[0]),.98*(safe[3]-safe[2])/(hi[1]-lo[1]))
    cx,cy=pose['center']
    if wide:cx,cy=3.62+(cx-1.98)*.6,2.12+(cy-3.76)*.7
    cx=max(safe[0]-scale*lo[0],min(cx,safe[1]-scale*hi[0]))
    cy=max(safe[2]-scale*lo[1],min(cy,safe[3]-scale*hi[1]))
    def world(x,y,zz):return (cx+scale*(x*cos-y*sin),cy+scale*(x*sin+y*cos),z+scale*zz)
    for obj in list(collection.objects):obj.location=(cx,cy,z);obj.rotation_euler.z=angle;obj.scale=(scale,)*3
    collection['poseDegrees']=pose['degrees'];collection['poseScale']=scale
    ring=world(0,ring_y+.043,.012);ax,ay=(2.30,1.72) if wide else (1.35,2.75);az=front_height(ax,ay)+.018
    cover=BVHTree.FromObject(bpy.data.objects['One piece painted front cover'],bpy.context.evaluated_depsgraph_get())
    def curve(name,controls,mat):
        points=[]
        for i in range(33):
            t=i/32;point=(1-t)**3*Vector(controls[0])+3*(1-t)**2*t*Vector(controls[1])+3*(1-t)*t*t*Vector(controls[2])+t**3*Vector(controls[3])
            if name=='loose shoulder cord':
                hit,_,_,_=cover.ray_cast(Vector((point.x,point.y,3)),Vector((0,0,-1)))
                if hit is not None:point.z=max(point.z,hit.z+.022)
            points.append(point)
        tube(name,points,[.009]*len(points),mat)
    def handle(point,side):
        x,y=point
        if wide:x,y=3.05+(x-1.05)/1.75*1.20,1.45+(y-3.18)/1.32*1.35
        return (x,y+side*.014,-.54)
    for side in [-1,1]:
        if wide:
            out=(2.91,2.28,-.54)
            c1=[(ax+side*.025,ay,az),(ax+.12,ay+.20,.62),(2.68,2.28,-.42),out]
        else:
            out=(1.91,3.25,-.54)
            c1=[(ax+side*.025,ay,az),(ax+.13,ay+.19,.67),(1.76,3.17,-.42),out]
        c2=[out,handle(pose['cord'][0],side),handle(pose['cord'][1],side),(ring[0]+side*.012,ring[1],ring[2])]
        if wide and theme=='stone':
            c2[1]=(out[0]+.23,out[1]+.018+side*.010,-.54)
        # Match the two segment tangents so an individually rerouted loop
        # cannot acquire a sharp kink at the shoulder/tabletop junction.
        tangent=Vector(c2[1])-Vector(out);tangent.z=0
        if tangent.length>.001:
            approach=Vector(out)-tangent.normalized()*.14;approach.z=-.42
            c1[2]=tuple(approach)
        curve('loose shoulder cord',c1,mats['charm-cord']);curve('relaxed tabletop cord',c2,mats['charm-cord'])
    sphere('cord knot',(ring[0],ring[1],ring[2]),(.022,.018,.019),mats['charm-cord'])
    for obj in collection.objects:obj['geckoTheme']=theme
    collection['scientificName']=config['scientific'];collection['theme']=theme
    return collection
