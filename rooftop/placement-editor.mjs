import { resolveSupports, supportSurfaces, placementKind, placeOnSurface, supportedIds } from './3d/spatial-layout.mjs';

// The controls and ray-based dragging consume the same surface IDs. Persisting
// an ID keeps a chosen tier stable after reload, translation and rotation.
export function createPlacementEditor({element,objects,selection,name,move,message}) {
  const parentSelect=element.querySelector('#supportParent'),levelSelect=element.querySelector('#supportLevel');
  let choices=new Map(),current=null;
  function option(select,value,label){const o=document.createElement('option');o.value=value;o.textContent=label;select.append(o)}
  function update() {
    const child=selection(),list=objects();
    parentSelect.replaceChildren();levelSelect.replaceChildren();choices=new Map();current=child;
    option(parentSelect,'','地面');
    const portable=child&&placementKind(child.type).portable;
    parentSelect.disabled=!portable;
    if(portable) {
      const excluded=supportedIds(list,child.id),relations=resolveSupports(list),counts=new Map(),relation=relations.get(child.id);
      for(const parent of list) {
        if(excluded.has(parent.id)||relations.get(parent.id)?.invalid)continue;
        const surfaces=supportSurfaces(parent).filter(surface=>(relation?.parentId===parent.id&&relation.surfaceId===surface.id)||placeOnSurface(list,child.id,parent.id,surface.id));
        if(!surfaces.length)continue;
        const label=name(parent.type),n=(counts.get(label)||0)+1;counts.set(label,n);
        choices.set(parent.id,surfaces);option(parentSelect,parent.id,label+(n>1?' '+n:''));
      }
      if(choices.has(relation?.parentId)) {
        parentSelect.value=relation.parentId;
        for(const surface of choices.get(relation.parentId))option(levelSelect,surface.id,surface.label);
        levelSelect.value=relation.surfaceId;
      }
    }
    if(!levelSelect.options.length)option(levelSelect,'','—');
    levelSelect.disabled=!parentSelect.value;
  }
  function place(parentId,surfaceId) {
    if(!current)return;
    const next=parentId?placeOnSurface(objects(),current.id,parentId,surfaceId):{...current,support:null};
    if(next&&move(current,{x:next.x,y:next.y,support:next.support})) {
      const surface=parentId&&supportSurfaces(objects().find(p=>p.id===parentId)).find(s=>s.id===surfaceId);
      message(parentId?'已放到'+name(objects().find(p=>p.id===parentId).type)+'的'+surface.label+'。':'已放到地面。');
    }
    update();
  }
  parentSelect.onchange=()=>place(parentSelect.value,choices.get(parentSelect.value)?.[0].id);
  levelSelect.onchange=()=>place(parentSelect.value,levelSelect.value);
  return {update};
}
