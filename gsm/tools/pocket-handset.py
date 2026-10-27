#!/usr/bin/env python3
"""Native Blender pocket device: rounded low-poly ABS and original gecko keys.

blender -b --python gsm/tools/pocket-handset.py -- --theme leopard
The paint images are authored here as exact pixel clusters and packed in .blend.
"""
import argparse
import json
import math
import sys
from pathlib import Path
import bpy
import bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
import pocket_gecko_charm
from gecko_species_paint import PALETTES, paint as species_paint


def rgba(value):
    rgb=[int(value.lstrip('#')[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb)+(1,)


def pigment_mix(a,b,amount):
    return ''.join(f'{round(int(a[i:i+2],16)*(1-amount)+int(b[i:i+2],16)*amount):02x}' for i in (0,2,4))


def matte(name,hex_color,texture=None):
    """Real molded plastic leads; a small grouped-color fill retains pixel paint."""
    material=bpy.data.materials.new(name)
    material.use_nodes=True
    material.diffuse_color=rgba(hex_color)
    nodes,links=material.node_tree.nodes,material.node_tree.links
    nodes.clear()
    diffuse=nodes.new('ShaderNodeBsdfDiffuse');diffuse.inputs['Color'].default_value=(.8,.8,.8,1)
    rgb=nodes.new('ShaderNodeShaderToRGB');links.new(diffuse.outputs[0],rgb.inputs[0])
    ramp=nodes.new('ShaderNodeValToRGB');ramp.name='Grouped low-poly light and shade'
    ramp.color_ramp.interpolation='CONSTANT'
    ramp.color_ramp.elements[0].position=.0;ramp.color_ramp.elements[0].color=(.40,.45,.46,1)
    ramp.color_ramp.elements[1].position=.48;ramp.color_ramp.elements[1].color=(1,1,1,1)
    ramp.color_ramp.elements.new(.12).color=(.60,.65,.65,1)
    ramp.color_ramp.elements.new(.25).color=(.80,.84,.82,1)
    ramp.color_ramp.elements.new(.68).color=(1.04,1.04,1.02,1)
    links.new(rgb.outputs['Color'],ramp.inputs[0])
    mix=nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1
    mix.inputs[1].default_value=rgba(hex_color)
    links.new(ramp.outputs['Color'],mix.inputs[2])
    if texture:
        uv=nodes.new('ShaderNodeTexCoord')
        sep=nodes.new('ShaderNodeSeparateXYZ');links.new(uv.outputs['Object'],sep.inputs[0])
        combine=nodes.new('ShaderNodeCombineXYZ')
        for axis,size in [('X',texture['body'][0]),('Y',texture['body'][1])]:
            scale=nodes.new('ShaderNodeMath');scale.operation='MULTIPLY_ADD'
            scale.inputs[1].default_value=1/size;scale.inputs[2].default_value=.5
            links.new(sep.outputs[axis],scale.inputs[0]);links.new(scale.outputs[0],combine.inputs[axis])
        image=nodes.new('ShaderNodeTexImage');image.image=texture['image'];image.interpolation='Closest';image.extension='EXTEND'
        image.name='Native pixel paint at 2.5 logical units per texel'
        links.new(combine.outputs[0],image.inputs['Vector']);links.new(image.outputs['Color'],mix.inputs[1])
    emit=nodes.new('ShaderNodeEmission');links.new(mix.outputs[0],emit.inputs[0])
    # Real diffuse and specular response reveal the entire convex cover. The
    # grouped illustration color is only a restrained fill, never a flat overlay.
    plastic=nodes.new('ShaderNodeBsdfPrincipled');plastic.name='Satin molded ABS reflection'
    plastic.inputs['Base Color'].default_value=rgba(hex_color)
    if texture:links.new(image.outputs['Color'],plastic.inputs['Base Color'])
    plastic.inputs['Metallic'].default_value=0
    soft='contact' in name or 'collar' in name
    key='key' in name and not soft
    hood='hood' in name
    rear='rear' in name
    casing='painted ABS' in name
    roughness=.64 if soft else (.28 if key else (.49 if hood else (.46 if rear else (.37 if casing else .40))))
    plastic.inputs['Roughness'].default_value=roughness
    plastic.inputs['IOR'].default_value=1.47
    plastic.inputs['Specular IOR Level'].default_value=.47 if casing else .50
    plastic.inputs['Coat Weight'].default_value=.075 if key else (0 if soft or hood else (.065 if casing else .035))
    plastic.inputs['Coat Roughness'].default_value=.34 if casing else .30
    # Injection texture changes only reflection at a sub-pixel scale. Pigment
    # and all original bitmap cells remain untouched.
    grain=nodes.new('ShaderNodeTexNoise');grain.name='Fine molded polymer reflection'
    grain.inputs['Scale'].default_value=145 if casing else 95;grain.inputs['Detail'].default_value=2
    rough=nodes.new('ShaderNodeMapRange');rough.name='Quiet satin roughness variation'
    rough.inputs['From Min'].default_value=.2;rough.inputs['From Max'].default_value=.8
    rough.inputs['To Min'].default_value=roughness-.02;rough.inputs['To Max'].default_value=roughness+.02
    links.new(grain.outputs['Fac'],rough.inputs[0]);links.new(rough.outputs[0],plastic.inputs['Roughness'])
    if casing:
        # Slow changes in reflection describe aged ABS without tinting the
        # pigment or laying photographic grain over the low-poly model.
        weather=nodes.new('ShaderNodeTexNoise');weather.name='Old ABS broad reflection variation'
        weather.noise_dimensions='4D';weather.inputs['Scale'].default_value=3.0
        weather.inputs['Detail'].default_value=2;weather.inputs['W'].default_value=list(PALETTES).index(name.split()[0])*.83
        weather_range=nodes.new('ShaderNodeMapRange');weather_range.name='Subtle uneven satin wear'
        weather_range.inputs['To Min'].default_value=-.018;weather_range.inputs['To Max'].default_value=.030
        links.new(weather.outputs['Fac'],weather_range.inputs[0])
        worn=nodes.new('ShaderNodeMath');worn.operation='ADD'
        links.new(rough.outputs[0],worn.inputs[0]);links.new(weather_range.outputs[0],worn.inputs[1])
        coordinate=nodes.new('ShaderNodeTexCoord');coordinate.name='Physical casing wear positions'
        for cx,cy,wx,wy in [(-2.12,.15,.34,1.10),(2.10,-.45,.32,.95),(-.50,-2.97,.70,.25)]:
            delta=nodes.new('ShaderNodeVectorMath');delta.operation='SUBTRACT';delta.inputs[1].default_value=(cx,cy,0)
            links.new(coordinate.outputs['Object'],delta.inputs[0])
            scale=nodes.new('ShaderNodeVectorMath');scale.operation='MULTIPLY';scale.inputs[1].default_value=(1/wx,1/wy,0)
            links.new(delta.outputs[0],scale.inputs[0])
            length=nodes.new('ShaderNodeVectorMath');length.operation='LENGTH';links.new(scale.outputs[0],length.inputs[0])
            polished=nodes.new('ShaderNodeMapRange');polished.name='Soft handling polish'
            polished.clamp=True;polished.inputs['From Min'].default_value=.15;polished.inputs['From Max'].default_value=1.0
            polished.inputs['To Min'].default_value=.075;polished.inputs['To Max'].default_value=0
            links.new(length.outputs['Value'],polished.inputs[0])
            reduced=nodes.new('ShaderNodeMath');reduced.operation='SUBTRACT'
            links.new(worn.outputs[0],reduced.inputs[0]);links.new(polished.outputs[0],reduced.inputs[1]);worn=reduced
        links.new(worn.outputs[0],plastic.inputs['Roughness'])
    if not soft:
        bump=nodes.new('ShaderNodeBump');bump.name='Barely visible molded ABS grain'
        bump.inputs['Strength'].default_value=.10 if casing else .08;bump.inputs['Distance'].default_value=.0012 if casing else .0007
        links.new(grain.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs[0],plastic.inputs['Normal'])
    add=nodes.new('ShaderNodeMixShader');add.name='Physical plastic with quiet illustration fill'
    add.inputs[0].default_value=.96 if casing else .93
    links.new(emit.outputs[0],add.inputs[1]);links.new(plastic.outputs[0],add.inputs[2])
    out=nodes.new('ShaderNodeOutputMaterial');links.new(add.outputs[0],out.inputs['Surface'])
    return material


def flat(name,color):
    mat=bpy.data.materials.new(name);mat.use_nodes=True;mat.diffuse_color=rgba(color)
    nodes=mat.node_tree.nodes;nodes.clear();e=nodes.new('ShaderNodeEmission');e.inputs[0].default_value=rgba(color)
    out=nodes.new('ShaderNodeOutputMaterial');mat.node_tree.links.new(e.outputs[0],out.inputs[0])
    return mat


def contour(w,h,rx,ry=None,cx=0,cy=0,body=False):
    ry=rx if ry is None else ry
    rx,ry=min(rx,w/2-.002),min(ry,h/2-.002)
    corners=[(w/2-rx,h/2-ry,0),(-w/2+rx,h/2-ry,90),(-w/2+rx,-h/2+ry,180),(w/2-rx,-h/2+ry,270)]
    points=[]
    for i,(x,y,a) in enumerate(corners):
        for j in range(7):
            angle=math.radians(a+j*15)
            points.append((cx+x+rx*math.cos(angle),cy+y+ry*math.sin(angle)))
        ex,ey=points[-1];nx,ny,na=corners[(i+1)%4]
        sx,sy=cx+nx+rx*math.cos(math.radians(na)),cy+ny+ry*math.sin(math.radians(na))
        points.append(((ex+sx)/2,(ey+sy)/2))
    if body:
        points=[(x*(1-.035*max(0,-(y-cy)/(h/2))),y+.04*(1-(x/(w/2))**2)*max(0,(y-cy)/(h/2))**4) for x,y in points]
    return points


def mesh_rings(name,levels,mat,closed=False,cap=False):
    n=len(levels[0][0]);verts=[(x,y,z(x,y) if callable(z) else z) for points,z in levels for x,y in points];faces=[]
    for row in range(len(levels)-1):
        for i in range(n):
            j=(i+1)%n;faces.append((row*n+i,row*n+j,(row+1)*n+j,(row+1)*n+i))
    if closed:
        for i in range(n):
            j=(i+1)%n;faces.append(((len(levels)-1)*n+i,(len(levels)-1)*n+j,j,i))
    if cap:
        faces.extend([tuple(range(n-1,-1,-1)),tuple((len(levels)-1)*n+i for i in range(n))])
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(mesh);bm.free()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);mesh.materials.append(mat)
    return obj


def pill(name,w,h,r,cx,cy,z,mat,depth=.045):
    return mesh_rings(name,[(contour(w,h,r,cx=cx,cy=cy),z-depth),
                            (contour(w-.025,h-.025,max(.015,r-.012),cx=cx,cy=cy),z)],mat,cap=True)


def polygon(name,points,z,mat):
    mesh=bpy.data.meshes.new(name);mesh.from_pydata([(x,y,z(x,y) if callable(z) else z) for x,y in points],[],[tuple(range(len(points)))]);mesh.update()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);mesh.materials.append(mat)
    return obj


def surface_normals(obj,angle=55):
    """Soft molded surfaces, with hard seams and recess walls still distinct."""
    bm=bmesh.new();bm.from_mesh(obj.data)
    for face in bm.faces:face.smooth=True
    for edge in bm.edges:
        edge.smooth=len(edge.link_faces)==2 and edge.calc_face_angle(0)<math.radians(angle)
    bm.to_mesh(obj.data);bm.free();obj.data.update()


def pixel_paint(theme,W,H,surface='shell'):
    tw,th=(64,112) if surface=='charm' else (round(W*40),round(H*40))
    image=bpy.data.images.new(('Charm ' if surface=='charm' else 'Shell ')+'species pigment '+theme,width=tw,height=th,alpha=True)
    image.colorspace_settings.name='Non-Color'
    image.pixels=[component for color in species_paint(theme,tw,th,surface) for component in rgba(color)]
    image.pack()
    return dict(image=image,body=(.9,1.65) if surface=='charm' else (W,H))


def mark(cap,rows,cx,cy,width,mat):
    assert len(rows)==16 and all(len(row)==16 for row in rows)
    bvh=BVHTree.FromObject(cap,bpy.context.evaluated_depsgraph_get());cell=width/16;verts=[];faces=[]
    for y,row in enumerate(rows):
        for x,value in enumerate(row):
            if value!='#':continue
            # Small patches follow the physical dome inside each original pixel.
            # One large quad can sink through a convex cap between its corners.
            # This adds no pixels or gaps: every original cell keeps exact XY.
            subdivisions=4
            for sy in range(subdivisions):
                for sx in range(subdivisions):
                    points=[]
                    for dx,dy in [(0,0),(1,0),(1,1),(0,1)]:
                        xx=cx+(x+(sx+dx)/subdivisions-8)*cell
                        yy=cy+(8-y-(sy+dy)/subdivisions)*cell
                        hit,normal,_,_=bvh.ray_cast(Vector((xx,yy,3)),Vector((0,0,-1)))
                        if hit is None:raise ValueError('Printed key symbol leaves physical cap')
                        points.append(Vector((xx,yy,hit.z+.004)))
                    k=len(verts);verts.extend(points);faces.append((k,k+1,k+2,k+3))
    mesh=bpy.data.meshes.new('Native pixel icon');mesh.from_pydata(verts,[],faces);mesh.materials.append(mat)
    obj=bpy.data.objects.new('Printed tactile key icon',mesh);bpy.context.collection.objects.link(obj)


def build(wide,mats):
    W,H=(6.2,4.1) if wide else (4.8,6.4)
    sw,sh,top=(5.34,2.58,.50) if wide else (3.56,4.2,.79)
    scy=H/2-top-sh/2;rx,ry=(1.20,1.10) if wide else (1.82,1.96)
    # A deeper rear half and narrow seam support a swollen front cover.
    outer=contour(W,H,rx,ry,body=not wide)
    inner=contour(sw,sh,.12,cy=scy)
    mesh_rings('Dark rear polymer bumper',[
        (contour(W-.13,H-.13,rx-.06,ry-.06,body=not wide),-.74),
        (outer,-.39),(outer,-.075),(inner,-.075),(inner,-.74)],mats['rear'],closed=True)
    joint=contour(W-.035,H-.035,rx-.015,ry-.015,body=not wide)
    hole=contour(sw+.02,sh+.02,.13,cy=scy)
    # Curve the broad painted annulus itself, not just the outermost few pixels.
    # Its endpoints preserve the silhouette and the exact browser aperture.
    dome=[]
    for t in [0,.12,.28,.45,.62,.80,.94,1]:
        points=[(ox+(ix-ox)*t,oy+(iy-oy)*t) for (ox,oy),(ix,iy) in zip(joint,hole)]
        height=-.05*(1-t)+.64*t+.63*math.sin(math.pi*t)
        dome.append((points,height))
    body=mesh_rings('One piece painted front cover',dome+[(inner,.29),(inner,-.60)],mats['body'],closed=True)
    skin=BVHTree.FromObject(body,bpy.context.evaluated_depsgraph_get())
    def front_height(x,y):
        hit,_,_,_=skin.ray_cast(Vector((x,y,3)),Vector((0,0,-1)))
        return hit.z if hit is not None else .64
    # The lens sits well below a rounded plastic hood, with a shaded inner lip.
    hood_outer=contour(sw+.20,sh+.20,.23,cy=scy)
    hood_inner=contour(sw-.12,sh-.13,.07,cx=-.01,cy=scy-.015)
    hood=mesh_rings('Slate display hood',[(hood_outer,lambda x,y:front_height(x,y)+.015),
                                   (contour(sw+.14,sh+.14,.20,cy=scy),.80),
                                   (contour(sw-.04,sh-.04,.11,cy=scy),.80),(hood_inner,.37),(hood_inner,.18),
                                   (hood_outer,.18)],mats['hood'],closed=True)
    surface_normals(hood,40)
    hood_bvh=BVHTree.FromObject(hood,bpy.context.evaluated_depsgraph_get())
    def hood_height(x,y):
        hit,_,_,_=hood_bvh.ray_cast(Vector((x,y,3)),Vector((0,0,-1)))
        return hit.z+.002 if hit is not None else .80
    # A short stepped glass highlight belongs to the bezel, not the whole device.
    y=scy+sh/2+.055
    polygon('Short bezel reflection',[(-sw/2+.17,y),(-sw/2+1.05,y),(-sw/2+1.05,y+.018),
                                      (-sw/2+.36,y+.018),(-sw/2+.36,y+.033),(-sw/2+.17,y+.033)],hood_height,mats['highlight'])
    brand=json.loads((HERE.parent/'brand.mjs').read_text().split('=',1)[1].strip().rstrip(';'))
    # These are the production originals: left gaze, front gaze, right gaze.
    # Never substitute navigation pictograms for the author's approved artwork.
    original_marks=[variant['rows'] for variant in brand['avatarVariants'][:3]]
    centers=[(-.88,-1.47),(0,-1.43),(.88,-1.47)] if wide else [(-1.08,-2.48),(0,-2.37),(1.08,-2.48)]
    for i,((cx,cy),identifier,rows) in enumerate(zip(centers,['home','stream','settings'],original_marks)):
        w,h=((.71,.42) if i!=1 else (.80,.51)) if wide else ((.78,.42) if i!=1 else (.84,.56))
        r=min(h,w)*.48
        seat=front_height(cx,cy)
        # An actual recess provides a dark throat beneath each raised cap.
        cutter=pill('Temporary key recess',w+.10,h+.10,r+.05,cx,cy,seat+1,mats['shadow'],1.55)
        bpy.context.view_layer.objects.active=body
        mod=body.modifiers.new('Molded key well','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
        bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
        mesh_rings(identifier+' rounded recess collar',[
            (contour(w+.12,h+.12,r+.06,cx=cx,cy=cy),lambda x,y:front_height(x,y)+.012),
            (contour(w+.07,h+.07,r+.035,cx=cx,cy=cy),lambda x,y:front_height(x,y)+.035),
            (contour(w+.025,h+.025,r+.012,cx=cx,cy=cy),seat-.31)],mats['collar'])
        pill(identifier+' dark travel socket',w+.025,h+.025,r+.012,cx,cy,seat-.32,mats['shadow'],.035)
        cap_rings=[]
        for fraction,height in [(0,-.20),(0,.04),(.12,.26),(.35,.45),(.62,.57),(.84,.63),(.93,.65)]:
            inset=r*fraction
            cap_rings.append((contour(w-2*inset,h-2*inset,max(.012,r-inset),cx=cx,cy=cy),seat+height))
        cap=mesh_rings(identifier+' tactile key',cap_rings,mats['center'] if i==1 else mats['key'],cap=True)
        for face in cap.data.polygons:face.use_smooth=True
        cap.data.polygons[-2].use_smooth=False
        mark(cap,rows,cx,cy,.32 if wide else (.43 if i==1 else .33),mats['light-ink'] if i==1 else mats['ink'])
    # Each small opening follows the original skin at every vertex, so hardware
    # is sunk into the molding rather than drawn as floating straight strokes.
    def recess(name,w,h,r,cx,cy,depth=.11):
        points=contour(w,h,r,cx=cx,cy=cy)
        cutter=mesh_rings('Temporary '+name+' cutter',[
            (points,lambda x,y:front_height(x,y)+.10),
            (points,lambda x,y:front_height(x,y)-depth)],mats['shadow'],cap=True)
        bpy.context.view_layer.objects.active=body
        mod=body.modifiers.new(name+' molded recess','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
        bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
        polygon(name+' cavity backing',
            contour(w-.012,h-.008,max(.003,r-.004),cx=cx,cy=cy),
            lambda x,y:front_height(x,y)-depth+.004,mats['shadow'])
        lip=mesh_rings(name+' small molded lip',[
            (contour(w+.012,h+.010,r+.005,cx=cx,cy=cy),lambda x,y:front_height(x,y)+.0015),
            (contour(w-.012,h-.008,max(.003,r-.004),cx=cx,cy=cy),lambda x,y:front_height(x,y)-.022)],mats['body'])
        surface_normals(lip,55)
    if not wide:
        recess('Inset lanyard slot',.26,.10,.045,1.35,2.75)
        recess('Amber lens socket',.145,.066,.025,-1.15,2.75,.07)
        mesh_rings('Small amber status lens',[
            (contour(.13,.055,.020,cx=-1.15,cy=2.75),lambda x,y:front_height(x,y)-.035),
            (contour(.11,.038,.015,cx=-1.15,cy=2.75),lambda x,y:front_height(x,y)-.008)],mats['amber'],cap=True)
        # Three restrained speaker slots at the heel, outside the control targets.
        for i in range(3):
            x=.80+i*.16
            recess('Lower speaker opening',.12,.025,.009,x,-2.90,.07)
        # A little raised two-tone slider sits flush with the left shoulder.
        recess('Recessed shoulder switch',.25,.09,.03,-1.43,2.76,.08)
        mesh_rings('Switch toggle',[
            (contour(.11,.065,.02,cx=-1.47,cy=2.76),lambda x,y:front_height(x,y)-.018),
            (contour(.09,.045,.015,cx=-1.47,cy=2.76),lambda x,y:front_height(x,y)+.028)],mats['key'],cap=True)
    if wide:
        # Landscape uses the same shoulder attachment, outside the glass.
        recess('Charm inset landscape lanyard slot',.23,.085,.035,2.30,1.72)
    surface_normals(body,55)
    # Short shallow rubs follow the real curved cover. The larger undisturbed
    # plastic surfaces carry the finish; wear is confined to handling areas.
    rubs=[(-2.91,.58,.075,.022),(-.52,1.84,.105,-.010),(1.96,-1.72,.090,.014)] if wide else [(-2.10,1.48,.065,.030),(-.48,2.98,.105,-.010),(-.48,-2.99,.090,.014)]
    for index,(cx,cy,dx,dy) in enumerate(rubs):
        for line in range(2 if index!=1 else 1):
            vertices=[];faces=[];valid=True
            for step in range(9):
                t=step/8
                for side in [-1,1]:
                    x=cx+dx*t;y=cy+dy*t+line*.020+side*.0030
                    hit,_,_,_=skin.ray_cast(Vector((x,y,3)),Vector((0,0,-1)))
                    if hit is None:valid=False;break
                    vertices.append((x,y,hit.z+.003))
                if not valid:break
                if step:faces.append((step*2-2,step*2,step*2+1,step*2-1))
            if valid:
                mesh=bpy.data.meshes.new('Shallow plastic handling rub');mesh.from_pydata(vertices,[],faces);mesh.update();mesh.materials.append(mats['rub'])
                obj=bpy.data.objects.new('Quiet casing scuff',mesh);bpy.context.collection.objects.link(obj)
    return W,H,front_height


def setup(W,H,args):
    scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE_NEXT';scene.eevee.taa_render_samples=args.samples
    scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.4,.4,.4,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
    scene.eevee.use_raytracing=True;scene.eevee.use_fast_gi=True
    scene.eevee.fast_gi_method='AMBIENT_OCCLUSION_ONLY';scene.eevee.fast_gi_distance=.18
    light=bpy.data.lights.new('Broad upper left illustration light','AREA');light.energy=530;light.shape='DISK';light.size=4.1
    obj=bpy.data.objects.new(light.name,light);bpy.context.collection.objects.link(obj);obj.location=(-4.3,3.7,6)
    obj.rotation_euler=(Vector((0,0,0))-obj.location).to_track_quat('-Z','Y').to_euler()
    edge=bpy.data.lights.new('Soft vertical window reflection','AREA');edge.energy=45;edge.shape='RECTANGLE';edge.size=2.8;edge.size_y=4
    obj=bpy.data.objects.new(edge.name,edge);bpy.context.collection.objects.link(obj);obj.location=(3.2,1,4)
    obj.rotation_euler=(Vector((0,0,.3))-obj.location).to_track_quat('-Z','Y').to_euler()
    fill=bpy.data.lights.new('Weak frontal plastic fill','AREA');fill.energy=110;fill.shape='DISK';fill.size=5
    obj=bpy.data.objects.new(fill.name,fill);bpy.context.collection.objects.link(obj);obj.location=(-.5,-3,6.5)
    obj.rotation_euler=(Vector((0,0,.3))-obj.location).to_track_quat('-Z','Y').to_euler()
    data=bpy.data.cameras.new('Front orthographic alignment');camera=bpy.data.objects.new(data.name,data);bpy.context.collection.objects.link(camera)
    wide=W>H
    canvas_w,canvas_h=(W+2.4,H+1.2) if wide else (W+.8,H+1.8)
    camera.location=(0,.20 if wide else .50,12);data.type='ORTHO';data.ortho_scale=max(canvas_w,canvas_h);scene.camera=camera
    scene.render.resolution_x=round(canvas_w*100*args.factor);scene.render.resolution_y=round(canvas_h*100*args.factor)
    scene.render.resolution_percentage=100;scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
    scene.render.threads_mode='FIXED';scene.render.threads=8
    scene.view_settings.view_transform='Standard';scene.view_settings.look='None'
    scene.render.image_settings.compression=20
    return scene


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--theme',action='append',choices=list(PALETTES));parser.add_argument('--wide',action='store_true')
    parser.add_argument('--all-orientations',action='store_true');parser.add_argument('--factor',type=float,default=2);parser.add_argument('--samples',type=int,default=32)
    parser.add_argument('--output',type=Path,default=Path('/tmp/gsm-pocket-renders'))
    parser.add_argument('--source-dir',type=Path,default=HERE/'pocket-handset-source')
    args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []);args.output.mkdir(exist_ok=True,parents=True)
    source=args.source_dir;source.mkdir(exist_ok=True,parents=True);bpy.context.preferences.filepaths.save_version=0
    for wide in ([False,True] if args.all_orientations else [args.wide]):
        bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
        W,H=(6.2,4.1) if wide else (4.8,6.4)
        catalog={}
        for theme,p in PALETTES.items():
            catalog[theme]={
             'body':matte(theme+' painted ABS',p['base'],pixel_paint(theme,W,H)),
             'rear':matte(theme+' rear bumper',p['rear']),
             'key':matte(theme+' pale tactile keys',p['key']),
             'center':matte(theme+' central key',p['center']),
             'ink':flat(theme+' dark screen print',p['ink']),
             'light-ink':flat(theme+' central key pigment',p['light']),
             'hood':matte(theme+' slate display hood','59645b'),
             'collar':matte(theme+' soft key collar','49524c'),
             'shadow':flat(theme+' deep contact shadow','343f3c'),
             'highlight':flat(theme+' short edge highlights',p['light']),
             'amber':flat(theme+' old amber lens','c1a267'),
             'rub':matte(theme+' shallow worn polymer',pigment_mix(p['base'],p['light'],.45))}
            catalog[theme].update({
             'charm-body':matte(theme+' charm soft molded gecko',p['base'],pixel_paint(theme,W,H,'charm')),
             'charm-edge':matte(theme+' charm molded eyelet',p['shade']),
             'charm-eye':matte(theme+' charm cream eye inlay',p['light']),
             'charm-ink':flat(theme+' charm eye and mouth inlay',p['ink']),
             'charm-cord':matte(theme+' charm soft contact strap',p['ink']),
             'charm-ring':matte(theme+' charm aged split ring','98998b'),
             'charm-iris':matte(theme+' charm iris',{'day':'b89c48','electric':'9c8b45','mossy':'9c9b6f','stone':'a9a06b'}.get(theme,'b39d60')),
             'charm-claw':matte(theme+' charm keratin claw',p['pale']),
             'charm-crest':matte(theme+' charm pale crest',p['pale'])})
            for mat in catalog[theme].values():mat.use_fake_user=True
        W,H,front_height=build(wide,catalog['leopard']);scene=setup(W,H,args)
        charms={theme:pocket_gecko_charm.build(wide,catalog[theme],front_height,theme) for theme in PALETTES}
        scene['logicalBody']=[round(W*100),round(H*100)];scene['imageMargins']=[120,80,120,40] if wide else [40,140,40,40]
        scene['artDirection']='Eight species-specific miniatures and independently authored matching pigment, original gecko key marks; no antenna'
        active='leopard'
        for theme in args.theme or PALETTES:
            for obj in scene.objects:
                if obj.get('geckoTheme') or not hasattr(obj.data,'materials'):continue
                for slot in obj.material_slots:
                    for key,mat in catalog[active].items():
                        if slot.material==mat:slot.material=catalog[theme][key];break
            for species,collection in charms.items():collection.hide_render=species!=theme
            active=theme;suffix='-wide' if wide else '';scene['theme']=theme
            scene.render.filepath=str(args.output/f'pocket-{theme}{suffix}.png')
            if theme==(args.theme or ['leopard'])[0]:
                bpy.ops.wm.save_as_mainfile(filepath=str(source/f'pocket-device{suffix}.blend'),compress=True)
            bpy.ops.render.render(write_still=True)
            print('POCKET_DEVICE_RENDERED',theme,suffix,flush=True)


if __name__=='__main__':main()
