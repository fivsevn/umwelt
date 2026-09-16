// Visible dorsal-morphology registry for the 64 px isopod renderer.
// Values are relative rendering coefficients, not morphometric measurements.
// Confidence labels matter: unresolved hobby taxa use conservative genus/family proxies
// and must not be read as formal identifications.

export const MORPHOLOGY_SCOPE={
 rendered:['body','cephalon','eyes','antenna-II','pereon','epimera','legs','surface','pleon','pleotelson','uropods','conglobation'],
 intentionallyOmitted:['antennulae','mouthpart-diagnostics','pleopod-lungs','genital-papilla','male-pleopod-sexual-characters','microscopic-scale-seta-shape'],
 reason:'Omitted structures are ventral, microscopic, sex-specific, or below reliable 64 px dorsal-view resolution.'
};

const groups={
 dairy:'porcellioStandard',
 echinatus:'porcellioEchinatus',
 coros:'porcellioSpatulatus',
 bolivari:'porcellioBolivari',
 diablo:'ardentiellaRunner',ember:'ardentiellaRunner',
 cappuccino:'armadillidHobby',pink:'armadillidHobby',ducky:'armadillidHobby',amber:'armadillidHobby',vex:'armadillidHobby',
 daxin:'venezilloCompact',
 orange:'armadillidiumCompact'
};

const ANTENNA={
 porcellioStandard:{template:'porcellio-standard',thickness:.16,spread:.54,bend:.24,joints:[.45,.33,.22],flagellumArticles:2,confidence:'genus-proxy',basis:'Porcellionidae antenna II elongated; flagellum with two distinct articles.'},
 porcellioEchinatus:{template:'porcellio-echinatus',thickness:.16,spread:.52,bend:.25,joints:[.46,.33,.21],flagellumArticles:2,confidence:'species-proxy',basis:'Porcellio echinatus belongs to the two-flagellar-article Porcellionidae pattern; exact pixel ratios are render proxies.'},
 porcellioSpatulatus:{template:'porcellio-spatulatus',thickness:.18,spread:.56,bend:.22,joints:[.48,.31,.21],flagellumArticles:2,peduncleArticle3Tooth:'large-rounded',confidence:'species-character',basis:'Porcellio spatulatus has a conspicuous large flattened tooth on antennal peduncle article 3.'},
 porcellioBolivari:{template:'porcellio-bolivari',thickness:.14,spread:.62,bend:.15,joints:[.38,.35,.27],flagellumArticles:2,peduncleArticle3Tooth:'long-wide',confidence:'species-character',basis:'Porcellio bolivari has very long antennae and a long broad tooth on peduncle article 3.'},
 ardentiellaRunner:{template:'ardentiella-runner',thickness:.14,spread:.60,bend:.14,joints:[.39,.36,.25],flagellumArticles:2,confidence:'genus-proxy',basis:'Ardentiella diagnosis: antennae long and slender; trade species remain unresolved.'},
 armadillidHobby:{template:'armadillid-compact',thickness:.20,spread:.30,bend:.40,joints:[.51,.29,.20],flagellumArticles:2,confidence:'family-proxy',basis:'Conservative Armadillidae-style proxy for unresolved hobby taxa.'},
 venezilloCompact:{template:'venezillo-compact',thickness:.20,spread:.28,bend:.43,joints:[.50,.28,.22],flagellumArticles:2,confidence:'genus-proxy',basis:'Venezillo / Armadillidae compact antenna proxy.'},
 armadillidiumCompact:{template:'armadillidium-compact',thickness:.22,spread:.26,bend:.46,joints:[.53,.28,.19],flagellumArticles:2,confidence:'genus-proxy',basis:'Armadillidium compact antenna; antennae concealed during complete conglobation.'}
};

const HEAD={
 porcellioStandard:{template:'porcellio-trilobed',shape:'trilobed',medianProjection:.34,lateralLobes:.62,lateralProjection:.52,scutellum:'none',eyeSet:.78,eyeScale:1,confidence:'genus-proxy'},
 porcellioEchinatus:{template:'porcellio-echinatus-head',shape:'trilobed',medianProjection:.38,lateralLobes:.58,lateralProjection:.46,scutellum:'none',eyeSet:.78,eyeScale:1,confidence:'species-proxy'},
 porcellioSpatulatus:{template:'porcellio-spatulatus-head',shape:'trilobed-broad',medianProjection:.50,lateralLobes:.70,lateralProjection:.62,scutellum:'none',eyeSet:.80,eyeScale:1,confidence:'species-character'},
 porcellioBolivari:{template:'porcellio-bolivari-head',shape:'trilobed-narrow',medianProjection:.32,lateralLobes:.56,lateralProjection:.45,scutellum:'none',eyeSet:.77,eyeScale:1,confidence:'species-character'},
 ardentiellaRunner:{template:'ardentiella-frontal-shield',shape:'rounded-shield',medianProjection:.06,lateralLobes:.30,lateralProjection:.08,scutellum:'notched-subtle',eyeSet:.78,eyeScale:1,confidence:'genus-proxy'},
 armadillidHobby:{template:'armadillid-rounded-head',shape:'rounded-shield',medianProjection:.08,lateralLobes:.30,lateralProjection:.12,scutellum:'subtle',eyeSet:.82,eyeScale:1,confidence:'family-proxy'},
 venezilloCompact:{template:'venezillo-no-scutellum',shape:'rounded-shield',medianProjection:0,lateralLobes:.26,lateralProjection:.08,scutellum:'none',eyeSet:.84,eyeScale:.95,confidence:'genus-proxy'},
 armadillidiumCompact:{template:'armadillidium-scutellum',shape:'rounded-shield',medianProjection:.12,lateralLobes:.34,lateralProjection:.12,scutellum:'triangular',eyeSet:.83,eyeScale:1,confidence:'genus-proxy'}
};

const PEREON={
 porcellioStandard:{template:'porcellio-pereon',overlap:.08,plateArc:.30,epimera:{lobe:'rounded',skirt:.30,flare:.10,angle:.12,roundness:.25,tip:'round',widthScale:1,posteriorProjection:0},confidence:'genus-proxy'},
 porcellioEchinatus:{template:'porcellio-echinatus-pereon',overlap:.08,plateArc:.34,epimera:{lobe:'rounded',skirt:.32,flare:.10,angle:.12,roundness:.22,tip:'rough-round',widthScale:1,posteriorProjection:0},confidence:'species-proxy'},
 porcellioSpatulatus:{template:'porcellio-spatulatus-pereon',overlap:.08,plateArc:.28,epimera:{lobe:'shield',skirt:1,flare:.26,angle:.08,roundness:.18,tip:'broad',widthScale:1.08,posteriorProjection:.08,edgeProfile:'stepped-serrate',edgeStep:1},confidence:'species-proxy'},
 porcellioBolivari:{template:'porcellio-bolivari-pereon',overlap:.08,plateArc:.28,seamStrength:.40,epimera:{lobe:'rounded',skirt:.34,flare:.10,angle:.10,roundness:.20,tip:'acute-rear',widthScale:.96,posteriorProjection:.08},confidence:'species-proxy'},
 ardentiellaRunner:{template:'ardentiella-rectangular-epimera',overlap:.10,plateArc:.48,epimera:{lobe:'rectangular',skirt:.42,flare:.12,angle:.06,roundness:.12,tip:'posterior-acute',widthScale:1,posteriorProjection:.34,posteriorProjectionFrom:5},noduliLaterales:'linear',confidence:'genus-character',basis:'Ardentiella pereonites 2–7 have broadly rectangular epimera; posterior corners of 5–7 can project weakly.'},
 armadillidHobby:{template:'armadillid-compact-pereon',overlap:.18,plateArc:.78,epimera:{lobe:'rounded',skirt:.18,flare:.08,angle:.10,roundness:.68,tip:'round',widthScale:1,posteriorProjection:0},confidence:'family-proxy'},
 venezilloCompact:{template:'venezillo-compact-pereon',overlap:.18,plateArc:.76,epimera:{lobe:'rounded',skirt:.17,flare:.07,angle:.10,roundness:.70,tip:'round',widthScale:1,posteriorProjection:0},confidence:'genus-proxy'},
 armadillidiumCompact:{template:'armadillidium-compact-pereon',overlap:.18,plateArc:.76,epimera:{lobe:'rounded',skirt:.18,flare:.08,angle:.10,roundness:.70,tip:'round',widthScale:1,posteriorProjection:0},confidence:'genus-proxy'}
};

const TAIL={
 porcellioStandard:{template:'porcellio-tail',pleotelson:{shape:'triangular-concave',apex:'narrow-rounded',lengthScale:1,widthScale:1},uropods:{mode:'projecting',tip:'slender',thicknessScale:.92},confidence:'family-genus-proxy'},
 porcellioEchinatus:{template:'porcellio-echinatus-tail',pleotelson:{shape:'triangular-concave',apex:'rounded',lengthScale:1,widthScale:1},uropods:{mode:'projecting',tip:'slender',thicknessScale:.94},confidence:'genus-proxy'},
 porcellioSpatulatus:{template:'porcellio-spatulatus-tail',pleotelson:{shape:'triangular-broad',apex:'rounded-point',lengthScale:.94,widthScale:1.08},uropods:{mode:'projecting',tip:'broad',thicknessScale:1.12},confidence:'species-proxy'},
 porcellioBolivari:{template:'porcellio-bolivari-tail',pleotelson:{shape:'triangular-long',apex:'pointed',lengthScale:1.12,widthScale:.94},uropods:{mode:'projecting',tip:'flattened-pointed',thicknessScale:1.02},confidence:'species-character'},
 ardentiellaRunner:{template:'ardentiella-tail',pleotelson:{shape:'keeled-pointed',apex:'acute',lengthScale:1.08,widthScale:.96,keel:true},uropods:{mode:'flush-protopod',tip:'acute-protopod',thicknessScale:1.14},confidence:'genus-character'},
 armadillidHobby:{template:'armadillid-compact-tail',pleotelson:{shape:'compact',apex:'rounded',lengthScale:.88,widthScale:1.08},uropods:{mode:'compact',tip:'rounded',thicknessScale:1.15},confidence:'family-proxy'},
 venezilloCompact:{template:'venezillo-hourglass-tail',pleotelson:{shape:'hourglass',apex:'broad',lengthScale:.90,widthScale:1.10},uropods:{mode:'flush-protopod',tip:'flat',thicknessScale:1.30},confidence:'genus-proxy'},
 armadillidiumCompact:{template:'armadillidium-trapezoid-tail',pleotelson:{shape:'trapezoidal',apex:'truncate',lengthScale:.88,widthScale:1.16},uropods:{mode:'flush-exopod',tip:'flat',thicknessScale:1.25},confidence:'genus-proxy'}
};

// Legs are represented as eco-morphological silhouettes rather than species-diagnostic pereopod anatomy.
// Sex-specific brushes/pits and individual podomeres are deliberately omitted at this resolution.
const LEGS={
 porcellioStandard:{template:'walking-exposed',lengthScale:1,exposure:.78,spread:.34,stepScale:1,thickness:1,confidence:'eco-morph-proxy'},
 porcellioEchinatus:{template:'walking-exposed',lengthScale:.96,exposure:.76,spread:.32,stepScale:.96,thickness:1,confidence:'eco-morph-proxy'},
 porcellioSpatulatus:{template:'wide-low-walker',lengthScale:.90,exposure:.68,spread:.38,stepScale:.90,thickness:1,confidence:'eco-morph-proxy'},
 porcellioBolivari:{template:'long-walker',lengthScale:1.10,exposure:.84,spread:.38,stepScale:1.08,thickness:1,confidence:'eco-morph-proxy'},
 ardentiellaRunner:{template:'runner',lengthScale:1.16,exposure:.92,spread:.46,stepScale:1.35,thickness:1,confidence:'genus-eco-morph',basis:'Ardentiella is described as a runner eco-morphotype and often occurs on exposed surfaces.'},
 armadillidHobby:{template:'compact-tucked',lengthScale:.72,exposure:.52,spread:.22,stepScale:.72,thickness:1,confidence:'family-proxy'},
 venezilloCompact:{template:'compact-tucked',lengthScale:.70,exposure:.50,spread:.20,stepScale:.70,thickness:1,confidence:'genus-proxy'},
 armadillidiumCompact:{template:'compact-tucked',lengthScale:.68,exposure:.48,spread:.20,stepScale:.68,thickness:1,confidence:'genus-proxy'}
};

const SURFACE={
 porcellioStandard:{template:'porcellio-fine',sculpture:'smooth',scaleSetae:'fine',intensity:.12,noduliLaterales:'none',confidence:'genus-proxy'},
 porcellioEchinatus:{template:'porcellio-echinatus-rough',sculpture:'tuberculate',scaleSetae:'coarse',intensity:.90,tubercleSpacing:3,noduliLaterales:'none',confidence:'species-character',basis:'P. echinatus has conspicuous dorsal granulation/tuberculation and diagnostic scale-setae.'},
 porcellioSpatulatus:{template:'porcellio-fine',sculpture:'smooth',scaleSetae:'fine',intensity:.12,noduliLaterales:'none',confidence:'genus-proxy'},
 porcellioBolivari:{template:'porcellio-fine',sculpture:'smooth',scaleSetae:'fine',intensity:.14,noduliLaterales:'none',confidence:'genus-proxy'},
 ardentiellaRunner:{template:'ardentiella-smooth-setose',sculpture:'smooth',scaleSetae:'small',intensity:.10,noduliLaterales:'linear',confidence:'genus-character',basis:'Ardentiella dorsum smooth, covered with small scale setae; noduli laterales form a diagnostic near-linear series.'},
 armadillidHobby:{template:'armadillid-smooth',sculpture:'smooth',scaleSetae:'fine',intensity:.10,noduliLaterales:'none',confidence:'family-proxy'},
 venezilloCompact:{template:'venezillo-smooth',sculpture:'smooth',scaleSetae:'fine',intensity:.10,noduliLaterales:'none',confidence:'genus-proxy'},
 armadillidiumCompact:{template:'armadillidium-smooth',sculpture:'smooth',scaleSetae:'fine',intensity:.10,noduliLaterales:'none',confidence:'genus-proxy'}
};

const CONGLOBATION={
 porcellioStandard:{ability:'none',closure:.08,antennaeHidden:false,strategy:'runner/clinger',confidence:'family-proxy'},
 porcellioEchinatus:{ability:'none',closure:.08,antennaeHidden:false,strategy:'non-conglobating',confidence:'species-proxy'},
 porcellioSpatulatus:{ability:'none',closure:.08,antennaeHidden:false,strategy:'non-conglobating',confidence:'genus-proxy'},
 porcellioBolivari:{ability:'none',closure:.08,antennaeHidden:false,strategy:'non-conglobating',confidence:'genus-proxy'},
 ardentiellaRunner:{ability:'partial',closure:.38,antennaeHidden:false,strategy:'rare-conglobation-runner',confidence:'genus-character',basis:'Ardentiella only rarely uses conglobation and instead behaves as a runner eco-morphotype.'},
 armadillidHobby:{ability:'full',closure:.93,antennaeHidden:true,strategy:'roller-proxy',confidence:'family-proxy',basis:'Rendering proxy only for unresolved hobby Armadillidae-like taxa; not a species-level diagnosis.'},
 venezilloCompact:{ability:'full',closure:.95,antennaeHidden:true,strategy:'roller',confidence:'genus-proxy'},
 armadillidiumCompact:{ability:'full',closure:.97,antennaeHidden:true,strategy:'roller',confidence:'genus-character'}
};

export function morphologyFor(id){
 const key=groups[id]||'porcellioStandard';
 return {
  key,
  antennae:structuredClone(ANTENNA[key]),
  cephalon:structuredClone(HEAD[key]),
  pereon:structuredClone(PEREON[key]),
  tail:structuredClone(TAIL[key]),
  legs:structuredClone(LEGS[key]),
  surface:structuredClone(SURFACE[key]),
  conglobation:structuredClone(CONGLOBATION[key])
 };
}
