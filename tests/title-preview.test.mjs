import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const preview=readFileSync(new URL('../isopoda/title-preview.mjs',import.meta.url),'utf8');
const page=readFileSync(new URL('../isopoda/index.html',import.meta.url),'utf8');

test('title habitat preview stays lightweight and executes before the full game',()=>{
 assert.match(preview,/\.\/scenery\/index\.mjs/);
 for(const forbidden of ['engine.mjs','species-registry.mjs','habitat.mjs','behaviors'])
  assert.equal(preview.includes(forbidden),false,forbidden);
 const previewScript=page.indexOf('src="./title-preview.mjs?v=title-preview-1"');
 const gameMatch=page.match(/src="\.\/game\.js\?v=[^"]+"/);
 const gameScript=gameMatch?.index??-1;
 assert.ok(previewScript>=0);
 assert.ok(gameScript>previewScript);
 assert.match(page,/rel="modulepreload" href="\.\/title-preview\.mjs\?v=title-preview-1"/);
 assert.match(page,/rel="modulepreload" href="\.\/scenery\/index\.mjs\?v=forest-10"/);
});
