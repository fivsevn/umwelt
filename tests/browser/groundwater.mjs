const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://localhost:8765',output=process.env.QA_OUTPUT;
import assert from 'node:assert/strict';
import fs from 'node:fs';
if(output)fs.mkdirSync(output,{recursive:true});
for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch({headless:true,...(name==='chromium'?{channel:'chrome'}:{})});
 try{for(const [width,height] of [[320,568],[390,844],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/isopoda/');await page.waitForFunction(()=>document.querySelector('#startBtn').onclick);
  await page.evaluate(async()=>{const {createRun}=await import('./engine.mjs'),{drawCohort}=await import('./collection.mjs');const s=createRun('cavaticus',37,'groundwater');s.cohort=drawCohort({unlocked:[],draws:0},37,'groundwater');s.arrivalPending=true;localStorage.setItem('isopoda-fugue-v4',JSON.stringify(s))});
  await page.reload();await page.waitForFunction(()=>document.querySelector('#continueBtn').onclick);await page.click('#continueBtn');
  assert.equal(await page.locator('#arrivalCard .panel-caption').textContent(),'寻找样本');
  assert.equal(await page.locator('#arrivalSpecimens .isopod').count(),4);
  assert.ok(await page.evaluate(()=>document.querySelector('#arrivalSpecimens').getBoundingClientRect().bottom<=document.querySelector('#caveArrivalNote').getBoundingClientRect().top));
  for(const card of await page.locator('.cave-sample').all()){const r=await card.boundingBox();assert.ok(r.height>55)}
  if(output)await page.screenshot({path:`${output}/${name}-${width}-arrival.png`,fullPage:true});
  await page.click('#settleBtn');assert.equal(await page.locator('#actions button').count(),3);
  const canvas=page.locator('#habitat'),mask=page.locator('.cave-observer-mask');
  assert.equal(await canvas.getAttribute('data-specimens'),'14');
  const before=await canvas.evaluate(e=>e.toDataURL());await page.waitForTimeout(1200);assert.notEqual(await canvas.evaluate(e=>e.toDataURL()),before,'simulation runs under reduced motion');
  await page.click('#zoomIn');assert.equal(await mask.evaluate(e=>e.style.width),'38%');
  await page.click('#zoomOut');assert.equal(await mask.evaluate(e=>e.style.width),'34%');
  // Pointer capture and held directional input, not just a synthetic click.
  const stick=await page.locator('#zoomReset').boundingBox(),x=stick.x+stick.width/2,y=stick.y+stick.height/2;
  const beamBefore=await mask.evaluate(e=>parseFloat(e.style.getPropertyValue('--beam-x')));
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+15,y+5);await page.waitForTimeout(500);await page.mouse.up();
  const beamAfter=await mask.evaluate(e=>parseFloat(e.style.getPropertyValue('--beam-x')));assert.ok(beamAfter>beamBefore+3);
  await page.waitForTimeout(300);assert.equal(await mask.evaluate(e=>parseFloat(e.style.getPropertyValue('--beam-x'))),beamAfter,'joystick releases');
  await page.locator('#zoomReset').focus();await page.keyboard.press('ArrowLeft');assert.ok(await mask.evaluate(e=>parseFloat(e.style.getPropertyValue('--beam-x')))<beamAfter);
  const rect=await canvas.boundingBox();await canvas.dispatchEvent('pointerdown',{clientX:rect.x+rect.width*.65,clientY:rect.y+rect.height*.44,pointerType:'touch'});
  assert.ok(Math.abs(await mask.evaluate(e=>parseFloat(e.style.getPropertyValue('--beam-x')))-65)<.01);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(output)await page.screenshot({path:`${output}/${name}-${width}-cave.png`,fullPage:true});
  for(let turn=0;turn<8;turn++){
   assert.match(await page.locator('#dayLabel').textContent(),new RegExp(`${turn+1}/8`));
   assert.doesNotMatch(await page.locator('#dayLabel').textContent(),/PULSE|脉冲/);
   await page.locator('#actions button').nth(turn===7?2:0).click();
   await page.reload();await page.waitForFunction(()=>document.querySelector('#continueBtn').onclick);await page.click('#continueBtn');
   if(turn===7){assert.equal(await mask.getAttribute('data-lights-out'),'true');if(output)await page.screenshot({path:`${output}/${name}-${width}-dark.png`,fullPage:true})}
   await page.click('#nextBtn');
  }
  assert.equal(await page.locator('#endCard').isVisible(),true);
  assert.match(await page.locator('#endCard .ending-date span:last-child').textContent(),/八次/);
  if(output)await page.screenshot({path:`${output}/${name}-${width}-ending.png`,fullPage:true});
  await page.reload();await page.waitForFunction(()=>document.querySelector('#continueBtn').onclick);await page.click('#continueBtn');assert.equal(await page.locator('#endCard').isVisible(),true);
  assert.deepEqual(errors,[]);console.log(`${name} ${width}: sample preview, 14 animals, reduced-motion activity, beam size, joystick, keyboard, touch, eight observations, reload and ending PASS`);await page.close();
 }}finally{await browser.close()}
}
