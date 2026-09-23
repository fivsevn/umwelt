import {readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../../',import.meta.url));
const testsDir=fileURLToPath(new URL('../../tests/',import.meta.url));
const testFiles=(await readdir(testsDir)).filter(name=>name.endsWith('.test.mjs')).sort().map(name=>'tests/'+name);
const checks=[
 ['Node tests',['--test',...testFiles]],
 ['i18n',['isopoda/tools/check-i18n.mjs']],
 ['species contract',['isopoda/tools/validate-species.mjs']],
 ['habitat contract',['isopoda/tools/validate-habitats.mjs']],
 ['narrative contract',['isopoda/tools/validate-narrative.mjs']],
 ['morphology public structure',['isopoda/tools/check-morphology-page.mjs']],
 ['public surface',['isopoda/tools/check-public-surface.mjs']]
];

for(const [label,args] of checks){
 console.log('\n[check-all] '+label);
 const result=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0){
  console.error('[check-all] FAIL — '+label);
  process.exit(result.status??1);
 }
}
console.log('\n[check-all] OK — all structural checks passed.');
