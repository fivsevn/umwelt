const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {chromium,webkit}=require('playwright');
const base=(process.env.BASE_URL||'http://127.0.0.1:8797').replace(/\/$/,'');
const name=process.env.BROWSER||'chromium';
const near=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<=2,`${message}: ${actual} / ${expected}`);

(async()=>{
 const {profiles,posts}=await import('../../data/feed.mjs');
 const browser=await {chromium,webkit}[name].launch({headless:true});
 const errors=[];
 const watch=page=>{
  page.on('pageerror',error=>errors.push(error.message));
  page.on('dialog',dialog=>{errors.push(`unexpected ${dialog.type()}: ${dialog.message()}`);dialog.dismiss();});
  page.on('response',response=>{if(response.status()>=400&&response.url().startsWith(base))errors.push(`${response.status()} ${response.url()}`);});
 };
 const userURL=(author,shell='tokay')=>`${base}/gsm/?user=${encodeURIComponent(author)}&shell=${shell}`;
 const waitForUser=(page,author)=>page.waitForURL(url=>url.pathname==='/gsm/'&&url.searchParams.get('user')===author);
 const waitForStream=page=>page.waitForURL(url=>url.pathname==='/gsm/'&&!url.searchParams.has('user'));
 const postIds=page=>page.locator('#posts [data-post-id]').evaluateAll(elements=>elements.map(element=>element.dataset.postId));
 const assertProfile=async(page,author)=>{
  await waitForUser(page,author);
  await page.locator('#profile h2').waitFor();
  const profile=profiles[author],expected=posts.filter(post=>post.author===author);
  const displayName=typeof profile.name==='string'?profile.name:profile.name.zh;
  assert.equal(await page.locator('#profile h2').textContent(),displayName,'profile heading names the selected author');
  const summary=await page.locator('#profile').innerText();
  assert.ok(summary.includes(`@${profile.handle}`),'profile identifies the stable account');
  assert.match(summary,new RegExp(`(^|\\D)${expected.length}(\\D|$)`),'profile shows its public post count');
  assert.doesNotMatch(summary,/undefined|null|NaN/,'profile labels resolve');
  assert.deepEqual(await postIds(page),expected.map(post=>post.id),'profile contains only this author, in feed order');
  assert.equal(await page.locator('#profileBack[data-profile-back]').count(),1,'profile offers one return link');
  assert.equal((await page.locator('#profileBack').textContent()).trim(),'←','return link shows only an arrow');
  assert.ok(await page.locator('#profileBack').getAttribute('aria-label'),'arrow retains an accessible name');
  if (profile.bio) assert.equal(await page.locator('#profile .profile-bio').textContent(),profile.bio,'profile shows its registered public signature');
  else assert.equal(await page.locator('#profile .profile-bio').count(),0,'blank signatures take no screen space');
  const image=page.locator('#profile img[data-pixel-avatar]').first();
  assert.equal(await image.count(),1,'profile uses the existing pixel avatar');
  await image.evaluate(async element=>{if(!element.complete)await element.decode();});
  assert.ok(await image.evaluate(element=>element.complete&&element.naturalWidth>0),'profile avatar loads');
 };
 try{
  const context=await browser.newContext({viewport:{width:1280,height:1000}});
  const page=await context.newPage();watch(page);
  await page.goto(`${base}/gsm/?shell=tokay`);
  await page.locator('#posts [data-post-id]').first().waitFor();
  await page.evaluate(()=>document.fonts.ready);
  assert.deepEqual(await postIds(page),posts.map(post=>post.id));
  for(const link of await page.locator('#posts a.avatar[data-profile]').all()){
   const href=new URL(await link.getAttribute('href'),page.url());
   assert.equal(href.pathname,'/gsm/');
   assert.ok(profiles[href.searchParams.get('user')],'avatar points to a known author');
   assert.equal(href.searchParams.get('shell'),'tokay','avatar preserves the case');
   assert.notEqual(await link.getAttribute('aria-hidden'),'true','avatar link is exposed to assistive technology');
   assert.ok((await link.getAttribute('aria-label')||await link.textContent()).trim(),'avatar link has an accessible name');
  }
  assert.equal(await page.locator('#posts a.avatar[data-profile]').count(),posts.length,'every post has a profile entry');

  // Start below the first screen so a successful return must restore a real position.
  const source=posts[Math.min(8,posts.length-1)],sourceId=`profile-${source.id}`;
  const sourceLink=page.locator(`[id="${sourceId}"]`);
  await sourceLink.scrollIntoViewIfNeeded();await sourceLink.focus();
  const feedTop=await page.locator('#timeline').evaluate(element=>element.scrollTop);
  assert.ok(feedTop>0,'profile starts from a scrolled feed');
  await page.evaluate(()=>{window.__gsmProfileDocument='same-document';});
  await page.keyboard.press('Enter');await assertProfile(page,source.author);
  assert.equal(await page.evaluate(()=>window.__gsmProfileDocument),'same-document','ordinary avatar navigation stays within this document');
  assert.equal(new URL(page.url()).searchParams.get('shell'),'tokay');
  near(await page.locator('#timeline').evaluate(element=>element.scrollTop),0,'profile starts at its heading');
  await page.goBack();await waitForStream(page);
  await page.waitForFunction(id=>document.activeElement?.id===id,sourceId);
  near(await page.locator('#timeline').evaluate(element=>element.scrollTop),feedTop,'browser Back restores feed scroll');
  assert.deepEqual(await postIds(page),posts.map(post=>post.id));
  await page.goForward();await assertProfile(page,source.author);
  await page.locator('#profileBack').click();await waitForStream(page);
  await page.waitForFunction(id=>document.activeElement?.id===id,sourceId);
  near(await page.locator('#timeline').evaluate(element=>element.scrollTop),feedTop,'profile return restores feed scroll');

  const identities=await page.locator('#posts .author-name').evaluateAll(elements=>elements.map(element=>({
   tag:element.tagName,hasHref:element.hasAttribute('href'),
   links:[...element.querySelectorAll('a')].map(link=>({
    id:link.id,kind:link.matches('.author-label')?'name':link.matches('.author-handle')?'handle':'other',
    author:link.dataset.profile,href:link.href,label:link.getAttribute('aria-label'),text:link.textContent
   }))
  })));
  assert.equal(identities.length,posts.length,'each post retains its author identity group');
  for (const [index,identity] of identities.entries()) {
   assert.equal(identity.tag,'SPAN','the name group is not one shared link');
   assert.equal(identity.hasHref,false,'the name group has no shared click target');
   assert.deepEqual(identity.links.map(link=>link.kind),['name','handle'],'name and account are separate native links');
   for (const link of identity.links) {
    assert.equal(link.id,`profile-${link.kind}-${posts[index].id}`,'each text entry has its own return-focus identity');
    assert.equal(link.author,posts[index].author);
    const url=new URL(link.href);
    assert.equal(url.searchParams.get('user'),posts[index].author);
    assert.equal(url.searchParams.get('shell'),'tokay','both text links retain the case');
    assert.ok(link.label?.trim(),'each text link has an accessible profile name');
    assert.ok(link.text?.trim(),'both text links retain visible text');
   }
  }

  const identity=page.locator(`[data-post-id="${source.id}"] .author-name`);
  const readIdentity=()=>identity.evaluate(element=>{
   const read=target=>{const style=getComputedStyle(target);return {
    shadow:style.textShadow,transform:style.transform,background:style.backgroundColor,boxShadow:style.boxShadow,
    borders:['Top','Right','Bottom','Left'].map(side=>({style:style[`border${side}Style`],width:parseFloat(style[`border${side}Width`])}))
   };};
   return {group:read(element),name:read(element.querySelector('.author-label')),handle:read(element.querySelector('.author-handle'))};
  });
  const noFrame=(styles,message)=>{
   for(const [part,style] of Object.entries(styles)) {
    assert.equal(style.background,'rgba(0, 0, 0, 0)',`${message}: ${part} has no background panel`);
    assert.equal(style.boxShadow,'none',`${message}: ${part} has no shadow box`);
    assert.ok(style.borders.every(border=>border.style==='none'||border.width===0),`${message}: ${part} has no border`);
   }
  };
  await identity.scrollIntoViewIfNeeded();await page.mouse.move(0,0);
  const plain=await readIdentity();noFrame(plain,'resting identity');
  for(const [kind,other] of [['name','handle'],['handle','name']]) {
   const id=`profile-${kind}-${source.id}`,otherId=`profile-${other}-${source.id}`;
   await page.locator(`[id="${id}"]`).hover();
   await page.waitForFunction(({id,otherId,activeShadow,otherShadow,otherTransform})=>{
    const active=getComputedStyle(document.getElementById(id)),sibling=getComputedStyle(document.getElementById(otherId));
    return active.textShadow!==activeShadow&&sibling.textShadow===otherShadow&&sibling.transform===otherTransform;
   },{id,otherId,activeShadow:plain[kind].shadow,otherShadow:plain[other].shadow,otherTransform:plain[other].transform},{timeout:3000});
   const hovered=await readIdentity();noFrame(hovered,`${kind} hover`);
   assert.notEqual(hovered[kind].shadow,plain[kind].shadow,'hover adds relief to the pointed-at text');
   assert.equal(hovered[other].shadow,plain[other].shadow,'the other text keeps its resting shadow');
   assert.equal(hovered[other].transform,plain[other].transform,'the other text does not lift with its sibling');
   assert.deepEqual(hovered.group,plain.group,'hover adds no effect to the containing group');
   if(process.env.QA_OUTPUT){
    await fs.mkdir(process.env.QA_OUTPUT,{recursive:true});
    await page.screenshot({path:`${process.env.QA_OUTPUT}/gsm-${kind}-hover-${name}.png`});
   }
  }
  await page.mouse.move(0,0);
  for (const kind of ['name','handle']) {
   const id=`profile-${kind}-${source.id}`;
   for (const activation of ['click','keyboard']) {
    const link=page.locator(`[id="${id}"]`);
    await link.scrollIntoViewIfNeeded();
    const top=await page.locator('#timeline').evaluate(element=>element.scrollTop);
    if(activation==='click')await link.click();
    else {await link.focus();await page.keyboard.press('Enter');}
    await assertProfile(page,source.author);
    assert.equal(await page.evaluate(()=>window.__gsmProfileDocument),'same-document','both text links use profile navigation within this document');
    await page.locator('#profileBack').click();await waitForStream(page);
    await page.waitForFunction(id=>document.activeElement?.id===id,id);
    near(await page.locator('#timeline').evaluate(element=>element.scrollTop),top,`${kind} ${activation} entry restores the source position`);
   }
  }

  // Direct entry and refresh must select the same public history and shared likes.
  const sample=posts[0];
  await page.goto(userURL(sample.author));await assertProfile(page,sample.author);
  await page.reload();await assertProfile(page,sample.author);
  const like=page.locator(`[data-like="${sample.id}"]`);
  const before=Number(await like.locator('.like-count').textContent());
  await like.click();assert.equal(await like.getAttribute('aria-pressed'),'true');
  assert.equal(Number(await like.locator('.like-count').textContent()),before+1);
  await page.locator('#profileBack').click();await waitForStream(page);
  const feedLike=page.locator(`[data-like="${sample.id}"]`);
  assert.equal(await feedLike.getAttribute('aria-pressed'),'true','profile like is present in the feed');
  assert.equal(Number(await feedLike.locator('.like-count').textContent()),before+1);
  await page.reload();
  assert.equal(await feedLike.getAttribute('aria-pressed'),'true','profile like survives a reload');
  await page.locator(`[id="profile-${sample.id}"]`).click();await assertProfile(page,sample.author);
  assert.equal(await like.getAttribute('aria-pressed'),'true');
  await like.click();assert.equal(await like.getAttribute('aria-pressed'),'false');

  // Localized interface copy, account headings, and the filtered list stay usable.
  const returnLabels=[];
  for(const [language,htmlLanguage] of [['zh','zh-CN'],['en','en'],['ja','ja']]){
   await page.evaluate(value=>localStorage.setItem('umwelt-desktop-language',value),language);
   await page.goto(userURL(sample.author,'day'));await assertProfile(page,sample.author);
   assert.equal(await page.locator('html').getAttribute('lang'),htmlLanguage);
   returnLabels.push(await page.locator('#profileBack').getAttribute('aria-label'));
   for(const [width,height] of [[320,568],[390,844],[844,390]]){
    await page.setViewportSize({width,height});await page.evaluate(()=>document.fonts.ready);
    await page.locator('#timeline').evaluate(element=>element.scrollTop=0);
    const layout=await page.evaluate(()=>{
     const main=document.querySelector('#timeline'),profile=document.querySelector('#profile');
     const rect=element=>{const box=element.getBoundingClientRect();return {left:box.left,right:box.right,top:box.top,bottom:box.bottom};};
     return {main:rect(main),profile:rect(profile),overflow:document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1,
      fits:[...profile.querySelectorAll('h2,p,a,span')].every(element=>element.scrollWidth<=element.clientWidth+1||getComputedStyle(element).display==='inline')};
    });
    assert.equal(layout.overflow,false,`${language} ${width}×${height}: phone fits viewport`);
    assert.ok(layout.profile.left>=layout.main.left-.75&&layout.profile.right<=layout.main.right+.75,'profile fits inside screen');
    assert.ok(layout.fits,'profile labels fit at narrow widths');
    assert.equal(await page.locator('#profileBack').isVisible(),true,'return link is visible at the top');
    await page.locator('#timeline').evaluate(element=>element.scrollTop=element.scrollHeight);
    const last=page.locator('#posts [data-like]').last();
    await last.scrollIntoViewIfNeeded();
    const reachable=await last.evaluate(element=>{const box=element.getBoundingClientRect(),main=document.querySelector('#timeline').getBoundingClientRect();return box.top>=main.top-.75&&box.bottom<=main.bottom+.75;});
    assert.ok(reachable,'last profile like is reachable inside the screen');
   }
  }
  assert.equal(new Set(returnLabels).size,3,'return navigation is translated in all interface languages');

  // Unknown, inherited-property and markup-like usernames never render another account.
  for(const author of ['missinguser99','__proto__','constructor','<img src=x onerror=alert(1)>']){
   await page.goto(userURL(author,'day'));await page.locator('#profileBack').waitFor();
   assert.equal(await page.locator('#posts [data-post-id]').count(),0,'unknown user has no public posts');
   assert.ok((await page.locator('#profile').innerText()).trim(),'unknown user shows a message');
   assert.equal(await page.locator('#profile img[src="x"]').count(),0,'unknown user cannot inject markup');
   await page.locator('#profileBack').click();await waitForStream(page);
   assert.deepEqual(await postIds(page),posts.map(post=>post.id));
   assert.equal(await page.locator('html').getAttribute('data-shell'),'day','unknown-user return retains the chosen case');
  }
  await page.goto(userURL(sample.author,'day'));await assertProfile(page,sample.author);
  await page.locator('#settingsButton').click();await page.waitForURL(url=>url.pathname==='/gsm/settings/');
  assert.equal(await page.locator('html').getAttribute('data-shell'),'day');
  await page.goBack();await assertProfile(page,sample.author);

  // Native links must follow a case change made in a real second settings tab.
  const otherSettings=await context.newPage();watch(otherSettings);
  await otherSettings.goto(`${base}/gsm/settings/?shell=day`);
  await otherSettings.locator('[data-shell-choice="tokay"]').click();
  await page.waitForFunction(()=>document.documentElement.dataset.shell==='tokay');
  for(const link of await page.locator('#posts a[data-profile],#profileBack').all()){
   const href=new URL(await link.getAttribute('href'),page.url());
   assert.equal(href.searchParams.get('shell'),'tokay','profile and return link URLs follow a case change from another tab');
   assert.equal(href.searchParams.get('user'),await link.getAttribute('data-profile'),'avatar retains its author and return link retains no user');
  }
  await otherSettings.close();

  if(process.env.QA_OUTPUT){
   await fs.mkdir(process.env.QA_OUTPUT,{recursive:true});
   await page.evaluate(()=>localStorage.setItem('umwelt-desktop-language','zh'));
   await page.goto(userURL(sample.author));await assertProfile(page,sample.author);
   for(const [label,width,height] of [['desktop',1280,1000],['mobile',390,844],['landscape',844,390]]){
    await page.setViewportSize({width,height});await page.evaluate(()=>document.fonts.ready);
    await page.locator('#timeline').evaluate(element=>element.scrollTop=0);
    await page.screenshot({path:`${process.env.QA_OUTPUT}/gsm-profile-${name}-${label}.png`});
   }
  }
  await context.close();

  const unavailable=await browser.newContext({viewport:{width:390,height:844}});
  await unavailable.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('disabled');}});});
  const fallback=await unavailable.newPage();watch(fallback);
  await fallback.goto(userURL(sample.author));await assertProfile(fallback,sample.author);
  assert.equal(await fallback.locator('html').getAttribute('data-shell'),'tokay','direct profile works when storage is disabled');
  const fallbackLike=fallback.locator(`[data-like="${sample.id}"]`);
  await fallbackLike.click();assert.equal(await fallbackLike.getAttribute('aria-pressed'),'true');
  assert.ok((await fallback.locator('#toast').textContent()).trim(),'storage denial has visible feedback');
  await fallback.locator('#profileBack').click();await waitForStream(fallback);
  assert.equal(await fallbackLike.getAttribute('aria-pressed'),'true','returning in the same document retains the temporary like');
  assert.equal(new URL(fallback.url()).searchParams.get('shell'),'tokay','return retains URL case without storage');
  await fallback.locator(`[id="profile-${sample.id}"]`).click();await assertProfile(fallback,sample.author);
  assert.equal(await fallbackLike.getAttribute('aria-pressed'),'true');
  await unavailable.close();
  assert.deepEqual(errors,[],'profile navigation has no page or local resource errors');
  console.log(`${name}: avatar and independent text links, separate text-only hover relief, profile history and filtering, Back/Forward scroll and focus, direct reloads, shared likes, 3 languages, narrow/landscape layouts, unknown users, case preservation and storage denial passed.`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
