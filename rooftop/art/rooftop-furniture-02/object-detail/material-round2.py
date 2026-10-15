"""Second-pass Pencil colours, anchored to the current source and real parts.

This module only prepares strokes. paint-detail.py applies them in Pixelorama.
Component axes are shared across face charts, including bevels and end grain.
"""
import math, hashlib

def seed(s): return int(hashlib.sha256(s.encode()).hexdigest()[:8],16)
def noise(x,y,z,s):
    n=(int(x)*374761393+int(y)*668265263+int(z)*2147483647+s*1274126177)&0xffffffff
    n=((n^(n>>13))*1274126177)&0xffffffff
    return ((n^(n>>16))&0xffff)/65535
def mix(a,b,t): return tuple(v*(1-t)+w*t for v,w in zip(a,b))

def prepare(fields):
    bounds={}
    for f in fields:
        key=f['asset']+'/'+f['component']
        lo,hi=bounds.setdefault(key,([1e6]*3,[-1e6]*3))
        for u,v in ((0,0),(f['uMetres'],0),(0,f['vMetres']),(f['uMetres'],f['vMetres'])):
            p=[f['paintOrigin'][k]+u*f['uAxis'][k]+v*f['vAxis'][k] for k in range(3)]
            for k in range(3):lo[k]=min(lo[k],p[k]);hi[k]=max(hi[k],p[k])
    return bounds

def colour(f, current, p, i, j, bounds):
    mat,role,id=f['material'],f['role'],f['asset']
    base=tuple(int(f['baseColor'][k:k+2],16) for k in (1,3,5))
    key=id+'/'+f['component'];s=seed(key);lo,hi=bounds[key]
    n=noise(*(math.floor(v*16) for v in p),s)
    broad=noise(*(math.floor(v*5) for v in p),seed(id))
    axis=max(range(3),key=lambda k:hi[k]-lo[k]);normal=f['faceNormal']
    across=max((k for k in range(3) if k!=axis),key=lambda k:(hi[k]-lo[k])*(1-abs(normal[k])))
    edge=min(i,j,f['w']-1-i,f['h']-1-j)==0
    color=current;value=1
    timber=mat.startswith(('wood','wardrobe'))
    metal=any(k in mat for k in ('iron','steel','chrome','brass'))
    plastic=mat.startswith('plastic') or id in ('vessel-plastic','vessel-white','vessel-basket','vessel-trough')
    fabric=mat.startswith(('cloth','sofa','blanket','pillow','mattress')) or id=='vessel-growbag'
    if timber:
        # A quieter middle tone leaves space for a few continuous grain runs.
        color=mix(current,base,.44)
        along=p[axis]*16;cross=p[across]*16
        bend=.30*math.sin(along*.28+s%13)
        row=math.floor(cross+bend)
        band=.83*noise(row,0,0,s)+.17*noise(row,math.floor(along/9),0,s)
        value+=(band-.5)*.22+(noise(0,0,0,s)-.5)*.07
        # Cut ends read differently from long-grain board faces.
        if abs(normal[axis])>.8:
            value-=.065
            value+=(noise(math.floor(p[(axis+1)%3]*16),math.floor(p[(axis+2)%3]*16),0,s)-.5)*.06
        elif band<.20 and n>.18:value-=.045
        # A local polished area around the actual drawer pulls, not a full edge.
        if role=='drawer-front' and normal[1]<-.8:
            z=(lo[2]+hi[2])/2
            wear=math.exp(-((p[0]/.14)**2+((p[2]-z)/.065)**2))
            color=mix(color,(178,151,112),wear*.12)
        if role in ('panel-stile','panel-rail'):value+=.025
        if role in ('top','wood-top','seat') and normal[2]>.65:
            if edge and n>.73:value+=.075
        if p[2]<.08 and role in ('post','foot','base'):value-=.035
    elif metal:
        # The narrow bars stay calm; wear collects on exposed returns and joins.
        color=mix(current,base,.23)
        value+=(broad-.5)*.06
        if role in ('hardware','rivet','washer','joint','pressed-rib'):value+=.07
        if role in ('shelf-grid','brace','post') and min(f['w'],f['h'])<=1:
            color=mix(color,base,.20)
        if role in ('shelf-edge','rim','folded-seam','handle') and edge and n>.81:
            color=mix(color,(175,178,165),.16 if 'black' in mat or 'dark' in mat else .06)
        if role in ('basin-shell','basin-floor','counter-top','drainboard'):
            value+=(noise(math.floor(p[0]*16),0,0,s)-.5)*.06
        if id=='galvanized-bucket' and role=='bucket-shell':
            value+=(broad-.5)*.12
            if p[2]<.045:color=mix(color,(134,130,113),.10)
    elif plastic:
        color=mix(current,base,.22)
        value+=(broad-.5)*.055
        if role in ('rim-return','wall-rib'):value-=.045
        if role in ('rim','grip-contact','handle'):
            if n>.50:color=mix(color,(203,207,190),.10)
        inward=normal[0]*p[0]+normal[1]*p[1]<-.04
        if inward and role in ('bucket-shell','perforated-wall','container-bottom'):value-=.045
        if p[2]<.025 and n<.66:color=mix(color,(101,102,87),.08)
    elif fabric:
        color=mix(current,base,.18)
        if 'contact' in role:
            u=(p[0]-lo[0])/max(.01,hi[0]-lo[0]);v=(p[1]-lo[1])/max(.01,hi[1]-lo[1])
            wear=math.exp(-(((u-.5)*2.5)**2+((v-.45)*2.4)**2))
            color=mix(color,(170,168,143),.085*wear)
        if role=='seam':value-=.05
        elif role in ('blanket:fold','pillow:contact'):value+=(broad-.5)*.045
    elif mat=='foam' or id=='vessel-foam':
        color=mix(current,base,.18)
        if edge and n>.86:color=mix(color,(174,171,152),.13)
        if p[2]<.035 and n>.42:color=mix(color,(146,142,116),.09)
    elif mat in ('porcelain','ceramic','enamel','enamel-blue') or id.startswith('vessel-'):
        value+=(broad-.5)*.04
        if id in ('vessel-terra','vessel-deep','vessel-shallow'):
            # Uneven mineral bloom at the bottom, with quiet undecorated walls.
            if .025<p[2]<.075 and broad>.47:color=mix(color,(178,165,135),.11)
        if role in ('rim','spout') and n>.79:value+=.045
    else:
        value+=(broad-.5)*.025
    step=.02;v=value/step
    value=(math.floor(v)+(n<v%1))*step
    return tuple(max(0,min(255,round(c*value))) for c in color)
