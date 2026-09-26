const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const name=process.env.BROWSER||'chromium',base=process.env.BASE_URL||'http://127.0.0.1:8873';
(async()=>{
 const browser=await (name==='webkit'?webkit:chromium).launch({headless:true,...(name==='chromium'&&process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:process.env.MOTION||'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/isopoda/?habitat=estuary');await page.locator('#startBtn').click();await page.locator('#settleBtn').click();
  assert.match(await page.locator('#interactionCue').textContent(),/点岸上的脚印/);
  assert.doesNotMatch(await page.locator('#observation').textContent(),/点岸上的脚印/);
  const boxes=await Promise.all(['#observation','#interactionCue','#nextBtn'].map(id=>page.locator(id).boundingBox()));assert.ok(boxes[0].y+boxes[0].height<=boxes[1].y&&boxes[1].y+boxes[1].height<=boxes[2].y);
  await page.emulateMedia({reducedMotion:'no-preference'});await page.emulateMedia({reducedMotion:process.env.MOTION||'reduce'});
  const sample=()=>page.evaluate(()=>{
   const c=document.querySelector('#habitat'),g=c.getContext('2d'),point=Number(c.dataset.shorePoint),scale=Math.max(1,c.width/384),sw=c.width/scale,sh=c.height/scale,sx=192-sw/2,sy=215-sh/2;
   const grab=(x,y,w,h)=>{const ax=Math.max(0,Math.round((x-sx)*scale)),ay=Math.max(0,Math.round((y-sy)*scale)),bw=Math.min(c.width-ax,Math.round(w*scale)),bh=Math.min(c.height-ay,Math.round(h*scale));return [...g.getImageData(ax,ay,bw,bh).data]};
   const [x,y]=[[159,228],[177,222],[246,192]][point];return {animal:grab(x-43,y-1,86,46),reeds:point===2?grab(90,20,50,65):grab(50,80,110,54),water:grab(217,300,90,55)};
  });
  for(let tide=0;tide<4;tide++){
   for(let point=0;point<3;point++){
    let current=Number(await page.locator('#habitat').getAttribute('data-shore-point'));
    for(let walk=0;current!==point&&walk<3;walk++){const expected=current+(current>point?-1:1);await page.locator(current>point?'#shorePrev':'#shoreNext').click();await page.waitForFunction(p=>Number(document.querySelector('#habitat').dataset.shorePoint)===p,expected);current=expected}assert.equal(current,point)
    assert.doesNotMatch(await page.locator('#observation').textContent(),/点岸上的脚印/g);
    const coordinate=await page.locator('#dayLabel').textContent(),before=await sample();
    await page.waitForTimeout(1800);const after=await sample();
    for(const region of ['animal','reeds','water']){const diff=before[region].reduce((n,v,i)=>n+(v!==after[region][i]),0);assert.ok(diff>9,`${name} point ${point}, tide ${tide}: ${region} must visibly animate (${diff} changed channels)`)}
    assert.equal(await page.locator('#dayLabel').textContent(),coordinate);
   }
   await page.locator('#nextBtn').click();
  }
  await page.reload();await page.locator('#continueBtn').click();assert.doesNotMatch(await page.locator('#observation').textContent(),/点岸上的脚印/g);
  assert.deepEqual(errors,[]);console.log(`${name} ${process.env.MOTION||'reduce'}: moving isopods, reeds and water fauna across all 12 shore states OK`);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
