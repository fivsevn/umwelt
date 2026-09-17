import {makeIsopod} from './sprites.mjs?v=quiet-ui-1';
import {renderCredits} from './credits.mjs?v=i18n-1';
import {getLanguage,t,formatDate,speciesPrimaryName,speciesSecondaryName,speciesLiteratureLines} from './i18n.mjs?v=i18n-1';

const text=(tag,value,cls='')=>{const el=document.createElement(tag);el.textContent=value;el.className=cls;return el};
export function renderCatalog(p,{unlocked=true,collectedOn=null}={}){
 const lang=getLanguage();
 const card=document.createElement('article');card.className='species-card';card.dataset.language=lang;
 const art=document.createElement('div');art.className='catalog-art specimen-mount';
 if(unlocked)art.append(makeIsopod(p,{stage:'L',condition:'normal',seed:p.id}));
 const pin=text('i','','specimen-pin');pin.setAttribute('aria-hidden','true');if(unlocked)art.append(pin);
 const specimenId=t('catalogSpecimen',{id:p.id.toUpperCase()});
 const specimenDate=p.game?.referenceOnly?t('catalogReferenceType'):t('catalogCollectionDate',{date:formatDate(collectedOn)});
 card.append(text('p',specimenId,'specimen-id'),art,text('p',specimenDate,'specimen-date'));
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
 const note=document.createElement('blockquote');note.className='anonymous-note';note.append(text('div','Annotation','summary-label'));for(const line of speciesLiteratureLines(p,lang))note.append(text('p',line));card.append(note);
 if(!unlocked){
  card.classList.add('unseen');
  // Keep the specimen mount, name area and annotation frame without revealing a taxon.
  for(const el of card.querySelectorAll('.specimen-id,.specimen-date,.specimen-names')){el.replaceChildren();el.setAttribute('aria-hidden','true')}
  note.replaceChildren(text('div','Annotation','summary-label'),text('p',t('catalogUnseen')));
 }
 return card;
}
export const renderSources=renderCredits;
