import test from 'node:test';
import assert from 'node:assert/strict';
import {readState,writeState,freshState} from '../state.mjs';
import {profiles,posts} from '../data/feed.mjs';
import {postTime} from '../time.mjs';
import {copy} from '../locales.mjs';
const ids=Object.keys(profiles);

test('unavailable, malformed and future storage do not break the feed',()=>{
 for(const storage of [{getItem(){throw Error('denied');}},{getItem:()=>'{broken'},{getItem:()=>'{"version":99}'}])assert.deepEqual(readState(storage,ids),freshState());
 assert.equal(writeState({setItem(){throw Error('quota');}},freshState()),false);
});
test('a saved empty following list stays empty and untrusted posts cannot impersonate neighbors',()=>{
 const historic=readState({getItem:()=>JSON.stringify({version:1,following:['pill','gecko']})},ids);
 assert.deepEqual(historic.following,['pill','gecko']);
 const state=readState({getItem:()=>JSON.stringify({version:1,following:[],posts:[{id:'local-example',author:'pill',text:'<b>my post</b>',createdAt:1,image:'https://outside.invalid/image'},{id:'local-example',text:'duplicate',createdAt:2},{id:'bad"id',text:'invalid',createdAt:1}],replies:{'bark-photo':[{author:'snake',text:'my reply'},null]}})},ids);
 assert.deepEqual(state.following,[]);assert.equal(state.posts.length,1);assert.equal(state.posts[0].author,'you');assert.equal(state.posts[0].image,undefined);assert.equal(state.posts[0].text,'<b>my post</b>');assert.deepEqual(state.replies['bark-photo'],[{author:'you',text:'my reply'}]);
});
test('package feed uses real dates, valid accounts, WebP media and language fallbacks',()=>{
 for(const lang of ['zh','en','ja'])assert.deepEqual(Object.keys(copy[lang]).sort(),Object.keys(copy.zh).sort());
 assert.equal(new Set(posts.map(p=>p.id)).size,posts.length);
 for(const profile of Object.values(profiles)){assert.match(profile.handle,/^[a-z0-9]+$/);assert.match(new URL(profile.avatarImage,'https://umwelt.fivsevn.com').pathname,/\.webp$/);assert.ok(profile.name);}
 for(const [i,post] of posts.entries()){
  assert.ok(profiles[post.author]);assert.equal(post.createdAt,Date.parse(post.date));assert.ok(post.likes>=0);
  if(i)assert.ok(posts[i-1].createdAt>=post.createdAt);
  for(const lang of ['zh','en','ja'])for(const block of post.blocks[lang]){
   if(block.type==='text')assert.ok(block.text);else{assert.equal(block.type,'image');assert.match(block.src,/\.webp$/);}
  }
 }
});
test('post times age into hours, days and calendar dates in all interface languages',()=>{
 const post={createdAt:Date.parse('2026-10-19T13:00:00+08:00')};
 assert.equal(postTime(post,'zh',post.createdAt+120000),'2 分钟前');
 assert.equal(postTime(post,'en',post.createdAt+7200000),'2h ago');
 assert.equal(postTime(post,'ja',post.createdAt+86400000),'1 日前');
 assert.match(postTime(post,'zh',post.createdAt+86400000*8),/2026/);
});
