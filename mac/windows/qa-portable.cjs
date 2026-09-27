const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const source=path.resolve(process.argv[2]),root=await fs.mkdtemp(path.join(os.tmpdir(),'umwelt-win-'));
 // Deliberately include spaces, non-ASCII and an apostrophe in the install path.
 const folder=path.join(root,"朋友's 游戏"),profile=path.join(root,'profile'),exe=path.join(folder,'UMWELT.exe');
 await fs.mkdir(folder);await fs.copyFile(source,exe);await fs.mkdir(profile);await fs.writeFile(path.join(profile,'fixture'),'test');
 const out=path.resolve('_windows/qa');await fs.mkdir(out,{recursive:true});const errors=[];let browser,child;
 async function start(){
  child=spawn(exe,['--remote-debugging-port=9333'],{env:{...process.env,UMWELT_TEST_USER_DATA:profile},stdio:'ignore'});
  let endpoint;for(let i=0;i<120;i++){try{endpoint=await (await fetch('http://127.0.0.1:9333/json/version')).json();break}catch{await pause(500)}}
  assert.ok(endpoint?.webSocketDebuggerUrl,'Packaged portable EXE must start');
  browser=await chromium.connectOverCDP(endpoint.webSocketDebuggerUrl);const context=browser.contexts()[0];
  const watch=p=>p.on('pageerror',e=>{console.error('PAGE ERROR',e.message);errors.push(e.message)});context.pages().forEach(watch);context.on('page',watch);
  let home;for(let i=0;i<60;i++){home=context.pages().find(p=>p.url()==='umwelt://game/');if(home)break;await pause(250)}
  await home.waitForSelector('#nativeTitlebar');return {context,home};
 }
 async function stopped(){for(let i=0;i<120&&child.exitCode===null;i++)await pause(500);console.log('Cleanup trace',await fs.readFile(path.join(root,'cleanup-debug.log'),'utf8').catch(()=>'(none)'));assert.notEqual(child.exitCode,null,'Portable launcher exits');await pause(500)}
 let {context,home}=await start();const external=[];await context.route(/^https?:/,r=>{external.push(r.request().url());return r.abort()});
 const open=async(action)=>{const ready=context.waitForEvent('page');await action();const p=await ready;await p.waitForLoadState('networkidle');return p};
 const game=await open(()=>home.click('a[href="./isopoda/"]'));await game.click('#startBtn');await game.click('#settleBtn');
 const archive=await open(()=>game.click('#catalogBtn'));const notes=await open(()=>game.click('#journalBtn'));
 const before=await notes.locator('#drawerContent').innerText();await game.locator('#actions button').first().click();await notes.waitForFunction(v=>document.querySelector('#drawerContent').innerText!==v,before);
 await home.screenshot({path:path.join(out,'portable-home.png')});await game.screenshot({path:path.join(out,'portable-game.png')});await archive.screenshot({path:path.join(out,'portable-archive.png')});await notes.screenshot({path:path.join(out,'portable-notes.png')});
 for(const lang of ['en','ja','isopod','zh']){await game.click(`[data-system-lang="${lang}"]`);await game.evaluate(()=>document.fonts.ready);assert.equal(await game.locator('html').getAttribute('data-ui-language'),lang);if(lang==='ja')assert(await game.evaluate(()=>document.fonts.check('12px PixelMplus12')))}
 const saved=await game.evaluate(()=>JSON.parse(localStorage.getItem('isopoda-fieldnotes-v1')).unlocked.slice().sort());const keys=await game.evaluate(()=>Object.keys(localStorage));assert(keys.some(k=>k.includes('fieldnotes')));
 await home.click('#systemButton');await home.click('[data-action=leave]');await home.click('#cancelAction');await fs.access(exe);await fs.access(profile);
 await home.evaluate(()=>window.umweltNative.quit());await stopped();await browser.close();
 ({context,home}=await start());const next=context.waitForEvent('page');await home.click('a[href="./isopoda/"]');const resumed=await next;await resumed.waitForSelector('#continueBtn');await resumed.click('#continueBtn');await resumed.waitForSelector('#boxFrame');
 assert.deepEqual(await resumed.evaluate(()=>JSON.parse(localStorage.getItem('isopoda-fieldnotes-v1')).unlocked.slice().sort()),saved);
 await home.click('#systemButton');await home.click('[data-action=leave]');await home.click('#confirmAction');await stopped();await browser.close();
 for(let i=0;i<120;i++){if(!await fs.stat(exe).catch(()=>null)&&!await fs.stat(profile).catch(()=>null))break;await pause(500)}
 console.log('Uninstall diagnostics:',await fs.readFile(path.join(profile,'uninstall-error.log'),'utf8').catch(()=>'(no error log)'));
 assert.equal(await fs.stat(exe).catch(()=>null),null,'Confirmed uninstall removes portable EXE');assert.equal(await fs.stat(profile).catch(()=>null),null,'Confirmed uninstall removes entire profile');
 assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
 await fs.writeFile(path.join(out,'portable-results.json'),JSON.stringify({passed:true,platform:process.platform,checks:['actual single EXE launch','Unicode and spaced path','independent archive and notes','notes live update','offline four languages','restart persistence','uninstall cancellation','complete EXE and profile deletion'],errors},null,2));
 console.log('PASS: actual portable EXE, offline languages, multi-window, persistence and full uninstall');
})().catch(e=>{console.error(e);process.exit(1)});
