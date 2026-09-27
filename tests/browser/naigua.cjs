// BASE_URL=http://127.0.0.1:8765 BROWSER=webkit QA_OUTPUT=/tmp/naigua-qa node tests/browser/naigua.cjs
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.BASE_URL||'http://127.0.0.1:8765',output=process.env.QA_OUTPUT||'/tmp/naigua-qa';fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await (process.env.BROWSER==='webkit'?webkit:chromium).launch({headless:true,...(process.env.BROWSER!=='webkit'&&!process.env.CI?{channel:'chrome'}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const engine=process.env.BROWSER||'chrome';
 await page.goto(base+'/isopoda/morphology/?species=naigua');await page.waitForSelector('#stage canvas');
 const preserved=await page.evaluate(async()=>{
  const {pixelAnatomy,renderModel}=await import('/isopoda/sprites.mjs'),{speciesById}=await import('/isopoda/species-registry.mjs'),{sceneActorPixels}=await import('/isopoda/habitat.mjs');
  const model=renderModel(speciesById('naigua').visual),source=new Map();
  for(const part of pixelAnatomy(model,{posture:'curled'}))for(const [x,y,color] of part.cells)source.set(x+','+y,color);
  return [.4,1,1.2].map(habitatScale=>{
   const cells=sceneActorPixels(source,{model,posture:'curled',x:0,y:0,a:1.7,habitatScale});
   return cells.length===source.size&&cells.every(([x,y,color])=>source.get(x+','+y)===color);
  });
 });
 assert.deepEqual(preserved,[true,true,true],'curled face retains every source pixel across scene scales');
 assert.match(await page.locator('#specimenName').innerText(),/奶瓜虫/);assert.equal(await page.locator('#rollMode').innerText(),'FULL');
 await page.locator('#specimenDossier summary').click();assert.match(await page.locator('#dossierBody').innerText(),/不详/);
 assert.equal(await page.locator('#referenceList .reference').count(),0);
 await page.screenshot({path:output+'/morphology-'+engine+'.png'});
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:output+'/morphology-mobile-'+engine+'.png'});
 await page.goto(base+'/isopoda/habitat.html');assert.equal(await page.locator('.naigua-cabinet,#naiguaPreview').count(),0);
 await page.locator('#referenceSpecies').selectOption('naigua');assert.match(await page.locator('#specimenReadout').innerText(),/Naigua/);
 const runs=await page.evaluate(async()=>{
  const {createRun,ensureScene}=await import('/isopoda/engine.mjs'),{drawCohort}=await import('/isopoda/collection.mjs'),{addRareSpecimens}=await import('/isopoda/rare-specimens.mjs'),{HABITATS}=await import('/isopoda/habitats.mjs');
  const seed=Array.from({length:1000},(_,i)=>i).find(seed=>addRareSpecimens([],seed,'terrestrial').length===2);
  return HABITATS.map(h=>{const c=drawCohort({unlocked:[],draws:0},seed,h.id),s=createRun(c[0].species,seed,h.id);s.cohort=c;s.arrivalPending=false;ensureScene(s);return s});
 });
 await page.setViewportSize({width:1440,height:1000});
 for(const run of runs){
  await page.evaluate(run=>localStorage.setItem('isopoda-fugue-v4',JSON.stringify(run)),run);
  await page.goto(base+'/isopoda/');await page.locator('#continueBtn').click();await page.waitForTimeout(400);
  assert.equal(Number(await page.locator('#habitat').getAttribute('data-specimens')),run.cohort.length);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('isopoda-fugue-v4')));assert.deepEqual(saved.cohort,run.cohort);
  if(run.habitatId==='terrestrial'){
   await page.emulateMedia({reducedMotion:'reduce'});
   // Touch a real green eye on the production canvas, using its displayed coordinate mapping.
   const point=await page.locator('#habitat').evaluate(c=>{const g=c.getContext('2d'),p=g.getImageData(0,0,c.width,c.height).data,r=c.getBoundingClientRect();for(let i=0;i<p.length;i+=4)if(p[i]===145&&p[i+1]===191&&p[i+2]===112)return {x:r.left+(i/4%c.width+.5)*r.width/c.width,y:r.top+(Math.floor(i/4/c.width)+.5)*r.height/c.height};return null});
   assert.ok(point,'naigua is drawn by the ordinary actor renderer');await page.mouse.click(point.x,point.y);await page.waitForTimeout(100);
   const s=await page.evaluate(()=>JSON.parse(localStorage.getItem('isopoda-fugue-v4'))),last=s.directRecords.at(-1);
   assert.equal(last.type,'tap');assert.equal(s.cohort.find(c=>c.id===last.specimen).species,'naigua');
   await page.locator('#habitat').screenshot({path:output+'/game-touch-'+engine+'.png'});
   await page.emulateMedia({reducedMotion:'no-preference'});
  }
  console.log('PASS saved cohort',run.habitatId,run.cohort.filter(c=>c.species==='naigua').length);
 }
 // Cabinet selection must never perform either a random or guaranteed draw.
 const collectionKey='isopoda-fieldnotes-v1',runKey='isopoda-fugue-v4';
 for(const unlocked of [false,true])for(const misses of [0,7]){
  await page.evaluate(({unlocked,misses,collectionKey})=>{localStorage.clear();localStorage.setItem(collectionKey,JSON.stringify({version:1,unlocked:['dairy','orange',...(unlocked?['naigua']:[])],draws:12,naiguaMisses:misses,acquired:{}}))},{unlocked,misses,collectionKey});
  await page.goto(base+'/isopoda/?habitat=petri-dish');await page.waitForFunction(()=>document.querySelector('#startBtn')?.onclick);
  const before=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),collectionKey);
  const pool=await page.evaluate(async collection=>{const {unlockedPetriSpecies}=await import('/isopoda/arrival.mjs');return unlockedPetriSpecies(collection)},before);
  assert.equal(pool.includes('naigua'),unlocked);
  await page.locator('#startBtn').click();const seen=[];
  for(let i=0;i<pool.length;i++){
   const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),runKey);
   assert.equal(saved.cohort.length,1);const chosen=saved.cohort[0].species;seen.push(chosen);assert.ok(pool.includes(chosen));
   assert.equal(await page.locator('#arrivalSpecimens .isopod').count(),1);
   if(chosen==='naigua')await page.screenshot({path:output+'/cabinet-unlocked-'+misses+'-'+engine+'.png'});
   await page.locator('#arrivalNext').click();
  }
  assert.deepEqual(new Set(seen),new Set(pool));
  await page.locator('#arrivalPrev').click();
  const chosen=await page.locator('#arrivalSpecimens .isopod').getAttribute('data-species');
  await page.reload();await page.waitForFunction(()=>document.querySelector('#continueBtn')?.onclick);await page.locator('#continueBtn').click();
  assert.equal(await page.locator('#arrivalSpecimens .isopod').getAttribute('data-species'),chosen);
  await page.screenshot({path:output+'/cabinet-'+unlocked+'-'+misses+'-'+engine+'.png'});
  await page.locator('#settleBtn').click();assert.equal(await page.locator('#habitat').getAttribute('data-specimens'),'1');
  const after=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),collectionKey);
  assert.equal(after.naiguaMisses,misses);assert.equal(after.draws,12);assert.deepEqual(after.unlocked,before.unlocked);
  if(!unlocked&&misses===7){
   await page.goto(base+'/isopoda/?habitat=terrestrial');await page.waitForFunction(()=>document.querySelector('#startBtn')?.onclick);await page.locator('#startBtn').click();
   const outdoor=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),runKey);
   assert.equal(outdoor.cohort.filter(c=>c.species==='naigua').length,1);
   const earned=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),collectionKey);assert.equal(earned.naiguaMisses,0);assert.ok(earned.unlocked.includes('naigua'));
  }
  console.log('PASS cabinet selection',engine,{unlocked,misses});
 }
 // An old save's extra visitor must not turn into a new collection unlock on resume.
 await page.evaluate(async({runKey,collectionKey})=>{localStorage.clear();const {createRun}=await import('/isopoda/engine.mjs');const s=createRun('dairy',42,'petri-dish');s.arrivalPending=false;s.cohort.push({id:'B',species:'naigua',seed:9,stage:'L'});localStorage.setItem(runKey,JSON.stringify(s));localStorage.setItem(collectionKey,JSON.stringify({unlocked:['dairy'],draws:12,naiguaMisses:7}))},{runKey,collectionKey});
 await page.goto(base+'/isopoda/');await page.waitForFunction(()=>document.querySelector('#continueBtn')?.onclick);await page.locator('#continueBtn').click();
 assert.equal(await page.locator('#habitat').getAttribute('data-specimens'),'1');
 assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).unlocked.includes('naigua'),collectionKey),false);
 console.log('PASS legacy cabinet visitor cleanup',engine);
 assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
