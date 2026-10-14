// Run against a local server: PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs
// node isopoda/tests/rendering.browser.mjs http://localhost:8765
import assert from 'node:assert/strict';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.BASE_URL||process.argv[2]||'http://localhost:8765';
const engines=[['chromium',chromium],['webkit',webkit]];
if(process.env.BROWSER&&!engines.some(([name])=>name===process.env.BROWSER))throw Error('Unknown browser: '+process.env.BROWSER);
for(const [name,type] of engines.filter(([name])=>!process.env.BROWSER||process.env.BROWSER===name)){
 const browser=await type.launch({headless:true,...(name==='chromium'&&process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/isopoda/');
  await page.waitForFunction(()=>document.querySelector('#startBtn').onclick);
  const pixels=await page.evaluate(async()=>{
   const {drawBaseScene,drawSceneBackground,drawSceneElement,DEFAULT_LAYOUT,DEFAULT_SCENE}=await import('/isopoda/scenery/index.mjs');
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
  // Habitat interactions and saved-run reloads have dedicated browser suites.
  // Keep this harness focused on cached versus direct scenery rendering.
  assert.deepEqual(errors,[]);
  console.log(`${name}: ${pixels.length} scenery pixel comparisons and moisture/lift cache invalidation PASS`);
 }finally{await browser.close()}
}
