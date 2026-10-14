const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8783',name=process.env.BROWSER||'chromium';
(async()=>{
 const browser=await(name==='webkit'?webkit:chromium).launch({headless:true,...(name==='chromium'&&!process.env.CI?{channel:'chrome'}:{})});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const habitat of ['groundwater','abyssal','petri-dish']){
   await page.goto(base+'/isopoda/?habitat='+habitat);await page.waitForFunction(()=>document.querySelector('#startBtn')?.onclick);
   assert.ok(await page.locator('#startBtn').isDisabled(),habitat+' starts locked');
   for(const lang of ['zh','en','ja','isopod']){
    await page.evaluate(async lang=>(await import('/isopoda/i18n.mjs')).setLanguage(lang),lang);
    assert.ok(await page.locator('#startBtn').isDisabled());assert.ok((await page.locator('#startBtn').innerText()).length>0);
   }
   assert.equal(await page.evaluate(()=>localStorage.getItem('isopoda-fugue-v4')),null,'locked entry creates no run');
  }
  async function complete(habitat){
   await page.goto(base+'/isopoda/?habitat='+habitat);await page.waitForFunction(()=>document.querySelector('#startBtn')?.onclick);
   await page.locator('#startBtn').click();await page.locator('#settleBtn').click();
   let turns=0;
   while(!await page.locator('#endCard').isVisible()){
    assert.ok(turns++<40,'observation reaches its ending');
    await page.locator('#actions button').last().click();await page.locator('#nextBtn').click();
   }
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('isopoda-fugue-v4')).stage),'ended');
   const collection=await page.evaluate(()=>JSON.parse(localStorage.getItem('isopoda-fieldnotes-v1')));
   assert.ok(collection.completedHabitats.includes(habitat));assert.equal(collection.completedObservation,true);
  }
  await complete('terrestrial');
  for(const habitat of ['groundwater','petri-dish']){await page.goto(base+'/isopoda/?habitat='+habitat);await page.waitForFunction(()=>document.querySelector('#startBtn')?.onclick);assert.ok(await page.locator('#startBtn').isEnabled(),habitat+' unlocked after terrestrial ending');}
  await page.goto(base+'/isopoda/?habitat=abyssal');await page.waitForFunction(()=>document.querySelector('#startBtn')?.onclick);assert.ok(await page.locator('#startBtn').isDisabled(),'land completion does not unlock abyssal');
  await complete('sandy-surf');
  await page.goto(base+'/isopoda/?habitat=abyssal');await page.waitForFunction(()=>document.querySelector('#startBtn')?.onclick);assert.ok(await page.locator('#startBtn').isEnabled());
  await page.reload();await page.waitForFunction(()=>document.querySelector('#startBtn')?.onclick);assert.ok(await page.locator('#startBtn').isEnabled(),'completion survives reload');
  assert.deepEqual(errors,[]);console.log(name+' fresh gates, four languages, actual land/beach completion and persisted unlocks PASS');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
