const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {chromium,webkit}=require('playwright');
const base=(process.env.BASE_URL||'http://127.0.0.1:8797').replace(/\/$/,'');
const name=process.env.BROWSER||'chromium';

(async()=>{
 const browser=await {chromium,webkit}[name].launch({headless:true});
 const errors=[],displayRequests=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400&&response.url().startsWith(base))errors.push(`${response.status()} ${response.url()}`);});
  page.on('request',request=>{if(/\/lcd\.mjs(?:\?|$)/.test(request.url()))displayRequests.push(request.url());});
  const ready=async()=>{await page.locator('.post-text,.settings-card').first().waitFor();await page.evaluate(()=>document.fonts.ready);};
  const material=()=>page.locator('.app-window').evaluate(element=>{
   const paper=getComputedStyle(element,'::before'),cells=getComputedStyle(element,'::after'),box=element.getBoundingClientRect();
   return {paper:paper.backgroundImage,cells:cells.backgroundImage,size:cells.backgroundSize,origin:cells.backgroundPosition,x:box.x,y:box.y,width:box.width,height:box.height};
  });
  await page.goto(`${base}/gsm/`);await ready();
  assert.equal(await page.locator('.lcd-dots,[data-lcd-text]').count(),0,'the native display needs no duplicate text plane');
  const ink=await page.locator('.post-text').first().evaluate(element=>{
   const css=getComputedStyle(element),range=document.createRange();range.selectNodeContents(element);
   getSelection().removeAllRanges();getSelection().addRange(range);
   return {copy:getSelection().toString(),source:element.textContent,fill:css.webkitTextFillColor,color:css.color,
    font:css.fontFamily,weight:css.fontWeight,filter:css.filter,shadow:css.textShadow};
  });
  assert.equal(ink.copy,ink.source,'the visible text is directly selectable');
  assert.equal(ink.fill,ink.color,'the existing font supplies the visible ink');
  assert.match(ink.font,/Pixel/);assert.equal(ink.weight,'400');assert.equal(ink.filter,'none');assert.equal(ink.shadow,'none','ordinary strokes are not thickened by a shadow');
  await page.evaluate(()=>getSelection().removeAllRanges());
  const glass=await page.locator('.app-window').evaluate(element=>({
   cells:getComputedStyle(element,'::before').pointerEvents,glare:getComputedStyle(element,'::after').pointerEvents
  }));
  assert.equal(glass.cells,'none');assert.equal(glass.glare,'none','the screen material never intercepts controls');

  // Each text link responds independently; no plaque or parent hover binding.
  const label=page.locator('a.author-label').first(),handle=page.locator('a.author-handle').first();
  const shadow=element=>getComputedStyle(element).textShadow;
  const initialLabel=await label.evaluate(shadow),initialHandle=await handle.evaluate(shadow);
  await label.hover();
  assert.notEqual(await label.evaluate(shadow),initialLabel);assert.equal(await handle.evaluate(shadow),initialHandle);
  await handle.hover();
  assert.equal(await label.evaluate(shadow),initialLabel);assert.notEqual(await handle.evaluate(shadow),initialHandle);
  for(const target of [label,handle]){
   const effect=await target.evaluate(element=>{const css=getComputedStyle(element);return {line:css.textDecorationLine,plate:css.boxShadow,before:getComputedStyle(element,'::before').content};});
   assert.equal(effect.line,'none');assert.equal(effect.plate,'none');assert.ok(['none','normal'].includes(effect.before));
  }
  await handle.focus();await page.keyboard.press('Enter');await page.waitForURL(url=>url.searchParams.has('user'));await ready();
  assert.equal(await page.locator('.profile-bio').evaluate(element=>getComputedStyle(element).fontStyle),'italic');
  await page.locator('#profileBack').click();await page.waitForURL(url=>!url.searchParams.has('user'));await ready();

  const beforeScroll=await material();
  const header=await page.locator('.masthead').boundingBox();
  await page.locator('#timeline').evaluate(element=>element.scrollTop=500);
  assert.deepEqual(await material(),beforeScroll,'the material stays on the glass while messages scroll');
  assert.deepEqual(await page.locator('.masthead').boundingBox(),header);
  assert.ok(await page.locator('#timeline').evaluate(element=>element.scrollTop>0));
  const time=page.locator('.post-time').first();await time.evaluate(element=>element.textContent='12 分钟前');
  assert.equal(await time.innerText(),'12 分钟前','content updates use native layout without display synchronization');

  await page.goto(`${base}/gsm/settings/`);await ready();
  const languages=[];
  for(let i=0;i<3;i++){
   languages.push(await page.locator('html').getAttribute('lang'));
   assert.notEqual(await page.locator('.settings-row').first().evaluate(element=>getComputedStyle(element).webkitTextFillColor),'rgba(0, 0, 0, 0)');
   await page.locator('#languageButton').click();
  }
  assert.deepEqual(languages,['zh-CN','en','ja']);

  for(const [width,height] of [[320,568],[390,844],[844,390],[1280,1000]]){
   await page.setViewportSize({width,height});await page.goto(`${base}/gsm/`);await ready();
   const layout=await page.evaluate(()=>{
    const header=document.querySelector('.masthead').getBoundingClientRect(),rem=parseFloat(getComputedStyle(document.documentElement).fontSize);
    const decorations=[...document.querySelectorAll('.pixel-stickers .decoration')].map(element=>{
     const box=element.getBoundingClientRect();return {left:box.left,top:box.top,right:box.right,bottom:box.bottom};
    });
    const overlaps=decorations.flatMap((a,i)=>decorations.slice(i+1).filter(b=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>.5&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>.5));
    return {font:parseFloat(getComputedStyle(document.querySelector('.post-text')).fontSize),count:decorations.length,
     inset:(header.right-Math.max(...decorations.map(box=>box.right)))/rem,
     fits:decorations.every(box=>box.left>=header.left-.5&&box.right<=header.right+.5&&box.top>=header.top-.5&&box.bottom<=header.bottom+.5),overlaps:overlaps.length,
     overflow:document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1};
   });
   assert.ok(layout.font>=16,`${width}×${height}: body text retains the existing minimum`);
   assert.equal(layout.count,9);assert.equal(layout.fits,true);assert.equal(layout.overlaps,0);assert.equal(layout.overflow,false);
   assert.ok(layout.inset>=12,`${width}×${height}: ornaments have breathing room from the glass edge`);
   if(process.env.QA_OUTPUT){await fs.mkdir(process.env.QA_OUTPUT,{recursive:true});await page.screenshot({path:`${process.env.QA_OUTPUT}/gsm-lcd-${name}-${width}x${height}.png`});}
  }
  assert.deepEqual(displayRequests,[],'no text renderer is fetched or synchronized');
  assert.deepEqual(errors,[]);
  console.log(`${name}: native visible font, selection, independent text hover, profile navigation, fixed nonblocking material, live text, 3 languages, narrow/landscape layout and 9 inset ornaments passed.`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
