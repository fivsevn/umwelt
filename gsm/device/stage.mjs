import {shells,antennas,charms} from './catalog.mjs';
import {geometry as g,frontStrandMask} from './geometry.mjs';

const url=path=>new URL(path,import.meta.url).href;
const decoded=new Map();
function load(path,priority='auto'){
 const src=url(path);
 if(!decoded.has(src)){
  const image=new Image();image.decoding='async';image.fetchPriority=priority;image.src=src;
  decoded.set(src,image.decode().catch(error=>{decoded.delete(src);throw error;}));
 }
 return decoded.get(src);
}

export function mountDevice(){
 const host=document.getElementById('deviceHost'),screen=document.querySelector('.app-window'),nav=document.getElementById('mainNav');
 const holder=document.createElement('div');holder.className='device-holder';
 const stage=document.createElement('div');stage.className='device-stage';holder.append(stage);
 stage.innerHTML='<div class="charm-foreground"><div class="rig-shadow rig-shadow-soft"><img alt=""></div><div class="rig-shadow rig-shadow-tight"><img alt=""></div><img class="charm-rig" alt=""><img class="eyelet-rear-shade" alt=""></div><div class="device-group"><div class="shell-surface"><img class="shell-img" alt="" fetchpriority="high"><img class="shell-socket" alt="" hidden><img class="shell-button-finish" alt="" hidden></div><img class="antenna" alt=""><div class="screen-slot"><div class="lens" aria-hidden="true"></div></div></div><div class="charm-contact-receiver"><div class="eyelet-contact-follow"><img class="eyelet-contact-soft" alt=""><img class="eyelet-contact-tight" alt=""></div><div class="charm-contact-follow"><img class="contact-soft" alt=""><img class="contact-tight" alt=""></div></div><div class="eyelet-occlusion"><img alt=""></div>';
 stage.querySelectorAll('img').forEach(image=>{image.decoding='async';image.setAttribute('aria-hidden','true');image.addEventListener('error',()=>image.classList.add('asset-unavailable'));image.addEventListener('load',()=>image.classList.remove('asset-unavailable'));});
 const hardware=stage.querySelector('.device-group'),slot=stage.querySelector('.screen-slot');
 const errorNotice=document.createElement('div');errorNotice.className='device-error';errorNotice.setAttribute('role','status');errorNotice.hidden=true;
 const errorText=document.createElement('span'),retry=document.createElement('button');retry.type='button';errorNotice.append(errorText,retry);
 slot.prepend(screen);hardware.append(nav);host.replaceChildren(holder,errorNotice);
 Object.assign(hardware.style,{transform:`scale(${g.bodyScale})`,transformOrigin:g.origin.join('px ')+'px'});
 hardware.style.setProperty('--button-faces',`path('${g.keyFaces.join(' ')}')`);
 const [x,y,w,h]=g.screen;
 Object.assign(slot.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});
 Object.assign(screen.style,{height:356*h/w+'px',transform:`scale(${w/356})`});
 for(const [i,key] of [...nav.querySelectorAll('a')].entries()){
  const [kx,ky]=g.keys[i],{width,height}=g.keySizes[i];
  Object.assign(key.style,{left:kx+'px',top:ky+'px',width:width+'px',height:height+'px'});
  key.style.setProperty('--key-face',`path('${g.keyFaces[i]}')`);
  key.style.setProperty('--key-left',-(kx-width/2)+'px');
  key.style.setProperty('--key-top',-(ky-height/2)+'px');
  key.style.setProperty('--key-origin',`${kx}px ${ky}px`);
  key.style.setProperty('--key-paint-position',`${kx-width/2}px ${ky-height/2}px`);
  key.style.setProperty('--key-paint-size',`${width}px ${height}px`);
 }
 function fit(){
  const width=Math.min(host.clientWidth-16,(host.clientHeight-16)*g.canvas[0]/g.canvas[1],1040);
  if(width<=0)return;
  Object.assign(holder.style,{width:width+'px',height:g.canvas[1]*width/g.canvas[0]+'px'});
  Object.assign(stage.style,{transform:`scale(${width/g.canvas[0]})`,top:g.topPad*width/g.canvas[0]+'px'});
 }
 new ResizeObserver(fit).observe(host);fit();
 let revision=0,lastAppearance,resolveReady;
 const ready=new Promise(resolve=>{resolveReady=resolve;});
 retry.addEventListener('click',()=>update(lastAppearance));
 async function update(appearance){
  lastAppearance={...appearance};
  const current=++revision;
  const s=shells.find(item=>item.id===appearance.shell)??shells[0],a=antennas.find(item=>item.id===appearance.antenna)??antennas[0],c=charms.find(item=>item.id===appearance.charm)??charms[0];
  const results=await Promise.allSettled([load(s.image,'high'),load(a.image),load(c.image),...(s.buttonFinish?[load(s.buttonFinish)]:[])]);
  if(current!==revision)return;
  errorNotice.hidden=results.every(result=>result.status==='fulfilled');
  if(!errorNotice.hidden){
   const language=document.documentElement.lang.split('-')[0],copy=language==='en'?['Some artwork could not load.','Retry']:language==='ja'?['外観画像を読み込めませんでした。','再試行']:['部分外观图片未能加载。','重试'];
   errorText.textContent=copy[0];retry.textContent=copy[1];
  }
  stage.dataset.shell=s.code;stage.dataset.antenna=a.id;stage.dataset.charm=c.id;
  const shell=stage.querySelector('.shell-img');shell.src=url(s.image);
  nav.style.setProperty('--key-art',`url("${url(s.buttonFinish??s.image)}")`);
  const socket=stage.querySelector('.shell-socket');socket.hidden=!s.socketFit;if(s.socketFit)socket.src=shell.src;
  const finish=stage.querySelector('.shell-button-finish');finish.hidden=!s.buttonFinish;if(s.buttonFinish)finish.src=url(s.buttonFinish);
  const antenna=stage.querySelector('.antenna'),mx=g.socket[0]+a.seatOffset[0],my=g.socket[1]+a.seatOffset[1];
  antenna.src=url(a.image);
  Object.assign(antenna.style,{width:a.width+'px',height:a.height+'px',left:mx-a.width*a.anchor[0]+'px',top:my-a.height*a.anchor[1]+'px',clipPath:`inset(0 0 ${100*(a.height*(1-a.anchor[1])+30.318)/a.height}% 0)`});
  const ex=g.origin[0]+(g.eyelet[0]-g.origin[0])*g.bodyScale,ey=g.origin[1]+(g.eyelet[1]-g.origin[1])*g.bodyScale;
  const fit=c.fit,placement={left:ex-fit.anchor[0]+'px',top:ey-fit.anchor[1]+'px',width:g.rigWidth+'px'};
  const foreground=stage.querySelector('.charm-foreground'),rig=stage.querySelector('.charm-rig');
  Object.assign(foreground.style,placement);rig.src=url(c.image);
  foreground.querySelectorAll('.rig-shadow img').forEach(image=>{image.src=rig.src;image.style.maskImage=frontStrandMask(fit);});
  const rear=stage.querySelector('.eyelet-rear-shade');rear.src=rig.src;rear.style.clipPath=`path('${fit.rear}')`;
  const occlusion=stage.querySelector('.eyelet-occlusion');Object.assign(occlusion.style,{...placement,clipPath:`path('${fit.rear}')`});
  const rim=occlusion.querySelector('img');rim.src=shell.src;
  Object.assign(rim.style,{left:g.origin[0]*(1-g.bodyScale)-(ex-fit.anchor[0])+'px',top:g.origin[1]*(1-g.bodyScale)-(ey-fit.anchor[1])+'px',width:1024*g.bodyScale+'px',height:1536*g.bodyScale+'px'});
  const receiver=stage.querySelector('.charm-contact-receiver');
  Object.assign(receiver.style,{maskImage:`url("${shell.src}")`,maskSize:`${1024*g.bodyScale}px ${1536*g.bodyScale}px`,maskPosition:g.origin.map(v=>v*(1-g.bodyScale)+'px').join(' ')});
  const contact=receiver.querySelector('.charm-contact-follow');contact.hidden=!c.contactShadow;Object.assign(contact.style,placement);
  const head=receiver.querySelector('.eyelet-contact-follow');Object.assign(head.style,placement);head.style.setProperty('--contact-strength',fit.contact);
  head.querySelectorAll('img').forEach(image=>image.style.maskImage=frontStrandMask(fit));
  receiver.querySelectorAll('img').forEach(image=>image.src=rig.src);
  holder.dataset.ready='true';
  if(resolveReady){resolveReady();resolveReady=null;}
 }
 return {update,ready};
}
