import {shells,antennas,charms} from './catalog.mjs';
import {geometry as g,localKeyFace} from './geometry.mjs';

const url=path=>{
 const result=new URL(path,import.meta.url),version=new URL(import.meta.url).searchParams.get('v');
 if(version)result.searchParams.set('v',version);return result.href;
};
const selected=(group,id)=>group.find(item=>item.id===id)??group[0];
export function mountDevice(initialAppearance={}){
 const host=document.getElementById('deviceHost'),screen=document.querySelector('.app-window'),nav=document.getElementById('mainNav');
 const holder=document.createElement('div');holder.className='device-holder';
 const stage=document.createElement('div');stage.className='device-stage';holder.append(stage);
 stage.innerHTML='<img class="device-art" alt="" aria-hidden="true"><div class="device-group"><img class="antenna" alt="" aria-hidden="true"><div class="screen-slot"><div class="lens" aria-hidden="true"></div></div></div>';
 const art=stage.querySelector('.device-art'),antennaImage=stage.querySelector('.antenna'),hardware=stage.querySelector('.device-group'),slot=stage.querySelector('.screen-slot');
 const errorNotice=document.createElement('div');errorNotice.className='device-error';errorNotice.setAttribute('role','status');errorNotice.hidden=true;
 const errorText=document.createElement('span'),retry=document.createElement('button');retry.type='button';errorNotice.append(errorText,retry);
 slot.prepend(screen);hardware.append(nav);host.replaceChildren(holder,errorNotice);
 Object.assign(hardware.style,{transform:`scale(${g.bodyScale})`,transformOrigin:g.origin.join('px ')+'px'});
 const [x,y,w,h]=g.screen;
 Object.assign(slot.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});
 Object.assign(screen.style,{height:356*h/w+'px',transform:`scale(${w/356})`});
 for(const [i,key] of [...nav.querySelectorAll('a')].entries()){
  const [kx,ky]=g.keys[i],{width,height}=g.keySizes[i];
  Object.assign(key.style,{left:kx+'px',top:ky+'px',width:width+'px',height:height+'px'});
  key.style.setProperty('--key-face',`path('${localKeyFace(i)}')`);
  key.style.setProperty('--key-left',-(kx-width/2+g.origin[0]*(1-g.bodyScale)/g.bodyScale)+'px');
  key.style.setProperty('--key-top',-(ky-height/2+(g.topPad+g.origin[1]*(1-g.bodyScale))/g.bodyScale)+'px');
  const hit=document.createElement('span');hit.className='key-hit';hit.setAttribute('aria-hidden','true');key.append(hit);
 }
 let appearance={...initialAppearance},mode=host.clientWidth<=600,revision=0,running=false,pending=false,paintedKey='',requestedKey='',activeURL='',resolveReady;
 const ready=new Promise(resolve=>{resolveReady=resolve;});
 function fitDevice(){
  const nextMode=host.clientWidth<=600,coiled=nextMode&&Boolean(selected(charms,appearance.charm).mobileImage);
  stage.toggleAttribute('data-mobile-coil',coiled);
  if(nextMode){
   const [x,y,width,height]=g.mobileView,scale=Math.min(host.clientWidth/width,host.clientHeight/height);
   if(scale<=0)return;
   nav.style.setProperty('--touch-target',44/(scale*g.bodyScale)+'px');
   Object.assign(holder.style,{width:width*scale+'px',height:height*scale+'px'});
   Object.assign(stage.style,{transform:`scale(${scale})`,left:-x*scale+'px',top:(g.topPad-y)*scale+'px'});
  }else{
   const width=Math.min(host.clientWidth-16,(host.clientHeight-16)*g.canvas[0]/g.canvas[1],1040);
   if(width<=0)return;
   nav.style.setProperty('--touch-target',44/(width/g.canvas[0]*g.bodyScale)+'px');
   Object.assign(holder.style,{width:width+'px',height:g.canvas[1]*width/g.canvas[0]+'px'});
   Object.assign(stage.style,{transform:`scale(${width/g.canvas[0]})`,left:'0px',top:g.topPad*width/g.canvas[0]+'px'});
  }
  if(nextMode!==mode){mode=nextMode;update(appearance);}
 }
 new ResizeObserver(fitDevice).observe(host);fitDevice();
 retry.addEventListener('click',()=>update(appearance));
 async function drain(){
  if(running)return;running=true;
  try{while(pending){
   pending=false;const current=revision;
   const s=selected(shells,appearance.shell),a=selected(antennas,appearance.antenna),c=selected(charms,appearance.charm),coiled=mode&&Boolean(c.mobileImage);
   const key=[s.id,a.id,c.id,coiled].join('/');
   if(key===paintedKey)continue;
   let nextURL='';
   try{
    nextURL=url(`../assets/device-rendered/${s.id}-${c.id}-${coiled?'mobile':'desktop'}.webp`);
    const decoded=new Image(),antennaDecoded=new Image();decoded.src=nextURL;antennaDecoded.src=url(a.image);
    await Promise.all([decoded.decode(),antennaDecoded.decode()]);
    // Font substitution must finish before the first device is revealed.
    if(!activeURL)await document.fonts.ready;
    if(current!==revision)continue;
    art.src=nextURL;activeURL=nextURL;antennaImage.src=url(a.image);
    const mx=g.socket[0]+a.seatOffset[0],my=g.socket[1]+a.seatOffset[1];
    Object.assign(antennaImage.style,{width:a.width+'px',height:a.height+'px',left:mx-a.width*a.anchor[0]+'px',top:my-a.height*a.anchor[1]+'px',clipPath:`inset(0 0 ${100*(a.height*(1-a.anchor[1])+30.318)/a.height}% 0)`});
    paintedKey=key;stage.dataset.shell=s.code;stage.dataset.antenna=a.id;stage.dataset.charm=c.id;
    stage.dataset.paintCount=String(Number(stage.dataset.paintCount||0)+1);
    nav.style.setProperty('--key-art',`url("${nextURL}")`);
    nav.style.setProperty('--key-art-size',g.canvas.map(size=>size/g.bodyScale+'px').join(' '));
    holder.dataset.ready='true';errorNotice.hidden=true;
    if(resolveReady){resolveReady();resolveReady=null;}
   }catch(error){
    if(current!==revision)continue;
    const language=document.documentElement.lang.split('-')[0],copy=language==='en'?['Some artwork could not load.','Retry']:language==='ja'?['外観画像を読み込めませんでした。','再試行']:['部分外观图片未能加载。','重试'];
    errorText.textContent=copy[0];retry.textContent=copy[1];errorNotice.hidden=false;requestedKey='';
   }
  }}finally{running=false;}
 }
 function update(next){
  appearance={...next};const key=[appearance.shell,appearance.antenna,appearance.charm,mode].join('/');
  if(requestedKey===key&&(pending||running||paintedKey))return;
  requestedKey=key;revision++;pending=true;void drain();
 }
 return {update,ready};
}
