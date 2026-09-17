import {makeIsopod} from './sprites.mjs?v=quiet-ui-1';
import {renderCredits} from './credits.mjs?v=species-23';
const text=(tag,value,cls='')=>{const el=document.createElement(tag);el.textContent=value;el.className=cls;return el};
export function renderCatalog(p,{unlocked=true,collectedOn=null}={}){
 const card=document.createElement('article');card.className='species-card';
 const art=document.createElement('div');art.className='catalog-art specimen-mount';
 if(unlocked)art.append(makeIsopod(p,{stage:'L',condition:'normal',seed:p.id}));
 const pin=text('i','','specimen-pin');pin.setAttribute('aria-hidden','true');if(unlocked)art.append(pin);
 card.append(text('p','标本 / '+p.id.toUpperCase(),'specimen-id'),art,text('p','采集日期  '+(collectedOn||'未记录'),'specimen-date'));
 const names=document.createElement('div');names.className='specimen-names';names.append(text('h3',p.names.zhCN),text('p',p.label,'trade-name'));
 const latin=text('p','', 'latin');if(p.taxonomy.acceptedScientificName)latin.append(text('em',p.taxonomy.acceptedScientificName),document.createTextNode(' '+(p.taxonomy.authority||'')));else latin.textContent=p.trade.designation||'尚未确定的名字';names.append(latin);
 if(p.names.zhAliases.length)names.append(text('p','也有人叫它 '+p.names.zhAliases.join('、'),'faint'));
 if(p.trade.morph)names.append(text('p',p.trade.morph+' · 色型','faint'));if(p.trade.locality)names.append(text('p',p.trade.locality.label+' · 产地系','faint'));if(p.trade.lineage)names.append(text('p',p.trade.lineage.label+' · 培养线','faint'));
 if(!p.taxonomy.acceptedScientificName)names.append(text('p','名字暂时写在这里，身份仍留有余地。','name-aside'));card.append(names);
 const note=document.createElement('blockquote');note.className='anonymous-note';note.append(text('div','Annotation','summary-label'));for(const line of p.literature.lines)note.append(text('p',line));card.append(note);
 if(!unlocked){
  card.classList.add('unseen');
  // Keep the specimen mount, name area and annotation frame without revealing a taxon.
  for(const el of card.querySelectorAll('.specimen-id,.specimen-date,.specimen-names')){el.replaceChildren();el.setAttribute('aria-hidden','true')}
  note.replaceChildren(text('div','Annotation','summary-label'),text('p','未见之物，仍在发生。'));
 }
 return card;
}
export const renderSources=renderCredits;
