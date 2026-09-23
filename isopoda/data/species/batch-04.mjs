import {phenotypeFor} from '../../phenotypes.mjs';

// Fourth accepted-species batch. This group prioritises naturally conspicuous colour patterns.
// Species-level colour / size / diagnostic claims are evidence-backed where cited; exact 64 px
// palette values and pattern placement remain rendering proxies rather than morphometric data.
const taxonomy=(family,genus,species,authority)=>({kingdom:'Animalia',phylum:'Arthropoda',class:'Malacostraca',order:'Isopoda',suborder:'Oniscidea',family,genus,species,acceptedScientificName:`${genus} ${species}`,authority,referenceTaxon:`${genus} ${species}`,genusStatus:'accepted',speciesStatus:'accepted_species',identificationQualifier:null,identificationConfidence:'high',evidenceIds:[]});
const trade=(aliases=[])=>({designation:null,tradeName:null,type:'wild_species',morph:null,locality:null,lineage:null,tradeAliases:aliases,evidenceIds:[]});
const names=(zh,en,type='project_translation',confidence='medium')=>({zhCN:zh,zhAliases:[],zhNameType:type,zhConfidence:confidence,en,enNameType:'vernacular',ja:null,jaAliases:[]});
const common=(id,name,label,taxon,status,speed,wet,cover,evidenceIds)=>({id,name,label,taxon,status,speed,wet,cover,evidenceIds,evidence:{status:'literature_supported',claims:[]},genetics:{knowledge:'unknown',model:null},breeding:{crossCompatibility:'unknown'},nomenclature:{taxonomicStatus:'accepted_species',tradeStatus:null,vernacularStatus:'project_translation',lastReviewed:'2026-09-17',provenance:'taxonomic database + specialist identification / revision literature'}});

function pictumVisual(){
 const v=structuredClone(phenotypeFor('orange'));
 v.provenance='RENDER: Armadillidium scaffold with literature-backed dark ground, yellow/green mottling, reddish-brown posterior margins and near-pointed telson; exact mottling placement is a 64 px proxy.';
 v.morphologyKey='armadillidiumPictum';
 v.body.length=.90;v.body.width=.84;v.body.convexity=.80;
 v.cephalon={...v.cephalon,template:'armadillidium-pictum-head',medianProjection:.12,lateralLobes:.34,lateralProjection:.12,scutellum:'triangular',confidence:'genus-plus-species-proxy'};
 v.pleotelson={...v.pleotelson,template:'armadillidium-pictum-tail',shape:'triangular-broad',apex:'near-pointed',lengthScale:1.02,widthScale:.94,confidence:'species-character'};
 v.palette={...v.palette,tergite:'#2d2c27',cephalon:'#292923',epimera:'#9a5740',pleon:'#302e28',pleotelson:'#2d2c27',uropods:'#766e55',dark:'#171815',light:'#d5c96c',accentA:'#98aa70',accentB:'#a55c42'};
 v.patterns=[{type:'spotRow',color:'light',target:'pereon'},{type:'blotch',color:'accentA',target:'pereon'},{type:'epimeraRim',color:'accentB',target:'epimera'}];
 v.conglobation={...v.conglobation,ability:'full',closure:.97,antennaeHidden:true,strategy:'roller',confidence:'species-character'};
 return v;
}
function pulchellumVisual(){
 const v=structuredClone(phenotypeFor('orange'));
 v.provenance='RENDER: Armadillidium scaffold with literature-backed yellow/chestnut/orange mottling, reddish posterior margins, broad truncate telson and incomplete closure; exact patch positions are render proxies.';
 v.morphologyKey='armadillidiumPulchellum';
 v.body.length=.80;v.body.width=.82;v.body.convexity=.78;
 v.cephalon={...v.cephalon,template:'armadillidium-pulchellum-head',medianProjection:.10,lateralLobes:.32,lateralProjection:.10,scutellum:'triangular',confidence:'genus-proxy'};
 v.pereon={...v.pereon,plateArc:.74,epimera:{...v.pereon.epimera,lobe:'rounded',skirt:.18,flare:.08,roundness:.66,width:.94},confidence:'species-render-proxy'};
 v.pleotelson={...v.pleotelson,template:'armadillidium-pulchellum-tail',shape:'trapezoidal',apex:'round-truncate',lengthScale:.86,widthScale:1.20,confidence:'species-character'};
 v.palette={...v.palette,tergite:'#49352c',cephalon:'#403028',epimera:'#97523e',pleon:'#443229',pleotelson:'#49372d',uropods:'#765a44',dark:'#231f1b',light:'#d5b95f',accentA:'#bf7044',accentB:'#98503c'};
 v.patterns=[{type:'spotRow',color:'light',target:'pereon'},{type:'blotch',color:'accentA',target:'pereon'},{type:'epimeraRim',color:'accentB',target:'epimera'}];
 v.conglobation={...v.conglobation,ability:'partial',closure:.86,antennaeHidden:true,strategy:'near-complete roller',confidence:'species-character'};
 return v;
}
function werneriVisual(){
 const v=structuredClone(phenotypeFor('orange'));
 v.provenance='RENDER: Armadillidium klugii-group scaffold with documented regular yellow/reddish tergal dots and coloured epimera; five-row spotting is compressed into the 64 px spot field.';
 v.morphologyKey='armadillidiumWerneri';
 v.body.length=1.07;v.body.width=.93;v.body.convexity=.82;
 v.cephalon={...v.cephalon,template:'armadillidium-werneri-head',medianProjection:.12,lateralLobes:.36,lateralProjection:.12,scutellum:'triangular',confidence:'species-revision-proxy'};
 v.palette={...v.palette,tergite:'#30302b',cephalon:'#292a26',epimera:'#a85442',pleon:'#30302b',pleotelson:'#2b2c28',uropods:'#7b7056',dark:'#171815',light:'#e1d17b',accentA:'#b96047'};
 v.patterns=[{type:'spotRow',color:'light',target:'pereon'},{type:'epimeraRim',color:'accentA',target:'epimera'}];
 v.conglobation={...v.conglobation,ability:'full',closure:.97,antennaeHidden:true,strategy:'roller',confidence:'species-character'};
 return v;
}
function spinicornisVisual(){
 const v=structuredClone(phenotypeFor('dairy'));
 v.provenance='RENDER: Porcellio scaffold with specialist identification characters: dark head, dark median stripe, bright yellow lateral mottling, broad frontal lobes and a two-segment flagellum.';
 v.morphologyKey='porcellioSpinicornis';
 v.body.length=.96;v.body.width=.80;v.body.convexity=.26;
 v.cephalon={...v.cephalon,template:'porcellio-spinicornis-head',shape:'trilobed-broad',medianProjection:.46,lateralLobes:.72,lateralProjection:.64,scutellum:'none',confidence:'species-character'};
 v.antennae={...v.antennae,length:.94,spread:.58,bend:.20,joints:[.46,.33,.21],flagellumArticles:2,confidence:'family-plus-species-character'};
 v.surface={...v.surface,template:'porcellio-spinicornis-light-granulation',sculpture:'tuberculate',scaleSetae:'fine',intensity:.22,tubercleSpacing:5,confidence:'species-proxy'};
 v.palette={...v.palette,tergite:'#6e6752',cephalon:'#292b27',epimera:'#9c8c58',pleon:'#35352f',pleotelson:'#33342f',uropods:'#635f4c',dark:'#252722',light:'#d6bd4f',accentA:'#d6bd4f'};
 v.patterns=[{type:'dorsalStripe',color:'dark',target:'pereon',width:.16},{type:'blotch',color:'accentA',target:'pereon'},{type:'lateralStripe',color:'light',target:'pereon'}];
 v.conglobation={...v.conglobation,ability:'none',closure:.08,antennaeHidden:false,strategy:'non-conglobating',confidence:'family-character'};
 return v;
}
function magnificusVisual(){
 const v=structuredClone(phenotypeFor('dairy'));
 v.provenance='RENDER: large Porcellio scaffold with literature-backed orange body colour and revision-backed giant body / long uropods; pale skirt is a conservative live-colour readability proxy.';
 v.morphologyKey='porcellioMagnificus';
 v.body.length=1.24;v.body.width=.86;v.body.convexity=.24;
 v.cephalon={...v.cephalon,template:'porcellio-magnificus-head-proxy',medianProjection:.38,lateralLobes:.60,lateralProjection:.48,confidence:'genus-species-proxy'};
 v.antennae={...v.antennae,length:1.06,spread:.64,bend:.14,joints:[.43,.33,.24],flagellumArticles:2,confidence:'genus-proxy'};
 v.legs={...v.legs,length:.56,visibility:.86,spread:.40,stepScale:1.06};
 v.uropods={...v.uropods,projection:1.06,width:.22,spread:.27,thickness:.17,visibility:1,confidence:'species-character-sex-conservative'};
 v.surface={...v.surface,template:'porcellio-magnificus-fine',sculpture:'smooth',scaleSetae:'fine',intensity:.12,confidence:'genus-proxy'};
 v.palette={...v.palette,tergite:'#c76935',cephalon:'#b95d31',epimera:'#ead7a7',pleon:'#bb5f33',pleotelson:'#ae582f',uropods:'#c66b3b',antennae:'#c97848',legs:'#9f5d3c',dark:'#66371f',light:'#f0dfb5'};
 v.patterns=[{type:'epimeraRim',color:'light',target:'epimera'}];
 v.conglobation={...v.conglobation,ability:'none',closure:.06,antennaeHidden:false,strategy:'non-conglobating / threat-display',confidence:'species-character'};
 return v;
}

const pictum={...common('pictum','彩斑卷甲','Painted Pill Woodlouse','Armadillidium pictum','正式种名；小型而高对比的欧洲 Armadillidium，深褐至黑色底上有黄色或绿黄色斑驳，胸节后缘常带红褐色。',.78,66,61,['gbif-pictum','bmig-pictum','gregory-richards-armadillidium-2008']),names:names('彩斑卷甲','Painted Pill Woodlouse'),taxonomy:taxonomy('Armadillidiidae','Armadillidium','pictum','Brandt, 1833'),trade:trade(),biogeography:{originCountry:null,originRegion:'Europe',locality:null,nativeRange:'Europe outside much of the Mediterranean basin',distributionNotes:'BMIG documents scarce British populations; broader European occurrence is reflected in taxonomic catalogues.',confidence:'literature_supported',evidenceIds:['gbif-pictum','bmig-pictum']},profile:{adultLengthMm:9,adultLengthRangeMm:null,ecology:['terrestrial detritivore'],microhabitat:['old woodland','rotting wood','under loose bark','moss and stones'],behaviour:['full conglobation'],notableMorphology:['深褐/黑底配黄色或绿黄色斑驳；胸节后缘常红褐；尾节较窄、近三角，末端接近尖形。'],diagnosticNotes:['与 A. pulchellum 可相似；本项目只表现背视可读特征，不模拟雄性第一腹肢等性别鉴定结构。'],conglobation:'full',careDataStatus:'not_in_scope',evidenceIds:['bmig-pictum','gregory-richards-armadillidium-2008']},literature:{lines:['黑色底上同时出现黄、绿和红褐。','颜色让它先被看见，尺寸却提醒你它仍然很小。'],basis:[{claim:'约 9 mm；黑/深褐底，黄或绿色斑驳，胸节后缘红褐，完整卷球。',evidenceIds:['bmig-pictum','gregory-richards-armadillidium-2008']}],themes:['contrast','scale','recognition']},visual:pictumVisual()};

const pulchellum={...common('pulchellum','华美卷甲','Beautiful Pill Woodlouse','Armadillidium pulchellum','正式种名；仅约 5 mm，但天然斑纹非常丰富，深褐底上可见黄色、栗色与橙色斑块，卷球后通常仍留小缝。',.76,68,62,['gbif-pulchellum','bmig-pulchellum','gregory-richards-armadillidium-2008']),names:names('华美卷甲','Beautiful Pill Woodlouse'),taxonomy:taxonomy('Armadillidiidae','Armadillidium','pulchellum','(Zenker, 1798)'),trade:trade(),biogeography:{originCountry:null,originRegion:'Europe',locality:null,nativeRange:'Europe',distributionNotes:'European species with scattered populations; BMIG documents a north-western British distribution and habitat overlap with A. pictum.',confidence:'literature_supported',evidenceIds:['gbif-pulchellum','bmig-pulchellum']},profile:{adultLengthMm:5,adultLengthRangeMm:null,ecology:['terrestrial detritivore'],microhabitat:['woodland','heathland','rotting timber','moss and stones'],behaviour:['near-complete conglobation'],notableMorphology:['深褐底上有黄色、栗色与橙色斑块；胸节后缘可呈红褐色；尾节宽、末端圆截；卷球通常留有小缝。'],diagnosticNotes:['第七胸节侧板的深色斑是鉴别点之一，但当前 64 px pattern 层只做整体斑驳代理，没有把单个侧板硬编码成诊断图。'],conglobation:'partial',careDataStatus:'not_in_scope',evidenceIds:['bmig-pulchellum','gregory-richards-armadillidium-2008']},literature:{lines:['五毫米的身体里塞进了黄色、栗色和橙色。','卷起来以后，它仍没有把世界完全关在外面。'],basis:[{claim:'体长约 5 mm；黄色、栗色、橙色天然斑驳；宽圆截尾节；卷球留小缝。',evidenceIds:['bmig-pulchellum','gregory-richards-armadillidium-2008']}],themes:['miniature','pattern','closure']},visual:pulchellumVisual()};

const werneri={...common('werneri','韦氏卷甲',"Werner's Pill Woodlouse",'Armadillidium werneri','正式种名；klugii-group 的独立种，天然型为深色底配规则黄色或红色点列及着色侧板；人工 Orange 线不是本条目的默认外观。',.72,62,59,['schmalfuss-klugii-group-2013','tuf-durajkova-antipredatory-2022']),names:names('韦氏卷甲',"Werner's Pill Woodlouse"),taxonomy:taxonomy('Armadillidiidae','Armadillidium','werneri','Strouhal, 1927'),trade:trade(['Orange']),biogeography:{originCountry:'Greece',originRegion:'Ionian Islands / Corfu',locality:null,nativeRange:'Corfu (Kerkyra), Greece',distributionNotes:'Modern revisions treat verified material from Corfu; old Kefalonia locality reporting requires caution.',confidence:'literature_supported',evidenceIds:['schmalfuss-klugii-group-2013']},profile:{adultLengthMm:21,adultLengthRangeMm:null,ecology:['terrestrial detritivore'],microhabitat:['olive groves','Mediterranean island habitats'],behaviour:['full conglobation'],notableMorphology:['大型、圆厚的 Armadillidium；klugii-group 具有规则黄色或红色背点与同色侧板，A. werneri 由修订形态特征与 A. klugii 分开。'],diagnosticNotes:['培养圈 Orange 为人工维持的色型，不代表野生型；默认 renderer 使用深色天然型。五列点斑在 64 px 中压缩为高密度浅色点场。'],conglobation:'full',careDataStatus:'not_in_scope',evidenceIds:['schmalfuss-klugii-group-2013','tuf-durajkova-antipredatory-2022']},literature:{lines:['规则斑点很容易被误认为人工设计。','人工橙色线存在，但这里先画野生型。'],basis:[{claim:'A. werneri 是 klugii-group 中保留的独立种；该组具有规则黄色/红色点列和着色侧板。',evidenceIds:['schmalfuss-klugii-group-2013']},{claim:'A. werneri 被列为天然色彩醒目的陆生等足类。',evidenceIds:['tuf-durajkova-antipredatory-2022']}],themes:['wild type','selection','pattern']},visual:werneriVisual()};

const spinicornis={...common('spinicornis','彩绘鼠妇','Painted Woodlouse','Porcellio spinicornis','正式种名；暗色头部和中央纵带两侧的明亮黄色斑驳构成很稳定的野外识别印象，成年约 12 mm。',.90,61,48,['gbif-spinicornis','bmig-spinicornis','shultz-spinicornis-2018']),names:names('彩绘鼠妇','Painted Woodlouse'),taxonomy:taxonomy('Porcellionidae','Porcellio','spinicornis','Say, 1818'),trade:trade(),biogeography:{originCountry:null,originRegion:'Europe',locality:null,nativeRange:'Europe',distributionNotes:'Widespread in Europe and introduced to North America; BMIG documents dry calcareous and wall habitats in Britain and Ireland.',confidence:'literature_supported',evidenceIds:['gbif-spinicornis','bmig-spinicornis']},profile:{adultLengthMm:12,adultLengthRangeMm:null,ecology:['terrestrial detritivore'],microhabitat:['limestone','walls','quarries','rocky exposed substrates'],behaviour:['non-conglobating'],notableMorphology:['头部明显较暗；胸部中央有深色纵带，两侧为高对比黄色斑驳；额部中央与侧叶宽大；第二触角鞭部两节。'],diagnosticNotes:['黄色图案会有个体变化；renderer 强调的是“暗头 + 暗中线 + 黄色侧向斑驳”的组合，而不是固定斑点编号。'],conglobation:'none',careDataStatus:'not_in_scope',evidenceIds:['bmig-spinicornis','shultz-spinicornis-2018']},literature:{lines:['黄色不是随机撒在背上，而是沿着暗色中线排出方向。','它看起来像被画过，因此英文俗名直接叫 Painted。'],basis:[{claim:'体长可达约 12 mm；暗头、暗中线、两侧亮黄色斑驳和宽大额叶。',evidenceIds:['bmig-spinicornis','shultz-spinicornis-2018']}],themes:['direction','pattern','field identification']},visual:spinicornisVisual()};

const magnificus={...common('magnificus','华丽鼠妇','Magnificent Orange Isopod','Porcellio magnificus','正式种名；西班牙阿尔梅里亚附近的大型 Porcellio，天然体色为橙色，雄性可具有非常长的尾肢；橙色不是培养 morph。',.96,52,42,['gbif-magnificus','schmalfuss-magnificus-1987','tuf-durajkova-antipredatory-2022']),names:names('华丽鼠妇','Magnificent Orange Isopod','project_translation','high'),taxonomy:taxonomy('Porcellionidae','Porcellio','magnificus','Dollfus, 1892'),trade:trade(),biogeography:{originCountry:'Spain',originRegion:'Almería / Andalusia',locality:null,nativeRange:'vicinity of Almería, southern Spain',distributionNotes:'Schmalfuss 1987 treated the species as restricted to the extremely arid surroundings of Almería based on examined and historical material.',confidence:'literature_supported',evidenceIds:['schmalfuss-magnificus-1987']},profile:{adultLengthMm:29,adultLengthRangeMm:null,ecology:['terrestrial detritivore','xeric Mediterranean habitats'],microhabitat:['arid rocky terrain'],behaviour:['non-conglobating','posterior threat-display'],notableMorphology:['大型低平 Porcellio；天然橙色；雄性尾肢可非常伸长。Schmalfuss 记录体长 18–22 mm 的材料，并引用雄体可达约 29 mm。'],diagnosticNotes:['默认 sprite 不假定性别，因此尾肢只做“明显较长”的保守表达，不直接画成极端成熟雄体。'],conglobation:'none',careDataStatus:'not_in_scope',evidenceIds:['schmalfuss-magnificus-1987','tuf-durajkova-antipredatory-2022']},literature:{lines:['它的橙色不需要培养线来解释。','体型、长尾肢和颜色一起把轮廓推到背景前面。'],basis:[{claim:'accepted species；阿尔梅里亚附近大型 Porcellio，雄体可达约 29 mm。',evidenceIds:['gbif-magnificus','schmalfuss-magnificus-1987']},{claim:'天然橙色，并会以长尾肢抬起后体形成威吓姿态。',evidenceIds:['tuf-durajkova-antipredatory-2022']}],themes:['colour','scale','display']},visual:magnificusVisual()};

export const EXTRA_SPECIES_4=[pictum,pulchellum,werneri,spinicornis,magnificus];
