const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium,webkit}=require('playwright');
const engine=process.env.BROWSER||'chromium', base=process.env.BASE_URL||'http://127.0.0.1:8773', out=process.env.QA_OUTPUT||'/tmp';
fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await (engine==='webkit'?webkit:chromium).launch({headless:true,...(engine==='chromium'?{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}: {})});
try{const p=await b.newPage({viewport:{width:1440,height:1050}}),errors=[],assets=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());if(/\.(png|gif|jpe?g|webp)(\?|$)/i.test(r.url()))assets.push(r.url())});p.setDefaultTimeout(120000);
await p.goto(base+'/rooftop/arrange/');await p.waitForFunction(()=>window.rooftop?.graphics?.atmosphere);
await p.locator('#weatherSelect').selectOption('clear');await p.locator('#timeSelect').selectOption('day');await p.waitForFunction(()=>rooftop.weather.transition.mix>.999);
// Manual garage controls must settle promptly, including a change interrupted
// by another season/time/weather selection. Layout geometry stays cached.
await p.locator('#weatherSelect').focus();
await p.evaluate(()=>{
window.switchStart=performance.now();
for(const [id,value] of [['weatherSelect','heavy'],['seasonSelect','winter'],['timeSelect','late'],['seasonSelect','spring'],['weatherSelect','clear'],['timeSelect','day']]) {
  const select=document.getElementById(id);select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));
}
});
await p.waitForFunction(()=>rooftop.weather.transition.duration===.65&&rooftop.weather.transition.mix===1,{},{timeout:3000});
assert.ok(await p.evaluate(()=>performance.now()-switchStart<3000), 'rapid manual switches must finish promptly');
assert.equal(await p.evaluate(()=>rooftop.weather.transition.duration),.65);
await p.locator('#search').focus();
await p.waitForFunction(()=>document.querySelector('.asset-card canvas[data-renderer="3d"]'));
const preview=await p.locator('.asset-card canvas[data-renderer="3d"]').first().evaluate(c=>{
  const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
  let opaque=0,colour=0; for(let i=0;i<pixels.length;i+=4) if(pixels[i+3]) {opaque++;colour+=pixels[i]+pixels[i+1]+pixels[i+2];}
  return {opaque,colour};
});
assert.ok(preview.opaque>20&&preview.colour>100, 'asynchronous preview contains a visible coloured object');
const original=await p.evaluate(()=>({layout:rooftop.layout,builds:rooftop.graphics.modelBuilds,textures:rooftop.graphics.textures,draws:rooftop.graphics.drawCalls}));
for(const season of ['spring','summer','autumn','winter']){await p.locator('#seasonSelect').selectOption(season);await p.waitForFunction(s=>rooftop.weather['season'+s]>.999&&rooftop.graphics.atmosphere.seasonal.effects.some(e=>e.season===s&&e.strength>.1),season);const a=await p.evaluate(()=>rooftop.graphics.atmosphere.seasonal);await p.waitForFunction(sample=>JSON.stringify(rooftop.graphics.atmosphere.seasonal.sample)!==sample,JSON.stringify(a.sample));assert.ok(a.count<=184);assert.equal(await p.evaluate(()=>rooftop.graphics.modelBuilds),original.builds);assert.equal(await p.evaluate(()=>rooftop.graphics.textures),original.textures);await p.screenshot({path:`${out}/${engine}-${season}.png`,fullPage:true});}
await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>rooftop.weather.reduced);let sample=await p.evaluate(()=>JSON.stringify(rooftop.graphics.atmosphere.seasonal.sample));await p.waitForFunction(s=>JSON.stringify(rooftop.graphics.atmosphere.seasonal.sample)!==s,sample);
await p.setViewportSize({width:390,height:844});await p.locator('[data-scene=south]').click();await p.waitForFunction(()=>rooftop.graphics.scene==='south'&&rooftop.graphics.atmosphere.seasonal.count>0);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:`${out}/${engine}-south-mobile.png`,fullPage:true});
await p.locator('[data-scene=room]').click();await p.waitForFunction(()=>rooftop.graphics.scene==='room'&&rooftop.graphics.atmosphere.seasonal.count===0);await p.screenshot({path:`${out}/${engine}-room-mobile.png`,fullPage:true});
await p.reload();await p.waitForFunction(()=>window.rooftop);assert.equal(await p.locator('#seasonSelect').inputValue(),'winter');assert.deepEqual(await p.evaluate(()=>rooftop.layout),original.layout);assert.deepEqual(errors,[]);
assert.ok(assets.length>0,'the native Pixelorama book is loaded');assert.ok(assets.every(url=>new URL(url).pathname==='/rooftop/assets/pixel/material-book.png'),'only the shared native book is requested');assert.equal(await p.evaluate(()=>rooftop.graphics.textures),1);
console.log(JSON.stringify({engine,passed:true,checks:'rapid garage controls, asynchronous coloured catalogue previews, 4 seasonal transitions, moving particle coordinates, stable model builds/textures/layout, live reduced motion, south mobile, indoor isolation, reload, one shared native Pixelorama book',baseline:{builds:original.builds,textures:original.textures,draws:original.draws}}));
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
