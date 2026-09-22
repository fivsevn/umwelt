import {SUPPORTED_LANGUAGES,UI_COPY} from './locales/ui.mjs?v=abyssal-1';

export {SUPPORTED_LANGUAGES};

const STORAGE_KEY='isopoda-ui-language-v1';

function normalize(value){return SUPPORTED_LANGUAGES.includes(value)?value:'zh'}
const storedLanguage=normalize((()=>{try{return localStorage.getItem(STORAGE_KEY)}catch{return null}})());
// This module has mutable state. Query-string cache busting can otherwise instantiate it
// more than once and split the interface into different active languages.
const I18N_STATE=globalThis.__ISOPODA_I18N_STATE__??={language:storedLanguage};
I18N_STATE.language=normalize(I18N_STATE.language);

export function getLanguage(){return I18N_STATE.language}
export function t(key,vars={},lang=I18N_STATE.language){
 const table=UI_COPY[normalize(lang)]||UI_COPY.zh;let value=table[key]??UI_COPY.zh[key]??key;
 for(const [name,replacement] of Object.entries(vars))value=value.replaceAll(`{${name}}`,String(replacement));
 return value;
}

function setDocumentLanguage(){
 const language=I18N_STATE.language;
 const html=document.documentElement;html.dataset.uiLanguage=language;html.lang=language==='zh'?'zh-CN':language==='isopod'?'x-isopod':language;
 document.title=t('documentTitle');const description=document.querySelector('meta[name="description"]');if(description)description.content=t('documentDescription');
}

const textBindings=[
 ['#startBtn','newObservation'],['#continueBtn','continueObservation'],['#arrivalCard .panel-caption','waitingSpecimens'],['#settleBtn','startObservation'],['#activityLabel','habitatWindow'],['#nextBtn','holdMoment'],['#endSpecimenCaption','observeSpecimens'],['#endMoltsCaption','collectedExuviae'],['#endCard .ending-date span:last-child','sevenDayObservation'],['#endCard .afterword .panel-caption','asimovMessage'],['#restartBtn','restart'],['#endingCatalogBtn','viewArchive'],['#specimensTab','specimens']
];
const attributeBindings=[
 ['.launch-close','aria-label','closeReturn'],['#emptyHabitat','aria-label','habitatAria'],['#windowMinimize','aria-label','minimizeWindow'],['#windowMaximize','aria-label','maximizeWindow'],['#windowClose','aria-label','closeWindow'],['.window-system-menu','aria-label','systemActions'],['.language-menu','aria-label','language'],['#musicBtn','aria-label','music'],['#musicBtn','title','musicPlaceholder'],['#soundBtn','aria-label','soundOn'],['#soundBtn','title','soundOn'],['#speedFastBtn','aria-label','speed16'],['#speedTurboBtn','aria-label','speed64'],['#instruments','aria-label','environmentStatus'],['#habitat','aria-label','habitatCanvas'],['#speciesStatus','aria-label','speciesStatus'],['#catalogBtn','aria-label','archive'],['#zoomOut','aria-label','zoomOut'],['#zoomIn','aria-label','zoomIn'],['#zoomReset','aria-label','zoomReset'],['#actions','aria-label','roundChoices'],['#journalBtn','aria-label','journal'],['#sourcesBtn','aria-label','sources'],['#closeDrawer','aria-label','close'],['#pagePrev','aria-label','previousPage'],['#pageNext','aria-label','nextPage']
];

export function applyStaticTranslations(){
 setDocumentLanguage();
 for(const [selector,key] of textBindings){const el=document.querySelector(selector);if(el)el.textContent=t(key)}
 for(const [selector,attribute,key] of attributeBindings){document.querySelectorAll(selector).forEach(el=>el.setAttribute(attribute,t(key)))}
 const languageNames={zh:'中文',en:'English',ja:'日本語',isopod:'鼠婦語'};
 document.querySelectorAll('[data-system-lang]').forEach(button=>{
  const lang=button.dataset.systemLang,label=languageNames[lang]||lang;button.setAttribute('aria-label',label);button.title=label;
 });
}

export function setLanguage(next,{announce=true}={}){
 const value=normalize(next);I18N_STATE.language=value;
 try{localStorage.setItem(STORAGE_KEY,value)}catch{}
 applyStaticTranslations();
 if(announce)window.dispatchEvent(new CustomEvent('isopoda:languagechange',{detail:{language:value}}));
 return value;
}

const DATE_LOCALES={zh:'zh-CN',en:'en-GB',ja:'ja-JP'};
const ISOPOD_WAVES=['▁','▂','▃','▄','▅','▆','▇'];
function dateLocale(lang){return DATE_LOCALES[lang]||DATE_LOCALES.zh}
export function isopodWaveNumber(value,minDigits=2){
 return Math.max(0,Number(value)||0).toString(7).padStart(minDigits,'0').replace(/[0-6]/g,d=>ISOPOD_WAVES[Number(d)]);
}
export function isopodWaveDate(date,{year=false}={}){
 const md=isopodWaveNumber(date.getMonth()+1)+isopodWaveNumber(date.getDate());
 return year?isopodWaveNumber(date.getFullYear()%100)+String.fromCharCode(0x2009)+md:md;
}
function numericDate(date,lang,{year=false}={}){
 if(lang==='isopod')return isopodWaveDate(date,{year});
 const options=year
  ?{year:'numeric',month:'2-digit',day:'2-digit'}
  :{month:'2-digit',day:'2-digit'};
 return new Intl.DateTimeFormat(dateLocale(lang),options).format(date);
}

export function formatDate(value,lang=I18N_STATE.language){
 if(!value)return t('catalogUnrecorded',{},lang);
 const match=String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);if(!match)return String(value);
 const [,year,month,day]=match,date=new Date(Number(year),Number(month)-1,Number(day),12);
 return numericDate(date,lang,{year:true});
}

export function formatShortDate(date,lang=I18N_STATE.language){
 return numericDate(date,lang);
}

function scientificName(species){return species?.taxonomy?.acceptedScientificName||species?.taxon||species?.trade?.designation||species?.id||'—'}
export function speciesPrimaryName(species,lang=I18N_STATE.language){
 if(!species)return '—';
 if(lang==='zh')return species.names?.zhCN||species.name||scientificName(species);
 if(lang==='isopod')return `o / ${scientificName(species)}`;
 if(lang==='en'){
  if(species.trade?.tradeName)return species.trade.tradeName;
  if(species.names?.en&&['vernacular','hobby_vernacular','trade_name','taxon_label'].includes(species.names.enNameType))return species.names.en;
  return scientificName(species);
 }
 if(species.names?.ja)return species.names.ja;
 if(species.trade?.tradeName)return species.trade.tradeName;
 return scientificName(species);
}

export function speciesSecondaryName(species,lang=I18N_STATE.language){
 if(!species)return '';
 if(lang==='zh')return species.label||species.names?.en||'';
 if(lang==='en'||lang==='isopod')return '';
 if(species.names?.en&&['vernacular','hobby_vernacular','trade_name'].includes(species.names.enNameType))return t('englishName',{name:species.names.en},'ja');
 return '';
}

export function speciesLiteratureLines(species){return species?.literature?.lines||[]}

setDocumentLanguage();
