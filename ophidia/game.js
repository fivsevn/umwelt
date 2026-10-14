(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const languages = ['zh', 'en', 'ja'];
  let language = 'zh';
  try {
    const saved = localStorage.getItem('umwelt-ophidia-language');
    const inherited = localStorage.getItem('isopoda-ui-language-v1');
    if (languages.includes(saved)) language = saved;
    else if (languages.includes(inherited)) language = inherited;
  } catch { /* A private window can still play the whole story. */ }

  const copy = {
    zh: {
      title: '体温调节', subtitle: '窗边有一个空座位。', start: '坐下', wait: '稍候',
      loading: '正在靠岸', error: '场景图像未能加载。',
      retry: '重试', next: '继续', restart: '重新开始', home: '返回主页', settings: '设置', language: '语言', launch: '开始航程',
      scene: '渡轮的窗边卡座，一条戴着帽子与围巾的蛇', dialogue: '对话', choices: '选择',
      speakers: { you: '你', snake: '蛇', scene: '窗边', end: '余温' },
    },
    en: {
      title: 'THERMOREGULATION', subtitle: 'There is a seat by the window.', start: 'Take a seat', wait: 'One moment',
      loading: 'Coming alongside', error: 'The scene images could not load.',
      retry: 'Try again', next: 'Continue', restart: 'Start again', home: 'Home', settings: 'Settings', language: 'Language', launch: 'Begin crossing',
      scene: 'A ferry booth by the window, with a snake wearing a hat and scarf', dialogue: 'Conversation', choices: 'Choose',
      speakers: { you: 'YOU', snake: 'SNAKE', scene: 'BY THE WINDOW', end: 'AFTERWARMTH' },
    },
    ja: {
      title: '体温調節', subtitle: '窓辺に、空いた席がひとつ。', start: '座る', wait: '少しお待ちください',
      loading: '接岸中', error: '風景の画像を読み込めませんでした。',
      retry: '再試行', next: 'つづく', restart: '最初から', home: 'ホームへ', settings: '設定', language: '言語', launch: '航程を始める',
      scene: 'フェリーの窓辺の席。帽子とマフラーをつけた蛇がいる', dialogue: '会話', choices: '選択',
      speakers: { you: 'あなた', snake: '蛇', scene: '窓辺', end: '余熱' },
    },
  };

  // Each choice is remembered in this crossing and changes the following scene.
  const line = (speaker, pose, zh, en, ja) => ({ speaker, pose, text: { zh, en, ja } });
  const choice = (speaker, pose, zh, en, ja, options) => ({ ...line(speaker, pose, zh, en, ja), options });
  const option = (value, zh, en, ja) => ({ value, text: { zh, en, ja } });
  const story = {
    opening: [
      line('scene', 'normal', '玻璃上有一层薄雾。\n渡轮还没有离开岸边。', 'A thin mist covers the glass.\nThe ferry is still beside the quay.', 'ガラスに薄い曇り。\nフェリーはまだ岸にいる。'),
      line('scene', 'normal', '一条蛇盘在窗边。\n旧围巾搭在它的身上。', 'A snake is coiled by the window.\nAn old scarf lies along its body.', '蛇が窓辺でとぐろを巻いている。\n古いマフラーを身にまとっている。'),
      line('you', 'curious', '这里有人坐吗？', 'Is this seat taken?', 'ここ、誰か座りますか？'),
      line('snake', 'curious', '刚才有。', 'Someone did, a moment ago.', 'さっきまで、いた。'),
      line('you', 'normal', '他去哪儿了？', 'Where did they go?', 'どこへ行ったの？'),
      line('snake', 'normal', '不知道。\n座垫还记得。', 'I do not know.\nThe cushion remembers.', 'わからない。\n座布団は覚えている。'),
      line('scene', 'normal', '你坐下。\n座垫的温度慢慢变得难以分辨。', 'You sit down.\nThe warmth in the cushion slowly becomes difficult to place.', 'あなたは座る。\n座布団の温かさの出どころが、だんだんわからなくなる。'),
      line('you', 'tongue', '你在等开船？', 'Are you waiting for departure?', '出航を待っているの？'),
      line('snake', 'normal', '等这盏灯暖起来。', 'For this lamp to warm up.', 'この灯りが温まるのを。'),
      choice('scene', 'normal', '你的杯子还温着。\n蛇靠近桌面较亮的那一小块。', 'Your cup is still warm.\nThe snake rests near the small bright patch on the table.', 'あなたのカップはまだ温かい。\n蛇はテーブルの明るい小さな場所に近づく。', [
        option('cup', '把杯子挪近一点', 'Move the cup a little closer', 'カップを少し近づける'),
        option('space', '挪开自己的行李', 'Move your bag aside', '自分の荷物をよける'),
      ]),
    ],
    cup: [
      line('scene', 'curious', '杯子移动时，留下一圈水。\n蛇把下颌放在那一圈旁边。', 'The cup leaves a ring of water.\nThe snake rests its jaw beside it.', 'カップを動かすと、水の輪が残る。\n蛇はそのそばに顎を置く。'),
      line('snake', 'normal', '你的水，走得比我们快。', 'Your water travels faster than we do.', 'あなたの水は、私たちより早く進む。'),
      line('you', 'normal', '它已经到桌子那头了。', 'It has reached the other side of the table.', 'もうテーブルの向こうまで着いた。'),
    ],
    space: [
      line('scene', 'away', '你把行李收到脚边。\n空出来的座位上，有一道斜斜的灯光。', 'You put your bag by your feet.\nA slant of lamplight crosses the cleared seat.', '荷物を足元に置く。\n空いた席を、灯りが斜めに横切る。'),
      line('snake', 'curious', '这边也可以买票吗？', 'Can this side have a ticket too?', 'こちらの席にも、切符を買える？'),
      line('you', 'normal', '这张票包含整个位子。', 'The ticket includes the whole seat.', 'この切符で、席ひとつ分だよ。'),
    ],
    crossing: [
      line('scene', 'normal', '窗外的栏杆缓缓往后走。\n船舱里，杯子和蛇都留在原处。', 'The railing outside moves slowly backward.\nInside, the cup and the snake stay where they are.', '窓の外の手すりが、ゆっくり後ろへ進む。\n船内では、カップも蛇も同じ場所にいる。'),
      line('you', 'curious', '开船了。', 'We are moving.', '動き出した。'),
      line('snake', 'curious', '我看见了。\n岸边的人正在离开我们。', 'I can see.\nThe people on shore are leaving us.', '見えた。\n岸の人たちが、こちらから離れていく。'),
      line('scene', 'tongue', '蛇的舌尖在空气里停了片刻。', 'The tip of its tongue pauses in the air.', '舌の先が、空気の中に一瞬とまる。'),
      line('snake', 'normal', '刚才那个人，带着橘子的味道。', 'The person before you carried the smell of oranges.', 'さっきの人は、みかんの匂いがした。'),
      line('you', 'normal', '我没有看见他。', 'I did not see them.', '私は、その人を見ていない。'),
      line('snake', 'curious', '你坐在这里。\n已经遇见一点了。', 'You are sitting here.\nYou have met a little of them.', 'ここに座っている。\nもう、少しは会っている。'),
      choice('you', 'curious', '水面很灰。\n两边的岸，看起来差不多。', 'The water is grey.\nThe two shores look much alike.', '水面は灰色。\n両岸は、よく似て見える。', [
        option('destination', '问它要去哪里', 'Ask where it is going', '行き先を聞く'),
        option('origin', '问它从哪里来', 'Ask where it came from', 'どこから来たか聞く'),
      ]),
    ],
    destination: [
      line('you', 'curious', '你要去哪一站？', 'Which stop are you going to?', 'どの停留所まで行くの？'),
      line('snake', 'normal', '有晒得到太阳的墙。\n门底下的缝，不太紧。', 'A wall that catches the sun.\nA gap beneath a door that is not too tight.', '日が当たる壁。\n戸の下の隙間が、狭すぎないところ。'),
      line('you', 'normal', '地图上恐怕找不到。', 'I doubt it is on the map.', '地図では見つからなそう。'),
      line('snake', 'tongue', '到了附近，我会知道。', 'When I am close, I will know.', '近くに着けば、わかる。'),
    ],
    origin: [
      line('you', 'curious', '你从哪里来？', 'Where did you come from?', 'どこから来たの？'),
      line('snake', 'away', '一堆旧砖。\n夏天的时候，缝隙很合适。', 'A pile of old bricks.\nIn summer, the gaps fitted well.', '古いレンガの山。\n夏には、隙間がちょうどよかった。'),
      line('you', 'normal', '现在呢？', 'And now?', '今は？'),
      line('snake', 'normal', '砖还在那里。\n合适的季节走了。', 'The bricks are still there.\nThe season that fitted has gone.', 'レンガはまだそこにある。\nちょうどよかった季節が、去った。'),
    ],
    cooling: [
      line('scene', 'normal', '你把手搭在杯壁上。\n温热只剩在掌心下面。', 'You put your hand against the cup.\nA little warmth remains beneath your palm.', 'カップに手を添える。\n手のひらの下にだけ、温かさが残っている。'),
      line('you', 'curious', '你会觉得冷吗？', 'Do you feel cold?', '寒いと感じる？'),
      line('snake', 'normal', '会慢下来。\n有些地方，要多待一会。', 'I slow down.\nSome places need a longer stay.', 'ゆっくりになる。\n少し長くいる必要のある場所もある。'),
      line('you', 'normal', '我冷的时候，会想回家。', 'When I am cold, I want to go home.', '寒いときは、家に帰りたくなる。'),
      line('snake', 'curious', '你的家，现在也冷吗？', 'Is your home cold right now too?', 'あなたの家も、今は寒い？'),
      line('scene', 'away', '你想了一会。\n窗上的雾，又厚了一点。', 'You think for a while.\nThe mist on the window grows a little thicker.', '少し考える。\n窓の曇りが、また少し厚くなる。'),
      choice('scene', 'normal', '围巾的一角落在座位中间。\n它下面的绒布被压得很平。', 'A corner of the scarf lies between you.\nThe velvet beneath it is pressed flat.', 'マフラーの端が、席の真ん中に落ちている。\n下の布は、平たく押されている。', [
        option('shared', '把围巾铺在中间', 'Spread the scarf between you', 'マフラーを真ん中に広げる'),
        option('edge', '把围巾放回它身边', 'Fold the scarf back beside it', 'マフラーを蛇のそばに戻す'),
      ]),
    ],
    shared: [
      line('scene', 'curious', '围巾只占了很窄的一条。\n两边还各有一点空余。', 'The scarf makes a narrow strip.\nThere is still a little room on either side.', 'マフラーは細い帯になる。\n両側にはまだ少し余りがある。'),
      line('snake', 'normal', '现在，这里有三个地方。', 'Now there are three places here.', 'ここに、場所が三つできた。'),
      line('you', 'normal', '你的，我的，和这一条。', 'Yours, mine, and this strip.', 'あなたの、私の、それからこの帯。'),
    ],
    edge: [
      line('scene', 'normal', '你把围巾的一角折回去。\n桌边露出一道旧旧的缝。', 'You fold the corner back.\nAn old seam appears beside the table.', 'マフラーの端を折り返す。\nテーブルのそばに、古い縫い目が現れる。'),
      line('snake', 'curious', '这里原来就有一条线。', 'There was a line here all along.', 'ここには、もともと線があった。'),
      line('you', 'normal', '有人把两块布缝在一起。', 'Someone sewed two pieces of cloth together.', '誰かが、布を二枚縫い合わせた。'),
    ],
    arrival: [
      line('scene', 'away', '窗外又出现栏杆。\n这次它们慢慢停下来。', 'Railings appear outside again.\nThis time they slowly come to rest.', '窓の外に、また手すり。\n今度は、ゆっくり止まっていく。'),
      line('you', 'curious', '你要下船吗？', 'Are you getting off?', 'ここで降りる？'),
      line('snake', 'tongue', '先闻一闻。', 'I will smell first.', 'まず、匂いを確かめる。'),
    ],
    finalShared: [
      line('snake', 'normal', '这里可以再坐一会。', 'We can sit here a little longer.', 'ここで、もう少し座れる。'),
      line('end', 'normal', '杯子已经凉了。\n围巾中间还留着一条温暖的地方。', 'The cup has cooled.\nA narrow place in the scarf still holds some warmth.', 'カップは冷めた。\nマフラーの真ん中には、まだ細く温かい場所が残っている。'),
    ],
    finalCup: [
      line('snake', 'curious', '谢谢你的杯子。\n下一段，我去找那盏灯。', 'Thank you for your cup.\nFor the next stretch, I will find that lamp.', 'カップをありがとう。\n次の区間は、あの灯りを探す。'),
      line('end', 'away', '桌上那一圈水慢慢干了。\n你把凉下来的杯子，收回手边。', 'The ring of water slowly dries.\nYou bring the cool cup back beside your hand.', 'テーブルの水の輪が、ゆっくり乾く。\n冷めたカップを、自分の手元へ戻す。'),
    ],
    finalSpace: [
      line('snake', 'away', '那边闻起来，有砖。', 'Over there, I can smell bricks.', '向こうから、レンガの匂いがする。'),
      line('end', 'away', '它离开后，你没有马上挪回行李。\n空位还暖着。', 'After it leaves, you do not move your bag back straight away.\nThe empty seat is still warm.', '蛇が去っても、荷物はすぐに戻さなかった。\n空いた席には、まだ温かさがある。'),
    ],
  };

  let ready = false;
  let started = false;
  let current = null;
  let queue = [];
  let typingTimer = null;
  let typing = false;
  let settingsOpen = false;
  let decisionCount = 0;
  let decisions = {};
  let currentPose = 'normal';
  let imageUrls = {};
  let loadGeneration = 0;
  const assetPaths = {
    cabin: './assets/cabin.webp',
    'snake-normal': './assets/snake-normal.webp?v=snake16',
    'snake-curious': './assets/snake-curious.webp?v=snake16',
    'snake-away': './assets/snake-away.webp?v=snake16',
    'snake-tongue': './assets/snake-tongue.webp?v=snake16',
  };
  const assetNames = Object.keys(assetPaths);

  function applyLanguage(next) {
    if (!languages.includes(next)) return;
    language = next;
    const ui = copy[language];
    document.documentElement.lang = { zh: 'zh-CN', en: 'en', ja: 'ja' }[language];
    document.documentElement.dataset.language = language;
    document.title = language === 'en' ? 'THERMOREGULATION' : `THERMOREGULATION / ${ui.title}`;
    $('game').setAttribute('aria-label', ui.title);
    $('viewport').setAttribute('aria-label', ui.scene);
    $('dialoguePanel').setAttribute('aria-label', ui.dialogue);
    $('choices').setAttribute('aria-label', ui.choices);
    $('launchPanel').setAttribute('aria-label', ui.launch);
    $('launchSubtitle').textContent = ui.subtitle;
    $('startButton').textContent = ready ? ui.start : ui.wait;
    $('loadingStatus').replaceChildren(document.createTextNode(ui.loading), Object.assign(document.createElement('span'), { textContent: '···' }));
    $('assetErrorText').textContent = ui.error;
    $('retryButton').textContent = ui.retry;
    $('continueButton').setAttribute('aria-label', ui.next);
    $('restartButton').textContent = ui.restart;
    $('homeLink').textContent = ui.home;
    $('settingsToggle').title = ui.settings;
    $('settingsToggle').setAttribute('aria-label', ui.settings);
    $('settingsMenu').setAttribute('aria-label', ui.settings);
    $('languageLabel').textContent = ui.language;
    document.querySelectorAll('.languages button').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
    try { localStorage.setItem('umwelt-ophidia-language', language); } catch { /* Language storage is optional. */ }
    if (current) renderCurrent(false);
  }

  function loadImage(name, generation) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const source = assetPaths[name];
      const url = generation > 1 ? `${source}${source.includes('?') ? '&' : '?'}retry=${generation}` : source;
      const timeout = window.setTimeout(() => reject(new Error(`Timed out: ${name}`)), 15000);
      image.onload = () => {
        window.clearTimeout(timeout);
        if (image.naturalWidth !== 360 || image.naturalHeight !== 640) {
          reject(new Error(`Unexpected scene dimensions: ${name}`));
          return;
        }
        resolve([name, url]);
      };
      image.onerror = () => { window.clearTimeout(timeout); reject(new Error(`Could not load: ${name}`)); };
      image.src = url;
    });
  }

  async function loadAssets() {
    const generation = ++loadGeneration;
    ready = false;
    $('startButton').disabled = true;
    $('startButton').textContent = copy[language].wait;
    $('loadingStatus').hidden = false;
    $('assetError').hidden = true;
    try {
      const loaded = await Promise.all(assetNames.map((name) => loadImage(name, generation)));
      if (generation !== loadGeneration) return;
      imageUrls = Object.fromEntries(loaded);
      document.querySelector('.cabin').src = imageUrls.cabin;
      $('snakeImage').src = imageUrls[`snake-${currentPose}`];
      ready = true;
      $('startButton').disabled = false;
      $('startButton').textContent = copy[language].start;
      $('loadingStatus').hidden = true;
    } catch (error) {
      if (generation !== loadGeneration) return;
      $('loadingStatus').hidden = true;
      $('assetError').hidden = false;
      console.warn('[OPHIDIA]', error.message);
    }
  }

  function stopTyping() {
    if (typingTimer !== null) window.clearTimeout(typingTimer);
    typingTimer = null;
    typing = false;
    $('dialoguePanel').classList.remove('is-typing');
  }

  function finishTyping() {
    stopTyping();
    $('dialogueText').textContent = current.text[language];
    showActions();
  }

  function setPose(pose) {
    currentPose = pose;
    const source = imageUrls[`snake-${pose}`];
    if (source && $('snakeImage').getAttribute('src') !== source) $('snakeImage').src = source;
  }

  function showActions() {
    const isEnding = queue.length === 0 && !current.options && decisionCount === 3;
    $('continueButton').hidden = Boolean(current.options) || isEnding;
    $('choices').hidden = !current.options;
    $('game').dataset.state = isEnding ? 'ending' : current.options ? 'choice' : 'dialogue';
    $('dialoguePanel').classList.toggle('is-ending', isEnding);
    $('dialoguePanel').classList.toggle('has-choices', Boolean(current.options));
    if (current.options) {
      $('choices').replaceChildren(...current.options.map((item, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'choice-button';
        button.textContent = item.text[language];
        button.setAttribute('aria-keyshortcuts', String(index + 1));
        button.addEventListener('click', () => selectOption(item.value));
        return button;
      }));
    }
  }

  function renderCurrent(animate = true) {
    stopTyping();
    if (!current) return;
    setPose(current.pose);
    $('speaker').textContent = copy[language].speakers[current.speaker];
    $('choices').hidden = true;
    $('game').dataset.state = 'dialogue';
    $('continueButton').hidden = false;
    $('dialoguePanel').classList.remove('is-ending', 'has-choices');
    $('spokenText').textContent = `${copy[language].speakers[current.speaker]}: ${current.text[language]}`;
    if (!animate) { finishTyping(); return; }
    const characters = Array.from(current.text[language]);
    let index = 0;
    $('dialogueText').textContent = '';
    typing = true;
    $('dialoguePanel').classList.add('is-typing');
    const nextCharacter = () => {
      if (!typing) return;
      index += 1;
      $('dialogueText').textContent = characters.slice(0, index).join('');
      if (index >= characters.length) { finishTyping(); return; }
      const character = characters[index - 1];
      const delay = /[。！？.!?]/.test(character) ? 190 : language === 'en' ? 21 : 42;
      typingTimer = window.setTimeout(nextCharacter, delay);
    };
    nextCharacter();
  }

  function advance() {
    if (settingsOpen || !started || !current) return;
    if (typing) { finishTyping(); return; }
    if (current.options || queue.length === 0) return;
    current = queue.shift();
    renderCurrent();
  }

  function selectOption(value) {
    if (typing || !current?.options || !current.options.some((item) => item.value === value)) return;
    decisionCount += 1;
    if (decisionCount === 1) {
      decisions.seat = value;
      queue = [...story[value], ...story.crossing];
    } else if (decisionCount === 2) {
      decisions.route = value;
      queue = [...story[value], ...story.cooling];
    } else {
      decisions.scarf = value;
      const ending = value === 'shared' ? 'finalShared' : decisions.seat === 'cup' ? 'finalCup' : 'finalSpace';
      // Destination and origin leave a different recollection at the far shore.
      const recollection = decisions.route === 'destination'
        ? line('you', 'normal', '岸上的墙，晒到太阳了吗？', 'Do the walls on this shore catch the sun?', 'この岸の壁には、日が当たるかな。')
        : line('you', 'normal', '这里的砖，大概也有自己的季节。', 'These bricks probably have their own season too.', 'ここのレンガにも、きっと自分の季節がある。');
      queue = [...story[value], ...story.arrival, recollection, ...story[ending]];
    }
    current = queue.shift();
    renderCurrent();
  }

  function startCrossing() {
    if (!ready) return;
    stopTyping();
    started = true;
    setSettingsOpen(false);
    $('dialogueHeading').append($('settingsControl'));
    $('restartButton').disabled = false;
    decisionCount = 0;
    decisions = {};
    queue = [...story.opening];
    current = queue.shift();
    $('launchPanel').hidden = true;
    $('dialoguePanel').hidden = false;
    renderCurrent();
  }

  $('startButton').addEventListener('click', startCrossing);
  $('restartButton').addEventListener('click', () => {
    setSettingsOpen(false);
    stopTyping();
    started = false;
    current = null;
    queue = [];
    setPose('normal');
    $('dialoguePanel').hidden = true;
    $('launchPanel').hidden = false;
    $('game').dataset.state = 'launch';
    $('launchHeading').append($('settingsControl'));
    $('restartButton').disabled = true;
    $('startButton').focus({ preventScroll: true });
  });
  $('continueButton').addEventListener('click', advance);
  $('retryButton').addEventListener('click', loadAssets);
  function setSettingsOpen(open, restoreFocus = false) {
    settingsOpen = open;
    $('settingsMenu').hidden = !open;
    $('settingsToggle').setAttribute('aria-expanded', String(open));
    if (open) document.querySelector('.languages button[aria-pressed="true"]').focus({ preventScroll: true });
    else if (restoreFocus) $('settingsToggle').focus({ preventScroll: true });
  }
  $('settingsToggle').addEventListener('click', () => setSettingsOpen(!settingsOpen, settingsOpen));
  document.querySelectorAll('.languages button').forEach((button) => button.addEventListener('click', () => applyLanguage(button.dataset.language)));
  $('viewport').addEventListener('click', (event) => {
    if (event.target.closest('.settings-control')) return;
    if (settingsOpen) { setSettingsOpen(false, true); return; }
    if (event.target.closest('button, a') || !$('assetError').hidden) return;
    if (started) advance();
  });
  document.addEventListener('keydown', (event) => {
    if (settingsOpen) {
      if (event.key === 'Escape') { event.preventDefault(); setSettingsOpen(false, true); }
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || !$('assetError').hidden) return;
    const target = event.target;
    if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (started && !typing && current?.options && ['1', '2'].includes(event.key)) {
      const selected = current.options[Number(event.key) - 1];
      if (selected) { event.preventDefault(); selectOption(selected.value); }
      return;
    }
    if (![' ', 'Enter', 'ArrowRight'].includes(event.key)) return;
    // Native keyboard activation of controls remains under the browser's control.
    if (target.closest('button, a') && event.key !== 'ArrowRight') return;
    event.preventDefault();
    if (started) advance();
    else startCrossing();
  });
  document.addEventListener('click', (event) => {
    if (settingsOpen && !$('settingsControl').contains(event.target)) setSettingsOpen(false, true);
  });
  for (const eventName of ['selectstart', 'dragstart', 'contextmenu']) {
    $('game').addEventListener(eventName, (event) => event.preventDefault());
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  $('viewport').addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' || reducedMotion.matches) return;
    const bounds = $('viewport').getBoundingClientRect();
    $('scenery').style.setProperty('--look-x', `${((event.clientX - bounds.left) / bounds.width - .5) * 2}px`);
    $('scenery').style.setProperty('--look-y', `${((event.clientY - bounds.top) / bounds.height - .5) * 1}px`);
  });
  const clearParallax = () => {
    $('scenery').style.setProperty('--look-x', '0px');
    $('scenery').style.setProperty('--look-y', '0px');
  };
  $('viewport').addEventListener('pointerleave', clearParallax);
  reducedMotion.addEventListener?.('change', clearParallax);

  $('game').dataset.state = 'launch';
  applyLanguage(language);
  loadAssets();
})();
