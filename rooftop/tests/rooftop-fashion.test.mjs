import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {LOOKS} from '../fashion/catalog.mjs';
import {notebookEntry} from '../notebook.mjs';
import {actorSolidGeometry} from '../3d/actor-solid.mjs';
const T=createRequire(import.meta.url)('../3d/vendor/three.min.js');
const source=JSON.parse(readFileSync(new URL('../art/rooftop-actors-02/fashion/fashion-records.json',import.meta.url)));

test('all sixty wearable records have a paired accessory, notebook entry, primary reference and real portraits',()=>{
  assert.equal(LOOKS.length,60);assert.equal(new Set(LOOKS.map(l=>l.id)).size,60);
  assert.equal(LOOKS.filter(l=>l.model).length,50);
  assert.ok(LOOKS.filter(l=>l.year>=1900).length>=50);
  for(const look of LOOKS){
    const entry=notebookEntry({type:'fashion:'+look.id});
    assert.equal(entry.name,look.name);assert.equal(entry.scientific,look.original);
    assert.ok(entry.description.includes(look.date)&&entry.description.includes(look.pig));
    assert.ok(entry.comment&&entry.sources.length);
    assert.match(entry.sources[0].url,/^https:\/\//);
    for(const actor of ['person','pig'])assert.ok(existsSync(new URL(`../assets/fashion/${actor}-${look.id}.png`,import.meta.url)));
  }
});
test('saved source covers every current pair with complete joints and hand props',()=>{
  assert.deepEqual(source.assets.map(a=>a.id),LOOKS.map(l=>l.id));
  for(const asset of source.assets){
    assert.deepEqual(asset.records[0].scale,[1.16,1.16,1.16]);
    assert.equal(asset.records.filter(r=>r.type==='native-prop'&&r.model==='watering-can').length,1);
    assert.ok(asset.records.every(r=>r.parent===null||r.parent<r.id));
    const roots=asset.records.filter(r=>r.parent===null);assert.equal(roots.length,2);
  }
});
test('runtime triangulation keeps every closed clothing panel outward and nondegenerate',()=>{
  let count=0;
  for(const asset of source.assets)for(const record of asset.records.filter(r=>r.type==='solid')){
    const geometry=actorSolidGeometry(T,record.vertices,record.faces),p=geometry.attributes.position;
    let volume=0;
    for(let i=0;i<p.count;i+=3){
      const a=new T.Vector3().fromBufferAttribute(p,i),b=new T.Vector3().fromBufferAttribute(p,i+1),c=new T.Vector3().fromBufferAttribute(p,i+2);
      assert.ok(b.clone().sub(a).cross(c.clone().sub(a)).length()>1e-9,asset.id+' nondegenerate triangle');
      volume+=a.dot(b.clone().cross(c))/6;
    }
    assert.ok(volume>1e-9,asset.id+' outward solid');geometry.dispose();count++;
  }
  assert.ok(count>400);
});
