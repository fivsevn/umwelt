import {speciesById} from './species-registry.mjs?v=species-39b';

const LANGS=['zh','en','ja','iso'];
let language='zh';

function speciesName(species,lang){
  if(!species)return '—';
  if(lang==='zh')return species.names?.zhCN||species.name||species.label||species.id;
  if(lang==='en')return species.names?.en||species.label||species.name||species.id;
  if(lang==='ja')return species.names?.ja||species.label||species.name||species.id;
  return `ISO · ${species.id}`;
}

function updateLanguageButtons(){
  document.querySelectorAll('[data-system-lang]').forEach(button=>{
    button.setAttribute('aria-pressed',String(button.dataset.systemLang===language));
  });
}

function currentTaxa(){
  return (document.querySelector('#habitat')?.dataset.taxa||'')
    .split(',').map(value=>value.trim()).filter(Boolean);
}

function updateSpeciesStatus(){
  const target=document.querySelector('#speciesStatus');
  if(!target)return;
  const ids=[...new Set(currentTaxa())];
  if(!ids.length){target.textContent='—';target.title='';return;}
  const species=ids.map(speciesById);
  target.textContent=species.map(item=>speciesName(item,language)).join(' / ');
  target.title=species.map(item=>item.taxon||item.label||item.name||item.id).join(' / ');
}

function setLanguage(next){
  if(!LANGS.includes(next))return;
  language=next;
  updateLanguageButtons();
  updateSpeciesStatus();
}

function cycleLanguage(){
  setLanguage(LANGS[(LANGS.indexOf(language)+1)%LANGS.length]);
}

function init(){
  globalThis.__ISOPODA_HABITAT_SPEED__=1;

  document.querySelectorAll('[data-system-lang]').forEach(button=>{
    button.addEventListener('click',()=>setLanguage(button.dataset.systemLang));
  });
  document.querySelector('#speciesStatus')?.addEventListener('click',cycleLanguage);

  const habitat=document.querySelector('#habitat');
  if(habitat){
    new MutationObserver(updateSpeciesStatus).observe(habitat,{attributes:true,attributeFilter:['data-taxa']});
  }
  updateLanguageButtons();
  updateSpeciesStatus();

  const speedButton=document.querySelector('#speedBtn');
  speedButton?.addEventListener('click',()=>{
    const active=speedButton.getAttribute('aria-pressed')!=='true';
    globalThis.__ISOPODA_HABITAT_SPEED__=active?16:1;
    speedButton.setAttribute('aria-pressed',String(active));
    speedButton.setAttribute('aria-label',active?'恢复正常观察速度':'将饲养箱观察加速至 16 倍');
    speedButton.title=active?'恢复 1×':'饲养箱 16×';
  });

  const musicButton=document.querySelector('#musicBtn');
  musicButton?.addEventListener('click',()=>{
    const active=musicButton.getAttribute('aria-pressed')==='true';
    musicButton.setAttribute('aria-pressed',String(!active));
    musicButton.title='音乐开关占位';
  });
}

if(document.readyState==='complete')init();
else window.addEventListener('load',init,{once:true});
