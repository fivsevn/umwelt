import {renderCatalog,renderSources} from './catalog.mjs?v=cohort-4';
import {SPECIES,speciesById} from './species.mjs?v=cohort-4';
import {ENDINGS} from './content.mjs?v=cohort-4';
import {createRun,validRun,migrateV3,runSpecies,migrateLegacy,ensureScene,choose,advance,timeFor} from './engine.mjs?v=cohort-4';
import {makeBug,makeIsopod} from './sprites.mjs?v=cohort-4';
import {createHabitat} from './habitat.mjs?v=cohort-4';
import {restoreCollection,drawCohort,unlock} from './collection.mjs?v=cohort-4';
import {encounterById,encounterFor} from './encounters.mjs?v=cohort-4';
import {iconButton,createInstrument} from './ui.mjs?v=cohort-4';
const $=s=>document.querySelector(s),KEY='isopoda-fugue-v4',ARCHIVE='isopoda-fugue-endings-v3',COLLECTION='isopoda-fieldnotes-v1';
function read(key){try{return JSON.parse(localStorage.getItem(key))}catch{return null}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{$('#storageNotice').hidden=false;$('#storageNotice').textContent='纸页暂时留不住；这一次仍可以走完。'}}
const stored=read(KEY)||migrateV3(read('isopoda-fugue-v3')),legacy=read('umwelt-isopod-v1');let hasRun=validRun(stored)||!!legacy;
let state=validRun(stored)?stored:legacy?migrateLegacy(legacy,Date.now()>>>0):createRun('dairy',0);
let archives=read(ARCHIVE);if(!Array.isArray(archives))archives=[];archives=archives.filter(a=>a&&ENDINGS.some(e=>e.id===a.id));
let collection=restoreCollection(read(COLLECTION),hasRun?state:null,archives);write(COLLECTION,collection);
let playing=false,sound=false,audio,drawerMode='catalog',page=0,lastScene=null,referenceReturn=null;
const habitat=createHabitat($('#habitat'),$('#critters'),()=>state);
const emptyHabitat=createHabitat($('#emptyHabitat'),$('#emptyCritters'),()=>state);
const instrument=createInstrument($('#instruments'));
for(const [id,kind,label] of [['soundBtn','sound','开启声音'],['catalogBtn','book','资料库'],['sourcesBtn','source','来源 / Credits']])iconButton($('#'+id),kind,label);
function save(){write(KEY,state)}
function clock(day=state.day,period=state.period){const date=state.startedOn?new Date(state.startedOn+'T12:00:00'):null;if(date)date.setDate(date.getDate()+day-1);return (date?[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('.'):'第 '+day+' 日')+' · '+timeFor(state.seed,day,period)}
function sceneNow(){
 // Replace pending legacy counting scenes without erasing past feedback or records.
 if(state.stage==='choice'&&state.scene?.kind==='count')state.scene=null;
 const scene=ensureScene(state);if(!scene.encounter)scene.encounter=encounterFor(state).id;return scene;
}
function buttons(scene){$('#actions').replaceChildren();for(const o of scene.options){const b=document.createElement('button');b.className='action';b.textContent=o.label;b.disabled=state.stage!=='choice';b.onclick=()=>act(o.id);$('#actions').append(b)}}
function render(){
 const scene=sceneNow(),p=speciesById(state.cohort[0].species),encounter=encounterById(scene.encounter);
 $('#dayLabel').textContent=clock();$('#boxLabel').textContent=batchLabel();$('#recordTitle').textContent=state.stage==='feedback'?'后来':'此刻';$('#observation').textContent=state.stage==='feedback'?state.feedback:scene.text;
 $('#activityLabel').textContent=encounter?.title||'';$('#activityLabel').dataset.motion=encounter?.motion||'';
 $('#nextBtn').disabled=state.stage!=='feedback';$('#nextBtn').textContent=state.stage==='choice'?'先留在这一刻':state.day===7&&state.period===2?'轻轻合上 →':'稍后 · '+timeFor(state.seed,state.period===2?state.day+1:state.day,(state.period+1)%3)+' →';
 buttons(scene);$('#miniView').replaceChildren();$('#miniView').hidden=true;
 if(state.stage==='choice'&&scene.kind==='count'){$('#miniView').hidden=false;for(let i=0;i<scene.count;i++)$('#miniView').append(makeBug(p,i))}
 if(lastScene!==scene.id){habitat.stage(scene);lastScene=scene.id}
 instrument(state);save();
}
function batchLabel(){return `7 specimens / ${runSpecies(state).length} taxa`}
function batchBugs(){return state.cohort.map(c=>{const bug=makeIsopod(speciesById(c.species),{seed:c.seed,stage:c.stage});bug.dataset.specimen=c.id;bug.dataset.species=c.species;bug.title=`${c.id} · ${speciesById(c.species).name}`;return bug})}
function arrival(){playing=false;habitat.stop();$('#titleCard').hidden=true;$('#playView').hidden=true;$('#endCard').hidden=true;$('#arrivalCard').hidden=false;$('#dayLabel').textContent='';$('#arrivalSpecimens').replaceChildren(...batchBugs());$('#arrivalName').textContent=batchLabel();$('#arrivalText').textContent='七只个体，编号 A–G。接下来的七天，仍是这一组。'}
function draw(){if($('#startBtn').disabled)return;$('#startBtn').disabled=true;const seed=Date.now()>>>0,cohort=drawCohort(collection,seed);state=createRun(cohort[0].species,seed);state.cohort=cohort;state.arrivalPending=true;hasRun=true;collection.draws++;for(const id of runSpecies(state))unlock(collection,id,state.startedOn);write(COLLECTION,collection);save();begin();tone(130)}
function begin(){
 if(!hasRun)return;if(state.arrivalPending){arrival();return}
 $('#titleCard').hidden=true;$('#arrivalCard').hidden=true;$('#endCard').hidden=true;$('.window-toolbar').insertBefore($('#catalogBtn'),$('#soundBtn'));playing=true;
 if(state.stage==='ended'){showEnd();return}
 $('#playView').hidden=false;lastScene=null;sceneNow();habitat.reset();habitat.home();$('#zoomLevel').textContent='1×';render();habitat.start();
}
function act(id){if(!choose(state,id))return;habitat.react(id);tone(130);render()}
function next(){if(!advance(state))return;tone(95);save();if(state.stage==='ended'){showEnd();return}render()}
function showEnd(){
 habitat.stop();$('#playView').hidden=true;$('#arrivalCard').hidden=true;$('#endCard').hidden=false;$('#endRecordsSlot').append($('#catalogBtn'));$('#dayLabel').textContent='';const e=ENDINGS.find(e=>e.id===state.ending)||ENDINGS[5];$('#endingTime').textContent=clock();$('#endingTitle').textContent=e.title;$('#endingBody').textContent=e.body;$('#endingLine').textContent=e.line;$('#endSpecimen').replaceChildren(...batchBugs());
 if(!archives.some(a=>a.run===state.seed)){archives.push({id:e.id,run:state.seed,species:runSpecies(state),cohort:state.cohort,date:new Date().toLocaleDateString(),records:state.records.length});archives=archives.slice(-60);write(ARCHIVE,archives)}$('#endingCount').textContent='已归档至「余响」。';save();
}
function home(){playing=false;habitat.stop();$('#playView').hidden=true;$('#endCard').hidden=true;$('#arrivalCard').hidden=true;$('#titleCard').hidden=false;$('#dayLabel').textContent='';$('#startBtn').disabled=false;$('#continueBtn').hidden=!hasRun;$('#continueBtn').textContent=state.stage==='ended'?'查看结局':'继续观察';emptyHabitat.reset({empty:true})}
function tone(freq){if(!sound)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=freq;g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.12)}catch{sound=false;$('#soundBtn').setAttribute('aria-pressed','false');$('#soundBtn').setAttribute('aria-label','声音暂不可用')}}
function paragraph(value,cls=''){const el=document.createElement('p');el.textContent=value;el.className=cls;return el}
function drawDrawer(){
 const el=$('#drawerContent');el.replaceChildren();el.scrollTop=0;let total=1;const sourcesOnly=drawerMode==='sources';$('#drawerTabs').hidden=sourcesOnly;$('#sourcesBtn').hidden=false;$('#pagePrev').parentElement.hidden=sourcesOnly;$('#journalTab').setAttribute('aria-pressed',String(drawerMode==='journal'));$('#specimensTab').setAttribute('aria-pressed',String(drawerMode==='catalog'));$('#endingsTab').setAttribute('aria-pressed',String(drawerMode==='endings'));
 if(drawerMode==='catalog'){
  total=SPECIES.length;page=(page+total)%total;const p=SPECIES[page],known=collection.unlocked.includes(p.id);$('#drawerTitle').textContent='阿西莫夫的资料库';el.append(renderCatalog(p,{unlocked:known,collectedOn:collection.acquired?.[p.id]}));
 }else if(drawerMode==='endings'){
  total=ENDINGS.length;page=(page+total)%total;const e=ENDINGS[page],saved=archives.some(a=>a.id===e.id);$('#drawerTitle').textContent='阿西莫夫的资料库';const note=document.createElement('article');note.className='ending-note';if(saved){const h=document.createElement('h3');h.textContent=e.title;note.append(h,paragraph(e.body),paragraph(e.line,'last-line'));const batches=archives.filter(a=>a.id===e.id);for(const a of batches){const taxa=Array.isArray(a.species)?a.species:[a.species];note.append(paragraph(`${a.date} · ${taxa.map(id=>speciesById(id).name).join(' / ')}`,'faint'))}}else note.append(paragraph('尚未翻到的地方。'),paragraph('也许另一种停留，会把纸页带到这里。','faint'));el.append(note);
 }else if(drawerMode==='journal'){
  total=Math.max(1,state.records.length);page=Math.max(0,Math.min(page,total-1));$('#drawerTitle').textContent='阿西莫夫的资料库';const paper=document.createElement('article');paper.className='journal-paper';if(state.records.length){const r=state.records[page];paper.append(paragraph('第 '+r.day+' 日 · '+(r.time||timeFor(state.seed,r.day,r.period)),'entry-date'),paragraph(r.label,'pencil-mark'),paragraph(r.text))}else paper.append(paragraph('这一页还没有写下什么。'));el.append(paper);
 }else{$('#drawerTitle').textContent='来源 / Credits';el.append(renderSources())}
 $('#pageNumber').textContent=total>1?String(page+1).padStart(2,'0'):'·';$('#pagePrev').disabled=total===1;$('#pageNext').disabled=total===1;iconButton($('#sourcesBtn'),drawerMode==='sources'?'book':'source',drawerMode==='sources'?'回到所见之物':'来源 / Credits');
}
function openDrawer(mode){habitat.stop();drawerMode=mode;page=mode==='catalog'?Math.max(0,SPECIES.findIndex(p=>p.id===state.cohort[0].species&&collection.unlocked.includes(p.id))):mode==='journal'?Math.max(0,state.records.length-1):Math.max(0,ENDINGS.findIndex(e=>e.id===state.ending));drawDrawer();$('#drawer').showModal()}
$('#startBtn').onclick=draw;$('#continueBtn').onclick=begin;$('#settleBtn').onclick=()=>{state.arrivalPending=false;save();begin()};$('#nextBtn').onclick=next;$('#restartBtn').onclick=home;
$('#soundBtn').onclick=()=>{sound=!sound;$('#soundBtn').setAttribute('aria-pressed',String(sound));$('#soundBtn').setAttribute('aria-label',sound?'关闭声音':'开启声音');$('#soundBtn').title=sound?'关闭声音':'开启声音';tone(120)};
$('#zoomIn').onclick=()=>$('#zoomLevel').textContent=habitat.zoomBy(.5).toFixed(1)+'×';$('#zoomOut').onclick=()=>$('#zoomLevel').textContent=habitat.zoomBy(-.5).toFixed(1)+'×';$('#zoomReset').onclick=()=>{$('#zoomLevel').textContent=habitat.home()+'×'};
$('#catalogBtn').onclick=()=>openDrawer('catalog');$('#journalTab').onclick=()=>{drawerMode='journal';page=Math.max(0,state.records.length-1);drawDrawer()};
$('#drawer').addEventListener('close',()=>{if(playing&&state.stage!=='ended')habitat.start()});$('#closeDrawer').onclick=()=>$('#drawer').close();
$('#specimensTab').onclick=()=>{drawerMode='catalog';page=Math.max(0,SPECIES.findIndex(p=>p.id===state.cohort[0].species));drawDrawer()};$('#endingsTab').onclick=()=>{drawerMode='endings';page=Math.max(0,ENDINGS.findIndex(e=>e.id===state.ending));drawDrawer()};
$('#sourcesBtn').onclick=()=>{if(drawerMode==='sources'){drawerMode=referenceReturn?.mode||'catalog';page=referenceReturn?.page||0}else{referenceReturn={mode:drawerMode,page};drawerMode='sources';page=0}drawDrawer()};
for(const [id,delta] of [['pagePrev',-1],['pageNext',1]])$('#'+id).onclick=()=>{const n=drawerMode==='catalog'?SPECIES.length:drawerMode==='endings'?ENDINGS.length:Math.max(1,state.records.length);page=(page+delta+n)%n;drawDrawer()};
home();

// Window controls keep the run intact; closing returns to the saved home view.
const habitatWindow=$('#boxFrame');
function restoreHabitatWindow(){habitatWindow.classList.remove('minimized');$('#windowMinimize').setAttribute('aria-expanded','true');$('#windowMinimize').setAttribute('aria-label','最小化饲养窗口');if(playing)habitat.start()}
$('#windowMinimize').onclick=()=>{const minimized=habitatWindow.classList.toggle('minimized');$('#windowMinimize').setAttribute('aria-expanded',String(!minimized));$('#windowMinimize').setAttribute('aria-label',minimized?'还原饲养窗口':'最小化饲养窗口');minimized?habitat.stop():habitat.start()};
$('#windowMaximize').onclick=async()=>{restoreHabitatWindow();if(document.fullscreenElement){await document.exitFullscreen();return}if(habitatWindow.classList.contains('maximized')){habitatWindow.classList.remove('maximized');$('#windowMaximize').setAttribute('aria-pressed','false');return}try{await habitatWindow.requestFullscreen()}catch{habitatWindow.classList.add('maximized');$('#windowMaximize').setAttribute('aria-pressed','true')}};
document.addEventListener('fullscreenchange',()=>{$('#windowMaximize').setAttribute('aria-pressed',String(!!document.fullscreenElement))});
$('#windowClose').onclick=async()=>{save();if(document.fullscreenElement)await document.exitFullscreen();habitatWindow.classList.remove('maximized');location.href='../'};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&habitatWindow.classList.contains('maximized')){habitatWindow.classList.remove('maximized');$('#windowMaximize').setAttribute('aria-pressed','false')}});
// Fit the square scene around the live narrative, including feedback after a choice.
let fittingFrame;
function fitObservation(){cancelAnimationFrame(fittingFrame);fittingFrame=requestAnimationFrame(()=>{const content=$('.window-content');if(!content.clientHeight)return;const side=matchMedia('(min-width:900px), (orientation:landscape)').matches;const room=side?Math.min(content.clientHeight,content.clientWidth*.59):Math.min(content.clientWidth,content.clientHeight-$('.window-story').getBoundingClientRect().height-4);content.style.setProperty('--scene-size',Math.max(0,Math.floor(room))+'px')})}
new ResizeObserver(fitObservation).observe($('.window-content'));new ResizeObserver(fitObservation).observe($('.window-story'));window.addEventListener('resize',fitObservation);visualViewport?.addEventListener('resize',fitObservation);
