const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {chromium,webkit}=require('playwright');
const base=(process.env.BASE_URL||'http://127.0.0.1:8797').replace(/\/$/,'');
const name=process.env.BROWSER||'chromium';
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<.06,`${message}: ${a} / ${b}`);
// Borders snap to physical pixels; allow one pixel only when checking that snap.
const nearBorder=(actual,ideal,dpr,message)=>assert.ok(Math.abs(actual-ideal)*dpr<=1,`${message}: ${actual} / ${ideal}`);
(async()=>{
 const browser=await {chromium,webkit}[name].launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:1000}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))errors.push(`${r.status()} ${r.url()}`);});
  await page.goto(base+'/gsm/');await page.evaluate(()=>document.fonts.ready);
  assert.ok(await page.locator('.post').count()>0);
  assert.equal(await page.locator('#mainNav a').count(),3);
  assert.equal(await page.locator('#mainNav').innerText(),'');
  assert.equal(await page.locator('#mainNav .dock-icon').count(),3);
  for(const glyph of await page.locator('#mainNav .dock-icon').all())assert.ok(await glyph.locator('path').count()>0,'each navigation icon paints real pixels');
  assert.equal(await page.locator('dialog,form,textarea,input,[data-follow],[data-action]').count(),0);
  for(const identity of await page.locator('.author-name').all()){
   assert.equal(await identity.locator('.author-label').count(),1);
   assert.equal(await identity.locator('.author-handle').count(),1);
   const label=await identity.locator('.author-label').textContent(),handle=await identity.locator('.author-handle').textContent();
   assert.match(handle,/^@[a-z0-9]+$/);
   assert.equal(await identity.textContent(),label+handle,'name and account retain their complete text');
  }
  assert.equal(await page.locator('.author-name').first().evaluate(e=>getComputedStyle(e).fontWeight),'400');
  assert.match(await page.locator('.brand-icon img').getAttribute('src'),/assets\/icon\.svg(?:\?|$)/);
  const terminalURL=await page.locator('.brand-icon img').evaluate(e=>e.src);
  assert.equal(terminalURL,await page.locator('link[rel=icon]').evaluate(e=>e.href),'header and favicon share the terminal symbol');
  for(const portrait of await page.locator('.avatar img').all()){assert.match(await portrait.getAttribute('src'),/\.webp(?:\?|$)/);assert.ok(await portrait.evaluate(e=>e.complete&&e.naturalWidth>0));}
  for(const post of await page.locator('.post').all()){
   assert.equal(await post.locator('.avatar').count(),1);
   assert.equal(await post.locator('button').count(),1);
   assert.equal(await post.locator('button[data-like] .ui-icon.pixel-heart').count(),1);
   assert.equal(await post.locator('button[data-like] path.heart-core').count(),1);
   const card=await post.locator('.bubble').boundingBox(),heart=await post.locator('button').boundingBox();
   assert.ok(heart.y+heart.height<=card.y+card.height,'likes live inside the card');
  }
  const first=page.locator('[data-like]').first();
  const initialLikes=Number(await first.locator('.like-count').innerText());
  await first.click();assert.equal(await first.getAttribute('aria-pressed'),'true');
  assert.equal(await first.locator('.like-count').innerText(),String(initialLikes+1));
  await page.reload();assert.equal(await first.getAttribute('aria-pressed'),'true');
  await first.focus();await page.keyboard.press('Enter');assert.equal(await first.getAttribute('aria-pressed'),'false');
  assert.equal(await first.locator('.like-count').innerText(),String(initialLikes));
  // SVG/path click targets must reach the same delegated handler as the button.
  await first.locator('svg').click();assert.equal(await first.getAttribute('aria-pressed'),'true');
  assert.equal(await first.locator('.like-count').innerText(),String(initialLikes+1));
  assert.equal(await first.locator('.heart-core').evaluate(e=>getComputedStyle(e).opacity),'1');
  assert.equal(await first.locator('..').locator('.like-burst>span').count(),4);
  await page.waitForFunction(()=>document.querySelector('.like-burst')===null,null,{timeout:1500});
  await first.locator('path.heart-core').dispatchEvent('click');
  assert.equal(await first.getAttribute('aria-pressed'),'false');
  assert.equal(await first.locator('.like-count').innerText(),String(initialLikes));
  for(const [lang,title] of [['zh-CN','Gstream / 爬爬在线'],['en','Gstream'],['ja','Gstream / ジー投稿']]){
   assert.equal(await page.locator('html').getAttribute('lang'),lang);assert.equal(await page.title(),title);
   for(const [width,height] of [[320,568],[390,844],[430,932],[768,1024],[1280,800],[1920,1080],[844,390]]){
    // A resize can place the previous pointer coordinates on a lifted avatar.
    await page.mouse.move(0,0);
    await page.setViewportSize({width,height});await page.evaluate(()=>document.fonts.ready);
    await page.locator('#streamButton').click();
    await page.mouse.move(0,0);
    await page.waitForFunction(()=>!document.querySelector('.post:hover')&&[...document.querySelectorAll('.avatar')].every(e=>getComputedStyle(e).transform==='none'));
    const metrics=await page.evaluate(()=>{
     const r=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom}};
     const borders=e=>{const s=getComputedStyle(e);return {left:parseFloat(s.borderLeftWidth),right:parseFloat(s.borderRightWidth),bottom:parseFloat(s.borderBottomWidth)}};
     const main=document.querySelector('#timeline');
     return {unit:parseFloat(getComputedStyle(document.documentElement).fontSize),dpr:devicePixelRatio,frameBorders:borders(document.querySelector('.app-window')),headerBorder:borders(document.querySelector('.app-header')).bottom,shell:r(document.querySelector('.app-window')),header:r(document.querySelector('.app-header')),brand:r(document.querySelector('.brand-icon')),dock:r(document.querySelector('#mainNav')),main:r(main),scrollbar:getComputedStyle(main).scrollbarWidth,
      overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,
      posts:[...document.querySelectorAll('.post')].map(e=>({card:r(e.querySelector('.bubble')),borders:borders(e.querySelector('.bubble')),avatar:r(e.querySelector('.avatar')),portrait:r(e.querySelector('.avatar img')),heart:r(e.querySelector('.ui-icon')),count:r(e.querySelector('.like-count')),author:r(e.querySelector('.author-name')),handleSize:parseFloat(getComputedStyle(e.querySelector('.author-handle')).fontSize),time:r(e.querySelector('.post-time')),fits:[...e.querySelectorAll('.post-text,.author-name,.author-label,.author-handle')].every(t=>t.scrollWidth<=t.clientWidth||getComputedStyle(t).display==='inline')}))};
    });
    const {unit:u,dpr,frameBorders,headerBorder,shell,header,brand,dock,main,posts}=metrics;
    nearBorder(frameBorders.left,u,dpr,'one-unit left frame border');nearBorder(frameBorders.right,u,dpr,'one-unit right frame border');nearBorder(headerBorder,2*u,dpr,'two-unit header border');
    const leftSnap=frameBorders.left-u,rightSnap=frameBorders.right-u,headerSnap=headerBorder-2*u;
    assert.equal(metrics.overflow,false,`${lang} ${width}: page overflow`);
    near(shell.w/u,390,'same phone composition');near(shell.x,(width-shell.w)/2,'centred shell');
    near(header.y,0,'header at top');near(dock.bottom,height,'dock at bottom');near(header.h,69*u+headerSnap,'header ratio with snapped border');near(dock.h/u,52,'dock ratio');
    near(main.y,header.bottom,'middle below header');near(main.bottom,dock.y,'middle above dock');
    near(brand.w/u,72,'square terminal width');near(brand.h/u,72,'square terminal height');
    near(brand.x-shell.x,13*u+leftSnap,'terminal left inset');near(brand.y/u,25,'terminal top');near(brand.bottom-header.bottom,28*u-headerSnap,'terminal crosses header boundary');
    assert.equal(metrics.scrollbar,'none','scrollbar hidden');
    near((posts[0].card.y-main.y)/u,35,'first post clears overlapping logo');
    for(const post of posts){
     nearBorder(post.borders.left,3*u,dpr,'three-unit card accent');nearBorder(post.borders.right,u,dpr,'one-unit card right border');nearBorder(post.borders.bottom,u,dpr,'one-unit card bottom border');
     near(post.card.w,319*u-leftSnap-rightSnap,'all card widths');near(post.card.x-shell.x,59*u+leftSnap,'card inset');near(post.avatar.y,post.card.y,'avatar and card top');
     near(post.avatar.x-shell.x,9*u+leftSnap,'avatar inset');near(post.avatar.w/u,42,'avatar width');near(post.avatar.h/u,42,'avatar height');near(post.portrait.w/u,40,'portrait inside border');near(post.portrait.h/u,40,'portrait square');
     near(post.handleSize/u,9,'account is smaller than author name');
     near(post.heart.w/u,13,'heart width');near(post.heart.h/u,13,'heart height');near(post.count.h/u,13,'count height');
     near(post.heart.y+post.heart.h/2,post.count.y+post.count.h/2,'heart/count centred');
     near(post.time.y+post.time.h/2,post.heart.y+post.heart.h/2,'time and likes share footer row');
     near(post.time.x-post.card.x,15*u+post.borders.left-3*u,'time left inset');near(post.card.right-post.count.right,12*u+post.borders.right-u,'likes right inset');near((post.count.x-post.heart.right)/u,5,'heart/count gap');
     near(post.card.bottom-post.count.bottom,11*u+post.borders.bottom-u,'like bottom inset');assert.ok(post.fits,'post text fits');
    }
    for(let i=1;i<posts.length;i++)near((posts[i].card.y-posts[i-1].card.bottom)/u,12,'consistent card gap');
    await page.locator('#timeline').evaluate(e=>e.scrollTop=e.scrollHeight);
    const scrolled=await page.evaluate(()=>({top:document.querySelector('#timeline').scrollTop,windowY:scrollY,header:document.querySelector('.app-header').getBoundingClientRect().y,dock:document.querySelector('#mainNav').getBoundingClientRect().bottom,last:document.querySelector('.post:last-child button').getBoundingClientRect().bottom}));
    assert.ok(scrolled.top>0,'middle can scroll');assert.equal(scrolled.windowY,0,'document stays still');near(scrolled.header,0,'header locked');near(scrolled.dock,height,'dock locked');assert.ok(scrolled.last<=dock.y,'last like reachable');
    await page.locator('#streamButton').click();assert.equal(await page.locator('#timeline').evaluate(e=>e.scrollTop),0);
   }
   await page.locator('#settingsButton').focus();await page.keyboard.press('Enter');
   await page.waitForURL(base+'/gsm/settings/');
   assert.equal(await page.locator('html').getAttribute('lang'),lang);
   assert.equal(await page.locator('#settingsButton').getAttribute('aria-current'),'page');
   assert.equal(await page.locator('.brand-icon img').evaluate(e=>e.src),terminalURL,'settings uses the same terminal symbol');
   assert.equal(await page.locator('link[rel=icon]').evaluate(e=>e.href),terminalURL,'settings favicon matches');
   assert.equal(await page.locator('main button').count(),1,'settings only offers language');
   assert.equal(await page.locator('.post').count(),1,'matching settings card');
   await page.reload();assert.equal(await page.locator('#languageButton').isVisible(),true,'settings directly reloadable');
   await page.locator('[data-language]').click();
   await page.locator('#streamButton').click();await page.waitForURL(base+'/gsm/');
  }
  await page.reload();assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');
  // Legacy local drafts remain stored; only archived packages appear in the timeline.
  await page.evaluate(()=>localStorage.setItem('umwelt-gsm-preview-v1',JSON.stringify({version:1,likes:[],reposts:['wall-view'],bookmarks:['bark-photo'],following:[],posts:[{id:'local-previous',text:'先前的动态 <img src=x onerror=alert(1)>',createdAt:1}],replies:{'bark-photo':[{author:'you',text:'先前的回复'}]}})));
  await page.reload();assert.ok(await page.locator('.post').count()>0);
  assert.equal(await page.locator('[data-post-id=local-previous]').count(),0);
  await first.click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('umwelt-gsm-preview-v1')));
  assert.equal(saved.posts[0].text,'先前的动态 <img src=x onerror=alert(1)>');assert.deepEqual(saved.bookmarks,['bark-photo']);assert.deepEqual(saved.reposts,['wall-view']);assert.deepEqual(saved.following,[]);assert.equal(saved.replies['bark-photo'][0].text,'先前的回复');
  await page.locator('#homeButton').click();await page.waitForURL(base+'/');
  assert.equal(await page.locator('.gsm-picture img').evaluate(e=>e.src),terminalURL,'homepage entry shares the page symbol');
  assert.deepEqual(errors,[]);
  await context.close();
  const unavailable=await browser.newContext();await unavailable.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('disabled')}})});
  const fallback=await unavailable.newPage();await fallback.goto(base+'/gsm/');await fallback.locator('[data-like]').first().click();assert.equal(await fallback.locator('[data-like]').first().getAttribute('aria-pressed'),'true');assert.ok((await fallback.locator('#toast').innerText()).includes('无法保存'));await unavailable.close();
  const motion=await browser.newContext({reducedMotion:'reduce'}),motionPage=await motion.newPage();
  await motionPage.goto(base+'/gsm/');
  const motionLike=motionPage.locator('[data-like]').first();
  assert.equal(await motionPage.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);
  assert.equal(await motionLike.locator('.heart-core').evaluate(e=>getComputedStyle(e).opacity),'0');
  await motionLike.locator('svg').click();assert.equal(await motionLike.getAttribute('aria-pressed'),'true');
  assert.equal(await motionLike.locator('.heart-core').evaluate(e=>getComputedStyle(e).opacity),'1','reduced motion retains filled liked state');
  assert.notEqual(await motionLike.locator('.heart-core').evaluate(e=>getComputedStyle(e).fill),'none');
  assert.equal(await motionLike.locator('..').locator('.like-burst>span').count(),4,'reduced motion retains visible like feedback');
  await motionPage.emulateMedia({reducedMotion:'no-preference'});
  assert.equal(await motionLike.locator('.heart-core').evaluate(e=>getComputedStyle(e).opacity),'1','live motion preference switch retains liked state');
  await motionPage.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await motionLike.locator('.heart-core').evaluate(e=>getComputedStyle(e).opacity),'1');
  await motionLike.locator('path.heart-core').dispatchEvent('click');assert.equal(await motionLike.getAttribute('aria-pressed'),'false');
  assert.equal(await motionLike.locator('.heart-core').evaluate(e=>getComputedStyle(e).opacity),'0');
  assert.equal(await motionLike.locator('..').locator('.like-burst').count(),0,'unliking clears pending feedback');
  await motion.close();
  if(process.env.QA_OUTPUT){
   await fs.mkdir(process.env.QA_OUTPUT,{recursive:true});const clean=await browser.newPage({viewport:{width:1280,height:1000},deviceScaleFactor:1});await clean.goto(base+'/gsm/');await clean.evaluate(()=>document.fonts.ready);
   await clean.screenshot({path:`${process.env.QA_OUTPUT}/gsm-stream-${name}-desktop.png`});
   await clean.setViewportSize({width:390,height:844});await clean.screenshot({path:`${process.env.QA_OUTPUT}/gsm-stream-${name}-mobile.png`});
   await clean.setViewportSize({width:390,height:600});await clean.locator('#timeline').evaluate(e=>e.scrollTop=210);await clean.screenshot({path:`${process.env.QA_OUTPUT}/gsm-stream-${name}-scrolled.png`});
   await clean.locator('#settingsButton').click();await clean.screenshot({path:`${process.env.QA_OUTPUT}/gsm-stream-${name}-settings.png`});await clean.close();
  }
  console.log(`${name}: workstation composition at 7 sizes, overlapping terminal, locked header/dock, inner scrolling, compact cards, independent settings, 3 languages, SVG/path likes, reduced motion, legacy storage and denial passed.`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
