import {phenotypeFor} from './phenotypes.mjs?v=cohort-4';

// Second accepted-species batch. Literature-backed fields describe taxonomy, distribution and
// visible morphology only; speed / wet / cover and exact pixel coefficients remain GAME / RENDER proxies.
const commonTaxonomy=(family,genus,species,acceptedScientificName,authority)=>({
 kingdom:'Animalia',phylum:'Arthropoda',class:'Malacostraca',order:'Isopoda',suborder:'Oniscidea',family,genus,species,
 acceptedScientificName,authority,referenceTaxon:acceptedScientificName,genusStatus:'accepted',speciesStatus:'accepted_species',identificationQualifier:null,identificationConfidence:'high',evidenceIds:[]
});
const wildTrade=(aliases=[])=>({designation:null,tradeName:null,type:'wild_species',morph:null,locality:null,lineage:null,tradeAliases:aliases,evidenceIds:[]});
const genetics={knowledge:'unknown',model:null},breeding={crossCompatibility:'unknown'};

function nasatumVisual(){
 const v=structuredClone(phenotypeFor('orange'));
 v.provenance='RENDER: Armadillidium scaffold with species-level frontal-lamina and pleotelson characters from Shultz 2018; colour is conservative render tuning.';
 v.morphologyKey='armadillidiumNasatum';
 v.body.length=.96;v.body.width=.85;v.body.convexity=.76;
 v.cephalon={...v.cephalon,template:'armadillidium-nasatum-head',medianProjection:.58,lateralLobes:.36,lateralProjection:.14,scutellum:'prominent-forward',confidence:'species-character'};
 v.pleotelson={...v.pleotelson,template:'armadillidium-nasatum-tail',shape:'triangular-broad',apex:'rounded-point',lengthScale:.96,widthScale:.98,confidence:'species-character'};
 v.palette={...v.palette,tergite:'#67645a',cephalon:'#625f56',epimera:'#777264',pleon:'#615f57',dark:'#343630',light:'#aaa58f'};
 v.patterns=[];
 return v;
}
function granulatumVisual(){
 const v=structuredClone(phenotypeFor('orange'));
 v.provenance='RENDER: Armadillidium genus scaffold; strong dorsal granulation is species-level evidence, while exact colour and granule spacing are 64 px proxies.';
 v.morphologyKey='armadillidiumGranulatum';
 v.body.length=1.03;v.body.width=.91;v.body.convexity=.78;
 v.surface={...v.surface,template:'armadillidium-granulatum-rough',sculpture:'tuberculate',scaleSetae:'fine',intensity:.82,tubercleSpacing:3,confidence:'species-character'};
 v.palette={...v.palette,tergite:'#655d50',cephalon:'#5e574d',epimera:'#827764',pleon:'#625b51',dark:'#33312c',light:'#b8aa8a'};
 v.patterns=[];
 return v;
}
function expansusVisual(){
 const v=structuredClone(phenotypeFor('dairy'));
 v.provenance='RENDER: Porcellio genus scaffold with broad, flattened body emphasis and the documented high-contrast odd-tergite colour pattern; exact pixel ratios are render proxies.';
 v.morphologyKey='porcellioExpansus';
 v.body.length=1.18;v.body.width=.98;v.body.convexity=.22;
 v.pereon={...v.pereon,plateArc:.27,epimera:{...v.pereon.epimera,lobe:'shield',skirt:.74,flare:.23,roundness:.18,tip:'broad',width:1.02,widthScale:1.08},confidence:'species-render-proxy'};
 v.antennae={...v.antennae,length:.98,spread:.60,bend:.16};
 v.legs={...v.legs,length:.52,visibility:.82,spread:.39};
 v.uropods={...v.uropods,projection:.96,width:.22,spread:.25,thickness:.17,visibility:1};
 v.palette={...v.palette,tergite:'#272a27',cephalon:'#30332f',epimera:'#d6b75d',pleon:'#252825',pleotelson:'#252825',uropods:'#bda75f',dark:'#171a17',light:'#ece1b8'};
 v.patterns=[{type:'pairedSpot',color:'light',target:'pereon',segments:[1,3,5,7],offset:.48,radius:1.7},{type:'epimeraRim',color:'accentA',target:'epimera'}];
 v.palette.accentA='#d6b75d';
 return v;
}
function haasiVisual(){
 const v=structuredClone(phenotypeFor('dairy'));
 v.provenance='RENDER: Porcellio genus scaffold with literature-backed paired yellow dorsal markings and yellow peripheral band; elongated male uropods are not rendered at full sex-specific extent.';
 v.morphologyKey='porcellioHaasi';
 v.body.length=1.20;v.body.width=.80;v.body.convexity=.27;
 v.cephalon={...v.cephalon,template:'porcellio-haasi-head-proxy',medianProjection:.38,lateralLobes:.60,lateralProjection:.50,confidence:'species-proxy'};
 v.antennae={...v.antennae,length:1.03,spread:.62,bend:.14};
 v.legs={...v.legs,length:.53,visibility:.84,spread:.39};
 v.uropods={...v.uropods,projection:.88,width:.20,spread:.25,thickness:.16,visibility:1,confidence:'sex-conservative-render'};
 v.palette={...v.palette,tergite:'#4b4232',cephalon:'#494132',epimera:'#d4b54b',pleon:'#4a4234',dark:'#292821',light:'#e7c85b'};
 v.patterns=[{type:'pairedSpot',color:'light',target:'pereon',segments:[1,2,3,4,5,6,7],offset:.45,radius:1.55},{type:'epimeraRim',color:'light',target:'epimera'}];
 return v;
}
function officinalisVisual(){
 const v=structuredClone(phenotypeFor('ducky'));
 v.provenance='RENDER: conservative Armadillidae family scaffold for the formally described genus Armadillo; slate-grey colour and larger body are evidence-backed, exact head/tail proportions remain family-level proxies.';
 v.morphologyKey='armadillidHobby';
 v.body.length=1.08;v.body.width=.94;v.body.convexity=.84;
 v.palette={...v.palette,tergite:'#565b58',cephalon:'#515653',epimera:'#656b66',pleon:'#535855',pleotelson:'#505552',uropods:'#5e645f',dark:'#303431',light:'#8a9089'};
 v.patterns=[];
 v.conglobation={...v.conglobation,ability:'full',closure:.95,antennaeHidden:true,strategy:'roller',confidence:'family-plus-behaviour-evidence'};
 return v;
}

export const EXTRA_SPECIES_2=[
 {
  id:'nasatum',name:'长鼻卷甲',label:'Nosy Pill Woodlouse',taxon:'Armadillidium nasatum',status:'正式种名；最醒目的鉴别点是向前上方突出的额盾，以及较三角、末端圆至略尖的尾节。',
  speed:.80,wet:66,cover:58,
  notes:['额前的小突起先越过叶缘，随后整个身体才进入光里。','它卷起时，原本很显眼的“鼻子”也被收进了球形轮廓。','你盯着头部看了很久。它用触角看了另一边。'],
  names:{zhCN:'长鼻卷甲',zhAliases:[],zhNameType:'project_translation',zhConfidence:'medium',en:'Nosy Pill Woodlouse',enNameType:'vernacular',ja:'ハナダカダンゴムシ',jaAliases:[]},
  taxonomy:commonTaxonomy('Armadillidiidae','Armadillidium','nasatum','Armadillidium nasatum','Budde-Lund, 1885'),trade:wildTrade(),
  biogeography:{originCountry:null,originRegion:null,locality:null,nativeRange:null,distributionNotes:'GBIF and regional records document a broad introduced distribution outside its original European range; this entry does not infer a precise native range.',confidence:'literature_supported',evidenceIds:['gbif-nasatum','shultz-nasatum-2018']},
  profile:{adultLengthMm:null,adultLengthRangeMm:null,ecology:['terrestrial detritivore'],microhabitat:['litter','under stones and objects'],behaviour:['full conglobation'],notableMorphology:['额盾中央突起向背前方伸出，不覆盖头背前缘；尾节近三角形，后端圆至略尖；可完整卷球并隐藏触角。'],diagnosticNotes:['64 px sprite 只强化额盾前突与尾节轮廓，不模拟更细的头部鉴定结构。'],conglobation:'full',careDataStatus:'not_in_scope',evidenceIds:['shultz-nasatum-2018']},
  nomenclature:{taxonomicStatus:'accepted_species',tradeStatus:null,vernacularStatus:'project_translation',lastReviewed:'2026-09-17',provenance:'GBIF + Shultz 2018'},
  literature:{lines:['最容易被你记住的是头前那一点突出。','一个特征足以帮助辨认，却从来不是整个动物。'],basis:[{claim:'额盾前突、近三角尾节与完整卷球能力。',evidenceIds:['shultz-nasatum-2018']}],themes:['diagnosis','part and whole']},
  evidenceIds:['gbif-nasatum','shultz-nasatum-2018'],evidence:{status:'literature_supported',claims:[]},genetics:{...genetics},breeding:{...breeding},visual:nasatumVisual()
 },
 {
  id:'granulatum',name:'颗粒卷甲',label:'Granulated Pill Woodlouse',taxon:'Armadillidium granulatum',status:'正式种名；背部强烈颗粒化是该种最稳定、最适合 64 px renderer 表现的外部特征之一。',
  speed:.76,wet:63,cover:57,
  notes:['侧光把背甲上的颗粒一粒一粒推出来，阴影比颜色更先被看见。','它经过平滑石面时，粗糙背甲反而显得更明显。','你把“颗粒”写进名字，像把触感塞进了一行文字。'],
  names:{zhCN:'颗粒卷甲',zhAliases:[],zhNameType:'project_translation',zhConfidence:'medium',en:'Granulated Pill Woodlouse',enNameType:'vernacular',ja:null,jaAliases:[]},
  taxonomy:commonTaxonomy('Armadillidiidae','Armadillidium','granulatum','Armadillidium granulatum','Brandt, 1833'),trade:wildTrade(['Orange']),
  biogeography:{originCountry:null,originRegion:'Mediterranean and adjacent Atlantic / Black Sea coasts',locality:null,nativeRange:'Atlantic coast of Brittany and Portugal; Mediterranean coasts east to Libya and western Turkey; southern Black Sea coast',distributionNotes:'The 2019 developmental paper summarizes this broad coastal distribution and notes occurrences away from the coast as well.',confidence:'literature_supported',evidenceIds:['gbif-granulatum','zecchini-montesanto-2019']},
  profile:{adultLengthMm:null,adultLengthRangeMm:null,ecology:['terrestrial detritivore'],microhabitat:['littoral environments','under stones','beneath vegetation','ruins and old walls'],behaviour:['conglobation'],notableMorphology:['背面具有强烈、宏观可见的颗粒/结节质感；属于可卷球的 Armadillidium 体型。'],diagnosticNotes:['颜色变化不作为本项目的核心鉴别依据；renderer 主要表现背甲颗粒。'],conglobation:'full',careDataStatus:'not_in_scope',evidenceIds:['zecchini-montesanto-2019']},
  nomenclature:{taxonomicStatus:'accepted_species',tradeStatus:'hobby_morphs_exist',vernacularStatus:'project_translation',lastReviewed:'2026-09-17',provenance:'GBIF + Zecchini & Montesanto 2019'},
  literature:{lines:['背甲粗糙得足以让像素也留下阴影。','放大没有创造颗粒，只是让你终于愿意看它们。'],basis:[{claim:'强烈 dorsal granulation；地中海及邻近海岸分布。',evidenceIds:['zecchini-montesanto-2019']}],themes:['texture','scale']},
  evidenceIds:['gbif-granulatum','zecchini-montesanto-2019'],evidence:{status:'literature_supported',claims:[]},genetics:{...genetics},breeding:{...breeding},visual:granulatumVisual()
 },
 {
  id:'expansus',name:'宽展鼠妇',label:'Expansus',taxon:'Porcellio expansus',status:'正式种名；大型 Iberian Porcellio，已发表比较资料记录其高对比背部色块、头部与触角柄齿、以及雄性尾肢形态。',
  speed:1.02,wet:58,cover:46,
  notes:['深色中轴从两侧浅色边缘之间穿过去，整个身体显得比别的 Porcellio 更像一块扁平盾片。','尾端先离开石缝，身体过了一会儿才完全转出来。','宽度让它看起来占了很多地方。真正占地方的是你对“大”的判断。'],
  names:{zhCN:'宽展鼠妇',zhAliases:['Expansus'],zhNameType:'project_translation',zhConfidence:'medium',en:'Expansus',enNameType:'taxon_label',ja:null,jaAliases:[]},
  taxonomy:commonTaxonomy('Porcellionidae','Porcellio','expansus','Porcellio expansus','Dollfus, 1892'),trade:wildTrade(['Orange']),
  biogeography:{originCountry:'Spain',originRegion:'Eastern Iberian Peninsula / Catalonia',locality:null,nativeRange:'North-eastern / eastern Spain',distributionNotes:'Published Iberian records and catalogues place the species in eastern Spain; this project keeps locality broad rather than assigning a hobby-line locality.',confidence:'literature_supported',evidenceIds:['gbif-expansus','garcia-porcellio-2017']},
  profile:{adultLengthMm:null,adultLengthRangeMm:null,ecology:['terrestrial detritivore'],microhabitat:[],behaviour:['non-conglobating'],notableMorphology:['深色中央背部配白至黄色高对比斑块；大体型、低平 Porcellio 轮廓；雄性具有显著尾肢特征。'],diagnosticNotes:['2017 比较表记录奇数胸节上的大型白/黄斑，以及头部、触角柄齿和雄性尾肢差异；默认 sprite 不把雄性性征画到极端。'],conglobation:'none',careDataStatus:'not_in_scope',evidenceIds:['garcia-porcellio-2017']},
  nomenclature:{taxonomicStatus:'accepted_species',tradeStatus:'established_hobby',vernacularStatus:'project_translation',lastReviewed:'2026-09-17',provenance:'GBIF + Garcia et al. 2017'},
  literature:{lines:['浅色斑块把一只扁平的身体切成几个容易记住的区域。','你记住图案以后，才开始注意它其实很宽。'],basis:[{claim:'高对比奇数胸节斑块与大型 Porcellio 轮廓。',evidenceIds:['garcia-porcellio-2017']}],themes:['pattern','proportion']},
  evidenceIds:['gbif-expansus','garcia-porcellio-2017'],evidence:{status:'literature_supported',claims:[]},genetics:{...genetics},breeding:{...breeding},visual:expansusVisual()
 },
 {
  id:'haasi',name:'哈氏鼠妇',label:'Haasi',taxon:'Porcellio haasi',status:'正式种名；发表的 Iberian Porcellio 比较资料记录棕色底、成对黄色大斑、黄色周缘，以及显著的触角柄齿与雄性尾肢。',
  speed:1.08,wet:57,cover:44,
  notes:['黄色成对地沿背部排开，像有人给每一节都留下了标记。','浅色侧缘经过深土时很亮，转进树皮下面以后又一下失去意义。','雄性的尾肢可以很醒目；这一次你看到的个体没有为鉴定表摆姿势。'],
  names:{zhCN:'哈氏鼠妇',zhAliases:['Haasi'],zhNameType:'taxon_transliteration',zhConfidence:'high',en:'Haasi',enNameType:'taxon_label',ja:null,jaAliases:[]},
  taxonomy:commonTaxonomy('Porcellionidae','Porcellio','haasi','Porcellio haasi','Arcangeli, 1925'),trade:wildTrade(['High Yellow']),
  biogeography:{originCountry:'Spain',originRegion:'Eastern Iberian Peninsula',locality:null,nativeRange:'Eastern Iberian Peninsula',distributionNotes:'The comparative taxonomic literature treats P. haasi among large, contrast-coloured Porcellio of the eastern Iberian Peninsula; hobby line localities are not generalized to the species.',confidence:'literature_supported',evidenceIds:['gbif-haasi','garcia-porcellio-2017']},
  profile:{adultLengthMm:null,adultLengthRangeMm:null,ecology:['terrestrial detritivore'],microhabitat:[],behaviour:['non-conglobating'],notableMorphology:['棕色底；背部成对黄色大斑；身体外围有黄色带；大型 Porcellio 轮廓。'],diagnosticNotes:['文献还记录头部叶形、第二触角柄节齿以及雄性铲形尾肢；64 px 默认个体只保守表现其中可读的背部图案与伸长后端。'],conglobation:'none',careDataStatus:'not_in_scope',evidenceIds:['garcia-porcellio-2017']},
  nomenclature:{taxonomicStatus:'accepted_species',tradeStatus:'established_hobby',vernacularStatus:'taxon_label',lastReviewed:'2026-09-17',provenance:'GBIF + Garcia et al. 2017'},
  literature:{lines:['黄色很醒目，因此它很快得到了一个容易流通的形象。','形象可以被选择，物种名仍然指向另一套历史。'],basis:[{claim:'棕色底、成对黄色大斑、黄色周缘及大型 Porcellio 鉴别特征。',evidenceIds:['garcia-porcellio-2017']}],themes:['selection','taxonomy','visibility']},
  evidenceIds:['gbif-haasi','garcia-porcellio-2017'],evidence:{status:'literature_supported',claims:[]},genetics:{...genetics},breeding:{...breeding},visual:haasiVisual()
 },
 {
  id:'officinalis',name:'药用球鼠妇',label:'Officinalis',taxon:'Armadillo officinalis',status:'正式种名；地中海—黑海西岸的 Armadillidae，适应较干环境、主要夜行，并具有该属标志性的发声/振动结构。',
  speed:.68,wet:56,cover:64,
  notes:['灰色身体卷成一枚很完整的球，停在石粒之间几乎像另一块石头。','夜里它从遮蔽物下面出来，白天留下的位置并不能解释现在。','它能制造振动。你站得太远，听不见那一套尺度里的声音。'],
  names:{zhCN:'药用球鼠妇',zhAliases:['Officinalis'],zhNameType:'project_translation',zhConfidence:'low',en:'Officinalis',enNameType:'taxon_label',ja:null,jaAliases:[]},
  taxonomy:commonTaxonomy('Armadillidae','Armadillo','officinalis','Armadillo officinalis','Duméril, 1816'),trade:wildTrade(),
  biogeography:{originCountry:null,originRegion:'Mediterranean basin and western Black Sea coasts',locality:null,nativeRange:'Mediterranean basin and western coasts of the Black Sea',distributionNotes:'Peer-reviewed work describes the species as widespread in this region.',confidence:'literature_supported',evidenceIds:['gbif-officinalis','montesanto-officinalis-2018']},
  profile:{adultLengthMm:20,adultLengthRangeMm:null,ecology:['xeric terrestrial habitats','mainly nocturnal'],microhabitat:[],behaviour:['full conglobation','substrate-borne stridulation / vibration'],notableMorphology:['大型、石板灰色、圆厚的 Armadillidae 轮廓；可卷球；第四、第五步足具有与发声相关的鳞列结构，但该微结构不在 64 px 背视图中绘制。'],diagnosticNotes:['Armadillo 属的发声器属于腹侧/附肢微结构；renderer 只表现体型、颜色和卷球策略，不把不可见结构伪装成背部特征。'],conglobation:'full',careDataStatus:'not_in_scope',evidenceIds:['montesanto-officinalis-2018','jcb-aposematism-2025']},
  nomenclature:{taxonomicStatus:'accepted_species',tradeStatus:null,vernacularStatus:'project_translation',lastReviewed:'2026-09-17',provenance:'GBIF + Montesanto 2018 + JCB 2025'},
  literature:{lines:['它能把身体关成一个球，也能把振动送进地面。','你看见的是轮廓；另一些信息从来没有进入画面。'],basis:[{claim:'地中海—黑海西岸分布、较干环境、夜行与发声结构。',evidenceIds:['montesanto-officinalis-2018']},{claim:'体长可达约 20 mm、石板灰色。',evidenceIds:['jcb-aposematism-2025']}],themes:['hidden signals','scale','defence']},
  evidenceIds:['gbif-officinalis','montesanto-officinalis-2018','jcb-aposematism-2025'],evidence:{status:'literature_supported',claims:[]},genetics:{...genetics},breeding:{...breeding},visual:officinalisVisual()
 }
];
