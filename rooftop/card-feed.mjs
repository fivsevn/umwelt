import { OBSERVER_MESSAGES } from './observer-ui.mjs';
import { createStatusJournal, statusTime } from './status-journal.mjs';

export function attachCardFeed(root, { scene, presence, now = Date.now }) {
  const journal = createStatusJournal(), log = root.querySelector('#statusLog');
  const sources = Object.fromEntries(['weatherStatus', 'actionStatus', 'observerStatus', 'dongdongStatus']
    .map(id => [id, root.querySelector('#' + id)]));
  const background = root.closest('.background-stage');
  let previousScene = scene(), wasPresent = presence().present;
  let music = root.querySelector('#musicToggle').getAttribute('aria-pressed') === 'true';
  let revision = -1;

  function paint(at) {
    const nextRevision = journal.flush(at);
    if (nextRevision === revision) return;
    revision = nextRevision;
    const entries = journal.entries, ids = new Set(entries.map(entry => String(entry.id)));
    for (const row of [...log.children]) if (!ids.has(row.dataset.eventId)) row.remove();
    for (const [index, entry] of entries.entries()) {
      let row = log.querySelector(`[data-event-id="${entry.id}"]`);
      if (!row) {
        row = document.createElement('div');
        row.className = 'world-card status-entry feed-enter';
        row.dataset.eventId = entry.id;
        row.dataset.statusKind = entry.kind;
        const time = document.createElement('time'), text = document.createElement('span');
        time.dateTime = new Date(entry.at).toISOString();
        time.textContent = statusTime(entry.at);
        time.title = '北京时间 · ' + new Date(entry.at).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
        text.className = 'status-text';text.textContent = entry.text;
        row.append(time, text);
      }
      row.classList.toggle('status-latest', entry.id === entries.at(-1).id);
      // Retain surviving nodes and timestamps; only new entries animate.
      if (log.children[index] !== row) log.insertBefore(row, log.children[index] || null);
    }
  }

  function update(_elapsed) {
    const at = now(), resident = presence(), currentScene = scene();
    if (currentScene !== previousScene) {
      journal.observe('scene', { north: '来到北天台。', south: '来到南阳台。', room: '回到房间。' }[currentScene], at, { immediate: true });
      journal.reset('activity');
      previousScene = currentScene;
    }
    journal.observe('weather', sources.weatherStatus.textContent, at);
    if (!background) {
      if (!resident.present) {
        sources.dongdongStatus.textContent = resident.status;
        journal.observe('presence', resident.status, at, { immediate: true });
      } else if (!wasPresent) {
        sources.dongdongStatus.textContent = '东东回来了。';
        journal.observe('presence', '东东回来了。', at, { immediate: true });
      }
      // The detailed departure above already says where Dongdong went.
      const action = sources.actionStatus.textContent.replace(/^东东出门了[，。]\s*/, '');
      journal.observe('activity', action, at);
      const playing = root.querySelector('#musicToggle').getAttribute('aria-pressed') === 'true';
      if (playing !== music) {
        journal.observe('music', playing ? '隔壁的音乐响起来了。' : '窗户关上了，音乐轻下去。', at, { immediate: true });
        music = playing;
      }
    }
    wasPresent = resident.present;
    // Available actions keep a fixed reading order and carry no event times.
    for (const id of ['roomCard', 'garageCard']) root.querySelector('#' + id).hidden = !resident.present || Boolean(background);
    root.querySelector('#returnWorld').hidden = currentScene !== 'north' || Boolean(background);
    root.querySelector('#musicToggle').hidden = Boolean(background);
    paint(at);
  }
  update(0);
  return {
    update,
    notifyObserver(view) {
      const text = OBSERVER_MESSAGES[view];
      if (!text || background) return false;
      const at = now();sources.observerStatus.textContent = text;
      journal.observe('observer', text, at, { immediate: true });
      paint(at);
      return true;
    },
  };
}
