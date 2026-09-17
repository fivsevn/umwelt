import {getLanguage} from './i18n.mjs?v=i18n-1';
import {gameText} from './game-locales.mjs?v=game-i18n-1';
import {encounterById} from './encounters.mjs?v=quiet-ui-3';

const selectors=[
 '#activityLabel',
 '#observation',
 '#actions .action',
 '#endingTitle',
 '#endingBody',
 '#endingLine',
 '.ending-note h3',
 '.ending-note p',
 '.journal-paper .pencil-mark',
 '.journal-paper p'
];

function localized(value,lang){
 if(!value||lang==='zh')return value;
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
 if(lang==='zh'||!el.textContent)return;
 const before=el.textContent,after=localized(before,lang);if(after!==before)el.textContent=after;
}

function scan(root=document){
 for(const selector of selectors)root.querySelectorAll?.(selector).forEach(translateElement);
 if(root.nodeType===1&&root.matches?.(selectors.join(',')))translateElement(root);
}

const observer=new MutationObserver(records=>{
 for(const record of records){
  if(record.type==='characterData'){translateElement(record.target.parentElement);continue}
  for(const node of record.addedNodes)if(node.nodeType===1)scan(node);
  if(record.target?.nodeType===1)translateElement(record.target);
 }
});

function start(){scan();observer.observe(document.querySelector('#game')||document.body,{subtree:true,childList:true,characterData:true});requestAnimationFrame(()=>scan())}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.addEventListener('isopoda:languagechange',()=>requestAnimationFrame(()=>scan()));
