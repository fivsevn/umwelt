import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {basename} from 'node:path';
import {shells,antennas,charms} from '../device/catalog.mjs';
import {APPEARANCE_STORAGE_KEY,DEFAULT_APPEARANCE,normalizeAppearance,appearanceFromURL,readAppearance,writeAppearance,setAppearanceURL} from '../device/selection.mjs';

const catalogURL=new URL('../device/catalog.mjs',import.meta.url);
const catalogAssets=[...new Set([...shells,...antennas,...charms].flatMap(item=>[item.image,item.buttonFinish].filter(Boolean)))];

test('appearance defaults are fixed and old random/session values cannot select a skin',()=>{
 assert.deepEqual(DEFAULT_APPEARANCE,{shell:'leopard',antenna:'graphite',charm:'beads'});
 const accessed=[];
 assert.deepEqual(readAppearance({getItem(key){accessed.push(key);return null;}}),DEFAULT_APPEARANCE);
 assert.deepEqual(accessed,[APPEARANCE_STORAGE_KEY]);
 assert.deepEqual(appearanceFromURL(''),DEFAULT_APPEARANCE);
});

test('manual choices round-trip and partial shared links retain the remaining choices',()=>{
 const saved={shell:'electric',antenna:'tail-loop',charm:'eggs'},values=new Map();
 const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 assert.equal(writeAppearance(storage,saved),true);
 assert.deepEqual(readAppearance(storage),saved);
 assert.deepEqual(appearanceFromURL('?shell=day',readAppearance(storage)),{...saved,shell:'day'});
 const url=setAppearanceURL(new URL('https://example.test/gsm/?post=post-1#comments'),saved);
 assert.equal(url.searchParams.get('post'),'post-1');assert.equal(url.hash,'#comments');
 assert.deepEqual(appearanceFromURL(url.search),saved);
});

test('invalid, malformed and unavailable storage safely preserve valid preferences',()=>{
 const saved={shell:'day',antenna:'crest',charm:'blue-dew'};
 assert.deepEqual(normalizeAppearance({shell:'constructor',antenna:'missing',charm:'beads'},saved),{...saved,charm:'beads'});
 for(const bad of [null,[],42,'leopard'])assert.deepEqual(normalizeAppearance(bad),DEFAULT_APPEARANCE);
 assert.deepEqual(readAppearance({getItem(){return '{bad json';}}),DEFAULT_APPEARANCE);
 const denied={getItem(){throw Error('disabled');},setItem(){throw Error('disabled');}};
 assert.deepEqual(readAppearance(denied),DEFAULT_APPEARANCE);assert.equal(writeAppearance(denied,saved),false);
 assert.deepEqual(appearanceFromURL('?shell=day&antenna=crest&charm=blue-dew'),saved);
});

test('shared link aliases normalize without losing post routing',()=>{
 for(const [alias,id] of [['mint','leopard'],['blue','tokay'],['berry','day'],['blizzard','stone'],['crested','stone'],['mossy','stone']]){
  const url=new URL(`https://example.test/gsm/?post=thread-1&shell=${alias}`);
  const choice=appearanceFromURL(url.search);assert.equal(choice.shell,id);
  setAppearanceURL(url,choice);assert.equal(url.searchParams.get('post'),'thread-1');assert.equal(url.searchParams.get('shell'),id);
 }
});

test('the workbench marker is explicit and does not leak into ordinary links',()=>{
 const url=new URL('https://example.test/gsm/?user=guest');
 setAppearanceURL(url,DEFAULT_APPEARANCE,true);assert.equal(url.searchParams.get('appearance-preview'),'1');
 setAppearanceURL(url,DEFAULT_APPEARANCE);assert.equal(url.searchParams.has('appearance-preview'),false);
 assert.equal(url.searchParams.get('user'),'guest');
});

test('the catalog contains translated stable choices and only current WebP assets',async()=>{
 assert.deepEqual([shells.length,antennas.length,charms.length],[6,5,8]);
 for(const group of [shells,antennas,charms]){
  assert.equal(new Set(group.map(item=>item.id)).size,group.length);
  for(const item of group){
   assert.match(item.id,/^[a-z][a-z0-9-]*$/);
   for(const language of ['zh','en','ja'])assert.ok(item.labels[language]?.trim(),`${item.id}: ${language}`);
  }
 }
 const files=(await readdir(new URL('../assets/device/',import.meta.url))).sort();
 assert.deepEqual(files,catalogAssets.map(relative=>basename(relative)).sort(),'the runtime asset folder has no unreferenced exports');
 let total=0;
 for(const relative of catalogAssets){
  const url=new URL(relative,catalogURL),bytes=await readFile(url);
  assert.match(relative,/\.webp$/);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
  const size=(await stat(url)).size;assert.ok(size<600_000,`${relative}: individual asset budget`);total+=size;
 }
 assert.ok(total<5_000_000,'the complete optional appearance collection stays compact');
});
