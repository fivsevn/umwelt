import {GLTFLoader} from './vendor/GLTFLoader.js';

const THREE = globalThis.THREE;
const $ = selector => document.querySelector(selector);
const defaults = Object.freeze({azimuth:Math.PI*0.195,elevation:Math.PI*0.14,zoom:1});
const worldHeight = 2.40;
const renderHeight = 128;
const target = new THREE.Vector3(0, .82, 0);
const background = new THREE.Color('#eaece4');
const views = [];
const loaded = new Map();
const textureSettings = new Map();
const loader = new GLTFLoader();
let catalog = null;
let selected = -1;
let detailView = null;
let ready = false;
let framePending = false;
let overviewAzimuth = defaults.azimuth;

function immutableSnapshot(value){
  if(Array.isArray(value))return Object.freeze(value.map(immutableSnapshot));
  if(value&&typeof value==='object')return Object.freeze(Object.fromEntries(Object.entries(value).map(([key,item])=>[key,immutableSnapshot(item)])));
  return value;
}

Object.defineProperty(window,'furnitureReview',{configurable:false,get:()=>Object.freeze({
  ready,
  items:immutableSnapshot(catalog?.items||[]),
  selected:selected >= 0 ? catalog.items[selected].id : null,
  loaded:Object.freeze([...loaded.keys()]),
  pixelDensity:catalog?.texelsPerMetre ?? null,
  view:Object.freeze({azimuth:overviewAzimuth,worldHeight,target:Object.freeze(target.toArray()),detail:detailView?Object.freeze({...detailView.pose}):null}),
  textureSettings:Object.freeze([...textureSettings].map(([name,settings])=>Object.freeze({name,...settings}))),
  renderer:Object.freeze(views.map(view=>Object.freeze({item:view.item?.id??'detail',nativeWidth:view.renderer.domElement.width,nativeHeight:view.renderer.domElement.height,pixelRatio:view.renderer.getPixelRatio(),triangles:view.renderer.info.render.triangles,drawCalls:view.renderer.info.render.calls,geometries:view.renderer.info.memory.geometries,textures:view.renderer.info.memory.textures})))
})});

function dimensions(item){
  return `${Math.round(item.width*100)} × ${Math.round(item.depth*100)} × ${Math.round(item.height*100)} cm`;
}

function scheduleRender(){
  if(framePending)return;
  framePending=true;
  requestAnimationFrame(()=>{
    framePending=false;
    for(const view of views){
      if(view.isDetail&&!$('#detail').open)continue;
      if(view.dirty){resizeView(view);positionCamera(view);view.renderer.render(view.scene,view.camera);view.dirty=false;}
    }
  });
}

function createView(container,isDetail=false){
  const renderer=new THREE.WebGLRenderer({antialias:false,alpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(1);
  renderer.setClearColor(background);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.NoToneMapping;
  renderer.toneMappingExposure=1.0;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.BasicShadowMap;
  renderer.domElement.setAttribute('aria-hidden','true');
  renderer.domElement.dataset.antialias='false';
  renderer.domElement.dataset.nativeHeight=String(renderHeight);
  renderer.domElement.dataset.pixelRatio='1';
  container.appendChild(renderer.domElement);
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,40);
  scene.add(new THREE.HemisphereLight('#f4f3e9','#a7ae9f',1.0));
  const sunlight=new THREE.DirectionalLight('#fffdf4',1.20);
  sunlight.position.set(-3,6,5);
  sunlight.castShadow=true;
  sunlight.shadow.mapSize.set(256,256);
  sunlight.shadow.camera.left=-2.4;sunlight.shadow.camera.right=2.4;
  sunlight.shadow.camera.top=2.7;sunlight.shadow.camera.bottom=-2.4;
  sunlight.shadow.camera.near=.5;sunlight.shadow.camera.far=16;
  sunlight.shadow.normalBias=.018;
  sunlight.shadow.bias=-.00025;
  sunlight.target.position.set(0,.6,0);
  scene.add(sunlight,sunlight.target);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#eaece4',roughness:1,metalness:0}));
  ground.rotation.x=-Math.PI/2;
  ground.position.y=-.003;
  ground.receiveShadow=true;scene.add(ground);
  const view={renderer,scene,camera,container,isDetail,pose:{...defaults},model:null,item:null,dirty:true};
  views.push(view);
  new ResizeObserver(()=>{view.dirty=true;scheduleRender()}).observe(container);
  scheduleRender();return view;
}

function resizeView(view){
  const width=Math.max(1,view.container.clientWidth);
  const height=Math.max(1,view.container.clientHeight);
  const canvas=view.renderer.domElement;
  const renderWidth=Math.max(1,Math.round(renderHeight*width/height));
  if(canvas.width!==renderWidth||canvas.height!==renderHeight)view.renderer.setSize(renderWidth,renderHeight,false);
  const halfHeight=worldHeight/2;
  const halfWidth=halfHeight*width/height;
  view.camera.left=-halfWidth;view.camera.right=halfWidth;
  view.camera.top=halfHeight;view.camera.bottom=-halfHeight;
  view.camera.zoom=view.pose.zoom;
  view.camera.updateProjectionMatrix();
}

function positionCamera(view){
  const {azimuth,elevation}=view.pose;
  const radius=7;
  view.camera.position.set(target.x+radius*Math.cos(elevation)*Math.sin(azimuth),target.y+radius*Math.sin(elevation),target.z+radius*Math.cos(elevation)*Math.cos(azimuth));
  view.camera.lookAt(target);
  if(view.isDetail)syncDetailState();
}

function syncDetailState(){
  if(!detailView)return;
  $('#detail').dataset.azimuth=String(detailView.pose.azimuth);
  $('#detail').dataset.elevation=String(detailView.pose.elevation);
  $('#detail').dataset.zoom=String(detailView.pose.zoom);
}

function prepareModel(model,item){
  model.traverse(node=>{
    if(!node.isMesh)return;
    node.castShadow=true;node.receiveShadow=true;
    for(const material of(Array.isArray(node.material)?node.material:[node.material])){
      if(!material)continue;
      // Preview the same matte, flat-faced treatment as the authored low-poly models.
      material.metalness=0;
      material.roughness=1;
      material.flatShading=true;
      material.envMap=null;
      for(const key of['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap']){
        const texture=material[key];if(!texture)continue;
        texture.magFilter=THREE.NearestFilter;
        texture.minFilter=THREE.NearestFilter;
        texture.generateMipmaps=false;
        texture.anisotropy=1;
        texture.needsUpdate=true;
        textureSettings.set(`${item.id}:${material.name||node.name}:${key}`,{magFilter:'nearest',minFilter:'nearest',mipmaps:false,width:texture.image?.width||null,height:texture.image?.height||null});
      }
      material.needsUpdate=true;
    }
  });
}

function attachModel(view,model,item){
  if(view.model)view.scene.remove(view.model);
  view.model=model.clone(true);view.item=item;
  view.renderer.domElement.dataset.itemId=item.id;
  view.renderer.domElement.dataset.mipmaps='false';
  view.renderer.domElement.dataset.minFilter='nearest';
  view.renderer.domElement.dataset.magFilter='nearest';
  view.renderer.domElement.dataset.texelsPerMetre=String(catalog?.texelsPerMetre??'');
  view.scene.add(view.model);view.dirty=true;scheduleRender();
}

function setOverview(delta,reset=false){
  overviewAzimuth=reset?defaults.azimuth:overviewAzimuth+delta;
  for(const view of views){if(view.isDetail)continue;view.pose={...defaults,azimuth:overviewAzimuth};view.dirty=true;}
  scheduleRender();
}

function showDetail(index){
  const item=catalog.items[index];
  if(!loaded.has(item.id))return;
  selected=index;
  document.body.dataset.selected=item.id;
  $('#detail').dataset.itemId=item.id;
  $('#detail-name').textContent=item.name;
  $('#detail-dimensions').textContent=dimensions(item);
  $('#item-position').textContent=`${index+1} / ${catalog.items.length}`;
  if(!$('#detail').open)$('#detail').showModal();
  if(!detailView)detailView=createView($('#detail-view'),true);
  detailView.pose={...defaults,azimuth:overviewAzimuth};
  syncDetailState();
  attachModel(detailView,loaded.get(item.id),item);
  $('#detail-view').focus({preventScroll:true});
}

function navigateDetail(delta){
  let index=selected;
  for(let i=0;i<catalog.items.length;i++){
    index=(index+delta+catalog.items.length)%catalog.items.length;
    if(loaded.has(catalog.items[index].id)){showDetail(index);return;}
  }
}

function changeZoom(factor){
  if(!detailView)return;
  detailView.pose.zoom=THREE.MathUtils.clamp(detailView.pose.zoom*factor,.55,2.7);
  syncDetailState();
  detailView.dirty=true;scheduleRender();
}

function resetDetail(){
  if(!detailView)return;
  detailView.pose={...defaults,azimuth:overviewAzimuth};
  syncDetailState();
  detailView.dirty=true;scheduleRender();
}

function connectRotation(container,view){
  const pointers=new Map();
  let previousDistance=null;
  let moved=false;
  let suppressNextClick=false;
  let start=null;
  container.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    container.setPointerCapture(event.pointerId);
    if(pointers.size===1){moved=false;suppressNextClick=false;start={x:event.clientX,y:event.clientY};}
    if(pointers.size===2){moved=true;const values=[...pointers.values()];previousDistance=Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y);}
    container.classList.add('dragging');
  });
  container.addEventListener('pointermove',event=>{
    const previous=pointers.get(event.pointerId);if(!previous)return;
    const next={x:event.clientX,y:event.clientY};pointers.set(event.pointerId,next);
    if(pointers.size===2&&view.isDetail){
      const values=[...pointers.values()];const distance=Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y);
      if(previousDistance>0)changeZoom(distance/previousDistance);
      previousDistance=distance;return;
    }
    if(pointers.size>1)return;
    if(start&&Math.hypot(event.clientX-start.x,event.clientY-start.y)>5)moved=true;
    if(!moved)return;
    view.pose.azimuth-=(next.x-previous.x)*.009;
    view.pose.elevation=THREE.MathUtils.clamp(view.pose.elevation+(next.y-previous.y)*.006,.15,1.15);
    view.dirty=true;scheduleRender();
  });
  const end=event=>{
    pointers.delete(event.pointerId);previousDistance=null;
    if(!pointers.size){container.classList.remove('dragging');suppressNextClick=moved||event.type==='pointercancel';}
  };
  container.addEventListener('pointerup',end);
  container.addEventListener('pointercancel',end);
  return {consumeClickSuppression(){const suppress=suppressNextClick;suppressNextClick=false;return suppress;}};
}

function createCard(item,index){
  const card=document.createElement('article');card.className='item';
  card.dataset.itemId=item.id;
  const button=document.createElement('button');button.type='button';button.className='item-button';
  button.setAttribute('aria-label',`近看 ${item.name}`);
  const container=document.createElement('div');container.className='item-view';
  const status=document.createElement('span');status.className='loading-label';status.textContent='正在摆好…';
  container.append(status);button.append(container);
  const copy=document.createElement('div');copy.className='item-copy';
  const name=document.createElement('h2');name.textContent=item.name;
  const size=document.createElement('span');size.className='dimensions';size.textContent=dimensions(item);
  copy.append(name,size);card.append(button,copy);$('#catalog').append(card);
  const view=createView(container);view.item=item;
  const rotation=connectRotation(container,view);
  button.addEventListener('click',event=>{
    if(event.detail>0&&rotation.consumeClickSuppression()){event.preventDefault();return;}
    showDetail(index);
  });
  return {view,status,button};
}

$('#turn-left').addEventListener('click',()=>setOverview(-Math.PI/12));
$('#turn-right').addEventListener('click',()=>setOverview(Math.PI/12));
$('#reset-all').addEventListener('click',()=>setOverview(0,true));
$('#close-detail').addEventListener('click',()=>$('#detail').close());
$('#previous-item').addEventListener('click',()=>navigateDetail(-1));
$('#next-item').addEventListener('click',()=>navigateDetail(1));
$('#zoom-in').addEventListener('click',()=>changeZoom(1.18));
$('#zoom-out').addEventListener('click',()=>changeZoom(1/1.18));
$('#reset-detail').addEventListener('click',resetDetail);
$('#detail').addEventListener('close',()=>{selected=-1;document.body.dataset.selected='';delete $('#detail').dataset.itemId;});
$('#detail-view').addEventListener('wheel',event=>{event.preventDefault();changeZoom(Math.exp(-event.deltaY*.0014));},{passive:false});
$('#detail-view').addEventListener('keydown',event=>{
  if(!detailView)return;
  const shifts={ArrowLeft:[-.12,0],ArrowRight:[.12,0],ArrowUp:[0,.09],ArrowDown:[0,-.09]};
  if(shifts[event.key]){
    event.preventDefault();detailView.pose.azimuth+=shifts[event.key][0];
    detailView.pose.elevation=THREE.MathUtils.clamp(detailView.pose.elevation+shifts[event.key][1],.15,1.15);
    detailView.dirty=true;scheduleRender();
  }else if(event.key==='+'||event.key==='='){event.preventDefault();changeZoom(1.18)}
  else if(event.key==='-'){event.preventDefault();changeZoom(1/1.18)}
  else if(event.key==='0'||event.key==='Home'){event.preventDefault();resetDetail()}
});
document.addEventListener('keydown',event=>{
  if(!$('#detail').open)return;
  if(event.key==='['){event.preventDefault();navigateDetail(-1)}
  if(event.key===']'){event.preventDefault();navigateDetail(1)}
});

async function initialize(){
  try{
    const response=await fetch('./assets/catalog.json');
    if(!response.ok)throw new Error('目录暂时没有摆好');
    catalog=await response.json();
    if(!Array.isArray(catalog.items)||catalog.items.length!==6)throw new Error('六款花架的目录尚未完整');
    document.body.dataset.texelsPerMetre=String(catalog.texelsPerMetre);
    const cards=catalog.items.map(createCard);
    $('#page-status').textContent='';
    const results=await Promise.allSettled(catalog.items.map(async(item,index)=>{
      const gltf=await loader.loadAsync(item.file);
      prepareModel(gltf.scene,item);loaded.set(item.id,gltf.scene);
      document.body.dataset.loaded=String(loaded.size);
      document.body.dataset.loadedItems=[...loaded.keys()].join(',');
      attachModel(cards[index].view,gltf.scene,item);cards[index].status.remove();
    }));
    const failed=results.filter(result=>result.status==='rejected');
    results.forEach((result,index)=>{
      if(result.status==='fulfilled')return;
      cards[index].status.className='error-label';cards[index].status.textContent='这款花架暂时没有摆好，请刷新后再看。';
      cards[index].button.disabled=true;console.error(catalog.items[index].id,result.reason);
    });
    ready=failed.length===0;
    document.body.dataset.ready=String(ready);
    if(failed.length){$('#page-status').classList.add('error');$('#page-status').textContent=`${failed.length} 款花架暂时没有摆好。请刷新页面重试。`;}
    // The detail view is created only when opened, so it does not consume a hidden drawing surface.
    let connected=false;
    $('#detail').addEventListener('toggle',()=>{if($('#detail').open&&detailView&&!connected){connectRotation($('#detail-view'),detailView);connected=true;}});
    // showModal predates dialog toggle in older browsers; use click/keyboard opening as a fallback.
    const observer=new MutationObserver(()=>{if($('#detail').open&&detailView&&!connected){connectRotation($('#detail-view'),detailView);connected=true;}});
    observer.observe($('#detail'),{attributes:true,attributeFilter:['open']});
  }catch(error){
    $('#page-status').classList.add('error');
    $('#page-status').textContent='花架暂时没有摆好。请确认本地页面已启动，再刷新重试。';
    console.error(error);
  }
}

initialize();
