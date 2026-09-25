const assert=require('node:assert/strict'),{chromium,webkit}=require('playwright');
const base=process.env.BASE_URL||'http://localhost:8874',out=process.env.QA_OUTPUT||'/Users/d/Documents/Codex/2026-09-25/wo/outputs/petri';
(async()=>{const engine=process.env.BROWSER||'chromium',browser=await (engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{channel:'chrome'}:{});try{
for(const width of [320,390,1440]){
 const page=await browser.newPage({viewport:{width,height:width<500?844:1000},hasTouch:width<500,isMobile:width<500}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/habitat.mjs*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('return {reset,stage,react,heartBurst,',"if(canvas.id==='habitat')window.__petriTest={actors:()=>critters};return {reset,stage,react,heartBurst,")})});
 await page.goto(base+'/isopoda/');await page.evaluate(async()=>{const {createRun}=await import('/isopoda/engine.mjs');const s=createRun('maculosa',44,'petri-dish');s.arrivalPending=true;localStorage.setItem('isopoda-fugue-v4',JSON.stringify(s))});await page.reload();await page.locator('#continueBtn').click();assert.equal(await page.locator('#arrivalSpecimens [data-specimen]').count(),1);await page.locator('#settleBtn').click();
 assert.equal(await page.locator('#actions button').count(),3);assert.equal((await page.locator('#scopeToggle').boundingBox()).width,(await page.locator('#catalogBtn').boundingBox()).width);assert.equal(await page.locator('.zoom-tools').isVisible(),false);assert.equal(await page.locator('#scopePanel').isVisible(),false);assert.match(await page.locator('#instruments').innerText(),/普通观察/);assert.equal(await page.evaluate(()=>{const c=document.querySelector('#habitat'),d=c.getContext('2d').getImageData(3,0,1,c.height).data;let flat=0;for(let i=0;i<d.length;i+=4)if(d[i]===25&&d[i+1]===36&&d[i+2]===31)flat++;return flat>c.height*.2}),false);
 await page.screenshot({path:`${out}/${engine}-${width}-overview.png`,fullPage:true});
 const next=async()=>{await page.locator('#actions button').first().click();await page.locator('#nextBtn').click()};
 const dial=async(id,value)=>{const el=page.locator(id),step=id==='#scopePower'?1:2;for(let n=0;n<55;n++){const now=Number(await el.getAttribute('aria-valuenow'));if(Math.abs(now-value)<step)break;await el.press(now<value?'ArrowRight':'ArrowLeft')}};
 await next();assert.equal(await page.locator('#actions button').first().isEnabled(),false);await page.locator('#scopeToggle').click();assert.equal(await page.locator('#actions button').first().isEnabled(),true);await next();
 assert.equal(await page.locator('#actions button').first().isEnabled(),false);
 if(width===390)await page.screenshot({path:`${out}/${engine}-defocused.png`,fullPage:true});
 const knob=await page.locator('#scopeFocus').boundingBox(),kp={x:knob.x+knob.width/2,y:knob.y+knob.height/2};
 if(engine==='chromium'&&width===390){const client=await page.context().newCDPSession(page);await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[kp]});await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:kp.x,y:kp.y-44}]});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
 else {await page.mouse.move(kp.x,kp.y);await page.mouse.down();await page.mouse.move(kp.x,kp.y-44,{steps:4});await page.mouse.up()}
 assert.equal(await page.locator('#actions button').first().isEnabled(),true);await dial('#scopeFocus',50);assert.equal(await page.locator('#actions button').first().isEnabled(),true);await page.locator('#scopePower').press('ArrowRight');await dial('#scopeFocus',60);await next();
 assert.equal(await page.locator('#actions button').first().isEnabled(),false);
 if(width===390){await page.reload();await page.locator('#continueBtn').click();assert.equal(await page.locator('#actions button').first().isEnabled(),false)}
 if(engine==='webkit'&&width<500)await page.locator('#scopePower').press('ArrowRight');else {await page.locator('#scopePower').hover();await page.mouse.wheel(0,-100)}await dial('#scopeFocus',68);assert.equal(await page.locator('#actions button').first().isEnabled(),true);assert.doesNotMatch(await page.locator('#scopePanel').innerText(),/[0-9]/);
 await page.screenshot({path:`${out}/${engine}-${width}-microscope.png`,fullPage:true});
 if(width===390){
  await page.locator('#scopePower').press('ArrowRight');await dial('#scopeFocus',76);await page.screenshot({path:`${out}/${engine}-detail.png`,fullPage:true});
  await page.reload();await page.locator('#continueBtn').click();assert.equal(await page.locator('#scopePanel').isVisible(),true);assert.equal(await page.locator('#scopePower').getAttribute('aria-valuenow'),'3');assert.equal(await page.locator('#actions button').first().isEnabled(),true);
  for(const lang of ['en','ja','isopod','zh']){await page.evaluate(async lang=>{const {setLanguage}=await import('/isopoda/i18n.mjs');setLanguage(lang)},lang);assert.ok(!(await page.locator('#playView').innerText()).includes('petri:'))}
  await page.locator('#scopePower').press('ArrowLeft');await page.locator('#scopePower').press('ArrowLeft');await dial('#scopeFocus',60);await page.locator('#scopeCenter').click();
 }

 await dial('#scopePower',1);await dial('#scopeFocus',60);await page.locator('#scopeCenter').click();await next();assert.equal(await page.locator('#actions button').first().isEnabled(),false);const r=await page.locator('#habitat').boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x+r.width/2+Math.max(24,r.width*.07),r.y+r.height/2,{steps:5});await page.mouse.up();assert.equal(await page.locator('#actions button').first().isEnabled(),true);await next();
 await page.locator('#scopeLight').focus();await page.locator('#scopeLight').press('ArrowLeft');assert.equal(await page.locator('#actions button').first().isEnabled(),true);await next();await page.locator('#scopePower').press('ArrowLeft');await next();assert.equal(await page.locator('#actions button').first().isEnabled(),false);await page.locator('#scopeToggle').click();await next();await next();
 assert.equal(await page.locator('#endCard').isVisible(),true);assert.match(await page.locator('#endCard').innerText(),/小点没有变小/);assert.equal(await page.locator('#playView').isVisible(),false);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);assert.deepEqual(errors,[]);console.log(engine,width,'PASS');await page.close();
}
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
