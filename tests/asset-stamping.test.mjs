import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {stampAssets} from '../.github/scripts/stamp-assets.mjs';
test('deployment versions the complete graph, preserves routes and is idempotent',async()=>{
 const root=await mkdtemp(join(tmpdir(),'umwelt-assets-')),sha='a'.repeat(40);
 try{
  await mkdir(join(root,'sub'));
  const files={
   'index.html':'<a href="/isopoda/">game</a><link href="./style.css?v=old"><script src="./sub/app.mjs"></script>',
   'style.css':"a{background:url('./image.png#pixel')}@font-face{src:url(font.woff2)}",
   'sub/app.mjs':"import '../shared.mjs'; export {x} from '../shared.mjs?mode=test#x'; const f='credits.md'; const u='https://example.com/a.js';",
   'shared.mjs':'export const x=1;', 'sub/credits.md':'unchanged copy','image.png':'bytes','font.woff2':'bytes'
  };
  for(const [p,s] of Object.entries(files))await writeFile(join(root,p),s);
  await stampAssets(root,sha);
  const first=await readFile(join(root,'sub/app.mjs'),'utf8');
  assert.ok(first.includes(`../shared.mjs?v=${sha}`));
  assert.ok(first.includes(`../shared.mjs?mode=test&v=${sha}#x`));
  assert.ok(first.includes(`credits.md?v=${sha}`));
  assert.ok(first.includes('https://example.com/a.js'));
  assert.ok((await readFile(join(root,'index.html'),'utf8')).includes('href="/isopoda/"'));
  assert.ok((await readFile(join(root,'style.css'),'utf8')).includes(`font.woff2?v=${sha}`));
  assert.equal(await readFile(join(root,'sub/credits.md'),'utf8'),'unchanged copy');
  await stampAssets(root,sha);assert.equal(await readFile(join(root,'sub/app.mjs'),'utf8'),first);
  await writeFile(join(root,'bad.mjs'),"import './missing.mjs';");
  await assert.rejects(stampAssets(root,sha),/Missing asset/);
  await assert.rejects(stampAssets(root,'manual-version'),/full commit SHA/);
 }finally{await rm(root,{recursive:true,force:true})}
});
