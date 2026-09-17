import {phenotypeFor} from './phenotypes.mjs?v=cohort-4';

// Special marine reference specimen requested as “海参鼠妇”. This is a real marine asellote,
// NOT a terrestrial Oniscidea woodlouse and therefore must never enter the terrestrial habitat draw.
// The Chinese nickname is project-facing rather than an established formal vernacular name.
function unirameaVisual(){
 const v=structuredClone(phenotypeFor('dairy'));
 v.provenance='MARINE REFERENCE RENDER: Halacarsantia uniramea is an Asellota/Santiidae species, not an Oniscidea. Species-level evidence supports the tiny depressed body, strongly projecting rounded frontal lobe, prominent epimera, marginal spine-like setae, modified posterior pereopods and uniramous uropods. The current 64 px renderer cannot faithfully resolve the marginal seta fringe or individually broaden pereopods V–VII, so those remain documented-but-omitted characters.';
 v.morphologyKey='halacarsantiaMarine';
 v.body.length=.78;v.body.width=.50;v.body.convexity=.16;
 v.cephalon={...v.cephalon,template:'halacarsantia-rounded-frontal-lobe',shape:'rounded-shield',medianProjection:.72,lateralLobes:.18,lateralProjection:.08,scutellum:'none',eyeSet:.72,eyeScale:.55,confidence:'species-character'};
 // Antenna II is kept as a conservative visual proxy. Do not inherit Porcellio's two-article diagnostic.
 v.antennae={...v.antennae,length:.72,spread:.52,bend:.20,joints:[.40,.34,.26],flagellumArticles:null,confidence:'render-proxy'};
 v.pereon={...v.pereon,template:'halacarsantia-prominent-epimera',plateArc:.16,epimera:{...v.pereon.epimera,lobe:'rounded',skirt:.38,flare:.08,roundness:.26,width:.92},confidence:'species-character'};
 v.surface={...v.surface,template:'halacarsantia-smooth-fringed',sculpture:'smooth',scaleSetae:'none',intensity:0,marginalSetae:'spine-like-fringe',marginalSetaeRendered:false,confidence:'species-character-render-limited'};
 v.legs={...v.legs,length:.34,visibility:.90,spread:.34,stepScale:.78,posteriorAnchoringPairs:[5,6,7],posteriorModificationRendered:false,confidence:'species-character-render-limited'};
 v.pleon={...v.pleon,length:.08,width:.42,taper:.30,visiblePleonites:0};
 v.pleotelson={...v.pleotelson,template:'halacarsantia-single-pleotelson',shape:'compact',apex:'rounded',lengthScale:.92,widthScale:1.00,confidence:'species-character'};
 v.uropods={...v.uropods,mode:'projecting',projection:.30,width:.14,spread:.12,thickness:.13,visibility:.92,ramiPerUropod:1,confidence:'species-character'};
 v.palette={...v.palette,tergite:'#c7b982',cephalon:'#c2b37e',epimera:'#b6a66f',pleon:'#bcad78',pleotelson:'#b6a671',uropods:'#a99867',antennae:'#aa9a68',legs:'#9f9163',dark:'#746846',light:'#dfd5a7',accentA:'#9a774e'};
 v.patterns=[{type:'blotch',color:'accentA',target:'pereon',opacity:.22}];
 v.conglobation={...v.conglobation,ability:'none',closure:.02,antennaeHidden:false,strategy:'marine ectocommensal / non-conglobating',confidence:'species-body-plan'};
 return v;
}

export const SEA_CUCUMBER_ISOPOD={
 id:'uniramea',
 name:'海参鼠妇',
 label:'Sea-cucumber Commensal Isopod',
 taxon:'Halacarsantia uniramea',
 status:'正式海洋等足类；“海参鼠妇”为项目 / 粉丝向中文俗称。属于 Asellota，不是陆生 Oniscidea，因此仅作为海洋参考标本，不进入陆生饲养盒抽取。',
 speed:.62,wet:96,cover:20,
 game:{habitatEligible:false,referenceOnly:true,habitat:'marine',reason:'Marine Asellota associated with a sea-cucumber host; incompatible with the terrestrial Oniscidea habitat simulation.'},
 evidenceIds:['itis-halacarsantia-uniramea','menzies-miller-unirameus-1955','wolff-halacarsantia-1989','shimomura-bruce-halacarsantia-2012','worms-australostichopus-mollis'],
 evidence:{status:'literature_supported',claims:[]},
 genetics:{knowledge:'unknown',model:null},
 breeding:{crossCompatibility:'not_applicable'},
 nomenclature:{taxonomicStatus:'accepted_species',tradeStatus:null,vernacularStatus:'project_translation',lastReviewed:'2026-09-17',provenance:'ITIS + original species description + later Halacarsantia revision + current host taxonomy'},
 names:{zhCN:'海参鼠妇',zhAliases:['海参共栖等足虫'],zhNameType:'project_translation',zhConfidence:'low',en:'Sea-cucumber Commensal Isopod',enNameType:'project_translation',ja:null,jaAliases:[]},
 taxonomy:{kingdom:'Animalia',phylum:'Arthropoda',class:'Malacostraca',order:'Isopoda',suborder:'Asellota',family:'Santiidae',genus:'Halacarsantia',species:'uniramea',acceptedScientificName:'Halacarsantia uniramea',authority:'(Menzies & Miller, 1955)',referenceTaxon:'Halacarsantia uniramea',genusStatus:'accepted',speciesStatus:'accepted_species',identificationQualifier:null,identificationConfidence:'high',originalCombination:'Antias unirameus Menzies & Miller, 1955',evidenceIds:['itis-halacarsantia-uniramea','wolff-halacarsantia-1989']},
 trade:{designation:null,tradeName:null,type:'reference_species',morph:null,locality:null,lineage:null,tradeAliases:['海参鼠妇'],evidenceIds:[]},
 biogeography:{originCountry:'New Zealand',originRegion:'Wellington',locality:'Island Bay',nativeRange:'New Zealand record from Island Bay, Wellington',distributionNotes:'The original type material was collected from the skin of the sea cucumber then identified as Stichopus mollis.',confidence:'type-locality',evidenceIds:['menzies-miller-unirameus-1955']},
 association:{type:'ectocommensal',hostAcceptedName:'Australostichopus mollis',hostHistoricalName:'Stichopus mollis',hostCommonName:'Brown-mottled sea cucumber',site:'skin surface / impressed pits',interpretation:'Menzies & Miller interpreted the association as commensal: posterior pereopods V–VII anchor in small skin depressions; they reported no apparent host lesions and unmodified mouthparts.',evidenceIds:['menzies-miller-unirameus-1955','worms-australostichopus-mollis']},
 profile:{adultLengthMm:null,adultLengthRangeMm:[.7,1.0],ecology:['marine ectocommensal'],microhabitat:['skin of sea cucumber host','small impressed pits in host skin'],behaviour:['posterior pereopods V–VII modified for anchoring'],notableMorphology:['约 0.7–1.0 mm；身体平均约为宽度两倍；头部有大型宽圆前突；体侧具刺状刚毛缘；侧板背视明显；尾肢每侧仅一个分支。'],diagnosticNotes:['1955 年原始描述中的身体呈淡黄色，散布少量浅褐色色素胞；后 3 对步足明显加宽并向上弯曲，是与海参宿主关联最特殊的结构之一。','64 px renderer 目前不逐根表现边缘刺状刚毛，也不单独改变第 V–VII 对步足；这些特征保留在档案字段中而不是伪造视觉精度。'],conglobation:'none',careDataStatus:'not_applicable_marine',evidenceIds:['menzies-miller-unirameus-1955','shimomura-bruce-halacarsantia-2012']},
 literature:{lines:['它不是住在落叶下面，而是把后三对步足卡进海参皮肤的小凹陷里。','不到一毫米的身体，让“海参鼠妇”更像一枚贴在宿主表面的活动标点。'],basis:[{claim:'原始描述雄性 0.7 × 0.3 mm、抱卵雌性 1.0 × 0.5 mm；体色淡黄，稀疏浅褐色色素胞。',evidenceIds:['menzies-miller-unirameus-1955']},{claim:'当前有效组合为 Halacarsantia uniramea；属级诊断包括宽圆额叶、体缘刚毛和单枝尾肢。',evidenceIds:['itis-halacarsantia-uniramea','wolff-halacarsantia-1989','shimomura-bruce-halacarsantia-2012']},{claim:'原记录宿主 Stichopus mollis 现接受名为 Australostichopus mollis。',evidenceIds:['worms-australostichopus-mollis']}],themes:['commensalism','scale','host association','taxonomic history']},
 visual:unirameaVisual()
};

export const EXTRA_SPECIES_5=[SEA_CUCUMBER_ISOPOD];
