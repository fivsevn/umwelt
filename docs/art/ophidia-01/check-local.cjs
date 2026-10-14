// Local review only. Uses the shared runtime; does not publish anything.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const output=process.env.QA_OUTPUT||path.join(require('node:os').tmpdir(),'ophidia-review','ui');fs.mkdirSync(output,{recursive:true});
const base=process.env.BASE_URL||'http://127.0.0.1:8788';
const layouts=process.argv.includes('--portrait-only')?[['desktop',1440,900],['mobile',390,844]]:[['desktop',1440,900],['mobile',390,844],['small',320,568],['landscape',844,390]];

(async()=>{
 const report=[];
 for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true,...(engineName==='chromium'?{channel:'chrome'}:{})});
  try {
   for(const [label,width,height] of layouts){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,hasTouch:label!=='desktop',isMobile:label!=='desktop'});
    const errors=[],bad=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)bad.push(r.url())});
    await page.goto(base+'/ophidia/');
    await page.locator('#startButton').waitFor({state:'visible'});
    await page.waitForFunction(()=>!document.querySelector('#startButton').disabled);
    await page.evaluate(()=>document.fonts.ready);
    const layout=await page.evaluate(()=>{
     const r=document.querySelector('#viewport').getBoundingClientRect();
     return {width:r.width,height:r.height,scrollX:document.documentElement.scrollWidth>innerWidth,scrollY:document.documentElement.scrollHeight>innerHeight+1,images:[...document.images].map(i=>({url:i.currentSrc,w:i.naturalWidth,h:i.naturalHeight}))};
    });
    assert.ok(Math.abs(layout.width/layout.height-9/16)<.003);
    assert.equal(layout.scrollX,false);assert.equal(layout.scrollY,false);
    assert.ok(layout.images.every(i=>i.w===360&&i.h===640));
    await page.screenshot({path:path.join(output,`${engineName}-${label}-title.png`)});
    await page.click('#startButton');
    await page.click('#continueButton'); // Reveal the first line.
    await page.screenshot({path:path.join(output,`${engineName}-${label}-dialogue.png`)});
    const initialLine=await page.locator('#dialogueText').innerText();
    await page.click('#settingsToggle');
    assert.ok(await page.locator('#settingsMenu').isVisible());
    assert.equal(await page.locator('#settingsToggle').getAttribute('aria-expanded'),'true');
    await page.keyboard.press('ArrowRight');await page.keyboard.press('1');
    assert.equal(await page.locator('#dialogueText').innerText(),initialLine);
    for(const [lang,title] of [['ja','THERMOREGULATION / 体温調節'],['en','THERMOREGULATION'],['zh','THERMOREGULATION / 体温调节']]){
     await page.click(`[data-language="${lang}"]`);assert.equal(await page.title(),title);
    }
    const menu=await page.locator('#settingsMenu').boundingBox();
    assert.ok(menu.x>=0&&menu.y>=0&&menu.x+menu.width<=width&&menu.y+menu.height<=height);
    await page.screenshot({path:path.join(output,`${engineName}-${label}-settings.png`)});
    await page.keyboard.press('Escape');assert.ok(!await page.locator('#settingsMenu').isVisible());
    assert.equal(await page.evaluate(()=>document.activeElement.id),'settingsToggle');
    await page.click('#settingsToggle');
    await page.locator('#viewport').click({position:{x:4,y:4}});
    assert.ok(!await page.locator('#settingsMenu').isVisible());
    assert.equal(await page.locator('#dialogueText').innerText(),initialLine);
    let choiceCount=0,steps=0;const posesSeen=new Set();
    while(await page.locator('#game').getAttribute('data-state')!=='ending'&&steps++<150){
     await page.waitForFunction(()=>{const image=document.querySelector('#snakeImage');return image.complete&&image.naturalWidth===360&&image.naturalHeight===640});
     const character=await page.locator('#snakeImage').evaluate(image=>({pose:image.currentSrc.match(/snake-(normal|curious|away|tongue)\.webp/)?.[1],filter:getComputedStyle(image).filter,rendering:getComputedStyle(image).imageRendering,width:image.getBoundingClientRect().width,height:image.getBoundingClientRect().height}));
     assert.ok(character.pose);assert.equal(character.filter,'none');
     assert.ok(['pixelated','crisp-edges'].includes(character.rendering));
     if(!posesSeen.has(character.pose)&&engineName==='chromium'&&['desktop','mobile'].includes(label))await page.screenshot({path:path.join(output,`${engineName}-${label}-pose-${character.pose}.png`)});
     posesSeen.add(character.pose);
     if(await page.locator('#choices').isVisible()){
      if(choiceCount===0){
       await page.locator('#dialogueText').dblclick();
       const textBox=await page.locator('#dialogueText').boundingBox();
       await page.mouse.move(textBox.x+4,textBox.y+6);await page.mouse.down();
       await page.mouse.move(textBox.x+textBox.width-4,textBox.y+textBox.height-6,{steps:5});await page.mouse.up();
       assert.equal(await page.evaluate(()=>window.getSelection().toString()),'');
      }
      await page.screenshot({path:path.join(output,`${engineName}-${label}-choice-${choiceCount+1}.png`)});
      const boxes=await page.locator('.choice-button').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {top:r.top,bottom:r.bottom,right:r.right}}));
      assert.ok(boxes.every(b=>b.top>=0&&b.bottom<=height&&b.right<=width));
      await page.locator('.choice-button').nth(choiceCount%2).click();choiceCount++;
     }else await page.locator('#continueButton').click();
    }
    assert.equal(choiceCount,3);assert.ok(steps<150);assert.deepEqual([...posesSeen].sort(),['away','curious','normal','tongue']);
    await page.screenshot({path:path.join(output,`${engineName}-${label}-ending.png`)});
    await page.click('#settingsToggle');
    await page.click('#restartButton');assert.ok(await page.locator('#launchPanel').isVisible());
    assert.ok(!await page.locator('#settingsMenu').isVisible());
    const motion=[];
    for(const preference of ['reduce','no-preference','reduce']){
     await page.emulateMedia({reducedMotion:preference});
     const before=await page.locator('.scenery').evaluate(n=>({name:getComputedStyle(n).animationName,transform:getComputedStyle(n).transform}));
     assert.notEqual(before.name,'none');await page.waitForTimeout(700);
     const after=await page.locator('.scenery').evaluate(n=>getComputedStyle(n).transform);
     assert.notEqual(before.transform,after);motion.push({preference,name:before.name,moving:true});
    }
    await page.click('#settingsToggle');
    await page.click('#homeLink');await page.waitForURL(base+'/');
    assert.equal(await page.locator('.desktop-icon').count(),4);
    const tile=await page.locator('.ophidia-picture').evaluate(n=>getComputedStyle(n).backgroundColor);
    assert.equal(tile,'rgb(154, 112, 84)');
    if(engineName==='chromium'&&label==='desktop')await page.screenshot({path:path.join(output,'desktop-warm-icon.png')});
    assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
    report.push({engine:engineName,label,width,height,choiceCount,posesSeen:[...posesSeen].sort(),characterCssBlur:false,settings:{languages:true,restart:true,home:true,escape:true,outsideClickNoAdvance:true,menuFits:true},textSelectionDisabled:true,motion,warmTile:tile,errors,bad,layout});
    await page.close();
   }
  } finally {await browser.close()}
 }
 fs.writeFileSync(path.join(output,'local-check.json'),JSON.stringify(report,null,2)+'\n');
 console.log(`Passed: ${report.length} browser/layout combinations; four poses, full story, 3 choices; compact settings, selection disabled, live reduced-motion movement, warm home icon; no scroll or resource errors.`);
})().catch(e=>{console.error(e);process.exit(1)});
