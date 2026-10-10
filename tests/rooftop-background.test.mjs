import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {HOUSE,housePoint} from '../rooftop/house-structure.mjs';
import {SCENES} from '../rooftop/scene.mjs';
const directory=new URL('../rooftop/assets/background/',import.meta.url);
import {BACKGROUND as manifest} from '../rooftop/assets/background/empty-rooftop.mjs';
const bytes=readFileSync(new URL('empty-rooftop.bin',directory));
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
  const part=manifest.parts.find(p=>p.field===name+'-floor');
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
 const part=manifest.parts.find(p=>p.field==='north-floor');
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
 assert.doesNotMatch(text,/google\.com\/maps|api\.openstreetmap\.org|\/Users\/|geographicOrigin|mapUrl|latitude|longitude/i);
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
 vm.runInNewContext(readFileSync(new URL('../rooftop/3d/vendor/three.min.js',import.meta.url),'utf8'),context);
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
  texelMetresPerUnit:[.27,.5357,.46],cube:{offset:cubeOffset,vertices:manifest.cube.vertices},triangles:27,objects:5,
  parts:[{field:'wall',mode:'instances',offset:0,directCount:0,count:2,rect:[0,0,32,32],layer:'near',assemblies:[{sourceOffset:localMatrices,sourceCount:2,worldOffset:worldMatrix,worldCount:1}]},
   {field:'north-floor',mode:'meshInstances',offset:triangleOffset,vertices:3,matricesOffset:collectionMatrices,count:2,rect:[0,0,128,128],layer:'near'},
   {field:'distant-facades',mode:'mesh',offset:farOffset,vertices:3,style:'baked',shading:'orientation',texture:'facades.png',lampMask:'lights.png',layer:'far'}]};
 const requested=[];
 context.BACKGROUND=fixture;
 context.fetch=async url=>{requested.push(String(url));return {ok:true,arrayBuffer:async()=>buffer};};
 context.URL=URL;
 T.TextureLoader=class{load(url,onLoad){requested.push(url);const texture=new T.Texture();onLoad(texture);return texture;}};
 const source=readFileSync(new URL('../rooftop/3d/architectural-shell.mjs',import.meta.url),'utf8')
  .replace(/^import .*?;\n/gm,'').replace('export function','function')
  .replaceAll('import.meta.url',JSON.stringify(new URL('../rooftop/3d/architectural-shell.mjs',import.meta.url).href));
 vm.runInNewContext(source+'\nglobalThis.loadArchitecturalShell=loadArchitecturalShell;',context);
 const parent=new T.Group(),shell=context.loadArchitecturalShell(T,parent);
 await shell.ready;
 const root=parent.children[0],[boxes,floor,far]=root.children;
 assert.equal(boxes.count,2);assert.equal(floor.count,2);
 const matrix=new T.Matrix4();boxes.getMatrixAt(1,matrix);
 assert.deepEqual(Array.from(matrix.elements.slice(12,15)),[32,0,40]);
 floor.getMatrixAt(1,matrix);assert.deepEqual(Array.from(matrix.elements.slice(12,15)),[8,0,12]);
 assert.equal(floor.geometry.attributes.position.count,3,'two homes share one native geometry buffer');
 const shader=()=>({uniforms:{},vertexShader:T.ShaderLib.basic.vertexShader,fragmentShader:T.ShaderLib.basic.fragmentShader}),
  boxShader=shader(),floorShader=shader(),farShader=shader();
 boxes.material.onBeforeCompile(boxShader);floor.material.onBeforeCompile(floorShader);far.material.onBeforeCompile(farShader);
 assert.match(boxShader.vertexShader,/\.xyz \* shellMetres/);
 assert.match(floorShader.vertexShader,/shellChart = uv/);
 assert.doesNotMatch(floorShader.vertexShader,/dot\(p, u\)/);
 assert.match(farShader.fragmentShader,/#include <map_fragment>/);
 assert.match(farShader.fragmentShader,/texture2D\(shellLampMask, vMapUv\)/);
 assert.doesNotMatch(farShader.fragmentShader,/shellChart/,'baked charts use standard atlas UVs');
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
 assert.equal(shell.stats.layers.near.parts,2);assert.equal(shell.stats.layers.far.parts,1);
 assert.equal(shell.stats.atlases.length,3);assert.equal(requested.length,4);
});
