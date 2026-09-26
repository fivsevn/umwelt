import {createShoreControls} from './shore-controls.mjs';
import {isShore,shoreText,shorePoint,shoreProgress,shoreRain,moveShore,SHORE_TURNS} from './data/habitats/estuary-shore.mjs';
import {isopodNumbers} from './locales/isopod.mjs';
import {isSeaweed,seaweedProgress} from './data/habitats/seaweed-observation.mjs';
import {checkMicroscope,petriReady} from './scenery/petri.mjs';
import {createPetriControls} from './petri-controls.mjs';
import {isIntertidal,intertidalIndex,intertidalTime} from './data/narrative/intertidal.mjs';
import {isEstuaryObservation,estuaryProgress,estuaryRecords,estuarySummary,estuaryRecordLine,ESTUARY_KIND} from './data/narrative/estuary.mjs';
import {observationTitle,environmentScale} from './observation-header.mjs';
import {groundwaterProgress} from './data/habitats/groundwater-observation.mjs';
import {habitatConfig,cycleHabitat} from './habitats.mjs';
import {AQUATIC_ENDINGS,aquaticFeedback} from './aquatic-story.mjs';
import {renderCatalog,renderSources} from './catalog.mjs';
import {SPECIES,speciesById} from './species-registry.mjs';
import {ENDINGS as LAND_ENDINGS} from './content.mjs';
import {createRun,validRun,migrateV3,migrateV4,runSpecies,migrateLegacy,ensureScene,choose,advance,timeFor,recordDirectInteraction,endingMemoryFor} from './engine.mjs';
import {makeBug,makeIsopod,renderModel,exuviaPixels} from './sprites.mjs';
import {createHabitat} from './habitat.mjs';
import {restoreCollection,drawCohort,unlock} from './collection.mjs';
import {encounterById,encounterFor} from './encounters.mjs';
import {iconButton,createInstrument} from './ui.mjs';
import {getLanguage,t,formatShortDate,speciesPrimaryName,isopodWaveNumber,isopodWaveDate} from './i18n.mjs';
import {gameText} from './locales/game.mjs';
const ENDINGS=[...LAND_ENDINGS,...AQUATIC_ENDINGS];
const $=s=>document.querySelector(s),KEY='isopoda-fugue-v4',ARCHIVE='isopoda-fugue-endings-v3',COLLECTION='isopoda-fieldnotes-v1',DISCOVERIES='isopoda-interaction-discoveries-v1';
function read(key){try{return JSON.parse(localStorage.getItem(key))}catch{return null}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{$('#storageNotice').hidden=false;$('#storageNotice').textContent=t('storageNotice')}}
const shoreControls=createShoreControls($('#shorePrev'),$('#shoreNext'));
const stored=migrateV4(read(KEY))||migrateV3(read('isopoda-fugue-v3')),legacy=read('umwelt-isopod-v1');let hasRun=validRun(stored)||!!legacy;
let state=validRun(stored)?stored:legacy?migrateLegacy(legacy,Date.now()>>>0):createRun('dairy',0);
const requestedHabitat=new URLSearchParams(location.search).get('habitat');
let selectedHabitat=requestedHabitat&&habitatConfig(requestedHabitat).id===requestedHabitat?requestedHabitat:state.habitatId||'terrestrial',previewState=createRun('dairy',4107,selectedHabitat);
let learnedInteractions=read(DISCOVERIES);if(!learnedInteractions||typeof learnedInteractions!=='object')learnedInteractions={};
function mergeLearnedInteractions(target){
 target.interactionDiscoveries=target.interactionDiscoveries&&typeof target.interactionDiscoveries==='object'?target.interactionDiscoveries:{};
 const past=Array.isArray(target.directRecords)?target.directRecords:[];
 for(const key of ['tap','grab','lift','collect','dig','seaweed']){
  const seen=key==='dig'?target.habitatId==='sandy-surf'&&past.some(r=>['ground','grab'].includes(r.type)):key==='grab'?past.some(r=>r.type==='grab'||r.type==='place'):past.some(r=>r.type===key);
  target.interactionDiscoveries[key]=!!target.interactionDiscoveries[key]||!!learnedInteractions[key]||seen;
  if(target.interactionDiscoveries[key])learnedInteractions[key]=true;
 }
 write(DISCOVERIES,learnedInteractions);
}
mergeLearnedInteractions(state);
let archives=read(ARCHIVE);if(!Array.isArray(archives))archives=[];archives=archives.filter(a=>a&&ENDINGS.some(e=>e.id===a.id));
let collection=restoreCollection(read(COLLECTION),hasRun?state:null,archives);write(COLLECTION,collection);
let playing=false,sound=false,audio,drawerMode='catalog',page=0,lastScene=null,referenceReturn=null;
let lastInterfaceLanguage=getLanguage();
const habitat=createHabitat($('#habitat'),$('#critters'),()=>state,event=>{if(!playing||state.stage==='ended')return;if(event.type==='microscope'){checkMicroscope(state,event.visible);save();render();return}const record=recordDirectInteraction(state,event);if(record){mergeLearnedInteractions(state);save();render()}});
const refreshPetri=createPetriControls($('#habitat').closest('.habitat-viewport'),habitat,()=>state,getLanguage);
const emptyHabitat=createHabitat($('#emptyHabitat'),$('#emptyCritters'),()=>previewState);
const instrument=createInstrument($('#instruments'));
function refreshIconLabels(){for(const [id,kind,label] of [['soundBtn','sound',sound?t('soundOff'):t('soundOn')],['catalogBtn','book',t('archive')],['sourcesBtn','source',t('sources')],['journalBtn','pencil',t('journal')],['zoomOut',state.habitatId==='groundwater'?'triangleDown':'minus',t(state.habitatId==='groundwater'?'beamSmaller':state.habitatId==='abyssal'?'pullBack':'zoomOut')],['zoomIn',state.habitatId==='groundwater'?'triangleUp':'plus',t(state.habitatId==='groundwater'?'beamLarger':state.habitatId==='abyssal'?'comeCloser':'zoomIn')],['zoomReset',state.habitatId==='groundwater'?'joystick':'center',t(state.habitatId==='groundwater'?'beamJoystick':'zoomReset')]])iconButton($('#'+id),kind,label)}
refreshIconLabels();
function save(){write(KEY,state)}
const ISOPOD_WAVES=['▁','▂','▃','▄','▅','▆','▇'];
function isopodWaveTime(time){
 const [hour,minute]=time.split(':').map(Number);
 return isopodWaveNumber(hour)+isopodWaveNumber(minute);
}
function isopodWaveClock(date,time){
 return isopodWaveDate(date)+'\u2009'+isopodWaveTime(time);
}
function setWaveText(el,value){
 const text=String(value??'');
 if(getLanguage()!=='isopod'||![...text].some(ch=>ISOPOD_WAVES.includes(ch))){el.textContent=text;return}
 const fragment=document.createDocumentFragment();
 for(const ch of text){
  if(ISOPOD_WAVES.includes(ch)){
   const span=document.createElement('span');span.className='isopod-wave-glyph';span.textContent=ch;fragment.append(span);
  }else fragment.append(document.createTextNode(ch));
 }
 el.replaceChildren(fragment);
}
function clock(day=state.day,period=state.period){
 const scale=environmentScale(state,getLanguage());if(scale)return scale.value;
 const date=state.startedOn?new Date(state.startedOn+'T12:00:00'):null;
 if(date)date.setDate(date.getDate()+day-1);
 const time=timeFor(state.seed,day,period);
 if(getLanguage()==='isopod'&&date)return isopodWaveClock(date,time);
 return (date?formatShortDate(date):t('dayNumber',{day}))+' '+time;
}
function refreshHeaderClock(){
 if($('#playView').hidden)return;
 const scale=environmentScale(state,getLanguage());
 const date=new Date(),time=String(date.getHours()).padStart(2,'0')+':'+String(date.getMinutes()).padStart(2,'0');
 const value=scale?.value||((state.habitatId==='terrestrial'||state.intertidalLegacy||state.habitatId==='shallow-marine')?clock():(getLanguage()==='isopod'?isopodWaveClock(date,time):formatShortDate(date)+' '+time));
 setWaveText($('#dayLabel'),value);$('#dayLabel').title=scale?.label||'';
}
setInterval(refreshHeaderClock,1000);
window.addEventListener('focus',refreshHeaderClock);
document.addEventListener('visibilitychange',refreshHeaderClock);
function sceneNow(){
 // Replace pending legacy counting scenes without erasing past feedback or records.
 if(state.stage==='choice'&&state.scene?.kind==='count')state.scene=null;
 const scene=ensureScene(state);if(!scene.encounter&&!habitatConfig(state).aquatic)scene.encounter=encounterFor(state).id;return scene;
}
function buttons(scene){$('#actions').hidden=isShore(state);$('#actions').replaceChildren();if(isShore(state))return;for(const o of scene.options){const b=document.createElement('button');b.className='action';b.dataset.directLocale='true';b.textContent=gameText(o.label,getLanguage());b.disabled=state.stage!=='choice'||(state.habitatId==='petri-dish'&&!petriReady(state));b.onclick=()=>act(o.id);$('#actions').append(b)}}
function render(){
 const shore=isShore(state);shoreControls(state,getLanguage());
 if(state.habitatId==='petri-dish')checkMicroscope(state,habitat.scopeVisible());refreshPetri();
 const scene=sceneNow(),config=habitatConfig(state),p=speciesById(state.cohort[0].species),encounter=encounterById(scene.encounter);
 $('#habitat').setAttribute('aria-label',isShore(state)?shoreText('canvas',getLanguage()):config.id==='petri-dish'?gameText('petri:canvas',getLanguage()):t(config.id==='groundwater'?'caveCanvas':config.cohortSize===1?'habitatCanvasSingle':'habitatCanvas'));refreshHeaderClock();$('#recordTitle').textContent=state.stage==='feedback'?t('recordLater'):t('recordNow');$('#observation').dataset.directLocale='true';$('#observation').textContent=gameText(state.stage==='feedback'?state.feedback:scene.text,getLanguage());
 if(shore){if(shoreProgress(state)===0&&!state.shoreIntroDone)$('#observation').textContent=shoreText('intro',getLanguage());if(shoreRain(state))$('#observation').textContent+=' '+shoreText('rain',getLanguage());if(state.shoreNotice)$('#observation').textContent=shoreText('recorded',getLanguage())+' '+$('#observation').textContent;}
 const waterFeedback=habitatConfig(state).aquatic&&state.stage==='feedback'?aquaticFeedback(state):'';if(waterFeedback)$('#observation').textContent+=' '+gameText(waterFeedback,getLanguage());
 $('#activityLabel').textContent=observationTitle(state,scene,encounter,getLanguage());$('#activityLabel').dataset.motion=encounter?.motion||'';
 const cue=state.habitatId==='petri-dish'&&state.stage==='choice'&&!petriReady(state)?'petri:gate:'+scene.requirement:state.stage==='feedback'?(state.interactionIntent?.hint||''):'';const shoreCue=shore?shoreText(state.shoreIntroDone?'linger':'hint',getLanguage()):'';$('#interactionCue').hidden=!(cue||shoreCue);$('#interactionCue').dataset.directLocale='true';$('#interactionCue').textContent=shoreCue||gameText(cue,getLanguage());
 $('#nextBtn').disabled=state.stage!=='feedback';
 const nextTime=timeFor(state.seed,state.period===2?state.day+1:state.day,(state.period+1)%3);
 const nextTimeLabel=getLanguage()==='isopod'?isopodWaveTime(nextTime):nextTime;
 if(state.habitatId==='petri-dish'){setWaveText($('#nextBtn'),state.stage==='choice'?t('holdMoment'):state.day===3&&state.period===2?t('closeGently'):t('continueObservation'));
 }else if(state.habitatId==='sandy-surf'){
  setWaveText($('#nextBtn'),state.stage==='choice'?t('holdMoment'):state.day===3&&state.period===2?t('closeGently'):t('continueObservation'));
 }else if(isIntertidal(state)){
  setWaveText($('#nextBtn'),state.stage==='choice'?t('holdMoment'):intertidalIndex(state)===8?t('closeGently'):t('continueObservation'));
 }else if(isSeaweed(state)){
  setWaveText($('#nextBtn'),state.stage==='choice'?t('holdMoment'):seaweedProgress(state)>=9?t('closeGently'):t('continueObservation'));
 }else if(isEstuaryObservation(state)){
  setWaveText($('#nextBtn'),state.stage==='choice'?t('holdMoment'):estuaryProgress(state)>=config.turns?t('closeGently'):t('continueObservation'));
 }else if(config.sequence==='freshwater-material'||config.sequence==='groundwater-pulse'){
  const kind=config.sequence==='freshwater-material'?'freshwater-material':'groundwater-pulse';
  const completed=config.id==='groundwater'?groundwaterProgress(state):(Array.isArray(state.records)?state.records:[]).filter(record=>record.kind===kind).length;
  setWaveText($('#nextBtn'),state.stage==='choice'?t('holdMoment'):completed>=config.turns?t('closeGently'):t('continueObservation'));
 }else if(config.dialogue){
  const completed=(Array.isArray(state.records)?state.records:[]).filter(record=>record.kind==='abyssal-dialogue').length;
  setWaveText($('#nextBtn'),state.stage==='choice'?t('holdMoment'):completed>=config.turns?t('closeGently'):t('continueObservation'));
 }else setWaveText($('#nextBtn'),state.stage==='choice'?t('holdMoment'):state.day===config.days&&state.period===2?t('closeGently'):t('later',{time:nextTimeLabel}));
 if(shore){$('#nextBtn').disabled=false;setWaveText($('#nextBtn'),shoreProgress(state)>=SHORE_TURNS-1?t('closeGently'):t('continueObservation'));}
 buttons(scene);$('#miniView').replaceChildren();$('#miniView').hidden=true;
 if(state.stage==='choice'&&scene.kind==='count'){$('#miniView').hidden=false;for(let i=0;i<scene.count;i++)$('#miniView').append(makeBug(p,i))}
 if(lastScene!==scene.id){habitat.stage(scene);lastScene=scene.id}
 instrument(state);save();
}
function batchBugs(unique=false){return (unique?state.cohort.filter((c,i,all)=>all.findIndex(o=>o.species===c.species)===i):state.cohort).map(c=>{const bug=makeIsopod(speciesById(c.species),{seed:c.seed,stage:c.stage});bug.dataset.specimen=c.id;bug.dataset.species=c.species;bug.title=`${c.id} · ${speciesPrimaryName(speciesById(c.species))}`;return bug})}
function arrival(){$('#settleBtn').textContent=state.habitatId==='sandy-surf'?gameText('sand:start',getLanguage()):t('startObservation');playing=false;habitat.stop();$('#titleCard').hidden=true;$('#playView').hidden=true;$('#endCard').hidden=true;$('#arrivalCard').hidden=false;$('#dayLabel').textContent='';$('#arrivalCard .panel-caption').textContent=isSeaweed(state)?gameText('kelp:arrival',getLanguage()):state.habitatId==='petri-dish'?gameText('petri:arrival',getLanguage()):state.habitatId==='sandy-surf'?gameText('sand:arrival',getLanguage()):isShore(state)?shoreText('arrival',getLanguage()):t(state.habitatId==='groundwater'?'findSamples':'waitingSpecimens');$('#arrivalSpecimens').classList.toggle('cave-samples',state.habitatId==='groundwater');$('#arrivalSpecimens').classList.toggle('seaweed-samples',isSeaweed(state));$('#arrivalSpecimens').replaceChildren(...batchBugs(state.habitatId==='groundwater'||isSeaweed(state)))}
function draw(){if($('#startBtn').disabled)return;$('#startBtn').disabled=true;const seed=Date.now()>>>0,cohort=drawCohort(collection,seed,selectedHabitat);state=createRun(cohort[0].species,seed,selectedHabitat);state.cohort=cohort;mergeLearnedInteractions(state);state.arrivalPending=true;hasRun=true;collection.draws++;for(const id of runSpecies(state))unlock(collection,id,state.startedOn);write(COLLECTION,collection);save();begin();tone(130)}
function begin(){
 if(!hasRun)return;emptyHabitat.stop();if(state.arrivalPending){arrival();return}
 $('#titleCard').hidden=true;$('#arrivalCard').hidden=true;$('#endCard').hidden=true;$('#habitatLibrary').append($('#catalogBtn'));playing=true;
 if(state.stage==='ended'){showEnd();return}
 $('#playView').hidden=false;lastScene=null;sceneNow();habitat.reset();habitat.home();$('#zoomLevel').textContent=state.habitatId==='groundwater'?habitat.beamHome()+'%':'1×';refreshIconLabels();render();habitat.start();
}
function act(id){const option=ensureScene(state).options.find(o=>o.id===id);if(!choose(state,id))return;if(!state.interactionIntent)habitat.react(option?.animation||id);tone(130);render()}
function next(){if(isShore(state)&&state.stage==='choice'){if(!choose(state,'shore-watch'))return;state.shoreIntroDone=true;state.shoreNotice=!!state.records.at(-1)?.evidence?.found;}if(!advance(state))return;tone(95);save();if(state.stage==='ended'){showEnd();return}render()}
function drawEndMolts(){
 const canvas=$('#endMolts'),panel=canvas?.closest('.molt-result-panel'),shells=Array.isArray(state.collectedShells)?state.collectedShells.slice(-8):[];if(!canvas)return;
 if(panel)panel.hidden=!shells.length;canvas.hidden=!shells.length;if(!shells.length)return;
 const slot=56,w=Math.max(96,shells.length*slot+16),h=58;canvas.width=w;canvas.height=h;canvas.style.width=Math.min(420,Math.round(w*1.45))+'px';canvas.style.height=Math.round(h*1.45)+'px';
 const g=canvas.getContext('2d');g.clearRect(0,0,w,h);g.imageSmoothingEnabled=false;
 shells.forEach((shell,index)=>{
  const specimen=state.cohort?.find(c=>c.id===shell.specimen)||state.cohort?.[0],species=speciesById(specimen?.species||state.cohort?.[0]?.species||'dairy');
  const model=renderModel(species.visual,{stage:specimen?.stage||'M',seed:specimen?.seed||shell.id});
  const cells=exuviaPixels(model,{phase:shell.phase||'whole',age:0}),cx=8+slot*index+slot/2,cy=h/2,scale=.78;
  for(const [x,y,color] of cells){g.fillStyle=color;g.fillRect(Math.round(cx+x*scale),Math.round(cy+y*scale),1,1)}
 });
}
function showEnd(){
 habitat.stop();$('#playView').hidden=true;$('#arrivalCard').hidden=true;$('#endCard').hidden=false;$('#dayLabel').textContent='';const e=ENDINGS.find(e=>e.id===state.ending)||ENDINGS[5];setWaveText($('#endingTime'),clock());for(const id of ['endingTitle','endingBody','endingLine'])$('#'+id).dataset.directLocale='true';$('#endingTitle').textContent=gameText(e.title,getLanguage());$('#endingBody').textContent=isEstuaryObservation(state)?estuarySummary(state.records,getLanguage()):gameText(e.body,getLanguage());$('#endingLine').textContent=gameText(e.line,getLanguage());const endConfig=habitatConfig(state);$('#endCard .ending-date span:last-child').textContent=isSeaweed(state)?gameText('kelp:cycle',getLanguage()):state.habitatId==='petri-dish'?gameText('petri:cycle',getLanguage()):state.habitatId==='sandy-surf'?gameText('sand:cycle',getLanguage()):isIntertidal(state)?gameText('intertidal:cycle',getLanguage()):isShore(state)?shoreText('cycle',getLanguage()):isEstuaryObservation(state)?gameText('estuary:v1:cycle',getLanguage()):endConfig.sequence==='freshwater-material'?gameText('water:observations5',getLanguage()):endConfig.sequence==='groundwater-pulse'?gameText(state.records.some(r=>Number.isInteger(r.observationIndex))?'water:pulses4':'water:observations4',getLanguage()):endConfig.dialogue?gameText('water:abyssalRound',getLanguage()):endConfig.aquatic?gameText('water:days3',getLanguage()):t('sevenDayObservation');$('#endSpecimen').classList.toggle('cave-samples',state.habitatId==='groundwater');$('#endSpecimen').classList.toggle('seaweed-samples',isSeaweed(state));$('#endSpecimen').replaceChildren(...batchBugs(state.habitatId==='groundwater'||isSeaweed(state))); drawEndMolts();

 if(!archives.some(a=>a.run===state.seed)){archives.push({id:e.id,...(isEstuaryObservation(state)?{estuaryRecords:structuredClone(estuaryRecords(state))}:{}),run:state.seed,species:runSpecies(state),cohort:state.cohort,date:new Date().toLocaleDateString(),records:state.records.length,memory:endingMemoryFor(state),molts:(state.collectedShells||[]).map(shell=>({phase:shell.phase,specimen:shell.specimen}))});archives=archives.slice(-60);write(ARCHIVE,archives)}save();
}
function home(){playing=false;habitat.stop();$('#playView').hidden=true;$('#endCard').hidden=true;$('#arrivalCard').hidden=true;$('#titleCard').hidden=false;$('#dayLabel').textContent='';$('#startBtn').disabled=false;$('#continueBtn').hidden=!hasRun;$('#continueBtn').textContent=state.stage==='ended'?t('viewEnding'):t('continueObservation');refreshPreview()}
function tone(freq){if(!sound)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=freq;g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.12)}catch{sound=false;$('#soundBtn').setAttribute('aria-pressed','false');$('#soundBtn').setAttribute('aria-label',t('soundUnavailable'))}}
function paragraph(value,cls=''){const el=document.createElement('p');el.dataset.directLocale='true';el.textContent=gameText(value,getLanguage());el.className=cls;return el}
function drawDrawer(){
 const el=$('#drawerContent');el.replaceChildren();el.scrollTop=0;let total=1;const sourcesOnly=drawerMode==='sources';$('#drawer').dataset.mode=drawerMode;$('#drawerTabs').hidden=sourcesOnly||drawerMode==='journal';$('#sourcesBtn').hidden=drawerMode==='journal';$('#pagePrev').parentElement.hidden=sourcesOnly;$('#specimensTab').setAttribute('aria-pressed',String(drawerMode==='catalog'));$('#endingsTab').setAttribute('aria-pressed',String(drawerMode==='endings'));
 if(drawerMode==='catalog'){
  total=SPECIES.length;page=(page+total)%total;const p=SPECIES[page],known=collection.unlocked.includes(p.id);$('#drawerTitle').textContent=t('archive');el.append(renderCatalog(p,{unlocked:known,collectedOn:collection.acquired?.[p.id]}));
 }else if(drawerMode==='endings'){
  total=ENDINGS.length;page=(page+total)%total;const e=ENDINGS[page],saved=archives.some(a=>a.id===e.id);$('#drawerTitle').textContent=t('archive');const note=document.createElement('article');note.className='ending-note';if(saved){const h=document.createElement('h3');h.dataset.directLocale='true';h.textContent=gameText(e.title,getLanguage());note.append(h,paragraph(gameText(e.body,getLanguage())),paragraph(gameText(e.line,getLanguage()),'last-line'));const batches=archives.filter(a=>a.id===e.id);for(const a of batches){if(Array.isArray(a.estuaryRecords))note.append(paragraph(estuarySummary(a.estuaryRecords,getLanguage()),'ending-memory'));const taxa=Array.isArray(a.species)?a.species:[a.species];if(a.memory)note.append(paragraph(a.memory,'ending-memory'));note.append(paragraph(`${a.date} · ${taxa.map(id=>speciesPrimaryName(speciesById(id))).join(' / ')}`,'faint'))}}else{note.classList.add('unseen');const h=document.createElement('h3');h.innerHTML='&nbsp;';note.append(h,paragraph('','ending-space'),paragraph(t('emptyEnding'),'last-line'))}el.append(note);
 }else if(drawerMode==='journal'){
  total=Math.max(1,state.records.length);page=Math.max(0,Math.min(page,total-1));$('#drawerTitle').textContent=t('journalTitle');const paper=document.createElement('article');paper.className='journal-paper';if(state.records.length){const r=state.records[page],freshwaterIndex=Math.max(0,Math.floor((state.records.filter((item,i)=>i<=page&&item.kind==='freshwater-material').length-1)/2)),entryDate=isSeaweed(state)?gameText('kelp:cycle',getLanguage()):state.habitatId==='petri-dish'?gameText('petri:cycle',getLanguage()):state.habitatId==='sandy-surf'?gameText('sand:cycle',getLanguage())+' · '+(page+1)+' / 09':r.kind==='intertidal-tide'?intertidalTime(r,getLanguage())+' · '+gameText(r.storyKey+':name',getLanguage()):r.evidence?.version===2?shoreText('point:'+r.evidence.point,getLanguage())+' · '+shoreText('tide:'+r.evidence.tide,getLanguage()):r.kind===ESTUARY_KIND?gameText(`estuary:v1:${r.estuaryNode}:name`,getLanguage()):r.kind==='groundwater-pulse'?gameText(`groundwater:observation:${Number.isInteger(r.observationIndex)?r.observationIndex:Math.min(7,page*2+1)}:name`,getLanguage()):r.kind==='freshwater-material'?gameText(`water:freshwater-material:stage:${freshwaterIndex}`,getLanguage())+` · ${(Number.isInteger(r.materialBeat)?r.materialBeat:(state.records.filter((item,i)=>i<=page&&item.kind==='freshwater-material').length-1)%2)+1}/2`:t('journalEntry',{day:r.day,time:r.time||timeFor(state.seed,r.day,r.period)});paper.append(paragraph(entryDate,'entry-date'),paragraph(r.label,'pencil-mark'),paragraph(r.text));if(r.kind===ESTUARY_KIND)paper.append(paragraph(estuaryRecordLine(r,getLanguage()),'ending-memory'))}else paper.append(paragraph(t('journalEmpty')));el.append(paper);
 }else{$('#drawerTitle').textContent=t('sources');el.append(renderSources())}
 $('#pageNumber').textContent=total>1?String(page+1).padStart(2,'0'):'·';$('#pagePrev').disabled=total===1;$('#pageNext').disabled=total===1;iconButton($('#sourcesBtn'),drawerMode==='sources'?'book':'source',drawerMode==='sources'?t('sourceBack'):t('sources'));
}
function openDrawer(mode){habitat.stop();drawerMode=mode;page=mode==='catalog'?Math.max(0,SPECIES.findIndex(p=>p.id===state.cohort[0].species&&collection.unlocked.includes(p.id))):mode==='journal'?Math.max(0,state.records.length-1):Math.max(0,ENDINGS.findIndex(e=>e.id===state.ending));drawDrawer();$('#drawer').showModal()}
// CSS touch-action prevents mobile double-tap zoom while preserving pinch zoom; this also blocks browser dblclick fallback inside the game.
$('#game').addEventListener('dblclick',event=>event.preventDefault(),{passive:false});
for(const [id,d] of [['shorePrev',-1],['shoreNext',1]])$('#'+id).onclick=()=>{if(moveShore(state,d)){habitat.home();$('#zoomLevel').textContent='1×';render()}};
$('#startBtn').onclick=draw;$('#continueBtn').onclick=begin;$('#settleBtn').onclick=()=>{state.arrivalPending=false;save();begin()};$('#nextBtn').onclick=next;$('#restartBtn').onclick=home;
$('#soundBtn').onclick=()=>{sound=!sound;$('#soundBtn').setAttribute('aria-pressed',String(sound));$('#soundBtn').setAttribute('aria-label',sound?t('soundOff'):t('soundOn'));$('#soundBtn').title=sound?t('soundOff'):t('soundOn');tone(120)};
function adjustView(delta){$('#zoomLevel').textContent=state.habitatId==='groundwater'?habitat.beamResize(delta*8)+'%':habitat.zoomBy(state.habitatId==='abyssal'?delta/2:delta).toFixed(2).replace(/0$/,'')+'×'}
$('#zoomIn').onclick=()=>adjustView(.5);$('#zoomOut').onclick=()=>adjustView(-.5);
const stick=$('#zoomReset');let stickPointer=null,stickOrigin=null,stickDragged=false;
function steerStick(event){if(stickPointer!==event.pointerId)return;const x=(event.clientX-stickOrigin.x)/12,y=(event.clientY-stickOrigin.y)/12,length=Math.hypot(x,y),scale=Math.max(1,length),dx=x/scale,dy=y/scale;if(length>.08)stickDragged=true;habitat.beamSteer(dx,dy);stick.style.setProperty('--stick-x',dx*6+'px');stick.style.setProperty('--stick-y',dy*6+'px')}
function releaseStick(){stickPointer=null;habitat.beamSteer(0,0);stick.style.removeProperty('--stick-x');stick.style.removeProperty('--stick-y')}
stick.addEventListener('pointerdown',event=>{if(state.habitatId!=='groundwater'||stickPointer!==null||event.isPrimary===false)return;event.preventDefault();stickPointer=event.pointerId;stickOrigin={x:event.clientX,y:event.clientY};stickDragged=false;stick.setPointerCapture(event.pointerId)});
stick.addEventListener('pointermove',steerStick);for(const event of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(event,releaseStick);
stick.onclick=()=>{if(state.habitatId==='groundwater'){if(!stickDragged)habitat.beamHome();stickDragged=false}else $('#zoomLevel').textContent=habitat.home()+'×'};
stick.addEventListener('keydown',event=>{if(state.habitatId!=='groundwater')return;const directions={ArrowLeft:[-3,0],ArrowRight:[3,0],ArrowUp:[0,-3],ArrowDown:[0,3]};if(directions[event.key]){event.preventDefault();habitat.beamMove(...directions[event.key])}});
window.addEventListener('blur',releaseStick);

$('#catalogBtn').onclick=()=>openDrawer('catalog');$('#endingCatalogBtn').onclick=()=>openDrawer('catalog');$('#journalBtn').onclick=()=>openDrawer('journal');
$('#drawer').addEventListener('close',()=>{if(playing&&state.stage!=='ended')habitat.start()});$('#closeDrawer').onclick=()=>$('#drawer').close();
$('#specimensTab').onclick=()=>{drawerMode='catalog';page=Math.max(0,SPECIES.findIndex(p=>p.id===state.cohort[0].species));drawDrawer()};$('#endingsTab').onclick=()=>{drawerMode='endings';page=Math.max(0,ENDINGS.findIndex(e=>e.id===state.ending));drawDrawer()};
$('#sourcesBtn').onclick=()=>{if(drawerMode==='sources'){drawerMode=referenceReturn?.mode||'catalog';page=referenceReturn?.page||0}else{referenceReturn={mode:drawerMode,page};drawerMode='sources';page=0}drawDrawer()};
for(const [id,delta] of [['pagePrev',-1],['pageNext',1]])$('#'+id).onclick=()=>{const n=drawerMode==='catalog'?SPECIES.length:drawerMode==='endings'?ENDINGS.length:Math.max(1,state.records.length);page=(page+delta+n)%n;drawDrawer()};
function refreshPreview(){
 const seed=4107;previewState=createRun('dairy',seed,selectedHabitat);previewState.cohort=[];
 if(selectedHabitat==='freshwater')previewState.scene={materialStage:3};
 $('#titleCard .window-title span').textContent='ISOPODA / '+gameText('water:habitat:'+selectedHabitat,getLanguage());
 $('#habitatPrev').setAttribute('aria-label',gameText('water:prev',getLanguage()));$('#habitatNext').setAttribute('aria-label',gameText('water:next',getLanguage()));
 $('#titleCard').dataset.habitat=selectedHabitat;emptyHabitat.reset({empty:true});emptyHabitat.start();
}
for(const [id,d] of [['habitatPrev',-1],['habitatNext',1]])$('#'+id).onclick=()=>{selectedHabitat=cycleHabitat(selectedHabitat,d);refreshPreview()};
home();

// Window controls keep the run intact; closing returns to the saved home view.
const habitatWindow=$('#boxFrame');
function restoreHabitatWindow(){habitatWindow.classList.remove('minimized');$('#windowMinimize').setAttribute('aria-expanded','true');$('#windowMinimize').setAttribute('aria-label',t('minimizeWindow'));if(playing)habitat.start()}
$('#windowMinimize').onclick=()=>{const minimized=habitatWindow.classList.toggle('minimized');$('#windowMinimize').setAttribute('aria-expanded',String(!minimized));$('#windowMinimize').setAttribute('aria-label',minimized?t('restoreWindow'):t('minimizeWindow'));minimized?habitat.stop():habitat.start()};
$('#windowMaximize').onclick=async()=>{restoreHabitatWindow();if(document.fullscreenElement){await document.exitFullscreen();return}if(habitatWindow.classList.contains('maximized')){habitatWindow.classList.remove('maximized');$('#windowMaximize').setAttribute('aria-pressed','false');return}try{await habitatWindow.requestFullscreen()}catch{habitatWindow.classList.add('maximized');$('#windowMaximize').setAttribute('aria-pressed','true')}};
document.addEventListener('fullscreenchange',()=>{$('#windowMaximize').setAttribute('aria-pressed',String(!!document.fullscreenElement))});
$('#windowClose').onclick=async()=>{save();if(document.fullscreenElement)await document.exitFullscreen();habitatWindow.classList.remove('maximized');location.href='../'};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&habitatWindow.classList.contains('maximized')){habitatWindow.classList.remove('maximized');$('#windowMaximize').setAttribute('aria-pressed','false')}});

window.addEventListener('isopoda:languagechange',event=>{
 const nextLanguage=event.detail?.language||getLanguage(),enteredIsopod=nextLanguage==='isopod'&&lastInterfaceLanguage!=='isopod';
 lastInterfaceLanguage=nextLanguage;
 refreshIconLabels();
 if(!$('#titleCard').hidden){refreshPreview();if(enteredIsopod)emptyHabitat.heartBurst()}
 $('#continueBtn').textContent=state.stage==='ended'?t('viewEnding'):t('continueObservation');
 $('#soundBtn').setAttribute('aria-label',sound?t('soundOff'):t('soundOn'));$('#soundBtn').title=sound?t('soundOff'):t('soundOn');
 if(playing&&state.stage!=='ended'){render();if(enteredIsopod)habitat.heartBurst()}
 if($('#arrivalCard')&&!$('#arrivalCard').hidden)arrival();
 if($('#endCard')&&!$('#endCard').hidden)showEnd();
 if($('#drawer').open)drawDrawer();
});

// Fit the square scene around the live narrative, including feedback after a choice.
let fittingFrame;
function fitObservation(){cancelAnimationFrame(fittingFrame);fittingFrame=requestAnimationFrame(()=>{const content=$('.window-content');if(!content.clientHeight)return;const side=matchMedia('(min-width:900px), (orientation:landscape)').matches;const room=side?Math.min(content.clientHeight,content.clientWidth*.59):Math.min(content.clientWidth,content.clientHeight-$('.window-story').getBoundingClientRect().height-4);content.style.setProperty('--scene-size',Math.max(0,Math.floor(room))+'px')})}
new ResizeObserver(fitObservation).observe($('.window-content'));new ResizeObserver(fitObservation).observe($('.window-story'));window.addEventListener('resize',fitObservation);visualViewport?.addEventListener('resize',fitObservation);

// Keep original human numerals so language changes can restore DOM-only readouts too.
const numeralSources=new Map();
function refreshNumerals(){
 const fictional=getLanguage()==='isopod';
 if(!fictional){for(const [node,{raw,encoded}] of numeralSources)if(node.isConnected&&node.data===encoded)node.data=raw;numeralSources.clear();return}
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
 while(node=walker.nextNode()){
  if(!/\d/.test(node.data)||node.parentElement.closest('script,style,input,textarea,select,[contenteditable]'))continue;
  const raw=node.data,encoded=isopodNumbers(raw);numeralSources.set(node,{raw,encoded});node.data=encoded;
 }
 for(const node of numeralSources.keys())if(!node.isConnected)numeralSources.delete(node);
}
const numberObserver=new MutationObserver(refreshNumerals);
numberObserver.observe(document.body,{subtree:true,childList:true,characterData:true});
numberObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-ui-language']});
refreshNumerals();
