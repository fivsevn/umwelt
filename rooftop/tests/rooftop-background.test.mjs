import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import vm from 'node:vm';
import {HOUSE,housePoint} from '../house-structure.mjs';
import {SCENES} from '../scene.mjs';
import {invalidateShadowsAfterLoad} from '../3d/atmosphere.mjs';
import {bakedFaceBounds,BAKED_GRID_FRAGMENT} from '../3d/baked-pixel-grid.mjs';
import {loadEnvironmentBinary} from '../3d/architectural-shell.mjs';
import {BACKGROUND_COMPRESSION as compression} from '../assets/background/empty-rooftop-compression.mjs';
const directory=new URL('../assets/background/',import.meta.url);
import {BACKGROUND as manifest} from '../assets/background/empty-rooftop.mjs';
const bytes=readFileSync(new URL('empty-rooftop.bin',directory));
const encoded=readFileSync(new URL(compression.file,directory));
const arrayBuffer=value=>value.buffer.slice(value.byteOffset,value.byteOffset+value.byteLength);
test('gzip transport preserves the exact native source across compressor versions',()=>{
 assert.equal(compression.decodedSha,manifest.sha256);
 assert.equal(compression.decodedBytes,manifest.bytes);
 assert.equal(compression.bytes,encoded.byteLength);
 assert.equal(compression.sha,createHash('sha256').update(encoded).digest('hex'));
 assert.ok(gunzipSync(encoded).equals(bytes),'all geometry, instance matrices, normals and UV bytes survive transport');
 // Node/zlib versions may choose different valid DEFLATE blocks. The
 // frozen delivery SHA is exact; regeneration must preserve decoded bytes.
 const regenerated=gzipSync(bytes,{level:9,mtime:0});
 assert.ok(gunzipSync(regenerated).equals(bytes),'regeneration preserves every source byte');
 assert.ok(regenerated.byteLength<bytes.byteLength*.2,'regeneration retains the transport budget');
 assert.ok(encoded.byteLength<bytes.byteLength*.2,'compression removes at least 80% of the background mesh transfer');
});
test('native transport decodes gzip while retaining decoded and transferred byte counts',async()=>{
 const requested=[];
 const transfer=await loadEnvironmentBinary(manifest,directory,{fetchImpl:async url=>{
  requested.push(url);
  return {ok:true,arrayBuffer:async()=>arrayBuffer(encoded)};
 }});
 assert.equal(requested.length,1);assert.ok(requested[0].pathname.endsWith(compression.file));
 assert.equal(requested[0].searchParams.get('v'),compression.sha);
 assert.ok(Buffer.from(transfer.buffer).equals(bytes),'decoded source remains byte exact');
 assert.equal(transfer.transportBytes,compression.bytes);assert.equal(transfer.compressed,true);
});
test('unavailable decompression and stale compression manifests keep the raw native path',async()=>{
 for(const options of [{Decompressor:null},{compression:{...compression,decodedSha:'stale'}},{compression:{...compression,decodedBytes:1}}]){
  const requested=[];
  const transfer=await loadEnvironmentBinary(manifest,directory,{...options,fetchImpl:async url=>{
   requested.push(url);return {ok:true,arrayBuffer:async()=>arrayBuffer(bytes)};
  }});
  assert.equal(requested.length,1);assert.ok(requested[0].pathname.endsWith(manifest.binary));
  assert.equal(requested[0].searchParams.get('v'),manifest.sha256);
  assert.ok(Buffer.from(transfer.buffer).equals(bytes),'decoded source remains byte exact');
  assert.equal(transfer.transportBytes,bytes.byteLength);assert.equal(transfer.compressed,false);
 }
});
test('a missing or damaged gzip derivative falls back to intact native data',async()=>{
 for(const damaged of [false,true]){
  const requested=[],bad=Buffer.alloc(encoded.byteLength);
  const transfer=await loadEnvironmentBinary(manifest,directory,{fetchImpl:async url=>{
   requested.push(url);
   if(url.pathname.endsWith('.gz'))return {ok:damaged,arrayBuffer:async()=>arrayBuffer(bad)};
   return {ok:true,arrayBuffer:async()=>arrayBuffer(bytes)};
  }});
  assert.equal(requested.length,2);assert.ok(requested[1].pathname.endsWith(manifest.binary));
  assert.ok(Buffer.from(transfer.buffer).equals(bytes),'decoded source remains byte exact');
  assert.equal(transfer.compressed,false);assert.ok(transfer.compressionError);
  assert.equal(transfer.transportBytes,bytes.byteLength+(damaged?bad.byteLength:0));
 }
});
test('cancelled compression never starts a raw fallback transfer',async()=>{
 const controller=new AbortController(),requested=[];
 await assert.rejects(loadEnvironmentBinary(manifest,directory,{
  signal:controller.signal,fetchImpl:async(url,options)=>{
   requested.push(url);assert.equal(options.signal,controller.signal);
   controller.abort();throw controller.signal.reason;
  },
 }),{name:'AbortError'});
 assert.equal(requested.length,1);assert.ok(requested[0].pathname.endsWith(compression.file));
});
test('an already cancelled environment never starts a transfer',async()=>{
 const controller=new AbortController();controller.abort();let requests=0;
 await assert.rejects(loadEnvironmentBinary(manifest,directory,{
  signal:controller.signal,fetchImpl:async()=>{requests++;throw Error('unexpected request');},
 }),{name:'AbortError'});
 assert.equal(requests,0);
});
function floorWithPlayableTransform(name){
 const identity=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
 return manifest.parts.find(p=>p.field===name+'-floor'&&(p.mode!=='meshInstances'||
  Array.from({length:p.count},(_,i)=>i).some(i=>identity.every((v,j)=>Math.abs(bytes.readFloatLE(p.matricesOffset+i*64+j*4)-v)<.00002))));
}
test('Blender export has bounded binary sections, proper normals and a lightweight payload',()=>{
 assert.equal(manifest.sha256,createHash('sha256').update(bytes).digest('hex'));
 assert.ok(bytes.length<6500000);
 const sections=[{...manifest.cube,mode:'mesh'},...manifest.parts];
 for(const p of manifest.parts){if(p.mode==='meshInstances')sections.push({mode:'instances',offset:p.matricesOffset,count:p.count});}
 for(const p of manifest.parts)for(const g of p.assemblies||[])sections.push({mode:'instances',offset:g.sourceOffset,count:g.sourceCount},{mode:'instances',offset:g.worldOffset,count:g.worldCount});
 for(const part of sections){
  const size=part.mode==='instances'?(part.directCount??part.count)*16:part.vertices*8;
  assert.ok(part.offset+size*4<=bytes.length);
  for(let i=0;i<size;i++)assert.ok(Number.isFinite(bytes.readFloatLE(part.offset+i*4)));
  if(part.mode==='mesh')for(let i=0;i<part.vertices;i++){
   const offset=part.offset+i*32+12;
   assert.ok(Math.abs(Math.hypot(bytes.readFloatLE(offset),bytes.readFloatLE(offset+4),bytes.readFloatLE(offset+8))-1)<1e-5);
  }
 }
 for(const p of manifest.parts.filter(p=>p.mode==='instances'))assert.equal(p.count,p.directCount+(p.assemblies||[]).reduce((n,g)=>n+g.sourceCount*g.worldCount,0));
 assert.equal(manifest.row.northTerraces,6);assert.equal(manifest.row.southTerraces,6);
 assert.equal(manifest.row.pairs,3);assert.equal(manifest.row.interPairSetback,12);
 assert.deepEqual(manifest.row.centres,HOUSE.row.homes.map(p=>p[0]));
 assert.deepEqual(manifest.row.mirrors,HOUSE.row.homes.map(p=>p[1]));
 assert.equal(manifest.sixthFloor.eave,HOUSE.roof.eave);assert.equal(manifest.sixthFloor.ridge,HOUSE.roof.ridge);
});
test('unique Pixelorama floor charts cover both saved walkable contours at one texel density',()=>{
 for(const name of ['north','south']){
  const part=floorWithPlayableTransform(name);
  assert.ok(part,'the playable terrace retains a floor chart at its identity world transform');
  const points=new Set();
  for(let i=0;i<part.vertices;i++){
   const offset=part.offset+i*32;
   points.add([bytes.readFloatLE(offset),bytes.readFloatLE(offset+8)].join(','));
   assert.ok(bytes.readFloatLE(offset+4)>=-.0002 && bytes.readFloatLE(offset+4)<=.0152);
  }
  if(part.mode==='meshInstances'){const identity=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];assert.ok(Array.from({length:part.count},(_,i)=>i).some(i=>identity.every((value,j)=>Math.abs(bytes.readFloatLE(part.matricesOffset+i*64+j*4)-value)<.00002)),'the playable terrace keeps an identity world transform');}
  const center=name==='north'?[304,272]:[284,264];
  for(const [sx,sz]of SCENES[name].points){
   const p=housePoint(name,(sx-center[0])/16,(sz-center[1])/16);
   assert.ok([...points].some(value=>{const q=value.split(',').map(Number);return Math.hypot(q[0]-p[0],q[1]-p[1])<.0002;}),name+' floor retains '+p);
  }
 }
});
test('the home is between neighbours, and paired projections do not bridge the garage gaps',()=>{
 const part=floorWithPlayableTransform('north');
 const triangles=[],points=new Set();
 for(let i=0;i<part.vertices;i+=3){
  const triangle=[];
  for(let j=0;j<3;j++){
   const offset=part.offset+(i+j)*32;
   const p=[bytes.readFloatLE(offset),bytes.readFloatLE(offset+8)];
   points.add(p.join(','));triangle.push(p);
  }
  triangles.push(triangle);
 }
 assert.ok(HOUSE.row.homes.some(p=>p[0]>0)&&HOUSE.row.homes.some(p=>p[0]<0));
 for(const [cx,mirror]of HOUSE.row.homes){
  for(const x of [-2,6])assert.ok([...points].some(value=>{const q=value.split(',').map(Number);return Math.hypot(q[0]-(cx+mirror*x),q[1]+12)<.0002;}),'each home has the projecting floor bay');
 }
 const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
 for(const x of HOUSE.row.gapCentres){
  assert.ok(!triangles.some(t=>{
   const s=t.map((a,i)=>cross(a,t[(i+1)%3],[x,-5]));
   return s.every(v=>v>=0)||s.every(v=>v<=0);
  }),'the twelve-unit gap has no terrace floor bridge');
 }
 assert.equal(manifest.neighbourhood.south,'matching paired-terrace apartments');
 assert.equal(manifest.neighbourhood.skylineDirections,360);
});
test('the public export keeps near geometry and compact distant facade meshes without geographic metadata',()=>{
 const n=manifest.neighbourhood;
 assert.equal(n.homeShops,0);
 if(manifest.format!=='blender-environment-v2')return;
 assert.ok(manifest.parts.some(p=>p.style==='baked'&&p.layer==='far'));
 assert.ok(manifest.parts.some(p=>p.mode==='meshInstances'));
 assert.equal(manifest.texelMetresPerUnit.length,3);
 assert.ok(manifest.texelMetresPerUnit.every(v=>Number.isFinite(v)&&v>0&&v<1));
 const text=JSON.stringify(manifest);
 assert.doesNotMatch(text,/google\.com\/maps|api\.openstreetmap\.org|\/Users\//i);
 const visit=value=>{
  if(!value||typeof value!=='object')return;
  for(const [key,child]of Object.entries(value)){
   assert.doesNotMatch(key,/^(osm[_:]|addr:|latitude$|longitude$|geographicOrigin$|mapUrl$)/i);
   visit(child);
  }
 };
 visit(manifest);
 let triangles=0;
 for(const p of manifest.parts){
  triangles+=p.mode==='instances'?manifest.cube.vertices/3*p.count:p.vertices/3*(p.mode==='meshInstances'?p.count:1);
  if(p.style==='baked'){
   assert.ok(p.texture&&!p.texture.startsWith('/'));
   for(let i=0;i<p.vertices;i++){
    const offset=p.offset+i*32;
    for(const at of [24,28])assert.ok(bytes.readFloatLE(offset+at)>=0&&bytes.readFloatLE(offset+at)<=1,'baked facades retain standard atlas UVs');
   }
  }
 }
 assert.equal(triangles,manifest.triangles);
 let payload=bytes.length;
 for(const texture of manifest.textures){
  assert.ok(!texture.file.startsWith('/')&&!texture.file.includes('..'));
  const image=readFileSync(new URL(texture.file,directory));
  assert.equal(createHash('sha256').update(image).digest('hex'),texture.sha256);
  assert.equal(image.length,texture.bytes);
  assert.ok(texture.width>0&&texture.height>0&&texture.width<=4096&&texture.height<=4096);
  payload+=image.length;
 }
 assert.ok(payload<12000000,'web environment remains a bounded local payload');
});

test('native loader shares collection geometry, physical charts and baked facade atmosphere',async()=>{
 const context={console:{log(){},warn(){},error:console.error}};
 vm.runInNewContext(readFileSync(new URL('../3d/vendor/three.min.js',import.meta.url),'utf8'),context);
 const T=context.THREE,values=[],append=array=>{const offset=values.length*4;values.push(...array);return offset;};
 const cubeOffset=append(Array.from(new Float32Array(bytes.buffer,bytes.byteOffset+manifest.cube.offset,manifest.cube.vertices*8)));
 const triangle=[-2,0,-3,0,1,0,0,0,2,0,-3,0,1,0,20,0,-2,0,3,0,1,0,0,20],
  triangleOffset=append(triangle),
  farOffset=append([0,0,0,0,0,1,0,0,4,0,0,0,0,1,1,0,0,4,0,0,0,1,0,1]),
  identity=new T.Matrix4(), translated=new T.Matrix4().makeTranslation(8,0,12),
  collectionMatrices=append([...identity.toArray(),...translated.toArray()]),
  localMatrices=append([...identity.toArray(),...new T.Matrix4().makeTranslation(2,0,0).toArray()]),
  worldMatrix=append(new T.Matrix4().makeTranslation(30,0,40).toArray()),
  buffer=Float32Array.from(values).buffer;
 const fixture={format:'blender-environment-v2',binary:'fixture.bin',sha256:'fixture',texture:'book.png',textureSha256:'bookhash',
  textures:[{file:'book.png',width:512,height:512,bytes:10},{file:'facades.png',width:2048,height:1024,bytes:20},{file:'lights.png',width:2048,height:1024,bytes:5}],
  texelMetresPerUnit:[.27,.5357,.46],texelsPerMetre:16,cube:{offset:cubeOffset,vertices:manifest.cube.vertices},triangles:27,objects:5,
  parts:[{field:'wall',mode:'instances',offset:0,directCount:0,count:2,rect:[0,0,32,32],layer:'near',assemblies:[{sourceOffset:localMatrices,sourceCount:2,worldOffset:worldMatrix,worldCount:1}]},
   {field:'north-floor',mode:'meshInstances',offset:triangleOffset,vertices:3,matricesOffset:collectionMatrices,count:2,rect:[0,0,128,128],layer:'near'},
   {field:'distant-facades',mode:'mesh',offset:farOffset,vertices:3,style:'baked',shading:'orientation',texture:'facades.png',lampMask:'lights.png',layer:'far'}]};
 const requested=[];
 context.BACKGROUND=fixture;
 context.BACKGROUND_COMPRESSION=compression;
 context.bakedFaceBounds=bakedFaceBounds;context.BAKED_GRID_FRAGMENT=BAKED_GRID_FRAGMENT;
 let releaseMesh;
 const meshTransfer=new Promise(resolve=>{releaseMesh=resolve;});
 context.fetch=async url=>{requested.push(String(url));await meshTransfer;return {ok:true,arrayBuffer:async()=>buffer};};
 context.URL=URL;context.AbortController=AbortController;
 const lifecycle=new Map();
 context.addEventListener=(name,handler)=>lifecycle.set(name,handler);
 context.removeEventListener=(name,handler)=>{if(lifecycle.get(name)===handler)lifecycle.delete(name);};
 T.TextureLoader=class{load(url,onLoad){requested.push(url);const texture=new T.Texture();onLoad(texture);return texture;}};
 const source=readFileSync(new URL('../3d/architectural-shell.mjs',import.meta.url),'utf8')
  .replace(/^import .*?;\r?\n/gm,'').replace(/^export /gm,'')
  .replaceAll('import.meta.url',JSON.stringify(new URL('../3d/architectural-shell.mjs',import.meta.url).href));
 vm.runInNewContext(source+'\nglobalThis.loadArchitecturalShell=loadArchitecturalShell;',context);
 const parent=new T.Group(),shell=context.loadArchitecturalShell(T,parent);
 const renderer={shadowMap:{needsUpdate:false}},shadowsReady=invalidateShadowsAfterLoad(renderer,shell.ready);
 await Promise.resolve();
 assert.equal(shell.stats.loaded,false,'the fixed sky can render while the native mesh is still transferring');
 assert.equal(typeof lifecycle.get('pagehide'),'function');
 lifecycle.get('pagehide')({persisted:true});
 assert.equal(shell.stats.aborted,false,'a cached history page retains its pending transfer for restoration');
 assert.equal(parent.children[0].children.length,0);
 assert.equal(renderer.shadowMap.needsUpdate,false,'an unfinished transfer does not refresh an empty depth map');
 releaseMesh();
 await shell.ready;
 await shadowsReady;
 assert.equal(renderer.shadowMap.needsUpdate,true,'the completed native mesh invalidates the cached shadow depth');
 const root=parent.children[0],[boxes,floor,far]=root.children;
 assert.equal(boxes.material.isMeshLambertMaterial,true,'near native albedo receives directional sunlight and real shadows');
 assert.equal(floor.material.isMeshLambertMaterial,true,'floor repairs remain albedo and change light with the terrace');
 assert.equal(far.material.isMeshBasicMaterial,true,'distant Blender paintings preserve their baked lighting');
 assert.equal(boxes.count,2);assert.equal(floor.count,2);
 const matrix=new T.Matrix4();boxes.getMatrixAt(1,matrix);
 assert.deepEqual(Array.from(matrix.elements.slice(12,15)),[32,0,40]);
 floor.getMatrixAt(1,matrix);assert.deepEqual(Array.from(matrix.elements.slice(12,15)),[8,0,12]);
 assert.equal(floor.geometry.attributes.position.count,3,'two homes share one native geometry buffer');
 const shader=(library=T.ShaderLib.basic)=>({uniforms:{},vertexShader:library.vertexShader,fragmentShader:library.fragmentShader}),
  boxShader=shader(T.ShaderLib.lambert),floorShader=shader(T.ShaderLib.lambert),farShader=shader();
 boxes.material.onBeforeCompile(boxShader);floor.material.onBeforeCompile(floorShader);far.material.onBeforeCompile(farShader);
 assert.match(boxShader.vertexShader,/\.xyz \* shellMetres/);
 assert.match(boxShader.vertexShader,/\* shellTexelsPerMetre/);
 assert.equal(boxShader.uniforms.shellTexelsPerMetre.value,16,'instanced boxes use the same physical pixel density as native mesh UVs');
 assert.match(floorShader.vertexShader,/shellChart = uv/);
 assert.doesNotMatch(floorShader.vertexShader,/dot\(p, u\)/);
 assert.match(floorShader.fragmentShader,/#include <lights_fragment_begin>/,'real directional and shadow lighting survives the native atlas sampler');
 assert.match(boxShader.fragmentShader,/totalEmissiveRadiance \+=/,'lit windows preserve warm emission in dark weather');
 assert.equal(farShader.uniforms.shellTexelsPerMetre.value,16,'baked colour uses the same physical pixel density as nearby native paint');
 assert.match(farShader.fragmentShader,/texture2D\(map, shellSampleUv\)/);
 assert.match(farShader.fragmentShader,/texture2D\(shellLampMask, shellSampleUv\)/,'colour and window mask share the same recentered physical sample');
 assert.doesNotMatch(farShader.fragmentShader,/shellChart/,'baked charts use standard atlas UVs');
 // Execute the face-weight expressions from the constructed programs. These
 // GLSL branches use only normalized components, abs and scalar arithmetic.
 const faceWeight=expression=>new Function('n','abs','return ('+expression+');'),
  nearWeight=faceWeight(boxShader.fragmentShader.match(/float shellFaceLight\([\s\S]*?return ([^;]+);/)[1]),
  farWeight=faceWeight(farShader.fragmentShader.match(/float faceShade = ([^;]+);/)[1]);
 for(const [normal,expected]of [
  [[0,1,0],1],[[0,-1,0],.52],[[1,0,0],.66],[[-1,0,0],.66],
  [[0,0,1],.82],[[0,0,-1],.82],[[3,.2,1],.66],[[1,.2,3],.82],
 ]){
  const length=Math.hypot(...normal),n={x:normal[0]/length,y:normal[1]/length,z:normal[2]/length};
  assert.equal(nearWeight(n,Math.abs),expected,'near physical normal retains its authored face-light band');
  assert.equal(farWeight(n,Math.abs),expected,'far physical normal uses the same face-light band');
 }
 assert.equal((farShader.fragmentShader.match(/diffuseColor.rgb \*= faceShade/g)||[]).length,1,'pure albedo gets one consistent orientation shade');
 fixture.parts[2].shading=undefined;const litBakeShader=shader();far.material.onBeforeCompile(litBakeShader);assert.doesNotMatch(litBakeShader.fragmentShader,/faceShade/,'a shaded bake is not shaded twice');
 assert.equal(far.castShadow,false);assert.equal(floor.castShadow,true);
 assert.equal(far.material.map.colorSpace,T.SRGBColorSpace);
 assert.equal(far.material.map.flipY,false);assert.equal(floor.material.map.flipY,false);
 assert.equal(farShader.uniforms.shellLampMask.value.flipY,false);
 assert.equal(farShader.uniforms.shellLampMask.value.colorSpace,T.NoColorSpace);
 assert.doesNotMatch(boxShader.fragmentShader,/shellCut|discard/,'nearby architecture stays solid from every narrative station');
 assert.doesNotMatch(floorShader.fragmentShader,/shellCut|discard/);
 assert.equal(shell.updateCutaway,undefined);
 shell.update({night:1,wetness:.7,lamps:.8});
 assert.equal(farShader.uniforms.shellWet.value,.7);assert.equal(farShader.uniforms.shellLamps.value,.8);
 assert.ok(farShader.uniforms.shellTone.value.r<1);
 assert.equal(shell.stats.loaded,true);assert.equal(shell.stats.payloadBytes,buffer.byteLength+35);
 assert.equal(shell.stats.transportBytes,buffer.byteLength+35);assert.equal(shell.stats.compressed,false);
 assert.equal(shell.stats.layers.near.parts,2);assert.equal(shell.stats.layers.far.parts,1);
 assert.equal(shell.stats.atlases.length,3);assert.equal(requested.length,4);
 assert.equal(shell.stats.bakedSampling[0].renderTexelsPerMetre,16);
 assert.equal(shell.stats.bakedSampling[0].unsupportedTriangles,1,'an unsupported standalone atlas triangle is explicitly reported and retains original UV');
});
