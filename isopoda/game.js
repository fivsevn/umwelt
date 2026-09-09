import {renderCatalog} from './catalog.mjs?v=morphology-4';
import {SPECIES,speciesById} from './species.mjs?v=morphology-4';
import {ENDINGS} from './content.mjs?v=morphology-4';
import {createRun,validRun,migrateLegacy,ensureScene,choose,advance,PERIODS} from './engine.mjs?v=morphology-4';
import {makeBug} from './sprites.mjs?v=morphology-4';
import {createHabitat} from './habitat.mjs?v=morphology-4';
const $=s=>document.querySelector(s),KEY='isopoda-fugue-v3',ARCHIVE='isopoda-fugue-endings-v3';
let storageOK=true;
function read(key){try{return JSON.parse(localStorage.getItem(key))}catch{return null}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{storageOK=false;$('#storageNotice').hidden=false;$('#storageNotice').textContent='此浏览器无法保存记录；本次仍可完整游玩。'}}
let stored=read(KEY),legacy=read('umwelt-isopod-v1');
let state=validRun(stored)?stored:legacy?migrateLegacy(legacy,Date.now()>>>0):createRun();
let selected=SPECIES.findIndex(p=>p.id===state.species),playing=false,sound=false,audio,drawerMode='catalog',page=0;
let archives=read(ARCHIVE);if(!Array.isArray(archives))archives=[];archives=archives.filter(a=>a&&ENDINGS.some(e=>e.id===a.id));
const habitat=createHabitat($('#habitat'),$('#critters'),()=>state);
function save(){write(KEY,state)}
function preview(){
 const p=SPECIES[selected];$('#specimenPreview').replaceChildren(makeBug(p));$('#speciesName').textContent=p.name+' / '+p.label;$('#speciesLatin').textContent=p.taxon;
 $('#speciesHint').textContent=p.visual.body.convexity<.4?'低平的甲片，叶缘与干湿边界。':p.visual.body.width>.9?'宽厚的侧板，树皮下的间隙。':'圆拱的甲片，收拢的后缘。';
 $('#speciesIndex').textContent=String(selected+1).padStart(2,'0')+' / 13';
}
function buttons(scene){
 $('#actions').replaceChildren();
 for(const o of scene.options){const b=document.createElement('button');b.className='action';b.textContent=o.label;b.disabled=state.stage!=='choice';b.onclick=()=>act(o.id);$('#actions').append(b)}
}
function render(){
 const scene=ensureScene(state),p=speciesById(state.species);
 $('#dayLabel').textContent='D'+state.day+' / '+PERIODS[state.period];$('#boxLabel').textContent=p.label;
 $('#recordTitle').textContent=state.stage==='feedback'?'观察结果':(scene.kind==='text'?'观察记录':'小观察');
 $('#recordNo').textContent=String((state.day-1)*3+state.period+1).padStart(2,'0')+' / 21';
 $('#observation').textContent=state.stage==='feedback'?state.feedback:scene.text;
 $('#nextBtn').disabled=state.stage!=='feedback';
 $('#nextBtn').textContent=state.stage==='choice'?'选择后继续 →':state.day===7&&state.period===2?'合上这份记录 →':state.period===2?'进入第 '+(state.day+1)+' 天 →':'继续到'+PERIODS[state.period+1]+' →';
 buttons(scene);$('#miniView').replaceChildren();$('#miniView').hidden=state.stage==='feedback'||scene.kind==='text';
 if(state.stage==='choice'&&scene.kind==='count'){for(let i=0;i<scene.count;i++)$('#miniView').append(makeBug(p,i))}
 else if(state.stage==='choice'&&scene.kind==='route'){for(const label of ['湿苔','木片','叶缘']){const span=document.createElement('span');span.className='mini-chip';span.textContent=label;$('#miniView').append(span)}}
 else if(state.stage==='choice'&&scene.kind!=='text'){$('#miniView').hidden=true}
 climate();save();
}
function begin(fresh){
 if(fresh){state=createRun(SPECIES[selected].id,Date.now()>>>0);save()}
 $('#titleCard').hidden=true;$('#endCard').hidden=true;playing=true;
 if(state.stage==='ended'){showEnd();return}
 $('#playView').hidden=false;habitat.reset();habitat.home();$('#zoomLevel').textContent='1×';habitat.start();render();
}
function act(id){if(!choose(state,id))return;habitat.react(id);tone(130);render()}
function next(){
 if(!advance(state))return;tone(95);save();
 if(state.stage==='ended'){habitat.stop();$('#flash').animate([{opacity:0},{opacity:.92},{opacity:0}],{duration:1800});showEnd();return}
 render();
}
function showEnd(){
 habitat.stop();$('#playView').hidden=true;$('#endCard').hidden=false;
 const e=ENDINGS.find(e=>e.id===state.ending)||ENDINGS[5];$('#endingTitle').textContent=e.title;$('#endingBody').textContent=e.body;$('#endingLine').textContent=e.line;
 $('#endSpecimen').replaceChildren(...[0,1,2].map(i=>makeBug(speciesById(state.species),i)));
 if(!archives.some(a=>a.run===state.seed&&a.species===state.species)){archives.push({id:e.id,run:state.seed,species:state.species,date:new Date().toLocaleDateString(),records:state.records.length});archives=archives.slice(-60);write(ARCHIVE,archives)}
 $('#endingCount').textContent='末页已存 · '+new Set(archives.map(a=>a.id)).size+' / 6';save();
}
function home(){
 playing=false;habitat.stop();$('#playView').hidden=true;$('#endCard').hidden=true;$('#titleCard').hidden=false;$('#dayLabel').textContent='ISOPODA FUGUE';selected=SPECIES.findIndex(p=>p.id===state.species);preview();$('#continueBtn').hidden=false;$('#continueBtn').textContent=state.stage==='ended'?'翻回刚才的末页':'继续上次的记录';
}
function climate(){
 $('#realClock').textContent='现实 '+new Date().toLocaleTimeString('zh-CN',{hour12:false});
 $('#simClimate').textContent='箱内 '+state.temp.toFixed(1)+'°C  '+Math.round(state.humidity)+'% RH';
 $('#simDetail').textContent='通风 '+(state.vent>75?'较强':state.vent<40?'微弱':'适中')+' · '+(state.light<30?'微光':state.light>65?'亮':'柔光');
}
function tone(freq){if(!sound)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=freq;g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.12)}catch{sound=false;$('#soundBtn').textContent='声音 不可用'}}
function paragraph(text,cls=''){const p=document.createElement('p');p.textContent=text;p.className=cls;return p}
function drawDrawer(){
 const el=$('#drawerContent');el.replaceChildren();let total=1;
 if(drawerMode==='catalog'){
  total=SPECIES.length;page=(page+total)%total;const p=SPECIES[page];$('#drawerTitle').textContent=p.name+' / '+p.label;
  el.append(renderCatalog(p));el.scrollTop=0;
 }else if(drawerMode==='journal'){
  const records=state.records;total=Math.max(1,records.length);page=Math.min(Math.max(0,page),total-1);$('#drawerTitle').textContent='这七天的记录';
  if(records.length){const r=records[page];el.append(paragraph('DAY '+r.day+' / '+PERIODS[r.period],'entry-date'),paragraph('你选择：'+r.label),paragraph(r.text))}else el.append(paragraph('第一页还没有写下操作。'));
 }else{
  total=6;page=(page+total)%total;const e=ENDINGS[page],saved=archives.filter(a=>a.id===e.id);$('#drawerTitle').textContent=saved.length?e.title:'尚未写到的末页';
  if(saved.length){el.append(paragraph(e.body),paragraph(e.line),paragraph('已留下 '+saved.length+' 份记录 · '+saved[saved.length-1].date,'entry-date'))}else el.append(paragraph('这里暂时空着。另一种观察方式，也许会把记录带到这里。'));
 }
 $('#pageNumber').textContent=(page+1)+' / '+total;$('#pagePrev').disabled=total===1;$('#pageNext').disabled=total===1;
}
function openDrawer(mode){habitat.stop();drawerMode=mode;page=mode==='catalog'?(playing?SPECIES.findIndex(p=>p.id===state.species):selected):mode==='journal'?Math.max(0,state.records.length-1):0;drawDrawer();$('#drawer').showModal()}
$('#speciesPrev').onclick=()=>{selected=(selected+12)%13;preview()};$('#speciesNext').onclick=()=>{selected=(selected+1)%13;preview()};
$('#startBtn').onclick=()=>begin(true);$('#continueBtn').onclick=()=>begin(false);$('#nextBtn').onclick=next;$('#restartBtn').onclick=home;
$('#soundBtn').onclick=()=>{sound=!sound;$('#soundBtn').textContent='声音 '+(sound?'开':'关');$('#soundBtn').setAttribute('aria-pressed',String(sound));tone(120)};
$('#zoomIn').onclick=()=>$('#zoomLevel').textContent=habitat.zoomBy(.5).toFixed(1)+'×';
$('#zoomOut').onclick=()=>$('#zoomLevel').textContent=habitat.zoomBy(-.5).toFixed(1)+'×';
$('#zoomReset').onclick=()=>{$('#zoomLevel').textContent=habitat.home()+'×'};
for(const id of ['catalogBtn','titleCatalog'])$('#'+id).onclick=()=>openDrawer('catalog');
for(const id of ['titleArchive','endArchive'])$('#'+id).onclick=()=>openDrawer('archive');
$('#drawer').addEventListener('close',()=>{if(playing&&state.stage!=='ended')habitat.start()});
$('#journalBtn').onclick=()=>openDrawer('journal');$('#closeDrawer').onclick=()=>$('#drawer').close();
$('#pagePrev').onclick=()=>{page--;if(page<0)page=drawerMode==='catalog'?12:drawerMode==='journal'?Math.max(0,state.records.length-1):5;drawDrawer()};
$('#pageNext').onclick=()=>{const n=drawerMode==='catalog'?13:drawerMode==='journal'?Math.max(1,state.records.length):6;page=(page+1)%n;drawDrawer()};
preview();climate();setInterval(climate,1000);$('#continueBtn').hidden=!(validRun(stored)||legacy);
if(state.stage==='ended')$('#continueBtn').textContent='查看上次的末页';
