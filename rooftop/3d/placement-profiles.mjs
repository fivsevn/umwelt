import { ITEMS, ITEM_METRES_TO_UNITS as U, getItemDefinition, getPlantAssembly } from '../item-catalog.mjs';

const groups=[['plants','植物'],['racks','架子'],['rooms','桌椅与居室'],['cultivation','栽培与盛放'],['daily','日用与照明'],['collection','收藏'],['firearms','枪械'],['weapons','兵器']];
export const SPACE_GROUPS=groups.map(([id,label])=>({id,label,types:ITEMS.filter(item=>item.category===label).map(item=>item.id)}));
const definitions=new Map();
for(const [order,group] of SPACE_GROUPS.entries())for(const type of group.types){
  const item=getItemDefinition(type),bearing=!!item.surfaces.length;
  const furniture=item.placement==='floor'||['架子','桌椅与居室'].includes(item.category);
  const role=furniture?'furniture':bearing?'holder':'item';
  definitions.set(type,{group:group.id,category:group.label,order,role,bearing,portable:true,
    placement:item.placement,inferLegacy:false,
    kind:item.category==='植物'?'plant':item.originalVesselId||item.originalVesselRecord?'vessel':role==='holder'?'container':role==='furniture'?'furniture':'prop'});
}
export function placementKind(type){
  const item=getItemDefinition(type),definition=item&&definitions.get(item.id);
  if(!definition)throw Error('缺少空间定义：'+type);
  return type===item.id?definition:{...definition,inferLegacy:definition.role!=='furniture'};
}
function dimensions(item){
  const contact=item.contactBounds,base=item.footprint||{};
  const w=contact?.width||base.width||item.width,d=contact?.depth||base.depth||item.depth;
  const circle=['circle','round','faceted','scallop','mokko'].includes(base.shape||item.shape)&&Math.abs(w-d)<.01;
  return {w,d,circle,ellipse:circle||base.shape==='ellipse',x:contact?.center?.[0]||0,z:contact?.center?.[1]||0};
}
export function physicalFootprint(o){
  const item=getItemDefinition(o.type);if(!item)throw Error('缺少物件尺寸：'+o.type);
  const k=U*(o.scale||1),assembly=getPlantAssembly(o.type,o.pot),body=assembly?.pot||item,p=dimensions(body);
  const weapon=item.weapon;
  const w=weapon?item.width:p.w,d=weapon?item.depth:p.d;
  const bx=((body.boundsMin[0]+body.boundsMax[0])/2)*k,bz=-((body.boundsMin[1]+body.boundsMax[1])/2)*k;
  return {w:w*k,d:d*k,h:(assembly?.height??item.height)*k,body:(assembly?.rigidBodyHeight??item.height)*k,
    mouthW:body.width*k,mouthD:body.depth*k,groundW:w*k,groundD:d*k,
    x:weapon?bx:p.x*k,z:weapon?bz:p.z*k,groundX:weapon?bx:p.x*k,groundZ:weapon?bz:p.z*k,
    circle:p.circle,ellipse:p.ellipse,
    bodyX:bx,bodyZ:bz};
}

// Source catalogs use Blender X/Y/Z. Native GLB and spatial layout use X/Y/-Z.
// Every distance, including drainage radii and clearance, shares the same scale.
export function supportSurfaces(o){
  const item=getItemDefinition(o.type),k=U*(o.scale||1);
  if(!item||item.category==='植物')return[];
  return item.surfaces.map(s=>{
    const container=!!s.container,center=s.center||[0,0],opening=item.opening||{};
    const surface={id:s.id,name:s.name,label:s.name,x:center[0]*k,z:-center[1]*k,y:s.height*k,
      w:s.width*k,d:s.depth*k,shape:s.shape==='circle'?'ellipse':s.shape,
      container,point:!!s.point,bearing:'surface',rim:s.rimHeight===undefined?undefined:s.rimHeight*k,
      internalDepth:container?(s.rimHeight-s.height)*k:undefined,
      // An open vessel's internal depth is not a roof over its contents.
      ceiling:container?Infinity:s.headroom==null||s.headroom>=10?Infinity:s.headroom*k,
      openingW:container?(s.openingWidth??opening.width??s.width)*k:undefined,
      openingD:container?(s.openingDepth??opening.depth??s.depth)*k:undefined,
      openingShape:(opening.shape||s.shape)==='circle'?'ellipse':opening.shape||s.shape,
      conservativeFit:s.conservativeFit,
      holes:(s.holes||[]).map(h=>({x:(center[0]+(h.center?.[0]||0))*k,z:-(center[1]+(h.center?.[1]||0))*k,
        w:(h.width??h.radius*2)*k,d:(h.depth??h.radius*2)*k,shape:h.shape==='circle'?'ellipse':h.shape})),
    };
    if(s.openGrid){
      const bars=(item.physicalParts||[]).filter(p=>/shelf-grid|basket-floor/.test(p.role)&&Math.abs((p.min[1]+p.max[1])/2-s.height)<.03);
      // Exact rail rectangles handle grids with unequal pitches or two axes.
      surface.gridBars=bars.map(p=>({x:(p.min[0]+p.max[0])*k/2,z:(p.min[2]+p.max[2])*k/2,w:(p.max[0]-p.min[0])*k,d:(p.max[2]-p.min[2])*k}));
    }
    return surface;
  });
}

export function spaceObstacles(o){
  const item=getItemDefinition(o.type),k=U*(o.scale||1);
  if(!item?.physicalParts)return[];
  const cavities=supportSurfaces(o).filter(s=>s.container);
  return item.physicalParts.filter(part=>!/^lid[:/-]/.test(part.role)).map(part=>{
    const lo=part.min,hi=part.max;
    const box={x:(lo[0]+hi[0])*k/2,y:(lo[1]+hi[1])*k/2,z:(lo[2]+hi[2])*k/2,w:(hi[0]-lo[0])*k,h:(hi[1]-lo[1])*k,d:(hi[2]-lo[2])*k,role:part.role};
    // An annular shell has a full box around its opening. That proxy must not
    // fill the actual cavity; its floor, rim, opening and holes constrain fits.
    if(/pot-shell|^foot ring$|^outer-|^inner-|^foot-|^drainage|^rim$|^body:|^basket-(?:wall|rim|floor)|^basin-(?:shell|floor)|^container|^bucket|^crate|^tray|^perforated-wall$|^reservoir$/.test(part.role)){
      box.cavities=cavities.filter(s=>lo[1]*k<s.rim+.02&&hi[1]*k>s.y-.02).map(s=>s.id);
    }
    return box;
  }).filter(p=>p.w>1e-7&&p.d>1e-7&&p.h>1e-7);
}
export function placementSpaces(o){
  const surfaces=supportSurfaces(o),item=getItemDefinition(o.type),parts=spaceObstacles(o),k=U*(o.scale||1);
  if(!item||!['架子','桌椅与居室'].includes(item.category))return surfaces;
  // A floor region is measured between the native legs, below the first actual
  // surface. It has no support relationship and remains when the parent moves.
  const first=surfaces.filter(s=>!s.container).sort((a,b)=>a.y-b.y)[0];
  const legs=parts.filter(p=>/post|leg/.test(p.role)&&p.y-p.h/2<.08*k);
  if(!first||legs.length<3||first.y<.16*k)return surfaces;
  const xs=legs.map(p=>p.x),zs=legs.map(p=>p.z);
  const w=Math.max(...xs)-Math.min(...xs)-Math.max(...legs.map(p=>p.w));
  const d=Math.max(...zs)-Math.min(...zs)-Math.max(...legs.map(p=>p.d));
  if(w>.01&&d>.01)surfaces.push({id:'under',name:'架下地面',label:'架下地面',x:(Math.max(...xs)+Math.min(...xs))/2,z:(Math.max(...zs)+Math.min(...zs))/2,y:0,w,d,shape:'rectangle',bearing:'ground',ceiling:first.y-Math.max(.015*k,...parts.filter(p=>Math.abs(p.y+p.h/2-first.y)<.01*k).map(p=>p.h))});
  return surfaces;
}
