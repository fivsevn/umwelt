// Run against a local static server. NODE_PATH may point at a shared Playwright install.
// BASE_URL=http://127.0.0.1:8765 node tests/browser/morphology-layout.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8765';
const output=process.env.QA_OUTPUT;

async function inspect(page,narrow){
 const result=await page.evaluate(narrow=>{
  const errors=[],rect=e=>e.getBoundingClientRect(),q=s=>document.querySelector(s),check=(v,msg)=>{if(!v)errors.push(msg)};
  const within=(child,parent,msg)=>{const c=rect(child),p=rect(parent);check(c.left>=p.left-1&&c.right<=p.right+1&&c.top>=p.top-1&&c.bottom<=p.bottom+1,msg)};
  check(document.documentElement.scrollWidth<=innerWidth,'horizontal page overflow');
  for(const s of ['.inspector','.dossier','.references','.layer-panel','.viewer']){
   const e=q(s),style=getComputedStyle(e);check(parseFloat(style.borderTopWidth)>0&&parseFloat(style.borderBottomWidth)>0,s+' border');
   check(rect(e).height>20,s+' collapsed');
  }
  const order=narrow?['.inspector','.viewer','.layer-panel','.dossier','.references']:['.inspector','.dossier','.references'];
  for(let i=1;i<order.length;i++)check(rect(q(order[i])).top>=rect(q(order[i-1])).bottom-1,order[i]+' overlaps / out of order');
  if(!narrow){check(rect(q('.layer-panel')).right<rect(q('.viewer')).left,'desktop left column');check(rect(q('.viewer')).right<rect(q('.inspector')).left,'desktop right column')}
  within(q('.reference-list'),q('.references'),'reference list escapes border');
  if(narrow)for(const e of document.querySelectorAll('.reference'))within(e,q('.references'),'reference card escapes panel');
  if(q('.dossier').open){
   within(q('.dossier-body'),q('.dossier'),'dossier body escapes border');
   for(const row of document.querySelectorAll('.dossier-row')){within(row,q('.dossier'),'dossier row escapes border');check(parseFloat(getComputedStyle(row).borderTopWidth)>0&&parseFloat(getComputedStyle(row).borderLeftWidth)>0,'dossier item missing its own frame')}
  }
  const field=rect(q('.optical-field')),deck=rect(q('.vhs-deck')),label=rect(q('.viewer-label'));
  check(field.top>=label.bottom-1&&deck.top>=field.bottom-1,'optical rows overlap');
  for(const e of document.querySelectorAll('.vhs-card')){within(e,q('.viewer'),'monitor escapes viewer');within(e.querySelector('canvas'),e.querySelector('.vhs-screen'),'monitor canvas escapes screen')}
  const cards=[...document.querySelectorAll('.vhs-card')].map(rect);check(cards[0].right<cards[1].left,'monitors overlap');
  // Bounds of painted pixels, not the mostly transparent canvas rectangles.
  let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
  for(const canvas of document.querySelectorAll('.exploded-part canvas')){
   const r=rect(canvas),pixels=canvas.getContext('2d').getImageData(0,0,64,64).data;
   for(let y=0;y<64;y++)for(let x=0;x<64;x++)if(pixels[(y*64+x)*4+3]){
    left=Math.min(left,r.left+x*r.width/64);right=Math.max(right,r.left+(x+1)*r.width/64);
    top=Math.min(top,r.top+y*r.height/64);bottom=Math.max(bottom,r.top+(y+1)*r.height/64);
   }
  }
  check(Math.abs((left+right-field.left-field.right)/2)<1,'painted specimen not horizontally centered');
  check(Math.abs((top+bottom-field.top-field.bottom)/2)<1,'painted specimen not vertically centered');
  check(left>=field.left&&right<=field.right&&top>=field.top&&bottom<=field.bottom,'painted specimen clipped');
  return {errors,width:innerWidth,height:innerHeight,specimen:q('#speciesSelect').value};
 },narrow);
 assert.deepEqual(result.errors,[],JSON.stringify(result));
}
async function settle(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))}
(async()=>{
 const engine=process.env.BROWSER==='webkit'?webkit:chromium;
 const browser=await engine.launch({headless:true,...(engine===chromium&&!process.env.CI?{channel:'chrome'}:{})});
 const page=await browser.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
 const sizes=[[1440,900],[1440,600],[1121,900],[1120,900],[1024,768],[768,1024],[768,430],[430,932],[390,844],[320,640]];
 if(output)fs.mkdirSync(output,{recursive:true});
 for(const [width,height] of sizes){
  await page.setViewportSize({width,height});await page.goto(base+'/isopoda/morphology/');
  await page.waitForSelector('#stage canvas');await page.evaluate(()=>document.fonts.ready);await settle(page);
  const count=await page.locator('#speciesSelect option').count();assert.ok(count>=49);
  // Every registered specimen, including aquatic shapes, must fit and remain centered.
  for(let i=0;i<count;i++){await page.selectOption('#speciesSelect',String(i));await settle(page);await inspect(page,width<=1120)}
  await page.selectOption('#speciesSelect','10');await settle(page);
  await page.locator('.reference').last().scrollIntoViewIfNeeded();
  assert.ok(await page.locator('.reference').last().isVisible());
  await page.evaluate(()=>{document.querySelector('.reference-list').scrollTop=0;window.scrollTo(0,0)});
  if(output)await page.screenshot({path:`${output}/morphology-${width}x${height}.png`,fullPage:true});
  await page.locator('.dossier summary').click();await settle(page);await inspect(page,width<=1120);
  // Expansion stress: long unbroken tokens, more rows, more references and a new control.
  await page.evaluate(()=>{
   const d=document.querySelector('.dossier-body');for(let i=0;i<8;i++){const row=d.firstElementChild.cloneNode(true);row.querySelector('p').textContent='扩容资料 / '+ 'LongUnbrokenReference'.repeat(30);d.append(row)}
   const r=document.querySelector('.reference-list');for(let i=0;i<12;i++){const row=r.firstElementChild.cloneNode(true);row.querySelector('cite').textContent='More reference material '+ 'long-url-segment'.repeat(50);r.append(row)}
   document.querySelector('#partDescription').textContent+=' Additional description '.repeat(80);
   const p=document.querySelector('.part-list');p.append(p.firstElementChild.cloneNode(true));
  });await settle(page);await inspect(page,width<=1120);
  await page.evaluate(()=>{document.querySelector('.reference-list').replaceChildren();document.querySelector('.dossier-body').replaceChildren()});await settle(page);await inspect(page,width<=1120);
  // Restore data, verify all existing input paths and that reload needs no wrapper.
  await page.reload();await page.waitForSelector('#stage canvas');await page.selectOption('#speciesSelect','0');await settle(page);
  await page.locator('.vhs-roll').click();await assert.equal(await page.locator('#partZh').textContent(),'卷球策略');
  await page.locator('.vhs-motion').click();assert.equal(await page.locator('[data-key="body"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-key="cephalon"]').click();assert.equal(await page.locator('#partZh').textContent(),'头部');
  await page.locator('.optical-field').click({position:{x:3,y:3}});assert.equal(await page.locator('#partZh').textContent(),'整体比例');
  await page.locator('#nextSpecies').click();assert.equal(await page.locator('#speciesSelect').inputValue(),'1');
  await page.locator('#prevSpecies').click();assert.equal(await page.locator('#speciesSelect').inputValue(),'0');
  await page.locator('.viewer').scrollIntoViewIfNeeded();
  const point=await page.evaluate(()=>{
   const c=document.querySelector('.part-pereon canvas'),r=c.getBoundingClientRect(),data=c.getContext('2d').getImageData(0,0,64,64).data;
   for(let y=28;y<36;y++)for(let x=28;x<36;x++)if(data[(y*64+x)*4+3])return {x:r.left+(x+.5)*r.width/64,y:r.top+(y+.5)*r.height/64};
  });
  assert.ok(point);await page.mouse.move(point.x,point.y);assert.equal(await page.locator('#partZh').textContent(),'胸部背板');
  await page.mouse.click(point.x,point.y);await page.mouse.move(0,0);assert.equal(await page.locator('#partZh').textContent(),'胸部背板');
  await page.locator('.optical-field').click({position:{x:3,y:3}});assert.equal(await page.locator('#partZh').textContent(),'整体比例');
  await page.locator('#nextSpecies').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#speciesSelect').inputValue(),'1');
  console.log(`PASS ${width}×${height}: ${count} specimens, panel borders/order, pixel centering, expansion, inputs, reload`);
 }
 assert.deepEqual(errors,[],'browser / asset errors');
 for(const width of [1440,1024,768,430,390]){
  await page.setViewportSize({width,height:900});await page.goto(base+'/isopoda/habitat.html');await page.waitForSelector('#scene');await page.evaluate(()=>document.fonts.ready);
  if(output)await page.screenshot({path:output+`/habitat-${width}.png`,fullPage:true});
 }
 assert.deepEqual(errors,[],'sister page smoke check');
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
