import test from 'node:test';
import assert from 'node:assert/strict';
import {publicFile} from '../.github/scripts/prepare-site.mjs';
test('artifact excludes maintenance files but preserves public routes, credits and fonts',()=>{
 for(const path of ['.github/scripts/prepare-site.mjs','.gitignore','MAINTENANCE.md','docs/a.md','future-game/docs/a.md','future-game/tests/a.cjs','future-game/art/a.blend','future-game/tools/check.mjs','future-game/dev/a.html','tools/check-all.mjs','rooftop/tests/browser/rooftop.html','isopoda/tests/support/observation-fixtures.cjs','tick/tests/browser/tick-motion.cjs','ophidia/tests/browser/check-local.cjs','rooftop/art/scene.blend','ophidia/art/source.pxo','rooftop/docs/placement.md','ophidia/docs/story.md','tick/docs/interaction.md','mac/main.cjs','mac/UMWELT.icns','tests/a.mjs','isopoda/dev/a.html','isopoda/docs/animation.md','isopoda/AGENTS.md','README_JA.md'])assert.equal(publicFile(path),false,path);
 for(const path of ['.nojekyll','CNAME','shared/games.mjs','future-game/index.html','future-game/assets/a.webp','rooftop/index.html','rooftop/arrange/index.html','rooftop/room/index.html','ophidia/index.html','tick/index.html','isopoda/credits.md','isopoda/habitat.html','isopoda/morphology/index.html','assets/fonts/font.woff2','isopoda/data/species/manifest.mjs'])assert.equal(publicFile(path),true,path);
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
  await writeFile(join(root,'MAINTENANCE.md'),'Internal maintenance entry');
  await mkdir(join(root,'rooftop/docs'),{recursive:true});
  await writeFile(join(root,'rooftop/docs/placement.md'),'Internal game guide');
  await writeFile(join(root,'rooftop/index.html'),'<head></head><body>Game</body>');
  const developmentPaths=['tools/check-all.mjs','rooftop/tests/scene.test.mjs','ophidia/art/scene.blend','tick/tests/browser/motion.cjs','isopoda/tests/data.test.mjs'];
  for(const path of developmentPaths){await mkdir(join(root,path,'..'),{recursive:true});await writeFile(join(root,path),'Development only');}
  execFileSync('git',['add','.'],{cwd:root});await writeFile(join(root,'private.txt'),'local only');
  const dest=join(root,'output');await prepareSite(root,dest);
  for(const path of developmentPaths)await assert.rejects(access(join(dest,path)));
  await assert.rejects(access(join(dest,'private.txt')));
  await assert.rejects(access(join(dest,'MAINTENANCE.md')));
  await assert.rejects(access(join(dest,'rooftop/docs')));
  assert.equal(await readFile(join(dest,'rooftop/index.html'),'utf8'),'<head></head><body>Game</body>');
  const result=await readFile(join(dest,'index.html'),'utf8');
  assert.equal(result.replace('<link rel="modulepreload" href="./app/shared.mjs">',''),html);
  assert.equal(await readFile(join(dest,'app/main.mjs'),'utf8'),await readFile(join(root,'app/main.mjs'),'utf8'));
 }finally{await rm(root,{recursive:true,force:true})}
});
