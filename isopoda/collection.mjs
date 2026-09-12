import {SPECIES} from './species.mjs?v=pixel-life-6';
import {hash} from './engine.mjs?v=pixel-life-6';
const ids=new Set(SPECIES.map(s=>s.id));
export function restoreCollection(value,run,archives=[]){
 const known=Array.isArray(value?.unlocked)?value.unlocked.filter(id=>ids.has(id)):[];
 if(run&&ids.has(run.species))known.push(run.species);
 for(const item of archives)if(ids.has(item.species))known.push(item.species);
 return {version:1,unlocked:[...new Set(known)],draws:Number.isInteger(value?.draws)&&value.draws>=0?value.draws:0,instrument:['round','twin','strip'].includes(value?.instrument)?value.instrument:'round'};
}
export function drawSpecies(collection,seed){const unseen=SPECIES.filter(s=>!collection.unlocked.includes(s.id));const pool=unseen.length?unseen:SPECIES;return pool[hash(seed,collection.draws+901)%pool.length].id}
export function unlock(collection,id){if(ids.has(id)&&!collection.unlocked.includes(id))collection.unlocked.push(id)}
