import {GLTFLoader} from './vendor/GLTFLoader.js';
const THREE = globalThis.THREE;
const canvas=document.querySelector('#canvas'), viewport=document.querySelector('#viewport'), status=document.querySelector('#status');
// Literal asset URLs are versioned by the existing Pages deployment script.
const urls={
 'ceramic-pot':'./assets/ceramic-pot.glb',
 'ceramic-pot-small':'./assets/ceramic-pot-small.glb',
 'ceramic-pot-medium':'./assets/ceramic-pot-medium.glb',
 'metal-rack':'./assets/metal-rack.glb',
 doorway:'./assets/doorway.glb',
 'scene-set':'./assets/scene-set.glb',
};
const descriptions={scene:'陶盆、黑色铁花架与一扇旧门。', 'ceramic-pot':'厚盆口、收底、内壁与排水孔。', 'metal-rack':'两层细杆花架，带斜撑和独立脚垫。',doorway:'灰绿木门、浅色抹灰墙与金属壁灯。'};
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.NoToneMapping;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.setClearColor(0x000000,0);
const scene=new THREE.Scene(), camera=new THREE.OrthographicCamera();
const root=new THREE.Group();scene.add(root);
const hemi=new THREE.HemisphereLight(0xf5eedc,0x84988a,2.05);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffeed6,2.15);sun.position.set(-3,7,5);sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-4;sun.shadow.camera.right=4;sun.shadow.camera.top=4;sun.shadow.camera.bottom=-4;sun.shadow.bias=-.0003;sun.shadow.normalBias=.025;
scene.add(sun);
const lantern=new THREE.PointLight(0xffc978,0,1.65,2);lantern.position.set(1.37,1.67,-.44);scene.add(lantern);
const shadow=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.12}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-.205;shadow.receiveShadow=true;scene.add(shadow);
const cache=new Map(), loader=new GLTFLoader();let atlas, shared, thin, warm;
let selected='scene',dusk=false,turning=false,yaw=.60,pitch=.47,zoom=1,target=new THREE.Vector3(-.1,1.0,0),frameCount=0,viewBounds=new THREE.Box3();
const loadModel=id=>{
 if(!cache.has(id))cache.set(id,loader.loadAsync(urls[id]).then(gltf=>{
  gltf.scene.traverse(obj=>{if(!obj.isMesh)return;obj.castShadow=true;obj.receiveShadow=true;obj.material=obj.name.includes('Warm_glass')?warm:id==='scene-set'?thin:shared;});
  return gltf.scene;
 }).catch(error=>{cache.delete(id);throw error;}));
 return cache.get(id);
};
function resize(){const {width,height}=canvas.getBoundingClientRect();renderer.setSize(width,height,false);updateCamera();}
function updateCamera(){const aspect=canvas.clientWidth/Math.max(canvas.clientHeight,1);
 camera.position.set(target.x+Math.sin(yaw)*Math.cos(pitch)*12,target.y+Math.sin(pitch)*12,target.z+Math.cos(yaw)*Math.cos(pitch)*12);
 camera.lookAt(target);camera.updateMatrixWorld();
 let extentX=0,extentY=0;
 for(const x of [viewBounds.min.x,viewBounds.max.x])for(const y of [viewBounds.min.y,viewBounds.max.y])for(const z of [viewBounds.min.z,viewBounds.max.z]){
  const corner=new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse);extentX=Math.max(extentX,Math.abs(corner.x));extentY=Math.max(extentY,Math.abs(corner.y));
 }
 const half=Math.max(extentY,extentX/aspect,.2)*1.08/zoom;
 camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.near=.01;camera.far=100;camera.updateProjectionMatrix();
}
let viewToken=0;
async function chooseView(id){const token=++viewToken;selected=id;turning=false;document.querySelector('#orbit').setAttribute('aria-pressed','false');
 document.querySelectorAll('[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===id)));
 const models=id==='scene'?await Promise.all(Object.keys(urls).map(loadModel)):[await loadModel(id)];
 if(token!==viewToken)return;
 root.clear();
 if(id==='scene'){
  const byId=Object.fromEntries(Object.keys(urls).map((key,i)=>[key,models[i]]));
  // Each pot size has its own baked shell and UVs at the shared surface
  // texel density. Instances never shrink the painted texture grid.
  const pots=[['ceramic-pot-small',-1.3,1.1,0],['ceramic-pot-small',-.7,1.1,0],['ceramic-pot-small',-1.,.3,0],['ceramic-pot',.4,0,.7],['ceramic-pot-medium',1.1,0,.8]];
  for(const [asset,x,y,z] of pots){const o=byId[asset].clone(true);o.position.set(x,y,z);root.add(o);}
  const rack=byId['metal-rack'].clone(true);rack.position.set(-1.,0,0);root.add(rack);
  root.add(byId.doorway.clone(true));root.add(byId['scene-set'].clone(true));
 }else{root.add(models[0].clone(true));}
 const bounds=new THREE.Box3().setFromObject(root);viewBounds=bounds;target=bounds.getCenter(new THREE.Vector3());
 yaw=id==='ceramic-pot'?.45:.60;pitch=id==='ceramic-pot'?.54:.47;zoom=1;
 shadow.visible=id!=='scene';shadow.position.y=bounds.min.y-.005;lantern.visible=id==='scene'||id==='doorway';
 document.querySelector('#caption').textContent=descriptions[id];document.body.dataset.view=id;
 updateCamera();
}
function lighting(){document.body.dataset.light=dusk?'dusk':'day';document.querySelector('#light').setAttribute('aria-pressed',String(dusk));document.querySelector('#light').textContent=dusk?'白天':'傍晚';
 hemi.intensity=dusk?1.05:2.05;hemi.color.set(dusk?0xd6dce9:0xf5eedc);sun.intensity=dusk?.8:2.15;sun.color.set(dusk?0xe4baa0:0xffeed6);lantern.intensity=dusk?2.1:0;
 warm.emissive.set(0xffcc72);warm.emissiveIntensity=dusk?.85:.12;
}
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>chooseView(button.dataset.view).catch(fail)));
document.querySelector('#light').addEventListener('click',()=>{dusk=!dusk;lighting();});
document.querySelector('#orbit').addEventListener('click',()=>{turning=!turning;document.querySelector('#orbit').setAttribute('aria-pressed',String(turning));});
document.querySelector('#reset').addEventListener('click',()=>chooseView(selected).catch(fail));
const pointers=new Map();let pinchDistance=0;
canvas.addEventListener('pointerdown',event=>{canvas.focus({preventScroll:true});canvas.setPointerCapture(event.pointerId);pointers.set(event.pointerId,[event.clientX,event.clientY]);turning=false;document.querySelector('#orbit').setAttribute('aria-pressed','false');});
canvas.addEventListener('pointermove',event=>{const previous=pointers.get(event.pointerId);if(!previous)return;pointers.set(event.pointerId,[event.clientX,event.clientY]);
 if(pointers.size===2){const [a,b]=[...pointers.values()];const distance=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinchDistance)zoom=THREE.MathUtils.clamp(zoom*distance/pinchDistance,.6,3.5);pinchDistance=distance;
 }else{yaw-=(event.clientX-previous[0])*.008;pitch=THREE.MathUtils.clamp(pitch+(event.clientY-previous[1])*.006,.08,1.35);}
 updateCamera();});
for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,event=>{pointers.delete(event.pointerId);pinchDistance=0;});
canvas.addEventListener('wheel',event=>{event.preventDefault();zoom=THREE.MathUtils.clamp(zoom*Math.exp(-event.deltaY*.001),.6,3.5);updateCamera();},{passive:false});
canvas.addEventListener('keydown',event=>{const k=event.key;if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(k))return;event.preventDefault();
 if(k==='ArrowLeft')yaw-=.08;if(k==='ArrowRight')yaw+=.08;if(k==='ArrowUp')pitch=Math.min(1.35,pitch+.05);if(k==='ArrowDown')pitch=Math.max(.08,pitch-.05);if(k==='+'||k==='=')zoom=Math.min(3.5,zoom*1.12);if(k==='-')zoom=Math.max(.6,zoom/1.12);updateCamera();});
function fail(error){status.hidden=false;status.textContent='样板未能载入，请刷新页面重试。';viewport.setAttribute('aria-busy','false');console.error(error);}
async function init(){atlas=await new THREE.TextureLoader().loadAsync('./assets/garden-atlas.png');atlas.colorSpace=THREE.SRGBColorSpace;atlas.flipY=false;atlas.magFilter=THREE.NearestFilter;atlas.minFilter=THREE.NearestFilter;atlas.generateMipmaps=false;
 shared=new THREE.MeshStandardMaterial({map:atlas,roughness:.95,metalness:0});thin=shared.clone();thin.side=THREE.DoubleSide;warm=shared.clone();
 await chooseView('scene');lighting();resize();status.hidden=true;viewport.setAttribute('aria-busy','false');
 new ResizeObserver(resize).observe(viewport);
 let last=performance.now();function draw(now){const elapsed=Math.min((now-last)/1000,.1);last=now;if(turning){yaw+=elapsed*.20;updateCamera();}renderer.render(scene,camera);frameCount++;requestAnimationFrame(draw);}requestAnimationFrame(draw);
 // Read-only inspection for visual QA; no connection to gameplay or storage.
 globalThis.samplePreview={get state(){return {selected,dusk,turning,yaw,pitch,zoom,frameCount,cacheSize:cache.size,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,surfaceTexelMetres:.125,texelsPerMetre:8,facetedShell:true,squareUnfoldedTexels:true,textureSize:[atlas.image.width,atlas.image.height],nearest:atlas.magFilter===THREE.NearestFilter,canvasSize:[canvas.width,canvas.height]};}};
}
init().catch(fail);
