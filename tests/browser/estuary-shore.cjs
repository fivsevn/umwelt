const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const name=process.env.BROWSER||'chromium',base=process.env.BASE_URL||'http://127.0.0.1:8873',output=process.env.QA_OUTPUT;
(async()=>{
 const browser=await (name==='webkit'?webkit:chromium).launch({headless:true,...(name==='chromium'&&process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 try{
  if(output)fs.mkdirSync(output,{recursive:true});
  for(const [width,height] of [[320,568],[390,844],[1440,900]]){
   const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto(base+'/isopoda/?habitat=estuary');
   await page.waitForFunction(()=>document.querySelector('#startBtn')?.onclick);
   await page.locator('#startBtn').click();await page.locator('#settleBtn').click();
   const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('isopoda-fugue-v4')));
   for(let turn=0;turn<8;turn++){
    for(const point of [0,1,2]){
     let s=await saved();for(let walk=0;s.shorePoint!==point&&walk<3;walk++){await page.locator(point<s.shorePoint?'#shorePrev':'#shoreNext').click();s=await saved()}assert.equal(s.shorePoint,point)
     assert.equal(s.records.length,turn,'walking does not advance time');
     await page.waitForFunction(t=>document.querySelector('#habitat').dataset.shoreTide===String(t),turn%4);
     assert.equal(await page.locator('#actions button').count(),0);
     assert.equal(await page.locator('#instruments [data-scale="numeric"]').count(),3);assert.equal(await page.locator('#instruments [data-scale="qualitative"]').count(),1);assert.match(await page.locator('#dayLabel').textContent(),/\([−\-\d.]+, [−\-\d.]+\) m/);
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
     if(output&&turn===2&&point===1)await page.screenshot({path:path.join(output,`${name}-${width}-shore.png`),fullPage:true});
    }
    if(turn===3){
     const before=await saved();await page.reload();await page.locator('#continueBtn').click();assert.deepEqual((await saved()).records,before.records);assert.equal((await saved()).shorePoint,2);
     for(const lang of ['en','ja','isopod','zh']){await page.locator(`[data-system-lang="${lang}"]`).click();assert.doesNotMatch(await page.locator('#observation').textContent(),/estuary:|undefined/)}
     await page.locator('#journalBtn').click();assert.doesNotMatch(await page.locator('#drawer').textContent(),/estuary:v[12]:|undefined|‰/);await page.locator('#closeDrawer').click();
    }
    await page.locator('#nextBtn').click();
   }
   assert.ok(await page.locator('#endCard').isVisible());assert.equal((await saved()).ending,'estuary-shore');assert.equal((await saved()).records.length,8);
   await page.locator('#endingCatalogBtn').click();assert.ok(await page.locator('#drawer').isVisible());await page.locator('#closeDrawer').click();
   await page.locator('#restartBtn').click();await page.locator('#startBtn').click();await page.locator('#settleBtn').click();assert.equal((await saved()).records.length,0);
   const beforeLab=JSON.stringify(await saved());
   await page.goto(base+'/isopoda/habitat.html');await page.locator('[data-preset="estuary"]').click();
   await page.locator('.scene-transfer summary').click();
   for(let i=6;i<18;i++){
    await page.locator('#estuaryStage').selectOption(String(i));await page.locator('#copyScene').click();
    await page.waitForFunction(()=>document.querySelector('#sceneText').value.startsWith('{'));
    const data=JSON.parse(await page.locator('#sceneText').inputValue());assert.equal(data.metadata.point,Math.floor((i-6)/4));assert.equal(data.metadata.tide,(i-6)%4);
    data.objects.find(o=>o.id==='shore-wood').x+=7;
    await page.locator('#sceneText').fill(JSON.stringify(data));await page.locator('#importScene').click();
    assert.match(await page.locator('#sceneMessage').textContent(),/已精确还原/);assert.equal(await page.locator('#estuaryStage').inputValue(),String(i));
    const pending=page.waitForEvent('download');await page.locator('#downloadScene').click();const download=await pending;assert.equal(download.suggestedFilename(),`habitat-estuary-shore-${i-6}.json`);assert.deepEqual(JSON.parse(fs.readFileSync(await download.path(),'utf8')),data);
    await page.locator('#estuaryPreview').click();assert.equal(await page.locator('#estuaryPreview').getAttribute('aria-pressed'),'true');const before=await page.locator('#scene').evaluate(c=>c.toDataURL());await page.waitForTimeout(160);assert.notEqual(await page.locator('#scene').evaluate(c=>c.toDataURL()),before);await page.locator('#estuaryPreview').click();
   }
   await page.locator('[data-preset="forest"]').click();assert.ok(await page.locator('#estuaryStageControl').isHidden());
   assert.equal(JSON.stringify(await saved()),beforeLab);
   await page.goto(base+'/isopoda/?habitat=freshwater');await page.locator('#startBtn').click();await page.locator('#settleBtn').click();assert.ok(await page.locator('#shorePrev').isHidden());assert.ok(await page.locator('#shoreNext').isHidden());assert.ok(await page.locator('#actions').isVisible());
   assert.deepEqual(errors,[]);await context.close();
   console.log(`${name} ${width}: full shore flow, reload, languages, collection, reset and 12 lab layouts OK`);
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
