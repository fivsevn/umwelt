import {GLTFLoader} from '../../../../rooftop/3d/vendor/gltf/GLTFLoader.js';
import {createOutdoorRasterPass} from '/rooftop/3d/outdoor-raster.mjs';
import {resolvePixelGrid} from '/rooftop/3d/pixel-grid.mjs';
import {loadArchitecturalShell} from '/rooftop/3d/architectural-shell.mjs';
import {BACKGROUND} from '/rooftop/assets/background/empty-rooftop.mjs';
import {prepareStructuralVisibility,updateStructuralVisibility,disposeStructuralVisibility} from '../../../../rooftop/3d/native-structural-visibility.mjs';
const T=globalThis.THREE,$=s=>document.querySelector(s);
const runtimeAssets=new URL('../../../../rooftop/assets/items/',import.meta.url);
const names=['架子','桌椅与居室','栽培与盛放','日用与照明','植物','收藏','枪械','兵器'];
const catalog=await fetch('assets/catalog.json').then(r=>{if(!r.ok)throw Error('物品目录暂不可用');return r.json()});
let category='全部',selected=null,shown=[],mode='source',onTable=false,lidOpen=false,pose={azimuth:.61,elevation:.52,zoom:1};
const models=new Map(),atlases=new Map(),thumbs=new Map(),errors=new Map();
const loader=new GLTFLoader(),textureLoader=new T.TextureLoader();
document.body.dataset.itemCount=String(catalog.items.length);document.body.dataset.texelsPerMetre=String(catalog.texelsPerMetre);
const placer=p=>p==='floor'?'落地':'落地／台面';
function dimensions(item){return `${Math.round(item.width*100)} × ${Math.round(item.depth*100)} × ${Math.round(item.height*100)} cm`}
function atlas(family){
 if(!atlases.has(family))atlases.set(family,new Promise((res,rej)=>textureLoader.load(new URL(`${family}-atlas.png`,runtimeAssets).href,texture=>{
  texture.colorSpace=T.SRGBColorSpace;texture.flipY=false;texture.minFilter=texture.magFilter=T.NearestFilter;texture.generateMipmaps=false;res(texture);
 },undefined,rej)));
 return atlases.get(family);
}
async function model(item){
 if(!models.has(item.id))models.set(item.id,(async()=>{
  const [gltf,tex]=await Promise.all([loader.loadAsync(new URL(item.file.replace(/^assets\//,''),runtimeAssets).href),atlas(item.family)]),oldTextures=new Set(),oldMats=new Set(),replacements=new Map();
  gltf.scene.traverse(node=>{
   if(!node.isMesh)return;node.castShadow=node.receiveShadow=true;
   const transform=old=>{
    if(replacements.has(old))return replacements.get(old);
    let next;
    if(old.transparent){
     if(old.map)oldTextures.add(old.map);
     next=old;next.map=tex;next.depthWrite=false;next.side=T.DoubleSide;next.needsUpdate=true;
    }
    else{
     if(old.map)oldTextures.add(old.map);
     next=new T.MeshLambertMaterial({map:tex,color:old.color,flatShading:true,side:old.side});
     if(old.emissive)next.emissive.copy(old.emissive);oldMats.add(old);
    }
    replacements.set(old,next);return next;
   };
   node.material=Array.isArray(node.material)?node.material.map(transform):transform(node.material);
  });
  for(const old of oldTextures){old.dispose();old.image?.close?.()}
  for(const old of oldMats)old.dispose();
  document.body.dataset.loadedCount=String([...models.values()].length);return gltf.scene;
 })().catch(error=>{errors.set(item.id,error.message);document.body.dataset.errors=JSON.stringify([...errors]);throw error}));
 return models.get(item.id);
}
function newRenderer(){
 const r=new T.WebGLRenderer({antialias:false,alpha:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
 r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.NoToneMapping;r.setClearColor('#e4e6dc');r.shadowMap.enabled=true;r.shadowMap.type=T.BasicShadowMap;
 return r;
}
function lighting(scene,wide=false){
 scene.add(new T.HemisphereLight('#f3f2e9','#a0aaa4',2));
 const sun=new T.DirectionalLight('#fff8e7',1.45);sun.position.set(-5,8,-4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
 Object.assign(sun.shadow.camera,{left:wide?-12:-3,right:wide?12:3,top:wide?12:3,bottom:wide?-12:-3,near:.1,far:50});sun.shadow.bias=-.0002;sun.shadow.normalBias=.007;scene.add(sun,sun.target);return sun;
}
function ground(scene){const mesh=new T.Mesh(new T.PlaneGeometry(50,50),new T.MeshLambertMaterial({color:'#e4e6dc'}));mesh.rotation.x=-Math.PI/2;mesh.position.y=-.003;mesh.receiveShadow=true;scene.add(mesh);return mesh;}
function cameraPose(camera,item,width,height,anchor=new T.Vector3(),sameScale=false){
 const aspect=width/height,points=[];
 for(const x of [item.boundsMin[0],item.boundsMax[0]])for(const y of [item.boundsMin[2],item.boundsMax[2]])for(const z of [-item.boundsMax[1],-item.boundsMin[1]])points.push(new T.Vector3(sameScale?-x:x,y,sameScale?-z:z).add(anchor));
 const target=new T.Box3().setFromPoints(points).getCenter(new T.Vector3());
 const r=8,e=pose.elevation,a=pose.azimuth;
 camera.position.set(target.x+r*Math.cos(e)*Math.sin(a),target.y+r*Math.sin(e),target.z+(sameScale?-1:1)*r*Math.cos(e)*Math.cos(a));camera.lookAt(target);
 camera.updateMatrixWorld(true);const projected=points.map(p=>p.clone().applyMatrix4(camera.matrixWorldInverse));
 const xs=projected.map(p=>p.x),ys=projected.map(p=>p.y);
 const span=Math.max(sameScale?2.4:.36,(Math.max(...ys)-Math.min(...ys))*1.22,(Math.max(...xs)-Math.min(...xs))/aspect*1.22);
 camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.zoom=pose.zoom;camera.updateProjectionMatrix();
 return {span,target:target.toArray()};
}
const thumbRenderer=newRenderer(),thumbScene=new T.Scene(),thumbCamera=new T.OrthographicCamera(-1,1,1,-1,.01,100),thumbRaster=createOutdoorRasterPass(T,thumbRenderer);
lighting(thumbScene);ground(thumbScene);let thumbObject=null,thumbBusy=false,queue=[];
async function drawThumb(item,width,height){
 const base=await model(item);if(thumbObject){thumbScene.remove(thumbObject);disposeStructuralVisibility(thumbObject)}thumbObject=base.clone(true);prepareStructuralVisibility(T,thumbObject);thumbScene.add(thumbObject);
 const grid=resolvePixelGrid(devicePixelRatio);thumbRenderer.setPixelRatio(grid.pixelRatio);thumbRenderer.setSize(width,height,false);
 const saved=pose;pose={azimuth:.61,elevation:.52,zoom:1};cameraPose(thumbCamera,item,width,height);pose=saved;
 updateStructuralVisibility(thumbObject,{worldPerSample:(thumbCamera.top-thumbCamera.bottom)/(Math.ceil(thumbRenderer.domElement.height/grid.pixelStep)*thumbCamera.zoom)});
 thumbRaster.render(thumbScene,thumbCamera,thumbRenderer.domElement.width,thumbRenderer.domElement.height,false,grid);
 return thumbRenderer.domElement.toDataURL('image/png');
}
async function processQueue(){
 if(thumbBusy)return;thumbBusy=true;
 while(queue.length){
  const {item,holder,img}=queue.shift();if(!holder.isConnected)continue;
  try{
   const key=`${item.id}:${holder.clientWidth}:${holder.clientHeight}:${devicePixelRatio}`;
   if(!thumbs.has(key))thumbs.set(key,await drawThumb(item,holder.clientWidth,holder.clientHeight));
   img.src=thumbs.get(key);holder.querySelector('span')?.remove();holder.closest('.item').dataset.loaded='true';
   document.body.dataset.ready='true';
  }catch(error){const label=holder.querySelector('span');if(label){label.textContent='暂未载入';label.className='error';}}
 }
 thumbBusy=false;
}
const observed=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){const holder=entry.target;observed.unobserve(holder);queue.push({item:catalog.items.find(i=>i.id===holder.dataset.itemId),holder,img:holder.querySelector('img')});}processQueue()},{rootMargin:'160px'});
function filter(){
 const search=$('#search').value.trim().toLowerCase(),p=$('#placement').value;
 shown=catalog.items.filter(item=>(search||category==='全部'||item.category===category)&&(p==='all'||item.placement===p)&&(!search||`${item.name} ${item.id} ${item.aliases||''}`.toLowerCase().includes(search)));
 $('#summary').textContent=`${catalog.items.length} 件物品 · 当前 ${shown.length} 件`;
 $('#status').textContent=shown.length?'':'没有找到物品';$('#catalog').replaceChildren();observed.disconnect();queue=[];
 let group='';
 for(const item of shown){
  if(category==='全部'&&!search&&group!==item.category){group=item.category;const heading=document.createElement('h2');heading.className='group-heading';heading.textContent=group;$('#catalog').append(heading)}
  const card=document.createElement('article');card.className='item';card.dataset.itemId=item.id;
  const button=document.createElement('button');button.type='button';button.setAttribute('aria-label',`近看 ${item.name}`);button.addEventListener('click',()=>show(item));
  const holder=document.createElement('div');holder.className='image';holder.dataset.itemId=item.id;
  const img=document.createElement('img');img.alt='';holder.append(img);const label=document.createElement('span');label.textContent='正在摆好…';holder.append(label);button.append(holder);card.append(button);
  const copy=document.createElement('div');copy.className='item-copy';const name=document.createElement('h2');name.textContent=item.name;const meta=document.createElement('p');meta.textContent=`${dimensions(item)} · ${placer(item.placement)}`;copy.append(name,meta);card.append(copy);$('#catalog').append(card);observed.observe(holder);
 }
 document.body.dataset.category=category;document.body.dataset.visibleCount=String(shown.length);
}
for(const name of ['全部',...names]){const amount=name==='全部'?catalog.items.length:catalog.items.filter(i=>i.category===name).length;if(!amount)continue;const btn=document.createElement('button');btn.textContent=name;btn.setAttribute('aria-pressed',String(name===category));const count=document.createElement('small');count.textContent=amount;btn.append(count);btn.addEventListener('click',()=>{category=name;for(const b of $('#categories').children)b.setAttribute('aria-pressed',String(b===btn));filter()});$('#categories').append(btn);}
$('#search').addEventListener('input',filter);$('#placement').addEventListener('change',filter);filter();

let detailRenderer=null,detailScene=null,detailCamera=null,detailRaster=null,detailObject=null,detailGround=null,environment=null,shell=null,tableObject=null;
const previewTable=catalog.items.find(i=>i.id==='wood-square-table');
function tableSurface(item){
 if(item.placement!=='both'||!previewTable)return null;
 const footprint=item.footprint||item;
 return previewTable.surfaces.find(s=>!s.container&&s.shape==='rectangle'&&footprint.width+.04<=s.width&&footprint.depth+.04<=s.depth&&(s.headroom??10)>=item.height)||null;
}
const anchor=new T.Vector3(0,.015,-4*BACKGROUND.texelMetresPerUnit[2]);
function setupDetail(){
 if(detailRenderer)return;
 detailRenderer=newRenderer();$('#viewer').append(detailRenderer.domElement);detailScene=new T.Scene();detailCamera=new T.OrthographicCamera(-1,1,1,-1,.01,3000);detailRaster=createOutdoorRasterPass(T,detailRenderer);
 lighting(detailScene,true);detailGround=ground(detailScene);environment=new T.Group();environment.scale.fromArray(BACKGROUND.texelMetresPerUnit);detailScene.add(environment);
 shell=loadArchitecturalShell(T,environment);shell.ready.then(()=>{
  environment.updateMatrixWorld(true);const ray=new T.Raycaster(new T.Vector3(anchor.x,15,anchor.z),new T.Vector3(0,-1,0));const hit=shell.measure(ray);if(hit)anchor.y=hit.point.y+.004;renderDetail();
 }).catch(()=>{$('#status').textContent='游戏环境暂未载入，物品仍可近看'});
 new ResizeObserver(renderDetail).observe($('#viewer'));
}
function refs(item){
 const body=$('#reference-body');body.replaceChildren();
 const description=item.note||(/[\u3400-\u9fff]/.test(item.construction||'')?item.construction:'');
 if(description){const p=document.createElement('p');p.textContent=description;body.append(p)}
 if(item.adaptationNote){const p=document.createElement('p');p.textContent=item.adaptationNote;body.append(p)}
 for(const source of item.sources||[]){const p=document.createElement('p'),a=document.createElement('a');a.textContent=source.label;a.href=source.url;a.target='_blank';a.rel='noopener';p.append(a);body.append(p)}
 if(item.referenceUnknown?.length){const p=document.createElement('p');p.textContent='资料未确定：'+item.referenceUnknown.join('、');body.append(p)}
 const p=document.createElement('p');for(const [label,file] of [['Blender 原稿',item.sourceBlend],['Pixelorama 原稿',item.sourcePixelorama]]){if(!file)continue;const a=document.createElement('a');a.textContent=label;a.href='../'+file;p.append(a,document.createTextNode('　'));}body.append(p);
}
async function show(item){
 setupDetail();selected=item;pose={azimuth:.61,elevation:.52,zoom:1};onTable=false;lidOpen=false;
 $('#detail-name').textContent=item.name;$('#detail-meta').textContent=`${dimensions(item)} · ${placer(item.placement)}`;$('#position').textContent=`${shown.indexOf(item)+1} / ${shown.length}`;
 $('#detail').dataset.itemId=item.id;document.body.dataset.selected=item.id;refs(item);
 if(!$('#detail').open)$('#detail').showModal();$('#viewer').focus({preventScroll:true});
 const base=await model(item);if(selected!==item)return;if(detailObject){detailScene.remove(detailObject);disposeStructuralVisibility(detailObject)}detailObject=base.clone(true);prepareStructuralVisibility(T,detailObject);detailScene.add(detailObject);renderDetail();
}
function renderDetail(){
 if(!detailObject||!$('#detail').open)return;
 const width=$('#viewer').clientWidth,height=$('#viewer').clientHeight;if(!width||!height)return;
 const game=mode==='game',grid=resolvePixelGrid(devicePixelRatio);environment.visible=game;detailGround.visible=!game;
 const lids=selected.removableParts||[];
 let lidMatched=0;
 detailObject.traverse(node=>{if(lids.includes(node.userData.name)||lids.includes(node.name)||lids.includes(node.userData.part_role)){node.visible=!lidOpen;lidMatched++;}});
 $('#detail').dataset.lidMatched=String(lidMatched);$('#detail').dataset.lidHidden=String(lidOpen?lidMatched:0);
 $('#lid').hidden=!lids.length;$('#lid').textContent=lidOpen?'合上盖子':'打开盖子';$('#detail').dataset.lidOpen=String(lidOpen);
 const pos=game?anchor:new T.Vector3(),surface=tableSurface(selected);detailObject.position.copy(pos);
 detailObject.rotation.y=game?Math.PI:0;
 if(onTable&&surface){detailObject.position.add(new T.Vector3(surface.center[0],surface.height,-surface.center[1]));}
 if(tableObject){tableObject.visible=game&&onTable;tableObject.position.copy(pos);tableObject.rotation.y=game?Math.PI:0;}
 const frame=cameraPose(detailCamera,selected,width,height,detailObject.position,game);detailRenderer.setPixelRatio(grid.pixelRatio);detailRenderer.setSize(width,height,false);
 const worldPerSample=(detailCamera.top-detailCamera.bottom)/(Math.ceil(detailRenderer.domElement.height/grid.pixelStep)*detailCamera.zoom);
 const visibility=updateStructuralVisibility(detailObject,{worldPerSample,enabled:game});
 if(tableObject)updateStructuralVisibility(tableObject,{worldPerSample,enabled:game&&onTable});
 if(game)detailRaster.render(detailScene,detailCamera,detailRenderer.domElement.width,detailRenderer.domElement.height,false,grid);
 else detailRenderer.render(detailScene,detailCamera);
 $('#game-view').setAttribute('aria-pressed',String(game));$('#source-view').setAttribute('aria-pressed',String(!game));
 const canvas=detailRenderer.domElement;canvas.dataset.itemId=selected.id;canvas.dataset.mode=mode;canvas.dataset.texelsPerMetre=String(catalog.texelsPerMetre);canvas.dataset.cssPixelStep=game?String(grid.cssPixelStep):'0';canvas.dataset.sceneLoaded=String(shell.stats.loaded);
 $('#detail').dataset.mode=mode;$('#detail').dataset.zoom=String(pose.zoom);$('#detail').dataset.azimuth=String(pose.azimuth);$('#detail').dataset.elevation=String(pose.elevation);$('#detail').dataset.raster=JSON.stringify(game?detailRaster.stats:{passes:0});$('#detail').dataset.frame=JSON.stringify(frame);
 $('#detail').dataset.structuralVisibility=JSON.stringify({...visibility,worldPerSample});
 $('#detail').dataset.bearing=onTable&&surface?'wood-square-table:'+surface.id:'ground';
 $('#detail').dataset.placementHeight=String(detailObject.position.y-pos.y);
 $('#stage-placement').hidden=!game||!surface;$('#stage-placement').textContent=onTable?'放回地面':'放到桌上';
}
$('#game-view').onclick=()=>{mode='game';pose.elevation=.52;renderDetail()};$('#source-view').onclick=()=>{mode='source';onTable=false;renderDetail()};
$('#left').onclick=()=>{pose.azimuth-=.18;renderDetail()};$('#right').onclick=()=>{pose.azimuth+=.18;renderDetail()};
$('#top').onclick=()=>{pose.elevation=1.5;renderDetail()};$('#bottom').onclick=()=>{mode='source';onTable=false;pose.elevation=-.65;renderDetail()};
$('#lid').onclick=()=>{lidOpen=!lidOpen;renderDetail()};
$('#reset').onclick=()=>{pose={azimuth:.61,elevation:.52,zoom:1};onTable=false;lidOpen=false;renderDetail()};
$('#zoom-in').onclick=()=>{pose.zoom=Math.min(4,pose.zoom*1.2);renderDetail()};$('#zoom-out').onclick=()=>{pose.zoom=Math.max(.45,pose.zoom/1.2);renderDetail()};
$('#previous').onclick=()=>{if(selected)show(shown[(shown.indexOf(selected)-1+shown.length)%shown.length])};$('#next').onclick=()=>{if(selected)show(shown[(shown.indexOf(selected)+1)%shown.length])};
$('#close').onclick=()=>$('#detail').close();
$('#stage-placement').onclick=async()=>{
 if(!tableSurface(selected))return;
 if(!tableObject){tableObject=(await model(previewTable)).clone(true);prepareStructuralVisibility(T,tableObject);detailScene.add(tableObject)}
 onTable=!onTable;renderDetail();
};
let pointer=null;
$('#viewer').addEventListener('pointerdown',e=>{if(e.button!==0)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY};$('#viewer').setPointerCapture(e.pointerId);$('#viewer').classList.add('dragging')});
$('#viewer').addEventListener('pointermove',e=>{if(!pointer||e.pointerId!==pointer.id)return;pose.azimuth-=(e.clientX-pointer.x)*.009;pose.elevation=Math.max(-1.4,Math.min(1.5,pose.elevation+(e.clientY-pointer.y)*.006));pointer.x=e.clientX;pointer.y=e.clientY;renderDetail()});
for(const type of ['pointerup','pointercancel'])$('#viewer').addEventListener(type,()=>{pointer=null;$('#viewer').classList.remove('dragging')});
$('#viewer').addEventListener('wheel',e=>{e.preventDefault();pose.zoom=Math.max(.45,Math.min(4,pose.zoom*Math.exp(-e.deltaY*.001)));renderDetail()},{passive:false});
$('#viewer').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')pose.azimuth-=.12;if(e.key==='ArrowRight')pose.azimuth+=.12;if(e.key==='ArrowUp')pose.elevation=Math.min(1.5,pose.elevation+.10);if(e.key==='ArrowDown')pose.elevation=Math.max(-1.4,pose.elevation-.10);renderDetail()});
window.addEventListener('resize',()=>{filter();renderDetail()});
