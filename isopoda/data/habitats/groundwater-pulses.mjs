// Groundwater cave: four untimed seepage pulses.
// The player sees by flashlight; the animals inhabit a changing connectivity graph.
// Rows are zh/en/ja. Choice "lens" values drive the epilogue without exposing scores.
export const GROUNDWATER_PULSES=[
 {
  id:'seep',
  name:['PULSE 01 · 渗流','PULSE 01 · SEEPAGE','PULSE 01 · 浸透'],
  prompt:[
   '静水里只有滴落的声音。光圈扫过一层浅水膜时，一个浅色身体沿流石边缘移动，随后进入一道裂隙。你没有看到它出来。',
   'Only dripping breaks the still water. When the beam crosses a shallow film, a pale body moves along the flowstone edge and enters a fissure. You do not see it come out.',
   '静水には滴る音だけがある。光が浅い水膜を横切ると、淡い身体が流石の縁を進み、割れ目へ入る。出てくるところは見えない。'
  ],
  options:[
   {
    id:'follow-gap',lens:'body',delta:{labels:1},
    label:['把光移向裂隙','Move the beam to the fissure','光を割れ目へ向ける'],
    text:[
     '光只走到第一个转角。身体没有重新出现。更里面仍然没有变成画面。',
     'The beam reaches only the first bend. The body does not reappear. Farther in, nothing becomes an image.',
     '光が届くのは最初の曲がり角までだ。身体は再び現れない。その先はまだ画面にならない。'
    ]
   },
   {
    id:'mark-mouth',lens:'medium',delta:{maps:2},
    label:['标记裂隙入口','Mark the fissure mouth','割れ目の入口を記す'],
    text:[
     '你记下入口和水膜的方向。纸上多了一个点，但点后面的空间仍然没有长度。',
     'You mark the mouth and the direction of the water film. A point appears on paper, but the space behind it still has no measured length.',
     '入口と水膜の向きを記す。紙に点が一つ増えるが、その奥の空間にはまだ長さがない。'
    ]
   },
   {
    id:'wait-seep',lens:'limit',delta:{quiet:2},
    label:['停住光，等渗流','Hold the beam and wait','光を止め、浸透を待つ'],
    text:[
     '你没有追进去。滴水继续落下，裂隙边缘的水膜一点点变厚。',
     'You do not chase it inside. Drips continue, and the film at the fissure edge slowly thickens.',
     '中へ追わない。滴は続き、割れ目の縁の水膜が少しずつ厚くなる。'
    ]
   }
  ]
 },
 {
  id:'connection',
  name:['PULSE 02 · 连通','PULSE 02 · CONNECTION','PULSE 02 · 連結'],
  prompt:[
   '渗流增强后，画面另一侧的一处裂隙口出现新的细泥扰动。两个入口在屏幕上彼此可见；中间的通路仍不可见。',
   'As seepage strengthens, fine silt shifts at another fissure mouth across the scene. Both openings are visible on screen; the route between them is not.',
   '浸透が強まると、画面の反対側にある別の割れ目で細泥が動く。二つの入口は見えるが、その間の通路は見えない。'
  ],
  options:[
   {
    id:'connect-points',lens:'medium',delta:{maps:2},
    label:['暂时连成一条线','Link them provisionally','仮の線で結ぶ'],
    text:[
     '你画了一条虚线。它表示“可能连通”，不是你看见过的路线。',
     'You draw a dashed line. It means “possibly connected,” not a route you witnessed.',
     '破線を一本引く。それは「つながっているかもしれない」を示すだけで、見た経路ではない。'
    ]
   },
   {
    id:'record-silt',lens:'limit',delta:{labels:2,quiet:1},
    label:['只记录细泥移动','Record only the silt','細泥の動きだけ記す'],
    text:[
     '你没有替两个入口补上中间。记录里留下两个位置和一次发生过的变化。',
     'You do not fill in the middle. The record keeps two positions and one change that occurred.',
     '二つの入口の間を補わない。記録には二つの位置と、一度起きた変化だけが残る。'
    ]
   },
   {
    id:'search-third',lens:'body',delta:{labels:1,maps:1},
    label:['继续找另一个出口','Search for another outlet','別の出口を探す'],
    text:[
     '光圈沿石灰岩边缘移动。你找到第三处湿润裂口，却仍没有看到任何一段完整穿行。',
     'The beam moves along the limestone edge. You find a third wet opening, but still no complete passage is seen.',
     '光を石灰岩の縁に沿って動かす。三つ目の濡れた開口を見つけるが、通過の全体はやはり見えない。'
    ]
   }
  ]
 },
 {
  id:'input',
  name:['PULSE 03 · 输入','PULSE 03 · INPUT','PULSE 03 · 流入'],
  prompt:[
   '更强的一次渗流带来少量深色有机碎屑。它们停在水膜与细泥交界处。此前安静的裂口附近，出现了新的身体。',
   'A stronger seep brings a small amount of dark organic debris. It stops where the water film meets fine silt. New bodies appear near a fissure that had been quiet.',
   '強い浸透が少量の暗い有機物片を運ぶ。水膜と細泥の境に止まり、静かだった割れ目の近くに新しい身体が現れる。'
  ],
  options:[
   {
    id:'watch-body',lens:'body',delta:{labels:2},
    label:['跟住出现的身体','Follow the appearing bodies','現れた身体を追う'],
    text:[
     '光跟着身体移动。它们先后离开亮处；碎屑还停在原来的水膜边缘。',
     'The beam follows the bodies. One after another they leave the lit area; the debris remains at the same film edge.',
     '光で身体を追う。次々と明るい範囲を離れていくが、碎屑は同じ水膜の縁に残る。'
    ]
   },
   {
    id:'watch-input',lens:'medium',delta:{maps:2,care:1},
    label:['看碎屑从哪里来','Trace the debris upstream','碎屑の流入元を見る'],
    text:[
     '你沿细粒反向寻找渗流。食物不是一个固定地点，而是一次从别处进入这里的事件。',
     'You trace the fine particles against the seep. Food is not a fixed place here, but an event arriving from elsewhere.',
     '細粒をたどって浸透の上流を探す。ここで食物は固定された場所ではなく、別の場所から届く出来事になる。'
    ]
   },
   {
    id:'leave-source-open',lens:'limit',delta:{quiet:2},
    label:['不判断它们为何出现','Leave the cause open','現れた理由を決めない'],
    text:[
     '你只记下碎屑到达以后，裂口附近出现了移动。先后顺序被保留，因果没有被补上。',
     'You record only that movement appeared near the fissure after debris arrived. Sequence is preserved; causation is not supplied.',
     '碎屑が届いたあと割れ目の近くに動きが現れた、とだけ記す。順序は残すが、因果は補わない。'
    ]
   }
  ]
 },
 {
  id:'recession',
  name:['PULSE 04 · 回落','PULSE 04 · RECESSION','PULSE 04 · 低下'],
  prompt:[
   '渗流开始减弱。刚才仍有薄水相连的两处石灰岩表面逐渐断开，细泥重新沉降。刚才属于同一片水的地方，又分开了。',
   'Seepage begins to weaken. Two limestone surfaces that were linked by a thin film separate again, and fine silt settles. Places that briefly shared one water body divide.',
   '浸透が弱まり始める。薄い水膜でつながっていた二つの石灰岩面が再び離れ、細泥が沈む。さっき同じ水だった場所がまた分かれる。'
  ],
  options:[
   {
    id:'keep-searching',lens:'body',delta:{labels:2},
    label:['继续寻找个体','Keep searching for individuals','個体を探し続ける'],
    text:[
     '你又照过几处裂口。找到新的轮廓，却无法确认它是不是先前消失的那一个。',
     'You search several more openings. A new outline appears, but you cannot confirm that it is the one that vanished earlier.',
     'さらにいくつかの割れ目を照らす。新しい輪郭は見つかるが、先ほど消えた個体かどうかは確認できない。'
    ]
   },
   {
    id:'finish-map',lens:'medium',delta:{maps:3},
    label:['完成这次通路图','Finish the route map','今回の通路図を閉じる'],
    text:[
     '你把实线、虚线和断开的地方留在同一张图上。它记录的是一次连通状态，不是洞穴永远的形状。',
     'You leave solid lines, dashed lines and breaks on the same map. It records one state of connectivity, not the cave’s permanent shape.',
     '実線、破線、切れた場所を一枚の図に残す。それは一度の連結状態であって、洞窟の永遠の形ではない。'
    ]
   },
   {
    id:'lower-lamp',lens:'limit',delta:{quiet:3},
    label:['放低手电，不再追看','Lower the lamp and stop chasing','灯りを落とし、追うのをやめる'],
    text:[
     '画面重新只剩微弱的石灰岩轮廓。看不清的地方没有因此停止有水、裂隙和通路。',
     'The scene returns to faint limestone outlines. What you cannot resolve does not therefore lose its water, fissures or routes.',
     '画面には再び石灰岩の淡い輪郭だけが残る。見分けられない場所から、水や割れ目や通路が消えるわけではない。'
    ]
   }
  ]
 }
];

export const GROUNDWATER_ENDINGS={
 body:{
  id:'groundwater-body',
  title:['光斑之间','Between the beams','光の斑点のあいだ'],
  body:[
   '你留下了四次出现、消失和重新发现的位置。每一次都是真的；它们之间的黑暗仍没有变成完整路线。',
   'You leave four records of appearance, disappearance and rediscovery. Each is real; the darkness between them never becomes a complete route.',
   '現れ、消え、再び見つかった位置を四回分残した。どれも事実だが、その間の暗闇は完全な経路にはならない。'
  ],
  line:[
   '对你而言，那里是黑暗。对它而言，那里仍然是路。',
   'For you, that place is darkness. For it, that place is still a route.',
   'あなたには暗闇でも、それにとってはまだ道である。'
  ]
 },
 medium:{
  id:'groundwater-medium',
  title:['不完整的通路','An incomplete network','不完全な通路'],
  body:[
   '你把裂隙、细泥、渗流和外源输入画成了一张拓扑图。图上的连接来自间接痕迹，而不是一次完整目击。',
   'You turn fissures, silt, seepage and external input into a topological map. Its connections come from indirect traces, not from one complete sighting.',
   '割れ目、細泥、浸透、外からの流入を一枚のトポロジー図にした。接続は完全な目撃ではなく、間接的な痕跡から生まれた。'
  ],
  line:[
   '你画出了通路。没有一条来自你真正看见的完整移动。',
   'You mapped the routes. Not one came from a movement you saw in full.',
   '通路を描いた。完全に見届けた移動から生まれた線は一本もない。'
  ]
 },
 limit:{
  id:'groundwater-limit',
  title:['没有成为画面的地方','What never became an image','画面にならなかった場所'],
  body:[
   '几次观察里，你允许记录停在入口、细泥和水膜。空白没有被补成路线，洞穴仍继续连通、断开，再连通。',
   'Several times you let the record stop at an opening, silt, or a water film. The blank was not completed into a route; the cave kept connecting, breaking and reconnecting.',
   '何度か記録を入口、細泥、水膜で止めた。空白を経路として補わないまま、洞窟はつながり、切れ、またつながり続けた。'
  ],
  line:[
   '观察结束在光能到达的地方。环境没有。',
   'Observation ends where the light can reach. The environment does not.',
   '観察は光の届く場所で終わる。環境はそこで終わらない。'
  ]
 }
};
