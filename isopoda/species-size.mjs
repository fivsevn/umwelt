// Species display scale is separate from morphology proportions.
// Reference lengths are body-length anchors, not husbandry targets or strict morphometrics.
// Strong literature measurements stay distinguishable from field-guide / hobby references.
const SIZE_REFERENCE={
 ischiosetosa:{mm:5,confidence:'specialist-field-guide',basis:'BMIG female maximum; matches the Jaera albifrons display reference convention'},
 albifrons:{mm:5,confidence:'specialist-field-guide',basis:'BMIG female maximum; used as a compressed display anchor, not typical size'},
 hirsuta:{mm:3.5,confidence:'specialist-field-guide',basis:'BMIG female maximum for the female-form rendering proxy; male maximum is 4 mm'},
 maculatum:{mm:18,confidence:'reference',basis:'published/field reference maximum; conservative display anchor'},
 klugii:{mm:21,confidence:'literature',basis:'Journal of Crustacean Biology 2025 specimen-size table'},
 gestroi:{mm:20,confidence:'literature',basis:'Journal of Crustacean Biology 2025 specimen-size table'},
 versicolor:{mm:10,confidence:'literature',basis:'Journal of Crustacean Biology 2025 specimen-size table'},
 hoffmannseggii:{mm:16,confidence:'type-specimen',basis:'Schmalfuss 1987 holotype body length; conservative species anchor'},
 nasatum:{mm:15,confidence:'historical-literature',basis:'published adult body-length record; conservative anchor amid regional size variation'},
 granulatum:{range:[15,25],confidence:'reference-range',basis:'published/hobby reference range; midpoint used only for display scaling'},
 expansus:{range:[25,35],confidence:'reference-range',basis:'multiple specialist references describe adults around 25–35 mm; midpoint used only for display scaling'},
 haasi:{mm:25.5,confidence:'taxonomic-material',basis:'large P. haasi taxonomic material; conservative large-species display anchor'},
 officinalis:{mm:20,confidence:'reference',basis:'multiple specialist references place adults around 20 mm'},
 vulgare:{mm:18,confidence:'specialist-field-guide',basis:'BMIG species account: adults to 18 mm'},
 asellus:{mm:18,confidence:'specialist-field-guide',basis:'BMIG species account: adults to 18 mm'},
 muscorum:{range:[8,11],confidence:'literature-range',basis:'Saska 2007 diagnosis: adults 8–11 mm'},
 rathkii:{range:[12,15],confidence:'literature-range',basis:'published diagnosis and BMIG account: adults 12–15 mm'},
 reaumuri:{mm:22,confidence:'secondary-reference',basis:'widely reported adult maximum around 22 mm; used only as a compressed display anchor'},
 pictum:{mm:9,confidence:'specialist-field-guide',basis:'BMIG / Gregory & Richards 2008: adults to 9 mm'},
 pulchellum:{mm:5,confidence:'specialist-field-guide',basis:'BMIG / Gregory & Richards 2008: adults to 5 mm'},
 werneri:{mm:21,confidence:'revision-reference',basis:'modern species revision / specialist references: adults around 21 mm'},
 spinicornis:{mm:12,confidence:'specialist-field-guide',basis:'BMIG and Shultz 2018: adults to about 12 mm'},
 magnificus:{mm:29,confidence:'taxonomic-material',basis:'Schmalfuss 1987 cites adult males reaching about 29 mm'},
 uniramea:{range:[.7,1.0],confidence:'type-series',basis:'Menzies & Miller 1955: holotype male 0.7 mm; ovigerous allotype female 1.0 mm'},
 pulchra:{mm:8,confidence:'specialist-field-guide',basis:'BMIG: males to 8 mm'},
 affinis:{mm:6,confidence:'specialist-field-guide',basis:'BMIG: females to 6 mm'},
 spinigera:{mm:9,confidence:'literature-reference',basis:'marine isopod reference: up to about 9 mm'},
 valdensis:{mm:8.5,confidence:'specialist-reference',basis:'Henry and Magniez 1983: up to 8.5 mm'},
 cavaticus:{mm:8,confidence:'specialist-reference',basis:'groundwater and cave references: adults to about 8 mm'},
 lusitanicus:{range:[4.2,7.2],confidence:'peer-reviewed-range',basis:'Di Lorenzo & Reboleira 2022 measured adults 4.2–7.2 mm'},
 virei:{mm:8,confidence:'specialist-reference',basis:'French freshwater Asellota guide: usual adult size around 8 mm'}
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function referenceLengthMm(species){
 const p=species?.profile||{};
 // Prefer the species dossier whenever it carries a literature-backed body length. The fallback
 // table exists for taxa whose current profile intentionally leaves size unresolved.
 if(Number.isFinite(p.adultLengthMm)&&p.adultLengthMm>0)return p.adultLengthMm;
 if(Array.isArray(p.adultLengthRangeMm)&&p.adultLengthRangeMm.length===2&&p.adultLengthRangeMm.every(v=>Number.isFinite(v)&&v>0))return (p.adultLengthRangeMm[0]+p.adultLengthRangeMm[1])/2;
 const ref=SIZE_REFERENCE[species?.id];
 if(ref?.mm)return ref.mm;
 if(ref?.range)return (ref.range[0]+ref.range[1])/2;
 return null;
}
// 15 mm is the neutral visual baseline. Power compression preserves readable differences
// without letting giant Porcellio dominate the 384 px habitat. A 0.70 floor keeps true
// miniature species legible while preserving the difference between ~5 mm and ~9–10 mm taxa.
// Sub-millimetre marine reference specimens also stop at this floor; their displayed size is
// explicitly a legibility compromise, not a literal scale comparison with terrestrial taxa.
export function displayScaleForMm(mm){
 if(!Number.isFinite(mm)||mm<=0)return 1;
 return clamp(Math.pow(mm/15,.4),.70,1.28);
}
export function speciesDisplayScale(species){return displayScaleForMm(referenceLengthMm(species))}
export function sizeReferenceFor(species){return SIZE_REFERENCE[species?.id]||null}
export function applySpeciesDisplayScale(species){
 const scale=speciesDisplayScale(species),visual=species.visual;
 if(!visual)return species;
 const stageProfiles={};
 for(const [stage,profile] of Object.entries(visual.stageProfiles||{}))stageProfiles[stage]={...profile,scale:(profile.scale??1)*scale};
 return {...species,visual:{...visual,adultDisplayScale:scale,stageProfiles},renderSize:{referenceMm:referenceLengthMm(species),scale,reference:sizeReferenceFor(species)}};
}
