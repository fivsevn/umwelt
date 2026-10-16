// Fictional station marks: never encode or retain the real climate coordinates.
export const STATION_MARK = '7C4A : 0FB2';
export function signalFingerprint(text = '') {
  let hash = 2166136261;
  for (const char of String(text)) { hash ^= char.codePointAt(0); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(16).toUpperCase().padStart(8, '0').match(/.{2}/g).join(' ');
}
export function signalCounter(seconds = 0) {
  const ticks = Math.max(0, Math.floor(Number(seconds) || 0));
  return ticks.toString(16).toUpperCase().padStart(8, '0').replace(/(.{4})(.{4})/, '$1.$2');
}
export function environmentSignal(state = {}, elapsed = 0) {
  const condition = signalFingerprint(state.condition || 'pending');
  return {
    coordinates:STATION_MARK,
    clock:'+ ' + signalCounter(elapsed),
    sunset:'◒  ' + signalFingerprint(state.phase || '0').slice(0,5) + ' : ▰ ▱ ▰ ▰',
    weather:'Σ  ' + condition,
    live:state.weatherSource === 'current' || state.weatherSource === 'cached',
  };
}
