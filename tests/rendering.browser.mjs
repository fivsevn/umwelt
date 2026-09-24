// Run against a local server: PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs
// node tests/rendering.browser.mjs http://localhost:8765
import assert from 'node:assert/strict';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.argv[2]||'http://localhost:8765';
for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch({headless:true,...(name==='chromium'?{channel:'chrome'}:{})});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/isopoda/');
  await page.waitForFunction(()=>document.querySelector('#startBtn').onclick);
  const pixels=await page.evaluate(async()=>{
   const {drawBaseScene,drawSceneBackground,drawSceneElement,DEFAULT_LAYOUT,DEFAULT_SCENE}=await import('./scenery/index.mjs');
   const canvases=[document.createElement('canvas'),document.createElement('canvas')];
   for(const c of canvases){c.width=384;c.height=430}
   const [a,b]=canvases.map(c=>c.getContext('2d',{willReadFrequently:true})),rows=[];
   for(const moisture of [25,80,10,25])for(const lift of [0,-12,0]){
    const wetZones=[{x:80,y:160,rx:90,ry:140,moisture}];
    a.clearRect(0,0,384,430);b.clearRect(0,0,384,430);
    drawSceneBackground(a,DEFAULT_LAYOUT,{wetZones});
    for(const item of [...DEFAULT_SCENE].sort((x,y)=>(x.z||0)-(y.z||0)))drawSceneElement(a,item,{shelterLift:lift});
    drawBaseScene(b,{wetZones,shelterLift:lift});
    const x=a.getImageData(0,0,384,430).data,y=b.getImageData(0,0,384,430).data;
    let changed=0,max=0;for(let i=0;i<x.length;i++){const delta=Math.abs(x[i]-y[i]);if(delta)changed++;max=Math.max(max,delta)}
    rows.push({moisture,lift,changed,max});
   }
   return rows;
  });
  // Transparent layer compositing can round a few shadow color channels by 1–3.
  for(const row of pixels){assert.ok(row.max<=3,JSON.stringify(row));assert.ok(row.changed<1000,JSON.stringify(row))}
  const habitats=await page.evaluate(async()=>{const {HABITATS}=await import('./habitats.mjs');return HABITATS.map(h=>({id:h.id,species:h.species?.[0]||'dairy'}))});
  for(const habitat of habitats){
   await page.evaluate(async({id,species})=>{const {createRun}=await import('./engine.mjs');const state=createRun(species,4107,id);state.startedOn='2026-09-24';localStorage.setItem('isopoda-fugue-v4',JSON.stringify(state))},habitat);
   await page.reload();await page.waitForFunction(()=>document.querySelector('#continueBtn').onclick);
   await page.click('#continueBtn');
   const run=await page.evaluate(()=>{
    let turns=0;
    while(document.querySelector('#endCard').hidden&&turns<30){
     const button=document.querySelector('#actions button:not(:disabled)');if(!button)throw Error('Missing choice');button.click();
     if(document.querySelector('#nextBtn').disabled)throw Error('Missing feedback');document.querySelector('#nextBtn').click();turns++;
    }
    return {turns,ended:!document.querySelector('#endCard').hidden,save:JSON.parse(localStorage.getItem('isopoda-fugue-v4'))};
   });
   assert.equal(run.ended,true,habitat.id);assert.equal(run.save.stage,'ended');
   await page.reload();await page.waitForFunction(()=>document.querySelector('#continueBtn').onclick);await page.click('#continueBtn');
   assert.equal(await page.locator('#endCard').isVisible(),true);
  }
  assert.deepEqual(errors,[]);
  console.log(`${name}: pixel equivalence, moisture/lift cache invalidation, all ${habitats.length} habitats to ending and save reload PASS`);
 }finally{await browser.close()}
}
