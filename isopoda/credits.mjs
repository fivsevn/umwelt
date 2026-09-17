import {getLanguage,t} from './i18n.mjs?v=i18n-1';

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
export function parseCredits(markdown){
 const fragment=document.createDocumentFragment();let list=null,quote=null;
 for(const raw of markdown.split(/\r?\n/)){
  const line=raw.trim();if(!line){list=null;quote=null;continue}
  // The document title is already shown in the dialog title bar.
  if(/^##\s+.*Credits\s*$/i.test(line))continue;
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
const fileFor={zh:'credits.md',en:'credits.en.md',ja:'credits.ja.md'};
export function renderCredits(){
 const lang=getLanguage(),file=fileFor[lang]||fileFor.zh;
 const el=document.createElement('article');el.className='reference-page';el.setAttribute('aria-busy','true');el.textContent=t('creditsLoading');
 if(!cache.has(file))cache.set(file,fetch(new URL(`./${file}?v=i18n-1`,import.meta.url)).then(response=>{if(!response.ok)throw new Error('Credits unavailable');return response.text()}).catch(error=>{cache.delete(file);throw error}));
 cache.get(file).then(markdown=>{el.replaceChildren(parseCredits(markdown));el.removeAttribute('aria-busy')}).catch(()=>{el.textContent=t('creditsError');el.removeAttribute('aria-busy')});
 return el;
}
