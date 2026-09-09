// Directory links are discovery aids, never evidence for a species claim.
export const sources = [];
export const evidence = [];
export const sourceDirectory = [
 {title:'World List of Isopod Crustaceans',url:'https://www.marinespecies.org/isopoda/',type:'TAXONOMY'},
 {title:'GBIF',url:'https://www.gbif.org/',type:'TAXONOMY'},
 {title:'Catalogue of Life',url:'https://www.catalogueoflife.org/',type:'TAXONOMY'},
 {title:'Isopod Site',url:'https://isopod.site/',type:'TRADE ID'}
];
// Precise URLs supplied by the morphology spec support the shared framework only.
export const frameworkSources = [
 {id:'external-anatomy',level:'A1',type:'MORPHOLOGY',title:'陆生等足类外部形态',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6288251/',supports:['anatomy.cephalon','anatomy.pereon','anatomy.pleon','anatomy.uropods']},
 {id:'biphasic-molt',level:'A1',type:'MORPHOLOGY',title:'Titanethes albus 双相蜕皮',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3335403/',supports:['condition.molt.boundary.P4-P5']}
];
export const sourcesFor=species=>sources.filter(s=>species.evidenceIds.includes(s.id));
