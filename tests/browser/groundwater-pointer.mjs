const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import assert from 'node:assert/strict';
(async()=>{
 for(const [engine,type,mobile] of [['chromium',chromium,false],['chromium-touch',chromium,true],['webkit',webkit,false]]){
 const browser=await type.launch({headless:true,...(type===chromium?{channel:'chrome'}:{})});
 const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:900},hasTouch:mobile,isMobile:mobile});
 // Keep the randomly drawn cohort reproducible.
 await page.addInitScript(()=>{Date.now=()=>1700000000042});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/habitat.mjs*',async route=>{
  const response=await route.fetch();let body=await response.text();
  body=body.replace('return {reset,stage,react,','if(canvas.id==="habitat")window.__habitatTest={actors:()=>critters,camera};\nreturn {reset,stage,react,');
  await route.fulfill({response,body});
 });
 await page.goto(process.env.ISOPODA_URL||'http://localhost:8765/isopoda/');
 await page.evaluate(async()=>{const {createRun}=await import('./engine.mjs');localStorage.setItem('isopoda-fugue-v4',JSON.stringify(createRun('cavaticus',37,'groundwater')))});
 await page.reload();await page.locator('#continueBtn').click();
 const initialBeam=await page.locator('.cave-observer-mask').getAttribute('style');
 await page.waitForTimeout(150);
 async function actorPoint(){
 return page.evaluate(()=>{
  const r=document.querySelector('#habitat').getBoundingClientRect(),{camera,actors}=window.__habitatTest;
  const scale=Math.max(1,r.width/384)*camera.zoom,sw=r.width/scale,sh=r.height/scale;
  const sx=camera.x-sw/2,sy=camera.y-sh/2;
  for(const a of [...actors()].reverse()){
   const cell=a.hitCells?.find(([x,y])=>x>sx+12&&x<sx+sw-12&&y>sy+12&&y<sy+sh-12&&document.elementFromPoint(r.left+(x+1-sx)*scale,r.top+(y+1-sy)*scale)?.id==='habitat');
   if(!a.hidden&&cell)return {id:a.id,x:r.left+(cell[0]+1-sx)*scale,y:r.top+(cell[1]+1-sy)*scale};
  }
 });}
 const snapshot=id=>page.evaluate(id=>{const a=window.__habitatTest.actors().find(a=>a.id===id);return {x:a.x,y:a.y,mode:a.interactionState?.mode,posture:a.posture,moving:a.moving,site:a.caveSite?.id}},id);
 const client=mobile?await page.context().newCDPSession(page):null;
 async function down(p){if(mobile)await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y}]});else{await page.mouse.move(p.x,p.y);await page.mouse.down()}}
 async function move(p){if(mobile)await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x,y:p.y}]});else await page.mouse.move(p.x,p.y)}
 async function up(){if(mobile)await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await page.mouse.up();await page.waitForTimeout(60)}
 let p=await actorPoint();if(!p)console.log(await page.evaluate(()=>({rect:document.querySelector('#habitat').getBoundingClientRect().toJSON(),camera:window.__habitatTest.camera,actors:window.__habitatTest.actors().map(a=>({id:a.id,x:a.x,y:a.y,hidden:a.hidden,cells:a.hitCells?.length}))})));assert.ok(p);
 await down(p);await up();assert.equal((await snapshot(p.id)).mode,'defensive');
 p=await actorPoint();await down(p);await page.waitForTimeout(560);assert.equal((await snapshot(p.id)).mode,'grabbed');
 let before=await snapshot(p.id);await page.waitForTimeout(200);assert.deepEqual(await snapshot(p.id),before);
 const target=await page.evaluate(async id=>{
  const {CAVE_SITES}=await import('./scenery/groundwater-sites.mjs');
  const {camera,actors}=window.__habitatTest,a=actors().find(a=>a.id===id),r=document.querySelector('#habitat').getBoundingClientRect();
  const scale=Math.max(1,r.width/384)*camera.zoom,sw=r.width/scale,sh=r.height/scale,sx=camera.x-sw/2,sy=camera.y-sh/2;
  const candidates=CAVE_SITES.filter(o=>o.id!==a.caveSite.id&&o.x>sx+15&&o.x<sx+sw-15&&o.y>sy+15&&o.y<sy+sh-15).sort((b,c)=>Math.hypot(c.x-a.x,c.y-a.y)-Math.hypot(b.x-a.x,b.y-a.y));
  const site=candidates[0];return {id:site.id,x:r.left+(site.x-sx)*scale,y:r.top+(site.y-sy)*scale,wx:site.x,wy:site.y};
 },p.id);
 await move(target);await up();
 let after=await snapshot(p.id);assert.equal(after.mode,'recovering');assert.equal(after.site,target.id);assert.ok(Math.hypot(after.x-before.x,after.y-before.y)>10);
 await page.waitForTimeout(1600);assert.equal((await snapshot(p.id)).mode,undefined);assert.equal((await snapshot(p.id)).site,target.id);assert.ok(Math.hypot((await snapshot(p.id)).x-target.wx,(await snapshot(p.id)).y-target.wy)<24,'stays by the newly chosen crack');

 p=await actorPoint();await down(p);await page.waitForTimeout(550);assert.equal((await snapshot(p.id)).mode,'grabbed');
 await move({x:1,y:1});await up();after=await snapshot(p.id);assert.ok(after.x>=24&&after.x<=355&&after.y>=30&&after.y<=400);

 p=await actorPoint();await down(p);await page.waitForTimeout(550);
 if(mobile)await client.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
 else{await page.locator('#habitat').dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up()}
 assert.equal((await snapshot(p.id)).mode,'recovering');
 // An interrupted hold must recover, and another gesture must still work.
 p=await actorPoint();await down(p);await page.waitForTimeout(550);
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
 await up();assert.equal((await snapshot(p.id)).mode,'recovering');
 assert.equal(await page.locator('.cave-observer-mask').getAttribute('style'),initialBeam,'grabbing does not move the torch');
 if(mobile){
  const stick=await page.locator('#zoomReset').boundingBox(),p={x:stick.x+stick.width/2,y:stick.y+stick.height/2};
  await down(p);await move({x:p.x+15,y:p.y});await page.waitForTimeout(500);await up();
  assert.notEqual(await page.locator('.cave-observer-mask').getAttribute('style'),initialBeam,'touch joystick moves the torch');
  const released=await page.locator('.cave-observer-mask').getAttribute('style');await page.waitForTimeout(300);
  assert.equal(await page.locator('.cave-observer-mask').getAttribute('style'),released);
 }
 const records=await page.evaluate(()=>JSON.parse(localStorage.getItem('isopoda-fugue-v4')).directRecords);
 assert.ok(records.some(r=>r.type==='grab'&&r.specimen));assert.ok(records.some(r=>r.type==='place'&&r.specimen));
 assert.deepEqual(errors,[]);console.log(engine+' cave tap, hold, drag, release, cancel, blur and independent torch PASS');
 await page.close();await browser.close();
 }
})().catch(e=>{console.error(e);process.exit(1)});
