import {createAudioEngine} from '../assets/audio/audio-engine.mjs';
import {iconButton} from './ui.mjs';
import {getLanguage} from './i18n.mjs';
export const audioEngine=createAudioEngine();
const copy={zh:['音乐 / 环境','音效','静音','开启','音量'],en:['Music / ambience','Sound effects','Mute','On','Volume'],ja:['音楽 / 環境音','効果音','ミュート','オン','音量'],isopod:['♪ ~','o!','…','o','↕']};
const controls=[];
function labels(){const c=copy[getLanguage()]||copy.zh;for(const [i,item] of controls.entries()){const s=audioEngine.getSettings()[item.channel],active=!s.muted&&s.volume>0;item.label.textContent=c[i];item.button.title=c[i];item.button.setAttribute('aria-label',c[i]);item.button.setAttribute('aria-pressed',String(active));item.panel.setAttribute('aria-label',c[i]);item.range.setAttribute('aria-label',`${c[i]} · ${c[4]}`);item.range.value=Math.round(s.volume*100);item.output.textContent=`${item.range.value}%`;item.mute.textContent=s.muted?c[2]:c[3];item.mute.setAttribute('aria-label',`${c[i]} · ${c[2]}`);item.mute.setAttribute('aria-pressed',String(s.muted))}}
function closeAll(){for(const c of controls){c.panel.hidden=true;c.button.setAttribute('aria-expanded','false')}}
for(const [channel,id] of [['music','musicBtn'],['sfx','soundBtn']]){
 const button=document.getElementById(id),wrap=document.createElement('span');wrap.className='audio-control';button.before(wrap);wrap.append(button);
 const panel=document.createElement('div');panel.className='audio-panel';panel.id=`${id}Panel`;panel.hidden=true;panel.setAttribute('role','group');
 const label=document.createElement('strong'),range=document.createElement('input'),output=document.createElement('output'),mute=document.createElement('button');
 range.type='range';range.min='0';range.max='100';range.step='1';mute.type='button';panel.append(label,range,output,mute);wrap.append(panel);
 button.setAttribute('aria-controls',panel.id);button.setAttribute('aria-expanded','false');
 button.addEventListener('click',()=>{const opening=panel.hidden;closeAll();panel.hidden=!opening;button.setAttribute('aria-expanded',String(opening));if(opening)range.focus()});
 range.addEventListener('input',()=>audioEngine.set(channel,{volume:Number(range.value)/100}));mute.addEventListener('click',()=>audioEngine.set(channel,{muted:!audioEngine.getSettings()[channel].muted}));
 controls.push({channel,button,wrap,panel,label,range,output,mute});
}
iconButton(document.getElementById('soundBtn'),'sound','');
labels();audioEngine.subscribe(labels);
window.addEventListener('load',labels);window.addEventListener('isopoda:languagechange',()=>queueMicrotask(labels));
document.addEventListener('pointerdown',event=>{if(event.isTrusted)void audioEngine.unlock();if(!controls.some(c=>c.wrap.contains(event.target)))closeAll()});
document.addEventListener('keydown',event=>{if(event.isTrusted)void audioEngine.unlock();if(event.key==='Escape'){const active=controls.find(c=>!c.panel.hidden);closeAll();active?.button.focus()}});
document.addEventListener('focusin',event=>{if(!controls.some(c=>c.wrap.contains(event.target)))closeAll()});
document.addEventListener('click',event=>{const button=event.target.closest('button,a');if(!event.isTrusted||!button||button.disabled||button.getAttribute('aria-disabled')==='true')return;const id=button.id;audioEngine.play(/close|prev|back/i.test(id)?'back':/start|settle|next|continue/i.test(id)?'confirm':'click')},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden){closeAll();void audioEngine.suspend()}else void audioEngine.resume()});
window.addEventListener('pagehide',()=>void audioEngine.suspend());window.addEventListener('pageshow',()=>{if(!document.hidden)void audioEngine.resume()});
