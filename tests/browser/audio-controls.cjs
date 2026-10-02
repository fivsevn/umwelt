const qaOutput=process.env.QA_OUTPUT||'/tmp';require('node:fs').mkdirSync(qaOutput,{recursive:true});
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
(async()=>{for(const type of process.env.BROWSER?[{chromium,webkit}[process.env.BROWSER]]:[chromium,webkit]){
 const browser=await type.launch({headless:true,...(type===chromium?{...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})}:{...(process.env.WEBKIT_PATH?{executablePath:process.env.WEBKIT_PATH}:{})})});
 try{const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.BASE_URL||'http://127.0.0.1:8878';
 for(const route of ['/isopoda/','/']){
  await page.goto(base+route);if(route.includes('isopoda')){await page.locator('#startBtn').click();await page.locator('#settleBtn').click()}
  for(const id of ['musicBtn','soundBtn']){
   await page.locator('#'+id).click();const panel=page.locator('#'+id+'Panel'),range=panel.locator('input');
   assert.equal(await panel.innerText(),'');assert.equal(await panel.locator('button,strong,output').count(),0);
   assert.equal(await page.locator('#'+id).getAttribute('title'),null);
   const box=await range.boundingBox();assert.ok(box.height>box.width*3);
   // Exercise actual vertical pointer input: top loud, bottom silent.
   await page.mouse.click(box.x+box.width/2,box.y+box.height-2);assert.equal(await range.inputValue(),'0');assert.equal(await page.locator('#'+id).getAttribute('aria-pressed'),'false');
   await page.mouse.click(box.x+box.width/2,box.y+2);assert.equal(await range.inputValue(),'100');assert.equal(await page.locator('#'+id).getAttribute('aria-pressed'),'true');
   if(id==='musicBtn'){
    const pixels=await page.locator('#musicBtn canvas').evaluate(canvas=>{const data=canvas.getContext('2d').getImageData(0,0,8,12).data;let painted=0;for(let i=0;i<data.length;i+=4){if(data[i+3]){if(data[i]!==64||data[i+1]!==81||data[i+2]!==63||data[i+3]!==255)throw Error('music pixels do not match effects ink');painted++}}return painted});
    assert.equal(pixels,27);
   }
   await range.fill('17');const channel=id==='musicBtn'?'music':'sfx';let s=await page.evaluate(()=>JSON.parse(localStorage.getItem('umwelt-audio-v1')));assert.equal(s[channel].volume,.17);assert.equal(s[channel].muted,false);
   await page.screenshot({path:`${qaOutput}/audio-${route==='/'?'desktop':'game'}-${id}-${type.name()}.png`});
   await page.keyboard.press('Escape');assert.equal(await panel.isVisible(),false);assert.equal(await page.locator('#'+id).evaluate(e=>e===document.activeElement),true);
  }
  for(const width of [320,390,1440]){await page.setViewportSize({width,height:844});await page.locator('#musicBtn').click();let box=await page.locator('#musicBtnPanel').boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=width&&box.y+box.height<=844);await page.keyboard.press('Escape')}
  await page.setViewportSize({width:390,height:844});
 }
 assert.deepEqual(errors,[]);console.log(type.name()+' shared vertical audio controls passed');
 }finally{await browser.close()}
}})().catch(e=>{console.error(e);process.exit(1)});
