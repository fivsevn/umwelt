import {HABITATS} from '../habitats.mjs';
import {SPECIES} from '../species-registry.mjs';
import {pathToFileURL} from 'node:url';

const text=value=>typeof value==='string'&&value.trim().length>0;
const finite=value=>Number.isFinite(value);

export function validateHabitats(habitats=HABITATS,species=SPECIES){
 const errors=[],check=(ok,message)=>{if(!ok)errors.push(message)};
 const speciesIds=new Set(species.map(item=>item.id)),ids=new Set();
 for(const habitat of habitats){
  const at=habitat?.id||'<missing>';
  check(text(habitat?.id),at+': missing habitat id');
  check(!ids.has(habitat?.id),at+': duplicate habitat id');ids.add(habitat?.id);
  check(Array.isArray(habitat?.names)&&habitat.names.length===3&&habitat.names.every(text),at+': names must contain zh/en/ja');
  check(text(habitat?.scene),at+': scene required');
  check(typeof habitat?.aquatic==='boolean',at+': aquatic must be boolean');
  check(Number.isInteger(habitat?.days)&&habitat.days>0,at+': days must be a positive integer');
  const cohortSize=habitat?.cohortSize??7;check(([1,7].includes(cohortSize)||(habitat.id==='groundwater'&&cohortSize===14)||(habitat.id==='shallow-marine'&&cohortSize===18)),at+': unsupported cohort size');
  check(habitat?.defaults&&typeof habitat.defaults==='object'&&!Array.isArray(habitat.defaults),at+': defaults object required');
  for(const [key,value] of Object.entries(habitat?.defaults||{})){
   check(finite(value),at+': defaults.'+key+' must be finite');
   const max=key==='salinity'?42:100;check(finite(value)&&value>=0&&value<=max,at+': defaults.'+key+' out of range');
  }
  if(habitat?.species!=null){
   check(Array.isArray(habitat.species)&&habitat.species.length>0,at+': species must be a non-empty array');
   check(new Set(habitat.species||[]).size===(habitat.species||[]).length,at+': duplicate species');
   for(const id of habitat.species||[])check(speciesIds.has(id),at+': unknown species '+id);
  }
  if(!habitat?.aquatic)continue;
  for(const key of ['flow','oxygen','light','cover','detritus','salinity','tide','algae'])check(finite(habitat.defaults?.[key]),at+': missing aquatic default '+key);
  check(Array.isArray(habitat.species)&&habitat.species.length>0,at+': aquatic species required');
  check(Array.isArray(habitat.palette)&&habitat.palette.length>=3&&habitat.palette.every(text),at+': aquatic palette required');
  for(const key of ['plants','rocks'])check(Number.isInteger(habitat[key])&&habitat[key]>=0,at+': '+key+' must be a non-negative integer');
  check(typeof habitat.wood==='boolean',at+': wood must be boolean');
  check(Array.isArray(habitat.motion)&&habitat.motion.length===(habitat.species?.length||0)&&habitat.motion.every(text),at+': motion must align with species');
  check(Array.isArray(habitat.metrics)&&habitat.metrics.length>0&&habitat.metrics.every(text),at+': metrics required');
  check(new Set(habitat.metrics||[]).size===(habitat.metrics||[]).length,at+': duplicate metrics');
  for(const metric of habitat.metrics||[])check(Object.hasOwn(habitat.defaults||{},metric),at+': metric '+metric+' has no default');
  if(habitat.maxTaxa!=null)check(Number.isInteger(habitat.maxTaxa)&&habitat.maxTaxa>=1&&habitat.maxTaxa<=Math.min(3,habitat.species.length),at+': maxTaxa must be within the supported 1–3 taxa range');
  if(habitat.tides!=null){
   check(Array.isArray(habitat.tides)&&habitat.tides.length===habitat.days*3,at+': tides must cover each ordinary turn');
   for(const value of habitat.tides||[])check(finite(value)&&value>=0&&value<=100,at+': tide out of range');
  }
  if(habitat.dialogue){
   check(Number.isInteger(habitat.turns)&&habitat.turns>0,at+': dialogue turns required');
   for(const key of ['actorScale','motionScale'])check(finite(habitat[key])&&habitat[key]>0,at+': '+key+' must be positive');
  }else{
   check(Array.isArray(habitat.endingPool)&&habitat.endingPool.length>0&&habitat.endingPool.every(text),at+': ordinary aquatic ending pool required');
  }
 }
 return errors;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const errors=validateHabitats();
 errors.forEach(error=>console.error(error));
 console.log('[habitats] '+(errors.length?'FAIL':'OK')+' — '+HABITATS.length+' habitats');
 process.exitCode=errors.length?1:0;
}
