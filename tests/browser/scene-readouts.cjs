const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8892',engine=process.env.BROWSER||'chromium',out=process.env.QA_OUTPUT||'/tmp/scene-readouts-qa';
fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await(engine==='webkit'?webkit:chromium).launch(engine==='chromium'&&process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{});try{
 for(const width of [320,390,1440]){
  const page=await browser.newPage({viewport:{width,height:width<500?844:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install({time:new Date('2026-09-26T06:20:00Z')});
  await page.goto(base+'/isopoda/');
  for(const id of ['terrestrial','freshwater','groundwater','intertidal','sandy-surf','shallow-marine','abyssal','petri-dish']){
   await page.evaluate(async id=>{const {setLanguage}=await import('/isopoda/i18n.mjs');setLanguage('zh');const {createRun}=await import('/isopoda/engine.mjs');const {habitatConfig}=await import('/isopoda/habitats.mjs');const h=habitatConfig(id),s=createRun(h.species?.[0]||'dairy',37,id);s.arrivalPending=false;localStorage.setItem('isopoda-fugue-v4',JSON.stringify(s))},id);
   await page.reload();await page.waitForFunction(()=>!!document.querySelector('#continueBtn')?.onclick);await page.locator('#continueBtn').click();await page.locator('#instruments span').first().waitFor();
   for(const lang of ['zh','en','ja','isopod']){
    await page.evaluate(async lang=>{const {setLanguage}=await import('/isopoda/i18n.mjs');setLanguage(lang)},lang);
    const rows=await page.locator('#instruments>span').allTextContents();assert.equal(rows.length,4,id);for(const row of rows.slice(0,3))assert.match(row,/\d/);assert.doesNotMatch(rows[3],/\d/);
    const bounds=await page.evaluate(()=>{const box=document.querySelector('#instruments').getBoundingClientRect();return [...document.querySelectorAll('#instruments>span')].map(el=>{const r=el.getBoundingClientRect();return r.left>=box.left-1&&r.right<=box.right+1&&r.bottom<=box.bottom+1})});assert.ok(bounds.every(Boolean),`${engine} ${width} ${id} ${lang} clipping`);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    if(lang==='en'||lang==='zh')await page.screenshot({path:`${out}/${engine}-${width}-${id}-${lang}.png`});
   }
   await page.evaluate(async()=>{const {setLanguage}=await import('/isopoda/i18n.mjs');setLanguage('zh')});
   const before=await page.locator('#dayLabel').textContent();
   if(id==='petri-dish'){
    await page.clock.runFor(1100);const a=await page.locator('#dayLabel').textContent();await page.clock.fastForward(61000);assert.notEqual(await page.locator('#dayLabel').textContent(),a);await page.clock.resume();
    await page.locator('#scopeToggle').click();const text=await page.locator('#instruments').textContent();await page.locator('#scopeFocus').press('ArrowRight');assert.notEqual(await page.locator('#instruments').textContent(),text);
   }else{
    let count=0;while(await page.locator('#playView').isVisible()){
     await page.locator('#actions button').first().click();const value=await page.locator('#dayLabel').textContent(),rows=await page.locator('#instruments').textContent();
     if(count===0){await page.reload();await page.waitForFunction(()=>!!document.querySelector('#continueBtn')?.onclick);await page.locator('#continueBtn').click();assert.equal(await page.locator('#dayLabel').textContent(),value);assert.equal(await page.locator('#instruments').textContent(),rows)}
     await page.locator('#nextBtn').click();if(++count===1)assert.notEqual(await page.locator('#dayLabel').textContent(),before,id);assert.ok(count<=21);
    }
    assert.equal(await page.locator('#endCard').isVisible(),true);
   }
   console.log(engine,width,id,'PASS');
  }
  await page.goto(base+'/isopoda/habitat.html');
  for(const id of ['forest','freshwater','groundwater','intertidal','sandy-surf','shallow-marine','abyssal','petri-dish']){
   await page.locator(`[data-preset="${id}"]`).click();assert.ok(await page.locator('.habitat-reference').count()>0);assert.match(await page.locator('#habitatReferenceLimits').textContent(),/Readings are authored/);
  }
  await page.screenshot({path:`${out}/${engine}-${width}-lab.png`,fullPage:true});assert.deepEqual(errors,[]);await page.close();
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
