import {phenotypeFor} from '../../phenotypes.mjs';

const TAXA=[
 {id:'hilgendorfii',taxon:'Asellus hilgendorfii',authority:'Bovallius, 1886',habitats:['freshwater'],suborder:'Asellota',family:'Asellidae',max:18,color:'#786b50',shape:'asellid',speed:.86,micro:'Surface freshwater in Japan; rivers, lakes, ponds and ditches; associated with fallen leaves and detritus.'},
 {id:'ischiosetosa',taxon:'Jaera ischiosetosa',authority:'Forsman, 1949',habitats:['intertidal','petri-dish'],suborder:'Asellota',family:'Janiridae',max:5,color:'#817b69',shape:'jaera',speed:.72,micro:'Sheltered intertidal shores, especially reduced-salinity patches under stones with freshwater runoff.'},
 {id:'bidentata',taxon:'Dynamene bidentata',authority:'(Adams, 1800)',habitats:['intertidal'],suborder:'Sphaeromatidea',family:'Sphaeromatidae',max:7,color:'#746f54',shape:'sphaeroma',speed:.68,micro:'Adults in shallow-water rock crevices or barnacle tests; juveniles intertidal among algae.'},
 {id:'linearis',taxon:'Idotea linearis',authority:'(Linnaeus, 1766)',habitats:['shallow-marine'],suborder:'Valvifera',family:'Idoteidae',max:40,color:'#687b4d',shape:'idotea-long',speed:1.02,micro:'Mainly sublittoral; shallow water on sandy shores, swimming or clinging to fine seaweeds and eelgrass.'},
 {id:'maculosa',taxon:'Janira maculosa',authority:'Leach, 1814',habitats:['shallow-marine','petri-dish'],suborder:'Asellota',family:'Janiridae',max:10,color:'#9a835d',shape:'janira',speed:.78,micro:'Lower intertidal to shallow sublittoral; under stones, among sponges and bryozoans, and in Laminaria holdfasts.'},
 {id:'hookeri',taxon:'Lekanesphaera hookeri',authority:'(Leach, 1814)',habitats:['estuary'],suborder:'Sphaeromatidea',family:'Sphaeromatidae',max:10.5,color:'#77745d',shape:'sphaeroma',speed:.70,micro:'Upper estuaries, river banks, ditches and channels; in mud, under stones and among estuarine vegetation.'},
 {id:'rugicauda',taxon:'Lekanesphaera rugicauda',authority:'(Leach, 1814)',habitats:['estuary'],suborder:'Sphaeromatidea',family:'Sphaeromatidae',max:10,color:'#6d705c',shape:'sphaeroma',speed:.74,micro:'Estuaries and saltmarsh pools; among seaweed, under driftwood and burrowed into muddy creek banks.'},
 {id:'chelipes',taxon:'Idotea chelipes',authority:'(Pallas, 1766)',habitats:['estuary'],suborder:'Valvifera',family:'Idoteidae',max:15,color:'#708252',shape:'idotea',speed:.96,micro:'Brackish estuaries and stream mouths; algae, pools, mudflats and salt-marsh stones.'},
 {id:'carinata',taxon:'Cyathura carinata',authority:'(Krøyer, 1847)',habitats:['estuary'],suborder:'Cymothoida',family:'Anthuridae',max:18,color:'#8a735d',shape:'anthurid',speed:.82,micro:'Typical brackish-water isopod, especially muddy estuarine sediments; documented across a broad low-salinity range.'}
];

const NOTES={
 hilgendorfii:['河川、湖沼、池与沟渠只是地图上的分类；腐叶落到水里以后，分解者沿着更细的边界工作。','腐叶与有机碎屑会在水底聚集，个体常沿着这些沉积物和植物边缘活动。'],
 ischiosetosa:["石头抬起的一瞬，阴影里的身体显了出来。页上多了一处位置，原来的阴影却已经变了。", "「发现于石下」写得很短。那只抬起石头的手，留在句子外面。"],
 bidentata:["壳口朝着水，里面只露出半截轮廓。", "「空」字写下之后，触角从壳口伸了出来。前一行没有擦去。"],
 linearis:['细长的身体贴在细藻和海草上时，轮廓几乎成为植物的一部分。','四十毫米只是记录到的最大尺度，不是每一个个体的标准尺寸。'],
 maculosa:['长触角先越过身体边界，长尾肢又把边界向后延伸。测量总要先决定从哪里开始。','海绵、苔藓虫与海带固着器不是背景装饰，它们共同决定了可以停留的位置。'],
 hookeri:['河口没有稳定的盐度线。潮汐、径流与泥底把“海水”和“淡水”反复混在一起。','身体短宽并能卷曲，常出现在上游河口、沟渠、石下和泥底。'],
 rugicauda:['盐沼池、海藻、漂木与泥壁都能成为同一物种的遮蔽。环境不是一种材质。','尾节表面的小瘤与体后部轮廓，是它较明显的外形特征之一。'],
 chelipes:['藻、泥滩、盐沼水池和河口石块被同一个汽水梯度连接。','颜色会变化；比颜色更可靠的仍是触角、侧板与尾节形态。'],
 carinata:['泥里没有清楚的通道，细长身体却能把沉积物变成可经过的空间。','它能生活在较宽的低盐范围，尤其常见于泥质河口底部。']
};

const INTERTIDAL_SCIENCE={
 ischiosetosa:['常见于有淡水径流影响的石下低盐微环境。雄体最大 2.7 mm、雌体最大 5 mm；雄性第六、七步足坐节刚毛为鉴别线索。 / Reduced-salinity under-stone sites; maxima male 2.7 mm, female 5 mm; male pereopod setation is diagnostic.'],
 bidentata:['常见于岩缝、空藤壶壳和海藻间。雄体最大 7 mm、雌体最大 6 mm；雄性第六胸节的双突起不作为所有个体的通用形态。 / Crevices, empty barnacles and seaweed; maxima male 7 mm, female 6 mm; the paired male processes are sex-specific.']
};
function visualFor(row){
 const base=structuredClone(phenotypeFor(row.shape==='sphaeroma'?'orange':'dairy'));
 base.provenance='Evidence-informed aquatic dorsal approximation based on the cited taxon account. Fine setation, sexual structures and other microscopic diagnostics are intentionally omitted at 64 px.';
 base.palette={...base.palette,tergite:row.color,cephalon:row.color,epimera:row.color,pleon:row.color,pleotelson:row.color,dark:'#303a34',light:'#c1bd91'};
 base.patterns=[{type:'blotch',color:'light',target:'pereon',opacity:.14}];
 base.conglobation={...base.conglobation,ability:'none',antennaeHidden:false,confidence:'family-proxy'};
 if(row.shape==='asellid'){
  base.morphologyKey='asellidAquaticExtended';base.body={...base.body,length:1.18,width:.62,convexity:.16};base.antennae={...base.antennae,length:1.02,confidence:'family-proxy'};base.uropods={...base.uropods,projection:.68,visibility:1};base.pleotelson={...base.pleotelson,lengthScale:1.35,widthScale:1.05};
 }
 if(row.shape==='jaera'){
  base.morphologyKey='jaeridIntertidal';base.body={...base.body,length:.92,width:.72,convexity:.12};base.antennae={...base.antennae,length:.78,confidence:'family-proxy'};base.uropods={...base.uropods,projection:.28,visibility:.75};base.legs={...base.legs,length:.44,visibility:.9};
 }
 if(row.shape==='sphaeroma'){
  base.morphologyKey='sphaeromatidBrackish';base.body={...base.body,length:.94,width:.94,convexity:.72};base.pleotelson={...base.pleotelson,lengthScale:1.35,widthScale:1.18};base.uropods={...base.uropods,projection:.34,visibility:.82};base.conglobation={...base.conglobation,ability:'full',antennaeHidden:true,confidence:'family-proxy'};
 }
 if(row.shape==='idotea'||row.shape==='idotea-long'){
  base.morphologyKey=row.shape==='idotea-long'?'idoteidLinearis':'idoteidBrackish';base.body={...base.body,length:row.shape==='idotea-long'?1.48:1.22,width:row.shape==='idotea-long'?.48:.62,convexity:.15};base.antennae={...base.antennae,length:row.shape==='idotea-long'?.92:.68};base.pleotelson={...base.pleotelson,lengthScale:1.56,widthScale:1.05};base.uropods={...base.uropods,projection:.08,visibility:.18};
 }
 if(row.shape==='janira'){
  base.morphologyKey='janiridMaculosa';base.body={...base.body,length:1.02,width:.70,convexity:.12};base.antennae={...base.antennae,length:1.42,confidence:'species-character'};base.uropods={...base.uropods,projection:.78,visibility:1,confidence:'species-character'};base.legs={...base.legs,length:.52,visibility:.94};
 }
 if(row.shape==='anthurid'){
  base.morphologyKey='anthuridEstuary';base.body={...base.body,length:1.62,width:.34,convexity:.10};base.cephalon={...base.cephalon,shape:'rounded-shield',width:.66,length:.64};base.antennae={...base.antennae,length:.72};base.pleon={...base.pleon,length:.24,width:.38,taper:.12};base.pleotelson={...base.pleotelson,lengthScale:1.25,widthScale:.72};base.uropods={...base.uropods,projection:.34,visibility:.9};base.legs={...base.legs,length:.45,visibility:.92};
 }
 return base;
}

export const AQUATIC_EXPANSION_SPECIES=TAXA.map(row=>({
 id:row.id,name:row.taxon,label:row.taxon,taxon:row.taxon,status:'Accepted aquatic species; literature-supported habitat record and evidence-informed render approximation.',
 speed:row.speed,wet:88,cover:62,
 game:{habitatEligible:false,referenceOnly:false,habitats:row.habitats},
 names:{zhCN:row.taxon,zhAliases:[],zhNameType:'scientific_name_fallback',zhConfidence:'high',en:row.taxon,enNameType:'scientific_name',ja:row.taxon,jaAliases:[]},
 taxonomy:{kingdom:'Animalia',phylum:'Arthropoda',class:'Malacostraca',order:'Isopoda',suborder:row.suborder,family:row.family,genus:row.taxon.split(' ')[0],species:row.taxon.split(' ')[1],acceptedScientificName:row.taxon,authority:row.authority,referenceTaxon:row.taxon,genusStatus:'accepted',speciesStatus:'accepted_species',identificationConfidence:'literature_supported',evidenceIds:['aquatic-expansion-'+row.id]},
 evidenceIds:['aquatic-expansion-'+row.id],
 evidence:{status:'literature_supported',claims:[{claim:row.micro,url:null}]},
 provenance:{url:null,reviewed:'2026-09-24',habitatBasis:row.micro,renderLimitation:'Family/species dorsal approximation; microscopic, sexual and setal diagnostics are not fully rendered.'},
 genetics:{knowledge:'unknown',model:null},breeding:{crossCompatibility:'not_applicable'},
 trade:{type:'wild_species',tradeAliases:[],evidenceIds:[]},nomenclature:{taxonomicStatus:'accepted_species',vernacularStatus:'scientific_name_only',lastReviewed:'2026-09-24'},
 biogeography:{nativeRange:null,distributionNotes:'See cited species account; habitat pools are ecological selections and do not assert sympatry.',evidenceIds:['aquatic-expansion-'+row.id]},
 profile:{scientificNotes:INTERTIDAL_SCIENCE[row.id]||null,adultLengthMm:null,adultLengthRangeMm:null,reportedMaximumLengthMm:row.max,ecology:row.habitats,microhabitat:[row.micro],behaviour:['aquatic locomotion'],notableMorphology:[row.family+' dorsal body plan'],diagnosticNotes:['Pixel rendering is not an identification key.'],conglobation:row.shape==='sphaeroma'?'full':'none',evidenceIds:['aquatic-expansion-'+row.id]},
 notes:NOTES[row.id],literature:{lines:NOTES[row.id],basis:[{claim:row.micro,evidenceIds:['aquatic-expansion-'+row.id]}],themes:['water','scale','observation']},
 visual:visualFor(row)
}));
