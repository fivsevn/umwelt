"""Rebuild one continuous scarf: neck turn, loose front overhand, two tails.

The two ends pass over and under each other in a loose binding half-knot.
The upper standing ends connect through the neck turn; both free ends fall below.
"""
import argparse
import hashlib
import json
import math
import sys
from pathlib import Path

import bpy
import bmesh
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

sys.path.insert(0, str(Path(__file__).resolve().parent))
from scarf_textile import POSES, material, protected_fingerprint, textile_details, topology, smooth

REV = '2026-11-04-once-around-front-overhand'
W = .052
F = np.array([-.38, -.925, 0.]); F /= np.linalg.norm(F)
X = np.cross(F, np.array([0., 0., 1.])); X /= np.linalg.norm(X)
Z = np.array([0., 0., 1.])


def unit(v):
    return v/max(np.linalg.norm(v), 1e-12)


def bezier(points, n):
    a, b, c, d = map(np.asarray, points)
    t = np.linspace(0, 1, n)
    return (1-t[:, None])**3*a+3*(1-t[:, None])**2*t[:, None]*b+3*(1-t[:, None])*t[:, None]**2*c+t[:, None]**3*d


def path(rx=.037, rf=.041):
    # Knot-local coordinates: horizontal, forward, vertical. The neck is at
    # (0,0,0); the small knot sits in front and below the one neck turn.
    a, r, front, kz = .0135, .009, rf+.011, -.014
    parts = []
    def add(p, width0, width1, w0, w1, tag, amp0, amp1, thick0, thick1):
        t = np.linspace(0, 1, len(p)); e = smooth(.68, 1, t) if tag==0 else (smooth(.12,.45,t) if tag==6 else smooth(0,1,t))
        frames = (1-e[:, None])*np.array(w0)+e[:, None]*np.array(w1)
        width = width0*(1-e)+width1*e
        amp = amp0*(1-e)+amp1*e
        thick = thick0*(1-e)+thick1*e
        if parts:
            assert np.linalg.norm(parts[-1][0][-1]-p[0])<1e-7, tag
            p, frames, width, amp, thick = p[1:], frames[1:], width[1:], amp[1:], thick[1:]
        parts.append((p, frames, width, amp, thick, np.full(len(p), tag)))
    # Long end rising into the lower-left side of the knot.
    slope = unit(np.array([2*a, 2*math.pi*r, 0.]))
    b0 = np.array([-a, front+.0025, kz-r])
    p = bezier([[-.045, .105, kz-.229], [-.044, .098, kz-.15], b0-slope*.025, b0], 190)
    add(p, W, .014, [1,0,0], [0,0,1], 0, .0014, .0024, .0013, .00035)
    # The two gathered ends cross, with B above A at the front.
    t = np.linspace(0, 1, 130); theta = 1.5*math.pi+2*math.pi*t
    p = np.stack([-a+2*a*t, front+.0025+r*np.cos(theta), kz+r*np.sin(theta)], 1)
    frames = np.tile([0.,0.,1.], (len(t),1))
    parts.append((p[1:], frames[1:], (.014+.008*np.sin(math.pi*t[1:])**2), np.full(len(t)-1, .0024), np.full(len(t)-1, .00035), np.full(len(t)-1, 1)))
    # The right standing part flows into the right side of the collar.
    angle = .85
    right = np.array([rx*math.sin(angle), rf*math.cos(angle), -.006])
    left = np.array([-right[0], right[1], right[2]])
    bend = np.array([rx*math.cos(angle), -rf*math.sin(angle), 0.]); bend = unit(bend)
    p = bezier([p[-1], p[-1]+np.array([.008,.024,.004]), right-bend*.012+np.array([0,.012,0]), right], 55)
    add(p, .014, .029, [0,0,1], [0,0,1], 2, .0024, .0014, .00035, .00075)
    # Exactly one uninterrupted neck turn, completed at the front by the knot.
    theta = np.linspace(angle, 2*math.pi-angle, 250)
    p = np.stack([rx*np.sin(theta), rf*np.cos(theta), -.006+.008*(math.cos(angle)-np.cos(theta))/(math.cos(angle)+1)], 1)
    p[0], p[-1] = right, left
    add(p, .029, .029, [0,0,1], [0,0,1], 3, .0014, .0014, .00075, .00075)
    # Left standing part folds forward and then back into the top-left entry.
    a0 = np.array([-a, front-.0025, kz+r])
    p = bezier([left, left+np.array([.009,.022,-.004]), a0-np.array([.004,-.008,0]), a0], 60)
    add(p, .029, .014, [0,0,1], [0,0,1], 4, .0014, .0024, .00075, .00035)
    t = np.linspace(0, 1, 130); theta = .5*math.pi+2*math.pi*t
    p = np.stack([-a+2*a*t, front-.0025+r*np.cos(theta), kz+r*np.sin(theta)], 1)
    frames = np.tile([0.,0.,1.], (len(t),1))
    parts.append((p[1:], frames[1:], (.014-.004*np.sin(math.pi*t[1:])**2), np.full(len(t)-1, .0024), np.full(len(t)-1, .00035), np.full(len(t)-1, 5)))
    # Short end leaves the lower-right side, opens out, and falls freely.
    p = bezier([p[-1], p[-1]+np.array([.006,-.022,-.002]), [.041,.103,kz-.108], [.046,.112,kz-.171]], 155)
    add(p, .014, W, [0,0,1], [1,0,0], 6, .0024, .0011, .00035, .0013)
    return [np.concatenate([p[i] for p in parts]) for i in range(6)]


def build(col, template, cloth, details=True):
    center = np.array(template['neck_support_center'])
    skin = next(o for o in col.objects if o.get('snake_complete_skin'))
    coordinates = np.empty(len(skin.data.vertices)*3); skin.data.vertices.foreach_get('co', coordinates); coordinates = coordinates.reshape(-1,3)
    select = (np.abs(coordinates[:,2]-center[2])<.016)&(np.linalg.norm(coordinates[:,:2]-center[:2],axis=1)<.11)
    cross = coordinates[select]-center
    along_x, along_f = cross@X, cross@F
    center += X*(along_x.max()+along_x.min())*.5+F*(along_f.max()+along_f.min())*.5
    rx = (along_x.max()-along_x.min())*.5+.006
    rf = (along_f.max()-along_f.min())*.5+.006
    local, frames, width, amp, thick, region = path(rx,rf)
    basis = np.stack([X, F, Z], axis=1)
    p = local@basis.T+center
    tangent = np.gradient(p, axis=0)
    tangent /= np.linalg.norm(tangent, axis=1)[:, None]
    # Transport the width direction along the curve. Projecting a linear
    # world-axis blend can flip a free tail when it becomes parallel to it.
    transported = np.zeros_like(p)
    transported[0] = unit(X-tangent[0]*X.dot(tangent[0]))
    for i in range(1,len(p)):
        axis = np.cross(tangent[i-1],tangent[i]); sn=np.linalg.norm(axis); cs=float(np.dot(tangent[i-1],tangent[i]))
        v=transported[i-1]
        if sn>1e-10:
            axis/=sn;v=v*cs+np.cross(axis,v)*sn+axis*np.dot(axis,v)*(1-cs)
        transported[i]=unit(v-tangent[i]*np.dot(v,tangent[i]))
    anchors={0,len(p)-1}
    for i in range(1,len(p)):
        if region[i]!=region[i-1]:anchors.update([i-1,i])
        if region[i] not in [0,6] and i%8==0:anchors.add(i)
    tail_x = {0,len(p)-1}
    for tag,fraction in [(0,.70),(6,.45)]:
        group=np.flatnonzero(region==tag);i=int(group[int((len(group)-1)*fraction)])
        anchors.add(i);tail_x.add(i)
    anchors=sorted(anchors); angles=[]
    for i in anchors:
        desired=X if i in tail_x else Z
        desired=unit(desired-tangent[i]*desired.dot(tangent[i]))
        angles.append(math.atan2(np.dot(np.cross(transported[i],desired),tangent[i]),np.dot(transported[i],desired)))
    angles=np.unwrap(angles); rotation=np.zeros(len(p))
    for k,(i,j) in enumerate(zip(anchors[:-1],anchors[1:])):
        t=smooth(0,1,np.linspace(0,1,j-i+1));rotation[i:j+1]=angles[k]*(1-t)+angles[k+1]*t
    across=transported*np.cos(rotation[:,None])+np.cross(tangent,transported)*np.sin(rotation[:,None])
    normal=np.cross(across,tangent)
    s = np.concatenate([[0.], np.cumsum(np.linalg.norm(np.diff(p, axis=0), axis=1))])
    u = np.linspace(-.5, .5, 65)
    # Lengthwise folds gather the same ribbon into the small knot. The
    # compressed knot has thinner layers than the freely hanging wool.
    folded = 1-smooth(.030, .050, width)
    # Broad hanging tails gather only near the knot. Small soft ridges avoid
    # rigid folded tubes while retaining a single continuous fabric surface.
    crease=(.00035*folded[:,None]+.0015*(1-folded[:,None]))*np.sin(u[None,:]*2*math.pi+.15*np.sin(s[:,None]*12))*np.sin(math.pi*(u[None,:]+.5))
    sheet=p[:,None,:]+across[:,None,:]*(u[None,:,None]*width[:,None,None])+normal[:,None,:]*crease[:,:,None]
    # Preserve support against the actual retained snake, in every pose.
    skin = next(o for o in col.objects if o.get('snake_complete_skin'))
    body = BVHTree.FromPolygons([v.co for v in skin.data.vertices], [list(f.vertices) for f in skin.data.polygons])
    flat = sheet.reshape(-1,3)
    for i, q in enumerate(flat):
        hit, n, _, distance = body.find_nearest(Vector(q))
        if distance<.008:
            signed = (Vector(q)-hit).dot(n)
            margin = thick[i//len(u)]*.5+.00075
            if signed<margin:
                flat[i] += np.array(n)*(margin-signed)
    sheet = flat.reshape(sheet.shape)
    du = np.gradient(sheet, axis=1); dv = np.gradient(sheet, axis=0)
    ns = np.cross(du, dv); ns /= np.maximum(np.linalg.norm(ns, axis=2)[:,:,None], 1e-12)
    curvature=np.zeros(sheet.shape[:2])
    for axis in [0,1]:
        dp=np.linalg.norm(np.diff(sheet,axis=axis),axis=2)
        dn=np.linalg.norm(np.diff(ns,axis=axis),axis=2)
        k=dn/np.maximum(dp,1e-8)
        if axis==0:
            curvature[:-1]=np.maximum(curvature[:-1],k);curvature[1:]=np.maximum(curvature[1:],k)
        else:
            curvature[:,:-1]=np.maximum(curvature[:,:-1],k);curvature[:,1:]=np.maximum(curvature[:,1:],k)
    half=np.minimum(thick[:,None]*(1-.45*folded[:,None])*.5,.30/np.maximum(curvature,1))
    upper = sheet+ns*half[:,:,None]
    lower = sheet-ns*half[:,:,None]
    rows, cols = len(p), len(u); count = rows*cols
    verts = np.concatenate([upper.reshape(-1,3), lower.reshape(-1,3)])
    faces, tags = [], []
    for i in range(rows-1):
        for j in range(cols-1):
            a = i*cols+j; f = (a,a+1,a+1+cols,a+cols)
            faces.extend([f, tuple(count+k for k in reversed(f))]); tags.extend([int(region[i])]*2)
    boundary = list(range(cols))+[i*cols+cols-1 for i in range(1,rows)]+list(range(count-2,count-cols-1,-1))+[i*cols for i in range(rows-2,0,-1)]
    for a,b in zip(boundary,boundary[1:]+boundary[:1]):
        faces.append((a,a+count,b+count,b)); tags.append(int(region[a//cols]))
    me = bpy.data.meshes.new('Scarf · continuous once-around overhand strip')
    me.from_pydata(verts, [], faces); me.update()
    obj = bpy.data.objects.new('Wool Snake · '+col.name.split(' · ')[-1]+' · once-around scarf with front overhand knot', me)
    col.objects.link(obj); obj.parent = template.parent; obj.matrix_basis = template.matrix_basis.copy()
    me.materials.append(cloth)
    for f in me.polygons: f.use_smooth = True
    uvpoints = np.concatenate([np.stack(np.meshgrid((u+.5)*W,s),axis=-1).reshape(-1,2)]*2)
    idx = np.empty(len(me.loops), np.int32); me.loops.foreach_get('vertex_index', idx)
    uv = me.uv_layers.new(name='Textile physical UV'); uv.data.foreach_set('uv',np.asarray(uvpoints[idx],np.float32).ravel())
    a = me.attributes.new('scarf_region','INT','FACE'); a.data.foreach_set('value',tags)
    row_ids=np.tile(np.repeat(np.arange(rows,dtype=np.int32),cols),2)
    row_attr=me.attributes.new('scarf_row','INT','POINT');row_attr.data.foreach_set('value',row_ids)
    region_attr=me.attributes.new('scarf_path_region','INT','POINT');region_attr.data.foreach_set('value',np.tile(np.repeat(region,cols),2))
    obj['snake_garment']='scarf'; obj['cloth_component']=True; obj['scarf_continuous']=True
    obj['scarf_retie_revision']=REV; obj['scarf_revision']=REV
    obj['neck_support_center']=center.tolist(); obj['cloth_thickness']=.0013
    obj['scarf_construction']='One neck turn; loose front simple knot with two interlacing core crossings and one exit crossing; two free tails. Single uncut closed ribbon.'
    obj['scarf_knot_type']='loose front overhand'; obj['front_crossovers']=3; obj['underpasses']=1
    obj['scarf_uv_width']=W; obj['scarf_uv_length']=float(s[-1]); obj['longitudinal_grid_rows']=rows; obj['transverse_grid_columns']=cols
    obj['scarf_region_names']=json.dumps(['long tail','under-over strand','right standing part','neck turn','left standing part','over-under strand','short tail'])
    bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(me);bm.free()
    return obj, float(s[-1])


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
    p.add_argument('--poses',nargs='+',choices=POSES,default=list(POSES));p.add_argument('--structure-only',action='store_true')
    a=p.parse_args(sys.argv[sys.argv.index('--')+1:]);bpy.ops.wm.open_mainfile(filepath=str(a.source));bpy.context.view_layer.update()
    protected=protected_fingerprint()
    cloth=material('Scarf · correctly tied rust wool');fibre=material('Scarf · tied wool yarn and nap',fibre=True)
    for pose in a.poses:
        col=bpy.data.collections['Snake · '+pose]; old=next(o for o in col.objects if o.get('scarf_continuous'))
        obj,length=build(col,old,cloth)
        for o in list(col.objects):
            if o.get('snake_garment')=='scarf' and o!=obj:
                me=o.data;bpy.data.objects.remove(o,do_unlink=True)
                if me.users==0:bpy.data.meshes.remove(me)
        if not a.structure_only:textile_details(col,obj,W,length,fibre)
        print('RETIED',pose,topology(obj),flush=True)
    bpy.context.view_layer.update();assert protected_fingerprint()==protected
    bpy.context.scene['scarf_revision']=REV;bpy.context.scene['scarf_retie_revision']=REV
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(a.output),compress=True)
    print('SAVED_RETIED',a.output,flush=True)

if __name__=='__main__': main()
