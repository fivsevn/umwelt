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
const stored=migrateV4(read(KEY))||migrateV3(read('isopoda-fugue-v3')),legacy=read('umwelt-isopod-v1');let hasRun=validRun(stored)||!!legacy;
let state=validRun(stored)?stored:legacy?migrateLegacy(legacy,Date.now()>>>0):createRun('dairy',0);
let selectedHabitat=state.habitatId||'terrestrial',previewState=createRun('dairy',4107,selectedHabitat);
let learnedInteractions=read(DISCOVERIES);if(!learnedInteractions||typeof learnedInteractions!=='object')learnedInteractions={};
function mergeLearnedInteractions(target){
 target.interactionDiscoveries=target.interactionDiscoveries&&typeof target.interactionDiscoveries==='object'?target.interactionDiscoveries:{};
 const past=Array.isArray(target.directRecords)?target.directRecords:[];
 for(const key of ['tap','grab','lift','collect']){
  const seen=key==='grab'?past.some(r=>r.type==='grab'||r.type==='place'):past.some(r=>r.type===key);
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
const habitat=createHabitat($('#habitat'),$('#critters'),()=>state,event=>{if(!playing||state.stage==='ended')return;const record=recordDirectInteraction(state,event);if(record){mergeLearnedInteractions(state);save();render()}});
const emptyHabitat=createHabitat($('#emptyHabitat'),$('#emptyCritters'),()=>previewState);
const instrument=createInstrument($('#instruments'));
function refreshIconLabels(){for(const [id,kind,label] of [['soundBtn','sound',sound?t('soundOff'):t('soundOn')],['catalogBtn','book',t('archive')],['sourcesBtn','source',t('sources')],['journalBtn','pencil',t('journal')],['zoomOut','minus',t('zoomOut')],['zoomIn','plus',t('zoomIn')],['zoomReset','center',t('zoomReset')]])iconButton($('#'+id),kind,label)}
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
 const config=habitatConfig(state);
 if(config.sequence==='freshwater-material'){
  const index=Number.isInteger(state.scene?.materialStage)?state.scene.materialStage:Math.min(config.turns-1,(state.records||[]).filter(record=>record.kind==='freshwater-material').length);
  return gameText(`water:freshwater-material:stage:${index}`,getLanguage());
 }
 if(config.dialogue)return '';
 const date=state.startedOn?new Date(state.startedOn+'T12:00:00'):null;
 if(date)date.setDate(date.getDate()+day-1);
 const time=timeFor(state.seed,day,period);
 if(getLanguage()==='isopod'&&date)return isopodWaveClock(date,time);
 return (date?formatShortDate(date):t('dayNumber',{day}))+' '+time;
}
function sceneNow(){
 // Replace pending legacy counting scenes without erasing past feedback or records.
 if(state.stage==='choice'&&state.scene?.kind==='count')state.scene=null;
 const scene=ensureScene(state);if(!scene.encounter&&!habitatConfig(state).aquatic)scene.encounter=encounterFor(state).id;return scene;
}
function buttons(scene){$('#actions').replaceChildren();for(const o of scene.options){const b=document.createElement('button');b.className='action';b.dataset.directLocale='true';b.textContent=gameText(o.label,getLanguage());b.disabled=state.stage!=='choice';b.onclick=()=>act(o.id);$('#actions').append(b)}}
function render(){
 const scene=sceneNow(),config=habitatConfig(state),p=speciesById(state.cohort[0].species),encounter=encounterById(scene.encounter);
 $('#habitat').setAttribute('aria-label',t(config.cohortSize===1?'habitatCanvasSingle':'habitatCanvas'));setWaveText($('#dayLabel'),clock());$('#recordTitle').textContent=state.stage==='feedback'?t('recordLater'):t('recordNow');$('#observation').dataset.directLocale='true';$('#observation').textContent=gameText(state.stage==='feedback'?state.feedback:scene.text,getLanguage());
 const waterFeedback=habitatConfig(state).aquatic&&state.stage==='feedback'?aquaticFeedback(state):'';if(waterFeedback)$('#observation').textContent+=' '+gameText(waterFeedback,getLanguage());
 $('#activityLabel').textContent=config.aquatic?gameText('water:habitat:'+state.habitatId,getLanguage()):getLanguage()==='zh'?(encounter?.title||''):t('habitatWindow');$('#activityLabel').dataset.motion=encounter?.motion||'';
 const cue=state.stage==='feedback'?(state.interactionIntent?.hint||''):'';$('#interactionCue').hidden=!cue;$('#interactionCue').textContent=cue;
 $('#nextBtn').disabled=state.stage!=='feedback';
 const nextTime=timeFor(state.seed,state.period===2?state.day+1:state.day,(state.period+1)%3);
 const nextTimeLabel=getLanguage()==='isopod'?isopodWaveTime(nextTime):nextTime;
 if(config.sequence==='freshwater-material'){
  const completed=(Array.isArray(state.records)?state.records:[]).filter(record=>record.kind==='freshwater-material').length;
  setWaveText($('#nextBtn'),state.stage==='choice'?t('holdMoment'):completed>=config.turns?t('closeGently'):t('continueObservation'));
 }else if(config.dialogue){
  const completed=(Array.isArray(state.records)?state.records:[]).filter(record=>record.kind==='abyssal-dialogue').length;
  setWaveText($('#nextBtn'),state.stage==='choice'?t('holdMoment'):completed>=config.turns?t('closeGently'):t('continueObservation'));
 }else setWaveText($('#nextBtn'),state.stage==='choice'?t('holdMoment'):state.day===config.days&&state.period===2?t('closeGently'):t('later',{time:nextTimeLabel}));
 buttons(scene);$('#miniView').replaceChildren();$('#miniView').hidden=true;
 if(state.stage==='choice'&&scene.kind==='count'){$('#miniView').hidden=false;for(let i=0;i<scene.count;i++)$('#miniView').append(makeBug(p,i))}
 if(lastScene!==scene.id){habitat.stage(scene);lastScene=scene.id}
 instrument(state);save();
}
function batchBugs(){return state.cohort.map(c=>{const bug=makeIsopod(speciesById(c.species),{seed:c.seed,stage:c.stage});bug.dataset.specimen=c.id;bug.dataset.species=c.species;bug.title=`${c.id} · ${speciesPrimaryName(speciesById(c.species))}`;return bug})}
function arrival(){playing=false;habitat.stop();$('#titleCard').hidden=true;$('#playView').hidden=true;$('#endCard').hidden=true;$('#arrivalCard').hidden=false;$('#dayLabel').textContent='';$('#arrivalSpecimens').replaceChildren(...batchBugs())}
function draw(){if($('#startBtn').disabled)return;$('#startBtn').disabled=true;const seed=Date.now()>>>0,cohort=drawCohort(collection,seed,selectedHabitat);state=createRun(cohort[0].species,seed,selectedHabitat);state.cohort=cohort;mergeLearnedInteractions(state);state.arrivalPending=true;hasRun=true;collection.draws++;for(const id of runSpecies(state))unlock(collection,id,state.startedOn);write(COLLECTION,collection);save();begin();tone(130)}
function begin(){
 if(!hasRun)return;emptyHabitat.stop();if(state.arrivalPending){arrival();return}
 $('#titleCard').hidden=true;$('#arrivalCard').hidden=true;$('#endCard').hidden=true;$('#habitatLibrary').append($('#catalogBtn'));playing=true;
 if(state.stage==='ended'){showEnd();return}
 $('#playView').hidden=false;lastScene=null;sceneNow();habitat.reset();habitat.home();$('#zoomLevel').textContent='1×';render();habitat.start();
}
function act(id){if(!choose(state,id))return;if(!state.interactionIntent)habitat.react(id);tone(130);render()}
function next(){if(!advance(state))return;tone(95);save();if(state.stage==='ended'){showEnd();return}render()}
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
 habitat.stop();$('#playView').hidden=true;$('#arrivalCard').hidden=true;$('#endCard').hidden=false;$('#dayLabel').textContent='';const e=ENDINGS.find(e=>e.id===state.ending)||ENDINGS[5];setWaveText($('#endingTime'),clock());for(const id of ['endingTitle','endingBody','endingLine'])$('#'+id).dataset.directLocale='true';$('#endingTitle').textContent=gameText(e.title,getLanguage());$('#endingBody').textContent=gameText(e.body,getLanguage());$('#endingLine').textContent=gameText(e.line,getLanguage());const endConfig=habitatConfig(state);$('#endCard .ending-date span:last-child').textContent=endConfig.sequence==='freshwater-material'?gameText('water:observations5',getLanguage()):endConfig.dialogue?gameText('water:abyssalRound',getLanguage()):endConfig.aquatic?gameText('water:days3',getLanguage()):t('sevenDayObservation');$('#endSpecimen').replaceChildren(...batchBugs());drawEndMolts();
 if(!archives.some(a=>a.run===state.seed)){archives.push({id:e.id,run:state.seed,species:runSpecies(state),cohort:state.cohort,date:new Date().toLocaleDateString(),records:state.records.length,memory:endingMemoryFor(state),molts:(state.collectedShells||[]).map(shell=>({phase:shell.phase,specimen:shell.specimen}))});archives=archives.slice(-60);write(ARCHIVE,archives)}save();
}
function home(){playing=false;habitat.stop();$('#playView').hidden=true;$('#endCard').hidden=true;$('#arrivalCard').hidden=true;$('#titleCard').hidden=false;$('#dayLabel').textContent='';$('#startBtn').disabled=false;$('#continueBtn').hidden=!hasRun;$('#continueBtn').textContent=state.stage==='ended'?t('viewEnding'):t('continueObservation');refreshPreview()}
function tone(freq){if(!sound)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=freq;g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.12)}catch{sound=false;$('#soundBtn').setAttribute('aria-pressed','false');$('#soundBtn').setAttribute('aria-label',t('soundUnavailable'))}}
function paragraph(value,cls=''){const el=document.createElement('p');el.dataset.directLocale='true';el.textContent=gameText(value,getLanguage());el.className=cls;return el}
function drawDrawer(){
 const el=$('#drawerContent');el.replaceChildren();el.scrollTop=0;let total=1;const sourcesOnly=drawerMode==='sources';$('#drawer').dataset.mode=drawerMode;$('#drawerTabs').hidden=sourcesOnly||drawerMode==='journal';$('#sourcesBtn').hidden=drawerMode==='journal';$('#pagePrev').parentElement.hidden=sourcesOnly;$('#specimensTab').setAttribute('aria-pressed',String(drawerMode==='catalog'));$('#endingsTab').setAttribute('aria-pressed',String(drawerMode==='endings'));
 if(drawerMode==='catalog'){
  total=SPECIES.length;page=(page+total)%total;const p=SPECIES[page],known=collection.unlocked.includes(p.id);$('#drawerTitle').textContent=t('archive');el.append(renderCatalog(p,{unlocked:known,collectedOn:collection.acquired?.[p.id]}));
 }else if(drawerMode==='endings'){
  total=ENDINGS.length;page=(page+total)%total;const e=ENDINGS[page],saved=archives.some(a=>a.id===e.id);$('#drawerTitle').textContent=t('archive');const note=document.createElement('article');note.className='ending-note';if(saved){const h=document.createElement('h3');h.dataset.directLocale='true';h.textContent=gameText(e.title,getLanguage());note.append(h,paragraph(gameText(e.body,getLanguage())),paragraph(gameText(e.line,getLanguage()),'last-line'));const batches=archives.filter(a=>a.id===e.id);for(const a of batches){const taxa=Array.isArray(a.species)?a.species:[a.species];if(a.memory)note.append(paragraph(a.memory,'ending-memory'));note.append(paragraph(`${a.date} · ${taxa.map(id=>speciesPrimaryName(speciesById(id))).join(' / ')}`,'faint'))}}else{note.classList.add('unseen');const h=document.createElement('h3');h.innerHTML='&nbsp;';note.append(h,paragraph('','ending-space'),paragraph(t('emptyEnding'),'last-line'))}el.append(note);
 }else if(drawerMode==='journal'){
  total=Math.max(1,state.records.length);page=Math.max(0,Math.min(page,total-1));$('#drawerTitle').textContent=t('journalTitle');const paper=document.createElement('article');paper.className='journal-paper';if(state.records.length){const r=state.records[page],entryDate=r.kind==='freshwater-material'?gameText(`water:freshwater-material:stage:${Math.max(0,state.records.filter((item,i)=>i<=page&&item.kind==='freshwater-material').length-1)}`,getLanguage()):t('journalEntry',{day:r.day,time:r.time||timeFor(state.seed,r.day,r.period)});paper.append(paragraph(entryDate,'entry-date'),paragraph(r.label,'pencil-mark'),paragraph(r.text))}else paper.append(paragraph(t('journalEmpty')));el.append(paper);
 }else{$('#drawerTitle').textContent=t('sources');el.append(renderSources())}
 $('#pageNumber').textContent=total>1?String(page+1).padStart(2,'0'):'·';$('#pagePrev').disabled=total===1;$('#pageNext').disabled=total===1;iconButton($('#sourcesBtn'),drawerMode==='sources'?'book':'source',drawerMode==='sources'?t('sourceBack'):t('sources'));
}
function openDrawer(mode){habitat.stop();drawerMode=mode;page=mode==='catalog'?Math.max(0,SPECIES.findIndex(p=>p.id===state.cohort[0].species&&collection.unlocked.includes(p.id))):mode==='journal'?Math.max(0,state.records.length-1):Math.max(0,ENDINGS.findIndex(e=>e.id===state.ending));drawDrawer();$('#drawer').showModal()}
// CSS touch-action prevents mobile double-tap zoom while preserving pinch zoom; this also blocks browser dblclick fallback inside the game.
$('#game').addEventListener('dblclick',event=>event.preventDefault(),{passive:false});
$('#startBtn').onclick=draw;$('#continueBtn').onclick=begin;$('#settleBtn').onclick=()=>{state.arrivalPending=false;save();begin()};$('#nextBtn').onclick=next;$('#restartBtn').onclick=home;
$('#soundBtn').onclick=()=>{sound=!sound;$('#soundBtn').setAttribute('aria-pressed',String(sound));$('#soundBtn').setAttribute('aria-label',sound?t('soundOff'):t('soundOn'));$('#soundBtn').title=sound?t('soundOff'):t('soundOn');tone(120)};
$('#zoomIn').onclick=()=>$('#zoomLevel').textContent=habitat.zoomBy(.5).toFixed(1)+'×';$('#zoomOut').onclick=()=>$('#zoomLevel').textContent=habitat.zoomBy(-.5).toFixed(1)+'×';$('#zoomReset').onclick=()=>{$('#zoomLevel').textContent=habitat.home()+'×'};
$('#catalogBtn').onclick=()=>openDrawer('catalog');$('#endingCatalogBtn').onclick=()=>openDrawer('catalog');$('#journalBtn').onclick=()=>openDrawer('journal');
$('#drawer').addEventListener('close',()=>{if(playing&&state.stage!=='ended')habitat.start()});$('#closeDrawer').onclick=()=>$('#drawer').close();
$('#specimensTab').onclick=()=>{drawerMode='catalog';page=Math.max(0,SPECIES.findIndex(p=>p.id===state.cohort[0].species));drawDrawer()};$('#endingsTab').onclick=()=>{drawerMode='endings';page=Math.max(0,ENDINGS.findIndex(e=>e.id===state.ending));drawDrawer()};
$('#sourcesBtn').onclick=()=>{if(drawerMode==='sources'){drawerMode=referenceReturn?.mode||'catalog';page=referenceReturn?.page||0}else{referenceReturn={mode:drawerMode,page};drawerMode='sources';page=0}drawDrawer()};
for(const [id,delta] of [['pagePrev',-1],['pageNext',1]])$('#'+id).onclick=()=>{const n=drawerMode==='catalog'?SPECIES.length:drawerMode==='endings'?ENDINGS.length:Math.max(1,state.records.length);page=(page+delta+n)%n;drawDrawer()};
function refreshPreview(){
 const seed=4107;previewState=createRun('dairy',seed,selectedHabitat);previewState.cohort=[];
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
