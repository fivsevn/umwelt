// “盆沿的午后”: sixteen bars, 72 BPM; mellow keys and a swung, quiet drum groove. All sound is synthesized locally.
const CHORDS = [[48,55,59,64],[43,55,59,62],[45,52,57,60],[41,53,57,60],
  [48,55,59,64],[47,55,59,62],[45,52,57,64],[41,53,57,60],
  [50,57,60,65],[43,55,59,62],[48,55,59,64],[45,52,57,60],
  [41,53,57,60],[43,55,59,62],[48,55,59,62],[48,55,59,64]];
const MELODY = [[76,79,74],[71,74,79],[72,76,69],[69,72,76],
  [79,76,74],[74,71,67],[69,76,72],[72,69,67],
  [77,76,72],[74,71,69],[76,79,74],[72,76,69],
  [69,72,76],[74,71,67],[72,76,74],[71,67,72]];
export function playNote(context, destination, midi, start, duration, volume, soft = false) {
  const oscillator = context.createOscillator(), envelope = context.createGain();
  oscillator.type = soft ? 'sine' : 'triangle';
  oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(volume, start + (soft ? .6 : .025));
  envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
  oscillator.connect(envelope).connect(destination);
  oscillator.start(start); oscillator.stop(start + duration + .02);
  oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
}
export const BAR_SECONDS = 4 * 60 / 72;
const noiseBuffers = new WeakMap();
function percussion(context, destination, start, kind, volume) {
  const envelope = context.createGain();
  let source, filter;
  const length = kind === 'kick' ? .22 : kind === 'snare' ? .14 : .045;
  if (kind === 'kick') {
    source = context.createOscillator();
    source.frequency.setValueAtTime(105, start);
    source.frequency.exponentialRampToValueAtTime(43, start + .16);
  } else {
    let noise = noiseBuffers.get(context);
    if (!noise) {
      noise = context.createBuffer(1, Math.ceil(context.sampleRate * .2), context.sampleRate);
      const data = noise.getChannelData(0); let seed = 57;
      for (let i = 0; i < data.length; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; data[i] = seed / 2147483648 - 1; }
      noiseBuffers.set(context, noise);
    }
    source = context.createBufferSource(); source.buffer = noise;
    filter = context.createBiquadFilter(); filter.type = 'bandpass';
    filter.frequency.value = kind === 'snare' ? 1400 : 6500; filter.Q.value = .6;
  }
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(volume, start + .004);
  envelope.gain.exponentialRampToValueAtTime(.0001, start + length);
  if (filter) source.connect(filter).connect(envelope); else source.connect(envelope);
  envelope.connect(destination); source.start(start); source.stop(start + length + .01);
  source.onended = () => { source.disconnect(); filter?.disconnect(); envelope.disconnect(); };
}
export function scheduleBar(context, destination, bar, start) {
  const index = bar % 16, chord = CHORDS[index], beat = 60 / 72;
  playNote(context, destination, chord[0], start, 2.8, .11, true);
  // Slightly staggered seventh chords, with a small off-beat reply.
  chord.slice(1).forEach((note, i) => {
    playNote(context, destination, note, start + .035 * i, 2.3, .035);
    playNote(context, destination, note, start + 2.65 * beat + .035 * i, 1.2, .017);
  });
  MELODY[index].forEach((note, i) => playNote(context, destination, note - 12, start + [.6, 1.8, 3.15][i] * beat, 1.9, .035));
  [0, 2.5].forEach(t => percussion(context, destination, start + t * beat, 'kick', .14));
  [1, 3].forEach(t => percussion(context, destination, start + (t + .025) * beat, 'snare', .055));
  for (let i = 0; i < 8; i++) percussion(context, destination, start + (i * .5 + (i % 2 ? .08 : 0)) * beat, 'hat', i % 2 ? .018 : .025);
}
export function attachGardenMusic(button) {
  let context, master, timer, nextBar = 0, nextTime = 0, enabled = false, busy = false;
  function schedule() {
    if (!enabled || document.hidden || context.state !== 'running') return;
    while (nextTime < context.currentTime + .25) {
      scheduleBar(context, master, nextBar++, nextTime); nextTime += BAR_SECONDS;
    }
  }
  function label() {
    button.textContent = enabled ? '关上窗，先不听了。' : '听听隔壁的音乐。';
    button.setAttribute('aria-label', enabled ? '隔壁的音乐，正在播放，点击关闭' : '隔壁的音乐，已关闭，点击开启');
    button.title = enabled ? '关闭音乐' : '开启音乐';
    button.setAttribute('aria-pressed', String(enabled));
  }
  button.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    try {
      if (!context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        context = new Audio(); master = context.createGain(); master.gain.value = 0;
        const warmth = context.createBiquadFilter(); warmth.type = 'lowpass'; warmth.frequency.value = 3200; warmth.Q.value = .5;
        master.connect(warmth).connect(context.destination); nextTime = context.currentTime + .08;
      }
      if (!enabled) {
        await context.resume(); enabled = true;
        master.gain.cancelScheduledValues(context.currentTime);
        master.gain.setValueAtTime(0, context.currentTime);
        master.gain.linearRampToValueAtTime(.65, context.currentTime + .8);
        schedule(); timer = setInterval(schedule, 100);
      } else {
        enabled = false; clearInterval(timer);
        master.gain.cancelScheduledValues(context.currentTime);
        master.gain.setTargetAtTime(0, context.currentTime, .04);
        await new Promise(resolve => setTimeout(resolve, 180));
        await context.suspend();
      }
      label();
    } catch {
      enabled = false; clearInterval(timer); label();
      button.setAttribute('aria-label', '隔壁的音乐，播放失败，点击重试');
      button.title = '点击重试';
      if (context) await context.suspend().catch(() => {});
    } finally { busy = false; }
  });
  document.addEventListener('visibilitychange', async () => {
    if (!context || !enabled || busy) return;
    if (document.hidden) await context.suspend();
    else { await context.resume().catch(() => {}); schedule(); }
  });
  window.addEventListener('pagehide', () => { clearInterval(timer); context?.close().catch(() => {}); });
  label();
}
