const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const {click}=require('../support/browser-controls.cjs');
const name=process.env.BROWSER||'chromium',base=process.env.BASE_URL||'http://127.0.0.1:8876',out=process.env.QA_OUTPUT;
if(out)fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await (name==='webkit'?webkit:chromium).launch({headless:true,...(name==='chromium'?{executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});
 try{for(const [width,height] of [[320,568],[390,844],[1440,900]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<500}),page=await context.newPage(),errors=[],images=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.resourceType()==='image')images.push(r.url())});
  await page.addInitScript(()=>{window.__ISOPODA_SEAWEED_DEBUG__=data=>{window.seaweedDebug=data;window.seaweedFrames??=[];window.seaweedFrames.push(performance.now());if(window.seaweedFrames.length>200)window.seaweedFrames.shift()}});
  await page.goto(base+'/isopoda/?habitat=shallow-marine');await page.waitForFunction(()=>document.querySelector('#startBtn')?.onclick);
  assert.equal(await page.locator('#titleCard').getAttribute('data-habitat'),'shallow-marine');
  await click(page,page.locator('#startBtn'));await page.waitForSelector('#arrivalCard:not([hidden])');
  const arrivalCount=await page.locator('#arrivalSpecimens .isopod').count();assert.ok([2,3].includes(arrivalCount));
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('isopoda-fugue-v4')).cohort.length),18);
  if(out)await page.screenshot({path:`${out}/${name}-${width}-seaweed-arrival.png`,fullPage:true});
  await page.evaluate(async()=>{const {createRun}=await import('./engine.mjs'),{drawCohort,restoreCollection}=await import('./collection.mjs'),s=createRun('balthica',701,'shallow-marine');s.cohort=drawCohort(restoreCollection(null,null),701,'shallow-marine');localStorage.setItem('isopoda-fugue-v4',JSON.stringify(s))});
  await page.reload();await page.waitForFunction(()=>document.querySelector('#continueBtn')?.onclick);await click(page,page.locator('#continueBtn'));
  await page.waitForTimeout(300);
  assert.equal(await page.locator('#habitat').getAttribute('data-specimens'),'18');
  assert.ok(await page.evaluate(()=>{const a=seaweedDebug.critters;return a.some(c=>c.y<140)&&a.some(c=>c.y>280)}));
  // The second exchange introduces the gesture through the shared humus cue.
  await click(page,page.locator('#actions button').first());await click(page,page.locator('#nextBtn'));await click(page,page.locator('#actions button').first());
  assert.ok(await page.locator('#interactionCue').isVisible());
  const point=await page.evaluate(async()=>{
   const {bed,critters}=seaweedDebug,{cameraWindow}=await import('./habitat.mjs'),rect=document.querySelector('#habitat').getBoundingClientRect(),v=cameraWindow(rect.width,rect.height);
   const plant=bed.frame.plants.find(p=>p.z>=40&&critters.some(a=>a.weed.plant===p.id&&a.hitCells.length)&&p.cells.some(([x,y])=>x>40&&x<330&&y>80&&y<330&&bed.frame.mask.depth[y*384+x]===p.z&&!critters.some(a=>Math.hypot(a.x-x,a.y-y)<25)));
   const cell=plant.cells.find(([x,y])=>x>40&&x<330&&y>80&&y<330&&bed.frame.mask.depth[y*384+x]===plant.z&&!critters.some(a=>Math.hypot(a.x-x,a.y-y)<25));
   return {x:rect.x+(cell[0]-v.sx)*v.scale,y:rect.y+(cell[1]-v.sy)*v.scale,id:plant.id,scale:v.scale};
  });
  await page.mouse.move(point.x,point.y);await page.mouse.down();
  for(let i=1;i<=10;i++){await page.mouse.move(point.x+i*2.8*point.scale,point.y);await page.waitForTimeout(20)}
  assert.ok(await page.evaluate(id=>Math.abs(seaweedDebug.bed.bends.get(id)||0)>10,point.id),'drag bends the hit blade');
  assert.ok(await page.evaluate(id=>seaweedDebug.critters.some(a=>a.weed.plant===id&&a.weed.lastStartle>=0),point.id),'attached animal reacts to actual drag');
  if(out)await page.screenshot({path:`${out}/${name}-${width}-seaweed-startle.png`,fullPage:true});
  await page.mouse.up();await page.waitForTimeout(100);assert.ok(await page.locator('#interactionCue').isHidden());
  assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('isopoda-fugue-v4')).directRecords.some(r=>r.type==='seaweed')));
  if(out)await page.screenshot({path:`${out}/${name}-${width}-seaweed.png`,fullPage:true});
  await page.waitForTimeout(width===390?11500:2000);
  assert.ok(await page.evaluate(id=>Math.abs(seaweedDebug.bed.bends.get(id)||0)<1,point.id),'release returns to natural sway');
  assert.ok(await page.evaluate(()=>seaweedDebug.critters.some(a=>a.weed.visiblePixels<a.weed.totalPixels)),'real partial occlusion');
  assert.ok(await page.evaluate(()=>seaweedDebug.critters.every(a=>a.hitCells.every(([x,y])=>seaweedDebug.bed.frame.mask.depth[y*384+x]<=a.depth||x<0||x>=384||y<0||y>=430))),'no covered pixels can be picked');
  if(width===390){assert.ok(await page.evaluate(()=>seaweedDebug.bed.events.crossed>0),'autonomous cross-blade movement');console.log(name,'frame median ms',await page.evaluate(()=>{const f=seaweedFrames.map((t,i,a)=>i?t-a[i-1]:0).slice(1).sort((a,b)=>a-b);return f[Math.floor(f.length/2)]}))}
  if(width===390){
   await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(350);
   assert.ok(await page.evaluate(()=>seaweedDebug.critters.every(a=>Number.isFinite(a.x)&&Number.isFinite(a.y))));
   if(name==='chromium'){
    const client=await context.newCDPSession(page);
    const touch=await page.evaluate(async()=>{const {bed,critters}=seaweedDebug,{cameraWindow}=await import('./habitat.mjs'),r=document.querySelector('#habitat').getBoundingClientRect(),v=cameraWindow(r.width,r.height);for(const p of bed.frame.plants){const c=p.cells.find(([x,y])=>x>50&&x<280&&y>80&&y<300&&bed.frame.mask.depth[y*384+x]===p.z&&!critters.some(a=>Math.hypot(a.x-x,a.y-y)<30));if(c)return {x:r.x+(c[0]-v.sx)*v.scale,y:r.y+(c[1]-v.sy)*v.scale}}});
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch]});
    await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:touch.x+20,y:touch.y}]});
    await client.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
    assert.equal(await page.evaluate(()=>seaweedDebug.bed.held),null);
   }
   await page.emulateMedia({reducedMotion:'no-preference'});
  }
  await click(page,page.locator('#nextBtn'));
  for(let i=2;i<9;i++){
   for(const lang of ['en','ja','isopod','zh']){await click(page,page.locator(`[data-system-lang="${lang}"]`));assert.doesNotMatch(await page.locator('#observation').textContent(),/kelp:/)}
   assert.equal(await page.locator('#actions button').count(),3);await click(page,page.locator('#actions button').nth(i%3));
   assert.doesNotMatch(await page.locator('#observation').textContent(),/kelp:/);
   if(i===4){const text=await page.locator('#observation').textContent();await page.reload();await page.waitForFunction(()=>document.querySelector('#continueBtn')?.onclick);await click(page,page.locator('#continueBtn'));assert.equal(await page.locator('#observation').textContent(),text)}
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await click(page,page.locator('#nextBtn'));
  }
  assert.ok(await page.locator('#endCard').isVisible());assert.doesNotMatch(await page.locator('#endingBody').textContent(),/kelp:/);
  const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('isopoda-fugue-v4')));assert.equal(save.records.length,9);assert.equal(save.ending,'shallow-marine-observed');
  if(out)await page.screenshot({path:`${out}/${name}-${width}-seaweed-ending.png`,fullPage:true});
  await click(page,page.locator('#restartBtn'));assert.ok(await page.locator('#titleCard').isVisible());
  await page.goto(base+'/isopoda/habitat.html');await page.waitForFunction(()=>document.querySelector('[data-preset="shallow-marine"]')?.onclick);await click(page,page.locator('[data-preset="shallow-marine"]'));
  assert.equal(await page.locator('.habitat-reference').count(),3);await click(page,page.locator('#copyScene'));const scene=JSON.parse(await page.locator('#sceneText').inputValue());
  const plant=scene.objects.find(o=>o.params?.layered);plant.z=81;plant.flipX=true;plant.angle=.3;plant.x+=8;
  await page.locator('#sceneText').fill(JSON.stringify(scene));await click(page,page.locator('#importScene'));assert.match(await page.locator('#sceneMessage').textContent(),/已精确还原/);await click(page,page.locator('#copyScene'));assert.deepEqual(JSON.parse(await page.locator('#sceneText').inputValue()),scene);
  await page.locator('#referenceDepth').fill('72');await page.locator('#referenceDepth').dispatchEvent('change');
  await click(page,page.locator('#copyScene'));assert.equal(JSON.parse(await page.locator('#sceneText').inputValue()).reference.depth,72);
  await click(page,page.locator('#estuaryPreview'));await page.waitForTimeout(250);await click(page,page.locator('#estuaryPreview'));
  if(out){await page.locator('#scene').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${name}-${width}-seaweed-lab.png`})}
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('isopoda-fugue-v4'))),save);
  await page.goto(base+'/isopoda/morphology/');await page.waitForFunction(()=>document.querySelector('#speciesSelect').options.length>1);const value=await page.evaluate(async()=>{const {SPECIES}=await import('../species-registry.mjs');return String(SPECIES.findIndex(s=>s.id==='balthica'))});await page.selectOption('#speciesSelect',value);assert.equal(await page.locator('[data-ref="seaweed-balthica-refuge"]').count(),1);
  assert.deepEqual(errors,[]);assert.ok(!images.some(url=>/seaweed|kelp/.test(url)),'no new image asset');
  console.log(`${name} ${width}: drag, occlusion, nine observations, languages, reload, ending, reset, labs PASS`);await context.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
