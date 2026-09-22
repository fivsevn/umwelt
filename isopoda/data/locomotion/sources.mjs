// Backend-only locomotion evidence registry.
// Intentionally NOT merged into sources-registry.mjs: locomotion research supports simulation
// and future authored events, but is not a public catalogue attribute.
export const LOCOMOTION_SOURCES=Object.freeze([
 {
  id:'loc-dailey-laevis-2009',level:'A1',type:'LOCOMOTION / PHYSIOLOGY',
  title:'Dailey et al. 2009 — temperature, desiccation and body mass effects on Porcellio laevis locomotion',
  citation:'Dailey, T.M.; Claussen, D.L.; Ladd, G.B.; Buckner, S.T. (2009). Comparative Biochemistry and Physiology A 153(2):162–166.',
  doi:'10.1016/j.cbpa.2009.02.005',url:'https://doi.org/10.1016/j.cbpa.2009.02.005',
  supports:['porcellio-laevis.temperature-q10','porcellio-laevis.body-mass-scaling','porcellio-laevis.desiccation-threshold','porcellio-laevis.active-escape'],
  method:'Linear racetrack; multiple body masses; 15–35 °C; desiccation treatment.',
  limitations:'Direct species evidence for P. laevis. Cultured Porcellio cf. laevis lines inherit it only as explicitly labelled reference-taxon evidence.'
 },
 {
  id:'loc-baatrup-toft-2022',level:'A1',type:'SPONTANEOUS LOCOMOTION',
  title:'Baatrup & Toft 2022 — velocity and quiescence distributions across animals',
  citation:'Baatrup, E.; Toft, S. (2022). Biological Journal of the Linnean Society 137(2):216–226.',
  doi:'10.1093/biolinnean/blac098',url:'https://doi.org/10.1093/biolinnean/blac098',
  supports:['oniscus-asellus.preferred-walking-velocity','oniscus-asellus.quiescence','porcellio-scaber.preferred-walking-velocity'],
  method:'Automated video tracking; O. asellus and P. scaber at 20 °C under light conditions.',
  limitations:'Velocity peaks describe the experimental spontaneous/exploratory context, not universal maximum speed.'
 },
 {
  id:'loc-tuck-hassall-vulgare-2004',level:'A1',type:'FORAGING LOCOMOTION',
  title:'Tuck & Hassall 2004 — foraging behaviour of Armadillidium vulgare in heterogeneous environments',
  citation:'Tuck, J.M.; Hassall, M. (2004). Behaviour 141(2):233–244.',
  doi:'10.1163/156853904322890834',url:'https://doi.org/10.1163/156853904322890834',
  supports:['armadillidium-vulgare.food-patch-speed','armadillidium-vulgare.turning-frequency','armadillidium-vulgare.turning-angle'],
  method:'Laboratory arenas with spatially heterogeneous high- and low-quality food.',
  limitations:'Foraging-context movement; does not define a single species-wide speed constant.'
 },
 {
  id:'loc-bmig-muscorum',level:'A2',type:'FIELD IDENTIFICATION / BEHAVIOUR',
  title:'British Myriapod and Isopod Group — Philoscia muscorum',
  citation:'BMIG species account: Philoscia muscorum.',
  doi:null,url:'https://bmig.org.uk/species/philoscia-muscorum',
  supports:['philoscia-muscorum.rapid-runner'],
  method:'Specialist identification and natural-history account.',
  limitations:'Qualitative locomotor description, not a controlled speed measurement.'
 },
 {
  id:'loc-augusiak-asellus-2015',level:'A1',type:'AQUATIC MOVEMENT / VIDEO TRACKING',
  title:'Augusiak & Van den Brink 2015 — movement behaviour of benthic macroinvertebrates with automated video tracking',
  citation:'Augusiak, J.; Van den Brink, P.J. (2015). Ecology and Evolution 5(8):1563–1575.',
  doi:'10.1002/ece3.1425',url:'https://doi.org/10.1002/ece3.1425',
  supports:['asellus-aquaticus.crawling','asellus-aquaticus.resting','asellus-aquaticus.step-length-density-response'],
  method:'Automated video tracking of the crawling isopod Asellus aquaticus under controlled conditions and density treatments.',
  limitations:'Supports locomotor mode and context sensitivity; no project coefficient is a direct conversion of paper measurements.'
 },
 {
  id:'loc-clarkin-idotea-2012',level:'A1',type:'SWIMMING ORIENTATION / RAFT COLONISATION',
  title:'Clarkin et al. 2012 — colonization of macroalgal rafts by Idotea',
  citation:'Clarkin, E.; Maggs, C.A.; Arnott, G.; Briggs, S.; Houghton, J.D.R. (2012). JMBA 92(6):1273–1282.',
  doi:'10.1017/S0025315411002013',url:'https://doi.org/10.1017/S0025315411002013',
  supports:['idotea-granulosa.active-swimming','idotea-granulosa.ascent-bias','idotea-balthica.active-swimming','idotea-balthica.descent-bias','idotea-balthica.passive-sinking'],
  method:'Laboratory orientation and habitat-choice experiments plus field trials.',
  limitations:'Strong evidence for direction and swimming mode in the tested context; not a direct comparison of absolute swimming speeds.'
 },
 {
  id:'loc-gutow-baltica-2006',level:'A1',type:'LOCOMOTOR ACTIVITY / RAFTING',
  title:'Gutow et al. 2006 — behavioural and metabolic adaptations of marine isopods to rafting',
  citation:'Gutow, L.; Strahl, J.; Wiencke, C.; Franke, H.-D.; Saborowski, R. (2006). Marine Biology 149:821–828.',
  doi:'10.1007/s00227-006-0257-9',url:'https://doi.org/10.1007/s00227-006-0257-9',
  supports:['idotea-balthica.activity','idotea-balthica.water-column-excursions','idotea-balthica.substrate-movement'],
  method:'Laboratory behavioural comparison of I. baltica and I. metallica.',
  limitations:'Comparative activity evidence; normalized game kinetics are not measured speed values.'
 }
]);

export const locomotionSourceById=id=>LOCOMOTION_SOURCES.find(source=>source.id===id)||null;
