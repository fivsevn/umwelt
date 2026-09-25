const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const base=process.env.BASE_URL||'http://localhost:8874',out=process.env.QA_OUTPUT||'/tmp/sand-qa';fs.mkdirSync(out,{recursive:true});
(async()=>{const engine=process.env.BROWSER||'chromium',browser=await (engine==='webkit'?webkit:chromium).launch({headless:true,...(engine==='chromium'?{executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});
try{for(const width of [320,390,1440]){
 const page=await browser.newPage({viewport:{width,height:width<500?844:900},hasTouch:width<500,isMobile:width<500}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/habitat.mjs*',async route=>{const response=await route.fetch();const body=(await response.text()).replace('return {reset,stage,react,heartBurst,',`if(canvas.id==='habitat')window.__sandTest={actors:()=>critters,camera,view:()=>{const r=canvas.getBoundingClientRect();return cameraWindow(r.width,r.height,camera.zoom,camera.x,camera.y)}};return {reset,stage,react,heartBurst,`);await route.fulfill({response,body})});
 await page.goto(base+'/isopoda/');await page.evaluate(async()=>{const {createRun}=await import('/isopoda/engine.mjs');const s=createRun('pulchra',42,'sandy-surf');s.arrivalPending=true;localStorage.setItem('isopoda-fugue-v4',JSON.stringify(s))});await page.reload();await page.locator('#continueBtn').click();assert.match(await page.locator('#arrivalCard').innerText(),/这片沙里的住客/);await page.screenshot({path:`${out}/${engine}-${width}-arrival.png`,fullPage:true});await page.locator('#settleBtn').click();
 const point=async id=>page.evaluate(id=>{const a=window.__sandTest.actors().find(a=>a.id===id),r=document.querySelector('#habitat').getBoundingClientRect(),v=window.__sandTest.view();return {x:r.left+(a.x-v.sx)*v.scale,y:r.top+(a.y-v.sy)*v.scale}},id);
 const snap=async id=>page.evaluate(id=>{const a=window.__sandTest.actors().find(a=>a.id===id);return {x:a.x,y:a.y,mode:a.interactionState?.mode,hidden:a.hidden,sand:{...a.sand}}},id);
 const id=await page.evaluate(()=>window.__sandTest.actors().find(a=>a.hidden&&a.sand.quiet).id),p=await point(id),before=await snap(id);
 const client=engine==='chromium'&&width<500?await page.context().newCDPSession(page):null;
 const down=async p=>{if(client)await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});else{await page.mouse.move(p.x,p.y);await page.mouse.down()}};
 const move=async p=>{if(client)await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[p]});else await page.mouse.move(p.x,p.y)};
 const up=async()=>{if(client)await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await page.mouse.up()};
 await down(p);await page.waitForTimeout(650);assert.equal((await snap(id)).mode,'grabbed');assert.equal((await snap(id)).hidden,false);await page.screenshot({path:`${out}/${engine}-${width}-dig.png`,fullPage:true});
 await move({x:p.x+25,y:p.y+18});await up();const released=await snap(id);assert.equal(released.mode,'recovering');assert.ok(Math.hypot(released.x-before.x,released.y-before.y)>10);
 await page.waitForTimeout(900);assert.equal((await snap(id)).mode,undefined);
 const count=await page.evaluate(()=>window.__sandTest.actors().length);await page.locator('#habitat').click({position:{x:12,y:16}});assert.equal(await page.evaluate(()=>window.__sandTest.actors().length),count);
 const quiet=await page.evaluate(()=>window.__sandTest.actors().find(a=>a.hidden)?.id);if(quiet!==undefined){await down(await point(quiet));await page.waitForTimeout(100);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await up();assert.equal((await snap(quiet)).mode,'recovering')}
 for(const lang of ['en','ja','isopod','zh']){await page.evaluate(async lang=>{const {setLanguage}=await import('/isopoda/i18n.mjs');setLanguage(lang)},lang);assert.ok(!(await page.locator('#playView').innerText()).includes('sand:'));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false)}
 await page.locator('#actions button').first().click();await page.reload();await page.locator('#continueBtn').click();assert.equal(await page.locator('#nextBtn').isEnabled(),true);await page.locator('#nextBtn').click();
 for(let i=1;i<9;i++){await page.locator('#actions button').last().click();await page.locator('#nextBtn').click()}
 assert.equal(await page.locator('#endCard').isVisible(),true);assert.equal(await page.locator('#playView').isVisible(),true);const a0=await snap(0);await page.waitForTimeout(400);assert.notDeepEqual((await snap(0)).sand,a0.sand);
 await page.reload();await page.locator('#continueBtn').click();assert.equal(await page.locator('#playView').isVisible(),true);assert.equal(await page.evaluate(()=>window.__sandTest.actors().length),7);assert.deepEqual(errors,[]);console.log(engine,width,'PASS');await page.close();
 }}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
