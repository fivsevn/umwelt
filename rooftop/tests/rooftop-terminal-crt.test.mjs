import test from 'node:test';
import assert from 'node:assert/strict';
import {crtWarpNdc,crtUnwarpNdc,TERMINAL_CRT_STRENGTH} from '../3d/terminal-crt.mjs';
import {outdoorSampleNdc,createOutdoorRasterPass} from '../3d/outdoor-raster.mjs';
import {resolvePixelGrid,pixelGridSize} from '../3d/pixel-grid.mjs';
import {createRequire} from 'node:module';
const T=createRequire(import.meta.url)('../3d/vendor/three.min.js');

test('terminal curvature has a stable inverse at centre, rim and corners for pointer projection',()=>{
  for(const x of [-1,-.8,-.3,0,.4,.9,1])for(const y of [-1,-.7,0,.3,.9,1]){
    const actual=crtUnwarpNdc(crtWarpNdc([x,y]));
    assert.ok(Math.abs(actual[0]-x)<1e-9&&Math.abs(actual[1]-y)<1e-9);
  }
  assert.deepEqual(crtWarpNdc([0,0]),[0,0]);
  assert.ok(crtWarpNdc([1,1])[0]>1,'corners pull back into the tube rim');
});

test('terminal picking follows the curved source while full-screen picking stays unchanged',()=>{
  for(const [w,h] of [[941,471],[317,332]])for(const dpr of [1,2,3]){
    const grid=resolvePixelGrid(dpr);
    for(const [x,y] of [[.1,.2],[.5,.5],[.9,.8]]){
      const p=[w*x,h*y],plain=outdoorSampleNdc(p,w,h,false,grid);
      assert.deepEqual(outdoorSampleNdc(p,w,h,false,grid,false),plain);
      const warped=crtWarpNdc(plain),sample=outdoorSampleNdc(p,w,h,false,grid,true),size=pixelGridSize(w,h,grid);
      for(let axis=0;axis<2;axis++){
        assert.ok(Math.abs(sample[axis]-warped[axis])<=grid.pixelStep/size.output[axis]+1e-9);
        const pixel=(axis===0?(sample[axis]+1):(1-sample[axis]))*size.output[axis]/2/grid.pixelStep;
        assert.ok(Math.abs(pixel-Math.floor(pixel)-.5)<1e-9,'a click follows the nearest source cell displayed on the tube');
      }
    }
  }
});

test('curvature switches off in the same raster pass without replacing source buffers or camera',()=>{
  let quad, target=null;
  const renderer={domElement:{dataset:{terminalCrt:'true'},addEventListener(){},removeEventListener(){}},shadowMap:{},info:{autoReset:true,reset(){}},getRenderTarget:()=>target,setRenderTarget:t=>{target=t;},render:(s)=>{if(s.children[0]?.material?.uniforms?.rasterCrt)quad=s.children[0];}};
  const pass=createOutdoorRasterPass(T,renderer),world=new T.Scene(),camera=new T.PerspectiveCamera(40,2,.1,1000),matrix=camera.projectionMatrix.clone();
  pass.render(world,camera,800,400);
  assert.equal(quad.material.uniforms.rasterCrt.value,TERMINAL_CRT_STRENGTH);
  const source=quad.material.uniforms.rasterSource.value;
  renderer.domElement.dataset.terminalCrt='false';pass.render(world,camera,800,400);
  assert.equal(quad.material.uniforms.rasterCrt.value,0);
  assert.equal(quad.material.uniforms.rasterSource.value,source);
  assert.deepEqual(camera.projectionMatrix.elements,matrix.elements);
  pass.dispose();
});
