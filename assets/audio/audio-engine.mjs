// Shared Web Audio mixer. No context is created until unlock() is called by a gesture.
export const AUDIO_KEY='umwelt-audio-v1';
export const DEFAULTS={master:{volume:0.8,muted:false},music:{volume:0.3,muted:false},sfx:{volume:0.45,muted:false}};
export function createAudioEngine({storage,Context,music}={}){
 let settings=structuredClone(DEFAULTS),ctx,buses,unlocked=false,lastTone=-1;
 try{storage??=globalThis.localStorage;const saved=JSON.parse(storage.getItem(AUDIO_KEY));for(const key of Object.keys(settings)){const v=saved?.[key];if(Number.isFinite(v?.volume))settings[key].volume=Math.max(0,Math.min(1,v.volume));if(typeof v?.muted==='boolean')settings[key].muted=v.muted}}catch{}
 const listeners=new Set();
 globalThis.addEventListener?.('storage',event=>{
  if(event.key!==AUDIO_KEY||event.storageArea!==storage)return;
  try{const saved=JSON.parse(event.newValue);for(const key of Object.keys(settings)){
   const value=saved?.[key];if(Number.isFinite(value?.volume))settings[key].volume=Math.max(0,Math.min(1,value.volume));if(typeof value?.muted==='boolean')settings[key].muted=value.muted;
  }apply();listeners.forEach(fn=>fn())}catch{}
 });
 const ramp=(node,value)=>{node.gain.cancelScheduledValues(ctx.currentTime);node.gain.setTargetAtTime(value,ctx.currentTime,0.045)};
 function apply(){if(buses)for(const key of Object.keys(settings))ramp(buses[key],settings[key].muted?0:settings[key].volume)}
 async function unlock(){
  try{if(!ctx){const C=Context||globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return false;ctx=new C();buses={};for(const key of Object.keys(settings)){buses[key]=ctx.createGain();buses[key].gain.value=0}buses.music.connect(buses.master);buses.sfx.connect(buses.master);buses.master.connect(ctx.destination);apply();music?.(ctx,buses.music)}
   await ctx.resume();unlocked=ctx.state==='running';return unlocked;
  }catch{return false}
 }
 function set(channel,patch){if(!settings[channel])return;const target=settings[channel];if(Number.isFinite(patch.volume))target.volume=Math.max(0,Math.min(1,patch.volume));if(typeof patch.muted==='boolean')target.muted=patch.muted;apply();try{storage?.setItem(AUDIO_KEY,JSON.stringify(settings))}catch{}listeners.forEach(fn=>fn())}
 function play(kind='click'){
  if(!ctx||ctx.state!=='running'||settings.sfx.muted||settings.master.muted)return;
  const now=ctx.currentTime;if(now-lastTone<0.045)return;lastTone=now;
  // A plastic key impact followed by a quieter switch return, not a pitched beep.
  const pitch=kind==='confirm'?1050:kind==='back'?750:900;
  for(const [delay,level] of [[0,.48],[.022,.2]]){
   const length=.026,buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*length),ctx.sampleRate),data=buffer.getChannelData(0);
   for(let i=0;i<data.length;i++){const t=i/ctx.sampleRate;data[i]=(Math.random()*2-1)*Math.exp(-t/0.0045)}
   const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=2400;filter.Q.value=.5;gain.gain.value=level;
   source.connect(filter).connect(gain).connect(buses.sfx);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect()};source.start(now+delay);
  }
  const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='triangle';osc.frequency.setValueAtTime(pitch,now);osc.frequency.exponentialRampToValueAtTime(180,now+.018);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.16,now+.001);gain.gain.exponentialRampToValueAtTime(.0001,now+.025);osc.connect(gain).connect(buses.sfx);osc.onended=()=>{osc.disconnect();gain.disconnect()};osc.start(now);osc.stop(now+.03);
 }
 return {unlock,play,set,getSettings:()=>structuredClone(settings),subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)},async suspend(){try{await ctx?.suspend()}catch{}},async resume(){if(unlocked)return unlock()},get state(){return ctx?.state||'locked'}};
}
