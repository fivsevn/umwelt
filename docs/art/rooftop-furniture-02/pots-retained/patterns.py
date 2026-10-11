"""Whole physical-texel pigment decisions for native Pixelorama Pencil.

No raster drawing occurs here. The authoring tool samples one 1/16 m texel.
Source names, original three-colour palettes and pattern types stay intact.
"""
import json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
RECORDS={a['id']:a for a in json.loads((ROOT/'retained-pot-records.json').read_text()) if not a.get('antique')}
HEIGHTS={'tokoname':.105,'shigaraki':.197,'bizen':.238,'mashiko':.179,'kasama':.201,'mino':.135,
 'seto':.128,'kutani':.086,'arita':.140,'imari':.180,'hasami':.158,'kyoto':.184,'hagi':.172,'karatsu':.145,
 'tobe':.174,'koishiwara':.165,'ontayaki':.204,'iga':.181,'echizen':.272,'tsuboya':.201,
 'terra':.207,'plastic':.173,'white':.218,'shallow':.078,'growbag':.381,'deep':.447,'basket':.238}

def mix(a,b,t):
 return '#'+''.join(f'{round(int(a[i:i+2],16)*(1-t)+int(b[i:i+2],16)*t):02x}' for i in (1,3,5))

def near_line(x,y,a,b,c,d,width=.036):
 dx=c-a;dy=d-b;l=dx*dx+dy*dy;t=max(0,min(1,((x-a)*dx+(y-b)*dy)/l)) if l else 0
 return math.hypot(x-a-t*dx,y-b-t*dy)<width

def pattern_color(field,point,base):
 id=field['asset'].removeprefix('vessel-');record=RECORDS.get(id)
 if not record or record['kind']!='ceramic':return base
 role=field['role'].lower()
 if 'foot' in role:return base
 x,y,z=point;normal=field['faceNormal'];height=HEIGHTS[id];t=z/height
 body=record['color'];rim=record['rim'];ink=record['ink'];pattern=record['pattern']
 radius=math.hypot(x,y);theta=math.atan2(y,x)
 inner=normal[0]*x+normal[1]*y<-.008 or (normal[2]>.97 and t<.88)
 underside=normal[2]<-.65 and t<.25
 if underside:return mix(body,ink,.10)
 # The uppermost physical row keeps the existing lighter lip colour.
 if t>.92:return rim
 if inner:
  # Large unpainted interiors keep their breathing room; motifs stay sparse.
  if pattern in ['blue','flower','kutani','imari','scroll']:
   if radius>.065 and .3<theta<1.8:
    if near_line(x,y,-.04,.02,.09,.13,.030):return ink
    if (x-.045)**2+(y-.080)**2<.035**2:return ink
  return mix(body,rim,.14)
 if pattern=='plain':return body
 if pattern=='speckle':
  # Material-specific ash/grain patches, not full-face random dither.
  phase=.8 if id=='iga' else -.6
  patch=math.sin(theta*2+phase)+.45*math.cos(theta*5-.4)
  if patch>1.02 and .40<t<.82:return mix(body,rim,.50)
  if patch<-.98 and .12<t<.36:return mix(body,ink,.22)
 elif pattern=='fire':
  burn=math.cos(theta+(.4 if id=='bizen' else 1.8))+.26*math.cos(theta*3-1)
  if burn>.60 and t<.78:return mix(body,rim,.34)
  if burn<-.63 and .20<t<.80:return mix(body,ink,.24)
 elif pattern=='brush':
  if math.sin(theta*3+.2)>.69 and .24<t<.81:return ink
  if math.cos(theta*2)>.55 and .68<t<.90:return mix(body,rim,.38)
 elif pattern=='drip':
  edge=.47+.11*math.sin(theta*3+.3)+.13*math.cos(theta*2-1.1)
  if t>edge:return mix(body,rim,.54)
  if .32<t<edge and math.cos(theta*3-.6)>.94:return mix(body,rim,.48)
 elif pattern=='oribe':
  if -.9<theta<.6 and .24<t<.82:
   if near_line(x,z,-.095,.04,.105,.10,.029):return ink
   if abs(x-.052)<.033 and .07<z<.116:return rim
 elif pattern in ['blue','grass']:
  # A few large branch/stalk strokes occupy real one-pixel Pencil cells.
  u=radius*((theta+.2+math.pi/2)%(math.pi)-math.pi/2)
  if abs(theta)<1.4 and (near_line(u,z,-.085,height*.17,.080,height*.80,.027)
      or near_line(u,z,-.022,height*.47,-.091,height*.69,.030)
      or near_line(u,z,.029,height*.56,.111,height*.76,.030)):return ink
 elif pattern=='kutani':
  if .16<t<.82 and math.cos(theta*4)>.55:return ink
  if .37<t<.62 and math.cos(theta*4+.9)>.84:return rim
 elif pattern=='imari':
  panel=math.cos(theta*4)
  if panel>.32 and .24<t<.83:return ink
  if panel<-.25 and .36<t<.65:return mix(body,rim,.65)
 elif pattern=='stripe':
  if math.cos(theta*8+.2)>.48 and .12<t<.89:return ink
 elif pattern=='flower':
  if .2<t<.83:
   petals=math.cos(theta*6)+.36*math.sin(t*math.pi*3)
   if petals>.96:return ink
   if .47<t<.72 and .55<petals<.89:return mix(body,rim,.75)
 elif pattern=='crackle':
  # Only two broad interrupted glaze seams, not subpixel all-over crack noise.
  u=theta*max(.06,radius)
  if abs(u-(.060*math.sin(z*18)+.020))<.020 and .25<t<.87:return mix(body,ink,.33)
  if .43<t<.61 and -.21<theta<1.0:return mix(body,ink,.22)
 elif pattern=='scroll':
  wave=math.sin(theta*3+.8)
  if abs(t-(.49+.15*wave))<.10:return ink
  if .63<t<.78 and math.cos(theta*3+.2)>.80:return ink
 elif pattern=='dash':
  if .22<t<.83 and math.cos(theta*9+(math.floor(t*5)%2)*.7)>.59:return ink
 return body
