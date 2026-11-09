const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {chromium,webkit}=require('playwright');
const base=(process.env.BASE_URL||'http://127.0.0.1:8797').replace(/\/$/,'');
const name=process.env.BROWSER||'chromium';
const near=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<=2,`${message}: ${actual} / ${expected}`);

(async()=>{
 const {profiles,posts}=await import('../../data/feed.mjs');
 const {handsetThemes}=await import('../../handsets.mjs');
 const byId=new Map(posts.map(post=>[post.id,post]));
 const rootOf=post=>{
  const visited=new Set();
  while(post?.replyTo&&!visited.has(post.id)){visited.add(post.id);post=byId.get(post.replyTo);}
  return post&&!post.replyTo?post:null;
 };
 const roots=posts.filter(post=>!post.replyTo);
 const commentsFor=root=>posts.filter(post=>post!==root&&rootOf(post)===root)
  .sort((a,b)=>Date.parse(a.date)-Date.parse(b.date)||a.id.localeCompare(b.id));
 const root=roots.find(candidate=>commentsFor(candidate).some(comment=>byId.get(comment.replyTo)?.replyTo));
 assert.ok(root,'the fixture exercises replies to comments as well as replies to roots');
 const comments=commentsFor(root),nested=comments.find(comment=>byId.get(comment.replyTo)?.replyTo);
 const emptyRoot=roots.find(candidate=>commentsFor(candidate).length===0);
 assert.ok(emptyRoot,'the fixture exercises an empty comment section');
 const browser=await {chromium,webkit}[name].launch({headless:true});
 const errors=[];
 const watch=page=>{
  page.on('pageerror',error=>errors.push(error.message));
  page.on('dialog',dialog=>{errors.push(`unexpected ${dialog.type()}: ${dialog.message()}`);dialog.dismiss();});
  page.on('response',response=>{if(response.status()>=400&&response.url().startsWith(base))errors.push(`${response.status()} ${response.url()}`);});
 };
 const route=(id,shell='tokay')=>`${base}/gsm/?post=${encodeURIComponent(id)}&shell=${shell}`;
 const ready=async page=>{await page.locator('#posts [data-post-id],#threadTitle').first().waitFor();await page.evaluate(()=>document.fonts.ready);};
 const ids=locator=>locator.evaluateAll(elements=>elements.map(element=>element.dataset.postId));
 const article=(page,id)=>page.locator(`[id="post-${id}"]`);
 const commentsLink=page=>page.locator(`a[id="comments-${root.id}"][data-thread="${root.id}"]`);
 const region=page=>page.locator(`[id="comments-body-${root.id}"]`);
 const postIds=page=>ids(page.locator('#posts [data-post-id]'));
 const scrollTop=page=>page.locator('#timeline').evaluate(element=>element.scrollTop);
 const waitForFocus=(page,id)=>page.waitForFunction(value=>document.activeElement?.id===value,id);
 const expectThread=async(page,target,expectedRoot=root)=>{
  await page.waitForURL(url=>url.pathname==='/gsm/'&&url.searchParams.get('post')===target);
  await page.locator('#threadBack[data-thread-back]').waitFor();
  assert.equal(await page.locator('#threadTitle').count(),0,'available posts have no extra page title');
  assert.deepEqual(await postIds(page),[expectedRoot.id,...commentsFor(expectedRoot).map(comment=>comment.id)],'a thread page contains its root and every descendant once');
  assert.equal(await page.locator('#posts > article.post').count(),1,'a thread page shows one root');
  assert.equal(await page.locator('#threadBack').getAttribute('aria-label')!==null,true,'thread return has an accessible name');
 };
 const expectRootHeader=async page=>{
  const header=await page.evaluate(()=>{
   const screen=document.querySelector('#timeline').getBoundingClientRect();
   return {top:screen.top,bottom:screen.bottom,items:['threadBack'].map(id=>{
    const box=document.getElementById(id).getBoundingClientRect();
    return {id,top:box.top,bottom:box.bottom};
   })};
  });
  for(const item of header.items)assert.ok(item.top>=header.top-1&&item.bottom<=header.bottom+1,`${item.id} remains visible when entering the original post`);
 };
 const expectPostInScreen=async(page,id)=>{
  assert.ok(await article(page,id).evaluate(element=>{
   const box=element.getBoundingClientRect(),screen=document.querySelector('#timeline').getBoundingClientRect();
   return box.top>=screen.top-1&&box.top<screen.bottom;
  }),'the addressed post starts inside the scrolling screen');
 };
 const assertParents=async page=>{
  for(const comment of comments){
   const item=article(page,comment.id),parent=item.locator('[data-parent]');
   assert.equal(await parent.count(),1,'each comment identifies exactly one reply target');
   assert.equal(await parent.getAttribute('data-parent'),comment.replyTo,'reply target is the actual parent, including nested comments');
   assert.ok((await parent.textContent()).trim(),'reply target has visible identity text');
   assert.equal(await item.locator('a.avatar[data-profile]').getAttribute('data-profile'),comment.author,'comment keeps its author entry');
   assert.equal(await item.locator('[data-like]').getAttribute('data-like'),comment.id,'likes belong to the comment itself');
  }
  const all=await page.locator('[id]').evaluateAll(elements=>elements.map(element=>element.id));
  assert.equal(new Set(all).size,all.length,'thread comments never duplicate DOM IDs');
 };
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript(()=>{Math.random=()=>.01;});
  const page=await context.newPage();watch(page);
  await page.goto(`${base}/gsm/?shell=tokay`);await ready(page);
  assert.deepEqual(await postIds(page),roots.map(post=>post.id),'the stream contains roots rather than flat replies');
  assert.equal(await page.locator('.comment,.comments,[data-comments]').count(),0,'the feed contains no inline comment section or toggle');
  assert.equal(await page.locator('form,input,textarea,[contenteditable="true"]').count(),0,'virtual comments have no visitor publishing form');
  for(const candidate of roots){
   const link=page.locator(`a[id="comments-${candidate.id}"][data-thread="${candidate.id}"]`);
   assert.equal(await link.count(),1,'every root exposes a native comment-page link');
   assert.equal(await link.getAttribute('aria-expanded'),null,'comment links do not advertise inline expansion');
   const href=new URL(await link.getAttribute('href'),page.url());
   assert.equal(href.pathname,'/gsm/');
   assert.equal(href.searchParams.get('post'),candidate.id,'comment links address their own original post');
   assert.equal(href.searchParams.get('shell'),'tokay','comment-page links preserve the shell');
   assert.ok((await link.getAttribute('aria-label')||await link.textContent()).trim(),'comment-page links have an accessible name');
   assert.match(await link.textContent(),new RegExp(`(^|\\D)${commentsFor(candidate).length}(\\D|$)`),'comment count includes the whole reply chain');
  }

  // Comment links enter a dedicated post page; Back/Forward preserve the feed entry.
  const entryId=`comments-${root.id}`;
  await commentsLink(page).scrollIntoViewIfNeeded();await commentsLink(page).focus();
  const feedTop=await scrollTop(page);
  await page.evaluate(()=>{window.__gsmCommentsDocument='same-document';});
  await page.keyboard.press('Enter');await expectThread(page,root.id);await expectRootHeader(page);
  assert.equal(await page.evaluate(()=>window.__gsmCommentsDocument),'same-document','comment links use the existing page navigation');
  assert.equal(await region(page).getAttribute('role'),'region');
  assert.deepEqual(await ids(region(page).locator('.comment[data-post-id]')),comments.map(comment=>comment.id),'comments appear in chronological order on the post page');
  await assertParents(page);
  await page.locator('#threadBack').click();
  await page.waitForURL(url=>!url.searchParams.has('post')&&!url.searchParams.has('user'));
  await waitForFocus(page,entryId);near(await scrollTop(page),feedTop,'the post-page return restores the feed position');
  assert.equal(await page.locator('.comment,.comments,[data-comments]').count(),0,'returning to the feed leaves no inline comments');
  await page.goForward();await expectThread(page,root.id);
  await page.goBack();await page.waitForURL(url=>!url.searchParams.has('post'));
  await waitForFocus(page,entryId);near(await scrollTop(page),feedTop,'Back/Forward restores the comment link position');

  // The native href works when opened independently, including a new tab.
  const newTab=await context.newPage();watch(newTab);
  await newTab.goto(new URL(await commentsLink(page).getAttribute('href'),page.url()).href);
  await ready(newTab);await expectThread(newTab,root.id);await expectRootHeader(newTab);await assertParents(newTab);await newTab.close();
  for(let repeat=0;repeat<2;repeat++){
   await commentsLink(page).click();await expectThread(page,root.id);await expectRootHeader(page);await assertParents(page);
   await page.locator('#threadBack').click();await page.waitForURL(url=>!url.searchParams.has('post'));
   assert.equal(await page.locator('.comment,.comments').count(),0,'repeated post visits never add comments to the feed');
  }
  const empty=page.locator(`a[id="comments-${emptyRoot.id}"][data-thread="${emptyRoot.id}"]`);
  await empty.click();await expectThread(page,emptyRoot.id,emptyRoot);await expectRootHeader(page);
  const emptyRegion=page.locator(`[id="comments-body-${emptyRoot.id}"]`);
  assert.equal(await emptyRegion.locator('.comment').count(),0);
  assert.ok((await emptyRegion.textContent()).trim(),'a post without comments explains its empty comment section');
  await page.locator('#threadBack').click();await page.waitForURL(url=>!url.searchParams.has('post'));
  await commentsLink(page).click();await expectThread(page,root.id);await expectRootHeader(page);

  // Likes and author links reuse the same published comment in its post page and profile.
  const like=page.locator(`[data-like="${nested.id}"]`);
  const before=Number(await like.locator('.like-count').textContent());
  await like.click();assert.equal(await like.getAttribute('aria-pressed'),'true');
  assert.equal(Number(await like.locator('.like-count').textContent()),before+1);
  const profileId=`profile-${nested.id}`,profileLink=page.locator(`[id="${profileId}"]`);
  await profileLink.scrollIntoViewIfNeeded();await profileLink.focus();
  const sourceTop=await scrollTop(page);assert.ok(sourceTop>0,'comment profile navigation starts in a scrolled thread');
  await page.evaluate(()=>{window.__gsmCommentsDocument='same-document';});
  await page.keyboard.press('Enter');
  await page.waitForURL(url=>url.searchParams.get('user')===nested.author);
  await page.locator('#profile h2').waitFor();
  assert.deepEqual(await postIds(page),posts.filter(post=>post.author===nested.author).map(post=>post.id),'a profile includes authored roots and replies without other users');
  assert.equal(await like.getAttribute('aria-pressed'),'true','comment like is shared with its author profile');
  await page.goBack();await expectThread(page,root.id);
  await waitForFocus(page,profileId);near(await scrollTop(page),sourceTop,'Back restores comment scroll');
  assert.equal(await like.getAttribute('aria-pressed'),'true');
  await page.goForward();await page.waitForURL(url=>url.searchParams.get('user')===nested.author);
  await page.locator('#profile h2').waitFor();
  const original=page.locator(`[id="comments-${nested.id}"][data-thread="${nested.id}"]`);
  assert.equal(await original.count(),1,'a profile reply offers its original thread');
  await original.focus();await page.keyboard.press('Enter');await expectThread(page,nested.id);
  assert.equal(await page.evaluate(()=>window.__gsmCommentsDocument),'same-document','profile and thread navigation reuse the document');
  assert.equal(await like.getAttribute('aria-pressed'),'true');
  await page.locator('#threadBack').click();await page.waitForURL(url=>url.searchParams.get('user')===nested.author);
  await waitForFocus(page,await original.getAttribute('id'));
  const bodyLinkId=`thread-${nested.id}`,bodyLink=page.locator(`[id="${bodyLinkId}"][data-thread="${nested.id}"]`);
  assert.equal(await bodyLink.count(),1,'the reply context has its own original-thread link');
  await bodyLink.scrollIntoViewIfNeeded();await bodyLink.focus();
  const profileTop=await scrollTop(page);
  await page.keyboard.press('Enter');await expectThread(page,nested.id);
  await page.goBack();await page.waitForURL(url=>url.searchParams.get('user')===nested.author);
  await waitForFocus(page,bodyLinkId);
  near(await scrollTop(page),profileTop,'Back restores the profile reply context position');
  await bodyLink.focus();await page.keyboard.press('Enter');await expectThread(page,nested.id);
  await page.locator('#streamButton').click();
  await page.waitForURL(url=>!url.searchParams.has('post')&&!url.searchParams.has('user'));
  assert.deepEqual(await postIds(page),roots.map(post=>post.id),'the physical stream key opens the feed from a profile-sourced thread');
  await page.goBack();await expectThread(page,nested.id);
  await page.locator('#threadBack').click();await page.waitForURL(url=>url.searchParams.get('user')===nested.author);
  await waitForFocus(page,bodyLinkId);

  await page.goto(route(root.id));await ready(page);await expectThread(page,root.id);await expectRootHeader(page);
  const jump=page.locator(`[data-comments-jump="${root.id}"]`);
  const threadURL=page.url(),historyLength=await page.evaluate(()=>history.length);
  await jump.focus();await page.keyboard.press('Enter');
  await waitForFocus(page,`comments-body-${root.id}`);
  assert.equal(page.url(),threadURL,'the root comment link only jumps inside its current thread');
  assert.equal(await page.evaluate(()=>history.length),historyLength,'the root comment link does not create a duplicate history entry');
  await page.locator('#threadBack').click();
  await page.waitForURL(url=>!url.searchParams.has('post')&&!url.searchParams.has('user'));
  assert.deepEqual(await postIds(page),roots.map(post=>post.id),'a direct root thread still returns straight to the feed after a comment jump');

  // Root and comment deep links survive refresh; parent links focus their real target.
  for(const target of [root.id,nested.id]){
   await page.goto(route(target));await ready(page);await expectThread(page,target);
   await waitForFocus(page,`post-${target}`);await expectPostInScreen(page,target);
   if(target===root.id)await expectRootHeader(page);
   await page.reload();await ready(page);await expectThread(page,target);
   await waitForFocus(page,`post-${target}`);await expectPostInScreen(page,target);
   if(target===root.id)await expectRootHeader(page);
   assert.equal(new URL(page.url()).searchParams.get('shell'),'leopard','thread reload redraws the case while keeping its addressed post');
  }
  await assertParents(page);
  const parent=article(page,nested.id).locator(`[data-parent="${nested.replyTo}"]`);
  await parent.click();await waitForFocus(page,`post-${nested.replyTo}`);
  const parentInScreen=await article(page,nested.replyTo).evaluate(element=>{
   const box=element.getBoundingClientRect(),screen=document.querySelector('#timeline').getBoundingClientRect();
   return box.top>=screen.top-2&&box.top<screen.bottom;
  });
  assert.ok(parentInScreen,'reply target is brought into the scrolling screen');
  await page.locator('#threadBack').click();
  await page.waitForURL(url=>!url.searchParams.has('post')&&!url.searchParams.has('user'));
  assert.deepEqual(await postIds(page),roots.map(post=>post.id),'a direct thread returns to the root stream');
  await page.goBack();await expectThread(page,nested.id);
  await page.goForward();await page.waitForURL(url=>!url.searchParams.has('post'));

  // All case variants preserve direct thread routing; narrow and short screens keep controls reachable.
  for(const theme of handsetThemes){
   await page.goto(route(nested.id,theme.id));await ready(page);await expectThread(page,nested.id);
   assert.equal(await page.locator('html').getAttribute('data-shell'),theme.id);
   assert.equal(new URL(await page.locator('#threadBack').getAttribute('href'),page.url()).searchParams.get('shell'),theme.id,'thread return retains every explicit case');
  }
  const labels=[];
  for(const [language,htmlLanguage] of [['zh','zh-CN'],['en','en'],['ja','ja']]){
   await page.evaluate(value=>localStorage.setItem('umwelt-desktop-language',value),language);
   await page.goto(route(nested.id,'day'));await ready(page);await expectThread(page,nested.id);
   assert.equal(await page.locator('html').getAttribute('lang'),htmlLanguage);
   labels.push(await page.locator('#threadBack').getAttribute('aria-label'));
   for(const [width,height] of [[320,568],[390,844],[844,390]]){
    await page.setViewportSize({width,height});await page.evaluate(()=>document.fonts.ready);
    const layout=await page.evaluate(()=>{
     const screen=document.querySelector('#timeline').getBoundingClientRect();
     return {overflow:document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1,
      comments:[...document.querySelectorAll('.comment')].map(element=>{
       const box=element.getBoundingClientRect(),text=element.querySelector('.post-text');
       return {left:box.left,right:box.right,font:parseFloat(getComputedStyle(text).fontSize),fits:text.scrollWidth<=text.clientWidth+1};
      }),left:screen.left,right:screen.right};
    });
    assert.equal(layout.overflow,false,`${language} ${width}×${height}: page fits the viewport`);
    for(const comment of layout.comments){
     assert.ok(comment.left>=layout.left-.75&&comment.right<=layout.right+.75,'comment stays within the LCD');
     assert.ok(comment.font>=15.9,'comment text retains the readable post size');
     assert.ok(comment.fits,'comment text has no horizontal overflow');
    }
    const last=page.locator('.comment [data-like]').last();await last.scrollIntoViewIfNeeded();
    assert.ok(await last.evaluate(element=>{
     const box=element.getBoundingClientRect(),screen=document.querySelector('#timeline').getBoundingClientRect();
     return box.top>=screen.top-.75&&box.bottom<=screen.bottom+.75;
    }),'the final comment like is reachable');
    if(process.env.QA_OUTPUT&&width===390){
     await fs.mkdir(process.env.QA_OUTPUT,{recursive:true});
     await page.screenshot({path:`${process.env.QA_OUTPUT}/gsm-comments-${name}-${language}.png`});
    }
   }
  }
  assert.equal(new Set(labels).size,3,'thread navigation is translated in all interface languages');
  for(const missing of ['missingpost99','__proto__','constructor','<img src=x onerror=alert(1)>']){
   await page.goto(route(missing,'day'));await page.locator('#threadBack').waitFor();
   assert.equal(await page.locator('#posts [data-post-id]').count(),0,'unknown post does not expose an unrelated thread');
   assert.ok((await page.locator('#threadTitle').textContent()).trim(),'unknown post has readable fallback copy');
   assert.equal(await page.locator('img[src="x"]').count(),0,'post query cannot inject markup');
   await page.locator('#threadBack').click();await page.waitForURL(url=>!url.searchParams.has('post'));
   assert.deepEqual(await postIds(page),roots.map(post=>post.id));
  }
  await context.close();

  const unavailable=await browser.newContext({viewport:{width:390,height:844}});
  await unavailable.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('disabled');}});});
  const fallback=await unavailable.newPage();watch(fallback);
  await fallback.goto(route(nested.id));await ready(fallback);await expectThread(fallback,nested.id);
  assert.equal(await fallback.locator('html').getAttribute('data-shell'),'tokay','thread can select a case without storage');
  const temporary=fallback.locator(`[data-like="${nested.id}"]`);await temporary.click();
  assert.equal(await temporary.getAttribute('aria-pressed'),'true','virtual comment likes work without storage');
  assert.ok((await fallback.locator('#toast').textContent()).trim(),'temporary like explains the storage failure');
  await fallback.locator(`[id="profile-${nested.id}"]`).click();await fallback.locator('#profile h2').waitFor();
  assert.equal(await temporary.getAttribute('aria-pressed'),'true','temporary comment like is shared with its profile');
  await fallback.locator('#profileBack').click();await expectThread(fallback,nested.id);
  assert.equal(await temporary.getAttribute('aria-pressed'),'true','temporary comment like survives returning to the thread');
  assert.equal(await fallback.locator('form,input,textarea,[contenteditable="true"]').count(),0);
  await unavailable.close();
  assert.deepEqual(errors,[],'virtual comments have no page or local resource errors');
  console.log(`${name}: virtual comment-page links, counts and chronological replies, real parent links, keyboard navigation, shared likes, profiles, Back/Forward scroll and focus, root/comment deep links, refresh, all cases, 3 languages, narrow/landscape screens, unknown posts and storage denial passed.`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
