const {chromium,_electron}=require(process.env.UMWELT_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const props=['width','height','backgroundColor','color','borderTopColor','borderRightColor','borderBottomColor','borderLeftColor','borderTopWidth','borderRadius','boxShadow','transform'];
async function style(p,s){return p.locator(s).evaluate((e,keys)=>Object.fromEntries(keys.map(k=>[k,getComputedStyle(e)[k]])),props)}
async function pressed(p,s){const b=await p.locator(s).boundingBox();await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();const r=await style(p,s);await p.mouse.move(0,0);await p.mouse.up();return r}
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true}),web=await browser.newPage({viewport:{width:720,height:700}});
 await web.goto('http://127.0.0.1:8767/isopoda/');await web.waitForSelector('#titleCard .launch-close');const expected=await style(web,'#titleCard .launch-close'),down=await pressed(web,'#titleCard .launch-close');assert.equal(expected.boxShadow,'rgb(27, 42, 32) 1px 1px 0px 0px');assert.equal(down.boxShadow,'none');
 await web.goto('http://127.0.0.1:8767/');assert.deepEqual(await style(web,'#closeWelcome'),expected);assert.deepEqual(await pressed(web,'#closeWelcome'),down);await web.screenshot({path:'/tmp/umwelt-multi-build/qa/web-chrome.png'});
 const profile=await fs.mkdtemp(path.join(os.tmpdir(),'umwelt-chrome-'));const app=await _electron.launch({executablePath:path.join(process.argv[2],'Contents/MacOS/UMWELT'),env:{...process.env,UMWELT_TEST_USER_DATA:profile}});const home=await app.firstWindow();await home.waitForSelector('#nativeTitlebar');await home.waitForTimeout(500);
 for(const s of ['#nativeClose','#nativeMinimize','#nativeMaximize','#nativeAbout','#closeWelcome'])assert.deepEqual(await style(home,s),expected,s);
 // Hold, inspect, then drag off: no close/minimize action should fire.
 assert.deepEqual(await pressed(home,'#nativeClose'),down);
 await home.screenshot({path:'/tmp/umwelt-multi-build/qa/native-chrome.png'});
 const future=app.waitForEvent('window');await home.click('a[href="./isopoda/"]');const game=await future;await game.waitForSelector('#titleCard .launch-close');assert.deepEqual(await style(game,'#titleCard .launch-close'),expected);
 await game.click('#startBtn');await game.click('#settleBtn');for(const s of ['#windowClose','#windowMinimize','#windowMaximize'])assert.deepEqual(await style(game,s),expected,s);
 const archiveFuture=app.waitForEvent('window');await game.click('#catalogBtn');const archive=await archiveFuture;await archive.waitForSelector('#closeDrawer');assert.deepEqual(await style(archive,'#closeDrawer'),expected);
 await app.close();await browser.close();console.log('PASS web/native title buttons: size, palette, bevel, shadow, pressed offset; homepage, selector, observation, archive.');
})().catch(e=>{console.error(e);process.exit(1)});
