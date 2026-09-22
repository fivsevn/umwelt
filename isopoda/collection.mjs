import {eligibleSpecies,habitatConfig} from './habitats.mjs?v=abyssal-1';
import {SPECIES,speciesById} from './species-registry.mjs?v=abyssal-1';
import {hash,cohortFor,runSpecies} from './engine.mjs?v=abyssal-1';
const ids=new Set(SPECIES.map(s=>s.id));
// Registry-only reference specimens (for example marine Asellota) remain visible in the archive
// but must never be selected for the terrestrial enclosure.
const habitatSpecies=SPECIES.filter(s=>s.game?.habitatEligible!==false);
const referenceSpecies=SPECIES.filter(s=>s.game?.referenceOnly).map(s=>s.id);
export function restoreCollection(value,run,archives=[]){
 const known=Array.isArray(value?.unlocked)?value.unlocked.filter(id=>ids.has(id)):[];
 known.push(...referenceSpecies);
 if(run)known.push(...runSpecies(run));
 for(const item of archives)known.push(...(Array.isArray(item.species)?item.species.filter(id=>ids.has(id)):runSpecies(item)));
 const acquired={};for(const [id,date] of Object.entries(value?.acquired||{}))if(ids.has(id)&&/^\d{4}-\d{2}-\d{2}$/.test(date))acquired[id]=date;
 if(run?.startedOn)for(const id of runSpecies(run))if(!acquired[id])acquired[id]=run.startedOn;
 return {acquired,version:1,unlocked:[...new Set(known)],draws:Number.isInteger(value?.draws)&&value.draws>=0?value.draws:0,instrument:['round','twin','strip'].includes(value?.instrument)?value.instrument:'round'};
}
export function drawSpecies(collection,seed,habitatId='terrestrial'){const habitatSpecies=SPECIES.filter(p=>eligibleSpecies(p,habitatId));const unseen=habitatSpecies.filter(s=>!collection.unlocked.includes(s.id));const pool=unseen.length?unseen:habitatSpecies;return pool[hash(seed,collection.draws+901)%pool.length].id}
export function unlock(collection,id,date){if(!ids.has(id))return;if(!collection.unlocked.includes(id))collection.unlocked.push(id);collection.acquired??={};if(date&&!collection.acquired[id])collection.acquired[id]=date}

// Compatibility is a game envelope for this shared gradient, not husbandry advice.
export function drawCohort(collection,seed,habitatId='terrestrial'){
 const habitatSpecies=SPECIES.filter(p=>eligibleSpecies(p,habitatId));
 const anchor=speciesById(drawSpecies(collection,seed,habitatId));
 if((habitatConfig(habitatId).cohortSize||7)===1)return cohortFor(anchor.id,seed).slice(0,1).map(c=>({...c,stage:'L'}));
 const roll=hash(seed,1901)%100,n=roll<30?1:roll<75?2:3;
 const pool=habitatSpecies.filter(p=>p.id!==anchor.id&&Math.abs(p.wet-anchor.wet)<=20&&Math.abs(p.cover-anchor.cover)<=35).sort((a,b)=>hash(seed,habitatSpecies.indexOf(a)+2001)-hash(seed,habitatSpecies.indexOf(b)+2001));
 const taxa=[anchor,...pool.slice(0,n-1)],r=hash(seed,1902)%100;
 const counts=taxa.length===1?[7]:taxa.length===2?(r<70?[4,3]:r<90?[5,2]:[6,1]):(r<70?[3,2,2]:r<90?[4,2,1]:[5,1,1]);
 const assigned=taxa.flatMap((p,i)=>Array(counts[i]).fill(p.id));
 for(let i=6;i>0;i--){const j=hash(seed,1910+i)%(i+1);[assigned[i],assigned[j]]=[assigned[j],assigned[i]]}
 return cohortFor(anchor.id,seed).map((c,i)=>({...c,species:assigned[i]}));
}
