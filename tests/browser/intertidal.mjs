import assert from 'node:assert/strict';
import fs from 'node:fs';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8775',output=process.env.QA_OUTPUT;
if(output)fs.mkdirSync(output,{recursive:true});
const click=async(page,selector)=>{const button=page.locator(selector);await button.waitFor({state:'visible'});assert.ok(await button.isEnabled());await button.evaluate(e=>e.click())};
for(const [name,type] of [['chromium',chromium],['webkit',webkit]].filter(([name])=>!process.env.BROWSER||process.env.BROWSER===name)){
 const browser=await type.launch({headless:true,...(name==='chromium'&&process.platform==='darwin'?{channel:'chrome'}:{})});
 try {for(const [width,height] of [[320,568],[390,844],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/habitat.mjs*',async route=>{const response=await route.fetch();const body=(await response.text()).replace('return {reset,stage,react,heartBurst,zoom,','if(canvas.id==="habitat")window.__motionTest=()=>({elapsed,reduced,actors:critters.map(a=>({x:a.x,y:a.y,phase:a.phase,visible:!a.hidden,cells:a.hitCells?.length||0}))});\nreturn {reset,stage,react,heartBurst,zoom,');await route.fulfill({response,body})});
  await page.goto(base+'/isopoda/');await page.waitForFunction(()=>document.querySelector('#startBtn').onclick);
  await page.evaluate(async()=>{const {createRun}=await import('./engine.mjs');localStorage.setItem('isopoda-fugue-v4',JSON.stringify(createRun('granulosa',42,'intertidal')))});
  await page.reload();await click(page,'#continueBtn');
  for(let i=0;i<9;i++){
   await page.waitForTimeout(i===4?2500:100);
   assert.equal(await page.locator('#actions button').count(),3);
   for(const lang of ['zh','en','ja','isopod']){
    await page.evaluate(async lang=>(await import('./i18n.mjs'+new URL(document.querySelector('script[src*="game.js"]').src).search)).setLanguage(lang),lang);
    const text=await page.locator('#observation').innerText();assert.ok(text.length>0);assert.doesNotMatch(text,/intertidal:|water:/);
    if(lang==='isopod')assert.doesNotMatch(await page.locator('#dayLabel').innerText(),/[0-9\p{Script=Han}]/u);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' '+width+' '+lang+' overflow');
   }
   await page.evaluate(async()=>(await import('./i18n.mjs'+new URL(document.querySelector('script[src*="game.js"]').src).search)).setLanguage('zh'));
   if(i===0||i===4){
    const before=await page.evaluate(()=>window.__motionTest());await page.waitForTimeout(700);const after=await page.evaluate(()=>window.__motionTest());
    assert.ok(after.elapsed>before.elapsed);assert.notDeepEqual(after.actors,before.actors);assert.ok(after.actors.some(a=>a.visible&&a.cells>0));
    if(output)await page.screenshot({path:`${output}/${name}-${width}-${i===0?'low':'high'}.png`,fullPage:true});
   }
   await click(page,`#actions button:nth-child(${i%3+1})`);assert.ok(await page.locator('#actions button').first().isDisabled());
   if(i===3){const text=await page.locator('#observation').innerText();await page.reload();await click(page,'#continueBtn');assert.equal(await page.locator('#observation').innerText(),text)}
   await click(page,'#nextBtn');
  }
  assert.ok(await page.locator('#endCard').isVisible());assert.match(await page.locator('#endingBody').innerText(),/岩缝/);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('isopoda-fugue-v4')));assert.equal(saved.records.length,9);assert.equal(saved.ending,'intertidal-cycle');
  const notebookIds=width===390?['serratum','pelagica','granulosa','ischiosetosa','bidentata','albifrons','hirsuta']:['albifrons','hirsuta'];
  for(const id of notebookIds){
   await page.evaluate(async id=>{const {createRun}=await import('./engine.mjs');localStorage.setItem('isopoda-fugue-v4',JSON.stringify(createRun(id,93,'intertidal')))},id);
   await page.reload();await click(page,'#continueBtn');await page.waitForTimeout(350);
   const before=await page.evaluate(()=>window.__motionTest());await page.waitForTimeout(400);const after=await page.evaluate(()=>window.__motionTest());assert.notDeepEqual(before.actors,after.actors);
   if(output&&['albifrons','hirsuta'].includes(id))await page.screenshot({path:`${output}/${name}-${width}-${id}-habitat.png`,fullPage:true});
   await click(page,'#catalogBtn');
   for(const lang of ['en','ja','isopod','zh']){
    await page.evaluate(async lang=>(await import('./i18n.mjs'+new URL(document.querySelector('script[src*="game.js"]').src).search)).setLanguage(lang),lang);
    const paragraphs=await page.locator('.anonymous-note p').allTextContents();assert.equal(paragraphs.length,2);
    assert.doesNotMatch(paragraphs.join(' '),/我们|并不需要|最大|雄体|雌体|\b(?:We|we|I|mm)\b/);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   }
   if(output&&width===390)await page.screenshot({path:`${output}/${name}-${width}-${id}-notebook.png`,fullPage:true});
   await click(page,'#closeDrawer');const resumed=await page.evaluate(()=>window.__motionTest().elapsed);await page.waitForTimeout(200);assert.ok(await page.evaluate(()=>window.__motionTest().elapsed)>resumed);
   await click(page,'#actions button:first-child');await page.reload();await click(page,'#continueBtn');
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('isopoda-fugue-v4')).cohort[0].species),id);
  }
  await page.goto(base+'/isopoda/habitat.html');await page.waitForFunction(()=>document.querySelector('[data-preset="intertidal"]').onclick);await click(page,'[data-preset="intertidal"]');assert.equal(await page.locator('.habitat-reference').count(),5);
  await page.goto(base+'/isopoda/morphology/');await page.waitForFunction(()=>document.querySelector('#speciesSelect').options.length>1);
  const id=await page.evaluate(async()=>{const {SPECIES}=await import('../species-registry.mjs');return String(SPECIES.findIndex(s=>s.id==='granulosa'))});await page.selectOption('#speciesSelect',id);assert.equal(await page.locator('.reference[data-ref="intertidal-naturalis-granulosa"] a').count(),1);
  for(const taxon of ['albifrons','hirsuta']){
   const value=await page.evaluate(async taxon=>{const {SPECIES}=await import('../species-registry.mjs');return String(SPECIES.findIndex(s=>s.id===taxon))},taxon);
   await page.selectOption('#speciesSelect',value);
   assert.equal(await page.locator(`.reference[data-ref="intertidal-${taxon}-bmig"] a`).count(),1);
   const dossier=await page.locator('#dossierBody').textContent();assert.match(dossier,/微栖地|标本资料/);assert.doesNotMatch(dossier,/阿西莫夫的笔记|页边|页上|鉛筆/);
   if(output&&width===390)await page.screenshot({path:`${output}/${name}-${width}-${taxon}-morphology.png`,fullPage:true});
  }
  assert.deepEqual(errors,[]);await page.close();console.log(`${name} ${width}: nine turns, four languages, reload, reduced motion, laboratories PASS`);
 }}finally{await browser.close()}
}
