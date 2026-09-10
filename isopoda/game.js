import {renderCatalog,renderSources} from './catalog.mjs?v=fieldnotes-5';
import {SPECIES,speciesById} from './species.mjs?v=fieldnotes-5';
import {ENDINGS} from './content.mjs?v=fieldnotes-5';
import {createRun,validRun,migrateLegacy,ensureScene,choose,advance,timeFor} from './engine.mjs?v=fieldnotes-5';
import {makeBug} from './sprites.mjs?v=fieldnotes-5';
import {createHabitat} from './habitat.mjs?v=fieldnotes-5';
import {restoreCollection,drawSpecies,unlock} from './collection.mjs?v=fieldnotes-5';
import {encounterById,encounterFor} from './encounters.mjs?v=fieldnotes-5';
import {iconButton,createInstrument} from './ui.mjs?v=fieldnotes-5';
const $=s=>document.querySelector(s),KEY='isopoda-fugue-v3',ARCHIVE='isopoda-fugue-endings-v3',COLLECTION='isopoda-fieldnotes-v1';
function read(key){try{return JSON.parse(localStorage.getItem(key))}catch{return null}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{$('#storageNotice').hidden=false;$('#storageNotice').textContent='纸页暂时留不住；这一次仍可以走完。'}}
const stored=read(KEY),legacy=read('umwelt-isopod-v1');let hasRun=validRun(stored)||!!legacy;
let state=validRun(stored)?stored:legacy?migrateLegacy(legacy,Date.now()>>>0):createRun('dairy',0);
let archives=read(ARCHIVE);if(!Array.isArray(archives))archives=[];archives=archives.filter(a=>a&&ENDINGS.some(e=>e.id===a.id));
let collection=restoreCollection(read(COLLECTION),hasRun?state:null,archives);write(COLLECTION,collection);
let playing=false,sound=false,audio,drawerMode='catalog',page=0,lastScene=null,referenceReturn=null;
const habitat=createHabitat($('#habitat'),$('#critters'),()=>state);
const emptyHabitat=createHabitat($('#emptyHabitat'),$('#emptyCritters'),()=>state);
const instrument=createInstrument($('#instruments'),()=>{const styles=['round','twin','strip'];collection.instrument=styles[(styles.indexOf(collection.instrument)+1)%3];write(COLLECTION,collection);instrument(state,collection.instrument)});
for(const [id,kind,label] of [['soundBtn','sound','开启声音'],['startBtn','draw','抽取一组鼠妇'],['titleCatalog','book','所见之物'],['catalogBtn','book','所见之物'],['journalBtn','leaf','散页'],['endArchive','book','在所见之物中翻阅末页'],['sourcesBtn','source','出处与旁注']])iconButton($('#'+id),kind,label);
function save(){write(KEY,state)}
function clock(day=state.day,period=state.period){return '第 '+day+' 日 · '+timeFor(state.seed,day,period)}
function sceneNow(){
 // Preserve old feedback and journals; only rebuild an unchosen old count scene that assumed >5 animals.
 if(state.stage==='choice'&&state.scene?.kind==='count'&&state.scene.count>5)state.scene=null;
 const scene=ensureScene(state);if(!scene.encounter)scene.encounter=encounterFor(state).id;return scene;
}
function buttons(scene){$('#actions').replaceChildren();for(const o of scene.options){const b=document.createElement('button');b.className='action';b.textContent=o.label;b.disabled=state.stage!=='choice';b.onclick=()=>act(o.id);$('#actions').append(b)}}
function render(){
 const scene=sceneNow(),p=speciesById(state.species),encounter=encounterById(scene.encounter);
 $('#dayLabel').textContent=clock();$('#boxLabel').textContent=p.name;$('#recordTitle').textContent=state.stage==='feedback'?'后来':'此刻';$('#observation').textContent=state.stage==='feedback'?state.feedback:scene.text;
 $('#activityLabel').textContent=encounter?.title||'';$('#activityLabel').dataset.motion=encounter?.motion||'';
 $('#nextBtn').disabled=state.stage!=='feedback';$('#nextBtn').textContent=state.stage==='choice'?'先留在这一刻':state.day===7&&state.period===2?'轻轻合上 →':'稍后 · '+timeFor(state.seed,state.period===2?state.day+1:state.day,(state.period+1)%3)+' →';
 buttons(scene);$('#miniView').replaceChildren();$('#miniView').hidden=true;
 if(state.stage==='choice'&&scene.kind==='count'){$('#miniView').hidden=false;for(let i=0;i<scene.count;i++)$('#miniView').append(makeBug(p,i))}
 if(lastScene!==scene.id){habitat.stage(scene);lastScene=scene.id}
 instrument(state,collection.instrument);save();
}
function arrival(){playing=false;habitat.stop();$('#titleCard').hidden=true;$('#playView').hidden=true;$('#endCard').hidden=true;$('#arrivalCard').hidden=false;$('#dayLabel').textContent='';const p=speciesById(state.species);$('#arrivalSpecimens').replaceChildren(...Array.from({length:5},(_,i)=>makeBug(p,state.seed+i)));$('#arrivalName').textContent=p.name;$('#arrivalText').textContent='五个体，一种尚未熟悉的生活。名字已经夹进「所见之物」。'}
function draw(){if($('#startBtn').disabled)return;$('#startBtn').disabled=true;const seed=Date.now()>>>0,id=drawSpecies(collection,seed);state=createRun(id,seed);state.arrivalPending=true;hasRun=true;collection.draws++;unlock(collection,id);write(COLLECTION,collection);save();arrival();tone(130)}
function begin(){
 if(!hasRun)return;if(state.arrivalPending){arrival();return}
 $('#titleCard').hidden=true;$('#arrivalCard').hidden=true;$('#endCard').hidden=true;playing=true;
 if(state.stage==='ended'){showEnd();return}
 $('#playView').hidden=false;lastScene=null;sceneNow();habitat.reset();habitat.home();$('#zoomLevel').textContent='1×';render();habitat.start();
}
function act(id){if(!choose(state,id))return;habitat.react(id);tone(130);render()}
function next(){if(!advance(state))return;tone(95);save();if(state.stage==='ended'){showEnd();return}render()}
function showEnd(){
 habitat.stop();$('#playView').hidden=true;$('#arrivalCard').hidden=true;$('#endCard').hidden=false;$('#dayLabel').textContent='';const e=ENDINGS.find(e=>e.id===state.ending)||ENDINGS[5];$('#endingTime').textContent=clock();$('#endingTitle').textContent=e.title;$('#endingBody').textContent=e.body;$('#endingLine').textContent=e.line;$('#endSpecimen').replaceChildren(...[0,1,2].map(i=>makeBug(speciesById(state.species),state.seed+i)));
 if(!archives.some(a=>a.run===state.seed&&a.species===state.species)){archives.push({id:e.id,run:state.seed,species:state.species,date:new Date().toLocaleDateString(),records:state.records.length});archives=archives.slice(-60);write(ARCHIVE,archives)}$('#endingCount').textContent='这一页，已夹进所见之物。';save();
}
function home(){playing=false;habitat.stop();$('#playView').hidden=true;$('#endCard').hidden=true;$('#arrivalCard').hidden=true;$('#titleCard').hidden=false;$('#dayLabel').textContent='';$('#startBtn').disabled=false;$('#continueBtn').hidden=!hasRun;$('#continueBtn').textContent=state.stage==='ended'?'翻回那一页':'续上那一页';emptyHabitat.reset({empty:true})}
function tone(freq){if(!sound)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=freq;g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.12)}catch{sound=false;$('#soundBtn').setAttribute('aria-pressed','false');$('#soundBtn').setAttribute('aria-label','声音暂不可用')}}
function paragraph(value,cls=''){const el=document.createElement('p');el.textContent=value;el.className=cls;return el}
function drawDrawer(){
 const el=$('#drawerContent');el.replaceChildren();el.scrollTop=0;let total=1;$('#drawerTabs').hidden=!['catalog','endings'].includes(drawerMode);$('#sourcesBtn').hidden=drawerMode==='journal';$('#specimensTab').setAttribute('aria-pressed',String(drawerMode==='catalog'));$('#endingsTab').setAttribute('aria-pressed',String(drawerMode==='endings'));
 if(drawerMode==='catalog'){
  total=SPECIES.length;page=(page+total)%total;const p=SPECIES[page],known=collection.unlocked.includes(p.id);$('#drawerTitle').textContent='所见之物';el.append(renderCatalog(p,{unlocked:known}));
 }else if(drawerMode==='endings'){
  total=ENDINGS.length;page=(page+total)%total;const e=ENDINGS[page],saved=archives.some(a=>a.id===e.id);$('#drawerTitle').textContent='所见之物';const note=document.createElement('article');note.className='ending-note';if(saved){const h=document.createElement('h3');h.textContent=e.title;note.append(h,paragraph(e.body),paragraph(e.line,'last-line'))}else note.append(paragraph('尚未翻到的地方。'),paragraph('也许另一种停留，会把纸页带到这里。','faint'));el.append(note);
 }else if(drawerMode==='journal'){
  total=Math.max(1,state.records.length);page=Math.max(0,Math.min(page,total-1));$('#drawerTitle').textContent='散页';const paper=document.createElement('article');paper.className='journal-paper';if(state.records.length){const r=state.records[page];paper.append(paragraph('第 '+r.day+' 日 · '+(r.time||timeFor(state.seed,r.day,r.period)),'entry-date'),paragraph(r.label,'pencil-mark'),paragraph(r.text))}else paper.append(paragraph('这一页还没有写下什么。'));el.append(paper);
 }else{$('#drawerTitle').textContent='出处与旁注';el.append(renderSources())}
 $('#pageNumber').textContent=total>1?String(page+1).padStart(2,'0'):'·';$('#pagePrev').disabled=total===1;$('#pageNext').disabled=total===1;iconButton($('#sourcesBtn'),drawerMode==='sources'?'book':'source',drawerMode==='sources'?'回到所见之物':'出处与旁注');
}
function openDrawer(mode){habitat.stop();drawerMode=mode;page=mode==='catalog'?Math.max(0,SPECIES.findIndex(p=>p.id===state.species&&collection.unlocked.includes(p.id))):mode==='journal'?Math.max(0,state.records.length-1):Math.max(0,ENDINGS.findIndex(e=>e.id===state.ending));drawDrawer();$('#drawer').showModal()}
$('#startBtn').onclick=draw;$('#continueBtn').onclick=begin;$('#settleBtn').onclick=()=>{state.arrivalPending=false;save();begin()};$('#nextBtn').onclick=next;$('#restartBtn').onclick=home;
$('#soundBtn').onclick=()=>{sound=!sound;$('#soundBtn').setAttribute('aria-pressed',String(sound));$('#soundBtn').setAttribute('aria-label',sound?'关闭声音':'开启声音');$('#soundBtn').title=sound?'关闭声音':'开启声音';tone(120)};
$('#zoomIn').onclick=()=>$('#zoomLevel').textContent=habitat.zoomBy(.5).toFixed(1)+'×';$('#zoomOut').onclick=()=>$('#zoomLevel').textContent=habitat.zoomBy(-.5).toFixed(1)+'×';$('#zoomReset').onclick=()=>{$('#zoomLevel').textContent=habitat.home()+'×'};
for(const id of ['catalogBtn','titleCatalog'])$('#'+id).onclick=()=>openDrawer('catalog');$('#endArchive').onclick=()=>openDrawer('endings');$('#journalBtn').onclick=()=>openDrawer('journal');
$('#drawer').addEventListener('close',()=>{if(playing&&state.stage!=='ended')habitat.start()});$('#closeDrawer').onclick=()=>$('#drawer').close();
$('#specimensTab').onclick=()=>{drawerMode='catalog';page=Math.max(0,SPECIES.findIndex(p=>p.id===state.species));drawDrawer()};$('#endingsTab').onclick=()=>{drawerMode='endings';page=Math.max(0,ENDINGS.findIndex(e=>e.id===state.ending));drawDrawer()};
$('#sourcesBtn').onclick=()=>{if(drawerMode==='sources'){drawerMode=referenceReturn?.mode||'catalog';page=referenceReturn?.page||0}else{referenceReturn={mode:drawerMode,page};drawerMode='sources';page=0}drawDrawer()};
for(const [id,delta] of [['pagePrev',-1],['pageNext',1]])$('#'+id).onclick=()=>{const n=drawerMode==='catalog'?13:drawerMode==='endings'?6:Math.max(1,state.records.length);page=(page+delta+n)%n;drawDrawer()};
home();
