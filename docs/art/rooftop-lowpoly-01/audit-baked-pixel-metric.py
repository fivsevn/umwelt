"""Read actual exported baked UV derivatives in physical metres.

The runtime binary is byte-identical to the audited saved Blender geometry/UV.
This only measures the existing UV charts; no geometry or UV is changed.
"""
import array
import hashlib
import json
import math
import statistics
import sys
from pathlib import Path

HERE=Path(__file__).resolve().parent
RUNTIME=HERE.parents[2]/'rooftop/assets/background'
text=(RUNTIME/'empty-rooftop.mjs').read_text()
manifest=json.loads(text.split('Object.freeze(',1)[1].rsplit(');',1)[0])
raw=(RUNTIME/'empty-rooftop.bin').read_bytes()
verified=json.loads((HERE/'native-source-check.json').read_text())
assert hashlib.sha256(raw).hexdigest()==manifest['sha256']==verified['runtimeBinarySha256']
assert verified['sourceVerticesNormalsUvsTransformsMaterialsAndCamerasExactlyPreserved']
assert verified['runtimeBinaryExactlyPreserved']
assert hashlib.sha256((HERE/'game-environment.blend').read_bytes()).hexdigest()==verified['savedSourceSha256']
scale=manifest['texelMetresPerUnit']
length=lambda v:math.sqrt(sum(x*x for x in v))
dot=lambda a,b:sum(x*y for x,y in zip(a,b))
cross=lambda a,b:(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
samples=[];degenerate=0
for part in manifest['parts']:
    if part.get('style')!='baked':continue
    assert part['mode']=='mesh', 'Audit requires actual world-space baked mesh'
    tex=next(t for t in manifest['textures']if t['file']==part['texture'])
    values=array.array('f');values.frombytes(raw[part['offset']:part['offset']+part['vertices']*32])
    if sys.byteorder!='little':values.byteswap()
    for i in range(0,len(values),24):
        tri=[values[i+j*8:i+(j+1)*8]for j in range(3)]
        points=[tuple(v[k]*scale[k]for k in range(3))for v in tri]
        e1=tuple(points[1][k]-points[0][k]for k in range(3));e2=tuple(points[2][k]-points[0][k]for k in range(3))
        du1,dv1=tri[1][6]-tri[0][6],tri[1][7]-tri[0][7]
        du2,dv2=tri[2][6]-tri[0][6],tri[2][7]-tri[0][7]
        determinant=du1*dv2-du2*dv1
        area=length(cross(e1,e2))*.5
        if abs(determinant)<1e-12 or area<1e-12:degenerate+=1;continue
        step_u=tuple((e1[k]*dv2-e2[k]*dv1)/determinant/tex['width']for k in range(3))
        step_v=tuple((e2[k]*du1-e1[k]*du2)/determinant/tex['height']for k in range(3))
        u,v=length(step_u),length(step_v)
        cosine=max(-1.,min(1.,dot(step_u,step_v)/(u*v)))
        angle=math.degrees(math.acos(cosine))
        # Singular values describe the actual two principal pixel dimensions,
        # including skew. An axis length ratio alone would miss sheared charts.
        a,b,c=u*u,dot(step_u,step_v),v*v
        discriminant=math.sqrt(max(0.,(a-c)**2+4*b*b))
        principal_max=math.sqrt((a+c+discriminant)/2)
        principal_min=math.sqrt(max(0.,(a+c-discriminant)/2))
        anisotropy=principal_max/principal_min if principal_min else float('inf')
        samples.append({'area':area,'u':u,'v':v,'pxU':1/u,'pxV':1/v,'angle':angle,'anisotropy':anisotropy})

def summary(key):
    values=sorted(sample[key]for sample in samples)
    def percentile(p):
        n=(len(values)-1)*p;low=int(n);high=min(low+1,len(values)-1)
        return values[low]*(high-n)+values[high]*(n-low) if high!=low else values[low]
    return {k:round(v,8)for k,v in {'minimum':values[0],'p05':percentile(.05),'median':statistics.median(values),'p95':percentile(.95),'maximum':values[-1]}.items()}

near_square=[s for s in samples if abs(s['u']-1/16)<1e-5 and abs(s['v']-1/16)<1e-5 and abs(s['angle']-90)<.01]
skewed=[s for s in samples if abs(s['angle']-90)>.05 or s['anisotropy']>1.01]
report={
    'method':'Triangle UV inverse Jacobian applied to actual exported Blender world coordinates and authored metres-per-unit calibration',
    'texture':'distance-facades.png','atlasSize':[2048,2048],'binarySha256':manifest['sha256'],
    'geometryAndUvsVerifiedByteIdenticalToSavedBlender':True,
    'texelMetresPerUnit':scale,'trianglesMeasured':len(samples),'degenerateUvTriangles':degenerate,
    'metresPerTexelU':summary('u'),'metresPerTexelV':summary('v'),
    'texelsPerMetreU':summary('pxU'),'texelsPerMetreV':summary('pxV'),
    'pixelAxisAngleDegrees':summary('angle'),'principalPixelAnisotropy':summary('anisotropy'),
    'trianglesMatchingSquare16PxPerMetre':len(near_square),'trianglesWithSkewOrAnisotropy':len(skewed),
    'allBakedChartsUseSquare16PxPerMetre':len(near_square)==len(samples),
    'interpretation':'The preserved baked facade uses independent UV charts rather than the calibrated near 16 px/m metric sampler. Native 1 px colour regrouping changes pigment clusters, not its existing physical pixel density or anisotropy. Changing that physical mapping requires UV/atlas recalibration and falls outside this pass\'s preserved-UV boundary.',
}
(HERE/'baked-pixel-metric-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
