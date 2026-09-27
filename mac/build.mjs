// Run on macOS: node mac/build.mjs [output-directory]. No npm install required.
import {execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile,copyFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {homedir} from 'node:os';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareSite} from '../.github/scripts/prepare-site.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const appVersion=JSON.parse(await readFile(join(root,'mac/package.json'),'utf8')).version;
const version='44.4.5',arch=process.arch;
if(process.platform!=='darwin'||!['arm64','x64'].includes(arch))throw Error('Build on an Apple Silicon or Intel Mac.');
const output=resolve(process.argv[2]||join(root,'_mac')),cache=join(homedir(),'.cache/umwelt-electron');
const archive=`electron-v${version}-darwin-${arch}.zip`,base=`https://github.com/electron/electron/releases/download/v${version}`;
await mkdir(cache,{recursive:true});await mkdir(output,{recursive:true});
async function download(name){const file=join(cache,name);try{await readFile(file)}catch{execFileSync('curl',['-fL',`${base}/${name}`,'-o',file],{stdio:'inherit'})}return file}
const zip=await download(archive),sums=await download('SHASUMS256.txt');
const expected=(await readFile(sums,'utf8')).split('\n').find(line=>line.trim().split(/\s+/)[1]?.replace(/^\*/, '')===archive)?.split(/\s+/)[0];
if(!expected||createHash('sha256').update(await readFile(zip)).digest('hex')!==expected)throw Error('Electron archive checksum mismatch.');
const stage=join(output,'staging');await rm(stage,{recursive:true,force:true});await mkdir(stage);
execFileSync('ditto',['-x','-k',zip,stage]);
const bundle=join(output,'UMWELT.app');await rm(bundle,{recursive:true,force:true});
execFileSync('mv',[join(stage,'Electron.app'),bundle]);
execFileSync('mv',[join(bundle,'Contents/MacOS/Electron'),join(bundle,'Contents/MacOS/UMWELT')]);
const contents=join(bundle,'Contents'),resources=join(contents,'Resources'),application=join(resources,'app');
await copyFile(join(root,'mac/UMWELT.icns'),join(resources,'electron.icns'));
await rm(join(resources,'default_app.asar'),{force:true});await mkdir(application);
for(const name of ['package.json','main.cjs','preload.cjs','frame.css','updates.cjs'])await copyFile(join(root,'mac',name),join(application,name));
await prepareSite(root,join(application,'site'));
execFileSync('/usr/libexec/PlistBuddy',['-c','Set :CFBundleIdentifier com.fivsevn.umwelt',join(contents,'Info.plist')]);
for(const [key,value] of [['CFBundleExecutable','UMWELT'],['CFBundleName','UMWELT'],['CFBundleDisplayName','UMWELT'],['CFBundleShortVersionString',appVersion],['CFBundleVersion',appVersion],['NSHumanReadableCopyright','五月七日 · fivsevn.com']]){
 try{execFileSync('/usr/libexec/PlistBuddy',['-c',`Set :${key} ${value}`,join(contents,'Info.plist')],{stdio:'pipe'})}catch{execFileSync('/usr/libexec/PlistBuddy',['-c',`Add :${key} string ${value}`,join(contents,'Info.plist')])}
}
await writeFile(join(application,'BUILD.json'),JSON.stringify({version:appVersion,electron:version,arch,source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),built:new Date().toISOString()},null,2));
// Finder/iCloud metadata on copied source files must not enter the signed bundle.
for(const attribute of ['com.apple.FinderInfo','com.apple.ResourceFork']){
 try{execFileSync('xattr',['-dr',attribute,bundle],{stdio:'ignore'})}catch{}
}
execFileSync('codesign',['--force','--deep','--sign','-',bundle],{stdio:'inherit'});
const release=join(output,`UMWELT-${appVersion}-mac-${arch}.zip`);await rm(release,{force:true});
// The download contains exactly the application and a short guide at its root.
await rm(stage,{recursive:true,force:true});await mkdir(stage);
await copyFile(join(root,'mac/使用说明.txt'),join(output,'README.txt'));
execFileSync('ditto',[bundle,join(stage,'UMWELT.app')]);
await copyFile(join(output,'README.txt'),join(stage,'README.txt'));
execFileSync('ditto',['-c','-k','--norsrc',stage,release]);
await rm(stage,{recursive:true,force:true});console.log(JSON.stringify({bundle,release},null,2));
