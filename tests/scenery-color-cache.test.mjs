import test from 'node:test';
import assert from 'node:assert/strict';
import {softEdge,materialInk} from '../isopoda/scenery/grammar.mjs';
const rgb=c=>{const n=parseInt(c.slice(1),16);return [n>>16&255,n>>8&255,n&255]};
const hex=values=>'#'+values.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
test('scenery color arithmetic and material cache preserve output through eviction and reuse',()=>{
 const cold=materialInk('#123456',21,37,19,'stone');
 for(let pass=0;pass<2;pass++)for(let i=0;i<5000;i++){
  const fill='#'+i.toString(16).padStart(6,'0'),shadow='#302f29',amount=[0,.22,.42,.65,1][i%5];
  const a=rgb(fill),b=rgb(shadow);
  assert.equal(softEdge(fill,shadow,amount),hex(a.map((v,j)=>v*(1-amount)+b[j]*amount)));
  materialInk(fill,i%384,i%430,i,'wood');
 }
 assert.equal(materialInk('#123456',21,37,19,'stone'),cold);
});
