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
 ['giganteus','Bathynomus giganteus','A. Milne-Edwards, 1879','abyssal','Cymothoida','Cirolanidae','https://www.marinespecies.org/imis.php?module=ref&refid=283148','Large deep-sea benthic scavenger; Bathynomus are documented from deep seafloor habitats and B. giganteus has been observed resting and swimming near the bottom.',500,'#747a76'],
 ['communis','Caecidotea communis','(Say, 1818)','freshwater','Asellota','Asellidae','https://bmig.org.uk/species/caecidotea-communis','Clear freshwater over mud or fine gravel with abundant decaying leaves.',null,'#82735d',.74],
 ['fontinalis','Lirceus fontinalis','Rafinesque-Schmaltz, 1820','freshwater','Asellota','Asellidae','https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=9100UM3P.TXT','Freshwater springs, drain outlets, seeps and streams.',null,'#756a54',.70],
 ['albifrons','Jaera albifrons','Leach, 1814','intertidal','Asellota','Janiridae','https://bmig.org.uk/species/jaera-albifrons','Small intertidal isopod found under stones in shallow water; species-level identification relies on male structures.',5,'#6f7067',.68],
 ['bidentata','Dynamene bidentata','(Adams, 1800)','intertidal','Sphaeromatidea','Sphaeromatidae','https://www.marlin.ac.uk/species/detail/2327','Adults in shallow-water rock crevices or barnacle tests; juveniles intertidal among algae.',7,'#7b6b58',.62],
 ['linearis','Idotea linearis','(Linnaeus, 1766)','shallow-marine','Valvifera','Idoteidae','https://bmig.org.uk/species/idotea-linearis','Mainly sublittoral; shallow sandy shores, swimming freely or clinging to fine seaweeds and eelgrass.',40,'#74845d',1.08],
 ['maculosa','Janira maculosa','Leach, 1814','shallow-marine','Asellota','Janiridae','https://bmig.org.uk/species/janira-maculosa','Lower intertidal to shallow sublittoral habitats under stones, among sponges and bryozoans, and in Laminaria holdfasts.',10,'#9a835f',.72],
 ['hookeri','Lekanesphaera hookeri','(Leach, 1814)','estuary','Sphaeromatidea','Sphaeromatidae','https://bmig.org.uk/species/lekanesphaera-hookeri','Upper estuaries, river banks, ditches and channels in mud, under stones and among estuarine vegetation.',10.5,'#75806b',.62],
 ['rugicauda','Lekanesphaera rugicauda','(Leach, 1814)','estuary','Sphaeromatidea','Sphaeromatidae','https://bmig.org.uk/species/lekanesphaera-rugicauda','Estuaries and saltmarsh pools, including mud margins, drift material and vegetation.',10,'#7a7462',.60],
 ['chelipes','Idotea chelipes','(Pallas, 1766)','estuary','Valvifera','Idoteidae','https://bmig.org.uk/species/idotea-chelipes','Brackish estuarine water among submerged vegetation and algae, including pools and stream mouths.',15,'#6c805d',.94],
 ['carinata','Cyathura carinata','(Krøyer, 1847)','estuary','Cymothoida','Anthuridae','https://bmig.org.uk/species/cyathura-carinata','In or on estuarine mud and streams crossing the shore; often more visible crawling on the surface at night.',27,'#916e60',.66],
 ['nordmanni','Jaera nordmanni','(Rathke, 1836)','estuary','Asellota','Janiridae','https://bmig.org.uk/species/jaera-nordmanni','Under stones in freshwater streams joining the shore; also documented from brackish pools and estuaries.',4.5,'#686d64',.70]
];
const AQUATIC_NOTES={
 aquaticus:['水把腐叶的边缘泡软，身体从沉木与水草之间经过。我们称这里为“淡水”，它只遇见阻力、遮蔽，以及仍可前进的缝隙。','标本柜要求一个名字，水面却不替任何物种停下来。分类与流动，只在这一页纸上短暂相遇。'],
 meridianus:['水草、石块与沉木把同一片水分成许多尺度。对我们是“环境”，对一具小小的身体，也许只是下一步能否落下。','把近似的轮廓分开，需要比像素更细的证据。看不清的地方，不该被想象成确定。'],
 coxalis:['浅水里的沉积物没有整齐的边界。名字是后来写上去的，身体先穿过那些混合的颗粒。','若一枚像素不能承担鉴别特征，就让它保持沉默。沉默也是资料的一部分。'],
 serratum:['潮水把石缝交还给海，又暂时收回。这里的边界每天都在移动，而标本框要求它保持不动。','它能够把身体卷起；那一刻，边界仿佛被暂时带回自己身上。至于下一次水线在哪里，没有一枚标本能够回答。'],
 pelagica:['藤壶、贻贝与短藻把岩岸拆成许多可以经过的表面。我们说“暴露”，身体只遇见一次又一次的附着与空隙。','标本针固定了方向；活着的时候，方向从来不是标本的一部分。'],
 granulosa:['藻叶随着水摆动，栖身其间的身体也被带进同一阵水流。画面可以留下轮廓，却不能把海的推力一起装进框里。','我们用颜色与背形记住它；它并不需要被记住，仍会在藻间继续。'],
 balthica:['藻场看起来像背景，直到一具身体把海藻同时当作食物与经过之处。人的记录喜欢把功能分开，水下没有表格。','当它离开这一片藻叶，位置改变了；“标本”这个词却要求它永远停在某处。'],
 emarginata:['脱落的藻体漂到一起，形成一种没有地基的栖身之处。我们仍习惯问“它住在哪里”，仿佛地点必须固定。','一片藻叶离开岩石之后仍然可以成为环境；有时，漂移只是另一种栖居方式。'],
 neglecta:['藻丛中的空隙会随着水流改变。看似相同的两秒钟，对毫米尺度的身体并不是同一个地方。','资料不足时，把“不知道”留在页上，比补齐一段漂亮的确定更接近观察。'],
 giganteus:['两次移动之间隔了很久。','第一处和第二处都被记下，中间的部分却只留下了一段时间。'],
 communis:['清水压在腐叶与细泥上，轮廓比熟悉的水虱更松散。资料把它分成另一个名字，水底只继续积下新的叶片。','鉴别需要看比像素更细的步足特征；画面只保留较大的体态差别，不把近似当成确定。'],
 fontinalis:['泉水从石缝与渗水口进入溪流。对记录者是几个地点，对水中的身体却是一条不断延续的湿润通道。','旧手册留下分布和栖息地，像素只借用 Asellota 的保守轮廓；没有证据的细节不补。'],
 albifrons:['石头下面只有几毫米的身体。潮水抬高之后，原本的石下空间变成另一层浅水。','真正区分同属近似种常要检查雄性微小结构；在这里，无法画出的证据仍然留在文字里。'],
 bidentata:['幼体停在藻间，成体可以进入岩缝或空的藤壶壳。相同的物种，尺度和阶段改变了可进入的空间。','背部末端的性别差异很细；像素保留圆厚轮廓，不把简化图当作鉴定图。'],
 linearis:['细长的身体离开藻叶，在浅水里游过一小段，又重新抓住更细的叶片。','长度可以被记录，附着与游动却交替发生；“在哪里生活”并不等于固定在一个位置。'],
 maculosa:['长触角先碰到海带固着器的边缘，长尾肢还留在阴影里。','低潮线附近的石下、海绵和固着器构成不同尺度的缝隙；轮廓不能替代显微鉴别。'],
 hookeri:['上游河口的泥、石头与褐藻把咸淡交界拆成许多小片。盐度不是背景，而是不断移动的条件。','能够卷起的轮廓容易被看成同一种球形；真正的物种差异仍要回到尾节与步足刚毛。'],
 rugicauda:['盐沼池里的水位下降后，漂木下面仍留着一小片湿处。潮水回来时，这个边缘又消失。','“河口”不是单一盐度；同一具身体经过的水会在几个小时里改变。'],
 chelipes:['沉水植物把半咸水分成许多可以抓住的表面。身体在藻间游动时，盐度的变化没有可见边界。','藻丛既是遮蔽也是路径。表格把它们拆成字段，水下的移动没有这样分开。'],
 carinata:['细长的身体从泥面经过，夜色让表面的移动更容易被看见。白天留下的只是孔隙和不完整的轨迹。','拉长的体节和窄尾端改变了轮廓；这不是陆生鼠妇被简单拉长，而是另一套海生体型。'],
 nordmanni:['淡水小溪在岸边进入海水，石下的几毫米空间同时接到两种来源的水。','名称把它归进一个物种，环境却不替它维持固定盐度；边界每次都在重新形成。']
};
export const AQUATIC_SOURCES=AQUATIC_TAXA.map(([id,name,,,,,url])=>({id:'aquatic-'+id,level:'A2',type:'TAXONOMY / ECOLOGY / MORPHOLOGY',title:name+' — habitat and identification account',url,supports:[id+'.taxonomy',id+'.habitat',id+'.morphology']}));
function visualFor(id,family,color){
 const v=structuredClone(phenotypeFor(family==='Sphaeromatidae'?'orange':'dairy'));
 const asellid=family==='Asellidae',round=family==='Sphaeromatidae',janirid=family==='Janiridae',anthurid=family==='Anthuridae',giant=id==='giganteus';
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
 if(anthurid){
  v.morphologyKey='anthuridAquatic';
  v.provenance='Evidence-informed Anthuridae dorsal proxy. The elongated pereon, fused short pleon and tapered pleotelson are emphasized; statocysts, mouthparts and species-level pereopod characters are below reliable pixel resolution.';
  v.body={...v.body,length:1.52,width:.42,convexity:.12,anteriorTaper:.10,posteriorTaper:.16};
  v.cephalon={...v.cephalon,shape:'rounded-shield',width:.62,length:.66,embedding:.30,medianProjection:.02,lateralProjection:.04,scutellum:'none',confidence:'family-proxy'};
  v.antennae={...v.antennae,length:.82,spread:.30,bend:.08,flagellumArticles:null,confidence:'family-proxy'};
  v.pleon={...v.pleon,length:.08,width:.42,taper:.18,visiblePleonites:0};
  v.pleotelson={...v.pleotelson,shape:'tapered',apex:'rounded',lengthScale:1.28,widthScale:.70,confidence:'species-character'};
  v.uropods={...v.uropods,projection:.24,visibility:.70,confidence:'family-proxy'};
  v.conglobation={...v.conglobation,ability:'none',antennaeHidden:false,strategy:'benthic-walker',confidence:'family-proxy'};
  v.palette={...v.palette,tergite:color,cephalon:color,epimera:color,pleon:color,pleotelson:color,dark:'#3d3733',light:'#c0a98d'};
  v.patterns=[{type:'blotch',color:'light',target:'pereon',opacity:.15}];return v;
 }
 if(janirid){
  v.morphologyKey=id==='maculosa'?'janiraMaculosaAquatic':'jaeraAquatic';
  v.provenance='Evidence-informed Janiridae dorsal proxy. A low flattened body is retained; for Janira maculosa the conspicuously long antennae and uropods are emphasized. Species-level male reproductive characters are not rendered.';
  v.body.length=id==='maculosa'?1.02:.84;v.body.width=id==='maculosa'?.72:.78;v.body.convexity=.10;
  v.cephalon={...v.cephalon,shape:'rounded-shield',medianProjection:.02,lateralProjection:.05,scutellum:'none',confidence:'family-proxy'};
  v.antennae={...v.antennae,length:id==='maculosa'?1.22:.78,spread:.48,bend:.12,flagellumArticles:null,confidence:id==='maculosa'?'species-character':'family-proxy'};
  v.pleon={...v.pleon,length:.10,visiblePleonites:2};
  v.pleotelson={...v.pleotelson,lengthScale:1.08,widthScale:.96,confidence:'family-proxy'};
  v.uropods={...v.uropods,projection:id==='maculosa'?.90:.48,visibility:1,confidence:id==='maculosa'?'species-character':'family-proxy'};
  v.conglobation={...v.conglobation,ability:'none',antennaeHidden:false};
  v.palette={...v.palette,tergite:color,cephalon:color,epimera:color,pleon:color,pleotelson:color,dark:'#343b36',light:'#bcb69b'};
  v.patterns=[{type:'blotch',color:'light',target:'pereon',opacity:id==='maculosa'?.24:.12}];return v;
 }
 if(id==='linearis'){
  v.morphologyKey='idoteaLinearisAquatic';
  v.provenance='Evidence-informed Idotea linearis dorsal proxy. The unusually elongated oblong body and long antennae are emphasized; fine coxal-plate and pleotelson diagnostics are simplified.';
  v.body.length=1.48;v.body.width=.43;v.body.convexity=.12;
  v.antennae={...v.antennae,length:.92,spread:.38,bend:.08,flagellumArticles:null,confidence:'species-character'};
  v.pleotelson={...v.pleotelson,lengthScale:1.35,widthScale:.82,confidence:'species-character'};
  v.conglobation={...v.conglobation,ability:'none',antennaeHidden:false};
  v.palette={...v.palette,tergite:color,cephalon:color,epimera:color,pleon:color,pleotelson:color,dark:'#303c33',light:'#c1bd91'};
  v.patterns=[{type:'blotch',color:'light',target:'pereon',opacity:.16}];return v;
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
export const AQUATIC_SPECIES=AQUATIC_TAXA.map(([id,taxon,authority,habitat,suborder,family,url,microhabitat,maxLength,color,pace])=>({
 id,name:taxon,label:taxon,taxon,status:'Accepted aquatic species; evidence-informed render approximation.',speed:pace??.8,wet:85,cover:65,
 game:{habitatEligible:false,referenceOnly:false,habitats:[habitat]},
 names:{zhCN:id==='giganteus'?'大王具足虫':taxon,zhAliases:id==='giganteus'?['巨型深海等足类']:[],zhNameType:id==='giganteus'?'vernacular':'scientific_name_fallback',zhConfidence:'high',en:id==='giganteus'?'Giant isopod':taxon,enNameType:id==='giganteus'?'vernacular':'scientific_name',ja:id==='giganteus'?'ダイオウグソクムシ':taxon,jaAliases:[]},
 taxonomy:{kingdom:'Animalia',phylum:'Arthropoda',class:'Malacostraca',order:'Isopoda',suborder,family,genus:taxon.split(' ')[0],species:taxon.split(' ')[1],acceptedScientificName:taxon,authority,referenceTaxon:taxon,genusStatus:'accepted',speciesStatus:'accepted_species',identificationConfidence:'literature_supported',evidenceIds:['aquatic-'+id]},
 evidenceIds:['aquatic-'+id],evidence:{status:'literature_supported',claims:[{claim:microhabitat,url}]},
 provenance:{url,reviewed:'2026-09-24',habitatBasis:microhabitat,renderLimitation:'Family dorsal approximation; not an identification key. Adult maximum lengths are not typical individual measurements.'},
 genetics:{knowledge:'unknown',model:null},breeding:{crossCompatibility:'not_applicable'},
 trade:{type:'wild_species',tradeAliases:[],evidenceIds:[]},nomenclature:{taxonomicStatus:'accepted_species',vernacularStatus:'scientific_name_only',lastReviewed:'2026-09-22'},
 biogeography:{nativeRange:null,distributionNotes:'See linked regional species account; the pool does not assert a shared geographic locality.',evidenceIds:['aquatic-'+id]},
 profile:{adultLengthMm:null,adultLengthRangeMm:null,reportedMaximumLengthMm:maxLength,ecology:[habitat],microhabitat:[microhabitat],behaviour:['aquatic locomotion'],notableMorphology:[family+' dorsal body plan'],diagnosticNotes:['Approximate family silhouette; microscopic and sexual diagnostics omitted.'],conglobation:family==='Sphaeromatidae'?'full':'none',evidenceIds:['aquatic-'+id]},
 notes:AQUATIC_NOTES[id]||[taxon],literature:{lines:AQUATIC_NOTES[id]||[taxon],basis:[{claim:microhabitat,evidenceIds:['aquatic-'+id]}],themes:['water','observation']},visual:visualFor(id,family,color)
}));
