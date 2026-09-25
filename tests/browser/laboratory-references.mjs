import assert from 'node:assert/strict';
import fs from 'node:fs';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://localhost:8765',output=process.env.QA_OUTPUT;if(output)fs.mkdirSync(output,{recursive:true});
for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch({headless:true,...(name==='chromium'?{channel:'chrome'}:{})});
 try{for(const width of [320,1440]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/isopoda/habitat.html');await page.waitForFunction(()=>document.querySelectorAll('.asset-card').length);
  await page.locator('[data-preset="groundwater"]').click();
  assert.equal(await page.locator('.habitat-reference').count(),3);assert.match(await page.locator('#habitatReferenceTitle').textContent(),/石灰岩洞穴/);
  for(const id of ['groundwater-recharge','groundwater-biofilm','groundwater-survey'])assert.equal(await page.locator(`[data-source="${id}"] a`).count(),1);
  assert.match(await page.locator('#habitatReferenceList').textContent(),/虚构设定/);
  await page.locator('.habitat-references').scrollIntoViewIfNeeded();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(output)await page.screenshot({path:`${output}/${name}-${width}-habitat-references.png`});
  await page.locator('[data-preset="freshwater"]').click();assert.equal(await page.locator('.habitat-reference').count(),0);assert.doesNotMatch(await page.locator('#habitatReferenceTitle').textContent(),/洞穴/);
  await page.goto(base+'/isopoda/morphology/');await page.waitForFunction(()=>document.querySelector('#speciesSelect').options.length>1);
  const ids=await page.evaluate(async()=>{const {SPECIES}=await import('../species-registry.mjs');return Object.fromEntries(SPECIES.map((s,i)=>[s.id,String(i)]))});
  for(const [id,refs] of Object.entries({cavaticus:['groundwater-biofilm'],valdensis:['groundwater-valdensis-key','groundwater-biofilm'],virei:['groundwater-virei-behaviour']})){
   await page.selectOption('#speciesSelect',ids[id]);for(const ref of refs)assert.equal(await page.locator(`.reference[data-ref="${ref}"] a`).count(),1,id+':'+ref);
   assert.equal(await page.locator('.reference[data-ref="groundwater-survey"]').count(),0);
  }
  await page.goto(base+'/isopoda/');await page.waitForFunction(()=>document.querySelector('#startBtn').onclick);
  const credits=await page.evaluate(async()=>{const {renderCredits}=await import('./credits.mjs');const el=renderCredits();document.body.append(el);while(el.getAttribute('aria-busy')==='true')await new Promise(r=>setTimeout(r,20));return {text:el.textContent,links:[...el.querySelectorAll('a')].map(a=>a.href)}});
  assert.doesNotMatch(credits.text,/八次观察|Francois|Pronk|Magniez|−18/);assert.ok(credits.links.includes('https://www.nps.gov/'));assert.ok(credits.links.includes('https://umwelt.fivsevn.com/isopoda/habitat'));
  assert.deepEqual(errors,[]);console.log(`${name} ${width}: environment switching, exact specimen references and homepage-only Credits PASS`);await page.close();
 }}finally{await browser.close()}
}
