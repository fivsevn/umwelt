"""New complete low-poly lamp and small decoration sources, authored in Blender."""
import sys,math,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from assetlib import Builder,MODE,verify_saved
if MODE=='verify':verify_saved('accents');raise SystemExit
b=Builder('accents')

a=b.asset('tasklamp','关节工作灯','日用与照明','both',sources=[{'label':'IKEA TERTIAL 结构参考','url':'https://www.ikea.com/ie/en/assembly_instructions/tertial-work-lamp-dark-grey__AA-2550118-1-100.pdf'}])
a.cyl('weighted-base',.13,.025,(0,0,.0125),'steel-dark',vertices=16)
a.cyl('base-top',.115,.01,(0,0,.03),'iron-silver',vertices=16)
path=[(0,0,.04),(-.13,0,.30),(.05,0,.49)]
for i in range(2):
 for y in (-.015,.015):a.beam(f'arm-{i}-{y}',(path[i][0],y,path[i][2]),(path[i+1][0],y,path[i+1][2]),.018,mat='steel-dark',role='lamp-arm')
for i,p in enumerate(path):a.cyl('joint-'+str(i),.032,.045,p,'iron-silver',vertices=12,rotation=(math.pi/2,0,0))
for j in range(2):a.tube('spring-'+str(j),[(path[j][0]-.018,-.025,path[j][2]+.045),(path[j+1][0]-.025,-.025,path[j+1][2]-.04)],.007,'steel-dark','spring')
shade=[(.125,.43),(.125,.442),(.07,.505),(.04,.52),(.029,.51),(.055,.491),(.113,.439),(.125,.43)]
a.lathe('shade',shade,'enamel','lamp-shade',sides=16,center=(.105,0,0))
a.cyl('bulb',.035,.05,(.105,0,.464),'light',vertices=12)
a.tube('power-lead',[(-.04,.02,.027),(-.19,.05,.02),(-.16,.12,.017),(.03,.13,.017)],.004,'rubber','cable')

a=b.asset('solar-lamp','太阳能庭院灯','日用与照明','floor')
a.cyl('stake',.019,.58,(0,0,.29),'steel-dark',vertices=8)
a.cyl('foot',.045,.035,(0,0,.018),'steel-dark',vertices=8)
a.lathe('lamp-glass',[(.065,.54),(.065,.66),(.053,.66),(.053,.55),(.065,.54)],'glass','lamp-window',sides=12)
for j in range(4):
 t=j*math.tau/4;a.beam('window-frame-'+str(j),(.064*math.cos(t),.064*math.sin(t),.54),(.064*math.cos(t),.064*math.sin(t),.66),.008,mat='steel-dark')
a.cyl('led',.025,.05,(0,0,.59),'light',vertices=8)
a.cyl('hat',.10,.035,(0,0,.68),'iron-black',vertices=12,radius_top=.065)
a.cyl('solar-panel',.055,.008,(0,0,.701),'#4c5c63',vertices=12)

a=b.asset('tin-lantern','旧锡灯笼','日用与照明','both',sources=[{'label':'Met Lantern 外形参考','url':'https://www.metmuseum.org/art/collection/search/4735'}])
a.cyl('bottom',.10,.025,(0,0,.0125),'iron-silver',vertices=12)
# Closed perforated wall strips leave actual small openings between the panels.
for j in range(12):
 t=j*math.tau/12
 for z,h in ((.057,.05),(.155,.085),(.256,.078)):
  a.box(f'wall-{j}-{z}',(.044,.012,h),(.09*math.sin(t),.09*math.cos(t),z),'iron-silver','lantern-wall',rotation=(0,0,-t))
 a.box('upright-'+str(j),(.014,.016,.29),(.096*math.sin(t),.096*math.cos(t),.17),'steel-dark','frame',rotation=(0,0,-t))
a.cyl('bulb',.043,.10,(0,0,.13),'light',vertices=12)
a.cyl('roof',.12,.075,(0,0,.345),'iron-silver',vertices=12,radius_top=.047)
a.tube('handle',[(.042*math.cos(t),0,.405+.056*math.sin(t)) for t in [i*math.tau/12 for i in range(13)]],.007,'steel-dark',sides=6)

a=b.asset('string-lights','庭院灯串','日用与照明','floor')
for x in (-.75,.75):
 a.box('foot-'+str(x),(.22,.32,.03),(x,0,.015),'wood-dark','foot')
 a.beam('pole-'+str(x),(x,0,.03),(x,0,1.25),.035,mat='wood')
cord=[(x,0,1.25-.16*(1-(x/.75)**2)) for x in [-.75+i*.15 for i in range(11)]]
a.tube('cable',cord,.005,'rubber','cable',sides=6)
for i in range(7):
 x=-.6+i*.2;z=1.25-.16*(1-(x/.75)**2)
 a.cyl('socket-'+str(i),.018,.025,(x,0,z-.016),'steel-dark',vertices=8)
 a.lathe('bulb-'+str(i),[(0,z-.10),(.025,z-.088),(.032,z-.06),(.018,z-.029),(0,z-.029)],'light','bulb',sides=10)

a=b.asset('radio-small','小型收音机','陈设与收藏','both')
a.box('case',(.43,.16,.255),(0,0,.15),'wood-dark',bevel=.007)
a.box('rear',(.402,.012,.225),(0,.084,.15),'steel-dark','back')
for x in (-.15,.15):a.box('foot-'+str(x),(.052,.08,.022),(x,0,.011),'rubber')
a.box('speaker',(.18,.012,.17),(-.10,-.087,.148),'cloth-dark','speaker')
for j in range(6):a.box('grille-'+str(j),(.162,.008,.006),(-.1,-.095,.084+j*.022),'steel-dark')
a.box('tuning-window',(.155,.014,.058),(.112,-.086,.212),'#c5c5ac','dial-window')
a.box('dial-pointer',(.008,.007,.04),(.103,-.096,.212),'plastic-red')
for x in (.062,.155):a.cyl('knob-'+str(x),.025,.017,(x,-.097,.115),'iron-silver',vertices=12,rotation=(math.pi/2,0,0))
a.tube('carry-handle',[(-.095,0,.284),(-.085,0,.322),(.085,0,.322),(.095,0,.284)],.009,'steel-dark',sides=8)
a.beam('aerial',(.18,.044,.28),(.238,.044,.54),.007,mat='iron-silver')

a=b.asset('tea-set','瓷茶壶与杯','陈设与收藏','both')
a.box('wooden-tray',(.48,.35,.014),(0,0,.007),'wood-dark',bevel=.004)
a.lathe('teapot',[(0,.018),(.055,.018),(.09,.06),(.095,.115),(.058,.16),(.04,.161),(.044,.144),(.075,.10),(.066,.035),(0,.035)],'porcelain','tea-vessel',sides=16,center=(-.085,.032,0))
a.lathe('lid',[(0,.164),(.051,.164),(.057,.173),(.025,.193),(0,.193)],'porcelain',sides=16,center=(-.085,.032,0))
a.cyl('lid-knob',.017,.016,(-.085,.032,.20),'blue-ink',vertices=10)
a.tube('spout',[(-.005,.032,.063),(.035,.032,.082),(.069,.032,.125)],.019,'porcelain','spout',sides=10)
a.tube('teapot-handle',[(-.163,.032,.127),(-.212,.032,.135),(-.233,.032,.097),(-.201,.032,.055),(-.166,.032,.063)],.011,'porcelain',sides=8)
for i,(x,y) in enumerate(((.13,-.085),(.13,.105),(-.085,-.103))):
 a.lathe('cup-'+str(i),[(0,.02),(.026,.02),(.039,.071),(.034,.073),(.024,.032),(0,.032)],'porcelain','cup',sides=12,center=(x,y,0))
 a.tube('cup-handle-'+str(i),[(x+.033,y,.064),(x+.055,y,.065),(x+.06,y,.046),(x+.032,y,.039)],.006,'porcelain',sides=6)
b.finish()
