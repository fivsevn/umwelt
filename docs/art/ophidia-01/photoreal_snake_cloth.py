"""Reference-led miniature rib-knit hat and brushed woven wool scarf.

``refine_clothing(collections)`` replaces only cloth in the four snake poses.
Source: Klitmøller's photographed rib beanie construction; TBCo's photographed
rust lambswool drape, brushed face and twisted fringe. The source photography
is reference, not a texture pasted on the character. All geometry/materials
remain native and editable in Blender. No scene, camera, snake or cabin edits.
"""
import math
import bisect
import json
import random
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree
from snake_model import _mesh, _catmull, _node_material, _ramp, _scaled

UP=Vector((0,0,1))
TAU=math.tau


def _math(n,l,op,a,b=None):
    x=n.new('ShaderNodeMath');x.operation=op
    for i,value in enumerate((a,b)):
        if value is None:continue
        if hasattr(value,'node'):l.new(value,x.inputs[i])
        else:x.inputs[i].default_value=value
    return x.outputs[0]


def _wool(name,lo,hi,woven=False):
    m=_node_material(name,lo,.96);n,l=m.node_tree.nodes,m.node_tree.links
    p=n.get('Principled BSDF');p.inputs['Specular IOR Level'].default_value=.11
    p.inputs['Sheen Weight'].default_value=.045
    p.inputs['Sheen Roughness'].default_value=.75
    p.inputs['Sheen Tint'].default_value=(*tuple(c/max(hi) for c in hi),1)
    tc=n.new('ShaderNodeTexCoord');uv=tc.outputs['UV'];sep=n.new('ShaderNodeSeparateXYZ')
    l.new(uv,sep.inputs[0])
    # Fine colour variation is spun-fibre melange. The visible knit itself is
    # geometry; the scarf's relief follows actual alternating warp/weft.
    noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=1
    noise.inputs['Detail'].default_value=2;noise.inputs['Roughness'].default_value=.65
    l.new(_scaled(n,l,uv,(560,810,1)),noise.inputs['Vector'])
    ramp=_ramp(n,[(.17,lo),(.85,hi)])
    l.new(noise.outputs['Fac'],ramp.inputs[0]);l.new(ramp.outputs['Color'],p.inputs['Base Color'])
    bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.30
    bump.inputs['Distance'].default_value=.00026
    if woven:
        # 2/2 twill: neighbouring rows offset the over/under sequence, as a
        # soft scarf textile. Rounded thread cross sections have no hard grid.
        u=_math(n,l,'MULTIPLY',sep.outputs['X'],1350)
        v=_math(n,l,'MULTIPLY',sep.outputs['Y'],1350)
        fu=_math(n,l,'FRACT',u);fv=_math(n,l,'FRACT',v)
        warp=_math(n,l,'SINE',_math(n,l,'MULTIPLY',fu,math.pi))
        weft=_math(n,l,'SINE',_math(n,l,'MULTIPLY',fv,math.pi))
        over=_math(n,l,'LESS_THAN',_math(n,l,'MODULO',_math(n,l,'ADD',_math(n,l,'FLOOR',u),_math(n,l,'FLOOR',v)),4),2)
        one=_math(n,l,'SUBTRACT',1,over)
        relief=_math(n,l,'ADD',_math(n,l,'MULTIPLY',warp,over),_math(n,l,'MULTIPLY',weft,one))
        # Brushing partly conceals the weave. The weave is a quiet substrate
        # below the visible loose wool nap, rather than a stamped zigzag grid.
        micro=_math(n,l,'MULTIPLY',noise.outputs['Fac'],.70)
        l.new(_math(n,l,'ADD',_math(n,l,'MULTIPLY',relief,.18),micro),bump.inputs['Height'])
    else:l.new(noise.outputs['Fac'],bump.inputs['Height'])
    l.new(bump.outputs['Normal'],p.inputs['Normal'])
    m['reference']='Klitmøller rib beanie / TBCo rust lambswool actual product photographs'
    return m


class _Yarn:
    """Many small fibres/stitches in one editable mesh, not thousands of objects."""
    def __init__(self):self.vertices=[];self.faces=[];self.uvs=[]
    def add(self,points,radius,sides=6,smooth=False):
        pts=[Vector(p) for p in points]
        if smooth:pts=_catmull(pts,2 if smooth is True else int(smooth))
        offset=len(self.vertices);lens=[0]
        for a,b in zip(pts,pts[1:]):lens.append(lens[-1]+(b-a).length)
        previous_tangent=None;previous_side=None
        for i,p in enumerate(pts):
            t=(pts[min(i+1,len(pts)-1)]-pts[max(0,i-1)]).normalized()
            if previous_side is None:
                q=t.cross(UP)
                if q.length<.1:q=t.cross(Vector((1,0,0)))
                q.normalize()
            else:
                q=previous_tangent.rotation_difference(t)@previous_side
                q=(q-t*q.dot(t)).normalized()
            r=t.cross(q).normalized();previous_tangent=t;previous_side=q
            # Thin taper at both free ends. No squared-off plastic tube tips.
            local_radius=radius[i] if isinstance(radius,(list,tuple)) else radius
            rad=local_radius*(.60 if i in (0,len(pts)-1) else 1)
            for j in range(sides):
                a=TAU*j/sides;self.vertices.append(tuple(p+q*math.cos(a)*rad+r*math.sin(a)*rad))
        for i in range(len(pts)-1):
            for j in range(sides):
                k=(j+1)%sides
                self.faces.append((offset+i*sides+j,offset+i*sides+k,offset+(i+1)*sides+k,offset+(i+1)*sides+j))
                local_radius=radius[i] if isinstance(radius,(list,tuple)) else radius
                self.uvs.append(((j/sides*TAU*local_radius,lens[i]),((j+1)/sides*TAU*local_radius,lens[i]),((j+1)/sides*TAU*local_radius,lens[i+1]),(j/sides*TAU*local_radius,lens[i+1])))
    def object(self,name,col,mat):
        return _mesh(name,self.vertices,self.faces,col,[mat],self.uvs)


def _sample_profile(profile,z):
    # Cubic radius interpolation removes the hard horizontal cone bands.
    for i,(a,b) in enumerate(zip(profile,profile[1:])):
        if a[0]<=z<=b[0]:
            t=(z-a[0])/(b[0]-a[0]);aa=profile[max(0,i-1)];bb=profile[min(len(profile)-1,i+2)]
            return tuple(.5*(2*a[k]+(-aa[k]+b[k])*t+(2*aa[k]-5*a[k]+4*b[k]-bb[k])*t*t+(-aa[k]+3*a[k]-3*b[k]+bb[k])*t*t*t) for k in range(1,len(a)))
    return tuple(profile[0][1:] if z<profile[0][0] else profile[-1][1:])


def _surface_nap(name,col,mat,sample,count,seed,length=.0016):
    rng=random.Random(seed);fibres=_Yarn()
    for _ in range(count):
        u=rng.random();v=rng.random();p,normal,tangent=sample(u,v)
        direction=(tangent*rng.uniform(-1,1)+UP*rng.uniform(-.7,.7)).normalized()
        span=rng.uniform(.0008,length);height=rng.uniform(.00030,.00075)
        tip=p+direction*span+normal*height
        fibres.add([p,p+direction*(span*.32)+normal*(height*.75),p+direction*(span*.72)+normal*height,tip],rng.uniform(.000045,.000070),4)
    obj=fibres.object(name,col,mat);obj['textile']='Sparse individually curved short wool fibres; no long fur or simulated hair cache.'
    return obj


def _evaluated_nap(name,col,mat,obj,count,seed,length=.0018):
    """Place short nap on the actual softened outer face of the cloth.

    Raw mesh vertices lie below Solidify/Subsurf's outer face. Sampling that
    raw mesh buried the previous nap, leaving a visually plastic smooth sheet.
    """
    bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
    evaluated=obj.evaluated_get(deps);mesh=evaluated.to_mesh();mesh.calc_loop_triangles()
    towards_view=Vector((-.24,-.91,.34)).normalized();triangles=[];areas=[];total=0
    transform=evaluated.matrix_world
    for tri in mesh.loop_triangles:
        normal=(transform.to_3x3()@tri.normal).normalized()
        if normal.dot(towards_view)<.08:continue
        a,b,c=[transform@mesh.vertices[i].co for i in tri.vertices]
        area=(b-a).cross(c-a).length*.5
        if area<1e-12:continue
        normals=[(transform.to_3x3()@mesh.vertices[i].normal).normalized() for i in tri.vertices]
        total+=area;areas.append(total);triangles.append((a,b,c,*normals))
    evaluated.to_mesh_clear()
    rng=random.Random(seed);fibres=_Yarn()
    for _ in range(count):
        index=min(len(triangles)-1,bisect.bisect_left(areas,rng.random()*total))
        a,b,c,na,nb,nc=triangles[index]
        r=math.sqrt(rng.random());v=rng.random();wa=1-r;wb=r*(1-v);wc=r*v
        normal=(na*wa+nb*wb+nc*wc).normalized()
        p=a*wa+b*wb+c*wc+normal*.00006
        tangent=(b-a).normalized();side=normal.cross(tangent).normalized()
        direction=(tangent*rng.uniform(-1,1)+side*rng.uniform(-1,1)).normalized()
        span=rng.uniform(.0008,length);height=rng.uniform(.00035,.0008)
        fibres.add([p,p+direction*(span*.35)+normal*height*.7,
                    p+direction*(span*.78)+normal*height,p+direction*span+normal*height*.8],
                   rng.uniform(.000045,.000075),4)
    result=fibres.object(name,col,mat)
    result['textile']='Individually curved short wool nap sampled on the actual subdivided cloth outer surface.'
    return result


def _hat(name,head,f,s,col,mat,yarnmat):
    sections=json.loads(col.get('anatomy_head_sections','[]'))
    halfwidth=max((x[1] for x in sections),default=.055)
    height=max((x[2] for x in sections),default=.043)
    widthscale=halfwidth/.055;zscale=height/.043
    # The side hem reaches down to the skull; the front rises clear of the
    # eye. This replaces the old level ring which visibly floated on the head.
    center=head-f*.043+UP*(.024*zscale)
    crown_height=.0855
    profile=[(0,.063,.051,0),(.017,.066,.053,-.001),(.033,.064,.052,-.002),
             (.049,.058,.047,-.004),(.064,.046,.039,-.007),(.076,.033,.029,-.009),
             (.0815,.022,.020,-.010),(.084,.013,.012,-.011),(.0852,.006,.006,-.0115),(.0855,.0005,.0005,-.0115)]
    def skull_top(x,y):
        for (a,w,h),(b,ww,hh) in zip(sections,sections[1:]):
            if a<=x<=b:
                t=(x-a)/(b-a);w=w*(1-t)+ww*t;h=h*(1-t)+hh*t
                return h*math.sqrt(max(0,1-(y/max(.001,w))**2))
        return .018*zscale
    def edge(a):
        nominal=zscale*(.014*math.cos(a)-.009*math.sin(a)**2+.0016*math.sin(3*a+.7))
        roof=skull_top(-.043+.063*math.cos(a),.051*widthscale*math.sin(a))
        return max(nominal,roof+.0012-.024*zscale)
    def crown(a,z,offset=0):
        rf,rs,lean=_sample_profile(profile,z)
        rs*=widthscale
        normal=(f*(math.cos(a)/max(rf,.003))+s*(math.sin(a)/max(rs,.003))).normalized()
        t=z/crown_height
        rib=.00025*math.cos(a*40+.7*math.sin(a*3+z*23))*max(0,1-t)**.75
        # Soft folds are strongest at the relaxed back crown. They also vary
        # the height of the rim, so the hat has no geometric circular edge.
        folds=(.0023*math.sin(a*3+.7)+.0014*math.cos(a*5-z*28))*math.sin(math.pi*t)*t
        q=center+f*(lean+rf*math.cos(a))+s*rs*math.sin(a)+UP*(z*zscale+edge(a)*(1-t)**1.6)
        q+=normal*(rib+folds+offset)
        q.z-=.0016*t*t*max(0,1-t)**.6*(.5+.5*math.cos(a-2.1))
        return q
    verts=[];faces=[];uvs=[];N=80;rows=32
    for i in range(rows):
        z=crown_height*i/(rows-1)
        for j in range(N):verts.append(tuple(crown(TAU*j/N,z)))
    for i in range(rows-1):
        for j in range(N):
            faces.append((i*N+j,i*N+(j+1)%N,(i+1)*N+(j+1)%N,(i+1)*N+j))
            uvs.append(((j/N*.43,i/(rows-1)*.079),((j+1)/N*.43,i/(rows-1)*.079),((j+1)/N*.43,(i+1)/(rows-1)*.079),(j/N*.43,(i+1)/(rows-1)*.079)))
    obj=_mesh(name+' · relaxed low olive cap crown',verts,faces,col,[mat],uvs)
    solid=obj.modifiers.new('Soft knitted cloth thickness','SOLIDIFY');solid.thickness=.0032;solid.offset=-1
    cuff=[(0,.063,.051),(.12,.066,.054),(.32,.068,.055),(.68,.067,.055),(.88,.065,.053),(1,.062,.050)]
    def band(a,t,offset=0):
        rf,rs=_sample_profile(cuff,t);rs*=widthscale
        # A rolled hem is a softened fold in knitted cloth, not an inflated
        # circular torus. The small dip at the back rests on the nape.
        z=.020*math.sin(math.pi*t*.86)-.0018
        normal=(f*math.cos(a)+s*math.sin(a)).normalized()
        q=center+f*rf*math.cos(a)+s*rs*math.sin(a)+UP*(edge(a)+z*zscale)
        q+=normal*(.00036*math.cos(a*40+.6*math.sin(a*5))+offset)
        q.z+=.0007*math.sin(a*7+t*4)
        return q
    verts=[];faces=[];uvs=[];rows=18
    for i in range(rows):
        for j in range(N):verts.append(tuple(band(TAU*j/N,i/(rows-1))))
    for i in range(rows-1):
        for j in range(N):
            faces.append((i*N+j,i*N+(j+1)%N,(i+1)*N+(j+1)%N,(i+1)*N+j))
            uvs.append(((j/N*.46,i/(rows-1)*.032),((j+1)/N*.46,i/(rows-1)*.032),((j+1)/N*.46,(i+1)/(rows-1)*.032),(j/N*.46,(i+1)/(rows-1)*.032)))
    obj=_mesh(name+' · soft uneven turned olive cap hem',verts,faces,col,[mat],uvs)
    solid=obj.modifiers.new('Soft double folded knit thickness','SOLIDIFY');solid.thickness=.0024;solid.offset=-1
    yarn=_Yarn();rng=random.Random(57611)
    # Continuous paired rounded yarn columns form the rib knit. Separate V
    # badges cast isolated dark shadows and read like engraved hard scales.
    # These close columns overlap gently through the rows, continue through
    # the gathered crown, and taper where the cap closes at the top.
    columns=64
    for j in range(columns):
        a=TAU*(j+.5+rng.uniform(-.025,.025))/columns
        for sign in (-1,1):
            pts=[];radii=[]
            for k in range(111):
                z=.0015+(crown_height-.00155)*k/110
                row=z/.0053
                shift=sign*.18+.075*math.sin(row*TAU+sign*.30)
                offset=.00057+.00017*math.cos(row*TAU+sign*math.pi)
                pts.append(crown(a+shift*(TAU/columns),z,offset))
                rf,rs,lean=_sample_profile(profile,z)
                radii.append(max(.000055,.00056*min(1,rf/.022)))
            yarn.add(pts,radii,6)
    for j in range(columns):
        a=TAU*(j+.5+rng.uniform(-.025,.025))/columns
        for sign in (-1,1):
            pts=[]
            for k in range(41):
                t=.07+k/40*.87
                row=t*6.1;shift=sign*.18+.070*math.sin(row*TAU+sign*.30)
                pts.append(band(a+shift*(TAU/columns),t,.00066+.00014*math.cos(row*TAU+sign*math.pi)))
            yarn.add(pts,.00060,6)
    obj=yarn.object(name+' · continuous soft olive rib knit yarn columns',col,yarnmat)
    obj['textile']='Continuous paired rounded rib-knit yarn, small row overlaps, gently gathered and tapered crown; no isolated raised V badges.'
    def sample(u,v):
        a=u*TAU;z=.002+v*.083
        normal=(f*math.cos(a)+s*math.sin(a)).normalized();tangent=-f*math.sin(a)+s*math.cos(a)
        return crown(a,z,.00055),normal,tangent
    _surface_nap(name+' · short soft olive cap wool nap',col,yarnmat,sample,260,3311,.0018)
    def cuffsample(u,v):
        a=u*TAU;t=.05+v*.90
        normal=(f*math.cos(a)+s*math.sin(a)).normalized();tangent=-f*math.sin(a)+s*math.cos(a)
        return band(a,t,.00062),normal,tangent
    _evaluated_nap(name+' · fine soft olive cap yarn fibres',col,yarnmat,obj,850,3321,.0018)
    return center


def _body_support(col):
    body=next(o for o in col.objects if o.get('snake_body'))
    points=[Vector(p) for p in json.loads(body['centerline_points'])]
    radii=json.loads(body['centerline_radii'])
    samples=_catmull(points,16);rs=[]
    for a,b in zip(radii,radii[1:]):
        for j in range(16):
            t=j/16;t=t*t*(3-2*t);rs.append(a*(1-t)+b*t)
    rs.append(radii[-1]);arc=[0]
    for a,b in zip(samples,samples[1:]):arc.append(arc[-1]+(b-a).length)
    anchor=col.get('scarf_anchor')
    if anchor is not None:
        if isinstance(anchor,str):anchor=json.loads(anchor)
        anchor=Vector(anchor)
    else:
        head=Vector(col.get('anatomy_head_center',points[-1]))
        yaw=math.radians(col.get('anatomy_yaw_degrees',-36.87))
        f=Vector((math.cos(yaw),math.sin(yaw),0))
        anchor=head-f*.105-UP*.075
    nearest=min(range(len(samples)),key=lambda i:(samples[i]-anchor).length)
    wraparc=arc[nearest]
    def at(distance):
        target=max(0,min(arc[-1],distance))
        i=next((i for i in range(len(arc)-1) if arc[i+1]>=target),len(arc)-2)
        t=(target-arc[i])/max(.000001,arc[i+1]-arc[i])
        point=samples[i].lerp(samples[i+1],t)
        tangent=(samples[min(i+2,len(samples)-1)]-samples[max(0,i-1)]).normalized()
        return point,tangent,rs[i]*(1-t)+rs[i+1]*t
    verts=[body.matrix_world@v.co for v in body.data.vertices]
    polygons=[tuple(p.vertices) for p in body.data.polygons]
    tree=BVHTree.FromPolygons(verts,polygons,all_triangles=False)
    centers=KDTree(len(samples))
    for i,p in enumerate(samples):centers.insert(p,i)
    centers.balance()
    return at,wraparc,(tree,centers,samples)


def _cloth_contact(point,tree,clearance=.0035):
    surface,centers,samples=tree
    q,n,index,distance=surface.find_nearest(point)
    if q is None:return point
    centre,number,centre_distance=centers.find(q)
    # Body render meshes can use inward winding while still looking correct
    # with two-sided BSDFs. Support must always face away from the centreline;
    # otherwise exterior cloth would be projected under the skin.
    if n.dot(q-centre)<0:n=-n
    signed=(point-q).dot(n)
    # Authoring support keeps the cloth outside the actual body surface. It
    # changes only cloth vertices; no collision modifiers touch the snake.
    if signed<clearance and distance<.080:return q+n*clearance
    return point


def _surface_radius(tree,center,direction,radius):
    # The rebuilt body is muscular and oval. A circular wool sleeve would
    # leave a large rigid-looking gap at its flatter upper/lower surfaces.
    # Measure only radial support distance, never project cloth vertices.
    surface,centers,samples=tree
    q,n,index,distance=surface.ray_cast(center,direction.normalized(),radius*1.8)
    if q is not None and .38*radius<distance<1.65*radius:return distance
    return radius*.88


def _scarf_ribbon(name,points,widths,side,col,mat,fibremat,bodytree,short=False,support_field=None):
    centers=_catmull(points,14);width=[]
    for a,b in zip(widths,widths[1:]):
        for j in range(14):
            t=j/14;t=t*t*(3-2*t);width.append(a*(1-t)+b*t)
    width.append(widths[-1]);supported=[]
    if support_field:
        at,arc_values,direction=support_field
        arc_samples=_catmull([Vector((v,0,0)) for v in arc_values],14)
        previous_tangent=None;normal=None;centers=[]
        for sample in arc_samples:
            c,tangent,r=at(sample.x)
            if normal is None:normal=(direction-tangent*direction.dot(tangent)).normalized()
            else:
                normal=previous_tangent.rotation_difference(tangent)@normal
                normal=(normal-tangent*normal.dot(tangent)).normalized()
            lateral=tangent.cross(normal).normalized();radius=r
            supported.append((c,tangent,radius,normal.copy(),lateral))
            centers.append(c+normal*(_surface_radius(bodytree,c,normal,r)+.0045));previous_tangent=tangent
    length=[0.0]
    for a,b in zip(centers,centers[1:]):length.append(length[-1]+(b-a).length)
    verts=[];faces=[];uvs=[];across=20;frames=[]
    previous=Vector(side).normalized();surface,bodycenters,bodysamples=bodytree
    for i,(p,w) in enumerate(zip(centers,width)):
        if supported:
            support,tangent,radius,normal,lateral=supported[i]
        else:
            support,k,distance=bodycenters.find(p)
            tangent=(bodysamples[min(k+2,len(bodysamples)-1)]-bodysamples[max(0,k-2)]).normalized()
            radial=p-support;radial=(radial-tangent*radial.dot(tangent));radius=radial.length
            normal=radial.normalized();lateral=tangent.cross(normal).normalized()
            if lateral.dot(previous)<0:lateral=-lateral
        previous=lateral;frames.append((lateral,normal))
        along=length[i]/max(.001,length[-1])
        for j in range(across+1):
            t=j/across-.5
            # Three non-uniform, soft pleats are strongest at the gathered
            # collar and flatten where the broad wool end rests on the body.
            gathered=.0018*math.sin((t+.5)*math.pi*2.7+.5)*(1-along*.60)
            fold=.0012*math.sin(t*5.5+along*6.3)*math.sin(along*math.pi)
            edge=.0006*(abs(t)*2)**5
            # A curved cross-section follows the supporting body directly.
            # rigid panels and abrupt edge changes around the narrow neck.
            angle=t*w/max(.027,radius)
            direction=(normal*math.cos(angle)+lateral*math.sin(angle)).normalized()
            radius_here=_surface_radius(bodytree,support,direction,radius)+.0045+gathered+fold+edge
            q=support+direction*radius_here
            free=max(0,(along-.80)/.20)**2
            q+=UP*(-.005*free)+normal*(.006*free)
            # A wool hem has a small yielding waviness instead of ruler-
            # straight corners or a rigid folded opening at the tail end.
            q+=tangent*(.0012*math.sin(j*.73+along*3)*max(0,(along-.87)/.13))
            verts.append(tuple(q))
    for i in range(len(centers)-1):
        for j in range(across):
            faces.append((i*(across+1)+j,i*(across+1)+j+1,(i+1)*(across+1)+j+1,(i+1)*(across+1)+j))
            uvs.append(((j/across*width[i],length[i]),((j+1)/across*width[i],length[i]),((j+1)/across*width[i+1],length[i+1]),(j/across*width[i+1],length[i+1])))
    obj=_mesh(name,verts,faces,col,[mat],uvs)
    solid=obj.modifiers.new('Soft brushed wool sheet','SOLIDIFY');solid.thickness=.0032;solid.offset=0
    sub=obj.modifiers.new('Soft textile fold transitions','SUBSURF');sub.levels=1;sub.render_levels=1
    def sample(u,v):
        i=min(len(centers)-2,max(1,int(u*(len(centers)-2))))
        j=min(across,max(0,int(v*across)))
        point=Vector(verts[i*(across+1)+j])+frames[i][1]*.00235
        return point,frames[i][1],frames[i][0]
    _evaluated_nap(name+' · close short brushed wool nap',col,fibremat,obj,350 if short else 1400,7712 if short else 7711,.0018)
    fringe=_Yarn();lat,norm=frames[-1];rng=random.Random(914 if short else 913)
    # The loose wool bundles do not share an identical straight end line.
    # They droop at different lengths and keep only a gentle residual twist.
    for j in range(12):
        index=round(j/11*across);start=Vector(verts[(len(centers)-1)*(across+1)+index])+norm*.0014
        span=rng.uniform(.011,.018) if not short else rng.uniform(.009,.014)
        lean=rng.uniform(-.003,.003)
        for strand in range(2):
            pts=[]
            for k in range(9):
                t=k/8;a=t*math.pi*3.2+strand*math.pi
                p=start+UP*(-span*t)+lat*(.00055*math.sin(a)+lean*t*t)+norm*(.00055*math.cos(a)-.0025*t*t)
                pts.append(_cloth_contact(p,bodytree,.0030))
            fringe.add(pts,.00028,5)
    fringe.object(name+' · relaxed uneven wool fringe',col,fibremat)
    return obj


def _hanging_end(name,start,front,lateral,length,widths,col,mat,fibremat,tree,short=False):
    """A flat gravity-draped scarf end, rather than a sleeve around the body."""
    drops=[0,.12,.34,.61,.83,1.0]
    points=[start-UP*(length*t)+front*(.008+.040*t*t)+
            lateral*(.004*math.sin(t*math.pi*1.4)*(1 if short else -1)) for t in drops]
    centers=_catmull(points,14);across=20;verts=[];faces=[];uvs=[];arc=[0.0]
    for a,b in zip(centers,centers[1:]):arc.append(arc[-1]+(b-a).length)
    for i,p in enumerate(centers):
        t=arc[i]/max(.001,arc[-1]);w=widths[0]*(1-t)+widths[1]*t
        for j in range(across+1):
            u=j/across-.5
            # A few loose, rounded folds open out below the loop. The lower
            # ends fall independently and have visible air behind the cloth.
            fold=.0042*math.sin((u+.5)*math.pi*2.5+t*1.8)*(1-.58*t)
            fold+=.0024*math.sin(t*math.pi*1.9+u*2.7)
            q=p+lateral*(u*w)+front*fold
            q.z+=.0015*math.sin(u*6.0+t*2.0)*(t**5)
            # Only the last section can settle onto a coil; never wrap the
            # entire free ribbon around the neck's circular cross-section.
            if t>.72:q=_cloth_contact(q,tree,.0040)
            verts.append(tuple(q))
    for i in range(len(centers)-1):
        for j in range(across):
            faces.append((i*(across+1)+j,(i+1)*(across+1)+j,
                          (i+1)*(across+1)+j+1,i*(across+1)+j+1))
            w=widths[0]+(widths[1]-widths[0])*i/(len(centers)-1)
            uvs.append(((j/across*w,arc[i]),(j/across*w,arc[i+1]),
                        ((j+1)/across*w,arc[i+1]),((j+1)/across*w,arc[i])))
    obj=_mesh(name,verts,faces,col,[mat],uvs)
    solid=obj.modifiers.new('Soft red wool thickness','SOLIDIFY');solid.thickness=.0028;solid.offset=0
    sub=obj.modifiers.new('Free scarf drape folds','SUBSURF');sub.levels=1;sub.render_levels=1
    obj['scarf_style']='Ordinary once-around scarf with two gravity-hanging ends'
    obj['free_drape_length']=length
    _evaluated_nap(name+' · soft red wool surface nap',col,fibremat,obj,400 if short else 750,8182 if short else 8181,.0017)
    fringe=_Yarn();rng=random.Random(9121 if short else 9120)
    for j in range(10):
        start=Vector(verts[(len(centers)-1)*(across+1)+round(j/9*across)])+front*.0017
        span=rng.uniform(.010,.017)
        points=[start-UP*(span*t)+lateral*(.0008*math.sin(t*3.8+j)*t)+front*(.0012*t*t) for t in [0,.25,.50,.75,1]]
        fringe.add(points,.00029,5)
    fringe.object(name+' · short loose red fringe',col,fibremat)
    return obj


def _scarf(name,head,f,s,col,mat,fibremat):
    at,wraparc,tree=_body_support(col)
    center,axis,rad=at(wraparc);N=64;rows=17;verts=[];faces=[];uvs=[]
    def wrap(a,t,offset=0):
        c,tangent,r=at(wraparc+(t-.5)*.060)
        side=(s-tangent*s.dot(tangent)).normalized();front=tangent.cross(side).normalized()
        # Tiny clearance and loose lower folds conform to the actual curved
        # neck. The collar has physical wool volume, not a empty stiff hoop.
        wave=.0008*math.sin(a*3+t*4.0)+.0007*math.cos(a*2.0-t*5.6)
        loose=.0055*math.sin(t*math.pi)**2
        loose+=.0018*math.sin(t*TAU*1.7+.35*math.sin(a*2))*math.sin(t*math.pi)
        direction=(side*math.cos(a)+front*math.sin(a)).normalized()
        rr=_surface_radius(tree,c,direction,r)+.0043+wave+loose
        p=c+direction*rr
        p+=tangent*(.002*math.sin(a+1.1))
        normal=(side*math.cos(a)+front*math.sin(a)).normalized()
        return p+normal*offset,normal,(-side*math.sin(a)+front*math.cos(a)).normalized()
    for i in range(rows):
        for j in range(N):verts.append(tuple(wrap(TAU*j/N,i/(rows-1))[0]))
    for i in range(rows-1):
        for j in range(N):
            faces.append((i*N+j,i*N+(j+1)%N,(i+1)*N+(j+1)%N,(i+1)*N+j))
            uvs.append(((j/N*.315,i/(rows-1)*.050),((j+1)/N*.315,i/(rows-1)*.050),((j+1)/N*.315,(i+1)/(rows-1)*.050),(j/N*.315,(i+1)/(rows-1)*.050)))
    obj=_mesh(name+' · loose once-around red wool scarf',verts,faces,col,[mat],uvs)
    solid=obj.modifiers.new('Soft brushed neck wool thickness','SOLIDIFY');solid.thickness=.0035;solid.offset=0
    sub=obj.modifiers.new('Rounded gathered wool folds','SUBSURF');sub.levels=1;sub.render_levels=1
    def sample(u,v):return wrap(u*TAU,v,.0025)
    _evaluated_nap(name+' · neck wrap short wool nap',col,fibremat,obj,650,611,.0018)
    front=Vector((-.30,-.95,0)).normalized();lateral=UP.cross(front).normalized()
    side=(s-axis*s.dot(axis)).normalized();around=axis.cross(side).normalized()
    direction=(front-axis*front.dot(axis)).normalized()
    a=math.atan2(direction.dot(around),direction.dot(side))
    # Bring both free ends to one side, like the marked human-style drape,
    # leaving the upright ventral column visible beside the red cloth.
    starts=[wrap(a-.90,.06,.003)[0],wrap(a-.35,.06,.003)[0]]
    starts.sort(key=lambda p:p.dot(lateral))
    _hanging_end(name+' · longer red scarf end',starts[0]+front*.003,
                 front,lateral,.252,(.050,.055),col,mat,fibremat,tree)
    _hanging_end(name+' · shorter red scarf end',starts[1]-front*.003,
                 front,lateral,.190,(.043,.048),col,mat,fibremat,tree,True)
    return obj


def refine_clothing(collections):
    """Replace cloth once in unscaled snake pose collections.

    Call after anatomy refinement and before root's uniform actor enlargement.
    The anatomy interface supplies the original world-space head anchor/yaw.
    """
    if any(c.get('photoreal_cloth_revision') for c in collections.values()):
        raise ValueError('Textile refinement has already been applied')
    cap=_wool('Ophidia soft olive wool underlay',(.043,.049,.014),(.060,.066,.024))
    yarn=_wool('Ophidia soft olive knit stitch yarn',(.045,.050,.017),(.062,.068,.027))
    scarf=_wool('Ophidia muted rust-red brushed lambswool weave',(.104,.030,.012),(.134,.043,.018),True)
    fibre=_wool('Ophidia muted rust-red wool nap and loose fringe',(.107,.032,.012),(.142,.047,.020))
    visibility={p:c.hide_viewport for p,c in collections.items()}
    report={}
    for pose,col in collections.items():
        col.hide_viewport=False
        old=[o for o in col.objects if any(x in o.name.lower() for x in ('cap crown','cap brim','scarf','wool forebody wrap'))]
        for o in old:bpy.data.objects.remove(o,do_unlink=True)
        head=Vector(col.get('anatomy_head_center',(.32,.29,1.115) if pose in ('normal','tongue') else (.307,.28,1.150) if pose=='curious' else (.338,.328,1.110)))
        angle=math.radians(col.get('anatomy_yaw_degrees',-36.87 if pose in ('normal','tongue') else -67 if pose=='curious' else -4))
        f=Vector((math.cos(angle),math.sin(angle),0));s=Vector((-f.y,f.x,0));name='Cloth '+pose
        existing=set(col.objects);capcenter=_hat(name,head,f,s,col,cap,yarn);_scarf(name,head,f,s,col,scarf,fibre)
        authored=[o for o in col.objects if o not in existing]
        for o in authored:
            o['cloth_component']=True
            o['snake_garment']='cap' if 'cap' in o.name.lower() else 'scarf'
            o['reference']='Klitmøller brushed merino rib beanie photographs; TBCo rust lambswool close-up/drape/fringe photographs.'
        col['photoreal_cloth_revision']='preserved olive cap; red once-around wool scarf with two loose gravity-draped ends'
        report[pose]={'old_cloth_objects_removed':len(old),'new_cloth_objects':len(authored),'cloth_vertices':sum(len(o.data.vertices) for o in authored if o.type=='MESH'),'cap_anchor':list(capcenter),'head_anchor':list(head),'scarf_anchor':list(col.get('scarf_anchor',[])),'camera_or_snake_changed':False,'hat_lower_rim_follows_head_sections':True,'body_centerline_support':True,'cloth_faces_pointwise_bvh_projected':False,'rounded_yarn_paths':True,'cloth_physics_simulated':False,'scarf_wrap_length':.060,'scarf_style':'once-around, two gravity-hanging ends','scarf_long_end_max_width':.055,'scarf_long_end_span':.252,'scarf_short_end_span':.190}
    for p,c in collections.items():c.hide_viewport=visibility[p]
    bpy.context.view_layer.update()
    return report
