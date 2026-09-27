// Offline release rehearsal. This script never contacts or modifies GitHub.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve,join} from 'node:path';
const dir=resolve(process.argv[2]||'.');
const bundle=join(dir,'UMWELT.app');
execFileSync('codesign',['--verify','--deep','--strict',bundle]);
const build=JSON.parse(await readFile(join(bundle,'Contents/Resources/app/BUILD.json'),'utf8'));
const name=`UMWELT-${build.version}-mac-${build.arch}.zip`;
const bytes=await readFile(join(dir,name));
const entries=execFileSync('unzip',['-Z1',join(dir,name)],{encoding:'utf8',maxBuffer:16*1024*1024});
if(!entries.includes('UMWELT.app/Contents/MacOS/UMWELT'))throw Error('Missing app executable');
const roots=[...new Set(entries.trim().split('\n').map(name=>name.split('/')[0]))].sort();
if(JSON.stringify(roots)!==JSON.stringify(['UMWELT.app','README.txt'].sort()))throw Error('Download must contain only the app and guide: '+roots.join(', '));
await writeFile(join(dir,'SHA256SUMS.txt'),`${createHash('sha256').update(bytes).digest('hex')}  ${name}\n`);
await writeFile(join(dir,'release-preview.json'),JSON.stringify({offlineRehearsal:true,published:false,proposedRelease:{tag_name:`v${build.version}`,name:`UMWELT ${build.version} — preview`,draft:true,prerelease:true},source:build.source,assets:[name,'SHA256SUMS.txt'],limitations:['Local ad-hoc signature; not notarized','Current updater checks stable releases only; preview channel must be wired before publishing a prerelease']},null,2)+'\n');
console.log(`PASS: signed bundle, archive contents, SHA-256 and offline draft for v${build.version}. Nothing published.`);
