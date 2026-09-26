// BASE_URL=http://127.0.0.1:8765 BROWSER=webkit node tests/browser/habitat-lab.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const {click:clickControl}=require('../support/browser-controls.cjs');
const base=process.env.BASE_URL||'http://127.0.0.1:8765';
(async()=>{
 const browser=await (process.env.BROWSER==='webkit'?webkit:chromium).launch({headless:true,...(process.env.CHROME_PATH&&process.env.BROWSER!=='webkit'?{executablePath:process.env.CHROME_PATH}:{})});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.log('[pageerror]',e.message)});
   page.on('crash',()=>console.log('[page crash]'));
   page.on('framenavigated',frame=>{if(frame===page.mainFrame())console.log('[navigation]',frame.url())});
 await page.goto(base+'/isopoda/habitat.html');
 await page.waitForFunction(()=>document.querySelectorAll('.asset-card').length>0);
 await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('.scene-transfer').getAttribute('open'),null);
 assert.equal(await page.locator('#sceneText').isVisible(),false);
 assert.equal(await page.locator('.inspector #toggleReference').count(),1);
 assert.ok(await page.evaluate(()=>document.querySelector('[data-preset]').offsetHeight>document.querySelector('[data-category]').offsetHeight),'environment controls lead the hierarchy');
 await page.locator('.scene-transfer summary').click();
 const originalStorage=await page.evaluate(()=>JSON.stringify({...localStorage}));
 const click=selector=>clickControl(page,selector);
 const snapshot=async()=>{await click('#copyScene');return JSON.parse(await page.locator('#sceneText').inputValue())};
 const restore=async data=>{await page.locator('#sceneText').fill(typeof data==='string'?data:JSON.stringify(data));await click('#importScene')};
 const active=()=>page.locator('[data-preset][aria-pressed=true]').getAttribute('data-preset');
 const ids=await page.evaluate(async()=>{const {SPECIES}=await import('/isopoda/species-registry.mjs');return SPECIES.map(p=>p.id)});
 assert.deepEqual(await page.locator('#referenceSpecies option').evaluateAll(options=>options.map(o=>o.value)),ids);
 const presets=await page.evaluate(async()=>{const {HABITATS}=await import('/isopoda/habitats.mjs');return HABITATS.map(h=>h.scene)});
 assert.deepEqual(await page.locator('[data-preset]').evaluateAll(buttons=>buttons.map(b=>b.dataset.preset)),presets,'new habitats must reach the public lab');
 for(const preset of presets){
  await click(`[data-preset="${preset}"]`);
  assert.equal(await active(),preset);
  assert.ok(await page.locator('.asset-card').count()>0);
  const data=await snapshot();
  const eligible=await page.evaluate(async({id,species})=>{const {eligibleSpecies}=await import('/isopoda/habitats.mjs');const {speciesById}=await import('/isopoda/species-registry.mjs');return eligibleSpecies(speciesById(species),id==='forest'?'terrestrial':id)},{id:preset,species:data.reference.species});
  assert.ok(eligible,`${preset} reference membership`);
  await click('[data-preset="forest"]');await restore(data);
  assert.equal(await active(),preset,'import synchronizes preset: '+await page.locator('#sceneMessage').innerText());assert.deepEqual(await snapshot(),data);
  await click('#copyShare');const share=await page.locator('#sceneText').inputValue();await restore(share);assert.deepEqual(await snapshot(),data);
  const names={forest:'forest-litter',freshwater:'freshwater-pool',groundwater:'limestone-groundwater-cave',estuary:'brackish-estuary',intertidal:'intertidal-rock-pool','sandy-surf':'sandy-surf-zone','shallow-marine':'nearshore-seaweed-bed',abyssal:'abyssal-plain','petri-dish':'asimovs-dish'};
  const sceneDownload=preset+' download';
  const pendingDownload=page.waitForEvent('download');await click('#downloadScene');const exported=await pendingDownload;
  assert.equal(exported.suggestedFilename(),preset==='estuary'?'habitat-layout-brackish-estuary-observation-01-mark.json':preset==='freshwater'?'habitat-layout-freshwater-pool-stage-01-leaf.json':`habitat-layout-${names[preset]}.json`,sceneDownload);
  assert.deepEqual(JSON.parse(fs.readFileSync(await exported.path(),'utf8')),data,sceneDownload+' content');
  await click('#clearScene');assert.equal((await snapshot()).objects.length,0);
  await click('#resetScene');assert.equal((await snapshot()).background.type,data.background.type);
 }
 // Cached moving leaves must retain exactly the integer geometry of direct painting.
 const cachedPlants=await page.evaluate(async()=>{
  const {drawWaterPlant}=await import('/isopoda/scenery/aquatic-materials.mjs');
  const {drawAquaticPlant}=await import('/isopoda/scenery/aquatic.mjs');const result=[];
  for(const kind of ['waterweed','rockweed','kelp','seagrass','saltmarsh','ulva'])for(const angle of [0,.37]){
   const a=document.createElement('canvas'),b=document.createElement('canvas');a.width=b.width=384;a.height=b.height=430;
   const ctx=b.getContext('2d'),raw=new Proxy(ctx,{get(t,k){if(k==='drawImage')return undefined;const v=t[k];return typeof v==='function'?v.bind(t):v},set(t,k,v){t[k]=v;return true}});
   const options={kind,x:173.4,y:230.7,a:angle,scale:.8,seed:57,height:92},sway=j=>Math.sin(j*.03)*3;
   if(['seagrass','saltmarsh','ulva'].includes(kind)){drawAquaticPlant(a.getContext('2d'),{...options,time:1.7});drawAquaticPlant(raw,{...options,time:1.7})}
   else{drawWaterPlant(a.getContext('2d'),options,sway);drawWaterPlant(raw,options,sway)}
   result.push({kind,angle,equal:a.toDataURL()===b.toDataURL()});
  }return result;
 });
 assert.ok(cachedPlants.every(x=>x.equal),JSON.stringify(cachedPlants));
 await click('[data-preset="forest"]');await click('[data-category="calcium"]');
 await click('[data-preset="freshwater"]');assert.equal(await page.locator('[data-category="all"]').getAttribute('aria-pressed'),'true');assert.ok(await page.locator('[data-category="calcium"]').isDisabled());
 assert.equal(await page.locator('#freshwaterStageControl').isVisible(),true);assert.equal(await page.locator('#freshwaterStage option').count(),5);
 await page.locator('#freshwaterStage').selectOption('4');let staged=await snapshot();assert.equal(staged.metadata.materialStage,4);assert.equal(staged.metadata.stageId,'redeposited');
 assert.ok(staged.objects.filter(object=>object.type==='freshwater-detritus-01').length>=3);
 const stagedDownloadPromise=page.waitForEvent('download');await click('#downloadScene');const stagedDownload=await stagedDownloadPromise;
 assert.equal(stagedDownload.suggestedFilename(),'habitat-layout-freshwater-pool-stage-05-redeposited.json');
 await click('[data-preset="forest"]');assert.equal(await page.locator('#freshwaterStageControl').isVisible(),false);
 await restore(staged);assert.equal(await active(),'freshwater');assert.equal(await page.locator('#freshwaterStage').inputValue(),'4');assert.deepEqual(await snapshot(),staged);
 // Verify the reference pixels use the same habitat projection as the game, including abyssal enlargement.
 await click('[data-preset="abyssal"]');
 let data=await snapshot();data.objects=[];data.reference={...data.reference,visible:true,x:190,y:210,a:0,species:'giganteus',stage:'L'};await restore(data);
 assert.equal(await page.locator('#referenceSpecies').inputValue(),'giganteus');
 const pixelMatch=await page.evaluate(async reference=>{
  const {sceneActorPixels}=await import('/isopoda/habitat.mjs');const {renderModel,pixelAnatomy}=await import('/isopoda/sprites.mjs');const {speciesById}=await import('/isopoda/species-registry.mjs');const {habitatConfig}=await import('/isopoda/habitats.mjs');
  const model=renderModel(speciesById(reference.species).visual,{stage:reference.stage,seed:reference.seed}),source=new Map();
  for(const part of pixelAnatomy(model,{posture:'normal',phase:0,moving:false}))for(const [x,y,c] of part.cells)source.set(x+','+y,c);
  const cells=sceneActorPixels(source,{...reference,model,habitatScale:habitatConfig('abyssal').actorScale}),ctx=document.querySelector('#scene').getContext('2d');
  const scratch=document.createElement('canvas').getContext('2d');
  return cells.every(([x,y,color])=>{if(x<0||y<0||x>=384||y>=430)return true;scratch.clearRect(0,0,1,1);scratch.fillStyle=color;scratch.fillRect(0,0,1,1);return [...ctx.getImageData(x,y,1,1).data].join()===[...scratch.getImageData(0,0,1,1).data].join()});
 },data.reference);assert.ok(pixelMatch,'game-scale specimen pixels');
 // Same-z overlap selects the last painted object; empty margins do not steal clicks.
 await click('[data-preset="forest"]');data=await snapshot();data.reference.visible=false;
 const object={id:'bottom',type:'stone-round-01',x:180,y:200,angle:0,scale:3,z:4,seed:7,params:{variant:0,scale:1}};
 data.objects=[object,{...object,id:'top'}];await restore(data);
 const point=async(x,y)=>{const box=await page.locator('#scene').boundingBox();return {x:box.x+1+x*(box.width-2)/384,y:box.y+1+y*(box.height-2)/430}};
 await page.locator('#scene').scrollIntoViewIfNeeded();let p=await point(180,200);await page.mouse.click(p.x,p.y);
 assert.ok((await page.locator('#selectedId').innerText()).startsWith('top /'));
 await click('[data-action="scale-up"]');assert.equal((await snapshot()).objects[1].scale,3.1,'imported large objects do not shrink on scale-up');
 await click('[data-action="back"]');assert.ok((await snapshot()).objects[1].z<4);
 await click('[data-action="front"]');assert.ok((await snapshot()).objects[1].z>4);
 await click('[data-action="flip-horizontal"]');await click('[data-action="rotate-right"]');
 const changed=await snapshot();assert.equal(changed.objects[1].flipX,true);assert.ok(changed.objects[1].angle>0);
 // A render-invalid import must leave the previous editable scene intact.
 const invalid=structuredClone(changed);invalid.objects[0].params=null;await restore(invalid);
 assert.match(await page.locator('#sceneMessage').innerText(),/原布局已保留/);assert.deepEqual(await snapshot(),changed);
 const renderInvalid=structuredClone(changed);renderInvalid.objects[0].type='leaf-broad-01';renderInvalid.objects[0].params={variant:0,tone:'waterlogged'};
 await restore(renderInvalid);assert.match(await page.locator('#sceneMessage').innerText(),/原布局已保留/);assert.deepEqual(await snapshot(),changed);
 // Download is valid importable JSON; file-import clears its input for repeat imports.
 const downloadPromise=page.waitForEvent('download');await click('#downloadScene');const download=await downloadPromise;
 assert.deepEqual(JSON.parse(fs.readFileSync(await download.path(),'utf8')),changed);
 await page.locator('#sceneFile').setInputFiles({name:'scene.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(changed))});
 await page.waitForFunction(()=>document.querySelector('#sceneFile').value==='');assert.deepEqual(await snapshot(),changed);
 // Dragging remains proportional at small sizes and ignores secondary pointers.
 for(const [width,height] of [[320,568],[390,844],[768,900],[1120,800],[1121,800],[1440,900],[1440,1400]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.waitForFunction(narrow=>document.querySelector('.scene-transfer').parentElement.className===(narrow?'workspace':'panel viewer-panel'),width<=1120);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width} overflow`);
  assert.equal(await page.locator('.scene-transfer').evaluate(e=>e.parentElement.className),width<=1120?'workspace':'panel viewer-panel');
  await click('.scene-transfer summary');assert.equal(await page.locator('#sceneText').isVisible(),false);await click('.scene-transfer summary');
  await page.locator('#scene').scrollIntoViewIfNeeded();
  const before=await snapshot();await page.locator('#scene').scrollIntoViewIfNeeded();
  // WebKit may finish viewport-induced scrolling on the next pointer update.
  await page.locator("#scene").hover();
  assert.ok(await page.locator('#scene').evaluate(e=>{
   const r=e.getBoundingClientRect(),shell=e.parentElement.getBoundingClientRect();
   return Math.abs(r.width/r.height-384/430)<.003&&r.top>=shell.top&&r.bottom<=shell.bottom;
  }),`${width} full proportional canvas`);
  p=await point(before.objects[1].x,before.objects[1].y);await page.mouse.move(p.x,p.y);await page.mouse.down();
  await page.locator('#scene').dispatchEvent('pointermove',{pointerId:999,clientX:0,clientY:0});
  const unaffected=await page.evaluate(()=>{document.querySelector('#copyScene').click();return JSON.parse(document.querySelector('#sceneText').value)});
  assert.equal(unaffected.objects[1].x,before.objects[1].x,'secondary pointer ignored');
  const end=await point(before.objects[1].x+8,before.objects[1].y+6);await page.mouse.move(end.x,end.y);await page.mouse.up();
  const after=await snapshot();assert.ok(Math.abs(after.objects[1].x-before.objects[1].x-8)<1,`${width} proportional drag: ${before.objects[1].x} -> ${after.objects[1].x}`);
  if(process.env.QA_OUTPUT){fs.mkdirSync(process.env.QA_OUTPUT,{recursive:true});await page.screenshot({path:`${process.env.QA_OUTPUT}/habitat-${width}.png`,fullPage:true})}
 }
 console.log('PASS viewport and editor operations');
 assert.equal(await page.evaluate(()=>JSON.stringify({...localStorage})),originalStorage,'editor does not modify game saves');
 assert.deepEqual(errors,[]);console.log('PASS habitat lab: registry, presets, transfer, scale, selection, layers, rollback, download, responsive dragging and save isolation');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
