const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8765';
const output=process.env.QA_OUTPUT;
const cases=[
 {id:'evening-memory',prefix:'你第一次把“A”写在一个个体旁边。它没有停下来等你写完。',period:2,kind:'text'},
 {id:'grooming-route',prefix:'一段路走到一半，它开始清理自己。到达并不是唯一的事情。',period:1,kind:'route'},
 {id:'root-touch',prefix:'两只从根的两边接近同一条窄缝。较小的一只先穿过去。',period:1,kind:'touch'}
];
async function click(page,selector){await page.locator(selector).first().click()}
async function assertProse(page,lang){
 const expected=await page.evaluate(async language=>{
  const {gameText}=await import('/isopoda/locales/game.mjs');
  const saved=JSON.parse(localStorage.getItem('isopoda-fugue-v4'));
  const source=saved.stage==='feedback'?saved.feedback:saved.scene.text;
  return {source,text:gameText(source,language)};
 },lang);
 await page.waitForFunction(text=>document.querySelector('#observation').textContent===text,expected.text);
 assert.equal(await page.locator('#observation').textContent(),expected.text);
 if(lang!=='zh')assert.notEqual(expected.text,expected.source);
 if(lang==='en')assert.doesNotMatch(expected.text,/[\u3400-\u9fff]/u);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
}
(async()=>{
 const engine=process.env.BROWSER==='webkit'?webkit:chromium;
 const browser=await engine.launch({headless:true});
 try{for(const width of [320,390,1440]){
  const context=await browser.newContext({viewport:{width,height:width===1440?900:844},reducedMotion:'reduce',locale:'zh-CN'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/isopoda/');
  await page.waitForFunction(()=>!!document.querySelector('#startBtn')?.onclick);
  for(const scenario of cases){
   await page.evaluate(async scenario=>{
    const {createRun,ensureScene,recordDirectInteraction}=await import('/isopoda/engine.mjs');
    let found;
    for(let seed=1;seed<5000&&!found;seed++)for(let day=1;day<=7&&!found;day++){
     const state=createRun('dairy',seed);state.day=day;state.period=scenario.period;
     if(scenario.id==='evening-memory')recordDirectInteraction(state,{type:'place',specimen:'F',point:{x:120,y:200}});
     const scene=ensureScene(state);
     if(scene.kind===scenario.kind&&scene.text.startsWith(scenario.prefix+' '))found=state;
    }
    if(!found)throw new Error('Missing screenshot scene: '+scenario.id);
    localStorage.setItem('isopoda-fugue-v4',JSON.stringify(found));
    localStorage.setItem('isopoda-ui-language-v1','zh');
   },scenario);
   await page.reload();await click(page,'#continueBtn');
   for(const lang of ['ja','en','isopod','zh','en']){
    await click(page,`[data-system-lang="${lang}"]`);await assertProse(page,lang);
    if(output&&['ja','en'].includes(lang)){
     fs.mkdirSync(output,{recursive:true});await page.screenshot({path:`${output}/${width}-${scenario.id}-${lang}.png`,fullPage:true});
    }
   }
   // Read a quiet choice, persist its result, switch languages and reopen the journal.
   await page.locator('#actions button').last().click();await assertProse(page,'en');
   await page.reload();await click(page,'#continueBtn');await assertProse(page,'en');
   await click(page,'#journalBtn');
   const feedback=await page.locator('.journal-paper p').last().textContent();assert.doesNotMatch(feedback,/[\u3400-\u9fff]/u);
   await click(page,'#closeDrawer');await click(page,'[data-system-lang="ja"]');await assertProse(page,'ja');
  }
  // A fresh observation reaches the ending and returns to a fresh entry card.
  await page.evaluate(()=>localStorage.clear());await page.reload();await click(page,'#startBtn');await click(page,'#settleBtn');
  await click(page,'[data-system-lang="en"]');
  for(let turn=0;turn<21;turn++){
   await assertProse(page,'en');await page.locator('#actions button').last().click();await assertProse(page,'en');await click(page,'#nextBtn');
  }
  await page.locator('#endCard').waitFor({state:'visible'});
  assert.doesNotMatch(await page.locator('#endingBody').textContent(),/[\u3400-\u9fff]/u);
  await click(page,'#restartBtn');await page.locator('#titleCard').waitFor({state:'visible'});
  await click(page,'#startBtn');await click(page,'#settleBtn');await assertProse(page,'en');
  assert.deepEqual(errors,[]);await context.close();
  console.log(`PASS ${width}px: screenshot scenes, four languages, feedback/reload/journal, seven days and restart`);
 }}finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
