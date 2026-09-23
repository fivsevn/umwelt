import {SPECIES} from '../species-registry.mjs';
import {sources} from '../sources-registry.mjs';
import {HABITATS,eligibleSpecies} from '../habitats.mjs';
import {pathToFileURL} from 'node:url';
export function validateSpecies(specimens=SPECIES,sourceRows=sources,habitats=HABITATS){
 const errors=[],check=(ok,msg)=>{if(!ok)errors.push(msg)},nonempty=v=>typeof v==='string'&&v.trim().length>0;
 const unique=(rows,label)=>{const ids=rows.map(x=>x.id);check(ids.every(nonempty),`${label}: missing ID`);check(new Set(ids).size===ids.length,`${label}: duplicate ID`);return new Set(ids)};
 const ids=unique(specimens,'species'),sourceIds=unique(sourceRows,'sources'),habitatIds=unique(habitats,'habitats');
 function refs(obj,label){if(!obj||typeof obj!=='object')return;for(const [key,value] of Object.entries(obj)){
  if(key==='evidenceIds'){check(Array.isArray(value),`${label}: evidenceIds must be an array`);for(const id of Array.isArray(value)?value:[])check(sourceIds.has(id),`${label}: unknown source ${id}`)}
  else if(value&&typeof value==='object')refs(value,`${label}.${key}`);
 }}
 for(const p of specimens){
  const at=p.id;
  for(const key of ['name','label','taxon','status'])check(nonempty(p[key]),`${at}: required ${key}`);
  for(const key of ['names','taxonomy','trade','evidence','visual','profile'])check(p[key]&&typeof p[key]==='object',`${at}: required ${key}`);
  for(const key of ['speed','wet','cover'])check(Number.isFinite(p[key])&&p[key]>=0,`${at}: invalid ${key}`);
  for(const key of ['wet','cover'])check(p[key]<=100,`${at}: ${key} exceeds 100`);
  const lines=p.notes||p.literature?.lines;check(Array.isArray(lines)&&lines.length>0&&lines.every(nonempty),`${at}: notes or literature.lines required`);
  const t=p.taxonomy||{};
  check(t.order==='Isopoda'&&nonempty(t.genus)&&nonempty(t.speciesStatus),`${at}: taxonomy boundary`);
  if(t.speciesStatus==='accepted_species')check(nonempty(t.acceptedScientificName)&&nonempty(t.species),`${at}: accepted species needs scientific name`);
  if(['unresolved','undescribed_or_unresolved'].includes(t.speciesStatus))check(t.acceptedScientificName===null,`${at}: unresolved trade identity must not become accepted taxonomy`);
  check(nonempty(p.evidence?.status)&&Array.isArray(p.evidence?.claims),`${at}: evidence status/claims required`);
  check(Array.isArray(p.evidenceIds),`${at}: source IDs required (empty is explicit uncertainty)`);refs(p,at);
  const v=p.visual||{};
  for(const key of ['morphologyKey','provenance'])check(nonempty(v[key]),`${at}: visual.${key} required`);
  for(const key of ['body','cephalon','pereon','pleon','pleotelson','uropods','antennae','legs','surface','palette','conglobation','stageProfiles'])check(v[key]&&typeof v[key]==='object',`${at}: renderer ${key} required`);
  for(const key of ['length','width'])check(Number.isFinite(v.body?.[key])&&v.body[key]>0,`${at}: body.${key}`);
  check(Array.isArray(v.patterns),`${at}: patterns required`);
  check(['full','partial','none','unknown'].includes(v.conglobation?.ability),`${at}: conglobation ability`);
  const scales=['juvenile','subadult','adult'].map(k=>v.stageProfiles?.[k]?.scale);
  check(scales.every(x=>Number.isFinite(x)&&x>0)&&scales[0]<scales[1]&&scales[1]<scales[2],`${at}: growth scales`);
  check(nonempty(v.palette?.tergite)&&nonempty(v.palette?.dark)&&nonempty(v.palette?.light),`${at}: core palette`);
  if(p.game?.referenceOnly)check(p.game.habitatEligible===false&&!p.game.habitats?.length,`${at}: reference-only eligibility`);
  for(const id of p.game?.habitats||[])check(habitatIds.has(id)&&habitats.find(h=>h.id===id)?.species?.includes(at),`${at}: habitat backlink ${id}`);
 }
 for(const h of habitats){
  check(Number.isInteger(h.days)&&h.days>0,`${h.id}: duration`);
  check([1,7].includes(h.cohortSize||7),`${h.id}: unsupported cohort size`);
  if(h.dialogue)check(Number.isInteger(h.turns)&&h.turns>0,`${h.id}: dialogue turns`);
  check(specimens.some(p=>eligibleSpecies(p,h.id)&&!p.game?.referenceOnly),`${h.id}: empty eligible pool`);
  check(new Set(h.species||[]).size===(h.species||[]).length,`${h.id}: duplicate eligibility`);
  for(const id of h.species||[]){const p=specimens.find(p=>p.id===id);check(ids.has(id)&&!p?.game?.referenceOnly,`${h.id}: invalid species ${id}`);check(p?.game?.habitats?.includes(h.id),`${h.id}: species backlink ${id}`)}
 }
 return errors;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const errors=validateSpecies();errors.forEach(e=>console.error(e));console.log(`[species] ${errors.length?'FAIL':'OK'} — ${SPECIES.length} specimens`);process.exitCode=errors.length?1:0}
