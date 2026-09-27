import {mkdir,rm,copyFile,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareSite} from '../../.github/scripts/prepare-site.mjs';
import builder from 'electron-builder';
if(process.platform!=='win32')throw Error('Build and test this package on Windows.');
const root=fileURLToPath(new URL('../../',import.meta.url));
const output=resolve(process.argv[2]||join(root,'_windows')),stage=join(output,'app');
await rm(stage,{recursive:true,force:true});await mkdir(stage,{recursive:true});
for(const file of ['package.json','main.cjs','preload.cjs','frame.css','updates.cjs','windows-uninstall.cjs'])await copyFile(join(root,'mac',file),join(stage,file));
await prepareSite(root,join(stage,'site'));
const version=JSON.parse(await readFile(join(stage,'package.json'),'utf8')).version;
await writeFile(join(stage,'BUILD.json'),JSON.stringify({version,platform:'win32',arch:'x64',source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()},null,2));
await builder.build({projectDir:stage,publish:'never',targets:builder.Platform.WINDOWS.createTarget(['portable'],builder.Arch.x64),config:{
 appId:'com.fivsevn.umwelt',productName:'UMWELT',electronVersion:'44.4.5',
 directories:{app:stage,output:join(output,'build')},asar:true,npmRebuild:false,
 files:['**/*'],extraMetadata:{description:'UMWELT — 环世界',author:'五月七日 · fivsevn.com'},
 win:{target:'portable',icon:join(root,'mac/windows/UMWELT.ico'),signAndEditExecutable:true,signExecutable:false},
 portable:{artifactName:'UMWELT.exe',unpackDirName:false,requestExecutionLevel:'user'},publish:null
}});
const release=join(output,'release');await rm(release,{recursive:true,force:true});await mkdir(release);
await copyFile(join(output,'build/UMWELT.exe'),join(release,'UMWELT.exe'));
await copyFile(join(root,'mac/windows/README.txt'),join(release,'README.txt'));
console.log(JSON.stringify({output,version,release}));
