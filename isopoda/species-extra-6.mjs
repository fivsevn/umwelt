import {phenotypeFor} from './phenotypes.mjs?v=cohort-4';

// Popular captive Panda King lines. These are hobby/trade designations, not formally described species.
// Shared morphology is intentionally inherited from one conservative Cubaris-style scaffold; colour/pattern
// differences are rendered as lineage proxies and never promoted to taxonomic diagnoses.
const EVIDENCE=['panda-king-cn-2025','herpeton-panda-king-2026','xoticbugs-panda-morphs-2026'];
const taxonomy=()=>({kingdom:'Animalia',phylum:'Arthropoda',class:'Malacostraca',order:'Isopoda',suborder:'Oniscidea',family:'Armadillidae',genus:'Cubaris',species:null,acceptedScientificName:null,authority:null,referenceTaxon:null,genusStatus:'trade_assigned',speciesStatus:'undescribed_or_unresolved',identificationQualifier:'sp.',identificationConfidence:'hobby_only',evidenceIds:EVIDENCE});
const names=(zh,en)=>({zhCN:zh,zhAliases:[],zhNameType:'established_hobby',zhConfidence:'medium',en,enNameType:'trade_name',ja:null,jaAliases:[]});
function pandaVisual({key,base,cephalon=base,epimera='#eee6d4',pleon=base,tail=base,light='#f2eadc',dark='#252525',bands=true,bandColor='light'}){
 const v=structuredClone(phenotypeFor('cappuccino'));
 v.provenance='RENDER: captive Panda King lineage proxy. Compact Cubaris-style body plan is shared across the line; band placement and exact palette are hobby-image readability proxies, not taxonomic characters.';
 v.morphologyKey=key;
 v.body.length=.92;v.body.width=.88;v.body.convexity=.82;
 v.cephalon={...v.cephalon,template:'panda-king-compact-head',medianProjection:.14,lateralLobes:.30,lateralProjection:.10,scutellum:'triangular',confidence:'trade-lineage-proxy'};
 v.pereon={...v.pereon,plateArc:.74,epimera:{...v.pereon.epimera,lobe:'rounded',skirt:.20,flare:.08,roundness:.66,width:.95},confidence:'trade-lineage-proxy'};
 v.uropods={...v.uropods,mode:'compact',projection:.12,width:.25,spread:.06,visibility:.78,confidence:'genus-render-proxy'};
 v.palette={...v.palette,tergite:base,cephalon,epimera,pleon,pleotelson:tail,uropods:tail,antennae:epimera,legs:epimera,dark,light,accentA:'#d99d8f'};
 v.patterns=bands?[{type:'segmentBand',color:bandColor,target:'pereon',segments:[2,4]},{type:'epimeraRim',color:'light',target:'epimera'}]:[];
 v.conglobation={...v.conglobation,ability:'full',closure:.96,antennaeHidden:true,strategy:'compact roller',confidence:'hobby-lineage-proxy'};
 return v;
}
const common=(id,name,label,tradeName,status,evidenceIds,visual,{morph=null,aliases=[]}={})=>({
 id,name,label,taxon:`Cubaris sp. “${tradeName}”`,status,speed:.70,wet:78,cover:72,
 names:names(name,label),taxonomy:taxonomy(),
 trade:{designation:`Cubaris sp. “${tradeName}”`,tradeName,type:morph?'cultured_line':'undescribed_trade_taxon',morph,locality:null,lineage:{label:'Panda King lineage',type:'captive-lineage'},tradeAliases:aliases,evidenceIds},
 biogeography:{originCountry:null,originRegion:'Southeast Asia (hobby-reported)',locality:null,nativeRange:null,distributionNotes:'Panda King is an unresolved captive-culture label; hobby sources commonly associate the base culture with Vietnam/Thailand, but no published species-level diagnosis is treated here as established.',confidence:'hobby_reported',evidenceIds:['herpeton-panda-king-2026']},
 profile:{adultLengthMm:null,adultLengthRangeMm:[8,12],ecology:['terrestrial detritivore'],microhabitat:['humid substrate','leaf litter','bark cover'],behaviour:['conglobation','burrowing/cover use'],notableMorphology:[],diagnosticNotes:['All Panda King colour lines here are maintained as captive hobby lineages of the unresolved Cubaris sp. “Panda King” culture; colour does not create a formal species.'],conglobation:'full',careDataStatus:'hobby_only',evidenceIds},
 nomenclature:{taxonomicStatus:'unresolved',tradeStatus:'established',vernacularStatus:'established_hobby',lastReviewed:'2026-09-17',provenance:'Chinese-language hobby source + specialist keeper/vendor documentation; no formal species diagnosis inferred'},
 evidenceIds,evidence:{status:'hobby_documented',claims:[]},genetics:{knowledge:'hobby-reported',model:null},breeding:{crossCompatibility:'same-culture lineage; exact inheritance model not treated as established'},visual
});

const panda=common('pandaKing','熊猫王','Panda King','Panda King','中文圈与国际观赏鼠妇圈常见的 Cubaris sp. 贸易名；黑灰底配奶白横带。底层物种尚未以正式论文诊断到种。',['panda-king-cn-2025','herpeton-panda-king-2026','xoticbugs-panda-king-2026'],pandaVisual({key:'cubarisPandaKing',base:'#363838',cephalon:'#303232',epimera:'#eee8dc',pleon:'#303333',tail:'#eeeeE4',light:'#f3eee4',dark:'#202222'}));
panda.profile.notableMorphology=['紧凑高拱的卷球型体态；黑灰主色与明显奶白横带形成“熊猫”高对比。当前 64 px renderer 用两条 segment-band 代理这一贸易线的典型横带。'];
panda.literature={lines:['它的名字来自最简单的黑与白。','分类身份仍未落定，花纹却已经先进入了玩家共同语言。'],basis:[{claim:'Panda King 是未正式描述的 Cubaris sp. 贸易文化，典型外观为深色身体配浅色横带，中文圈常称“熊猫王”。',evidenceIds:['panda-king-cn-2025','herpeton-panda-king-2026','xoticbugs-panda-king-2026']}],themes:['hobby taxonomy','pattern','naming']};

const red=common('redPandaKing','红熊猫王','Red Panda King','Red Panda King','熊猫王 captive colour line；以橙红/红褐替代基础线的深灰区域，同时保留浅色横带。',['postpods-red-panda-2026','tc-red-panda-2026','xoticbugs-panda-morphs-2026'],pandaVisual({key:'cubarisRedPandaKing',base:'#b55d47',cephalon:'#a95643',epimera:'#efe2d2',pleon:'#a85743',tail:'#e8d7c8',light:'#f3e8db',dark:'#67382f'}),{morph:'Red Panda King'});
red.profile.notableMorphology=['与熊猫王共享紧凑体型和浅色横带；选育线主要把深灰区域替换成橙红至红褐色。'];
red.literature={lines:['同一套横带，只把黑色换成了暖红。','玩家把颜色留下来，于是偶然开始有了血统名。'],basis:[{claim:'Red Panda 被 hobby sources 作为 Panda King 的 captive colour morph/line 处理，橙红身体保留浅色横带。',evidenceIds:['postpods-red-panda-2026','tc-red-panda-2026']}],themes:['selection','colour','lineage']};

const pink=common('pinkPandaKing','粉红熊猫王','Pink Panda King','Pink Panda King','熊猫王系粉色选育线；中文圈常见名称。通常呈粉橘、蜜桃到奶油白的柔和色调，仍保留熊猫系浅带。',['pink-panda-cn-2025','richards-pink-panda-2026','postpods-pink-panda-2026'],pandaVisual({key:'cubarisPinkPandaKing',base:'#dfa79e',cephalon:'#d39a93',epimera:'#f5e8df',pleon:'#d69f96',tail:'#f0ddd6',light:'#fff0e8',dark:'#8e625d'}),{morph:'Pink Panda King',aliases:['粉熊猫王','粉色熊猫王']});
pink.profile.notableMorphology=['粉橘/蜜桃色主甲片、奶油白横带和浅色附肢；幼体到成体色调可能发生变化，因此 renderer 只表现成熟线的平均印象。'];
pink.literature={lines:['粉色不是一个新物种，只是一条被人反复留下来的颜色。','熊猫的轮廓还在，黑色已经退成了桃色。'],basis:[{claim:'中文 hobby source 将 Pink Panda King 明确称为 Panda King 的粉色品系；国际 breeder sources 也将其作为 captive selected line 处理。',evidenceIds:['pink-panda-cn-2025','richards-pink-panda-2026','postpods-pink-panda-2026']}],themes:['selection','soft colour','hobby lineage']};

const black=common('blackPandaKing','黑熊猫王','Black Panda King','Black Panda King','熊猫王系深色选育线；主要表现为深灰/近黑体色并显著削弱或失去典型浅色横带。',['xoticbugs-panda-morphs-2026','tc-citrus-panda-2026'],pandaVisual({key:'cubarisBlackPandaKing',base:'#262828',cephalon:'#212323',epimera:'#343737',pleon:'#242626',tail:'#292b2b',light:'#747878',dark:'#151616',bands:false}),{morph:'Black Panda King'});
black.profile.notableMorphology=['Panda King captive pattern line；深灰至近黑，典型熊猫浅带受到强烈抑制。'];
black.literature={lines:['当“熊猫”的白带消失，名字仍然跟着血统一起留下。','选育改变的是可见图案，不是分类位置。'],basis:[{claim:'Hobby breeding sources list Black Panda King as a Panda King-derived selected form with suppressed pale banding.',evidenceIds:['xoticbugs-panda-morphs-2026','tc-citrus-panda-2026']}],themes:['pattern suppression','selection']};

const citrus=common('citrusPandaKing','柑橘熊猫王','Citrus Panda King','Citrus','熊猫王系橙色选育线；hobby sources 将其作为 Panda King 衍生 line，整体呈橙、蜜桃到红橙色，典型横带大幅减少或缺失。',['pangea-citrus-2026','tc-citrus-panda-2026','xoticbugs-panda-morphs-2026'],pandaVisual({key:'cubarisCitrusPandaKing',base:'#dc7c4d',cephalon:'#ce7047',epimera:'#eaa57a',pleon:'#d47649',tail:'#d77d51',light:'#f3c39f',dark:'#844b32',bands:false}),{morph:'Citrus',aliases:['Citrus Panda King','橘子熊猫王']});
citrus.profile.notableMorphology=['暖橙、蜜桃至红橙的整体体色；熊猫系典型浅色横带通常弱化或缺失。'];
citrus.literature={lines:['把黑色和白带都削弱以后，熊猫王变成了一颗柑橘。','贸易名记录的是选育历史，不是自然界的一次重新命名。'],basis:[{claim:'Multiple hobby sources describe Citrus as a selectively bred Panda King-derived line with warm orange/red-orange colour and reduced/absent panda banding.',evidenceIds:['pangea-citrus-2026','tc-citrus-panda-2026','xoticbugs-panda-morphs-2026']}],themes:['selective breeding','colour matrix','trade naming']};

export const EXTRA_SPECIES_6=[panda,pink,red,black,citrus];
