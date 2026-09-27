import {microscope} from './scenery/petri.mjs';
import {petriText} from './data/habitats/petri-observation.mjs';
import {iconButton,pixelIcon} from './ui.mjs';
export function createPetriControls(viewport,habitat,getState,getLanguage){
 const root=document.createElement('div');root.className='petri-tools';root.hidden=true;
 root.innerHTML='<div class="scope-switch-frame"><button id="scopeToggle" class="icon-button field-button" type="button"></button></div><div id="scopePanel" hidden><div class="scope-dials">'+[['Power','power'],['Focus','focus'],['Light','light']].map(([id,key])=>`<div class="scope-knob"><button id="scope${id}" class="scope-dial" data-control="${key}" type="button" role="slider" ><span class="wheel-scale" aria-hidden="true"><i></i></span><span class="wheel-well" aria-hidden="true"><span class="wheel-tread"></span><span class="wheel-symbol"></span></span></button></div>`).join('')+'</div><button id="scopeCenter" class="scope-reset" type="button"></button></div>';
 viewport.append(root);const $=id=>root.querySelector('#'+id);
 for(const dial of root.querySelectorAll('.scope-dial'))dial.querySelector('.wheel-symbol').append(pixelIcon('scope'+dial.dataset.control));
 const level=key=>{const m=microscope(getState());return key==='power'?Math.log2(m.magnification/4):m[key]};
 const set=(key,value)=>{const v=Math.max(key==='light'?10:0,Math.min(key==='power'?3:100,value));if(v===level(key))return;if(key==='power')habitat.scopeControl('zoom',v>level(key)?1:-1);else habitat.scopeControl(key,v)};
 const increment=(key,dir)=>set(key,level(key)+dir*(key==='power'?1:2));
 $('scopeToggle').onclick=()=>habitat.scopeControl('toggle');$('scopeCenter').onclick=()=>habitat.scopeControl('center');
 for(const dial of root.querySelectorAll('.scope-dial')){
  const key=dial.dataset.control;let drag=null,wheelTravel=0,lastWheel=0;
  const move=amount=>{if(key==='power'){wheelTravel+=amount;while(Math.abs(wheelTravel)>=24){const dir=Math.sign(wheelTravel);increment(key,dir);wheelTravel-=dir*24}}else set(key,level(key)+amount/2)};
  dial.setAttribute('aria-orientation','vertical');
  dial.addEventListener('pointerdown',e=>{if(e.button!==0||e.isPrimary===false)return;e.preventDefault();dial.focus();dial.setPointerCapture(e.pointerId);drag={id:e.pointerId,y:e.clientY};wheelTravel=0;dial.classList.add('is-turning')});
  dial.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;move(drag.y-e.clientY);drag.y=e.clientY});
  const release=e=>{if(!drag||drag.id!==e.pointerId)return;drag=null;wheelTravel=0;dial.classList.remove('is-turning');if(dial.hasPointerCapture(e.pointerId))dial.releasePointerCapture(e.pointerId)};
  dial.addEventListener('pointerup',release);dial.addEventListener('pointercancel',release);dial.addEventListener('lostpointercapture',()=>{drag=null;dial.classList.remove('is-turning')});
  dial.addEventListener('wheel',e=>{e.preventDefault();if(!e.deltaY)return;const now=performance.now();if(now-lastWheel>180)wheelTravel=0;lastWheel=now;const pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?80:1);move(-Math.sign(pixels)*Math.min(Math.abs(pixels),24))},{passive:false});
  dial.addEventListener('keydown',e=>{const dir={ArrowUp:1,ArrowRight:1,ArrowDown:-1,ArrowLeft:-1}[e.key];if(dir){e.preventDefault();increment(key,dir)}else if(e.key==='Home'||e.key==='End'){e.preventDefault();const target=e.key==='Home'?(key==='light'?10:0):(key==='power'?3:100);if(key==='power'){while(level(key)!==target)increment(key,Math.sign(target-level(key)))}else set(key,target)}});

 }
 const canvas=viewport.querySelector('canvas');canvas.addEventListener('keydown',e=>{if(getState().habitatId!=='petri-dish'||!microscope(getState()).mode)return;const dir={ArrowLeft:[-2,0],ArrowRight:[2,0],ArrowUp:[0,-2],ArrowDown:[0,2]}[e.key];if(dir){e.preventDefault();habitat.scopeControl('move',dir)}});
 return ()=>{const s=getState(),active=s.habitatId==='petri-dish',m=active?microscope(s):null,t=k=>petriText(k,getLanguage());root.hidden=!active;viewport.querySelector('.zoom-tools').hidden=active;canvas.tabIndex=active?0:-1;if(!active)return;
  iconButton($('scopeToggle'),'microscope',t(m.mode?'overview':'scope'));$('scopeToggle').setAttribute('aria-pressed',String(m.mode));$('scopePanel').hidden=!m.mode;
  iconButton($('scopeCenter'),'center',t('center'));
  for(const [id,key] of [['Power','power'],['Focus','focus'],['Light','light']]){const dial=$('scope'+id),value=level(key);dial.setAttribute('aria-label',t(key));dial.setAttribute('aria-valuemin',key==='light'?'10':'0');dial.setAttribute('aria-valuemax',key==='power'?'3':'100');dial.setAttribute('aria-valuenow',String(value));dial.setAttribute('aria-valuetext',key==='power'?t(['lowPower','midPower','highPower','detailPower'][value]):t(key)+': '+t(value<35?'low':value>70?'high':'middle'));dial.style.setProperty('--wheel-travel',(key==='power'?-value*13:-value*1.2)+'px');dial.style.setProperty('--wheel-stop',String(value));dial.title=t('turnDial')}
 };
}
