// Permanent three-group workbench. No player layout/wardrobe persistence.
const local = ['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname);
if (!local) {
  document.body.textContent = '此工具仅用于 localhost 本地预览。';
  throw new Error('Local visual workbench only');
}
const storage = { blockedReads: 0, blockedWrites: 0 };
const getItem = Storage.prototype.getItem, setItem = Storage.prototype.setItem;
let modules;
try {
  Storage.prototype.getItem = function () { storage.blockedReads++; return null; };
  Storage.prototype.setItem = function () { storage.blockedWrites++; };
  modules = await Promise.all([
    import('../../rooftop/3d/scene3d.mjs'),
    import('../../rooftop/scene.mjs'), import('../../rooftop/weather.mjs'),
    import('../../rooftop/seasons.mjs'), import('../../rooftop/item-catalog.mjs'),
    import('../../rooftop/review-state.mjs'), import('../../rooftop/3d/optic-overlay.mjs'),
    import('../../rooftop/wardrobe.mjs'),
  ]);
} finally { Storage.prototype.getItem = getItem; Storage.prototype.setItem = setItem; }
const [{ createGardenRenderer }, { initialLayout, makeWalker, ASSETS }, { makeWeather, WEATHER, TIMES }, { SEASONS },
  { ITEMS, getItemDefinition, getPlantAssembly }, { REVIEW_VIEWS, emptyReviewLayout },
  { opticOverlayMarkup, updateOpticOverlay }, { wardrobe }] = modules;
const { createReviewItemStage } = await import('../../rooftop/3d/review-item-stage.mjs');
const $ = id => document.getElementById(id), query = new URLSearchParams(location.search);
const valid = (value, list, fallback) => list.includes(value) ? value : fallback;
let mode = valid(query.get('mode'), ['scene','item','game'], 'scene');
let scene = valid(query.get('scene'), ['north','south','room'], 'north');
const look = 'original';
let sampling = valid(query.get('sampling'), ['source','game'], 'source');
let item = getItemDefinition(query.get('item'))?.id || 'wood-2';
const views = { scene: valid(query.get('view'), REVIEW_VIEWS.map(v=>v.id), 'terrace'),
  game: valid(query.get('view'), ['bird','drone','neighbor'], 'bird') };
const choices = { condition: valid(query.get('weather'), WEATHER.map(v=>v.id), 'clear'),
  phase: valid(query.get('time'), TIMES.map(v=>v.id), 'afternoon'),
  season: valid(query.get('season'), SEASONS.map(v=>v.id), 'autumn') };
const layout = initialLayout(), empty = emptyReviewLayout(initialLayout(), { room:true });
const gardens = new Map(), canvases = { scene:$('sceneCanvas'), item:$('itemCanvas'), game:$('gameCanvas') };
let itemStage = null, generation = 0, pending = true, paused = false;
let weather = makeWeather(choices), atmosphere = weather.state, time = 0, last = performance.now(), lastFrame = 0;
let person, pig, lastStatus = '';
let detailOpen = false, catalogCategory = query.get('category') || '全部', catalogSearch = query.get('q') || '', catalogScroll = 0;
let catalogRevision = 0, catalogBusy = false, catalogQueue = [], catalogLoaded = 0, catalogErrors = 0;
let catalogAtmosphere = makeWeather(choices).state;
const thumbCache = new Map(), cards = new Map();
Object.assign(wardrobe, { outfit:'sage', pig:'scarf' });
$('scope').innerHTML = opticOverlayMarkup();
function options(select, list) { select.replaceChildren(...list.map(v=>new Option(v.name || v.label, v.id))); }
options($('weatherChoice'),WEATHER); options($('timeChoice'),TIMES); options($('seasonChoice'),SEASONS);
const categories = new Map();
for (const definition of ASSETS) { if (!categories.has(definition.category)) categories.set(definition.category,[]); categories.get(definition.category).push(definition); }
for (const [name, definitions] of categories) { const group=document.createElement('optgroup');group.label=name;
  for(const definition of definitions)group.append(new Option(definition.name || definition.id,definition.id));$('itemChoice').append(group); }
function definition(id) { return getItemDefinition(id); }
function assembly(id,pot) { const value=getPlantAssembly(id,pot); return value ? {...value,pot:definition(value.pot.id)} : value; }
function stageForItems() {
  if(!itemStage)itemStage=createReviewItemStage(canvases.item,{getDefinition:definition,getAssembly:assembly});
  itemStage.setSampling(sampling);return itemStage;
}
const catalogObserver = new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting&&mode==='item'&&!detailOpen){catalogObserver.unobserve(entry.target);catalogQueue.push(entry.target);}
  processCatalog();
},{rootMargin:'160px'});
function thumbKey(card) {const holder=card.querySelector('.item-image');return JSON.stringify([card.dataset.itemId,look,sampling,choices,holder.clientWidth,holder.clientHeight,devicePixelRatio]);}
function showThumb(card, result, revision) {
  if(revision!==catalogRevision||!card.isConnected)return;
  card.querySelector('img').src=result.url;card.querySelector('.item-image span').textContent='';
  Object.assign(card.dataset,{loaded:'true',capturedItemId:result.id,look:result.look,sampling:result.sampling,revision:String(revision),captureKey:result.key});catalogLoaded++;
}
async function processCatalog() {
  if(catalogBusy||mode!=='item'||detailOpen)return;catalogBusy=true;
  try {while(catalogQueue.length&&mode==='item'&&!detailOpen){
    const card=catalogQueue.shift(), revision=catalogRevision;if(!card.isConnected||card.dataset.loaded==='true')continue;
    const key=thumbKey(card);if(thumbCache.has(key)){showThumb(card,thumbCache.get(key),revision);continue;}
    const holder=card.querySelector('.item-image'), id=card.dataset.itemId, currentLook=look, currentSampling=sampling;
    try {
      const stage=stageForItems();await stage.setItem(id);
      if(revision!==catalogRevision||mode!=='item'||detailOpen)continue;
      const blob=await stage.capture({width:holder.clientWidth,height:holder.clientHeight,pixelRatio:devicePixelRatio,atmosphere:catalogAtmosphere,time:0,reduced:true});
      if(revision!==catalogRevision||mode!=='item'||detailOpen)continue;
      const result={url:URL.createObjectURL(blob),id,look:currentLook,sampling:currentSampling,key};thumbCache.set(key,result);
      if(thumbCache.size>400){const first=thumbCache.keys().next().value;URL.revokeObjectURL(thumbCache.get(first).url);thumbCache.delete(first);}
      showThumb(card,result,revision);
    }catch(error){if(revision===catalogRevision&&mode==='item'&&!detailOpen){card.querySelector('.item-image span').textContent='暂未载入';card.dataset.loaded='error';catalogErrors++;console.error(error);}}
    await new Promise(resolve=>requestAnimationFrame(resolve));
  }}finally{catalogBusy=false;if(catalogQueue.length&&mode==='item'&&!detailOpen)processCatalog();}
}
function stopCatalog() {catalogRevision++;catalogObserver.disconnect();catalogQueue=[];}
function observeCatalog() {if(mode!=='item'||detailOpen)return;for(const card of cards.values())if(card.dataset.loaded!=='true')catalogObserver.observe(card);processCatalog();}
function refreshCatalog() {
  stopCatalog();catalogLoaded=0;catalogErrors=0;catalogAtmosphere=makeWeather(choices).state;
  if(mode==='item'&&!detailOpen)document.body.dataset.ready='false';
  for(const card of cards.values()){card.dataset.loaded='false';card.querySelector('img').removeAttribute('src');card.querySelector('.item-image span').textContent='正在摆好…';}
  observeCatalog();
}
function renderCatalog() {
  stopCatalog();cards.clear();catalogLoaded=0;catalogErrors=0;$('itemCatalog').replaceChildren();
  if(mode==='item'&&!detailOpen)document.body.dataset.ready='false';
  const search=catalogSearch.trim().toLowerCase();
  const shown=[...categories.values()].flat().filter(v=>(catalogCategory==='全部'||v.category===catalogCategory)&&(!search||`${v.name} ${v.id} ${v.aliases||''}`.toLowerCase().includes(search)));
  let category='';
  for(const value of shown){
    if(category!==value.category){category=value.category;const heading=document.createElement('h2');heading.className='catalog-category';heading.textContent=category;$('itemCatalog').append(heading);}
    const card=document.createElement('article');card.className='item-card';card.dataset.itemId=value.id;card.dataset.loaded='false';
    const button=document.createElement('button');button.type='button';button.setAttribute('aria-label',`近看 ${value.name}`);button.onclick=()=>openItem(value.id);
    const holder=document.createElement('div');holder.className='item-image';const img=document.createElement('img');img.alt='';
    const label=document.createElement('span');label.textContent='正在摆好…';holder.append(img,label);button.append(holder);
    const name=document.createElement('h3');name.textContent=value.name;const dimensions=document.createElement('p');dimensions.textContent=`${Math.round(value.width*100)} × ${Math.round(value.depth*100)} × ${Math.round(value.height*100)} cm`;
    card.append(button,name,dimensions);$('itemCatalog').append(card);cards.set(value.id,card);
  }
  $('catalogSummary').textContent=`${ITEMS.length} 件 · 当前 ${shown.length} 件`;
  for(const button of $('itemCategories').children)button.setAttribute('aria-pressed',String(button.dataset.category===catalogCategory));
  observeCatalog();
}
for(const [name,amount] of [['全部',ITEMS.length],...[...categories].map(([name,list])=>[name,list.length])]){
  const button=document.createElement('button');button.type='button';button.dataset.category=name;button.textContent=name;
  const count=document.createElement('small');count.textContent=amount;button.append(count);button.onclick=()=>{catalogCategory=name;renderCatalog();controls();};$('itemCategories').append(button);
}
if(catalogCategory!=='全部'&&!categories.has(catalogCategory))catalogCategory='全部';
$('itemSearch').value=catalogSearch;$('itemSearch').oninput=e=>{catalogSearch=e.target.value;renderCatalog();controls();};
async function openItem(id) {
  catalogScroll=window.scrollY;stopCatalog();detailOpen=true;item=definition(id)?.id||'wood-2';
  const token=++generation;pending=true;document.body.dataset.ready='false';controls();window.scrollTo(0,0);
  try {await stageForItems().setItem(item);if(token===generation)pending=false;}catch(error){fail(error);}
}
function closeItem() {generation++;pending=false;detailOpen=false;controls();requestAnimationFrame(()=>{window.scrollTo(0,catalogScroll);observeCatalog();});}
$('closeItemDetail').onclick=closeItem;
renderCatalog();
function walkers() {
  let seed={north:1835,south:4721,room:9251}[scene], original=Math.random;
  Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  try { const objects=()=>layout.scenes[scene], environment=()=>({...atmosphere,condition:atmosphere.activityCondition||atmosphere.condition});
    person=makeWalker(scene,objects,{environment,company:()=>[pig?.person]});
    pig=makeWalker(scene,objects,{actor:'pig',visits:7,body:{radius:.76,height:1},environment,company:()=>[person?.person]});
    person.randomize();pig.randomize();
  } finally {Math.random=original;}
}
walkers();

function setCamera(garden, group) {
  garden.setScene(scene);
  if (group==='scene') {garden.setReviewView(views.scene);if(scene!=='room'&&['terrace','row','outlook'].includes(views.scene))garden.setFreeCamera(true);}
  else if (scene!=='room') garden.setNarrativeView(views.game);
}
function gardenFor(group) {
  if(!gardens.has(group)) {
    const background=group==='scene';
    const garden=createGardenRenderer(canvases[group],background?empty:layout,null,{
      scene,controls:'pan',backgroundStage:background,hideActors:background,
      gameModelStage:background,allowFreeCamera:background,reviewView:views.scene,reviewSampling:sampling,
      localReview:true,
    });gardens.set(group,garden);setCamera(garden,group);
  }
  return gardens.get(group);
}
function controls() {
  document.body.dataset.mode=mode;
  for(const button of document.querySelectorAll('button[data-mode]'))button.setAttribute('aria-pressed',String(button.dataset.mode===mode));
  for(const [group,canvas]of Object.entries(canvases))canvas.hidden=group!==mode;
  $('sceneLabel').hidden=mode==='item';$('viewLabel').hidden=mode==='item'||scene==='room';$('itemLabel').hidden=mode!=='item'||!detailOpen;
  $('viewport').hidden=mode==='item'&&!detailOpen;$('itemCatalogSection').hidden=mode!=='item'||detailOpen;
  $('resetCamera').hidden=mode==='item'&&!detailOpen;
  $('itemDetailHeading').hidden=mode!=='item'||!detailOpen;$('itemDetailName').textContent=definition(item)?.name||item;
  options($('viewChoice'),mode==='game'?[{id:'bird',name:'小鸟'},{id:'drone',name:'无人机'},{id:'neighbor',name:'邻居'}]:REVIEW_VIEWS);
  $('viewChoice').value=views[mode]||'terrace';$('sceneChoice').value=scene;$('itemChoice').value=item;
  $('samplingChoice').value=sampling;$('lookChoice').value=look;$('lookChoice').disabled=true;
  $('weatherChoice').value=choices.condition;$('timeChoice').value=choices.phase;$('seasonChoice').value=choices.season;
  $('scope').hidden=mode==='item'||scene==='room'||views[mode]!=='neighbor';
  $('hint').textContent=mode==='game'?'拖动观察 · 滚轮或双指缩放':mode==='item'&&!detailOpen?'全部物件 · 点击近看':'拖动转动 · 滚轮或双指缩放';
  const params=new URLSearchParams({mode,scene,view:views[mode]||'terrace',sampling,look,weather:choices.condition,time:choices.phase,season:choices.season});
  if(mode==='item'){if(detailOpen)params.set('item',item);if(catalogCategory!=='全部')params.set('category',catalogCategory);if(catalogSearch)params.set('q',catalogSearch);}
  history.replaceState(null,'',`${location.pathname}?${params}`);
}
async function activate(next) {
  stopCatalog();detailOpen=false;
  mode=valid(next,['scene','item','game'],'scene');const token=++generation;pending=true;document.body.dataset.ready='false';controls();
  if(mode==='item') {
    stageForItems();observeCatalog();
  } else {const garden=gardenFor(mode);garden.setReviewSampling(sampling);}
  if(token===generation)pending=false;
}
function setSampling(value) {sampling=valid(value,['source','game'],'source');for(const garden of gardens.values())garden.setReviewSampling(sampling);itemStage?.setSampling(sampling);refreshCatalog();controls();}
function setScene(value) {scene=valid(value,['north','south','room'],'north');for(const[group,garden]of gardens)setCamera(garden,group);walkers();controls();}
function setView(value) {if(mode==='item')return;views[mode]=valid(value,mode==='scene'?REVIEW_VIEWS.map(v=>v.id):['bird','drone','neighbor'],mode==='scene'?'terrace':'bird');setCamera(gardenFor(mode),mode);controls();}
function setEnvironment(value) {Object.assign(choices,value);weather=makeWeather(choices);atmosphere=weather.state;refreshCatalog();controls();}
function resetCamera() {if(mode==='item')itemStage?.resetCamera();else setCamera(gardenFor(mode),mode);}
for(const button of document.querySelectorAll('button[data-mode]'))button.onclick=()=>activate(button.dataset.mode).catch(fail);
$('sceneChoice').onchange=e=>setScene(e.target.value);$('viewChoice').onchange=e=>setView(e.target.value);
$('itemChoice').onchange=e=>openItem(e.target.value);
$('samplingChoice').onchange=e=>setSampling(e.target.value);
for(const[id,key]of[['weatherChoice','condition'],['timeChoice','phase'],['seasonChoice','season']])$(id).onchange=e=>setEnvironment({[key]:e.target.value});
$('resetCamera').onclick=resetCamera;
let failure=null;
function fail(error){failure=String(error.message||error);document.body.dataset.ready='false';$('status').textContent='载入失败，请刷新。';$('status').classList.add('error');console.error(error);}
function frame(now) {
  requestAnimationFrame(frame);if(now-lastFrame<32||failure)return;lastFrame=now;
  const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;
  if(!paused){time+=dt;atmosphere=weather.update(dt);if(mode==='game'){person.update(dt);pig.update(dt*.8);}}
  let ready=false, errors=[], text='正在载入…';
  if(mode==='item'&&itemStage){
    if(detailOpen){itemStage.draw({atmosphere,time,dt:paused?0:dt,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches});const stats=itemStage.stats;ready=!pending&&stats.ready;errors=stats.error?[stats.error]:[];text=definition(item)?.name||item;}
    else {ready=!pending&&(catalogLoaded>0||cards.size===0);errors=catalogErrors?['catalog']:[];text=`${cards.size} 件物件 · ${catalogLoaded} 图已载入`;}
  }
  else if(gardens.has(mode)) {const garden=gardens.get(mode);garden.draw({time,dt:paused?0:dt,atmosphere,person:person.person,pig:pig.person,present:mode==='game',pigPresent:mode==='game',selected:null,doorOpen:false,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches});const stats=garden.stats;
    ready=!pending&&(scene==='room'?stats.roomBackground?.loaded:stats.background?.loaded)&&!stats.nativeItems.pending;
    errors=stats.nativeItems.errors;text=mode==='scene'?'空场景 · 无陈列和角色':`${stats.objects} 件初始陈列 · 东东与小猪`;
    if(!$('scope').hidden)updateOpticOverlay($('scope'),garden.scopeReading,canvases[mode]);
  }
  document.body.dataset.ready=String(Boolean(ready));if(errors.length)text='部分模型未载入，请刷新。';else if(!ready)text='正在载入…';
  if(text!==lastStatus){$('status').textContent=text;$('status').classList.toggle('error',errors.length>0);lastStatus=text;}
}
window.rooftopReview={setMode:activate,setSampling,setScene,setView,setEnvironment,resetCamera,
  async setItem(id){if(mode!=='item')await activate('item');return openItem(id);},closeItem,
  setCategory(value){catalogCategory=categories.has(value)?value:'全部';renderCatalog();controls();},
  setSearch(value){catalogSearch=String(value||'');$('itemSearch').value=catalogSearch;renderCatalog();controls();},setPaused(value){paused=Boolean(value);},
  get stats(){return {mode,scene,item,sampling,look,choices:{...choices},storageIsolation:{...storage},contexts:gardens.size+(itemStage?1:0),
    active:mode==='item'?itemStage?.stats:gardens.get(mode)?.stats,catalog:{total:ITEMS.length,shown:cards.size,loaded:catalogLoaded,errors:catalogErrors,category:catalogCategory,search:catalogSearch,detailOpen,revision:catalogRevision,busy:catalogBusy},ready:document.body.dataset.ready==='true'};}};
activate(mode).catch(fail);requestAnimationFrame(frame);
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(refreshCatalog,150);});
window.addEventListener('pagehide',()=>{stopCatalog();itemStage?.dispose();for(const result of thumbCache.values())URL.revokeObjectURL(result.url);},{once:true});
