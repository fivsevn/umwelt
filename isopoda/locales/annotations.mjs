import {encodeIsopodText} from './isopod.mjs';

const copy={
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
    en:['Plants, stones, and submerged wood divide one body of water into many scales. We call it habitat; for a small body it may only be the question of where the next step can land.','Separating similar outlines needs evidence finer than these pixels. What cannot be seen should not be promoted into certainty.'],
    ja:['水草、石、沈木は同じ水域をいくつもの尺度に分ける。私たちはそれを環境と呼ぶが、小さな身体には次の一歩を置けるかどうかかもしれない。','似た輪郭を分けるには、ピクセルより細かな証拠が要る。見えない部分を確定へ変えてはいけない。']
  },
  coxalis:{
    en:['Sediments in shallow water do not keep tidy borders. The name was written later; the body crossed the mixed grains first.','If a pixel cannot carry a diagnostic character, let it remain silent. Silence is part of the record too.'],
    ja:['浅水の堆積物に整然とした境界はない。名前はあとから書かれ、身体は先に混じり合う粒を通った。','一つのピクセルに識別形質を背負わせられないなら、黙らせておけばいい。沈黙も資料の一部だ。']
  },
  serratum:{
    en:['The tide returns a crevice to the sea and takes it back again. The boundary moves each day; the specimen frame asks it to stay still.','It can roll its body inward, briefly carrying a boundary onto itself. No specimen can answer where the next waterline will be.'],
    ja:['潮は岩の隙間を海へ返し、また引き取る。境界は毎日動くのに、標本枠は静止を求める。','身体を巻き込むことができる。その瞬間だけ境界を自分へ持ち帰るように見える。次の水位線を答えられる標本はない。']
  },
  pelagica:{
    en:['Barnacles, mussels, and short fucoids divide the rocky shore into surfaces that can be crossed. We call it exposure; the body meets attachments and gaps.','The pin fixes one direction. While alive, direction was never part of the specimen.'],
    ja:['フジツボ、イガイ、短い褐藻は岩岸を通過できる面へ分ける。私たちは「露出」と呼ぶが、身体が出会うのは付着物と隙間だ。','標本針は方向を固定する。生きている間、方向は標本の一部ではなかった。']
  },
  granulosa:{
    en:['Algal fronds move with the water, carrying the body among them into the same current. An image can keep an outline but cannot mount the force of the sea beside it.','We remember colour and dorsal shape. It does not need to be remembered to continue among the algae.'],
    ja:['藻葉は水とともに揺れ、その間の身体も同じ流れへ入る。画像は輪郭を残せても、海の力まで枠に収められない。','私たちは色と背面の形で覚える。それは覚えられなくても、藻の間で続いていく。']
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
    en:['Gaps among algae change with the water. Two seconds that look alike are not the same place to a millimetre-scale body.','When evidence runs thin, leaving “unknown” on the page is closer to observation than completing a beautiful certainty.'],
    ja:['藻の隙間は水流とともに変わる。同じに見える二秒間も、ミリメートル尺度の身体には同じ場所ではない。','資料が足りないとき、「不明」を頁に残すほうが、美しい確定を補うより観察に近い。']
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
  if(lang==='zh')return fallback;
  if(lang==='isopod')return fallback.length?fallback.map(encodeIsopodText):['o:  o?'];
  return copy[species?.id]?.[lang]||[];
}