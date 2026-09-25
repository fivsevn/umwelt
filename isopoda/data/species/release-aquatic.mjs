import {phenotypeFor} from '../../phenotypes.mjs';

const TAXA=[
 {id:'valdensis',taxon:'Proasellus valdensis',authority:'(Chappuis, 1948)',habitats:['groundwater'],suborder:'Asellota',family:'Asellidae',color:'#cdcbb6',dark:'#73756a',shape:'cave-asellid',speed:.62,evidence:['groundwater-valdensis-key','groundwater-biofilm'],micro:'Obligate groundwater asellid of Jura and pre-Alpine karst waters. Sedimentary biofilm contributes strongly to the diet of the studied populations; separation from P. cavaticus requires fine diagnostic characters.',max:8.5},
 {id:'pulchra',taxon:'Eurydice pulchra',authority:'Leach, 1816',habitats:['sandy-surf'],suborder:'Cymothoida',family:'Cirolanidae',color:'#b8b29c',dark:'#55594f',shape:'eurydice',speed:1.24,evidence:['release-pulchra-bmig','sand-jones-1970','sand-rhythm-1970'],micro:'Mobile medium-to-fine sandy shores; buries as the tide falls and emerges to swim in surf and shallow water as the tide rises.',max:8},
 {id:'affinis',taxon:'Eurydice affinis',authority:'Hansen, 1905',habitats:['sandy-surf'],suborder:'Cymothoida',family:'Cirolanidae',color:'#c2bba5',dark:'#5f6056',shape:'eurydice',speed:1.18,evidence:['release-affinis-bmig','sand-jones-1970'],micro:'Sandy shores, occurring with Eurydice pulchra on south-western British and Welsh coasts.',max:6},
 {id:'spinigera',taxon:'Eurydice spinigera',authority:'Hansen, 1890',habitats:['sandy-surf'],suborder:'Cymothoida',family:'Cirolanidae',color:'#aaa792',dark:'#4b514b',shape:'eurydice-spined',speed:1.28,evidence:['release-spinigera-bmig','release-spinigera-worms'],micro:'Primarily shallow offshore sand, with records from intertidal sand on southern and western shores; reaches about 9 mm.',max:9},
 {id:'cavaticus',taxon:'Proasellus cavaticus',authority:'(Leydig, 1871)',habitats:['groundwater'],suborder:'Asellota',family:'Asellidae',color:'#d1c9ae',dark:'#777262',shape:'cave-asellid',speed:.63,evidence:['release-cavaticus-bmig','groundwater-biofilm'],micro:'Specialist subterranean freshwater isopod of limestone cave streams, pools, seepages, water films and groundwater; lacks eyes and pigmentation.',max:8},
 {id:'lusitanicus',taxon:'Proasellus lusitanicus',authority:'Frade, 1938',habitats:['groundwater'],suborder:'Asellota',family:'Asellidae',color:'#d7cfb7',dark:'#797569',shape:'cave-asellid-long',speed:.68,evidence:['release-lusitanicus-nature'],micro:'Stygobitic asellid from the Estremenho karst aquifer of central Portugal; adults studied from an Almonda Cave stream lack eyes and pigmentation.',range:[4.2,7.2]},
 {id:'virei',taxon:'Stenasellus virei',authority:'Dollfus, 1897',habitats:['groundwater'],suborder:'Asellota',family:'Stenasellidae',color:'#b98f83',dark:'#684f4d',shape:'stenasellid',speed:.72,evidence:['release-virei-ijs','release-virei-persee','groundwater-virei-behaviour'],micro:'Subterranean-water isopod recorded from caves, phreatic waters and river underflow; typical material is elongate and rose-coloured.',max:8}
];

const NOTES={
 valdensis:['它记录于汝拉山与前阿尔卑斯的岩溶地下水；研究显示沉积物生物膜是重要食物来源。','它与 P. cavaticus 的可靠区分依赖细微鉴别特征；这张低分辨率背面图不能替代鉴定。'],
 pulchra:['退潮后它钻入湿沙；涨潮和夜间，身体重新进入浪区与浅水。','细沙一直在移动，埋藏和游泳是同一条潮汐路线的两个阶段。'],
 affinis:['它和 E. pulchra 一样出现在沙岸，但体型更小，背部暗色标记主要集中在上表面。','没有岩缝可守时，沙粒之间的空隙本身就是遮蔽。'],
 spinigera:['它更多出现在浅海沙底，也会在部分海岸的潮间沙地出现。','尾节后缘内凹并带明显棘突，身体在沙面上呈现更尖锐的后端轮廓。'],
 cavaticus:['石灰岩洞穴里的水常只是薄膜、渗流或浅池；它完全生活在这样的地下淡水中。','身体缺少眼和色素，在浅色流石与黑暗水膜之间几乎只剩轮廓。'],
 lusitanicus:['它生活在喀斯特含水层与洞穴溪流里，长附肢在低光环境中越过细小沉积物。','研究个体体长约 4.2–7.2 mm，身体无眼、无色素。'],
 virei:['洞穴、潜水层和河流伏流都可以成为它的地下水通道。','身体细长而近直边，常呈明显玫瑰色，与无色的地下水 Asellidae 形成不同轮廓。']
};

function visualFor(row){
 const v=structuredClone(phenotypeFor('dairy'));
 v.provenance='Evidence-informed aquatic dorsal approximation based on the cited taxon account. Fine taxonomic characters remain documented in the dossier rather than enlarged into the sprite.';
 v.palette={...v.palette,tergite:row.color,cephalon:row.color,epimera:row.color,pleon:row.color,pleotelson:row.color,dark:row.dark,light:'#ded7bc',accentA:'#746c58'};
 v.patterns=[];
 v.conglobation={...v.conglobation,ability:'none',closure:.02,antennaeHidden:false,confidence:'family-proxy'};
 if(row.shape.startsWith('eurydice')){
  v.morphologyKey=row.shape==='eurydice-spined'?'cirolanidSurfSpined':'cirolanidSurf';
  v.body={...v.body,length:1.05,width:.78,convexity:.22};
  v.cephalon={...v.cephalon,shape:'rounded-shield',eyeScale:1.18,eyeSet:.76,confidence:'genus-character'};
  v.antennae={...v.antennae,length:.92,spread:.52,bend:.16,confidence:'genus-character'};
  v.pleon={...v.pleon,length:.17,width:.62,taper:.18};
  v.pleotelson={...v.pleotelson,shape:'elongate',lengthScale:1.55,widthScale:.88,apex:row.shape==='eurydice-spined'?'concave':'rounded',confidence:'species-proxy'};
  v.uropods={...v.uropods,mode:'lateral',projection:.34,width:.18,spread:.24,visibility:1,confidence:'genus-character'};
  v.legs={...v.legs,length:.47,visibility:.96,spread:.38,confidence:'family-proxy'};
  v.patterns=row.id==='affinis'?[{type:'blotch',color:'dark',target:'pereon',opacity:.20}]:[{type:'speckle',color:'dark',target:'body',opacity:.24}];
 }
 if(row.shape==='cave-asellid'||row.shape==='cave-asellid-long'){
  v.morphologyKey=row.shape==='cave-asellid-long'?'asellidStygobiteLong':'asellidStygobite';
  v.body={...v.body,length:row.shape==='cave-asellid-long'?1.34:1.22,width:row.shape==='cave-asellid-long'?.52:.58,convexity:.10};
  v.cephalon={...v.cephalon,shape:'rounded-shield',eyeScale:0,eyeSet:.72,confidence:'species-character'};
  v.antennae={...v.antennae,length:row.shape==='cave-asellid-long'?1.30:1.10,spread:.48,bend:.12,confidence:'stygobite-proxy'};
  v.legs={...v.legs,length:row.shape==='cave-asellid-long'?.58:.50,visibility:.96,spread:.43,confidence:'stygobite-proxy'};
  v.pleon={...v.pleon,length:.14,width:.48,taper:.18};
  v.pleotelson={...v.pleotelson,shape:'compact',lengthScale:1.28,widthScale:.96,apex:'rounded'};
  v.uropods={...v.uropods,mode:'projecting',projection:.72,width:.12,spread:.18,visibility:1,confidence:'family-character'};
 }
 if(row.shape==='stenasellid'){
  v.morphologyKey='stenasellidGroundwater';
  v.body={...v.body,length:1.48,width:.46,convexity:.10};
  v.cephalon={...v.cephalon,shape:'rounded-shield',eyeScale:0,eyeSet:.70,confidence:'family-character'};
  v.antennae={...v.antennae,length:1.28,spread:.46,bend:.10,confidence:'family-character'};
  v.legs={...v.legs,length:.58,visibility:.98,spread:.46,confidence:'family-character'};
  v.pleon={...v.pleon,length:.15,width:.42,taper:.12};
  v.pleotelson={...v.pleotelson,shape:'compact',lengthScale:1.22,widthScale:.88,apex:'rounded'};
  v.uropods={...v.uropods,mode:'projecting',projection:.64,width:.12,spread:.16,visibility:1};
 }
 return v;
}

export const RELEASE_AQUATIC_SPECIES=TAXA.map(row=>({
 id:row.id,name:row.taxon,label:row.taxon,taxon:row.taxon,
 status:'Accepted aquatic species with cited habitat and morphology records.',
 speed:row.speed,wet:94,cover:row.habitats[0]==='groundwater'?78:24,
 game:{habitatEligible:false,referenceOnly:false,habitats:row.habitats},
 names:{zhCN:row.taxon,zhAliases:[],zhNameType:'scientific_name_fallback',zhConfidence:'high',en:row.taxon,enNameType:'scientific_name',ja:row.taxon,jaAliases:[]},
 taxonomy:{kingdom:'Animalia',phylum:'Arthropoda',class:'Malacostraca',order:'Isopoda',suborder:row.suborder,family:row.family,genus:row.taxon.split(' ')[0],species:row.taxon.split(' ')[1],acceptedScientificName:row.taxon,authority:row.authority,referenceTaxon:row.taxon,genusStatus:'accepted',speciesStatus:'accepted_species',identificationConfidence:'literature_supported',evidenceIds:row.evidence},
 evidenceIds:row.evidence,
 evidence:{status:'literature_supported',claims:[{claim:row.micro,url:null}]},
 provenance:{url:null,reviewed:'2026-09-24',habitatBasis:row.micro,renderLimitation:'Dorsal low-resolution approximation; small setal and appendage diagnostics are not individually rendered.'},
 genetics:{knowledge:'unknown',model:null},breeding:{crossCompatibility:'not_applicable'},
 trade:{type:'wild_species',tradeAliases:[],evidenceIds:[]},nomenclature:{taxonomicStatus:'accepted_species',vernacularStatus:'scientific_name_only',lastReviewed:'2026-09-24'},
 biogeography:{nativeRange:null,distributionNotes:'See cited taxon account; habitat pools are ecological selections rather than claims of local sympatry.',evidenceIds:row.evidence},
 profile:{adultLengthMm:null,adultLengthRangeMm:row.range||null,reportedMaximumLengthMm:row.max||null,ecology:row.habitats,microhabitat:[row.micro],behaviour:row.habitats[0]==='sandy-surf'?['burrowing','swimming']:['groundwater crawling'],notableMorphology:[row.family+' dorsal body plan'],diagnosticNotes:['Species-level identification may require characters smaller than the game sprite.'],conglobation:'none',evidenceIds:row.evidence},
 notes:NOTES[row.id],literature:{lines:NOTES[row.id],basis:[{claim:row.micro,evidenceIds:row.evidence}],themes:['habitat','movement','scale']},
 visual:visualFor(row)
}));
