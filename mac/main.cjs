const {app,BrowserWindow,protocol,net,screen,session,ipcMain,shell,dialog,Menu}=require('electron');
const path=require('node:path');
const fs=require('node:fs/promises');
const syncFs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {checkRelease}=require('./updates.cjs');
const origin='umwelt://game';
app.setName('UMWELT');
app.setPath('userData',process.env.UMWELT_TEST_USER_DATA||path.join(app.getPath('appData'),'com.fivsevn.umwelt'));
app.setPath('crashDumps',path.join(app.getPath('userData'),'Crashpad'));
app.setAppLogsPath(path.join(app.getPath('userData'),'logs'));
let uninstallPaths=null;
protocol.registerSchemesAsPrivileged([{scheme:'umwelt',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}]);
let win;
const windows=new Map();
function sender(event){const w=BrowserWindow.fromWebContents(event.sender);return w&&[...windows.values()].includes(w)&&event.senderFrame===w.webContents.mainFrame&&event.senderFrame.url.startsWith(origin+'/')?w:null}
function trusted(event){return !!sender(event)}
function centerWindow(w){const area=screen.getDisplayMatching(w.getBounds()).workArea;const [width,height]=w.getSize();w.setPosition(Math.round(area.x+(area.width-width)/2),Math.round(area.y+(area.height-height)/2))}
async function external(url){if(/^https?:\/\//.test(url))await shell.openExternal(url)}
function createWindow(route='/'){
 const url=new URL(route,origin),drawer=url.searchParams.get('nativeDrawer');
 const kind=url.pathname==='/'?'home':drawer?'drawer':url.pathname==='/isopoda/'?'isopoda':url.pathname.startsWith('/tick/')?'tick':'reference';
 const key=kind==='reference'?url.pathname:kind==='drawer'?'drawer:'+drawer:kind;
 const existing=windows.get(key);if(existing&&!existing.isDestroyed()){if(existing.isMinimized())existing.restore();if(existing.umweltReady){existing.show();existing.focus()}return existing}
 const [width,height]=kind==='home'?[720,540]:kind==='reference'?[900,700]:kind==='drawer'?[390,700]:kind==='tick'?[390,650]:[390,480];
 const w=new BrowserWindow({width,height,show:false,useContentSize:true,frame:false,roundedCorners:false,resizable:false,maximizable:false,fullscreenable:true,title:'UMWELT',backgroundColor:'#273e34',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 w.umweltKind=kind;w.umweltReady=false;windows.set(key,w);if(kind==='home')win=w;
 centerWindow(w);
 w.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith(origin+'/'))createWindow(url);else void external(url);return {action:'deny'}});
 w.webContents.on('will-navigate',(event,next)=>{
  if(!next.startsWith(origin+'/')){event.preventDefault();void external(next);return}
  if(next!==w.webContents.getURL()){event.preventDefault();createWindow(next);if(new URL(next).pathname==='/'&&kind!=='home')w.close()}
 });
 w.on('close',()=>session.defaultSession.flushStorageData());
 w.on('closed',()=>{windows.delete(key);if(win===w)win=null});
 w.on('leave-full-screen',()=>w.webContents.send('umwelt:refit'));
 w.loadURL(url.href);return w;
}
if(!app.requestSingleInstanceLock())app.quit();else{
 app.on('second-instance',()=>createWindow('/'));
 app.whenReady().then(()=>{
  const root=path.join(__dirname,'site');
  protocol.handle('umwelt',async request=>{
   try{
    const url=new URL(request.url);if(url.protocol!=='umwelt:'||url.host!=='game')return new Response('Forbidden',{status:403});
    if(url.pathname==='/__native/frame.css')return net.fetch(pathToFileURL(path.join(__dirname,'frame.css')).toString());
    let name=decodeURIComponent(url.pathname);if(name.includes('\0'))return new Response('Bad path',{status:400});
    let file=path.resolve(root,'.'+name);if(file!==root&&!file.startsWith(root+path.sep))return new Response('Forbidden',{status:403});
    if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');
    return net.fetch(pathToFileURL(file).toString());
   }catch{return new Response('Not found',{status:404})}
  });
  session.defaultSession.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
  ipcMain.handle('umwelt:open',(event,route)=>{
   if(!trusted(event)||typeof route!=='string')throw Error('Untrusted route');
   const url=new URL(route,origin);if(url.protocol!=='umwelt:'||url.host!=='game')throw Error('Invalid route');
   createWindow(url.href);
  });
  ipcMain.handle('umwelt:ready',(event,height)=>{
   const w=sender(event);if(!w)return;
   fitWindow(w,height);if(!w.umweltReady){w.umweltReady=true;centerWindow(w);w.show()}
  });
  function fitWindow(w,height){
   if(w.isFullScreen())return;
   const fixed={home:540,tick:650,reference:700};
   height=fixed[w.umweltKind]??height;
   if(!Number.isFinite(height)||height<60||height>10000)return;
   const area=screen.getDisplayMatching(w.getBounds()).workArea;
   const next=Math.min(Math.ceil(height),area.height);
   if(Math.abs(w.getBounds().height-next)>1){const b=w.getBounds();w.setBounds({height:next,y:Math.max(area.y,Math.min(area.y+area.height-next,Math.round(b.y+(b.height-next)/2)))})}
  }
  let checkingUpdates=false;
  ipcMain.handle('umwelt:updates',async event=>{
   const win=sender(event);if(!win)throw Error('Untrusted caller');if(checkingUpdates)return;
   checkingUpdates=true;
   try{
    const result=await checkRelease(app.getVersion());
    const messages={unpublished:'还没有正式发布的版本。',available:'发现新版本。',current:'已是最新版本。',ahead:'本地版本比最新 Release 更新。',unknown:'发现发布版本，请在发布页查看。'};
    const choice=await dialog.showMessageBox(win,{type:'info',title:'查看更新',message:messages[result.status],detail:`当前版本：${result.current}\n${result.latest?'最新 Release：'+result.latest:'GitHub 上暂时没有正式 Release。'}`,buttons:['关闭','打开发布页'],defaultId:0,cancelId:0});
    if(choice.response===1)await shell.openExternal(result.url);
    return result;
   }catch(error){await dialog.showMessageBox(win,{type:'warning',title:'查看更新',message:'暂时无法检查更新。',detail:'请检查网络后重试。\n'+error.message});return {status:'error'}}
   finally{checkingUpdates=false}
  });
  ipcMain.handle('umwelt:fit',(event,height)=>{const w=sender(event);if(w)fitWindow(w,height)});
  ipcMain.handle('umwelt:window',(event,action)=>{
   const w=sender(event);if(!w)throw Error('Untrusted caller');
   if(action==='minimize')w.minimize();
   else if(action==='maximize')w.setFullScreen(!w.isFullScreen());
   else if(action==='close')w.close();
  });
  ipcMain.handle('umwelt:quit',event=>{if(!trusted(event))throw Error('Untrusted caller');session.defaultSession.flushStorageData();app.quit()});
  ipcMain.handle('umwelt:uninstall',async event=>{
   const win=sender(event);if(!win)throw Error('Untrusted caller');
   const bundle=path.resolve(process.execPath,'../../..');
   if(!app.isPackaged||path.basename(bundle)!=='UMWELT.app')return {error:'Only the packaged UMWELT.app can be uninstalled.'};
   // The authored homepage confirmation is the final confirmation. Remove this
   // bundle and its private profile on quit, after windows and storage are closed.
   uninstallPaths=[bundle,app.getPath('userData')];
   session.defaultSession.flushStorageData();app.quit();return {removed:true};
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate([
   {label:'UMWELT',submenu:[{role:'about'},{type:'separator'},{label:'返回主页 / Home',click:()=>createWindow('/')},{label:'显示存档 / Show saved data',click:()=>shell.openPath(app.getPath('userData'))},{type:'separator'},{role:'quit'}]},
   {role:'editMenu'},{role:'viewMenu'},{label:'Window',submenu:[{role:'minimize'},{role:'close',accelerator:'CmdOrCtrl+W'},{type:'separator'},{role:'front'}]}
  ]));
  createWindow();
 });
 app.on('window-all-closed',()=>app.quit());
 app.on('will-quit',()=>{if(uninstallPaths)for(const target of uninstallPaths)syncFs.rmSync(target,{recursive:true,force:true})});
 app.on('before-quit',()=>{if(app.isReady())session.defaultSession.flushStorageData()});
}
