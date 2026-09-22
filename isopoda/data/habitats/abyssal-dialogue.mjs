// Direct narrative for the abyssal habitat.
// The same three-choice observation UI is used; only the storytelling mode changes.
export const ABYSSAL_NODES=[
 {
  id:'contact',
  prompt:['探照灯切开黑水，一只大王具足虫停在粉砂上。你打开水下麦克风：“你在等什么？”它慢慢抬起右侧触角，朝镜头转过来。','The lamp cuts through black water. A giant isopod rests on the silt. You open the underwater microphone: “What are you waiting for?” It slowly raises its right antenna and turns toward the camera.','照明が黒い水を切り開く。オオグソクムシが泥の上で止まっている。水中マイクを開いて「何を待っている？」と聞くと、右の触角をゆっくり上げ、カメラの方を向く。'],
  options:[
   {id:'contact-wait',label:['再问一次','Ask again','もう一度聞く'],delta:{interpretation:2,maps:1},text:['你把问题重复了一遍。它向前迈了一步：“先告诉我，为什么不动就一定是在等。”','You repeat the question. It takes one step forward. “First tell me why not moving must mean waiting.”','もう一度同じ問いを投げる。その個体は一歩だけ前へ出る。「まず、動かないことがどうして必ず『待つ』になるのか教えて。」']},
   {id:'contact-name',label:['先叫它的名字','Say its name first','まず名前を呼ぶ'],delta:{attention:2,labels:1},text:['“Bathynomus giganteus。”你念出学名。它停了一会儿：“那是你们给档案用的名字。”','“Bathynomus giganteus.” You say the scientific name. It pauses. “That is the name your archives use.”','「Bathynomus giganteus」と学名を口にする。少し間を置いて、その個体は言う。「それは君たちの資料庫で使う名前だね。」']},
   {id:'contact-record',label:['先不开口','Stay silent for now','まだ話さない'],delta:{restraint:2,quiet:1},text:['你关掉麦克风，只记下它的位置和朝向。几分钟里，它也没有继续靠近。','You mute the microphone and record only its position and orientation. For several minutes, it does not come any closer.','マイクを切り、位置と向きだけを記録する。数分のあいだ、その個体もそれ以上近づいてこない。']}
  ]
 },
 {
  id:'time',
  prompt:['几分钟过去，它只移动了不到一个身体长度。你看了一眼计时器，又看了一眼几乎没变的画面。','Several minutes pass. It moves less than one body length. You look at the timer, then back at a scene that has barely changed.','数分が過ぎる。その個体は一体長にも満たない距離しか進まない。タイマーを見て、ほとんど変わらない画面へ視線を戻す。'],
  options:[
   {id:'time-slow',label:['这里的时间真慢','Time is slow down here','ここは時間が遅い'],delta:{interpretation:2},text:['它停住：“慢，是你把另一只钟带到这里以后才有的词。”','It stops. “Slow is a word that only appears after you bring another clock down here.”','その個体は止まる。「『遅い』は、別の時計をここへ持ち込んだあとに生まれる言葉だよ。」']},
   {id:'time-rest',label:['你只是在休息？','Are you just resting?','休んでいるだけ？'],delta:{attention:1,interpretation:1},text:['“也许。”它把触角收低了一点，“但你为什么非要给停下来找一个理由？”','“Maybe.” It lowers its antennae slightly. “But why must stopping have a reason?”','「そうかも。」触角を少し下げる。「でも、止まることには必ず理由が必要なの？」']},
   {id:'time-position',label:['只记两个位置','Record two positions only','二つの位置だけ記す'],delta:{restraint:2,attention:1,quiet:1},text:['你在笔记上点下两个坐标，没有画箭头。它看着镜头，什么也没说。','You mark two coordinates in the notebook and draw no arrow between them. It faces the camera and says nothing.','ノートに二つの座標だけを打ち、矢印は引かない。その個体はカメラを見たまま、何も言わない。']}
  ]
 },
 {
  id:'name',
  prompt:['资料栏一直显示“大王具足虫 / Bathynomus giganteus”。它却已经从画面中央移到一块小石旁边。','The archive still reads “giant isopod / Bathynomus giganteus,” while it has already moved from the center of the frame to a small stone.','資料欄にはずっと「オオグソクムシ / Bathynomus giganteus」と表示されているが、その個体はすでに画面中央から小石のそばへ移っている。'],
  options:[
   {id:'name-anchor',label:['名字至少告诉我你是谁','The name tells me what you are','名前で何者かは分かる'],delta:{interpretation:1,attention:1,labels:1},text:['“名字能告诉你该翻哪一页。”它说，“但那一页不是我。”','“A name tells you which page to open,” it says. “But that page is not me.”','「名前があれば、どのページを開くかは分かる。」その個体は言う。「でも、そのページが僕ではない。」']},
   {id:'name-human',label:['名字属于我们的档案','The name belongs to our archive','名前は私たちの資料庫に属する'],delta:{restraint:2,labels:1},text:['它转过一个很小的角度：“那就别把档案当成身体。”','It turns by a small angle. “Then do not mistake the archive for the body.”','ほんの少し向きを変える。「なら、資料庫を身体そのものだと思わないで。」']},
   {id:'name-who',label:['那你自己是谁？','Then who are you?','じゃあ、君自身は誰？'],delta:{interpretation:2,labels:1},text:['它停了很久，反问：“你呢？”','It pauses for a long time, then asks, “And you?”','長い沈黙のあと、逆に聞いてくる。「君は？」']}
  ]
 },
 {
  id:'hunger',
  prompt:['一小片有机残屑从黑水里落下来。它先停住，随后改变方向，慢慢朝那边走。','A small piece of organic debris falls out of the black water. It pauses, changes direction, and slowly heads toward it.','小さな有機物の破片が黒い水から落ちてくる。その個体は一度止まり、向きを変えて、ゆっくりそちらへ進む。'],
  options:[
   {id:'hunger-motive',label:['你饿了？','Are you hungry?','お腹が空いた？'],delta:{interpretation:2},text:['“你们总喜欢从一条路线直接猜到肚子里。”它没有停下。','“You always like to jump from a route straight into the stomach.” It keeps moving.','「君たちは、一本の進路からすぐ腹の中まで想像したがるね。」その個体はそのまま進み続ける。']},
   {id:'hunger-route',label:['我只看见你靠近它','I only see you approaching it','近づいていることだけ分かる'],delta:{attention:2,restraint:1},text:['“这就够了。”它从残屑旁经过半个身体，又折回来。','“That is enough.” It passes half a body length beyond the debris, then turns back.','「それで十分。」破片を半体長ほど通り過ぎてから、また戻ってくる。']},
   {id:'hunger-world',label:['它一出现，环境就变了','Its arrival changed the environment','それが来て環境が変わった'],delta:{attention:2,maps:1},text:['它停在残屑旁：“背景如果能改变路线，就不只是背景。”','It stops beside the debris. “If a background can change a route, it is not merely background.”','破片のそばで止まる。「進路を変えられる背景なら、それはもう背景だけじゃない。」']}
  ]
 },
 {
  id:'scale',
  prompt:['你把画面放大。宽大的背板、七对步足和触角几乎占满观察窗。刚才它还只是深海里的一个轮廓。','You zoom in. Broad dorsal plates, seven pairs of walking legs, and antennae nearly fill the observation window. Moments ago it was only a silhouette in the deep sea.','画面を拡大する。幅広い背板、七対の歩脚、触角が観察窓をほとんど埋める。さっきまで深海の一つの輪郭にすぎなかった。'],
  options:[
   {id:'scale-large',label:['你本来就很大','You were already huge','もともと大きい'],delta:{interpretation:1,attention:1},text:['“和什么比？”它问。画面外什么也没有。','“Compared with what?” it asks. Nothing else is visible in the frame.','「何と比べて？」と聞く。画面には他に比較できるものがない。']},
   {id:'scale-instrument',label:['是我把世界放大了','I enlarged the world','私が世界を拡大した'],delta:{attention:2,restraint:1},text:['你记下倍率。它的身体没有变，观察窗里的世界变窄了。','You record the magnification. Its body has not changed; the world inside the observation window has narrowed.','倍率を記録する。身体は変わっていない。観察窓の中の世界が狭くなっただけだ。']},
   {id:'scale-relative',label:['和陆生鼠妇比，你确实巨大','Compared with woodlice, you are huge','陸生のワラジムシ類よりずっと大きい'],delta:{interpretation:1,maps:1},text:['“那它们在哪里？”它问。你没有办法把陆地放进这片黑水里。','“Then where are they?” it asks. You cannot place the land inside this black water.','「じゃあ、その小さな仲間たちはどこ？」と聞く。陸地をこの黒い水の中へ持ち込むことはできない。']}
  ]
 },
 {
  id:'environment',
  prompt:['仪表显示流速、溶氧和碎屑。它经过的地方却还包括石块的阴影、坡度，以及刚才落下的那片残屑。','The instruments show flow, oxygen, and detritus. The place it moves through also includes stone shadow, slope, and the debris that just fell.','計器には流速、溶存酸素、デトリタスが出ている。けれどオオグソクムシが通る場所には、石の影、傾斜、さっき落ちた破片もある。'],
  options:[
   {id:'environment-meters',label:['环境就是这些数值','The environment is these values','環境はこの数値だ'],delta:{interpretation:2,labels:1},text:['它的触角碰到小石：“那石头应该放在哪一列？”','Its antenna touches the stone. “Which column does that rock belong in?”','触角が小石に触れる。「その石は、どの列に入れるの？」']},
   {id:'environment-affordance',label:['环境是你能遇见的差异','The environment is the differences you can encounter','環境は君が出会える差異だ'],delta:{attention:2,maps:1},text:['“那还算接近。”它绕过小石，“但你站的位置，也会决定你能看见哪些差异。”','“That is closer.” It moves around the stone. “But where you stand also decides which differences you can see.”','「それなら少し近い。」小石を回り込む。「でも、どこに立つかで見える差異も変わる。」']},
   {id:'environment-outside',label:['我没法替你画完整边界','I cannot draw your whole boundary for you','君の境界を全部は描けない'],delta:{restraint:2,attention:1,quiet:1},text:['它没有回答，只从石头后面重新出现。你把地图边缘留空。','It does not answer. It simply reappears from behind the stone. You leave the edge of the map blank.','答えはない。石の後ろから再び姿を現す。地図の端は空白のまま残す。']}
  ]
 },
 {
  id:'translation',
  prompt:['第二天夜里，你终于问：“你真的听得懂我吗？”它停下脚步。黑水里只剩机器低低的嗡声。','On the second night you finally ask, “Do you really understand me?” It stops walking. Only the low hum of the vehicle remains in the black water.','二日目の夜、ついに聞く。「本当に私の言葉が分かるの？」その個体は歩みを止める。黒い水には機体の低い音だけが残る。'],
  options:[
   {id:'translation-continue',label:['能回答就算听懂','If you can answer, you understand','答えられるなら分かっている'],delta:{interpretation:2},text:['“那你也听懂我了吗？”它问。这个问题比你的更难回答。','“Then do you understand me?” it asks. That question is harder to answer than yours.','「じゃあ、君は僕のことを分かっている？」と聞く。その問いの方がずっと答えにくい。']},
   {id:'translation-strip',label:['也许我们只是在互相猜','Maybe we are only guessing each other','互いに推測しているだけかも'],delta:{restraint:2,attention:1},text:['“猜也可以。”它说，“只要别把猜中一次叫成完全理解。”','“Guessing is fine,” it says. “Just do not call one correct guess complete understanding.”','「推測でもいい。」その個体は言う。「一度当たっただけで、完全に理解したことにしなければ。」']},
   {id:'translation-monologue',label:['不问这个了','Drop the question','この問いはやめる'],delta:{restraint:2,attention:2},text:['你把麦克风放下。它也继续向前。这个问题没有得到结论，却没有妨碍下一步发生。','You lower the microphone. It resumes moving. The question reaches no conclusion, but that does not prevent the next step.','マイクを置く。その個体もまた歩き始める。問いに結論は出ないが、それでも次の一歩は起きる。']}
  ]
 },
 {
  id:'observer',
  prompt:['载具轻微漂移，探照灯从它背上滑开。它随即转向更暗的一侧。你突然意识到，自己的光也一直在这片环境里。','The vehicle drifts slightly and the lamp slides off its back. It immediately turns toward the darker side. You realize that your light has been part of this environment all along.','機体がわずかに流れ、照明が背中から外れる。その個体はすぐに暗い方へ向きを変える。自分の光もずっとこの環境の一部だったことに気づく。'],
  options:[
   {id:'observer-reject',label:['你在躲我？','Are you avoiding me?','私を避けている？'],delta:{interpretation:2},text:['“我躲的是光。”它说，“是你把光和自己放进了同一个词。”','“I am avoiding the light,” it says. “You are the one who put the light and yourself into the same word.”','「避けているのは光だよ。」その個体は言う。「光と自分を同じ言葉に入れたのは君だ。」']},
   {id:'observer-light',label:['只能确定光线变了','All I know is the light changed','確かなのは光が変わったこと'],delta:{restraint:2,attention:1},text:['你记下灯光移动的时间，也记下它转向的时间。两行挨在一起，却没有写成因果。','You record when the light moved and when it turned. The two lines sit beside each other without becoming a causal statement.','光が動いた時刻と、オオグソクムシが向きを変えた時刻を記す。二行は隣り合うが、因果にはしない。']},
   {id:'observer-field',label:['我也已经在环境里','I am already inside the environment','私ももう環境の中にいる'],delta:{attention:2,maps:1},text:['它停了一下：“终于。”随后继续往暗处走。','It pauses. “Finally.” Then it keeps walking into the dark.','一瞬止まる。「やっと気づいた。」そしてまた暗い方へ進む。']}
  ]
 },
 {
  id:'departure',
  prompt:['第三天最后一个观察时段，它开始朝画面边缘移动。计时器快结束了，它却没有任何要配合你的意思。','In the final observation period of the third day, it starts toward the edge of the frame. Your timer is nearly finished, but it shows no interest in cooperating with it.','三日目、最後の観察時間。その個体は画面の端へ向かい始める。タイマーは終わりに近いが、その個体にはそれに合わせる気などない。'],
  options:[
   {id:'departure-ending',label:['那就当作告别吧','Then call it a farewell','じゃあ、別れということにする'],delta:{interpretation:2,labels:1},text:['它没有回头：“结束是你的计时器做的事。”','It does not turn back. “Ending is something your timer does.”','振り返らない。「終わるのは、君のタイマーの仕事だよ。」']},
   {id:'departure-watch',label:['看到它完全离开','Watch until it disappears','完全に見えなくなるまで見る'],delta:{attention:2,quiet:1},text:['最后留在画面里的不是尾端，而是一根触角。下一秒，只剩粉砂和缓慢下沉的颗粒。','The last thing left in frame is not the tail but one antenna. A second later, only silt and slowly falling particles remain.','最後に画面へ残るのは尾端ではなく一本の触角だ。次の瞬間、泥とゆっくり沈む粒子だけになる。']},
   {id:'departure-stop',label:['在它离开前停止记录','Stop recording before it leaves','去る前に記録を止める'],delta:{restraint:2,quiet:2},text:['你先关掉记录。屏幕熄灭前，它还在那里。之后发生的事没有进入你的笔记。','You stop the recording first. It is still there when the screen goes dark. Whatever happens next does not enter your notebook.','先に記録を止める。画面が暗くなる瞬間、その個体はまだそこにいる。その後のことはノートには入らない。']}
  ]
 }
];

export const ABYSSAL_ENDING_DATA={
 'abyssal-untranslated':{
  title:['海底的沉默','Silence on the Seafloor','海底の沈黙'],
  body:['三天里，你问得越来越少，记下的动作越来越多。最后它没有再说话，只沿着粉砂离开。你并没有因此得到一个更完整的答案，却留下了一份没有替沉默补词的记录。','Across three days, you ask fewer questions and record more movement. In the end it says nothing more and simply walks away across the silt. You do not gain a more complete answer, but you leave a record that does not fill silence with words.','三日間、問いは減り、動きの記録が増えていく。最後にその個体はもう何も言わず、泥の上を歩いて去る。完全な答えは得られない。それでも、沈黙へ勝手に言葉を足さない記録が残る。'],
  line:['屏幕熄灭以后，深海还在继续。','After the screen goes dark, the deep sea continues.','画面が消えたあとも、深海は続いている。']
 },
 'abyssal-observer':{
  title:['观察者也在海里','The Observer Is in the Sea','観察者も海の中にいる'],
  body:['你的笔记后来不只写它，也写探照灯、倍率、载具漂移和自己的位置。你原本以为自己隔着玻璃看一片环境，第三天才发现，玻璃、灯光和你早就一起进入了这张图。','Your notes eventually include not only the animal, but the lamp, magnification, vehicle drift, and your own position. You thought you were looking at an environment through glass; by the third day, you realize the glass, the light, and you were already inside the same map.','ノートにはやがて、その個体だけでなく照明、倍率、機体の漂流、自分の位置まで書かれる。ガラス越しに環境を見ているつもりだったが、三日目にはガラスも光も自分も、すでに同じ図の中にいたと分かる。'],
  line:['透明的观察窗从来不在世界之外。','The transparent window was never outside the world.','透明な窓は、世界の外側ではなかった。']
 },
 'abyssal-voice':{
  title:['它叫你的名字','It Says Your Name','オオグソクムシが君の名前を呼ぶ'],
  body:['第三天快结束时，你又问了一次“你是谁”。它没有回答自己的名字，只反问你的名字。你说出来。它把那个名字念了一遍，然后继续往黑暗里走。三天里第一次，你没有马上记录。','Near the end of the third day, you ask once more, “Who are you?” It does not give its own name. It asks for yours instead. You tell it. It repeats your name once, then keeps walking into the dark. For the first time in three days, you do not immediately write anything down.','三日目の終わり近く、もう一度「君は誰？」と聞く。その個体は自分の名前を答えず、代わりに君の名前を聞く。名前を伝えると、一度だけそれを呼び、暗闇へ歩き続ける。三日間で初めて、すぐには何も記録しない。'],
  line:['你记住了它没有说出的名字，它记住了你说出的名字。','You remember the name it never gave; it remembers the name you did.','君はオオグソクムシが言わなかった名前を覚え、その個体は君が言った名前を覚える。']
 },
 'abyssal-between':{
  title:['两种时间','Two Kinds of Time','二つの時間'],
  body:['有时你们说话，有时谁也不说。你的计时器把三天切成九个观察时段，它的路线却从不在整点开始，也不在句号结束。最后留下的是两种时间：一种写进记录，一种继续走向画面之外。','Sometimes you speak; sometimes neither of you does. Your timer divides three days into nine observation periods, while its route never begins on the hour or ends at a full stop. What remains are two kinds of time: one written into the record, the other continuing beyond the frame.','話す時もあれば、どちらも話さない時もある。タイマーは三日を九つの観察時間に切り分けるが、その個体の経路は決してちょうどの時刻に始まらず、句点で終わらない。最後に残るのは二つの時間だ。一つは記録へ入り、もう一つは画面の外へ続いていく。'],
  line:['同一个时刻，可以是一句话，也可以只是一小步。','The same moment can be a sentence, or only a small step.','同じ瞬間は、一文にもなれば、小さな一歩だけにもなる。']
 }
};
