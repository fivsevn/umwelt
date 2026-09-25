import {encodeIsopodText} from '../../locales/isopod.mjs';
const rows={
 arrival:['这片沙里的住客','Residents of this sand','この砂の住人'],start:['去沙滩看看','Visit the sand','砂浜をのぞく'],
 hint:['按住沙面挖开；继续按住可提起，松开放下。平静的沙下也可能有住客。','Hold sand to dig; keep holding to lift, release to put down. Still sand may be occupied too.','砂を長押しして掘る。そのまま持ち上げ、離すと下ろす。静かな砂の下にも住人がいる。'],
 look:['看看沙子下面','Look beneath the sand','砂の下を見る'],wait:['等一道浪','Wait for a wave','波を待つ'],
 lookAfter:['手可以进入画面。沙子没有标出入口。','Your hand can enter the scene. The sand has not marked an entrance.','手は画面に入れる。砂に入口の印はない。'],
 waitAfter:['你把手留在外面。浪来的时候，也没有敲门。','You keep your hand outside. The waves do not knock either.','手を外に置く。波もノックはしない。'],
 'ending:title':['沙面重新平了','Level sand again','また平らな砂'],
 'ending:body':['你开始认得这片沙的颜色，也认得几种消失的方法。最后一页写完，沙里仍有没见过面的住客。','You begin to know the colour of this sand, and several ways of disappearing. The last page is finished; some residents remain unseen.','砂の色と、姿を消すいくつかの仕方を覚えた。最後の頁を書き終えても、まだ顔を見ていない住人がいる。'],
 'ending:line':['表面看起来，地方还很宽。','From the surface, there still seems to be plenty of room.','表面から見ると、まだ広く空いている。'],
 sand:['湿沙','Wet sand','湿砂'],water:['浅水','Shallows','浅水'],wave:['细浪','Small waves','小波']
};
const beats=[
 [
  [
   "临时住址",
   "A temporary address",
   "仮の住所"
  ],
  [
   "阿西莫夫把本子翻到空白页，写下：空地。旁边一小块沙拱了起来。他把那个字划掉，纸上立刻比沙滩拥挤。",
   "Asimov opens a blank page and writes: vacant ground. A patch of sand rises beside him. He crosses out the word. The page is already more crowded than the beach.",
   "アシモフは白紙に「空き地」と書いた。隣で砂が盛り上がる。その文字を消すと、浜辺より紙のほうが混み合ってきた。"
  ],
  [
   "替它添一个门牌",
   "Give it an address",
   "番地をつける"
  ],
  [
   "你在纸上画了一扇门。沙里的住客从门的背面钻走了。阿西莫夫说，地址可以先留着，建筑以后再议。",
   "You draw a door on the page. The resident burrows away behind it. Asimov suggests keeping the address and discussing the building later.",
   "紙に扉を描いた。住人はその裏へ潜った。住所は残して、建物は後で考えよう、とアシモフが言う。"
  ],
  [
   "先别给这里起名",
   "Leave it unnamed",
   "名前はまだつけない"
  ],
  [
   "这一栏暂时空着。小小的身体越过你的影子，倒没有为登记的事停下来。",
   "The field stays blank. A small body crosses your shadow without stopping for registration.",
   "欄は空いたまま。小さな身体は、登録のために止まることもなく影を横切った。"
  ]
 ],
 [
  [
   "拜访",
   "A visit",
   "訪問"
  ],
  [
   "阿西莫夫伸出一根手指，又收了回去。“门铃大概在另一边。”你可以按住一小块沙，继续按着，把住客轻轻提起；松手便放回。没有动静的地方，也未必无人应门。",
   "Asimov extends a finger, then withdraws it. “The bell must be on the other side.” Hold a patch of sand and keep holding to lift its resident; release to put it down. Even a quiet address may be occupied.",
   "アシモフは指を伸ばし、引っ込めた。「呼び鈴は向こう側かな」。砂を押し続ければ住人をそっと持ち上げ、離せば下ろせる。静かな場所にも、誰かいるかもしれない。"
  ],
  [
   "记下这次拜访",
   "Record the visit",
   "訪問を記す"
  ],
  [
   "本子上多了“来访者一名”。你读了一遍，才发现阿西莫夫记的是你。",
   "The notebook gains an entry: one visitor. Reading it again, you realise Asimov means you.",
   "手帳に「訪問者一名」と増えた。読み返すと、それは自分のことだった。"
  ],
  [
   "把手留在外面",
   "Keep your hand outside",
   "手を外に置く"
  ],
  [
   "你等了一会儿。没有谁出来招待。这里的礼貌，可能不包括证明自己在家。",
   "You wait. Nobody comes out to receive you. Courtesy here may not require proof of being home.",
   "しばらく待つ。迎えは来ない。ここの礼儀には、在宅の証明は含まれないのかもしれない。"
  ]
 ],
 [
  [
   "一粒路标",
   "A grain for a landmark",
   "砂粒の道標"
  ],
  [
   "你挑了一粒深色的沙，准备认住刚才的位置。浪退下去以后，附近多了十几粒一模一样的深色。阿西莫夫把尺子收起来了。",
   "You choose a dark grain to mark the spot. After a wave retreats, a dozen identical grains surround it. Asimov puts his ruler away.",
   "目印に黒い砂粒を選ぶ。波が引くと、同じ色が十数粒に増えていた。アシモフは定規をしまった。"
  ],
  [
   "画一张小地图",
   "Draw a little map",
   "小さな地図を描く"
  ],
  [
   "地图画好了，比例是“一次记忆比一片沙滩”。暂时没有人提出异议。",
   "The map is ready. Its scale is one memory to one beach. No objections have been filed.",
   "縮尺は、ひとつの記憶対ひとつの浜辺。今のところ異議はない。"
  ],
  [
   "承认认错了地方",
   "Admit losing the spot",
   "見失ったと認める"
  ],
  [
   "阿西莫夫在页角点了一下。“这里也可以记一次发现。”那个点比路标可靠，至少不会被浪搬走。",
   "Asimov dots the corner of the page. “That counts as a finding.” The dot, at least, will not be moved by a wave.",
   "アシモフが頁の隅に点を打つ。「これも発見にしておこう」。少なくとも、この点は波に運ばれない。"
  ]
 ],
 [
  [
   "谁在上面",
   "Who is above",
   "上にいるのは"
  ],
  [
   "一只等足目停在你影子的边缘。你低头看它，阿西莫夫却抬头看了看你。两份观察记录，大概不会写出同一种天气。",
   "An isopod pauses at the edge of your shadow. You look down at it; Asimov looks up at you. The two reports would probably describe different weather.",
   "等脚類が影の端で止まった。あなたは見下ろし、アシモフはあなたを見上げる。二つの記録に、同じ天気は書かれないだろう。"
  ],
  [
   "把影子让开一点",
   "Move your shadow aside",
   "影を少しよける"
  ],
  [
   "亮处往前移了一点。它转了个方向。阿西莫夫没有把这写成感谢。",
   "The light shifts forward. It turns. Asimov does not record this as gratitude.",
   "明るい場所が少し動く。身体が向きを変える。アシモフは、それを感謝とは書かなかった。"
  ],
  [
   "写下自己的位置",
   "Record where you stand",
   "自分の位置を書く"
  ],
  [
   "你第一次把观察者画进图里。图上忽然出现了一个大得不太合适的东西。",
   "For the first time you draw the observer into the diagram. Something awkwardly large appears on the page.",
   "初めて観察者を図に描いた。妙に大きなものが一つ、紙の上に現れた。"
  ]
 ],
 [
  [
   "搬家手续",
   "Moving house",
   "引っ越しの手続き"
  ],
  [
   "一个身体钻下去，另一个在不远处露出来。你差点在两点之间画箭头。阿西莫夫按住了纸：“我们还没有问过它们的名字。”",
   "One body disappears; another surfaces nearby. You nearly draw an arrow between them. Asimov steadies the paper. “We have not asked their names.”",
   "一つが潜り、近くで別の身体が現れた。矢印を結びかけると、アシモフが紙を押さえる。「まだ名前も聞いていないよ」。"
  ],
  [
   "把箭头擦掉",
   "Erase the arrow",
   "矢印を消す"
  ],
  [
   "纸上剩下两个点。关系没有跟着消失，只是暂时不归你说明。",
   "Two dots remain. Their relationship has not vanished; it is simply not yours to explain yet.",
   "二つの点が残った。関係が消えたのではない。まだこちらが説明する番ではない。"
  ],
  [
   "在箭头旁加问号",
   "Add a question mark",
   "疑問符を添える"
  ],
  [
   "问号占的地方比箭头还大。阿西莫夫觉得这个比例很合适。",
   "The question mark takes more room than the arrow. Asimov approves of the proportions.",
   "疑問符は矢印より大きくなった。アシモフは、ちょうどよい比率だと言う。"
  ]
 ],
 [
  [
   "不留收据",
   "No receipt",
   "領収書なし"
  ],
  [
   "刚才翻松的沙慢慢塌回去。一只等足目拱了几下，把自己收进里面。你找不到这次相遇的收据，手指上倒还沾着沙。",
   "The loosened sand settles. An isopod heaves a few times and tucks itself away. There is no receipt for the encounter, though sand remains on your finger.",
   "ほぐれた砂が戻っていく。等脚類は何度か身体を持ち上げ、中へ収まった。出会いの領収書はない。指に砂だけが残る。"
  ],
  [
   "留下那几粒沙",
   "Keep those grains",
   "砂粒を残す"
  ],
  [
   "它们很快干了，颜色也变了。纪念品没有义务保持证词一致。",
   "They soon dry and change colour. Souvenirs are under no obligation to keep their testimony consistent.",
   "すぐに乾いて色が変わる。記念品に、証言を変えない義務はない。"
  ],
  [
   "把沙还回去",
   "Return the sand",
   "砂を返す"
  ],
  [
   "几粒沙落回许多粒沙里。没有掌声，事情还是办成了。",
   "A few grains fall among many. There is no applause. The task is done all the same.",
   "数粒が、たくさんの砂へ戻った。拍手はない。それでも用事は済んだ。"
  ]
 ],
 [
  [
   "浪的修订",
   "The wave's revision",
   "波の改稿"
  ],
  [
   "一道浪越过你刚才画的边界。湿的一侧扩大了，干的一侧没有提出申诉。阿西莫夫把“固定”两个字挪到了括号里。",
   "A wave crosses your boundary. The wet side expands; the dry side files no appeal. Asimov puts the word “fixed” in brackets.",
   "波がさっきの境界を越える。湿った側が広がり、乾いた側は異議を申し立てない。アシモフは「固定」を括弧に入れた。"
  ],
  [
   "跟着重画边界",
   "Redraw the boundary",
   "境界を描き直す"
  ],
  [
   "第二条线刚画完，第一条已经很像一条历史。",
   "By the time the second line is finished, the first already resembles history.",
   "二本目を描き終えるころ、一本目はもう歴史らしくなっていた。"
  ],
  [
   "留着旧的那条",
   "Keep the old line",
   "古い線を残す"
  ],
  [
   "它现在表示的不是哪里，而是什么时候。地图多了一种用途。",
   "It now marks when, rather than where. The map has acquired another use.",
   "今度は場所でなく、時を示す線になった。地図の用途が一つ増えた。"
  ]
 ],
 [
  [
   "人口一栏",
   "The population field",
   "人口の欄"
  ],
  [
   "阿西莫夫问看见了几只。你数完，笔尖停在“总共”前面。沙面又轻轻动了一下，像有人在桌子下面补交表格。",
   "Asimov asks how many you saw. You count, then pause before “in total”. The sand shifts, as if someone under the desk were submitting a late form.",
   "何匹見た、と聞かれて数える。「全部で」の手前でペンが止まった。砂が動く。机の下から遅れて書類が届いたようだった。"
  ],
  [
   "写“至少”",
   "Write “at least”",
   "「少なくとも」と書く"
  ],
  [
   "这两个字给没露面的住客留了位置。纸张没有因此变大。",
   "Those words leave room for unseen residents. The paper has not grown any larger.",
   "姿の見えない住人の席ができた。紙は大きくなっていない。"
  ],
  [
   "这一栏先空着",
   "Leave the field blank",
   "欄を空けておく"
  ],
  [
   "阿西莫夫没有催你。空白这次不是因为这里什么也没有。",
   "Asimov does not hurry you. This blank does not mean that nothing is here.",
   "アシモフは急かさない。今度の空白は、何もいないからではない。"
  ]
 ],
 [
  [
   "把本子合上",
   "Closing the notebook",
   "手帳を閉じる"
  ],
  [
   "光落低了一点。你找回第一页，那个被划掉的“空地”还在。沙滩没有读过你的修订，照常有人出现，也有人把自己藏好。",
   "The light lowers. On the first page, the crossed-out “vacant ground” remains. The beach has not read your revisions. Bodies appear and tuck themselves away as usual.",
   "光が少し低くなった。最初の頁には、消した「空き地」が残っている。浜辺は改稿を読まず、現れたり隠れたりを続ける。"
  ],
  [
   "保留那个划痕",
   "Keep the crossing-out",
   "消した跡を残す"
  ],
  [
   "阿西莫夫说，第一页终于像一张有人来过的纸了。",
   "Asimov says the first page finally looks like somewhere someone has been.",
   "ようやく誰かが訪れた紙になったね、とアシモフが言った。"
  ],
  [
   "在旁边画一点沙",
   "Draw sand beside it",
   "隣に砂を描く"
  ],
  [
   "你画了几个点，剩下的交给纸。它看起来还有很多地方。",
   "You draw a few dots and leave the rest to the paper. There seems to be plenty of room.",
   "点をいくつか描いて、残りは紙に任せた。まだ、ずいぶん場所がある。"
  ]
 ]
];
beats.forEach(([title,prompt,left,leftAfter,right,rightAfter],i)=>{
 for(const [key,value] of Object.entries({title,prompt,left,leftAfter,right,rightAfter}))rows[`${i}:${key}`]=value;
});
rows.cycle=['沙滩手记','Beach notes','砂浜の手帳'];
export const sandText=(key,lang='zh')=>{const row=rows[key.replace(/^sand:/,'')];return !row?key:lang==='isopod'?encodeIsopodText(row[0]):row[{zh:0,en:1,ja:2}[lang]??0]};
export function sandScene(s){const i=Math.min(8,(s.day-1)*3+s.period);return {id:`sand:${i}`,kind:'aquatic',title:`sand:${i}:title`,text:`sand:${i}:prompt`,storyKey:`sand:${i}`,options:[{id:'sand-look',label:`sand:${i}:left`,text:`sand:${i}:leftAfter`,delta:{}},{id:'sand-wait',label:`sand:${i}:right`,text:`sand:${i}:rightAfter`,delta:{quiet:1}}]}}
