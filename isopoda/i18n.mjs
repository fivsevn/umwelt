import {SUPPORTED_LANGUAGES,UI_COPY} from './locales/ui.mjs?v=i18n-2';

export {SUPPORTED_LANGUAGES};

const STORAGE_KEY='isopoda-ui-language-v1';

function normalize(value){return SUPPORTED_LANGUAGES.includes(value)?value:'zh'}
let language=normalize((()=>{try{return localStorage.getItem(STORAGE_KEY)}catch{return null}})());

export function getLanguage(){return language}
export function t(key,vars={},lang=language){
 const table=UI_COPY[normalize(lang)]||UI_COPY.zh;let value=table[key]??UI_COPY.zh[key]??key;
 for(const [name,replacement] of Object.entries(vars))value=value.replaceAll(`{${name}}`,String(replacement));
 return value;
}

function setDocumentLanguage(){
 const html=document.documentElement;html.dataset.uiLanguage=language;html.lang=language==='zh'?'zh-CN':language;
 document.title=t('documentTitle');const description=document.querySelector('meta[name="description"]');if(description)description.content=t('documentDescription');
}

const textBindings=[
 ['#titleCard .window-title span','titleBar'],['#startBtn','newObservation'],['#continueBtn','continueObservation'],['#arrivalCard .panel-caption','waitingSpecimens'],['#settleBtn','startObservation'],['#activityLabel','habitatWindow'],['#nextBtn','holdMoment'],['#endSpecimenCaption','observeSpecimens'],['#endMoltsCaption','collectedExuviae'],['#endCard .ending-date span:last-child','sevenDayObservation'],['#endCard .afterword .panel-caption','asimovMessage'],['#restartBtn','restart'],['#endingCatalogBtn','viewArchive'],['#specimensTab','specimens']
];
const attributeBindings=[
 ['.launch-close','aria-label','closeReturn'],['#emptyHabitat','aria-label','habitatAria'],['#windowMinimize','aria-label','minimizeWindow'],['#windowMaximize','aria-label','maximizeWindow'],['#windowClose','aria-label','closeWindow'],['.window-system-menu','aria-label','systemActions'],['.language-menu','aria-label','language'],['#musicBtn','aria-label','music'],['#musicBtn','title','musicPlaceholder'],['#soundBtn','aria-label','soundOn'],['#soundBtn','title','soundOn'],['#speedFastBtn','aria-label','speed16'],['#speedTurboBtn','aria-label','speed64'],['#instruments','aria-label','environmentStatus'],['#habitat','aria-label','habitatCanvas'],['#speciesStatus','aria-label','speciesStatus'],['#catalogBtn','aria-label','archive'],['#zoomOut','aria-label','zoomOut'],['#zoomIn','aria-label','zoomIn'],['#zoomReset','aria-label','zoomReset'],['#actions','aria-label','roundChoices'],['#journalBtn','aria-label','journal'],['#sourcesBtn','aria-label','sources'],['#closeDrawer','aria-label','close'],['#pagePrev','aria-label','previousPage'],['#pageNext','aria-label','nextPage']
];

export function applyStaticTranslations(){
 setDocumentLanguage();
 for(const [selector,key] of textBindings){const el=document.querySelector(selector);if(el)el.textContent=t(key)}
 for(const [selector,attribute,key] of attributeBindings){document.querySelectorAll(selector).forEach(el=>el.setAttribute(attribute,t(key)))}
 document.querySelectorAll('[data-system-lang]').forEach(button=>{
  const lang=button.dataset.systemLang;button.setAttribute('aria-label',lang==='zh'?'中文':lang==='en'?'English':'日本語');
 });
}

export function setLanguage(next,{announce=true}={}){
 const value=normalize(next);language=value;
 try{localStorage.setItem(STORAGE_KEY,value)}catch{}
 applyStaticTranslations();
 if(announce)window.dispatchEvent(new CustomEvent('isopoda:languagechange',{detail:{language:value}}));
 return value;
}

export function formatDate(value,lang=language){
 if(!value)return t('catalogUnrecorded',{},lang);
 const match=String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);if(!match)return String(value);
 const [,year,month,day]=match;if(lang==='zh')return `${year}-${month}-${day}`;if(lang==='ja')return `${Number(year)}年${Number(month)}月${Number(day)}日`;
 const date=new Date(Number(year),Number(month)-1,Number(day),12);return new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(date);
}

export function formatShortDate(date,lang=language){
 const year=date.getFullYear(),month=date.getMonth()+1,day=date.getDate();
 if(lang==='zh')return `${String(month).padStart(2,'0')}/${String(day).padStart(2,'0')}`;
 if(lang==='ja')return `${month}月${day}日`;
 return new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short'}).format(date);
}

function scientificName(species){return species?.taxonomy?.acceptedScientificName||species?.taxon||species?.trade?.designation||species?.id||'—'}
export function speciesPrimaryName(species,lang=language){
 if(!species)return '—';
 if(lang==='zh')return species.names?.zhCN||species.name||scientificName(species);
 if(lang==='en'){
  if(species.trade?.tradeName)return species.trade.tradeName;
  if(species.names?.en&&['vernacular','hobby_vernacular','trade_name','taxon_label'].includes(species.names.enNameType))return species.names.en;
  return scientificName(species);
 }
 if(species.names?.ja)return species.names.ja;
 if(species.trade?.tradeName)return species.trade.tradeName;
 return scientificName(species);
}

export function speciesSecondaryName(species,lang=language){
 if(!species)return '';
 if(lang==='zh')return species.label||species.names?.en||'';
 if(lang==='en')return '';
 if(species.names?.en&&['vernacular','hobby_vernacular','trade_name'].includes(species.names.enNameType))return t('englishName',{name:species.names.en},'ja');
 return '';
}

export function speciesLiteratureLines(species){return species?.literature?.lines||[]}

setDocumentLanguage();
