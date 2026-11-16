const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {chromium,webkit}=require('playwright');
const base=(process.env.BASE_URL||'http://127.0.0.1:8797').replace(/\/$/,'');
const name=process.env.BROWSER||'chromium';

(async()=>{
 const {shells,charms}=await import('../../device/catalog.mjs');
 const browser=await {chromium,webkit}[name].launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:375,height:667},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  await context.addInitScript(()=>{
   window.__gsmImageErrors=[];
   window.addEventListener('error',event=>{if(event.target instanceof HTMLImageElement&&event.target.getAttribute('src'))window.__gsmImageErrors.push(event.target.currentSrc||event.target.src);},true);
  });
  const page=await context.newPage(),errors=[];
  let documents=0,expectedDocuments=0;
  page.on('domcontentloaded',()=>documents++);
  page.on('crash',()=>errors.push('page crashed'));
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400&&response.url().startsWith(base))errors.push(`${response.status()} ${response.url()}`);});
  const paint=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const edgeTap=async(id,offset)=>{
   const box=await page.locator('#'+id).boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2+offset;
   assert.equal(await page.evaluate(({x,y,id})=>document.elementFromPoint(x,y)?.closest('a')?.id===id,{x,y,id}),true,'a touch near the printed key edge still hits its own control');
   await page.touchscreen.tap(x,y);
  };
  const healthy=async()=>{
   assert.equal(documents,expectedDocuments,'scrolling, resizing and appearance updates never reload the document');
   assert.deepEqual(errors,[],'the mobile page has no crashes, script errors or failed resources');
   assert.deepEqual(await page.evaluate(()=>window.__gsmImageErrors),[],'every requested image remains loadable');
  };
  const navigate=async(action,pathname,selector)=>{
   if(expectedDocuments)await healthy();
   expectedDocuments++;
   await Promise.all([page.waitForURL(url=>url.pathname===pathname),action()]);
   await page.locator(selector).first().waitFor({state:'visible'});
   await page.evaluate(()=>document.fonts.ready);await paint();await healthy();
  };
  const layout=async()=>{
   await paint();
   const state=await page.evaluate(()=>{
    const screen=document.querySelector('.app-window').getBoundingClientRect();
    return {width:innerWidth,height:innerHeight,screenWidth:screen.width,
     overflow:document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1,
     eyeletShadows:[...document.querySelectorAll('.eyelet-contact-soft,.eyelet-contact-tight')].map(element=>{
      const css=getComputedStyle(element);return {width:parseFloat(css.width),height:parseFloat(css.height)};
     }),
     keys:[...document.querySelectorAll('#mainNav a')].map(element=>{
      const r=element.getBoundingClientRect(),css=getComputedStyle(element),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      const touch=element.querySelector('.key-hit').getBoundingClientRect();
      const paint=['::before','::after'].map(pseudo=>{const surface=getComputedStyle(element,pseudo);return {width:parseFloat(surface.width),height:parseFloat(surface.height)};});
      return {id:element.id,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,cssWidth:parseFloat(css.width),cssHeight:parseFloat(css.height),paint,touch:{left:touch.left,right:touch.right,top:touch.top,bottom:touch.bottom,width:touch.width,height:touch.height},reachable:hit===element||element.contains(hit)};
     })};
   });
   assert.equal(state.overflow,false,'mobile fitting keeps the document inside the viewport');
   if(state.width===375&&state.height>=590)assert.ok(state.screenWidth>=168,`the phone screen retains its mobile size: ${state.screenWidth}px`);
   assert.equal(state.keys.length,3);
   for(const key of state.keys){
    assert.ok(key.width>0&&key.height>0&&key.left>=-1&&key.right<=state.width+1&&key.top>=-1&&key.bottom<=state.height+1,`${key.id} stays in the viewport`);
    assert.ok(key.reachable,`${key.id} remains a real touch target above the artwork`);
    for(const surface of key.paint)assert.ok(surface.width>0&&surface.height>0&&surface.width<=key.cssWidth+1&&surface.height<=key.cssHeight+1,`${key.id} paints feedback within its small key surface`);
    if(state.width===375&&state.height>=590)assert.ok(key.touch.width>=43.9&&key.touch.height>=43.9,`${key.id} retains at least a 44px mobile touch area`);
   }
   for(let i=0;i<state.keys.length;i++)for(const other of state.keys.slice(i+1)){
    const one=state.keys[i].touch,two=other.touch;
    assert.ok(Math.min(one.right,two.right)<=Math.max(one.left,two.left)+.1||Math.min(one.bottom,two.bottom)<=Math.max(one.top,two.top)+.1,'neighboring touch areas never overlap');
   }
   assert.equal(state.eyeletShadows.length,2);
   for(const shadow of state.eyeletShadows)assert.ok(shadow.width>0&&shadow.width<=320&&shadow.height>0&&shadow.height<=200,'eyelet shadow paint stays within its local rendering budget');
   await healthy();
  };
  const visiblePhotos=async()=>{
   await page.waitForFunction(()=>{
    const screen=document.querySelector('#timeline').getBoundingClientRect();
    return [...document.querySelectorAll('#posts .post-media img')].every(image=>{
     const box=image.getBoundingClientRect();
     return box.bottom<=screen.top||box.top>=screen.bottom||(image.complete&&image.naturalWidth>0);
    });
   });
  };
  const walkFeed=async()=>{
   await page.locator('#streamButton').tap();
   assert.equal(await page.locator('#timeline').evaluate(element=>element.scrollTop),0,'the middle key returns to the start of the feed');
   let reachedEnd=false;
   // Advance by overlapping screenfuls so lazy photos in the middle are painted too.
   for(let step=0;step<500;step++){
    await paint();await visiblePhotos();await healthy();
    const position=await page.locator('#timeline').evaluate(element=>({top:element.scrollTop,max:element.scrollHeight-element.clientHeight}));
    if(position.top>=position.max-1){reachedEnd=true;break;}
    await page.locator('#timeline').evaluate(element=>{element.scrollTop+=Math.max(1,element.clientHeight*.75);});
   }
   assert.ok(reachedEnd,'the long mobile feed can be read through to its final post');
   const photos=await page.locator('#posts .post-media img').evaluateAll(images=>images.map(image=>({loaded:image.complete&&image.naturalWidth>0,source:image.currentSrc||image.src})));
   assert.ok(photos.length>0,'the published feed exercises photo loading');
   assert.ok(photos.every(image=>image.loaded),'incremental scrolling loads every published photo');
   const last=page.locator('#posts [data-like]').last(),before=await last.getAttribute('aria-pressed');
   await last.tap();assert.notEqual(await last.getAttribute('aria-pressed'),before,'the final post remains interactive');
   await last.tap();assert.equal(await last.getAttribute('aria-pressed'),before,'the touch interaction can be reversed');
   await healthy();
  };
  await navigate(()=>page.goto(base+'/gsm/'),'/gsm/','#posts [data-post-id]');
  assert.deepEqual(await page.evaluate(()=>({dpr:devicePixelRatio,touch:navigator.maxTouchPoints>0})),{dpr:3,touch:true});
  await layout();await walkFeed();
  let touchEdge=20;
  for(const [shellId,charmId] of [['leopard','beads'],['tokay','eggs'],['electric','blue-dew']]){
   for(const viewport of [{width:375,height:590},{width:667,height:375},{width:375,height:667}]){
    await page.setViewportSize(viewport);await layout();
    await page.locator('#timeline').evaluate(element=>{element.scrollTop=Math.max(0,element.scrollTop-element.clientHeight);});
    await paint();await visiblePhotos();await healthy();
   }
   await navigate(()=>edgeTap('settingsButton',-touchEdge),'/gsm/settings/','#languageButton');
   await page.locator(`[data-shell-choice="${shellId}"]`).tap();
   await page.locator(`[data-charm-choice="${charmId}"]`).tap();
   const expected={shell:shells.find(item=>item.id===shellId).image.split('/').at(-1),charm:charms.find(item=>item.id===charmId).image.split('/').at(-1)};
   await page.waitForFunction(expected=>[['.shell-img',expected.shell],['.charm-rig',expected.charm]].every(([selector,file])=>{
    const image=document.querySelector(selector);
    return image?.complete&&image.naturalWidth>0&&new URL(image.currentSrc||image.src).pathname.endsWith('/'+file);
   }),expected);
   assert.equal(await page.locator(`[data-shell-choice="${shellId}"]`).getAttribute('aria-pressed'),'true');
   assert.equal(await page.locator(`[data-charm-choice="${charmId}"]`).getAttribute('aria-pressed'),'true');
   await layout();
   await navigate(()=>edgeTap('homeButton',touchEdge),'/gsm/','#posts [data-post-id]');
   assert.equal(new URL(page.url()).searchParams.get('shell'),shellId);
   assert.equal(new URL(page.url()).searchParams.get('charm'),charmId);
   await layout();await walkFeed();
   touchEdge=-touchEdge;
  }
  if(process.env.QA_OUTPUT){
   await fs.mkdir(process.env.QA_OUTPUT,{recursive:true});await page.locator('#streamButton').tap();
   await page.screenshot({path:`${process.env.QA_OUTPUT}/gsm-mobile-${name}-dpr3.png`});
  }
  await navigate(()=>page.locator('#homeButton').tap(),'/','.gsm-picture');
  await context.close();

  // Isolate quota failures from the normal mobile document/load counters above.
  const historyContext=await browser.newContext({viewport:{width:375,height:667},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  await historyContext.addInitScript(()=>{
   const denied=JSON.parse(sessionStorage.getItem('gsm-test-history-denial')||'{}');
   window.__gsmHistoryProbe={replace:0,push:0,back:0,...denied};
   for(const [method,count,flag] of [['replaceState','replace','denyReplace'],['pushState','push','denyPush']]){
    const original=history[method];
    history[method]=function(...args){
     window.__gsmHistoryProbe[count]++;
     if(window.__gsmHistoryProbe[flag])throw new DOMException('Simulated history write quota','SecurityError');
     return Reflect.apply(original,this,args);
    };
   }
   const originalBack=history.back;
   history.back=function(...args){window.__gsmHistoryProbe.back++;return Reflect.apply(originalBack,this,args);};
  });
  const historyPage=await historyContext.newPage(),historyErrors=[];
  let historyDocuments=0;
  historyPage.on('domcontentloaded',()=>historyDocuments++);
  historyPage.on('pageerror',error=>historyErrors.push(error.message));
  historyPage.on('crash',()=>historyErrors.push('page crashed'));
  const historyFeed=async()=>{
   await historyPage.waitForURL(url=>url.pathname==='/gsm/'&&!url.searchParams.has('user')&&!url.searchParams.has('post'));
   await historyPage.locator('#posts [data-post-id]').first().waitFor();
  };
  const denyHistory=denied=>historyPage.evaluate(value=>{
   sessionStorage.setItem('gsm-test-history-denial',JSON.stringify(value));Object.assign(window.__gsmHistoryProbe,value);
  },denied);
  const visitFromFeed=async(kind,reloads)=>{
   const link=historyPage.locator(kind==='user'?'#posts a.avatar[data-profile]':'#posts a[data-thread]').first();
   const value=await link.getAttribute(kind==='user'?'data-profile':'data-thread'),before=historyDocuments;
   await link.tap();await historyPage.waitForURL(url=>url.searchParams.get(kind)===value);
   await historyPage.locator(kind==='user'?'#profileTitle':'#posts > article.post').first().waitFor();
   assert.equal(historyDocuments,before+Number(reloads),reloads?'denied history writes use the native destination URL':'normal navigation keeps the current document');
   assert.ok(await historyPage.locator('#homeButton').getAttribute('aria-label'));
   await historyPage.locator('#homeButton').tap();await historyFeed();
   assert.equal(historyDocuments,before+2*Number(reloads),'the physical return key works with the same navigation fallback');
   assert.deepEqual(historyErrors,[],'history rejection never escapes into a broken click handler');
  };
  await historyPage.goto(base+'/gsm/');await historyFeed();
  const beforeScroll=await historyPage.evaluate(()=>window.__gsmHistoryProbe.replace);
  await historyPage.locator('#timeline').evaluate(element=>{
   for(let step=1;step<=150;step++){element.scrollTop=step;element.dispatchEvent(new Event('scroll'));}
  });
  await historyPage.waitForFunction(before=>window.__gsmHistoryProbe.replace>before,beforeScroll,{timeout:3000});
  const scrollWrites=await historyPage.evaluate(before=>window.__gsmHistoryProbe.replace-before,beforeScroll);
  assert.ok(scrollWrites<10,`150 scroll events coalesce into a small history-write budget: ${scrollWrites}`);
  await visitFromFeed('user',false);await visitFromFeed('post',false);
  const authorLink=historyPage.locator('#posts a.avatar[data-profile]').first(),author=await authorLink.getAttribute('data-profile');
  await authorLink.tap();await historyPage.locator('#profileTitle').waitFor();
  await historyPage.locator('#posts a[data-thread]').first().tap();
  await historyPage.waitForURL(url=>url.searchParams.has('post'));await historyPage.locator('#posts > article.post').first().waitFor();
  const beforeBack=await historyPage.evaluate(()=>window.__gsmHistoryProbe.back);
  await historyPage.locator('#homeButton').evaluate(button=>{button.click();button.click();});
  await historyPage.waitForURL(url=>url.searchParams.get('user')===author);await historyPage.locator('#profileTitle').waitFor();
  assert.equal(await historyPage.evaluate(()=>window.__gsmHistoryProbe.back),beforeBack+1,'two same-tick returns request only one history traversal');
  await historyPage.locator('#homeButton').tap();await historyFeed();
  assert.equal(await historyPage.evaluate(()=>window.__gsmHistoryProbe.back),beforeBack+2,'a later intentional return works after the first traversal settles');
  await denyHistory({denyReplace:true,denyPush:true});
  await visitFromFeed('user',true);await visitFromFeed('post',true);

  // A rejected URL normalization must not disable settings or leave stale key URLs.
  await denyHistory({denyReplace:true,denyPush:false});
  await historyPage.locator('#settingsButton').tap();await historyPage.locator('#languageButton').waitFor();
  await historyPage.locator('[data-shell-choice="day"]').tap();
  await historyPage.locator('[data-charm-choice="eggs"]').tap();
  for(const [part,id] of [['shell','day'],['charm','eggs']]){
   assert.equal(await historyPage.locator(`[data-${part}-choice="${id}"]`).getAttribute('aria-pressed'),'true','settings remains selectable after replaceState rejection');
   for(const key of ['homeButton','streamButton','settingsButton'])assert.equal(new URL(await historyPage.locator('#'+key).getAttribute('href'),historyPage.url()).searchParams.get(part),id,'all physical key URLs carry the newly chosen appearance');
  }
  await historyPage.locator('#homeButton').tap();await historyFeed();
  assert.equal(new URL(historyPage.url()).searchParams.get('shell'),'day');
  assert.equal(new URL(historyPage.url()).searchParams.get('charm'),'eggs');
  await historyPage.locator('#settingsButton').tap();await historyPage.locator('#languageButton').waitFor();
  assert.equal(await historyPage.locator('[data-shell-choice="day"]').getAttribute('aria-pressed'),'true');
  await historyPage.locator('#streamButton').tap();await historyFeed();
  assert.deepEqual(historyErrors,[],'settings and physical navigation tolerate rejected history writes');
  await historyContext.close();
  console.log(`${name}: DPR 3 touch layout, full photo feed, repeated resizing, appearance choices, edge touch targets, document stability, bounded history writes and quota-safe navigation passed.`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
