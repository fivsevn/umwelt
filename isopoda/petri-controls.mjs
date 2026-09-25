import {microscope} from './scenery/petri.mjs';
import {petriText} from './data/habitats/petri-observation.mjs';
import {iconButton} from './ui.mjs';
export function createPetriControls(viewport,habitat,getState,getLanguage){
 const root=document.createElement('div');root.className='petri-tools';root.hidden=true;
 root.innerHTML='<button id="scopeToggle" type="button"></button><div id="scopePanel" hidden><div class="scope-row"><button id="scopeLess" type="button">−</button><span id="scopePower"></span><button id="scopeMore" type="button">＋</button><button id="scopeCenter" type="button">⌖</button></div><label><span id="focusLabel"></span><input id="scopeFocus" type="range" min="0" max="100" step="1"></label><label><span id="lightLabel"></span><input id="scopeLight" type="range" min="10" max="100" step="1"></label></div>';
 viewport.append(root);const $=id=>root.querySelector('#'+id);
 $('scopeToggle').onclick=()=>habitat.scopeControl('toggle');$('scopeLess').onclick=()=>habitat.scopeControl('zoom',-1);$('scopeMore').onclick=()=>habitat.scopeControl('zoom',1);$('scopeCenter').onclick=()=>habitat.scopeControl('center');
 $('scopeFocus').oninput=e=>habitat.scopeControl('focus',Number(e.target.value));$('scopeLight').oninput=e=>habitat.scopeControl('light',Number(e.target.value));
 const canvas=viewport.querySelector('canvas');canvas.addEventListener('keydown',e=>{if(getState().habitatId!=='petri-dish'||!microscope(getState()).mode)return;const dir={ArrowLeft:[-2,0],ArrowRight:[2,0],ArrowUp:[0,-2],ArrowDown:[0,2]}[e.key];if(dir){e.preventDefault();habitat.scopeControl('move',dir)}});
 return ()=>{const s=getState(),active=s.habitatId==='petri-dish',m=active?microscope(s):null,t=k=>petriText(k,getLanguage());root.hidden=!active;viewport.querySelector('.zoom-tools').hidden=active;canvas.tabIndex=active?0:-1;if(!active)return;
  iconButton($('scopeToggle'),'microscope',t(m.mode?'overview':'scope'));$('scopeToggle').setAttribute('aria-pressed',String(m.mode));$('scopePanel').hidden=!m.mode;
  $('scopePower').textContent=m.magnification+'×';$('scopeLess').disabled=m.magnification===4;$('scopeMore').disabled=m.magnification===32;
  $('scopeLess').setAttribute('aria-label',t('field')+' −');$('scopeMore').setAttribute('aria-label',t('field')+' +');$('scopeCenter').setAttribute('aria-label',t('center'));$('scopeCenter').title=t('center');
  $('focusLabel').textContent=t('focus');$('lightLabel').textContent=t('light');$('scopeFocus').value=m.focus;$('scopeLight').value=m.light;
 };
}
