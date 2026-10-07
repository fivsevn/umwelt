import { placementSpaces, groundArea, placeOnSurface, createPlacementContext } from './3d/spatial-layout.mjs';

// The controls and ray-based dragging consume the same surface IDs. Persisting
// an ID keeps a chosen tier stable after reload, translation and rotation.
export function createPlacementEditor({element,objects,selection,name,move,message}) {
  const parentSelect=element.querySelector('#supportParent'),levelSelect=element.querySelector('#supportLevel');
  let choices=new Map(),current=null,previewKey='',currentRelation=null;
  function option(select,value,label){const o=document.createElement('option');o.value=value;o.textContent=label;select.append(o)}
  function update() {
    const child=selection(),list=objects();
    parentSelect.replaceChildren();levelSelect.replaceChildren();choices=new Map();current=child;
    currentRelation=null;previewKey='';
    option(parentSelect,'','地面');
    const portable=!!child;
    parentSelect.disabled=!portable;
    if(portable) {
      const context=createPlacementContext(list,child.id),{excluded,relations}=context,counts=new Map(),relation=relations.get(child.id);
      currentRelation=relation?.parentId?relation:groundArea(list,child,relations);
      for(const parent of list) {
        if(excluded.has(parent.id)||relations.get(parent.id)?.invalid)continue;
        const surfaces=context.surfaces.get(parent.id).filter(surface=>(relation?.parentId===parent.id&&relation.surfaceId===surface.id)||placeOnSurface(list,child.id,parent.id,surface.id,context));
        if(!surfaces.length)continue;
        const label=name(parent.type),n=(counts.get(label)||0)+1;counts.set(label,n);
        choices.set(parent.id,surfaces);option(parentSelect,parent.id,label+(n>1?' '+n:''));
      }
      if(choices.has(currentRelation?.parentId)) {
        parentSelect.value=currentRelation.parentId;
        for(const surface of choices.get(currentRelation.parentId))option(levelSelect,surface.id,surface.label);
        levelSelect.value=currentRelation.surfaceId;
      }
    }
    if(!levelSelect.options.length)option(levelSelect,'','—');
    levelSelect.disabled=!parentSelect.value;
    previewKey=parentSelect.value+':'+levelSelect.value;
  }
  // Pointer capture owns the drag, so refresh only the visible binding. The
  // complete list of available places is rebuilt once after the drop.
  function preview(child) {
    const binding=child.support||groundArea(objects(),child)|| (child.support===undefined?currentRelation:null);
    const parentId=binding?.id||binding?.parentId||'',surfaceId=binding?.surface||binding?.surfaceId||'';
    const key=parentId+':'+surfaceId;if(key===previewKey)return;
    previewKey=key;
    const parent=parentId&&objects().find(o=>o.id===parentId);
    if(parent && ![...parentSelect.options].some(o=>o.value===parentId))option(parentSelect,parentId,name(parent.type));
    parentSelect.value=parentId;
    levelSelect.replaceChildren();
    const surfaces=parent?placementSpaces(parent):[];
    const allowed=choices.get(parentId)||[];
    for(const surface of surfaces)if(surface.id===surfaceId||allowed.some(s=>s.id===surface.id))option(levelSelect,surface.id,surface.label);
    if(!levelSelect.options.length)option(levelSelect,'','—');
    levelSelect.value=surfaceId;
    levelSelect.disabled=!parentId;
  }
  function place(parentId,surfaceId) {
    if(!current)return;
    const next=parentId?placeOnSurface(objects(),current.id,parentId,surfaceId):{...current,support:null};
    if(next&&move(current,{x:next.x,y:next.y,support:next.support})) {
      const surface=parentId&&placementSpaces(objects().find(p=>p.id===parentId)).find(s=>s.id===surfaceId);
      message(parentId?'已放到'+name(objects().find(p=>p.id===parentId).type)+'的'+surface.label+'。':'已放到地面。');
    }
    update();
  }
  parentSelect.onchange=()=>place(parentSelect.value,choices.get(parentSelect.value)?.[0].id);
  levelSelect.onchange=()=>place(parentSelect.value,levelSelect.value);
  return {update,preview};
}
