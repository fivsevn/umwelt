import {HABITAT_REFERENCES} from './data/habitats/references.mjs';
import {sources} from './sources-registry.mjs';
import {habitatConfig} from './habitats.mjs';
const sourceById=new Map(sources.map(source=>[source.id,source]));
export function renderHabitatReferences(preset){
 const id=preset==='forest'?'terrestrial':preset,config=habitatConfig(id),entry=HABITAT_REFERENCES[id];
 document.querySelector('#habitatReferenceTitle').textContent='当前环境参考 · '+config.names[0];
 document.querySelector('#habitatReferenceScope').textContent=entry?.scope||config.names[1];
 const list=document.querySelector('#habitatReferenceList');list.replaceChildren();
 for(const reference of entry?.entries||[]){
  const source=sourceById.get(reference.sourceId);if(!source)throw new Error('Missing habitat source: '+reference.sourceId);
  const article=document.createElement('article');article.className='habitat-reference';article.dataset.source=source.id;
  const use=document.createElement('b');use.textContent=reference.use;
  const line=document.createElement('p'),link=document.createElement('a');link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=source.title;line.append(link);
  const note=document.createElement('p');note.textContent=reference.note;article.append(use,line,note);list.append(article);
 }
 document.querySelector('#habitatReferenceLimits').textContent=entry?.limits||'此环境的独立环境文献尚未整理。涉及具体标本的分布、生态与形态资料，请查阅形态实验室的“当前标本参考”；布景参数不作为野外测量。';
}
