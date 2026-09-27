const {app,BrowserWindow,protocol,net,screen,session,ipcMain,shell,dialog,Menu}=require('electron');
const path=require('node:path');
const fs=require('node:fs/promises');
const {pathToFileURL}=require('node:url');
const {checkRelease}=require('./updates.cjs');
const origin='umwelt://game';
app.setName('UMWELT');
app.setPath('userData',process.env.UMWELT_TEST_USER_DATA||path.join(app.getPath('appData'),'com.fivsevn.umwelt'));
protocol.registerSchemesAsPrivileged([{scheme:'umwelt',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}]);
let win;
function trusted(event){return event.sender===win?.webContents&&event.senderFrame===win.webContents.mainFrame&&event.senderFrame.url.startsWith(origin+'/')}
async function external(url){if(/^https?:\/\//.test(url))await shell.openExternal(url)}
function createWindow(){
 win=new BrowserWindow({width:390,height:760,useContentSize:true,frame:false,roundedCorners:false,minWidth:360,minHeight:120,title:'UMWELT',backgroundColor:'#273e34',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 win.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith(origin+'/'))void win.loadURL(url);else void external(url);return {action:'deny'}});
 win.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(origin+'/')){event.preventDefault();void external(url)}});
 win.on('close',()=>session.defaultSession.flushStorageData());
 win.loadURL(origin+'/');
}
if(!app.requestSingleInstanceLock())app.quit();else{
 app.on('second-instance',()=>{if(win){if(win.isMinimized())win.restore();win.focus()}});
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
  let checkingUpdates=false;
  ipcMain.handle('umwelt:updates',async event=>{
   if(!trusted(event))throw Error('Untrusted caller');if(checkingUpdates)return;
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
  ipcMain.handle('umwelt:fit',(event,height)=>{
   if(!trusted(event)||!Number.isFinite(height)||height<100||height>10000)return;
   if(win.isMaximized()||win.isFullScreen())return;
   const bounds=win.getBounds(),area=screen.getDisplayMatching(bounds).workArea;
   const next=Math.min(Math.ceil(height),area.height);
   if(Math.abs(bounds.height-next)>1)win.setBounds({height:next,y:Math.max(area.y,Math.min(bounds.y,area.y+area.height-next))});
  });
  ipcMain.handle('umwelt:window',(event,action)=>{
   if(!trusted(event))throw Error('Untrusted caller');
   if(action==='minimize')win.minimize();
   else if(action==='maximize'){if(win.isMaximized())win.unmaximize();else win.maximize()}
   else if(action==='close')win.close();
  });
  ipcMain.handle('umwelt:quit',event=>{if(!trusted(event))throw Error('Untrusted caller');session.defaultSession.flushStorageData();app.quit()});
  ipcMain.handle('umwelt:uninstall',async event=>{
   if(!trusted(event))throw Error('Untrusted caller');
   const bundle=path.resolve(process.execPath,'../../..');
   if(!app.isPackaged||path.basename(bundle)!=='UMWELT.app')return {error:'Only the packaged UMWELT.app can be uninstalled.'};
   const choice=await dialog.showMessageBox(win,{type:'warning',title:'卸载 UMWELT / Uninstall',message:'将 UMWELT 移到废纸篓？',detail:'默认保留图鉴和观察记录，重新安装后可以继续。勾选下方选项才会同时移除存档。',buttons:['取消 / Cancel','卸载 / Uninstall'],defaultId:0,cancelId:0,checkboxLabel:'同时移除图鉴和观察记录 / Remove saved data',checkboxChecked:false});
   if(choice.response!==1)return {cancelled:true};
   try{
    session.defaultSession.flushStorageData();
    await shell.trashItem(bundle);
    if(choice.checkboxChecked)await shell.trashItem(app.getPath('userData'));
    app.quit();return {removed:true};
   }catch(error){await dialog.showMessageBox(win,{type:'error',message:'卸载未完成 / Uninstall incomplete',detail:error.message});return {error:error.message}}
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate([
   {label:'UMWELT',submenu:[{role:'about'},{type:'separator'},{label:'返回主页 / Home',click:()=>win?.loadURL(origin+'/')},{label:'显示存档 / Show saved data',click:()=>shell.openPath(app.getPath('userData'))},{type:'separator'},{role:'quit'}]},
   {role:'editMenu'},{role:'viewMenu'},{role:'windowMenu'}
  ]));
  createWindow();
 });
 app.on('window-all-closed',()=>app.quit());
 app.on('before-quit',()=>{if(app.isReady())session.defaultSession.flushStorageData()});
}
