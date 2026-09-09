import {makeIsopod} from './sprites.mjs?v=morphology-4';
import {sourcesFor,frameworkSources,sourceDirectory} from './sources.mjs?v=morphology-4';
const text=(tag,value,cls='')=>{const el=document.createElement(tag);el.textContent=value;el.className=cls;return el};
const labels={unknown:'资料不足',accepted:'正式分类属名',tentative:'暂定归属',trade_assigned:'贸易标注',accepted_species:'已描述物种',undescribed_or_unresolved:'未描述或身份未定',unresolved:'身份未定',cultured_line:'人工培养线',locality:'产地系',morph:'人工色型',wild_species:'正式物种',trade_complex:'贸易身份存在混用',undescribed_trade_taxon:'未定种贸易条目',trade_documented:'贸易来源记录'};
const readable=value=>labels[value]||value;
const unknown=value=>value==null?'资料不足':readable(value);
function section(title){const el=document.createElement('section');el.className='catalog-section';el.append(text('h3',title));return el}
function row(parent,label,value){const dt=text('dt',label),dd=text('dd',unknown(value));parent.append(dt,dd)}
function sourceList(records){const list=document.createElement('ul');list.className='source-list';for(const s of records){const li=document.createElement('li'),a=text('a',s.title);if(/^https:\/\//.test(s.url)){a.href=s.url;a.target='_blank';a.rel='noopener noreferrer'}li.append(text('span',`[${s.type}] `),a);if(s.supports?.length)li.append(text('small','支持字段：'+s.supports.map(k=>({'anatomy.cephalon':'头部','anatomy.pereon':'七胸节','anatomy.pleon':'腹部','anatomy.uropods':'尾肢','condition.molt.boundary.P4-P5':'双相蜕皮的 P4/P5 分界'})[k]||k).join(' / ')));list.append(li)}return list}
export function renderCatalog(p){
 const card=document.createElement('article');card.className='species-card';
 const art=document.createElement('div');art.className='catalog-art';
 let stage='L',condition='normal';const refresh=()=>art.replaceChildren(makeIsopod(p,{stage,condition,seed:p.id}));refresh();
 const controls=document.createElement('div');controls.className='specimen-controls';
 const sizes=document.createElement('div');sizes.className='size-controls';sizes.setAttribute('aria-label','展示生长阶段');
 for(const value of ['S','M','L']){const b=text('button',value);b.type='button';b.setAttribute('aria-pressed',String(value===stage));b.onclick=()=>{stage=value;for(const button of sizes.children)button.setAttribute('aria-pressed',String(button===b));refresh()};sizes.append(b)}
 const label=text('label','形态 '),select=document.createElement('select');select.setAttribute('aria-label','展示状态');
 for(const [value,name] of [['normal','静止'],['molt-posterior','后半蜕皮'],['molt-anterior','前半蜕皮'],['curled','防御姿态']]){const option=text('option',name);option.value=value;select.append(option)}
 select.onchange=()=>{condition=select.value;refresh()};label.append(select);controls.append(sizes,label);
 card.append(art,controls,text('p','展示比例与状态为视觉模型；不代表实测尺寸或该品系已证实的发育过程。','catalog-disclaimer'));
 const names=section('NAMES / 名称');names.append(text('p',p.names.zhCN+' · 中文圈俗名'));
 if(p.names.zhAliases.length)names.append(text('p','别名：'+p.names.zhAliases.join(' / ')));card.append(names);
 const scientific=section('SCIENTIFIC NAME / 科学名称');
 if(p.taxonomy.acceptedScientificName){const line=document.createElement('p');line.append(text('em',p.taxonomy.acceptedScientificName),document.createTextNode(' '+(p.taxonomy.authority||'')));scientific.append(line)}
 else{scientific.append(text('p','种级身份未定 / Not formally resolved'));if(p.taxonomy.referenceTaxon){const line=text('p','参考分类：');line.append(text('em',p.taxonomy.referenceTaxon),document.createTextNode('（cf.，待鉴定）'));scientific.append(line)}}card.append(scientific);
 if(p.trade.designation){const trade=section('TRADE DESIGNATION / 贸易标注');trade.append(text('p',p.trade.designation));const details=document.createElement('dl');row(details,'类型',p.trade.type);if(p.trade.morph)row(details,'Morph / 色型',p.trade.morph);if(p.trade.locality)row(details,'Locality / 产地系',p.trade.locality.label);if(p.trade.lineage)row(details,'Cultured line / 培养线',p.trade.lineage.label);trade.append(details);card.append(trade)}
 const classification=section('CLASSIFICATION / 分类');const dl=document.createElement('dl');row(dl,'Family / 科',p.taxonomy.family);row(dl,'Genus / 属',p.taxonomy.genus+' · '+readable(p.taxonomy.genusStatus));row(dl,'Species / 种',p.taxonomy.species);row(dl,'Status / 状态',p.taxonomy.speciesStatus);classification.append(dl);card.append(classification);
 const origin=section('ORIGIN / 来源地');const od=document.createElement('dl');row(od,'国家',p.biogeography.originCountry);row(od,'地区',p.biogeography.originRegion);row(od,'Locality',p.biogeography.locality?.label);origin.append(od,text('p','来源记录：'+readable(p.biogeography.confidence)+'；不等同于完整自然分布。','taxonomy-note'));card.append(origin);
 const note=section('IDENTIFICATION NOTE / 鉴定说明');note.append(text('p',p.status));card.append(note);
 const literature=section('LITERATURE / 图鉴札记');for(const line of p.literature.lines)literature.append(text('p',line,'literature-line'));card.append(literature);
 const sources=section('SOURCES / 资料来源'),records=sourcesFor(p);
 if(records.length)sources.append(sourceList(records));else sources.append(text('p','此条目尚无精确到字段的证据链接。资料采用项目规范工作基线，分类与贸易信息仍待逐条补证。','evidence-empty'));
 const framework=document.createElement('details');framework.append(text('summary','通用形态依据（不证明本品种身份）'),sourceList(frameworkSources));sources.append(framework);
 const directory=document.createElement('details');directory.append(text('summary','资料检索入口（不作为字段证据）'),sourceList(sourceDirectory));sources.append(directory);card.append(sources,text('p','箱内温湿度与行为为游戏模拟；数值不作真实饲养处方。','catalog-disclaimer'));
 return card;
}
