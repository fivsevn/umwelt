import {caveFocus} from '../../scenery/groundwater-sites.mjs';
// One recharge episode, four phases, two observations per phase.
// These are illustrative observations, not measured durations or proof of a hidden route.
const option=(id,lens,label,text)=>({id,lens,label,text});
export const GROUNDWATER_PHASES=[
 {name:['渗水','Seepage','浸透'],metrics:[32,36,8,12,16]},
 {name:['涨水','Rising flow','増水'],metrics:[74,78,10,28,14]},
 {name:['来水','Incoming water','流れ着く水'],metrics:[82,66,78,24,38]},
 {name:['退水','Receding flow','減水'],metrics:[38,24,42,11,28]}
];
export function groundwaterProgress(s){
 return (s.records||[]).filter(r=>r.kind==='groundwater-pulse').reduce((n,r,i)=>Math.max(n,(Number.isInteger(r.observationIndex)?r.observationIndex:i*2+1)+1),0);
}
export function groundwaterObservationIndex(s){
 return Math.min(7,Number.isInteger(s.scene?.observationIndex)?s.scene.observationIndex:Number.isInteger(s.scene?.pulseIndex)?s.scene.pulseIndex*2+1:groundwaterProgress(s));
}
export const GROUNDWATER_OBSERVATIONS=[
 {
  "id": "film",
  "name": [
   "渗水 · 湿石",
   "Seepage · wet stone",
   "しみ水 · 濡れた石"
  ],
  "prompt": [
   "薄水铺过石面，几道浅色的身影走走停停。裂缝挨得很近，门口却各有各的忙。",
   "A little water spreads over stone. Pale shapes move, pause, move again. The cracks sit close together; each doorway keeps different hours.",
   "薄い水が石を覆い、淡い姿が進んでは止まる。隙間は近いのに、入口ごとに忙しい時間が違う。"
  ],
  "options": [
   {
    "id": "film-body",
    "lens": "body",
    "label": [
     "看细脚走动",
     "Watch the little feet",
     "小さな脚を見る"
    ],
    "text": [
     "细脚轮流落下，前头的两根细须还在左右探。身体停了，门口的事还没忙完。",
     "Little feet take turns. Two fine feelers keep sweeping ahead. The body stops; business at the doorway continues.",
     "小さな脚が交互に着き、二本の細いひげが揺れる。身体が止まっても、入口の用事は終わらない。"
    ]
   },
   {
    "id": "film-edge",
    "lens": "medium",
    "label": [
     "沿湿石看",
     "Follow the wet stone",
     "濡れた石をたどる"
    ],
    "text": [
     "湿痕绕过石角，亮处还接着一片干石。灯照到了，路没跟着添长。",
     "A wet trace bends around a corner, beside a patch of dry stone. More light has arrived. No extra road.",
     "濡れた跡は石角を曲がり、その隣に乾いた石が光る。明るくなっても、道は延びない。"
    ]
   },
   {
    "id": "film-dark",
    "lens": "limit",
    "label": [
     "把光移到旁边",
     "Move the light aside",
     "光を脇へ移す"
    ],
    "text": [
     "光圈挪开，细脚还在原处走动。灯换了地方，这里的作息照旧。",
     "The beam moves aside. Little feet continue. A change of lighting leaves the local schedule intact.",
     "光が移っても、小さな脚は動き続ける。照明が変わっても、ここの暮らしはいつも通り。"
    ]
   }
  ]
 },
 {
  "id": "fissure",
  "name": [
   "渗水 · 门口",
   "Seepage · doorway",
   "しみ水 · 入口"
  ],
  "prompt": [
   "湿石边有一道暗缝。浅色身体露出半截，又退到石边后。门口一时空着，里面没有传出消息。",
   "A dark crack borders the wet stone. Half a pale body appears, then slips behind the edge. The doorway stands empty. No news from inside.",
   "濡れた石の縁に暗い隙間がある。淡い身体が半分現れ、また奥へ引く。入口は空き、奥から便りはない。"
  ],
  "options": [
   {
    "id": "mark-entrance",
    "lens": "medium",
    "label": [
     "记下入口",
     "Mark the doorway",
     "入口を記す"
    ],
    "text": [
     "石边留下一枚十字。地址有了，屋里的样子还空着。",
     "A cross remains by the stone. An address, with the interior left blank.",
     "石の縁に十字が残る。住所はできたが、間取りは空白のまま。"
    ]
   },
   {
    "id": "fissure-body",
    "lens": "body",
    "label": [
     "看露出的半截",
     "Watch the visible half",
     "見える半分を見る"
    ],
    "text": [
     "几条细脚藏进石边，又从同一侧露出来。短短一趟，远行还谈不上。",
     "Little feet vanish beneath the edge and return on the same side. A short outing, scarcely a journey.",
     "細い脚が石の陰へ入り、同じ側から出る。短い外出で、旅と呼ぶにはまだ早い。"
    ]
   },
   {
    "id": "fissure-blank",
    "lens": "limit",
    "label": [
     "留下缝里的空白",
     "Leave the inside blank",
     "奥を空白にする"
    ],
    "text": [
     "纸上的线停在缝口。再往里，暂时没有字。",
     "The line on the page stops at the opening. Farther in, no words yet.",
     "紙の線は入口で止まる。奥には、まだ文字がない。"
    ]
   }
  ]
 },
 {
  "id": "silt",
  "name": [
   "涨水 · 细泥",
   "Rising water · fine mud",
   "増水 · 細かな泥"
  ],
  "prompt": [
   "水纹密起来，细小的泥点从石边经过。浅色身体仍贴着湿石慢慢走，快递比住客先到。",
   "Ripples gather. Tiny flecks of mud pass the stone. Pale bodies keep walking slowly against the wet surface. The deliveries arrive before the residents.",
   "水紋が増え、小さな泥の点が石の脇を通る。淡い身体はゆっくり歩く。荷物の方が住人より先に着く。"
  ],
  "options": [
   {
    "id": "record-silt",
    "lens": "medium",
    "label": [
     "记下泥点的去向",
     "Mark where the flecks go",
     "泥の点の行方を記す"
    ],
    "text": [
     "泥点挨个向下走。石边的细脚没有加入这支队伍。",
     "Flecks pass downward in a loose line. The little feet by the stone decline to join the procession.",
     "泥の点が順に下へ進む。石のそばの細い脚は、その列には加わらない。"
    ]
   },
   {
    "id": "silt-body",
    "lens": "body",
    "label": [
     "看细脚和泥点",
     "Watch feet and flecks",
     "脚と泥の点を見る"
    ],
    "text": [
     "泥点轻轻越过一截身体。一个赶路，一个还在门口。",
     "A fleck passes over a pale back. One is travelling; one is still at the door.",
     "泥の点が淡い背を越える。一方は道中、もう一方はまだ玄関先。"
    ]
   },
   {
    "id": "silt-wait",
    "lens": "limit",
    "label": [
     "留着来处的空白",
     "Leave the origin blank",
     "来た場所は空白にする"
    ],
    "text": [
     "泥点到了，来路没有一同送达。",
     "The flecks arrive. The route taken is absent from the parcel.",
     "泥の点は届いた。通ってきた道は同封されていない。"
    ]
   }
  ]
 },
 {
  "id": "connection",
  "name": [
   "涨水 · 两处湿石",
   "Rising water · two wet stones",
   "増水 · 二つの濡れた石"
  ],
  "prompt": [
   "两处湿石之间，细水接上了一小段。几道浅色身影仍各自停走。水先串了门，住客还没动身。",
   "A little water joins two wet stones. Pale shapes continue separate errands. The water pays a visit first; the residents have yet to set out.",
   "二つの濡れた石を、細い水がつなぐ。淡い姿は別々に動く。水は先に隣へ寄ったが、住人はまだ出発しない。"
  ],
  "options": [
   {
    "id": "connect-marks",
    "lens": "medium",
    "label": [
     "添一条虚线",
     "Add a dotted line",
     "破線を添える"
    ],
    "text": [
     "两个记号之间多了一条虚线。实线还得再等等。",
     "A dotted line joins two marks. A solid line will have to wait.",
     "二つの印の間に破線が増える。実線の出番は、もう少し先。"
    ]
   },
   {
    "id": "connection-body",
    "lens": "body",
    "label": [
     "只看这块石边",
     "Stay with this stone",
     "この石の縁を見る"
    ],
    "text": [
     "湿石上的脚步绕了一小圈。隔壁很近，今天的事情还在这边。",
     "A small circuit along the wet stone. Next door is close, but the day’s business remains here.",
     "濡れた石で小さく一回り。隣は近いが、今日の用事はこちら側。"
    ]
   },
   {
    "id": "connection-blank",
    "lens": "limit",
    "label": [
     "两处各记一笔",
     "Keep separate marks",
     "別々に記す"
    ],
    "text": [
     "纸上留着两个记号，中间仍有余地。",
     "Two marks remain on the page, with room between.",
     "紙には二つの印。その間には、まだ余白。"
    ]
   }
  ]
 },
 {
  "id": "particles",
  "name": [
   "来水 · 碎屑",
   "Incoming water · scraps",
   "流れ着くもの · かけら"
  ],
  "prompt": [
   "几片深色碎屑随水到了石脚。有的停住，有的继续走。浅色身体从旁经过，新东西没有办成一场集会。",
   "Dark scraps arrive at the foot of the stone. Some settle; some pass on. Pale bodies walk nearby. The new arrivals fail to convene a gathering.",
   "暗いかけらが石の根元へ流れ着く。留まるもの、通り過ぎるもの。淡い身体は脇を歩き、新着の品でも集会にはならない。"
  ],
  "options": [
   {
    "id": "watch-input",
    "lens": "medium",
    "label": [
     "看碎屑落在哪里",
     "Watch where scraps settle",
     "かけらの落ち着く先を見る"
    ],
    "text": [
     "石脚接住了一小片。别处来的东西，暂时有了落脚地。",
     "A scrap catches at the stone. Something from elsewhere has found a place to stop.",
     "石の根元に小さなかけらが留まる。よそから来たものに、ひとまず居場所ができる。"
    ]
   },
   {
    "id": "input-body",
    "lens": "body",
    "label": [
     "看旁边的脚步",
     "Watch the nearby feet",
     "そばの足取りを見る"
    ],
    "text": [
     "一截浅色身体绕过碎屑，继续往前。桌边经过，还算不上一顿饭。",
     "A pale body rounds a scrap and continues. Passing the table hardly counts as dinner.",
     "淡い身体がかけらを回り、その先へ進む。食卓を通っただけでは、一食にはならない。"
    ]
   },
   {
    "id": "input-blank",
    "lens": "limit",
    "label": [
     "分成两笔记",
     "Make two entries",
     "二つに分けて記す"
    ],
    "text": [
     "一笔记碎屑，一笔记脚步。两笔之间，没急着添上“于是”。",
     "One entry for scraps, one for footsteps. No “therefore” has been squeezed between.",
     "かけらに一行、足取りに一行。間に「だから」は、まだ入らない。"
    ]
   }
  ]
 },
 {
  "id": "biofilm",
  "name": [
   "来水 · 石边停留",
   "Incoming water · a pause",
   "流れ着くもの · 石のそば"
  ],
  "prompt": [
   "湿石上贴着一层淡淡的颜色。一截身体停在边上，前头仍有小动作。灯留了一会儿，笔尖比细脚还安静。",
   "A faint stain clings to the wet stone. A body pauses beside it, with tiny movements at the front. The lamp stays a while. The pencil is quieter than the feet.",
   "濡れた石に淡い色がつく。身体が縁で止まり、先の方だけ細かく動く。灯りが留まる。鉛筆は小さな脚より静かだ。"
  ],
  "options": [
   {
    "id": "film-record",
    "lens": "medium",
    "label": [
     "记下停留的地方",
     "Mark the resting place",
     "止まった場所を記す"
    ],
    "text": [
     "石边多了一点记号。停留有了位置，缘由还没落笔。",
     "A mark beside the stone locates the pause. The reason remains unwritten.",
     "石のそばに小さな印。止まった場所は残り、理由はまだ書かれない。"
    ]
   },
   {
    "id": "film-probe",
    "lens": "body",
    "label": [
     "看前头的小动作",
     "Watch the tiny movements",
     "先の小さな動きを見る"
    ],
    "text": [
     "细须碰了碰石面，又收回来。前头忙着，究竟忙些什么，灯还照不明白。",
     "Fine feelers touch the stone and withdraw. Busy at the front, though the light cannot quite reveal the errand.",
     "細いひげが石に触れ、また戻る。先の方は忙しいが、何の用事かまでは灯りにわからない。"
    ]
   },
   {
    "id": "film-uncertain",
    "lens": "limit",
    "label": [
     "暂时只写“停留”",
     "Write only “a pause”",
     "ひとまず「ひと休み」と書く"
    ],
    "text": [
     "纸上只添了“停留”。这个词不大，暂时够用。",
     "Only “a pause” goes on the page. A small phrase, sufficient for now.",
     "紙には「ひと休み」だけ。小さな言葉で、今は足りる。"
    ]
   }
  ]
 },
 {
  "id": "recession",
  "name": [
   "退水 · 窄路",
   "Receding water · narrow passage",
   "引く水 · 細い道"
  ],
  "prompt": [
   "细水收窄，泥点走得慢了。湿石上仍有脚步，石间的暗处渐渐宽起来。刚才的近邻，又隔远了一点。",
   "The water narrows; flecks slow. Feet still move on wet stone as darkness widens between. Recent neighbours stand a little farther apart.",
   "水が細まり、泥の点も遅くなる。濡れた石では脚が動き続け、石の間の暗がりが広がる。さっきの隣家が、少し遠くなる。"
  ],
  "options": [
   {
    "id": "revise-map",
    "lens": "medium",
    "label": [
     "在线旁记上“刚才”",
     "Write “earlier” by the line",
     "線の脇に「さっき」と書く"
    ],
    "text": [
     "连线旁添了“刚才”两个字。老路还在纸上，新水已经换了样子。",
     "“Earlier” sits beside the line. The old passage remains on paper; the water has changed.",
     "線の脇に「さっき」が加わる。古い道は紙に残り、水はもう違う形。"
    ]
   },
   {
    "id": "recession-body",
    "lens": "body",
    "label": [
     "看留下的湿石",
     "Watch the remaining wet stone",
     "残った濡れ石を見る"
    ],
    "text": [
     "薄水还没退完，细脚也没收工。",
     "A little water remains. The little feet have not closed for the day.",
     "薄い水はまだ残り、小さな脚も店じまいには早い。"
    ]
   },
   {
    "id": "recession-blank",
    "lens": "limit",
    "label": [
     "留着断开的地方",
     "Leave the break open",
     "切れたところを残す"
    ],
    "text": [
     "纸上的空白宽了些，没有补线。",
     "The blank on the page grows wider. No line is added.",
     "紙の余白が少し広がる。線は足されない。"
    ]
   }
  ]
 },
 {
  "id": "refuge",
  "name": [
   "退水 · 灯外",
   "Receding water · beyond the beam",
   "引く水 · 光の外"
  ],
  "prompt": [
   "浅水还留在石脚，几道浅色身影时隐时现。纸上有入口，有停留，也有没接上的线。洞里照常，笔记快到末页。",
   "Shallow water remains at the stone. Pale shapes appear and disappear. The page holds doors, pauses, and unfinished lines. Ordinary hours in the cave; the notebook nears its last page.",
   "石の根元に浅い水が残り、淡い姿が見え隠れする。紙には入口、ひと休み、つながらない線。洞内はいつも通り、ノートは最後のページに近い。"
  ],
  "options": [
   {
    "id": "finish-map",
    "lens": "medium",
    "label": [
     "整理纸上的记号",
     "Arrange the marks",
     "紙の印を整える"
    ],
    "text": [
     "入口归入口，虚线仍是虚线。整齐了一点，没多出一条路。",
     "Doors remain doors, dotted lines remain dotted. A tidier page, without an extra road.",
     "入口は入口、破線は破線。少し整ったが、道が増えたわけではない。"
    ]
   },
   {
    "id": "last-body",
    "lens": "body",
    "label": [
     "再看一会儿",
     "Watch a little longer",
     "もう少し見る"
    ],
    "text": [
     "细脚还在轮流落下。末页将近，洞里没有散场的意思。",
     "Little feet keep taking turns. The last page approaches; no sign of closing time in the cave.",
     "小さな脚が交互に着く。最後のページが近くても、洞内はお開きにならない。"
    ]
   },
   {
    "id": "lights-out",
    "lens": "limit",
    "label": [
     "熄灭手电",
     "Switch off the torch",
     "ライトを消す"
    ],
    "text": [
     "光圈收起，浅色身影看不清了。滴水还在，石缝也还在。",
     "The beam folds away. Pale shapes become indistinct. The dripping remains. So do the cracks.",
     "光が消え、淡い姿は見えなくなる。滴る音と石の隙間は、そのまま残る。"
    ]
   }
  ]
 }
].map((observation,index)=>({...observation,focus:caveFocus(index)}));
