const {_electron:electron}=require(process.env.UMWELT_PLAYWRIGHT||'playwright');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
(async()=>{
 for(const removeData of [false,true]){
  const temp=await fs.mkdtemp(path.join(os.tmpdir(),'umwelt-uninstall-')),bundle=path.join(temp,'UMWELT.app'),profile=path.join(temp,'profile');
  execFileSync('ditto',[process.argv[2],bundle]);await fs.mkdir(profile);await fs.writeFile(path.join(profile,'test-save'),'preserve-me');
  const app=await electron.launch({executablePath:path.join(bundle,'Contents/MacOS/UMWELT'),env:{...process.env,UMWELT_TEST_USER_DATA:profile}});
  const page=await app.firstWindow();await page.waitForSelector('#systemButton');
  await app.evaluate(({dialog},removeData)=>{dialog.showMessageBox=async()=>({response:1,checkboxChecked:removeData})},removeData);
  await page.evaluate(()=>{void window.umweltNative.uninstall()});await app.process().exitCode;
  await new Promise(resolve=>app.process().exitCode!==null?resolve():app.process().once('exit',resolve));
  await assert.rejects(fs.access(bundle));
  if(removeData)await assert.rejects(fs.access(path.join(profile,'test-save')));else assert.equal(await fs.readFile(path.join(profile,'test-save'),'utf8'),'preserve-me');
  console.log('PASS actual trash uninstall; remove saved data:',removeData);
 }
})().catch(e=>{console.error(e);process.exit(1)});
