// Materialize a local Pages artifact including this uncommitted prototype.
// A disposable Git index preserves the real repository index unchanged.
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {prepareSite} from '../../../.github/scripts/prepare-site.mjs';
import {stampAssets} from '../../../.github/scripts/stamp-assets.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const temporary=mkdtempSync(join(tmpdir(),'umwelt-ophidia-pages-'));
const index=join(temporary,'review-index');
const destination=join(temporary,'site');
const original=process.env.GIT_INDEX_FILE;
const fingerprint=()=>createHash('sha256').update(readFileSync(join(root,'.git/index'))).digest('hex');
const before=fingerprint();
try {
 process.env.GIT_INDEX_FILE=index;
 execFileSync('git',['read-tree','HEAD'],{cwd:root});
 execFileSync('git',['add','--','index.html','desktop.mjs','style.css','ophidia'],{cwd:root});
 const files=await prepareSite(root,destination);
 const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const stamped=await stampAssets(destination,sha);
 const script=readFileSync(join(destination,'ophidia/game.js'),'utf8');
 for(const asset of ['cabin','snake-normal','snake-curious','snake-away','snake-tongue']){
  if(!script.includes(`./assets/${asset}.webp?v=${sha}`))throw new Error('Unstamped pose asset: '+asset);
 }
 if(fingerprint()!==before)throw new Error('Real Git index changed');
 const report={destination,files,stamped,realIndexUnchanged:true,ophidiaAssetsStamped:true,shaUsedForLocalReview:sha};
 writeFileSync(join(temporary,'pages-check.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));
}finally{
 if(original===undefined)delete process.env.GIT_INDEX_FILE;else process.env.GIT_INDEX_FILE=original;
 rmSync(index,{force:true});
}
