const {_electron:electron}=require(process.env.UMWELT_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
(async()=>{
 const bundle=process.argv[2],profile=await fs.mkdtemp(path.join(os.tmpdir(),'umwelt-multi-qa-')),out=path.join(path.dirname(bundle),'qa');await fs.mkdir(out,{recursive:true});
 let app;const errors=[];
 async function launch(){app=await electron.launch({executablePath:path.join(bundle,'Contents/MacOS/UMWELT'),env:{...process.env,UMWELT_TEST_USER_DATA:profile}});const p=await app.firstWindow();p.on('pageerror',e=>errors.push(e.message));await p.waitForSelector('#nativeTitlebar');await p.waitForTimeout(300);return p}
 async function info(page){return app.evaluate(({BrowserWindow,screen},url)=>{const w=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL()===url);return {bounds:w.getBounds(),resizable:w.isResizable(),visible:w.isVisible(),area:screen.getDisplayMatching(w.getBounds()).workArea}},page.url())}
 async function centered(page){const {bounds:b,area:a,resizable}=await info(page);assert.equal(resizable,false);assert.ok(Math.abs(b.x-(a.x+(a.width-b.width)/2))<3);assert.ok(Math.abs(b.y-(a.y+(a.height-b.height)/2))<3)}
 async function nextWindow(action){const promise=app.waitForEvent('window');await action();const p=await promise;p.on('pageerror',e=>errors.push(e.message));await p.waitForLoadState('networkidle');await p.waitForTimeout(250);return p}
 let home=await launch();await centered(home);assert.equal((await info(home)).bounds.width,720);assert.equal((await info(home)).bounds.height,540);await home.screenshot({path:path.join(out,'home.png')});
 const game=await nextWindow(()=>home.click('a[href="./isopoda/"]'));assert.equal(home.url(),'umwelt://game/');await centered(game);assert.equal(await game.locator('#nativeFrame').count(),0);await game.screenshot({path:path.join(out,'selector.png')});
 async function fits(selector){await game.waitForTimeout(350);const box=await game.locator(selector).boundingBox();const i=await info(game);assert.ok(box.y<1,'Panel must start at the real window top');assert.ok(Math.abs(box.height-i.bounds.height)<3,JSON.stringify({box,window:i.bounds}));await centered(game)}
 await fits('#titleCard');await game.click('#startBtn');await fits('#arrivalCard');assert.equal(await game.locator('.window-title:visible').count(),0);assert.equal(await game.locator('#nativeTitlebar').count(),0);await game.screenshot({path:path.join(out,'arrival.png')});
 await game.click('#settleBtn');await fits('#boxFrame');await game.screenshot({path:path.join(out,'observation.png')});
 const archive=await nextWindow(()=>game.click('#catalogBtn'));await centered(archive);assert.equal(await game.locator('#drawer').evaluate(e=>e.open),false);assert.equal(await archive.locator('#drawer').evaluate(e=>e.open),true);assert.equal(await archive.locator('#nativeFrame').count(),0);
 const steps=await archive.evaluate(async()=>{const {SPECIES}=await import('umwelt://game/isopoda/species-registry.mjs');const c=JSON.parse(localStorage.getItem('isopoda-fieldnotes-v1'));const current=JSON.parse(localStorage.getItem('isopoda-catalog-specimen-v1'));const target=c.unlocked.find(id=>id!==current)||current;return (SPECIES.findIndex(p=>p.id===target)-SPECIES.findIndex(p=>p.id===current)+SPECIES.length)%SPECIES.length});for(let n=0;n<steps;n++)await archive.click('#pageNext');const specimen=await archive.evaluate(()=>localStorage.getItem('isopoda-catalog-specimen-v1'));await archive.screenshot({path:path.join(out,'independent-archive.png')});
 const journal=await nextWindow(()=>game.click('#journalBtn'));await centered(journal);
 assert.ok((await info(journal)).bounds.height<450,'Notebook must fit its contents');
 await journal.screenshot({path:path.join(out,'notebook.png')});
 const beforeNotes=await journal.locator('#drawerContent').innerText();
 await game.locator('#actions button').first().click();await journal.waitForTimeout(300);
 assert.notEqual(await journal.locator('#drawerContent').innerText(),beforeNotes,'Notebook follows a new record');
 await archive.locator('#closeDrawer').focus();assert.equal(await archive.locator('#closeDrawer').evaluate(e=>getComputedStyle(e).outlineStyle),'none');
 const count=app.windows().length;await game.click('#catalogBtn');await game.waitForTimeout(200);assert.equal(app.windows().length,count,'Reopening focuses the existing archive');
 // Inject a new unlock through the shared storage channel, preserving the selected specimen and scroll.
 const jump=await archive.evaluate(async()=>{const {SPECIES}=await import('umwelt://game/isopoda/species-registry.mjs');const c=JSON.parse(localStorage.getItem('isopoda-fieldnotes-v1')),id=JSON.parse(localStorage.getItem('isopoda-catalog-specimen-v1'));return (SPECIES.findIndex(p=>!c.unlocked.includes(p.id))-SPECIES.findIndex(p=>p.id===id)+SPECIES.length)%SPECIES.length});
 for(let n=0;n<jump;n++)await archive.click('#pageNext');
 const unknownBefore=await archive.locator('#drawerContent').innerText();
 await game.evaluate(()=>{const key='isopoda-fieldnotes-v1',c=JSON.parse(localStorage.getItem(key)),id=JSON.parse(localStorage.getItem('isopoda-catalog-specimen-v1'));c.unlocked.push(id);localStorage.setItem(key,JSON.stringify(c))});
 await archive.waitForTimeout(250);assert.notEqual(await archive.locator('#drawerContent').innerText(),unknownBefore,'Open archive reveals a newly collected specimen');
 await archive.screenshot({path:path.join(out,'live-unlock.png')});
 for(let n=0;n<jump;n++)await archive.click('#pagePrev');
 await journal.click('#closeDrawer');
 // Moving the archive must not move its independent observation window.
 const original=(await info(game)).bounds;await app.evaluate(({BrowserWindow},url)=>{const w=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL()===url);const [x,y]=w.getPosition();w.setPosition(x+90,y+20)},archive.url());assert.deepEqual((await info(game)).bounds,original);
 await game.click('#windowMaximize');await game.waitForTimeout(900);assert.equal(await app.evaluate(({BrowserWindow},url)=>BrowserWindow.getAllWindows().find(w=>w.webContents.getURL()===url).isFullScreen(),game.url()),true);
 await game.click('#windowMaximize');await game.waitForTimeout(900);await fits('#boxFrame');
 await game.click('#windowClose');assert.equal(await archive.isClosed(),false);await archive.click('#pageNext');await archive.click('#pagePrev');assert.equal(await archive.evaluate(()=>localStorage.getItem('isopoda-catalog-specimen-v1')),specimen);await archive.click('#closeDrawer');
 const reopened=await nextWindow(()=>home.click('a[href="./isopoda/"]'));await reopened.waitForSelector('#continueBtn');await reopened.click('#continueBtn');const archive2=await nextWindow(()=>reopened.click('#catalogBtn'));assert.equal(await archive2.evaluate(()=>localStorage.getItem('isopoda-catalog-specimen-v1')),specimen);
 await app.close();home=await launch();const g2=await nextWindow(()=>home.click('a[href="./isopoda/"]'));await g2.waitForSelector('#continueBtn');assert.equal(await g2.evaluate(()=>localStorage.getItem('isopoda-catalog-specimen-v1')),specimen);
 const tick=await nextWindow(()=>home.click('a[href="./tick/"]'));await tick.waitForSelector('#senses');await centered(tick);await tick.screenshot({path:path.join(out,'latest-tick.png')});
 await home.click('#systemButton');assert.equal(await home.locator('[data-action=leave]').innerText(),'卸载环境');assert.equal(await home.locator('[data-action=updates]').innerText(),'查看更新');await home.click('[data-action=leave]');await home.screenshot({path:path.join(out,'uninstall-confirmation.png')});await home.click('#cancelAction');
 await app.close();assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'results.json'),JSON.stringify({passed:true,profile,specimen,checks:['fixed centered desktop and game windows','authored arrival panel without extra title','content fits without background','independent movable archive','observation and archive close independently','fullscreen and small-window restore','saved catalog persists through process restart','latest TICK','uninstall confirmation cancels'],errors},null,2));console.log('PASS: independent fixed centered windows, original panel styling, fullscreen, persistence, latest TICK.');
})().catch(e=>{console.error(e);process.exit(1)});
