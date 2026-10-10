import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {NATIVE_BOOK} from '../rooftop/3d/native-book.mjs';
import {PIXEL_STYLE,coarseSides} from '../rooftop/3d/native-style.mjs';
import {nativeField,createPixelMaterials} from '../rooftop/3d/native-materials.mjs';
import {RACK_GRID,rackBars,latticeSupports} from '../rooftop/3d/rack-grid.mjs';
import {supportSurfaces} from '../rooftop/3d/placement-profiles.mjs';
import {ASSETS} from '../rooftop/scene.mjs';
import {POTS,PLANTS} from '../rooftop/botany.mjs';
import {plantPaintKind} from '../rooftop/3d/plant-materials.mjs';
import {surfaceFrame,nativeCell} from '../rooftop/3d/surface-grid.mjs';
import {latheSurface} from '../rooftop/3d/model-surfaces.mjs';
import {setSurfaceEmission} from '../rooftop/3d/surface-emission.mjs';

test('native source book has one nonoverlapping 32px field grid and complete vessel interiors',()=>{
 const occupied=new Set();
 for(const f of Object.values(NATIVE_BOOK)){
  assert.equal(f.width,32);assert.equal(f.height,32);
  assert.equal(f.x%32,0);assert.equal(f.y%32,0);
  assert.ok(f.x>=0&&f.y>=0&&f.x+32<=512&&f.y+32<=512);
  const key=f.x+','+f.y;assert.ok(!occupied.has(key));occupied.add(key);
 }
 for(const p of POTS){assert.ok(NATIVE_BOOK['vessel-'+p.id]);assert.ok(NATIVE_BOOK['vessel-'+p.id+'-interior']);}
 for(const p of PLANTS)assert.ok(NATIVE_BOOK[nativeField(plantPaintKind(p))]);
 assert.equal(PIXEL_STYLE.texelsPerUnit,8);assert.equal(PIXEL_STYLE.renderScale,1);
 assert.equal(coarseSides(64),8);assert.equal(coarseSides(32,'rounded-square'),8);
});

test('one native texture waits for actual loading and reuses material instances',async()=>{
 const context={console:{warn(){}}};
 vm.runInNewContext(readFileSync(new URL('../rooftop/3d/vendor/three.min.js',import.meta.url),'utf8'),context);
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
 assert.match(shader.fragmentShader,/floor\(plane\*8\.0\+origin\)/);
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

test('metal lattice preserves visible square holes and actual scaled bearing dimensions',()=>{
 const bars=rackBars(3,1.8);
 assert.equal(bars.pitch-bars.bar,1/PIXEL_STYLE.texelsPerUnit);
 assert.equal(bars.x.length,0);assert.ok(bars.z.length>=3);
 for(let i=1;i<bars.x.length;i++)assert.equal(bars.x[i]-bars.x[i-1],RACK_GRID.pitch);
 assert.equal(latticeSupports({x:RACK_GRID.pitch/2,z:RACK_GRID.pitch/2,w:.05,d:.05},bars),false);
 assert.equal(latticeSupports({x:0,z:0,w:.05,d:.05},bars),true);
 assert.equal(latticeSupports({x:RACK_GRID.pitch/2,z:RACK_GRID.pitch/2,w:.2,d:.2},bars),true);
 const a=supportSurfaces({type:'shelf',scale:1}),b=supportSurfaces({type:'shelf',scale:2});
 assert.deepEqual(a.map(s=>s.id),b.map(s=>s.id));
 for(let i=0;i<a.length;i++){assert.equal(b[i].lattice.pitch,a[i].lattice.pitch*2);assert.equal(b[i].y,a[i].y*2);}
});

test('every folded chart uses equal physical square cells across triangle diagonals and scale',()=>{
 const context={console:{warn(){}}};
 vm.runInNewContext(readFileSync(new URL('../rooftop/3d/vendor/three.min.js',import.meta.url),'utf8'),context);
 const T=context.THREE;
 for(const tilt of [.01,.1,.2]){
  const points=[new T.Vector3(0,0,0),new T.Vector3(1,tilt,0),new T.Vector3(0,tilt,1)],frame=surfaceFrame(T,points);
  assert.ok(Math.abs(frame.n.dot(frame.u))<1e-10);
  assert.ok(Math.abs(frame.n.dot(frame.v))<1e-10);
  assert.ok(Math.abs(Math.hypot(frame.points[1][0]-frame.points[2][0],frame.points[1][1]-frame.points[2][1])-points[1].distanceTo(points[2]))<1e-10);
 }
 for(const scale of [.4,1,1.38,2]){
  const a=new T.Vector3(-.6,0,0).multiplyScalar(scale),b=new T.Vector3(.6,0,0).multiplyScalar(scale),c=new T.Vector3(.8,1.7,.6).multiplyScalar(scale),d=new T.Vector3(-.8,1.7,.6).multiplyScalar(scale);
  const frame=surfaceFrame(T,[a,b,c]),other=surfaceFrame(T,[a,c,d]);
  assert.ok(Math.abs(frame.u.dot(frame.v))<1e-10);
  for(let i=0;i<3;i++)for(let j=0;j<i;j++)assert.ok(Math.abs(Math.hypot(frame.points[i][0]-frame.points[j][0],frame.points[i][1]-frame.points[j][1])-[a,b,c][i].distanceTo([a,b,c][j]))<1e-8);
  const center=frame.u.clone().multiplyScalar(.03125).addScaledVector(frame.v,.03125);
  assert.deepEqual(nativeCell(frame,center),nativeCell(other,center));
  assert.deepEqual(nativeCell(frame,center.clone().addScaledVector(frame.u,.08)),nativeCell(frame,center));
  const next=nativeCell(frame,center.clone().addScaledVector(frame.u,.125));
  assert.equal(next[0],(nativeCell(frame,center)[0]+1)%32);
 }
 const vessel=latheSurface(T,[[.4,0,.16],[.6,1,.88],[.5,1,.135],[.35,.1,.02],[.04,.1,.02],[.04,0,.02],[.4,0,.16]],8);
 const flags=vessel.attributes.paintInterior;
 for(let i=0;i<flags.count;i+=3)assert.equal(flags.getX(i),flags.getX(i+1));
 assert.ok(Array.from(flags.array).includes(1));assert.ok(Array.from(flags.array).includes(0));
});

test('authoring audit covers every original asset and reports finite coarse mesh export',()=>{
 const audit=JSON.parse(readFileSync(new URL('../docs/art/rooftop-game/model-audit.json',import.meta.url),'utf8'));
 assert.equal(audit.assets,ASSETS.length);assert.deepEqual(audit.errors,[]);
 assert.deepEqual(new Set(audit.perAsset.map(a=>a.id)),new Set(ASSETS.map(a=>a.id)));
 for(const a of audit.perAsset)assert.ok(a.triangles>0&&Number.isInteger(a.triangles)&&a.meshes>0);
 const source=readFileSync(new URL('../rooftop/3d/scene3d.mjs',import.meta.url),'utf8');
 assert.ok(!source.includes('floorTexture()'));assert.ok(!source.includes('soilParticles('));
 assert.match(source,/if \(!style.loaded\)/);
 assert.match(source,/style\.updateAtmosphere\(\{ night: 0 \}\)/);
});

test('wooden steps cover the same three bearing surfaces with broad painted planks',async()=>{
 const {buildStand}=await import('../rooftop/3d/stand-models.mjs');
 const boards=[];
 for(const type of ['woodshelf','ladderstand']){
  boards.length=0;
  const width=type==='woodshelf'?4:54/16,depth=84/16,height=(type==='woodshelf'?34:38)/16;
  buildStand({box(...args){if(args[8]==='face-board')boards.push(args);},beam(){},shade(c){return c;},P:PIXEL_STYLE.palette}, {},width,depth,height,type);
  const surfaces=supportSurfaces({type});assert.equal(boards.length,9);
  for(let level=0;level<3;level++){
   const s=surfaces[level],parts=boards.slice(level*3,level*3+3);
   assert.equal(parts[0][4],s.w);
   for(const p of parts)assert.ok(Math.abs(p[2]+p[5]/2-s.y)<1e-9,'board top equals stable bearing height');
   const lo=parts[0][3]-parts[0][6]/2,hi=parts[2][3]+parts[2][6]/2;
   assert.ok(Math.abs(lo-(s.z-s.d/2))<1e-9);assert.ok(Math.abs(hi-(s.z+s.d/2))<1e-9);
   for(let j=1;j<parts.length;j++)assert.ok(Math.abs(parts[j][3]-parts[j-1][3]-parts[j][6])<1e-9);
  }
 }
});

test('translated, rotated and scaled rigid shell faces retain square native cells',()=>{
 const context={console:{warn(){}}};
 vm.runInNewContext(readFileSync(new URL('../rooftop/3d/vendor/three.min.js',import.meta.url),'utf8'),context);
 const T=context.THREE,geo=new T.BoxGeometry(1,1,1).toNonIndexed();geo.computeVertexNormals();
 for(const scale of [[4,.1,.65],[.28,.76,9],[2.1,.125,2.1]])for(const angle of [0,.06,Math.PI/2]){
  const transform=new T.Matrix4().compose(new T.Vector3(7.123,.38,-3.333),new T.Quaternion().setFromEuler(new T.Euler(angle,Math.PI/2,0)),new T.Vector3(...scale));
  const translation=new T.Vector3().setFromMatrixPosition(transform),p=geo.attributes.position;
  for(let i=0;i<p.count;i+=6){
   const points=Array.from({length:6},(_,j)=>new T.Vector3(p.getX(i+j),p.getY(i+j),p.getZ(i+j)).applyMatrix4(transform).sub(translation));
   const a=surfaceFrame(T,points.slice(0,3)),b=surfaceFrame(T,points.slice(3,6));
   assert.ok(a.u.distanceTo(b.u)<1e-8&&a.v.distanceTo(b.v)<1e-8,'coplanar triangles use identical axes');
   for(let j=1;j<3;j++)assert.ok(Math.abs(Math.hypot(a.points[j][0]-a.points[0][0],a.points[j][1]-a.points[0][1])-points[j].distanceTo(points[0]))<1e-8);
   const center=a.u.clone().multiplyScalar(.03125).addScaledVector(a.v,.03125);
   assert.deepEqual(nativeCell(a,center),nativeCell(b,center));
   assert.equal(nativeCell(a,center.clone().addScaledVector(a.u,.125))[0],(nativeCell(a,center)[0]+1)%32);
  }
 }
});
