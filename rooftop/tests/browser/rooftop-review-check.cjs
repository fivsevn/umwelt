// Run against a local server in fresh isolated Chrome contexts. Never attaches
// to the user's browser or reads their player save.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const repo = path.resolve(__dirname, '../../..');
const origin = process.env.ROOFTOP_REVIEW_ORIGIN || 'http://localhost:8765';
const out = process.env.QA_OUTPUT || path.join(require('os').tmpdir(), 'rooftop-visual-review');
fs.mkdirSync(out, {recursive:true});
const report = { entry: '/rooftop/tests/browser/rooftop.html', cases: [], errors: [], httpErrors: [], loadedModels: [], failures: [] };
const check = (condition, message) => { if (!condition) report.failures.push(message); };
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
async function ready(page) {
  await page.waitForFunction(() => window.rooftopReview?.stats.ready, undefined, { timeout: 45000 });
  if(await page.evaluate(()=>rooftopReview.stats.mode==='item'&&!rooftopReview.stats.catalog?.detailOpen))return;
  const frames = await page.evaluate(() => rooftopReview.stats.active.performance.frames);
  await page.waitForFunction(frames => rooftopReview.stats.ready && rooftopReview.stats.active.performance.frames >= frames + 3, frames, { timeout: 45000 });
}
async function inspect(page, name, saved, dpr) {
  await ready(page);
  const result = await page.evaluate(() => {
    const state = rooftopReview.stats, active = state.active, canvas = document.getElementById(state.mode+'Canvas');
    return { mode: state.mode, scene: state.scene, item: state.item, look: state.look, sampling: state.sampling,
      contexts: state.contexts, choices: state.choices, storageIsolation: state.storageIsolation,
      actualStorage: __qaStorage, saved: __qaSaved(), active,
      ui: { groups: [...document.querySelectorAll('button[data-mode]')].map(button => button.dataset.mode),
        viewportCount: document.querySelectorAll('#viewport').length,
        visibleCanvases: [...document.querySelectorAll('#viewport > canvas')].filter(c=>!c.hidden).map(c=>c.id),
        pressed: document.querySelector('button[data-mode][aria-pressed="true"]')?.dataset.mode,
        itemOptions: document.querySelector('#itemChoice').options.length,
        sampling: document.querySelector('#samplingChoice').value, look: document.querySelector('#lookChoice').value,
        pauseButton: [...document.querySelectorAll('button')].some(b=>/暂停|pause/i.test(b.textContent)),
        width: innerWidth, documentWidth: document.documentElement.scrollWidth },
      canvas: { size: [canvas.width,canvas.height], css: [canvas.clientWidth,canvas.clientHeight], sampling:canvas.dataset.sampling,
        pixelStep: Number(canvas.dataset.physicalPixelStep), imageRendering: canvas.style.imageRendering } };
  });
  const active = result.active;
  check(JSON.stringify(result.ui.groups)==='["scene","item","game"]' && result.ui.viewportCount===1, name+': three-group single viewport contract');
  check(result.ui.visibleCanvases.length===1 && result.ui.visibleCanvases[0]===result.mode+'Canvas' && result.ui.pressed===result.mode, name+': mode/canvas/button disagree');
  check(!result.ui.pauseButton && result.contexts<=3, name+': unexpected UI or context leak');
  check(result.ui.itemOptions===294, name+': complete catalogue missing');
  check(!result.actualStorage.length && result.saved===saved, name+': player storage accessed or changed');
  check(!active.nativeItems.pending && !active.nativeItems.errors.length, name+': model load errors');
  check(result.ui.documentWidth<=result.ui.width, name+': horizontal mobile overflow');
  check(result.canvas.sampling===result.sampling && result.ui.sampling===result.sampling && result.ui.look===result.look, name+': shared controls desynchronised');
  check(active.raster.sourceInspection===(result.sampling==='source'), name+': native-resolution guard');
  const expectedStep=result.sampling==='source'?1:Math.round((result.mode!=='item'&&result.scene==='room'?2:1.7)*dpr);
  check(active.raster.pixelStep===expectedStep && result.canvas.pixelStep===expectedStep, name+': physical sampling grid');
  if(result.sampling==='source') check(JSON.stringify(active.raster.sourceBuffer)===JSON.stringify(result.canvas.size),name+': source buffer not native pixels');
  check(result.look==='original', name+': obsolete appearance alternative');
  if(result.mode==='scene') check(active.objects===0 && active.modelIds.length===0 && active.actorsHidden && !active.actorVisibility.person && !active.actorVisibility.pig,name+': empty scene contains actors/items');
  else if(result.mode==='game') check(active.objects===({north:83,south:14,room:21}[result.scene]) && active.modelIds.length===active.objects && !active.actorsHidden && active.actorVisibility.person && active.actorVisibility.pig,name+': initial arrangement/actors missing');
  else check(active.objects===1 && active.loaded && active.meshes>0 && active.triangles>0 && active.boundsMetres && active.nativeSources.length,name+': incomplete isolated native item');
  result.savedBytesMatch=result.saved===saved; result.savedSha256=sha(result.saved);delete result.saved;
  report.cases.push({name,...result});return result;
}
async function run() {
  const {INITIAL_LAYOUT}=await import(pathToFileURL(path.join(repo,'rooftop/initial-layout.mjs')));
  const saved=JSON.stringify({...INITIAL_LAYOUT,qaVisualReview:true},null,1);
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try {
    for(const device of [{viewport:{width:1280,height:900},deviceScaleFactor:1},{viewport:{width:375,height:812},deviceScaleFactor:3,isMobile:true,hasTouch:true}]) {
      const dpr=device.deviceScaleFactor, context=await browser.newContext(device);
      await context.addInitScript(({saved})=>{
        const get=Storage.prototype.getItem,set=Storage.prototype.setItem;
        set.call(localStorage,'umwelt-rooftop-layout-v1',saved);window.__qaStorage=[];
        Storage.prototype.getItem=function(key){__qaStorage.push({op:'get',key});return get.call(this,key);};
        Storage.prototype.setItem=function(key,value){__qaStorage.push({op:'set',key});return set.call(this,key,value);};
        window.__qaSaved=()=>get.call(localStorage,'umwelt-rooftop-layout-v1');
      },{saved});
      const page=await context.newPage();
      page.on('pageerror',error=>report.errors.push(String(error)));
      page.on('response',response=>{if(response.status()>=400)report.httpErrors.push({status:response.status(),url:response.url()});});
      await page.goto(origin+'/rooftop/tests/browser/rooftop.html?mode=scene&sampling=source&look=original&weather=clear&time=afternoon&season=autumn');
      await ready(page);await page.evaluate(()=>rooftopReview.setPaused(true));
      check(await page.locator('#lookChoice option').count()===1,'old appearance options remain');
      let state=await inspect(page,'scene-source-dpr'+dpr,saved,dpr);
      const pose=state.active.freeCameraPose;
      await page.selectOption('#samplingChoice','game');state=await inspect(page,'scene-game-dpr'+dpr,saved,dpr);
      check(JSON.stringify(state.active.freeCameraPose)===JSON.stringify(pose),'sampling changes the camera');
      await page.selectOption('#samplingChoice','source');
      for(const view of ['row','outlook','bird','drone','neighbor','terrace']) {
        await page.selectOption('#viewChoice',view);await inspect(page,'scene-'+view+'-dpr'+dpr,saved,dpr);
      }
      await page.screenshot({path:path.join(out,'current-scene-dpr'+dpr+'.png')});
      for(const scene of ['south','room','north']) {await page.selectOption('#sceneChoice',scene);await inspect(page,'scene-'+scene+'-dpr'+dpr,saved,dpr);}
      await page.evaluate(()=>rooftopReview.setEnvironment({condition:'rain',phase:'dusk',season:'winter'}));
      state=await inspect(page,'environment-dpr'+dpr,saved,dpr);
      check(state.active.atmosphere.condition==='rain'&&state.active.atmosphere.phase==='dusk'&&state.active.atmosphere.seasonal.season==='winter','environment controls ignored');
      await page.evaluate(()=>rooftopReview.setEnvironment({condition:'clear',phase:'afternoon',season:'autumn'}));
      await page.click('button[data-mode="item"]');await ready(page);
      check(await page.locator('.item-card').count()===294,'catalogue is incomplete');
      await page.evaluate(()=>rooftopReview.setItem('wood-2'));await inspect(page,'item-wood-dpr'+dpr,saved,dpr);
      await page.selectOption('#samplingChoice','game');await inspect(page,'item-game-dpr'+dpr,saved,dpr);
      await page.evaluate(()=>rooftopReview.setItem('barrel'));state=await inspect(page,'item-plant-dpr'+dpr,saved,dpr);
      check(state.active.plantAssembly,'plant/soil/pot assembly missing');
      await page.evaluate(()=>rooftopReview.closeItem());await ready(page);
      await page.click('button[data-mode="game"]');
      for(const scene of ['north','south','room']) {await page.selectOption('#sceneChoice',scene);await inspect(page,'game-'+scene+'-dpr'+dpr,saved,dpr);}
      await page.selectOption('#sceneChoice','north');await page.selectOption('#samplingChoice','source');
      for(const view of ['bird','drone','neighbor']) {await page.selectOption('#viewChoice',view);await inspect(page,'game-'+view+'-dpr'+dpr,saved,dpr);}
      for(const mode of ['scene','item','game']) {await page.click('button[data-mode="'+mode+'"]');await ready(page);}
      await inspect(page,'roundtrip-dpr'+dpr,saved,dpr);
      await page.reload();await inspect(page,'reload-dpr'+dpr,saved,dpr);
      await context.close();
    }
    const request=await browser.newContext();
    for(const file of ['/rooftop/3d/index.html','/rooftop/previews/pixel-01/index.html',
      '/rooftop/art/rooftop-furniture-02/preview/index.html','/rooftop/art/rooftop-status-01/preview/index.html',
      '/rooftop/art/rooftop-thumbnail-02/preview/index.html']) {
      check((await request.request.get(origin+file)).status()===404,'obsolete page remains '+file);
    }
    check((await request.request.get(origin+'/rooftop/art/rooftop-actors-02/preview/index.html')).ok(),'character test page removed');
    await request.close();
  } finally {await browser.close();fs.writeFileSync(path.join(out,'visual-review-check.json'),JSON.stringify(report,null,2));}
  console.log(JSON.stringify({cases:report.cases.length,failures:report.failures,errors:report.errors,httpErrors:report.httpErrors}));
  if(report.failures.length||report.errors.length||report.httpErrors.length)process.exitCode=1;
}
run().catch(error=>{console.error(error);process.exitCode=1});
