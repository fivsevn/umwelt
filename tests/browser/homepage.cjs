const qaOutput=process.env.QA_OUTPUT||'/tmp';require('node:fs').mkdirSync(qaOutput,{recursive:true});
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await ({chromium,webkit}[process.env.BROWSER||'chromium']).launch({headless:true,...(process.env.BROWSER==='webkit'||process.env.CI?{}:{channel:'chrome'})});
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.closeCalls=0;window.close=()=>window.closeCalls++;window.audioSources=[];const start=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...args){window.audioSources.push({loop:this.loop,duration:this.buffer?.duration});return start.apply(this,args)}});
 await page.clock.install({time:new Date(2026,8,27,23,59,59)});
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:8876');
 await page.waitForFunction(()=>document.querySelector('#desktopTime').textContent.length===5);
 await page.clock.runFor(2000);
 assert.equal(await page.locator('#desktopTime').textContent(),'00:00');assert.equal(await page.locator('#desktopDate').textContent(),'2026/09/28');
 await page.clock.resume();
 for(const [lang,title] of [['zh-CN','环世界观测系统'],['en','UMWELT OBSERVATION SYSTEM'],['ja','環世界観測システム']]){
  assert.equal(await page.locator('.welcome h1').textContent(),'UMWELT');assert.equal(await page.locator('.welcome-links a').count(),2);
  assert.equal(await page.locator('html').getAttribute('lang'),lang);assert.equal(await page.title(),title);
  assert.equal(await page.locator('#systemMenu button').count(),1);
  for(const action of ['leave']){
   await page.click('#systemButton');await page.click(`[data-action=${action}]`);assert.equal(await page.locator('#systemDialog').evaluate(el=>el.open),true);
   await page.screenshot({path:`${qaOutput}/homepage-${process.env.BROWSER||'chromium'}-${lang}-${action}.png`});
   await page.click('#cancelAction');assert.equal(await page.locator('#systemDialog').evaluate(el=>el.open),false);
  }
  await page.click('#languageButton');
 }
 assert.equal(await page.evaluate(()=>window.closeCalls),0);
 await page.click('#soundBtn');await page.locator('#soundBtnPanel input').fill('0');assert.equal(await page.locator('#soundBtn').getAttribute('aria-pressed'),'false');
 await page.click('#musicBtn');await page.locator('#musicBtnPanel input').fill('0');const muted=await page.evaluate(()=>window.audioSources.length);await page.click('#aboutButton');assert.equal(await page.evaluate(()=>window.audioSources.length),muted);
 await page.click('#soundBtn');await page.locator('#soundBtnPanel input').fill('45');await page.waitForTimeout(100);await page.click('#aboutButton');assert.ok(await page.evaluate(()=>window.audioSources.length)>muted);
 assert.equal(await page.evaluate(()=>window.audioSources.some(s=>s.loop)),false);
 await page.click('#systemButton');await page.keyboard.press('Escape');assert.equal(await page.locator('#systemMenu').isHidden(),true);
 await page.click('#languageButton');await page.reload();assert.equal(await page.locator('html').getAttribute('lang'),'en');
 for(const width of [1440,390,320]){await page.setViewportSize({width,height:900});await page.screenshot({path:`${qaOutput}/homepage-${process.env.BROWSER||'chromium'}-${width}.png`});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const a=await page.locator('#systemButton').boundingBox(),b=await page.locator('.tray').boundingBox();assert.ok(a.x+a.width<=b.x)}
 await page.click('#systemButton');await page.click('[data-action=leave]');await page.click('#confirmAction');await page.waitForURL('about:blank');
 assert.deepEqual(errors,[]);console.log('Homepage passed: 3 languages, single leave dialog, cancel and exit fallback, mute, no ambience, persistence, midnight clock, keyboard and 3 widths.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
