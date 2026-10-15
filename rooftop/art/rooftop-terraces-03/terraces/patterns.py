"""Physical pigments for Pixelorama Pencil; subtle stochastic colour dithering.
North: repaired, slightly damper cement. South: sunwashed, unpatched mottling.
No regular checkerboard, outlined islands, or evenly spaced painted cracks.
"""
import math,hashlib

def rgb(c):return tuple(int(c[i:i+2],16) for i in (1,3,5))
def hexcolor(c):return '#'+''.join(f'{max(0,min(255,round(v))):02x}' for v in c)
def shade(c,d):return hexcolor([v+d for v in rgb(c)])
def mix(a,b,t):
 t=max(0,min(1,t));return hexcolor([x+(y-x)*t for x,y in zip(rgb(a),rgb(b))])
def hash01(i,j,k=0):
 n=(i*374761393+j*668265263+k*1442695041)&0xffffffff;n=((n^(n>>13))*1274126177)&0xffffffff
 return ((n^(n>>16))&0xffffff)/16777216

def noise(x,y,k=0):
 ix=math.floor(x);iy=math.floor(y);tx=x-ix;ty=y-iy;tx=tx*tx*(3-2*tx);ty=ty*ty*(3-2*ty)
 return ((1-tx)*hash01(ix,iy,k)+tx*hash01(ix+1,iy,k))*(1-ty)+((1-tx)*hash01(ix,iy+1,k)+tx*hash01(ix+1,iy+1,k))*ty

def seg(x,y,a,b,c,d):
 vx,vy=c-a,d-b;t=max(0,min(1,((x-a)*vx+(y-b)*vy)/max(.00001,vx*vx+vy*vy)))
 return math.hypot(x-a-t*vx,y-b-t*vy)
def edge_dist(x,y,poly):return min(seg(x,y,*a,*b) for a,b in zip(poly,poly[1:]+poly[:1]))
def quantshade(base,value,r,step=4):
 lo=math.floor(value/step);t=value/step-lo
 return shade(base,step*(lo+(r<t)))
def scatter(base,target,t,r):return target if r<max(0,min(1,t)) else base

PATCHES=[
 [(-.62,.84),(-.41,.80),(-.16,.82),(.04,.76),(.32,.81),(.56,.79),(.58,1.12),(.51,1.29),(.57,1.62),(.46,1.86),(.11,1.91),(-.14,1.84),(-.48,1.88),(-.59,1.56),(-.54,1.27)],
 [(-2.01,-1.62),(-1.71,-1.65),(-1.42,-1.60),(-1.43,-1.33),(-1.49,-1.19),(-1.42,-.95),(-1.52,-.73),(-1.78,-.69),(-1.98,-.79),(-1.92,-1.05)]]

def floor_color(x,y,south,repair=None):
 r=hash01(math.floor(x*16),math.floor(y*16),11)
 base='#aeac9d' if south else '#a5a99b'
 large=noise(x*.77,y*.77,31);medium=noise(x*2.6,y*2.6,41);grain=noise(x*8.3,y*8.3,8)
 tone=(large-.5)*(15 if south else 12)+(medium-.5)*9
 c=quantshade(base,tone,r,4)
 # The south has diffuse sun bleaching and irregular moisture/mineral blooms.
 if south:
  cloud=noise(x*1.14+2,y*.68,94)
  c=mix(c,'#bdb8a3',max(0,cloud-.42)*.48)
  stain=max(0,noise(x*2.3,y*1.4,82)-.51)*.65
  c=scatter(c,mix(c,'#909982',.35),stain*1.7,hash01(int(x*16),int(y*16),19))
 # Faint pour joints vary in legibility; they do not acquire a highlighted rim.
 dx=abs((x+.62)%1.38-.69);dy=abs((y+.73)%1.68-.84);joint=min(dx,dy)
 jointmask=math.exp(-(joint/.031)**2)*(.28+.57*noise(x*2.5,y*2.5,12))
 if repair is None:c=scatter(c,shade(c,-13 if south else -17),jointmask,r)
 # Edge dirt fades through sparse pixels into the central cement.
 edges=[abs(x+2.60),abs(x-2.60),abs(y-(-16.58 if south else 3.62))]
 if south:edges.append(abs(y+13.05))
 elif y<1:edges.append(abs(y+1.78))
 edge=min(edges);damp=math.exp(-edge/(.07+.11*noise(x*3,y*3,5)))
 c=scatter(c,mix(c,'#858f7d',.66),damp*.86,hash01(int(x*16),int(y*16),51))
 for px,py in ([(-2.410,-16.304)] if south else [(-.195,4.128)]):
  radius=math.hypot((x-px)*1.1,y-py);silt=math.exp(-((radius-.21)/.19)**2)*.42
  c=scatter(c,mix(c,'#84917b',.62),silt*(.35+.65*noise(x*6,y*6,15)),hash01(int(x*16),int(y*16),42))
 # Irregular, intermittent hairlines. Coverage and width change along the run.
 cracks=[(-.54,3.70,-.35,3.27),(-.35,3.27,-.08,3.09),(-.08,3.09,.11,2.98),(.11,2.98,.26,2.70),(.26,2.70,.47,2.54),(.11,2.98,-.16,2.70),(.47,2.54,.84,2.33)]
 if not south and repair is None:
  distance=min(seg(x,y,*line) for line in cracks)
  probability=math.exp(-(distance/.023)**2)*(.20+.65*noise(x*6,y*6,61))
  c=scatter(c,shade(c,-19),probability,hash01(int(x*16),int(y*16),73))
 # North repairs share the original cement grain. A short feathered perimeter
 # admits old/new pigment pixels; only the body contrast is strengthened.
 if repair is not None:
  dist=edge_dist(x,y,PATCHES[repair]);amount=min(1,dist/.18)*(.68+.32*noise(x*5,y*5,67))
  repaired=shade(c,16 if repair==0 else -11)
  c=scatter(c,repaired,amount,hash01(int(x*16),int(y*16),91))
  if hash01(int(x*16),int(y*16),39)>.91:c=shade(c,-3)
 # Sparse mineral aggregate: no uniform high-contrast noise over the whole face.
 if grain>.70 and r>.77:c=shade(c,-5)
 elif grain<.31 and r<.16:c=shade(c,4)
 return c

def pattern_color(f,p,base):
 x,y,z=p;nx,ny,nz=f['faceNormal'];role=f['role'];mat=f['material'];component=f['component']
 south=component.startswith('south') or y<-10
 u=x if abs(ny)>.6 else y
 r=hash01(math.floor(u*16),math.floor(z*16),7)
 broad=noise(u*1.15,z*1.0,23);medium=noise(u*4.1,z*3.7,14)
 if mat=='drain-iron':
  if role=='round-drain-rim':
   # Dust and cement share the surrounding pigment; no bright perimeter band.
   cement=floor_color(x,y,south)
   return mix(cement,'#75806e',.42+.10*noise(x*7,y*7,24))
  return quantshade('#7b8576',(noise(x*6,y*6,32)-.5)*6,r,3)
 if mat=='drain-recess':return shade('#475249',round((medium-.5)*3))
 if mat in ('concrete','south-concrete','north-repair'):
  repair=int(component.rsplit('-',1)[-1]) if mat=='north-repair' else None
  return floor_color(x,y,south,repair)
 if mat in ('north-wash','south-wash'):
  c=quantshade(base,(broad-.5)*(12 if south else 23)+(medium-.5)*5,r,4)
  # Old limewash differs in broad, broken density, without outlined peel shapes.
  cloud=noise(u*.78+3,z*1.4,73)
  if south:
   c=mix(c,'#b5ad92',max(0,cloud-.36)*.38)
   speck=max(0,noise(u*2.6,z*2.6,65)-.38)*.50
   c=scatter(c,mix(c,'#9b9f8b',.55),speck,hash01(int(u*16),int(z*16),39))
  else:
   c=mix(c,'#98a18c',max(0,cloud-.40)*.56)
   oldwash=max(0,noise(u*1.45+2,z*1.8,65)-.40)*.65
   c=scatter(c,shade(c,-9),oldwash,hash01(int(u*16),int(z*16),39))
  waterheight=(.13 if south else .20)+(.10 if south else .13)*noise(u*2.1,0,12)
  damp=max(0,min(1,(waterheight+.13-z)/.19))
  c=scatter(c,mix(c,'#879480' if south else '#818f7a',.70),damp*(.70+.30*medium),hash01(int(u*16),int(z*16),21))
  # Slight irregular streaks follow the actual lower wall/eave and window leaks.
  top=1.59 if south and 'parapet' in role and '-0' not in role else (.91 if 'parapet' in role else 2.97)
  upper=max(0,min(1,(z-top+.17)/.18))
  c=scatter(c,shade(c,-9),upper*(.35+.45*noise(u*4,0,28)),r)
  if 'house-render' in role:
   centres=[(-1.35,.59),(.43,.59),(1.87,.59)] if south else [(-2.0,.63),(-.78,.77)]
   for cx,cz in centres:
    if cz-.38<z<cz:
     along=math.exp(-((x-cx)/.37)**4)*(cz-z)/.38
     drip=along*(.18+.30*noise(x*9,z*4,80))
     c=scatter(c,shade(c,-10),drip,hash01(int(u*16),int(z*16),80))
  return c
 if mat in ('old-mortar','soft-fracture'):
  c=quantshade(base,(broad-.5)*8+(medium-.5)*7,r,4)
  if mat=='old-mortar':c=shade(c,-8)
  if mat=='soft-fracture':c=shade(c,-3 if nz<.1 else 2)
  if medium>.62 and r>.63:c=shade(c,-5)
  return c
 if mat in ('coping','reveal'):
  seed=int(hashlib.sha256(component.encode()).hexdigest()[:6],16)
  c=quantshade(base,[-4,-1,1,3][seed%4]+(medium-.5)*7,r,3)
  c=scatter(c,shade(c,-9),max(0,noise(x*5+y,z*4+y,57)-.61)*.7,hash01(int(x*16),int(y*16),4))
  return c
 if mat in ('render','flashing'):
  return quantshade(base,(broad-.5)*8+(medium-.5)*4,r,4)
 # Hardware retains its previous finish unless a new chart explicitly needs it.
 return shade(base,round((medium-.5)*4))
