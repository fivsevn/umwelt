// Four untimed pulses for the limestone-groundwater habitat.
// The player sees through a movable observation beam; the animals' relevant
// space is instead represented by temporary hydrological connectivity.
export const GROUNDWATER_PULSES=[
 {
  id:'seep',
  name:['PULSE 01 · 渗流','PULSE 01 · SEEPAGE','PULSE 01 · 浸透'],
  prompt:[
   '浅色身体沿着一层很薄的水移动。手电追上它时，它已经到了裂隙边。下一刻，它进入石缝。你没有看到它出来。',
   'A pale body moves through a very thin film of water. By the time the beam catches it, it has reached a fissure. Then it enters the crack. You do not see it come out.',
   '淡い身体がごく薄い水膜を進む。光が追いついたときには、もう割れ目の縁にいる。次の瞬間、石の隙間へ入る。出てくるところは見えない。'
  ],
  options:[
   {
    id:'follow-body',lens:'body',
    label:['照进裂隙','Shine into the fissure','割れ目を照らす'],
    text:[
     '光只走到第一个转角。更里面仍然没有变成画面。',
     'The light reaches only the first bend. Farther in still does not become an image.',
     '光は最初の曲がり角までしか届かない。その先はまだ画面にならない。'
    ]
   },
   {
    id:'mark-entrance',lens:'medium',
    label:['标记入口','Mark the entrance','入口を記す'],
    text:[
     '你记下裂隙的位置。标记留在石面上，里面的路线没有因此变直。',
     'You mark the fissure. The mark stays on the stone; the route inside does not become straighter.',
     '割れ目の位置を記す。印は石面に残るが、中の経路がそれで直線になるわけではない。'
    ]
   },
   {
    id:'wait-seep',lens:'limit',
    label:['等下一次渗流','Wait for the next seep','次の浸透を待つ'],
    text:[
     '你把光停在外面。滴水继续，裂隙里没有新的可见物。',
     'You leave the light outside. Dripping continues; nothing new becomes visible inside the fissure.',
     '光を外に留める。滴下は続くが、割れ目の中に新しく見えるものはない。'
    ]
   }
  ]
 },
 {
  id:'connection',
  name:['PULSE 02 · 连通','PULSE 02 · CONNECTION','PULSE 02 · 接続'],
  prompt:[
   '渗流增强以后，另一处裂隙口的细泥被推开了一点。它和刚才的入口在画面上相隔不远；中间却没有任何可见路线。',
   'As seepage strengthens, fine silt shifts at another fissure. It is not far from the earlier entrance on screen, yet no visible route joins them.',
   '浸透が強まると、別の割れ目の入口で細泥が少し動く。画面上では先ほどの入口と近い。それでも、その間を結ぶ経路は見えない。'
  ],
  options:[
   {
    id:'connect-marks',lens:'medium',
    label:['把两处连起来','Connect the two marks','二つの印を結ぶ'],
    text:[
     '你在记录里画了一条虚线。它表示“可能连通”，不是一条看见的路。',
     'You draw a broken line in the record. It means “possibly connected,” not a route you witnessed.',
     '記録に破線を引く。それは「つながっているかもしれない」を示す線で、見た経路ではない。'
    ]
   },
   {
    id:'record-silt',lens:'limit',
    label:['只记录泥的移动','Record only the silt','泥の動きだけ記す'],
    text:[
     '你只写下入口附近的变化。两处之间仍然留白。',
     'You record only the change near the opening. The interval between the two places remains blank.',
     '入口付近の変化だけを書く。二つの場所の間は空白のまま残る。'
    ]
   },
   {
    id:'seek-third',lens:'body',
    label:['寻找第三个出口','Search for a third outlet','三つ目の出口を探す'],
    text:[
     '光越过流石和浅沟，没有找到身体。更远处却有一小片水膜刚刚被扰动。',
     'The beam crosses flowstone and a shallow groove without finding a body. Farther away, a small water film has just been disturbed.',
     '光は流石と浅い溝を越えるが、身体は見つからない。さらに先では、小さな水膜だけが今しがた乱れている。'
    ]
   }
  ]
 },
 {
  id:'input',
  name:['PULSE 03 · 输入','PULSE 03 · INPUT','PULSE 03 · 流入'],
  prompt:[
   '渗水带进一小团深色有机碎屑。原本没有移动的裂口附近，出现了新的身体。食物的位置没有改变洞穴的形状，却改变了哪些通路开始有意义。',
   'Seepage brings in a small patch of dark organic debris. A body appears near a fissure that had shown no movement. The food does not change the cave\'s shape, but it changes which routes begin to matter.',
   '浸透水が小さな暗色の有機物片を運び込む。これまで動きのなかった割れ目の近くに、新しい身体が現れる。食物は洞窟の形を変えないが、どの通路が意味を持つかを変える。'
  ],
  options:[
   {
    id:'watch-input',lens:'medium',
    label:['看碎屑从哪里来','Follow the debris source','屑がどこから来るか見る'],
    text:[
     '你沿着水膜反向寻找。路线在一处石灰岩边缘变窄，然后消失在更细的缝里。',
     'You trace the water film backward. The route narrows along a limestone edge, then disappears into a finer crack.',
     '水膜を逆にたどる。経路は石灰岩の縁で細くなり、さらに細い隙間へ消える。'
    ]
   },
   {
    id:'watch-animal',lens:'body',
    label:['跟住这只个体','Follow the animal','この個体を追う'],
    text:[
     '它沿底面缓慢移动。水经过身体，但身体没有顺着水一起漂走。',
     'It moves slowly along the bottom. Water passes the body, but the body does not drift away with it.',
     '身体は底面をゆっくり進む。水は身体を通り過ぎるが、身体は流れと一緒には漂わない。'
    ]
   },
   {
    id:'leave-input',lens:'limit',
    label:['不替它补上目的','Do not assign a purpose','目的を補わない'],
    text:[
     '你留下“碎屑出现”“身体出现”两条记录，没有在它们之间写下因为。',
     'You leave two records—“debris appeared” and “a body appeared”—without writing because between them.',
     '「屑が現れた」「身体が現れた」という二つの記録を残し、その間に「だから」を書かない。'
    ]
   }
  ]
 },
 {
  id:'recession',
  name:['PULSE 04 · 回落','PULSE 04 · RECESSION','PULSE 04 · 減衰'],
  prompt:[
   '渗流重新减弱。刚才属于同一片水的地方又分开了。一个入口不再出水，另一处细泥开始重新沉降。你现在无法确认那只个体在哪一个空间里。',
   'Seepage weakens again. Places that had belonged to one body of water separate. One opening stops flowing; silt begins to settle at another. You can no longer confirm which space contains the animal.',
   '浸透が再び弱まる。さきほど同じ水に属していた場所が分かれる。一つの入口では水が止まり、別の場所では細泥がまた沈み始める。いま、その個体がどの空間にいるのか確認できない。'
  ],
  options:[
   {
    id:'search-again',lens:'body',
    label:['继续寻找','Keep searching','探し続ける'],
    text:[
     '光在几处入口之间来回移动。你找到新的水痕，没有找到完整的移动。',
     'The beam moves among several openings. You find new water traces, but not a complete movement.',
     '光はいくつかの入口を行き来する。新しい水の痕跡は見つかるが、完全な移動は見つからない。'
    ]
   },
   {
    id:'finish-map',lens:'medium',
    label:['完成通路图','Finish the route map','通路図を仕上げる'],
    text:[
     '你把实线、虚线和空白留在同一张图上。它们代表不同程度的证据，不代表同一种空间。',
     'You leave solid lines, broken lines, and blanks on the same map. They represent different degrees of evidence, not one kind of space.',
     '実線、破線、空白を同じ図に残す。それらは証拠の強さの違いであり、同じ種類の空間を示すものではない。'
    ]
   },
   {
    id:'lights-out',lens:'limit',
    label:['熄灭手电','Switch off the light','ライトを消す'],
    text:[
     '光消失以后，流石只剩很暗的轮廓。对你而言，那里重新变成黑暗；水仍在裂隙之间。',
     'When the light goes out, only faint flowstone contours remain. For you it becomes darkness again; water remains between the fissures.',
     '光を消すと、流石はごく暗い輪郭だけになる。あなたには再び暗闇になる。それでも水は割れ目の間にある。'
    ]
   }
  ]
 }
];

export const GROUNDWATER_ENDINGS={
 body:{
  title:['最后一次扫掠','Final sweep','最後の走査'],
  body:[
   '你留下了四次发现。每一次都有一个身体进入或离开光圈。它们之间的黑暗没有被记录。',
   'You leave four discoveries. Each contains a body entering or leaving the beam. The darkness between them was not recorded.',
   '四回の発見が残る。どれも身体が光へ入り、あるいは光から出ていく記録だ。その間の暗闇は記録されなかった。'
  ],
  line:[
   '你看见的是出现与消失，不是完整的路。',
   'You saw appearances and disappearances, not the complete route.',
   '見えたのは出現と消失であって、完全な経路ではない。'
  ]
 },
 medium:{
  title:['不完整的连通图','Incomplete connectivity map','不完全な接続図'],
  body:[
   '你画出了几条通路。没有一条来自你真正看见的完整移动。入口、细泥、水膜和外源碎屑替中间那一段留下了证据。',
   'You mapped several routes. None came from a complete movement you actually witnessed. Openings, silt, water films, and imported debris left evidence for the missing interval.',
   'いくつかの通路を描いた。完全な移動を実際に見て得た線は一本もない。入口、細泥、水膜、外から来た屑が、見えない区間の証拠を残した。'
  ],
  line:[
   '屏幕上的距离不是这里唯一的空间。',
   'Distance on the screen is not the only space here.',
   '画面上の距離だけが、ここでの空間ではない。'
  ]
 },
 limit:{
  title:['灯外','Beyond the beam','光の外'],
  body:[
   '你保留了几处没有补完的间隔。灯熄灭以后，观察结束了。洞穴没有。',
   'You kept several intervals unfinished. When the light went out, the observation ended. The cave did not.',
   'いくつかの区間を補完しないまま残した。光を消すと観察は終わった。洞窟は終わらなかった。'
  ],
  line:[
   '对你而言，那里是黑暗。对它而言，那里仍然是路。',
   'For you, it is darkness. For it, it is still a route.',
   'あなたには暗闇でも、それにとってはまだ通路だ。'
  ]
 }
};
