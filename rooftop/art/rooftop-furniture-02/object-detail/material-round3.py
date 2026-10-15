"""Third pass: material-specific Pencil colours on the current native sources.

No raster is produced here. paint-detail.py applies these runs with Pixelorama.
Geometry, face UVs and the physical 16 texels/metre grid remain authoritative.
Existing ceramic decoration is retained, including its unpainted negative space.
"""
import math, hashlib, runpy
from pathlib import Path

previous = runpy.run_path(str(Path(__file__).with_name('material-round2.py')))
prepare = previous['prepare']
noise, seed, mix = previous['noise'], previous['seed'], previous['mix']
STATE = {}

def configure(family, records):
    STATE.update(family=family, records={r['id']: r for r in records})

def clamp(x): return max(0., min(1., x))

def colour(f, current, p, i, j, bounds):
    family = STATE['family']
    ident, role, mat, component = (f[k] for k in ('asset','role','material','component'))
    rec = STATE['records'][ident]
    base = tuple(int(f['baseColor'][k:k+2],16) for k in (1,3,5))
    lo, hi = bounds[ident+'/'+component]
    extent = [max(.001,hi[k]-lo[k]) for k in range(3)]
    axis = max(range(3),key=lambda k:extent[k])
    normal = f['faceNormal']
    # A small chart's centre can lie outside the polygon; use the real face
    # centre for single-texel directions, avoiding false stripes on tiny parts.
    point = [(p[k]+f['center'][k])*0.5 if min(f['w'],f['h'])==1 else p[k] for k in range(3)]
    s, part = seed(ident), seed(ident+'/'+component)
    n = noise(*(math.floor(v*16) for v in point),s)
    broad = .5+.28*math.sin(point[0]*11+s%11)*math.cos(point[2]*9+s%7)+.16*math.sin(point[1]*17+point[2]*4)
    part_variation = noise(0,0,0,part)-.5
    height = max(.01, rec['height'])
    z = clamp(point[2]/height)
    local = [clamp((point[k]-lo[k])/extent[k]) for k in range(3)]
    colour = current
    value = 1.

    if family == 'plants-retained' or mat in ('leaf','leaf-dark','stem'):
        group = rec.get('morphologyWorkflowGroup','foliage')
        # Stems stay quiet so that the leaf groups carry the visible variation.
        foliage = any(k in role for k in ('leaf','pinna','pad','segment'))
        flower = any(k in role for k in ('petal','corolla','tepal','bract','whorl','throat'))
        wood = mat == '#71644b'
        if foliage:
            colour = mix(current,base,.28)
            value += part_variation*.22 + (z-.5)*.10
            if normal[2] < -.35: value -= .045
            if group == 'succulent':
                # Broad, soft wax film; no identical bright stroke around every leaf.
                powder = .055+.04*max(0,normal[2])
                if ident in ('aloe','jade','sedum','new-perforata','new-muscosa','new-arboreum'):
                    powder *= .30
                colour = mix(colour,tuple(min(230,c+42) for c in base),powder)
                value += (broad-.5)*.07
                if 'window' in role:
                    value += .06 if normal[2]>.3 else -.025
            elif group == 'moss':
                value += .085 if 'tip' in role else (z-.5)*.12
                value += part_variation*.08
            else:
                # A broken midrib only where a leaf is large enough at the
                # unchanged density. Small leaves receive whole-leaf tonal steps.
                across = max((k for k in range(3) if k!=axis),key=lambda k:extent[k]*(1-abs(normal[k])))
                if max(f['w'],f['h'])>=4 and abs(local[across]-.5)<.13 and n>.25:
                    colour = mix(colour,tuple(min(230,c+34) for c in base),.20)
                value += (broad-.5)*.075
        elif flower:
            colour = mix(current,base,.16)
            value += part_variation*.12
            if 'throat' in role: value -= .12
            elif 'petal' in role: value += .025+(broad-.5)*.08
            elif 'bract' in role: value += (broad-.5)*.10
        elif role in ('ribbed-stem','pendent-fleshy-stem'):
            value += (z-.5)*.12+(broad-.5)*.09
            if z<.33: colour = mix(colour,(143,133,89),.06*(1-z/.33))
        elif any(k in role for k in ('spine','areole','tooth','wool')):
            colour = mix(current,base,.30)
            value += part_variation*.08
        elif any(k in role for k in ('fruit','berry','pepper','taproot')):
            value += (local[2]-.5)*.13+part_variation*.06
        elif 'center' in role or role=='anther':
            value += .045+part_variation*.08
        else:
            value += part_variation*.06-.035
            if wood: value += (noise(math.floor(point[2]*16),0,0,part)-.5)*.08

    elif family == 'collection':
        name = component.lower()
        timber = mat.startswith('wood')
        grip = any(k in name for k in ('grip','handle','handguard','stock','butt','forehand'))
        is_recess = any(k in name for k in ('dark-end','dark-disc','bore','serration','slot'))
        if timber:
            colour = mix(current,base,.37)
            across = max((k for k in range(3) if k!=axis),key=lambda k:extent[k]*(1-abs(normal[k])))
            cross = point[across]*16+.32*math.sin(point[axis]*7+part%11)
            grain = noise(math.floor(cross),math.floor(point[axis]*2),0,part)
            value += (grain-.5)*.26 + part_variation*.06
            if abs(normal[axis])>.8: value -= .07
            if grip:
                value += .035*math.sin(local[axis]*math.pi)
                colour = mix(colour,tuple(min(240,c+15) for c in base),.045)
        elif mat.startswith(('cloth','leather')):
            colour = mix(current,base,.30)
            value += part_variation*.05
            # Existing handle facets carry restrained wrapping/contact bands.
            value += .06*math.sin(point[axis]*38+part%7)
        elif mat.startswith('plastic') or (mat=='iron-black' and grip):
            colour = mix(current,base,.40)
            value += (broad-.5)*.07+.025
        elif mat=='brass':
            colour = mix(current,base,.18)
            value += (broad-.5)*.10
            if abs(normal[2])>.70: value += .045
            if 'collar' in name or 'guard' in name: value -= .025
        else:
            colour = mix(current,base,.34)
            value += (broad-.5)*.08
            if mat=='steel-dark' and any(k in name for k in ('barrel','receiver','slide','magazine')):
                colour = mix(colour,(67,76,75),.24)
            if is_recess:
                value -= .055
            elif 'blade' in name:
                value += .07 if abs(normal[2])<.7 else -.025
                value += (noise(math.floor(point[axis]*16),0,0,s)-.5)*.035
            elif any(k in name for k in ('band','collar','bolt','lever','ring','plate','frame')):
                value += .06 if n>.38 else .015
            elif any(k in name for k in ('barrel','receiver','slide')):
                # Broad finished steel with a few worn high spots, not an outline.
                value += .045*abs(normal[2])
                if n>.87 and abs(normal[2])>.5: value += .06

    elif family=='ceramics-extra' or ident.startswith('antique-') or (family=='pots-retained' and ident not in {
        'vessel-terra','vessel-deep','vessel-shallow','vessel-white','vessel-plastic','vessel-growbag','vessel-basket','vessel-trough','vessel-foam'}):
        # Keep authored flowers, brushwork, inlay and firing marks in place.
        # Strongly coloured decoration is not washed toward the background glaze.
        difference = max(abs(c-b) for c,b in zip(current,base))
        decoration = difference>34
        porcelain = any(k in ident for k in ('arita','imari','kutani','nabeshima','kakiemon','tobe','hasami','kyoto'))
        bare = any(k in role for k in ('foot','underside')) or any(k in mat for k in ('clay','fired'))
        inside = 'inner' in role or 'interior' in role
        theta = math.atan2(point[1],point[0])
        firing = math.sin(theta*2.1+s%13)*.55+math.sin(theta*4+point[2]*11)*.25
        if decoration:
            value += (broad-.5)*.025
        elif bare:
            value += firing*.085 + (broad-.5)*.075
            if 'foot' in role: value -= .025
        elif porcelain:
            value += firing*.025 + (broad-.5)*.035
            if inside: value -= .018
        else:
            # Gradual thickness changes follow the vessel, across face boundaries.
            value += firing*.065+(broad-.5)*.09
            if inside: value -= .035
            if any(k in mat for k in ('green','celadon','oribe','mino')):
                pool = clamp((.35-z)*2.5)*(.7+.3*math.sin(theta*3+s%5))
                value -= pool*.07
            elif any(k in mat for k in ('shino','hagi','cream')):
                colour = mix(colour,(196,176,142),.045*max(0,firing))
        if 'rim' in role and n>.74 and not decoration: value += .035

    else:
        # Build on the two approved furniture passes without accumulating noise.
        colour = previous['colour'](f,current,point,i,j,bounds)
        timber = mat.startswith(('wood','wardrobe'))
        fabric = mat.startswith(('cloth','sofa','blanket','pillow','mattress')) or ident=='vessel-growbag'
        metal = any(k in mat for k in ('iron','steel','chrome','brass'))
        if timber:
            value += (broad-.5)*.045
            if role in ('joint','rear-support','underside'): value -= .035
            if role in ('seat','wood-top','drawer-front'): value += .025
        elif fabric:
            # Uneven folds follow the actual cushion, pillow or folded towel.
            side = min(local[(axis+1)%3],1-local[(axis+1)%3])
            fold = math.sin(point[axis]*10+part%7)*math.exp(-side*8)
            value += fold*.09 + (broad-.5)*.035
            if role=='seam' or 'underside' in role: value -= .055
            if 'contact' in role: value += .02
        elif metal:
            if 'black' in mat:
                value += (broad-.5)*.045
                if role in ('joint','hardware','washer'): value += .055
            else:
                value += (broad-.5)*.055
                if role in ('shelf-edge','rim','folded-seam'): value += .035
        elif mat.startswith('plastic'):
            if role in ('rim','handle','grip-contact'): value += .03
            if role in ('wall-rib','basket-floor','container-bottom'): value -= .025
        elif mat=='soil':
            value += (n-.5)*.16
        elif mat=='foam':
            value += (broad-.5)*.04
        else:
            value += (broad-.5)*.06

    # Stochastic tone steps follow fixed source texels, never a checkerboard.
    step=.025
    v=value/step
    value=(math.floor(v)+(n<v%1))*step
    return tuple(max(0,min(255,round(c*value))) for c in colour)
