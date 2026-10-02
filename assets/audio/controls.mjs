import {soundIcon,musicIcon} from './sound-icon.mjs';
const copy={zh:['音乐','音效'],en:['Music','Sound effects'],ja:['音楽','効果音'],isopod:['♪','o!']};
export function attachAudioControls(engine,{language=()=> 'zh'}={}){
 const controls=[];
 function refresh(){const c=copy[language()]||copy.zh;for(const [i,item] of controls.entries()){
  const s=engine.getSettings()[item.channel],value=s.muted?0:Math.round(s.volume*100);
  item.button.removeAttribute('title');item.button.setAttribute('aria-label',c[i]);item.button.setAttribute('aria-pressed',String(value>0));
  item.panel.setAttribute('aria-label',c[i]);item.range.setAttribute('aria-label',c[i]);item.range.value=value;
  item.shell.style.setProperty('--volume',`${value}%`);
 }}
 function close(){for(const item of controls){item.panel.hidden=true;item.button.setAttribute('aria-expanded','false')}}
 for(const [channel,id,icon] of [['music','musicBtn',musicIcon],['sfx','soundBtn',soundIcon]]){
  const button=document.getElementById(id),wrap=document.createElement('span');wrap.className='audio-control';button.before(wrap);wrap.append(button);button.replaceChildren(icon());
  const panel=document.createElement('div'),shell=document.createElement('div'),range=document.createElement('input');
  panel.className='audio-panel';panel.id=`${id}Panel`;panel.hidden=true;panel.setAttribute('role','group');shell.className='audio-slider';
  range.type='range';range.min='0';range.max='100';range.step='1';range.setAttribute('orient','vertical');shell.append(range);panel.append(shell);wrap.append(panel);
  button.setAttribute('aria-controls',panel.id);button.setAttribute('aria-expanded','false');
  button.addEventListener('click',()=>{const opening=panel.hidden;close();if(opening){panel.hidden=false;button.setAttribute('aria-expanded','true');range.focus()}});
  range.addEventListener('input',()=>{const volume=Number(range.value)/100;engine.set(channel,{volume,muted:volume===0});if(volume>0){const master=engine.getSettings().master;if(master.muted||master.volume===0)engine.set('master',{muted:false,volume:master.volume||.8});void engine.unlock()}});
  controls.push({channel,button,wrap,panel,shell,range});
 }
 refresh();engine.subscribe(refresh);
 document.addEventListener('pointerdown',event=>{if(!controls.some(c=>c.wrap.contains(event.target)))close()});
 document.addEventListener('focusin',event=>{if(!controls.some(c=>c.wrap.contains(event.target)))close()});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'){const active=controls.find(c=>!c.panel.hidden);close();active?.button.focus()}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)close()});
 return {refresh,close};
}
