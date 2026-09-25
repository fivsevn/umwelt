import {phenotypeFor} from '../../phenotypes.mjs';
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
 ['neglecta','Idotea neglecta','G. O. Sars, 1897','shallow-marine','Valvifera','Idoteidae','https://www2.habitas.org.uk/marbiop-ni/species.php?item=S15660','Mostly sublittoral among algae, including detached algal material.',30,'#8b7c58'],
 ['giganteus','Bathynomus giganteus','A. Milne-Edwards, 1879','abyssal','Cymothoida','Cirolanidae','https://www.marinespecies.org/imis.php?module=ref&refid=283148','Large deep-sea benthic scavenger; Bathynomus are documented from deep seafloor habitats and B. giganteus has been observed resting and swimming near the bottom.',500,'#747a76']
];
const AQUATIC_NOTES={
 aquaticus:['水把腐叶的边缘泡软，身体从沉木与水草之间经过。我们称这里为“淡水”，它只遇见阻力、遮蔽，以及仍可前进的缝隙。','标本柜要求一个名字，水面却不替任何物种停下来。分类与流动，只在这一页纸上短暂相遇。'],
 meridianus:['水草、石块与沉木把同一片水分成许多尺度。对我们是“环境”，对一具小小的身体，也许只是下一步能否落下。','水草、石块与沉木之间的流速不同，个体会沿着较缓的表面和缝隙移动。'],
 coxalis:['浅水里的沉积物没有整齐的边界。名字是后来写上去的，身体先穿过那些混合的颗粒。','浅水底部的砂、泥与碎屑不断重新排列，个体的路线也随之改变。'],
 serratum:['潮水把石缝交还给海，又暂时收回。这里的边界每天都在移动，而标本框要求它保持不动。','它能够把身体卷起；那一刻，边界仿佛被暂时带回自己身上。至于下一次水线在哪里，没有一枚标本能够回答。'],
 pelagica:['藤壶、贻贝与短藻把岩岸拆成许多可以经过的表面。我们说“暴露”，身体只遇见一次又一次的附着与空隙。','标本针固定了方向；活着的时候，方向从来不是标本的一部分。'],
 granulosa:['藻叶随着水摆动，栖身其间的身体也被带进同一阵水流。画面可以留下轮廓，却不能把海的推力一起装进框里。','我们用颜色与背形记住它；它并不需要被记住，仍会在藻间继续。'],
 balthica:['藻场看起来像背景，直到一具身体把海藻同时当作食物与经过之处。人的记录喜欢把功能分开，水下没有表格。','当它离开这一片藻叶，位置改变了；“标本”这个词却要求它永远停在某处。'],
 emarginata:['脱落的藻体漂到一起，形成一种没有地基的栖身之处。我们仍习惯问“它住在哪里”，仿佛地点必须固定。','一片藻叶离开岩石之后仍然可以成为环境；有时，漂移只是另一种栖居方式。'],
 neglecta:['藻丛中的空隙会随着水流改变。看似相同的两秒钟，对毫米尺度的身体并不是同一个地方。','它多在水下藻丛和脱落藻体之间活动，遮蔽本身也会随着水流移动。'],
 giganteus:['两次移动之间隔了很久。','第一处和第二处都被记下，中间的部分却只留下了一段时间。']
};
export const AQUATIC_SOURCES=AQUATIC_TAXA.map(([id,name,,,,,url])=>({id:'aquatic-'+id,level:'A2',type:'TAXONOMY / ECOLOGY / MORPHOLOGY',title:name+' — habitat and identification account',url,supports:[id+'.taxonomy',id+'.habitat',id+'.morphology']}));
function visualFor(id,family,color){
 const v=structuredClone(phenotypeFor(family==='Sphaeromatidae'?'orange':'dairy'));
 const asellid=family==='Asellidae',round=family==='Sphaeromatidae',giant=id==='giganteus';
 if(giant){
  // Bathynomus gets a dedicated dorsal silhouette instead of a scaled terrestrial woodlouse.
  // Reference emphasis: broad low oval body; seven overlapping pereonites with wide coxal
  // plates; compact cephalon with large lateral eyes; two antennal pairs; seven pereopod
  // pairs; short pleon; broad serrate pleotelson with plate-like lateral uropods.
  v.morphologyKey='cirolanidAbyssal';
  v.provenance='Bathynomus giganteus dorsal reconstruction informed by NOAA/WoRMS in-situ imagery and general isopod anatomy. Pixel art prioritizes the broad overlapping pereon, lateral eyes, seven walking-leg pairs, two antennal pairs, and wide serrate pleotelson; fine diagnostic spination is simplified.';
  v.body={...v.body,length:1.22,width:1.00,convexity:.16,projection:{middle:.72,frontRoundness:.86,rearRoundness:.82},anteriorTaper:.10,posteriorTaper:.12,pleonTaper:.08};
  v.cephalon={...v.cephalon,shape:'rounded-shield',width:.84,length:.70,embedding:.46,medianProjection:0,lateralProjection:.05,scutellum:'none',eyeSet:.76,eyeScale:1.45,roundness:.72,confidence:'family-proxy'};
  v.pereon={...v.pereon,plateArc:.12,overlap:.24,seamStrength:.58,heightProfile:[.80,.93,1,1,.98,.91,.78],epimera:{...v.pereon.epimera,lobe:'shield',skirt:.76,flare:.18,angle:.05,roundness:.20,tip:'broad-posterior',width:1.08,widthScale:1.10,posteriorProjection:.16,posteriorProjectionFrom:4}};
  v.pleon={...v.pleon,length:.24,width:.78,taper:.08,segmentContrast:.34};
  v.pleotelson={...v.pleotelson,shape:'fan-rounded',apex:'serrate-rounded',length:.30,width:.72,lengthScale:1.40,widthScale:1.60,serrations:7,confidence:'family-proxy'};
  v.uropods={...v.uropods,mode:'fan-lateral',projection:.12,width:.42,spread:.22,thickness:.42,visibility:1,confidence:'family-proxy'};
  v.antennae={...v.antennae,length:.82,spread:.34,bend:.08,joints:[.45,.34,.21],thickness:.18,secondaryPair:true,confidence:'order-character'};
  v.legs={...v.legs,length:.58,visibility:.96,spread:.38,stepScale:.88,thickness:1.15,confidence:'order-character'};
  v.surface={...v.surface,sculpture:'smooth',scaleSetae:'none',intensity:.04};
  v.conglobation={...v.conglobation,ability:'none',closure:0,antennaeHidden:false,strategy:'benthic-walker',confidence:'family-proxy'};
  v.palette={tergite:'#66747b',cephalon:'#627078',epimera:'#596970',pleon:'#5f6e75',pleotelson:'#65747c',uropods:'#596970',antennae:'#718087',legs:'#53636a',dark:'#2d3a40',light:'#89989e',accentA:'#76858b',accentB:'#4b5a61'};
  v.patterns=[];
  return v;
 }
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
 id,name:taxon,label:taxon,taxon,status:'Accepted aquatic species; evidence-informed render approximation.',speed:.8,wet:85,cover:65,
 game:{habitatEligible:false,referenceOnly:false,habitats:[habitat]},
 names:{zhCN:id==='giganteus'?'大王具足虫':taxon,zhAliases:id==='giganteus'?['巨型深海等足类']:[],zhNameType:id==='giganteus'?'vernacular':'scientific_name_fallback',zhConfidence:'high',en:id==='giganteus'?'Giant isopod':taxon,enNameType:id==='giganteus'?'vernacular':'scientific_name',ja:id==='giganteus'?'ダイオウグソクムシ':taxon,jaAliases:[]},
 taxonomy:{kingdom:'Animalia',phylum:'Arthropoda',class:'Malacostraca',order:'Isopoda',suborder,family,genus:taxon.split(' ')[0],species:taxon.split(' ')[1],acceptedScientificName:taxon,authority,referenceTaxon:taxon,genusStatus:'accepted',speciesStatus:'accepted_species',identificationConfidence:'literature_supported',evidenceIds:['aquatic-'+id]},
 evidenceIds:['aquatic-'+id,...(id==='granulosa'?['intertidal-bmig-granulosa','intertidal-naturalis-granulosa']:[])],evidence:{status:'literature_supported',claims:[{claim:microhabitat,url},...(id==='granulosa'?[{claim:'Occurs under intertidal stones and amongst seaweed.',url:'https://bmig.org.uk/species/idotea-granulosa'},{claim:'May occur free swimming between tidemarks; animation trajectories and speeds are authored.',url:'https://ns-zooplankton.linnaeus.naturalis.nl/linnaeus_ng/app/views/species/taxon.php?id=132141'}]:[])]},
 provenance:{url,reviewed:'2026-09-22',habitatBasis:microhabitat,renderLimitation:'Family dorsal approximation; not an identification key. Adult maximum lengths are not typical individual measurements.'},
 genetics:{knowledge:'unknown',model:null},breeding:{crossCompatibility:'not_applicable'},
 trade:{type:'wild_species',tradeAliases:[],evidenceIds:[]},nomenclature:{taxonomicStatus:'accepted_species',vernacularStatus:'scientific_name_only',lastReviewed:'2026-09-22'},
 biogeography:{nativeRange:null,distributionNotes:'See linked regional species account; the pool does not assert a shared geographic locality.',evidenceIds:['aquatic-'+id]},
 profile:{adultLengthMm:null,adultLengthRangeMm:null,reportedMaximumLengthMm:maxLength,ecology:[habitat],microhabitat:[microhabitat],behaviour:['aquatic locomotion'],notableMorphology:[family+' dorsal body plan'],diagnosticNotes:['Approximate family silhouette; microscopic and sexual diagnostics omitted.'],conglobation:family==='Sphaeromatidae'?'full':'none',evidenceIds:['aquatic-'+id]},
 notes:AQUATIC_NOTES[id]||[taxon],literature:{lines:AQUATIC_NOTES[id]||[taxon],basis:[{claim:microhabitat,evidenceIds:['aquatic-'+id]}],themes:['water','observation']},visual:visualFor(id,family,color)
}));
