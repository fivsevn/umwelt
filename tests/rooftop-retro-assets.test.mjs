import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {supportSurfaces} from '../rooftop/3d/placement-profiles.mjs';
import {RETRO_TILES,retroField} from '../rooftop/3d/retro-surfaces.mjs';

test('Blender export retains actual landing heights and native material slots',async()=>{
 const context={console};
 vm.runInNewContext(readFileSync(new URL('../rooftop/3d/vendor/three.min.js',import.meta.url),'utf8'),context);
 globalThis.THREE=context.THREE;
 const T=context.THREE,{GLTFLoader}=await import('../rooftop/3d/vendor/GLTFLoader.js');
 const bytes=readFileSync(new URL('../rooftop/assets/retro/terrace-furniture.glb',import.meta.url));
 const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const manifest=JSON.parse(readFileSync(new URL('../rooftop/assets/retro/manifest.json',import.meta.url),'utf8'));
 const roots=new Map(scene.children.map(o=>[o.name,o]));
 assert.deepEqual(new Set(roots.keys()),new Set([...Object.keys(manifest.objects),...manifest.architecture]));
 for(const [type,contract] of Object.entries(manifest.objects)){
  const root=roots.get(type);root.position.set(0,0,0);root.updateMatrixWorld(true);
  assert.deepEqual(contract.surfaces,JSON.parse(JSON.stringify(supportSurfaces({type}))),type+' stable surface ids and dimensions');
  root.traverse(node=>{
   if(!node.isMesh)return;
   assert.ok(node.geometry.attributes.position.count>0,type);
   assert.ok(retroField(node.material.name),type+' native material');
   assert.ok(Array.from(node.geometry.attributes.position.array).every(Number.isFinite),type);
  });
  for(const s of contract.surfaces){
   const ray=new T.Raycaster(new T.Vector3(s.x||0,s.y+.01,s.z||0),new T.Vector3(0,-1,0),0,.025);
   const hit=ray.intersectObject(root,true)[0];
   assert.ok(hit,type+' '+s.id+' has a real bearing face');
   assert.ok(Math.abs(hit.point.y-s.y)<1e-5,type+' '+s.id+' actual face agrees with saved placement');
  }
 }
 assert.equal(manifest.texels_per_unit,8);
 assert.equal(manifest.pixel_size_world,1/8);
 assert.deepEqual(manifest.materials,RETRO_TILES);
 const png=readFileSync(new URL('../rooftop/assets/retro/terrace-surfaces.png',import.meta.url));
 assert.equal(png.readUInt32BE(16),256);assert.equal(png.readUInt32BE(20),256);
});
