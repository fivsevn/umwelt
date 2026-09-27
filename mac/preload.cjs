const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('umweltNative',Object.freeze({
 quit:()=>ipcRenderer.invoke('umwelt:quit'),
 checkUpdates:()=>ipcRenderer.invoke('umwelt:updates'),
 uninstall:()=>ipcRenderer.invoke('umwelt:uninstall')
}));

window.addEventListener('DOMContentLoaded',()=>{
 document.documentElement.classList.add('umwelt-native');
 const isopoda=/^\/isopoda\/(?:index\.html)?$/.test(location.pathname);
 const tick=location.pathname.startsWith('/tick/');
 if(isopoda)document.documentElement.classList.add('umwelt-isopoda');
 if(tick)document.documentElement.classList.add('umwelt-tick');
 const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='umwelt://game/__native/frame.css';document.head.append(stylesheet);
 const frame=document.createElement('div');frame.id='nativeFrame';
 frame.innerHTML='<div id="nativeTitlebar"><span id="nativeCaption">UMWELT</span><div class="native-controls"><button id="nativeHome" aria-label="返回主页" title="返回主页"><i aria-hidden="true"></i></button><button id="nativeAbout" aria-label="关于" title="关于">?</button><button id="nativeMinimize" aria-label="最小化" title="最小化"><i aria-hidden="true"></i></button><button id="nativeMaximize" aria-label="放大／还原" title="放大／还原"><i aria-hidden="true"></i></button><button id="nativeClose" aria-label="退出游戏" title="退出游戏"><i aria-hidden="true"></i></button></div></div>';
 document.documentElement.append(frame);
 const home=location.pathname==='/'||location.pathname==='/index.html';
 frame.querySelector('#nativeHome').hidden=home;
 frame.querySelector('#nativeAbout').hidden=!home;
 frame.querySelector('#nativeHome').onclick=()=>{location.href='umwelt://game/'};
 frame.querySelector('#nativeAbout').onclick=()=>document.querySelector('#aboutButton')?.click();
 for(const action of ['Minimize','Maximize','Close'])frame.querySelector('#native'+action).onclick=()=>ipcRenderer.invoke('umwelt:window',action.toLowerCase());
 const caption=frame.querySelector('#nativeCaption');
 function updateCaption(){
  const visibleTitle=[...document.querySelectorAll('#game>.application-card>.window-title,#boxFrame>.window-title')].find(el=>!el.closest('[hidden]'));
  const title=home?document.querySelector('.desktop-menu strong')?.textContent:visibleTitle?.querySelector('span')?.textContent;
  caption.textContent=title||document.title||'UMWELT';
 }
 updateCaption();
 const target=document.querySelector('#game,.desktop-menu');
 if(target)new MutationObserver(updateCaption).observe(target,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden']});
 new MutationObserver(updateCaption).observe(document.querySelector('title'),{childList:true});
 const game=isopoda?document.querySelector('body>#game'):null;
 if(game){
  let queued=false,lastHeight=0;
  function fit(){
   if(queued)return;queued=true;
   requestAnimationFrame(()=>{
    queued=false;
    const active=[...game.children].find(el=>!el.hidden&&el.matches('.application-card,.play-view'));
    if(!active)return;
    const panel=active.id==='playView'?document.querySelector('#boxFrame'):active;
    const height=document.querySelector('dialog[open]')?760:Math.ceil(panel.getBoundingClientRect().height+46);
    if(height!==lastHeight){lastHeight=height;void ipcRenderer.invoke('umwelt:fit',height)}
   });
  }
  const observer=new ResizeObserver(fit);
  for(const el of game.querySelectorAll(':scope>.application-card,#boxFrame'))observer.observe(el);
  new MutationObserver(fit).observe(game,{subtree:true,attributes:true,attributeFilter:['hidden','open'],childList:true,characterData:true});
  stylesheet.addEventListener('load',fit);document.fonts.ready.then(fit);window.addEventListener('resize',()=>{lastHeight=0;fit()});fit();
 }else void ipcRenderer.invoke('umwelt:fit',760);
});
