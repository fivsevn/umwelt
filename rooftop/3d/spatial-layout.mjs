import { plantContact } from '../plant-art.mjs';
import { PLANTS } from '../botany.mjs';
import { physicalFootprint, supportSurfaces, placementKind } from './placement-profiles.mjs';
export { physicalFootprint, supportSurfaces, placementKind } from './placement-profiles.mjs';
const plants = new Set(PLANTS.map(p=>p.id));
export const contactOffset = o => o.contactY ?? (plants.has(o.type) ? (plantContact(o).bottom-1)*(o.scale||1) : 0);
const contactY = o => o.y + contactOffset(o);
export function localPoint(child,parent) {
  const a=-(parent.rotation||0)*Math.PI/180,dx=(child.x-parent.x)/16,dz=(contactY(child)-contactY(parent))/16;
  return {x:dx*Math.cos(a)-dz*Math.sin(a),z:dx*Math.sin(a)+dz*Math.cos(a)};
}
export function surfacePoint(parent,surface) {
  const a=(parent.rotation||0)*Math.PI/180,x=surface.x||0,z=surface.z||0;
  return {x:parent.x+16*(x*Math.cos(a)-z*Math.sin(a)),y:contactY(parent)+16*(x*Math.sin(a)+z*Math.cos(a))};
}
export function fitsSurface(child,parent,surface,{height=true,footprint=physicalFootprint(child)}={}) {
  if(!placementKind(child.type).portable)return false;
  const p=footprint,q=localPoint(child,parent),a=((child.rotation||0)-(parent.rotation||0))*Math.PI/180;
  const w=surface.container?(p.mouthW||p.w):p.w,d=surface.container?(p.mouthD||p.d):p.d;
  const ww=p.circle?w:Math.abs(Math.cos(a))*w+Math.abs(Math.sin(a))*d;
  const dd=p.circle?d:Math.abs(Math.sin(a))*w+Math.abs(Math.cos(a))*d;
  const dx=Math.abs(q.x-(surface.x||0)),dz=Math.abs(q.z-(surface.z||0));
  const fits=surface.shape==='ellipse'?((dx+ww/2)/(surface.w/2))**2+((dz+dd/2)/(surface.d/2))**2<=1.025:dx+ww/2<=surface.w/2+.015&&dz+dd/2<=surface.d/2+.015;
  return fits && (!height||p.h<=surface.ceiling+.025);
}
export function resolveSupports(list) {
  const result=new Map(),visiting=new Set(),index=new Map(list.map(o=>[o.id,o]));
  const footprints=new Map(),surfaces=new Map();
  const footprint=o=>{if(!footprints.has(o.id))footprints.set(o.id,physicalFootprint(o));return footprints.get(o.id)};
  const levels=o=>{if(!surfaces.has(o.id))surfaces.set(o.id,supportSurfaces(o));return surfaces.get(o.id)};
  const resolve=o=>{
    if(result.has(o.id))return result.get(o.id);
    if(visiting.has(o.id))return {height:0,invalid:'cycle'};
    visiting.add(o.id);
    let best=null,invalid=null;
    if(o.support) {
      const parent=index.get(o.support.id),surface=parent&&levels(parent).find(s=>s.id===o.support.surface);
      if(!parent||parent.id===o.id||!surface)invalid='missing';
      else if(!fitsSurface(o,parent,surface,{footprint:footprint(o)}))invalid='fit';
      else if(visiting.has(parent.id))invalid='cycle';
      else best={parent,surface,index:levels(parent).findIndex(s=>s.id===surface.id)};
    } else if(o.support!==null && placementKind(o.type).portable) {
      const own=footprint(o),candidates=[];
      for(const parent of list) {
        if(parent.id===o.id||visiting.has(parent.id))continue;
        const pp=footprint(parent);if(pp.w*pp.d<=own.w*own.d*1.06)continue;
        const surfaces=levels(parent),q=localPoint(o,parent);
        const preferred=surfaces.length>1?(q.z>pp.d*.13?0:q.z< -pp.d*.12?surfaces.length-1:Math.floor(surfaces.length/2)):0;
        surfaces.forEach((surface,i)=>{if(fitsSurface(o,parent,surface,{footprint:own}))candidates.push({parent,surface,index:i,score:Math.abs(i-preferred)*3+(q.x/pp.w)**2+((q.z-surface.z)/pp.d)**2+(surface.container?-.6:0)})});
      }
      candidates.sort((a,b)=>a.score-b.score||a.parent.id.localeCompare(b.parent.id));
      best=candidates.find(c=>!resolve(c.parent).invalid);
    }
    const base=best&&resolve(best.parent);
    const answer=best&&!base.invalid?{height:base.height+best.surface.y,parentId:best.parent.id,surfaceId:best.surface.id,level:best.index,container:!!best.surface.container}:{height:0,...(invalid||base?.invalid?{invalid:invalid||base.invalid}:{})};
    visiting.delete(o.id);result.set(o.id,answer);return answer;
  };
  list.forEach(resolve);return result;
}
export function supportedIds(list,id,relations=resolveSupports(list)) {
  const ids=new Set([id]);let changed=true;
  while(changed){changed=false;for(const [child,p]of relations)if(ids.has(p.parentId)&&!ids.has(child)){ids.add(child);changed=true}}
  return ids;
}
export function movedArrangement(list,id,patch) {
  const source=list.find(o=>o.id===id);if(!source)return list;
  const relations=resolveSupports(list),moves=supportedIds(list,id,relations);
  const a=((patch.rotation??source.rotation??0)-(source.rotation||0))*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
  const xx=patch.x??source.x,yy=(patch.y??source.y)+contactOffset({...source,...patch}),ratio=(patch.scale??source.scale??1)/(source.scale||1);
  return list.map(o=>{
    if(o.id===id)return {...o,...patch};if(!moves.has(o.id))return o;
    const dx=(o.x-source.x)*ratio,dz=(contactY(o)-contactY(source))*ratio;
    const parent=relations.get(o.id);
    return {...o,x:xx+dx*c-dz*s,y:yy+dx*s+dz*c-contactOffset(o),rotation:((o.rotation||0)+(patch.rotation??source.rotation??0)-(source.rotation||0)+360)%360,support:{id:parent.parentId,surface:parent.surfaceId}};
  });
}
// Contents sharing a surface need separate rigid bearing space. Leaves and
// handles may overlap; this check uses the base, or the full body inside a cavity.
function surfaceBounds(child,parent,surface,p=physicalFootprint(child)) {
  const q=localPoint(child,parent),a=((child.rotation||0)-(parent.rotation||0))*Math.PI/180;
  const w=surface.container?(p.mouthW||p.w):p.w,d=surface.container?(p.mouthD||p.d):p.d;
  return {x:q.x,z:q.z,w:p.circle?w:Math.abs(Math.cos(a))*w+Math.abs(Math.sin(a))*d,d:p.circle?d:Math.abs(Math.sin(a))*w+Math.abs(Math.cos(a))*d};
}
// Reuse one snapshot when the picker checks many parents and levels. Never keep
// this context after changing the layout; positions and occupied space may change.
export function createPlacementContext(list,id) {
  const relations=resolveSupports(list);
  return {relations,index:new Map(list.map(o=>[o.id,o])),excluded:supportedIds(list,id,relations),footprints:new Map(list.map(o=>[o.id,physicalFootprint(o)])),surfaces:new Map(list.map(o=>[o.id,supportSurfaces(o)]))};
}
export function placeOnSurface(list,id,parentId,surfaceId,context=createPlacementContext(list,id)) {
  const child=context.index.get(id),parent=context.index.get(parentId);
  if(!child||!parent||context.excluded.has(parentId))return null;
  const surface=context.surfaces.get(parentId).find(s=>s.id===surfaceId);if(!surface)return null;
  const footprint=context.footprints.get(id),relations=context.relations,occupied=list.filter(o=>o.id!==id&&relations.get(o.id)?.parentId===parentId&&relations.get(o.id)?.surfaceId===surfaceId).map(o=>surfaceBounds(o,parent,surface,context.footprints.get(o.id)));
  const offsets=[[0,0]];
  if(occupied.length) {
    for(let z=-surface.d/2;z<=surface.d/2;z+=.125)for(let x=-surface.w/2;x<=surface.w/2;x+=.125)offsets.push([x,z]);
    offsets.sort((a,b)=>a[0]**2+a[1]**2-b[0]**2-b[1]**2||b[1]-a[1]);
  }
  for(const [x,z]of offsets) {
    const centre=surfacePoint(parent,{...surface,x:(surface.x||0)+x,z:(surface.z||0)+z});
    const next={...child,x:centre.x,y:centre.y-contactOffset(child),support:{id:parentId,surface:surfaceId}};
    if(!fitsSurface(next,parent,surface,{footprint}))continue;
    const bounds=surfaceBounds(next,parent,surface,footprint);
    if(occupied.some(p=>Math.abs(bounds.x-p.x)<(bounds.w+p.w)/2+.012&&Math.abs(bounds.z-p.z)<(bounds.d+p.d)/2+.012))continue;
    return next;
  }
  return null;
}
export function clearContainerWalls(list,changedIds) {
  const positions=resolveSupports(list);
  for(const child of list) {
    if(changedIds&&!changedIds.has(child.id))continue;
    const size=physicalFootprint(child),bottom=positions.get(child.id)?.height||0;
    for(const parent of list) {
      if(parent.id===child.id)continue;
      const outer=physicalFootprint(parent),parentY=positions.get(parent.id)?.height||0,q=localPoint(child,parent);
      for(const surface of supportSurfaces(parent).filter(s=>s.container)) {
        const rim=parentY+(surface.rim??outer.h);
        if(bottom>=rim-.025||bottom+size.body<=parentY+surface.y-.025)continue;
        if(Math.abs(q.x-(surface.x||0))>=outer.w/2+size.w/2-.025||Math.abs(q.z-surface.z)>=outer.d/2+size.d/2-.025)continue;
        if(!fitsSurface(child,parent,surface))return false;
      }
    }
  }
  return true;
}
