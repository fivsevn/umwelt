import { CLIMATE_LOCATION } from './climate.mjs';

const clock = new Intl.DateTimeFormat('en-GB', {
  timeZone: CLIMATE_LOCATION.timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});
export const statusTime = at => clock.format(new Date(at));
const clean = text => String(text || '').replace(/\s+/g, ' ').trim();
const signature = text => clean(text).replace(/[\s，。！？、,.!?]/g, '');
const order = { weather: 0, scene: 1, presence: 2, activity: 3, observer: 4, music: 5 };

// Only semantic changes become events; short-lived observations may settle
// or disappear before publication. Clock ticks and DOM changes are not events.
export function createStatusJournal({ limit = 4, settle = 800, repeatAfter = 30000 } = {}) {
  const channels = new Map(), recent = new Map();
  let entries = [], serial = 0, revision = 0;
  return {
    observe(kind, value, at, { immediate = false } = {}) {
      const text = clean(value), state = channels.get(kind) || { current: '', pending: null };
      if (text === state.current) state.pending = null;
      else if (state.pending?.text !== text) state.pending = { text, at, ready: at + (immediate ? 0 : settle) };
      channels.set(kind, state);
    },
    reset(kind) { channels.delete(kind); },
    flush(at) {
      const ready = [...channels].filter(([, state]) => state.pending && state.pending.ready <= at)
        .map(([kind, state]) => ({ kind, state, ...state.pending }))
        .sort((a, b) => a.at - b.at || order[a.kind] - order[b.kind]);
      for (const event of ready) {
        event.state.current = event.text;
        event.state.pending = null;
        if (!event.text) continue;
        const key = signature(event.text), last = recent.get(key);
        if (last !== undefined && event.at - last < repeatAfter) continue;
        entries = entries.filter(entry => signature(entry.text) !== key);
        entries.push({ id: ++serial, kind: event.kind, text: event.text, at: event.at });
        entries.sort((a, b) => a.at - b.at || order[a.kind] - order[b.kind] || a.id - b.id);
        entries = entries.slice(-limit);
        recent.set(key, event.at);
        revision++;
      }
      for (const [key, time] of recent) if (at - time >= repeatAfter) recent.delete(key);
      return revision;
    },
    get entries() { return entries.map(entry => ({ ...entry })); },
  };
}
