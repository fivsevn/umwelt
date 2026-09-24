// Five-stage freshwater material cycle.
// Copy stays language-neutral in state: runtime resolves these rows through aquaticText().
export const FRESHWATER_MATERIAL_STAGES=Object.freeze([
 {
  id:'leaf',
  name:['观察 I · 叶片','Observation I · Leaf','観察 I · 葉'],
  prompt:['一片叶子落在沉木旁。个体沿着叶缘停下来。对你来说，它还是一片完整的叶子。','A leaf has settled beside the submerged wood. An animal pauses along its edge. To you, it is still one intact leaf.','一枚の葉が沈木のそばに沈んでいる。個体は葉の縁で止まる。あなたには、まだ一枚の完全な葉に見える。'],
  after:{},
  options:[
   {id:'material-food',label:['把它当作食物','Treat it as food','食べ物として見る'],text:['你开始注意叶缘和口器接触的位置。叶片没有因为这个分类立刻改变。','You begin to watch the leaf edge and where mouthparts meet it. The leaf does not change immediately because of that category.','葉の縁と口器が触れる場所を見るようになる。その分類だけで葉がすぐ変わるわけではない。']},
   {id:'material-shelter',label:['把它当作遮蔽物','Treat it as shelter','隠れ場所として見る'],text:['你开始注意叶片下面的阴影，以及个体从哪一侧进入。','You begin to watch the shade beneath the leaf and the side from which animals enter.','葉の下の影と、個体がどちら側から入るかを見るようになる。']},
   {id:'material-record',label:['只记录它的位置','Record only its position','位置だけを記す'],text:['你在沉木旁留下一个位置点。暂时不写它能做什么。','You mark one position beside the wood and leave its possible functions unwritten.','沈木のそばに位置だけを記し、何に使われるかはまだ書かない。']}
  ]
 },
 {
  id:'conditioned',
  name:['观察 II · 被加工的叶片','Observation II · Conditioned leaf','観察 II · 加工された葉'],
  prompt:['下一次观察，叶面已经变暗，边缘也更软。细小的附着物覆盖在原来的表面上。个体停留得比上一次更久。','At the next observation the leaf surface is darker and its edge softer. Fine growth covers what used to be the exposed surface. Animals remain there longer than before.','次の観察では葉面が暗くなり、縁も柔らかい。細かな付着物が以前の表面を覆い、個体は前より長く留まる。'],
  after:{
   'material-food':['你上一次把它当作食物。现在，真正被接触的已经不只是原来的叶组织。','Last time you treated it as food. What is being contacted now is no longer only the original leaf tissue.','前回は食べ物として見た。いま触れられているのは、もとの葉組織だけではない。'],
   'material-shelter':['你上一次把它当作遮蔽物。现在，叶片变软后贴得更低，下面的空间也随之改变。','Last time you treated it as shelter. As the leaf softens and lies lower, the space beneath it changes too.','前回は隠れ場所として見た。葉が柔らかく低く伏すにつれ、その下の空間も変わる。'],
   'material-record':['你对照上一次的位置点。叶片还在附近，但轮廓已经不能完全重合。','You compare it with the previous position mark. The leaf is still nearby, but its outline no longer matches exactly.','前回の位置と照らし合わせる。葉はまだ近くにあるが、輪郭はもう完全には重ならない。']
  },
  options:[
   {id:'material-food',label:['继续看可食表面','Follow the edible surface','食べられる表面を見る'],text:['记录里多出“表面”这个词。对个体来说，可利用的部分正在扩大。','The word “surface” enters the record. For the animal, the usable part is expanding.','記録に「表面」という語が増える。個体にとって利用できる部分は広がっている。']},
   {id:'material-shelter',label:['看叶片下方','Watch beneath the leaf','葉の下を見る'],text:['你记录叶片与底面之间越来越窄的间隙。遮蔽没有消失，只是换了形状。','You record the narrowing gap between leaf and bottom. Cover has not vanished; it has changed shape.','葉と底の間で狭くなる隙間を記す。遮蔽は消えず、形を変えている。']},
   {id:'material-record',label:['对照上次位置','Compare the last position','前回の位置と比べる'],text:['两个位置点很接近，却不能说明这还是完全相同的物体。','The two position marks are close, but that does not prove the object is completely unchanged.','二つの位置は近いが、完全に同じ物体のままだとは言えない。']}
  ]
 },
 {
  id:'fragmented',
  name:['观察 III · 被啃食与破碎','Observation III · Eaten and fragmented','観察 III · 摂食と破砕'],
  prompt:['叶缘出现更大的缺口，部分叶脉已经露出来。几块碎片离开主体，落在沉木和细泥之间。','Larger notches open along the leaf edge and some veins are exposed. Several fragments have separated and lie between the wood and fine silt.','葉の縁の欠けが大きくなり、一部の葉脈が露出する。いくつかの破片は本体を離れ、沈木と細泥の間に落ちている。'],
  after:{
   'material-food':['你一直沿着“食物”去看。现在，一个可吃的边缘已经变成很多个边缘。','You have been following “food.” Now one edible edge has become many edges.','「食べ物」を追ってきた。いま、一つだった食べられる縁が多くの縁に分かれている。'],
   'material-shelter':['你一直沿着“遮蔽物”去看。主体破开以后，小碎片也开始制造新的缝隙和背流面。','You have been following “shelter.” As the main leaf breaks, small fragments begin to make new gaps and lee surfaces.','「隠れ場所」を追ってきた。本体が破れると、小さな破片も新しい隙間や流れの陰を作り始める。'],
   'material-record':['你一直记录位置。现在需要一个位置点，还是很多位置点？','You have been recording position. Does this now require one position mark, or many?','位置を記録してきた。いま必要なのは一つの位置か、それとも多くの位置か。']
  },
  options:[
   {id:'material-food',label:['把缺口记成摄食面','Record the feeding edges','欠けを摂食面として記す'],text:['你不再只量叶片有多大，而开始数它暴露出多少新的边缘。','You stop measuring only how large the leaf is and begin counting how many new edges it exposes.','葉の大きさだけでなく、新しく露出した縁の数を見るようになる。']},
   {id:'material-shelter',label:['把碎片看作新的遮蔽','Treat fragments as new cover','破片を新しい遮蔽として見る'],text:['一块离开的碎片卡在石边。对它来说，“碎掉”同时产生了新的结构。','One detached fragment catches beside a stone. For it, breaking apart also creates new structure.','離れた破片が石のそばに引っかかる。砕けることは同時に新しい構造を作っている。']},
   {id:'material-record',label:['分别标记每一块','Mark each fragment separately','破片を別々に記す'],text:['纸上从一个轮廓变成几个轮廓。分类开始比位置更费力。','One outline on the page becomes several. Classification now takes more work than position.','紙の上の一つの輪郭が複数になる。位置より分類の方が難しくなり始める。']}
  ]
 },
 {
  id:'suspended',
  name:['观察 IV · 悬浮碎屑','Observation IV · Suspended detritus','観察 IV · 浮遊する破片'],
  prompt:['完整的叶形已经很难辨认。一部分碎片被水流带起，细小颗粒越过原来的位置；剩下的叶脉贴在底面。','The complete leaf shape is now hard to recognize. Some fragments are lifted by the current, fine particles cross its former position, and the remaining veins lie against the bottom.','完全な葉の形はもう分かりにくい。一部の破片は流れに持ち上げられ、細粒は元の位置を越え、残った葉脈は底に伏している。'],
  after:{
   'material-food':['你沿着食物去看，却发现一部分“食物”已经不再停在可以指给别人看的地方。','You follow the food, but some of that “food” no longer stays in a place you can point to.','食べ物を追うと、その一部はもう指し示せる場所に留まっていない。'],
   'material-shelter':['你沿着遮蔽去看。原来的叶下空间消失了，但碎片又在别处挡住水流。','You follow shelter. The old space beneath the leaf is gone, while fragments interrupt the current elsewhere.','遮蔽を追う。元の葉下空間は消えたが、破片は別の場所で流れを遮っている。'],
   'material-record':['你沿着位置去看。水流让“同一件东西的位置”变成了一串短暂的位置。','You follow position. The current turns “the position of one thing” into a sequence of temporary positions.','位置を追う。流れによって「一つの物の位置」は短い位置の連続になる。']
  },
  options:[
   {id:'material-food',label:['追随漂移的碎屑','Follow drifting detritus','漂う破片を追う'],text:['你跟着几块碎屑移动。它们经过的表面，比它们原来属于哪片叶子更容易观察。','You follow several drifting pieces. The surfaces they pass are easier to observe than the leaf they once belonged to.','漂う破片を追う。元がどの葉だったかより、いま通る表面の方が観察しやすい。']},
   {id:'material-shelter',label:['观察个体抓住什么','Watch what they grip','何につかまるかを見る'],text:['水流经过时，个体贴向沉木、石缝和水草根部。可抓住的表面暂时比“叶子”更重要。','As water passes, animals press toward wood, stone gaps, and plant bases. Grippable surfaces matter more for the moment than “leaf.”','流れが通ると、個体は沈木、石の隙間、水草の根元へ寄る。いまは「葉」より、つかめる表面の方が重要になる。']},
   {id:'material-record',label:['标记原叶的位置','Mark the former leaf position','元の葉の位置を記す'],text:['那个位置现在几乎是空的。你的标记保留了一个已经离开的整体。','That position is almost empty now. Your mark preserves a whole that has already left.','その位置はいまほとんど空いている。印だけが、すでに去った全体を残している。']}
  ]
 },
 {
  id:'redeposited',
  name:['观察 V · 新的底面','Observation V · New bottom','観察 V · 新しい底面'],
  prompt:['碎屑重新沉到沉木背流侧，和细泥混在一起，铺成一块新的底面。个体沿着这层碎屑经过。那片叶子已经不存在了，但它的一部分现在铺在另一条路线下面。它是什么时候停止成为“一片叶子”的？','Detritus has settled again in the lee of the wood, mixed with fine silt into a new bottom. Animals cross this layer. The leaf no longer exists, yet part of it now lies beneath another route. When did it stop being “a leaf”?','破片は沈木の流れの陰に再び沈み、細泥と混ざって新しい底面を作る。個体はその層を通る。あの葉はもう存在しない。それでも一部はいま別の経路の下に敷かれている。いつ「一枚の葉」でなくなったのか。'],
  after:{
   'material-food':['你一路把它看作可食的东西。最后留下的却不再像一个食物单位，而更像环境的一部分。','You followed it as something edible. What remains no longer looks like one food unit, but like part of the environment.','食べられるものとして追ってきた。最後に残ったものは一つの餌ではなく、環境の一部に近い。'],
   'material-shelter':['你一路把它看作遮蔽物。最后，遮蔽物没有消失，而是散成了许多更小的表面和缝隙。','You followed it as shelter. In the end shelter did not simply vanish; it dispersed into smaller surfaces and gaps.','隠れ場所として追ってきた。最後に遮蔽は単に消えず、より小さな表面や隙間へ分散した。'],
   'material-record':['你一路记录它的位置。最后，原来的位置还在，原来的物体却已经无法单独指出。','You followed its position. In the end the old place remains, but the old object can no longer be pointed out separately.','位置を追ってきた。最後には元の場所は残るが、元の物体だけを指し示すことはできない。']
  },
  options:[
   {id:'material-boundary-use',label:['当它开始承担别的功能','When other functions took over','別の機能を担い始めた時'],text:['你把界线放在用途变化上。可对个体来说，这些用途从来没有排队出现。','You place the boundary at a change of use. For the animals, those uses never arrived one at a time.','用途の変化に境界を置く。しかし個体にとって、それらの用途は順番に一つずつ現れたわけではない。']},
   {id:'material-boundary-shape',label:['当完整轮廓消失','When the whole outline disappeared','完全な輪郭が消えた時'],text:['你把界线放在形状上。水里的碎片却继续参与原来那片叶子制造的关系。','You place the boundary at the loss of shape. Yet the fragments keep participating in relations made by the former leaf.','形の消失に境界を置く。それでも水中の破片は、元の葉が作っていた関係に参加し続ける。']},
   {id:'material-boundary-open',label:['我无法指出一个时刻','I cannot point to one moment','一つの時点を指せない'],text:['你没有画最后那条线。记录停在这里，物质仍继续成为别的东西。','You do not draw the final line. The record stops here while matter continues becoming something else.','最後の線は引かない。記録はここで止まるが、物質は別のものになり続ける。']}
  ]
 }
]);

export const FRESHWATER_MATERIAL_ENDINGS=Object.freeze([
 {
  id:'care',
  title:['可食的表面','Edible Surfaces','食べられる表面'],
  body:['你最常沿着“食物”去看。叶片从一个可指认的对象，变成许多可利用的表面，最后混进底面。用途没有等到物体保持完整才开始。','You most often followed “food.” The leaf changed from one identifiable object into many usable surfaces and finally into the bottom. Use did not wait for the object to remain whole.','最も多く「食べ物」を追った。葉は一つの指し示せる物から、多くの利用できる表面へ、そして底面へ変わった。利用は、物体が完全な形を保つことを待たなかった。'],
  line:['“一片叶子”是你的单位；可利用的表面是另一种单位。','“A leaf” was your unit; a usable surface was another.','「一枚の葉」はあなたの単位で、利用できる表面は別の単位だった。']
 },
 {
  id:'calm',
  title:['遮蔽没有消失','Shelter Did Not Disappear','遮蔽は消えなかった'],
  body:['你最常沿着“遮蔽物”去看。叶片软化、破裂、漂移以后，原来的屋顶消失了，却留下新的缝隙、背流面和可抓住的结构。','You most often followed “shelter.” After the leaf softened, broke, and drifted, the old roof disappeared but new gaps, lee surfaces, and grippable structures remained.','最も多く「隠れ場所」を追った。葉が柔らかくなり、砕け、漂ったあと、元の屋根は消えたが、新しい隙間、流れの陰、つかめる構造が残った。'],
  line:['物体改变了；关系没有按同一个边界结束。','The object changed; its relations did not end at the same boundary.','物体は変わったが、関係は同じ境界で終わらなかった。']
 },
 {
  id:'trace',
  title:['位置保留了不存在的整体','A Position Kept a Whole That Was Gone','位置が消えた全体を残した'],
  body:['你最常记录位置。最后，最稳定的是沉木和石块；叶片的坐标还可以标出来，但已经没有一个完整对象与那个坐标对应。','You most often recorded position. In the end the wood and stones were the stable references; the leaf’s coordinates could still be marked, but no whole object remained to match them.','最も多く位置を記録した。最後に安定していたのは沈木と石で、葉の座標はまだ示せても、それに対応する一つの物体は、もう残っていなかった。'],
  line:['地图能保留位置，却不能替物质决定它何时还是“同一个东西”。','A map can preserve position, but it cannot decide when matter is still “the same thing.”','地図は位置を残せても、物質がいつまで「同じもの」かを決めることはできない。']
 }
]);
