const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:8773';
const engine = process.env.BROWSER || 'chromium';
const gameUrl = base + '/rooftop/?weather=clear&time=day&month=10&festival=none';
(async () => {
  const browser = await (engine === 'webkit' ? webkit : chromium).launch({headless:true,...(engine === "chromium" ? {args:["--use-angle=swiftshader","--enable-unsafe-swiftshader"]} : {}),...(engine === 'chromium' && !process.env.CI ? {channel:'chrome'} : {})});
  try {
    for (const width of [1440,390]) for (const reducedMotion of ['no-preference','reduce']) {
      const page = await browser.newPage({viewport:{width,height:900},reducedMotion});
      const errors=[];
      page.on('pageerror', e => errors.push(e.message));
      await page.addInitScript(() => {
        Math.random = () => .99;
        window.requestAnimationFrame = () => 1;
      });
      await page.goto(gameUrl);
      await page.waitForFunction(() => window.rooftop?.graphics?.background?.loaded && rooftop.graphics.nativeItems.pending === 0, null, {timeout:90000,polling:100});
      assert.equal(await page.locator('#sceneCard').isVisible(), true, 'permanent balcony navigation remains available');
      assert.equal(await page.locator('#notebookOpen').isVisible(), true, 'the empty terrace retains its complete notebook entry');
      await page.evaluate(async () => {
        // Animation is frozen above, so seed the action text normally supplied
        // by the story frame. Empty transparent text has no visible box.
        document.querySelector('#actionStatus').textContent = '东东在天台上走动。';
        const {attachCardFeed} = await import('/rooftop/card-feed.mjs');
        const {makeResident} = await import('/rooftop/resident.mjs');
        window.feedPhase='day';
        window.feedResident=makeResident(() => .99,{phase:()=>feedPhase});
        window.feedScene='north';
        window.feed=attachCardFeed(document.querySelector('.corner-cards'),{scene:()=>feedScene,presence:()=>feedResident});
        window.updateFeed=(time)=>feed.update(time);
      });
      const update = async time => {await page.evaluate(time=>updateFeed(time),time);await page.waitForTimeout(550)};
      // Scene/journal entries are permanent cards; event chronology concerns
      // only the existing feed that is revealed and reordered over time.
      const ids = () => page.locator('.corner-cards > :visible:not(#sceneCard):not(#notebookOpen)').evaluateAll(es=>es.map(e=>e.id));
      await update(.4); assert.deepEqual(await ids(),['weatherCard']);
      await update(1.2); assert.deepEqual(await ids(),['dongdongStatus','actionCard','weatherCard']);
      await update(5); assert.deepEqual(await ids(),['musicToggle','dongdongStatus','actionCard','weatherCard']);
      await update(12); assert.deepEqual(await ids(),['returnWorld','musicToggle','dongdongStatus','actionCard','weatherCard']);
      // No changes on ordinary frames: cards and arrival animations remain stable.
      await page.evaluate(()=>{document.querySelector('#musicToggle').classList.remove('feed-enter');updateFeed(13)});
      assert.equal(await page.locator('#musicToggle').evaluate(e=>e.classList.contains('feed-enter')),false);
      await page.evaluate(()=>{feedResident.update(120);updateFeed(120)});
      await page.waitForTimeout(550);
      assert.deepEqual(await ids(),['dongdongStatus','returnWorld','musicToggle','actionCard','weatherCard']);
      assert.equal(await page.locator('#dongdongStatus').innerText(),'东东回来了。');
      assert.equal(await page.locator('#dongdongStatus').evaluate(e=>e.classList.contains('feed-enter')),true);
      await update(120.9); assert.equal((await ids())[0],'garageCard');
      await update(122.1); assert.equal((await ids())[0],'roomCard');
      await update(128); assert.equal(await page.locator('#dongdongStatus').isVisible(),false);
      await page.locator('#musicToggle').click();
      await page.waitForFunction(()=>document.querySelector('#musicToggle').getAttribute('aria-pressed')==='true');
      await update(129); assert.equal((await ids())[0],'musicToggle');
      await page.evaluate(()=>{document.querySelector('#weatherStatus').textContent='雨点落在盆沿和地面。';updateFeed(130)});
      await page.waitForTimeout(550); assert.equal((await ids())[0],'weatherCard');
      await page.evaluate(()=>{feedResident.update(270);updateFeed(400)});
      await page.waitForTimeout(550);
      assert.deepEqual(await ids(),['dongdongStatus','weatherCard','musicToggle','returnWorld','actionCard']);
      assert.notEqual(await page.locator('#dongdongStatus').innerText(),'东东回来了。');
      assert.equal(await page.locator('#garageCard').isVisible(),false);
      assert.equal(await page.locator('#roomCard').isVisible(),false);
      await page.locator('#sceneCard').click();
      await page.evaluate(()=>{feedScene=rooftop.scene;updateFeed(401)});
      assert.equal(await page.locator('#returnWorld').isVisible(),false);
      await page.locator('#sceneCard').click();
      await page.evaluate(()=>{feedScene=rooftop.scene;updateFeed(402)});
      await page.waitForTimeout(550); assert.equal((await ids())[0],'returnWorld');
      const oldErrand=await page.locator('#dongdongStatus').innerText();
      await page.evaluate(()=>{feedPhase='dawn';feedResident.update(0);updateFeed(403)});
      await page.waitForTimeout(550);
      assert.equal((await ids())[0],'dongdongStatus');
      assert.notEqual(await page.locator('#dongdongStatus').innerText(),oldErrand);
      // Model loading can delay the first painted animation frame. Await the
      // actual finite entrance animations before measuring the settled stack.
      await page.locator('.corner-cards').evaluate(async root=>{
        await Promise.all(root.getAnimations({subtree:true}).map(animation=>animation.finished));
      });
      const boxes=await page.locator('.corner-cards > :visible').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));
      assert.ok(boxes.every((r,i)=>r.x>=0 && r.right<=width && (!i || r.y>=boxes[i-1].bottom)), 'visible cards stack without overlap');
      if(process.env.QA_OUTPUT) await page.screenshot({path:`${process.env.QA_OUTPUT}/card-feed-${engine}-${width}-${reducedMotion}.png`});
      // Returning cards carry the correct destination and remain usable.
      await page.evaluate(()=>{feedResident.update(120);updateFeed(522);updateFeed(525)});
      await page.locator('#garageCard').click();
      await page.waitForURL('**/arrange/?scene=north');
      await page.waitForFunction(() => window.rooftop?.graphics?.background?.loaded && rooftop.graphics.nativeItems.pending === 0, null, {timeout:90000,polling:100});
      await page.goto(gameUrl);
      await page.waitForFunction(() => window.rooftop?.graphics?.background?.loaded && rooftop.graphics.nativeItems.pending === 0, null, {timeout:90000,polling:100});
      await page.evaluate(async()=>{
        document.querySelector('#actionStatus').textContent = '东东在天台上走动。';
        const {attachCardFeed}=await import('/rooftop/card-feed.mjs');
        const fresh=attachCardFeed(document.querySelector('.corner-cards'),{scene:()=> 'north',presence:()=>({present:true,status:''})});
        fresh.update(12);
      });
      await page.waitForTimeout(550);
      assert.deepEqual(await ids(),['roomCard','returnWorld','musicToggle','garageCard','actionCard','weatherCard']);
      assert.deepEqual(errors,[]);
      await page.close();
    }
    console.log(engine+' card chronology, return/departure, content updates, scene navigation and reduced motion PASS');
  } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
