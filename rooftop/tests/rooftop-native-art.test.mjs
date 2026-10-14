import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {NATIVE_BOOK} from '../3d/native-book.mjs';
import {PIXEL_STYLE,coarseSides} from '../3d/native-style.mjs';
import {createPixelMaterials} from '../3d/native-materials.mjs';
import {RACK_GRID,rackBars,latticeSupports} from '../3d/rack-grid.mjs';
import {setSurfaceEmission} from '../3d/surface-emission.mjs';

test('shared native material book retains its nonoverlapping 32px field grid and style',()=>{
 const occupied=new Set();
 for(const f of Object.values(NATIVE_BOOK)){
  assert.equal(f.width,32);assert.equal(f.height,32);
  assert.equal(f.x%32,0);assert.equal(f.y%32,0);
  assert.ok(f.x>=0&&f.y>=0&&f.x+32<=512&&f.y+32<=512);
  const key=f.x+','+f.y;assert.ok(!occupied.has(key));occupied.add(key);
 }
 assert.equal(PIXEL_STYLE.texelsPerUnit,8);assert.equal(PIXEL_STYLE.renderScale,1);
 assert.equal(coarseSides(64),8);assert.equal(coarseSides(32,'rounded-square'),8);
});

test('one native texture waits for actual loading and reuses material instances',async()=>{
 const context={console:{warn(){}}};
 vm.runInNewContext(readFileSync(new URL('../3d/vendor/three.min.js',import.meta.url),'utf8'),context);
 let complete,requests=0;
 const T={...context.THREE,TextureLoader:class{load(url,onLoad){requests++;assert.match(url,/material-book\.png$/);complete=onLoad;return new context.THREE.Texture();}}};
 const style=createPixelMaterials(T,{value:0},{value:0});
 assert.equal(style.loaded,false);
 assert.equal(style.mat('#ffffff','wall'),style.mat('#ffffff','wall'));
 assert.equal(style.mat('#654321','weather-metal').map,style.texture());
 assert.equal(style.texture().minFilter,T.NearestFilter);assert.equal(style.texture().generateMipmaps,false);
 complete(style.texture());await style.ready;
 assert.equal(style.loaded,true);assert.equal(requests,1);
 const shader={uniforms:{},vertexShader:T.ShaderLib.basic.vertexShader,fragmentShader:T.ShaderLib.basic.fragmentShader};
 style.mat('#ffffff','wall').onBeforeCompile(shader);
 assert.ok(!shader.vertexShader.includes('paintMatrix=undefined'));
 assert.match(shader.fragmentShader,/foldedNormal/);
 assert.match(shader.fragmentShader,/floor\(plane\*actorMetricDensity\+origin\)/);
 assert.equal(shader.uniforms.actorMetricDensity.value,8,'existing non-character material density is retained');
 const actorShader={uniforms:{},vertexShader:T.ShaderLib.basic.vertexShader,fragmentShader:T.ShaderLib.basic.fragmentShader};
 style.mat('#d0ad91','skin').onBeforeCompile(actorShader);
 assert.equal(actorShader.uniforms.actorMetricDensity.value*(5.6/3),16,'actor faces share the new assets physical texel density');
 assert.match(shader.vertexShader,/instanceMatrix\*vec4\(position,1\.\)/);
 assert.ok(!shader.fragmentShader.includes('metricUv'));
 assert.ok(!shader.fragmentShader.includes('vMapUv.y<.145'));
 assert.equal((shader.fragmentShader.match(/diffuseColor\.rgb \*= vColor/g)||[]).length,1);
 assert.ok(!/pointThreshold|sin\(.*paintPoint|noise/.test(shader.fragmentShader));
 style.updateAtmosphere({night:1});assert.ok(style.tone.value.r<1);
 const lamp=style.mat('#f7d650','light'),window=style.mat('#a1aaa0','window');
 setSurfaceEmission(lamp,'#ffcd88',.8);setSurfaceEmission(window,'#ffc481',.85);
 assert.equal(lamp.emissive,undefined,'basic shader must not enter lit-material emissive uniform refresh');
 assert.equal(lamp.userData.nativeEmission.power.value,.8);assert.equal(window.userData.nativeEmission.power.value,.85);
 const legacy=new T.MeshLambertMaterial();setSurfaceEmission(legacy,'#ffc481',.85);
 assert.equal(legacy.emissiveIntensity,.85);assert.equal(legacy.emissive.getHexString(),'ffc481');
});

test('metal lattice preserves visible square holes and footprint support',()=>{
 const bars=rackBars(3,1.8);
 assert.equal(bars.pitch-bars.bar,1/PIXEL_STYLE.texelsPerUnit);
 assert.equal(bars.x.length,0);assert.ok(bars.z.length>=3);
 for(let i=1;i<bars.x.length;i++)assert.equal(bars.x[i]-bars.x[i-1],RACK_GRID.pitch);
 assert.equal(latticeSupports({x:RACK_GRID.pitch/2,z:RACK_GRID.pitch/2,w:.05,d:.05},bars),false);
 assert.equal(latticeSupports({x:0,z:0,w:.05,d:.05},bars),true);
 assert.equal(latticeSupports({x:RACK_GRID.pitch/2,z:RACK_GRID.pitch/2,w:.2,d:.2},bars),true);
});
