// Five material stages, two observation beats each, four choices per beat.
// Choices change the record, not decomposition. Existing IDs and slots stay stable.
export const FRESHWATER_MATERIAL_STAGES=Object.freeze([
 {
  id:"leaf",
  name:["观察 I · 叶片","Observation I · Leaf","観察 I · 葉"],
  steps:[
   {
    prompt:["一片叶子停在沉木旁，叶尖还随水轻动。一只沿边缘走，另一只只露出半截触角。记录本上的第一行还空着。","A leaf rests beside the submerged wood, its tip still moving with the water. One animal follows the edge; only half an antenna shows from another. The first line in your notebook is empty.","沈木のそばに葉が一枚。先端はまだ水に揺れている。一匹は縁を歩き、もう一匹は触角を半分だけ出している。記録帳の一行目は空いている。"],
    options:[
     {id:"fw-leaf-edge",animation:"fw-edge",lens:"relation",label:["沿叶缘看一会儿","Watch along the edge","葉の縁をしばらく見る"],text:["它走过叶尖，又折回背光的一侧。你写下的箭头只够记前半段。","It passes the tip, then doubles back to the shaded side. Your arrow records only the first half.","葉先を越え、陰の側へ引き返す。書いた矢印では前半しか記せない。"]},
     {id:"fw-leaf-under",animation:"fw-under",lens:"relation",label:["等叶片下面的动静","Wait for movement beneath the leaf","葉の下の動きを待つ"],text:["触角收回去了。叶片没有动，你暂时不能把下面记成空着。","The antenna withdraws. The leaf does not move. For now, you cannot mark the space below as empty.","触角が引っ込んだ。葉は動かない。その下を空欄にするには、まだ早い。"]},
     {id:"fw-leaf-outline",animation:"fw-mark-leaf",lens:"object",label:["先画下叶片","Sketch the leaf first","まず葉を描く"],text:["你画了叶尖和一道折痕。水让叶尖抬起时，纸上的叶子已经平放好了。","You draw the tip and a crease. When the water lifts the tip, the leaf on paper is already lying flat.","葉先と折り目を描いた。水が葉先を持ち上げた時、紙の葉はもう平らに置かれていた。"]},
     {id:"fw-leaf-location",animation:"fw-mark-leaf",lens:"object",label:["记下它靠着哪段沉木","Note where it rests against the wood","沈木のどこに接しているか記す"],text:["你选了一处木纹作记号。叶片稍稍偏开，木纹仍在，第一行多了一个“旁”。","You choose a mark in the grain. The leaf shifts a little; the mark remains. You add “beside” to the first line.","木目を一つ目印にした。葉が少しずれ、木目は残る。一行目に「そば」と書き足した。"]},
    ]
   },
   {
    prompt:["叶尖又抬起了一点。你刚才看过的地方，现在有一段藏在叶背。下一行还留着位置。","The tip lifts a little again. Part of the place you watched is now hidden behind the leaf. There is room on the next line.","葉先がまた少し浮いた。さっき見ていた場所の一部が、葉の裏に隠れている。次の行はまだ空いている。"],
    after:{
     "fw-leaf-edge":["你沿叶缘看到一半，身体转到了背面。纸上的线停在叶尖。下一笔从哪里接起？","Halfway along the edge, the animal moved behind the leaf. The line on paper ends at the tip. Where will you pick it up?","縁を追う途中で、身体が裏へ回った。紙の線は葉先で止まっている。次の一筆をどこから始める？"],
     "fw-leaf-under":["你等的触角还没有重新出现。叶下那一栏只写了“曾看见”。下一笔落在哪里？","The antenna you waited for has not reappeared. Under the leaf, your note says only “seen earlier.” Where does the next mark go?","待っていた触角はまだ現れない。葉の下の欄には「先ほど見えた」とだけある。次はどこを記す？"],
     "fw-leaf-outline":["小图画好了，叶尖仍在轻动。你把笔移到图旁，那里还能放一行字。","The sketch is finished; the tip is still moving. You move your pen beside the drawing, where there is room for a line.","図は描き終えた。葉先はまだ揺れている。図の横へ筆を移す。一行書ける余地がある。"],
     "fw-leaf-location":["沉木旁的记号已经留下。一个轮廓从记号所指的地方经过，没有在那里停住。","The mark beside the wood is in place. A body passes through the spot it points to without stopping.","沈木のそばに印をつけた。印の指す場所を一つの輪郭が通り、止まらずに進んだ。"],
    },
    options:[
     {id:"fw-leaf-route",animation:"fw-route",lens:"relation",label:["接着看那只往哪里走","Follow where it goes next","その一匹の行く先を追う"],text:["它在叶背消失，又从沉木旁露出来。你留下两个位置，中间没有连线。","It disappears behind the leaf and emerges beside the wood. You mark two positions without joining them.","葉の裏に消え、沈木のそばから現れた。二つの位置を記し、間には線を引かなかった。"]},
     {id:"fw-leaf-mark",animation:"fw-mark-leaf",lens:"object",label:["把叶片的位置记准","Mark the leaf’s position","葉の位置を記す"],text:["你补上了距离。下次可以从同一处开始找，至于会找到谁，这一行没有写。","You add the distance. Next time you can begin looking in the same place. The line does not say whom you will find.","距離を書き足した。次は同じ場所から探せる。誰が見つかるかは、この行には書かれていない。"]},
     {id:"fw-leaf-return",animation:"fw-under",lens:"relation",label:["再等一次出入","Wait for another passage","もう一度出入りを待つ"],text:["一个轮廓从叶下出来。你想写“又”，停了一下，先把这个字放在页边。","A body emerges from beneath the leaf. You start to write “again,” pause, and put the word in the margin.","葉の下から一つの輪郭が出てきた。「また」と書きかけ、手を止め、その語を余白に置いた。"]},
     {id:"fw-leaf-crease",animation:"fw-name-leaf",lens:"object",label:["给折痕留一个记号","Mark the crease","折り目を印にする"],text:["折痕留在小图中央。名字还没写，下次要找的地方已经有了。","The crease sits in the middle of your sketch. There is no name yet, but there is already somewhere to look next time.","小さな図の中央に折り目が残る。名前はまだない。次に探す場所はもうある。"]},
    ]
   },
  ]
 },
 {
  id:"conditioned",
  name:["观察 II · 被加工的叶片","Observation II · Conditioned leaf","観察 II · 加工された葉"],
  steps:[
   {
    prompt:["再来看时，叶面暗了一层，细小的附着物盖过了折痕。几只停在上面，口器很近才看得清。你翻到了原先那张图。","When you return, the leaf has darkened. Fine growth covers the crease. Several animals rest on it; their mouthparts are visible only up close. You turn back to the first sketch.","再び見ると葉面が一段暗く、細かな付着物が折り目を覆っていた。何匹かが留まり、近づいてようやく口器が見える。最初の図を開いた。"],
    options:[
     {id:"fw-conditioned-surface",animation:"fw-surface",lens:"relation",label:["看它在表面停多久","Watch how long it stays on the surface","表面に留まる時間を見る"],text:["口器一直在动，身体只挪了很短一段。你在“停着”后面又添了几个字。","The mouthparts keep moving; the body travels only a short distance. You add a few words after “still.”","口器は動き続け、身体はほんの少し進んだ。「静止」の後ろに数語を書き足した。"]},
     {id:"fw-conditioned-gap",animation:"fw-gap",lens:"relation",label:["看低下去的叶缘","Watch the lowered edge","低くなった葉の縁を見る"],text:["原来的缝矮了。一只试过入口，沿外侧绕开；你的小图还留着旧的高度。","The gap is lower. One animal tests the entrance and goes around outside. Your sketch still has the old height.","隙間が低くなった。一匹が入口を確かめ、外側へ回る。図には以前の高さが残っている。"]},
     {id:"fw-conditioned-colour",animation:"fw-name-leaf",lens:"object",label:["对照上次的颜色","Compare the earlier colour","前の色と見比べる"],text:["你在旧色块旁加了深色。两个色块并排，中间隔了多久，没有画进去。","You add a darker patch beside the old one. The two sit side by side; the time between them is not drawn.","前の色の横に濃い色を足した。二つは並んでいる。その間の時間は描かれていない。"]},
     {id:"fw-conditioned-crease",animation:"fw-name-leaf",lens:"object",label:["找原来的折痕","Look for the old crease","元の折り目を探す"],text:["折痕还能认出一小段。你沿它找回那片叶子，没有把覆在上面的细点擦去。","A short stretch of crease is still visible. It helps you find the leaf again. You leave the fine dots over it in the drawing.","折り目が少しだけ見える。それをたどってあの葉を見つけ、上を覆う細かな点も図に残した。"]},
    ]
   },
   {
    prompt:["记录本里还叫它“叶片”。水里，深色表面被一点点啃过，下面的缝也比先前窄了。你把笔停在旧名称后面。","The notebook still calls it “leaf.” In the water, the dark surface is being grazed, and the gap below is narrower. Your pen pauses after the old name.","記録帳ではまだ「葉」と呼んでいる。水中では暗い表面が少しずつ食べられ、下の隙間も狭くなった。以前の名の後ろで筆が止まる。"],
    options:[
     {id:"fw-conditioned-name",animation:"fw-name-leaf",lens:"object",label:["仍写在“这片叶子”下面","Keep the entry under “this leaf”","「この葉」の下に書き続ける"],text:["旧标题下面又添了一行。翻回去时，你还能找到它最初的样子。","You add a line under the old heading. Turning back, you can still find how it first looked.","古い見出しの下に一行足した。ページを戻せば、最初の姿をまだ見つけられる。"]},
     {id:"fw-conditioned-relation",animation:"fw-relate-surface",lens:"relation",label:["记下口器接触的位置","Note where the mouthparts touch","口器の触れる場所を記す"],text:["你标了几个小点，没有把整片都涂成食物。叶背仍有你看不到的地方。","You mark a few dots without shading the whole leaf as food. There are still places behind it you cannot see.","小さな点を幾つか記し、葉全体を餌の色には塗らなかった。裏にはまだ見えない場所がある。"]},
     {id:"fw-conditioned-question",animation:"fw-name-leaf",lens:"object",label:["在名称后留个问号","Leave a question mark after the name","名の後ろに疑問符を残す"],text:["问号很小，没有盖住原来的字。下次翻到这一页，两样都还看得见。","The question mark is small enough to leave the name visible. Next time you open this page, both will be there.","疑問符は小さく、元の字を隠さない。次にこのページを開いても、両方が見える。"]},
     {id:"fw-conditioned-interval",animation:"fw-surface",lens:"relation",label:["等这一只离开再记","Wait until this one leaves","この一匹が離れるまで待つ"],text:["它离开以后，深色表面空了一会儿。你把这段也算进观察时间。","After it leaves, the dark surface is empty for a while. You include that interval in the observation.","その一匹が去ると、暗い表面はしばらく空いた。その時間も観察に含めた。"]},
    ]
   },
  ]
 },
 {
  id:"fragmented",
  name:["观察 III · 被啃食与破碎","Observation III · Eaten and fragmented","観察 III · 摂食と破砕"],
  steps:[
   {
    prompt:["叶缘缺了一块，细叶脉露出来。沉木与泥之间多了几片小的，最大的仍在旧位置附近。原来的轮廓图没有地方放这些间隔。","A piece is missing from the edge, exposing fine veins. Small scraps lie between wood and silt; the largest remains near the old position. The original outline has no room for these gaps.","葉の縁が欠け、細い葉脈が出ている。沈木と泥の間に小片が増え、一番大きいものは元の場所の近くにある。最初の輪郭図には、この間隔を置く余地がない。"],
    options:[
     {id:"fw-fragment-main",animation:"fw-fragment",lens:"object",label:["先找最大的那片","Find the largest piece first","まず一番大きな片を探す"],text:["你在最大的残片旁写了原来的编号。小片也来自这里，暂时没有分到号码。","You put the old number beside the largest remnant. The smaller pieces came from here too; none has a number yet.","一番大きな残片の横に元の番号を書いた。小片もここから来たが、まだ番号はない。"]},
     {id:"fw-fragment-edges",animation:"fw-new-edges",lens:"relation",label:["看缺口边怎样经过","Watch passage along the broken edge","欠けた縁の通り方を見る"],text:["一只从新缺口穿过去，少绕了一段。你刚写下的“缺失”旁多了一条短线。","One animal passes through the new gap, taking a shorter way. A short line appears beside your new note, “missing.”","一匹が新しい欠け目を抜け、回り道が短くなった。書いたばかりの「欠損」の横に、短い線が増えた。"]},
     {id:"fw-fragment-count",animation:"fw-link-fragments",lens:"object",label:["数一数看得清的碎片","Count the pieces you can make out","見分けられる破片を数える"],text:["你数到第四片时，一片的边缘与泥混在一起。总数后面留下了半个括号。","At the fourth piece, an edge blends into the silt. You leave an open parenthesis after the count.","四つ目で縁が泥に紛れた。合計の後ろに、閉じていない括弧が残った。"]},
     {id:"fw-fragment-pause",animation:"fw-use-fragments",lens:"relation",label:["看碎片旁的一次停留","Watch a pause beside a fragment","破片のそばの停止を見る"],text:["它停在两片之间，触角先碰了一边，又转向另一边。你没有替这次停留选定一个归属。","It pauses between two pieces, touching one side with an antenna, then turning to the other. You do not assign the pause to either piece.","二片の間で止まり、触角で片側に触れ、もう片側へ向いた。その停止をどちらの片にも割り当てなかった。"]},
    ]
   },
   {
    prompt:["纸上有了几块分开的形状。你还记得它们连在一起的时候。水里，一只从两块之间过去，没有经过那条旧叶脉。","Separate shapes now cover the page. You remember when they were joined. In the water, an animal passes between two pieces, away from the old vein.","紙には離れた形が幾つかある。つながっていた時を覚えている。水中では一匹が二片の間を通り、古い葉脈は通らなかった。"],
    options:[
     {id:"fw-fragment-link",animation:"fw-link-fragments",lens:"object",label:["用细线连回原来的叶片","Link them to the earlier leaf","細い線で元の葉につなぐ"],text:["细线从几块残片回到旧图。你画得很轻，碎片之间的空处还看得见。","Fine lines lead from the pieces to the old sketch. You draw lightly enough to leave the spaces visible.","細線が幾つかの残片から古い図へ戻る。薄く引いたので、片の間の空白も見える。"]},
     {id:"fw-fragment-use",animation:"fw-use-fragments",lens:"relation",label:["分别记下经过与停留","Note passage and pauses at each piece","通過と停止をそれぞれ記す"],text:["一片旁有停顿，另一片被绕过。你没有把两行合成一句“它们在叶片上”。","There is a pause beside one piece; another is passed around. You leave the two lines separate instead of writing “they are on the leaf.”","一片のそばでは停止し、もう一片は回り込まれた。二行を「葉の上にいる」の一文にはまとめなかった。"]},
     {id:"fw-fragment-unsure",animation:"fw-fragment",lens:"object",label:["把来源不明的那片另画","Sketch the uncertain piece separately","由来の不確かな片を別に描く"],text:["那一片颜色很像，缺口对不上。你把它画在旁边，没有添上亲缘的线。","Its colour is close, but the torn edges do not fit. You draw it to one side without a line of kinship.","色は似ているが、欠け目が合わない。横に描き、系譜の線は足さなかった。"]},
     {id:"fw-fragment-gap",animation:"fw-new-edges",lens:"relation",label:["把碎片之间的水也画进去","Include the water between the pieces","破片の間の水も描く"],text:["你给间隔留了宽度。一只从那里穿过时，小图不再需要补一条绕行的线。","You leave width for the gap. When an animal passes through, the sketch needs no detour added.","間隔に幅を残した。一匹がそこを抜けた時、図に回り道を足す必要はなかった。"]},
    ]
   },
  ]
 },
 {
  id:"suspended",
  name:["观察 IV · 悬浮碎屑","Observation IV · Suspended detritus","観察 IV · 浮遊する破片"],
  steps:[
   {
    prompt:["几片细屑离开底面，经过水草，又散开。旧位置还压着一段叶脉。你的视线跟出去，记录本留在原来的地方。","Fine scraps lift off the bottom, pass the plants, and scatter. A length of vein remains at the old spot. Your gaze follows the scraps; the notebook stays where it was.","細かな屑が底を離れ、水草を過ぎて散った。元の場所には葉脈が一筋残る。視線は屑を追い、記録帳はその場にある。"],
    options:[
     {id:"fw-suspended-drift",animation:"fw-drift",lens:"object",label:["跟住一片漂起的细屑","Follow one drifting scrap","浮いた屑を一つ追う"],text:["它从水草后面出来时，旁边还有一片相近的。你把“同一片”划掉了一半。","As it emerges behind the plants, another similar scrap is beside it. You half cross out “the same one.”","水草の後ろから出た時、似た屑がもう一つあった。「同じ片」を途中まで消した。"]},
     {id:"fw-suspended-cling",animation:"fw-cling",lens:"relation",label:["看个体抓住的地方","Watch where the animal holds on","個体のつかまる場所を見る"],text:["细屑从它身旁过去，步足还扣在石面上。你记下了移动，也记下没有跟着移动的部分。","Scraps pass beside it while its legs hold the stone. You note the movement and the part that does not move with it.","屑がそばを過ぎても、脚は石面をつかんでいる。動いたものと、一緒には動かなかった部分を記した。"]},
     {id:"fw-suspended-vein",animation:"fw-origin",lens:"object",label:["回看留下的叶脉","Look back at the remaining vein","残った葉脈を見返す"],text:["叶脉还贴着泥，旁边空出一块。你能指认留下的，离开的暂时没有数清。","The vein still rests on the silt, with an empty patch beside it. You can identify what remains; you have not counted what left.","葉脈はまだ泥に接し、横に空いた場所がある。残ったものは指せる。離れたものはまだ数え切れない。"]},
     {id:"fw-suspended-lee",animation:"fw-redistribute",lens:"relation",label:["看沉木背水的一侧","Watch the lee side of the wood","沈木の流れの陰を見る"],text:["一小片在木后打转，比别处慢一些。你等它出去，它又从相近的地方经过。","A scrap circles behind the wood, slower than the others. You wait for it to leave; it passes nearby again.","小片が木の後ろを回り、ほかより少し遅い。出ていくのを待つと、また近くを通った。"]},
    ]
   },
   {
    prompt:["原来的记号旁空了许多。几片细屑在别处慢下来，还有一些已经跟丢。纸上从旧位置出发的线还没有终点。","The old mark has more empty space around it. A few scraps slow elsewhere; others are lost to view. The line from the old position has no endpoint yet.","古い印の周りが広く空いた。別の場所で幾つかの屑が遅くなり、見失ったものもある。元の位置から引いた線には、まだ終点がない。"],
    options:[
     {id:"fw-suspended-displacement",animation:"fw-track-displacement",lens:"object",label:["只连起一直看着的那一段","Join only the part you kept in view","見続けられた区間だけ結ぶ"],text:["线停在水草前。草后也有细屑，你没有把两边接上。","The line stops at the plants. There are scraps behind them too; you leave the two sides unjoined.","線は水草の前で止まる。後ろにも屑はあるが、両側をつながなかった。"]},
     {id:"fw-suspended-redistribute",animation:"fw-redistribute",lens:"relation",label:["记下细屑在哪些地方慢下来","Note where the scraps slow down","屑が遅くなる場所を記す"],text:["木后、石侧，各留了一个小点。点之间没有箭头，水仍从那里经过。","You place a dot behind the wood and another beside the stone. No arrows join them. Water still passes through.","木の後ろと石の脇に小さな点を一つずつ置いた。点の間に矢印はない。水はそこを通り続ける。"]},
     {id:"fw-suspended-lost",animation:"fw-track-displacement",lens:"object",label:["写下跟丢的位置","Mark where you lost sight of it","見失った位置を記す"],text:["你在那一处写了“到这里”。字的后面还有半页，暂时没有拿来延长路线。","You write “as far as here.” Half a page remains beyond the words; you do not use it to extend the route.","そこに「ここまで」と書いた。後ろには半ページ残っているが、経路を延ばすためには使わなかった。"]},
     {id:"fw-suspended-wait",animation:"fw-cling",lens:"relation",label:["等水草上的那只松开步足","Wait for the animal on the plant to let go","水草の一匹が脚を離すのを待つ"],text:["它换了一处抓附，仍没有随细屑漂走。你的下一行比上一行晚了很久。","It changes its grip without drifting away with the scraps. Your next line comes much later than the last.","つかまる場所を変えても、屑と一緒には流れなかった。次の一行まで、長い時間が空いた。"]},
    ]
   },
  ]
 },
 {
  id:"redeposited",
  name:["观察 V · 新的底面","Observation V · New bottom","観察 V · 新しい底面"],
  steps:[
   {
    prompt:["细屑与泥在低处铺开，几处颜色已经分不清。一只从上面经过，身后留下一小段浅痕。你翻到最初画叶片的那页。","Scraps and silt spread across a hollow; in places their colours merge. An animal crosses, leaving a short pale trace. You turn to the page with the first leaf sketch.","低い所に屑と泥が広がり、色を見分けられない所もある。一匹が通り、短い淡い跡が残った。最初に葉を描いたページを開く。"],
    options:[
     {id:"fw-redeposited-origin",animation:"fw-origin",lens:"object",label:["找还能与旧图对上的地方","Look for a match with the old sketch","古い図と合う所を探す"],text:["你认出一小段叶脉，其余只好停在“可能”。旧图还完整，眼前这一处没有那么齐全。","You recognize a short vein. The rest remains “perhaps.” The old sketch is whole; the place before you is less complete.","葉脈を少しだけ見分けた。残りは「たぶん」に留まる。古い図は完全なままで、目の前にはそこまで揃っていない。"]},
     {id:"fw-redeposited-now",animation:"fw-cross-bed",lens:"relation",label:["看它怎样走过这层底面","Watch it cross the new layer","この底面の歩き方を見る"],text:["步足压下去，细屑稍稍让开。它停过的地方，与你最初给叶片编号的地方很近。","Its legs press down and the scraps shift slightly. It pauses near where you first gave the leaf a number.","脚が押すと屑が少しずれた。止まった場所は、最初に葉へ番号をつけた場所の近くだった。"]},
     {id:"fw-redeposited-compare",animation:"fw-origin",lens:"object",label:["把新底面画在旧图旁","Draw the new bed beside the old sketch","古い図の横に今の底を描く"],text:["你另画了一幅，没有覆盖旧图。两幅用了同一把尺，空白的地方不同。","You make another drawing without covering the first. Both use the same scale; their empty spaces differ.","前の図を覆わず、もう一枚描いた。同じ尺度を使ったが、空白の場所は違う。"]},
     {id:"fw-redeposited-settle",animation:"fw-cross-bed",lens:"relation",label:["看足迹后面的细屑","Watch the scraps behind the tracks","足跡の後ろの屑を見る"],text:["细屑慢慢落回浅痕里。等你画到那里，痕迹已经比刚才短了一些。","Scraps slowly settle into the pale trace. By the time you draw it, the mark is shorter.","屑が淡い跡にゆっくり戻る。そこを描く頃には、跡は少し短くなっていた。"]},
    ]
   },
   {
    prompt:["最后一栏印着结束时间。水里没有对应的刻线，细屑还在落，新的足迹已经经过旧位置。你的笔停在栏边。","The last box is for an end time. There is no matching line in the water. Scraps are still settling; new tracks cross the old spot. Your pen rests at the edge of the box.","最後の欄には終了時刻とある。水中に対応する線はない。屑はまだ沈み、新しい足跡が元の場所を通っている。欄の端で筆が止まる。"],
    options:[
     {id:"fw-redeposited-boundary",animation:"fw-boundary",lens:"object",label:["记下最后辨清轮廓的那次","Note the last clear outline","最後に輪郭を見分けた回を記す"],text:["你在旧图旁标了一次观察。再往后，几页仍沿用它的编号。","You mark an observation beside the old sketch. The following pages still use its number.","古い図の横に観察の回を記した。その先の数ページにも、同じ番号が使われている。"]},
     {id:"fw-redeposited-route",animation:"fw-new-route",lens:"relation",label:["再看一段新路线","Watch one more stretch of the route","新しい経路をもう少し見る"],text:["它越过浅痕，走到页边没有画过的位置。你没有把那一处补成终点。","It crosses the pale trace and reaches a place missing from your drawing. You do not add an endpoint there.","淡い跡を越え、図に描いていない場所へ進んだ。そこを終点にはしなかった。"]},
     {id:"fw-redeposited-unfinished",animation:"fw-boundary",lens:"object",label:["把编号留到下一页","Carry the number onto the next page","番号を次のページへ移す"],text:["下一页先有了号码，正文还空着。能不能再认出它，要等到那时。","The next page has a number before it has any text. Whether you will recognize it again remains to be seen.","本文のない次のページに、まず番号が入った。また見分けられるかは、その時を待つ。"]},
     {id:"fw-redeposited-close",animation:"fw-new-route",lens:"relation",label:["写下自己离开的时间","Note the time you leave","自分が離れる時刻を書く"],text:["时间填进了最后一栏。你合上本子时，一只还停在细屑上。","You fill in the time. As you close the notebook, one animal is still resting on the scraps.","最後の欄に時刻を入れた。帳面を閉じる時、一匹はまだ屑の上に留まっていた。"]},
    ]
   },
  ]
 },
]);

export const FRESHWATER_MATERIAL_ENDINGS=Object.freeze([
 {
  id:"care",
  title:["脚下的几页","Pages Underfoot","足もとの数ページ"],
  body:["你的几页记录里，停留的位置比叶片的轮廓更清楚。起初在叶下消失的路线，后来从碎片之间穿过。最后那层细泥上还有足迹，你没有逐一给它们补上来处。","In your notes, the resting places are clearer than the outline of the leaf. Routes that first vanished beneath it later passed between its fragments. There are tracks on the final layer of silt; you have not supplied an origin for each one.","記録の数ページでは、葉の輪郭より留まった場所がはっきりしている。初めは葉の下に消えた経路が、後には破片の間を通った。最後の薄い泥にも足跡があり、一つずつ由来を書き足すことはしなかった。"],
  line:["叶片的名字在上一页，步足落在这一页。","The leaf’s name is on the previous page. The feet land on this one.","葉の名は前のページに、脚はこのページに。"],
 },
 {
  id:"calm",
  title:["两页之间","Between Two Pages","二つのページの間"],
  body:["有几次，你追着残片写；另几次，笔停在经过它的身体旁。两种记录用了同样的日期，没有完全对齐。翻页时，一小段路线仍落在装订线附近。","Sometimes you wrote after a fragment; sometimes your pen stayed beside a body passing it. The entries share dates without quite lining up. As you turn the page, a short stretch of route remains near the binding.","残片を追って書いた時も、そこを通る身体のそばで筆を止めた時もあった。同じ日付の記録は、ぴたりとは重ならない。ページをめくると、短い経路が綴じ目の近くに残っている。"],
  line:["本子摊平以后，那里仍有一道窄缝。","Even with the notebook laid flat, a narrow gap remains.","帳面を平らに開いても、細い隙間が残る。"],
 },
 {
  id:"trace",
  title:["沿用的编号","The Number Kept","使い続けた番号"],
  body:["你把旧图留着，几次用同一个编号找到新的残片。后来有些线没能接上，你也留下了断处。最后一页，编号仍然清楚，所指的地方混着细泥。","You kept the old sketch, using the same number to find new remnants. Later, some lines would not join; you kept the breaks too. On the last page the number is still clear. The place it points to is mixed with silt.","古い図を残し、同じ番号で新しい残片を幾度か見つけた。後にはつながらない線もあり、その切れ目も残した。最後のページでも番号は明瞭で、指す場所には細泥が混じっている。"],
  line:["编号还在页首。它指向的地方已经铺平。","The number is still at the top of the page. The place it points to has settled flat.","番号はまだページの上にある。指していた場所は、もう平らに落ち着いている。"],
 },
]);
