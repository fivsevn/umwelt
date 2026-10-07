import { plantContact } from '../plant-art.mjs';
import { PLANTS } from '../botany.mjs';
import { physicalFootprint, supportSurfaces, placementSpaces, spaceObstacles, placementKind } from './placement-profiles.mjs';
export { physicalFootprint, supportSurfaces, placementSpaces, spaceObstacles, placementKind } from './placement-profiles.mjs';
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
function projectedBounds(child,parent,footprint,full=false) {
  const q=localPoint(child,parent),a=((child.rotation||0)-(parent.rotation||0))*Math.PI/180;
  const w=full?(footprint.mouthW||footprint.w):footprint.w,d=full?(footprint.mouthD||footprint.d):footprint.d;
  return {x:q.x,z:q.z,w:footprint.circle?w:Math.abs(Math.cos(a))*w+Math.abs(Math.sin(a))*d,d:footprint.circle?d:Math.abs(Math.sin(a))*w+Math.abs(Math.cos(a))*d};
}
function overlaps(a,b,gap=0) {
  return Math.abs(a.x-b.x)<(a.w+b.w)/2+gap&&Math.abs(a.z-b.z)<(a.d+b.d)/2+gap;
}
function touchesHole(bounds,hole) {
  if(hole.shape!=='ellipse')return overlaps(bounds,hole,.006);
  const x=Math.max(0,Math.abs(bounds.x-hole.x)-bounds.w/2),z=Math.max(0,Math.abs(bounds.z-hole.z)-bounds.d/2);
  return (x/(hole.w/2))**2+(z/(hole.d/2))**2<1.012;
}
export function fitsSurface(child,parent,surface,{height=true,footprint=physicalFootprint(child)}={}) {
  const p=footprint,q=projectedBounds(child,parent,p,surface.container||surface.bearing==='ground');
  const dx=Math.abs(q.x-(surface.x||0)),dz=Math.abs(q.z-(surface.z||0));
  let fits=dx+q.w/2<=surface.w/2+.015&&dz+q.d/2<=surface.d/2+.015;
  if(fits&&surface.shape==='ellipse') {
    const perimeter=p.circle?Array.from({length:24},(_,i)=>[Math.cos(i*Math.PI/12)*q.w/2,Math.sin(i*Math.PI/12)*q.d/2]):[[-1,-1],[-1,1],[1,-1],[1,1]].map(([x,z])=>[x*q.w/2,z*q.d/2]);
    fits=perimeter.every(([x,z])=>((q.x-(surface.x||0)+x)/(surface.w/2))**2+((q.z-(surface.z||0)+z)/(surface.d/2))**2<=1.025);
  }
  if(!fits||height&&p.h>surface.ceiling+.025)return false;
  if(surface.point&&(dx>.016||dz>.016))return false;
  if(surface.holes?.some(h=>touchesHole(q,h)))return false;
  const body=projectedBounds(child,parent,p,true),bottom=surface.y;
  return !spaceObstacles(parent).some(part=>part.cavity!==surface.id&&bottom<part.y+part.h/2-.025&&bottom+p.h>part.y-part.h/2+.025&&overlaps(body,part,-.012));
}
// Ground areas are derived from actual geometry, not saved as a dependency.
// Moving a table immediately leaves its ground objects on the world floor.
export function groundArea(list,child,relations=resolveSupports(list)) {
  if(relations.get(child.id)?.parentId)return null;
  for(const parent of list) {
    if(parent.id===child.id||(relations.get(parent.id)?.height||0)!==0)continue;
    const space=placementSpaces(parent).find(s=>s.bearing==='ground'&&fitsSurface(child,parent,s));
    if(space)return {parentId:parent.id,surfaceId:space.id};
  }
  return null;
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
    } else if(o.support!==null && placementKind(o.type).inferLegacy) {
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
// Selection access is broader than the support graph: the floor below a table
// is accessible through it but does not become something the table carries.
export function accessibleContents(list,id,relations=resolveSupports(list)) {
  const parent=list.find(o=>o.id===id);if(!parent)return[];
  const ids=supportedIds(list,id,relations);ids.delete(id);
  const spaces=placementSpaces(parent).filter(s=>s.bearing==='ground');
  const ground=new Set();
  if(spaces.length&&(relations.get(id)?.height||0)===0)for(const child of list) {
    if(child.id===id||relations.get(child.id)?.parentId)continue;
    const q=localPoint(child,parent),p=physicalFootprint(child);
    if(!spaces.some(under=>Math.abs(q.x-(under.x||0))<=under.w/2+p.w/2&&Math.abs(q.z-(under.z||0))<=under.d/2+p.d/2))continue;
    for(const descendant of supportedIds(list,child.id,relations)){ids.add(descendant);ground.add(descendant)}
  }
  return [...ids].map(id=>({id,ground:ground.has(id)}));
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
  return projectedBounds(child,parent,p,surface.container||surface.bearing==='ground');
}
// Reuse one snapshot when the picker checks many parents and levels. Never keep
// this context after changing the layout; positions and occupied space may change.
export function createPlacementContext(list,id) {
  const relations=resolveSupports(list);
  return {relations,index:new Map(list.map(o=>[o.id,o])),excluded:supportedIds(list,id,relations),footprints:new Map(list.map(o=>[o.id,physicalFootprint(o)])),surfaces:new Map(list.map(o=>[o.id,placementSpaces(o)])),parts:new Map(list.map(o=>[o.id,spaceObstacles(o)]))};
}
export function placeOnSurface(list,id,parentId,surfaceId,context=createPlacementContext(list,id)) {
  const child=context.index.get(id),parent=context.index.get(parentId);
  if(!child||!parent||context.excluded.has(parentId))return null;
  const surface=context.surfaces.get(parentId).find(s=>s.id===surfaceId);if(!surface)return null;
  if(surface.bearing==='ground'&&context.relations.get(parentId)?.height!==0)return null;
  const footprint=context.footprints.get(id),relations=context.relations;
  const occupied=list.filter(o=>!context.excluded.has(o.id)&&
    (surface.bearing==='ground'? o.id!==parentId&&!relations.get(o.id)?.parentId&&placementKind(o.type).role!=='furniture':relations.get(o.id)?.parentId===parentId&&relations.get(o.id)?.surfaceId===surfaceId))
    .map(o=>surfaceBounds(o,parent,surface,context.footprints.get(o.id)));
  const offsets=[[0,0]];
  if(!surface.point)for(let z=-surface.d/2;z<=surface.d/2;z+=.125)for(let x=-surface.w/2;x<=surface.w/2;x+=.125)offsets.push([x,z]);
  offsets.sort((a,b)=>a[0]**2+a[1]**2-b[0]**2-b[1]**2||b[1]-a[1]);
  for(const [x,z]of offsets) {
    const centre=surfacePoint(parent,{...surface,x:(surface.x||0)+x,z:(surface.z||0)+z});
    const next={...child,x:centre.x,y:centre.y-contactOffset(child),support:surface.bearing==='ground'?null:{id:parentId,surface:surfaceId}};
    if(!fitsSurface(next,parent,surface,{footprint}))continue;
    const bounds=surfaceBounds(next,parent,surface,footprint);
    if(occupied.some(p=>overlaps(bounds,p,.012)))continue;
    const proposed=list.map(o=>o.id===id?next:o),updated=new Map(relations);
    updated.set(id,surface.bearing==='ground'?{height:0}:{height:(relations.get(parentId)?.height||0)+surface.y,parentId,surfaceId,container:!!surface.container});
    if(!clearPlacement(proposed,new Set([id]),updated,context))continue;
    return next;
  }
  return null;
}
// All edit paths share this spatial check. Rigid bodies must clear other bases
// on the same surface, cavity walls, legs and plumbing. Existing legacy overlaps
// elsewhere in a layout do not prevent repairing a selected arrangement.
function ancestorOf(positions,parentId,id) {
  const seen=new Set();
  while(positions.get(id)?.parentId&&!seen.has(id)) {
    seen.add(id);id=positions.get(id).parentId;if(id===parentId)return true;
  }
  return false;
}
export function clearPlacement(list,changedIds,positions=resolveSupports(list),context) {
  const footprints=context?.footprints||new Map(list.map(o=>[o.id,physicalFootprint(o)]));
  const parts=context?.parts||new Map(list.map(o=>[o.id,spaceObstacles(o)]));
  for(const child of list) {
    if(changedIds&&!changedIds.has(child.id))continue;
    const size=footprints.get(child.id),relation=positions.get(child.id),bottom=relation?.height||0,descendants=supportedIds(list,child.id,positions);
    if(relation?.invalid)return false;
    for(const parent of list) {
      if(parent.id===child.id||descendants.has(parent.id))continue;
      const outer=footprints.get(parent.id),pr=positions.get(parent.id),parentY=pr?.height||0,q=localPoint(child,parent);
      const body=projectedBounds(child,parent,size,true);
      if(parts.get(parent.id).some(part=>!(relation?.parentId===parent.id&&relation.surfaceId===part.cavity)&&bottom<parentY+part.y+part.h/2-.025&&bottom+size.h>parentY+part.y-part.h/2+.025&&overlaps(body,part,-.012)))return false;
      for(const surface of supportSurfaces(parent).filter(s=>s.container)) {
        const rim=parentY+(surface.rim??outer.h);
        if(bottom>=rim-.025||bottom+size.body<=parentY+surface.y-.025)continue;
        if(Math.abs(q.x-(surface.x||0))>=outer.w/2+size.w/2-.025||Math.abs(q.z-surface.z)>=outer.d/2+size.d/2-.025)continue;
        const direct=relation?.parentId===parent.id&&relation.surfaceId===surface.id;
        const nested=ancestorOf(positions,parent.id,child.id);
        if(!direct&&!nested)return false;
        if(!fitsSurface(child,parent,direct?surface:{...surface,point:false},{height:direct}))return false;
        if(nested&&Number.isFinite(surface.ceiling)&&bottom+size.h>parentY+surface.y+surface.ceiling+.025)return false;
      }
      if(relation?.parentId&&relation.parentId===pr?.parentId&&relation.surfaceId===pr?.surfaceId) {
        const supporter=list.find(o=>o.id===relation.parentId),surface=supportSurfaces(supporter).find(s=>s.id===relation.surfaceId);
        if(overlaps(surfaceBounds(child,supporter,surface,size),surfaceBounds(parent,supporter,surface,outer),.012))return false;
      }
      // Non-bearing objects are already occupied volumes (fish, soil and tools).
      // They never become an accidental empty container or extra tabletop.
      if(!placementKind(parent.type).bearing&&!relation?.container) {
        if(placementKind(child.type).role==='furniture') {
          for(const part of parts.get(child.id)) {
            const centre=surfacePoint(child,{x:part.x,z:part.z}),probe={...child,x:centre.x,y:centre.y-contactOffset(child)};
            const volume=projectedBounds(probe,parent,{w:part.w,d:part.d},false);
            if(bottom+part.y-part.h/2<parentY+outer.h-.025&&bottom+part.y+part.h/2>parentY+.025&&overlaps(volume,projectedBounds(parent,parent,outer,true),-.012))return false;
          }
        } else if(bottom<parentY+outer.body-.025&&bottom+size.body>parentY+.025&&overlaps(body,projectedBounds(parent,parent,outer,true),-.012))return false;
      }
    }
  }
  return true;
}
// Kept for importers of the previous placement module.
export const clearContainerWalls=clearPlacement;
