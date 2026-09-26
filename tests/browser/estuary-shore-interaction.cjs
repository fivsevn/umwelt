const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const name=process.env.BROWSER||'chromium',base=process.env.BASE_URL||'http://127.0.0.1:8873';
(async()=>{
 const browser=await (name==='webkit'?webkit:chromium).launch({headless:true,...(name==='chromium'&&process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 try{for(const touch of name==='chromium'?[false,true]:[false]){
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:touch,reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/habitat.mjs*',async route=>{const response=await route.fetch();const body=(await response.text()).replace('return {reset,stage,react,','if(canvas.id==="habitat")window.__shoreTest={actors:()=>critters,camera,clock:()=>elapsed};\nreturn {reset,stage,react,');await route.fulfill({response,body})});
  await page.goto(base+'/isopoda/?habitat=estuary');await page.locator('#startBtn').click();await page.locator('#settleBtn').click();
  const rates=[];
  for(const button of [null,'#speedFastBtn','#speedTurboBtn','#speedTurboBtn']){
   if(button)await page.locator(button).click();
   const before=await page.evaluate(()=>window.__shoreTest.clock());await page.waitForTimeout(700);rates.push((await page.evaluate(()=>window.__shoreTest.clock()))-before);
  }
  assert.ok(rates[1]>rates[0]*8&&rates[2]>rates[1]*2&&rates[3]<rates[1]/8,JSON.stringify(rates));
  assert.equal(await page.locator('#habitat').getAttribute('data-shore-tide'),'0','speed does not advance narrative tide');
  const actorPoint=()=>page.evaluate(()=>{
   const {actors,camera}=window.__shoreTest,r=document.querySelector('#habitat').getBoundingClientRect(),scale=Math.max(1,r.width/384)*camera.zoom,sx=camera.x-r.width/scale/2,sy=camera.y-r.height/scale/2;
   for(const a of [...actors()].reverse()){
    if(a.hidden)continue;const cell=a.hitCells?.find(([x,y])=>document.elementFromPoint(r.left+(x+1-sx)*scale,r.top+(y+1-sy)*scale)?.id==='habitat');
    if(cell)return {id:a.id,x:r.left+(cell[0]+1-sx)*scale,y:r.top+(cell[1]+1-sy)*scale};
   }
  });
  const snapshot=id=>page.evaluate(id=>{const a=window.__shoreTest.actors().find(a=>a.id===id);return {x:a.x,y:a.y,mode:a.interactionState?.mode,posture:a.posture}},id);
  const client=touch?await page.context().newCDPSession(page):null;
  const down=async p=>{if(touch)await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y}]});else{await page.mouse.move(p.x,p.y);await page.mouse.down()}};
  const move=async p=>{if(touch)await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x,y:p.y}]});else await page.mouse.move(p.x,p.y)};
  const up=async()=>{if(touch)await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await page.mouse.up()};
  for(const direction of ['#shorePrev','#shoreNext','#shoreNext']){
   await page.locator(direction).click();await page.waitForTimeout(150);
   let p=await actorPoint();assert.ok(p);await down(p);await up();assert.equal((await snapshot(p.id)).mode,'defensive');
   p=await actorPoint();await down(p);await page.waitForTimeout(540);assert.equal((await snapshot(p.id)).mode,'grabbed');
   const held=await snapshot(p.id);await page.waitForTimeout(220);assert.deepEqual(await snapshot(p.id),held);
   await move({x:p.x+30,y:p.y+30});await up();const placed=await snapshot(p.id);assert.equal(placed.mode,'recovering');assert.ok(Math.hypot(placed.x-held.x,placed.y-held.y)>15);
   await page.waitForTimeout(1100);const recovered=await snapshot(p.id);assert.equal(recovered.mode,undefined);assert.ok(Math.hypot(recovered.x-placed.x,recovered.y-placed.y)<15,'release resumes at placement rather than teleporting to shelter');
   p=await actorPoint();await down(p);await page.waitForTimeout(520);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await up();assert.equal((await snapshot(p.id)).mode,'recovering');
  }
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('isopoda-fugue-v4')));assert.ok(saved.directGrabs>=3&&saved.directMoves>=3);assert.equal(saved.records.length,0);
  assert.deepEqual(errors,[]);console.log(`${name} ${touch?'touch':'mouse'}: speed 1/16/64/reset, tap, hold, drag, release and interruption across all banks OK`);await page.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
