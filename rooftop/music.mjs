// “盆沿的午后”: sixteen bars, 60 BPM. All sound is synthesized locally.
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
  oscillator.type = 'sine';
  oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(volume, start + (soft ? .6 : .025));
  envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
  oscillator.connect(envelope).connect(destination);
  oscillator.start(start); oscillator.stop(start + duration + .02);
  oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
}
export function scheduleBar(context, destination, bar, start) {
  const index = bar % 16, chord = CHORDS[index];
  playNote(context, destination, chord[0], start, 3.8, .12, true);
  chord.slice(1).forEach((note, i) => playNote(context, destination, note, start + i * .16, 4.8, .035, true));
  MELODY[index].forEach((note, i) => playNote(context, destination, note, start + [.5, 1.75, 3][i], 2.6, .065));
  if (index % 4 === 2) playNote(context, destination, chord[2] + 12, start + 2.5, 1.8, .025);
}
export function attachGardenMusic(button) {
  let context, master, timer, nextBar = 0, nextTime = 0, enabled = false, busy = false;
  function schedule() {
    if (!enabled || document.hidden || context.state !== 'running') return;
    while (nextTime < context.currentTime + .25) {
      scheduleBar(context, master, nextBar++, nextTime); nextTime += 4;
    }
  }
  function label() {
    button.textContent = enabled ? '音乐：开' : '音乐：关';
    button.setAttribute('aria-pressed', String(enabled));
  }
  button.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    try {
      if (!context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        context = new Audio(); master = context.createGain(); master.gain.value = 0;
        master.connect(context.destination); nextTime = context.currentTime + .08;
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
      button.textContent = '音乐：点击重试';
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
