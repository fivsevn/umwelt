import {gameText} from './locales/game.mjs';
import {makeIsopod} from './sprites.mjs';
import {renderCredits} from './credits.mjs';
import {getLanguage,t,formatDate,speciesPrimaryName,speciesSecondaryName,speciesLiteratureLines} from './i18n.mjs';
import {annotationLabel,localizedAnnotationLines} from './locales/annotations.mjs';

const text=(tag,value,cls='')=>{const el=document.createElement(tag);el.textContent=value;el.className=cls;return el};
const TAG_LABELS={zh:['采集日期','采集地点'],en:['DATE','SITE'],ja:['採集日','採集地点'],isopod:['o:','o:']};
const TAG_HABITATS_EN={terrestrial:'LITTER',freshwater:'FRESH',estuary:'ESTUARY',intertidal:'TIDAL','shallow-marine':'SEAWEED',abyssal:'ABYSSAL'};
const tagDate=(value,lang)=>formatDate(value,lang);
const tagRow=(label,value)=>{const row=document.createElement('div');row.className='specimen-tag-row';row.append(text('span',label,'specimen-tag-label'),text('b',value||'—','specimen-tag-value'));return row};
export function renderCatalog(p,{unlocked=true,collectedOn=null}={}){
 const lang=getLanguage();
 const card=document.createElement('article');card.className='species-card';card.dataset.language=lang;
 const art=document.createElement('div');art.className='catalog-art specimen-mount';
 if(unlocked)art.append(makeIsopod(p,{stage:'L',condition:'normal',seed:p.id}));
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
