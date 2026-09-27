const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('umweltNative',Object.freeze({
 openDrawer:mode=>ipcRenderer.invoke('umwelt:open','/isopoda/?nativeDrawer='+encodeURIComponent(mode)),
 quit:()=>ipcRenderer.invoke('umwelt:quit'),
 checkUpdates:()=>ipcRenderer.invoke('umwelt:updates'),
 uninstall:()=>ipcRenderer.invoke('umwelt:uninstall')
}));

window.addEventListener('DOMContentLoaded',async()=>{
 const html=document.documentElement;
 html.classList.add('umwelt-native');
 const isopoda=/^\/isopoda\/(?:index\.html)?$/.test(location.pathname);
 const drawer=new URLSearchParams(location.search).has('nativeDrawer');
 const tick=location.pathname.startsWith('/tick/');
 if(isopoda)html.classList.add('umwelt-isopoda');
 if(drawer)html.classList.add('umwelt-drawer');
 if(tick)html.classList.add('umwelt-tick');
 const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='umwelt://game/__native/frame.css';
 const styled=new Promise((resolve,reject)=>{stylesheet.onload=resolve;stylesheet.onerror=reject});document.head.append(stylesheet);
 if(!isopoda){
  const frame=document.createElement('div');frame.id='nativeFrame';
  frame.innerHTML='<div id="nativeTitlebar"><span id="nativeCaption">UMWELT</span><div class="native-controls"><button id="nativeHome" aria-label="返回主页" title="返回主页"><i aria-hidden="true"></i></button><button id="nativeAbout" aria-label="关于" title="关于">?</button><button id="nativeMinimize" aria-label="最小化" title="最小化"><i aria-hidden="true"></i></button><button id="nativeMaximize" aria-label="全屏／小窗口" title="全屏／小窗口"><i aria-hidden="true"></i></button><button id="nativeClose" aria-label="关闭窗口" title="关闭窗口"><i aria-hidden="true"></i></button></div></div>';
  html.append(frame);
  const home=location.pathname==='/'||location.pathname==='/index.html';
  frame.querySelector('#nativeHome').hidden=home;frame.querySelector('#nativeAbout').hidden=!home;
  frame.querySelector('#nativeHome').onclick=()=>ipcRenderer.invoke('umwelt:open','/');
  frame.querySelector('#nativeAbout').onclick=()=>document.querySelector('#aboutButton')?.click();
  for(const action of ['Minimize','Maximize','Close'])frame.querySelector('#native'+action).onclick=()=>ipcRenderer.invoke('umwelt:window',action.toLowerCase());
  const caption=frame.querySelector('#nativeCaption');
  const update=()=>caption.textContent=(home?document.querySelector('.desktop-menu strong')?.textContent:document.title)||'UMWELT';
  update();new MutationObserver(update).observe(document.head,{childList:true,subtree:true,characterData:true});
  if(home)new MutationObserver(update).observe(document.querySelector('.desktop-menu'),{childList:true,subtree:true,characterData:true});
 }
 // Existing webpage title buttons operate their real desktop window.
 document.addEventListener('click',event=>{
  const control=event.target.closest('#windowMinimize,#windowMaximize,#windowClose,.launch-close,#closeDrawer');
  if(!control||!isopoda)return;
  event.preventDefault();event.stopImmediatePropagation();
  const action=control.id==='windowMinimize'?'minimize':control.id==='windowMaximize'?'maximize':'close';
  void ipcRenderer.invoke('umwelt:window',action);
 },true);
 document.addEventListener('click',event=>{
  if(event.defaultPrevented)return;
  const link=event.target.closest('a[href]');if(!link)return;
  const url=new URL(link.href,location.href);
  if(url.protocol!=='umwelt:'||url.host!=='game'||(url.pathname===location.pathname&&url.search===location.search&&url.hash))return;
  event.preventDefault();void ipcRenderer.invoke('umwelt:open',url.href);
  if(link.id==='exitTick')void ipcRenderer.invoke('umwelt:window','close');
 },true);
 const game=isopoda?document.querySelector('body>#game'):null;
 let ready=false,queued=false,lastHeight=0;
 function size(){
  if(drawer)return Math.ceil(document.querySelector('#drawer')?.getBoundingClientRect().height||700);
  if(!game)return 700;
  const active=[...game.children].find(el=>!el.hidden&&el.matches('.application-card,.play-view'));
  return Math.ceil((active?.id==='playView'?document.querySelector('#boxFrame'):active)?.getBoundingClientRect().height||480);
 }
 function fit(){
  if(!ready||queued)return;queued=true;
  requestAnimationFrame(()=>{queued=false;const height=size();if(height!==lastHeight){lastHeight=height;void ipcRenderer.invoke('umwelt:fit',height)}});
 }
 if(game&&drawer){new ResizeObserver(fit).observe(document.querySelector('#drawer'));new MutationObserver(fit).observe(document.querySelector('#drawer'),{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-mode']})}
 if(game&&!drawer){
  const observer=new ResizeObserver(fit);for(const el of game.querySelectorAll(':scope>.application-card,#boxFrame'))observer.observe(el);
  new MutationObserver(fit).observe(game,{subtree:true,attributes:true,attributeFilter:['hidden'],childList:true,characterData:true});
 }
 window.addEventListener('resize',()=>{lastHeight=0;fit()});ipcRenderer.on('umwelt:refit',()=>{lastHeight=0;fit()});
 await styled;await document.fonts.ready;
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 ready=true;lastHeight=size();await ipcRenderer.invoke('umwelt:ready',lastHeight);
});
