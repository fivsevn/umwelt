"""Reference-led Boaedon body: compact coils and gently upright forebody.

Only animal meshes/metadata are replaced. Dimensions remain staged character
dimensions; the ASI photograph is a shape reference, not specimen morphometry.
"""
import bpy, json, math
from mathutils import Vector
from snake_model import _mesh, _catmull

UP=Vector((0,0,1))
HEADS={'normal':(.33928574,.33071431,1.29150),
       'curious':(.32164287,.31400001,1.320286),
       'away':(.34114287,.36135716,1.284071),
       'tongue':(.33928574,.33071431,1.29150)}
POSE_YAWS={'normal':-62,'curious':-85,'away':-23,'tongue':-62}

def _tube(name,points,radii,col,material):
    steps=18;N=64;samples=_catmull(points,steps);rs=[]
    for a,b in zip(radii,radii[1:]):
        for j in range(steps):
            t=j/steps;t=t*t*(3-2*t);rs.append(a*(1-t)+b*t)
    rs.append(radii[-1]);lengths=[0.0]
    for a,b in zip(samples,samples[1:]):lengths.append(lengths[-1]+(b-a).length)
    tangents=[(samples[min(i+1,len(samples)-1)]-samples[max(0,i-1)]).normalized() for i in range(len(samples))]
    side=tangents[0].cross(UP).normalized();previous=tangents[0]
    verts=[];faces=[];uvs=[]
    for i,(p,t,r) in enumerate(zip(samples,tangents,rs)):
        # The resting trunk keeps its dorsal surface uppermost. Transporting
        # a frame around every spatial bend can roll the pale belly onto the
        # side of an otherwise level resting coil.
        # The dorsal surface stays uppermost on resting coils. On the
        # upright stem, it turns away from the player, exposing the narrow
        # pale ventral shields in the upright pose. This is a
        # smooth frame change, with no expanded hood or widened neck.
        vertical=max(0,min(1,(t.z-.62)/.32))
        high=max(0,min(1,(p.z-1.075)/.090))
        blend=vertical*high;blend=blend*blend*(3-2*blend)
        dorsal=UP*(1-blend)+Vector((.15,.99,0))*blend
        up=dorsal-t*dorsal.dot(t)
        if up.length<1e-5:up=Vector((0,1,0))-t*t.y
        up.normalize();side=t.cross(up).normalized();previous=t
        for j in range(N):
            a=math.tau*j/N;z=math.sin(a)
            # A broad muscular oval with a yielding ventral contact face.
            if z<-.65:z=-.65+(z+.65)*.32
            width=r*(1+.018*math.sin(lengths[i]*8.3))
            verts.append(tuple(p+side*(width*math.cos(a))+up*(r*.76*z)))
    for i in range(len(samples)-1):
        for j in range(N):
            k=(j+1)%N
            faces.append((i*N+j,(i+1)*N+j,(i+1)*N+k,i*N+k))
            uvs.append(((lengths[i],j/N),(lengths[i+1],j/N),
                        (lengths[i+1],(j+1)/N),(lengths[i],(j+1)/N)))
    faces.extend([tuple(range(N)),tuple((len(samples)-1)*N+j for j in range(N-1,-1,-1))])
    uvs.extend([tuple((0,j/N) for j in range(N)),tuple((lengths[-1],j/N) for j in range(N-1,-1,-1))])
    obj=_mesh(name,verts,faces,col,[material],uvs)
    obj['outward_skin_normals']=True
    return obj,lengths[-1]

def rebuild_photo_body(collections):
    # Tail-to-head continuous path. The return crosses over the lower coil;
    # unequal curves/diameters leave small natural gaps rather than one ring.
    xy=[(-.670,.750),(-.760,.570),(-.570,.410),(-.290,.410),
        (.000,.440),(.190,.640),(.060,.790),(-.200,.800),
        (-.500,.700),(-.660,.450),(-.560,.190),(-.250,.100),
        (.080,.120),(.340,.300),(.370,.590),(.210,.720),
        (-.040,.670),(-.250,.500),(-.310,.320),(-.080,.300),
        (.140,.430),(.140,.530),(-.060,.550),(-.120,.450),(.020,.430)]
    rs=[.0025,.005,.013,.029,.054,.067,.068,.070,.071,.073,
        .072,.070,.070,.070,.068,.065,.062,.058,.054,.052,
        .049,.047,.045,.043,.041]
    rs=[r*.93 for r in rs]
    # The upright reference rises out of a lower coil. Remove the final
    # stacked return which made the old forebody look like a raised arm.
    xy=xy[:20];rs=rs[:20]
    points=[]
    for i,((x,y),r) in enumerate(zip(xy,rs)):
        x=.065+.80*x;y=.260+.75*y
        # Keep the thicker enlarged character but tighten the lower coils.
        # A small forward seating shift keeps the front loop near the table.
        x=-.10+.90*(x+.10);y=.58+.90*(y-.58)-.044
        if i<=14:z=.825+.58*r
        else:z=.016+[.969,.962,.929,.908,.951,.977,.986,.994,1.001,1.010][i-15]
        # Explicit crossing clearance: the larger lower coil bridges over
        # the thin tail, and each later return rests above the earlier one.
        z+={8:.025,9:.025,10:.010,13:.015,14:.045,15:.006,
            20:.015,21:.022,22:.028,23:.040,24:.062}.get(i,0)
        points.append(Vector((x,y,z)))
    report={}
    for pose,col in collections.items():
        old=next(o for o in col.objects if o.get('snake_body'))
        mat=old.data.materials[0]
        head=Vector(HEADS[pose]);angle=math.radians(POSE_YAWS[pose])
        f=Vector((math.cos(angle),math.sin(angle),0))
        stem=head-f*.112
        scarf=stem-UP*.100
        # A soft root bend leads into a near-vertical unexpanded stem.
        # forebody and the scarf anchor to match the neck position.
        neck=[Vector((.148,.417,.965)),stem-f*.012-UP*.270,
              stem-f*.004-UP*.206,stem-UP*.142,stem-UP*.083,
              head-f*.116-UP*.020,head-f*.103]
        radii=rs+[.047,.044,.041,.039,.036,.033,.032]
        pts=points+neck
        bpy.data.objects.remove(old,do_unlink=True)
        body,total=_tube('PhotoBody '+pose+' · continuous muscular resting coils',pts,radii,col,mat)
        body['snake_body']=True;body['species']='Boaedon capensis';body['pose']=pose
        body['centerline_points']=json.dumps([list(p) for p in pts]);body['centerline_radii']=json.dumps(radii)
        body['anatomy']='Compact flattened coils, gradual tail/trunk taper, narrow upright forebody with a soft root bend'
        body['reference']='User supplied ASI dark brown coiled Boaedon photograph; not a measured specimen replica'
        body['physical_scale_note']='Artist-staged dimensions in the existing ferry shot.'
        body['photo_body_revision']='compact resting coils and upright narrow forebody with narrow neck and compact resting coils'
        col['photo_body_revision']=body['photo_body_revision'];col['scarf_anchor']=list(scarf)
        col['body_head_yaw_degrees']=POSE_YAWS[pose]
        report[pose]={'head_center':list(head),'scarf_anchor':list(scarf),'centerline_length':total,
                     'maximum_diameter':max(radii)*2,'vertices':len(body.data.vertices),
                     'section_height_to_width':.66956,'lower_coil_xy_compaction':.90,
                     'lower_body_radius_multiplier':.93,'head_anchor_method':'fixed composition coordinates'}
    bpy.context.view_layer.update()
    return report
