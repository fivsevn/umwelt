import assert from 'node:assert/strict';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://localhost:8765';
for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch({headless:true,...(name==='chromium'?{channel:'chrome'}:{})});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/habitat.mjs*',async route=>{const response=await route.fetch();const body=(await response.text()).replace('return {reset,stage,react,heartBurst,zoom,','if(canvas.id==="habitat")window.__motionTest=()=>({elapsed,reduced,actors:critters.map(a=>({x:a.x,y:a.y,phase:a.phase,visible:!a.hidden,cells:a.hitCells?.length||0}))});\nreturn {reset,stage,react,heartBurst,zoom,');await route.fulfill({response,body})});
  await page.goto(base+'/isopoda/');await page.waitForFunction(()=>document.querySelector('#startBtn').onclick);
  const habitats=await page.evaluate(async()=>{const {HABITATS}=await import('./habitats.mjs');return HABITATS.map(h=>({id:h.id,species:h.species?.[0]||'dairy'}))});
  for(const habitat of habitats){
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.evaluate(async({id,species})=>{const {createRun}=await import('./engine.mjs');localStorage.setItem('isopoda-fugue-v4',JSON.stringify(createRun(species,37,id)))},habitat);
   await page.reload();await page.click('#continueBtn');await page.waitForTimeout(200);
   const before=await page.evaluate(()=>window.__motionTest());assert.ok(before.actors.some(a=>a.visible&&a.cells>0),habitat.id+' visible specimens');
   await page.waitForTimeout(1000);const after=await page.evaluate(()=>window.__motionTest());assert.ok(after.elapsed>before.elapsed+.4,habitat.id+' simulation advances');assert.notDeepEqual(after.actors,before.actors,habitat.id+' animals animate under reduce');
   const emptyMotion=await page.evaluate(()=>window.__motionTest().elapsed);
   await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>!window.__motionTest().reduced);await page.waitForTimeout(200);
   await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>window.__motionTest().reduced);await page.waitForTimeout(200);
   assert.ok(await page.evaluate(()=>window.__motionTest().elapsed)>emptyMotion,'live preference changes never stop loop');
   // Pausing for a notebook and returning must also restart the loop in reduce mode.
   await page.click('#catalogBtn');await page.click('#closeDrawer');const resumed=await page.evaluate(()=>window.__motionTest().elapsed);await page.waitForTimeout(250);assert.ok(await page.evaluate(()=>window.__motionTest().elapsed)>resumed);
   console.log(name+' '+habitat.id+': visible animals, reduced-motion activity, live setting changes and resume PASS');
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close()}
}
