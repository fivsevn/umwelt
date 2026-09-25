const assert=require('node:assert/strict'),{chromium,webkit}=require('playwright');
const base=process.env.BASE_URL||'http://localhost:8874',out=process.env.QA_OUTPUT||'/Users/d/Documents/Codex/2026-09-25/wo/outputs/petri';
(async()=>{const engine=process.env.BROWSER||'chromium',browser=await (engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{channel:'chrome'}:{});try{
for(const width of [320,390,1440]){
 const page=await browser.newPage({viewport:{width,height:width<500?844:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/habitat.mjs*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('return {reset,stage,react,heartBurst,',"if(canvas.id==='habitat')window.__petriTest={actors:()=>critters};return {reset,stage,react,heartBurst,")})});
 await page.goto(base+'/isopoda/');await page.evaluate(async()=>{const {createRun}=await import('/isopoda/engine.mjs');const s=createRun('maculosa',44,'petri-dish');s.arrivalPending=true;localStorage.setItem('isopoda-fugue-v4',JSON.stringify(s))});await page.reload();await page.locator('#continueBtn').click();assert.equal(await page.locator('#arrivalSpecimens [data-specimen]').count(),1);await page.locator('#settleBtn').click();
 assert.equal(await page.locator('.zoom-tools').isVisible(),false);assert.equal(await page.locator('#scopePanel').isVisible(),false);assert.match(await page.locator('#instruments').innerText(),/普通观察/);
 await page.screenshot({path:`${out}/${engine}-${width}-overview.png`,fullPage:true});
 const next=async()=>{await page.locator('#actions button').first().click();await page.locator('#nextBtn').click()};
 const range=async(id,value)=>page.locator(id).evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}))},value);
 await next();assert.equal(await page.locator('#actions button').first().isEnabled(),false);await page.locator('#scopeToggle').click();assert.equal(await page.locator('#actions button').first().isEnabled(),true);await next();
 assert.equal(await page.locator('#actions button').first().isEnabled(),false);await range('#scopeFocus',50);assert.equal(await page.locator('#actions button').first().isEnabled(),true);await next();
 assert.equal(await page.locator('#actions button').first().isEnabled(),false);await page.locator('#scopeMore').click();await range('#scopeFocus',60);assert.equal(await page.locator('#actions button').first().isEnabled(),true);
 await page.screenshot({path:`${out}/${engine}-${width}-microscope.png`,fullPage:true});
 if(width===390){
  await page.locator('#scopeMore').click();await page.locator('#scopeMore').click();await range('#scopeFocus',76);await page.screenshot({path:`${out}/${engine}-detail.png`,fullPage:true});
  await page.reload();await page.locator('#continueBtn').click();assert.equal(await page.locator('#scopePanel').isVisible(),true);assert.equal(await page.locator('#scopePower').innerText(),'32×');assert.equal(await page.locator('#actions button').first().isEnabled(),true);
  for(const lang of ['en','ja','isopod','zh']){await page.evaluate(async lang=>{const {setLanguage}=await import('/isopoda/i18n.mjs');setLanguage(lang)},lang);assert.ok(!(await page.locator('#playView').innerText()).includes('petri:'))}
  await page.locator('#scopeLess').click();await page.locator('#scopeLess').click();await range('#scopeFocus',60);await page.locator('#scopeCenter').click();
 }

 await next();assert.equal(await page.locator('#actions button').first().isEnabled(),false);const r=await page.locator('#habitat').boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x+r.width/2+Math.max(24,r.width*.07),r.y+r.height/2,{steps:5});await page.mouse.up();assert.equal(await page.locator('#actions button').first().isEnabled(),true);await next();
 await range('#scopeLight',50);assert.equal(await page.locator('#actions button').first().isEnabled(),true);await next();await page.locator('#scopeLess').click();await next();assert.equal(await page.locator('#actions button').first().isEnabled(),false);await page.locator('#scopeToggle').click();await next();await next();
 assert.equal(await page.locator('#endCard').isVisible(),true);assert.match(await page.locator('#endCard').innerText(),/小点没有变小/);assert.equal(await page.locator('#playView').isVisible(),false);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);assert.deepEqual(errors,[]);console.log(engine,width,'PASS');await page.close();
}
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
