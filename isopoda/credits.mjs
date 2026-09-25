import {getLanguage,t} from './i18n.mjs';

// Edit credits*.md to maintain the copy. Supports headings, lists, links,
// paragraphs and blockquotes; text is inserted as text nodes, never raw HTML.
function inline(el,value){
 const pattern=/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;let start=0;
 for(const match of value.matchAll(pattern)){
  el.append(document.createTextNode(value.slice(start,match.index)));
  const a=document.createElement('a');a.textContent=match[1];a.href=match[2];a.target='_blank';a.rel='noopener noreferrer';el.append(a);start=match.index+match[0].length;
 }
 el.append(document.createTextNode(value.slice(start)));
}
function moreAction(line){
 const match=line.match(/^\*\*\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)\*\*$/);
 if(!match||!['https://umwelt.fivsevn.com/isopoda/morphology/','https://umwelt.fivsevn.com/isopoda/habitat'].includes(match[2]))return null;
 const wrap=document.createElement('div');wrap.className='reference-more';wrap.style.cssText='margin-top:32px;padding-top:19px;border-top:1px solid #4f6241';
 const a=document.createElement('a');a.href=match[2];a.target='_blank';a.rel='noopener noreferrer';a.style.cssText='display:inline-flex;align-items:center;justify-content:space-between;gap:18px;min-width:132px;min-height:34px;padding:5px 11px;border:1px solid #677653;background:#35432c;color:#cbd2ae;text-decoration:none;box-shadow:2px 2px #182015';
 const label=document.createElement('span');label.textContent=match[1];const arrow=document.createElement('span');arrow.textContent='→';arrow.setAttribute('aria-hidden','true');arrow.style.color='#8fa17b';a.append(label,arrow);wrap.append(a);return wrap;
}
export function parseCredits(markdown){
 const fragment=document.createDocumentFragment();let list=null,quote=null;
 for(const raw of markdown.split(/\r?\n/)){
  const line=raw.trim();if(!line){list=null;quote=null;continue}
  // The document title is already shown in the dialog title bar.
  if(/^##\s+.*Credits\s*$/i.test(line))continue;
  const action=moreAction(line);if(action){fragment.append(action);list=null;quote=null;continue}
  const heading=line.match(/^(?:\*\*(.+)\*\*|#{2,6} (.+))$/);
  let el;
  if(heading){el=document.createElement('h3');inline(el,heading[1]||heading[2]);fragment.append(el);list=null;quote=null}
  else if(line.startsWith('- ')){if(!list){list=document.createElement('ul');fragment.append(list)}el=document.createElement('li');inline(el,line.slice(2));list.append(el);quote=null}
  else if(line.startsWith('> ')){if(!quote){quote=document.createElement('blockquote');fragment.append(quote)}else quote.append(document.createElement('br'));inline(quote,line.slice(2));list=null}
  else{el=document.createElement('p');inline(el,line);fragment.append(el);list=null;quote=null}
 }
 return fragment;
}
const cache=new Map();
const fileFor={zh:'credits.md',en:'credits.en.md',ja:'credits.ja.md',isopod:'credits.isopod.md'};
export function renderCredits(){
 const lang=getLanguage(),file=fileFor[lang]||fileFor.zh;
 const el=document.createElement('article');el.className='reference-page';el.setAttribute('aria-busy','true');el.textContent=t('creditsLoading');
 if(!cache.has(file))cache.set(file,fetch(new URL(`./${file}`,import.meta.url)).then(response=>{if(!response.ok)throw new Error('Credits unavailable');return response.text()}).catch(error=>{cache.delete(file);throw error}));
 cache.get(file).then(markdown=>{el.replaceChildren(parseCredits(markdown));el.removeAttribute('aria-busy')}).catch(()=>{el.textContent=t('creditsError');el.removeAttribute('aria-busy')});
 return el;
}
