const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const base=(process.env.BASE_URL||'http://127.0.0.1:8797').replace(/\/$/,'');
const name=process.env.BROWSER||'chromium';
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<.06,`${message}: ${a} / ${b}`);
const contained=(inner,outer,message)=>assert.ok(inner.x>=outer.x-.75&&inner.y>=outer.y-.75&&inner.right<=outer.right+.75&&inner.bottom<=outer.bottom+.75,message);
const feedReady=page=>page.locator('#posts [data-post-id]').first().waitFor();
(async()=>{
 const {handsetThemes}=await import('../../handsets.mjs');
 const {shells,antennas,charms}=await import('../../device/catalog.mjs');
 const shellNames=handsetThemes.map(theme=>theme.id);
 const browser=await {chromium,webkit}[name].launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:1000}});
  const page=await context.newPage(),errors=[];
  const savedAppearance=target=>target.evaluate(()=>JSON.parse(localStorage.getItem('umwelt-gsm-appearance')));
  const waitAppearance=async(target,appearance)=>{
   const expected={...appearance};
   if(expected.shell)expected.shell=shells.find(item=>item.id===expected.shell).code;
   const attributes=Object.entries(expected).map(([part,id])=>`[data-${part}="${id}"]`).join('');
   await target.locator(`.device-holder[data-ready="true"] > .device-stage${attributes}`).waitFor({state:'visible'});
  };
  const checkAttachmentArt=async(part,item)=>{
   await waitAppearance(page,{[part]:item.id});
   const image=page.locator(part==='antenna'?'.antenna':'.charm-rig');
   const loaded=await image.evaluate(async element=>{await element.decode();return {complete:element.complete,width:element.naturalWidth,source:element.currentSrc};});
   assert.ok(loaded.complete&&loaded.width>0,'the selected attachment decodes');
   assert.equal(new URL(loaded.source).pathname.split('/').at(-1),item.image.split('/').at(-1),'attachment artwork follows the catalog choice');
  };
  const checkShellArt=async shell=>{
   await waitAppearance(page,{shell});
   const art=page.locator('.shell-img');
   assert.equal(await art.count(),1,'one shell surrounds the native feed');
   const loaded=await art.evaluate(async image=>{await image.decode();return {complete:image.complete,width:image.naturalWidth,height:image.naturalHeight,source:image.currentSrc,rendering:getComputedStyle(image).imageRendering};});
   assert.ok(loaded.complete&&loaded.width>=960&&loaded.height>=1280,'shell detail loads at the approved canvas resolution');
   assert.equal(loaded.rendering,'auto','shell material keeps its rendered surface detail');
   assert.equal(new URL(loaded.source).pathname.split('/').at(-1),shells.find(item=>item.id===shell).image.split('/').at(-1),'artwork follows the catalog choice');
   assert.equal(await page.locator('iframe').count(),0,'the production screen uses native DOM');
   const selected=new URL(page.url()).searchParams;
   for(const [part,items] of [['antenna',antennas],['charm',charms]])await checkAttachmentArt(part,items.find(item=>item.id===selected.get(part)));
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
   assert.match(handle,/^@(?:[a-z0-9]+|guest-[a-z0-9][a-z0-9-]{0,57})$/);
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
   assert.equal(await avatar.evaluate(image=>getComputedStyle(image).imageRendering),'auto','portraits retain their approved rendering');
   assert.equal(await post.locator('button[data-like]').count(),1,'each root keeps one like control');
   assert.equal(await post.locator('a.comments-link[data-thread]').count(),1,'each root links to its post and virtual comments');
   assert.equal(await post.locator('[data-comments],.comments,.comment').count(),0,'feed cards contain no inline comment control or replies');
   assert.equal(await post.locator('button[data-like] .ui-icon.pixel-heart').count(),1);
   assert.equal(await post.locator('button[data-like] path.heart-core').count(),1);
   const message=await post.locator('.bubble').boundingBox(),heart=await post.locator('button[data-like]').boundingBox();
   assert.ok(heart.y+heart.height<=message.y+message.height,'likes stay within their message');
  }
  const first=page.locator('[data-like]').first();
  const initialLikes=Number(await first.locator('.like-count').innerText());
  await first.click();assert.equal(await first.getAttribute('aria-pressed'),'true');
  assert.equal(await first.locator('.like-count').innerText(),String(initialLikes+1));
  await page.reload();await feedReady(page);assert.equal(await first.getAttribute('aria-pressed'),'true');
  await first.focus();await page.keyboard.press('Enter');assert.equal(await first.getAttribute('aria-pressed'),'false');
  assert.equal(await first.locator('.like-count').innerText(),String(initialLikes));
  // SVG/path click targets must reach the same delegated handler as the button.
  await first.locator('svg').click();assert.equal(await first.getAttribute('aria-pressed'),'true');
  assert.equal(await first.locator('.like-count').innerText(),String(initialLikes+1));
  assert.equal(await first.locator('.heart-core').evaluate(e=>getComputedStyle(e).opacity),'1');
  assert.equal(await first.locator('.like-burst>span').count(),4,'like feedback stays inside the activated like button');
  await page.waitForFunction(()=>document.querySelector('.like-burst')===null,null,{timeout:1500});
  await first.locator('path.heart-core').dispatchEvent('click');
  assert.equal(await first.getAttribute('aria-pressed'),'false');
  assert.equal(await first.locator('.like-count').innerText(),String(initialLikes));
  // A second tab must observe likes and preserve the first tab's saved choices.
  const peer=await context.newPage();await peer.goto(base+'/gsm/');await feedReady(peer);
  const firstId=await first.getAttribute('data-like'),secondId=await page.locator('[data-like]').nth(1).getAttribute('data-like');
  const waitLiked=(target,id,liked)=>target.waitForFunction(({id,liked})=>document.getElementById('like-'+id)?.getAttribute('aria-pressed')===String(liked),{id,liked});
  await first.click();await waitLiked(peer,firstId,true);
  await first.focus();
  const readingPosition=await page.locator('#timeline').evaluate(element=>element.scrollTop);
  await peer.locator('#like-'+secondId).click();await waitLiked(page,secondId,true);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'like-'+firstId,'storage synchronization preserves focus');
  assert.equal(await page.locator('#timeline').evaluate(element=>element.scrollTop),readingPosition,'storage synchronization preserves the reading position');
  assert.deepEqual((await page.evaluate(()=>JSON.parse(localStorage.getItem('umwelt-gsm-preview-v1')).likes)).sort(),[firstId,secondId].sort());
  await first.click();await waitLiked(peer,firstId,false);
  await peer.evaluate(()=>localStorage.removeItem('umwelt-gsm-preview-v1'));await waitLiked(page,secondId,false);
  await peer.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
  await waitLiked(peer,secondId,false);await peer.close();
  for(const [lang,title] of [['zh-CN','Gstream / 爬爬在线'],['en','Gstream'],['ja','Gstream / ジー投稿']]){
   assert.equal(await page.locator('html').getAttribute('lang'),lang);assert.equal(await page.title(),title);
   for(const [width,height] of [[320,568],[390,844],[430,932],[768,1024],[1280,800],[1920,1080],[844,390]]){
    await page.mouse.move(0,0);
    await page.setViewportSize({width,height});await page.evaluate(()=>document.fonts.ready);
    await page.locator('#streamButton').click();
    const metrics=await page.evaluate(()=>{
     const r=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom}};
     const main=document.querySelector('#timeline');
     return {holder:r(document.querySelector('.device-holder')),shell:r(document.querySelector('.shell-img')),keys:[...document.querySelectorAll('#mainNav a')].map(r),screen:r(document.querySelector('.app-window')),header:r(document.querySelector('.app-header')),brand:r(document.querySelector('.brand-icon')),dock:r(document.querySelector('#mainNav')),main:r(main),scrollbar:getComputedStyle(main).scrollbarWidth,
      overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,
      posts:[...document.querySelectorAll('.post')].map(e=>({message:r(e.querySelector('.bubble')),identity:r(e.querySelector('.post-identity')),avatar:r(e.querySelector('.avatar')),name:r(e.querySelector('.author-name')),heart:r(e.querySelector('[data-like] .ui-icon')),count:r(e.querySelector('.like-count')),textSize:e.querySelector('.post-text')?parseFloat(getComputedStyle(e.querySelector('.post-text')).fontSize):null,font:e.querySelector('.post-text')?getComputedStyle(e.querySelector('.post-text')).fontFamily:null,time:r(e.querySelector('.post-time')),fits:[...e.querySelectorAll('.post-text,.author-name,.author-label,.author-handle')].every(t=>t.scrollWidth<=t.clientWidth+1||getComputedStyle(t).display==='inline')}))};
    });
    const {holder,shell,keys,screen,header,brand,dock,main,posts}=metrics;
    const screenScale=screen.w/356;
    assert.equal(metrics.overflow,false,`${lang} ${width}: page overflow`);
    contained(holder,{x:0,y:0,right:width,bottom:height},'the device and attachments fit the viewport');
    near(holder.x,(width-holder.w)/2,'the complete device stays centred');
    contained(screen,shell,'screen sits inside the case');
    contained(header,screen,'header sits inside the screen');
    contained(main,screen,'scrolling feed stays inside the screen');
    for(const key of keys)contained(key,shell,'each physical navigation target stays inside the case');
    assert.ok(screen.x>shell.x&&screen.right<shell.right,'case visible on both screen edges');
    assert.ok(header.y>shell.y,'earpiece area above the screen');
    assert.ok(main.y>=header.bottom-.75&&main.bottom<=Math.min(...keys.map(key=>key.y))+.75,'feed clears the header and keys');
    assert.ok(main.h>50,'scrolling screen retains usable height');
    assert.equal(metrics.scrollbar,'none','scrollbar hidden');
    near(brand.w,brand.h,'brand symbol stays square');
    assert.ok(brand.w/screenScale>=32,'brand symbol preserves its screen-space size');
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
     assert.ok(post.heart.w/screenScale>=15.5&&post.heart.h/screenScale>=15.5,'like glyph preserves its screen-space size');
     assert.ok(Math.abs(post.heart.y+post.heart.h/2-post.count.y-post.count.h/2)<1,'heart/count centred');
     assert.ok(Math.abs(post.time.y+post.time.h/2-post.heart.y-post.heart.h/2)<1,'time and likes share footer row');
     assert.ok(post.time.x>=post.message.x&&post.count.right<=post.message.right+.75,'footer stays within its message');
     assert.ok(post.message.bottom>=post.count.bottom,'like clears the message bottom');
     assert.ok(post.fits,'post text fits');
    }
    for(let i=1;i<posts.length;i++)assert.ok(posts[i].message.y>=posts[i-1].message.bottom-.75,'linear messages do not overlap');
    await page.locator('#timeline').evaluate(e=>e.scrollTop=e.scrollHeight);
    const scrolled=await page.evaluate(()=>({top:document.querySelector('#timeline').scrollTop,windowY:scrollY,header:document.querySelector('.app-header').getBoundingClientRect().y,dock:document.querySelector('#mainNav').getBoundingClientRect().bottom,last:document.querySelector('.post:last-child button[data-like]').getBoundingClientRect().bottom,main:document.querySelector('#timeline').getBoundingClientRect().bottom}));
    assert.ok(scrolled.top>0,'middle can scroll');assert.equal(scrolled.windowY,0,'document stays still');near(scrolled.header,header.y,'header locked');near(scrolled.dock,dock.bottom,'keys locked');assert.ok(scrolled.last<=scrolled.main+.75,'last like reachable inside screen');
    await page.locator('#streamButton').click();assert.equal(await page.locator('#timeline').evaluate(e=>e.scrollTop),0);
   }
   await page.locator('#settingsButton').focus();await page.keyboard.press('Enter');
   await page.waitForURL(url=>url.pathname==='/gsm/settings/');
   assert.equal(await page.locator('html').getAttribute('lang'),lang);
   assert.equal(await page.locator('#settingsButton').getAttribute('aria-current'),'page');
   assert.equal(await page.locator('.brand-icon img').evaluate(e=>e.src),brandURL,'settings uses the same brand symbol');
   assert.equal(await page.locator('link[rel=icon]').evaluate(e=>e.href),brandURL,'settings favicon matches');
   assert.equal(await page.locator('main button').count(),shells.length+antennas.length+charms.length+1,'settings offers all appearance groups and language');
   for(const [part,items] of [['shell',shells],['antenna',antennas],['charm',charms]]){
    assert.equal(await page.locator(`[data-${part}-choice]`).count(),items.length,'all catalog choices are available');
    assert.equal(await page.locator(`[data-${part}-choice][aria-pressed="true"]`).count(),1,'each appearance group has exactly one selected option');
   }
   assert.equal(await page.locator('#appearanceControls img').count(),0,'settings does not fetch a separate gallery of all skins');
   const typography=await page.evaluate(()=>({
    title:parseFloat(getComputedStyle(document.querySelector('#settingsTitle')).fontSize),
    labels:[...document.querySelectorAll('#appearanceControls legend,[data-language-label]')].map(e=>parseFloat(getComputedStyle(e).fontSize)),
    languageLast:Boolean(document.querySelector('#appearanceControls').compareDocumentPosition(document.querySelector('#languageButton'))&Node.DOCUMENT_POSITION_FOLLOWING)
   }));
   assert.equal(typography.labels.length,4);assert.equal(new Set(typography.labels).size,1,'all four category labels share a size');
   assert.ok(typography.title>typography.labels[0]);assert.equal(typography.languageLast,true,'language follows the appearance controls');
   assert.equal(await page.locator('.post').count(),1,'one settings content area');
   await page.reload();await page.locator('#languageButton').waitFor({state:'visible'});
   assert.equal(await page.locator('#languageButton').isVisible(),true,'settings directly reloadable');
   await page.locator('[data-language]').click();
   assert.equal(await page.locator('#mainNav #homeButton[data-back]').count(),1,'settings uses the left physical return key');
   assert.equal(await page.locator('#profileBack,#threadBack,[data-profile-back],[data-thread-back]').count(),0,'settings has no screen return arrow');
   assert.ok(await page.locator('#homeButton').getAttribute('aria-label'),'settings return has an accessible name');
   await page.locator('#homeButton').focus();await page.keyboard.press('Enter');await page.waitForURL(url=>url.pathname==='/gsm/');await feedReady(page);
  }
  await page.reload();assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');
  // Opening and refreshing use a fixed default until the player makes a choice.
  await page.evaluate(()=>{localStorage.removeItem('umwelt-gsm-appearance');localStorage.setItem('umwelt-gsm-shell','day');sessionStorage.clear();});
  for(const opening of ['open','reload']){
   if(opening==='open')await page.goto(base+'/gsm/');else await page.reload();
   await feedReady(page);
   const url=new URL(page.url());
   assert.equal(url.searchParams.get('shell'),'leopard');assert.equal(url.searchParams.get('antenna'),'graphite');assert.equal(url.searchParams.get('charm'),'beads');
   assert.equal(await page.locator('html').getAttribute('data-shell'),'leopard','the default does not depend on a previous random skin');
  }
  const other=await context.newPage();await other.goto(base+'/gsm/');await feedReady(other);
  assert.equal(await other.locator('html').getAttribute('data-shell'),'leopard','a new tab uses the same fixed default');
  await other.close();

  // Explicit links and manual choices retain a case through internal navigation.
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
   assert.equal((await savedAppearance(page)).shell,next,'an explicit setting choice saves a shared preference');
   await checkShellArt(next);
   assert.equal(await page.locator('[data-shell-choice][aria-pressed="true"]').count(),1,'one chosen case');
   await page.locator('#streamButton').click();await page.waitForURL(url=>url.pathname==='/gsm/');
   assert.equal(await page.locator('html').getAttribute('data-shell'),next,'choice returns to stream');
   await page.reload();await feedReady(page);
   assert.equal(await page.locator('html').getAttribute('data-shell'),next,'refresh retains a manual choice');
   assert.equal((await savedAppearance(page)).shell,next,'refresh leaves the manually saved preference intact');
   assert.equal(new URL(await page.locator('#settingsButton').getAttribute('href'),page.url()).searchParams.get('shell'),next,'the chosen case remains explicit on internal links');
   await page.locator('#settingsButton').click();await page.waitForURL(url=>url.pathname==='/gsm/settings/');
   assert.equal(await page.locator('html').getAttribute('data-shell'),next,'the chosen case persists when entering settings');
   await page.locator('#streamButton').click();await page.waitForURL(url=>url.pathname==='/gsm/');
   assert.equal(await page.locator('html').getAttribute('data-shell'),next,'the chosen case returns through its explicit link');
  }
  // Antennas and charms have independent, persistent choices.
  await page.locator('#settingsButton').click();
  for(const [part,items] of [['antenna',antennas],['charm',charms]]){
   for(const item of items){
    await page.locator(`[data-${part}-choice="${item.id}"]`).click();
    assert.equal((await savedAppearance(page))[part],item.id);
    assert.equal(new URL(page.url()).searchParams.get(part),item.id);
    assert.equal(await page.locator(`[data-${part}-choice][aria-pressed="true"]`).count(),1);
    await checkAttachmentArt(part,item);
   }
  }
  const chosen=await savedAppearance(page);
  await page.reload();await waitAppearance(page,chosen);assert.deepEqual(await savedAppearance(page),chosen);
  for(const [part,id] of Object.entries(chosen))assert.equal(new URL(page.url()).searchParams.get(part),id,'reload retains every appearance choice');
  const shared=await context.newPage();await shared.goto(base+'/gsm/');await feedReady(shared);
  for(const [part,id] of Object.entries(chosen))assert.equal(new URL(shared.url()).searchParams.get(part),id,'new tabs restore manual choices');
  await shared.close();
  // Existing shared links remain valid and become canonical.
  for(const [legacy,shell] of [['mint','leopard'],['blue','tokay'],['berry','day'],['blizzard','stone'],['crested','stone'],['mossy','stone']]){
   await page.goto(`${base}/gsm/?shell=${legacy}`);await feedReady(page);
   assert.equal(await page.locator('html').getAttribute('data-shell'),shell);
   assert.equal(new URL(page.url()).searchParams.get('shell'),shell);
  }
  // Returning to an older URL must retain the case most recently chosen in settings.
  await page.goto(base+'/gsm/?shell=tokay');
  await page.locator('#settingsButton').click();await page.waitForURL(url=>url.pathname==='/gsm/settings/');
  await page.locator('[data-shell-choice="day"]').click();
  await page.goBack();await page.waitForURL(url=>url.pathname==='/gsm/');
  await page.waitForFunction(()=>document.documentElement.dataset.shell==='day');
  assert.equal(new URL(page.url()).searchParams.get('shell'),'day','back navigation normalizes the old case URL');
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-shell'),'day','back then reload preserves the manual choice');
  await page.goto(base+'/gsm/?shell=unknown');
  await feedReady(page);
  assert.equal(await page.locator('html').getAttribute('data-shell'),'day','an invalid case URL falls back to the saved choice');

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
  const unavailable=await browser.newContext();await unavailable.addInitScript(()=>{for(const key of ['localStorage','sessionStorage'])Object.defineProperty(window,key,{get(){throw new Error('disabled')}});});
  const fallback=await unavailable.newPage();await fallback.goto(base+'/gsm/?shell=tokay');
  await feedReady(fallback);
  assert.equal(await fallback.locator('html').getAttribute('data-shell'),'tokay','URL case works with storage disabled');
  await fallback.locator('[data-like]').first().click();assert.equal(await fallback.locator('[data-like]').first().getAttribute('aria-pressed'),'true');assert.ok((await fallback.locator('#toast').innerText()).includes('无法保存'));
  await fallback.locator('#settingsButton').click();
  await fallback.locator('[data-shell-choice="day"]').click();assert.equal(await fallback.locator('html').getAttribute('data-shell'),'day','case choice still works without storage');
  await fallback.locator('#streamButton').click();await feedReady(fallback);
  assert.equal(await fallback.locator('html').getAttribute('data-shell'),'day','internal case URLs work without either storage API');
  await fallback.reload();await feedReady(fallback);
  assert.equal(await fallback.locator('html').getAttribute('data-shell'),'day','reload keeps the explicit URL when both storage APIs are denied');
  await fallback.goto(base+'/gsm/');await feedReady(fallback);
  assert.equal(await fallback.locator('html').getAttribute('data-shell'),'leopard','fresh openings use the fixed default without storage');
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
  // Exercise new media roles without publishing a test post or editing history.
  const emoteContext=await browser.newContext({viewport:{width:1280,height:1000}});
  const fixtureImage=await fs.readFile(path.join(__dirname,'../../assets/avatars/gecko404.webp'));
  let fixturePostId;
  await emoteContext.route('**/gsm/assets/emotes/gsm/browser-fixture.webp*',route=>route.fulfill({contentType:'image/webp',body:fixtureImage}));
  await emoteContext.route('**/gsm/data/feed.mjs*',async route=>{
   const response=await route.fetch(),source=await response.text();
   const marker='\nexport const posts = ',offset=source.lastIndexOf(marker);
   assert.notEqual(offset,-1,'fixture uses the normal generated feed');
   const posts=JSON.parse(source.slice(offset+marker.length).replace(/;\s*$/,''));
   const photo=posts.flatMap(post=>post.blocks.zh).find(block=>block.type==='image'&&block.kind!=='emote');
   assert.ok(photo,'existing ordinary photo supplies the unchanged-layout comparison');
   const root=posts.find(post=>!post.replyTo);fixturePostId=root.id;
   const emote={type:'image',kind:'emote',src:'/gsm/assets/emotes/gsm/browser-fixture.webp',alt:'隔离的守宫表情测试',width:160,height:160};
   const blocks=[{type:'text',text:'隔离显示测试，不写入帖子。'},photo,emote,{...emote}];
   root.blocks={zh:blocks,en:blocks,ja:blocks};
   await route.fulfill({response,body:source.slice(0,offset)+marker+JSON.stringify(posts)+';\n'});
  });
  const emotePage=await emoteContext.newPage();await emotePage.goto(base+'/gsm/?shell=leopard');await feedReady(emotePage);
  const fixturePost=emotePage.locator(`[data-post-id="${fixturePostId}"]`),emotes=fixturePost.locator('.post-emote');
  assert.equal(await emotes.count(),2,'repeated emotes remain separate reactions');
  await emotes.first().scrollIntoViewIfNeeded();
  await emotePage.waitForFunction(id=>{const image=document.getElementById(`post-${id}`)?.querySelector('.post-emote img');return image?.complete&&image.naturalWidth>0;},fixturePostId);
  await emotes.first().locator('img').evaluate(image=>image.decode());
  for(const viewport of [{width:1280,height:1000},{width:390,height:844},{width:844,height:390}]){
   await emotePage.setViewportSize(viewport);
   const geometry=await fixturePost.evaluate(post=>{
    const rem=parseFloat(getComputedStyle(document.documentElement).fontSize),photo=post.querySelector('.post-media:not(.post-emote) img');
    return {rem,scale:document.querySelector('.app-window').getBoundingClientRect().width/356,photoWidth:photo.getBoundingClientRect().width,photoRendering:getComputedStyle(photo).imageRendering,emotes:[...post.querySelectorAll('.post-emote img')].map(image=>{
     const rect=image.getBoundingClientRect(),css=getComputedStyle(image);
     return {width:rect.width,height:rect.height,fit:css.objectFit,filter:css.filter,blend:css.mixBlendMode,rendering:css.imageRendering,linked:Boolean(image.closest('a'))};
    })};
   });
   assert.equal(geometry.photoRendering,'auto','ordinary photos keep their approved smooth rendering');
   for(const image of geometry.emotes){
    assert.ok(image.width<=80*geometry.scale+.75&&image.height<=80*geometry.scale+.75,'emotes stay compact in every layout');
    assert.ok(geometry.photoWidth>image.width*2,'ordinary photos keep their existing larger layout');
    assert.equal(image.fit,'contain');assert.equal(image.linked,false,'emotes do not open an original-photo view');
    assert.equal(image.filter,'none');assert.equal(image.blend,'normal');assert.equal(image.rendering,'auto','hand-drawn emotes keep smooth edges within the LCD treatment');
   }
  }
  await emoteContext.close();
  if(process.env.QA_OUTPUT){
   await fs.mkdir(process.env.QA_OUTPUT,{recursive:true});const clean=await browser.newPage({viewport:{width:1280,height:1000},deviceScaleFactor:1});await clean.goto(base+'/gsm/');await feedReady(clean);await clean.evaluate(()=>document.fonts.ready);
   await clean.screenshot({path:`${process.env.QA_OUTPUT}/gsm-stream-${name}-desktop.png`});
   await clean.setViewportSize({width:390,height:844});await clean.screenshot({path:`${process.env.QA_OUTPUT}/gsm-stream-${name}-mobile.png`});
   await clean.setViewportSize({width:390,height:600});await clean.locator('#timeline').evaluate(e=>e.scrollTop=210);await clean.screenshot({path:`${process.env.QA_OUTPUT}/gsm-stream-${name}-scrolled.png`});
   await clean.locator('#settingsButton').click();await clean.locator('#languageButton').waitFor({state:'visible'});await clean.screenshot({path:`${process.env.QA_OUTPUT}/gsm-stream-${name}-settings.png`});await clean.close();
  }
  console.log(`${name}: composable device at 7 sizes, contained LCD screen, locked header/keys, inner scrolling, linear pager messages, ${shellNames.length} cases, fixed default, persistent manual appearance choices, explicit internal links, manual settings and history, 3 languages, SVG/path likes, reduced motion, compact emotes beside unchanged photos, legacy storage and denial passed.`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
