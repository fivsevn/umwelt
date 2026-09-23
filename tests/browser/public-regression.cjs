// BROWSER=webkit BASE_URL=... COMPARE_URL=... QA_OUTPUT=/tmp/qa node this-file
// Deterministic frame stepping is test-only; production timing and assets are untouched.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8765',compare=process.env.COMPARE_URL;
const output=process.env.QA_OUTPUT;
async function setup(browser,url,size){
 const context=await browser.newContext({viewport:{width:size[0],height:size[1]},locale:'zh-CN',timezoneId:'Asia/Shanghai',reducedMotion:'reduce'});
 await context.addInitScript(()=>{
  const NativeDate=Date;globalThis.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[1790121600000]))}static now(){return 1790121600000}};
  let seed=12345;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  let serial=0,time=0;const frames=new Map();
  requestAnimationFrame=fn=>{frames.set(++serial,fn);return serial};cancelAnimationFrame=id=>frames.delete(id);
  performance.now=()=>time;
  globalThis.__qaFrames=()=>{for(let i=0;i<8;i++){time+=80;const batch=[...frames.values()];frames.clear();for(const fn of batch)fn(time)}};
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&new URL(r.url()).origin===new URL(url).origin)errors.push(`${r.status()} ${r.url()}`)});
 return {page,context,errors,url};
}
async function settle(page){await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(80);await page.evaluate(()=>__qaFrames());await page.waitForTimeout(80);await page.evaluate(()=>__qaFrames())}
async function click(page,selector){await page.locator(selector).first().waitFor({state:'visible'});await page.locator(selector).first().evaluate(e=>e.click());await settle(page)}
async function capture(run,label){
 const p=run.page;await settle(p);
 const state=await p.evaluate(()=>({text:document.body.innerText,overflow:document.documentElement.scrollWidth>innerWidth,save:localStorage.getItem('isopoda-fugue-v4')}));
 // Compare the existing overflow state; do not change production layout to satisfy this harness.
 const shot=await p.screenshot({fullPage:true,animations:'disabled'});
 if(output){fs.mkdirSync(output,{recursive:true});fs.writeFileSync(`${output}/${label}.png`,shot)}
 assert.deepEqual(run.errors,[],label);
 return {state,shot};
}
(async()=>{
 const engine=process.env.BROWSER==='webkit'?webkit:chromium;
 const browser=await engine.launch({headless:true,...(engine===chromium&&!process.env.CI?{channel:'chrome'}:{})});
 try{for(const size of [[320,568],[390,844],[1440,900]]){
  const runs=await Promise.all([base,...(compare?[compare]:[])].map(url=>setup(browser,url,size)));
  const snapshot=async label=>{
   const captures=[];for(const [i,r] of runs.entries())captures.push(await capture(r,`${size.join('x')}-${label}-${i}`));
   if(compare){assert.deepEqual(captures[0].state,captures[1].state,`${label}: text/layout/save differs`);assert.ok(captures[0].shot.equals(captures[1].shot),`${size}: ${label} pixels differ`)}
  };
  for(const route of ['/','/isopoda/morphology/','/isopoda/habitat.html']){
   for(const r of runs){await r.page.goto(r.url+route);await settle(r.page)}
   await snapshot(route==='/'?'home':route.includes('morphology')?'morphology':'habitat');
  }
  for(const habitat of ['terrestrial','abyssal']){
   for(const r of runs){await r.page.evaluate(()=>localStorage.clear());await r.page.goto(r.url+'/isopoda/');await r.page.waitForFunction(()=>!!document.querySelector('#startBtn')?.onclick);await settle(r.page);if(habitat==='abyssal')for(let i=0;i<4;i++)await click(r.page,'#habitatNext')}
   await snapshot(`${habitat}-title`);
   for(const r of runs)await click(r.page,'#startBtn');await snapshot(`${habitat}-arrival`);
   for(const r of runs){await click(r.page,'#settleBtn');assert.ok(await r.page.locator('#actions button').count()>0)}await snapshot(`${habitat}-play`);
   for(const r of runs){await click(r.page,'#actions button');assert.equal(await r.page.locator('#nextBtn').isDisabled(),false)}await snapshot(`${habitat}-feedback`);
   for(const r of runs){await r.page.reload();await r.page.waitForFunction(()=>!!document.querySelector('#continueBtn')?.onclick);await click(r.page,'#continueBtn')}await snapshot(`${habitat}-reload`);
   for(const r of runs){await click(r.page,'#catalogBtn');await click(r.page,'#sourcesBtn');await r.page.waitForSelector('.reference-page:not([aria-busy])')}await snapshot(`${habitat}-credits`);
  }
  for(const r of runs)await r.context.close();console.log(`PASS ${size.join('×')}: four routes, terrestrial/abyssal start, choice, reload, credits${compare?', baseline pixels/text/save equal':''}`);
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
