import {gameText} from './locales/game.mjs';
import {typicalAdultLengthMm} from './species-size.mjs';
import {pixelAnatomy,renderModel,makeIsopod} from './sprites.mjs';
import {renderCredits} from './credits.mjs';
import {getLanguage,t,formatDate,speciesPrimaryName,speciesSecondaryName,speciesLiteratureLines} from './i18n.mjs';
import {annotationLabel,localizedAnnotationLines} from './locales/annotations.mjs';

const text=(tag,value,cls='')=>{const el=document.createElement(tag);el.textContent=value;el.className=cls;return el};
const TAG_LABELS={zh:['采集日期','采集地点'],en:['DATE','SITE'],ja:['採集日','採集地点'],isopod:['o:','o:']};
const TAG_HABITATS_EN={terrestrial:'LITTER',freshwater:'FRESH',groundwater:'CAVE',estuary:'ESTUARY',intertidal:'TIDAL','sandy-surf':'SURF','shallow-marine':'SEAWEED',abyssal:'ABYSSAL','petri-dish':'DISH'};
const SIZE_LABELS={
 zh:{ref:'体长参考',unknown:'体长待考',note:'似乎要换一个\n大一点的标本框……',giant:'这次，恐怕要\n另做一只标本框了……'},
 en:{ref:'Body reference',unknown:'Size unresolved',note:'A bigger frame\nmight be needed…',giant:'This one may need\na frame of its own…'},
 ja:{ref:'体長の目安',unknown:'体長未確認',note:'もう少し大きな\n標本箱が要りそう……',giant:'これは専用の箱を\n作らないと……'},
 isopod:{ref:'↔',unknown:'↔ ?',note:'[  o  ] …\n[    O    ]',giant:'[ O ] …\n[     O     ]'}
};
export function specimenSizePresentation(p){
 const model=renderModel(p.visual,{stage:'L',condition:'normal',seed:p.id});
 const modules=pixelAnatomy(model,{posture:'normal',moving:false});
 const body=modules.filter(m=>['cephalon','pleon','pleotelson'].includes(m.region)||/^p\d$/.test(m.region)).flatMap(m=>m.cells);
 const all=modules.flatMap(m=>m.cells),extent=cells=>Math.max(...cells.map(c=>c[0]))-Math.min(...cells.map(c=>c[0]))+1;
 const pxPerCell=Math.round(80*model.growth.scale)/64*2;
 const mm=typicalAdultLengthMm(p);
 const barMm=mm?[.1,.2,.5,1,2,5,10,20,50,100,200].reduce((best,n)=>Math.abs(n-mm/4)<Math.abs(best-mm/4)?n:best,.1):null;
 return {mm,barMm,barPx:mm?extent(body)*pxPerCell*barMm/mm:null,oversized:extent(all)*pxPerCell>156||mm>=25||['bolivari','giganteus'].includes(p.id),giant:mm>=100};
}
const tagDate=(value,lang)=>formatDate(value,lang);
const tagRow=(label,value)=>{const row=document.createElement('div');row.className='specimen-tag-row';row.append(text('span',label,'specimen-tag-label'),text('b',value||'—','specimen-tag-value'));return row};
export function renderCatalog(p,{unlocked=true,collectedOn=null}={}){
 const lang=getLanguage();
 const card=document.createElement('article');card.className='species-card';card.dataset.language=lang;
 const art=document.createElement('div');art.className='catalog-art specimen-mount';
 if(unlocked){
  art.append(makeIsopod(p,{stage:'L',condition:'normal',seed:p.id}));
  const size=specimenSizePresentation(p),labels=SIZE_LABELS[lang]||SIZE_LABELS.zh;
  const scale=text('div','','specimen-scale');
  if(size.mm){
   const unit=n=>size.mm>=100?`${Number((n/10).toFixed(1))} cm`:`${Number(n.toFixed(2))} mm`;
   scale.append(text('span',`${labels.ref} ≈ ${unit(size.mm)}`));
   const bar=text('i','','specimen-scale-bar');bar.style.width=size.barPx+'px';bar.setAttribute('aria-hidden','true');
   scale.append(bar,text('span',`≈ ${unit(size.barMm)}`));
  }else scale.append(text('span',labels.unknown));
  art.append(scale);
  if(size.oversized){art.append(text('aside',size.giant?labels.giant:labels.note,'specimen-size-note'));card.classList.add('oversized-specimen')}
 }
 const pin=text('i','','specimen-pin');pin.setAttribute('aria-hidden','true');if(unlocked)art.append(pin);
 const specimenId=t('catalogSpecimen',{id:p.id.toUpperCase()}),labels=TAG_LABELS[lang]||TAG_LABELS.zh;
 if(unlocked){
  const habitatId=p.game?.habitats?.[0]||'terrestrial',tag=document.createElement('div');tag.className='specimen-tag';
  const habitatLabel=lang==='en'?(TAG_HABITATS_EN[habitatId]||gameText('water:habitat:'+habitatId,lang)):gameText('water:habitat:'+habitatId,lang);tag.append(tagRow(labels[0],tagDate(collectedOn,lang)),tagRow(labels[1],habitatLabel));art.append(tag);
 }
 card.append(text('p',specimenId,'specimen-id'),art);
 if(p.game?.referenceOnly)card.append(text('p',t('catalogReferenceType'),'specimen-date'));
 const names=document.createElement('div');names.className='specimen-names';
 names.append(text('h3',speciesPrimaryName(p,lang)));
 const secondary=speciesSecondaryName(p,lang);if(secondary)names.append(text('p',secondary,'trade-name'));
 const latin=text('p','', 'latin');if(p.taxonomy.acceptedScientificName)latin.append(text('em',p.taxonomy.acceptedScientificName),document.createTextNode(' '+(p.taxonomy.authority||'')));else latin.textContent=p.trade.designation||p.taxon||t('catalogUncertain');names.append(latin);
 const aliases=lang==='zh'?(p.names?.zhAliases||[]):lang==='ja'?(p.names?.jaAliases||[]):[];
 if(aliases.length)names.append(text('p',t('catalogAlias',{names:aliases.join(lang==='ja'?'、':'、')}),'faint'));
 if(p.trade.morph)names.append(text('p',t('catalogMorph',{value:p.trade.morph}),'faint'));
 if(p.trade.locality)names.append(text('p',t('catalogLocality',{value:p.trade.locality.label}),'faint'));
 if(p.trade.lineage)names.append(text('p',t('catalogLineage',{value:p.trade.lineage.label}),'faint'));
 if(p.game?.referenceOnly)names.append(text('p',t('catalogMarine'),'name-aside'));
 if(!p.taxonomy.acceptedScientificName)names.append(text('p',t('catalogUncertain'),'name-aside'));card.append(names);
 const note=document.createElement('blockquote');note.className='anonymous-note';note.append(text('div',annotationLabel(lang),'summary-label'));
 const annotationLines=localizedAnnotationLines(p,lang,speciesLiteratureLines(p,lang));for(const line of annotationLines)note.append(text('p',line));card.append(note);
 if(!unlocked){
  card.classList.add('unseen');
  // Keep the specimen mount, name area and annotation frame without revealing a taxon.
  for(const el of card.querySelectorAll('.specimen-id,.specimen-date,.specimen-names')){el.replaceChildren();el.setAttribute('aria-hidden','true')}
  note.replaceChildren(text('div',annotationLabel(lang),'summary-label'),text('p',t('catalogUnseen')));
 }
 return card;
}
export const renderSources=renderCredits;
