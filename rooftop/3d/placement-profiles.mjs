import { WEAPONS } from '../weapons.mjs';
import { PLANTS, POTS } from '../botany.mjs';
import { plantPotSpec } from './plant-pots.mjs';
import { vesselDimensions, vesselInterior } from './vessel-models.mjs';
import { foliageHeight } from './plant-envelope.mjs';
import { OBJECT_DIMENSIONS } from './object-dimensions.mjs';

const plants = new Map(PLANTS.map(p=>[p.id,p]));
const weapons = new Map(WEAPONS.map(a=>[a.id,a]));
const pots = new Map(POTS.map(p=>[p.id,p]));
const racks = new Set(['shelf','woodshelf','tierstand','ladderstand','wallrack','plantcart','wirestand','basketstand','coveredstand','foamstand']);
const seats = new Set(['bench','stool','gardenbench','bistrotable','foldingchair','table','pottingbench','lowplatform','stepstool','ceramicseat']);
const cabinets = new Set(['room-bed','room-wardrobe','room-dresser','room-armchair','storagechest']);
const containers = new Set(['crate','redbox','wirebasket','bamboo-basket','bucket','pot','enamelbowl','foambox','seedtray','fish','pond','moss','mossbox','terrarium','wardcase','browncover','strainer','medakabowl','goldfishbowl','fishbox']);
const floorOnly = new Set([...racks,...cabinets,'table','bistrotable','pottingbench','gardenbench','foldingchair','trellis','drying','parasol','sink','basin','rainbarrel','broom','solarlamp','stringlights']);

export function placementKind(type) {
  if(plants.has(type))return {kind:'plant',portable:true};
  if(type.startsWith('vessel-'))return {kind:'vessel',category:'花盆与花器',portable:true};
  const category = racks.has(type)?'花架':seats.has(type)?'桌凳与台面':cabinets.has(type)?'柜与床':containers.has(type)?'容器':floorOnly.has(type)?'落地器具':'可摆小物';
  return {kind:containers.has(type)?'container':floorOnly.has(type)?'furniture':'prop',category,portable:!floorOnly.has(type)};
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
  return {w,d,h,body:h,groundW:base?base[0]*s:feet?feet[0]:floorOnly.has(o.type)?Math.max(.2,w-.12*s):w,groundD:base?base[1]*s:feet?feet[1]:floorOnly.has(o.type)?Math.max(.15,d-.12*s):d};
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
  if(type==='room-bed')return[r('top','床面',h*.70+.009,w*.86,d*.49,d*.19)];
  if(type==='room-armchair')return[r('seat','座面',h*.50,w*.66,d*.52,d*.10)];
  if(type==='gardenbench')return[r('seat','座面',h*.5+.05,w*.76,d*.70,d*.04)];
  if(type==='foldingchair')return[r('seat','座面',h*.52+.05,w*.78,d*.61)];
  if(type==='ceramicseat')return[r('top','顶面',h,w*.75,d*.75,0,{shape:'ellipse'})];
  if(type==='foamstand')return[r('soil','种植面',h+.47,w*.70,d*.68,0,{container:true,rim:h+.47})];
  if(['crate','redbox','wirebasket','bamboo-basket','foambox','seedtray','mossbox'].includes(type)) {
    const filled=['foambox','seedtray','mossbox'].includes(type);
    return[r('inside',filled?'填充面':'容器内部',filled?h+.015:.075,w-.20,d-.20,0,{container:true,rim:h+.05})];
  }
  if(['terrarium','wardcase'].includes(type))return[r('inside','柜内底板',.16,w*.83,d*.73,0,{container:true,ceiling:h*.71-.16,rim:h})];
  if(type==='bucket')return[r('inside','桶内',.095,.50,.50,0,{container:true,rim:.69,shape:'ellipse'})];
  if(['enamelbowl','strainer'].includes(type))return[r('inside','盆内',type==='enamelbowl'?.18:.075,w*.53,d*.53,0,{container:true,rim:h*.8,shape:'ellipse'})];
  if(type==='browncover')return[r('inside','罩内',.055,w*.5,d*.5,0,{container:true,ceiling:w*.36-.055,rim:w*.44})];
  if(type==='sink'||type==='basin') {
    const bw=type==='sink'?w*.48:w*.72,bd=d*.68,bx=type==='sink'?w*.19:0,top=h*.94,depth=Math.min(.45,h*.53);
    const surfaces=[r('inside','水池内部',top-depth+.021,bw*.72,bd*.69,0,{x:bx,container:true,rim:top,shape:type==='basin'?'ellipse':'rect'})];
    if(type==='sink')surfaces.push(r('counter','左侧台面',top+.075,w*.40,d*.83,0,{x:-w*.29}));
    for(const side of [-1,1])surfaces.push(r(side===1?'front':'back',side===1?'前沿台面':'后沿台面',top+.075,w*.85,(d-bd)/2-.09,side*(d+bd)/4));
    return surfaces;
  }
  return[];
}
