import {readFileSync,readdirSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {ENDINGS as LAND_ENDINGS} from '../content.mjs';
import {HABITATS} from '../habitats.mjs';
import {SPECIES} from '../species-registry.mjs';
import {STORIES} from '../data/habitats/stories.mjs';
import {STORY_ALTERNATES} from '../data/habitats/story-alternates.mjs';
import {ABYSSAL_NODES,ABYSSAL_ENDING_DATA,ABYSSAL_FRAGMENT_DATA} from '../data/habitats/abyssal-dialogue.mjs';
import {AQUATIC_ENDINGS,aquaticText} from '../aquatic-story.mjs';
import {pathToFileURL} from 'node:url';
const text=v=>typeof v==='string'&&v.trim().length>0;
// New authored modules use this validator without changing legacy runtime representations.
export function validateTextCatalog(rows,{habitats=HABITATS,species=SPECIES,endings=[...LAND_ENDINGS,...AQUATIC_ENDINGS]}={}){
 const errors=[],seen=new Set(),sets={habitat:new Set(habitats.map(x=>x.id)),species:new Set(species.map(x=>x.id)),ending:new Set(endings.map(x=>x.id))};
 for(const row of rows){
  if(!/^[a-z][A-Za-z0-9_-]*(?::[A-Za-z0-9_-]+)+$/.test(row.key||'')||seen.has(row.key))errors.push(`invalid/duplicate content key ${row.key}`);seen.add(row.key);
  for(const lang of ['zh','en','ja'])if(!text(row.locales?.[lang]))errors.push(`${row.key}: missing ${lang}`);
  for(const [kind,ids] of Object.entries(row.refs||{})){
   if(!sets[kind]||!Array.isArray(ids)){errors.push(`${row.key}: invalid refs ${kind}`);continue}
   for(const id of ids)if(!sets[kind].has(id))errors.push(`${row.key}: unknown ${kind} ${id}`);
  }
 }
 return errors;
}
export function validateNarrative({stories=STORIES,alternates=STORY_ALTERNATES,nodes=ABYSSAL_NODES,endingData=ABYSSAL_ENDING_DATA,fragments=ABYSSAL_FRAGMENT_DATA}={}){
 const errors=[],keys=new Set(),check=(ok,msg)=>{if(!ok)errors.push(msg)};
 const triple=(row,key)=>{check(!keys.has(key),`duplicate content key ${key}`);keys.add(key);check(Array.isArray(row)&&row.length===3&&row.every(text),`${key}: zh/en/ja coverage`)};
 const resolveKey=key=>{for(const lang of ['zh','en','ja','isopod']){const v=aquaticText(key,lang);check(text(v)&&v!==key,`${key}: unresolved ${lang}`)}};
 const rowCheck=(row,key)=>{check(Array.isArray(row)&&row.length===4,`${key}: story row shape`);for(const i of [0,1,3]){triple(row?.[i],`${key}:${i}`);resolveKey(`${key}:${i}`)}check(row?.[2]&&Object.values(row[2]).every(Number.isFinite),`${key}: delta`)};
 const ordinary=HABITATS.filter(h=>h.aquatic&&!h.dialogue);
 check(Object.keys(stories).length===ordinary.length,'story habitat count');
 for(const [id,rows] of Object.entries(stories)){const h=ordinary.find(h=>h.id===id);check(!!h,`unknown story habitat ${id}`);check(rows.length===h?.days*3,`${id}: turn count`);rows.forEach((r,i)=>rowCheck(r,`water:${id}:turn:${i}`))}
 const conditions=new Set(['always','high-flow','low-flow','high-detritus','low-detritus','low-light','low-oxygen','high-cover','low-salinity','high-algae']);
 for(const [id,turns] of Object.entries(alternates))for(const [turn,entries] of Object.entries(turns)){
  check(!!stories[id]?.[turn],`${id}: invalid alternate turn ${turn}`);
  entries.forEach((entry,i)=>{check(conditions.has(entry.when),`${id}: unknown condition ${entry.when}`);rowCheck(entry.row,`water:${id}:alt:${turn}:${i}`)});
 }
 check(nodes.length===HABITATS.find(h=>h.id==='abyssal').turns,'abyssal node count');
 const nodeIds=new Set(),optionIds=new Set();
 for(const node of nodes){check(text(node.id)&&!nodeIds.has(node.id),`duplicate/missing node ID ${node.id}`);nodeIds.add(node.id);triple(node.prompt,`abyssal:node:${node.id}:prompt`);resolveKey(`abyssal:node:${node.id}:prompt`);
  check(Array.isArray(node.options)&&node.options.length===3,`${node.id}: options`);
  for(const [i,o] of (node.options||[]).entries()){check(text(o.id)&&!optionIds.has(o.id),`duplicate/missing option ID ${o.id}`);optionIds.add(o.id);for(const field of ['label','text']){const key=`abyssal:node:${node.id}:option:${i}:${field}`;triple(o[field],key);resolveKey(key)}check(o.delta&&Object.values(o.delta).every(Number.isFinite),`${o.id}: delta`)}
 }
 const endingIds=new Set();for(const e of LAND_ENDINGS){check(!endingIds.has(e.id),`duplicate ending ${e.id}`);endingIds.add(e.id);for(const field of ['title','body','line'])check(text(e[field]),`${e.id}: missing ${field}`)}for(const e of AQUATIC_ENDINGS){check(!endingIds.has(e.id),`duplicate ending ${e.id}`);endingIds.add(e.id);for(const field of ['title','body','line'])resolveKey(e[field])}
 for(const [id,e] of Object.entries(endingData)){check(endingIds.has(id),`unregistered ending ${id}`);for(const field of ['title','body','line'])triple(e[field],`abyssal:ending:${id}:${field}`)}
 for(const [group,entries] of Object.entries(fragments))for(const [id,e] of Object.entries(entries))for(const field of (group==='position'?['title','body']:group==='record'?['body']:['body','line']))triple(e[field],`abyssal:fragment:${group}:${id}:${field}`);
 for(const h of ordinary)for(const id of h.endingPool)check(endingIds.has(id),`${h.id}: missing ending ${id}`);
 // Read existing private routing constants without adding public runtime exports.
 const source=readFileSync(new URL('../aquatic-story.mjs',import.meta.url),'utf8');
 const constant=name=>{const body=source.match(new RegExp('const '+name+'=(\\{[\\s\\S]*?\\n\\});'));if(!body){errors.push(`cannot inspect ${name}`);return {}}return runInNewContext('('+body[1]+')',Object.create(null),{timeout:100})};
 const order=constant('ABYSSAL_OPTION_ORDER');
 for(const node of nodes){const row=order[node.id];check(Array.isArray(row)&&row.length===node.options.length&&new Set(row).size===row.length&&row.every(i=>Number.isInteger(i)&&i>=0&&i<node.options.length),`${node.id}: option presentation order`)}
 for(const id of Object.keys(order))check(nodeIds.has(id),`unknown presentation node ${id}`);
 for(const name of ['ABYSSAL_FRAGMENT_UNLOCKS','ABYSSAL_FRAGMENT_RESONANCE'])for(const [group,entries] of Object.entries(constant(name)))for(const [id,refs] of Object.entries(entries)){
  check(!!fragments[group]?.[id],`${name}: unknown fragment ${group}:${id}`);
  for(const option of refs.flat())check(optionIds.has(option),`${name}: unknown option ${option}`);
 }
 return errors;
}
export async function validateNewNarrative(){
 const dir=new URL('../data/narrative/',import.meta.url),rows=[];
 for(const file of readdirSync(dir).filter(f=>f.endsWith('.mjs')).sort()){
  const module=await import(new URL(file,dir));
  if(!Array.isArray(module.TEXT_CATALOG))return [`${file}: TEXT_CATALOG array required`];
  rows.push(...module.TEXT_CATALOG);
 }
 return validateTextCatalog(rows);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const errors=[...validateNarrative(),...await validateNewNarrative()];errors.forEach(e=>console.error(e));console.log(`[narrative] ${errors.length?'FAIL':'OK'}`);process.exitCode=errors.length?1:0}
