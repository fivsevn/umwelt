import {morphologyFor} from './morphology.mjs?v=morphology-6';
// [RENDER] Relative morphology coefficients from Morphology Renderer Draft v1.0, not measurements.
// Morphological templates live in morphology.mjs and carry their own evidence-confidence labels.
const baseline = {
 dairy:[1.10,.72,.34,.46,.78,.72], cappuccino:[.94,.84,.72,.64,.60,.22],
 diablo:[1.02,.82,.55,.78,.76,.45], echinatus:[1.08,.70,.32,.45,.78,.70],
 pink:[.90,.84,.76,.62,.55,.18], coros:[1,.94,.28,.82,.70,.62],
 bolivari:[1.18,.70,.30,.44,.95,.92], ducky:[.88,.86,.82,.68,.52,.14],
 daxin:[.92,.84,.76,.64,.58,.18], ember:[1,.82,.55,.76,.76,.44],
 amber:[.90,.86,.80,.66,.54,.15], vex:[.94,.96,.88,.78,.56,.14],
 orange:[.92,.82,.76,.57,.58,.12]
};
const colors={
 dairy:['#e5deca','#30332c','#f0e8d1'],cappuccino:['#68442d','#382b25','#d3b786'],
 diablo:['#34342d','#e1b351','#b64930'],echinatus:['#706878','#383c37','#a79a9d'],
 pink:['#cfa8b5','#a58b9b','#e3c7ca'],coros:['#555c51','#343c34','#ddd8bb'],
 bolivari:['#d0bf79','#887846','#e7d5a0'],ducky:['#464c46','#31382f','#d8b85f'],
 daxin:['#393832','#292f29','#d5cfaa'],ember:['#303b32','#c57b30','#a44630'],
 amber:['#bd8744','#453e31','#dbb467'],vex:['#a7773c','#755c37','#d0ab6b'],
 orange:['#bd7e3c','#eed295','#e0a35c']
};
const grammar={
 dairy:[{type:'blotch',color:'dark',target:'pereon'}],
 cappuccino:[{type:'centerField',color:'dark',target:'pereon',width:.52},{type:'epimeraRim',color:'light',target:'epimera'}],
 diablo:[{type:'blotch',color:'accentA',target:'pereon'},{type:'epimeraTip',color:'accentB',target:'epimera'}],
 echinatus:[{type:'segmentSeam',color:'dark',target:'pereon'}],
 pink:[{type:'dorsalStripe',color:'dark',target:'pereon',opacity:.22,width:.12}],
 coros:[{type:'centerField',color:'dark',target:'pereon',width:.52}],
 bolivari:[{type:'segmentSeam',color:'dark',target:'pereon'}],
 ducky:[{type:'headMask',color:'light',target:'cephalon'},{type:'epimeraRim',color:'light',target:'epimera'}],
 daxin:[{type:'trizone',target:'body',colors:['accentA','dark','light']}],
 ember:[{type:'epimeraRim',color:'accentA',target:'epimera'},{type:'epimeraTip',color:'accentB',target:'epimera'}],
 amber:[{type:'saddle',color:'dark',target:'pereon',segments:[3,4,5]}],
 vex:[{type:'segmentSeam',color:'dark',target:'pereon'}],
 orange:[{type:'spotRow',color:'light',target:'pereon'}]
};

export const STAGES={
 juvenile:{scale:.72,widthRatio:.96,plateMaturity:.82,appendageRatio:.90,patternExpression:.75},
 subadult:{scale:.87,widthRatio:.98,plateMaturity:.92,appendageRatio:.96,patternExpression:.9},
 adult:{scale:1,widthRatio:1,plateMaturity:1,appendageRatio:1,patternExpression:1}
};

export function phenotypeFor(id){
 const [length,width,convexity,E,A,U]=baseline[id], [base,dark,rim]=colors[id];
 const morph=morphologyFor(id),epi=morph.pereon.epimera;
 const roller=morph.conglobation.ability==='full';
 const legacyFinish={material:['pink','vex','cappuccino'].includes(id)?'translucent':roller?'glossy':'matte',translucency:['pink','vex','cappuccino'].includes(id)?.12:.02,renderOnly:true};
 return {
  provenance:'RENDER: normalized visual tuning; morphology registry separates species characters, genus/family proxies and unresolved trade-taxonomy proxies.',
  morphologyKey:morph.key,
  body:{length,width,convexity,projection:{middle:.60,frontRoundness:roller?1:.92,rearRoundness:roller?.94:1.08},anteriorTaper:roller?.16:.24,posteriorTaper:roller?.16:.32,pleonTaper:roller?.12:.4},
  cephalon:{...morph.cephalon,width:roller?.66:.54,length:roller?.66:.84,embedding:roller?.7:.2,frontalMargin:.3,roundness:roller?.8:.35},
  pereon:{...morph.pereon,plateArc:morph.pereon.plateArc??convexity,overlap:morph.pereon.overlap??(roller?.18:.08),seamStrength:morph.pereon.seamStrength??.22,heightProfile:[.80,.94,1,1,.97,.90,.76],epimera:{...epi,width:E*(epi.widthScale||1)}},
  pleon:{length:roller?.13:.23,width:roller?.62:.45,taper:roller?.18:.38,segmentContrast:.2},
  pleotelson:{length:roller?.09:.16,width:roller?.36:.28,taper:.35,...morph.tail.pleotelson,template:morph.tail.template,confidence:morph.tail.confidence},
  uropods:{projection:U,width:.2,spread:roller?.08:.22,thickness:roller?.28:.15,visibility:roller?.35:.95,...morph.tail.uropods,template:morph.tail.template,confidence:morph.tail.confidence},
  antennae:{...morph.antennae,length:A},
  legs:{...morph.legs,length:(roller?.22:.48)*(morph.legs.lengthScale||1),visibility:morph.legs.exposure,spread:morph.legs.spread},
  surface:{...morph.surface,...legacyFinish},
  palette:{tergite:base,cephalon:['ducky','daxin'].includes(id)?'#d8ac59':base,epimera:rim,pleon:id==='ducky'?rim:base,pleotelson:null,uropods:null,antennae:null,legs:null,dark,light:rim,accentA:id==='daxin'?'#c38b4b':dark,accentB:rim},
  patterns:structuredClone(grammar[id]),
  conglobation:morph.conglobation,
  stageProfiles:structuredClone(STAGES)
 };
}
