const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:8773';
const engine = process.env.BROWSER || 'chromium';
const gameUrl = base + '/rooftop/?weather=clear&time=day&month=10&festival=none';
(async () => {
  const browser = await (engine === 'webkit' ? webkit : chromium).launch({headless:true,...(engine === 'chromium' ? {args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']} : {}),...(engine === 'chromium' && !process.env.CI ? {channel:'chrome'} : {})});
  try {
    for (const width of [1440,390]) for (const reducedMotion of ['no-preference','reduce']) {
      const page = await browser.newPage({viewport:{width,height:900},reducedMotion});
      const errors=[];
      page.on('pageerror', e => errors.push(e.message));
      await page.addInitScript(() => { Math.random=()=>.99;window.requestAnimationFrame=()=>1; });
      await page.goto(gameUrl);
      await page.waitForFunction(() => window.rooftop?.graphics?.background?.loaded && rooftop.graphics.nativeItems.pending === 0, null, {timeout:90000,polling:100});
      await page.evaluate(async () => {
        // Freeze the story above, then drive its real DOM adapter with a wall
        // clock. No animation-frame duration is used as an event timestamp.
        document.querySelector('#statusLog').replaceChildren();
        document.querySelector('#weatherStatus').textContent='风从楼群之间吹过。';
        document.querySelector('#actionStatus').textContent='东东在浇水，小猪趴在门边。';
        window.feedNow=Date.parse('2026-10-16T02:00:00Z');
        window.feedResident={present:true,status:''};window.feedScene='north';
        const {attachCardFeed}=await import('/rooftop/card-feed.mjs');
        window.feed=attachCardFeed(document.querySelector('.corner-cards'),{scene:()=>feedScene,presence:()=>feedResident,now:()=>feedNow});
        window.updateFeed=ms=>{feedNow+=ms;feed.update(0);};
      });
      const update = ms => page.evaluate(ms=>updateFeed(ms),ms);
      const entries = () => page.locator('#statusLog .status-entry').evaluateAll(rows=>rows.map(row=>({
        id:row.dataset.eventId,kind:row.dataset.statusKind,text:row.querySelector('.status-text').textContent,
        time:row.querySelector('time').textContent,datetime:row.querySelector('time').dateTime,
      })));
      const links = () => page.locator('.status-actions > *').evaluateAll(es=>es.map(e=>e.id));
      const linkOrder=['sceneCard','notebookOpen','musicToggle','returnWorld','roomCard','garageCard'];
      await update(799);assert.equal((await entries()).length,0);
      await update(1);let initial=await entries();
      assert.deepEqual(initial.map(e=>e.kind),['weather','activity']);
      assert.ok(initial.every(e=>e.time==='10:00:00' && e.datetime==='2026-10-16T02:00:00.000Z'));
      assert.deepEqual(await links(),linkOrder);
      const geometry=()=>page.locator('.status-actions > *').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));
      const positions=await geometry();
      await page.evaluate(()=>{
        window.firstStatusNode=document.querySelector('#statusLog').firstElementChild;
        document.querySelector('#roomCard').href='./room/?scene=north&weather=rain';
        updateFeed(5000);
      });
      assert.deepEqual(await entries(),initial,'ordinary frames and link changes do not create events or change timestamps');
      assert.equal(await page.evaluate(()=>firstStatusNode===document.querySelector('#statusLog').firstElementChild),true);
      await page.evaluate(()=>{document.querySelector('#actionStatus').textContent='短暂走动。';updateFeed(100)});
      await page.evaluate(()=>{document.querySelector('#actionStatus').textContent='东东在浇水，小猪趴在门边。';updateFeed(100)});
      await update(800);assert.deepEqual(await entries(),initial,'transient states do not enter history');
      await page.evaluate(()=>{feed.notifyObserver('bird');feedNow+=1000;feed.notifyObserver('drone')});
      assert.equal((await entries()).length,4);
      const observed=await entries();
      await page.evaluate(()=>{feedNow+=100;feed.notifyObserver('bird');feed.notifyObserver('drone');feed.notifyObserver('neighbor')});
      assert.deepEqual(await entries(),observed,'repeated view switches are coalesced');
      assert.deepEqual(await geometry(),positions,'a full log does not shift the fixed action grid');
      await page.evaluate(()=>{
        feedResident.present=false;feedResident.status='东东去买花盆了。';
        document.querySelector('#actionStatus').textContent='东东出门了，小猪趴在门边。';updateFeed(1000);
      });
      await update(800);
      assert.deepEqual((await entries()).slice(-2).map(e=>e.text),['东东去买花盆了。','小猪趴在门边。']);
      assert.equal(await page.locator('#garageCard').isVisible(),false);
      assert.equal(await page.locator('#roomCard').isVisible(),false);
      await page.evaluate(()=>{feedResident.present=true;document.querySelector('#actionStatus').textContent='东东在修剪，小猪趴在门边。';updateFeed(1000)});
      assert.equal((await entries()).at(-1).text,'东东回来了。');
      assert.equal(await page.locator('#roomCard').isVisible(),true);
      await update(800);
      const notebookX=await page.locator('#notebookOpen').evaluate(e=>e.getBoundingClientRect().x);
      await page.locator('#musicToggle').click();
      await page.waitForFunction(()=>document.querySelector('#musicToggle').getAttribute('aria-pressed')==='true',null,{polling:100});
      await update(1000);assert.equal((await entries()).at(-1).text,'隔壁的音乐响起来了。');
      assert.equal(await page.locator('#notebookOpen').evaluate(e=>e.getBoundingClientRect().x),notebookX,'music label length does not shift the other actions');
      await page.locator('#musicToggle').click();
      await page.waitForFunction(()=>document.querySelector('#musicToggle').getAttribute('aria-pressed')==='false',null,{polling:100});
      await update(1000);
      assert.equal((await entries()).at(-1).text,'窗户关上了，音乐轻下去。');
      await page.locator('#sceneCard').click();
      await page.evaluate(()=>{feedScene=rooftop.scene;updateFeed(1000)});
      assert.equal((await entries()).at(-1).text,'来到南阳台。');
      assert.equal(await page.locator('#returnWorld').isVisible(),false);
      await page.locator('#sceneCard').click();
      await page.evaluate(()=>{feedScene=rooftop.scene;updateFeed(1000)});
      assert.equal((await entries()).at(-1).text,'来到北天台。');
      assert.equal(await page.locator('#returnWorld').isVisible(),true);
      assert.deepEqual(await links(),linkOrder);
      // A preference switch must retain the next essential reveal.
      await page.emulateMedia({reducedMotion:reducedMotion==='reduce'?'no-preference':'reduce'});
      await page.evaluate(()=>{feedNow+=31000;feed.notifyObserver('bird')});
      assert.equal((await entries()).filter(e=>e.kind==='observer').length,1);
      const animation=await page.locator('.status-latest').evaluate(e=>getComputedStyle(e).animationName);
      assert.equal(animation,reducedMotion==='reduce'?'feed-enter':'card-reveal');
      await page.locator('.corner-cards').evaluate(async root=>{
        await Promise.all(root.getAnimations({subtree:true}).map(animation=>animation.finished));
      });
      const rows=await page.locator('#statusLog .status-entry').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));
      assert.equal(rows.length,4);
      assert.ok(rows.every((r,i)=>r.x>=0 && r.right<=width && (!i || r.y>=rows[i-1].bottom)), 'events stay ordered and fit the viewport');
      assert.ok(rows.at(-1).bottom <= (await geometry())[0].y,'events remain above actions');
      assert.equal(await page.locator('#statusLog').getAttribute('role'),'log');
      if(process.env.QA_OUTPUT) await page.screenshot({path:`${process.env.QA_OUTPUT}/card-feed-${engine}-${width}-${reducedMotion}.png`});
      await page.locator('#garageCard').click();
      await page.waitForURL('**/arrange/?scene=north');
      await page.waitForFunction(() => window.rooftop?.graphics?.background?.loaded, null, {timeout:90000,polling:100});
      assert.deepEqual(errors,[]);
      await page.close();
    }
    console.log(engine+' timestamped status log, deduplication, presence, fixed actions and motion preference switch PASS');
  } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
