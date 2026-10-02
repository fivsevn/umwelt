// Cards enter the bottom of a live feed; hidden cards reserve no space.
export function attachCardFeed(root,{scene,presence}){
 const schedule=[['weatherCard',.4],['garageCard',2],['musicToggle',5],['returnWorld',8.2],['roomCard',11.5],['dongdongStatus',1.2]];
 const homeCards=new Set(['garageCard','roomCard']);
 let previous=new Map(),wasPresent=presence().present,returnUntil=0,returnedAt=null;
 for(const [id] of schedule)document.getElementById(id).hidden=true;
 function update(elapsed){
  const resident=presence();let changed=false;
  const arrived=resident.present&&!wasPresent,departed=!resident.present&&wasPresent;
  if(arrived){returnUntil=elapsed+7;returnedAt=elapsed}
  if(departed){returnUntil=0;returnedAt=null}
  wasPresent=resident.present;
  const status=document.getElementById('dongdongStatus');
  status.textContent=resident.present?'东东回来了。':resident.status;
  for(const [id,at] of schedule){
   const el=document.getElementById(id);
   let eligible=elapsed>=at;
   if(homeCards.has(id))eligible=resident.present&&(returnedAt===null?eligible:elapsed>=returnedAt+(id==='garageCard'?.8:2));
   if(id==='returnWorld')eligible=eligible&&scene()==='north';
   if(id==='dongdongStatus')eligible=resident.present?elapsed<returnUntil:eligible||departed;
   if(el.hidden===!eligible)continue;
   el.hidden=!eligible;changed=true;
   if(eligible){el.classList.remove('feed-enter');void el.offsetWidth;el.classList.add('feed-enter')}
  }
  // Reapply chronological order after a card returns; the newest status stays below actions.
  if(changed){
   for(const [id] of schedule)root.append(document.getElementById(id));
   for(const el of root.children){
    if(el.hidden)continue;
    const y=el.getBoundingClientRect().y,old=previous.get(el);
    if(old!==undefined&&Math.abs(old-y)>1)el.animate([{transform:`translateY(${(old-y)/(parseFloat(getComputedStyle(root).zoom)||1)}px)`},{transform:'translateY(0)'}],{duration:380,easing:'ease-out'});
   }
  }
  previous=new Map([...root.children].filter(el=>!el.hidden).map(el=>[el,el.getBoundingClientRect().y]));
 }
 return {update};
}
