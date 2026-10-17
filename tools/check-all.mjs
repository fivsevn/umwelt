import {readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {GAMES} from '../shared/games.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const directories=['tests',...Object.keys(GAMES).map(id=>`${id}/tests`)];
const testFiles=(await Promise.all(directories.map(async directory=>(await readdir(new URL(directory+'/',new URL('../',import.meta.url)))).filter(name=>name.endsWith('.test.mjs')).map(name=>directory+'/'+name)))).flat().sort();
const checks=[
 ['Node tests',['--test',...testFiles]],
 ['i18n',['isopoda/tools/check-i18n.mjs']],
 ['species contract',['isopoda/tools/validate-species.mjs']],
 ['habitat contract',['isopoda/tools/validate-habitats.mjs']],
 ['narrative contract',['isopoda/tools/validate-narrative.mjs']],
 ['morphology public structure',['isopoda/tools/check-morphology-page.mjs']],
 ['public surface',['tools/check-public-surface.mjs']]
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
