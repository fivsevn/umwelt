(() => {
  const field = document.querySelector('#field');
  const signal = document.querySelector('#signal');
  const eyebrow = document.querySelector('#eyebrow');
  const action = document.querySelector('#actionButton');
  const rings = document.querySelector('#signalRings');
  const aboutButton = document.querySelector('#aboutButton');
  const aboutPanel = document.querySelector('#aboutPanel');
  const aboutClose = document.querySelector('#aboutClose');

  let language='zh';
  try{const saved=localStorage.getItem('umwelt-desktop-language');if(['zh','en','ja'].includes(saved))language=saved}catch{}
  const copy={
    '三个信号。':['Three signals.','三つの信号。'],'开始':['Begin','始める'],'错过信号。':['Signal missed.','信号を逃した。'],'重来':['Again','もう一度'],
    '等待气味。':['Waiting for a scent.','匂いを待つ。'],'气味':['Scent','匂い'],'落下':['Drop','落ちる'],'坠落':['Falling','落下'],
    '接触':['Contact','接触'],'爬行':['Crawl','這う'],'等待接触。':['Waiting for contact.','接触を待つ。'],'移动':['Moving','移動'],
    '温度':['Warmth','温度'],'叮咬':['Bite','噛む'],'寻找温度。':['Seeking warmth.','温度を探す。'],'一个世界。':['A world.','一つの世界。'],
    '返回 UMWELT':['Return to UMWELT','UMWELT に戻る'],'关于 UMWELT':['About UMWELT','UMWELT について'],'关闭':['Close','閉じる'],
    '環世界':['Umwelt','環世界'],'对蜱虫而言，少数信号就是整个世界。':['For a tick, a few signals are the whole world.','マダニにとって、わずかな信号が世界のすべて。']
  };
  const t=text=>language==='zh'?text:(copy[text]?.[language==='en'?0:1]||text);
  document.documentElement.lang=language==='zh'?'zh-CN':language;
  for(const selector of ['#signal','#actionButton','#aboutTitle','.about-note']){const el=document.querySelector(selector);el.textContent=t(el.textContent)}
  document.querySelectorAll('[aria-label]').forEach(el=>el.setAttribute('aria-label',t(el.getAttribute('aria-label'))));
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
    action.textContent = t(label);
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
    signal.textContent = t('错过信号。');
    setAction('重来');
  };

  const armCue = (nextPhase, cueText, actionText, waitText, timeout = 4200) => {
    phase = `${nextPhase}-waiting`;
    eyebrow.textContent = '…';
    signal.textContent = t(waitText);
    setAction('…', false);

    const thisRun = runId;
    later(() => {
      if (thisRun !== runId) return;
      phase = nextPhase;
      eyebrow.textContent = nextPhase === 'touch' ? '02 / 03' : '03 / 03';
      signal.textContent = t(cueText);
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
    signal.textContent = t('等待气味。');
    setAction('…', false);

    const thisRun = runId;
    later(() => {
      if (thisRun !== runId) return;
      phase = 'smell';
      rings.classList.add('active');
      signal.textContent = t('气味');
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
    signal.textContent = t('坠落');
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
    signal.textContent = t('移动');
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
    signal.textContent = t('一个世界。');
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
