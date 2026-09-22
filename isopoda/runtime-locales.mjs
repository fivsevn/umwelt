import {getLanguage} from './i18n.mjs?v=abyssal-1';
import {gameText} from './locales/game.mjs?v=abyssal-1';
import {encounterById} from './encounters.mjs?v=molt-sequence-1';

const selectors=[
 '#activityLabel',
 '#observation',
 '#interactionCue',
 '#endingTitle',
 '#endingBody',
 '#endingLine',
 '#endSpecimenCaption',
 '#endMoltsCaption',
 '.ending-note h3',
 '.ending-note p',
 '.journal-paper .pencil-mark',
 '.journal-paper p'
];

function localized(value,lang){
 if(!value)return value;
 let out=gameText(value,lang);if(out!==value)return out;
 if(value.startsWith('Epilogue - ')){
  const suffix=value.slice('Epilogue - '.length),translated=gameText(suffix,lang);
  if(translated!==suffix)return `Epilogue - ${translated}`;
 }
 // Midday copy is composed as: encounter observation + space + interactive prompt.
 // The route prompt itself contains spaces around the specimen id, so translate the
 // known encounter prefix first and then pass the remainder through the dynamic rules.
 const firstSpace=value.indexOf(' ');
 if(firstSpace>0){
  const head=value.slice(0,firstSpace),tail=value.slice(firstSpace+1);
  const localHead=gameText(head,lang),localTail=gameText(tail,lang);
  if(localHead!==head||localTail!==tail)return `${localHead} ${localTail}`;
 }
 return value;
}

function currentEncounterTitle(lang){
 try{
  const saved=JSON.parse(localStorage.getItem('isopoda-fugue-v4'));
  const encounter=encounterById(saved?.scene?.encounter);
  if(!encounter?.title)return null;
  return lang==='zh'?encounter.title:gameText(encounter.title,lang);
 }catch{return null}
}

function translateElement(el){
 const lang=getLanguage();if(!el)return;
 if(el.id==='activityLabel'){
  const title=currentEncounterTitle(lang);
  if(title&&el.textContent!==title)el.textContent=title;
  return;
 }
 if(el.dataset.directLocale==='true')return;
 if(!el.textContent)return;
 const current=el.textContent;
 let source=el.dataset.localeSource;
 if(!source||current!==el.dataset.localeRendered){
  source=current;
  el.dataset.localeSource=source;
 }
 const after=localized(source,lang);
 el.dataset.localeRendered=after;
 if(after!==current)el.textContent=after;
}

const selectorQuery=selectors.join(',');

function scan(root=document){
 for(const selector of selectors)root.querySelectorAll?.(selector).forEach(translateElement);
 if(root.nodeType===1&&root.matches?.(selectorQuery))translateElement(root);
}

const observer=new MutationObserver(records=>{
 for(const record of records){
  if(record.type==='characterData'){
   const parent=record.target.parentElement;
   if(parent?.matches?.(selectorQuery))translateElement(parent);
   continue;
  }
  for(const node of record.addedNodes)if(node.nodeType===1)scan(node);
  // Only translate actual localized leaves. Translating a container such as
  // #actions would replace its child buttons with encoded text.
  if(record.target?.nodeType===1&&record.target.matches?.(selectorQuery))translateElement(record.target);
 }
});

function start(){scan();observer.observe(document.querySelector('#game')||document.body,{subtree:true,childList:true,characterData:true});requestAnimationFrame(()=>scan())}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.addEventListener('isopoda:languagechange',()=>requestAnimationFrame(()=>scan()));
