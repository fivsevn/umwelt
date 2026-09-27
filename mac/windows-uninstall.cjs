const path=require('node:path');
const {spawn}=require('node:child_process');
function cleanupScript(exe,profile,pid){
 const literal=value=>"'"+value.replaceAll("'","''")+"'";
 return `$ErrorActionPreference='Stop'; Write-Output 'UMWELT_READY'; while(Get-Process -Id ${pid} -ErrorAction SilentlyContinue){Start-Sleep -Milliseconds 200}; for($i=0;$i -lt 120;$i++){try{if(Test-Path -LiteralPath ${literal(exe)}){Remove-Item -LiteralPath ${literal(exe)} -Force}; if(Test-Path -LiteralPath ${literal(profile)}){Remove-Item -LiteralPath ${literal(profile)} -Recurse -Force}; break}catch{if(Test-Path -LiteralPath ${literal(profile)}){Add-Content -LiteralPath ${literal(path.join(profile,'uninstall-error.log'))} -Value $_ -ErrorAction SilentlyContinue}; Start-Sleep -Seconds 1}}`;
}
function helperPath(){return path.join(process.env.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe')}
async function scheduleWindowsUninstall(exe,profile,pid,cwd){
 const script=cleanupScript(exe,profile,pid);
 const child=spawn(helperPath(),['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{cwd,detached:true,stdio:['ignore','pipe','pipe'],windowsHide:true});
 await new Promise((resolve,reject)=>{
  let output='',errors='';const timer=setTimeout(()=>reject(Error('Windows cleanup did not become ready: '+errors)),15000);
  child.stdout.on('data',data=>{output+=data;if(output.includes('UMWELT_READY')){clearTimeout(timer);resolve()}});
  child.stderr.on('data',data=>errors+=data);
  child.once('error',error=>{clearTimeout(timer);reject(error)});
  child.once('exit',code=>{clearTimeout(timer);reject(Error('Windows cleanup exited '+code+': '+errors))});
 });
 child.stdout.destroy();child.stderr.destroy();child.unref();
}
module.exports={cleanupScript,helperPath,scheduleWindowsUninstall};
