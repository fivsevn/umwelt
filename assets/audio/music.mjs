// “落叶下面”: a quiet sixteen-bar lo-fi loop, synthesized after the first gesture.
// Small cached percussion buffer; no audio downloads or long rendered buffers.
const CHORDS = [[45,52,55,59],[41,48,52,57],[48,55,59,62],[43,50,53,57],
 [45,52,55,60],[41,48,52,55],[48,52,55,59],[43,50,57,59],
 [50,53,57,60],[45,52,55,59],[41,48,52,57],[43,50,53,57],
 [45,52,55,59],[41,48,52,57],[43,50,53,59],[45,52,55,59]];
const MELODY = [64,60,62,59,60,57,59,62,65,64,60,59,64,60,59,57];
export function playNote(
  context,
  destination,
  midi,
  start,
  duration,
  volume,
  soft = false,
) {
  const oscillator = context.createOscillator(),
    envelope = context.createGain();
  oscillator.type = soft ? "sine" : "triangle";
  oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(volume, start + (soft ? 0.6 : 0.025));
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(envelope).connect(destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
  oscillator.onended = () => {
    oscillator.disconnect();
    envelope.disconnect();
  };
}
const BAR_SECONDS = (4 * 60) / 66;
const noiseBuffers = new WeakMap();
function percussion(context, destination, start, kind, volume) {
  const envelope = context.createGain();
  let source, filter;
  const length = kind === "kick" ? 0.22 : kind === "snare" ? 0.14 : 0.045;
  if (kind === "kick") {
    source = context.createOscillator();
    source.frequency.setValueAtTime(105, start);
    source.frequency.exponentialRampToValueAtTime(43, start + 0.16);
  } else {
    let noise = noiseBuffers.get(context);
    if (!noise) {
      noise = context.createBuffer(
        1,
        Math.ceil(context.sampleRate * 0.2),
        context.sampleRate,
      );
      const data = noise.getChannelData(0);
      let seed = 57;
      for (let i = 0; i < data.length; i++) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        data[i] = seed / 2147483648 - 1;
      }
      noiseBuffers.set(context, noise);
    }
    source = context.createBufferSource();
    source.buffer = noise;
    filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = kind === "snare" ? 1400 : 6500;
    filter.Q.value = 0.6;
  }
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(volume, start + 0.004);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + length);
  if (filter) source.connect(filter).connect(envelope);
  else source.connect(envelope);
  envelope.connect(destination);
  source.start(start);
  source.stop(start + length + 0.01);
  source.onended = () => {
    source.disconnect();
    filter?.disconnect();
    envelope.disconnect();
  };
}

export function startIsopodMusic(context, destination) {
 const warmth=context.createBiquadFilter();
 warmth.type='lowpass';warmth.frequency.value=2200;warmth.Q.value=.45;
 warmth.connect(destination);
 let nextTime=context.currentTime+.08,bar=0,timer;
 function schedule(){
  if(context.state!=='running')return;
  // Never catch up missed bars after a delayed foreground timer.
  if(nextTime<context.currentTime)nextTime=context.currentTime+.08;
  while(nextTime<context.currentTime+.3){
   const i=bar++%16,chord=CHORDS[i],beat=60/66,start=nextTime;
   playNote(context,warmth,chord[0]-12,start,3.2,.09,true);
   chord.slice(1).forEach((note,j)=>playNote(context,warmth,note,start+j*.045,3,.034));
   if(i%4!==3)playNote(context,warmth,MELODY[i],start+1.65*beat,2.1,.025,true);
   [0,2.55].forEach(t=>percussion(context,warmth,start+t*beat,'kick',.085));
   [1,3].forEach(t=>percussion(context,warmth,start+(t+.035)*beat,'snare',.027));
   [0,.58,1.5,2.58,3.5].forEach(t=>percussion(context,warmth,start+t*beat,'hat',.009));
   nextTime+=BAR_SECONDS;
  }
 }
 const stop=()=>{clearInterval(timer);timer=undefined};
 const sync=()=>{stop();if(context.state==='running'){schedule();timer=setInterval(schedule,150)}};
 context.addEventListener('statechange',sync);sync();
 return ()=>{stop();context.removeEventListener('statechange',sync);warmth.disconnect()};
}
