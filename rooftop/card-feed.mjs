// Cards enter the bottom of a live feed; hidden cards reserve no space.
export function attachCardFeed(root,{scene,presence}){
 const schedule=[['weatherCard',.4],['garageCard',2],['musicToggle',5],['returnWorld',8.2],['roomCard',11.5],['dongdongStatus',14]];
 const shown=new Set();let previous=new Map(),wasPresent=presence().present,returnUntil=0;
 for(const [id] of schedule)document.getElementById(id).hidden=true;
 function update(elapsed){const resident=presence();let changed=false;if(resident.present&&!wasPresent){returnUntil=elapsed+7;const status=document.getElementById('dongdongStatus');status.textContent='东东回来了。';status.hidden=true;root.append(status);changed=true}wasPresent=resident.present;for(const [id,at] of schedule){const el=document.getElementById(id),eligible=elapsed>=at&&(id!=='returnWorld'||scene()==='north')&&(id!=='dongdongStatus'||!resident.present||elapsed<returnUntil);if(id==='dongdongStatus'&&!resident.present)el.textContent=resident.status;if(el.hidden===!eligible)continue;el.hidden=!eligible;changed=true;if(eligible){if(!shown.has(id)){root.append(el);shown.add(id)}el.classList.remove('feed-enter');void el.offsetWidth;el.classList.add('feed-enter')}}
 if(changed){for(const el of root.children){if(el.hidden)continue;const y=el.getBoundingClientRect().y,old=previous.get(el);if(old!==undefined&&Math.abs(old-y)>1)el.animate([{transform:`translateY(${(old-y)/(parseFloat(getComputedStyle(root).zoom)||1)}px)`},{transform:'translateY(0)'}],{duration:380,easing:'ease-out'});} }
 previous=new Map([...root.children].filter(el=>!el.hidden).map(el=>[el,el.getBoundingClientRect().y]));}
 return {update};
}
