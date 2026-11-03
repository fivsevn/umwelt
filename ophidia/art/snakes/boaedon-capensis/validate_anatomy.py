"""Check native geometry and the preservation of garments across all four poses."""
import argparse,json,sys,hashlib
from pathlib import Path
import bpy,bmesh
import numpy as np
from mathutils.bvhtree import BVHTree
p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--report',type=Path,required=True)
a=p.parse_args(sys.argv[sys.argv.index('--')+1:]);bpy.ops.wm.open_mainfile(filepath=str(a.source))
report={'source':a.source.name,'sha256':hashlib.sha256(a.source.read_bytes()).hexdigest(),'poses':{},'scope':'Closed continuous skin, finite coordinates, scale and garment presence; visual anatomical fidelity is reviewed separately.'}
for pose in ['normal','curious','away','tongue']:
 col=bpy.data.collections['Snake · '+pose];skin=next(o for o in col.objects if o.get('snake_complete_skin'))
 me=skin.data;bm=bmesh.new();bm.from_mesh(me)
 boundary=sum(e.is_boundary for e in bm.edges);nonmanifold=sum(not e.is_manifold for e in bm.edges)
 verts=np.empty(len(me.vertices)*3);me.vertices.foreach_get('co',verts)
 me.calc_loop_triangles();minimum=min(t.area for t in me.loop_triangles);degenerate=sum(t.area<1e-14 for t in me.loop_triangles)
 unseen=set(bm.verts);components=0
 while unseen:
  components+=1;todo=[unseen.pop()]
  while todo:
   v=todo.pop()
   for e in v.link_edges:
    n=e.other_vert(v)
    if n in unseen:unseen.remove(n);todo.append(n)
 volume=bm.calc_volume(signed=True);bm.free()
 garments={kind:[o.name for o in col.objects if o.get('snake_garment')==kind] for kind in ['cap','scarf']}
 scales=next(o for o in col.objects if o.get('snake_scale_geometry'))
 vent=next((o for o in col.objects if o.get('ventral_scute_geometry')),None)
 # Catch shields accidentally projected onto another loop of the coiled
 # body: every shield vertex must remain close to the head/neck surface.
 parts=[x.value for x in me.attributes['origin_part'].data]
 head=BVHTree.FromPolygons([v.co for v in me.vertices],[list(f.vertices) for f in me.polygons if all(parts[i]!=0 for i in f.vertices)])
 max_shield_distance=max(head.find_nearest(v.co)[3] for o in col.objects if o.get('head_shield') for v in o.data.vertices)
 result={'skin_vertices':len(me.vertices),'skin_faces':len(me.polygons),'boundary_edges':boundary,'nonmanifold_edges':nonmanifold,'connected_components':components,'signed_volume':volume,'minimum_triangle_area':minimum,'degenerate_triangles':degenerate,'finite_coordinates':bool(np.isfinite(verts).all()),'dorsal_scale_ids':len(set(x.value for x in scales.data.attributes['scale_id'].data)),'ventral_and_subcaudal_scutes':vent.get('scutes_created',0) if vent else 0,'head_shields':len([o for o in col.objects if o.get('head_shield')]),'garments':garments,'eyes':len([o for o in col.objects if 'spherical iris' in o.name])}
 report['poses'][pose]=result
 result['maximum_shield_distance_from_head']=max_shield_distance
 assert boundary==0 and nonmanifold==0 and components==1 and volume>0,(pose,'skin topology',result)
 assert degenerate==0 and result['finite_coordinates'],(pose,'degenerate geometry',result)
 assert garments['cap'] and garments['scarf'] and result['eyes']==2 and result['head_shields']>=60
 assert max_shield_distance<.001,(pose,'shield detached from head',max_shield_distance)
 assert result['ventral_and_subcaudal_scutes']==321 and result['dorsal_scale_ids']>8000
 print('VALIDATED',pose,json.dumps({k:v for k,v in result.items() if k!='garments'}),flush=True)
a.report.parent.mkdir(parents=True,exist_ok=True);a.report.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
