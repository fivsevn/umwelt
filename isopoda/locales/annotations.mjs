import {encodeIsopodText} from './isopod.mjs';

const copy={
  giganteus:{
    zh:['两次移动之间隔了很久。','第一处和第二处都被记下，中间的部分却只留下了一段时间。'],
    en:['A long time passed between the two movements.','The first position and the second were both recorded. Between them, only a stretch of time remained.'],
    ja:['二度の動きのあいだに、長い時間が流れた。','最初の場所も次の場所も記録された。そのあいだには、ただ時間だけが残った。']
  },
  naylori:{zh: ["触角伸得很远，身体还留在原处。", "我们习惯把一个地方的居民，算到身体为止。"], en: ["The antennae reach far while the body stays put.", "We tend to count a place’s residents only as far as their bodies extend."], ja: ["触角は遠くへ伸び、身体は同じ場所にある。", "私たちは場所の住人を、身体のところまでで数えがちだ。"]},
  chiltoni:{zh: ["它埋进去以后，一片沙又可以被叫作空地。", "这个称呼很方便，只需要不往下看。"], en: ["Once it burrows, a patch of sand can be called vacant again.", "A convenient description, requiring only that nobody look underneath."], ja: ["潜ってしまうと、その砂はまた空き地と呼べる。", "便利な呼び方だ。下を見なければよい。"]},
  hirsuta:{
    zh:["藤壶之间露出一个小小的背面。潮水退下去，那里仍偶尔动一下。", "岸线画在它的下方。这一处该记在水里，还是岸上，两个词暂时挤在页边。"],
    en:["A small back shows between barnacles. The tide falls; an occasional movement remains there.", "The shoreline is drawn below it. “Water” and “shore” wait together in the margin beside this place."],
    ja:["フジツボの間に小さな背がのぞく。潮が引いても、そこでは時折動きがある。", "岸線はその下に引かれる。「水中」と「岸辺」が、この場所の傍らでひとまず余白に並ぶ。"]
  },
  albifrons:{
    zh:["石边有一点灰影。放大以后，几条细足才从石纹里分出来。", "页上的轮廓占了很大一块。标记原来位置的小点，几乎被铅笔盖住。"],
    en:["A grey fleck rests beside the stone. Under magnification, fine legs separate from the grain.", "The outline occupies much of the page. The dot marking its original position is almost covered by the pencil."],
    ja:["石の縁に灰色の点がある。拡大すると、細い脚が石目から分かれて見える。", "紙の輪郭は大きな場所を取る。元の位置を示す小さな点は、鉛筆にほとんど隠れている。"]
  },
  valdensis:{
    zh:["它停下的那块石面，在你的图里没有名字。", "你给停顿画了一个点。再抬头时，身体已不在点上。"],
    en:["The stone where it pauses has no name on your map.", "You mark the pause with a dot. When you look up, the body is no longer on it."],
    ja:["立ち止まった石面には、あなたの地図では名前がない。", "停止を点で記す。顔を上げると、身体はもう点の上にいない。"]
  },
  dairy:{
    en:['It wears a cow pattern, yet has never seen a pasture.','Humans gave it a name; beneath the leaf litter, it goes on becoming something else.'],
    ja:['「牛柄」をまとっているのに、草原を見たことはない。','人間が名前を与えても、落ち葉の下では別の何かとして黙々と生きている。']
  },
  cappuccino:{
    en:['Coffee brown and cream meet on its back in just the right proportions.','As for what it really is, taxonomists have not finished this cup yet.'],
    ja:['背中では、コーヒー色とクリーム色がちょうどよく混ざっている。','では、これはいったい何者なのか。分類学者はまだこの一杯を飲み終えていない。']
  },
  diablo:{
    en:['Red, yellow, and black look so solemn that it seems ready to destroy the world.','In fact, it only crossed a piece of rotting leaf, and offered no explanation.'],
    ja:['赤、黄、黒があまりに仰々しく並ぶので、本当に世界を滅ぼしそうに見える。','実際には、腐葉を一枚通り過ぎただけで、何の説明もしない。']
  },
  echinatus:{
    en:['Its shell looks as though it had been built into a suit of armor.','Perhaps danger never arrived, but defense existed before the reason.'],
    ja:['甲殻は、まるで一揃いの鎧のようだ。','危険は一度も来なかったのかもしれない。それでも防御は理由より先にある。']
  },
  pink:{
    en:['Humans cannot agree on exactly which shade of pink it is, so they keep naming the pink.','It did not take part in the discussion.'],
    ja:['人間には、それがどの「ピンク」なのか判別しきれない。だからピンクにまた名前を足す。','本人はその議論に参加していない。']
  },
  coros:{
    en:['Its body is broad as a map, yet its name comes from a single point on one.','A place defines it; at least outside the human box.'],
    ja:['身体は地図のように幅広いのに、名前は地図上の一点から来ている。','場所がそれを定義する。少なくとも、人間の箱の外では。']
  },
  bolivari:{
    en:['It is called the “Spanish Princess,” perhaps because yellow enters history more easily than soil.','The soil has no opinion on the matter.'],
    ja:['「スペインの姫」と呼ばれるのは、たぶん土より黄色のほうが歴史に入りやすいからだ。','土はそれについて何も言わない。']
  },
  ducky:{
    en:['Its face reminded people of a duck, so it became a Ducky.','One fate of the observed is to resemble something the observer already knows.'],
    ja:['顔がアヒルを思わせたので、Duckyになった。','観察されるものの運命の一つは、観察者がすでに知っている何かに似て見えることだ。']
  },
  daxin:{
    en:['Three colors divide its body into three parts, and humans feel they understand it better for that.','Every day, all three move in the same direction.'],
    ja:['三つの色が身体を三つに分けるので、人間には分かった気になりやすい。','けれど三色は、毎日いっしょに同じ方向へ進む。']
  },
  ember:{
    en:['It looks like fire, and also like a bee.','Once two metaphors are stacked together, the actual animal becomes strangely quiet.'],
    ja:['火にも見えるし、蜂にも見える。','二つの比喩を重ねると、実際の動物はかえって静かになる。']
  },
  amber:{
    en:['When light falls on it, we call it amber.','When the light leaves, it is still there; the name temporarily loses its job.'],
    ja:['光が当たると、私たちはそれを「琥珀」と呼ぶ。','光が去っても、それはそこにいる。名前だけがしばらく仕事を失う。']
  },
  vex:{
    en:['It looks like a piece of armor left behind from a very long time ago.','“Ancient” often means only that we do not know which age to place the unfamiliar in.'],
    ja:['ずっと昔から残っている鎧の欠片のように見える。','「古い」という言葉は、見慣れないものをどの時代に置けばいいか分からない、というだけのことも多い。']
  },
  orange:{
    en:['The orange came later, selected and kept.','Nature produces differences; humans preserve one of them, then solemnly put it in quotation marks.'],
    ja:['橙色は、あとから選ばれて残された。','自然が差異を生み、人間がその一つを残し、丁寧に引用符まで付ける。']
  },
  maculatum:{
    en:['Stripes make a very small animal easy to recognize.','Recognition does not make it care about you any more.'],
    ja:['縞模様は、小さな動物をとても見分けやすくする。','見分けられたからといって、それがあなたを気にするわけではない。']
  },
  klugii:{
    en:['Three rows of bright spots look carefully arranged.','The arrangement belongs to the body; the meaning comes from the person looking at it.'],
    ja:['三列の明るい点は、きちんと並べられたように見える。','並びは身体のもの。意味を与えるのは、それを見る人だ。']
  },
  gestroi:{
    en:['Yellow makes it leap out from the leaf litter.','It did not leap; your vision simply arrived there first.'],
    ja:['黄色のせいで、落ち葉の中から飛び出して見える。','飛び出したのではない。あなたの視線が先にそこへ着いただけだ。']
  },
  versicolor:{
    en:['Its name says that color changes.','What becomes fixed is our desire to put change into a box.'],
    ja:['名前は「色が変わる」と言っている。','固定されるのはむしろ、変化を一つの欄に書き込みたい私たちのほうだ。']
  },
  hoffmannseggii:{
    en:['The body is long, and the uropods push the point of ending a little farther back.','A boundary is not where the body stops; it is where you decide to begin measuring.'],
    ja:['細長い身体のさらに後ろへ、尾肢が「終わり」を少し押し延ばしている。','境界は身体が止まる場所ではなく、どこから測り始めるかをあなたが決めた場所だ。']
  },
  nasatum:{
    en:['The little projection at the front of the head is what you remember first.','One character can help identify it, but it is never the whole animal.'],
    ja:['いちばん先に覚えるのは、頭の前にある小さな突起だ。','一つの特徴は識別の助けになる。でも、それが動物の全部ではない。']
  },
  granulatum:{
    en:['The dorsal surface is rough enough for even pixels to cast shadows.','Magnification did not create the granules; it only made you willing to notice them.'],
    ja:['背甲は、ピクセルにも影を落とさせるほど粗い。','拡大したから粒が生まれたのではない。ようやくあなたが見る気になっただけだ。']
  },
  expansus:{
    en:['Pale markings divide a flat body into several easy-to-remember regions.','Only after remembering the pattern do you begin to notice how wide it is.'],
    ja:['淡い模様が、平たい身体をいくつかの覚えやすい区画に分ける。','模様を覚えてから、ようやくその幅広さに気づく。']
  },
  haasi:{
    en:['Yellow is conspicuous, so it quickly acquired an image that travels easily.','An image can be selected; the species name still points to another history.'],
    ja:['黄色はよく目立つ。だから、流通しやすい「イメージ」がすぐにできあがった。','イメージは選べる。それでも種名は、別の歴史を指している。']
  },
  officinalis:{
    en:['It can close its body into a ball, and it can send vibrations into the ground.','You see the outline; some other information never enters the picture.'],
    ja:['身体を球に閉じることも、振動を地面へ送ることもできる。','あなたに見えるのは輪郭だ。画面に入ってこない情報もある。']
  },
  vulgare:{
    en:['Even the commonest roller has its own head shape.','Common only means you are more likely to meet it, not that it is simpler.'],
    ja:['いちばんありふれた「丸くなる者」にも、その種だけの頭部輪郭がある。','普通であることは、出会いやすいというだけで、単純だという意味ではない。']
  },
  asellus:{
    en:['Smooth and broad, it looks like a piece of old metal that learned to move.','Juveniles and adults do not share the same first impression.'],
    ja:['滑らかで幅広く平たい身体は、動く古い金属片のように見える。','幼体と成体では、最初に受ける印象さえ同じではない。']
  },
  muscorum:{
    en:['The abdomen narrows abruptly, like a step cut into the outline.','It runs quickly; identifying it requires you to stop first.'],
    ja:['腹部が急に細くなり、輪郭に一段の段差ができたように見える。','走るのは速い。見分けるには、まずこちらが立ち止まる必要がある。']
  },
  rathkii:{
    en:['Three pale bands make it look more orderly than it really is.','Some of the most reliable characters are hidden on the underside you cannot see from here.'],
    ja:['三本の淡い帯が、実際以上に整った姿に見せる。','本当に頼れる識別点のいくつかは、いま見えていない腹面に隠れている。']
  },
  reaumuri:{
    en:['The tubercles on the front half are not decoration; they belong to the mechanics of guarding a burrow.','A family turns the burrow entrance into a boundary, and the body into a door.'],
    ja:['前半身のこぶは装飾ではない。巣穴を守るための力学の一部だ。','一つの家族が巣穴の入口を境界にし、身体を扉にする。']
  },
  pictum:{
    en:['Yellow, green, and reddish brown all appear on a black ground.','Color makes it visible first; size reminds you that it is still small.'],
    ja:['黒い地に、黄、緑、赤褐色が同時に現れる。','色が先に目を引き、大きさが「それでも小さい」と思い出させる。']
  },
  pulchellum:{
    en:['Yellow, chestnut, and orange are packed into a body only five millimeters long.','Even when it rolls up, it does not shut the world out completely.'],
    ja:['わずか五ミリの身体に、黄、栗色、橙色が詰め込まれている。','丸くなっても、世界を完全には締め出さない。']
  },
  werneri:{
    en:['Regular spots are easy to mistake for deliberate design.','Captive orange lines exist, but this specimen shows the wild type first.'],
    ja:['規則正しい斑点は、人工的に設計されたように見えやすい。','人工のオレンジ系統もあるが、ここではまず野生型を描く。']
  },
  spinicornis:{
    en:['The yellow is not scattered at random; it traces a direction along the dark midline.','It looks as though someone painted it. Its English common name simply says so: Painted Woodlouse.'],
    ja:['黄色は背中に無造作に散っているのではなく、暗い正中線に沿って方向を描いている。','まるで彩色されたように見える。そのため英名は、そのまま Painted Woodlouse と呼ばれる。']
  },
  magnificus:{
    en:['Its orange color needs no captive line to explain it.','Size, long uropods, and color together push its outline in front of the background.'],
    ja:['この橙色は、飼育系統で説明する必要がない。','大きさ、長い尾肢、色が重なって、輪郭を背景の手前へ押し出す。']
  },
  uniramea:{
    en:['Halacarsantia uniramea is a marine isopod less than a millimetre long.','Its broad rounded frontal lobe, prominent lateral plates, and uniramous uropods define the reference model used here.'],
    ja:['Halacarsantia uniramea は体長1ミリ未満の小型の海生等脚類。','幅広く丸い頭部前縁、目立つ側板、単枝の尾肢を現在の参照モデルの主要形質としている。']
  },
  aquaticus:{
    en:['Water softens the leaf litter; the body passes between submerged wood and plants. We call the place freshwater, while it encounters resistance, cover, and gaps.','A specimen case asks for one name. The water does not stop for it. Classification and flow meet only briefly on this page.'],
    ja:['水は腐葉の縁を柔らかくし、身体は沈木と水草のあいだを通る。私たちはここを「淡水」と呼ぶが、身体が出会うのは抵抗と遮蔽と隙間だ。','標本箱は一つの名前を求める。水はそのために止まらない。分類と流れは、この一頁で短く出会うだけだ。']
  },
  meridianus:{
    en:['Plants, stones, and submerged wood divide one body of water into many scales. We call it habitat; for a small body it may only be the question of where the next step can land.','Flow differs among plants, stones, and submerged wood, and animals move along the slower surfaces and gaps.'],
    ja:['水草、石、沈木は同じ水域をいくつもの尺度に分ける。私たちはそれを環境と呼ぶが、小さな身体には次の一歩を置けるかどうかかもしれない。','水草、石、沈木のあいだでは流れの速さが異なり、個体は比較的緩い面や隙間に沿って移動する。']
  },
  coxalis:{
    en:['Sediments in shallow water do not keep tidy borders. The name was written later; the body crossed the mixed grains first.','Sand, mud, and debris on the shallow bottom are continually rearranged, and animal routes change with them.'],
    ja:['浅水の堆積物に整然とした境界はない。名前はあとから書かれ、身体は先に混じり合う粒を通った。','浅い底では砂、泥、破片が絶えず並び替わり、個体の経路もそれに合わせて変わる。']
  },
  serratum:{
    zh:["石沿下的轮廓收成一团，过了一会儿，又慢慢展开。", "同一栏里留下了两种形状。名字写在上方，空白还够放下下一次变化。"],
    en:["Below the ledge, an outline gathers into a ball. After a while, it slowly opens again.", "Two shapes remain in the same column. The name sits above them, with room left for another change."],
    ja:["岩縁の下で輪郭が丸くまとまり、しばらくして、またゆっくり開く。", "同じ欄に二つの形が残る。名前はその上にあり、次の変化を書き足す余白もある。"]
  },
  pelagica:{
    zh:["一阵水过去，步足还扣在原来的地方。落在纸上的那条短线，看起来像一次停留。", "线旁添了一个时间。那段持续抓附的间隙，没有单独的一栏。"],
    en:["A wash of water passes. The legs still grip the same place. The short line on paper looks like a pause.", "A time is added beside the line. The interval spent holding on has no column of its own."],
    ja:["ひと流れの水が過ぎても、脚は同じ場所をつかんでいる。紙に引いた短い線は、ひと休みに見える。", "線のそばに時刻を添える。つかまり続けた間のための欄は、別にはない。"]
  },
  granulosa:{
    zh:["藻叶翻过来，刚才清楚的背纹藏进了折面。笔记停在那一笔，水还在把叶子翻向另一边。", "页边写着「仍在原处」。藻枝又摆了一次，这几个字便有些迟疑。"],
    en:["A frond turns over, folding the clear markings out of sight. The pencil stops at that stroke; water keeps turning the frond.", "The margin says “still in the same place.” The weed sways once more, and the words seem less certain."],
    ja:["藻葉が裏返り、見えていた背の模様が折り目に隠れる。鉛筆はそこで止まり、水はまだ葉を返している。", "余白に「同じ場所にいる」とある。藻がもう一度揺れ、その言葉が少しためらう。"]
  },
  balthica:{
    en:['A seaweed bed looks like background until a body uses seaweed as food and a place to pass through. Records separate functions; underwater there is no table.','When it leaves one frond its position changes. The word specimen asks it to remain somewhere forever.'],
    ja:['藻場は背景に見える。海藻が食物であり通過する場所でもあると、一つの身体が示すまでは。記録は機能を分けるが、水中に表はない。','一枚の藻葉を離れれば位置は変わる。それでも「標本」という語は、どこかに永遠に留まることを求める。']
  },
  emarginata:{
    en:['Detached algae gather into a dwelling with no foundation. We still ask where it lives, as though a place must stay fixed.','A frond can leave the rock and still become habitat. Sometimes drifting is another way of dwelling.'],
    ja:['ちぎれた藻体が集まり、地基のない居場所になる。私たちはなお「どこに住むのか」と問う。場所は固定されるべきだと思うからだ。','藻葉は岩を離れても環境になり得る。漂流が、別の住み方であることもある。']
  },
  neglecta:{
    en:['Gaps among algae change with the water. Two seconds that look alike are not the same place to a millimetre-scale body.','It lives among submerged algae and detached algal material, where shelter itself shifts with the current.'],
    ja:['藻の隙間は水流とともに変わる。同じに見える二秒間も、ミリメートル尺度の身体には同じ場所ではない。','水中の藻場やちぎれた藻体の間で活動し、その隠れ場所自体も流れとともに動く。']
  },
  hilgendorfii:{
    en:['Rivers, lakes, ponds, and ditches are map categories; once leaves enter the water, decomposition works along finer boundaries.','Leaf litter and organic debris collect on the bottom, and animals often move along these deposits and plant edges.'],
    ja:['河川、湖、池、溝は地図上の分類にすぎない。落葉が水に入ると、分解者はもっと細かな境界に沿って働く。','腐葉や有機物は水底に集まり、個体はその堆積物や水草の縁に沿って活動する。']
  },
  ischiosetosa:{
    zh:["石头抬起的一瞬，阴影里的身体显了出来。页上多了一处位置，原来的阴影却已经变了。", "「发现于石下」写得很短。那只抬起石头的手，留在句子外面。"],
    en:["As the stone is lifted, a body appears in its shade. A position is added to the page; the original shade has already changed.", "“Found beneath a stone” takes little space. The hand that lifted it remains outside the sentence."],
    ja:["石を持ち上げた瞬間、陰の身体が現れる。紙に位置が一つ増え、その陰はすでに変わっている。", "「石の下で発見」と短く書く。石を持ち上げた手は、文の外に残る。"]
  },
  bidentata:{
    zh:["壳口朝着水，里面只露出半截轮廓。", "「空」字写下之后，触角从壳口伸了出来。前一行没有擦去。"],
    en:["The shell opening faces the water. Only part of an outline shows inside.", "After “empty” is written, antennae reach from the opening. The previous line is left unerased."],
    ja:["殻の口が水に向き、内側に輪郭の半分だけが見える。", "「空」と書いたあと、殻口から触角が出てくる。前の行は消さずに残す。"]
  },
  linearis:{
    en:['When its long body clings to fine algae or eelgrass, the outline nearly becomes part of the plant.','Forty millimetres is a reported maximum, not a standard size for every individual.'],
    ja:['細長い身体が細い藻やアマモに沿うと、輪郭はほとんど植物の一部になる。','四十ミリは記録された最大値であり、すべての個体の標準サイズではない。']
  },
  maculosa:{
    en:['Long antennae cross the front boundary of the body, and long uropods extend it again behind. Measurement always begins by choosing where a boundary starts.','Sponges, bryozoans, and kelp holdfasts are not decoration; together they determine where a body can remain.'],
    ja:['長い触角は身体の前方境界を越え、長い尾肢は後方へさらに延ばす。測定はいつも境界をどこに置くか決めることから始まる。','海綿、コケムシ、コンブの付着器は背景装飾ではなく、どこに留まれるかを決める環境そのものだ。']
  },
  hookeri:{
    en:['An estuary has no stable salinity line. Tide, runoff, and mud repeatedly mix what we call sea water and fresh water.','Its body is short and broad and can roll inward; it occurs in upper estuaries, channels, beneath stones, and on muddy bottoms.'],
    ja:['河口に安定した塩分線はない。潮汐、流入水、泥底が「海水」と「淡水」を繰り返し混ぜる。','身体は短く幅広く、巻き込むことができる。上流側の河口、水路、石の下、泥底などに見られる。']
  },
  rugicauda:{
    en:['Salt-marsh pools, seaweed, driftwood, and mud banks can all shelter the same species. An environment is not a single material.','Small tubercles on the pleotelson and the posterior body outline are among its more visible external features.'],
    ja:['塩性湿地の池、海藻、流木、泥壁のすべてが同じ種の隠れ場所になり得る。環境は一種類の材質ではない。','尾節の小さな瘤と後体部の輪郭は、比較的目立つ外形特徴の一つ。']
  },
  chelipes:{
    en:['Algae, mudflats, salt-marsh pools, and estuary stones are linked by the same brackish gradient.','Colour varies. Antennae, coxal plates, and pleotelson shape remain more reliable than colour.'],
    ja:['藻、泥干潟、塩性湿地の池、河口の石は、同じ汽水勾配でつながっている。','色は変化する。識別では色より触角、側板、尾節形態のほうが信頼できる。']
  },
  carinata:{
    en:['Mud has no obvious corridors, yet a narrow body turns sediment into traversable space.','It tolerates a broad low-salinity range and is especially associated with muddy estuarine bottoms.'],
    ja:['泥には明瞭な通路がない。それでも細長い身体は堆積物を通過できる空間へ変える。','幅広い低塩分域に生息でき、とくに泥質の河口底でよく見られる。']
  },
  pulchra:{zh: ["背上的斑点让它很容易被认出来，直到它钻进沙里。", "辨认是一种只在见面时有效的关系。"], en: ["The spots make it easy to recognise, until it enters the sand.", "Recognition is a relationship that works only while you can meet."], ja: ["背の斑点で見分けやすい。砂に潜るまでは。", "見分けるという関係は、顔を合わせている間だけ成り立つ。"]},
  affinis:{zh: ["它和旁边那只很像，于是你先给它们用了同一个名字。", "相似替观察节省了时间，未必替它们省下了什么。"], en: ["It resembles the one beside it, so you first give them the same name.", "Resemblance saves the observer time. It may save the animals nothing."], ja: ["隣の個体に似ているので、ひとまず同じ名前で呼んだ。", "似ていることは観察の時間を省く。彼らに何か省けたかは分からない。"]},
  spinigera:{zh: ["后端的几处尖角，让一个小小的背面看起来有了立场。", "它转过身，立场也跟着转了。"], en: ["A few sharp corners at the rear make a small back look as if it has taken a position.", "It turns around. The position turns with it."], ja: ["後ろの尖った角で、小さな背にも立場があるように見える。", "身体が向きを変えると、立場も一緒に変わった。"]},
  cavaticus:{
    zh:["光照到这里以前，这里并不缺少一个世界。", "你在纸上留下它的轮廓，轮廓之外，水还在慢慢经过。"],
    en:["Before the light arrived, no world was missing here.", "You leave its outline on paper. Outside the outline, water continues to pass."],
    ja:["光が届く前から、ここには世界があった。", "紙に輪郭を残す。その外では、水がまだゆっくり通っている。"]
  },
  lusitanicus:{
    zh:["它的前端在暗处轻轻探动。你把迟疑写进笔记，却不知道迟疑属于谁。", "有些距离，纸上的刻度走不过去。"],
    en:["Its front end probes the dark. You write down hesitation, unsure whose hesitation it is.", "Some distances cannot be crossed by the scale on a page."],
    ja:["前端が暗がりをそっと探る。ためらいと書く。それが誰のものかは分からない。", "紙の目盛りでは渡れない距離がある。"]
  },
  virei:{
    zh:["那一点淡红没有在等谁看见。手电经过时，你才把它从石色里分出来。", "你写下「发现」。水没有因此多出一条路。"],
    en:["That faint pink was not waiting to be seen. Only as the torch passes do you separate it from the stone.", "You write “discovery.” The water gains no new passage."],
    ja:["淡い紅は、見つけられるのを待っていたわけではない。光が通り、ようやく石の色から分かれる。", "「発見」と書く。水の道は増えない。"]
  },
  pandaKing:{
    en:['Its name comes from the simplest contrast: black and white.','The taxonomic identity remains unsettled, but the pattern became a shared language among keepers first.'],
    ja:['名前は、もっとも単純な黒と白の対比から来ている。','分類上の正体は定まっていないのに、模様は先に飼育者たちの共通語になった。']
  },
  pinkPandaKing:{
    en:['Pink is not a new species here, only a color that people kept selecting.','The panda bands remain; black has faded into peach.'],
    ja:['ピンクは新しい種ではない。人が繰り返し残してきた色にすぎない。','パンダの帯は残り、黒だけが桃色へ薄れている。']
  },
  magicPotion:{
    en:['The scientific name has not changed. What changed are the spots keepers chose to preserve.','White, yellow, and black have been fixed into a “potion” that never flows.'],
    ja:['正式な学名は変わらない。変わったのは、飼育者が選び残した斑点のほうだ。','白、黄、黒は、流れることのない一本の「ポーション」に固定された。']
  },
  papaya:{
    en:['“Papaya” does not appear in its scientific name; keepers remembered the color as a fruit.','The pink-orange stays on a species that already has a formal name.'],
    ja:['学名に「パパイヤ」はない。飼育者がその色を果物として覚えただけだ。','すでに正式な名前を持つ種の上に、桃橙色だけが残った。']
  },
  whiteShark:{
    en:['There is a shark in the name, but it still lives among leaf litter and damp soil.','Trade names move faster than taxonomy, so the archive keeps the question mark for now.'],
    ja:['名前には「サメ」がいるが、それでも落ち葉と湿った土のあいだで暮らしている。','流通名は分類学より速い。だから資料庫には、まだクエスチョンマークを残しておく。']
  }
};

const labels={zh:'阿西莫夫的笔记',en:"Asimov's Notes",ja:'アシモフのノート',isopod:'o:'};

export function annotationLabel(lang='zh'){
  return labels[lang]||labels.zh;
}

export function localizedAnnotationLines(species,lang='zh',fallback=[]){
  if(lang==='zh')return copy[species?.id]?.zh||fallback;
  if(lang==='isopod'){const lines=copy[species?.id]?.zh||fallback;return lines.length?lines.map(encodeIsopodText):['o:  o?']}
  return copy[species?.id]?.[lang]||[];
}