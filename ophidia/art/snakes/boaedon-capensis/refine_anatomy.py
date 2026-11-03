"""Refine the existing native snake, retaining four poses and both garments.

Run against an unmodified restored library with --source and --output. Geometry
is edited in the original head frame; the existing single closed skin is kept.
Reference: Tiutenko & Bates 2026, fig. 11 and p. 23; ASI live photographs.
"""
import argparse, json, math, sys
from pathlib import Path
import bpy
import numpy as np
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
from mathutils.geometry import barycentric_transform

REV='2026-11-04-natural-squamation'
ROOT=Path(__file__).resolve().parent

def smooth(a,b,x):
    t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)

def arr(mesh):
    a=np.empty(len(mesh.vertices)*3,dtype=np.float64);mesh.vertices.foreach_get('co',a);return a.reshape(-1,3)

def coords_set(mesh,a):
    mesh.vertices.foreach_set('co',np.asarray(a,dtype=np.float32).ravel());mesh.update()

def transform(a,m):
    # Avoid the platform BLAS path for these small fixed-size transforms.
    return np.einsum('ij,kj->ik',a,m)

def mat(name,color,rough=.28):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=rough;p.inputs['IOR'].default_value=1.46
    p.inputs['Specular IOR Level'].default_value=.5
    p.inputs['Coat Weight'].default_value=.035;p.inputs['Coat Roughness'].default_value=.30
    return m

def pigment_material(name,rough=.28):
    m=mat(name,(.10,.045,.023),rough);n=m.node_tree.nodes;l=m.node_tree.links
    a=n.new('ShaderNodeVertexColor');a.layer_name='Pigment'
    p=n.get('Principled BSDF');p.inputs['Coat Weight'].default_value=0
    p.inputs['Specular IOR Level'].default_value=.34
    uv=n.new('ShaderNodeTexCoord')
    noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=380;noise.inputs['Detail'].default_value=3
    l.new(uv.outputs['Object'],noise.inputs['Vector'])
    tint=n.new('ShaderNodeValToRGB');tint.color_ramp.elements[0].color=(.90,.86,.80,1);tint.color_ramp.elements[1].color=(1.07,1.04,1.00,1)
    l.new(noise.outputs['Fac'],tint.inputs[0])
    mix=n.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1
    l.new(a.outputs['Color'],mix.inputs[1]);l.new(tint.outputs[0],mix.inputs[2]);l.new(mix.outputs[0],p.inputs['Base Color'])
    rr=n.new('ShaderNodeMapRange');rr.inputs['To Min'].default_value=rough-.06;rr.inputs['To Max'].default_value=rough+.09
    l.new(noise.outputs['Fac'],rr.inputs['Value']);l.new(rr.outputs[0],p.inputs['Roughness'])
    grain=n.new('ShaderNodeTexNoise');grain.inputs['Scale'].default_value=10000;grain.inputs['Detail'].default_value=2
    l.new(uv.outputs['Object'],grain.inputs['Vector'])
    bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.16;bump.inputs['Distance'].default_value=.000010
    l.new(grain.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs['Normal'],p.inputs['Normal'])
    return m

def eye_materials():
    iris=mat('Anatomy · bronze iris',(.1,.045,.02),.48)
    n=iris.node_tree.nodes;l=iris.node_tree.links;p=n.get('Principled BSDF')
    p.inputs['Specular IOR Level'].default_value=.08;p.inputs['Coat Weight'].default_value=0
    c=n.new('ShaderNodeVertexColor');c.layer_name='Pigment';l.new(c.outputs['Color'],p.inputs['Base Color'])
    spec=bpy.data.materials.new('Anatomy · clear spectacle');spec.use_nodes=True
    n=spec.node_tree.nodes;l=spec.node_tree.links;n.clear()
    out=n.new('ShaderNodeOutputMaterial');transparent=n.new('ShaderNodeBsdfTransparent')
    reflection=n.new('ShaderNodeBsdfGlossy');reflection.inputs['Color'].default_value=(1,1,1,1);reflection.inputs['Roughness'].default_value=.065
    fresnel=n.new('ShaderNodeFresnel');fresnel.inputs['IOR'].default_value=1.38
    mix=n.new('ShaderNodeMixShader');l.new(fresnel.outputs[0],mix.inputs[0]);l.new(transparent.outputs[0],mix.inputs[1]);l.new(reflection.outputs[0],mix.inputs[2]);l.new(mix.outputs[0],out.inputs['Surface'])
    return iris,spec

def set_colors(mesh,colors):
    old=mesh.color_attributes.get('Pigment')
    if old:mesh.color_attributes.remove(old)
    a=mesh.color_attributes.new(name='Pigment',type='FLOAT_COLOR',domain='POINT')
    rgba=np.ones((len(colors),4),dtype=np.float32);rgba[:,:3]=colors
    a.data.foreach_set('color',rgba.ravel())

XP=np.array([-.104,-.095,-.08,-.06,-.04,-.02,0,.02,.033,.04,.044,.04525])
WIDTH=np.array([.031,.034,.039,.0395,.037,.032,.028,.023,.0195,.0145,.008,0])
TOP=np.array([.028,.028,.028,.027,.026,.025,.024,.020,.0165,.012,.008,.003])
BOTTOM=np.array([-.025,-.022,-.019,-.018,-.017,-.015,-.013,-.011,-.009,-.006,-.001,.003])

def head_color(q,variation=1.):
    q=np.asarray(q);x,y,z=q.T
    base=np.tile([.061,.027,.017],(len(q),1))
    n=1+.055*np.sin(x*419+y*593+z*317)+.025*np.sin(x*1921-y*981)
    base*=n[:,None]*variation
    # Two distinct cream lines, interrupted by the orbital aperture. The
    # upper line follows the supraocular margin, rather than painting the eye.
    w=np.interp(x,XP,WIDTH)
    side=smooth(.55,.90,np.abs(y)/np.maximum(w,.002))
    upper=.016+.003*np.cos((x+.006)*25)+.00023*np.sin(x*690+z*1400)
    lower=-.004+.0015*np.sin(x*40)+.00018*np.sin(x*770)
    band1=np.exp(-((z-upper)/.00155)**2)
    band2=np.exp(-((z-lower)/.00145)**2)*smooth(-.108,-.08,x)*(1-smooth(.021,.035,x))
    bands=np.maximum(band1,band2)*side*smooth(-.12,-.09,x)
    cream=np.array([.30,.255,.195])
    base=base*(1-bands[:,None]) + cream*bands[:,None]
    vent=smooth(-.008,-.016,z)*.8
    base=base*(1-vent[:,None])+np.array([.43,.39,.32])*vent[:,None]
    return base

def cranial_transition(mesh,q,colors=False):
    """Blend the neck UV pigment into the head without a painted seam."""
    weight=smooth(-.16,-.115,q[:,0])*(1-smooth(.035,.060,np.abs(q[:,2])))*(1-smooth(.040,.070,np.abs(q[:,1])))
    a=mesh.attributes.new('cranial_blend','FLOAT','POINT');a.data.foreach_set('value',np.asarray(weight,dtype=np.float32))
    if colors:
        c=np.zeros((len(q),3));selected=weight>0;c[selected]=head_color(q[selected]);set_colors(mesh,c)

def mesh_obj(name,verts,faces,col,parent,material,colors=None):
    me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update()
    ob=bpy.data.objects.new(name,me);col.objects.link(ob)
    ob.parent=parent;ob.location=(-.5,-.53,-.83)
    me.materials.append(material)
    for p in me.polygons:p.use_smooth=True
    if colors is not None:set_colors(me,colors)
    ob['anatomy_revision']=REV
    return ob

def curve_obj(name,points,radius,col,parent,material):
    cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.resolution_u=2;cu.bevel_depth=radius;cu.bevel_resolution=3
    s=cu.splines.new('POLY');s.points.add(len(points)-1)
    for p,v in zip(s.points,points):p.co=(*v,1)
    ob=bpy.data.objects.new(name,cu);col.objects.link(ob);ob.parent=parent;ob.location=(-.5,-.53,-.83);cu.materials.append(material)
    ob['anatomy_revision']=REV
    return ob

def body_materials():
    for name in ['HouseSnake · continuous ventral and rooted skin','HouseSnake · physical satin scale faces','HouseSnake · thin scale undersides']:
        m=bpy.data.materials[name];n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF')
        for link in list(p.inputs['Base Color'].links):l.remove(link)
        uv=n.new('ShaderNodeTexCoord');sep=n.new('ShaderNodeSeparateXYZ');l.new(uv.outputs['UV'],sep.inputs[0])
        ramp=n.new('ShaderNodeValToRGB');r=ramp.color_ramp
        points=[(0,(.057,.026,.017,1)),(.48,(.069,.032,.022,1)),(.59,(.28,.235,.185,1)),(.65,(.50,.45,.37,1)),(.86,(.50,.45,.37,1)),(.94,(.069,.032,.022,1)),(1,(.057,.026,.017,1))]
        r.elements.remove(r.elements[1]);r.elements[0].position=0;r.elements[0].color=points[0][1]
        for pos,color in points[1:]:r.elements.new(pos).color=color
        l.new(sep.outputs['Y'],ramp.inputs[0])
        noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=190;noise.inputs['Detail'].default_value=3
        l.new(uv.outputs['Object'],noise.inputs['Vector'])
        tint=n.new('ShaderNodeValToRGB');tint.color_ramp.elements[0].color=(.72,.65,.58,1);tint.color_ramp.elements[1].color=(1.1,1.08,1.04,1)
        l.new(noise.outputs['Fac'],tint.inputs[0])
        mix=n.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1
        l.new(ramp.outputs['Color'],mix.inputs[1]);l.new(tint.outputs[0],mix.inputs[2]);l.new(mix.outputs[0],p.inputs['Base Color'])
        rr=n.new('ShaderNodeMapRange');rr.inputs['To Min'].default_value=.27;rr.inputs['To Max'].default_value=.43
        l.new(noise.outputs['Fac'],rr.inputs['Value']);l.new(rr.outputs[0],p.inputs['Roughness'])
        p.inputs['Specular IOR Level'].default_value=.37;p.inputs['Coat Weight'].default_value=0
        bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.16;bump.inputs['Distance'].default_value=.000010
        grain=n.new('ShaderNodeTexNoise');grain.inputs['Scale'].default_value=10000
        l.new(uv.outputs['Object'],grain.inputs['Vector']);l.new(grain.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs['Normal'],p.inputs['Normal'])
        if 'faces' in name:
            a=n.new('ShaderNodeAttribute');a.attribute_name='scale_id'
            wn=n.new('ShaderNodeTexWhiteNoise');wn.noise_dimensions='1D';l.new(a.outputs['Fac'],wn.inputs['W'])
            cr=n.new('ShaderNodeValToRGB');cr.color_ramp.elements[0].color=(.90,.86,.82,1);cr.color_ramp.elements[1].color=(1.10,1.07,1.04,1)
            l.new(wn.outputs['Value'],cr.inputs[0]);mix2=n.new('ShaderNodeMixRGB');mix2.blend_type='MULTIPLY';mix2.inputs[0].default_value=1
            l.new(mix.outputs[0],mix2.inputs[1]);l.new(cr.outputs[0],mix2.inputs[2]);l.new(mix2.outputs[0],p.inputs['Base Color'])
        previous=p.inputs['Base Color'].links[0].from_socket
        ca=n.new('ShaderNodeAttribute');ca.attribute_name='cranial_blend'
        pigment=n.new('ShaderNodeVertexColor');pigment.layer_name='Pigment'
        transition=n.new('ShaderNodeMixRGB');l.new(ca.outputs['Fac'],transition.inputs[0]);l.new(previous,transition.inputs[1]);l.new(pigment.outputs['Color'],transition.inputs[2]);l.new(transition.outputs[0],p.inputs['Base Color'])


def ventral_scutes(skin,col,parent,material):
    """Wide ventrals and paired subcaudals, sampled on the retained skin UVs."""
    me=skin.data;me.calc_loop_triangles();uv=me.uv_layers.active.data
    tv=[];uvv=[];tn=[]
    for tri in me.loop_triangles:
        if me.polygons[tri.polygon_index].material_index!=0:continue
        uvp=[Vector((*uv[k].uv,0)) for k in tri.loops]
        if (uvp[1]-uvp[0]).cross(uvp[2]-uvp[0]).length<1e-10:continue
        uvv.extend(uvp);tv.append([me.vertices[i].co.copy() for i in tri.vertices]);tn.append([me.vertices[i].normal.copy() for i in tri.vertices])
    bvh=BVHTree.FromPolygons(uvv,[(i*3,i*3+1,i*3+2) for i in range(len(tv))],all_triangles=True)
    maximum=max(v.x for v in uvv)
    def sample(u,v):
        hit,n,k,d=bvh.ray_cast(Vector((u,v,1)),Vector((0,0,-1)),2)
        if hit is None:return None
        p=barycentric_transform(hit,*uvv[k*3:k*3+3],*tv[k])
        normal=barycentric_transform(hit,*uvv[k*3:k*3+3],*tn[k]).normalized()
        return p,normal
    verts=[];faces=[];colors=[];plate_ids=[]
    count=0
    tail_end=maximum*.123
    segments=[]
    for a,b in zip(np.linspace(.012,tail_end,50)[:-1],np.linspace(.012,tail_end,50)[1:]):
        segments.extend([(a,b,.59,.749,'subcaudal'),(a,b,.751,.91,'subcaudal')])
    for a,b in zip(np.linspace(tail_end,maximum-.015,224)[:-1],np.linspace(tail_end,maximum-.015,224)[1:]):
        segments.append((a,b,.59,.91,'ventral'))
    for u0,u1,v0,v1,kind in segments:
        points=[];norms=[];cs=[];rows=5;cols=23
        for i in range(rows):
            t=i/(rows-1);u=u0+(u1-u0)*(.015+.97*t)
            for j in range(cols):
                v=v0+(v1-v0)*j/(cols-1);r=sample(float(u),float(v))
                if r is None:break
                pt,n=r;rise=.00007+.00028*math.sin(math.pi*t)
                points.append(pt+n*rise);norms.append(n)
                side=abs(v-.75)/.16
                tint=.93+.035*math.sin(count*1.37)
                cs.append(np.array([.50,.45,.37])*tint*(1-.12*side**4))
            if len(points)!=(i+1)*cols:break
        if len(points)!=rows*cols:continue
        off=len(verts);N=len(points)
        verts.extend(points);colors.extend(cs)
        verts.extend([p-n*.00022 for p,n in zip(points,norms)]);colors.extend(cs)
        fs=[]
        for i in range(rows-1):
            for j in range(cols-1):
                a=i*cols+j;f=(a,a+1,a+1+cols,a+cols);fs.extend([f,tuple(N+k for k in reversed(f))])
        boundary=list(range(cols))+[i*cols+cols-1 for i in range(1,rows)]+list(range((rows-1)*cols+cols-2,(rows-1)*cols-1,-1))+[i*cols for i in range(rows-2,0,-1)]
        for a,b in zip(boundary,boundary[1:]+boundary[:1]):fs.append((a,a+N,b+N,b))
        faces.extend([tuple(off+k for k in f) for f in fs]);plate_ids.extend([count]*len(fs));count+=1
    ob=mesh_obj('Anatomy · '+col.name.split(' · ')[-1]+' · ventrals and paired subcaudals',verts,faces,col,parent,material,colors)
    a=ob.data.attributes.new('scute_id','INT','FACE');a.data.foreach_set('value',plate_ids)
    ob['ventral_scute_geometry']=True;ob['scutes_created']=count
    import bmesh
    bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(ob.data);bm.free()
    print('VENTRAL_SCUTES',col.name,count,'body u max',maximum,flush=True)
    # Smooth, overlapping dorsals with separate anterior, trunk and posterior
    # row counts. All leaves follow the *current* surface, including the nape.
    vv=[];ff=[];uvs=[];vnorm=[];face_ids=[];sid=0;u=.014
    while u<maximum-.012:
        pitch=(.003+.007*float(smooth(.08,.85,u)))*(1-.60*float(smooth(maximum-.65,maximum,u)))
        pitch*=1+.035*math.sin(u*41)+.018*math.sin(u*173)
        if u<tail_end:rows=int(round(11+10*float(smooth(0,tail_end,u))))
        elif u<1.0:rows=21+2*int(5*float(smooth(tail_end,1.0,u)))
        elif u>maximum-.65:rows=27
        else:rows=31
        step=.68/rows
        for j in range(rows):
            uc=u+pitch*(.5*(j%2)+.055*math.sin(u*97+j*3.2));vc=-.09+(j+.5+.06*math.sin(u*41+j*2.1))*step
            lengthvar=1+.045*math.sin(sid*2.399);widthvar=1+.035*math.sin(sid*1.731)
            if uc+pitch*.72>=maximum:continue
            leaf=[];uvleaf=[];normals=[];N=12;R=3
            for r in range(R+1):
                t=.01+.99*r/R
                for k in range(N):
                    angle=2*math.pi*k/N
                    cu=math.cos(angle);sv=math.sin(angle)
                    du=math.copysign(abs(cu)**1.16,cu)*pitch*.73*t*lengthvar
                    dv=math.copysign(abs(sv)**1.10,sv)*step*.58*t*widthvar
                    uu=uc+du;v=(vc+dv)%1
                    result=sample(uu,v)
                    if result is None:break
                    pt,n=result
                    rise=.000018+.000035*(1-t*t)+.000060*max(0,.5-.5*du/(pitch*.77))
                    leaf.append(pt+n*rise);normals.append(n);uvleaf.append((uu,vc+dv))
                if len(leaf)!=(r+1)*N:break
            if len(leaf)!=(R+1)*N:continue
            off=len(vv);vv.extend(leaf);uvs.extend(uvleaf);vnorm.extend(normals)
            fs=[]
            for r in range(R):
                for k in range(N):fs.append((r*N+k,r*N+(k+1)%N,(r+1)*N+(k+1)%N,(r+1)*N+k))
            fs.append(tuple(range(N-1,-1,-1)))
            base=len(leaf);topfaces=list(fs)
            for pt,n,uvpoint in zip(leaf,normals,uvleaf):vv.append(pt-n*.00012);uvs.append(uvpoint);vnorm.append(-n)
            fs.extend([tuple(base+k for k in reversed(f)) for f in topfaces])
            for k in range(N):fs.append((R*N+k,R*N+(k+1)%N,base+R*N+(k+1)%N,base+R*N+k))
            ff.extend([tuple(off+k for k in f) for f in fs]);face_ids.extend([sid]*len(fs));sid+=1
        u+=pitch
    old=next(ob for ob in col.objects if ob.get('snake_scale_geometry'))
    oldmesh=old.data;bpy.data.objects.remove(old,do_unlink=True)
    if oldmesh.users==0:bpy.data.meshes.remove(oldmesh)
    ob=mesh_obj('Anatomy · '+col.name.split(' · ')[-1]+' · overlapping dorsal scales',vv,ff,col,parent,bpy.data.materials['HouseSnake · physical satin scale faces'])
    uv=ob.data.uv_layers.new(name='Anatomical UV');indices=np.empty(len(ob.data.loops),dtype=np.int32);ob.data.loops.foreach_get('vertex_index',indices)
    uv.data.foreach_set('uv',np.asarray(uvs,dtype=np.float32)[indices].ravel())
    ids=ob.data.attributes.new('scale_id','INT','FACE');ids.data.foreach_set('value',face_ids)
    ob['snake_scale_geometry']=True;ob['scale_count']=sid;ob['construction']='Curved imbricated leaves sampled from the native continuous skin; 31 midbody rows, 27 anterior rows, 21 posterior rows, tapering tail rows'
    skin['physical_scale_layer']=ob.name
    bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(ob.data);bm.free()
    # The thin lamina follows the host's normals. Averaging its upper face
    # with the underside creates a bright, artificial bevel around each leaf.
    ob.data.normals_split_custom_set_from_vertices([(Vector(n)*.55+v.normal*.45).normalized() for n,v in zip(vnorm,ob.data.vertices)])
    origin=np.array(col['final_head_frame_origin']);basis=np.array(col['final_head_frame_basis']).reshape(3,3)
    cranial_transition(ob.data,transform(np.asarray(vv)-origin,basis.T),colors=True)
    print('DORSAL_SCALES',col.name,sid,flush=True)


def refine_pose(pose,headmat,shieldmat,eye_mat,pupilmat,spectaclemat,darkmat,ventmat):
    col=bpy.data.collections['Snake · '+pose];skin=next(o for o in col.objects if o.get('snake_complete_skin'))
    parent=skin.parent;origin=np.array(col['final_head_frame_origin']);basis=np.array(col['final_head_frame_basis']).reshape(3,3)
    def local(a):return transform(a-origin,basis.T)
    def world(q):return transform(np.asarray(q),basis)+origin
    old=arr(skin.data);q=local(old);parts=np.array([a.value for a in skin.data.attributes['origin_part'].data])
    ishead=parts==1
    # Derive original section envelope using 256-vertex longitudinal rings.
    ids=np.flatnonzero(ishead);h=q[ishead].copy();row=np.arange(len(ids))//256
    rowx=[];roww=[];rowtop=[];rowbottom=[]
    for r in np.unique(row):
        hh=h[row==r];rowx.append(float(hh[:,0].mean()));roww.append(float(abs(hh[:,1]).max()));rowtop.append(float(hh[:,2].max()));rowbottom.append(float(hh[:,2].min()))
    order=np.argsort(rowx);rx=np.array(rowx)[order];rw=np.array(roww)[order];rt=np.array(rowtop)[order];rb=np.array(rowbottom)[order]
    x=h[:,0];ow=np.interp(x,rx,rw);ot=np.interp(x,rx,rt);ob=np.interp(x,rx,rb)
    angle=np.arctan2((h[:,2]-(ot+ob)/2)/np.maximum((ot-ob)/2,1e-6),h[:,1]/np.maximum(ow,1e-6))
    nw=np.interp(x,XP,WIDTH);nt=np.interp(x,XP,TOP);nb=np.interp(x,XP,BOTTOM)
    rebuilt=h.copy();rebuilt[:,1]=nw*np.cos(angle);rebuilt[:,2]=(nt+nb)/2+(nt-nb)/2*np.sin(angle)
    base=h.copy();base[:,1]*=.55
    t=smooth(-.104,-.088,x)
    rebuilt=base*(1-t[:,None])+rebuilt*t[:,None]
    rebuilt[-1]=[.04525,0,.003]
    socket=np.exp(-(((x+.006)/.0115)**4+((rebuilt[:,2]-.010)/.012)**4))
    rebuilt[:,1]*=1-.17*socket
    q[ishead]=rebuilt
    def head_deform(v):
        weight=smooth(-.18,-.104,v[:,0])*smooth(-.11,-.035,v[:,2])
        v[:,1]*=1-.45*weight
        return v
    q[parts==2]=head_deform(q[parts==2].copy())
    coords_set(skin.data,world(q));set_colors(skin.data,head_color(q))
    cranial_transition(skin.data,q)
    skin.data.materials[1]=headmat
    skin['species_anatomy_revision']=REV
    skin['head_reference']='Tiutenko & Bates 2026 fig. 11, p.23, NMB R10800; proportions guide, not a specimen scan'
    # Keep existing scale topology and per-scale editing IDs. Lift the lamina
    # slightly above the retained host; do not substitute generic bump scales.
    scales=next(o for o in col.objects if o.get('snake_scale_geometry'))
    sc=arr(scales.data);sq=local(sc);sq=head_deform(sq)
    coords_set(scales.data,world(sq))
    # Cap is refitted to the new cranial envelope without changing its knit.
    for obj in list(col.objects):
        if obj.get('snake_garment')=='cap' and obj.type=='MESH':
            v=local(arr(obj.data));v[:,1]*=.94
            v[:,2]+=.002
            coords_set(obj.data,world(v));obj['anatomy_refit']=REV
        if obj.name.startswith('HouseSnake v12'):
            bpy.data.objects.remove(obj,do_unlink=True)
    # Project every shield onto the edited native skin.
    # Restrict rays to the head and neck. A ventral ray through the coiled
    # whole-body mesh can otherwise hit a distant body loop first.
    bv=BVHTree.FromPolygons([Vector(v) for v in q],[list(p.vertices) for p in skin.data.polygons if all(parts[i]!=0 for i in p.vertices)])
    def project(a,axis=2,side=1):
        p=[0.,0.,0.];other=[i for i in range(3) if i!=axis];p[other[0]],p[other[1]]=a
        if axis==1 and p[0]>=XP[0]:
            p[2]=float(np.clip(p[2],np.interp(p[0],XP,BOTTOM)+.0005,np.interp(p[0],XP,TOP)-.0005))
        p[axis]=side*.5;d=[0.,0.,0.];d[axis]=-side
        hit,n,_,_=bv.ray_cast(Vector(p),Vector(d),1.)
        if hit is None:
            center=float((np.interp(p[0],XP,TOP)+np.interp(p[0],XP,BOTTOM))/2) if axis==1 else 0.
            component=2 if axis==1 else 1
            for _ in range(18):
                p[component]=p[component]*.8+center*.2
                hit,n,_,_=bv.ray_cast(Vector(p),Vector(d),1.)
                if hit is not None:break
        if hit is None:raise ValueError(('Cannot project shield',a,axis,side))
        return hit,n
    shield_count=0
    def patch(label,poly,axis=2,side=1,colorvar=1.):
        nonlocal shield_count
        poly=np.array(poly,float);cent=poly.mean(0)
        # Rounded corners, a narrow flexible seam, and a shallow crowned face.
        perimeter=[]
        for i in range(len(poly)):
            prev=poly[(i-1)%len(poly)];a=poly[i];b=poly[(i+1)%len(poly)]
            entry=a+(prev-a)*.12;out=a+(b-a)*.12;nextentry=b+(a-b)*.12
            for t in np.linspace(0,1,5,endpoint=False):perimeter.append((1-t)**2*entry+2*t*(1-t)*a+t*t*out)
            for t in np.linspace(0,1,8,endpoint=False):perimeter.append(out*(1-t)+nextentry*t)
        perimeter=np.array(perimeter);perimeter=cent+(perimeter-cent)*.998
        colorvar*=.95+.09*((sum((i+1)*ord(c) for i,c in enumerate(label))%997)/996)
        verts=[];cols=[];norms=[];N=len(perimeter);R=12
        for r in range(R+1):
            t=.015+.985*r/R
            for p in cent+(perimeter-cent)*t:
                hit,n=project(p,axis,side);lift=.000045+.000040*(1-t**4)
                pos=np.array(hit)+np.array(n)*lift;verts.append(pos);cols.append(head_color([pos],colorvar)[0]);norms.append(Vector(basis@n))
        faces=[]
        for r in range(R):
            for j in range(N):faces.append((r*N+j,r*N+(j+1)%N,(r+1)*N+(j+1)%N,(r+1)*N+j))
        faces.append(tuple(range(N-1,-1,-1)))
        # Close the scale shell with a shallow underside, rather than leaving
        # open polygon cards over the skin.
        off=len(verts);topfaces=list(faces)
        for r in range(R+1):
            t=.015+.985*r/R
            for p in cent+(perimeter-cent)*t:
                hit,n=project(p,axis,side)
                verts.append(np.array(hit)-np.array(n)*.00008);cols.append(head_color([hit],colorvar*.84)[0]);norms.append(Vector(basis@(-n)))
        faces.extend([tuple(off+k for k in reversed(f)) for f in topfaces])
        for j in range(N):faces.append((R*N+j,R*N+(j+1)%N,off+R*N+(j+1)%N,off+R*N+j))
        ob=mesh_obj('Anatomy · '+pose+' · '+label,world(verts),faces,col,parent,shieldmat,cols)
        ob['head_shield']=label;shield_count+=1
        # Recalculate orientations for the closed patch shell.
        import bmesh
        bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(ob.data);bm.free()
        ob.data.normals_split_custom_set_from_vertices([(Vector(n)*.65+v.normal*.35).normalized() for n,v in zip(norms,ob.data.vertices)])
    # Dorsal shields laid out from the neotype dorsal photograph.
    patch('frontal',[(-.045,0),(-.031,-.012),(-.004,-.012),(.001,0),(-.004,.012),(-.031,.012)])
    for side in [-1,1]:
        def dorsal(name,p):patch(name+(' L' if side<0 else ' R'),[(x,side*y) for x,y in p],colorvar=1+.025*side)
        dorsal('parietal',[(-.093,.004),(-.082,.029),(-.044,.031),(-.030,.012),(-.045,0),(-.082,0)])
        dorsal('supraocular',[(-.030,.012),(-.004,.012),(.002,.022),(-.012,.027),(-.033,.030)])
        dorsal('prefrontal',[(-.004,0),(.019,0),(.024,.014),(.014,.022),(.002,.022),(-.004,.012)])
        dorsal('internasal',[(.019,0),(.034,0),(.038,.009),(.030,.016),(.024,.014)])
        # Temporal region and loreal/nasal plates seen in the lateral view.
        for label,poly in [
          ('anterior temporal',[(-.045,.003),(-.022,.002),(-.020,.016),(-.039,.018)]),
          ('posterior temporal upper',[(-.082,.009),(-.062,.018),(-.039,.018),(-.045,.003),(-.072,.001)]),
          ('posterior temporal lower',[(-.091,-.008),(-.072,.001),(-.045,.003),(-.040,-.006),(-.071,-.009)]),
          ('loreal',[(.008,.002),(.023,.003),(.024,.012),(.014,.016),(.006,.015)]),
          ('anterior nasal',[(.028,.001),(.039,.001),(.041,.006),(.034,.012),(.027,.010)]),
          ('posterior nasal',[(.023,.003),(.028,.001),(.027,.010),(.024,.012)])]:
            patch(label+str(side),poly,1,side)
        # Two postoculars, two preoculars with an actual circular orbital edge.
        ex,ez,er=-.006,.010,.0111
        for name,a0,a1,extent in [('preocular upper',-.1,1.1,.003),('preocular lower',-1.15,-.1,.0025),('postocular upper',1.9,3.14,.003),('postocular lower',3.14,4.2,.0025)]:
            aa=np.linspace(a0,a1,10)
            inner=[(ex+er*math.cos(a),ez+er*math.sin(a)) for a in aa]
            outer=[(ex+(er+extent)*math.cos(a),ez+(er+extent)*math.sin(a)) for a in aa[::-1]]
            patch(name+str(side),inner+outer,1,side)
        bounds=[.043,.033,.023,.013,-.004,-.020,-.040,-.063,-.095]
        for k in range(8):
            a,b=bounds[k:k+2];topedge=[]
            for x in np.linspace(a,b,10):
                zz=.0025
                if abs(x-ex)<er:zz=ez-math.sqrt(max(0,er*er-(x-ex)**2))-.00025
                topedge.append((x,zz))
            # Keep the lips on the lateral jaw. Fixed z offsets fold the
            # anterior infralabials across the chin as the snout narrows.
            jaw=lambda x: np.interp(x,XP,BOTTOM)+.28*(np.interp(x,XP,TOP)-np.interp(x,XP,BOTTOM))
            patch('supralabial '+str(k+1)+' '+str(side),topedge+[(b,jaw(b)),(a,jaw(a))],1,side)
            low=lambda x: np.interp(x,XP,BOTTOM)+.16*(np.interp(x,XP,TOP)-np.interp(x,XP,BOTTOM))
            patch('infralabial '+str(k+1)+' '+str(side),[(a,jaw(a)-.0004),(b,jaw(b)-.0004),(b,low(b)),(a,low(a))],1,side,.96)
        # Restrained closed mouth groove follows the actual lip surface.
        mouth=[]
        for x in np.linspace(-.094,.042,85):
            z=np.interp(x,XP,BOTTOM)+.28*(np.interp(x,XP,TOP)-np.interp(x,XP,BOTTOM))
            hit,n=project((x,z),1,side);mouth.append(np.array(hit)+np.array(n)*.00012)
        curve_obj('Anatomy · '+pose+' · closed mouth '+str(side),world(mouth),.00010,col,parent,darkmat)
        # A recessed, shallow iris behind the curved transparent spectacle.
        n=Vector((.10,side,.14)).normalized();hx=Vector((1,0,0));hx=(hx-n*hx.dot(n)).normalized();vz=n.cross(hx).normalized()
        if vz.z<0:vz=-vz
        ctr=Vector((ex,side*.0165,ez));rad=.0110
        def eye_surface(u,v,offset=0):
            rr=u*u+v*v
            return ctr+hx*u+vz*v+n*(.0073+.00055*rr/(rad*rad)+offset)
        verts=[];colors=[];faces=[];N=256;R=28
        for r in range(R+1):
            rho=.000001+.0108*r/R
            for j in range(N):
                a=2*math.pi*j/N;u=rho*math.cos(a);v=rho*math.sin(a);verts.append(eye_surface(u,v))
                speck=.76+.14*math.sin(a*47+rho*2930)+.09*math.sin(a*91-rho*1940)+.06*math.sin(a*117+rho*7400)
                c=np.array([.115,.057,.027])*speck
                if r>R-2:c*=.52
                colors.append(c)
        for r in range(R):
            for j in range(N):faces.append((r*N+j,r*N+(j+1)%N,(r+1)*N+(j+1)%N,(r+1)*N+j))
        if side<0:faces=[tuple(reversed(f)) for f in faces]
        mesh_obj('Anatomy · '+pose+' · spherical iris '+str(side),world(verts),faces,col,parent,eye_mat,colors)
        pv=[];pf=[];NR=12;NN=72
        for r in range(NR+1):
            t=.0001+(1-.0001)*r/NR
            for j in range(NN):
                a=2*math.pi*j/NN;u=.0011*t*math.cos(a);v=.0078*t*math.sin(a);pv.append(eye_surface(u,v,.000025))
        for r in range(NR):
            for j in range(NN):pf.append((r*NN+j,r*NN+(j+1)%NN,(r+1)*NN+(j+1)%NN,(r+1)*NN+j))
        if side<0:pf=[tuple(reversed(f)) for f in pf]
        mesh_obj('Anatomy · '+pose+' · vertical pupil '+str(side),world(pv),pf,col,parent,pupilmat)
        sv=[]
        for r in range(R+1):
            rho=.000001+.0108*r/R
            for j in range(N):
                a=2*math.pi*j/N;u=rho*math.cos(a);v=rho*math.sin(a)
                sv.append(ctr+hx*u+vz*v+n*(.0080+.0025*(1-(rho/.010801)**2)))
        mesh_obj('Anatomy · '+pose+' · transparent spectacle '+str(side),world(sv),faces,col,parent,spectaclemat)
        # Dark nostril opening, within a nasal plate, without heat pits.
        hit,norm=project((.031,.006),1,side);nv=[np.array(hit)+np.array(norm)*.00024];nf=[]
        for j in range(48):
            a=2*math.pi*j/48;h2,n2=project((.031+.0015*math.cos(a),.006+.00085*math.sin(a)),1,side);nv.append(np.array(h2)+np.array(n2)*.00024)
        for j in range(48):nf.append((0,j+1,(j+1)%48+1))
        mesh_obj('Anatomy · '+pose+' · nostril '+str(side),world(nv),nf,col,parent,darkmat)
    # Paired chin shields remain inspectable underneath the clothes.
    for side in [-1,1]:
        for label,poly in [('anterior chin',[(.029,.0002),(.028,.012),(-.010,.019),(-.018,.0002)]),('posterior chin',[(-.018,.004),(-.010,.019),(-.041,.024),(-.057,.009)])]:
            patch(label+str(side),[(x,side*y*.92) for x,y in poly],2,-1,.96)
    # Small gular scales between the posterior chin shields and the first
    # broad ventral scutes, rather than a bare underside behind the jaw.
    for row,x in enumerate(np.linspace(-.091,-.061,5)):
        for j in range(5):
            y=(j-2+.32*(row%2))*.008
            patch('gular '+str(row)+' '+str(j),[(x-.0026,y-.0041),(x+.0026,y-.0041),(x+.0041,y),(x+.0026,y+.0041),(x-.0026,y+.0041),(x-.0041,y)],2,-1,.96)
    for row,x in enumerate([-.052,-.042,-.032]):
        patch('median gular '+str(row),[(x-.0048,-.005),(x+.0048,-.003),(x+.0048,.003),(x-.0048,.005)],2,-1,.96)
    patch('mental',[(.031,-.008),(.041,-.005),(.043,0),(.041,.005),(.031,.008)],2,-1)
    patch('rostral',[(.035,-.011),(.042,-.008),(.044,0),(.042,.008),(.035,.011)])
    for row,x in enumerate([-.109,-.102,-.095]):
        for j in range(7):
            y=(j-3+.35*(row%2))*.006
            patch('occipital transition '+str(row)+' '+str(j),[(x-.004,y),(x-.002,y-.0032),(x+.002,y-.0032),(x+.004,y),(x+.002,y+.0032),(x-.002,y+.0032)])
    if pose=='tongue':
        tm=mat('Anatomy · muted forked tongue',(.085,.017,.021),.30)
        for lab,points,radius in [('stem',[(.042,0,-.006),(.053,0,-.007),(.068,0,-.006)],.0009),('fork L',[(.066,0,-.006),(.077,-.003,-.005),(.084,-.006,-.004)],.00045),('fork R',[(.066,0,-.006),(.078,.003,-.005),(.085,.006,-.003)],.00045)]:
            curve_obj('Anatomy · tongue · '+lab,world(points),radius,col,parent,tm)
    ventral_scutes(skin,col,parent,ventmat)
    col['anatomy_revision']=REV;col['head_shield_objects']=shield_count
    col['head_anatomy_sculpt']=REV
    skin['continuous_skin_revision']=REV
    for key in ['continuous_skin_report','embedded_body_repair_report']:
        if key in skin:del skin[key]
    print('REFINED',pose,shield_count,flush=True)


def main():
    p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
    a=p.parse_args(sys.argv[sys.argv.index('--')+1:]);bpy.ops.wm.open_mainfile(filepath=str(a.source))
    if bpy.context.scene.get('species_anatomy_revision'):raise ValueError('Use the unmodified baseline, not an already refined file.')
    body_materials()
    headmat=pigment_material('Anatomy · flexible cranial skin',.34);shieldmat=pigment_material('Anatomy · smooth cranial shields',.32)
    eye_mat,spec=eye_materials();pupilmat=mat('Anatomy · black pupil',(.0012,.0008,.0006),.65)
    pupilmat.node_tree.nodes.get('Principled BSDF').inputs['Specular IOR Level'].default_value=0
    pupilmat.node_tree.nodes.get('Principled BSDF').inputs['Coat Weight'].default_value=0
    darkmat=mat('Anatomy · natural recess',(.013,.006,.003),.37)
    vent=pigment_material('Anatomy · pearl ventral scutes',.27)
    for pose in ['normal','curious','away','tongue']:refine_pose(pose,headmat,shieldmat,eye_mat,pupilmat,spec,darkmat,vent)
    bpy.context.scene['species_anatomy_revision']=REV
    bpy.context.scene['complete_skin_revision']=REV
    bpy.context.scene['anatomical_reference']='Tiutenko & Bates 2026, Fig.11 and p.23; ASI live Boaedon capensis photos'
    for pose in ['normal','curious','away','tongue']:
        c=bpy.data.collections['Snake · '+pose];c.hide_render=pose!='normal';c.hide_viewport=pose!='normal'
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(a.output),compress=True)
    print('SAVED',a.output,flush=True)

if __name__=='__main__':main()
