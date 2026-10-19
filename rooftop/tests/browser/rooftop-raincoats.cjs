const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const origin=process.env.BASE_URL||'http://127.0.0.1:8876';
const out=process.env.QA_OUTPUT||'/tmp/rooftop-raincoats';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'}),report=[];
 try {
 for(const mode of ['raincoat','shelter'])for(const scene of ['north','south']){
  const context=await browser.newContext({viewport:scene==='north'?{width:1280,height:900}:{width:390,height:844},deviceScaleFactor:1});
  // Force only the episode draw; walking, outfits and resident choices remain real.
  await context.route('**/rooftop/weather.mjs',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('random = Math.random,',`random = () => ${mode==='raincoat'?'.25':'.75'},`)});});
  const page=await context.newPage(),errors=[];page.setDefaultTimeout(90000);console.log("Loading",scene,mode);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${origin}/rooftop/?scene=${scene}&weather=rain&time=afternoon&month=6`);
  await page.waitForFunction(()=>window.rooftop?.graphics?.background?.loaded&&rooftop.graphics.drawCalls>0);
  assert.equal(await page.evaluate(()=>rooftop.weather.rainMode),mode);
  const before=await page.evaluate(()=>({wardrobe:localStorage.getItem('umwelt-dongdong-wardrobe-v1'),layout:JSON.stringify(rooftop.layout),p:rooftop.person,g:rooftop.pig}));
  if(mode==='raincoat'){
   await page.waitForFunction(()=>rooftop.graphics.raincoats.person&&rooftop.graphics.raincoats.pig);
   await page.waitForFunction(({p,g})=>Math.hypot(rooftop.person.x-p.x,rooftop.person.y-p.y)>3||Math.hypot(rooftop.pig.x-g.x,rooftop.pig.y-g.y)>3,before,{timeout:150000});
   assert.equal(await page.evaluate(()=>rooftop.person.sheltered||rooftop.pig.sheltered),false);
  }else{
   await page.waitForFunction(()=>rooftop.person.sheltered&&rooftop.pig.sheltered,null,{timeout:180000});
   assert.deepEqual(await page.evaluate(()=>rooftop.graphics.raincoats),{person:false,pig:false});
  }
  for(const reducedMotion of ['reduce','no-preference']){
   await page.emulateMedia({reducedMotion});const t=await page.evaluate(()=>rooftop.weather.elapsed);
   await page.waitForFunction(t=>rooftop.weather.elapsed>t+.4,t);
   assert.equal(await page.evaluate(()=>rooftop.weather.rainMode),mode);
  }
  assert.doesNotMatch(await page.locator('#actionStatus').innerText(),/浇水/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('umwelt-dongdong-wardrobe-v1')),before.wardrobe);
  assert.equal(await page.evaluate(()=>JSON.stringify(rooftop.layout)),before.layout);
  await page.screenshot({path:`${out}/${scene}-${mode}.png`});
  report.push({scene,mode,errors,state:await page.evaluate(()=>({person:rooftop.person,pig:rooftop.pig,raincoats:rooftop.graphics.raincoats,visible:rooftop.graphics.actorVisibility}))});
  assert.deepEqual(errors,[]);await context.close();console.log(scene,mode,'passed');
 }
 fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));
 } finally{await browser.close();}
})();
