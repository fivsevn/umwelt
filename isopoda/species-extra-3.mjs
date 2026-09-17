import {phenotypeFor} from './phenotypes.mjs?v=cohort-4';

// Third accepted-species batch. Morphology and natural-history fields are evidence-backed where cited;
// exact 64 px coefficients, palette choices and game tuning remain render/game proxies.
const taxonomy=(family,genus,species,authority)=>({kingdom:'Animalia',phylum:'Arthropoda',class:'Malacostraca',order:'Isopoda',suborder:'Oniscidea',family,genus,species,acceptedScientificName:`${genus} ${species}`,authority,referenceTaxon:`${genus} ${species}`,genusStatus:'accepted',speciesStatus:'accepted_species',identificationQualifier:null,identificationConfidence:'high',evidenceIds:[]});
const trade=(aliases=[])=>({designation:null,tradeName:null,type:'wild_species',morph:null,locality:null,lineage:null,tradeAliases:aliases,evidenceIds:[]});
const names=(zh,en,type='project_translation',confidence='medium')=>({zhCN:zh,zhAliases:[],zhNameType:type,zhConfidence:confidence,en,enNameType:'vernacular',ja:null,jaAliases:[]});
const common=(id,name,label,taxon,status,speed,wet,cover,evidenceIds)=>({id,name,label,taxon,status,speed,wet,cover,evidenceIds,evidence:{status:'literature_supported',claims:[]},genetics:{knowledge:'unknown',model:null},breeding:{crossCompatibility:'unknown'},nomenclature:{taxonomicStatus:'accepted_species',tradeStatus:null,vernacularStatus:'project_translation',lastReviewed:'2026-09-17',provenance:'specialist identification literature + taxonomic database'}});

function vulgareVisual(){
 const v=structuredClone(phenotypeFor('orange'));
 v.provenance='RENDER: Armadillidium scaffold with species-level frontal-lamina character from Shultz 2018; neutral slate colour is a conservative wild-type proxy.';
 v.morphologyKey='armadillidiumVulgare';
 v.body.length=.98;v.body.width=.88;v.body.convexity=.80;
 v.cephalon={...v.cephalon,template:'armadillidium-vulgare-head',medianProjection:.20,lateralLobes:.38,lateralProjection:.14,scutellum:'triangular',confidence:'species-character'};
 v.palette={...v.palette,tergite:'#5e625e',cephalon:'#595d59',epimera:'#737771',pleon:'#5b5f5b',pleotelson:'#595d59',uropods:'#686d67',dark:'#343834',light:'#8e938b'};
 v.patterns=[];
 return v;
}
function asellusVisual(){
 const v=structuredClone(phenotypeFor('dairy'));
 v.provenance='RENDER: Oniscus asellus uses specialist field characters: broad depressed smooth adult body, continuous outline and three-segment antennal flagellum. Tail proportions are conservative Oniscidae render proxies.';
 v.morphologyKey='oniscusAsellus';
 v.body.length=1.00;v.body.width=.94;v.body.convexity=.18;
 v.cephalon={...v.cephalon,template:'oniscus-broad-head',shape:'trilobed-broad',medianProjection:.18,lateralLobes:.64,lateralProjection:.36,scutellum:'none',confidence:'family-species-proxy'};
 v.antennae={...v.antennae,length:.88,spread:.58,bend:.18,joints:[.40,.31,.29],flagellumArticles:3,confidence:'species-character'};
 v.pereon={...v.pereon,plateArc:.22,epimera:{...v.pereon.epimera,lobe:'rounded',skirt:.42,flare:.12,roundness:.24,width:1.04},confidence:'species-render-proxy'};
 v.pleon={...v.pleon,width:.60,taper:.20};
 v.uropods={...v.uropods,projection:.55,width:.23,spread:.20,thickness:.18,visibility:.92};
 v.surface={...v.surface,template:'oniscus-smooth-adult',sculpture:'smooth',scaleSetae:'fine',intensity:.08,confidence:'species-character'};
 v.palette={...v.palette,tergite:'#77756b',cephalon:'#6c6a61',epimera:'#8b887b',pleon:'#737168',pleotelson:'#6b6a62',uropods:'#807d72',dark:'#45453f',light:'#a7a18f'};
 v.patterns=[];v.conglobation={...v.conglobation,ability:'none',closure:.08,antennaeHidden:false,strategy:'non-conglobating',confidence:'family-character'};
 return v;
}
function muscorumVisual(){
 const v=structuredClone(phenotypeFor('dairy'));
 v.provenance='RENDER: Philoscia muscorum species account supports slim stepped outline, long legs, three-segment flagellum, dark head and median dorsal stripe; exact proportions are 64 px proxies.';
 v.morphologyKey='philosciaMuscorum';
 v.body.length=.90;v.body.width=.62;v.body.convexity=.20;
 v.cephalon={...v.cephalon,template:'philoscia-dark-head',shape:'rounded-shield',medianProjection:.04,lateralLobes:.18,lateralProjection:.06,scutellum:'none',confidence:'genus-proxy'};
 v.antennae={...v.antennae,length:1.08,spread:.68,bend:.10,joints:[.38,.32,.30],flagellumArticles:3,confidence:'species-character'};
 v.pereon={...v.pereon,plateArc:.24,epimera:{...v.pereon.epimera,lobe:'rounded',skirt:.28,flare:.08,roundness:.20,width:.86},confidence:'species-render-proxy'};
 v.pleon={...v.pleon,width:.34,taper:.54};
 v.legs={...v.legs,length:.64,visibility:.94,spread:.48,stepScale:1.28,confidence:'species-eco-morph'};
 v.uropods={...v.uropods,projection:.62,width:.18,spread:.24,thickness:.14,visibility:.96};
 v.surface={...v.surface,template:'philoscia-smooth',sculpture:'smooth',scaleSetae:'fine',intensity:.06,confidence:'species-proxy'};
 v.palette={...v.palette,tergite:'#806d4f',cephalon:'#292b27',epimera:'#9a835e',pleon:'#6f6048',pleotelson:'#5f5544',uropods:'#79694f',dark:'#2b2d29',light:'#c0a878'};
 v.patterns=[{type:'dorsalStripe',color:'dark',target:'pereon',width:.15},{type:'lateralStripe',color:'light',target:'pereon'}];
 v.conglobation={...v.conglobation,ability:'none',closure:.05,antennaeHidden:false,strategy:'runner',confidence:'species-eco-morph'};
 return v;
}
function rathkiiVisual(){
 const v=structuredClone(phenotypeFor('dairy'));
 v.provenance='RENDER: Trachelipus rathkii accounts support a large slate-grey body, pale longitudinal markings, two-segment flagellum and weak tergal tubercles; exact stripe widths are readability proxies.';
 v.morphologyKey='trachelipusRathkii';
 v.body.length=1.02;v.body.width=.80;v.body.convexity=.30;
 v.cephalon={...v.cephalon,template:'trachelipus-short-median-lobe',medianProjection:.18,lateralLobes:.56,lateralProjection:.34,scutellum:'none',confidence:'species-proxy'};
 v.antennae={...v.antennae,length:.96,spread:.58,bend:.20,joints:[.46,.33,.21],flagellumArticles:2,confidence:'species-character'};
 v.pereon={...v.pereon,plateArc:.34,epimera:{...v.pereon.epimera,lobe:'rounded',skirt:.38,flare:.10,roundness:.24,width:.96},confidence:'species-proxy'};
 v.surface={...v.surface,template:'trachelipus-weak-tubercles',sculpture:'tuberculate',scaleSetae:'fine',intensity:.26,tubercleSpacing:5,confidence:'species-character'};
 v.uropods={...v.uropods,projection:.66,width:.20,spread:.22,thickness:.16,visibility:.95};
 v.palette={...v.palette,tergite:'#59605d',cephalon:'#535a57',epimera:'#757b73',pleon:'#555c59',pleotelson:'#505754',uropods:'#69706a',dark:'#303632',light:'#b5b99f',accentA:'#d28a55'};
 v.patterns=[{type:'dorsalStripe',color:'dark',target:'pereon',width:.12},{type:'lateralStripe',color:'light',target:'pereon'}];
 v.conglobation={...v.conglobation,ability:'none',closure:.08,antennaeHidden:false,strategy:'non-conglobating',confidence:'family-proxy'};
 return v;
}
function reaumuriVisual(){
 const v=structuredClone(phenotypeFor('dairy'));
 v.provenance='RENDER: Hemilepistus reaumuri uses literature-backed anterior tuberculation and exposed high-walking silhouette; exact dorsal proportions and colour are conservative proxies.';
 v.morphologyKey='hemilepistusDesert';
 v.body.length=1.10;v.body.width=.82;v.body.convexity=.34;
 v.cephalon={...v.cephalon,template:'hemilepistus-armoured-front',shape:'trilobed-broad',medianProjection:.20,lateralLobes:.48,lateralProjection:.28,scutellum:'none',confidence:'genus-proxy'};
 v.antennae={...v.antennae,length:1.02,spread:.62,bend:.16,joints:[.45,.33,.22],flagellumArticles:2,confidence:'family-proxy'};
 v.pereon={...v.pereon,plateArc:.38,epimera:{...v.pereon.epimera,lobe:'rounded',skirt:.32,flare:.08,roundness:.20,width:.90},confidence:'species-render-proxy'};
 v.surface={...v.surface,template:'hemilepistus-anterior-tubercles',sculpture:'tuberculate',scaleSetae:'fine',intensity:.88,tubercleSpacing:3,anteriorThrough:4,confidence:'species-character'};
 v.legs={...v.legs,length:.62,visibility:.94,spread:.48,stepScale:1.16,confidence:'species-eco-morph'};
 v.uropods={...v.uropods,projection:.48,width:.22,spread:.18,thickness:.18,visibility:.90};
 v.palette={...v.palette,tergite:'#6b6b61',cephalon:'#65665e',epimera:'#77776b',pleon:'#62635b',pleotelson:'#5d5e57',uropods:'#6a6b62',dark:'#393b37',light:'#99998a'};
 v.patterns=[];
 v.conglobation={...v.conglobation,ability:'none',closure:.06,antennaeHidden:false,strategy:'burrow-guarding non-conglobator',confidence:'species-character'};
 return v;
}

const vulgare={...common('vulgare','普通卷甲','Common Pill Woodlouse','Armadillidium vulgare','正式种名；大型常见 Armadillidium，可完整卷球，额盾中央为宽三角突起，野生型常见石板灰但体色变化较大。',.76,61,57,['bmig-vulgare','shultz-vulgare-2018']),names:names('普通卷甲','Common Pill Woodlouse'),taxonomy:taxonomy('Armadillidiidae','Armadillidium','vulgare','(Latreille, 1804)'),trade:trade(),biogeography:{originCountry:null,originRegion:'Europe',locality:null,nativeRange:'Europe',distributionNotes:'Widely established beyond its native European range; the project does not infer locality from cosmopolitan records.',confidence:'literature_supported',evidenceIds:['bmig-vulgare','shultz-vulgare-2018']},profile:{adultLengthMm:18,adultLengthRangeMm:null,ecology:['terrestrial detritivore'],microhabitat:['under stones','dead wood','grass litter'],behaviour:['full conglobation'],notableMorphology:['宽三角形额盾投影覆盖头部前缘；尾肢短而与后端轮廓近乎齐平；可将触角收起并完整卷球。'],diagnosticNotes:['体色高度可变，因此默认 renderer 采用中性的石板灰野生型，不把某个培养色型当作物种诊断。'],conglobation:'full',careDataStatus:'not_in_scope',evidenceIds:['bmig-vulgare','shultz-vulgare-2018']},literature:{lines:['最普通的卷球者仍然有自己的头部轮廓。','常见只说明你更容易遇见它，不说明它更简单。'],basis:[{claim:'可完整卷球、宽三角额盾、体长可达约 18 mm。',evidenceIds:['bmig-vulgare','shultz-vulgare-2018']}],themes:['commonness','recognition']},visual:vulgareVisual()};

const asellus={...common('asellus','光亮鼠妇','Common Shiny Woodlouse','Oniscus asellus','正式种名；成体宽而低平、背面光滑，身体轮廓连续，第二触角鞭部有三节。',.72,72,66,['bmig-oniscus-asellus']),names:names('光亮鼠妇','Common Shiny Woodlouse'),taxonomy:taxonomy('Oniscidae','Oniscus','asellus','Linnaeus, 1758'),trade:trade(),biogeography:{originCountry:null,originRegion:'Europe',locality:null,nativeRange:'Europe',distributionNotes:'Common across Britain and Ireland and broadly distributed in Europe; introduced populations occur elsewhere.',confidence:'literature_supported',evidenceIds:['bmig-oniscus-asellus']},profile:{adultLengthMm:18,adultLengthRangeMm:null,ecology:['terrestrial detritivore'],microhabitat:['damp woodland','dead wood','stones','leaf litter','compost'],behaviour:['non-conglobating'],notableMorphology:['成体背部光滑；身体宽、扁平；胸部与腹部外缘较连续；第二触角鞭部三节。'],diagnosticNotes:['幼体可明显比成体粗糙并带橙色图案；默认 sprite 表现成年形态。'],conglobation:'none',careDataStatus:'not_in_scope',evidenceIds:['bmig-oniscus-asellus']},literature:{lines:['光滑和宽扁让它看起来像一片会移动的旧金属。','幼体与成体并不共享同一种第一印象。'],basis:[{claim:'成年体可达 18 mm，宽扁、背面光滑、三节鞭部。',evidenceIds:['bmig-oniscus-asellus']}],themes:['life stage','surface']},visual:asellusVisual()};

const muscorum={...common('muscorum','条纹鼠妇','Striped Woodlouse','Philoscia muscorum','正式种名；8–11 mm 的细长 runner，胸腹外缘呈阶梯状，腿长、移动快，头部通常较暗并有中央深色纵带。',1.10,70,48,['bmig-philoscia-muscorum','saska-philoscia-2007']),names:names('条纹鼠妇','Striped Woodlouse'),taxonomy:taxonomy('Philosciidae','Philoscia','muscorum','(Scopoli, 1763)'),trade:trade(),biogeography:{originCountry:null,originRegion:'Atlantic and western/central Europe',locality:null,nativeRange:'Atlantic and western/central Europe',distributionNotes:'Published records describe a broad Atlantic-European range and introduced populations in North America.',confidence:'literature_supported',evidenceIds:['saska-philoscia-2007']},profile:{adultLengthMm:null,adultLengthRangeMm:[8,11],ecology:['terrestrial detritivore'],microhabitat:['moist woodland','grassland','road verges','field margins'],behaviour:['rapid runner'],notableMorphology:['体形细长；腹部明显窄于胸部形成阶梯状外缘；腿较长；第二触角鞭部三节；头部常明显深于身体，中央有深色纵带。'],diagnosticNotes:['体色可从黄、红到深褐变化；默认 renderer 强调深头、中央纵带和 runner 轮廓而非固定色型。'],conglobation:'none',careDataStatus:'not_in_scope',evidenceIds:['bmig-philoscia-muscorum','saska-philoscia-2007']},literature:{lines:['腹部突然收窄，像轮廓里出现了一个台阶。','它跑得很快，辨认反而需要你先停下来。'],basis:[{claim:'8–11 mm、细长长腿、快速运动、三节触角鞭部、阶梯状轮廓。',evidenceIds:['saska-philoscia-2007']}],themes:['speed','outline']},visual:muscorumVisual()};

const rathkii={...common('rathkii','拉氏鼠妇','Rathke’s Woodlouse','Trachelipus rathkii','正式种名；大型灰色 Trachelipus，常呈三条浅色纵向印象，触角鞭部两节，背板结节较弱。',.82,74,61,['bmig-trachelipus-rathkii','belarus-trachelipus-2019']),names:names('拉氏鼠妇','Rathke’s Woodlouse','taxon_transliteration','medium'),taxonomy:taxonomy('Trachelipodidae','Trachelipus','rathkii','(Brandt, 1833)'),trade:trade(),biogeography:{originCountry:null,originRegion:'Europe',locality:null,nativeRange:'Europe outside the Mediterranean core',distributionNotes:'Widespread in Europe and introduced in North America; specialist accounts associate it with damp, poorly drained and floodplain habitats.',confidence:'literature_supported',evidenceIds:['bmig-trachelipus-rathkii','belarus-trachelipus-2019']},profile:{adultLengthMm:15,adultLengthRangeMm:[12,15],ecology:['terrestrial detritivore'],microhabitat:['floodplains','riverside meadows','under stones','dead wood'],behaviour:['non-conglobating'],notableMorphology:['常见石板灰底，浅色斑块纵向连成三条细带的印象；第二触角鞭部两节；背板结节较弱。'],diagnosticNotes:['五对 pleopodal lungs 是重要鉴别特征，但属于腹面结构，不在 64 px 背视图中绘制。'],conglobation:'none',careDataStatus:'not_in_scope',evidenceIds:['bmig-trachelipus-rathkii','belarus-trachelipus-2019']},literature:{lines:['三条浅带让它看起来比实际更规整。','真正可靠的鉴别点有一些藏在你当前看不到的腹面。'],basis:[{claim:'12–15 mm、灰色纵纹、两节鞭部与弱背板结节。',evidenceIds:['belarus-trachelipus-2019']}],themes:['visible and hidden characters','pattern']},visual:rathkiiVisual()};

const reaumuri={...common('reaumuri','雷欧米尔沙漠鼠妇','Réaumur’s Desert Woodlouse','Hemilepistus reaumuri','正式种名；高度适应干旱环境的穴居型鼠妇，头部和前四胸节具有显著大结节，不能完整卷球，并以家庭单位守护洞穴。',.96,48,72,['itis-hemilepistus-reaumuri','ernst-hemilepistus-2020','ayari-hemilepistus-2016']),names:names('雷欧米尔沙漠鼠妇','Réaumur’s Desert Woodlouse'),taxonomy:taxonomy('Agnaridae','Hemilepistus','reaumuri','(Audouin, 1826)'),trade:trade(),biogeography:{originCountry:null,originRegion:'North Africa and Middle East',locality:null,nativeRange:'Arid North Africa and western Asia',distributionNotes:'The species inhabits arid and semi-arid desert systems and relies on deep burrows that buffer heat and humidity.',confidence:'literature_supported',evidenceIds:['itis-hemilepistus-reaumuri','ernst-hemilepistus-2020','ayari-hemilepistus-2016']},profile:{adultLengthMm:null,adultLengthRangeMm:null,ecology:['xeric desert detritivore','burrow dwelling'],microhabitat:['deep family burrows','loess and semi-arid soils'],behaviour:['subsocial family units','burrow guarding','non-conglobating'],notableMorphology:['头胸部和前四个胸节的后部带有大型明显结节；前段背甲承受守洞和掘穴时的机械负荷；步足暴露度较高。'],diagnosticNotes:['文献中 reaumuri / reaumurii 及作者归属存在历史用法差异；本项目按 ITIS 当前 valid name Hemilepistus reaumuri (Audouin, 1826) 建档。'],conglobation:'none',careDataStatus:'not_in_scope',evidenceIds:['itis-hemilepistus-reaumuri','ernst-hemilepistus-2020','ayari-hemilepistus-2016']},literature:{lines:['前半身的结节不是装饰，它们属于一套守洞的力学。','一个家庭把洞口变成边界，也把身体变成门。'],basis:[{claim:'前四胸节具有大型结节，前部背甲与守洞/掘穴机械负荷相关。',evidenceIds:['ernst-hemilepistus-2020']},{claim:'形成稳定家庭单位并依靠深洞穴生活。',evidenceIds:['ayari-hemilepistus-2016']}],themes:['architecture','family','desert']},visual:reaumuriVisual()};

export const EXTRA_SPECIES_3=[vulgare,asellus,muscorum,rathkii,reaumuri];
