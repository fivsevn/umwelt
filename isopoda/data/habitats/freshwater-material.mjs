// Five-stage freshwater material cycle. Each material stage contains two
// observational choices: first choose what relation to foreground, then choose
// how to continue the record. Neither choice controls decomposition itself.
export const FRESHWATER_MATERIAL_STAGES=Object.freeze([
 {
  id:'leaf',
  name:['观察 I · 叶片','Observation I · Leaf','観察 I · 葉'],
  steps:[
   {
    prompt:['一片叶子落在沉木旁。对你，它首先是一个有轮廓的东西；对水中的个体，它也可能同时是食物、屋顶和路线。你先看哪一种关系？','A leaf has settled beside the submerged wood. To you it is first a bounded thing; to an animal in the water it may also be food, roof, and route at once. Which relation do you watch first?','一枚の葉が沈木のそばに沈んでいる。あなたにはまず輪郭をもつ物だが、水中の個体には食べ物、屋根、経路が同時に重なりうる。まずどの関係を見る？'],
    options:[
     {id:'fw-leaf-edge',animation:'fw-edge',lens:'relation',label:['沿叶缘继续看','Follow the leaf edge','葉の縁を追う'],text:['个体沿叶缘停停走走。你记录的已经不只是“有一片叶子”，而是身体与一条可利用边界相遇的方式。','Animals pause and move along the edge. Your record is no longer merely “there is a leaf,” but how bodies meet a usable boundary.','個体は葉の縁で止まり、また進む。記録されるのは「葉がある」だけでなく、身体が利用できる境界と出会う仕方になる。']},
     {id:'fw-leaf-under',animation:'fw-under',lens:'relation',label:['看叶片下方','Watch beneath the leaf','葉の下を見る'],text:['一个轮廓进入叶片下方。对它来说，薄薄一层植物组织已经足以制造“里面”和“外面”。','One body moves beneath the leaf. For it, a thin layer of plant tissue is enough to produce an inside and an outside.','一つの輪郭が葉の下へ入る。薄い植物組織だけで、その身体には「内」と「外」が生まれる。']}
    ]
   },
   {
    prompt:['同一片叶子没有改变名字，但你已经看见了两种不同的世界。第二笔记录，要跟着什么走？','The leaf has not changed its name, yet you have already seen two different worlds. What should the second line of the record follow?','同じ葉はまだ名前を変えていない。それでも二つの異なる世界が見え始めた。二本目の記録は何を追う？'],
    after:{
     'fw-leaf-edge':['你先看了叶缘。现在，边界已经不是地图上的线，而是一段被身体反复试探的表面。第二笔记录，要跟着什么走？','You watched the edge first. The boundary is no longer a line on a map but a surface repeatedly tested by bodies. What should the second line follow?','最初に葉の縁を見た。境界は地図上の線ではなく、身体が繰り返し確かめる表面になった。二本目の記録は何を追う？'],
     'fw-leaf-under':['你先看了叶片下方。所谓“遮蔽”没有写在叶子上，它只在身体、光和表面之间成立。第二笔记录，要跟着什么走？','You watched beneath the leaf first. “Shelter” is not written on the leaf; it exists only between body, light, and surface. What should the second line follow?','最初に葉の下を見た。「隠れ場所」は葉に書かれているのではなく、身体、光、表面の間で成立する。二本目の記録は何を追う？']
    },
    options:[
     {id:'fw-leaf-route',animation:'fw-route',lens:'relation',label:['跟着个体的路线','Follow the animal’s route','個体の経路を追う'],text:['你让“叶子”退到背景，把经过、停留和转向写在前面。环境开始像一组动作，而不是一张物件清单。','You let “leaf” recede and put passage, pause, and turning in the foreground. The environment begins to look like a set of actions rather than an inventory of things.','「葉」を背景へ退け、通過、停止、方向転換を前に置く。環境は物の一覧ではなく、動作の組として見え始める。']},
     {id:'fw-leaf-mark',animation:'fw-mark-leaf',lens:'object',label:['固定叶片的位置','Fix the leaf’s position','葉の位置を固定する'],text:['你在沉木旁留下一个点。点很稳定；身体与叶片的关系却继续移动。地图保存了对象，却没有保存它被怎样使用。','You leave a point beside the wood. The point is stable while relations between bodies and leaf keep moving. The map preserves the object, not how it is used.','沈木のそばに一点を残す。点は安定しているが、身体と葉の関係は動き続ける。地図は物を保存しても、その使われ方までは保存しない。']}
    ]
   }
  ]
 },
 {
  id:'conditioned',
  name:['观察 II · 被加工的叶片','Observation II · Conditioned leaf','観察 II · 加工された葉'],
  steps:[
   {
    prompt:['下一次观察，叶面已经变暗，边缘更软，细小的附着物覆盖着原来的表面。昨天那片“叶子”还在，但它的可利用性已经不是昨天的样子。你先看哪里？','At the next observation the surface is darker, the edge softer, and fine growth covers what was exposed. Yesterday’s “leaf” is still here, but its usability is no longer yesterday’s. Where do you look first?','次の観察では葉面が暗くなり、縁は柔らかく、細かな付着物が以前の表面を覆っている。昨日の「葉」はまだあるが、利用されうる仕方はもう昨日と同じではない。まずどこを見る？'],
    options:[
     {id:'fw-conditioned-surface',animation:'fw-surface',lens:'relation',label:['看停留变长的表面','Watch the surface where stays lengthen','滞在が長くなる表面を見る'],text:['个体在深色表面停留更久。所谓“食物”开始不像一种材料，更像某种经过加工后才成立的关系。','Animals remain longer on the darkened surface. “Food” begins to look less like a material and more like a relation made possible after conditioning.','個体は暗くなった表面により長く留まる。「食べ物」は材料そのものというより、加工を経て成立する関係に見えてくる。']},
     {id:'fw-conditioned-gap',animation:'fw-gap',lens:'relation',label:['看软化后的间隙','Watch the softened gap','柔らかくなった隙間を見る'],text:['叶片贴得更低，原来的屋顶正在变形。遮蔽没有一个固定尺寸，它随着材料和身体一起变化。','The leaf lies lower and the old roof is changing shape. Shelter has no fixed size; it changes with material and body together.','葉は低く伏し、以前の屋根は形を変えている。遮蔽には固定した大きさがなく、材料と身体とともに変わる。']}
    ]
   },
   {
    prompt:['变化发生在叶片上，也发生在叶片与微生物、个体和水流之间。第二笔记录，你把变化写在哪里？','Change occurs on the leaf, but also between leaf, microbes, animals, and current. Where do you place the change in the second line of the record?','変化は葉の上で起こるが、葉、微生物、個体、水流のあいだでも起こる。二本目の記録では、変化をどこに置く？'],
    options:[
     {id:'fw-conditioned-name',animation:'fw-name-leaf',lens:'object',label:['仍记在“这片叶子”名下','Keep it under “this leaf”','「この葉」の名の下に記す'],text:['你保留了对象的连续性：同一个名字容纳了颜色、质地和边缘的变化。名称像一个容器，比材料本身更稳定。','You preserve the continuity of the object: one name contains changes in colour, texture, and edge. The name behaves like a container, more stable than the material itself.','物の連続性を保つ。同じ名前が色、質感、縁の変化を収める。名前は容器のように、材料そのものより安定している。']},
     {id:'fw-conditioned-relation',animation:'fw-relate-surface',lens:'relation',label:['记在“个体—表面”之间','Record it between animal and surface','「個体—表面」の間に記す'],text:['你不再问叶子“本身”是什么，而记下谁停留、停多久、接触哪里。环境从名词变成了一组关系。','You stop asking what the leaf is “in itself” and record who stays, for how long, and where contact occurs. Environment shifts from nouns to relations.','葉が「それ自体で」何かを問うのをやめ、誰がどれだけ留まり、どこに触れるかを記す。環境は名詞から関係の組へ移る。']}
    ]
   }
  ]
 },
 {
  id:'fragmented',
  name:['观察 III · 被啃食与破碎','Observation III · Eaten and fragmented','観察 III · 摂食と破砕'],
  steps:[
   {
    prompt:['叶缘出现更大的缺口，叶脉露出来，碎片落在沉木与细泥之间。完整轮廓第一次不再可靠。你从哪里继续追？','Larger notches open, veins are exposed, and fragments lie between wood and silt. The whole outline is no longer reliable. Where do you continue from?','葉の縁の欠けが大きくなり、葉脈が露出し、破片が沈木と細泥の間に落ちる。完全な輪郭は初めて頼れなくなった。どこから追い続ける？'],
    options:[
     {id:'fw-fragment-main',animation:'fw-fragment',lens:'object',label:['跟着最大的残片','Follow the largest remnant','最大の残片を追う'],text:['你把最大的残片当作“原叶”的继承者。完整性已经丢失，但同一性仍被你暂时寄放在最大的部分上。','You treat the largest remnant as heir to the “original leaf.” Wholeness is gone, but identity is temporarily deposited in the largest part.','最大の残片を「元の葉」の後継として扱う。完全性は失われたが、同一性は一時的に最大の部分へ預けられる。']},
     {id:'fw-fragment-edges',animation:'fw-new-edges',lens:'relation',label:['看新出现的边缘与缝','Watch the new edges and gaps','新しい縁と隙間を見る'],text:['碎裂没有只制造损失。一个边缘变成许多边缘，一个屋顶变成几处小的背流面和缝隙。破坏也在生产新的可用结构。','Fragmentation does not only produce loss. One edge becomes many, one roof becomes several small lee surfaces and gaps. Destruction also produces usable structure.','破砕は損失だけを作らない。一つの縁が多くの縁に、一つの屋根が小さな流れの陰や隙間に分かれる。破壊は利用できる構造も作る。']}
    ]
   },
   {
    prompt:['纸上已经不能只画一个轮廓。第二笔记录，要把这些碎片重新合在一起，还是让它们各自成立？','The page can no longer hold a single outline. In the second line, do you join the fragments back together or let each one stand on its own?','紙にはもう一つの輪郭だけでは足りない。二本目の記録では、破片を再び一つにまとめるか、それぞれを成立させるか？'],
    options:[
     {id:'fw-fragment-link',animation:'fw-link-fragments',lens:'object',label:['仍把它们连成“一片叶子”','Keep linking them as “one leaf”','なお「一枚の葉」として結ぶ'],text:['你用来源维持同一性：只要它们来自同一片叶子，就仍属于同一个故事。分类在这里依赖历史，而不是现在的形状。','You maintain identity through origin: if the pieces came from one leaf, they remain part of one story. Classification now depends on history rather than present shape.','由来によって同一性を保つ。同じ葉から来たなら同じ物語に属する。分類は現在の形ではなく、履歴に依存する。']},
     {id:'fw-fragment-use',animation:'fw-use-fragments',lens:'relation',label:['分别看每块能做什么','See what each fragment can do','各破片が何を可能にするかを見る'],text:['你暂时放下来源，改看每块碎片能被啃食、抓附、躲藏或绕过的方式。对个体来说，“来自哪里”未必比“现在能做什么”更重要。','You set origin aside and watch how each piece can be eaten, gripped, hidden under, or passed around. For the animal, “where it came from” may matter less than “what it affords now.”','由来をいったん置き、各破片が食べられ、つかまれ、隠れ場となり、迂回される仕方を見る。個体には「どこから来たか」より「いま何を可能にするか」が重要かもしれない。']}
    ]
   }
  ]
 },
 {
  id:'suspended',
  name:['观察 IV · 悬浮碎屑','Observation IV · Suspended detritus','観察 IV · 浮遊する破片'],
  steps:[
   {
    prompt:['完整叶形已经很难辨认。一部分碎屑被水流带起，越过原来的位置；剩下的叶脉贴在底面。对象开始变成运动。你先跟什么？','The complete leaf shape is hard to recognize. Some debris is lifted past its former position while veins remain on the bottom. The object is becoming motion. What do you follow first?','完全な葉の形はもう分かりにくい。一部の破片は流れに持ち上げられ元の位置を越え、葉脈は底に残る。物は運動へ変わり始める。まず何を追う？'],
    options:[
     {id:'fw-suspended-drift',animation:'fw-drift',lens:'object',label:['追随漂移的碎屑','Follow drifting detritus','漂う破片を追う'],text:['你试着让视线跟住几块碎屑。它们不断离开旧坐标，同一性只能靠你的追踪暂时维持。','You try to keep several pieces in view. They keep leaving old coordinates, and identity is maintained only temporarily by your tracking.','いくつかの破片を視線で追う。古い座標を次々に離れ、同一性はあなたの追跡によって一時的に保たれるだけになる。']},
     {id:'fw-suspended-cling',animation:'fw-cling',lens:'relation',label:['观察个体抓住什么','Watch what the animals grip','個体が何につかまるかを見る'],text:['流动增强时，个体贴向水草、石面和较稳定的结构。此刻真正重要的不是“那片叶子在哪里”，而是什么表面还能被身体抓住。','As movement increases, animals press toward plants, stone, and stable structures. What matters now is not “where the leaf is,” but which surfaces can still be gripped.','流れが強まると、個体は水草、石面、安定した構造へ寄る。いま重要なのは「葉がどこにあるか」ではなく、どの表面を身体がつかめるかだ。']}
    ]
   },
   {
    prompt:['原来的位置几乎空了，碎屑却遍布别处。第二笔记录，你把它写成“同一个东西移动了”，还是“环境重新分配了材料”？','The old position is almost empty while debris appears elsewhere. In the second line, do you write “the same thing moved,” or “the environment redistributed material”?','元の位置はほとんど空き、破片は別の場所に広がる。二本目の記録では「同じ物が移動した」と書くか、「環境が材料を再配分した」と書くか？'],
    options:[
     {id:'fw-suspended-displacement',animation:'fw-track-displacement',lens:'object',label:['记成同一物的位移','Record the displacement of one thing','同じ物の移動として記す'],text:['你画出一条从旧位置到新位置的线。线把分散的碎屑重新串成一个对象，也暴露了“同一个”有多少依赖记录者的笔。','You draw a line from old position to new. The line strings scattered pieces back into one object, revealing how much “the same” depends on the recorder’s pen.','旧位置から新位置へ線を引く。線は散った破片を再び一つの物に結び、「同じもの」が記録者の筆にどれほど依存するかを露わにする。']},
     {id:'fw-suspended-redistribute',animation:'fw-redistribute',lens:'relation',label:['记成环境重新分配','Record environmental redistribution','環境による再配分として記す'],text:['你不再为碎屑寻找唯一的主体，而记录流速、抓附面和停积位置。材料失去中心以后，环境本身变成了叙事者。','You stop searching for a single subject behind the debris and record flow, grip surfaces, and settling points. Once material loses its centre, the environment itself becomes the narrator.','破片の背後に唯一の主体を探すのをやめ、流れ、つかめる面、沈積地点を記す。材料が中心を失うと、環境そのものが語り手になる。']}
    ]
   }
  ]
 },
 {
  id:'redeposited',
  name:['观察 V · 新的底面','Observation V · New bottom','観察 V · 新しい底面'],
  steps:[
   {
    prompt:['碎屑和细泥重新铺成新的底面，个体从上面经过。那片叶子已经无法单独指出，但它的一部分正在承托新的路线。最后一次观察，你先问什么？','Detritus and silt have formed a new bottom, and animals cross it. The leaf can no longer be pointed out separately, yet part of it now supports new routes. In the final observation, what do you ask first?','破片と細泥が新しい底面を作り、個体がその上を通る。葉だけを指し示すことはもうできないが、その一部はいま新しい経路を支えている。最後の観察で、まず何を問う？'],
    options:[
     {id:'fw-redeposited-origin',animation:'fw-origin',lens:'object',label:['追问它原来是什么','Ask what it used to be','それが元は何だったかを問う'],text:['你沿着来源逆推：底面里的这一小片，曾经属于一片有名字的叶子。物的传记仍能被重建，只是它已经不再等于眼前的形状。','You trace origin backward: this small part of the bottom once belonged to a named leaf. The biography of a thing can still be reconstructed, but it no longer equals the shape before you.','由来を逆にたどる。この底面の小さな部分は、かつて名前のある一枚の葉に属していた。物の伝記は再構成できるが、もう目の前の形とは一致しない。']},
     {id:'fw-redeposited-now',animation:'fw-cross-bed',lens:'relation',label:['看它现在让什么发生','Watch what it enables now','いま何を可能にするかを見る'],text:['个体直接从新的碎屑底面上经过。对它来说，这里首先不是“叶子的遗体”，而是一块可以行走、停留和抓附的现在。','Animals cross the new detrital bottom. For them this is first not “the remains of a leaf,” but a present surface for walking, pausing, and gripping.','個体は新しい破片底面をそのまま通る。そこはまず「葉の遺体」ではなく、歩き、止まり、つかまることのできる現在の表面だ。']}
    ]
   },
   {
    prompt:['你一直在追同一批物质，但“同一个东西”的边界已经越来越难指出。最后一笔，要在哪里停？','You have followed the same material, yet the boundary of “the same thing” has become harder to point to. Where does the final line stop?','同じ材料を追ってきたが、「同じもの」の境界はますます指しにくくなった。最後の一本はどこで止める？'],
    options:[
     {id:'fw-redeposited-boundary',animation:'fw-boundary',lens:'object',label:['在轮廓消失处画界线','Draw the boundary where the outline vanished','輪郭が消えた所に境界を引く'],text:['你把“叶子”的终点放在完整轮廓消失的地方。这是一条清楚、可复述的界线；但界线以后，材料仍继续参与别的关系。','You place the leaf’s endpoint where its whole outline vanished. It is a clear, repeatable boundary; beyond it, the material still participates in other relations.','「葉」の終点を完全な輪郭が消えた所に置く。それは明確で語り直せる境界だが、その先でも材料は別の関係に参加し続ける。']},
     {id:'fw-redeposited-route',animation:'fw-new-route',lens:'relation',label:['不画界线，继续看新的路线','Draw no boundary; follow the new route','境界を引かず、新しい経路を追う'],text:['你没有给“叶子”写一个死亡时刻。记录停在个体穿过新底面的路线，而物质继续成为环境。对象结束了没有，取决于你还在追哪一种关系。','You do not give the “leaf” a moment of death. The record stops on a route across the new bottom while matter continues becoming environment. Whether the object has ended depends on which relation you are still following.','「葉」に死の時刻を与えない。記録は新しい底面を通る経路で止まり、材料は環境になり続ける。物が終わったかどうかは、どの関係をまだ追っているかに依存する。']}
    ]
   }
  ]
 }
]);

export const FRESHWATER_MATERIAL_ENDINGS=Object.freeze([
 {
  id:'care',
  title:['关系的地形','A Terrain of Relations','関係の地形'],
  body:['你的记录更多地跟随身体、表面、抓附与路线。叶片从未只是一件物：完整时它制造边缘和阴影，破碎时制造缝隙，沉积后又成为新的地面。你记录的不是对象怎样消失，而是关系怎样换了载体。','Your record followed bodies, surfaces, grip, and routes more often. The leaf was never only a thing: intact it made edges and shade, fragmented it made gaps, and settled it became new ground. You recorded not how an object vanished, but how relations changed carriers.','記録は身体、表面、把持、経路をより多く追った。葉は最初から単なる物ではない。完全な時は縁と影を作り、砕けると隙間を作り、沈積すると新しい地面になる。記録したのは物の消失ではなく、関係が担い手を変える過程だった。'],
  line:['Umwelt 不是物的清单，而是一个身体能够进入的关系场。','An Umwelt is not an inventory of things, but a field of relations a body can enter.','Umwelt は物の一覧ではなく、身体が入りうる関係の場である。']
 },
 {
  id:'calm',
  title:['两种记录同时成立','Two Records at Once','二つの記録が同時に成り立つ'],
  body:['你一会儿追对象，一会儿追关系。于是同一段变化同时拥有两种叙述：一片叶子逐渐失去轮廓；一组可食、可藏、可抓、可走的关系不断重新组合。两种说法没有互相取消，只是在不同尺度上成立。','At times you followed the object, at times the relations. The same change therefore held two accounts at once: a leaf gradually lost its outline, while edible, sheltering, grippable, and walkable relations kept recombining. Neither account cancels the other; they operate at different scales.','物を追う時もあれば、関係を追う時もあった。そのため同じ変化に二つの記述が同時に成立した。一枚の葉は輪郭を失い、食べられる、隠れられる、つかめる、歩ける関係は組み替わり続けた。どちらも他方を消さず、異なる尺度で成立する。'],
  line:['“同じ环境”之所以不同，常常不是物不同，而是身体能与它发生的关系不同。','The “same environment” differs not only in its things, but in the relations a body can enter with them.','「同じ環境」が異なるのは、物が違うからだけでなく、身体が結べる関係が違うからでもある。']
 },
 {
  id:'trace',
  title:['物的传记','The Biography of a Thing','物の伝記'],
  body:['你的记录更多地维持对象的连续性：位置、来源、轮廓和名字把碎片重新串回“那片叶子”。这条传记并不虚假，但它提醒你：一个对象能够持续多久，也取决于观察者用什么标准把变化前后的材料称作同一个东西。','Your record more often maintained continuity of the object: position, origin, outline, and name threaded fragments back into “that leaf.” The biography is not false, but it shows that how long an object persists also depends on the observer’s criteria for calling changing material the same thing.','記録はより多く物の連続性を保った。位置、由来、輪郭、名前が破片を「あの葉」へ結び戻した。その伝記は誤りではないが、物がどこまで続くかは、変化前後の材料を同じものと呼ぶ観察者の基準にも依存する。'],
  line:['你记录的是叶子的连续性；个体经历的却未必以“叶子”为单位。','You recorded the continuity of a leaf; the animal’s experience need not use “leaf” as its unit.','あなたは葉の連続性を記録したが、個体の経験が「葉」を単位にするとは限らない。']
 }
]);
