const path=require('node:path');
const {spawn}=require('node:child_process');
function cleanupScript(exe,profile,pid){
 const literal=value=>"'"+value.replaceAll("'","''")+"'";
 return `$ErrorActionPreference='Stop'; $ProgressPreference='SilentlyContinue'; Write-Output 'UMWELT_READY'; while(Get-Process -Id ${pid} -ErrorAction SilentlyContinue){Start-Sleep -Milliseconds 200}; for($i=0;$i -lt 120;$i++){try{if(Test-Path -LiteralPath ${literal(exe)}){Remove-Item -LiteralPath ${literal(exe)} -Force}; if(Test-Path -LiteralPath ${literal(profile)}){Remove-Item -LiteralPath ${literal(profile)} -Recurse -Force}; break}catch{if(Test-Path -LiteralPath ${literal(profile)}){Add-Content -LiteralPath ${literal(path.join(profile,'uninstall-error.log'))} -Value $_ -ErrorAction SilentlyContinue}; Start-Sleep -Seconds 1}}`;
}
function helperPath(){return path.join(process.env.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe')}
async function scheduleWindowsUninstall(exe,profile,pid,cwd){
 const fs=require('node:fs');
 const ready=path.join(profile,'uninstall-ready');
 fs.rmSync(ready,{force:true});
 const literal=value=>"'"+value.replaceAll("'","''")+"'";
 const script=cleanupScript(exe,profile,pid).replace("Write-Output 'UMWELT_READY'",`[System.IO.File]::WriteAllText(${literal(ready)},'ready')`);
 // A hidden detached PowerShell can silently exit without executing its command.
 // No inherited pipes: the cleanup must outlive the application process.
 const child=spawn(helperPath(),['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{cwd,detached:false,stdio:'ignore',windowsHide:true});
 let failure;child.once('error',error=>{failure=error});
 for(let i=0;i<150;i++){
  if(fs.existsSync(ready)){child.unref();return}
  if(failure)throw failure;
  if(child.exitCode!==null)throw Error('Windows cleanup exited before readiness: '+child.exitCode);
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 child.kill();throw Error('Windows cleanup did not become ready');
}
module.exports={cleanupScript,helperPath,scheduleWindowsUninstall};
