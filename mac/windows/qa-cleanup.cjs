const {cleanupScript,helperPath}=require('../windows-uninstall.cjs');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'umwelt-cleanup-'));
const dir=path.join(root,"朋友's 游戏"),profile=path.join(root,'profile');fs.mkdirSync(dir);fs.mkdirSync(profile);
const exe=path.join(dir,'UMWELT.exe');fs.writeFileSync(exe,'fixture');fs.writeFileSync(path.join(profile,'save'),'fixture');
const script=cleanupScript(exe,profile,2147483647);
const r=spawnSync(helperPath(),['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{cwd:os.tmpdir(),encoding:'utf8',timeout:15000});
console.log('Cleanup helper result',r.status,r.stdout,r.stderr,r.error?.message);assert.equal(r.status,0);assert.equal(fs.existsSync(exe),false);assert.equal(fs.existsSync(profile),false);
console.log('PASS: Windows cleanup helper handles Unicode and quoted paths');

// Exercise the actual asynchronous hand-off, including survival after its parent exits.
fs.mkdirSync(profile);fs.writeFileSync(exe,'fixture');fs.writeFileSync(path.join(profile,'save'),'fixture');
const handoff=`require(${JSON.stringify(require.resolve('../windows-uninstall.cjs'))}).scheduleWindowsUninstall(${JSON.stringify(exe)},${JSON.stringify(profile)},process.pid,${JSON.stringify(os.tmpdir())}).then(()=>process.exit(0)).catch(error=>{console.error(error);process.exit(1)})`;
const child=spawnSync(process.execPath,['-e',handoff],{encoding:'utf8',timeout:20000});
console.log('Cleanup hand-off result',child.status,child.stdout,child.stderr,child.error?.message);assert.equal(child.status,0);
(async()=>{for(let i=0;i<100&&(fs.existsSync(exe)||fs.existsSync(profile));i++)await new Promise(resolve=>setTimeout(resolve,100));assert.equal(fs.existsSync(exe),false);assert.equal(fs.existsSync(profile),false);fs.rmSync(root,{recursive:true,force:true});console.log('PASS: cleanup survives parent exit and removes the portable executable and profile')})().catch(error=>{console.error(error);process.exitCode=1});
