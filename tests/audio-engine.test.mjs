import test from 'node:test';
import assert from 'node:assert/strict';
import {createAudioEngine,AUDIO_KEY} from '../assets/audio/audio-engine.mjs';
test('audio settings clamp saved values and keep mute, channels and master independent',()=>{
 let value=JSON.stringify({music:{volume:9,muted:true},sfx:{volume:'bad',muted:'bad'}});
 const storage={getItem:()=>value,setItem:(key,next)=>{assert.equal(key,AUDIO_KEY);value=next}};
 const a=createAudioEngine({storage});assert.equal(a.state,'locked');assert.deepEqual(a.getSettings().music,{volume:1,muted:true});assert.equal(a.getSettings().sfx.volume,.45);
 a.set('music',{volume:.17});a.set('sfx',{volume:.62});a.set('master',{muted:true});const restored=createAudioEngine({storage});assert.deepEqual(restored.getSettings(),a.getSettings());assert.equal(restored.getSettings().music.muted,true);assert.equal(restored.getSettings().sfx.muted,false);assert.equal(restored.state,'locked');
});
test('unavailable storage and audio do not break settings or controls',async()=>{
 const a=createAudioEngine({storage:{getItem(){throw Error()},setItem(){throw Error()}},Context:class{constructor(){throw Error()}}});a.set('music',{volume:.2});assert.equal(a.getSettings().music.volume,.2);assert.equal(await a.unlock(),false);a.play();await a.suspend();
});
