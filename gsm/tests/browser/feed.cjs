const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {chromium,webkit}=require('playwright');
const base=(process.env.BASE_URL||'http://127.0.0.1:8797').replace(/\/$/,'');
const name=process.env.BROWSER||'chromium';
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<.06,`${message}: ${a} / ${b}`);
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
  for(const identity of await page.locator('.author-name').allTextContents())assert.match(identity,/^.+@[a-z0-9]+$/);
  assert.equal(await page.locator('.author-name').first().evaluate(e=>getComputedStyle(e).fontWeight),'700');
  for(const portrait of await page.locator('.avatar img').all()){assert.match(await portrait.getAttribute('src'),/\.webp(?:\?|$)/);assert.ok(await portrait.evaluate(e=>e.complete&&e.naturalWidth>0));}
  for(const post of await page.locator('.post').all()){
   assert.equal(await post.locator('.avatar').count(),1);
   assert.equal(await post.locator('button').count(),1);
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
  for(const [lang,title] of [['zh-CN','Gstream / 爬爬在线'],['en','Gstream'],['ja','Gstream / ジー投稿']]){
   assert.equal(await page.locator('html').getAttribute('lang'),lang);assert.equal(await page.title(),title);
   for(const [width,height] of [[320,568],[390,844],[430,932],[768,1024],[1280,800],[1920,1080],[844,390]]){
    await page.setViewportSize({width,height});await page.evaluate(()=>document.fonts.ready);
    await page.locator('#streamButton').click();
    const metrics=await page.evaluate(()=>{
     const r=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,bottom:b.bottom}};
     const main=document.querySelector('#timeline');
     return {unit:parseFloat(getComputedStyle(document.documentElement).fontSize),shell:r(document.querySelector('.app-window')),header:r(document.querySelector('.app-header')),dock:r(document.querySelector('#mainNav')),main:r(main),scrollbar:getComputedStyle(main).scrollbarWidth,
      overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,
      posts:[...document.querySelectorAll('.post')].map(e=>({card:r(e.querySelector('.bubble')),avatar:r(e.querySelector('.avatar')),heart:r(e.querySelector('.ui-icon')),count:r(e.querySelector('.like-count')),author:r(e.querySelector('.author-name')),time:r(e.querySelector('.post-time')),fits:[...e.querySelectorAll('.post-text,.author-name')].every(t=>t.scrollWidth<=t.clientWidth||getComputedStyle(t).display==='inline')}))};
    });
    const {unit:u,shell,header,dock,main,posts}=metrics;
    assert.equal(metrics.overflow,false,`${lang} ${width}: page overflow`);
    near(shell.w/u,390,'same phone composition');near(shell.x,(width-shell.w)/2,'centred shell');
    near(header.y,0,'header at top');near(dock.bottom,height,'dock at bottom');near(header.h/u,67,'header ratio');near(dock.h/u,52,'dock ratio');
    near(main.y,header.bottom,'middle below header');near(main.bottom,dock.y,'middle above dock');
    assert.equal(metrics.scrollbar,'none','scrollbar hidden');
    for(const post of posts){
     near(post.card.w/u,321,'all card widths');near((post.card.x-shell.x)/u,58,'card inset');near(post.avatar.y,post.card.y,'avatar and card top');
     near(post.heart.y+post.heart.h/2,post.count.y+post.count.h/2,'heart/count centred');
     near((post.time.x-post.card.x)/u,13,'time inset');near((post.heart.x-post.card.x)/u,12,'heart inset');
     near((post.card.bottom-post.heart.y)/u,20,'like bottom inset');assert.ok(post.fits,'post text fits');
    }
    for(let i=1;i<posts.length;i++)near((posts[i].card.y-posts[i-1].card.bottom)/u,23,'consistent card gap');
    await page.locator('#timeline').evaluate(e=>e.scrollTop=e.scrollHeight);
    const scrolled=await page.evaluate(()=>({top:document.querySelector('#timeline').scrollTop,windowY:scrollY,header:document.querySelector('.app-header').getBoundingClientRect().y,dock:document.querySelector('#mainNav').getBoundingClientRect().bottom,last:document.querySelector('.post:last-child button').getBoundingClientRect().bottom}));
    assert.ok(scrolled.top>0,'middle can scroll');assert.equal(scrolled.windowY,0,'document stays still');near(scrolled.header,0,'header locked');near(scrolled.dock,height,'dock locked');assert.ok(scrolled.last<=dock.y,'last like reachable');
    await page.locator('#streamButton').click();assert.equal(await page.locator('#timeline').evaluate(e=>e.scrollTop),0);
   }
   await page.locator('#settingsButton').focus();await page.keyboard.press('Enter');
   await page.waitForURL(base+'/gsm/settings/');
   assert.equal(await page.locator('html').getAttribute('lang'),lang);
   assert.equal(await page.locator('#settingsButton').getAttribute('aria-current'),'page');
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
  assert.deepEqual(errors,[]);
  await context.close();
  const unavailable=await browser.newContext();await unavailable.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('disabled')}})});
  const fallback=await unavailable.newPage();await fallback.goto(base+'/gsm/');await fallback.locator('[data-like]').first().click();assert.equal(await fallback.locator('[data-like]').first().getAttribute('aria-pressed'),'true');assert.ok((await fallback.locator('#toast').innerText()).includes('无法保存'));await unavailable.close();
  if(process.env.QA_OUTPUT){
   await fs.mkdir(process.env.QA_OUTPUT,{recursive:true});const clean=await browser.newPage({viewport:{width:1280,height:1000},deviceScaleFactor:1});await clean.goto(base+'/gsm/');await clean.evaluate(()=>document.fonts.ready);
   await clean.screenshot({path:`${process.env.QA_OUTPUT}/gsm-stream-${name}-desktop.png`});
   await clean.setViewportSize({width:390,height:844});await clean.screenshot({path:`${process.env.QA_OUTPUT}/gsm-stream-${name}-mobile.png`});
   await clean.setViewportSize({width:390,height:600});await clean.locator('#timeline').evaluate(e=>e.scrollTop=210);await clean.screenshot({path:`${process.env.QA_OUTPUT}/gsm-stream-${name}-scrolled.png`});
   await clean.locator('#settingsButton').click();await clean.screenshot({path:`${process.env.QA_OUTPUT}/gsm-stream-${name}-settings.png`});await clean.close();
  }
  console.log(`${name}: fixed phone composition at 7 sizes, locked header/dock, inner scrolling, avatar/like alignment, independent settings, 3 languages, home navigation, likes, legacy storage and denial passed.`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
