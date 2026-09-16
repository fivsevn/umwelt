// [RENDER] Relative morphology coefficients from Morphology Renderer Draft v1.0, not measurements.
// Stage and curl settings are visual models, not verified species-level developmental claims.
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

// Antenna II is simplified to three visible pixel limbs by the 64 px renderer.
// `joints` controls rendered silhouette rather than claiming three anatomical articles.
const ANTENNA_TEMPLATES={
 porcellioStandard:{template:'porcellio-standard',thickness:.16,spread:.54,bend:.24,joints:[.45,.33,.22],flagellumArticles:2,confidence:'genus-proxy',basis:'Porcellionidae: elongate antenna II with two distinct flagellar articles.'},
 porcellioSpatulatus:{template:'porcellio-spatulatus',thickness:.18,spread:.56,bend:.22,joints:[.48,.31,.21],flagellumArticles:2,peduncleArticle3Tooth:'large-rounded',confidence:'species-character',basis:'Porcellio spatulatus: conspicuous rounded tooth on antennal peduncle article 3.'},
 porcellioBolivari:{template:'porcellio-bolivari',thickness:.14,spread:.62,bend:.15,joints:[.38,.35,.27],flagellumArticles:2,peduncleArticle3Tooth:'long-wide',confidence:'species-character',basis:'Porcellio bolivari: very long antennae; article 3 bears a long, broad tooth.'},
 ardentiellaRunner:{template:'ardentiella-runner',thickness:.14,spread:.60,bend:.14,joints:[.39,.36,.25],flagellumArticles:2,confidence:'genus-proxy',basis:'Ardentiella diagnosis: antennae long and slender; runner-type habitus.'},
 armadillidCompact:{template:'armadillid-compact',thickness:.20,spread:.30,bend:.40,joints:[.51,.29,.20],flagellumArticles:2,confidence:'family-proxy',basis:'Armadillidae proxy for unresolved hobby taxa: compact conglobating habitus, two-articled flagellum.'},
 venezilloCompact:{template:'venezillo-compact',thickness:.20,spread:.28,bend:.43,joints:[.50,.28,.22],flagellumArticles:2,confidence:'genus-proxy',basis:'Venezillo / Armadillidae proxy: short compact antenna, two-articled flagellum.'},
 armadillidiumCompact:{template:'armadillidium-compact',thickness:.22,spread:.26,bend:.46,joints:[.53,.28,.19],flagellumArticles:2,confidence:'family-genus-proxy',basis:'Armadillidium: robust compact antenna; two distinct flagellar articles; antennae hidden during conglobation.'}
};
const antennaTemplateById={
 dairy:'porcellioStandard',echinatus:'porcellioStandard',coros:'porcellioSpatulatus',bolivari:'porcellioBolivari',
 diablo:'ardentiellaRunner',ember:'ardentiellaRunner',
 cappuccino:'armadillidCompact',pink:'armadillidCompact',ducky:'armadillidCompact',amber:'armadillidCompact',vex:'armadillidCompact',
 daxin:'venezilloCompact',orange:'armadillidiumCompact'
};

// Cephalon templates encode only features visible at this pixel scale. Trade-assigned taxa stay conservative.
// Porcellio uses the characteristic three-lobed frontal margin. Armadillidium is given a triangular frontal
// scutellum; Venezillo is intentionally rendered without one, matching the useful family-level distinction.
const HEAD_TEMPLATES={
 porcellioStandard:{template:'porcellio-trilobed',shape:'trilobed',medianProjection:.34,lateralLobes:.62,lateralProjection:.52,scutellum:'none',eyeSet:.78,confidence:'genus-proxy'},
 porcellioSpatulatus:{template:'porcellio-spatulatus-head',shape:'trilobed-broad',medianProjection:.28,lateralLobes:.70,lateralProjection:.62,scutellum:'none',eyeSet:.80,confidence:'species-proxy'},
 porcellioBolivari:{template:'porcellio-bolivari-head',shape:'trilobed-narrow',medianProjection:.30,lateralLobes:.58,lateralProjection:.48,scutellum:'none',eyeSet:.77,confidence:'species-proxy'},
 ardentiellaRunner:{template:'ardentiella-frontal-shield',shape:'rounded-shield',medianProjection:.06,lateralLobes:.30,lateralProjection:.08,scutellum:'subtle',eyeSet:.78,confidence:'genus-proxy'},
 armadillidCompact:{template:'armadillid-rounded-head',shape:'rounded-shield',medianProjection:.08,lateralLobes:.30,lateralProjection:.12,scutellum:'subtle',eyeSet:.82,confidence:'family-proxy'},
 venezilloCompact:{template:'venezillo-no-scutellum',shape:'rounded-shield',medianProjection:0,lateralLobes:.26,lateralProjection:.08,scutellum:'none',eyeSet:.84,confidence:'genus-proxy'},
 armadillidiumCompact:{template:'armadillidium-scutellum',shape:'rounded-shield',medianProjection:.12,lateralLobes:.34,lateralProjection:.12,scutellum:'triangular',eyeSet:.83,confidence:'genus-proxy'}
};
const headTemplateById={
 dairy:'porcellioStandard',echinatus:'porcellioStandard',coros:'porcellioSpatulatus',bolivari:'porcellioBolivari',
 diablo:'ardentiellaRunner',ember:'ardentiellaRunner',
 cappuccino:'armadillidCompact',pink:'armadillidCompact',ducky:'armadillidCompact',amber:'armadillidCompact',vex:'armadillidCompact',
 daxin:'venezilloCompact',orange:'armadillidiumCompact'
};

// Posterior templates make the pleotelson and uropods taxonomically legible instead of treating them as one tail.
// Porcellio keeps an exposed triangular pleotelson and projecting uropods. Armadillidium uses a trapezoidal
// pleotelson with flattened, flush uropods; Venezillo uses the contrasting hourglass telson / protopod-filled gap.
const TAIL_TEMPLATES={
 porcellioStandard:{template:'porcellio-tail',pleotelson:{shape:'triangular-concave',apex:'narrow-rounded',lengthScale:1,widthScale:1},uropods:{mode:'projecting',tip:'slender',thicknessScale:.92}},
 porcellioSpatulatus:{template:'porcellio-spatulatus-tail',pleotelson:{shape:'triangular-broad',apex:'rounded-point',lengthScale:.94,widthScale:1.08},uropods:{mode:'projecting',tip:'broad',thicknessScale:1.12}},
 porcellioBolivari:{template:'porcellio-bolivari-tail',pleotelson:{shape:'triangular-long',apex:'pointed',lengthScale:1.12,widthScale:.94},uropods:{mode:'projecting',tip:'slender',thicknessScale:.90}},
 ardentiellaRunner:{template:'ardentiella-tail',pleotelson:{shape:'pointed',apex:'acute',lengthScale:1.08,widthScale:.96},uropods:{mode:'flush-protopod',tip:'acute-protopod',thicknessScale:1.14}},
 armadillidCompact:{template:'armadillid-compact-tail',pleotelson:{shape:'compact',apex:'rounded',lengthScale:.88,widthScale:1.08},uropods:{mode:'compact',tip:'rounded',thicknessScale:1.15}},
 venezilloCompact:{template:'venezillo-hourglass-tail',pleotelson:{shape:'hourglass',apex:'broad',lengthScale:.90,widthScale:1.10},uropods:{mode:'flush-protopod',tip:'flat',thicknessScale:1.30}},
 armadillidiumCompact:{template:'armadillidium-trapezoid-tail',pleotelson:{shape:'trapezoidal',apex:'truncate',lengthScale:.88,widthScale:1.16},uropods:{mode:'flush-exopod',tip:'flat',thicknessScale:1.25}}
};
const tailTemplateById={
 dairy:'porcellioStandard',echinatus:'porcellioStandard',coros:'porcellioSpatulatus',bolivari:'porcellioBolivari',
 diablo:'ardentiellaRunner',ember:'ardentiellaRunner',
 cappuccino:'armadillidCompact',pink:'armadillidCompact',ducky:'armadillidCompact',amber:'armadillidCompact',vex:'armadillidCompact',
 daxin:'venezilloCompact',orange:'armadillidiumCompact'
};

export const STAGES={
 juvenile:{scale:.72,widthRatio:.96,plateMaturity:.82,appendageRatio:.90,patternExpression:.75},
 subadult:{scale:.87,widthRatio:.98,plateMaturity:.92,appendageRatio:.96,patternExpression:.9},
 adult:{scale:1,widthRatio:1,plateMaturity:1,appendageRatio:1,patternExpression:1}
};
export function phenotypeFor(id){
 const [length,width,convexity,E,A,U]=baseline[id], [base,dark,rim]=colors[id];
 const roller=convexity>.7,flare=id==='diablo'||id==='ember';
 const antennaTemplate=ANTENNA_TEMPLATES[antennaTemplateById[id]]||ANTENNA_TEMPLATES.porcellioStandard;
 const headTemplate=HEAD_TEMPLATES[headTemplateById[id]]||HEAD_TEMPLATES.porcellioStandard;
 const tailTemplate=TAIL_TEMPLATES[tailTemplateById[id]]||TAIL_TEMPLATES.porcellioStandard;
 return {
  provenance:'RENDER: normalized visual tuning; antenna/head/tail silhouettes use literature-backed taxon templates; conglobation/stages are rendering defaults where unverified',
  body:{length,width,convexity,projection:{middle:.60,frontRoundness:roller?1:.92,rearRoundness:roller?.94:1.08},anteriorTaper:roller?.16:.24,posteriorTaper:roller?.16:.32,pleonTaper:roller?.12:.4},
  cephalon:{...structuredClone(headTemplate),width:roller?.66:.54,length:roller?.66:.84,embedding:roller?.7:.2,frontalMargin:.3,roundness:roller?.8:.35},
  pereon:{plateArc:convexity,overlap:id==='vex'?.26:roller?.18:.08,seamStrength:id==='bolivari'?.4:.22,heightProfile:[.80,.94,1,1,.97,.90,.76],epimera:{skirt:flare?.85:id==='coros'?1:id==='vex'?.55:roller?.18:.30,lobe:flare?'swept':id==='coros'?'shield':'rounded',width:E,flare:flare?.4:id==='coros'?.26:.1,angle:flare?.3:.12,roundness:roller?.7:.25,tip:flare?'pointed':'round'}},
  pleon:{length:roller?.13:.23,width:roller?.62:.45,taper:roller?.18:.38,segmentContrast:.2},
  pleotelson:{length:roller?.09:.16,width:roller?.36:.28,taper:.35,...structuredClone(tailTemplate.pleotelson),template:tailTemplate.template},
  uropods:{projection:U,width:.2,spread:roller?.08:.22,thickness:roller?.28:.15,visibility:roller?.35:.95,...structuredClone(tailTemplate.uropods),template:tailTemplate.template},
  antennae:{...structuredClone(antennaTemplate),length:A},
  legs:{length:roller?.22:.48,visibility:roller?.4:.7,spread:.3},
  surface:{sculpture:id==='echinatus'?'tuberculate':'smooth',intensity:id==='echinatus'?.85:.12,material:['pink','vex','cappuccino'].includes(id)?'translucent':roller?'glossy':'matte',translucency:['pink','vex','cappuccino'].includes(id)?.12:.02},
  palette:{tergite:base,cephalon:['ducky','daxin'].includes(id)?'#d8ac59':base,epimera:rim,pleon:id==='ducky'?rim:base,pleotelson:null,uropods:null,antennae:null,legs:null,dark,light:rim,accentA:id==='daxin'?'#c38b4b':dark,accentB:rim},
  patterns:structuredClone(grammar[id]),
  conglobation:{ability:roller?'full':flare?'partial':'none',closure:roller?.95:flare?.5:.1,antennaeHidden:roller},
  stageProfiles:structuredClone(STAGES)
 };
}
