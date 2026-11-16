import test from 'node:test';
import assert from 'node:assert/strict';
import {STORAGE_KEY,readState,writeState,freshState,createStateStore,toggle} from '../state.mjs';
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
test('shared state stores retain both tabs likes and legacy records through changes and deletion',()=>{
 const legacy={...freshState(),bookmarks:['historic-post'],following:[],posts:[{id:'local-draft',text:'保留的草稿',createdAt:1}]};
 const values=new Map([[STORAGE_KEY,JSON.stringify(legacy)]]);
 const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 const one=createStateStore(storage,ids),two=createStateStore(storage,ids);
 assert.equal(one.refresh(),false);
 toggle(one.state,'likes','first');assert.equal(one.save(),true);
 assert.equal(two.refresh(),true);assert.deepEqual(two.state.likes,['first']);
 toggle(two.state,'likes','second');assert.equal(two.save(),true);
 assert.equal(one.refresh(),true);assert.deepEqual(one.state.likes,['first','second']);
 toggle(one.state,'likes','first');one.save();two.refresh();
 assert.deepEqual(two.state.likes,['second']);
 const saved=JSON.parse(values.get(STORAGE_KEY));
 assert.deepEqual(saved.bookmarks,legacy.bookmarks);assert.deepEqual(saved.following,[]);assert.equal(saved.posts[0].text,'保留的草稿');
 values.delete(STORAGE_KEY);assert.equal(two.refresh(),true);assert.deepEqual(two.state,freshState());
});
test('failed state reads and quota writes preserve unsaved likes until storage recovers',()=>{
 let denied=false,full=true,value=null;
 const storage={getItem(){if(denied)throw Error('denied');return value;},setItem(key,next){if(full)throw Error('quota');value=next;}};
 const store=createStateStore(storage,ids);
 toggle(store.state,'likes','first');assert.equal(store.save(),false);
 assert.equal(store.refresh(),false);assert.deepEqual(store.state.likes,['first']);
 denied=true;assert.equal(store.refresh(),false);assert.deepEqual(store.state.likes,['first']);
 denied=false;full=false;assert.equal(store.save(),true);
 assert.deepEqual(createStateStore(storage,ids).state.likes,['first']);
 const unavailable=createStateStore(undefined,ids);toggle(unavailable.state,'likes','memory');
 assert.equal(unavailable.save(),false);assert.equal(unavailable.refresh(),false);assert.deepEqual(unavailable.state.likes,['memory']);
});
test('package feed uses real dates, valid accounts, WebP media and language fallbacks',()=>{
 for(const lang of ['zh','en','ja'])assert.deepEqual(Object.keys(copy[lang]).sort(),Object.keys(copy.zh).sort());
 assert.equal(new Set(posts.map(p=>p.id)).size,posts.length);
 for(const profile of Object.values(profiles)){assert.match(profile.handle,/^(?:[a-z0-9]+|guest-[a-z0-9][a-z0-9-]{0,57})$/);assert.match(new URL(profile.avatarImage,'https://umwelt.fivsevn.com').pathname,/\.webp$/);assert.ok(profile.name);}
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
