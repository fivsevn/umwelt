import {makeIsopod} from './sprites.mjs?v=memory-14';
import {sources,frameworkSources,sourceDirectory} from './sources.mjs?v=memory-14';
const text=(tag,value,cls='')=>{const el=document.createElement(tag);el.textContent=value;el.className=cls;return el};
export function renderCatalog(p,{unlocked=true,collectedOn=null}={}){
 const card=document.createElement('article');card.className='species-card';
 if(!unlocked){card.classList.add('unseen');card.append(text('div','', 'absent-mark'),text('p','这一页还没有遇见它。'),text('p','空着，也是一种如实记录。','faint'));return card}
 const art=document.createElement('div');art.className='catalog-art specimen-mount';
 art.append(makeIsopod(p,{stage:'L',condition:'normal',seed:p.id}));
 const pin=text('i','','specimen-pin');pin.setAttribute('aria-hidden','true');art.append(pin);
 card.append(text('p','标本 / '+p.id.toUpperCase(),'specimen-id'),art,text('p','采集日期  '+(collectedOn||'未记录'),'specimen-date'));
 const names=document.createElement('div');names.className='specimen-names';names.append(text('h3',p.names.zhCN),text('p',p.label,'trade-name'));
 const latin=text('p','', 'latin');if(p.taxonomy.acceptedScientificName)latin.append(text('em',p.taxonomy.acceptedScientificName),document.createTextNode(' '+(p.taxonomy.authority||'')));else latin.textContent=p.trade.designation||'尚未确定的名字';names.append(latin);
 if(p.names.zhAliases.length)names.append(text('p','也有人叫它 '+p.names.zhAliases.join('、'),'faint'));
 if(p.trade.morph)names.append(text('p',p.trade.morph+' · 色型','faint'));if(p.trade.locality)names.append(text('p',p.trade.locality.label+' · 产地系','faint'));if(p.trade.lineage)names.append(text('p',p.trade.lineage.label+' · 培养线','faint'));
 if(!p.taxonomy.acceptedScientificName)names.append(text('p','名字暂时写在这里，身份仍留有余地。','name-aside'));card.append(names);
 const note=document.createElement('blockquote');note.className='anonymous-note';note.append(text('div','窗口摘要','summary-label'));for(const line of p.literature.lines)note.append(text('p',line));card.append(note);return card;
}
export function renderSources(){
 const el=document.createElement('article');el.className='reference-page';el.append(text('p','有些句子来自泥土，有些来自别人的书。','reference-intro'));
 const seen=new Set();function list(title,items){el.append(text('h3',title));const ul=document.createElement('ul');for(const s of items){if(seen.has(s.url))continue;seen.add(s.url);const li=document.createElement('li'),a=text('a',s.title);if(/^https:\/\//.test(s.url)){a.href=s.url;a.target='_blank';a.rel='noopener noreferrer'}li.append(a);ul.append(li)}el.append(ul)}
 list('关于身体',frameworkSources);if(sources.length)list('关于名字',sources);list('书架的入口',sourceDirectory);
 el.append(text('p','品种资料遵循项目命名规范。检索入口不等于逐条鉴定证据；未定种、贸易名与培养线仍保留各自的不确定性。','reference-note'),text('p','盒中的活动与相遇是游戏模拟，不是对动物意图的判断。温湿度、成长比例与状态演示不作为饲养处方或实测数据。','reference-note'));return el;
}
