// Evidence-informed habitat preferences; site choice and refuge windows are authored.
// These are neither measured salinity limits nor predictions of tidal migration.
export const SHORE_FAUNA_RULES=Object.freeze({
 carinata:{sites:[0],refuge:'mud',source:'aquatic-expansion-carinata'},
 ischiosetosa:{sites:[0],refuge:'stone',source:'aquatic-expansion-ischiosetosa'},
 hookeri:{sites:[0,1],refuge:'wood',source:'aquatic-expansion-hookeri'},
 rugicauda:{sites:[0,1,2],refuge:'wood',source:'aquatic-expansion-rugicauda'},
 levii:{sites:[1,2],refuge:'stone',source:'estuary-levii-bmig'},
 chelipes:{sites:[1,2],refuge:'algae',source:'aquatic-expansion-chelipes'}
});
export const RIVER_ONLY_SPECIES=Object.freeze(['carinata','ischiosetosa']);
const mix=n=>{n=Math.imul(n^(n>>>16),0x45d9f3b);return (n^(n>>>16))>>>0};
export function shoreFaunaSites(group){
 const first=new Map();for(const a of group)if(!first.has((a.ecologySpecies||a.species)))first.set((a.ecologySpecies||a.species),mix(a.seed??0));
 return group.map(a=>{const sites=SHORE_FAUNA_RULES[(a.ecologySpecies||a.species)]?.sites||[0,1,2],seed=first.get((a.ecologySpecies||a.species)),primary=seed%sites.length;
  return sites[(primary+(seed%3===0&&mix(a.seed??0)%4===0?1:0))%sites.length];
 });
}
export function shoreFaunaSnapshot(group,point,index=0){
 const sites=shoreFaunaSites(group),first=new Map();for(const a of group)if(!first.has((a.ecologySpecies||a.species)))first.set((a.ecologySpecies||a.species),a.seed??0);
 return group.map((a,i)=>{const resident=sites[i]===point,seed=mix(first.get((a.ecologySpecies||a.species))+index*131),tide=index%4;
  // A cohort may remain inside its refuge for this observation, without relocating.
  const sheltered=(tide===1||tide===3)&&seed%3===0;
  return {site:sites[i],resident,visible:resident&&!sheltered};
 });
}
