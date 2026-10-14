"""Original room pigment marks in native physical world coordinates.

Pure Python; ROOT applies returned colours with native Pixelorama Pencil. The
geometry's face UV is never modified, and these marks are not traced imagery.
"""
import math
U=5.6/3
def shade(c,f):return '#'+''.join(f'{max(0,min(255,round(int(c[i:i+2],16)*f))):02x}' for i in (1,3,5))
def line(x,y,a,b,c,d,width):
 dx=c-a;dy=d-b;l=dx*dx+dy*dy;t=max(0,min(1,((x-a)*dx+(y-b)*dy)/l)) if l else 0
 return math.hypot(x-a-t*dx,y-b-t*dy)<width
def pattern_color(field,point,base):
 x,y,z=point;role=field['role'];component=field['component'];normal=field['faceNormal']
 if role=='room-world-map' and normal[0]>.8:
  # Hand-authored schematic continents; only full physical source pixels.
  world=["..........................","...###...........#####....","..######.......########...",".#######....##.#########..","..#####.....############..","...###......###.########..","....##.......###..#####...",".....###.....####..##.....",".....####....###....#.....","......###.....##...###....","......##...........####...",".......#..................",".........................."]
  u=(y*U-(3.32-3.06/2))/3.06;v=((3.06+1.59/2)-z*U)/1.59
  i=int(u*26);j=int(v*13)
  if 0<=i<26 and 0<=j<13 and world[j][i]=='#':return '#7d8e69'
  if .46<u<.50 and .02<v<.96:return shade(base,.98)
  return base
 if role=='room-floor'  and normal[2]>.8:
  # Fixed staggered timber joints, with modest board-to-board tone. The shortest
  # mark is one true 6.25 cm source pixel rather than a finer hidden pattern.
  board=math.floor((x+5/U)/.375);fraction=(x+5/U)-board*.375
  c=shade(base,(.985,1,1.015,1.005,.99)[board%5])
  if fraction<.036:c=shade(c,.91)
  end=(y+7/U+(board%3)*.6875)%2.0625
  if end<.035 and fraction>.04:c=shade(c,.94)
  if board%5==1 and -.8<y<-.35 and .12<fraction<.19:c=shade(c,.968)
  if board%7==3 and 1.15<y<1.58 and .25<fraction<.31:c=shade(c,1.026)
  # Local wear follows the route between the door and the middle of the room.
  if ((x+1.65)/.78)**2+((y+1.1)/.7)**2<1 and (board+y*3)%4>.65:c=shade(c,.974)
  for a,b,d,e in [(-.50,-2.31,-.28,-2.27),(1.07,.68,1.25,.73),(-1.98,-.48,-1.80,-.52)]:
   if line(x,y,a,b,d,e,.025):c=shade(c,.945)
  return c
 if role.startswith('room-wall') and role!='room-wall-lamp':
  # Quiet interior scuffs, restricted to actual contact heights/locations.
  c=base
  if role=='room-wall-back' and normal[1]<-.7:
   if ((x-1.84)/.20)**2+((z-.26)/.11)**2<1:return shade(base,.963)
   if line(x,z,-2.40,.16,-2.27,.22,.020):return shade(base,.965)
   if ((x+1.18)/.22)**2+((z-.39)/.15)**2<1:return shade(base,1.025)
  if role=='room-wall-left' and normal[0]>.7:
   if ((y+2.58)/.19)**2+((z-.55)/.18)**2<1:return shade(base,.97)
   if line(y,z,.98,.13,1.11,.18,.019):return shade(base,.965)
  if role=='room-wall-right' and normal[0]<-.7 and ((y-.75)/.31)**2+((z-.16)/.07)**2<1:return shade(base,.968)
  return c
 if role=='room-skirting':
  if z<.025 and int((x+y)*7)%13==4:return shade(base,.94)
  return base
 if role=='room-window-sill' and normal[2]>.7:
  if -.72<x<-.46 and 3.56<y<3.67:return shade(base,.956)
  if .64<x<.94 and 3.62<y<3.70:return shade(base,1.03)
  return base
 if role=='room-window-frame':
  if 'lower' in component and abs(x)<.12:return shade(base,.953)
  return base
 if role=='room-curtain':
  if z<.455 and abs(normal[2])<.5:return shade(base,.973)
  if z>1.20 and -1.42/U<x<-1.31/U:return shade(base,1.018)
  return base
 if role=='room-door-leaf':
  # Convert original global source points to the existing frame's local axes.
  rx=x*U;ry=z*U-.02;rz=-y*U;localx=rz-4;localz=-(rx+4.9)
  if 'panel' in component:
   if ((localx-(.8*U/2-.20))/.20)**2+((ry-1.0*U)/.27)**2<1:return shade(base,1.045)
   if .14<ry<.32 and -.28<localx<-.03:return shade(base,.953)
   if line(localx,ry,-.31,.46,-.22,.52,.024):return shade(base,.959)
  if 'handle' in component and .044<abs(localz)<.105 and normal[2]>.4:return shade(base,1.07)
  if 'edge' in component and .2<ry<.35:return shade(base,.96)
  return base
 if role=='room-door-frame':
  if 'threshold' in component and normal[2]>.8 and abs(y+4/U)<.18:return shade(base,1.035)
  return base
 return base
