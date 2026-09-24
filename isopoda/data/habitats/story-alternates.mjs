// Optional state-aware alternatives for ordinary aquatic observation habitats.
// Each slot keeps the same day/period as STORIES; only the authored observation changes.
// "when" is interpreted by aquatic-story.mjs. Rows remain [observation, action, delta, consequence].
export const STORY_ALTERNATES={
 freshwater:{
  0:[{when:'always',row:[
   ['水面还很安静。沉木底下积着一圈比周围更细的褐色颗粒，一只个体只露出前半身。','The surface is quiet. A ring of finer brown grains has gathered beneath the wood, with one animal only half exposed.','水面は静かだ。沈木の下には周囲より細かな褐色の粒がたまり、一匹は身体の前半だけを見せている。'],
   ['让进水从木侧绕过','Route the inlet past the wood','流れを木の脇へ回す'],{flow:8,oxygen:6},
   ['颗粒先被抬起，又在另一侧落下。原来的“底部”被水重新画了一遍。','The grains lift, then settle on the other side. Water redraws what counted as the bottom.','粒は一度浮き、反対側へ沈む。水が「底」と呼んでいた場所を描き直す。']
  ]}],
  1:[{when:'high-flow',row:[
   ['午后的细粒移动得比早晨快。两只都靠在沉木背流的一面，身体方向却不同。','Fine particles move faster than in the morning. Two animals remain in the lee of the wood, facing different directions.','午後の細粒は朝より速い。二匹とも沈木の裏側にいるが、身体の向きは違う。'],
   ['缩小进水口','Narrow the inlet','流入口を狭める'],{flow:-10,oxygen:-2},
   ['木后的水纹变短。一个体离开，另一个仍停在原处。','Ripples shorten behind the wood. One animal leaves; the other remains.','木の後ろの水紋が短くなる。一匹は離れ、もう一匹はその場に残る。']
  ]}],
  2:[{when:'high-detritus',row:[
   ['夜里碎叶聚在沉木脚边，边缘开始失去清楚的轮廓。触角从碎屑之间伸出来。','At night leaf fragments collect beside the wood and their edges lose definition. Antennae emerge between them.','夜、葉の破片が沈木の根元に集まり、縁が曖昧になる。その間から触角が現れる。'],
   ['移开最厚的一小团','Remove the thickest clump','最も厚い一塊を除く'],{detritus:-10,oxygen:6},
   ['浑水短暂升起。下面原来还有一条没有被看见的窄路。','A small cloud rises. Beneath it was a narrow route that had not been visible.','小さな濁りが立つ。その下には、見えていなかった細い通り道があった。']
  ]}],
  4:[{when:'low-light',row:[
   ['第二天下午，遮光后的水草只剩边缘反光。一只沿暗处移动，经过亮斑时没有停。','On the second afternoon, shaded plants catch light only at their edges. One animal moves through the dark and crosses a bright patch without pausing.','二日目の午後、遮光された水草は縁だけが光る。一匹は暗い場所を進み、明るい斑点も止まらず横切る。'],
   ['留下一条窄光','Leave a narrow band of light','細い光の帯を残す'],{light:8,cover:-2},
   ['光只照亮一小段底面。路线经过它，却没有因此变成“趋光”或“避光”。','Light reaches only a short strip of bottom. The route crosses it without becoming a story of attraction or avoidance.','光は底の短い一帯だけを照らす。経路はそこを横切るが、それだけで「走光性」や「忌避」にはならない。']
  ]}],
  5:[{when:'low-oxygen',row:[
   ['夜里悬浮物更多，水草之间的空隙显得发灰。几个身体更接近有缓慢水流的边。','More particles remain suspended at night, greying the gaps between plants. Several bodies are nearer the edge of gentle flow.','夜は浮遊物が増え、水草の隙間が灰色に見える。いくつかの身体は緩い流れの縁へ近づいている。'],
   ['让水缓慢穿过底层','Send a gentle current along the bottom','底層へ緩い流れを通す'],{flow:8,oxygen:10},
   ['细粒被拉成长线，随后重新散开。身体的位置也逐渐不再挤在同一侧。','Fine grains stretch into lines and disperse again. The bodies gradually cease clustering on one side.','細粒は線状に伸び、また散る。身体も次第に同じ側へ集まらなくなる。']
  ]}],
  7:[{when:'high-flow',row:[
   ['第三天下午，昨天留下的沉积线已经断成几段。水流没有把它完全抹去，只改变了它的语法。','On the third afternoon, yesterday’s sediment line has broken into segments. Flow has not erased it, only changed its grammar.','三日目の午後、昨日の堆積線は数か所に途切れている。流れは消したのではなく、その文法を変えた。'],
   ['把水流调回缓慢','Return the flow to gentle','流れを穏やかに戻す'],{flow:-12,oxygen:-2},
   ['新的细粒停在旧线之间。两次水流同时留在一个底面上。','New grains settle between the old marks. Two different flows remain on the same bottom.','新しい細粒が古い線の間に沈む。二つの異なる流れが同じ底面に残る。']
  ]}]
 },
 intertidal:{
  0:[{when:'always',row:[
   ['退潮露出的石面还带着水膜。一个体停在裂缝口，水与空气在它身边同时存在。','A film of water remains on the exposed rock after ebb tide. One animal pauses at a crack where water and air coexist around it.','干潮で現れた岩面には水膜が残る。一匹が割れ目の入口で止まり、水と空気が同時にその周囲にある。'],
   ['保留湿润的裂缝','Keep the crack wet','濡れた割れ目を残す'],{cover:6,salinity:-1},
   ['水膜没有被擦掉。下一次涨潮之前，这里仍不是一个简单的“陆地”。','The film remains. Before the next flood, this place is still not simply “land.”','水膜は残る。次の満ち潮まで、ここは単純な「陸」にはならない。']
  ]}],
  1:[{when:'high-flow',row:[
   ['涨潮后，浪从两块石头之间压进来。个体贴得更低，短藻向同一方向伏下。','After the flood, water presses between two rocks. The animal flattens closer to the surface while short algae bend together.','満ち潮で二つの岩の間へ水が押し込む。個体はより低く張り付き、短い藻は同じ方向へ伏せる。'],
   ['让石后形成背流面','Keep a lee behind the stone','岩の後ろに流れの陰を残す'],{flow:-10,cover:5},
   ['背流处的水纹缩短。它没有离开石头，只把身体转了一个角度。','Ripples shorten in the lee. It does not leave the rock; it only changes angle.','流れの陰で水紋が短くなる。岩から離れず、身体の角度だけを変える。']
  ]}],
  2:[{when:'high-cover',row:[
   ['夜潮盖过石缝。你白天加深的阴影已经在水下，原来的边界只剩记录里的位置。','Night tide covers the crack. The shade preserved by day is now underwater; the old boundary survives only in the record.','夜の潮が割れ目を覆う。昼に残した影は水中に入り、元の境界は記録の位置としてだけ残る。'],
   ['再记一条水线','Mark another waterline','もう一本、水位線を記す'],{maps:2},
   ['两条线在纸上互不移动。海面没有选择其中一条作为正确答案。','Two lines remain still on paper. The sea does not choose one as the correct answer.','紙の上では二本の線が動かない。海はどちらか一方を正解にはしない。']
  ]}],
  3:[{when:'low-salinity',row:[
   ['第二天低潮，昨夜留下的水洼盐度更低。一个体停在水洼与外侧海水连接的位置。','At the second low tide, a pool left from the night is less saline. One animal pauses where it connects with seawater outside.','二日目の干潮。昨夜残った潮だまりは塩分が低い。一匹が外海とつながる場所で止まる。'],
   ['保持一条细小连通','Keep a narrow connection','細い連絡を残す'],{flow:6,salinity:1},
   ['细流重新进入水洼。两个读数开始靠近，但石缝仍保留自己的水。','A thin current re-enters the pool. The readings move closer, while the crack still holds its own water.','細い流れが潮だまりへ戻る。数値は近づくが、岩の隙間にはまだ固有の水が残る。']
  ]}],
  5:[{when:'low-detritus',row:[
   ['夜里退潮后，清掉碎屑的石缝显得过分清楚。入口更容易看见，里面却仍然不可见。','After the night ebb, the cleared crack looks unusually distinct. Its entrance is easier to see, while its interior remains invisible.','夜の干潮後、屑を除いた割れ目は不自然なほど明瞭だ。入口は見やすいが、中は依然として見えない。'],
   ['不再清理裂缝','Stop clearing the crack','これ以上、割れ目を掃除しない'],{quiet:2},
   ['没有新的动作。潮水留下的小碎屑开始重新进入入口附近。','Nothing new is done. Small debris left by the tide begins returning near the entrance.','新しい操作はしない。潮が残した小さな屑が入口の近くへ戻り始める。']
  ]}],
  7:[{when:'high-flow',row:[
   ['第三天下午的涨潮更急。旧水线很快被越过，昨天的“高处”重新成了水下。','The third afternoon flood is stronger. The old waterline is crossed quickly, and yesterday’s “high ground” is underwater again.','三日目の午後、満ち潮は強い。古い水位線はすぐ越えられ、昨日の「高い場所」は再び水中になる。'],
   ['让窄口分散浪涌','Diffuse the surge at the inlet','狭い入口で波を分散させる'],{flow:-9,cover:4},
   ['浪涌被拆成更短的水纹。边界没有稳定下来，只是改变了通过它的方式。','The surge breaks into shorter ripples. The boundary does not stabilize; only the way water crosses it changes.','波は短い水紋へ分かれる。境界が安定したのではなく、そこを越える方法が変わっただけだ。']
  ]}]
 },
 'shallow-marine':{
  0:[{when:'always',row:[
   ['藻叶之间的光不断移动。一个细长轮廓停在叶背，只有摆动让它时隐时现。','Light shifts constantly between fronds. An elongated silhouette rests beneath one, appearing and disappearing with the sway.','藻葉の間で光が動き続ける。細長い輪郭が葉裏にとまり、揺れによって見えたり隠れたりする。'],
   ['保留这片叶背','Keep this underside intact','この葉裏を残す'],{algae:8,cover:6},
   ['叶片继续摆动。你保留的不是一个固定位置，而是一块会移动的表面。','The frond keeps swaying. What you preserved is not a fixed place but a moving surface.','葉は揺れ続ける。残したのは固定された場所ではなく、動く表面だ。']
  ]}],
  1:[{when:'low-flow',row:[
   ['午后水流很缓。脱离藻叶的个体没有漂远，很快在另一片叶缘重新附着。','The afternoon current is weak. An animal that releases from one frond drifts only a short distance before attaching again.','午後の流れは弱い。藻葉から離れた個体は遠くへ流れず、すぐ別の葉の縁へ付着する。'],
   ['稍微增加水流','Increase the current slightly','流れを少し強める'],{flow:8,oxygen:4},
   ['漂移的弧线变长，但仍在藻丛内部结束。离开与到达发生在同一片背景里。','The drift arc lengthens but still ends within the bed. Departure and arrival occur inside the same background.','漂う弧は長くなるが、藻場の中で終わる。離れることと到着することが同じ背景の中で起こる。']
  ]}],
  3:[{when:'high-algae',row:[
   ['第二天，藻丛比第一天更密。视线只能穿过几条不断开合的缝。','On the second day the bed is denser. Sight passes only through a few gaps that keep opening and closing.','二日目、藻場は初日より密だ。視線は開閉を繰り返すわずかな隙間しか通れない。'],
   ['留出一条窄通道','Leave one narrow passage','細い通路を一つ残す'],{algae:-7,flow:5},
   ['水流先穿过去，随后一个轮廓也经过。通道是你做的，路线不是。','Water passes through first, then a silhouette follows. You made the passage; you did not make the route.','まず水が通り、その後に輪郭が通る。通路を作ったのはあなたでも、経路を作ったわけではない。']
  ]}],
  4:[{when:'low-flow',row:[
   ['午后，两片相邻藻叶几乎同步摆动。附着其上的两个体却在不同的时刻松开。','In the afternoon two adjacent fronds sway almost together. The two animals on them release at different moments.','午後、隣り合う二枚の藻葉はほぼ同時に揺れる。しかし付着する二匹は異なる時刻に離れる。'],
   ['保持缓流不变','Keep the gentle current','緩い流れをそのままにする'],{quiet:2},
   ['你没有调整水流。相似的摆动继续发生，不同步的停留也继续发生。','You do not adjust the current. Similar swaying continues, and so do unsynchronized pauses.','流れは変えない。似た揺れが続き、同期しない停止も続く。']
  ]}],
  6:[{when:'low-detritus',row:[
   ['第三天早晨，清理后的砂地露出更大一块。一个轮廓必须穿过比昨天更长的空处。','On the third morning, cleaning has exposed a larger patch of sand. A silhouette must cross a longer open space than yesterday.','三日目の朝、掃除した砂地がより広く露出している。輪郭は昨日より長い開けた場所を横切る必要がある。'],
   ['留下一小片落藻','Leave a small fallen frond','小さな落ち藻を残す'],{detritus:7,cover:4},
   ['落藻贴住砂面，空处被分成两段。身体从第一段经过，在叶边停了一次。','The fallen frond settles on the sand, splitting the opening in two. The body crosses the first section and pauses at the leaf edge.','落ち藻が砂に沿い、空いた場所を二つに分ける。身体は最初の区間を渡り、葉の縁で一度止まる。']
  ]}],
  7:[{when:'high-flow',row:[
   ['第三天下午，水流把藻尖压成更大的弧。一个体松开后短暂离开了藻丛的轮廓。','On the third afternoon, stronger flow bends the frond tips into wider arcs. One animal releases and briefly leaves the outline of the bed.','三日目の午後、強い流れが藻先を大きな弧へ曲げる。一匹は離れ、短い間だけ藻場の輪郭の外へ出る。'],
   ['减弱这一阵水流','Ease this current','この流れを弱める'],{flow:-10,oxygen:-2},
   ['它在画面边缘重新抓住藻叶。你只看见离开和重新出现，中间没有完整路线。','It grips a frond again at the edge of the frame. You see departure and reappearance, not a complete route between them.','画面の縁で再び藻葉をつかむ。見えたのは離脱と再出現で、その間の完全な経路ではない。']
  ]}]
 }
};
