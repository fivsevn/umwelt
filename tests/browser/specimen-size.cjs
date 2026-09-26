// BASE_URL=... CHROME_PATH=... BROWSER=webkit QA_OUTPUT=... node tests/browser/specimen-size.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require('playwright');
(async()=>{
 const engine=process.env.BROWSER==='webkit'?webkit:chromium;
 const browser=await engine.launch({headless:true,...(process.env.CHROME_PATH&&engine===chromium?{executablePath:process.env.CHROME_PATH}:{})});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.BASE_URL||'http://127.0.0.1:8765')+'/isopoda/');
  for(const width of [320,390,1440]){
   await page.setViewportSize({width,height:900});
   const result=await page.evaluate(async()=>{
    const {SPECIES}=await import('./species-registry.mjs'),{renderCatalog,specimenSizePresentation}=await import('./catalog.mjs'),{setLanguage}=await import('./i18n.mjs');
    const errors=[],audit=[];const drawer=document.querySelector('#drawer');drawer.showModal();
    for(const lang of ['zh','en','ja','isopod']){
     setLanguage(lang,{announce:false});
     for(const p of SPECIES){
      const card=renderCatalog(p,{collectedOn:'2026-09-26'});document.querySelector('#drawerContent').replaceChildren(card);
      const size=specimenSizePresentation(p),scale=card.querySelector('.specimen-scale'),note=card.querySelector('.specimen-size-note'),tag=card.querySelector('.specimen-tag');
      if(!scale||!!note!==size.oversized)errors.push(`${lang}/${p.id}: missing scale/note`);
      if(size.mm&&!(size.barPx>0&&Number.isFinite(size.barPx)))errors.push(`${p.id}: invalid bar`);
      if(note){const a=note.getBoundingClientRect(),b=tag.getBoundingClientRect();if(a.right>b.left&&a.bottom>b.top&&a.top<b.bottom)errors.push(`${lang}/${p.id}: paper overlaps tag`)}
      const locked=renderCatalog(p,{unlocked:false});if(locked.querySelector('.specimen-scale,.specimen-size-note'))errors.push(`${p.id}: locked size leak`);
      if(lang==='zh')audit.push({id:p.id,mm:size.mm,oversized:size.oversized});
     }
    }
    setLanguage('zh',{announce:false});document.querySelector('#drawerContent').replaceChildren(renderCatalog(SPECIES.find(p=>p.id==='magnificus')));
    return {errors,audit};
   });
   assert.deepEqual(result.errors,[]);console.log(`PASS ${engine.name()} ${width}: ${result.audit.length} specimens × 4 languages, labels, notes, locked cards`);
   if(process.env.QA_OUTPUT){fs.mkdirSync(process.env.QA_OUTPUT,{recursive:true});fs.writeFileSync(process.env.QA_OUTPUT+'/size-audit.json',JSON.stringify(result.audit,null,2));await page.screenshot({path:`${process.env.QA_OUTPUT}/specimen-${engine.name()}-${width}.png`})}
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
