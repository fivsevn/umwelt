(() => {
  const field = document.querySelector('#field');
  const signal = document.querySelector('#signal');
  const description = document.querySelector('#description');
  const eyebrow = document.querySelector('#eyebrow');
  const action = document.querySelector('#actionButton');
  const status = document.querySelector('#status');
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

  const fail = (message) => {
    clearTimers();
    phase = 'failed';
    rings.classList.remove('active');
    eyebrow.textContent = 'NO SIGNAL';
    signal.textContent = '世界重新归于沉默。';
    description.textContent = message;
    status.textContent = 'NOTHING ELSE ENTERS YOUR WORLD';
    setAction('AGAIN');
  };

  const armCue = (nextPhase, label, cueText, detail, waitText, timeout = 4200) => {
    phase = `${nextPhase}-waiting`;
    setAction('WAIT', false);
    signal.textContent = waitText;
    description.textContent = '';
    status.textContent = 'WAIT';

    const thisRun = runId;
    later(() => {
      if (thisRun !== runId) return;
      phase = nextPhase;
      signal.textContent = cueText;
      description.textContent = detail;
      setAction(label, true, true);
      status.textContent = 'SIGNAL';

      later(() => {
        if (thisRun === runId && phase === nextPhase) {
          fail('信号经过了，而你没有行动。');
        }
      }, timeout);
    }, 1200 + Math.random() * 900);
  };

  const begin = () => {
    clearTimers();
    runId += 1;
    resetVisuals();
    phase = 'smell-waiting';
    eyebrow.textContent = 'I / CHEMICAL';
    signal.textContent = '等待。';
    description.textContent = '没有颜色。没有形状。没有远方。';
    setAction('WAIT', false);
    status.textContent = 'THE REST DOES NOT MATTER';

    const thisRun = runId;
    later(() => {
      if (thisRun !== runId) return;
      phase = 'smell';
      rings.classList.add('active');
      signal.textContent = 'BUTYRIC ACID';
      description.textContent = '一种来自哺乳动物的气味进入你的世界。';
      setAction('DROP', true, true);
      status.textContent = 'SIGNAL 01 / 03';

      later(() => {
        if (thisRun === runId && phase === 'smell') {
          fail('气味散去了。你仍留在枝头。');
        }
      }, 4600);
    }, 1800);
  };

  const drop = () => {
    clearTimers();
    rings.classList.remove('active');
    phase = 'falling';
    field.classList.add('falling');
    eyebrow.textContent = 'BETWEEN SIGNALS';
    signal.textContent = '坠落。';
    description.textContent = '';
    setAction('...', false);
    status.textContent = 'NO IMAGE OF THE ANIMAL IS GIVEN';

    const thisRun = runId;
    later(() => {
      if (thisRun !== runId) return;
      field.classList.remove('falling');
      field.classList.add('contact');
      armCue(
        'touch',
        'CRAWL',
        'CONTACT',
        '毛与表面的触感成为第二个信号。',
        '……',
        4600
      );
    }, 1000);
  };

  const crawl = () => {
    clearTimers();
    phase = 'crawling';
    eyebrow.textContent = 'II / CONTACT';
    signal.textContent = '沿着表面移动。';
    description.textContent = '你不知道自己落在什么动物身上。你不需要知道。';
    setAction('...', false);
    status.textContent = 'SIGNAL 02 / 03';

    const thisRun = runId;
    later(() => {
      if (thisRun !== runId) return;
      field.classList.add('warm');
      armCue(
        'warmth',
        'BITE',
        'WARMTH',
        '接近体温的区域出现。第三个信号。',
        '寻找温度。',
        5200
      );
    }, 900);
  };

  const bite = () => {
    clearTimers();
    phase = 'done';
    field.classList.add('done');
    eyebrow.textContent = 'III / WARMTH';
    signal.textContent = '足够了。';
    description.textContent = '气味。接触。温度。对这个主体而言，它们已经组成一个世界。';
    setAction('AGAIN');
    status.textContent = 'UMWELT / COMPLETE';
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
})();
