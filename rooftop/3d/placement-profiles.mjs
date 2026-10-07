import { WEAPONS } from '../weapons.mjs';
import { PLANTS, POTS } from '../botany.mjs';
import { plantPotSpec } from './plant-pots.mjs';
import { vesselDimensions, vesselInterior } from './vessel-models.mjs';
import { foliageHeight } from './plant-envelope.mjs';
import { washstationSpec } from './washstation.mjs';
import { OBJECT_DIMENSIONS } from './object-dimensions.mjs';

const plants = new Map(PLANTS.map(p=>[p.id,p]));
const weapons = new Map(WEAPONS.map(a=>[a.id,a]));
const pots = new Map(POTS.map(p=>[p.id,p]));
// A single catalogue contract. Adding a non-botanical asset requires choosing a
// group here and defining its surfaces/clearances below; unknown IDs never fall
// through to a misleading "small prop" category.
export const SPACE_GROUPS = [
  {id:'racks', role:'furniture', label:'花架', types:['shelf','woodshelf','tierstand','ladderstand','wallrack','plantcart','wirestand','basketstand','coveredstand']},
  {id:'tops', role:'furniture', label:'桌椅与台面', types:['table','pottingbench','bistrotable','bench','stool','gardenbench','foldingchair','room-armchair','ceramicseat','lowplatform','stepstool','foamstand']},
  {id:'closed', role:'furniture', label:'柜床与箱桶', types:['room-wardrobe','room-dresser','storagechest','room-bed','rainbarrel']},
  {id:'wash', role:'furniture', label:'水池台', types:['sink','basin']},
  {id:'cases', role:'holder', label:'玻璃罩与保湿柜', types:['terrarium','wardcase','browncover']},
  {id:'containers', role:'holder', label:'空容器', types:['bucket','crate','redbox','pot','enamelbowl','strainer','wirebasket','bamboo-basket']},
  {id:'vessels', role:'holder', label:'花盆与花器', types:POTS.map(p=>'vessel-'+p.id)},
  {id:'plants', role:'item', label:'植物', types:PLANTS.map(p=>p.id)},
  {id:'cultivation', role:'item', label:'栽培物件', types:['moss','mossbox','seedtray','foambox']},
  {id:'aquatic', role:'item', label:'水族物件', types:['fish','pond','medakabowl','goldfishbowl','fishbox']},
  {id:'tools', role:'item', label:'园艺工具', types:['watering','tools','hose','thermometer','towel','soilbag','labels','gloves','brush','lid','sprayer','pruning-shears','broom']},
  {id:'daily', role:'item', label:'生活用品与装置', types:['teaset','pigbowl','drying','trellis','parasol']},
  {id:'decoration', role:'item', label:'灯饰与摆件', types:['solarlamp','tasklamp','tinlantern','stringlights','pinwheel','windchime']},
  {id:'firearms', role:'item', label:'枪械', types:WEAPONS.filter(w=>w.category==='枪械').map(w=>w.id)},
  {id:'weapons', role:'item', label:'其他兵器', types:WEAPONS.filter(w=>w.category!=='枪械').map(w=>w.id)},
];
const definitions = new Map();
for (const [order,group] of SPACE_GROUPS.entries()) for (const type of group.types) {
  if(definitions.has(type))throw Error('重复空间定义：'+type);
  definitions.set(type,{group:group.id,category:group.label,role:group.role,order,
    bearing:group.role!=='item',portable:true,
    // Compatibility inference is deliberately narrower than explicit placement.
    // Existing floor furniture must not acquire a new parent when opening a save.
    inferLegacy:group.role!=='furniture'||['bench','stool','ceramicseat'].includes(type),
    kind:plants.has(type)?'plant':group.id==='vessels'?'vessel':group.role==='holder'?'container':group.role==='furniture'?'furniture':'prop'});
}
const racks = new Set(SPACE_GROUPS[0].types);
const floorFurniture = new Set(SPACE_GROUPS.filter(g=>g.role==='furniture').flatMap(g=>g.types));
export function placementKind(type) {
  const definition=definitions.get(type);
  if(!definition)throw Error('缺少空间定义：'+type);
  return definition;
}

export function physicalFootprint(o) {
  const p=plants.get(o.type),s=o.scale||1;
  if(p || o.type.startsWith('vessel-') || o.type==='pot') {
    const spec=p?plantPotSpec(p):o.type==='pot'?{radius:.5625,height:.9375}:{radius:.67,height:.58};
    const pot=pots.get(p?(o.pot||p.defaultPot):o.type==='pot'?'terra':o.type.slice(7))||pots.get('terra');
    const v=vesselDimensions(pot,spec.radius,spec.height),k=s*(p?(p.id==='barrel'?1.15:1.38):1);
    let w,d,mw,md;
    if(/box|bag/.test(pot.shape)) {
      w=spec.radius*(pot.id==='trough'?3.1:1.95);d=spec.radius*(pot.id==='trough'?1.32:1.55);mw=w+.12;md=d+.12;
    } else {
      const base=v.foot > 0 ? .66 : (v.art?.profile[0][0]||.70);
      w=d=spec.radius*2*base;
      mw=spec.radius*2*(v.art?Math.max(...v.art.profile.map(q=>q[0])):1)+.10;
      md=mw*(v.art?.shape==='oval'?.76:1);d*=v.art?.shape==='oval'?.76:1;
    }
    const body=v.h+v.foot,extra=p?foliageHeight(p,o,spec.radius,body):0;
    return {w:w*k,d:d*k,mouthW:mw*k,mouthD:md*k,h:(body-.044+extra)*k,body:body*k,circle:!(/box|bag|square/.test(v.art?.shape||pot.shape)),groundW:w*k,groundD:d*k};
  }
  const weapon=weapons.get(o.type);
  if(weapon)return {w:weapon.w*.043*s,d:weapon.h*.043*s,h:.28*s,body:.28*s,groundW:weapon.w*.043*s,groundD:weapon.h*.043*s};
  const dim=OBJECT_DIMENSIONS[o.type];
  if(!dim)throw Error('缺少放置规格：'+o.type);
  const [w,d,h]=dim.map(v=>v/16*s);
  const smallBases={parasol:[1.02,1.02],broom:[w*.55/s,d*.42/s],pinwheel:[.54,.54],tasklamp:[.7,.7],windchime:[.8,.6],solarlamp:[.1,.1],thermometer:[.2,.15]};
  const base=smallBases[o.type];
  const rackBase=racks.has(o.type)&&!['woodshelf','ladderstand','plantcart'].includes(o.type);
  const feet=rackBase?[(w*.90+.075*1.7*s),(d*.86+.075*1.7*s)]:null;
  return {w,d,h,body:h,groundW:base?base[0]*s:feet?feet[0]:floorFurniture.has(o.type)?Math.max(.2,w-.12*s):w,groundD:base?base[1]*s:feet?feet[1]:floorFurniture.has(o.type)?Math.max(.15,d-.12*s):d};
}

// These descriptors are also used by the geometry builders. Heights identify the
// top of a board, never its centre; ceiling is clear space under the next board.
export function supportSurfaces(o) {
  if(o.type.startsWith('vessel-')||o.type==='pot') {
    const p=pots.get(o.type==='pot'?'terra':o.type.slice(7));
    const radius=o.type==='pot'?.5625:.67,height=o.type==='pot'?.9375:.58;
    const interior=vesselInterior(p,radius,height),s=o.scale||1;
    return [{id:'inside',label:'器物内部',x:0,z:0,y:interior.y*s,w:interior.w*s,d:interior.d*s,rim:interior.rim*s,shape:interior.shape,container:true,ceiling:Infinity,thickness:0}];
  }
  const dim=OBJECT_DIMENSIONS[o.type];if(!dim)return[];
  const [w,d,h]=dim.map(v=>v/16),type=o.type,s=o.scale||1;
  const rect=(id,label,y,ww=w,dd=d,z=0,extra={})=>({id,label,y:y*s,w:ww*s,d:dd*s,x:0,z:z*s,ceiling:Infinity,thickness:0,...extra});
  const scaleExtra=(v)=>Object.fromEntries(Object.entries(v).map(([k,n])=>[k,typeof n==='number'&&['x','ceiling','thickness','rim'].includes(k)?n*s:n]));
  const r=(id,label,y,ww=w,dd=d,z=0,extra={})=>rect(id,label,y,ww,dd,z,scaleExtra(extra));
  if(['woodshelf','ladderstand'].includes(type))return [0,1,2].map(i=>r(['lower','middle','upper'][i],['第一层','第二层','第三层'][i],.23+i*(h-.24)/2,w-(type==='ladderstand'?i*.18:0),d*.37,d/2-(i+.5)*d/3,{thickness:.10}));
  if(racks.has(type)&&type!=='foamstand') {
    const yy=type==='plantcart'?[h*.13,h*.51,h*.90]:type==='wallrack'?[.18,h*.40,h*.68,h*.92]:[.18,h*.52,h*.92];
    const thickness=type==='plantcart'?.06:.075;
    return yy.map((y,i)=>r(['lower','middle','upper','highest'][i],`第${['一','二','三','四'][i]}层`,y+thickness/2,w*.94,d*.88,0,{thickness,ceiling:i<yy.length-1?yy[i+1]-y-thickness:type==='coveredstand'?h+.21-y-thickness/2:Infinity}));
  }
  if(type==='stepstool')return[r('lower','下层踏板',h*.48+.055,w*.88,d*.35,d*.26),r('upper','上层踏板',h+.06,w*.88,d*.44,-d*.20)];
  if(['table','bistrotable'].includes(type))return[r('top','桌面',h+.05,w*.96,d*.94,0,{shape:type==='bistrotable'?'ellipse':'rect'})];
  if(['bench','stool','lowplatform','pottingbench'].includes(type))return[r('top','台面',h*.94+.055,w*.94,d*.92)];
  if(['room-dresser','room-wardrobe','storagechest'].includes(type))return[r('top','柜顶',h+.06,w*.95,d*.95)];
  if(type==='room-bed')return[r('top','床面',h*.71+.009,w*.86,d*.49,d*.19)];
  if(type==='room-armchair')return[r('seat','座面',h*.50,w*.66,d*.52,d*.10)];
  if(type==='gardenbench')return[r('seat','座面',h*.5+.05,w*.76,d*.70,d*.04)];
  if(type==='foldingchair')return[r('seat','座面',h*.52+.05,w*.78,d*.61)];
  if(type==='ceramicseat')return[r('top','顶面',h+.058,w*.75,d*.75,0,{shape:'ellipse'})];
  if(type==='foamstand')return[r('top','木台面',h*.94+.055,w*.94,d*.92,0,{thickness:.11})];
  if(['crate','redbox','wirebasket'].includes(type))return[r('inside','容器内部',.075,w-.20,d-.20,0,{container:true,rim:h+.05})];
  if(type==='bamboo-basket')return[r('inside','篮内底面',.075,w*.65,d*.64,0,{container:true,rim:h*.73,shape:'ellipse'})];
  if(type==='rainbarrel')return[r('top','桶盖',h*.93+.057,w*.78,d*.78,0,{shape:'ellipse',holes:[{x:0,z:0,w:.35*s,d:.12*s,shape:'rect'}]})];
  if(['terrarium','wardcase'].includes(type))return[r('inside','柜内底板',.16,w*.83,d*.73,0,{container:true,ceiling:h*.71-.16,rim:h})];
  if(type==='bucket')return[r('inside','桶内',.095,.50,.50,0,{container:true,rim:.69,shape:'ellipse'})];
  if(['enamelbowl','strainer'].includes(type))return[r('inside','盆内',type==='enamelbowl'?.18:.075,w*.53,d*.53,0,{container:true,rim:h*.8,shape:'ellipse'})];
  if(type==='browncover')return[r('inside','罩内',.055,w*.5,d*.5,0,{container:true,ceiling:w*.36-.055,rim:w*.44})];
  if(type==='sink'||type==='basin') {
    const {bw,bd,bx,top,depth}=washstationSpec(w,d,h,type);
    return [
      r('counter','水池台面',top+.075,w*.98,d*.93,d*.015,{holes:[{x:bx*s,z:0,w:(bw+.04)*s,d:(bd+.04)*s,shape:type==='basin'?'ellipse':'rect'}]}),
      r('inside','池内中央',top-depth+.021,bw*.72,bd*.69,0,{x:bx,container:true,rim:top,shape:type==='basin'?'ellipse':'rect',point:true}),
    ];
  }
  return[];
}

// A ground region is a convenience for finding the real floor under furniture.
// It creates no support edge and is never carried by that furniture.
export function placementSpaces(o) {
  const surfaces=supportSurfaces(o).map(s=>({...s,bearing:'object'}));
  const dim=OBJECT_DIMENSIONS[o.type];if(!dim)return surfaces;
  const [w,d,h]=dim.map(v=>v/16),type=o.type,s=o.scale||1;
  let ceiling=null,ww=w*.78,dd=d*.72,z=0;
  if(['table','bench','stool','lowplatform','foamstand','pottingbench'].includes(type))ceiling=(type==='table'?h:h*.94)-.065;
  if(type==='bistrotable'){ceiling=h-.06;ww=w*.76;dd=d*.76}
  if(type==='gardenbench')ceiling=h*.5-.055;
  if(type==='foldingchair'){ceiling=h*.52-.055;ww=w*.65;dd=d*.59}
  if(type==='room-bed'){ceiling=h*.39-.08;ww=w*.79;dd=d*.82}
  if(type==='room-armchair'){ceiling=h*.32;ww=w*.66;dd=d*.72}
  if(['room-dresser','room-wardrobe'].includes(type))ceiling=h*.08;
  if(['sink','basin'].includes(type)){ceiling=h*.94-.26;ww=w*.77;dd=d*.72}
  if(racks.has(type)&&!['woodshelf','ladderstand'].includes(type))ceiling=supportSurfaces({...o,scale:1})[0].y-.09;
  if(['woodshelf','ladderstand'].includes(type))for(const board of supportSurfaces(o))surfaces.push({...board,id:'under-'+board.id,label:board.label+'下方地面',bearing:'ground',y:0,w:board.w-.30*s,d:board.d-.16*s,ceiling:board.y-.10*s,thickness:0});
  if(ceiling!==null&&ceiling>.025)surfaces.push({id:'under',label:'下方地面',bearing:'ground',x:0,z:z*s,y:0,w:ww*s,d:dd*s,ceiling:ceiling*s,thickness:0});
  return surfaces;
}

// Solid parts occupy local volumes. Both dropdown placement and dragging use
// these constraints, including legs, braces, plumbing and the underside of bowls.
function buildSpaceObstacles(o) {
  const dim=OBJECT_DIMENSIONS[o.type];if(!dim)return[];
  const [w,d,h]=dim.map(v=>v/16),type=o.type,s=o.scale||1,parts=[];
  const box=(x,y,z,ww,hh,dd,extra={})=>parts.push({x:x*s,y:y*s,z:z*s,w:ww*s,h:hh*s,d:dd*s,...extra});
  if(floorFurniture.has(type)&&!['ceramicseat','storagechest','rainbarrel','woodshelf','ladderstand'].includes(type)) {
    const legTop=['gardenbench','foldingchair'].includes(type)?h*.5:type==='room-bed'?h*.45:type==='room-armchair'?h*.3:['room-wardrobe','room-dresser'].includes(type)?.19:h;
    for(const x of[-w*.45,w*.45])for(const z of[-d*.43,d*.43])box(x,legTop/2,z,.14,legTop,.14);
  }
  if(['woodshelf','ladderstand'].includes(type))for(const board of supportSurfaces({...o,scale:1}))for(const x of[-board.w*.46,board.w*.46])box(x,(board.y-.05)/2,board.z,.11,board.y-.05,.11);
  if(['storagechest','ceramicseat','rainbarrel'].includes(type)) {
    const bodyTop=type==='rainbarrel'?h*.93+.03:h;box(0,bodyTop/2,0,w*.80,bodyTop,d*.80);
  }
  if(type==='table')box(0,h*.7,-d*.41,w,.12,.11);
  if(type==='pottingbench')box(0,h*.8,d*.3,w*.9,h*.22,d*.32);
  if(['room-wardrobe','room-dresser'].includes(type))box(0,h*.53,0,w,h*.9,d);
  if(type==='room-armchair') {
    box(0,h*.76,-d*.37,w*.84,h*.53,d*.18);
    for(const x of[-w*.44,w*.44])box(x,h*.58,0,w*.16,h*.4,d*.88);
  }
  if(['gardenbench','foldingchair'].includes(type))box(0,h*.79,-d*.4,w*.85,h*.40,.14);
  if(type==='room-bed')for(const z of[-d*.47,d*.47])box(0,h*(z<0?.67:.33),z,w,h*(z<0?.66:.28),.14);
  if(type==='bistrotable')for(const z of[-d*.2,d*.2])box(0,h*.48,z,w*.45,h*.90,.07);
  if(['sink','basin'].includes(type)) {
    const {bw,bd,bx,top,depth}=washstationSpec(w,d,h,type),py=top-depth-.06;
    box(bx,top-depth/2-.028,0,bw,depth+.055,bd,{cavity:'inside'});
    box(bx,(py+.08)/2,0,.15,py-.08,.15);
    box(bx,.12,-.20,.12,.12,.42);box(bx,.235,-.43,.12,.35,.12);
    box(bx,.35,(-.43-d*.46)/2,.12,.12,d*.46-.43+.12);
    for(const x of[-w*.43,w*.43])box(x,top*.25,0,.055,.055,d*.83);
    box(0,top*.25,-d*.4,w*.85,.055,.055);
    box(0,top+.16,-d*.48,w,.23,.065);
    box(bx,top+.33,-bd/2+.06,.48,.58,.45);
  }
  for(const surface of supportSurfaces({...o,scale:1}).filter(q=>!q.container&&!q.holes)) {
    const thick=surface.thickness||.11;
    box(surface.x||0,surface.y-thick/2,surface.z||0,surface.w,thick,surface.d);
  }
  return parts;
}

const obstacleCache=new Map();
export function spaceObstacles(o) {
  const key=o.type+':'+(o.scale||1);
  if(!obstacleCache.has(key)) {
    if(obstacleCache.size>1024)obstacleCache.clear();
    obstacleCache.set(key,buildSpaceObstacles(o));
  }
  return obstacleCache.get(key);
}
