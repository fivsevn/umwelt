#!/usr/bin/env python3
"""Render the physical G-stream handset with a transparent display opening.

Blender 4.5+: blender -b -t 8 --python gsm/tools/render-handset.py -- --theme tokay --preview --output /tmp/handset.png
Coordinates are authored at 100 logical CSS units per Blender unit.
"""
from __future__ import annotations
import argparse, importlib.util, math, random, sys
from pathlib import Path
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('handset_materials',HERE/'handset_materials.py')
materials_module=importlib.util.module_from_spec(spec);spec.loader.exec_module(materials_module)

def arguments():
    argv=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    p=argparse.ArgumentParser();p.add_argument('--theme',choices=list(materials_module.THEMES),default='tokay')
    p.add_argument('--output',type=Path,default=Path('/tmp/handset-tokay.png'));p.add_argument('--preview',action='store_true')
    p.add_argument('--wide',action='store_true');p.add_argument('--cycles',action='store_true');p.add_argument('--samples',type=int)
    return p.parse_args(argv)

def loop(w,h,rx,ry=None,cx=0,cy=0,warp=False):
    ry=rx if ry is None else ry;rx=min(rx,w/2-.001);ry=min(ry,h/2-.001)
    corners=[(w/2-rx,h/2-ry,0),(-w/2+rx,h/2-ry,90),(-w/2+rx,-h/2+ry,180),(w/2-rx,-h/2+ry,270)]
    pts=[];n=16;e=8
    for i,(x,y,a) in enumerate(corners):
        for j in range(n+1):
            t=math.radians(a+j*90/n);pts.append((cx+x+rx*math.cos(t),cy+y+ry*math.sin(t)))
        ex,ey=pts[-1];nx,ny,na=corners[(i+1)%4];t=math.radians(na)
        sx,sy=cx+nx+rx*math.cos(t),cy+ny+ry*math.sin(t)
        for j in range(1,e):pts.append((ex+(sx-ex)*j/e,ey+(sy-ey)*j/e))
    if warp:
        # A shallow bowed crown and slightly narrower heel make a molded body.
        pts=[(x*(1-.014*max(0,-y/(h/2))**2),y-.045*(abs(x)/(w/2))**2*max(0,y/(h/2))**4) for x,y in pts]
    return pts

def mesh_from_rings(name,rings,mat,close_back=False,close_center=False):
    verts=[(x,y,z) for points,z in rings for x,y in points];n=len(rings[0][0]);faces=[]
    for r in range(len(rings)-1):
        for i in range(n):
            j=(i+1)%n;faces.append((r*n+i,r*n+j,(r+1)*n+j,(r+1)*n+i))
    if close_back:
        for i in range(n):
            j=(i+1)%n;faces.append(((len(rings)-1)*n+i,(len(rings)-1)*n+j,j,i))
    if close_center:
        faces.append(tuple(range(n-1,-1,-1)))
        faces.append(tuple((len(rings)-1)*n+i for i in range(n)))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    for face in mesh.polygons:face.use_smooth=True
    # Consistent manifold normals are important around the real display opening.
    import bmesh
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(mesh);bm.free()
    return obj

def prism(name,w,h,r,depth,z,cx,cy,mat):
    outline=loop(w,h,r,cx=cx,cy=cy)
    return mesh_from_rings(name,[(outline,z-depth/2),(outline,z+depth/2)],mat,close_center=True)

def boolean_difference(obj,cutter):
    bpy.context.view_layer.objects.active=obj;obj.select_set(True)
    mod=obj.modifiers.new('Actual molded recess','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
    bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)

def bevel(obj,width=.02,segments=4):
    mod=obj.modifiers.new('Soft manufactured edge','BEVEL');mod.width=width;mod.segments=segments;mod.limit_method='ANGLE';mod.angle_limit=.55
    bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj

def area(name,location,power,size,color=(1,1,1),size_y=None):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.color=color
    if size_y:data.shape='RECTANGLE';data.size=size;data.size_y=size_y
    else:data.shape='DISK';data.size=size
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);obj.location=location
    obj.rotation_euler=(Vector((0,0,.2))-obj.location).to_track_quat('-Z','Y').to_euler();return obj

def segmented_controls(body,mats,w,h,cy,sx,sy):
    """One shallow moulded control surface, physically cut into three pieces.

    The shared outer curve and bowl profile survive each cut. There are no
    separate pillow caps or a broad visible carrier surrounding little keys.
    """
    cutter=prism('Keypad recess cutter',w+.060,h+.050,.43*sy,.48,.440,0,cy,mats['gasket'])
    boolean_difference(body,cutter);bevel(body,.012,3)
    floor=prism('Hidden control substrate',w+.010,h+.010,.41*sy,.024,.237,0,cy,mats['tray'])
    bevel(floor,.010,3)
    radius=.41*sy
    profile=[(.010,.245),(0,.309),(.004,.335),(.014,.354),
             (.032,.360),(.066,.352),(.130,.333),(.245,.310),(.320,.300)]
    rings=[]
    for inset,z in profile:
        d=inset*sy
        rings.append((loop(w-2*d,h-2*d,max(.024,radius-d),cx=0,cy=cy),z))
    panel=mesh_from_rings('Unified shallow control surface',rings,mats['key'],close_center=True)
    # The two non-straight slits are actual voids. At the coarser exported raster
    # their narrow, deep throats remain legible as joints instead of outlines.
    for sign in (-1,1):
        points=[];steps=28;gap=.040*sx
        for side,indices in [(-1,range(steps)),(1,reversed(range(steps)))]:
            for i in indices:
                y=-h*.5-.09+(h+.18)*i/(steps-1)
                bend=.050*sx*(1-(y/(h*.5))**2)
                x=sign*(.42*sx+bend)+side*gap*.5
                points.append((x,cy+y))
        slot=mesh_from_rings('Curved control joint cutter',[(points,.195),(points,.55)],mats['gasket'],close_center=True)
        boolean_difference(panel,slot)
    bevel(panel,.007,3)
    bpy.ops.object.select_all(action='DESELECT');panel.select_set(True);bpy.context.view_layer.objects.active=panel
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.separate(type='LOOSE');bpy.ops.object.mode_set(mode='OBJECT')
    parts=sorted(bpy.context.selected_objects,key=lambda obj:sum(vertex.co.x for vertex in obj.data.vertices)/len(obj.data.vertices))
    assert len(parts)==3,f'Expected three connected control pieces, got {len(parts)}'
    for obj,name in zip(parts,['Home key','Stream concave key','Settings key']):
        obj.name=name
        normal=obj.modifiers.new('Continuous moulded control normals','WEIGHTED_NORMAL')
        normal.keep_sharp=True;normal.weight=50;normal.mode='CORNER_ANGLE'
    return parts

def acoustic_slot(body,mats,index,cx,cy):
    """A tiny chamfer and a shaded throat give the receiver real recess depth."""
    bvh=BVHTree.FromObject(body,bpy.context.evaluated_depsgraph_get())
    hit,_,_,_=bvh.ray_cast(Vector((cx,cy,1.5)),Vector((0,0,-1)))
    front=hit.z if hit is not None else .405
    cutter=prism(f'Acoustic recess cutter {index}',.064,.100,.025,.28,front-.045,cx,cy,mats['gasket'])
    boolean_difference(body,cutter)
    # The moulded lip follows the curved crown rather than hovering as a ring.
    rings=[(.068,.104,.026,-.0003),(.059,.095,.023,.003),
           (.049,.083,.020,.015),(.043,.075,.017,.036),(.043,.075,.017,.070)]
    verts=[]
    for w,h,r,depth in rings:
        for x,y in loop(w,h,r,cx=cx,cy=cy):
            surface,_,_,_=bvh.ray_cast(Vector((x,y,1.5)),Vector((0,0,-1)))
            verts.append((x,y,(surface.z if surface is not None else front)-depth))
    count=len(verts)//len(rings)
    faces=[]
    for row in range(len(rings)-1):
        for i in range(count):
            j=(i+1)%count
            faces.append((row*count+i,row*count+j,(row+1)*count+j,(row+1)*count+i))
    mesh=bpy.data.meshes.new(f'Moulded receiver throat {index}')
    mesh.from_pydata(verts,[],faces);mesh.update()
    rim=bpy.data.objects.new(f'Chamfered acoustic slot {index}',mesh)
    bpy.context.collection.objects.link(rim);mesh.materials.append(mats['body'])
    for polygon in mesh.polygons:polygon.use_smooth=True
    prism(f'Acoustic grille backing {index}',.044,.076,.017,.012,front-.085,cx,cy,mats['gasket'])

def make_case(args,mats):
    wide=args.wide
    if wide:
        W,H=6.2,4.1;screen=(.0,H/2-(.50+2.58/2),5.34,2.58);opening=(-.01,H/2-(.58+2.45/2),5.22,2.45)
        nav_y=H/2-3.49;nav_w,nav_h=2.24,.62;body_rx,body_ry=.65,.60
        centers=[-.75,0,.75];key_sx,key_sy=2.24/2.42,.62/.88
        vents_y=H/2-.24
    else:
        W,H=4.3,7.9;screen=(0,.40,3.30,5.22);opening=(-.01,.385,3.18,5.09)
        nav_y=H/2-6.98;nav_w,nav_h=2.42,.88;body_rx,body_ry=.90,1.0
        centers=[-.81,0,.81];key_sx=key_sy=1.0;vents_y=H/2-.48
    scx,scy,sw,sh=screen;ocx,ocy,ow,oh=opening
    rings=[]
    for inset,z in [(.11,-.36),(0,-.18),(0,-.015),(.018,.115),(.075,.25),(.16,.345),(.27,.392),(.34,.405)]:
        rings.append((loop(W-2*inset,H-2*inset,max(.12,body_rx-inset),max(.12,body_ry-inset),warp=not wide),z))
    for grow,z in [(.105,.405),(.045,.370),(0,.305)]:
        rings.append((loop(sw+grow*2,sh+grow*2,.055+grow,cx=scx,cy=scy),z))
    rings.append((loop(sw,sh,.055,cx=scx,cy=scy),-.32))
    body=mesh_from_rings('Molded gecko enclosure',rings,mats['body'],close_back=True)
    # A single recessed moulding is split by two true inter-key joints.
    segmented_controls(body,mats,nav_w,nav_h,nav_y,key_sx,key_sy)
    # Beveled glass socket, with no opaque plane across the HTML display.
    gasket_rings=[(loop(sw,sh,.055,cx=scx,cy=scy),.304),
                  (loop(sw-.035,sh-.035,.043,cx=scx,cy=scy),.315),
                  (loop(ow+.025,oh+.025,.025,cx=ocx,cy=ocy),.274),
                  (loop(ow,oh,.018,cx=ocx,cy=ocy),.245),
                  (loop(ow,oh,.018,cx=ocx,cy=ocy),.19),
                  (loop(sw,sh,.055,cx=scx,cy=scy),.19)]
    mesh_from_rings('Optical glass perimeter socket',gasket_rings,mats.get('bezel',mats['gasket']),close_back=True)
    # Three short acoustic slots, not large round holes or decorative dots.
    for index,x in enumerate([-.11,0,.11]):
        acoustic_slot(body,mats,index,x,vents_y)
    bevel(body,.006,3)
    normal=body.modifiers.new('Stable molded surface normals','WEIGHTED_NORMAL');normal.keep_sharp=True;normal.weight=75
    return body,(W,H)

def make_wear(body,mats,W,H):
    random.seed(57)
    deps=bpy.context.evaluated_depsgraph_get();bvh=BVHTree.FromObject(body,deps)
    # High-touch shoulders and heel corners, leaving the broad face largely clean.
    anchors=[(.11,.07),(.21,.045),(.33,.035),(.71,.04),(.84,.07),(.90,.10),(.07,.18),(.94,.20),
             (.055,.37),(.945,.46),(.06,.62),(.94,.68),(.075,.84),(.12,.92),(.18,.965),(.30,.978),
             (.66,.977),(.80,.955),(.89,.91),(.93,.83),(.23,.06),(.78,.075),(.08,.87),(.85,.94)]
    for i,(u,v) in enumerate(anchors):
        x=(u-.5)*W;y=(.5-v)*H
        for j in range(1 if i%3 else 2):
            dx=random.uniform(-.022,.022);dy=random.uniform(-.018,.018)
            length=random.uniform(.022,.065);angle=random.uniform(-.8,.8)
            points=[]
            for k in range(4):
                xx=x+dx+length*(k/3-.5);yy=y+dy+length*math.sin(angle)*(k/3-.5)
                hit,normal,_,_=bvh.ray_cast(Vector((xx,yy,1.5)),Vector((0,0,-1)))
                if hit and normal.z>.1:points.append(hit+normal*.0018)
            if len(points)<3:continue
            curve=bpy.data.curves.new('Small handling abrasion','CURVE');curve.dimensions='3D';curve.bevel_depth=random.uniform(.0022,.0037);curve.bevel_resolution=2
            spline=curve.splines.new('POLY');spline.points.add(len(points)-1)
            for p,co in zip(spline.points,points):p.co=(*co,1)
            obj=bpy.data.objects.new('Shoulder and heel wear',curve);bpy.context.collection.objects.link(obj);curve.materials.append(mats['wear_dark'])
            if i%4==0:
                c=curve.copy();o=bpy.data.objects.new('Polished nick edge',c);bpy.context.collection.objects.link(o);o.location.y=-.0035;c.materials.clear();c.materials.append(mats['wear_light']);c.bevel_depth=.0012

    # Real paint losses are small irregular surface patches, clustered at the
    # shoulders and heel. Their projected vertices hug the saved body mesh.
    # Nothing is distributed across the display or the broad central face.
    chips_rng=random.Random(5757)
    chip_mats=[]
    for index,factor in enumerate([.45,1.0,1.09]):
        mat=mats['wear_light'].copy();mat.name=f'Exposed undercoat variation {index}'
        shader=next(node for node in mat.node_tree.nodes if node.type=='BSDF_PRINCIPLED')
        color=shader.inputs['Base Color'].default_value[:]
        shader.inputs['Base Color'].default_value=(*[min(1,value*factor) for value in color[:3]],1)
        shader.inputs['Roughness'].default_value=.60
        chip_mats.append(mat)

    def patch(cx,cy,w,h,angle,mat,clip_edges=False):
        center,normal,_,_=bvh.ray_cast(Vector((cx,cy,1.5)),Vector((0,0,-1)))
        if center is None or normal.z<.13:return
        verts=[center+normal*.0007];count=chips_rng.randint(7,11)
        for k in range(count):
            theta=2*math.pi*k/count+chips_rng.uniform(-.15,.15)
            radius=chips_rng.uniform(.56,1.13)
            px=math.cos(theta)*w*.5*radius;py=math.sin(theta)*h*.5*radius
            xx=cx+px*math.cos(angle)-py*math.sin(angle);yy=cy+px*math.sin(angle)+py*math.cos(angle)
            hit,n,_,_=bvh.ray_cast(Vector((xx,yy,1.5)),Vector((0,0,-1)))
            if hit is None or n.z<.10:
                if clip_edges:continue
                return
            verts.append(hit+n*.0007)
        count=len(verts)-1
        if count<4:return
        faces=[(0,k+1,(k+1)%count+1) for k in range(count)]
        mesh=bpy.data.meshes.new('Irregular paint-loss surface');mesh.from_pydata(verts,[],faces);mesh.update()
        obj=bpy.data.objects.new('Local exposed polymer chip',mesh);bpy.context.collection.objects.link(obj)
        mesh.materials.append(mat)
        for polygon in mesh.polygons:polygon.use_smooth=True

    clusters=[(.125,.060),(.875,.071),(.052,.300),(.946,.635),(.085,.895),(.904,.909)]
    for cluster,(u,v) in enumerate(clusters):
        for j in range(8):
            cx=(u-.5)*W+chips_rng.gauss(0,.055);cy=(.5-v)*H+chips_rng.gauss(0,.043)
            diameter=chips_rng.uniform(.010,.030)
            patch(cx,cy,diameter,diameter*chips_rng.uniform(.48,.95),chips_rng.uniform(-1,1),
                  mats['wear_dark'] if j==5 and cluster%2 else chips_rng.choice(chip_mats))
    # Four elongated corner scuffs expose the same neutral undercoat. A few
    # short cuts sit beside them; no dark loop surrounds any abrasion.
    for u,v,w,h,angle in [(.105,.918,.115,.042,-.48),(.895,.925,.104,.038,.55),
                           (.145,.051,.067,.022,.28),(.852,.070,.071,.025,-.32)]:
        cx=(u-.5)*W;cy=(.5-v)*H
        patch(cx,cy,w,h,angle,chip_mats[0])
        patch(cx+w*.19,cy-h*.14,w*.45,h*.68,angle+.18,chip_mats[1])
        points=[]
        for k in range(3):
            along=w*(k/2-.5)*.55
            xx=cx+along*math.cos(angle)-h*.38*math.sin(angle)
            yy=cy+along*math.sin(angle)+h*.38*math.cos(angle)
            hit,n,_,_=bvh.ray_cast(Vector((xx,yy,1.5)),Vector((0,0,-1)))
            if hit is not None and n.z>.1:points.append(hit+n*.001)
        if len(points)==3:
            curve=bpy.data.curves.new('Short cut beside worn paint','CURVE');curve.dimensions='3D';curve.bevel_depth=.0021;curve.bevel_resolution=2
            spline=curve.splines.new('POLY');spline.points.add(2)
            for point,co in zip(spline.points,points):point.co=(*co,1)
            obj=bpy.data.objects.new('Small impact beside undercoat',curve);bpy.context.collection.objects.link(obj);curve.materials.append(mats['wear_dark'])

    # A dragged corner picks up a small family of overlapping scratches rather
    # than one conspicuous isolated line. Keep these away from the broad face.
    scuffs=random.Random(5758)
    for u,v,angle in [(.058,.35,.45),(.941,.64,-.35),(.115,.918,-.48),(.889,.914,.55)]:
        cx=(u-.5)*W;cy=(.5-v)*H
        for j in range(5):
            add_surface_scuff(bvh,cx+scuffs.uniform(-.027,.027),cy+scuffs.uniform(-.020,.020),
                              scuffs.uniform(.045,.110),angle+scuffs.uniform(-.25,.25)+(1.0 if j==4 else 0),
                              scuffs.uniform(.0015,.0028),
                              mats['wear_light'] if j==0 else chip_mats[0], 'Corner rubbing cluster')

    # Three larger, mechanically placed wear families survive the 3-logical-px
    # export: a shoulder impact, a dragged heel, and a repeatedly gripped edge.
    # These reveal polymer and stress whitening; they are not decorative grit.
    body_color=mats['body'].diffuse_color[:]
    undercoat=next(node for node in mats['wear_light'].node_tree.nodes if node.type=='BSDF_PRINCIPLED').inputs['Base Color'].default_value[:]
    readable_mats=[]
    for name,amount,roughness in [('Stress-whitened paint',.43,.76),
                                ('Exposed pale polymer',.80,.69),
                                ('Frayed paint transition',.25,.82)]:
        mat=mats['wear_light'].copy();mat.name=name
        shader=next(node for node in mat.node_tree.nodes if node.type=='BSDF_PRINCIPLED')
        base=shader.inputs['Base Color']
        for link in list(base.links):mat.node_tree.links.remove(link)
        base.default_value=(*[body_color[i]*(1-amount)+undercoat[i]*amount for i in range(3)],1)
        shader.inputs['Roughness'].default_value=roughness
        shader.inputs['Specular IOR Level'].default_value=.28
        readable_mats.append(mat)
    stress,exposed,transition=readable_mats
    for u,v,length,width,angle in [(.142,.061,.40,.14,-.38),
                                  (.109,.918,.38,.15,-.54),
                                  (1-.18/W,.600,.44,.13,1.44)]:
        cx=(u-.5)*W;cy=(.5-v)*H
        ax,ay=math.cos(angle),math.sin(angle);px,py=-ay,ax
        patch(cx,cy,length*1.10,width*1.22,angle,transition,clip_edges=True)
        patch(cx-ax*.025,cy-ay*.025,length,width,angle,stress,clip_edges=True)
        patch(cx+ax*.035+px*.014,cy+ay*.035+py*.014,length*.70,width*.56,angle+.055,exposed,clip_edges=True)
        for along,side in [(-.32,-.34),(-.08,.41),(.26,-.43),(.39,.23)]:
            patch(cx+ax*length*along+px*width*side,
                  cy+ay*length*along+py*width*side,
                  length*.22,width*.24,angle+chips_rng.uniform(-.22,.22),
                  stress if along<0 else exposed,clip_edges=True)
        # Small flat slivers follow the same scrape but avoid equally spaced
        # raised white lines, which look like drawn tally marks at this scale.
        for along,side,fraction,turn in [(-.22,.18,.40,.13),(.17,-.28,.28,-.19)]:
            patch(cx+ax*length*along+px*width*side,
                  cy+ay*length*along+py*width*side,
                  length*fraction,width*.19,angle+turn,exposed,clip_edges=True)

def make_surface_damage(body,mats,W,H):
    """Small physical impacts and hairline grooves, away from the display seal.

    The cutters touch only the outer painted face. Their tiny concave surfaces
    catch the actual lights; there is no graphic line drawn around the damage.
    """
    for modifier in list(body.modifiers):
        if modifier.type=='WEIGHTED_NORMAL':body.modifiers.remove(modifier)

    # Different ellipse axes and depths avoid a repeated punched-circle motif.
    for i,(u,v,rx,ry,depth,angle) in enumerate([
            (.873,.075,.145,.090,.030,.42),
            (.108,.917,.225,.083,.045,-.52),
            (.932,.882,.092,.112,.016,.70)]):
        bvh=BVHTree.FromObject(body,bpy.context.evaluated_depsgraph_get())
        x=(u-.5)*W;y=(.5-v)*H
        hit,normal,_,_=bvh.ray_cast(Vector((x,y,1.5)),Vector((0,0,-1)))
        if hit is None or normal.z<.25:continue
        radius=max(rx,ry)
        bpy.ops.object.select_all(action='DESELECT')
        bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=1)
        cutter=bpy.context.object;cutter.name=f'Localized impact cutter {i}'
        cutter.location=hit+normal*(radius-depth)
        cutter.rotation_euler=normal.to_track_quat('Z','Y').to_euler()
        cutter.rotation_euler.rotate_axis('Z',angle)
        cutter.scale=(rx,ry,radius)
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        cutter.data.materials.append(mats['body'])
        for face in cutter.data.polygons:face.use_smooth=True
        boolean_difference(body,cutter)

    # Local fractures and two short grip scores are actual cut voids. The wider
    # shoulder network remains readable after coarse raster sampling, but every
    # path stays on painted bodywork outside the display and the control island.
    fracture_specs=[
        (.142,.061,[[(0,0),(-.040,-.045),(-.100,-.100),(-.095,-.175),(-.160,-.255)],
                    [(-.100,-.100),(-.045,-.135),(-.028,-.190)]],.0100),
        (.932,.880,[[(0,0),(-.018,.031),(-.045,.049),(-.039,.082),(-.068,.118)],
                    [(-.045,.049),(-.073,.055),(-.091,.079)]],.0027),
        (1-.18/W,.600,[[(0,-.200),(-.017,-.120),(0,-.040),(-.012,.035),(-.035,.120)],
                        [(-.065,-.110),(-.055,-.060),(-.063,.020),(-.050,.075)]],.0140),
    ]
    for i,(u,v,paths,width) in enumerate(fracture_specs):
        bvh=BVHTree.FromObject(body,bpy.context.evaluated_depsgraph_get())
        cx=(u-.5)*W;cy=(.5-v)*H
        curve=bpy.data.curves.new('Fine branching polymer fracture','CURVE')
        curve.dimensions='3D';curve.bevel_depth=width;curve.bevel_resolution=2;curve.use_fill_caps=True
        valid=False
        for path in paths:
            points=[]
            for dx,dy in path:
                hit,normal,_,_=bvh.ray_cast(Vector((cx+dx,cy+dy,1.5)),Vector((0,0,-1)))
                if hit is None or normal.z<.18:break
                points.append(hit-normal*.0010)
            if len(points)!=len(path):continue
            spline=curve.splines.new('POLY');spline.points.add(len(points)-1)
            for j,(point,co) in enumerate(zip(spline.points,points)):
                point.co=(*co,1);point.radius=.45 if j in (0,len(points)-1) else 1
            valid=True
        if not valid:
            bpy.data.curves.remove(curve);continue
        cutter=bpy.data.objects.new(f'Fine fracture cutter {i}',curve);bpy.context.collection.objects.link(cutter)
        cutter.data.materials.append(mats['body'])
        bpy.ops.object.select_all(action='DESELECT');cutter.select_set(True);bpy.context.view_layer.objects.active=cutter
        bpy.ops.object.convert(target='MESH');cutter=bpy.context.object
        boolean_difference(body,cutter)

    for face in body.data.polygons:face.use_smooth=True
    normal=body.modifiers.new('Stable molded surface normals','WEIGHTED_NORMAL')
    normal.keep_sharp=True;normal.weight=75

def add_surface_scuff(bvh,cx,cy,length,angle,width,material,name):
    points=[]
    for k in range(5):
        along=length*(k/4-.5)
        xx=cx+along*math.cos(angle);yy=cy+along*math.sin(angle)
        hit,normal,_,_=bvh.ray_cast(Vector((xx,yy,1.5)),Vector((0,0,-1)))
        if hit is not None and normal.z>.15:points.append(hit+normal*.0012)
    if len(points)<3:return
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.bevel_depth=width;curve.bevel_resolution=2
    spline=curve.splines.new('POLY');spline.points.add(len(points)-1)
    for point,co in zip(spline.points,points):point.co=(*co,1)
    obj=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(obj);curve.materials.append(material)

def make_key_wear(mats):
    # Tactile keys age too. Their printed symbols stay clear in the live layer;
    # these fine cuts sit on the high-contact shoulders outside each symbol.
    light=mats['wear_light'].copy();light.name='Scuffed key polymer'
    shader=next(node for node in light.node_tree.nodes if node.type=='BSDF_PRINCIPLED')
    key=mats['key'].diffuse_color;undercoat=shader.inputs['Base Color'].default_value[:]
    shader.inputs['Base Color'].default_value=(*[key[i]*.65+undercoat[i]*.35 for i in range(3)],1)
    shader.inputs['Roughness'].default_value=.82
    for name in ['Home key','Stream concave key','Settings key']:
        obj=bpy.data.objects.get(name)
        if obj is None:continue
        coords=[vertex.co for vertex in obj.data.vertices]
        cx=(min(co.x for co in coords)+max(co.x for co in coords))/2
        cy=(min(co.y for co in coords)+max(co.y for co in coords))/2
        w=max(co.x for co in coords)-min(co.x for co in coords)
        h=max(co.y for co in coords)-min(co.y for co in coords)
        bvh=BVHTree.FromObject(obj,bpy.context.evaluated_depsgraph_get())
        add_surface_scuff(bvh,cx+w*.30,cy+h*.24,w*.12,.40,.0017,light,'Fine key edge abrasion')
        add_surface_scuff(bvh,cx-w*.29,cy-h*.25,w*.10,-.65,.0015,mats['wear_dark'],'Fine key contact cut')

def setup(args,W,H):
    scene=bpy.context.scene
    scene.render.engine='CYCLES' if args.cycles else 'BLENDER_EEVEE_NEXT'
    if args.cycles:
        scene.cycles.samples=args.samples or (24 if args.preview else 64);scene.cycles.use_denoising=True;scene.cycles.max_bounces=5
    else:
        scene.eevee.taa_render_samples=args.samples or (32 if args.preview else 96)
        scene.eevee.use_gtao=True;scene.eevee.gtao_distance=.14;scene.eevee.gtao_quality=1.3
        scene.eevee.use_raytracing=True
        scene.eevee.use_fast_gi=True;scene.eevee.fast_gi_method='AMBIENT_OCCLUSION_ONLY'
        scene.eevee.fast_gi_bias=.005;scene.eevee.fast_gi_distance=.16;scene.eevee.fast_gi_quality=.75
        scene.eevee.fast_gi_ray_count=4;scene.eevee.fast_gi_step_count=16;scene.eevee.fast_gi_resolution='1'
        scene.eevee.shadow_ray_count=4;scene.eevee.shadow_step_count=8
    scene.world.color=(.06,.06,.06)
    scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.14,.16,.19,1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.18
    # Unequal window-sized sources light the curved housing. One narrow
    # lateral reflection lets the real wear interrupt the gloss naturally.
    area('Offset upper-left window',(-3.8,4.6,5.8),340,3.4,(1.0,.955,.90),4.8)
    area('Short lateral window reflection',(-4.4,.8,3.2),85,1.1,(.90,.95,1.0),3.4)
    area('Cool lower-right room bounce',(4.5,-1.8,6.0),110,4.5,(.84,.91,1.0),4.0)
    area('Weak frontal room fill',(0,-.7,8.0),35,5.5,(1,.985,.96),6.5)
    camera_data=bpy.data.cameras.new('Front orthographic alignment');camera=bpy.data.objects.new('Front orthographic alignment',camera_data);bpy.context.collection.objects.link(camera)
    camera.location=(0,0,14);camera.rotation_euler=(0,0,0);camera_data.type='ORTHO';camera_data.ortho_scale=max(W,H)+.4;scene.camera=camera
    factor=1.2 if args.preview else 2
    scene.render.resolution_x=round((W+.4)*100*factor);scene.render.resolution_y=round((H+.4)*100*factor);scene.render.resolution_percentage=100
    scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.image_settings.color_depth='8'
    scene.render.filepath=str(args.output);scene.render.threads_mode='FIXED';scene.render.threads=8
    scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=.25
    scene.render.image_settings.compression=25
    return scene

def main():
    args=arguments();bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    mats=materials_module.make_materials(args.theme)
    body,(W,H)=make_case(args,mats);make_surface_damage(body,mats,W,H);make_wear(body,mats,W,H);make_key_wear(mats);scene=setup(args,W,H)
    source=HERE/'handset-source';source.mkdir(exist_ok=True)
    source_file=source/f'handset-{args.theme}{"-wide" if args.wide else ""}.blend'
    bpy.ops.wm.save_as_mainfile(filepath=str(source_file),compress=True)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    bpy.ops.render.render(write_still=True)
    print('HANDSET_RENDER_COMPLETE',args.output,scene.render.resolution_x,scene.render.resolution_y,flush=True)
if __name__=='__main__':main()
