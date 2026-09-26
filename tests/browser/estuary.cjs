const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const {click}=require('../support/browser-controls.cjs');
const name=process.env.BROWSER||'chromium',base=process.env.BASE_URL||'http://127.0.0.1:8765',output=process.env.QA_OUTPUT;
if(output)fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await (name==='webkit'?webkit:chromium).launch({headless:true,...(name==='chromium'&&process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 try{
  for(const [width,height] of [[320,568],[390,844],[1440,900]]){
   const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>{errors.push(e.message);console.log('[pageerror]',e.message)});
   page.on('crash',()=>console.log('[page crash]'));
   page.on('framenavigated',frame=>{if(frame===page.mainFrame())console.log('[navigation]',frame.url())});
   await page.goto(base+'/isopoda/');await page.waitForFunction(()=>document.querySelector('#habitatNext')?.onclick);
   const steps=await page.evaluate(async()=>{const {HABITATS}=await import('./habitats.mjs');return HABITATS.findIndex(h=>h.id==='estuary')});
   assert.ok(steps>=0);
   for(let i=0;i<steps;i++)await click(page,page.locator('#habitatNext'));
   assert.equal(await page.locator('#titleCard').getAttribute('data-habitat'),'estuary');
   await click(page,page.locator('#startBtn'));await click(page,page.locator('#settleBtn'));
   for(let i=0;i<6;i++){
    assert.equal(await page.locator('#actions button').count(),3);
    for(const lang of ['en','ja','isopod','zh']){
     await click(page,page.locator(`[data-system-lang="${lang}"]`));
     assert.doesNotMatch(await page.locator('#observation').textContent(),/estuary:v1:/);
    }
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await click(page,page.locator('#actions button').nth(i%3));
    if(i===3){
     const feedback=await page.locator('#observation').textContent();
     await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('#continueBtn')?.onclick);
     assert.deepEqual(errors,[]);await click(page,page.locator('#continueBtn'));
     assert.equal(await page.locator('#observation').textContent(),feedback);
    }
    if(output&&i===3)await page.screenshot({path:path.join(output,`${name}-${width}-estuary-turn.png`),fullPage:true});
    await click(page,page.locator('#nextBtn'));
   }
   assert.ok(await page.locator('#endCard').isVisible());
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('isopoda-fugue-endings-v3')).at(-1).estuaryRecords.length),6);
   assert.doesNotMatch(await page.locator('#endingBody').textContent(),/estuary:v1:/);
   const stored=await page.evaluate(()=>localStorage.getItem('isopoda-fugue-v4'));
   await page.goto(base+'/isopoda/habitat.html');await page.waitForFunction(()=>document.querySelector('[data-preset="estuary"]').onclick);
   await click(page,page.locator('[data-preset="estuary"]'));
   await click(page,page.locator('.scene-transfer summary'));
   for(let i=0;i<6;i++){
    await page.locator('#estuaryStage').selectOption(String(i));
    await click(page,page.locator('#copyScene'));
    const exported=JSON.parse(await page.locator('#sceneText').inputValue());
    assert.equal(exported.metadata.observationIndex,i);
    const anchor=exported.objects.find(o=>o.id==='estuary-origin-wood');anchor.x+=7;
    await page.locator('#sceneText').fill(JSON.stringify(exported));await click(page,page.locator('#importScene'));
    assert.match(await page.locator('#sceneMessage').textContent(),/已精确还原/);
    await click(page,page.locator('#copyScene'));
    assert.equal(JSON.parse(await page.locator('#sceneText').inputValue()).objects.find(o=>o.id===anchor.id).x,anchor.x);
    exported.metadata.nodeId='not-a-stage';await page.locator('#sceneText').fill(JSON.stringify(exported));await click(page,page.locator('#importScene'));
    assert.match(await page.locator('#sceneMessage').textContent(),/原布局已保留/);
    assert.equal(await page.locator('#estuaryStage').inputValue(),String(i));
   }
   await click(page,page.locator('#resetScene'));await page.locator('#scene').scrollIntoViewIfNeeded();
   const box=await page.locator('#scene').boundingBox(),x=box.x+149/384*box.width,y=box.y+225/430*box.height;
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+12,y+8,{steps:4});await page.mouse.up();
   assert.ok(await page.locator('#selectedInspector').isVisible());
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await click(page,page.locator('#estuaryPreview'));await page.waitForTimeout(160);await click(page,page.locator('#estuaryPreview'));
   if(output)await page.screenshot({path:path.join(output,`${name}-${width}-estuary-lab.png`),fullPage:true});
   for(const preset of ['forest','freshwater','groundwater']){await click(page,page.locator(`[data-preset="${preset}"]`));assert.ok(await page.locator('#estuaryStageControl').isHidden())}
   assert.equal(await page.evaluate(()=>localStorage.getItem('isopoda-fugue-v4')),stored,'lab must not mutate the game save');
   assert.deepEqual(errors,[]);await context.close();console.log(`[estuary browser] ${name} ${width}: OK`);
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
