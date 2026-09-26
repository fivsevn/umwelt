import {RELEASE_AQUATIC_SPECIES} from './release-aquatic.mjs';
const taxa=[
 {id:'chiltoni',name:'Excirolana chiltoni',authority:'(Richardson, 1905)',size:8,
 refs:['sand-chiltoni-worms','sand-bruce-jones-1981','sand-klapow-1972'],
 habitat:'沙滩潮间带较高处；低潮埋沙，满潮在浪洗区出沙游动觅食。 / High intertidal sand; low-tide burial and high-tide swimming in wave wash.',
 anatomy:'体长约为体宽的 2.5–2.75 倍，额部有前突；宽尾腹节收成钝的三角端。 / Length about 2.5–2.75 times width; projecting rostral region and broad pleotelson with a blunt triangular apex.',
 region:'Japan and California populations compared by Bruce & Jones (1981).',
 limitation:'采用 1981 年重描述的背面比例与宽尾形；颜色与斑点为保守像素配色，非鉴别特征。细毛、口器和尾肢分枝不在此倍率中完整表达。 / Dorsal proportions and broad tail follow the redescription; palette is illustrative, not diagnostic. Fine setae, mouthparts and uropod rami are simplified.'},
 {id:'naylori',name:'Eurydice naylori',authority:'Jones & Pierpoint, 1997',size:null,
 refs:['sand-naylori-worms','sand-jones-pierpoint-1997'],
 habitat:'伊比利亚大西洋沿岸潮间沙滩，研究中较多出现在暴露沙岸。 / Intertidal Atlantic Iberian sand beaches, especially exposed shores in the cited survey.',
 anatomy:'雄体约三倍长于宽，第二触角延伸过胸部，第六、七底节后缘延长为尖角。 / Male about three times as long as wide; long second antennae and extended posterior points on coxae 6–7.',
 region:'Atlantic sand beaches of Spain and Portugal.',
 limitation:'雄型示意，保留长触角和后部侧板尖突；不使用固定性别差异作为成长变化。配色为示意，原文固定液中颜色不等于活体标准颜色。 / Male-form proxy, not a sex-changing growth sequence; palette is illustrative and not inferred as live coloration from preserved material.'}
];
const notes={"chiltoni": ["它埋进去以后，一片沙又可以被叫作空地。", "这个称呼很方便，只需要不往下看。"], "naylori": ["触角伸得很远，身体还留在原处。", "我们习惯把一个地方的居民，算到身体为止。"]};
export const SANDY_EXPANSION_SPECIES=taxa.map(row=>{
 const p=structuredClone(RELEASE_AQUATIC_SPECIES.find(s=>s.id==='pulchra'));
 p.id=row.id;p.name=p.label=p.taxon=row.name;p.speed=row.id==='chiltoni'?1.12:1.22;
 p.names={zhCN:row.name,zhAliases:[],zhNameType:'scientific_name_fallback',zhConfidence:'high',en:row.name,enNameType:'scientific_name',ja:row.name,jaAliases:[]};
 p.taxonomy={...p.taxonomy,genus:row.name.split(' ')[0],species:row.id,acceptedScientificName:row.name,referenceTaxon:row.name,authority:row.authority,evidenceIds:row.refs};
 p.evidenceIds=row.refs;p.evidence={status:'literature_supported',claims:[{claim:row.habitat,evidenceIds:row.refs},{claim:row.anatomy,evidenceIds:row.refs}]};
 p.provenance={url:row.id==='chiltoni'?'https://isopods.nhm.org/pdfs/2580/2580.pdf':'https://research.nhm.org/pdfs/17769/17769.pdf',reviewed:'2026-09-25',habitatBasis:row.habitat,renderLimitation:row.limitation};
 p.biogeography={nativeRange:null,distributionNotes:row.region+' Comparative habitat pool, not a claim of co-occurrence.',evidenceIds:row.refs};
 p.profile={...p.profile,reportedMaximumLengthMm:row.size,adultLengthRangeMm:null,microhabitat:[row.habitat],notableMorphology:[row.anatomy],diagnosticNotes:[row.limitation],evidenceIds:row.refs};
 p.nomenclature.lastReviewed='2026-09-25';
 p.notes=notes[row.id];p.literature={lines:notes[row.id],basis:[{claim:row.habitat,evidenceIds:row.refs}],themes:['observation','boundary','naming']};
 const v=p.visual,broad=row.id==='chiltoni';
 v.morphologyKey=broad?'excirolanaSand':'eurydiceLongAntenna';
 v.provenance=row.limitation;
 v.body={...v.body,length:broad?1.15:1.10,width:broad?.92:.70,convexity:broad?.30:.18};
 v.cephalon={...v.cephalon,shape:broad?'trilobed':'rounded-shield',medianProjection:broad?.40:0,lateralProjection:0,eyeScale:broad?1.10:1.22};
 v.antennae={...v.antennae,length:broad?1.08:1.65,spread:broad?.48:.35,secondaryPair:true,confidence:'species-proxy'};
 v.pereon.epimera={...v.pereon.epimera,skirt:broad?.15:.28,posteriorProjection:broad?.10:.65,posteriorProjectionFrom:6,lobe:'swept'};
 v.pleotelson={...v.pleotelson,shape:broad?'triangular-broad':'trapezoidal',lengthScale:broad?1.3:1.15,widthScale:broad?1.4:1.0,apex:broad?'rounded':'truncate'};
 v.uropods={...v.uropods,mode:'fan-lateral',projection:.3,visibility:1};
 v.palette={...v.palette,tergite:broad?'#b5ae97':'#c4bfad',cephalon:broad?'#b5ae97':'#c4bfad',epimera:broad?'#a7a18c':'#b9b4a0',pleon:broad?'#aaa58f':'#b5b29e',pleotelson:broad?'#b2ad96':'#bfbaa5',dark:'#565b50'};
 v.patterns=[{type:'blotch',color:'dark',target:'pereon',opacity:.15}];
 return p;
});
