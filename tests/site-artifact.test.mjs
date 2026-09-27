import test from 'node:test';
import assert from 'node:assert/strict';
import {publicFile} from '../.github/scripts/prepare-site.mjs';
test('artifact excludes maintenance files but preserves public routes, credits and fonts',()=>{
 for(const path of ['.github/scripts/prepare-site.mjs','.gitignore','docs/a.md','tests/a.mjs','isopoda/dev/a.html','isopoda/AGENTS.md','README_JA.md'])assert.equal(publicFile(path),false,path);
 for(const path of ['.nojekyll','CNAME','isopoda/credits.md','isopoda/habitat.html','isopoda/morphology/index.html','assets/fonts/font.woff2','isopoda/data/species/manifest.mjs'])assert.equal(publicFile(path),true,path);
});
import {mkdtemp,mkdir,writeFile,readFile,rm,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {prepareSite} from '../.github/scripts/prepare-site.mjs';
test('build excludes untracked files and preloads real imports without changing execution',async()=>{
 const root=await mkdtemp(join(tmpdir(),'umwelt-site-'));
 try{
  execFileSync('git',['init','-q',root]);await mkdir(join(root,'app'));
  const html='<head></head><body><script type="module" src="./app/main.mjs"></script></body>';
  await writeFile(join(root,'index.html'),html);
  await writeFile(join(root,'app/main.mjs'),"import {x} from './shared.mjs'; export {x};");
  await writeFile(join(root,'app/shared.mjs'),'export const x=1;');
  execFileSync('git',['add','.'],{cwd:root});await writeFile(join(root,'private.txt'),'local only');
  const dest=join(root,'output');await prepareSite(root,dest);
  await assert.rejects(access(join(dest,'private.txt')));
  const result=await readFile(join(dest,'index.html'),'utf8');
  assert.equal(result.replace('<link rel="modulepreload" href="./app/shared.mjs">',''),html);
  assert.equal(await readFile(join(dest,'app/main.mjs'),'utf8'),await readFile(join(root,'app/main.mjs'),'utf8'));
 }finally{await rm(root,{recursive:true,force:true})}
});
