// Rare species still belong to the normal cohort, save, collection and actor pipelines.
export const NAIGUA_CHANCE=.08;
function hash(seed,salt){let x=(seed^Math.imul(salt,2654435761))>>>0;x=Math.imul(x^(x>>>16),2246822507);x=Math.imul(x^(x>>>13),3266489909);return (x^(x>>>16))>>>0}
export function addRareSpecimens(cohort,seed,habitatId,misses=0){
 const guaranteed=misses>=7;
 if(habitatId==='abyssal'||cohort.some(c=>c.species==='naigua')||(!guaranteed&&hash(seed,871)/4294967296>=NAIGUA_CHANCE))return cohort;
 return [...cohort,...Array.from({length:guaranteed?1:1+hash(seed,872)%2},(_,i)=>({id:String.fromCharCode(65+cohort.length+i),species:'naigua',seed:hash(seed,880+i),stage:'L'}))];
}
export function validCohortSize(cohort,count,habitatId){
 if(!Array.isArray(cohort))return false;
 if(cohort.length===count)return true;
 return habitatId!=='abyssal'&&cohort.length>count&&cohort.length<=count+2&&cohort.slice(count).every(c=>c.species==='naigua');
}

export function recordNaiguaDraw(collection,cohort){
 const misses=Number.isInteger(collection.naiguaMisses)&&collection.naiguaMisses>=0?collection.naiguaMisses:0;
 collection.naiguaMisses=cohort.some(c=>c.species==='naigua')?0:Math.min(7,misses+1);
}
