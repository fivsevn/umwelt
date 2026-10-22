"""Read-only native body surface-crossing check for the authored snake.

Uses the actual saved skin mesh, not only distance between control points.
BVH surface intersections count only when centerline arc separation exceeds
0.4 m in the authored body's local coordinates, excluding neighboring skin.
The body is artist-staged; these distances are not specimen measurements.
This checks mesh continuity/contact and does not approve the visual result.

Run: blender -b --python ophidia/art/snakes/boaedon-capensis/verify_body_crossings.py
"""
import sys,json,math,hashlib,argparse
from pathlib import Path
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT))
argv=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source',type=Path,default=ROOT/'boaedon-capensis.blend')
parser.add_argument('--report',type=Path,default=ROOT/'body-crossing-check.json')
args=parser.parse_args(argv)
source=args.source.resolve();report_path=args.report.resolve()
if not source.exists():
 sys.path.insert(0,str(ROOT.parents[1]))
 from source_archive import restore
 restore(source.parent/'source',source)
source_sha=hashlib.sha256(source.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(source))
from snake_model import _catmull
cols={p:bpy.data.collections['Snake · '+p] for p in ('normal','curious','away','tongue')}
report={'source':source.name,
 'source_sha256':source_sha,
 'body_module_sha256':hashlib.sha256((ROOT/'photo_body.py').read_bytes()).hexdigest(),
 'method':'Native skin surface BVH overlaps, filtered to centerline arc separation >0.4m; adjacent continuous forebody not considered a collision.',
 'arc_separation_threshold_m':.4,
 'coordinate_system':'Native authored body local coordinates before uniform character staging; not specimen morphometry',
 'visual_approval':False,'poses':{}}
for pose,col in cols.items():
 obj=next(o for o in col.objects if o.get('snake_body'))
 points=json.loads(obj['centerline_points']);radii=json.loads(obj['centerline_radii'])
 first=obj.data.polygons[0]
 ring_sides=first.vertices[1]-first.vertices[0]
 assert ring_sides>=3 and len(obj.data.vertices)%ring_sides==0, 'Unsupported native skin topology.'
 ring_count=len(obj.data.vertices)//ring_sides
 steps=(ring_count-1)//(len(points)-1)
 assert steps>0 and (len(points)-1)*steps+1==ring_count, 'Native ring sampling differs from recorded centerline.'
 assert len(obj.data.polygons)==(ring_count-1)*ring_sides+2, 'Unexpected native body surface/cap topology.'
 samples=_catmull(points,steps);arc=[0]
 for a,b in zip(samples,samples[1:]):arc.append(arc[-1]+(b-a).length)
 verts=[v.co.copy() for v in obj.data.vertices];N=ring_sides
 chunks=[]
 for first in range(0,len(samples)-1,steps):
  last=min(first+steps,len(samples)-1)
  polys=[tuple(obj.data.polygons[k].vertices) for k in range(first*N,last*N)]
  chunks.append({'first':first,'last':last,'polys':polys,
                 'tree':BVHTree.FromPolygons(verts,polys,all_triangles=False,epsilon=0)})
 collisions=[]
 for ci,a in enumerate(chunks):
  for cj in range(ci+1,len(chunks)):
   b=chunks[cj]
   if arc[b['last']]-arc[a['first']]<=.4:continue
   pairs=a['tree'].overlap(b['tree'])
   real=[]
   for fa,fb in pairs:
    ia=a['first']+fa//N;ib=b['first']+fb//N
    if arc[ib]-arc[ia]>.4:real.append((ia,ib,fa,fb))
   if not real:continue
   unique=sorted({(ia,ib) for ia,ib,_,_ in real})
   closest=min(unique,key=lambda q:(samples[q[0]]-samples[q[1]]).length)
   ia,ib=closest
   def r_at(i):
    seg=min(i//steps,len(radii)-2);f=(i-seg*steps)/steps;f=f*f*(3-2*f)
    return radii[seg]*(1-f)+radii[seg+1]*f
   delta=samples[ib]-samples[ia];direction=delta.normalized()
   def support(i):
    tangent=(samples[min(i+1,len(samples)-1)]-samples[max(i-1,0)]).normalized()
    up=(Vector((0,0,1))-tangent*tangent.z).normalized();side=tangent.cross(up).normalized()
    return r_at(i)*math.sqrt(direction.dot(side)**2+(.76*direction.dot(up))**2)
   collisions.append({'control_intervals':[ci,cj], 'surface_face_pairs':len(real),
      'sample_ring_pairs':len(unique),'closest_sample_indices':[ia,ib],
      'centerline_positions':[list(samples[ia]),list(samples[ib])],
      'centerline_distance_mm':delta.length*1000,
      'elliptic_support_overlap_estimate_mm':(support(ia)+support(ib)-delta.length)*1000,
      'centerline_arc_separation_m':arc[ib]-arc[ia]})
 report['poses'][pose]={'skin_mesh_vertices':len(verts),'control_points':points,
     'confirmed_nonlocal_surface_crossings':collisions,
     'native_sampling_steps':steps,'native_ring_sides':ring_sides,
     'surface_crossing_group_count':len(collisions)}
report['source_sha256_after_check']=hashlib.sha256(source.read_bytes()).hexdigest()
assert source_sha==report['source_sha256_after_check'], 'Source changed while checking.'
report['passed']=all(not pose['confirmed_nonlocal_surface_crossings'] for pose in report['poses'].values())
report_path.parent.mkdir(parents=True,exist_ok=True)
report_path.write_text(json.dumps(report,indent=2)+'\n')
print('BODY_SURFACE_CHECK',report_path)
for pose,record in report['poses'].items():
 print(pose,[(x['control_intervals'],x['surface_face_pairs'],round(x['elliptic_support_overlap_estimate_mm'],2)) for x in record['confirmed_nonlocal_surface_crossings']])

if not report['passed']:raise RuntimeError('Native nonlocal body surface intersections found. See report; visual review remains separate.')
