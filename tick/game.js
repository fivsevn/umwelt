(() => {
  const field = document.querySelector('#field');
  const signal = document.querySelector('#signal');
  const eyebrow = document.querySelector('#eyebrow');
  const action = document.querySelector('#actionButton');
  const rings = document.querySelector('#signalRings');
  const aboutButton = document.querySelector('#aboutButton');
  const aboutPanel = document.querySelector('#aboutPanel');
  const aboutClose = document.querySelector('#aboutClose');

  const timers = new Set();
  let phase = 'intro';
  let runId = 0;

  const later = (fn, ms) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  };

  const clearTimers = () => {
    for (const id of timers) window.clearTimeout(id);
    timers.clear();
  };

  const setAction = (label, enabled = true, cue = false) => {
    action.textContent = label;
    action.disabled = !enabled;
    action.classList.toggle('cue', cue);
  };

  const resetVisuals = () => {
    field.className = 'field';
    rings.classList.remove('active');
  };

  const fail = () => {
    clearTimers();
    phase = 'failed';
    rings.classList.remove('active');
    eyebrow.textContent = '—';
    signal.textContent = '错过信号。';
    setAction('重来');
  };

  const armCue = (nextPhase, cueText, actionText, waitText, timeout = 4200) => {
    phase = `${nextPhase}-waiting`;
    eyebrow.textContent = '…';
    signal.textContent = waitText;
    setAction('…', false);

    const thisRun = runId;
    later(() => {
      if (thisRun !== runId) return;
      phase = nextPhase;
      eyebrow.textContent = nextPhase === 'touch' ? '02 / 03' : '03 / 03';
      signal.textContent = cueText;
      setAction(actionText, true, true);

      later(() => {
        if (thisRun === runId && phase === nextPhase) fail();
      }, timeout);
    }, 1200 + Math.random() * 900);
  };

  const begin = () => {
    clearTimers();
    runId += 1;
    resetVisuals();
    phase = 'smell-waiting';
    eyebrow.textContent = '01 / 03';
    signal.textContent = '等待气味。';
    setAction('…', false);

    const thisRun = runId;
    later(() => {
      if (thisRun !== runId) return;
      phase = 'smell';
      rings.classList.add('active');
      signal.textContent = '气味';
      setAction('落下', true, true);

      later(() => {
        if (thisRun === runId && phase === 'smell') fail();
      }, 4600);
    }, 1800);
  };

  const drop = () => {
    clearTimers();
    rings.classList.remove('active');
    phase = 'falling';
    field.classList.add('falling');
    eyebrow.textContent = '…';
    signal.textContent = '坠落';
    setAction('…', false);

    const thisRun = runId;
    later(() => {
      if (thisRun !== runId) return;
      field.classList.remove('falling');
      field.classList.add('contact');
      armCue('touch', '接触', '爬行', '等待接触。', 4600);
    }, 900);
  };

  const crawl = () => {
    clearTimers();
    phase = 'crawling';
    eyebrow.textContent = '02 / 03';
    signal.textContent = '移动';
    setAction('…', false);

    const thisRun = runId;
    later(() => {
      if (thisRun !== runId) return;
      field.classList.add('warm');
      armCue('warmth', '温度', '叮咬', '寻找温度。', 5200);
    }, 900);
  };

  const bite = () => {
    clearTimers();
    phase = 'done';
    field.classList.add('done');
    eyebrow.textContent = '03 / 03';
    signal.textContent = '一个世界。';
    setAction('重来');
  };

  action.addEventListener('click', () => {
    if (phase === 'intro' || phase === 'failed' || phase === 'done') begin();
    else if (phase === 'smell') drop();
    else if (phase === 'touch') crawl();
    else if (phase === 'warmth') bite();
  });

  const openAbout = () => {
    aboutPanel.hidden = false;
    aboutClose.focus();
  };
  const closeAbout = () => {
    aboutPanel.hidden = true;
    aboutButton.focus();
  };

  aboutButton.addEventListener('click', openAbout);
  aboutClose.addEventListener('click', closeAbout);
  aboutPanel.addEventListener('click', (event) => {
    if (event.target === aboutPanel) closeAbout();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !aboutPanel.hidden) closeAbout();
  });

  // 阻止 iOS/Safari 在页面边缘产生橡皮筋式滚动。
  document.addEventListener('touchmove', (event) => event.preventDefault(), { passive: false });
})();
