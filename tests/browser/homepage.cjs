const qaOutput=process.env.QA_OUTPUT||'/tmp';require('node:fs').mkdirSync(qaOutput,{recursive:true});
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await ({chromium,webkit}[process.env.BROWSER||'chromium']).launch({headless:true,...(process.env.BROWSER==='webkit'||process.env.CI?{}:{channel:'chrome'})});
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.closeCalls=0;window.close=()=>window.closeCalls++;window.audioSources=[];const start=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...args){window.audioSources.push({loop:this.loop,duration:this.buffer?.duration});return start.apply(this,args)}});
 await page.clock.install({time:new Date(2026,8,27,23,59,59)});
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:8876');
 await page.waitForFunction(()=>document.querySelector('#desktopTime').textContent.length===5);
 await page.clock.runFor(2000);
 assert.equal(await page.locator('#desktopTime').textContent(),'00:00');assert.equal(await page.locator('#desktopDate').textContent(),'2026/09/28');
 await page.clock.resume();
 for(const [lang,title] of [['zh-CN','环世界观测系统'],['en','UMWELT OBSERVATION SYSTEM'],['ja','環世界観測システム']]){
  assert.equal(await page.locator('.welcome h1').textContent(),'UMWELT');assert.equal(await page.locator('.welcome-links a').count(),2);
  assert.equal(await page.locator('html').getAttribute('lang'),lang);assert.equal(await page.title(),title);
  assert.equal(await page.locator('#systemMenu button').count(),1);
  for(const action of ['leave']){
   await page.click('#systemButton');await page.click(`[data-action=${action}]`);assert.equal(await page.locator('#systemDialog').evaluate(el=>el.open),true);
   await page.screenshot({path:`${qaOutput}/homepage-${process.env.BROWSER||'chromium'}-${lang}-${action}.png`});
   await page.click('#cancelAction');assert.equal(await page.locator('#systemDialog').evaluate(el=>el.open),false);
  }
  await page.click('#languageButton');
 }
 assert.equal(await page.evaluate(()=>window.closeCalls),0);
 await page.click('#soundBtn');await page.locator('#soundBtnPanel input').fill('0');assert.equal(await page.locator('#soundBtn').getAttribute('aria-pressed'),'false');
 await page.click('#musicBtn');await page.locator('#musicBtnPanel input').fill('0');const muted=await page.evaluate(()=>window.audioSources.length);await page.click('#aboutButton');assert.equal(await page.evaluate(()=>window.audioSources.length),muted);
 await page.click('#soundBtn');await page.locator('#soundBtnPanel input').fill('45');await page.waitForTimeout(100);await page.click('#aboutButton');assert.ok(await page.evaluate(()=>window.audioSources.length)>muted);
 assert.equal(await page.evaluate(()=>window.audioSources.some(s=>s.loop)),false);
 await page.click('#systemButton');await page.keyboard.press('Escape');assert.equal(await page.locator('#systemMenu').isHidden(),true);
 await page.click('#languageButton');await page.reload();assert.equal(await page.locator('html').getAttribute('lang'),'en');
 for(const width of [1440,390,320]){await page.setViewportSize({width,height:900});await page.screenshot({path:`${qaOutput}/homepage-${process.env.BROWSER||'chromium'}-${width}.png`});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const a=await page.locator('#systemButton').boundingBox(),b=await page.locator('.tray').boundingBox();assert.ok(a.x+a.width<=b.x)}
 // Returning visitors can still open the welcome window from About.
 assert.equal(await page.locator('#welcome').isHidden(),true);
 await page.locator('#aboutButton').click();
 // Launchers flow down the available desktop height before starting a new column.
 await page.locator('#closeWelcome').click();
 // Every graphic scales with its frame, including the former fixed-position flower pot.
 const glyphs=()=>page.evaluate(()=>[...document.querySelectorAll('.app-picture')].map(frame=>{
  const graphic=frame.querySelector('canvas,svg,img');
  const r=frame.getBoundingClientRect(),g=graphic?.getBoundingClientRect();
  let ink=g;
  if(graphic?.tagName==='IMG'&&graphic.complete){
   const canvas=document.createElement('canvas');canvas.width=graphic.naturalWidth;canvas.height=graphic.naturalHeight;
   const c=canvas.getContext('2d');c.drawImage(graphic,0,0);
   const pixels=c.getImageData(0,0,canvas.width,canvas.height).data;let l=canvas.width,t=canvas.height,right=0,bottom=0;
   for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(pixels[(y*canvas.width+x)*4+3]){l=Math.min(l,x);t=Math.min(t,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1)}
   ink={left:g.left+l*g.width/canvas.width,top:g.top+t*g.height/canvas.height,right:g.left+right*g.width/canvas.width,bottom:g.top+bottom*g.height/canvas.height};
  }
  return {name:frame.className,frame:r.width,graphic:g?.width,
   inside:!!ink&&ink.left>=r.left+3-.1&&ink.top>=r.top+3-.1&&ink.right<=r.right-3+.1&&ink.bottom<=r.bottom-3+.1};
 }));
 await page.setViewportSize({width:900,height:650});const large=await glyphs();
 await page.setViewportSize({width:900,height:568});const small=await glyphs();
 for(const [i,graphic] of small.entries()){
  assert.ok(graphic.inside&&large[i].inside,`${graphic.name}: artwork stays inside its frame`);
  assert.ok(Math.abs(graphic.graphic/large[i].graphic-(graphic.frame-6)/(large[i].frame-6))<.01,`${graphic.name}: proportional shrinking`);
 }
 for(const height of [650,568]){
  await page.setViewportSize({width:900,height});
  const pot=await page.locator('.rooftop-picture svg').evaluate(svg=>{
   const ink=svg.getBBox(),matrix=svg.getScreenCTM(),box=svg.getBoundingClientRect();
   const center=new DOMPoint(ink.x+ink.width/2,ink.y+ink.height/2).matrixTransform(matrix);
   return {dx:center.x-box.x-box.width/2,dy:center.y-box.y-box.height/2};
  });
  assert.ok(Math.abs(pot.dx)<.5&&Math.abs(pot.dy)<.5,'flower pot stays centered at both frame sizes');
 }
 for(const [width,height] of [[1440,900],[900,650],[320,568],[640,360],[320,320]]){
  await page.setViewportSize({width,height});
  const layout=await page.evaluate(()=>({
   icons:[...document.querySelectorAll('.desktop-icon')].map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom}}),
   tray:document.querySelector('.taskbar').getBoundingClientRect().top,
   menu:document.querySelector('.desktop-menu').getBoundingClientRect().bottom,
   scrolls:document.querySelector('.desktop-apps').scrollHeight>document.querySelector('.desktop-apps').clientHeight
  }));
  assert.equal(layout.scrolls,false,`${width}x${height}: no vertical launcher scrolling`);
  for(const [i,box] of layout.icons.entries()){
   assert.ok(box.x>=0&&box.right<=width&&box.y>=layout.menu&&box.bottom<=layout.tray,`${width}x${height}: icon ${i} stays on desktop`);
   if(i){const before=layout.icons[i-1];assert.ok(box.x===before.x?box.y>=before.bottom:box.x>=before.right&&box.y===layout.icons[0].y,'column-major icon order')}
  }
  if(height<=650)assert.ok(new Set(layout.icons.map(box=>box.x)).size>1,'short desktop starts another column');
 }
 await page.click('#systemButton');await page.click('[data-action=leave]');await page.click('#confirmAction');await page.waitForURL('about:blank');
 assert.deepEqual(errors,[]);console.log('Homepage passed: 3 languages, single leave dialog, cancel and exit fallback, mute, no ambience, persistence, midnight clock, keyboard, 3 widths and automatic desktop columns.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
