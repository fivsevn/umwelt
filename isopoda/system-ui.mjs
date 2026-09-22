import {speciesById} from './species-registry.mjs?v=aquatic-1';
import {SUPPORTED_LANGUAGES,getLanguage,setLanguage,t,applyStaticTranslations,speciesPrimaryName} from './i18n.mjs?v=aquatic-4';

const LANGS=SUPPORTED_LANGUAGES;
const RUN_KEY='isopoda-fugue-v4';
let interfaceLanguage=getLanguage();
let speciesLanguage=interfaceLanguage;

function speciesName(species,lang){return speciesPrimaryName(species,lang)}

function updateLanguageItems(){
  document.querySelectorAll('[data-system-lang]').forEach(item=>{
    item.setAttribute('aria-pressed',String(item.dataset.systemLang===interfaceLanguage));
  });
}

function savedTaxa(){
  try{
    const run=JSON.parse(localStorage.getItem(RUN_KEY)||'null');
    return Array.isArray(run?.cohort)?run.cohort.map(item=>item?.species).filter(Boolean):[];
  }catch{return []}
}

function currentTaxa(){
  const live=(document.querySelector('#habitat')?.dataset.taxa||'')
    .split(',').map(value=>value.trim()).filter(Boolean);
  return live.length?live:savedTaxa();
}

function updateSpeciesStatus(){
  const target=document.querySelector('#speciesStatus');
  if(!target)return;
  const ids=[...new Set(currentTaxa())];
  if(!ids.length){target.textContent='—';target.title='';target.dataset.empty='true';return;}
  const species=ids.map(speciesById);
  target.textContent=species.map(item=>speciesName(item,speciesLanguage)).join('\n');
  target.title=species.map(item=>item.taxon||item.label||item.name||item.id).join('\n');
  target.dataset.language=speciesLanguage;
  target.dataset.empty='false';
}

// Changing the whole interface language also resets the species label to that language.
// From that point on the species label can be cycled independently.
function setInterfaceLanguage(next){
  if(!LANGS.includes(next))return;
  interfaceLanguage=setLanguage(next);
  speciesLanguage=next;
  updateLanguageItems();
  updateSpeciesStatus();
}

function cycleSpeciesLanguage(){
  speciesLanguage=LANGS[(LANGS.indexOf(speciesLanguage)+1)%LANGS.length];
  updateSpeciesStatus();
}

function setHabitatSpeed(speed){
  const next=Number(speed)||1;
  globalThis.__ISOPODA_HABITAT_SPEED__=next;
  document.querySelectorAll('[data-habitat-speed]').forEach(button=>{
    const active=Number(button.dataset.habitatSpeed)===next;
    button.setAttribute('aria-pressed',String(active));
  });
}

function init(){
  applyStaticTranslations();
  setLanguage(interfaceLanguage,{announce:false});
  setHabitatSpeed(1);

  document.querySelectorAll('[data-system-lang]').forEach(item=>{
    item.addEventListener('click',()=>setInterfaceLanguage(item.dataset.systemLang));
  });
  document.querySelector('#speciesStatus')?.addEventListener('click',cycleSpeciesLanguage);

  const habitat=document.querySelector('#habitat');
  if(habitat){
    new MutationObserver(updateSpeciesStatus).observe(habitat,{attributes:true,attributeFilter:['data-taxa']});
  }
  const playView=document.querySelector('#playView');
  if(playView){
    new MutationObserver(updateSpeciesStatus).observe(playView,{attributes:true,attributeFilter:['hidden']});
  }
  updateLanguageItems();
  updateSpeciesStatus();
  // The game writes the active cohort to localStorage; this small heartbeat is a fallback
  // for browsers where the canvas data attribute is populated before this module observes it.
  setInterval(updateSpeciesStatus,800);

  document.querySelectorAll('[data-habitat-speed]').forEach(button=>{
    button.addEventListener('click',()=>{
      const value=Number(button.dataset.habitatSpeed)||1;
      const alreadyActive=button.getAttribute('aria-pressed')==='true';
      setHabitatSpeed(alreadyActive?1:value);
    });
  });

  const musicButton=document.querySelector('#musicBtn');
  musicButton?.addEventListener('click',()=>{
    const active=musicButton.getAttribute('aria-pressed')==='true';
    musicButton.setAttribute('aria-pressed',String(!active));
    musicButton.title=t('musicPlaceholder');
  });
}

if(document.readyState==='complete')init();
else window.addEventListener('load',init,{once:true});
