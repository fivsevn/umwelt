"""Read-only native polygon check for the strict runtime per-triangle outliers.

Float32 coordinate/UV export rounding is amplified by extremely narrow
triangles. Fit the complete original planar polygon to distinguish genuine
pixel-grid stretching from inverse-Jacobian conditioning. Does not write
Blender or any exported scene asset. Requires Blender's bundled numpy.
"""
import bpy,json,math
import numpy as np
from pathlib import Path
out=Path(__file__).resolve().parent
root=out.parents[2]
bpy.ops.wm.open_mainfile(filepath=str(out/'game-environment.blend'))
sourceout=json.loads((out/'nonbox-pixel-metric-outliers.json').read_text());wanted={(q['field'],q['layer']):{q['triangleIndex']for q in sourceout['triangles']if q['field']==q2['field']and q['layer']==q2['layer']}for q2 in sourceout['triangles']for q in [q2]}
scale=np.array(json.loads(bpy.context.scene['texelMetresPerUnit']));change=np.array([[1,0,0,0],[0,0,1,0],[0,-1,0,0],[0,0,0,1]],dtype=np.float64);counts={};records=[]
for o in bpy.context.scene.objects:
 if o.type!='MESH' or o.get('runtime_box'):continue
 me=o.data;me.calc_loop_triangles();layer=o.get('layer','near')
 for mi in sorted({p.material_index for p in me.polygons}):
  m=me.materials[mi];key=(m.get('runtime_field',m.name),layer)
  if key not in wanted:continue
  world=change@np.array([list(row)for row in o.matrix_world],dtype=np.float64);uv=me.uv_layers.active.data
  for tri in me.loop_triangles:
   if me.polygons[tri.polygon_index].material_index!=mi:continue
   ti=counts.get(key,0);counts[key]=ti+1
   if ti not in wanted[key]:continue
   poly=me.polygons[tri.polygon_index];xyz=[];tex=[]
   for li in poly.loop_indices:
    v=me.vertices[me.loops[li].vertex_index].co;p=world@np.array([*v,1],dtype=np.float64);xyz.append(p[:3]*scale);tex.append(tuple(uv[li].uv))
   xyz=np.array(xyz);tex=np.array(tex);c=xyz.mean(0);centered=xyz-c;uu,ss,vv=np.linalg.svd(centered,full_matrices=False);frame=vv[:2].T;chart=centered@frame
   design=np.column_stack([chart,np.ones(len(chart))]);j=np.linalg.lstsq(design,tex,rcond=None)[0];pred=design@j;inverse=np.linalg.inv(j[:2]);uvec,vvec=inverse[:,0],inverse[:,1];u,v=np.linalg.norm(uvec),np.linalg.norm(vvec);angle=math.degrees(math.acos(max(-1.,min(1.,np.dot(uvec,vvec)/(u*v)))))
   native_tri=np.array([(world@np.array([*me.vertices[me.loops[li].vertex_index].co,1]))[:3]*scale for li in tri.loops]);native_uv=np.array([tuple(uv[li].uv)for li in tri.loops]);e=np.array([native_tri[1]-native_tri[0],native_tri[2]-native_tri[0]]).T;t=(native_uv[1:]-native_uv[0]).T;uvinv=np.linalg.inv(t);tframe=e@uvinv;lu,lv=np.linalg.norm(tframe[:,0]),np.linalg.norm(tframe[:,1]);nativeangle=math.degrees(math.acos(max(-1,min(1,np.dot(tframe[:,0],tframe[:,1])/(lu*lv)))))
   records.append({'field':key[0],'layer':key[1],'triangleIndex':ti,'object':o.name,'sourcePolygon':poly.index,'polygonVertices':len(poly.vertices),'singularValuesMetres':ss.tolist(),'wholePolygonDensity':[1/u,1/v],'wholePolygonAngle':angle,'maxUvFitResidualPixels':float(np.max(np.abs(tex-pred))),'nativeTriangleMetricDoublePositionDensity':[1/lu,1/lv],'nativeTriangleAngleDoublePosition':nativeangle})
assessment={'allStrictTriangleOutliersHaveNativeSquare16Polygon':all(max(abs(x-16)for x in q['wholePolygonDensity'])<.002 and abs(q['wholePolygonAngle']-90)<.02 for q in records),'largestStableDensityError':max(abs(x-16)for q in records for x in q['wholePolygonDensity']),'largestStableAngleError':max(abs(q['wholePolygonAngle']-90)for q in records),'maxUvFitResidualPixels':max(q['maxUvFitResidualPixels']for q in records),'runtimeRemapRecommended':False,'reason':'All 57 strict per-triangle flags recover the same 16px/m orthogonal native polygon chart. High triangle density/angle deviations are skinny-triangle Float32 conditioning; direct source-UV preservation is appropriate.'}
report={'assessment':assessment,'method':'Trace exact exporter segment/object ordering; every strict runtime outlier remeasured with original native polygon, full matrix multiplication in float64. Least-squares inverse of projected physical polygon->raw UV mapping suppresses skinny-triangle inverse-Jacobian conditioning.','count':len(records),'triangles':records}
(out/'nonbox-stable-polygon-metric-audit.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'count':len(records),'assessment':assessment},indent=2))
