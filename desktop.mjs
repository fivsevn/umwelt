import {paintDesktopIcons} from './desktop-icons.mjs';
import {createAudioEngine} from './assets/audio/audio-engine.mjs';
import {soundIcon} from './assets/audio/sound-icon.mjs';
const copy={
 zh:{repository:'项目仓库',author:'作者主页',systemTitle:'环世界观测系统',world:'环世界',about:'关于',welcome:'UMWELT / 欢迎',tick:'三个信号',rooftop:'花农时代',isopoda:'等足目赋格',closeWelcome:'关闭欢迎窗口',language:'语言：中文 · 切换为 English',soundOn:'音效已开启 · 关闭音效',soundOff:'音效已关闭 · 开启音效',endMenu:'结束观察',leaveMenu:'离开环境',end:['结束观察。','这个世界暂时不被看见。','继续','结束'],leave:['离开环境。','一个没有被保存下来的世界，是否存在过？','留下','离开'],closeHint:'可以关闭这个标签页了。'},
 en:{repository:'Repository',author:'Author',systemTitle:'UMWELT OBSERVATION SYSTEM',world:'UMWELT',about:'About',welcome:'UMWELT / Welcome',tick:'Three signals',rooftop:'Horticultural Era',isopoda:'Isopoda Fugue',closeWelcome:'Close welcome window',language:'Language: English · Switch to 日本語',soundOn:'Sound effects on · Turn off',soundOff:'Sound effects off · Turn on',endMenu:'End observation',leaveMenu:'Leave environment',end:['End observation.','This world is unseen for a while.','Continue','End'],leave:['Leave environment.','Did a world that was never saved exist?','Stay','Leave'],closeHint:'You can close this tab now.'},
 ja:{repository:'リポジトリ',author:'作者のサイト',systemTitle:'環世界観測システム',world:'環世界',about:'このﾍﾟｰｼﾞについて',welcome:'UMWELT / ようこそ',tick:'三つの信号',rooftop:'園芸時代',isopoda:'等脚目のフーガ',closeWelcome:'ようこそウィンドウを閉じる',language:'言語：日本語 · 中文に切り替え',soundOn:'効果音オン · オフにする',soundOff:'効果音オフ · オンにする',endMenu:'観察を終える',leaveMenu:'環境を離れる',end:['観察を終える。','この世界は、しばらく見られなくなる。','続ける','終える'],leave:['環境を離れる。','保存されなかった世界は、存在したのだろうか？','残る','離れる'],closeHint:'このタブを閉じてください。'}
};
if(window.umweltNative){
 copy.zh.leaveMenu='卸载环境';copy.zh.leave=['卸载环境。','一个没有被保存下来的世界，是否存在过？','留下','卸载'];
 copy.en.leaveMenu='Uninstall environment';copy.en.leave=['Uninstall environment.','Did a world that was never saved exist?','Stay','Uninstall'];
 copy.ja.leaveMenu='環境をアンインストール';copy.ja.leave=['環境をアンインストール。','保存されなかった世界は、存在したのだろうか？','残る','アンインストール'];
}
const $=id=>document.getElementById(id),languages=['zh','en','ja'];
let language='zh',action='end';
try{const saved=localStorage.getItem('umwelt-desktop-language');if(languages.includes(saved))language=saved}catch{}
if(window.umweltNative){const update=document.createElement('button');update.dataset.action='updates';update.dataset.copy='updateMenu';$('systemMenu').append(update);copy.zh.updateMenu='查看更新';copy.en.updateMenu='Check for updates';copy.ja.updateMenu='更新を確認'}
if(!window.umweltNative)document.querySelector('[data-action="end"]')?.remove();
const audio=createAudioEngine({ambienceEnabled:false});
$('soundBtn').append(soundIcon());
function soundActive(){const s=audio.getSettings();return !s.sfx.muted&&s.sfx.volume>0&&!s.master.muted&&s.master.volume>0}
function renderSound(){const active=soundActive(),label=copy[language][active?'soundOn':'soundOff'];$('soundBtn').setAttribute('aria-pressed',String(active));$('soundBtn').setAttribute('aria-label',label);$('soundBtn').title=label}
function renderDialog(){const [title,detail,cancel,confirm]=copy[language][action];$('dialogTitle').textContent=title;$('dialogDetail').textContent=detail;$('cancelAction').textContent=cancel;$('confirmAction').textContent=confirm;$('closeHint').textContent=copy[language].closeHint}
function render(){const c=copy[language];document.documentElement.lang={zh:'zh-CN',en:'en',ja:'ja'}[language];document.title=c.systemTitle;document.querySelectorAll('[data-copy]').forEach(el=>el.textContent=c[el.dataset.copy]);$('closeWelcome').setAttribute('aria-label',c.closeWelcome);$('languageButton').textContent={zh:'中',en:'EN',ja:'日'}[language];$('languageButton').setAttribute('aria-label',c.language);$('languageButton').title=c.language;$('systemMenu').setAttribute('aria-label',c.world);renderSound();renderDialog()}
function updateClock(){const now=new Date(),pad=n=>String(n).padStart(2,'0'),date=`${now.getFullYear()}/${pad(now.getMonth()+1)}/${pad(now.getDate())}`,time=`${pad(now.getHours())}:${pad(now.getMinutes())}`;$('desktopDate').textContent=date;$('desktopDate').dateTime=date.replaceAll('/','-');$('desktopTime').textContent=time;$('desktopTime').dateTime=time}
function closeMenu(){ $('systemMenu').hidden=true;$('systemButton').setAttribute('aria-expanded','false') }
$('closeWelcome').onclick=()=>$('welcome').hidden=true;
$('aboutButton').onclick=()=>$('welcome').hidden=false;
$('languageButton').onclick=()=>{language=languages[(languages.indexOf(language)+1)%3];try{localStorage.setItem('umwelt-desktop-language',language);localStorage.setItem('isopoda-ui-language-v1',language)}catch{}render()};
$('soundBtn').onclick=()=>{const active=soundActive();audio.set('sfx',{muted:active,...(!active&&audio.getSettings().sfx.volume===0?{volume:.45}:{})});if(!active){audio.set('master',{muted:false,...(audio.getSettings().master.volume===0?{volume:.8}:{})});void audio.unlock().then(()=>audio.play('click'))}};
audio.subscribe(renderSound);
$('systemButton').onclick=()=>{const opening=$('systemMenu').hidden;$('systemMenu').hidden=!opening;$('systemButton').setAttribute('aria-expanded',String(opening));if(opening)$('systemMenu').querySelector('button').focus()};
$('systemMenu').onclick=event=>{const button=event.target.closest('[data-action]');if(!button)return;action=button.dataset.action;closeMenu();if(action==='updates'){void window.umweltNative.checkUpdates();action='end';return;}$('closeHint').hidden=true;renderDialog();$('systemDialog').showModal()};
$('cancelAction').onclick=()=>$('systemDialog').close();
$('systemDialog').addEventListener('close',()=>$('systemButton').focus());
// The native shell keeps browser behavior unchanged on the public website.
$('confirmAction').onclick=async()=>{if(window.umweltNative){if(action==='leave'){await window.umweltNative.uninstall();$('systemDialog').close()}else await window.umweltNative.quit();return}window.close();setTimeout(()=>location.replace('about:blank'),100)};
document.addEventListener('pointerdown',event=>{if(event.isTrusted)void audio.unlock();if(!event.target.closest('#systemMenu,#systemButton'))closeMenu()});
document.addEventListener('keydown',event=>{if(event.isTrusted)void audio.unlock();if(event.key==='Escape'&&!$('systemMenu').hidden){closeMenu();$('systemButton').focus()}if(event.target.closest('#systemMenu')&&['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const buttons=[...$('systemMenu').querySelectorAll('button')],index=buttons.indexOf(document.activeElement);buttons[event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length].focus()}});
document.addEventListener('focusin',event=>{if(!event.target.closest('#systemMenu,#systemButton'))closeMenu()});
document.addEventListener('click',event=>{const button=event.target.closest('button,a');if(event.isTrusted&&button&&!button.disabled)audio.play('click')},true);
document.addEventListener('visibilitychange',()=>{updateClock();if(document.hidden){closeMenu();void audio.suspend()}else void audio.resume()});
document.querySelectorAll('.desktop-icon').forEach(link=>link.addEventListener('click',()=>{try{localStorage.setItem('isopoda-ui-language-v1',language)}catch{}}));
function restoreLanguage(){try{const saved=localStorage.getItem('umwelt-desktop-language');if(languages.includes(saved))language=saved}catch{}render()}
window.addEventListener('storage',event=>{if(event.key==='umwelt-desktop-language')restoreLanguage()});
window.addEventListener('pagehide',()=>void audio.suspend());window.addEventListener('pageshow',()=>{restoreLanguage();updateClock();if(!document.hidden)void audio.resume()});
render();updateClock();setInterval(updateClock,1000);

paintDesktopIcons();
