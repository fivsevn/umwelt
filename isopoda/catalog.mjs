import {makeIsopod} from './sprites.mjs?v=projection-7';
import {sources,frameworkSources,sourceDirectory} from './sources.mjs?v=pixel-life-6';
const text=(tag,value,cls='')=>{const el=document.createElement(tag);el.textContent=value;el.className=cls;return el};
export function renderCatalog(p,{unlocked=true}={}){
 const card=document.createElement('article');card.className='species-card';
 if(!unlocked){card.classList.add('unseen');card.append(text('div','', 'absent-mark'),text('p','这一页还没有遇见它。'),text('p','空着，也是一种如实记录。','faint'));return card}
 const art=document.createElement('div');art.className='catalog-art';let stage='L',condition='normal';const refresh=()=>art.replaceChildren(makeIsopod(p,{stage,condition,seed:p.id}));refresh();
 const controls=document.createElement('div');controls.className='specimen-controls';const sizes=document.createElement('div');sizes.className='size-controls';sizes.setAttribute('aria-label','展示生长阶段');
 for(const value of ['S','M','L']){const b=text('button',value);b.type='button';b.setAttribute('aria-pressed',String(value===stage));b.onclick=()=>{stage=value;for(const button of sizes.children)button.setAttribute('aria-pressed',String(button===b));refresh()};sizes.append(b)}
 const label=text('label',''),select=document.createElement('select');select.setAttribute('aria-label','展示状态');
 for(const [value,name] of [['normal','舒展'],['resting','停驻'],['probing','探查'],['tucked','轻收'],['turning','转身'],['feeding','进食'],['grooming','整理'],['emerging','探出'],['molt-posterior','后半蜕皮'],['molt-anterior','前半蜕皮'],['curled','收拢']]){const option=text('option',name);option.value=value;select.append(option)}select.onchange=()=>{condition=select.value;refresh()};label.append(select);controls.append(sizes,label);
 card.append(art,controls);
 const names=document.createElement('div');names.className='specimen-names';names.append(text('h3',p.names.zhCN),text('p',p.label,'trade-name'));
 const latin=text('p','', 'latin');if(p.taxonomy.acceptedScientificName)latin.append(text('em',p.taxonomy.acceptedScientificName),document.createTextNode(' '+(p.taxonomy.authority||'')));else latin.textContent=p.trade.designation||'尚未确定的名字';names.append(latin);
 if(p.names.zhAliases.length)names.append(text('p','也有人叫它 '+p.names.zhAliases.join('、'),'faint'));
 if(p.trade.morph)names.append(text('p',p.trade.morph+' · 色型','faint'));if(p.trade.locality)names.append(text('p',p.trade.locality.label+' · 产地系','faint'));if(p.trade.lineage)names.append(text('p',p.trade.lineage.label+' · 培养线','faint'));
 if(!p.taxonomy.acceptedScientificName)names.append(text('p','名字暂时写在这里，身份仍留有余地。','name-aside'));card.append(names);
 const note=document.createElement('blockquote');note.className='anonymous-note';for(const line of p.literature.lines)note.append(text('p',line));card.append(note);return card;
}
export function renderSources(){
 const el=document.createElement('article');el.className='reference-page';el.append(text('p','有些句子来自泥土，有些来自别人的书。','reference-intro'));
 const seen=new Set();function list(title,items){el.append(text('h3',title));const ul=document.createElement('ul');for(const s of items){if(seen.has(s.url))continue;seen.add(s.url);const li=document.createElement('li'),a=text('a',s.title);if(/^https:\/\//.test(s.url)){a.href=s.url;a.target='_blank';a.rel='noopener noreferrer'}li.append(a);ul.append(li)}el.append(ul)}
 list('关于身体',frameworkSources);if(sources.length)list('关于名字',sources);list('书架的入口',sourceDirectory);
 el.append(text('p','品种资料遵循项目命名规范。检索入口不等于逐条鉴定证据；未定种、贸易名与培养线仍保留各自的不确定性。','reference-note'),text('p','盒中的活动与相遇是游戏模拟，不是对动物意图的判断。温湿度、成长比例与状态演示不作为饲养处方或实测数据。','reference-note'));return el;
}
