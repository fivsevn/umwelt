import { plantContact } from "../plant-art.mjs";
import { PLANTS, POTS } from '../botany.mjs';
import { OBJECT_DIMENSIONS } from './object-models.mjs';
import { plantPotSpec } from './plant-pots.mjs';
import { vesselDimensions } from './vessel-models.mjs';
const plants=new Map(PLANTS.map(p=>[p.id,p])),pots=new Map(POTS.map(p=>[p.id,p]));
export function physicalFootprint(o) {
 const p=plants.get(o.type),s=o.scale||1;
 if(p){const spec=plantPotSpec(p),k=(p.id==='barrel'?1.15:1.38)*s;
   const v=vesselDimensions(pots.get(o.pot||p.defaultPot)||pots.get('terra'),spec.radius,spec.height);
   return {w:spec.radius*1.38*k,d:spec.radius*1.38*k,mouthW:spec.radius*2*k,mouthD:spec.radius*2*k,h:(v.h+v.foot+Math.max(.3,(/tails|ivy|beadtail|threads/.test(p.form)?.40:/tiny|moss|cushion|stars|sphagnum|silver|swept|feather/.test(p.form)?.35:/rosette|stones|bubble|windows|fan|beads|jaws/.test(p.form)?.65:1.4)))*k,body:(v.h+v.foot)*k,circle:true};}
 if(o.type.startsWith('vessel-')){const p=pots.get(o.type.slice(7)),v=vesselDimensions(p,.67,.58);const base=v.art?.foot? .62 : (v.art?.profile[0][0]||.70),body=v.art?Math.max(...v.art.profile.map(p=>p[0])):1;return{w:1.34*base*s,d:1.34*base*s,mouthW:1.42*body*s,mouthD:1.42*body*s,h:(v.h+v.foot)*s,body:(v.h+v.foot)*s,circle:true}}
 const dd=OBJECT_DIMENSIONS[o.type];return dd?{w:dd[0]/16*s,d:dd[1]/16*s,h:dd[2]/16*s,body:dd[2]/16*s}:{w:.7*s,d:.6*s,h:.5*s,body:.5*s};
}
// Coordinates and elevations correspond to the geometry builders, including the
// board's thickness, tray floor and clear gap below the next tier.
export function supportSurfaces(o) {
 const dd=OBJECT_DIMENSIONS[o.type];if(!dd)return[];
 const [w,d,h]=dd.map(n=>n/16),type=o.type,s=o.scale||1,rect=(y,ww=w,dep=d,z=0,ceiling=Infinity,container=false)=>({y:y*s,w:ww*s,d:dep*s,z:z*s,ceiling:ceiling*s,container});
 if(['woodshelf','ladderstand'].includes(type))return [0,1,2].map(i=>rect(.18+i*(h-.24)/2+.05,w-(type==='ladderstand'?i*.18:0),d*.37,d/2-(i+.5)*d/3));
 if(['shelf','tierstand','wallrack','wirestand','basketstand','coveredstand'].includes(type)) {
  const yy=[.18,h*.52,h*.92];return yy.map((y,i)=>rect(y+.0375,w*.88,d*.80,0,i<2?yy[i+1]-y-.10:Infinity));
 }
 if(type==='stepstool')return[rect(h*.48+.055,w*.88,d*.35,d*.26),rect(h+.06,w*.88,d*.44,-d*.20)];
 if(type==='bamboo-basket')return[rect(.075,w*.57,d*.58,0,Infinity,true)];
 if(type==='plantcart'){const yy=[h*.13,h*.51,h*.90];return yy.map((y,i)=>rect(y+.03,w*.9,d*.84,0,i<2?yy[i+1]-y-.08:Infinity))}
 if(['table','bistrotable'].includes(type))return[rect(h+.05,w*.96,d*.94)];
 if(['bench','stool','lowplatform','pottingbench'].includes(type))return[rect(h*.94+.055,w*.94,d*.92)];
 if(['room-dresser','storagechest'].includes(type))return[rect(h+.06,w*.95,d*.95)];
 if(type==='gardenbench')return[rect(h*.5+.05,w*.91,d*.72,d*.05)];
 if(type==='foldingchair')return[rect(h*.52+.05,w*.78,d*.61)];
 if(type==='foamstand')return[rect(h+.46,w*.70,d*.68,0,Infinity,true)];
 if(['crate','redbox','wirebasket'].includes(type))return[rect(.075,w-.20,d-.20,0,Infinity,true)];
 if(['foambox','seedtray','mossbox'].includes(type))return[rect(h*.8+.0175,w-.22,d-.22,0,Infinity,true)];
 if(['terrarium','wardcase'].includes(type))return[rect(.17,w*.83,d*.73,0,h*.66,true)];
 if(type==='bucket')return[rect(.115,.46,.46,0,Infinity,true)];
 if(type==='enamelbowl')return[rect(.14,w*.53,d*.53,0,Infinity,true)];
 if(type==='sink'||type==='basin'){
   const bw=type==='sink'?w*.48:w*.72,bd=d*.68,depth=Math.min(.45,h*.53);
   const r=rect(h*.94-depth+.02,bw*.72,bd*.69,0,Infinity,true);r.x=(type==='sink'?w*.19:0)*s;return[r];
 }
 return[];
}
export const contactOffset=o=>o.contactY ?? (plants.has(o.type) ? (plantContact(o).bottom-1)*(o.scale||1) : 0);
const py=o=>o.y+contactOffset(o);
export function localPoint(child,parent) {
 const a=-(parent.rotation||0)*Math.PI/180,dx=(child.x-parent.x)/16,dz=(py(child)-py(parent))/16;
 return{x:dx*Math.cos(a)-dz*Math.sin(a),z:dx*Math.sin(a)+dz*Math.cos(a)};
}
export function fitsSurface(child,parent,surface) {
 const p=physicalFootprint(child),q=localPoint(child,parent),a=((child.rotation||0)-(parent.rotation||0))*Math.PI/180;
 const width=surface.container?(p.mouthW||p.w):p.w,depth=surface.container?(p.mouthD||p.d):p.d;
 const ww=p.circle?width:Math.abs(Math.cos(a))*width+Math.abs(Math.sin(a))*depth;
 const dd=p.circle?depth:Math.abs(Math.sin(a))*width+Math.abs(Math.cos(a))*depth;
 return Math.abs(q.x-(surface.x||0))+ww/2<=surface.w/2+.015 && Math.abs(q.z-surface.z)+dd/2<=surface.d/2+.015 && p.h<=surface.ceiling+.025;
}
export function resolveSupports(list) {
 const result=new Map(),visiting=new Set();
 const resolve=o=>{
  if(result.has(o.id))return result.get(o.id);if(visiting.has(o.id))return{height:0};visiting.add(o.id);
  const own=physicalFootprint(o),candidates=[];
  for(const parent of list){if(parent.id===o.id)continue;
   const pp=physicalFootprint(parent);if(pp.w*pp.d<=own.w*own.d*1.06)continue;
   const surfaces=supportSurfaces(parent),q=localPoint(o,parent);
   const preferred=surfaces.length>1?(q.z>pp.d*.13?0:q.z< -pp.d*.12?surfaces.length-1:Math.floor(surfaces.length/2)):0;
   surfaces.forEach((surface,i)=>{if(fitsSurface(o,parent,surface))candidates.push({parent,surface,index:i,score:Math.abs(i-preferred)*3+(q.x/pp.w)**2+((q.z-surface.z)/pp.d)**2+(surface.container?-.6:0)})});
  }
  candidates.sort((a,b)=>a.score-b.score || a.parent.id.localeCompare(b.parent.id));
  const best=candidates.find(c=>!visiting.has(c.parent.id));
  const answer=best?{height:resolve(best.parent).height+best.surface.y,parentId:best.parent.id,level:best.index,container:best.surface.container}:{height:0};
  visiting.delete(o.id);result.set(o.id,answer);return answer;
 };
 list.forEach(resolve);return result;
}

// Carry a supported arrangement through translation/rotation. Relations are
// derived from existing saves, so the file format needs no migration.
export function movedArrangement(list,id,patch) {
 const source=list.find(o=>o.id===id);if(!source)return list;
 const relations=resolveSupports(list),moves=new Set([id]);
 let changed=true;while(changed){changed=false;for(const [child,p]of relations)if(moves.has(p.parentId)&&!moves.has(child)){moves.add(child);changed=true}}
 const a=((patch.rotation??source.rotation??0)-(source.rotation||0))*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
 const xx=patch.x??source.x,yy=(patch.y??source.y)+contactOffset({...source,...patch}),ratio=(patch.scale??source.scale??1)/(source.scale||1);
 return list.map(o=>{if(o.id===id)return{...o,...patch};if(!moves.has(o.id))return o;
   const dx=(o.x-source.x)*ratio,dz=(py(o)-py(source))*ratio;
   return{...o,x:xx+dx*c-dz*s,y:yy+dx*s+dz*c-contactOffset(o),rotation:((o.rotation||0)+(patch.rotation??source.rotation??0)-(source.rotation||0)+360)%360};
 });
}

// Furniture can overlap by design; rigid pots must not pass through container walls.
// Check only objects changed by the edit, keeping old saves usable while they are refined.
export function clearContainerWalls(list, changedIds) {
 const positions=resolveSupports(list);
 for(const child of list) {
  if(changedIds && !changedIds.has(child.id))continue;
  const size=physicalFootprint(child),bottom=positions.get(child.id)?.height||0;
  for(const parent of list) {
   if(parent.id===child.id)continue;
   const outer=physicalFootprint(parent),parentY=positions.get(parent.id)?.height||0,q=localPoint(child,parent);
   for(const surface of supportSurfaces(parent).filter(s=>s.container)) {
    const rim=parentY+Math.max(surface.y+.10,parent.type==='bucket'?.69*(parent.scale||1):parent.type==='foamstand'?outer.h+.65*(parent.scale||1):parent.type==='sink'||parent.type==='basin'?outer.h*.94:outer.h);
    if(bottom>=rim-.025 || bottom+size.body<=parentY+surface.y-.025)continue;
    const mouthW=size.mouthW||size.w,mouthD=size.mouthD||size.d;
    // Ignore a neighbouring object whose solid base stays entirely outside.
    if(Math.abs(q.x-(surface.x||0))>=outer.w/2+size.w/2-.025 || Math.abs(q.z-surface.z)>=outer.d/2+size.d/2-.025)continue;
    const inside=Math.abs(q.x-(surface.x||0))+mouthW/2<=surface.w/2+.015 && Math.abs(q.z-surface.z)+mouthD/2<=surface.d/2+.015;
    if(!inside || size.h>surface.ceiling+.025)return false;
   }
  }
 }
 return true;
}
