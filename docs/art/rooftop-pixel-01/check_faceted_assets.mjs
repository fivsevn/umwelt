// Actual preview runtime loader, plus metric verification on exported triangles.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const root=process.cwd(), source=path.join(root,'docs/art/rooftop-pixel-01');
const assets=path.join(root,'rooftop/previews/pixel-01/assets');
// Use the loader's typed-array constructors in this VM too, as a browser does.
const context={console,Float32Array,Float64Array,Uint32Array,Uint16Array,Uint8Array,Int32Array,Int16Array,Int8Array};vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'rooftop/3d/vendor/three.min.js'),'utf8'),context);
globalThis.THREE=context.THREE;
const {GLTFLoader}=await import(pathToFileURL(path.join(root,'rooftop/previews/pixel-01/vendor/GLTFLoader.js')));
const {Vector2,Vector3}=globalThis.THREE;
const manifest=JSON.parse(fs.readFileSync(path.join(assets,'asset-manifest.json')));
assert.equal(manifest.version,8);assert.equal(manifest.atlas.texels_per_metre,8);
const D=8,atlas=128,results=[];let maxMetricError=0,maxGramError=0,totalSlanted=0;
for(const asset of manifest.assets){
 const blob=fs.readFileSync(path.join(assets,asset.id+'.glb'));
 assert.equal(blob.length,asset.bytes);
 const json=JSON.parse(blob.subarray(20,20+blob.readUInt32LE(12)).toString());
 assert.equal(json.images,undefined);assert.equal(json.materials,undefined);
 const gltf=await new GLTFLoader().parseAsync(blob.buffer.slice(blob.byteOffset,blob.byteOffset+blob.byteLength),'');
 gltf.scene.updateMatrixWorld(true);let triangles=0,meshes=0,slanted=0;
 gltf.scene.traverse(o=>{
  if(!o.isMesh)return;meshes++;
  assert.ok(o.scale.toArray().every(value=>value===1));
  const p=o.geometry.attributes.position,uv=o.geometry.attributes.uv,colour=o.geometry.attributes.color,idx=o.geometry.index;
  assert.ok(colour,'Missing flat face shades');
  assert.ok(idx&&p&&uv);
  for(let i=0;i<idx.count;i+=3){
   const ids=[idx.getX(i),idx.getX(i+1),idx.getX(i+2)];
   for(const j of ids){
    assert.ok(Math.abs(colour.getX(j)-colour.getX(ids[0]))<.000001,'Interpolated face shade');
    assert.ok(Math.abs(colour.getY(j)-colour.getX(j))<.000001 && Math.abs(colour.getZ(j)-colour.getX(j))<.000001);
   }
   const points=ids.map(j=>new Vector3().fromBufferAttribute(p,j).applyMatrix4(o.matrixWorld));
   const texels=ids.map(j=>new Vector2().fromBufferAttribute(uv,j).multiplyScalar(atlas));
   const a=points[1].clone().sub(points[0]),b=points[2].clone().sub(points[0]);
   const s=texels[1].clone().sub(texels[0]),t=texels[2].clone().sub(texels[0]);
   const normal=a.clone().cross(b);assert.ok(normal.length()>1e-10);
   assert.ok(Math.abs(s.x*t.y-s.y*t.x)>1e-9,'Collapsed surface UV '+asset.id+' triangle '+(i/3)+' '+JSON.stringify({points:points.map(p=>p.toArray()),texels:texels.map(p=>p.toArray()),area:normal.length()}));
   for(const [j,k] of [[0,1],[0,2],[1,2]]){
    const err=Math.abs(texels[j].distanceTo(texels[k])-D*points[j].distanceTo(points[k]));
    maxMetricError=Math.max(maxMetricError,err);
   }
   maxGramError=Math.max(maxGramError,Math.abs(s.dot(t)-D*D*a.dot(b)));
   normal.normalize();if(Math.max(Math.abs(normal.x),Math.abs(normal.y),Math.abs(normal.z))<.9999)slanted++;
   triangles++;
  }
 });
 assert.equal(triangles,asset.triangles);assert.equal(meshes,asset.meshes);
 totalSlanted+=slanted;results.push({id:asset.id,bytes:blob.length,triangles,meshes,slanted_triangles:slanted});
}
// Native cleanup can move a vertex by at most 0.01mm = 0.00008 texels.
assert.ok(maxMetricError<.0001,maxMetricError);assert.ok(maxGramError<.001,maxGramError);
assert.ok(totalSlanted>0);assert.ok(manifest.placements.every(p=>p.scale===1));
const preview=fs.readFileSync(path.join(root,'rooftop/previews/pixel-01/preview.mjs'),'utf8');
assert.ok(preview.includes('atlas.magFilter=THREE.NearestFilter'));
assert.ok(preview.includes('atlas.minFilter=THREE.NearestFilter'));
assert.ok(preview.includes('atlas.generateMipmaps=false'));
assert.ok(preview.includes('MeshBasicMaterial({map:atlas,vertexColors:true})'));
assert.ok(!preview.includes('minimumCubeMetres'));
const result={revision:8,loader:'Actual preview Three.js r160 GLTFLoader',all_six_assets_parsed:true,
 square_unfolded_texels:true,same_surface_density_on_all_exported_triangles:true,density_texels_per_metre:D,
 max_length_error_pixels:maxMetricError,max_gram_error_pixels_squared:maxGramError,
 nonzero_uv_triangle_areas:true,slanted_triangles:totalSlanted,all_instance_scales_one:true,
 no_embedded_images_or_materials:true,nearest_texture_sampling:true,flat_vertex_shades_present:true,shade_constant_on_each_triangle:true,unlit_preview_material:true,assets:results};
fs.writeFileSync(path.join(source,'facet-runtime-check.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
