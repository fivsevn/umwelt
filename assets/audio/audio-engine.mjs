// Shared Web Audio mixer. No context is created until unlock() is called by a gesture.
export const AUDIO_KEY='umwelt-audio-v1';
export const DEFAULTS={master:{volume:0.8,muted:false},music:{volume:0.3,muted:false},sfx:{volume:0.45,muted:false}};
export function createAudioEngine({storage,Context}={}){
 let settings=structuredClone(DEFAULTS),ctx,buses,unlocked=false,lastTone=-1;
 try{storage??=globalThis.localStorage;const saved=JSON.parse(storage.getItem(AUDIO_KEY));for(const key of Object.keys(settings)){const v=saved?.[key];if(Number.isFinite(v?.volume))settings[key].volume=Math.max(0,Math.min(1,v.volume));if(typeof v?.muted==='boolean')settings[key].muted=v.muted}}catch{}
 const listeners=new Set();
 const ramp=(node,value)=>{node.gain.cancelScheduledValues(ctx.currentTime);node.gain.setTargetAtTime(value,ctx.currentTime,0.045)};
 function apply(){if(buses)for(const key of Object.keys(settings))ramp(buses[key],settings[key].muted?0:settings[key].volume)}
 function ambience(){
  // A loop of smoothed noise, with matching endpoints; no whistles or random pitches.
  const buffer=ctx.createBuffer(1,ctx.sampleRate*8,ctx.sampleRate),data=buffer.getChannelData(0);let brown=0;
  for(let i=0;i<data.length;i++){brown=(brown+0.018*(Math.random()*2-1))/1.018;data[i]=brown}
  const delta=data[data.length-1]-data[0];for(let i=0;i<data.length;i++)data[i]-=delta*i/(data.length-1);
  const source=ctx.createBufferSource(),low=ctx.createBiquadFilter(),high=ctx.createBiquadFilter(),gain=ctx.createGain();
  source.buffer=buffer;source.loop=true;low.type='lowpass';low.frequency.value=650;high.type='highpass';high.frequency.value=90;gain.gain.value=0;
  source.connect(high).connect(low).connect(gain).connect(buses.music);source.start();gain.gain.setTargetAtTime(0.22,ctx.currentTime,1.2);
 }
 async function unlock(){
  try{if(!ctx){const C=Context||globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return false;ctx=new C();buses={};for(const key of Object.keys(settings)){buses[key]=ctx.createGain();buses[key].gain.value=0}buses.music.connect(buses.master);buses.sfx.connect(buses.master);buses.master.connect(ctx.destination);apply();ambience()}
   await ctx.resume();unlocked=ctx.state==='running';return unlocked;
  }catch{return false}
 }
 function set(channel,patch){if(!settings[channel])return;const target=settings[channel];if(Number.isFinite(patch.volume))target.volume=Math.max(0,Math.min(1,patch.volume));if(typeof patch.muted==='boolean')target.muted=patch.muted;apply();try{storage?.setItem(AUDIO_KEY,JSON.stringify(settings))}catch{}listeners.forEach(fn=>fn())}
 function play(kind='click'){
  if(!ctx||ctx.state!=='running'||settings.sfx.muted||settings.master.muted)return;
  const now=ctx.currentTime;if(now-lastTone<0.045)return;lastTone=now;
  const [start,end,duration]=({click:[220,170,.045],confirm:[260,340,.075],back:[190,130,.065]})[kind]||[220,170,.045];
  const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='triangle';osc.frequency.setValueAtTime(start,now);osc.frequency.exponentialRampToValueAtTime(end,now+duration);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.065,now+.004);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);osc.connect(gain).connect(buses.sfx);osc.onended=()=>{osc.disconnect();gain.disconnect()};osc.start(now);osc.stop(now+duration+.01);
 }
 return {unlock,play,set,getSettings:()=>structuredClone(settings),subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)},async suspend(){try{await ctx?.suspend()}catch{}},async resume(){if(unlocked)return unlock()},get state(){return ctx?.state||'locked'}};
}
