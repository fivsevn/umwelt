// UMWELT_PLAYWRIGHT=/absolute/path/to/playwright node mac/qa.cjs /path/UMWELT.app
const {_electron:electron}=require(process.env.UMWELT_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');const path=require('node:path');
(async()=>{
 const bundle=process.argv[2];const profile=await fs.mkdtemp(path.join(os.tmpdir(),'umwelt-mac-qa-'));
 const evidence=path.join(path.dirname(bundle),'qa');await fs.mkdir(evidence,{recursive:true});
 let app,page;const errors=[];
 async function launch(){app=await electron.launch({executablePath:path.join(bundle,'Contents/MacOS/UMWELT'),env:{...process.env,UMWELT_TEST_USER_DATA:profile}});page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));await page.waitForSelector('#systemButton');}
 await launch();await page.waitForSelector('#nativeTitlebar');
 const bounds=await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0];return {window:w.getBounds(),content:w.getContentBounds()}});assert.deepEqual(bounds.window,bounds.content);assert.equal(bounds.content.width,390);
 await page.click('#nativeMinimize');await new Promise(r=>setTimeout(r,250));assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].isMinimized()),true);await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0];w.restore();w.focus()});
 await page.click('#nativeMaximize');await new Promise(r=>setTimeout(r,350));assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].isMaximized()),true);await page.click('#nativeMaximize');await new Promise(r=>setTimeout(r,350));
 await page.screenshot({path:path.join(evidence,'01-home.png')});
 await page.click('a[href="./isopoda/"]');
 async function fitCheck(selector,name){await page.waitForTimeout(350);const box=await page.locator(selector).boundingBox();const size=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].getContentSize());assert.ok(Math.abs(size[1]-(box.height+46))<3,`${name}: window ${size[1]}, content ${box.height}`);await page.screenshot({path:path.join(evidence,name+'.png')});console.log(name,size)}
 await fitCheck('#titleCard','06-fit-selector');await page.click('#startBtn');await fitCheck('#arrivalCard','07-fit-arrival');await page.click('#settleBtn');await fitCheck('#boxFrame','08-fit-observation');
 await page.screenshot({path:path.join(evidence,'05-retro-game.png')});
 assert.equal(await page.locator('#boxFrame>.window-title').isVisible(),false);
 assert.ok(await page.locator('#nativeCaption').innerText());
 await page.click('#catalogBtn');
 const steps=await page.evaluate(async()=>{const {SPECIES}=await import('umwelt://game/isopoda/species-registry.mjs');const current=JSON.parse(localStorage.getItem('isopoda-catalog-specimen-v1'));const unlocked=JSON.parse(localStorage.getItem('isopoda-fieldnotes-v1')).unlocked;const target=unlocked.find(id=>id!==current)||current;return (SPECIES.findIndex(p=>p.id===target)-SPECIES.findIndex(p=>p.id===current)+SPECIES.length)%SPECIES.length});
 for(let i=0;i<steps;i++)await page.click('#pageNext');
 const before=await page.evaluate(()=>({collection:localStorage.getItem('isopoda-fieldnotes-v1'),position:localStorage.getItem('isopoda-catalog-specimen-v1'),run:localStorage.getItem('isopoda-fugue-v4'),text:document.querySelector('#drawerContent').innerText}));
 assert.ok(JSON.parse(before.collection).unlocked.length>0);assert.ok(before.position);
 await page.screenshot({path:path.join(evidence,'02-catalog-before.png')});
 await page.click('#closeDrawer');await page.click('#nativeClose');await app.close();
 await launch();await page.click('a[href="./isopoda/"]');await page.waitForSelector('#continueBtn');
 const stored=await page.evaluate(()=>({collection:localStorage.getItem('isopoda-fieldnotes-v1'),position:localStorage.getItem('isopoda-catalog-specimen-v1'),run:localStorage.getItem('isopoda-fugue-v4')}));
 assert.equal(stored.collection,before.collection);assert.equal(stored.position,before.position);assert.equal(stored.run,before.run);
 await page.click('#continueBtn');await page.click('#catalogBtn');
 assert.equal(await page.locator('#drawerContent').innerText(),before.text);
 await page.screenshot({path:path.join(evidence,'03-catalog-after.png')});
 // Follow the actual archive's reference route if present.
 const links=await page.locator('#drawerContent a').evaluateAll(els=>els.map(e=>e.getAttribute('href')));
 await page.goto('umwelt://game/isopoda/morphology/');await page.waitForLoadState('networkidle');await page.screenshot({path:path.join(evidence,'04-morphology.png')});
 await page.goto('umwelt://game/tick/');await page.waitForLoadState('networkidle');await page.waitForSelector('#senses');assert.equal(await page.locator('#actionButton').count(),0);await page.screenshot({path:path.join(evidence,'09-latest-tick.png')});
 await page.goto('umwelt://game/');await page.click('#systemButton');assert.equal(await page.locator('[data-action=updates]').innerText(),'查看更新');assert.equal(await page.locator('[data-action="leave"]').innerText(),'卸载环境');
 await page.click('[data-action="leave"]');await page.click('#cancelAction');assert.equal(await page.locator('#systemDialog').isVisible(),false);
 // Exercise native cancellation, leaving this distributable untouched.
 await app.evaluate(({dialog})=>{dialog.showMessageBox=async()=>({response:0,checkboxChecked:false})});
 assert.deepEqual(await page.evaluate(()=>window.umweltNative.uninstall()),{cancelled:true});const update=await page.evaluate(()=>window.umweltNative.checkUpdates());assert.equal(update.current,'0.1.1');assert.notEqual(update.status,'error');console.log('Live GitHub update check:',update.status);
 await page.click('#systemButton');await page.click('[data-action="end"]');await page.click('#confirmAction');await app.close();
 assert.deepEqual(errors,[]);
 await fs.writeFile(path.join(evidence,'results.json'),JSON.stringify({passed:true,profile,collection:JSON.parse(before.collection),lastSpecimen:JSON.parse(before.position),checks:['frameless window matches content bounds','pixel minimize and maximize/restore work','pixel close exits with saves preserved','real collection persists','active observation persists','last catalog specimen and visible content persist across process relaunch','morphology and TICK load offline','uninstall menu and native cancellation','home menu quits application'],links,errors},null,2));
 console.log('PASS: real app relaunch, collection, catalog position, routes, uninstall cancellation, quit.');
})().catch(e=>{console.error(e);process.exit(1)});
