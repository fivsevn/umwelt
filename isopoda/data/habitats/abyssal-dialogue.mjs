// Fictional translation-layer dialogue for the abyssal habitat.
// These lines are not claims about Bathynomus cognition. The animal remains observable;
// the "translated" sentences are an explicit human interpretive device inside the game.
export const ABYSSAL_NODES=[
 {
  id:'contact',
  prompt:['探照灯落在深海粉砂上。大王具足虫停在画面中央，只有触角缓慢改变角度。没有证据表明它理解你的问题；从这里开始，游戏只把可见动作转写成一层虚构的“翻译”。','The lamp falls across abyssal silt. A giant isopod rests at the center of the frame, only its antennae changing angle slowly. There is no evidence it understands your questions; from here on, the game only rewrites visible movement through a fictional “translation” layer.','照明が深海の泥に落ちる。オオグソクムシは画面中央で止まり、触角だけがゆっくり角度を変える。こちらの問いを理解している証拠はない。ここから先、ゲームは見える動きを架空の「翻訳」層へ書き換えるだけだ。'],
  options:[
   {id:'contact-wait',label:['问：你在等什么？','Ask: What are you waiting for?','問う：何を待っている？'],delta:{interpretation:2,maps:1},text:['翻译层：「你把没有移动叫作等待，因为你已经替下一件事留了位置。」观察：身体没有移动，右侧触角向外转了一点。','Translation layer: “You call not moving waiting because you have already reserved a place for what comes next.” Observation: the body does not move; the right antenna turns slightly outward.','翻訳層：「動かないことを待つと呼ぶのは、次に起こることの場所を先に用意しているからだ。」観察：身体は動かず、右の触角が少し外へ向く。']},
   {id:'contact-name',label:['先说出它的名字','Say its name first','まず名前を口にする'],delta:{attention:2,labels:1},text:['你读出 Bathynomus giganteus。翻译层没有补一句自我介绍。观察：名字停在屏幕上，个体仍停在粉砂上。','You read out Bathynomus giganteus. The translation layer does not add an introduction. Observation: the name remains on screen; the animal remains on the silt.','Bathynomus giganteus と読み上げる。翻訳層は自己紹介を付け足さない。観察：名前は画面に残り、個体は泥の上に残る。']},
   {id:'contact-record',label:['只记录：没有移动','Record only: no movement','「動かなかった」とだけ記録する'],delta:{restraint:2,quiet:1},text:['你只写下位置、朝向和触角变化。翻译层暂时为空。','You write only position, orientation, and antenna movement. The translation layer remains blank for now.','位置、向き、触角の変化だけを書く。翻訳層はいまのところ空白のままだ。']}
  ]
 },
 {
  id:'time',
  prompt:['几分钟过去。画面里的变化少到足以让你开始注意“几分钟”这个单位本身。大王具足虫向前移动了不到一个身体长度。','Several minutes pass. So little changes that you begin noticing the unit “several minutes” itself. The giant isopod moves forward by less than one body length.','数分が過ぎる。変化が少なすぎて、「数分」という単位そのものが気になり始める。オオグソクムシは一体長にも満たない距離だけ前へ進む。'],
  options:[
   {id:'time-slow',label:['这里的时间比较慢','Time is slower here','ここでは時間が遅い'],delta:{interpretation:2},text:['翻译层：「慢是拿另一只钟来比较以后才出现的性质。」观察：它再次停下。','Translation layer: “Slow is a property that appears only after you bring another clock for comparison.” Observation: it stops again.','翻訳層：「遅いという性質は、別の時計を持ち込んで比べたあとに現れる。」観察：再び止まる。']},
   {id:'time-rest',label:['也许它只是在休息','Maybe it is simply resting','ただ休んでいるのかもしれない'],delta:{attention:1,interpretation:1},text:['翻译层：「‘休息’比‘等待’谨慎一点，但仍然替身体安排了理由。」观察：步足仍贴着底面。','Translation layer: “‘Resting’ is a little more cautious than ‘waiting,’ but it still assigns a reason to the body.” Observation: the legs remain against the bottom.','翻訳層：「『休む』は『待つ』より少し慎重だが、それでも身体に理由を与えている。」観察：脚は底面に接したままだ。']},
   {id:'time-position',label:['不解释时间，只记位置','Do not interpret time; record position','時間を解釈せず、位置だけ記録する'],delta:{restraint:2,attention:1,quiet:1},text:['你画下两个位置点，中间没有箭头。两点之间确实经过了时间，但纸上没有替它规定速度。','You mark two positions with no arrow between them. Time certainly passed, but the page does not assign it a speed.','二つの位置を記し、その間に矢印は引かない。時間は確かに過ぎたが、紙はそこに速度を割り当てない。']}
  ]
 },
 {
  id:'name',
  prompt:['资料栏仍显示“大王具足虫 / Bathynomus giganteus”。屏幕上的分类没有变化；画面里的身体已经换了一个角度。','The archive still reads “giant isopod / Bathynomus giganteus.” The classification on screen has not changed; the body in the frame has changed angle.','資料欄には「オオグソクムシ / Bathynomus giganteus」と表示されたままだ。画面上の分類は変わらないが、映っている身体の角度は変わっている。'],
  options:[
   {id:'name-anchor',label:['名字至少让我们知道它是谁','The name at least tells us what it is','名前があれば少なくとも何者か分かる'],delta:{interpretation:1,attention:1,labels:1},text:['翻译层：「名字让你知道应该把哪些资料放在一起。它没有替这一个身体完成剩下的部分。」','Translation layer: “The name tells you which records to place together. It does not complete the rest of this particular body.”','翻訳層：「名前は、どの資料を同じ場所へ置くかを教える。この一つの身体の残りまで完成させるわけではない。」']},
   {id:'name-human',label:['名字属于我们的档案','The name belongs to our archive','名前は私たちの資料庫に属する'],delta:{restraint:2,labels:1},text:['翻译层：「名字朝向你。身体朝向别处。」观察：它沿着粉砂转了一个很小的角度。','Translation layer: “The name faces you. The body faces elsewhere.” Observation: it turns by a small angle across the silt.','翻訳層：「名前はあなたの方を向く。身体は別の方を向く。」観察：泥の上でごく小さく向きを変える。']},
   {id:'name-who',label:['问：那你自己是谁？','Ask: Then who are you?','問う：では、あなた自身は誰？'],delta:{interpretation:2,labels:1},text:['翻译层：「把一个身体变成‘谁’，也是你带来的语法。」观察：没有出现可验证的回应。','Translation layer: “Turning a body into a ‘who’ is also grammar you brought with you.” Observation: no verifiable response follows.','翻訳層：「一つの身体を『誰』にすることも、あなたが持ち込んだ文法だ。」観察：確認できる応答は現れない。']}
  ]
 },
 {
  id:'hunger',
  prompt:['一小片有机残屑慢慢沉到附近。大王具足虫在一段停顿后改变方向，向那一侧移动。','A small piece of organic debris settles nearby. After a pause, the giant isopod changes direction and moves toward that side.','小さな有機物の破片が近くへ沈む。しばらく止まったあと、オオグソクムシは向きを変え、そちらへ動く。'],
  options:[
   {id:'hunger-motive',label:['它饿了','It is hungry','空腹なのだ'],delta:{interpretation:2},text:['翻译层：「你从一条路线直接走到了一个内部状态。」观察：它继续靠近残屑。','Translation layer: “You moved directly from a route to an internal state.” Observation: it continues toward the debris.','翻訳層：「あなたは一つの経路から、そのまま内部状態へ移った。」観察：破片へ近づき続ける。']},
   {id:'hunger-route',label:['只记它靠近了食物来源','Record only that it approached the food source','餌になりうる物へ近づいたことだけ記録する'],delta:{attention:2,restraint:1},text:['你写下距离缩短、朝向改变。是否饥饿留在另一栏，暂时没有被填上。','You record the shortening distance and changed orientation. Whether it is hungry stays in another field, still blank.','距離が縮まり、向きが変わったことを書く。空腹かどうかは別欄に残し、まだ埋めない。']},
   {id:'hunger-world',label:['食物也改变了它的环境','The food also changed its environment','餌もまた環境を変えた'],delta:{attention:2,maps:1},text:['翻译层：「环境不是背景；有些东西一出现，路线就重新有了方向。」观察：残屑和身体之间的距离继续缩短。','Translation layer: “Environment is not background; some arrivals give routes a new direction.” Observation: the distance between debris and body continues to shrink.','翻訳層：「環境は背景ではない。何かが現れると、経路は新しい方向を持つ。」観察：破片と身体の距離はさらに縮まる。']}
  ]
 },
 {
  id:'scale',
  prompt:['你把画面放大。甲片、步足和触角占据了几乎整个观察窗。几分钟前，它还只是深海背景里的一个轮廓。','You zoom in. Plates, legs, and antennae fill almost the entire observation window. Minutes ago it was only a silhouette in the deep-sea background.','画面を拡大する。背板、脚、触角が観察窓のほとんどを占める。数分前までは深海背景の一つの輪郭にすぎなかった。'],
  options:[
   {id:'scale-large',label:['它本来就是巨大的','It was already huge','もともと巨大だった'],delta:{interpretation:1,attention:1},text:['翻译层：「巨大需要一个比较对象。你刚刚把比较对象藏到画面外面。」','Translation layer: “Huge requires something to compare against. You just moved the comparison outside the frame.”','翻訳層：「巨大には比較対象が要る。あなたはいま、その比較対象を画面の外へ移した。」']},
   {id:'scale-instrument',label:['大小也来自观察尺度','Size also comes from the scale of observation','大きさも観察尺度から生まれる'],delta:{attention:2,restraint:1},text:['你记下倍率。身体没有变大，画面中的世界变窄了。','You record the magnification. The body did not grow; the world inside the frame became narrower.','倍率を記録する。身体が大きくなったのではなく、画面内の世界が狭くなった。']},
   {id:'scale-relative',label:['和陆生鼠妇相比，它就是大','Compared with woodlice, it is large','陸生のワラジムシ類と比べれば大きい'],delta:{interpretation:1,maps:1},text:['翻译层：「比较成立。比较对象却不在这里。」观察：步足从一块沉积物上跨过去。','Translation layer: “The comparison is valid. The comparison object is simply not here.” Observation: a leg steps across a patch of sediment.','翻訳層：「比較は成立する。ただし比較対象はここにはいない。」観察：脚が堆積物の一部をまたぐ。']}
  ]
 },
 {
  id:'environment',
  prompt:['水流很弱，颗粒缓慢下降。仪表给出流速、溶氧和碎屑数值；大王具足虫经过的地方还包括石块阴影、坡度和刚才落下的残屑。','The current is weak and particles descend slowly. Instruments report flow, oxygen, and detritus; the giant isopod also crosses stone shadow, slope, and the debris that just arrived.','流れは弱く、粒子はゆっくり沈む。計器は流速、溶存酸素、デトリタスを示すが、オオグソクムシが通る場所には石の影、傾斜、先ほど落ちた破片もある。'],
  options:[
   {id:'environment-meters',label:['环境就是这些可测变量','Environment is these measurable variables','環境とは測定できる変数だ'],delta:{interpretation:2,labels:1},text:['翻译层：「仪表把连续的地方切成几列数值。它们很有用，但列数不是环境的边界。」','Translation layer: “Instruments cut a continuous place into columns of values. They are useful, but the number of columns is not the boundary of an environment.”','翻訳層：「計器は連続した場所を数値の列へ切り分ける。便利だが、列の数が環境の境界ではない。」']},
   {id:'environment-affordance',label:['环境是它能够遭遇的差异','Environment is the differences it can encounter','環境は、その身体が遭遇できる差異だ'],delta:{attention:2,maps:1},text:['翻译层：「这句话更接近 Umwelt，也仍然是你的句子。」观察：触角先碰到一块小石，身体随后绕开。','Translation layer: “That is closer to Umwelt, and it is still your sentence.” Observation: an antenna reaches a small stone before the body turns around it.','翻訳層：「その言い方は Umwelt に近い。それでもなお、あなたの文だ。」観察：触角が先に小石へ触れ、身体はその後で回り込む。']},
   {id:'environment-outside',label:['我无法从外面替它划完整边界','I cannot draw its full boundary from outside','外側から完全な境界を代わりに引くことはできない'],delta:{restraint:2,attention:1,quiet:1},text:['你保留仪表，也保留空白。两者同时出现在这一页。','You keep the measurements and the blank space. Both remain on the same page.','計測値も空白も残す。二つは同じページに同時に存在する。']}
  ]
 },
 {
  id:'translation',
  prompt:['到这里，“翻译层”已经生成了比大王具足虫实际动作更长的句子。屏幕上的语言越来越丰富，画面里的动物仍然只是在移动、停下、改变朝向。','By now the “translation layer” has produced sentences longer than the giant isopod’s actual movements. Language on screen grows richer while the animal still only moves, stops, and changes direction.','ここまでで「翻訳層」は、オオグソクムシの実際の動作より長い文章を作っている。画面上の言語は豊かになるが、動物は移動し、止まり、向きを変えているだけだ。'],
  options:[
   {id:'translation-continue',label:['继续翻译，它至少让问题出现','Keep translating; it at least makes the questions visible','翻訳を続ける。少なくとも問いを見えるようにする'],delta:{interpretation:2},text:['翻译层：「可以。只要不要把问题出现的位置误认成答案出现的位置。」','Translation layer: “You can. Just do not mistake the place where a question appears for the place where an answer appears.”','翻訳層：「続けてもいい。ただし、問いが現れた場所を答えが現れた場所と取り違えないこと。」']},
   {id:'translation-strip',label:['把翻译删回动作记录','Reduce the translation back to movement notes','翻訳を動作記録まで削る'],delta:{restraint:2,attention:1},text:['你删掉几句，只留下：向前、停下、触角转向、再次移动。页面变短，动物没有因此变简单。','You delete several lines, leaving only: forward, stop, antenna turns, movement resumes. The page becomes shorter; the animal does not become simpler.','いくつかの文を消し、「前進、停止、触角の向きが変わる、再び移動」だけを残す。ページは短くなるが、動物が単純になったわけではない。']},
   {id:'translation-monologue',label:['承认这更像是我的独白','Admit this is closer to my monologue','これは自分の独白に近いと認める'],delta:{restraint:2,attention:2},text:['翻译层：「承认来源不会让语言消失，只会把说话者重新放回句子里。」','Translation layer: “Naming the source does not make language disappear; it puts the speaker back into the sentence.”','翻訳層：「言葉の出所を認めても、言語は消えない。ただ話者が文の中へ戻る。」']}
  ]
 },
 {
  id:'observer',
  prompt:['载具轻微漂移，探照灯的边缘从它背上移开。大王具足虫随后改变方向，进入更暗的一侧。观察条件和被观察的路线在同一分钟里一起变化。','The vehicle drifts slightly and the edge of the lamp moves off its back. The giant isopod then changes direction toward the darker side. Observation conditions and the observed route change within the same minute.','機体がわずかに流され、照明の縁が背中から外れる。その後、オオグソクムシは向きを変え、より暗い側へ入る。観察条件と観察された経路が同じ一分の中で同時に変わる。'],
  options:[
   {id:'observer-reject',label:['它在避开我','It is avoiding me','こちらを避けている'],delta:{interpretation:2},text:['翻译层：「‘我’把灯、震动、载具和你的意图装进了同一个词。」观察：它继续向暗处移动。','Translation layer: “‘Me’ packs the lamp, vibration, vehicle, and your intention into one word.” Observation: it keeps moving into the dark.','翻訳層：「『私』という一語に、光、振動、機体、あなたの意図がまとめて入っている。」観察：暗い方へ動き続ける。']},
   {id:'observer-light',label:['只能确认光线变了','I can only confirm that the light changed','確認できるのは光が変わったことだけ'],delta:{restraint:2,attention:1},text:['你写下光斑移动的时间，以及它转向的时间。两行相邻，但没有被写成因果句。','You record when the light patch moved and when it turned. The lines are adjacent, but you do not write them as a causal sentence.','光斑が動いた時刻と、向きを変えた時刻を書く。二行は隣り合うが、因果文にはしない。']},
   {id:'observer-field',label:['观察者已经进入环境','The observer has entered the environment','観察者はすでに環境へ入っている'],delta:{attention:2,maps:1},text:['翻译层：「至少在你的记录里，观察从来没有发生在世界之外。」观察：灯的边缘继续向右漂。','Translation layer: “At least in your record, observation never took place outside the world.” Observation: the edge of the lamp keeps drifting right.','翻訳層：「少なくともあなたの記録では、観察は世界の外で起きたことがない。」観察：照明の縁は右へ流れ続ける。']}
  ]
 },
 {
  id:'departure',
  prompt:['最后一个观察时段。大王具足虫开始向画面边缘移动。它没有配合三天的结束；只是路线恰好快要离开你的视野。','The final observation period begins. The giant isopod moves toward the edge of the frame. It does not cooperate with the end of three days; its route simply happens to be leaving your view.','最後の観察時間。オオグソクムシは画面の縁へ向かって動き始める。三日間の終わりに合わせているわけではなく、経路がたまたま視野の外へ向かっている。'],
  options:[
   {id:'departure-ending',label:['把它记作一次告别','Record it as a farewell','別れとして記録する'],delta:{interpretation:2,labels:1},text:['翻译层：「告别把两个主体和一个结束放进同一句话。画面只能确认其中一个身体正在离开。」','Translation layer: “Farewell places two subjects and an ending in one sentence. The frame can confirm only that one body is leaving.”','翻訳層：「別れという語は、二つの主体と一つの終わりを同じ文へ入れる。画面が確認できるのは、一つの身体が去っていることだけだ。」']},
   {id:'departure-watch',label:['继续看到它完全离开','Keep watching until it fully leaves','完全に見えなくなるまで見る'],delta:{attention:2,quiet:1},text:['最后露在画面里的不是尾端，而是一根触角。随后只剩粉砂和缓慢下沉的颗粒。','The last thing visible is not the tail but one antenna. Then only silt and slowly descending particles remain.','最後に見えるのは尾端ではなく一本の触角だ。その後、泥とゆっくり沈む粒子だけが残る。']},
   {id:'departure-stop',label:['在它离开前停止记录','Stop recording before it leaves','去る前に記録を止める'],delta:{restraint:2,quiet:2},text:['记录停在一个仍然存在的身体上。之后发生的移动没有进入这一页。','The record stops while the body is still present. Whatever movement follows does not enter this page.','身体がまだ存在しているところで記録を止める。その後の動きはこのページへ入らない。']}
  ]
 }
];

export const ABYSSAL_ENDING_DATA={
 'abyssal-untranslated':{
  title:['未译出的句子','The untranslated sentence','翻訳されなかった文'],
  body:['最后几页里，动作记录越来越多，替它生成的句子越来越少。你没有因此更接近一个“真正的声音”；只是把无法确认的部分保留在无法确认的位置。','Across the final pages, movement notes increase while generated sentences decrease. This does not bring you closer to a “true voice”; it only keeps what cannot be confirmed in the place of uncertainty.','最後の数ページでは動作記録が増え、生成された文は減っていく。それで「本当の声」に近づいたわけではない。ただ、確認できない部分を確認できない場所に残した。'],
  line:['它离开画面以后，翻译层第一次完全空白。','After it leaves the frame, the translation layer is completely blank for the first time.','画面から消えたあと、翻訳層は初めて完全な空白になる。']
 },
 'abyssal-observer':{
  title:['观察者也在图里','The observer is also in the map','観察者も図の中にいる'],
  body:['你的记录逐渐把灯光、倍率、载具漂移和自己的措辞写进同一页。大王具足虫仍然是被观察的个体，但“环境”不再只画在它身体周围。','Your notes gradually place light, magnification, vehicle drift, and your own wording on the same page. The giant isopod remains the observed individual, but “environment” is no longer drawn only around its body.','記録には光、倍率、機体の漂流、自分の言葉遣いが同じページへ入っていった。オオグソクムシは観察対象のままだが、「環境」はもうその身体の周囲だけに描かれていない。'],
  line:['透明的观察窗没有把观察者放到世界外面。','A transparent observation window did not place the observer outside the world.','透明な観察窓は、観察者を世界の外へ置かなかった。']
 },
 'abyssal-voice':{
  title:['替它说话的人','The one who spoke for it','代わりに語った者'],
  body:['三天里，翻译层生成了许多完整的回答。它们让问题变得清楚，也不断提醒你：语言来自观察者一侧。最后留下的不是“它说过什么”的证据，而是一份人如何试图和非人相遇的文本。','Across three days, the translation layer generated many complete answers. They clarified the questions while repeatedly showing that the language came from the observer’s side. What remains is not evidence of what it “said,” but a text about how a human tried to encounter a nonhuman.','三日間、翻訳層は多くの完全な答えを生成した。問いを明瞭にすると同時に、言葉が観察者側から来ていることを繰り返し示した。残ったのは「それが何を語ったか」の証拠ではなく、人が非人間と出会おうとした記録だ。'],
  line:['句子很长。它留下的路线很短。','The sentences are long. The route it left is short.','文は長い。それが残した経路は短い。']
 },
 'abyssal-between':{
  title:['两种时间','Two kinds of time','二つの時間'],
  body:['你有时替动作加上一句话，有时又把句子删回位置和方向。两种记录没有互相取消。三天结束时，人类叙事的时间和一具深海身体的时间仍然并排留在同一本笔记里。','Sometimes you add a sentence to a movement; sometimes you reduce the sentence back to position and direction. Neither record cancels the other. At the end of three days, narrative time and the time of a deep-sea body remain side by side in the same notebook.','動作へ一文を加えることもあれば、文を位置と方向へ戻すこともあった。二つの記録は互いを消さない。三日が終わると、人間の物語の時間と深海の身体の時間が同じノートに並んで残る。'],
  line:['同一个时刻，可以被写成一句话，也可以只留下一个点。','The same moment can become a sentence, or remain only a point.','同じ瞬間は、一文にもなれば、一つの点だけにもなる。']
 }
};
