import {phenotypeFor} from '../../phenotypes.mjs';
const visual=structuredClone(phenotypeFor('ducky'));
visual.morphologyKey='naigua';
// Keep the approved adult proportions, including the curled face, at every stage.
for(const stage of Object.keys(visual.stageProfiles))visual.stageProfiles[stage]={...visual.stageProfiles.adult};
visual.provenance='作者虚构的鼠妇；黄色身体与绿色大眼来自 meme 形象，形态结构使用共用鼠妇绘制器。';
visual.cephalon={...visual.cephalon,eyeSet:1.02,eyeScale:2.8,rolledEyeScale:4,scutellum:'none',eyeWhite:'#91bf70',eyePupil:'#080e08',mouthColor:'#76632b',mouthCorner:'#b59b45',mouthShadow:'#c1b35c',mouthLight:'#ffe78a'};
visual.palette={...visual.palette,tergite:'#f6d45d',cephalon:'#f8db6c',epimera:'#ffe99b',pleon:'#efc94e',pleotelson:'#efcd59',uropods:'#e6c678',antennae:'#c4ad68',legs:'#a58f52',dark:'#9f8138',light:'#fff0a4'};
visual.patterns=[];
visual.conglobation={...visual.conglobation,ability:'full',rolledWidth:1.05,smoothFace:true,preservePixels:true,frontFacing:true,eyesVisible:true,closure:1,antennaeHidden:true};
for(const key of ['body','cephalon','pereon','pleon','pleotelson','uropods','antennae','legs','surface','conglobation']){visual[key].confidence='不详';if(visual[key].template)visual[key].template='不详';}
export const NAIGUA={
 id:'naigua',name:'奶瓜虫',label:'Naigua',taxon:'不详',status:'神秘。名字已登记，来历不详。',
 fictional:true,speed:.72,wet:70,cover:60,interaction:{defenseDuration:3600},
 names:{zhCN:'奶瓜虫',zhAliases:[],zhNameType:'fictional',zhConfidence:'unknown',en:'Naigua',enNameType:'fictional',ja:'ナイグアムシ',jaAliases:[]},
 taxonomy:{kingdom:null,phylum:null,class:null,order:'Isopoda',suborder:null,family:null,genus:null,species:null,acceptedScientificName:null,authority:null,referenceTaxon:null,genusStatus:'unknown',speciesStatus:'fictional',identificationQualifier:null,identificationConfidence:'unknown',evidenceIds:[]},
 trade:{designation:null,tradeName:null,type:'fictional',morph:null,locality:null,lineage:null,tradeAliases:[],evidenceIds:[]},
 biogeography:{originCountry:null,originRegion:null,locality:null,nativeRange:null,distributionNotes:'不详。有人说见过，地点各不相同。',confidence:'unknown',evidenceIds:[]},
 profile:{adultLengthMm:null,adultLengthRangeMm:null,ecology:['不详'],microhabitat:['神秘'],behaviour:['卷球。眼睛仍留在外面。'],notableMorphology:['黄色分节背板；两侧的大眼睛呈绿色，瞳仁黑色。卷成球时仍能看见眼睛。'],diagnosticNotes:['虚构鼠妇，来自 meme。其他资料不详。'],conglobation:'full',careDataStatus:'unknown',evidenceIds:[]},
 evidence:{status:'fictional',claims:[]},evidenceIds:[],
 genetics:{knowledge:'unknown',model:null},breeding:{crossCompatibility:'unknown'},
 nomenclature:{taxonomicStatus:'fictional',tradeStatus:'unknown',vernacularStatus:'fictional',lastReviewed:'2026-09-27',provenance:'作者设定'},
 notes:['你给它留了一行。它没有解释自己，只是在那一行旁边走过去。','它把身体卷了起来，眼睛还在外面。关于回避，双方似乎有不同理解。','你只是怕了。'],
 literature:{lines:['你给它留了一行。它没有解释自己，只是在那一行旁边走过去。','你只是怕了。'],basis:[],themes:['命名','不详']},
 game:{habitatEligible:true,rare:true},visual
};
