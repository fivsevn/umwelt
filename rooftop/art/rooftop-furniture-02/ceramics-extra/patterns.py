"""Original coarse ceramic glyphs for native Pixelorama Pencil, physical 16 px/m.
No Blender imports, raster creation, tracing, photograph sampling or UV changes.
Unknown interior/back faces return base. Source evidence: research.json.
"""
import math
# Authoring-point calibration, fixed with the frozen physical layout.
_SCALE={'antique-shigaraki-jar': [0.9999999999999998, 0.9999999999999998, 1.0000000077600908], 'antique-bizen-gourd': [1.0, 1.0, 1.0000000404226177], 'antique-karatsu-bowl': [1.0, 0.9999999701976785, 1.000000030222074], 'antique-hagi-bowl': [1.0000000298023233, 1.0, 0.9999999977365325], 'antique-kiyomizu-incense': [0.934851513685485, 0.9852217087726043, 1.0430238316753917], 'antique-kenzan-chestnut': [1.2121212004447588, 1.0695186911236807, 1.0561520897344203], 'antique-kakiemon-hex': [1.0, 1.1547005704573508, 0.9416186095933344], 'antique-tokoname-sutra': [1.0, 1.0, 1.0000000324727825], 'antique-oribe-ewer': [0.9725240368072509, 0.9999999727521632, 0.9936407808758718], 'antique-banko-teapot': [0.8462473790512836, 1.1764706259485653, 1.1094271738309054], 'antique-iga-lobed': [1, 1, 1.0], 'antique-tamba-jar': [1.0, 1.0, 0.999999973173719], 'antique-echizen-jar': [0.9999999999999999, 0.9999999999999999, 0.999999978058858], 'antique-seto-hitorine': [1.0, 1.0, 1.016329781704013], 'antique-tsuboya-dragon': [0.9823183030217487, 0.9823183030217487, 0.999999984694116], 'antique-arita-coffee': [1.018744363490013, 1.0000000031370866, 1.0732852936644541]}

def line(x,y,a,b,c,d,th=.028):
 vx=c-a;vy=d-b;den=vx*vx+vy*vy
 t=max(0,min(1,((x-a)*vx+(y-b)*vy)/den)) if den else 0
 return math.hypot(x-a-t*vx,y-b-t*vy)<th

def curve(x,y,points,th=.028):
 return any(line(x,y,*p,*q,th) for p,q in zip(points,points[1:]))

def oval(x,y,cx,cy,rx,ry,edge=0):
 v=((x-cx)/rx)**2+((y-cy)/ry)**2
 return 1-edge<v<1+edge if edge else v<1

def flower(x,z,cx,cz,s,colour,center):
 for dx,dz in [(-.60,0),(.60,0),(0,.60),(0,-.60)]:
  if oval(x,z,cx+dx*s,cz+dz*s,s*.48,s*.48):return colour
 if oval(x,z,cx,cz,s*.40,s*.40):return center
 return None

def angle_delta(a,b):return (a-b+math.pi)%math.tau-math.pi

def pattern_color(field,point,base):
 asset=field.get('asset','');role=field.get('role','').lower();mat=field.get('material','')
 sx,sy,sz=_SCALE.get(asset,[1,1,1]);x,y,z=[point[0]/sx,point[1]/sy,point[2]/sz]
 outer='outer' in role;inner='inner' in role;rim='rim' in role;lid='lid' in role
 if 'underside' in role or 'foot' in role or inner:return base
 theta=math.atan2(y,x);front=y<-.03;back=y>.03
 if asset=='antique-shigaraki-jar' and outer:
  # One fire-facing shoulder carries natural ash; no repetitive all-over weather.
  t=angle_delta(theta,-1.55);edge=.46+.09*math.sin(t*6)
  if abs(t)<edge and .48<z<.71:return '#706e4e'
  for cx,low,high,th in [(-.09,.29,.55,.035),(.025,.35,.58,.040),(.12,.42,.61,.029)]:
   if front and line(x,z,cx,low,cx+.013,high,th):return '#7f7550'
  if front and z<.27 and x<-.11:return '#a36b4b'
 elif asset=='antique-bizen-gourd' and outer:
  t=angle_delta(theta,-1.45)
  if abs(t)<.58 and .21<z<.37:return '#959d8c'
  if abs(t)<.30 and .46<z<.56:return '#a5aaa1'
  if z<.16:return '#788071'
 elif asset=='antique-karatsu-bowl' and outer:
  # Only monochrome tonal evidence exists, colour explicitly adapted.
  if front and oval(x,z,-.075,.16,.066,.042):return '#686155'
  if z<.09:return '#49463e'
 elif asset=='antique-hagi-bowl' and outer:
  if front and oval(x,z,.07,.205,.087,.033):return '#cbb893'
  if front and .08<z<.13 and x<-.07:return '#c3ac88'
 elif asset=='antique-kiyomizu-incense' and outer:
  # Original large slip-inlay curls, pendent triangles and mouth meander.
  u=theta*.17
  if .232<z<.257 and (abs((u+.02)%.105-.0525)<.022 or abs(z-.235)<.010):return '#d1b995'
  if .196<z<.227 and abs((u+.01)%.112-.056)<(.227-z)*1.2:return '#cab38f'
  if .08<z<.17 and front:
   if curve(x,z,[(-.13,.10),(-.10,.155),(-.05,.17),(.005,.14),(.05,.095),(.11,.12)],.019):return '#c9b290'
   if oval(x,z,-.035,.136,.045,.034,.40):return '#d0b793'
  if .055<z<.081 and abs(z-(.058+.023*abs(math.sin(u*29))))<.009:return '#c8ac87'
 elif asset=='antique-kenzan-chestnut' and outer:
  # Distribution explicitly adapted from brown/cream museum text; no inner sign.
  if front and z<.059 and x>.0:return '#bc9f72'
 elif asset=='antique-kakiemon-hex' and outer:
  # Known six-side alternate floral arrangement, original simplified glyphs.
  if lid or z>.62:
   if .66<z<.745 and abs(math.sin(theta*3))>.64:return '#678967'
   if .66<z<.74 and abs(math.sin(theta*3))<.27:return '#bb7358'
   return base
  if .55<z<.615:
   if abs(math.sin(theta*6))>.68:return '#b86b4f'
   return base
  normal=field.get('faceNormal',[0,0,0]);face=round((math.atan2(normal[1],normal[0])+math.pi)*3/math.pi)%6
  u=theta*.15
  local=(u+.078)%(.157)-.078
  if curve(local,z,[(-.040,.11),(-.009,.22),(.017,.35),(.0,.47)],.017):return '#617e63'
  for xx,zz in [(-.03,.27),(.04,.36),(-.015,.455)]:
   if oval(local,z,xx,zz,.022,.033):return '#547c64'
  for xx,zz in [(-.035,.33),(.020,.43)]:
   c=flower(local,z,xx,zz,.036,'#b86c51' if face%2==0 else '#667f98','#ccb47a')
   if c:return c
 elif asset=='antique-tokoname-sutra' and outer:
  t=angle_delta(theta,-1.3)
  if abs(t)<.53 and .43<z<.67:return '#a0aaa0'
  if front:
   for xx,lo,hi in [(-.14,.22,.52),(.03,.16,.57),(.13,.27,.59)]:
    if curve(x,z,[(xx,lo),(xx+.014,(lo+hi)*.5),(xx,hi)],.024):return '#969f95'
 elif asset=='antique-oribe-ewer' and outer:
  if 'green' in mat:
   if front and z>.32 and x<-.07:return '#48705a'
   return base
  if z>.31 or 'spout' in role:return '#486d55'
  ink='#66503b'
  if front:
   if curve(x,z,[(-.17,.065),(-.11,.105),(-.12,.175),(-.06,.205),(-.035,.13),(.025,.105)],.021):return ink
   if curve(x,z,[(-.07,.235),(-.06,.32),(.08,.266),(.14,.21)],.025):return ink
   if line(x,z,-.045,.24,.09,.285,.020):return ink
   for xx,zz in [(.12,.09),(.145,.14),(.105,.19)]:
    if oval(x,z,xx,zz,.039,.032,.48):return ink
  if back:
   if line(x,z,-.09,.08,-.07,.22,.022) or line(x,z,.11,.12,.13,.28,.023) or line(x,z,-.14,.13,.15,.18,.015):return ink
   if curve(x,z,[(-.19,.09),(-.15,.06),(-.11,.08),(-.15,.13),(-.16,.18)],.016):return ink
 elif asset=='antique-banko-teapot' and outer:
  if front:
   if curve(x,z,[(-.09,.07),(-.026,.14),(.04,.19),(.08,.25)],.015):return '#697c50'
   for xx,zz in [(-.054,.12),(.056,.16),(.020,.24)]:
    if oval(x,z,xx,zz,.031,.017):return '#687e50'
   for xx,zz,col in [(-.024,.20,'#d4c6a3'),(.070,.12,'#b98173')]:
    c=flower(x,z,xx,zz,.035,col,'#bca06a')
    if c:return c
  if back:
   # Coarse marks denote seen impressions, not legible maker-signature replicas.
   if oval(x,z,0,.14,.037,.030,.35) or oval(x,z,0,.205,.020,.025,.45):return '#876444'
 elif asset=='antique-iga-lobed' and outer:
  # One observed/text-supported directional ash streak only; back remains fired.
  if front and -.045<x<.060 and z>.25:return '#70836a'
  if front and line(x,z,.02,.18,.03,.51,.025):return '#7b886c'
 elif asset=='antique-tamba-jar':
  if rim or (outer and z>.54):
   if front and ((-.10<x<-.055) or (.07<x<.115)):return '#bb9e5e'
  if outer and front:
   if oval(x,z,.02,.34,.20,.20):return '#8e9680'
   if oval(x,z,-.115,.425,.080,.076):return '#a49b7e'
 elif asset=='antique-echizen-jar' and outer:
  if front and .48<z<.62 and abs(x)<.135:return '#bab393'
  if front and oval(x,z,-.018,.47,.11,.055):return '#b3a689'
  if z<.23:return '#986347'
 elif asset=='antique-seto-hitorine' and outer:
  if lid:return base
  # Museum text explicitly says unglazed lower body, no false ring foot.
  if z<.10+.012*math.sin(theta*3):return '#aa8660'
  if front and oval(x,z,-.05,.24,.064,.047):return '#77583c'
 elif asset=='antique-tsuboya-dragon' and outer:
  if not front:return base
  ink='#806b52'
  # Newly drawn, coarse S-shaped dragon and cloud glyphs inspired by composition.
  if curve(x,z,[(-.14,.16),(-.045,.20),(.04,.275),(.075,.345),(.0,.405),(-.10,.435),(-.06,.50),(.045,.54)],.023):return ink
  if oval(x,z,.065,.545,.048,.028):return ink
  if curve(x,z,[(.085,.55),(.12,.595),(.15,.565)],.017):return ink
  if line(x,z,.035,.27,.12,.25,.018) or line(x,z,-.03,.40,-.12,.375,.018):return ink
  if oval(x,z,-.05,.60,.039,.040,.60):return ink
  if curve(x,z,[(-.10,.605),(-.13,.64),(-.08,.672),(-.04,.647)],.017):return ink
  for xx,zz in [(.12,.135),(-.125,.32),(.10,.45)]:
   if oval(x,z,xx,zz,.042,.025,.40):return '#9b8667'
 elif asset=='antique-arita-coffee' and outer:
  if 'silver' in mat or 'chain' in role:return base
  ink='#476b87';pale='#6c87a0'
  if lid:
   for xx,zz in [(0,.645),(.05,.635),(-.055,.636)]:
    if oval(x,z,xx,zz,.024,.015):return ink
   return base
  if not(front or back):return base
  # Both body sides photographed; related compositions, original branch layout.
  sign=1 if front else -1;u=x*sign
  if curve(u,z,[(-.08,.08),(-.03,.22),(.02,.35),(-.055,.48),(.018,.57)],.021):return ink
  if curve(u,z,[(-.025,.21),(.095,.29),(.08,.39)],.018) or line(u,z,-.02,.38,-.11,.41,.018):return ink
  for xx,zz in [(-.11,.26),(.08,.42),(-.065,.51),(.02,.53),(.11,.18),(-.10,.13)]:
   c=flower(u,z,xx,zz,.035,pale,ink)
   if c:return c
  # Bird torso, neck, beak and long tail occupy coherent region.
  if oval(u,z,.047,.34,.036,.079):return pale
  if curve(u,z,[(.05,.39),(.025,.46),(.04,.50),(.075,.51)],.015):return ink
  if line(u,z,.075,.51,.105,.512,.010):return ink
  for delta in(-.028,0,.025):
   if line(u,z,.055,.30,.09+delta,.16,.015):return ink
  if z<.07:return pale
 return base
