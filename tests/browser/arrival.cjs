const {completedPrerequisites}=require('../support/observation-fixtures.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8897',engine=process.env.BROWSER||'chromium',out=process.env.QA_OUTPUT||'/tmp/arrival-qa';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await(engine==='webkit'?webkit:chromium).launch({...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 try{for(const width of [320,390,1440]){
  const page=await browser.newPage({viewport:{width,height:width<500?844:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const id of ['terrestrial','freshwater','groundwater','estuary','intertidal','sandy-surf','shallow-marine','abyssal','petri-dish']){
   await page.goto(base+'/isopoda/?habitat='+id);await page.waitForFunction(()=>!!document.querySelector('#startBtn')?.onclick);
 await completedPrerequisites(page);await page.reload();await page.waitForFunction(()=>!!document.querySelector('#startBtn')?.onclick);

   if(id==='petri-dish'){
    await page.evaluate(()=>{const c=JSON.parse(localStorage.getItem('isopoda-fieldnotes-v1'));c.unlocked.push('dairy','giganteus');localStorage.setItem('isopoda-fieldnotes-v1',JSON.stringify(c))});
    await page.reload();await page.waitForFunction(()=>!!document.querySelector('#startBtn')?.onclick);
   }
   const unlockedBefore=await page.evaluate(()=>JSON.parse(localStorage.getItem('isopoda-fieldnotes-v1')).unlocked);
   await page.locator('#startBtn').click();await page.locator('#arrivalCard').waitFor();
   const species=await page.locator('#arrivalSpecimens .isopod').evaluateAll(els=>els.map(e=>e.dataset.species));
   if(id==='terrestrial')assert.equal(species.length,7);else assert.equal(species.filter(s=>s!=='naigua').length,new Set(species.filter(s=>s!=='naigua')).size);
   if(id==='terrestrial')assert.ok(await page.locator('#arrivalSpecimens .isopod').evaluateAll(els=>new Set(els.map(e=>Math.round(e.getBoundingClientRect().top))).size===1),'terrestrial arrival stays on one row');
   assert.equal(await page.locator('#arrivalNext').isVisible(),id==='petri-dish');
   if(id==='petri-dish')assert.ok(await page.evaluate(()=>{const row=document.querySelector('.arrival-specimen-row').getBoundingClientRect(),prev=document.querySelector('#arrivalPrev').getBoundingClientRect(),next=document.querySelector('#arrivalNext').getBoundingClientRect();return prev.right<next.left&&Math.abs((prev.top+prev.bottom-row.top-row.bottom)/2)<2&&Math.abs(prev.top-next.top)<2}));
   if(id==='freshwater')assert.ok([2,3].includes(species.filter(id=>id!=='naigua').length));
   const centered=await page.evaluate(()=>{const els=[...document.querySelectorAll('#arrivalSpecimens .isopod')],box=document.querySelector('#arrivalSpecimens').getBoundingClientRect(),first=els[0].getBoundingClientRect(),last=els.at(-1).getBoundingClientRect();return Math.abs((first.left+last.right)/2-(box.left+box.right)/2)<2});assert.ok(centered,`${id} centered`);
   for(const lang of ['zh','en','ja','isopod']){
    await page.evaluate(async lang=>{(await import('/isopoda/i18n.mjs')).setLanguage(lang)},lang);
    assert.equal(await page.locator('#settleBtn').textContent(),{zh:'开始观察',en:'Begin observation',ja:'観察を始める',isopod:await page.evaluate(async()=> (await import('/isopoda/i18n.mjs')).t('startObservation'))}[lang]);
    if(id!=='terrestrial'&&['zh','ja'].includes(lang))assert.match(await page.locator('#arrivalCard .panel-caption').textContent(),/。$/);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    if(lang==='zh')await page.screenshot({path:`${out}/${engine}-${width}-${id}.png`});
   }
   if(id==='petri-dish'){
    const observed=[],eligible=unlockedBefore.filter(id=>id!=='giganteus');
    for(let i=0;i<eligible.length;i++){
     const chosen=await page.locator('#arrivalSpecimens .isopod').first().getAttribute('data-species');observed.push(chosen);assert.ok(eligible.includes(chosen));await page.locator('#arrivalNext').click();
    }
    assert.equal(new Set(observed).size,new Set(eligible).size);
    await page.locator('#arrivalPrev').click();const chosen=await page.locator('#arrivalSpecimens .isopod').first().getAttribute('data-species');
    await page.reload();await page.waitForFunction(()=>!!document.querySelector('#continueBtn')?.onclick);await page.locator('#continueBtn').click();assert.equal(await page.locator('#arrivalSpecimens .isopod').first().getAttribute('data-species'),chosen);
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('isopoda-fieldnotes-v1')).unlocked.filter(id=>id!=='naigua')),unlockedBefore.filter(id=>id!=='naigua'));
   }
   await page.locator('#settleBtn').click();await page.locator('#playView').waitFor();
   if(id==='freshwater')assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('isopoda-fugue-v4')).scene.materialStage),0);
   console.log(engine,width,id,'PASS');
  }
  await page.goto(base+'/isopoda/habitat.html');await page.waitForFunction(()=>document.querySelectorAll('.asset-card').length>0);
  await page.locator('[data-preset="forest"]').click();assert.match(await page.locator('#habitatReferenceTitle').textContent(),/饲养箱/);assert.equal(await page.locator('[data-preset="forest"]').textContent(),'TERRARIUM');
  assert.deepEqual(errors,[]);await page.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
