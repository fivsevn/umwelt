// Directory links are discovery aids, never evidence for a species claim.
export const sources = [];
export const evidence = [];
export const sourceDirectory = [
 {title:'World List of Isopod Crustaceans',url:'https://www.marinespecies.org/isopoda/',type:'TAXONOMY'},
 {title:'GBIF',url:'https://www.gbif.org/',type:'TAXONOMY'},
 {title:'Catalogue of Life',url:'https://www.catalogueoflife.org/',type:'TAXONOMY'},
 {title:'Isopod Site',url:'https://isopod.site/',type:'TRADE ID'}
];
// Framework references support renderer anatomy and taxon-level visual templates.
// They do not upgrade unresolved hobby trade names to formally identified species.
export const frameworkSources = [
 {id:'external-anatomy',level:'A1',type:'MORPHOLOGY',title:'陆生等足类外部形态与鉴别框架',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6288251/',supports:['anatomy.cephalon','anatomy.pereon','anatomy.pleon','anatomy.pleotelson','anatomy.uropods','anatomy.antennae','anatomy.pereopods']},
 {id:'armadillidium-venezillo-head-tail',level:'A1',type:'MORPHOLOGY',title:'Rapa Nui Oniscidea identification characters',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4525033/',supports:['template.armadillidium.cephalon','template.armadillidium.pleotelson','template.armadillidium.uropods','template.venezillo.cephalon','template.venezillo.pleotelson','template.venezillo.uropods','template.conglobation']},
 {id:'ardentiella-reassessment-2025',level:'A1',type:'MORPHOLOGY',title:'Reassessment of Merulanella and allied Armadillidae',url:'https://doi.org/10.3897/nhcm.2.144386',supports:['template.ardentiella.cephalon','template.ardentiella.antennae','template.ardentiella.pereon','template.ardentiella.surface','template.ardentiella.noduli-laterales','template.ardentiella.pleotelson','template.ardentiella.uropods','template.ardentiella.runner','template.ardentiella.conglobation']},
 {id:'porcellio-spatulatus-comparison',level:'A1',type:'MORPHOLOGY',title:'Porcellio selomai and comparison with P. spatulatus',url:'https://www.entomologica.es/publicaciones-boletin/art1818',supports:['template.porcellio-spatulatus.cephalon','template.porcellio-spatulatus.antenna-peduncle']},
 {id:'porcellio-scale-setae-2018',level:'A1',type:'MORPHOLOGY',title:'Porcellio identification and scale-setae characters',url:'https://www.entomologica.es/publicaciones-boletin/en/vol72',supports:['template.porcellio.surface','template.porcellio-echinatus.surface','template.porcellio.cephalon','template.porcellio.antennae']},
 {id:'porcellio-bolivari-characters',level:'A1',type:'MORPHOLOGY',title:'Comparative diagnostic characters of large Iberian Porcellio',url:'https://www.researchgate.net/publication/320858658_Redescubrimiento_y_redescripcion_de_Porcellio_succinctus_Budde-Lund_1885_Isopoda_Oniscidea_Porcellionidae_con_notas_adicionales_para_su_identificacion',supports:['template.porcellio-bolivari.cephalon','template.porcellio-bolivari.antenna-peduncle','template.porcellio-bolivari.uropods']},
 {id:'biphasic-molt',level:'A1',type:'MORPHOLOGY',title:'Titanethes albus 双相蜕皮',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3335403/',supports:['condition.molt.boundary.P4-P5']}
];
export const sourcesFor=species=>sources.filter(s=>species.evidenceIds.includes(s.id));
