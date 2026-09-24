import {LOCOMOTION_SOURCES,locomotionSourceById} from './data/locomotion/sources.mjs';

export const LOCOMOTION_SCHEMA_VERSION=1;
export const LOCOMOTION_EVIDENCE_BASIS=Object.freeze([
 'direct_measurement','direct_qualitative','reference_taxon_transfer','related_taxon_transfer','game_proxy'
]);

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const clone=value=>structuredClone(value);
const conglobationOf=species=>species?.visual?.conglobation?.ability||species?.profile?.conglobation||'unknown';
const habitatOf=species=>species?.game?.habitats?.[0]||species?.game?.habitat||species?.profile?.ecology?.find(x=>/freshwater|marine|intertidal/i.test(x))||'terrestrial';
const aquaticDomain=species=>/freshwater|marine|intertidal|estuary|brackish|shallow|abyssal/i.test(String(habitatOf(species)));

function baseProfile(species){
 const aquatic=aquaticDomain(species),roll=conglobationOf(species),legacy=Number(species?.speed);
 const cruise=Number.isFinite(legacy)?legacy:(aquatic?.8:.82);
 return {
  schemaVersion:LOCOMOTION_SCHEMA_VERSION,
  hidden:true,
  domain:aquatic?'aquatic':'terrestrial',
  capabilities:{
   crawl:true,climb:!aquatic,cling:true,
   swim:aquatic,drift:aquatic,conglobate:roll==='full'||roll==='partial'
  },
  research:{
   basis:'game_proxy',confidence:'low',reviewedOn:'2026-09-22',referenceTaxon:species?.taxon||species?.name||species?.id,
   sourceIds:[],measurements:[],claims:[],contextualEffects:[],
   limitations:['No species-specific locomotion evidence is attached yet; coefficients are simulation proxies.'],
   reviewNeeded:true
  },
  simulation:{
   cruise:clamp(cruise,.45,1.35),
   burst:roll==='full'?1.08:roll==='partial'?1.18:1.32,
   gaitFrequency:1,
   turnRate:1,
   pauseDurationScale:clamp(1.45-cruise*.5,.72,1.25),
   reactionLatencyScale:roll==='full'?.92:1,
   modeScale:{crawl:1,climb:aquatic?0:.72,cling:.34,swim:aquatic?1:0,drift:aquatic?.62:0},
   disturbanceStrategy:roll==='full'?'curl':roll==='partial'?'freeze_or_run':aquatic?'cling_or_swim':'run_or_cling',
   tags:[aquatic?'aquatic':'terrestrial',roll==='full'?'roller':roll==='partial'?'partial-roller':'non-conglobating'],
   tuningNotes:[Number.isFinite(legacy)?'Cruise starts from the pre-schema species speed so existing animation balance is preserved.':'Cruise uses the domain fallback because no legacy speed was present.']
  }
 };
}

const CURATED=Object.freeze({
 dairy:{
  research:{
   basis:'reference_taxon_transfer',confidence:'medium',referenceTaxon:'Porcellio laevis',
   sourceIds:['loc-dailey-laevis-2009'],
   measurements:[
    {metric:'temperatureCoefficientQ10',value:1.64,unit:'ratio',conditions:'15–35 °C racetrack trials',sourceIds:['loc-dailey-laevis-2009']},
    {metric:'bodyMassScalingExponent',range:[.38,.63],unit:'dimensionless',conditions:'observed speed vs body mass across test temperatures',sourceIds:['loc-dailey-laevis-2009']},
    {metric:'desiccationPerformanceThreshold',value:10,unit:'percent initial body mass lost',conditions:'speed declined progressively beyond this loss',sourceIds:['loc-dailey-laevis-2009']}
   ],
   claims:[
    {field:'defence',value:'active escape important under exposed conditions',support:'direct_qualitative',sourceIds:['loc-dailey-laevis-2009']}
   ],
   contextualEffects:[
    {factor:'temperature',effect:'speed increased across the tested thermal range',sourceIds:['loc-dailey-laevis-2009']},
    {factor:'bodyMass',effect:'larger animals were faster within treatments',sourceIds:['loc-dailey-laevis-2009']},
    {factor:'desiccation',effect:'moderate loss had little effect; stronger loss reduced performance',sourceIds:['loc-dailey-laevis-2009']}
   ],
   limitations:['The game line is Porcellio cf. laevis “Dairy Cow”; evidence is transferred from identified P. laevis and is not treated as line-specific measurement.'],
   reviewNeeded:false
  },
  simulation:{cruise:1.20,burst:1.42,gaitFrequency:1.12,turnRate:1.06,pauseDurationScale:.82,reactionLatencyScale:.86,disturbanceStrategy:'run',tags:['terrestrial','runner','non-conglobating','reference-taxon-evidence']}
 },
 vulgare:{
  research:{
   basis:'direct_qualitative',confidence:'medium',referenceTaxon:'Armadillidium vulgare',
   sourceIds:['loc-tuck-hassall-vulgare-2004'],
   measurements:[],
   claims:[
    {field:'foragingSpeed',value:'lower in high-quality food patches than low-quality background',support:'direct_qualitative',sourceIds:['loc-tuck-hassall-vulgare-2004']},
    {field:'turning',value:'turning frequency and angle higher in high-quality food patches',support:'direct_qualitative',sourceIds:['loc-tuck-hassall-vulgare-2004']}
   ],
   contextualEffects:[{factor:'foodPatchQuality',effect:'changes walking speed and turning pattern',sourceIds:['loc-tuck-hassall-vulgare-2004']}],
   limitations:['Foraging-context evidence constrains behaviour but does not provide a universal cruise-speed constant for the simulation.'],
   reviewNeeded:false
  },
  simulation:{cruise:.76,burst:1.06,turnRate:1.10,pauseDurationScale:1.08,reactionLatencyScale:.92,disturbanceStrategy:'curl',tags:['terrestrial','roller','foraging-context-sensitive']}
 },
 asellus:{
  research:{
   basis:'direct_measurement',confidence:'high',referenceTaxon:'Oniscus asellus',
   sourceIds:['loc-baatrup-toft-2022'],
   measurements:[
    {metric:'preferredWalkingVelocityMode',value:5,unit:'mm/s',conditions:'20 °C, light, spontaneous/exploratory tracking; approximate distribution peak',sourceIds:['loc-baatrup-toft-2022']}
   ],
   claims:[
    {field:'velocityDistribution',value:'unimodal spontaneous walking distribution in the experiment',support:'direct_measurement',sourceIds:['loc-baatrup-toft-2022']}
   ],
   contextualEffects:[{factor:'light',effect:'authors note light likely elevated exploratory movement toward dark/humid refuge',sourceIds:['loc-baatrup-toft-2022']}],
   limitations:['The ~5 mm/s value is an experimental distribution mode, not a maximum speed and not a universal field value.'],
   reviewNeeded:false
  },
  simulation:{cruise:.72,burst:1.16,gaitFrequency:.94,turnRate:.96,pauseDurationScale:1.05,disturbanceStrategy:'cling_or_freeze',tags:['terrestrial','clinger','measured-exploratory-pace']}
 },
 muscorum:{
  research:{
   basis:'direct_qualitative',confidence:'medium',referenceTaxon:'Philoscia muscorum',
   sourceIds:['loc-bmig-muscorum'],
   measurements:[],
   claims:[{field:'locomotorStyle',value:'rapid runner',support:'direct_qualitative',sourceIds:['loc-bmig-muscorum']}],
   contextualEffects:[],
   limitations:['Specialist account supports a rapid-running style but not an absolute speed coefficient.'],
   reviewNeeded:false
  },
  simulation:{cruise:1.10,burst:1.48,gaitFrequency:1.18,turnRate:1.12,pauseDurationScale:.76,reactionLatencyScale:.82,disturbanceStrategy:'run',tags:['terrestrial','rapid-runner','long-legged']}
 },
 aquaticus:{
  research:{
   basis:'direct_qualitative',confidence:'high',referenceTaxon:'Asellus aquaticus',
   sourceIds:['loc-augusiak-asellus-2015'],
   measurements:[],
   claims:[
    {field:'locomotorMode',value:'benthic crawling',support:'direct_qualitative',sourceIds:['loc-augusiak-asellus-2015']},
    {field:'densityResponse',value:'resting behaviour and movement parameters change with population density',support:'direct_measurement',sourceIds:['loc-augusiak-asellus-2015']}
   ],
   contextualEffects:[{factor:'populationDensity',effect:'higher densities altered resting behaviour; step-length response differed from the swimming amphipod comparison',sourceIds:['loc-augusiak-asellus-2015']}],
   limitations:['The paper validates crawling mode and movement metrics; the normalized game cruise coefficient is not a conversion from an absolute speed measurement.'],
   reviewNeeded:false
  },
  capabilities:{crawl:true,climb:false,cling:true,swim:false,drift:false,conglobate:false},
  simulation:{cruise:.78,burst:1.18,gaitFrequency:.96,turnRate:.98,pauseDurationScale:1.05,modeScale:{crawl:1,climb:0,cling:.38,swim:0,drift:0},disturbanceStrategy:'crawl_to_cover',tags:['aquatic','benthic-crawler','asellid']}
 },
 meridianus:{
  research:{
   basis:'related_taxon_transfer',confidence:'low',referenceTaxon:'Proasellus meridianus',
   sourceIds:['loc-augusiak-asellus-2015'],measurements:[],
   claims:[{field:'locomotorModel',value:'Asellidae benthic-crawler prior; species-specific speed unknown',support:'related_taxon_transfer',sourceIds:['loc-augusiak-asellus-2015']}],
   contextualEffects:[],limitations:['Evidence source is A. aquaticus, not P. meridianus. Used only to constrain locomotor mode, not to claim species speed.'],reviewNeeded:true
  },
  capabilities:{crawl:true,climb:false,cling:true,swim:false,drift:false,conglobate:false},
  simulation:{cruise:.72,burst:1.16,modeScale:{crawl:1,climb:0,cling:.40,swim:0,drift:0},disturbanceStrategy:'crawl_to_cover',tags:['aquatic','benthic-crawler','asellid','transfer-evidence']}
 },
 coxalis:{
  research:{
   basis:'related_taxon_transfer',confidence:'low',referenceTaxon:'Proasellus coxalis',
   sourceIds:['loc-augusiak-asellus-2015'],measurements:[],
   claims:[{field:'locomotorModel',value:'Asellidae benthic-crawler prior; species-specific speed unknown',support:'related_taxon_transfer',sourceIds:['loc-augusiak-asellus-2015']}],
   contextualEffects:[],limitations:['Evidence source is A. aquaticus, not P. coxalis. Used only to constrain locomotor mode, not to claim species speed.'],reviewNeeded:true
  },
  capabilities:{crawl:true,climb:false,cling:true,swim:false,drift:false,conglobate:false},
  simulation:{cruise:.76,burst:1.16,modeScale:{crawl:1,climb:0,cling:.40,swim:0,drift:0},disturbanceStrategy:'crawl_to_cover',tags:['aquatic','benthic-crawler','asellid','transfer-evidence']}
 },
 balthica:{
  research:{
   basis:'direct_qualitative',confidence:'high',referenceTaxon:'Idotea balthica',
   sourceIds:['loc-clarkin-idotea-2012','loc-gutow-baltica-2006'],measurements:[],
   claims:[
    {field:'swimming',value:'active swimming and water-column excursions documented',support:'direct_qualitative',sourceIds:['loc-clarkin-idotea-2012','loc-gutow-baltica-2006']},
    {field:'orientation',value:'active descent predominated in the Clarkin et al. release experiments',support:'direct_measurement',sourceIds:['loc-clarkin-idotea-2012']},
    {field:'activity',value:'more frequent movement on substratum, sediment, algae and in the water column than I. metallica',support:'direct_qualitative',sourceIds:['loc-gutow-baltica-2006']}
   ],
   contextualEffects:[],limitations:['Sources support activity, swimming and orientation, not a species-wide absolute speed.'],reviewNeeded:false
  },
  capabilities:{crawl:true,climb:false,cling:true,swim:true,drift:true,conglobate:false},
  simulation:{cruise:1.02,burst:1.30,gaitFrequency:1.08,turnRate:1.05,pauseDurationScale:.88,modeScale:{crawl:.94,climb:0,cling:.38,swim:1.10,drift:.66},disturbanceStrategy:'swim_or_cling',tags:['aquatic','idoteid','active-swimmer','water-column-excursions','descent-bias']}
 },
 granulosa:{
  research:{
   basis:'direct_measurement',confidence:'high',referenceTaxon:'Idotea granulosa',
   sourceIds:['loc-clarkin-idotea-2012'],measurements:[
    {metric:'activeAscentFrequency',range:[87,93],unit:'percent',conditions:'immediate orientation after release in two laboratory setups',sourceIds:['loc-clarkin-idotea-2012']}
   ],
   claims:[{field:'orientation',value:'strong active-swimming ascent bias in the tested release context',support:'direct_measurement',sourceIds:['loc-clarkin-idotea-2012']}],
   contextualEffects:[],limitations:['Ascent frequency is context-specific and does not measure absolute swimming speed.'],reviewNeeded:false
  },
  capabilities:{crawl:true,climb:false,cling:true,swim:true,drift:true,conglobate:false},
  simulation:{cruise:.96,burst:1.32,gaitFrequency:1.10,turnRate:1.08,pauseDurationScale:.86,modeScale:{crawl:.94,climb:0,cling:.36,swim:1.16,drift:.62},disturbanceStrategy:'swim_or_cling',tags:['aquatic','idoteid','active-swimmer','ascent-bias']}
 },
 pelagica:{
  research:{
   basis:'related_taxon_transfer',confidence:'low',referenceTaxon:'Idotea pelagica',
   sourceIds:['loc-clarkin-idotea-2012'],measurements:[],
   claims:[{field:'locomotorModel',value:'Idotea active-swimming capability used as a genus-level prior; species-specific kinetics unknown',support:'related_taxon_transfer',sourceIds:['loc-clarkin-idotea-2012']}],
   contextualEffects:[],limitations:['Clarkin et al. directly tested I. granulosa and I. balthica, not I. pelagica.'],reviewNeeded:true
  },
  capabilities:{crawl:true,climb:false,cling:true,swim:true,drift:true,conglobate:false},
  simulation:{cruise:.92,burst:1.26,modeScale:{crawl:.96,climb:0,cling:.38,swim:1.04,drift:.62},disturbanceStrategy:'swim_or_cling',tags:['aquatic','idoteid','transfer-evidence']}
 },
 emarginata:{
  research:{
   basis:'related_taxon_transfer',confidence:'low',referenceTaxon:'Idotea emarginata',
   sourceIds:['loc-clarkin-idotea-2012','loc-gutow-baltica-2006'],measurements:[],
   claims:[{field:'locomotorModel',value:'Idotea swimming/activity literature constrains an active swimmer proxy; species-specific kinetics remain unmeasured here',support:'related_taxon_transfer',sourceIds:['loc-clarkin-idotea-2012','loc-gutow-baltica-2006']}],
   contextualEffects:[],limitations:['No absolute I. emarginata speed measurement is encoded.'],reviewNeeded:true
  },
  capabilities:{crawl:true,climb:false,cling:true,swim:true,drift:true,conglobate:false},
  simulation:{cruise:1.08,burst:1.34,gaitFrequency:1.12,modeScale:{crawl:.94,climb:0,cling:.35,swim:1.14,drift:.68},disturbanceStrategy:'swim_or_cling',tags:['aquatic','idoteid','active-swimmer-proxy','transfer-evidence']}
 },
 neglecta:{
  research:{
   basis:'related_taxon_transfer',confidence:'low',referenceTaxon:'Idotea neglecta',
   sourceIds:['loc-clarkin-idotea-2012','loc-gutow-baltica-2006'],measurements:[],
   claims:[{field:'locomotorModel',value:'Idotea swimming/activity literature constrains the proxy; species-specific kinetics unknown',support:'related_taxon_transfer',sourceIds:['loc-clarkin-idotea-2012','loc-gutow-baltica-2006']}],
   contextualEffects:[],limitations:['No absolute I. neglecta speed measurement is encoded.'],reviewNeeded:true
  },
  capabilities:{crawl:true,climb:false,cling:true,swim:true,drift:true,conglobate:false},
  simulation:{cruise:.94,burst:1.28,modeScale:{crawl:.96,climb:0,cling:.38,swim:1.06,drift:.66},disturbanceStrategy:'swim_or_cling',tags:['aquatic','idoteid','transfer-evidence']}
 }
});

function mergeProfile(base,override={}){
 const out=clone(base);
 if(override.capabilities)out.capabilities={...out.capabilities,...override.capabilities};
 if(override.research)out.research={...out.research,...clone(override.research)};
 if(override.simulation){
  out.simulation={...out.simulation,...clone(override.simulation)};
  if(override.simulation.modeScale)out.simulation.modeScale={...base.simulation.modeScale,...override.simulation.modeScale};
 }
 return out;
}

export function locomotionFor(species){
 const profile=mergeProfile(baseProfile(species),CURATED[species?.id]);
 profile.simulation.cruise=clamp(Number(profile.simulation.cruise)||.8,.45,1.35);
 profile.simulation.burst=clamp(Number(profile.simulation.burst)||1,1,1.7);
 profile.simulation.gaitFrequency=clamp(Number(profile.simulation.gaitFrequency)||1,.6,1.5);
 profile.simulation.turnRate=clamp(Number(profile.simulation.turnRate)||1,.6,1.5);
 profile.simulation.pauseDurationScale=clamp(Number(profile.simulation.pauseDurationScale)||1,.55,1.5);
 profile.simulation.reactionLatencyScale=clamp(Number(profile.simulation.reactionLatencyScale)||1,.55,1.5);
 profile.provenance={
  public:false,
  derivedFrom:CURATED[species?.id]?'curated-locomotion-profile':'legacy-speed-proxy',
  legacySpeed:Number.isFinite(Number(species?.speed))?Number(species.speed):null,
  note:'Research evidence and normalized simulation coefficients are deliberately separate.'
 };
 return profile;
}

export function applyLocomotionProfile(species){
 const locomotion=locomotionFor(species);
 // Keep speed as a compatibility alias for old render code; new code should read locomotion.simulation.
 return {...species,locomotion,speed:locomotion.simulation.cruise};
}

export function locomotionModeScale(speciesOrProfile,mode='crawl'){
 const profile=speciesOrProfile?.simulation?speciesOrProfile:speciesOrProfile?.locomotion;
 return Number(profile?.simulation?.modeScale?.[mode]??profile?.modeScale?.[mode]??1);
}

export function locomotionSourceIds(profile){
 return [...new Set(profile?.research?.sourceIds||[])];
}

export function validateLocomotionProfile(profile){
 const errors=[];
 if(profile?.schemaVersion!==LOCOMOTION_SCHEMA_VERSION)errors.push('schemaVersion');
 if(!LOCOMOTION_EVIDENCE_BASIS.includes(profile?.research?.basis))errors.push('research.basis');
 for(const id of locomotionSourceIds(profile))if(!locomotionSourceById(id))errors.push('missing-source:'+id);
 for(const key of ['cruise','burst','gaitFrequency','turnRate','pauseDurationScale','reactionLatencyScale'])if(!Number.isFinite(profile?.simulation?.[key]))errors.push('simulation.'+key);
 for(const [mode,value] of Object.entries(profile?.simulation?.modeScale||{}))if(!Number.isFinite(value))errors.push('modeScale.'+mode);
 return errors;
}

export {LOCOMOTION_SOURCES};
