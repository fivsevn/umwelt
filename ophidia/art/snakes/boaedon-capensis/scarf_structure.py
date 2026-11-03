"""Geometry checks for the rebuilt single-ribbon scarf and its crossing order."""
import numpy as np
from mathutils.bvhtree import BVHTree
from mathutils.geometry import intersect_ray_tri


def transverse_cross(a,b):
    return float(a[0]*b[1]-a[1]*b[0])


def tying_structure(obj):
    me=obj.data;rows=int(obj['longitudinal_grid_rows']);cols=int(obj['transverse_grid_columns']);n=rows*cols
    coords=np.empty(len(me.vertices)*3);me.vertices.foreach_get('co',coords);coords=coords.reshape(-1,3)
    midpoint=(coords[:n].reshape(rows,cols,3)[:,cols//2]+coords[n:].reshape(rows,cols,3)[:,cols//2])*.5
    regions=np.array([v.value for v in me.attributes['scarf_path_region'].data])[:n].reshape(rows,cols)[:,0]
    from retie_scarf import X,F,Z
    c=np.array(obj['neck_support_center']);q=midpoint-c
    projected=np.stack([np.einsum('ij,j->i',q,X),np.einsum('ij,j->i',q,Z)],axis=1);depth=np.einsum('ij,j->i',q,F)
    events=[];crossings=[]
    for ra,rb in [(1,5),(2,6)]:
        for i in np.flatnonzero((regions[:-1]==ra)&(regions[1:]==ra)):
            a,b=projected[i:i+2];u=b-a
            for j in np.flatnonzero((regions[:-1]==rb)&(regions[1:]==rb)):
                d,e=projected[j:j+2];v=e-d;den=transverse_cross(u,v)
                if abs(den)<1e-14:continue
                t=transverse_cross(d-a,v)/den;w=transverse_cross(d-a,u)/den
                if 0<=t<1 and 0<=w<1:
                    da=depth[i]*(1-t)+depth[i+1]*t;db=depth[j]*(1-w)+depth[j+1]*w
                    assert abs(da-db)>.001, 'Knot crossing has no depth separation.'
                    crossings.append({'regions':[ra,rb],'depth_separation':abs(float(da-db))})
                    events.extend([(i+t,da>db),(j+w,db>da)])
    events.sort();order=['over' if over else 'under' for _,over in events]
    assert len(crossings)==3,(len(crossings),crossings)
    assert all(a!=b for a,b in zip(order[:-1],order[1:])),order
    turn=q[regions==3];xx=np.einsum('ij,j->i',turn,X);ff=np.einsum('ij,j->i',turn,F)
    close=np.linspace([xx[-1],ff[-1]],[xx[0],ff[0]],50)
    angle=np.unwrap(np.arctan2(np.r_[xx,close[:,0]],np.r_[ff,close[:,1]]))
    winding=float((angle[-1]-angle[0])/(2*np.pi));assert abs(winding-1)<.01,winding
    return {'neck_winding':winding,'knot_crossings':crossings,'path_crossing_order':order,'single_ordered_ribbon':True}


def self_intersections(me):
    me.calc_loop_triangles();tris=list(me.loop_triangles);vs=[v.co.copy() for v in me.vertices]
    bvh=BVHTree.FromPolygons(vs,[list(t.vertices) for t in tris],all_triangles=True)
    count=0
    for i,j in bvh.overlap(bvh):
        if i>=j:continue
        a,b=tris[i],tris[j]
        if set(a.vertices)&set(b.vertices):continue
        pa=[vs[k] for k in a.vertices];pb=[vs[k] for k in b.vertices];found=False
        for source,target in [(pa,pb),(pb,pa)]:
            for k in range(3):
                start,end=source[k],source[(k+1)%3];d=end-start
                hit=intersect_ray_tri(*target,d,start,True)
                if hit is not None and d.length_squared>0:
                    t=(hit-start).dot(d)/d.length_squared
                    if 1e-5<t<1-1e-5:found=True;break
            if found:break
        count+=int(found)
    return count
