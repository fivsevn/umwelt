const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const name=process.env.BROWSER||'chromium',base=process.env.BASE_URL||'http://127.0.0.1:8873';
(async()=>{const browser=await (name==='webkit'?webkit:chromium).launch({headless:true,...(name==='chromium'&&process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
try{for(const habitat of ['terrestrial','freshwater','groundwater','estuary','intertidal','sandy-surf','shallow-marine','abyssal','petri-dish']){
 const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/habitat.mjs*',async route=>{const response=await route.fetch(),body=(await response.text()).replace('return {reset,stage,react,','if(canvas.id==="habitat")window.__clockTest=()=>({environment:elapsed,animal:animalElapsed,plant:seaweed?.time,phase:critters.reduce((s,a)=>s+a.phase,0)});return {reset,stage,react,');await route.fulfill({response,body})});
 await p.goto(base+'/isopoda/?habitat='+habitat);await p.locator('#startBtn').click();await p.locator('#settleBtn').click();
 for(const [button,speed] of [[null,1],['#speedFastBtn',16],['#speedTurboBtn',64],['#speedTurboBtn',1]]){
  if(button)await p.locator(button).click();const a=await p.evaluate(()=>window.__clockTest());await p.waitForTimeout(800);const b=await p.evaluate(()=>window.__clockTest()),environment=b.environment-a.environment,animal=b.animal-a.animal;
  assert.ok(environment>.3&&environment<1.3,habitat+' environment remains real time '+environment);
  assert.ok(Math.abs(animal/environment-speed)<.01,habitat+' animal multiplier '+speed);
  if(habitat==='shallow-marine')assert.ok(Math.abs(b.plant-a.plant-environment)<.001,'kelp follows environment time');
  assert.notEqual(a.phase,b.phase,habitat+' essential animal movement continues');
 }
 assert.deepEqual(errors,[]);console.log(name,habitat,'animal-only 1/16/64/1 clocks PASS');await p.close();
}}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
