import {phenotypeFor} from '../../phenotypes.mjs?v=cohort-4';
// Pools are ecological observation selections, not claims of sympatry or co-housing suitability.
export const AQUATIC_TAXA=[
 ['aquaticus','Asellus aquaticus','(Linnaeus, 1758)','freshwater','Asellota','Asellidae','https://bmig.org.uk/species/asellus-aquaticus','Ponds and rivers; submerged wood, plants and stones.',20,'#76694d'],
 ['meridianus','Proasellus meridianus','(Racovitza, 1919)','freshwater','Asellota','Asellidae','https://bmig.org.uk/species/proasellus-meridianus','Water plants, stones and submerged wood; less pollution tolerant than A. aquaticus.',10,'#918266'],
 ['coxalis','Proasellus coxalis','(Dollfus, 1892)','freshwater','Asellota','Asellidae','https://bmig.org.uk/species/proasellus-coxalis','Shallow watercourses with varied sediments; also ponds.',10,'#a39167'],
 ['serratum','Sphaeroma serratum','(Fabricius, 1787)','intertidal','Sphaeromatidea','Sphaeromatidae','https://www.marlin.ac.uk/species/detail/2236','Rocky intertidal; beneath rocks and in crevices, outside truly estuarine waters.',10,'#77796d'],
 ['pelagica','Idotea pelagica','Leach, 1816','intertidal','Valvifera','Idoteidae','https://www.marlin.ac.uk/species/detail/2104','Exposed rocky shores, barnacles, mussels and short fucoids.',11,'#695747'],
 ['granulosa','Idotea granulosa','Rathke, 1843','intertidal','Valvifera','Idoteidae','https://www.marlin.ac.uk/species/detail/2091','Algae on open but not strongly exposed shores; Fucus and other algae.',20,'#77784b'],
 ['balthica','Idotea balthica','(Pallas, 1772)','shallow-marine','Valvifera','Idoteidae','https://www.marlin.ac.uk/species/detail/2087','Primarily subtidal, feeding on seaweeds; also lower shore.',30,'#7a8950'],
 ['emarginata','Idotea emarginata','(Fabricius, 1793)','shallow-marine','Valvifera','Idoteidae','https://ns-crustacea.linnaeus.naturalis.nl/linnaeus_ng/app/views/species/nsr_taxon.php?epi=210&id=132140','Sublittoral accumulations of detached algae on fully marine coasts.',30,'#876b48'],
 ['neglecta','Idotea neglecta','G. O. Sars, 1897','shallow-marine','Valvifera','Idoteidae','https://www2.habitas.org.uk/marbiop-ni/species.php?item=S15660','Mostly sublittoral among algae, including detached algal material.',30,'#8b7c58']
];
export const AQUATIC_SOURCES=AQUATIC_TAXA.map(([id,name,,,,,url])=>({id:'aquatic-'+id,level:'A2',type:'TAXONOMY / ECOLOGY / MORPHOLOGY',title:name+' — habitat and identification account',url,supports:[id+'.taxonomy',id+'.habitat',id+'.morphology']}));
function visualFor(id,family,color){
 const v=structuredClone(phenotypeFor(family==='Sphaeromatidae'?'orange':'dairy'));
 const asellid=family==='Asellidae',round=family==='Sphaeromatidae';
 v.morphologyKey=asellid?'asellidAquatic':round?'sphaeromatidAquatic':'idoteidAquatic';
 v.provenance='Evidence-informed dorsal approximation. Fused pleotelson and family silhouette represented; antennules, male pleopods, uropod serrations and species-level tail teeth are below reliable pixel resolution. Colour is an illustrative variant, not diagnostic.';
 v.body.length=round?.92:1.18;v.body.width=round?.94:.63;v.body.convexity=round?.7:.18;
 v.cephalon={...v.cephalon,shape:'rounded-shield',medianProjection:.08,lateralProjection:.12,scutellum:'none',confidence:'family-proxy'};
 v.antennae={...v.antennae,length:asellid?1:.63,flagellumArticles:null,confidence:'render-proxy'};
 v.pleon={...v.pleon,length:.12,visiblePleonites:asellid?2:round?1:2};
 v.pleotelson={...v.pleotelson,lengthScale:1.55,widthScale:1.12,confidence:'family-proxy'};
 v.uropods={...v.uropods,projection:asellid?.7:round?.38:.05,visibility:asellid?1:round?.8:.1};
 v.conglobation={...v.conglobation,ability:round?'full':'none',antennaeHidden:round};
 v.palette={...v.palette,tergite:color,cephalon:color,epimera:color,pleon:color,pleotelson:color,dark:'#303c33',light:'#bebc8a'};
 v.patterns=[{type:'blotch',color:'light',target:'pereon',opacity:.18}];return v;
}
export const AQUATIC_SPECIES=AQUATIC_TAXA.map(([id,taxon,authority,habitat,suborder,family,url,microhabitat,maxLength,color])=>({
 id,name:taxon,label:taxon,taxon,status:'Accepted aquatic species; evidence-informed render approximation.',speed:.7,wet:85,cover:65,
 game:{habitatEligible:false,referenceOnly:false,habitats:[habitat]},
 names:{zhCN:taxon,zhAliases:[],zhNameType:'scientific_name_fallback',zhConfidence:'high',en:taxon,enNameType:'scientific_name',ja:taxon,jaAliases:[]},
 taxonomy:{kingdom:'Animalia',phylum:'Arthropoda',class:'Malacostraca',order:'Isopoda',suborder,family,genus:taxon.split(' ')[0],species:taxon.split(' ')[1],acceptedScientificName:taxon,authority,referenceTaxon:taxon,genusStatus:'accepted',speciesStatus:'accepted_species',identificationConfidence:'literature_supported',evidenceIds:['aquatic-'+id]},
 evidenceIds:['aquatic-'+id],evidence:{status:'literature_supported',claims:[{claim:microhabitat,url}]},
 provenance:{url,reviewed:'2026-09-22',habitatBasis:microhabitat,renderLimitation:'Family dorsal approximation; not an identification key. Adult maximum lengths are not typical individual measurements.'},
 genetics:{knowledge:'unknown',model:null},breeding:{crossCompatibility:'not_applicable'},
 trade:{type:'wild_species',tradeAliases:[],evidenceIds:[]},nomenclature:{taxonomicStatus:'accepted_species',vernacularStatus:'scientific_name_only',lastReviewed:'2026-09-22'},
 biogeography:{nativeRange:null,distributionNotes:'See linked regional species account; the pool does not assert a shared geographic locality.',evidenceIds:['aquatic-'+id]},
 profile:{adultLengthMm:null,adultLengthRangeMm:null,reportedMaximumLengthMm:maxLength,ecology:[habitat],microhabitat:[microhabitat],behaviour:['aquatic locomotion'],notableMorphology:[family+' dorsal body plan'],diagnosticNotes:['Approximate family silhouette; microscopic and sexual diagnostics omitted.'],conglobation:family==='Sphaeromatidae'?'full':'none',evidenceIds:['aquatic-'+id]},
 notes:[taxon],literature:{lines:[taxon],basis:[{claim:microhabitat,evidenceIds:['aquatic-'+id]}],themes:['water','observation']},visual:visualFor(id,family,color)
}));
