"""Continuous-skin Boaedon capensis anatomy authored in native Blender.

Head shields, labials and body scales use editable UV pigment and microrelief.
Photographs guide morphology; dimensions are artistic estimates. Apply to
unscaled bodies before clothes and portrait staging.
"""
import json
import math
import bpy
import bmesh
import numpy as np
from mathutils import Vector
from snake_model import _mesh, _node_material, _ellipsoid, _tube, _catmull

UP=Vector((0,0,1))
SECTIONS=[(-.130,.012,.015),(-.112,.029,.029),(-.092,.049,.040),
          (-.064,.065,.046),(-.036,.070,.049),(-.008,.068,.050),
          (.020,.053,.046),(.040,.046,.041),(.062,.036,.033),
          (.079,.025,.027),(.092,.018,.020),(.100,.011,.012),
          (.104,.006,.006),(.106,.0008,.0008)]
X_MIN,X_MAX=-.130,.106


def _smooth(a,b,x):
    t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)


def _image(name,array):
    h,w,_=array.shape
    image=bpy.data.images.new(name,width=w,height=h,alpha=True)
    image.colorspace_settings.name='Non-Color'
    image.pixels.foreach_set(np.asarray(array,dtype=np.float32).ravel())
    image.pack()
    image['authored']='Hand-built anatomical UV fields, no projected photograph '
    return image


def _material_from_fields(name,color,relief,body=False):
    mat=_node_material(name,(.12,.066,.035),.38)
    n,l=mat.node_tree.nodes,mat.node_tree.links;p=n.get('Principled BSDF')
    p.inputs['Specular IOR Level'].default_value=.43
    p.inputs['Coat Weight'].default_value=.025
    p.inputs['Coat Roughness'].default_value=.28
    p.inputs['Subsurface Weight'].default_value=.022
    p.inputs['Subsurface Radius'].default_value=(.12,.065,.025)
    tc=n.new('ShaderNodeTexCoord');source=tc.outputs['UV']
    if body:
        scale=n.new('ShaderNodeVectorMath');scale.operation='MULTIPLY'
        scale.inputs[1].default_value=(1/4.2,1,1);l.new(source,scale.inputs[0]);source=scale.outputs[0]
    paint=n.new('ShaderNodeTexImage');paint.image=color;paint.interpolation='Linear';paint.extension='REPEAT' if body else 'EXTEND'
    field=n.new('ShaderNodeTexImage');field.image=relief;field.interpolation='Linear';field.extension=paint.extension
    l.new(source,paint.inputs['Vector']);l.new(source,field.inputs['Vector']);l.new(paint.outputs['Color'],p.inputs['Base Color'])
    sep=n.new('ShaderNodeSeparateColor');l.new(field.outputs['Color'],sep.inputs[0])
    l.new(sep.outputs['Green'],p.inputs['Roughness'])
    bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.70
    bump.inputs['Distance'].default_value=.00046 if body else .00032
    l.new(sep.outputs['Red'],bump.inputs['Height']);l.new(bump.outputs['Normal'],p.inputs['Normal'])
    # Reflectivity comes from the same continuous skin; no individual tiles
    # receive independent porcelain-like highlights or contrasting paint.
    return mat


def _body_fields():
    W,H=6144,768
    u=np.linspace(0,4.2,W,dtype=np.float32)[None,:]
    v=np.linspace(0,1,H,dtype=np.float32)[:,None]
    # About thirteen visible angular cells across the broad side: the final
    # 18-24 px body diameter retains 1.5-2 px scale margins after quantisation.
    rows=26;row=np.floor(v*rows)
    # A half-row stagger follows diagonal imbrication. Minor phase drift and
    # edge waviness break the mechanical brick repetition without random grain.
    longitudinal_step=4.2/290
    phase=u/longitudinal_step+.5*np.mod(row,2)+.028*np.sin(row*1.73+u*7.1)
    fu=phase%1
    fv=(v*rows)%1
    dx=np.abs(fu-.5)/.535;dy=np.abs(fv-.5)/.510
    q=(dx**1.38+dy**1.38)**(1/1.38)
    edge=_smooth(.81,.99,q)*(1-_smooth(1.01,1.16,q))
    core=np.maximum(0,1-q)**1.15
    # continuous rubber highlight into a few small scale reflections.
    # A keratin scale rises at its rounded face and overlaps very slightly
    # at its distal edge; the surface remains a single continuous skin.
    relief=.50+.39*core-.22*edge+.035*core*np.sin(fu*math.pi)
    cell=np.sin(np.floor(phase)*9.87+row*13.23)
    # The rectangular UV cell identifies a scale; it must never become a
    # rectangular pigment/roughness patch. Fade both variations inside the
    # actual rounded-lozenge face and reach the continuous base before its
    # perimeter. This retains individual keratin faces without a checkerboard.
    face=1-_smooth(.40,.98,q)
    quiet=1+.105*cell*face+.014*np.sin(u*13+v*41)
    # the refined continuous skin, pose and original cabin illumination.
    dorsal=np.array((.119,.067,.037),dtype=np.float32)
    side=np.array((.135,.088,.059),dtype=np.float32)
    flank=(1-_smooth(.08,.42,np.sin(v*math.tau)))
    color=(dorsal[None,None,:]*(1-flank[:,:,None]*.36)+side[None,None,:]*(flank[:,:,None]*.36))*quiet[:,:,None]
    color=color*(1-.095*edge[:,:,None])
    # A restrained, nonuniform translucent grey keratin face stays readable
    # after native depth of field and 1 px downsampling. Do not white-outline
    # every cell: most face variation is roughness and the microscopic roll.
    pearl=_smooth(.15,.92,cell)*core*.16
    grey=np.array((.170,.139,.106),dtype=np.float32)[None,None,:]
    color=color*(1-pearl[:,:,None])+grey*pearl[:,:,None]
    # Belly pigmentation blends continuously across the flank. Broad ventral
    # shields are fine closely spaced joins on the skin, never detached fans.
    belly=_smooth(.60,.84,-np.sin(v*math.tau))
    band=(u/.0128+.011*np.sin(v*33))%1
    join=np.exp(-((np.minimum(band,1-band))/.043)**2)
    belly_color=np.array((.255,.231,.193),dtype=np.float32)[None,None,:]*(1-.10*join[:,:,None])
    color=color*(1-belly[:,:,None])+belly_color*belly[:,:,None]
    relief=relief*(1-belly)+(.81-.31*join)*belly
    rough=np.broadcast_to(.255+.090*cell*face+.068*edge,(H,W)).copy()
    rough=rough*(1-belly)+(.355+.060*join)*belly
    rgba=np.empty((H,W,4),np.float32);rgba[:,:,:3]=color;rgba[:,:,3]=1
    field=np.empty_like(rgba);field[:,:,0]=relief;field[:,:,1]=rough;field[:,:,2]=.5;field[:,:,3]=1
    return _image('HouseSnake warm sand-brown UV pigment with visible keratin margins',rgba),_image('HouseSnake thin imbricate scale and ventral joins',field)


def _poly_seams(distance,poly):
    """Rasterise fine shield joins into a scalar UV field, never plate meshes."""
    H,W=distance.shape
    # Inputs are physical longitudinal x and radians around the head.
    points=[(((x*.81 if x>0 else x)-X_MIN)/(X_MAX-X_MIN),(a/math.tau)%1) for x,a in poly]
    for (x0,y0),(x1,y1) in zip(points,points[1:]+points[:1]):
        if abs(y1-y0)>.5:continue
        pad=.012
        ix0=max(0,int((min(x0,x1)-pad)*W));ix1=min(W,int((max(x0,x1)+pad)*W)+2)
        iy0=max(0,int((min(y0,y1)-pad)*H));iy1=min(H,int((max(y0,y1)+pad)*H)+2)
        if ix1<=ix0 or iy1<=iy0:continue
        # Approximate geodesic scale of the small head: physical x and angular
        # circumference in metres. The microscopic joins are softly blended.
        xx=(np.arange(ix0,ix1,dtype=np.float32)[None,:]/(W-1)-x0)*(X_MAX-X_MIN)
        yy=(np.arange(iy0,iy1,dtype=np.float32)[:,None]/(H-1)-y0)*.29
        ax=(x1-x0)*(X_MAX-X_MIN);ay=(y1-y0)*.29
        t=np.clip((xx*ax+yy*ay)/max(1e-9,ax*ax+ay*ay),0,1)
        d=np.sqrt((xx-t*ax)**2+(yy-t*ay)**2)
        target=distance[iy0:iy1,ix0:ix1];np.minimum(target,d,out=target)


def _pigment_patch(field,poly,tint):
    H,W=field.shape;points=[(((x*.81 if x>0 else x)-X_MIN)/(X_MAX-X_MIN),(a/math.tau)%1) for x,a in poly]
    if max(p[1] for p in points)-min(p[1] for p in points)>.5:return
    x0=max(0,int(min(p[0] for p in points)*W));x1=min(W,int(max(p[0] for p in points)*W)+2)
    y0=max(0,int(min(p[1] for p in points)*H));y1=min(H,int(max(p[1] for p in points)*H)+2)
    if x1<=x0 or y1<=y0:return
    x=np.arange(x0,x1,dtype=np.float32)[None,:]/(W-1);y=np.arange(y0,y1,dtype=np.float32)[:,None]/(H-1)
    inside=np.zeros((y1-y0,x1-x0),bool)
    for (ax,ay),(bx,by) in zip(points,points[1:]+points[:1]):
        crossing=((ay>y)!=(by>y)) & (x<(bx-ax)*(y-ay)/(by-ay+1e-12)+ax)
        inside^=crossing
    target=field[y0:y1,x0:x1];target[inside]=tint


def _head_fields():
    W,H=2048,1024
    x=np.linspace(X_MIN,X_MAX,W,dtype=np.float32)[None,:]
    a=np.linspace(0,math.tau,H,dtype=np.float32)[:,None]
    seam=np.full((H,W),.1,dtype=np.float32);pigment=np.zeros((H,W),dtype=np.float32);patch_id=0
    def shield(poly):
        nonlocal patch_id
        _poly_seams(seam,poly);_pigment_patch(pigment,poly,.135*math.sin(patch_id*2.17+.4));patch_id+=1
    # Large polygonal head shields follow the photographed crown and cheek.
    # Their borders are hand-authored, irregular and embedded in one skin.
    crown=[([(-.103,0),(-.081,-.59),(-.047,-.58),(-.015,-.28),(-.024,0)]),
           ([(-.103,0),(-.024,0),(-.015,.28),(-.047,.58),(-.081,.59)]),
           ([(-.024,0),(-.015,-.28),(.013,-.29),(.044,-.18),(.048,0),(.044,.18),(.013,.29),(-.015,.28)]),
           ([(.044,0),(.049,-.38),(.069,-.47),(.087,-.31),(.090,0)]),
           ([(.044,0),(.090,0),(.087,.31),(.069,.47),(.049,.38)]),
           ([(.087,0),(.087,-.30),(.106,-.36),(.119,-.15),(.122,0)]),
           ([(.087,0),(.122,0),(.119,.15),(.106,.36),(.087,.30)])]
    for poly in crown:shield([(xx,math.acos(max(-.98,min(.98,yy)))) for xx,yy in poly])
    cheek=[(-.107,-.078),(-.078,-.042),(-.042,-.009),(-.009,.024),(.024,.052),(.052,.078),(.078,.102),(.102,.126)]
    for sign in (-1,1):
        def angle(q):return q%math.tau if sign>0 else (math.pi-q)%math.tau
        for i,(left,right) in enumerate(cheek):
            # Unequal angular boundaries replace the rectangular teeth-like
            upper=.025+.040*math.sin(i*.93)
            poly=[(left,-.39),(left+.002,upper),(right-.003,upper+.028),(right,-.37),(left+(right-left)*.43,-.43)]
            shield([(xx,angle(aa)) for xx,aa in poly])
        # The real posterior cheek is a few staggered angular/rounded
        for poly in [[(-.109,.48),(-.091,.26),(-.066,.28),(-.051,.52),(-.071,.75),(-.091,.72)],
                     [(-.071,.75),(-.051,.52),(-.025,.57),(-.014,.81),(-.037,1.02),(-.060,.99)],
                     [(-.051,.52),(-.050,.26),(-.027,.09),(.002,.21),(.005,.48),(-.025,.57)],
                     [(-.027,.09),(-.022,-.10),(-.056,-.11),(-.078,.01),(-.066,.28),(-.050,.26)]]:
            shield([(xx,angle(aa)) for xx,aa in poly])
        # Smaller oblique temporal scales blend the neck into the larger
        # shields. Photographic sides have this fine staggered transition;
        for row in range(3):
            for column in range(4):
                left=-.127+column*.021+(row%2)*.008
                right=min(-.035,left+.023)
                bottom=.11+row*.285
                if left>=right:continue
                shield([(left,bottom+.06),(left+.006,bottom-.025),
                        (right-.006,bottom+.018),(right,bottom+.19),
                        (right-.010,bottom+.29),(left+.002,bottom+.25)])
        # Photographed side faces have nasal/preocular/supraocular shields
        # ahead of and above the eye, not only the rear temporal/crown field.
        # These were absent in the first continuous skin draft and are visible
        # in the native side macro even when the cap covers the crown.
        for poly in [[(-.029,.19),(-.007,.18),(.012,.29),(.020,.64),(.005,.84),(-.014,.62)],
                     [(-.007,.75),(.018,.62),(.051,.62),(.064,.85),(.045,1.03),(.008,.99)],
                     [(.044,.23),(.071,.22),(.087,.48),(.075,.66),(.058,.57)],
                     [(.081,.11),(.094,.43),(.118,.53),(.123,.25),(.108,.10)],
                     [(.099,-.08),(.121,-.04),(.126,.18),(.122,.34),(.108,.31)]]:
            shield([(xx,angle(aa)) for xx,aa in poly])
    joined=np.exp(-(seam/.00065)**2)
    broad=1+.014*np.sin(x*33+a*5)+.008*np.sin(x*91-a*9)+pigment
    brown=np.array((.123,.067,.037),np.float32)
    lower=np.array((.186,.142,.096),np.float32)
    labial=(1-_smooth(-.30,.05,np.sin(a)))*.55
    color=(brown[None,None,:]*(1-labial[:,:,None])+lower[None,None,:]*labial[:,:,None])*broad[:,:,None]
    # The photographed dark individual has readable pale keratin margins.
    # Stronger integrated edge pigment gives small portrait pixels structure
    # while the actual skin surface remains continuous and thin.
    # Crown joins are dark and thin. Only low cheek/labial keratin can have
    # pale grey-brown edges; do not outline every crown shield in bright ink.
    side_field=(1-_smooth(.18,.66,np.sin(a)))
    keratin=-.15+side_field*(.38+.10*np.sin(x*147+a*7))
    color=color*(1+keratin[:,:,None]*joined[:,:,None])
    # Actual pale pigment is part of the scale field, not a raised ivory cord.
    upper=np.interp(x[0],[-.130,-.102,-.078,-.051,-.020,.007,.030,.050,.072,.091,.106],
                    [.37,.44,.40,.47,.46,.53,.59,.52,.43,.36,.28])[None,:]
    upper+=.016*np.sin(x*191)+.008*np.sin(x*347+.5)
    width=.030+.010*np.sin(x*117+1.4)+.005*np.sin(x*227)
    lowerline=np.interp(x[0],[-.130,-.102,-.064,-.028,.013,.032],[-.17,-.13,-.09,-.035,.055,.075])[None,:]
    lowerline+=.012*np.sin(x*149)
    upper_mask=np.zeros((H,W),np.float32);lower_mask=upper_mask.copy()
    for side_center in (upper,math.pi-upper):
        delta=np.abs((a-side_center+math.pi)%math.tau-math.pi)
        upper_mask=np.maximum(upper_mask,1-_smooth(width*.64,width,delta))
    for side_center in (lowerline,math.pi-lowerline):
        delta=np.abs((a-side_center+math.pi)%math.tau-math.pi)
        lower_mask=np.maximum(lower_mask,1-_smooth(.015,.025,delta))
    upper_mask*=(_smooth(-.111,-.100,x)*(1-_smooth(.090,.101,x)))
    lower_mask*=(_smooth(-.105,-.098,x)*(1-_smooth(.024,.037,x)))
    interruptions=1-.70*np.exp(-((x+.063)/.004)**2)-.45*np.exp(-((x-.052)/.0028)**2)
    upper_mask*=np.clip(interruptions,0,1)
    light=np.maximum(upper_mask,lower_mask*.63)*(.86-.08*joined)
    cream=np.array((.305,.267,.209),np.float32)
    color=color*(1-light[:,:,None])+cream[None,None,:]*light[:,:,None]
    rgba=np.empty((H,W,4),np.float32);rgba[:,:,:3]=color;rgba[:,:,3]=1
    field=np.empty_like(rgba);field[:,:,0]=.89-.66*joined
    # A restrained per-shield roughness change breaks up the unbroken
    # moulded-plastic highlight, without painting white plate outlines.
    field[:,:,1]=.285+.080*joined+pigment*.24
    field[:,:,2]=.5;field[:,:,3]=1
    return _image('HouseSnake readable irregular cranial and grey-brown labial pigment',rgba),_image('HouseSnake flush cranial and labial microrelief',field)


def _materials():
    body_color,body_relief=_body_fields();head_color,head_relief=_head_fields()
    body=_material_from_fields('HouseSnake warm sand-brown continuous scale skin',body_color,body_relief,body=True)
    head=_material_from_fields('HouseSnake warm brown cranial shields and pale labials',head_color,head_relief)
    iris=_node_material('HouseSnake small mottled bronze iris',(.105,.067,.025),.27)
    n,l=iris.node_tree.nodes,iris.node_tree.links;p=n.get('Principled BSDF');p.inputs['Specular IOR Level'].default_value=.24
    tc=n.new('ShaderNodeTexCoord');noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=19;noise.inputs['Detail'].default_value=3
    l.new(tc.outputs['UV'],noise.inputs['Vector']);sep=n.new('ShaderNodeSeparateXYZ');l.new(tc.outputs['UV'],sep.inputs[0])
    def calc(op,a,b=None):
        node=n.new('ShaderNodeMath');node.operation=op
        if hasattr(a,'node'):l.new(a,node.inputs[0])
        else:node.inputs[0].default_value=a
        if b is not None:
            if hasattr(b,'node'):l.new(b,node.inputs[1])
            else:node.inputs[1].default_value=b
        return node.outputs[0]
    xx=calc('SUBTRACT',sep.outputs['X'],.5);yy=calc('SUBTRACT',sep.outputs['Y'],.5)
    radius=calc('SQRT',calc('ADD',calc('MULTIPLY',xx,xx),calc('MULTIPLY',yy,yy)))
    angle=calc('ARCTAN2',yy,xx)
    fibre=calc('SINE',calc('ADD',calc('MULTIPLY',angle,94),calc('ADD',calc('MULTIPLY',noise.outputs['Fac'],6),calc('MULTIPLY',radius,28))))
    fibre=calc('ADD',calc('MULTIPLY',fibre,.5),.5)
    ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=(.027,.017,.006,1);ramp.color_ramp.elements[1].color=(.142,.091,.032,1)
    l.new(fibre,ramp.inputs[0]);border=calc('MINIMUM',calc('MAXIMUM',calc('DIVIDE',calc('SUBTRACT',.5,radius),.055),0),1)
    amount=calc('ADD',calc('MULTIPLY',border,.38),.62)
    tint=n.new('ShaderNodeMixRGB');tint.blend_type='MULTIPLY';tint.inputs[0].default_value=1
    l.new(ramp.outputs['Color'],tint.inputs[1]);l.new(amount,tint.inputs[2]);l.new(tint.outputs[0],p.inputs['Base Color'])
    pupil=_node_material('HouseSnake small natural vertical pupil',(.0014,.0010,.0007),.24)
    pupil.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value=.15
    cornea=bpy.data.materials.new('HouseSnake thin clear protective spectacle');cornea.use_nodes=True
    cn,cl=cornea.node_tree.nodes,cornea.node_tree.links;cn.clear();out=cn.new('ShaderNodeOutputMaterial')
    clear=cn.new('ShaderNodeBsdfTransparent');reflection=cn.new('ShaderNodeBsdfAnisotropic');reflection.inputs['Roughness'].default_value=.085
    fresnel=cn.new('ShaderNodeFresnel');fresnel.inputs['IOR'].default_value=1.38
    factor=cn.new('ShaderNodeMath');factor.operation='MULTIPLY';factor.inputs[1].default_value=.22;cl.new(fresnel.outputs[0],factor.inputs[0])
    mix=cn.new('ShaderNodeMixShader');cl.new(factor.outputs[0],mix.inputs[0]);cl.new(clear.outputs[0],mix.inputs[1]);cl.new(reflection.outputs[0],mix.inputs[2]);cl.new(mix.outputs[0],out.inputs['Surface'])
    return {'skin':body,'head':head,'iris':iris,'pupil':pupil,'cornea':cornea,
            'mouth':_node_material('HouseSnake discreet natural jaw recess',(.020,.014,.010),.43),
            'tongue':_node_material('HouseSnake delicate dark pink forked tongue',(.078,.021,.025),.46)}


def _section(x):
    for i,((a,w,h),(b,ww,hh)) in enumerate(zip(SECTIONS,SECTIONS[1:])):
        if a<=x<=b:
            prev=SECTIONS[max(0,i-1)];next_=SECTIONS[min(len(SECTIONS)-1,i+2)]
            t=(x-a)/(b-a);d=b-a
            def hermite(v0,v1,key):
                m0=(v1-prev[key])/(b-prev[0])
                m1=(next_[key]-v0)/(next_[0]-a)
                return max(.0007,(2*t**3-3*t*t+1)*v0+(t**3-2*t*t+t)*d*m0+(-2*t**3+3*t*t)*v1+(t**3-t*t)*d*m1)
            return hermite(w,ww,1),hermite(h,hh,2)
    return SECTIONS[0][1:] if x<X_MIN else SECTIONS[-1][1:]


def _head_surface(center,f,s,x,a):
    w,h=_section(x);sn=math.sin(a)
    # The lower jaw rolls inward, eliminating the toy's broad flat chin bar.
    # A broad, softly flattened crown follows the photographed house snake;
    # the jaw stays rolled inward rather than becoming a cylindrical snout.
    z=h*(sn**.72) if sn>=0 else h*sn*.77
    n=(s*math.cos(a)+UP*(math.sin(a)/.80)).normalized()
    # Gentle periorbital recess belongs to the skin mesh. Eye globe is nested
    # in this socket rather than glued outside a solid cheek.
    delta=min(abs((a-.30+math.pi)%math.tau-math.pi),abs((a-(math.pi-.30)+math.pi)%math.tau-math.pi))
    depression=.0015*math.exp(-((x-.030)/.016)**4-(delta/.29)**4)
    neck_z=-.004*max(0,min(1,(-.114-x)/.016))
    return center+f*x+s*(math.cos(a)*w)+UP*(z+neck_z)-n*depression


def _outward_ellipsoid(name,center,axes,radii,mat,col,n=40,m=24):
    obj=_ellipsoid(name,center,axes,radii,mat,col,n=n,m=m)
    bm=bmesh.new();bm.from_mesh(obj.data);bm.normal_update()
    for face in bm.faces:
        if face.normal.dot(face.calc_center_median()-center)<0:face.normal_flip()
    bm.to_mesh(obj.data);bm.free();obj.data.update()
    # Anatomical optical UV in the actual iris plane, independent of yaw.
    uv=obj.data.uv_layers.new(name='Optical planar UV')
    for poly in obj.data.polygons:
        for li in poly.loop_indices:
            q=obj.data.vertices[obj.data.loops[li].vertex_index].co-center
            uv.data[li].uv=(.5+q.dot(axes[0])/(2*radii[0]),.5+q.dot(axes[2])/(2*radii[2]))
    return obj


def _jaw_curve(name,points,mat,col):
    # A fine closed mouth line follows the curved cheek; no ivory lower bar.
    data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.bevel_depth=.00020;data.bevel_resolution=2
    sp=data.splines.new('POLY');sp.points.add(len(points)-1)
    for p,q in zip(sp.points,points):p.co=(*q,1)
    obj=bpy.data.objects.new(name,data);col.objects.link(obj);data.materials.append(mat);return obj


def _head(pose,center,f,s,col,m):
    N=128;rows=160;verts=[];faces=[];uvs=[]
    for i in range(rows+1):
        x=X_MIN+(X_MAX-X_MIN)*i/rows
        for j in range(N):verts.append(tuple(_head_surface(center,f,s,x,math.tau*j/N)))
    for i in range(rows):
        for j in range(N):
            k=(j+1)%N;faces.append((i*N+j,i*N+k,(i+1)*N+k,(i+1)*N+j))
            uvs.append(((i/rows,j/N),(i/rows,(j+1)/N),((i+1)/rows,(j+1)/N),((i+1)/rows,j/N)))
    faces.extend([tuple(range(N-1,-1,-1)),tuple(rows*N+j for j in range(N))]);uvs.extend([tuple((0,j/N) for j in range(N)),tuple((1,j/N) for j in range(N))])
    skull=_mesh('HouseSnake '+pose+' · broad posterior skull short rounded muzzle and embedded eyes',verts,faces,col,[m['head']],uvs)
    skull['snake_head']=True;skull['head_center']=list(center);skull['species']='Boaedon capensis'
    skull['continuous_skin']=True;skull['no_detached_head_shields']=True;skull['photographic_basis']='ASI dark coiled photograph: broad posterior skull, short blunt muzzle, grey-brown labials and small lateral eye'
    for sign in (-1,1):
        w,h=_section(.030)
        eye=center+f*.030+s*(sign*w*.875)+UP*(h*.30)
        _outward_ellipsoid('HouseSnake '+pose+' · small embedded mottled side eye '+str(sign),eye,(f,s,UP),(.0105,.0043,.0112),m['iris'],col)
        _outward_ellipsoid('HouseSnake '+pose+' · small vertical pupil '+str(sign),eye+s*(sign*.0041),(f,s,UP),(.0027,.0006,.0090),m['pupil'],col,n=32,m=22)
        _outward_ellipsoid('HouseSnake '+pose+' · flush transparent spectacle '+str(sign),eye,(f,s,UP),(.0106,.0044,.0113),m['cornea'],col,n=48,m=28)
        jaw=[]
        for i in range(80):
            x=-.098+(.104+.098)*i/79;a=-.54 if sign>0 else math.pi+.54
            jaw.append(_head_surface(center,f,s,x,a)+(s*sign)*.00008)
        _jaw_curve('HouseSnake '+pose+' · fine closed curved jaw crease '+str(sign),jaw,m['mouth'],col)
        x=.085;w,h=_section(x)
        _outward_ellipsoid('HouseSnake '+pose+' · tiny flush nostril '+str(sign),center+f*x+s*(sign*w*.96)+UP*.007,(f,s,UP),(.00165,.00045,.00115),m['mouth'],col,n=18,m=12)
    return skull


def refine_anatomy(collections):
    if any(c.get('photographic_anatomy_revision') for c in collections.values()):
        raise ValueError('Rebuild from unscaled body collections; apply anatomy once before portrait staging')
    visibility={p:c.hide_viewport for p,c in collections.items()}
    for c in collections.values():c.hide_viewport=False
    bpy.context.view_layer.update();m=_materials();report={}
    for pose,col in collections.items():
        body=next(o for o in col.objects if o.get('snake_body'))
        points=json.loads(body['centerline_points']);angle=math.radians(col.get('body_head_yaw_degrees',-36.87 if pose in ('normal','tongue') else -67 if pose=='curious' else -4))
        f=Vector((math.cos(angle),math.sin(angle),0));s=Vector((-f.y,f.x,0));center=Vector(points[-1])+f*.103
        removed=[]
        for o in list(col.objects):
            if o==body or any(word in o.name for word in ('cap','scarf')):continue
            removed.append(o.name);bpy.data.objects.remove(o,do_unlink=True)
        body.data.materials.clear();body.data.materials.append(m['skin'])
        # including end caps, before a physically meaningful normal map/BVH.
        normals_reversed=False
        if not (body.get('outward_skin_normals') or body.get('outward')):
            bm=bmesh.new();bm.from_mesh(body.data)
            bmesh.ops.reverse_faces(bm,faces=list(bm.faces))
            bm.to_mesh(body.data);bm.free();body.data.update();normals_reversed=True
        body['outward_skin_normals']=True
        for poly in body.data.polygons:poly.material_index=0
        body['continuous_skin']=True;body['no_detached_scale_tiles']=True;body['native_scale_tiles']=0
        body['scale_microrelief_art_units']=.00037*.70*.60;body['reference']='ASI dark coiled individual and ASI 2026 actual morphology photographs; readable smooth imbricate chestnut scale margins'
        skull=_head(pose,center,f,s,col,m)
        if pose=='tongue':
            origin=center+f*.105-UP*.005;fork=origin+f*.033-UP*.004
            _tube('HouseSnake tongue · fine stem',[origin,origin+f*.017,fork],[.00115,.0010,.0008],col,[m['tongue']],rings=12,steps=6,flatten=.38)
            for sign in (-1,1):_tube('HouseSnake tongue · slender fork '+str(sign),[fork,fork+f*.010+s*(sign*.0035),fork+f*.023+s*(sign*.008)],[.0008,.00055,.0002],col,[m['tongue']],rings=10,steps=5,flatten=.40)
        col['photographic_anatomy_revision']='broad rear skull, short rounded muzzle, readable dark chestnut flush shields and small embedded lateral eye'
        col['anatomy_head_center']=list(center);col['anatomy_head_yaw']=angle;col['anatomy_yaw_degrees']=math.degrees(angle)
        col['anatomy_head_sections']=json.dumps(SECTIONS)
        col['anatomy_cap_fit_note']='Head centre/yaw and rear neck unchanged. Maximum width .140, top +.050, rounded nose +.106. Soft cap must refit the broader posterior skull.'
        report[pose]={'head_center':list(center),'head_yaw_radians':angle,'head_length':.236,'head_max_width':.140,'head_max_height':.0885,
                      'body_curve_unchanged':True,'clothing_objects_unchanged':True,'detached_scale_tiles':0,'detached_head_plates':0,
                      'continuous_skin':True,'eye_globe_width':.021,'eye_seated_inside_skull':True,'body_normals_reversed':normals_reversed,
                      'removed_old_head_objects':len(removed),'objects':len(col.objects),'body_vertices':len(body.data.vertices)}
    for p,c in collections.items():c.hide_viewport=visibility[p]
    bpy.context.view_layer.update();return report
