const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 for(const mobile of [false,true]){
 const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:900},hasTouch:mobile,isMobile:mobile});
 // Keep the randomly drawn cohort reproducible.
 await page.addInitScript(()=>{Date.now=()=>1700000000042});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/habitat.mjs*',async route=>{
  const response=await route.fetch();let body=await response.text();
  body=body.replace('return {reset,stage,react,','if(canvas.id==="habitat")window.__habitatTest={actors:()=>critters,camera};\nreturn {reset,stage,react,');
  await route.fulfill({response,body});
 });
 await page.goto(process.env.ISOPODA_URL||'http://localhost:8874/isopoda/');
 await page.locator('#startBtn').click();await page.locator('#settleBtn').click();
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
 const snapshot=id=>page.evaluate(id=>{const a=window.__habitatTest.actors().find(a=>a.id===id);return {x:a.x,y:a.y,mode:a.interactionState?.mode,posture:a.posture,moving:a.moving}},id);
 const client=await page.context().newCDPSession(page);
 async function down(p){if(mobile)await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y}]});else{await page.mouse.move(p.x,p.y);await page.mouse.down()}}
 async function move(p){if(mobile)await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x,y:p.y}]});else await page.mouse.move(p.x,p.y)}
 async function up(){if(mobile)await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await page.mouse.up();await page.waitForTimeout(60)}
 let p=await actorPoint();if(!p)console.log(await page.evaluate(()=>({rect:document.querySelector('#habitat').getBoundingClientRect().toJSON(),camera:window.__habitatTest.camera,actors:window.__habitatTest.actors().map(a=>({id:a.id,x:a.x,y:a.y,hidden:a.hidden,cells:a.hitCells?.length}))})));assert.ok(p);
 await down(p);await up();assert.equal((await snapshot(p.id)).mode,'defensive');
 p=await actorPoint();await down(p);await page.waitForTimeout(560);assert.equal((await snapshot(p.id)).mode,'grabbed');
 let before=await snapshot(p.id);await page.waitForTimeout(200);assert.deepEqual(await snapshot(p.id),before);
 await move({x:p.x+35,y:p.y+28});await up();
 let after=await snapshot(p.id);assert.equal(after.mode,'recovering');assert.ok(Math.hypot(after.x-before.x,after.y-before.y)>10);
 await page.waitForTimeout(1100);assert.equal((await snapshot(p.id)).mode,undefined);
 await page.locator('#zoomIn').click();await page.locator('#zoomIn').click();
 p=await actorPoint();await down(p);await page.waitForTimeout(550);assert.equal((await snapshot(p.id)).mode,'grabbed');
 await move({x:1,y:1});await up();after=await snapshot(p.id);assert.ok(after.x>=24&&after.x<=355&&after.y>=30&&after.y<=400);
 await page.locator('#zoomReset').click();
 p=await actorPoint();await down(p);await page.waitForTimeout(550);
 if(mobile)await client.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
 else{await page.locator('#habitat').dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up()}
 assert.equal((await snapshot(p.id)).mode,'recovering');
 // An interrupted hold must recover, and another gesture must still work.
 p=await actorPoint();await down(p);await page.waitForTimeout(550);
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
 await up();assert.equal((await snapshot(p.id)).mode,'recovering');
 // Empty ground retains camera panning at increased zoom.
 await page.locator('#zoomIn').click();
 const ground=await page.evaluate(()=>{
  const r=document.querySelector('#habitat').getBoundingClientRect(),{camera,actors}=window.__habitatTest;
  const scale=Math.max(1,r.width/384)*camera.zoom,sx=camera.x-r.width/scale/2,sy=camera.y-r.height/scale/2;
  for(let x=40;x<r.width-50;x+=20)for(let y=40;y<r.height-50;y+=20){
   const wx=sx+x/scale,wy=sy+y/scale;
   if(document.elementFromPoint(r.left+x,r.top+y)?.id==='habitat'&&!actors().some(a=>a.hitCells?.some(([cx,cy])=>wx>=cx-8&&wx<=cx+10&&wy>=cy-8&&wy<=cy+10)))return {x:r.left+x,y:r.top+y};
  }
 });
 const cameraBefore=await page.evaluate(()=>({...window.__habitatTest.camera}));
 await down(ground);await move({x:ground.x+25,y:ground.y+25});await up();
 const cameraAfter=await page.evaluate(()=>({...window.__habitatTest.camera}));
 assert.notDeepEqual(cameraBefore,cameraAfter);
 await page.locator('#zoomReset').click();
 await page.locator('#catalogBtn').click();await page.locator('#closeDrawer').click();
 await page.screenshot({path:'/tmp/pointer-play-'+(mobile?'mobile':'desktop')+'.png'});
 await page.locator('#actions button').first().click();
 await page.reload();await page.locator('#continueBtn').click();await page.locator('#nextBtn').click();
 for(let i=1;i<21;i++){await page.locator('#actions button').first().click();await page.locator('#nextBtn').click()}
 assert.equal(await page.locator('#endCard').isVisible(),true);
 await page.screenshot({path:'/tmp/pointer-'+(mobile?'mobile':'desktop')+'.png'});
 assert.deepEqual(errors,[]);console.log(mobile?'mobile PASS':'desktop PASS');
 await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
