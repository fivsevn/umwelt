const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://localhost:8765';
const output=process.env.QA_OUTPUT; 
import assert from 'node:assert/strict';
import fs from 'node:fs';
if(output)fs.mkdirSync(output,{recursive:true});
for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch({headless:true,...(name==='chromium'?{channel:'chrome'}:{})});
 for(const [width,height] of [[320,568],[390,844],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/isopoda/');
  await page.waitForFunction(()=>document.querySelector('#startBtn').onclick);
  await page.evaluate(async()=>{const {createRun}=await import('./engine.mjs');localStorage.setItem('isopoda-fugue-v4',JSON.stringify(createRun('cavaticus',37,'groundwater')))});
  await page.reload();await page.waitForFunction(()=>document.querySelector('#continueBtn').onclick);await page.click('#continueBtn');
  assert.equal(await page.locator('#actions button').count(),3);
  const canvas=page.locator('#habitat'),rect=await canvas.boundingBox();
  await canvas.dispatchEvent('pointerdown',{clientX:rect.x+rect.width*.65,clientY:rect.y+rect.height*.44,pointerType:'touch'});
  assert.equal(await page.locator('.cave-observer-mask').evaluate(e=>e.style.getPropertyValue('--beam-x')),'65.00%');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(output)await page.screenshot({path:`${output}/${name}-${width}-cave.png`,fullPage:true});
  for(const choice of [1,0,0,2]){
   await page.locator('#actions button').nth(choice).click();
   await page.reload();await page.waitForFunction(()=>document.querySelector('#continueBtn').onclick);await page.click('#continueBtn');
   if(choice===2){assert.equal(await page.locator('.cave-observer-mask').getAttribute('data-lights-out'),'true');if(output)await page.screenshot({path:`${output}/${name}-${width}-dark.png`,fullPage:true})}
   await page.click('#nextBtn');
  }
  assert.equal(await page.locator('#endCard').isVisible(),true);
  await page.reload();await page.waitForFunction(()=>document.querySelector('#continueBtn').onclick);await page.click('#continueBtn');
  assert.equal(await page.locator('#endCard').isVisible(),true);assert.deepEqual(errors,[]);
  console.log(`${name} ${width}: warm beam, touch, 4 pulses, feedback reload, lights out, ending reload, overflow PASS`);
  await page.close();
 }
 await browser.close();
}
