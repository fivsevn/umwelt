// Edit credits.md to maintain the copy. Supports its headings, lists, links,
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
  if(line==='## 来源 / Credits')continue;
  const heading=line.match(/^(?:\*\*(.+)\*\*|#{2,6} (.+))$/);
  let el;
  if(heading){el=document.createElement('h3');inline(el,heading[1]||heading[2]);fragment.append(el);list=null;quote=null}
  else if(line.startsWith('- ')){if(!list){list=document.createElement('ul');fragment.append(list)}el=document.createElement('li');inline(el,line.slice(2));list.append(el);quote=null}
  else if(line.startsWith('> ')){if(!quote){quote=document.createElement('blockquote');fragment.append(quote)}else quote.append(document.createElement('br'));inline(quote,line.slice(2));list=null}
  else{el=document.createElement('p');inline(el,line);fragment.append(el);list=null;quote=null}
 }
 return fragment;
}
let content;
export function renderCredits(){
 const el=document.createElement('article');el.className='reference-page';el.setAttribute('aria-busy','true');el.textContent='正在载入…';
 content??=fetch(new URL('./credits.md?v=species-34',import.meta.url)).then(response=>{if(!response.ok)throw new Error('Credits unavailable');return response.text()}).catch(error=>{content=null;throw error});
 content.then(markdown=>{el.replaceChildren(parseCredits(markdown));el.removeAttribute('aria-busy')}).catch(()=>{el.textContent='加载失败，请关闭后重试。';el.removeAttribute('aria-busy')});
 return el;
}
