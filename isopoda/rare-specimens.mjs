// Rare species still belong to the normal cohort, save, collection and actor pipelines.
export const NAIGUA_CHANCE=.08;
function hash(seed,salt){let x=(seed^Math.imul(salt,2654435761))>>>0;x=Math.imul(x^(x>>>16),2246822507);x=Math.imul(x^(x>>>13),3266489909);return (x^(x>>>16))>>>0}
export function addRareSpecimens(cohort,seed,habitatId,misses=0){
 const guaranteed=misses>=7;
 if(cohort.some(c=>c.species==='naigua'))return normalizeNaiguaCohort(cohort,habitatId);
 if(habitatId==='petri-dish')return normalizeNaiguaCohort(cohort,habitatId);
 if(habitatId==='abyssal'||(!guaranteed&&hash(seed,871)/4294967296>=NAIGUA_CHANCE))return cohort;
 const count=guaranteed?1:1+hash(seed,872)%2;
 if(habitatId==='terrestrial'&&cohort.length){
  const slots=cohort.map((_,i)=>i);
  for(let i=slots.length-1;i>0;i--){const j=hash(seed,890+i)%(i+1);[slots[i],slots[j]]=[slots[j],slots[i]]}
  const selected=new Set(slots.slice(0,count));
  return cohort.map((c,i)=>selected.has(i)?{...c,species:'naigua',ecologySpecies:c.ecologySpecies||c.species}:c);
 }
 const tutor=cohort.find(c=>c.species!=='naigua');
 return [...cohort,...Array.from({length:count},(_,i)=>({id:String.fromCharCode(65+cohort.length+i),species:'naigua',...(tutor?{ecologySpecies:tutor.species}:{}),seed:hash(seed,880+i),stage:'L'}))];
}
export function validCohortSize(cohort,count,habitatId){
 if(!Array.isArray(cohort))return false;
 if(cohort.length===count)return true;
 return !['abyssal','petri-dish'].includes(habitatId)&&cohort.length>count&&cohort.length<=count+2&&cohort.slice(count).every(c=>c.species==='naigua');
}

export function recordNaiguaDraw(collection,cohort){
 const misses=Number.isInteger(collection.naiguaMisses)&&collection.naiguaMisses>=0?collection.naiguaMisses:0;
 collection.naiguaMisses=cohort.some(c=>c.species==='naigua')?0:Math.min(7,misses+1);
}

export function normalizeNaiguaCohort(cohort,habitatId,arrivalPending=false){
 if(!Array.isArray(cohort))return cohort;
 let result=cohort;
 // Older cabinet saves could append rare visitors after the selected specimen.
 // Keep the original selection (including an explicitly selected Naigua) and progress.
 if(habitatId==='petri-dish'&&cohort.length>1&&cohort.slice(1).every(c=>c.species==='naigua'))result=cohort.slice(0,1);
 if(habitatId==='terrestrial'&&arrivalPending&&cohort.length>7&&cohort.slice(7).every(c=>c.species==='naigua')){
  const extra=cohort.slice(7);result=cohort.slice(0,7).map((c,i)=>i>=7-extra.length?{...extra[i-(7-extra.length)],id:c.id,ecologySpecies:c.species}:c);
 }
 const tutor=result.find(c=>c.species!=='naigua')?.species||(habitatId==='petri-dish'?'uniramea':null);
 return result.map(c=>c.species==='naigua'&&!c.ecologySpecies&&tutor?{...c,ecologySpecies:tutor}:c);
}
