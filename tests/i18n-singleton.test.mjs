import test from 'node:test';
import assert from 'node:assert/strict';

test('i18n state stays shared across differently versioned ESM URLs',async()=>{
 const previous={
  localStorage:globalThis.localStorage,
  document:globalThis.document,
  window:globalThis.window,
  CustomEvent:globalThis.CustomEvent,
  state:globalThis.__ISOPODA_I18N_STATE__
 };
 const values=new Map([['isopoda-ui-language-v1','zh']]);
 globalThis.localStorage={
  getItem:key=>values.get(key)??null,
  setItem:(key,value)=>values.set(key,String(value))
 };
 globalThis.document={
  documentElement:{dataset:{},lang:''},
  title:'',
  querySelector:()=>null,
  querySelectorAll:()=>[]
 };
 globalThis.window={dispatchEvent:()=>true};
 globalThis.CustomEvent=globalThis.CustomEvent||class CustomEvent{constructor(type,init={}){this.type=type;this.detail=init.detail}};
 delete globalThis.__ISOPODA_I18N_STATE__;
 try{
  const stamp=Date.now();
  const first=await import(`../isopoda/i18n.mjs?singleton-a-${stamp}`);
  const second=await import(`../isopoda/i18n.mjs?singleton-b-${stamp}`);
  assert.notEqual(first,second,'query strings intentionally create separate module namespace objects');
  first.setLanguage('en',{announce:false});
  assert.equal(second.getLanguage(),'en');
  assert.equal(second.t('newObservation'),'New observation');
  second.setLanguage('ja',{announce:false});
  assert.equal(first.getLanguage(),'ja');
  assert.equal(first.t('newObservation'),'新しい観察');
  first.setLanguage('isopod',{announce:false});
  assert.equal(second.getLanguage(),'isopod');
  assert.equal(document.documentElement.lang,'x-isopod');
 }finally{
  if(previous.localStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=previous.localStorage;
  if(previous.document===undefined)delete globalThis.document;else globalThis.document=previous.document;
  if(previous.window===undefined)delete globalThis.window;else globalThis.window=previous.window;
  if(previous.CustomEvent===undefined)delete globalThis.CustomEvent;else globalThis.CustomEvent=previous.CustomEvent;
  if(previous.state===undefined)delete globalThis.__ISOPODA_I18N_STATE__;else globalThis.__ISOPODA_I18N_STATE__=previous.state;
 }
});
