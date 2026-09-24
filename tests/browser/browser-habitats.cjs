// NODE_PATH points to an installed Playwright package; CHROME_PATH is optional.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const url=process.env.GAME_URL||'http://localhost:8765/isopoda/';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const errors=[];
 for(const width of [390,900])for(const lang of ['zh','en','ja','isopod']){
  const p=await browser.newPage({viewport:{width,height:900}});p.on('pageerror',e=>errors.push(e.stack));
  await p.addInitScript(lang=>localStorage.setItem('isopoda-ui-language-v1',lang),lang);await p.goto(url);await p.waitForSelector('#titleCard[data-habitat]');
  assert.ok((await p.locator('#titleCard .window-title span').innerText()).includes('ISOPODA /'));
  for(const habitat of ['freshwater','estuary','intertidal','shallow-marine','abyssal']){
   await p.click('#habitatNext');assert.equal(await p.locator('#titleCard').getAttribute('data-habitat'),habitat);
   await p.click('#startBtn');await p.click('#settleBtn');
   assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('isopoda-fugue-v4')).habitatId),habitat);
   for(let turn=0;turn<9;turn++){
    const text=await p.locator('#observation').innerText();assert.ok(text&&!text.includes('water:')&&!text.includes('abyssal:'));
    if(lang==='en')assert.ok(!/[\u3400-\u9fff]/u.test(text));
    await p.locator('#actions button').nth(turn%3).click();await p.click('#nextBtn');
   }
   assert.equal(await p.locator('#endCard').isVisible(),true);
   assert.ok(!(await p.locator('#endingBody').innerText()).includes('water:'));
   await p.click('#restartBtn');
  }
  const saved=await p.evaluate(()=>localStorage.getItem('isopoda-fugue-v4'));await p.click('#habitatNext');await p.click('#continueBtn');
  assert.equal(await p.locator('#endCard').isVisible(),true);assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('isopoda-fugue-v4')).habitatId),'abyssal');
  await p.reload();await p.waitForSelector('#continueBtn');await p.click('#continueBtn');assert.equal(await p.locator('#endCard').isVisible(),true);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  if(width===390&&lang==='zh')await p.screenshot({path:'/tmp/aquatic-mobile.png'});
  await p.close();console.log('PASS',width,lang,'four aquatic runs, continue and reload');
 }
 const toggle=await browser.newPage();toggle.on('pageerror',e=>errors.push(e.stack));
 await toggle.addInitScript(()=>{localStorage.clear();localStorage.setItem('isopoda-ui-language-v1','zh')});
 await toggle.goto(url);await toggle.waitForSelector('#titleCard[data-habitat]');
 const expectedStatic={en:'New observation',ja:'新しい観察'};
 for(const lang of ['en','ja']){
  await toggle.click(`[data-system-lang="${lang}"]`);
  assert.equal(await toggle.locator('html').getAttribute('data-ui-language'),lang);
  assert.equal(await toggle.locator('#startBtn').innerText(),expectedStatic[lang]);
  assert.equal(await toggle.locator(`[data-system-lang="${lang}"]`).getAttribute('aria-pressed'),'true');
 }
 await toggle.click('[data-system-lang="isopod"]');
 assert.equal(await toggle.locator('html').getAttribute('data-ui-language'),'isopod');
 assert.notEqual(await toggle.locator('#startBtn').innerText(),'新建观察');
 await toggle.click('[data-system-lang="zh"]');
 await toggle.click('#habitatNext');await toggle.click('#startBtn');await toggle.click('#settleBtn');
 const zhObservation=await toggle.locator('#observation').innerText();
 await toggle.click('[data-system-lang="en"]');
 const enObservation=await toggle.locator('#observation').innerText();
 assert.notEqual(enObservation,zhObservation);assert.ok(!/[\u3400-\u9fff]/u.test(enObservation));
 await toggle.click('[data-system-lang="ja"]');
 const jaObservation=await toggle.locator('#observation').innerText();
 assert.notEqual(jaObservation,enObservation);assert.ok(/[\u3040-\u30ff]/u.test(jaObservation));
 await toggle.click('[data-system-lang="isopod"]');
 const isoObservation=await toggle.locator('#observation').innerText();
 assert.notEqual(isoObservation,jaObservation);assert.equal(await toggle.locator('html').getAttribute('lang'),'x-isopod');
 await toggle.close();console.log('PASS live language switching updates static and active-game copy');

 const p=await browser.newPage();p.on('pageerror',e=>errors.push(e.stack));await p.goto(url);await p.waitForSelector('#titleCard[data-habitat]');await p.click('#startBtn');await p.click('#settleBtn');await p.locator('#actions button').last().click();
 const old=await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('isopoda-fugue-v4'));delete s.habitatId;localStorage.setItem('isopoda-fugue-v4',JSON.stringify(s));return s});
 await p.reload();await p.waitForSelector('#continueBtn');await p.click('#habitatNext');await p.click('#continueBtn');
 const migrated=await p.evaluate(()=>JSON.parse(localStorage.getItem('isopoda-fugue-v4')));assert.equal(migrated.habitatId,'terrestrial');assert.deepEqual(migrated.records,old.records);assert.equal(migrated.stage,'feedback');
 for(const lang of ['en','ja','isopod','zh'])await p.evaluate(async lang=>{const m=await import('./i18n.mjs?v=i18n-5');m.setLanguage(lang)},lang);
 await p.close();
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS legacy v4 migration and all browser errors');
})().catch(e=>{console.error(e);process.exit(1)});
