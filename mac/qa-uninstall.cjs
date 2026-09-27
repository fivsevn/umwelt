const {_electron:electron}=require(process.env.UMWELT_PLAYWRIGHT||'playwright');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
(async()=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'umwelt-uninstall-')),bundle=path.join(temp,'UMWELT.app'),profile=path.join(temp,'profile');
 execFileSync('ditto',[process.argv[2],bundle]);await fs.mkdir(profile);await fs.writeFile(path.join(profile,'test-save'),'remove-me');
 const app=await electron.launch({executablePath:path.join(bundle,'Contents/MacOS/UMWELT'),env:{...process.env,UMWELT_TEST_USER_DATA:profile}});
 const p=await app.firstWindow();await p.waitForSelector('#systemButton');
 await p.click('#systemButton');await p.click('[data-action=leave]');await p.click('#cancelAction');await fs.access(bundle);await fs.access(profile);
 await p.click('#systemButton');await p.click('[data-action=leave]');await p.click('#confirmAction');
 await new Promise(resolve=>app.process().exitCode!==null?resolve():app.process().once('exit',resolve));
 await assert.rejects(fs.access(bundle));await assert.rejects(fs.access(profile));
 console.log('PASS: cancel preserves app and data; confirmed uninstall removes the test app and entire profile.');
})().catch(e=>{console.error(e);process.exit(1)});
