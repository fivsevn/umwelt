import {phenotypeFor} from '../../phenotypes.mjs';
const TAXA=[
 {id:'albifrons',taxon:'Jaera albifrons',authority:'Leach, 1814',suborder:'Asellota',family:'Janiridae',max:5,reference:5,color:'#888578',speed:.64,
 micro:'潮间带石下浅水；英国与爱尔兰广布。旧记录有时仅指 albifrons 种组，不能一概当作本种的记录。 / Shallow intertidal water beneath stones; some historical records refer to the species complex.',
 diagnosis:'本种的雄性第六、七步足腕节远端膨大；可靠鉴别需显微检查。颜色和像素背面轮廓不能区分同组近缘种。 / Male pereopod characters require microscopy; the sprite cannot identify this species.',
 morphology:'小型、较扁平的 Jaera 背面示意；雄性鉴别结构未绘出。 / Small, flattened Jaera dorsal proxy; male diagnostic structures omitted.',
 science:'BMIG 记录雄体最大 2.4 mm、雌体最大 5.0 mm；这些是分性别的最大值，不是所有成体的标准大小。 / Reported maxima: male 2.4 mm, female 5.0 mm; not typical adult lengths.',
 refs:['intertidal-albifrons-bmig']},
 {id:'hirsuta',taxon:'Campecopea hirsuta',authority:'(Montagu, 1804)',suborder:'Sphaeromatidea',family:'Sphaeromatidae',max:4,reference:3.5,color:'#777b62',speed:.56,
 micro:'受浪岩岸的海滨地衣、藤壶和岩缝，主要在中潮位至小潮高潮位之间，会随潮退露出空气；露出不等于可长期离开湿润庇护。 / Exposed-shore lichen, barnacles and crevices between mid-tide and neap high water; tidal emersion is not terrestrial independence.',
 diagnosis:'尾肢仅具一枝；雄体第六胸节具有向后长突，雌体无此长突。游戏采用雌型示意，不用随机长突代表成长阶段。 / Single-branched uropods; male pereonite-6 process absent from the female-form proxy.',
 morphology:'短圆雌型轮廓、圆形尾腹节和单枝尾肢的保守示意。 / Compact female-form proxy with rounded pleotelson and single-branched uropods.',
 science:'BMIG 记录雄体最大 4.0 mm、雌体最大 3.5 mm。水盘中可观察到游动；不据此推断野外游动频率或陆上耐受时长。 / Maxima: male 4.0 mm, female 3.5 mm. Swimming in collection trays does not establish field frequency or emersion tolerance.',
 refs:['intertidal-hirsuta-bmig']}
];
const NOTES={"albifrons": ["石边有一点灰影。放大以后，几条细足才从石纹里分出来。", "页上的轮廓占了很大一块。标记原来位置的小点，几乎被铅笔盖住。"], "hirsuta": ["藤壶之间露出一个小小的背面。潮水退下去，那里仍偶尔动一下。", "岸线画在它的下方。这一处该记在水里，还是岸上，两个词暂时挤在页边。"]};
function visualFor(row){
 const round=row.id==='hirsuta',v=structuredClone(phenotypeFor(round?'orange':'dairy'));
 v.morphologyKey=round?'campecopeaFemaleIntertidal':'jaeraAlbifronsIntertidal';
 v.provenance=round?'Female-form dorsal proxy from BMIG. Male pereonite-6 process deliberately absent, not a juvenile/adult transformation. Fine setae and uropod articulation simplified.':'Jaera genus-level dorsal proxy. Species identification depends on male appendages not resolved at this scale. Colour is illustrative, not diagnostic.';
 v.body={...v.body,length:round?.82:.92,width:round?.90:.72,convexity:round?.64:.12};
 v.cephalon={...v.cephalon,shape:'rounded-shield',medianProjection:0,lateralProjection:.05,scutellum:'none',confidence:'genus-proxy'};
 v.antennae={...v.antennae,length:round?.52:.78,confidence:'genus-proxy'};
 v.pleon={...v.pleon,length:.12,width:round?.76:.60,taper:.12};
 v.pleotelson={...v.pleotelson,shape:'compact',apex:'rounded',lengthScale:round?1.18:1.30,widthScale:round?1.12:1.02,confidence:'genus-proxy'};
 v.uropods={...v.uropods,projection:round?.30:.22,visibility:.8,ramiPerUropod:round?1:2,confidence:round?'species-character':'genus-proxy'};
 v.legs={...v.legs,length:round?.34:.44,visibility:.88};
 // No unsupported rolling behaviour is introduced by the shared roller scaffold.
 v.conglobation={...v.conglobation,ability:'none',closure:0,antennaeHidden:false,confidence:'render-proxy'};
 v.palette={...v.palette,tergite:row.color,cephalon:row.color,epimera:row.color,pleon:row.color,pleotelson:row.color,dark:'#354039',light:'#b8b69e'};
 v.patterns=[{type:'blotch',color:'light',target:'pereon',opacity:.12}];return v;
}
export const INTERTIDAL_EXPANSION_SPECIES=TAXA.map(row=>({
 id:row.id,name:row.taxon,label:row.taxon,taxon:row.taxon,status:'Accepted species; dorsal rendering proxy, not a diagnostic identification.',speed:row.speed,wet:88,cover:68,
 game:{habitatEligible:false,referenceOnly:false,habitats:['intertidal']},
 names:{zhCN:row.taxon,zhAliases:[],zhNameType:'scientific_name_fallback',zhConfidence:'high',en:row.taxon,enNameType:'scientific_name',ja:row.taxon,jaAliases:[]},
 taxonomy:{kingdom:'Animalia',phylum:'Arthropoda',class:'Malacostraca',order:'Isopoda',suborder:row.suborder,family:row.family,genus:row.taxon.split(' ')[0],species:row.taxon.split(' ')[1],acceptedScientificName:row.taxon,authority:row.authority,referenceTaxon:row.taxon,genusStatus:'accepted',speciesStatus:'accepted_species',identificationConfidence:'literature_supported',evidenceIds:row.refs},
 evidenceIds:row.refs,evidence:{status:'literature_supported',claims:[{claim:row.micro,evidenceIds:row.refs},{claim:row.diagnosis,evidenceIds:row.refs},{claim:row.science,evidenceIds:row.refs}]},
 provenance:{url:row.id==='albifrons'?'https://bmig.org.uk/species/jaera-albifrons':'https://bmig.org.uk/species/Campecopea-hirsuta',reviewed:'2026-09-25',habitatBasis:row.micro,renderLimitation:row.diagnosis},
 genetics:{knowledge:'unknown',model:null},breeding:{crossCompatibility:'not_applicable'},trade:{type:'wild_species',tradeAliases:[],evidenceIds:[]},nomenclature:{taxonomicStatus:'accepted_species',vernacularStatus:'scientific_name_only',lastReviewed:'2026-09-25'},
 biogeography:{nativeRange:null,distributionNotes:'Regional records are linked below. Habitat membership is comparative; it does not assert a shared pool or husbandry compatibility.',evidenceIds:row.refs},
 profile:{adultLengthMm:null,adultLengthRangeMm:null,reportedMaximumLengthMm:row.max,ecology:['intertidal'],microhabitat:[row.micro],behaviour:['sheltered surface movement; authored pace'],notableMorphology:[row.morphology],diagnosticNotes:[row.diagnosis],scientificNotes:[row.science],conglobation:'unknown',evidenceIds:row.refs},
 notes:NOTES[row.id],literature:{lines:NOTES[row.id],basis:[{claim:row.micro,evidenceIds:row.refs}],themes:['shore','record','scale']},visual:visualFor(row)
}));
