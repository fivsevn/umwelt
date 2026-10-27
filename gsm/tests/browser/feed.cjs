const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {chromium,webkit}=require('playwright');
const base=(process.env.BASE_URL||'http://127.0.0.1:8797').replace(/\/$/,'');
const name=process.env.BROWSER||'chromium';
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<.06,`${message}: ${a} / ${b}`);
const contained=(inner,outer,message)=>assert.ok(inner.x>=outer.x-.75&&inner.y>=outer.y-.75&&inner.right<=outer.right+.75&&inner.bottom<=outer.bottom+.75,message);
const feedReady=page=>page.locator('#posts [data-post-id]').first().waitFor();
(async()=>{
 const {handsetThemes}=await import('../../handsets.mjs');
 const shellNames=handsetThemes.map(theme=>theme.id);
 const browser=await {chromium,webkit}[name].launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:1000}});
  const page=await context.newPage(),errors=[];
  const checkShellArt=async shell=>{
   const art=page.locator('img[data-shell-art]');
   assert.equal(await art.count(),1,'one hardware frame surrounds the live feed');
   const loaded=await art.evaluate(async image=>{await image.decode();return {complete:image.complete,width:image.naturalWidth,height:image.naturalHeight,source:image.currentSrc,rendering:getComputedStyle(image).imageRendering};});
   assert.ok(loaded.complete&&loaded.width>0,'hardware frame loads and decodes');
   assert.equal(loaded.rendering,'auto','the low-poly housing keeps its full rendered surface detail');
   const landscape=new URL(loaded.source).pathname.endsWith('-wide.webp');
   assert.ok(loaded.width>=(landscape?1240:960)&&loaded.height>=(landscape?820:1280),'housing and printed legends retain at least twice the logical body resolution');
   assert.match(new URL(loaded.source).pathname,new RegExp(`/pocket-${shell}(?:-wide)?\\.webp$`),'hardware frame matches the chosen case');
   const wide=page.locator('source[data-shell-art-wide]');
   assert.equal(await wide.count(),1,'landscape has a dedicated hardware frame');
   assert.match(await wide.getAttribute('srcset'),new RegExp(`pocket-${shell}-wide\\.webp(?:\\s|$)`),'landscape frame follows the chosen case');
  };
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))errors.push(`${r.status()} ${r.url()}`);});
  await page.goto(base+'/gsm/');await feedReady(page);await page.evaluate(()=>document.fonts.ready);
  assert.ok(await page.locator('.post').count()>0);
  assert.equal(await page.locator('#mainNav a').count(),3);
  assert.equal(await page.locator('#mainNav').innerText(),'');
  assert.equal(await page.locator('#mainNav svg,#mainNav img,#mainNav canvas').count(),0,'printed key legends are baked into the hardware artwork');
  await page.keyboard.press('Tab');
  for(const target of await page.locator('#mainNav a').all()){
   const box=await target.boundingBox();assert.ok(box.width>0&&box.height>0,'each physical key has its own real link target');
   assert.ok(await target.getAttribute('aria-label'),'each printed key has an accessible name');
   await target.focus();
   const focus=await target.evaluate(element=>{
    const paint=getComputedStyle(element,'::after');
    return {active:document.activeElement===element,keyboard:element.matches(':focus-visible'),content:paint.content,
     display:paint.display,visibility:paint.visibility,opacity:Number(paint.opacity),image:paint.backgroundImage,
     shadow:paint.boxShadow,outlineWidth:parseFloat(paint.outlineWidth),outlineStyle:paint.outlineStyle};
   });
   assert.ok(focus.active&&focus.keyboard,'the physical key link receives keyboard focus');
   const focusPaint=focus.image!=='none'||focus.shadow!=='none'||(focus.outlineWidth>0&&focus.outlineStyle!=='none');
   assert.ok(focus.content!=='none'&&focus.content!=='normal'&&focus.display!=='none'&&focus.visibility!=='hidden'&&focus.opacity>0&&focusPaint,'the focused key paints its visible surface indicator');
  }
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
  const brandURL=await page.locator('.brand-icon img').evaluate(e=>e.src);
  assert.equal(brandURL,await page.locator('link[rel=icon]').evaluate(e=>e.href),'header and favicon share the brand symbol');
  assert.equal(await page.locator('.post-portrait').count(),0,'pager messages have no separate portrait column');
  await page.waitForFunction(()=>[...document.querySelectorAll('[data-post-id]')].every(post=>{
   const image=post.querySelector('.post-identity .avatar img[data-pixel-avatar]');
   return image&&image.complete&&image.naturalWidth>0&&image.naturalWidth<=24&&image.naturalWidth===image.naturalHeight;
  }));
  const decorations=await page.locator('.pixel-stickers>.decoration').evaluateAll(elements=>elements.map(element=>({display:getComputedStyle(element).display,color:getComputedStyle(element).color})));
  assert.equal(decorations.length,9,'all original header decorations remain');
  assert.ok(decorations.every(decoration=>decoration.display!=='none'),'header decorations are not hidden');
  assert.ok(new Set(decorations.map(decoration=>decoration.color)).size>=2,'header decorations retain their colors');
  assert.equal(await page.locator('.stream-flourish>.decoration').count(),3,'three original bottom decorations remain');
  assert.notEqual(await page.locator('.stream-flourish').evaluate(element=>getComputedStyle(element).display),'none','bottom decorations remain displayed');
  for(const post of await page.locator('.post').all()){
   assert.equal(await post.locator('.post-identity .avatar').count(),1,'each message has one inline identity portrait');
   const avatar=post.locator('.post-identity .avatar img[data-pixel-avatar]');
   assert.equal(await avatar.count(),1);
   assert.equal(await avatar.evaluate(image=>getComputedStyle(image).imageRendering),'pixelated','sampled portrait pixels stay crisp');
   assert.equal(await post.locator('button').count(),1);
   assert.equal(await post.locator('button[data-like] .ui-icon.pixel-heart').count(),1);
   assert.equal(await post.locator('button[data-like] path.heart-core').count(),1);
   const message=await post.locator('.bubble').boundingBox(),heart=await post.locator('button').boundingBox();
   assert.ok(heart.y+heart.height<=message.y+message.height,'likes stay within their message');
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
    await page.mouse.move(0,0);
    await page.setViewportSize({width,height});await page.evaluate(()=>document.fonts.ready);
    await page.locator('#streamButton').click();
    const metrics=await page.evaluate(()=>{
     const r=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom}};
     const main=document.querySelector('#timeline');
     return {shell:r(document.querySelector('.phone-shell')),screen:r(document.querySelector('.app-window')),header:r(document.querySelector('.app-header')),brand:r(document.querySelector('.brand-icon')),dock:r(document.querySelector('#mainNav')),main:r(main),scrollbar:getComputedStyle(main).scrollbarWidth,
      overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,
      posts:[...document.querySelectorAll('.post')].map(e=>({message:r(e.querySelector('.bubble')),identity:r(e.querySelector('.post-identity')),avatar:r(e.querySelector('.avatar')),name:r(e.querySelector('.author-name')),heart:r(e.querySelector('.ui-icon')),count:r(e.querySelector('.like-count')),textSize:e.querySelector('.post-text')?parseFloat(getComputedStyle(e.querySelector('.post-text')).fontSize):null,font:e.querySelector('.post-text')?getComputedStyle(e.querySelector('.post-text')).fontFamily:null,time:r(e.querySelector('.post-time')),fits:[...e.querySelectorAll('.post-text,.author-name,.author-label,.author-handle')].every(t=>t.scrollWidth<=t.clientWidth+1||getComputedStyle(t).display==='inline')}))};
    });
    const {shell,screen,header,brand,dock,main,posts}=metrics;
    assert.equal(metrics.overflow,false,`${lang} ${width}: page overflow`);
    contained(shell,{x:0,y:0,right:width,bottom:height},'whole phone fits the viewport');
    near(shell.x,(width-shell.w)/2,'phone stays centred');
    contained(screen,shell,'screen sits inside the case');
    contained(header,screen,'header sits inside the screen');
    contained(main,screen,'scrolling feed stays inside the screen');
    contained(dock,shell,'physical navigation stays inside the case');
    assert.ok(screen.x>shell.x&&screen.right<shell.right,'case visible on both screen edges');
    assert.ok(header.y>shell.y,'earpiece area above the screen');
    assert.ok(main.y>=header.bottom-.75&&main.bottom<=dock.y+.75,'feed clears the header and keys');
    assert.ok(main.h>50,'scrolling screen retains usable height');
    assert.equal(metrics.scrollbar,'none','scrollbar hidden');
    near(brand.w,brand.h,'brand symbol stays square');
    assert.ok(brand.w>=14,'compact brand symbol stays visible');
    assert.ok(posts[0].message.y>=main.y&&posts[0].message.y>=brand.bottom-.75,'first message clears the brand symbol');
    for(const post of posts){
     assert.ok(post.message.x>=main.x&&post.message.right<=main.right+.75,'messages fit the screen width');
     contained(post.avatar,post.identity,'portrait stays within the identity row');
     near(post.avatar.w,post.avatar.h,'inline portrait stays square');
     assert.ok(post.avatar.x>=post.message.x-.75&&post.avatar.right<=post.name.x+.75,'portrait sits beside the name without an outer column');
     if(post.textSize!==null){
      assert.ok(post.textSize>=15.9,'post text remains at least 16px at narrow and short sizes');
      assert.match(post.font,/Pixel/,'post text keeps the shared pixel font family');
     }
     assert.ok(post.heart.w>=10&&post.heart.h>=10,'like glyph stays visible');
     assert.ok(Math.abs(post.heart.y+post.heart.h/2-post.count.y-post.count.h/2)<1,'heart/count centred');
     assert.ok(Math.abs(post.time.y+post.time.h/2-post.heart.y-post.heart.h/2)<1,'time and likes share footer row');
     assert.ok(post.time.x>=post.message.x&&post.count.right<=post.message.right+.75,'footer stays within its message');
     assert.ok(post.message.bottom>=post.count.bottom,'like clears the message bottom');
     assert.ok(post.fits,'post text fits');
    }
    for(let i=1;i<posts.length;i++)assert.ok(posts[i].message.y>=posts[i-1].message.bottom-.75,'linear messages do not overlap');
    await page.locator('#timeline').evaluate(e=>e.scrollTop=e.scrollHeight);
    const scrolled=await page.evaluate(()=>({top:document.querySelector('#timeline').scrollTop,windowY:scrollY,header:document.querySelector('.app-header').getBoundingClientRect().y,dock:document.querySelector('#mainNav').getBoundingClientRect().bottom,last:document.querySelector('.post:last-child button').getBoundingClientRect().bottom,main:document.querySelector('#timeline').getBoundingClientRect().bottom}));
    assert.ok(scrolled.top>0,'middle can scroll');assert.equal(scrolled.windowY,0,'document stays still');near(scrolled.header,header.y,'header locked');near(scrolled.dock,dock.bottom,'keys locked');assert.ok(scrolled.last<=scrolled.main+.75,'last like reachable inside screen');
    await page.locator('#streamButton').click();assert.equal(await page.locator('#timeline').evaluate(e=>e.scrollTop),0);
   }
   await page.locator('#settingsButton').focus();await page.keyboard.press('Enter');
   await page.waitForURL(url=>url.pathname==='/gsm/settings/');
   assert.equal(await page.locator('html').getAttribute('lang'),lang);
   assert.equal(await page.locator('#settingsButton').getAttribute('aria-current'),'page');
   assert.equal(await page.locator('.brand-icon img').evaluate(e=>e.src),brandURL,'settings uses the same brand symbol');
   assert.equal(await page.locator('link[rel=icon]').evaluate(e=>e.href),brandURL,'settings favicon matches');
   assert.equal(await page.locator('main button').count(),handsetThemes.length+1,'settings offers language and all catalog case choices');
   assert.equal(await page.locator('[data-shell-choice]').count(),handsetThemes.length,'all catalog case variants are available');
   assert.equal(await page.locator('[data-shell-choice] img').count(),handsetThemes.length,'each case has its rendered thumbnail');
   for(const thumbnail of await page.locator('[data-shell-choice] img').all()){
    await thumbnail.scrollIntoViewIfNeeded();
    assert.ok(await thumbnail.evaluate(async image=>{await image.decode();return image.complete&&image.naturalWidth>0;}),'case thumbnail loads and decodes');
   }
   assert.equal(await page.locator('.post').count(),1,'one settings content area');
   await page.reload();assert.equal(await page.locator('#languageButton').isVisible(),true,'settings directly reloadable');
   await page.locator('[data-language]').click();
   await page.locator('#streamButton').click();await page.waitForURL(url=>url.pathname==='/gsm/');
  }
  await page.reload();assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');
  // A case choice follows the reader through settings, stream and reloads.
  for(const shell of shellNames){
   await page.goto(`${base}/gsm/?shell=${shell}`);
   await feedReady(page);
   assert.equal(await page.locator('html').getAttribute('data-shell'),shell,'URL selects a case');
   await checkShellArt(shell);
   await page.locator('#settingsButton').click();await page.waitForURL(url=>url.pathname==='/gsm/settings/');
   assert.equal(await page.locator('html').getAttribute('data-shell'),shell,'case persists into settings');
   assert.equal(await page.locator(`[data-shell-choice="${shell}"]`).getAttribute('aria-pressed'),'true','chosen case is marked');
   const next=shellNames[(shellNames.indexOf(shell)+1)%shellNames.length];
   await page.locator(`[data-shell-choice="${next}"]`).click();
   assert.equal(await page.locator('html').getAttribute('data-shell'),next,'choice applies immediately');
   await checkShellArt(next);
   assert.equal(await page.locator('[data-shell-choice][aria-pressed="true"]').count(),1,'one chosen case');
   await page.reload();assert.equal(await page.locator('html').getAttribute('data-shell'),next,'choice survives refresh');
   await page.locator('#streamButton').click();await page.waitForURL(url=>url.pathname==='/gsm/');
   assert.equal(await page.locator('html').getAttribute('data-shell'),next,'choice returns to stream');
  }
  // Existing saved covers and shared preview links keep selecting their successor.
  for(const [legacy,shell] of [['mint','leopard'],['blue','tokay'],['berry','day'],['blizzard','stone']]){
   await page.goto(`${base}/gsm/?shell=${legacy}`);
   await feedReady(page);
   assert.equal(await page.locator('html').getAttribute('data-shell'),shell,'legacy URL selects its gecko cover');
   assert.equal(new URL(page.url()).searchParams.get('shell'),shell==='leopard'?null:shell,'legacy URL normalizes');
   await page.evaluate(value=>localStorage.setItem('umwelt-gsm-shell',value),legacy);
   await page.goto(base+'/gsm/');
   await feedReady(page);
   assert.equal(await page.locator('html').getAttribute('data-shell'),shell,'legacy saved cover migrates');
   assert.equal(await page.evaluate(()=>localStorage.getItem('umwelt-gsm-shell')),shell,'migrated cover is saved canonically');
  }
  // Returning to an older URL must retain the case most recently chosen in settings.
  await page.goto(base+'/gsm/?shell=tokay');
  await page.locator('#settingsButton').click();await page.waitForURL(url=>url.pathname==='/gsm/settings/');
  await page.locator('[data-shell-choice="day"]').click();
  await page.goBack();await page.waitForURL(url=>url.pathname==='/gsm/');
  await page.waitForFunction(()=>document.documentElement.dataset.shell==='day');
  assert.equal(new URL(page.url()).searchParams.get('shell'),'day','back navigation normalizes the old case URL');
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-shell'),'day','back then reload retains the latest case');
  await page.goto(base+'/gsm/?shell=unknown');
  await feedReady(page);
  assert.ok(shellNames.includes(await page.locator('html').getAttribute('data-shell')),'invalid case URL falls back safely');

  // Legacy local drafts remain stored; only archived packages appear in the timeline.
  await page.evaluate(()=>localStorage.setItem('umwelt-gsm-preview-v1',JSON.stringify({version:1,likes:[],reposts:['wall-view'],bookmarks:['bark-photo'],following:[],posts:[{id:'local-previous',text:'先前的动态 <img src=x onerror=alert(1)>',createdAt:1}],replies:{'bark-photo':[{author:'you',text:'先前的回复'}]}})));
  await page.reload();assert.ok(await page.locator('.post').count()>0);
  assert.equal(await page.locator('[data-post-id=local-previous]').count(),0);
  await first.click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('umwelt-gsm-preview-v1')));
  assert.equal(saved.posts[0].text,'先前的动态 <img src=x onerror=alert(1)>');assert.deepEqual(saved.bookmarks,['bark-photo']);assert.deepEqual(saved.reposts,['wall-view']);assert.deepEqual(saved.following,[]);assert.equal(saved.replies['bark-photo'][0].text,'先前的回复');
  await page.locator('#homeButton').click();await page.waitForURL(base+'/');
  assert.equal(await page.locator('.gsm-picture img').evaluate(e=>e.src),brandURL,'homepage entry shares the brand symbol');
  assert.deepEqual(errors,[]);
  await context.close();
  const unavailable=await browser.newContext();await unavailable.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('disabled')}})});
  const fallback=await unavailable.newPage();await fallback.goto(base+'/gsm/?shell=tokay');
  await feedReady(fallback);
  assert.equal(await fallback.locator('html').getAttribute('data-shell'),'tokay','URL case works with storage disabled');
  await fallback.locator('[data-like]').first().click();assert.equal(await fallback.locator('[data-like]').first().getAttribute('aria-pressed'),'true');assert.ok((await fallback.locator('#toast').innerText()).includes('无法保存'));
  await fallback.locator('#settingsButton').click();
  await fallback.locator('[data-shell-choice="day"]').click();assert.equal(await fallback.locator('html').getAttribute('data-shell'),'day','case choice still works without storage');
  await unavailable.close();
  const motion=await browser.newContext({reducedMotion:'reduce'}),motionPage=await motion.newPage();
  await motionPage.goto(base+'/gsm/');
  await feedReady(motionPage);
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
   await fs.mkdir(process.env.QA_OUTPUT,{recursive:true});const clean=await browser.newPage({viewport:{width:1280,height:1000},deviceScaleFactor:1});await clean.goto(base+'/gsm/');await feedReady(clean);await clean.evaluate(()=>document.fonts.ready);
   await clean.screenshot({path:`${process.env.QA_OUTPUT}/gsm-stream-${name}-desktop.png`});
   await clean.setViewportSize({width:390,height:844});await clean.screenshot({path:`${process.env.QA_OUTPUT}/gsm-stream-${name}-mobile.png`});
   await clean.setViewportSize({width:390,height:600});await clean.locator('#timeline').evaluate(e=>e.scrollTop=210);await clean.screenshot({path:`${process.env.QA_OUTPUT}/gsm-stream-${name}-scrolled.png`});
   await clean.locator('#settingsButton').click();await clean.screenshot({path:`${process.env.QA_OUTPUT}/gsm-stream-${name}-settings.png`});await clean.close();
  }
  console.log(`${name}: painted low-poly pocket device at 7 sizes, contained LCD screen, locked header/keys, inner scrolling, linear pager messages, ${shellNames.length} persistent case variants, independent settings, 3 languages, SVG/path likes, reduced motion, legacy storage and denial passed.`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
