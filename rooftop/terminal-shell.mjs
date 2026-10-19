import './app.mjs';
import { signalFingerprint } from './terminal-signal.mjs';

if (!document.body.classList.contains('background-stage')) mountTerminal();

function mountTerminal() {
  const world = document.querySelector('.roof-world');
  if (!world) return;
  const canvas = document.querySelector('#garden');
  const originalTitle = document.title;
  const shell = document.createElement('div');
  shell.className = 'terminal-shell'; shell.hidden = true;
  shell.innerHTML = `
    <section class="terminal-monitor terminal-panel" aria-label="REC">
      <div class="terminal-bezel">
        <svg class="terminal-recess" viewBox="0 0 1000 750" preserveAspectRatio="none" aria-hidden="true"><path fill="#20221f" d="M0 0H1000L976 24H24Z"/><path fill="#292c27" d="M0 0L24 24V726L0 750Z"/><path fill="#5b5e55" d="M0 750L24 726H976L1000 750Z"/><path fill="#484c42" d="M1000 0L976 24V726L1000 750Z"/></svg>
        <div class="terminal-screen"><span class="terminal-live-mark" aria-hidden="true"><i></i>REC</span></div>
      </div>
      <div class="terminal-console"><div id="terminalSourceDock"></div><div id="terminalViewDock"></div><svg class="terminal-speaker" viewBox="0 0 72 16" aria-hidden="true"><path d="M0 1H72M0 5H72M0 9H72M0 13H72"/></svg><div id="terminalAudioDock"></div><button type="button" class="terminal-power" data-display="full" aria-label="关闭电视，进入游戏"><span aria-hidden="true">⏻</span></button></div>
    </section>
    <aside class="terminal-side" aria-label="ENV">
      <section class="terminal-panel terminal-environment"><h2 class="terminal-caption">ENV</h2>
        <div class="terminal-environment-screen">
          <svg class="terminal-signal-map" viewBox="0 0 216 152" aria-hidden="true">
            <defs><pattern id="terminalGrid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="currentColor" stroke-width=".4" opacity=".28"/></pattern></defs>
            <rect x="0" y="0" width="216" height="152" fill="url(#terminalGrid)"/>
            <g class="terminal-orbit" fill="none" stroke="currentColor" stroke-width=".7">
              <ellipse cx="95" cy="75" rx="67" ry="47"/><ellipse cx="95" cy="75" rx="67" ry="20"/>
              <ellipse cx="95" cy="75" rx="29" ry="47"/><ellipse cx="95" cy="75" rx="52" ry="47"/>
              <path d="M95 18V132M18 75H172M36 49H154M36 101H154" opacity=".6"/>
              <path d="M95 25L145 104L45 104Z" stroke-dasharray="2 4" opacity=".6"/>
              <circle cx="95" cy="75" r="4"/><circle class="terminal-orbit-dot" cx="146" cy="45" r="2.5" fill="currentColor"/>
            </g>
            <g fill="none" stroke="currentColor" stroke-width="1"><path d="M190 24V125M184 24H196M184 49H192M184 75H196M184 100H192M184 125H196"/><path class="terminal-gauge-pin" d="M179 70L185 74L179 78Z" fill="currentColor"/></g>
          </svg>
          <div id="terminalEnvironmentDock"></div>
          <div class="terminal-wave" aria-hidden="true"><svg viewBox="0 0 208 29"><path d="M0 16H18L23 13L29 18L35 16H44L48 11L54 22L60 7L66 18L72 15H92L98 18L104 12L111 16H126L133 6L139 24L144 13L151 16H172L180 13L190 18L198 16H208"/></svg></div>
        </div>
      </section>
    </aside>
    <section class="terminal-panel terminal-journal"><h2 class="terminal-caption">RX</h2><div id="terminalLogDock"></div></section>`;
  world.before(shell);
  const worldHome = document.createComment('full-screen game'); world.before(worldHome);
  const controls = [
    ['.view-controls', '#terminalViewDock'], ['#environmentHud', '#terminalEnvironmentDock'],
    ['#statusLog', '#terminalLogDock'], ['#sceneCard', '#terminalSourceDock'], ['#musicToggle', '#terminalAudioDock'],
  ].map(([selector, target]) => {
    const element = document.querySelector(selector), home = document.createComment(selector);
    element.before(home); return {element, home, dock:shell.querySelector(target)};
  });
  const enter = document.createElement('button');
  enter.type = 'button'; enter.className = 'terminal-enter';
  const powerGlyph = document.createElement('span');
  powerGlyph.textContent = '⏻'; powerGlyph.setAttribute('aria-hidden', 'true'); enter.append(powerGlyph);
  enter.setAttribute('aria-label', '打开电视'); document.body.append(enter);
  const viewNumbers = {bird:'01', drone:'02', neighbor:'03'};
  const fullLabels = {bird:'经常啄多肉的小鸟', drone:'偶尔路过的无人机', neighbor:'？'};
  const fullHints = {bird:'左右拖动沿檐走动，上下拖动微微抬头或低头。', drone:'拖动转动镜头，按钮升降；滚轮或双指靠近、退远。', neighbor:'拖动瞄准；滚轮或双指调整倍率。'};
  let terminal = false;
  const setAttribute = (element, name, value) => {
    if (element.getAttribute(name) !== value) element.setAttribute(name, value);
  };
  const sourceRows = new WeakMap();
  const log = document.querySelector('#statusLog');
  function syncLog() {
    for (const row of log.children) {
      const time = row.querySelector('time'), text = row.querySelector('.status-text');
      if (!time || !text) continue;
      if (!sourceRows.has(row)) sourceRows.set(row, {text:text.textContent,time:time.textContent,dateTime:time.getAttribute('datetime'),title:time.title});
      const original = sourceRows.get(row);
      const prefix = {weather:'ENV',activity:'ACT',presence:'IO',scene:'CH',observer:'RX',music:'AF'}[row.dataset.statusKind] || 'RX';
      const nextText = terminal ? `${prefix} / ${signalFingerprint(original.text)}   ·   ▰ ▱ ▰` : original.text;
      const nextTime = terminal ? (Number(row.dataset.eventId) || 0).toString(16).toUpperCase().padStart(4,'0') : original.time;
      if (text.textContent !== nextText) text.textContent = nextText;
      if (time.textContent !== nextTime) time.textContent = nextTime;
      if (terminal) { time.removeAttribute('datetime'); time.removeAttribute('title'); }
      else { if (original.dateTime) setAttribute(time,'datetime',original.dateTime); setAttribute(time,'title',original.title); }
    }
    setAttribute(log,'aria-label',terminal ? 'RX' : '天台动态');
  }
  new MutationObserver(syncLog).observe(log, {subtree:true,childList:true});
  function syncReadouts() {
    const selected = document.querySelector('[data-narrative-view][aria-pressed="true"]');
    const view = selected?.dataset.narrativeView || 'drone';
    const number = viewNumbers[view];
    const fullScope = !terminal && view === 'neighbor';
    const south = canvas.getAttribute('aria-label')?.startsWith('南');
    shell.dataset.channel = number;
    for (const button of document.querySelectorAll('[data-narrative-view]')) {
      setAttribute(button,'data-terminal-number',viewNumbers[button.dataset.narrativeView]);
      const label = terminal ? '机位 ' + viewNumbers[button.dataset.narrativeView]
        : fullScope && button.dataset.narrativeView === 'neighbor' ? '退出狙击' : fullLabels[button.dataset.narrativeView];
      setAttribute(button,'aria-label',label);
      if (terminal) button.removeAttribute('title'); else setAttribute(button,'title',label);
    }
    for (const button of document.querySelectorAll('[data-station-action]')) {
      if (terminal) button.removeAttribute('title');
      else setAttribute(button,'title',button.getAttribute('aria-label'));
    }
    const station = document.querySelector('.station-controls');
    setAttribute(station, 'aria-label', terminal ? '机位 ' + number : {bird:'小鸟操作',drone:'无人机操作',neighbor:'瞄准镜操作'}[view]);
    if (terminal || fullScope) canvas.removeAttribute('title'); else setAttribute(canvas,'title',fullHints[view]);
    const sceneButton = document.querySelector('#sceneCard');
    sceneButton.dataset.terminalDestination = south ? 'north' : 'south';
  }
  const readouts = new MutationObserver(syncReadouts);
  readouts.observe(document.querySelector('.view-controls'), {subtree:true,childList:true,attributes:true,attributeFilter:['aria-pressed']});
  readouts.observe(canvas, {attributes:true,attributeFilter:['aria-label','title']});
  const actionTitles = new WeakMap();
  const actions = document.querySelector('.status-actions');
  const actionButtons = [...actions.querySelectorAll('button,a')];
  function syncActions() {
    if (!terminal) return;
    for (const button of actionButtons) {
      button.inert = button.hidden || ['returnWorld','notebookOpen','roomCard','garageCard'].includes(button.id);
      if (button.hasAttribute('title')) {actionTitles.set(button,button.title);button.removeAttribute('title');}
    }
  }
  const actionChanges = new MutationObserver(syncActions);
  for (const button of actionButtons) actionChanges.observe(button,{attributes:true,attributeFilter:['title','hidden']});
  const resizeScreen = () => world.style.setProperty('--terminal-scope-diameter', Math.min(canvas.clientWidth*.88,canvas.clientHeight*.82)+'px');
  new ResizeObserver(resizeScreen).observe(world);
  function setMode(mode, save = true) {
    terminal = mode === 'terminal';
    document.body.classList.toggle('terminal-mode-active',terminal);
    canvas.dataset.terminalCrt = String(terminal);
    document.title = terminal ? '7C—4A / REC' : originalTitle;
    shell.hidden = !terminal; enter.hidden = terminal;
    if (terminal) {
      document.querySelector('#notebookClose')?.click();
      shell.querySelector('.terminal-screen').prepend(world);
      for (const {element,dock} of controls) dock.append(element);
    } else {
      worldHome.after(world);
      for (const {element,home} of controls) home.after(element);
      for (const button of actionButtons) {
        button.inert = false;
        if (actionTitles.has(button)) {setAttribute(button,'title',actionTitles.get(button)); actionTitles.delete(button);}
      }
    }
    if (save) {
      try {localStorage.setItem('umwelt-rooftop-display',mode);} catch {}
      const url = new URL(location.href); url.searchParams.set('display',mode); history.replaceState(null,'',url);
    }
    syncReadouts(); syncLog(); syncActions(); resizeScreen(); window.dispatchEvent(new Event('resize'));
  }
  enter.addEventListener('click',() => setMode('terminal'));
  for (const button of shell.querySelectorAll('[data-display]')) button.addEventListener('click',() => setMode(button.dataset.display));
  let remembered = 'full';
  try {remembered = localStorage.getItem('umwelt-rooftop-display') || 'full';} catch {}
  const query = new URLSearchParams(location.search).get('display'); setMode(query || remembered,Boolean(query));
  window.addEventListener('popstate',() => setMode(new URLSearchParams(location.search).get('display') || remembered,false));
}
