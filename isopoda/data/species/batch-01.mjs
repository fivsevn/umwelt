import {phenotypeFor} from '../../phenotypes.mjs';

// Additional accepted species. Taxonomy / distribution / visible morphology are literature-backed;
// speed / wet / cover remain game-tuning proxies, not husbandry recommendations.
const armadillidiumVisual=(id,{length,width,base,dark,rim,patterns})=>{
 const v=structuredClone(phenotypeFor('orange'));
 v.provenance='RENDER: Armadillidium genus template with species colour-pattern evidence; coefficients are 64 px readability proxies, not morphometrics.';
 v.morphologyKey='armadillidiumCompact';
 v.body.length=length;v.body.width=width;v.body.convexity=.80;
 v.palette={...v.palette,tergite:base,cephalon:base,epimera:rim,pleon:base,dark,light:rim,accentA:rim,accentB:'#c86c4c'};
 v.patterns=structuredClone(patterns);
 return v;
};
const titanVisual=()=>{
 const v=structuredClone(phenotypeFor('dairy'));
 v.provenance='RENDER: Porcellio hoffmannseggii uses the Porcellio body-plan template with enlarged body and projecting posterior appendages; exact pixel ratios are render proxies.';
 v.morphologyKey='porcellioStandard';
 v.body.length=1.25;v.body.width=.78;v.body.convexity=.27;
 v.antennae={...v.antennae,length:1.02,spread:.62,bend:.16,renderEmphasis:'large-Porcellio-readability'};
 v.legs={...v.legs,length:.54,visibility:.84,spread:.38};
 v.uropods={...v.uropods,projection:1.08,width:.22,spread:.25,thickness:.17,visibility:1,thicknessScale:1.02};
 v.palette={...v.palette,tergite:'#4b4e49',cephalon:'#454945',epimera:'#d7d2b8',pleon:'#4a4d48',dark:'#272b28',light:'#d7d2b8'};
 v.patterns=[{type:'epimeraRim',color:'light',target:'epimera'}];
 return v;
};

const commonTaxonomy=(family,genus,species,acceptedScientificName,authority)=>({
 kingdom:'Animalia',phylum:'Arthropoda',class:'Malacostraca',order:'Isopoda',suborder:'Oniscidea',family,genus,species,
 acceptedScientificName,authority,referenceTaxon:acceptedScientificName,genusStatus:'accepted',speciesStatus:'accepted_species',identificationQualifier:null,identificationConfidence:'high',evidenceIds:[]
});
const wildTrade=()=>({designation:null,tradeName:null,type:'wild_species',morph:null,locality:null,lineage:null,tradeAliases:[],evidenceIds:[]});
const genetics={knowledge:'unknown',model:null},breeding={crossCompatibility:'unknown'};

export const EXTRA_SPECIES=[
 {
  id:'maculatum',name:'斑马',label:'Zebra',taxon:'Armadillidium maculatum',status:'正式种名；野生型以深色底上的浅色横带/斑列最醒目，培养圈另有多种人工色型。',
  speed:.78,wet:64,cover:58,
  notes:['浅色横带一节一节越过暗土，身体卷起以后，条纹被压缩成几道弧。','它停在石粒边缘，触角先探出去；背上的黑白比周围任何东西都更容易被你看见。','你叫它斑马。真正的斑马离这里很远。'],
  names:{zhCN:'斑马',zhAliases:['斑马鼠妇'],zhNameType:'hobby_vernacular',zhConfidence:'high',en:'Zebra',enNameType:'hobby_vernacular',ja:null,jaAliases:[]},
  taxonomy:commonTaxonomy('Armadillidiidae','Armadillidium','maculatum','Armadillidium maculatum','(Risso, 1816)'),trade:wildTrade(),
  biogeography:{originCountry:null,originRegion:'Ligurian / Mediterranean coast',locality:null,nativeRange:'Mediterranean coast of south-eastern France and north-western Italy',distributionNotes:'Published records place the native range along the Mediterranean coast of France and Italy; the type locality is France.',confidence:'literature_supported',evidenceIds:['itis-maculatum','cambridge-maculatum-2026']},
  profile:{adultLengthMm:null,adultLengthRangeMm:null,ecology:['terrestrial detritivore'],microhabitat:['rocks','rocky Mediterranean habitats'],behaviour:['full conglobation'],notableMorphology:['深色、光滑而高拱的 Armadillidium 轮廓；浅色区域常连成醒目的横带，形成“Zebra”视觉。'],diagnosticNotes:['加拿大综述按 Vandel / Schmalfuss 的形态资料概括为凸起体形、截短尾肢、平滑背面与细亮横带；颜色存在自然和培养变异。'],conglobation:'full',careDataStatus:'not_in_scope',evidenceIds:['cambridge-maculatum-2026']},
  nomenclature:{taxonomicStatus:'accepted_species',tradeStatus:'established_hobby',vernacularStatus:'established_hobby',lastReviewed:'2026-09-17',provenance:'ITIS + recent distribution review'},
  literature:{lines:['条纹把一只很小的动物变得很容易辨认。','辨认并没有让它更在意你。'],basis:[{claim:'深色凸起体形配浅色横带；平滑背面；完整卷球。',evidenceIds:['cambridge-maculatum-2026']}],themes:['visibility','mimicry','observer']},
  evidenceIds:['itis-maculatum','cambridge-maculatum-2026'],evidence:{status:'literature_supported',claims:[]},genetics:{...genetics},breeding:{...breeding},
  visual:armadillidiumVisual('maculatum',{length:.94,width:.86,base:'#30332f',dark:'#1f211f',rim:'#e2dfcb',patterns:[{type:'segmentBand',color:'light',target:'pereon',segments:[1,3,5,7]},{type:'epimeraRim',color:'light',target:'epimera'}]})
 },
 {
  id:'klugii',name:'小丑',label:'Clown',taxon:'Armadillidium klugii',status:'正式种名；2025 年同行评议研究记录其西巴尔干分布以及灰褐底、红色侧板、白或黄色点列。',
  speed:.82,wet:62,cover:55,
  notes:['红色侧缘从叶片下面先露出来，随后是三列浅点。','它卷成球时，那些点不再是三列，只剩一圈不规则的亮色。','小丑是人类给颜色安排的角色。它只是在找下一块阴影。'],
  names:{zhCN:'小丑',zhAliases:['小丑鼠妇'],zhNameType:'hobby_vernacular',zhConfidence:'high',en:'Clown',enNameType:'hobby_vernacular',ja:null,jaAliases:[]},
  taxonomy:commonTaxonomy('Armadillidiidae','Armadillidium','klugii','Armadillidium klugii','Brandt, 1833'),trade:wildTrade(),
  biogeography:{originCountry:null,originRegion:'Western Balkans',locality:null,nativeRange:'Western Balkans / eastern Adriatic region',distributionNotes:'The 2025 Journal of Crustacean Biology comparison lists Western Balkans; ITIS records the species as valid.',confidence:'literature_supported',evidenceIds:['itis-klugii','jcb-aposematism-2025']},
  profile:{adultLengthMm:21,adultLengthRangeMm:null,ecology:['terrestrial detritivore'],microhabitat:[],behaviour:['full conglobation'],notableMorphology:['灰褐色底；侧板常呈红色；背甲有白色或黄色点列，典型个体形成三列醒目浅点。'],diagnosticNotes:['颜色存在个体和地方变异，颜色本身不应替代正式形态鉴定。'],conglobation:'full',careDataStatus:'not_in_scope',evidenceIds:['jcb-aposematism-2025']},
  nomenclature:{taxonomicStatus:'accepted_species',tradeStatus:'established_hobby',vernacularStatus:'established_hobby',lastReviewed:'2026-09-17',provenance:'ITIS + Journal of Crustacean Biology 2025'},
  literature:{lines:['三列亮点像被认真排过。','排列属于身体，意义来自观看它的人。'],basis:[{claim:'灰褐底、红 epimera、白/黄点列；西巴尔干；约 21 mm。',evidenceIds:['jcb-aposematism-2025']}],themes:['aposematism','pattern','observer']},
  evidenceIds:['itis-klugii','jcb-aposematism-2025'],evidence:{status:'literature_supported',claims:[]},genetics:{...genetics},breeding:{...breeding},
  visual:armadillidiumVisual('klugii',{length:1.02,width:.88,base:'#4e4a42',dark:'#292a27',rim:'#b95f47',patterns:[{type:'spotRow',color:'light',target:'pereon'}]})
 },
 {
  id:'gestroi',name:'格斯特罗伊',label:'Gestroi',taxon:'Armadillidium gestroi',status:'正式种名；2025 年同行评议研究记录其西北意大利分布、约 20 mm 体长和鲜黄色斑点。',
  speed:.74,wet:68,cover:60,
  notes:['几枚黄色斑点从深褐背板上慢慢移动，靠近木片时先消失的是颜色。','它的身体很圆，停下以后像一枚被放错地方的有斑石子。','你数黄色点的时候，它转了一个方向。数字没有跟着转。'],
  names:{zhCN:'格斯特罗伊',zhAliases:['黄点格斯特罗伊'],zhNameType:'taxon_transliteration',zhConfidence:'high',en:'Gestroi',enNameType:'taxon_label',ja:null,jaAliases:[]},
  taxonomy:commonTaxonomy('Armadillidiidae','Armadillidium','gestroi','Armadillidium gestroi','Tua, 1900'),trade:wildTrade(),
  biogeography:{originCountry:'Italy',originRegion:'North-western Italy',locality:null,nativeRange:'North-western Italy',distributionNotes:'WoRMS accepts A. gestroi; the 2025 JCB comparison lists north-western Italy.',confidence:'literature_supported',evidenceIds:['worms-gestroi','jcb-aposematism-2025']},
  profile:{adultLengthMm:20,adultLengthRangeMm:null,ecology:['terrestrial detritivore'],microhabitat:[],behaviour:['full conglobation'],notableMorphology:['深到浅褐色底；鲜黄色斑点形成高对比背部图案；整体为大型、圆拱的 Armadillidium 体形。'],diagnosticNotes:['历史上 A. quadriseriatum 与 A. albigauni 等名称曾涉及该种；采用当前 accepted species 处理。'],conglobation:'full',careDataStatus:'not_in_scope',evidenceIds:['worms-gestroi','jcb-aposematism-2025']},
  nomenclature:{taxonomicStatus:'accepted_species',tradeStatus:'established_hobby',vernacularStatus:'taxon_label',lastReviewed:'2026-09-17',provenance:'WoRMS + Journal of Crustacean Biology 2025'},
  literature:{lines:['黄色让它从腐叶里跳出来。','它没有跳；只是你的视觉先到了那里。'],basis:[{claim:'褐色底、鲜黄色斑点；西北意大利；约 20 mm。',evidenceIds:['jcb-aposematism-2025']}],themes:['contrast','attention']},
  evidenceIds:['worms-gestroi','jcb-aposematism-2025'],evidence:{status:'literature_supported',claims:[]},genetics:{...genetics},breeding:{...breeding},
  visual:armadillidiumVisual('gestroi',{length:1.05,width:.92,base:'#443b31',dark:'#262722',rim:'#e0bd52',patterns:[{type:'spotRow',color:'light',target:'pereon'}]})
 },
 {
  id:'versicolor',name:'变色卷甲',label:'Versicolor',taxon:'Armadillidium versicolor',status:'正式种名；2025 年同行评议研究记录其东欧和中欧分布、约 10 mm 体长以及淡黄色边缘和浅色斑点。',
  speed:.78,wet:66,cover:58,
  notes:['它比旁边的大型个体短得多，浅黄色边缘仍然很清楚。','橄榄褐色背板经过湿土，颜色像是从背景里借来的。','“versicolor”提醒你颜色会变化；你却总想给它留一个固定色号。'],
  names:{zhCN:'变色卷甲',zhAliases:[],zhNameType:'project_vernacular',zhConfidence:'medium',en:'Versicolor',enNameType:'taxon_label',ja:null,jaAliases:[]},
  taxonomy:commonTaxonomy('Armadillidiidae','Armadillidium','versicolor','Armadillidium versicolor','Stein, 1859'),trade:wildTrade(),
  biogeography:{originCountry:null,originRegion:'Eastern and Central Europe',locality:null,nativeRange:'Eastern and Central Europe',distributionNotes:'2025 JCB comparison lists eastern and central Europe; ITIS treats the species as valid and gives Dalmatia as type locality.',confidence:'literature_supported',evidenceIds:['itis-versicolor','jcb-aposematism-2025']},
  profile:{adultLengthMm:10,adultLengthRangeMm:null,ecology:['terrestrial detritivore'],microhabitat:[],behaviour:['full conglobation'],notableMorphology:['黑褐到橄榄褐色；侧缘淡黄色，背部有浅色斑点；体型明显小于同批的 A. klugii 与 A. gestroi。'],diagnosticNotes:['ITIS 记录有多个亚种；本项目只建模 species-level 通用外观，不把亚种差异硬编码进 64 px sprite。'],conglobation:'full',careDataStatus:'not_in_scope',evidenceIds:['itis-versicolor','jcb-aposematism-2025']},
  nomenclature:{taxonomicStatus:'accepted_species',tradeStatus:null,vernacularStatus:'project_label',lastReviewed:'2026-09-17',provenance:'ITIS + Journal of Crustacean Biology 2025'},
  literature:{lines:['它的名字说颜色会变。','固定下来的反而是我们想把变化写进一个格子。'],basis:[{claim:'黑褐/橄榄褐底、淡黄色边缘和浅斑；约 10 mm；东欧和中欧。',evidenceIds:['jcb-aposematism-2025']}],themes:['variation','classification']},
  evidenceIds:['itis-versicolor','jcb-aposematism-2025'],evidence:{status:'literature_supported',claims:[]},genetics:{...genetics},breeding:{...breeding},
  visual:armadillidiumVisual('versicolor',{length:.82,width:.82,base:'#4f523c',dark:'#292b25',rim:'#c8bf79',patterns:[{type:'spotRow',color:'light',target:'pereon'},{type:'epimeraRim',color:'light',target:'epimera'}]})
 },
 {
  id:'hoffmannseggii',name:'泰坦',label:'Titan',taxon:'Porcellio hoffmannseggii',status:'正式种名；采用 Brandt, 1833 的 accepted spelling。大型 Porcellio 轮廓和显著后突尾肢来自修订文献，贸易名 Titan 仅作俗名。',
  speed:.95,wet:58,cover:48,
  notes:['长尾肢在身体离开木片之后还停在阴影边缘一瞬。','它的轮廓比同盒其他鼠妇更长，转弯时需要更大的弧。','“泰坦”听起来足够巨大；在你的手掌上，它仍然只是几厘米。'],
  names:{zhCN:'泰坦',zhAliases:['泰坦鼠妇'],zhNameType:'hobby_vernacular',zhConfidence:'high',en:'Titan',enNameType:'hobby_vernacular',ja:null,jaAliases:[]},
  taxonomy:commonTaxonomy('Porcellionidae','Porcellio','hoffmannseggii','Porcellio hoffmannseggii','Brandt, 1833'),trade:wildTrade(),
  biogeography:{originCountry:null,originRegion:'southern Iberian Peninsula / northern Morocco',locality:null,nativeRange:'Portugal, southern Spain and northern Morocco',distributionNotes:'Taiti & Rossano (2015) summarize the distribution as Portugal, southern Spain and northern Morocco; later Iberian records support a southern Iberian–Moroccan range.',confidence:'literature_supported',evidenceIds:['worms-hoffmannseggii','taiti-rossano-2015','graellsia-hoffmannseggii-2021']},
  profile:{adultLengthMm:null,adultLengthRangeMm:null,ecology:['terrestrial detritivore'],microhabitat:['Mediterranean terrestrial habitats'],behaviour:['non-conglobating'],notableMorphology:['大型、低平的 Porcellio 体形；后端尾肢明显向后突出。Schmalfuss 1987 检查的模式雄体体长 16 mm、宽 8 mm，而 uropod exopod 长约 4 mm，显示其后附肢在轮廓中的显著比例。'],diagnosticNotes:['旧文献常见 hoffmannseggi 单 i 拼法；当前 accepted spelling 为 hoffmannseggii。不要与蚁巢鼠妇 Platyarthrus hoffmannseggii 混淆。'],conglobation:'none',careDataStatus:'not_in_scope',evidenceIds:['worms-hoffmannseggii','schmalfuss-hoffmannseggii-1987','taiti-rossano-2015']},
  nomenclature:{taxonomicStatus:'accepted_species',tradeStatus:'established_hobby',vernacularStatus:'established_hobby',lastReviewed:'2026-09-17',provenance:'WoRMS + Schmalfuss 1987 + Taiti & Rossano 2015'},
  literature:{lines:['身体很长，尾肢把结束的位置又往后推了一点。','边界不是身体停止的地方，而是你决定从哪里开始量。'],basis:[{claim:'accepted spelling；大型 Porcellio；显著后突 uropods；葡萄牙、南西班牙、北摩洛哥。',evidenceIds:['worms-hoffmannseggii','schmalfuss-hoffmannseggii-1987','taiti-rossano-2015']}],themes:['scale','boundary','measurement']},
  evidenceIds:['worms-hoffmannseggii','schmalfuss-hoffmannseggii-1987','taiti-rossano-2015','graellsia-hoffmannseggii-2021'],evidence:{status:'literature_supported',claims:[]},genetics:{...genetics},breeding:{...breeding},
  visual:titanVisual()
 }
];
