import {speciesById} from './species-registry.mjs?v=species-39b';

const LANGS=['zh','en','ja','iso'];
let interfaceLanguage='zh';
let speciesLanguage='zh';

function speciesName(species,lang){
  if(!species)return '—';
  if(lang==='zh')return species.names?.zhCN||species.name||species.label||species.id;
  if(lang==='en')return species.names?.en||species.label||species.name||species.id;
  if(lang==='ja')return species.names?.ja||species.label||species.names?.en||species.name||species.id;
  return `ISO · ${species.id}`;
}

function updateLanguageItems(){
  document.querySelectorAll('[data-system-lang]').forEach(item=>{
    item.setAttribute('aria-pressed',String(item.dataset.systemLang===interfaceLanguage));
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
  target.textContent=species.map(item=>speciesName(item,speciesLanguage)).join('\n');
  target.title=species.map(item=>item.taxon||item.label||item.name||item.id).join('\n');
  target.dataset.language=speciesLanguage;
}

// Changing the whole interface language also resets the species label to that language.
// From that point on the species label can be cycled independently.
function setInterfaceLanguage(next){
  if(!LANGS.includes(next))return;
  interfaceLanguage=next;
  speciesLanguage=next;
  document.documentElement.dataset.uiLanguage=next;
  updateLanguageItems();
  updateSpeciesStatus();
}

function cycleSpeciesLanguage(){
  speciesLanguage=LANGS[(LANGS.indexOf(speciesLanguage)+1)%LANGS.length];
  updateSpeciesStatus();
}

function init(){
  globalThis.__ISOPODA_HABITAT_SPEED__=1;

  document.querySelectorAll('[data-system-lang]').forEach(item=>{
    item.addEventListener('click',()=>setInterfaceLanguage(item.dataset.systemLang));
  });
  document.querySelector('#speciesStatus')?.addEventListener('click',cycleSpeciesLanguage);

  const habitat=document.querySelector('#habitat');
  if(habitat){
    new MutationObserver(updateSpeciesStatus).observe(habitat,{attributes:true,attributeFilter:['data-taxa']});
  }
  updateLanguageItems();
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
