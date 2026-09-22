// Direct narrative for the abyssal habitat.
// It keeps the observation -> choice -> visible consequence rhythm used by the other habitats,
// but the observed animal gradually returns the gaze. No day/period structure is exposed here.
export const ABYSSAL_NODES=[
 {
  id:'light',
  prompt:['探照灯落在粉砂上。光边缘的轮廓没有离开，只把右侧触角慢慢转向观察窗。片刻后，它说：“有光……”','The lamp falls across the silt. The silhouette at its edge does not leave; only the right antenna slowly turns toward the observation window. After a while it says, “There is light…”','探照灯が泥の上に落ちる。光の縁にいる輪郭は離れず、右の触角だけをゆっくり観察窓へ向ける。しばらくして言う。「光がある……」'],
  options:[
   {id:'light-see',label:['“嗯。”','“Mm.”','「うん。」'],delta:{attention:1},text:['灯还落在原处。它没有再说什么，背板边缘在亮处慢慢显出来。','The lamp remains where it is. It says nothing more; the edge of its plates slowly emerges in the light.','灯りはそのまま残る。それ以上は何も言わず、背板の縁が明るいところにゆっくり現れる。']},
   {id:'light-dim',label:['把光束压低一点','Lower the beam a little','光を少し下げる'],delta:{attention:1,restraint:1},text:['亮处往粉砂上退了一截。它没有跟着光走，触角仍朝观察窗这一侧。','The bright patch retreats across the silt. It does not follow the light; the antenna remains turned toward the window.','明るい部分が泥の上を少し退く。光は追わず、触角はまだ観察窓の方を向いている。']},
   {id:'light-silent',label:['看向光外的粉砂','Look at the silt beyond the light','光の外の泥を見る'],delta:{maps:1},text:['光外的粉砂更暗，细粒仍在下落。等你再看回来时，它的触角已经低了一些。','The silt beyond the light is darker, with fine particles still settling. When you look back, its antenna is already lower.','光の外の泥はもっと暗く、細粒がまだ沈んでいる。視線を戻すと、触角は少し下がっている。']}
  ]
 },
 {
  id:'stillness',
  prompt:['位置几乎没有变化。触角扫过砂面，步足也有细小调整。记录栏却很容易只剩下“未移动”。它看着镜头：“不动的时候，也算在记录里吗？”','Its position barely changes. Antennae sweep the silt and the legs make small adjustments. The log could easily collapse all of that into “no movement.” It faces the camera. “Does not moving count as part of the record?”','位置はほとんど変わらない。触角は泥をなぞり、脚もわずかに動く。それでも記録欄には「移動なし」とだけ書けてしまう。カメラを向いたまま聞く。「動かない時も、記録に入るの？」'],
  options:[
   {id:'still-detail',label:['把细小动作也记下','Record the small movements','小さな動きも記す'],delta:{attention:2,labels:1},text:['纸上多了几行。位置没有变，记录却比刚才长。','Several lines are added to the page. The position has not changed, but the record is longer.','紙に数行が増える。位置は変わっていないのに、記録だけが長くなる。']},
   {id:'still-position',label:['只记位置变化','Record position changes only','位置の変化だけ記す'],delta:{interpretation:1,maps:2},text:['两个坐标之间留着一段空白。触角的移动没有进入图里。','A blank remains between two coordinates. The antenna movement never enters the map.','二つの座標のあいだに空白が残る。触角の動きは図には入らない。']},
   {id:'still-blank',label:['这一栏先留空','Leave the field blank','欄を空けておく'],delta:{restraint:2,quiet:1},text:['空栏保留下来。画面没有因此停止。','The blank field remains. The scene does not stop because of it.','空欄だけが残る。それでも画面は止まらない。']}
  ]
 },
 {
  id:'name',
  prompt:['资料栏的名称一直停在画面下方。它从一块小石旁经过，身体短暂挡住其中几个字。等字重新露出来，它问：“那个名字，是给谁看的？”','The archive name remains fixed below the image. It passes a small stone and briefly covers several letters. When the text is visible again, it asks, “Who is that name for?”','資料欄の名前は画面の下に固定されたまま。小石のそばを通る身体が、しばらく文字をいくつか隠す。文字がまた見えると聞く。「その名前は、誰が見るためのもの？」'],
  options:[
   {id:'name-later',label:['给后来看到记录的人','For whoever reads the record later','あとで記録を見る人のため'],delta:{attention:1,labels:2},text:['它继续向前。名字留在原处，像没有跟上。','It continues forward. The name stays where it was, as though it did not follow.','そのまま進む。名前だけが元の場所に残り、ついてこなかったように見える。']},
   {id:'name-archive',label:['给资料库','For the archive','資料庫のため'],delta:{interpretation:1,labels:2},text:['它没有回应。资料栏仍然整齐，石边的足迹已经开始变浅。','It does not answer. The archive field remains orderly while the tracks beside the stone begin to fade.','返事はない。資料欄は整ったまま、石のそばの足跡だけが薄くなり始める。']},
   {id:'name-none',label:['先不解释','Leave it unexplained','説明しない'],delta:{restraint:2,quiet:1},text:['那几个字继续显示。这个问题没有被填进任何一栏。','The text remains on screen. The question is not entered into any field.','文字はそのまま表示される。この問いはどの欄にも書き込まれない。']}
  ]
 },
 {
  id:'food',
  prompt:['一小片有机残屑从黑水里落下。它停了一下，改变方向，慢慢靠近。触角碰到残屑前，它先问：“刚才那一下，会被写成什么？”','A small piece of organic debris falls through the black water. It pauses, changes direction, and slowly approaches. Before the antenna touches the debris, it asks, “What will that just now be written as?”','小さな有機物の破片が黒い水から落ちる。一度止まり、向きを変えてゆっくり近づく。触角が破片に触れる前に聞く。「今のは、何と書かれるの？」'],
  options:[
   {id:'food-route',label:['靠近残屑','Approached the debris','破片へ近づいた'],delta:{attention:2,restraint:1},text:['记录停在动作上。它越过残屑半个身体，又折回来。','The record stops at the movement. It passes half a body length beyond the debris, then turns back.','記録は動作のところで止まる。破片を半体長ほど通り過ぎてから、また戻る。']},
   {id:'food-hunger',label:['觅食','Foraging','採餌'],delta:{interpretation:2,labels:1},text:['“觅食”被写进栏里。它仍没有碰到那片残屑。','“Foraging” enters the field. It still has not touched the debris.','「採餌」と欄に書かれる。それでもまだ破片には触れていない。']},
   {id:'food-wait',label:['先不写动机','Leave the motive unwritten','動機は書かない'],delta:{restraint:2,attention:1,quiet:1},text:['只留下方向变化。过了一会儿，残屑被水带动了一点。','Only the change of direction is kept. After a while, the debris shifts slightly in the water.','方向の変化だけを残す。しばらくして、破片の方が水に押されて少し動く。']}
  ]
 },
 {
  id:'scale',
  prompt:['倍率被调高。背板、步足和触角很快占满观察窗，周围的海底只剩一圈窄边。它靠近镜头：“现在变大的是哪一个？”','Magnification increases. Plates, legs, and antennae soon fill the observation window, leaving only a narrow rim of seafloor. It comes closer to the camera. “Which one became larger just now?”','倍率が上がる。背板、脚、触角が観察窓を埋め、周囲の海底は細い縁だけになる。カメラへ少し近づいて聞く。「今、大きくなったのはどれ？」'],
  options:[
   {id:'scale-body',label:['画面里的身体','The body in the image','画面の中の身体'],delta:{interpretation:2},text:['身体没有改变。画面外能看见的海底变少了。','The body itself has not changed. Less seafloor remains visible outside it.','身体そのものは変わらない。周囲に見える海底だけが減る。']},
   {id:'scale-view',label:['观察窗里的世界','The world inside the window','観察窓の中の世界'],delta:{attention:2,maps:1},text:['倍率被记在页角。刚才同一块石头，现在已经不在画面里。','The magnification is noted in the corner. The same stone from moments ago is now outside the frame.','倍率を頁の隅に記す。さっきまで見えていた同じ石は、もう画面の外にある。']},
   {id:'scale-none',label:['只是比例变了','Only the scale changed','縮尺が変わっただけ'],delta:{restraint:2,maps:1},text:['它没有继续问。画面仍然很满。','It does not ask again. The image remains crowded.','それ以上は聞かない。画面はまだいっぱいのまま。']}
  ]
 },
 {
  id:'background',
  prompt:['它绕过一块石头。仪表仍只显示流速、溶氧和碎屑，石头没有自己的数字。触角擦过石面时，它问：“这个算环境，还是背景？”','It moves around a stone. The instruments still show only flow, oxygen, and detritus; the stone has no number of its own. As an antenna brushes the surface, it asks, “Does this count as environment, or background?”','石を回り込む。計器に出るのは流速、溶存酸素、有機物だけで、石には固有の数字がない。触角が石面に触れた時に聞く。「これは環境？　それとも背景？」'],
  options:[
   {id:'background-env',label:['环境','Environment','環境'],delta:{attention:2,maps:1},text:['地图上多了一个石块的轮廓。它从轮廓旁继续向前。','A stone outline is added to the map. It continues past the outline.','地図に石の輪郭が一つ増える。その輪郭の脇をそのまま進む。']},
   {id:'background-bg',label:['背景','Background','背景として扱う'],delta:{interpretation:1,labels:1},text:['石头留在画面底层。下一次转向仍然发生在它旁边。','The stone remains in the visual background. The next turn still happens beside it.','石は画面の背景に残る。次の方向転換も、その石のそばで起こる。']},
   {id:'background-both',label:['先不分','Do not separate them yet','まだ分けない'],delta:{restraint:2,attention:1},text:['记录里没有新增分类。石头也没有离开原处。','No new category is added to the record. The stone does not leave its place.','記録に新しい分類は増えない。石もその場所を離れない。']}
  ]
 },
 {
  id:'trace',
  prompt:['刚留下的步足痕迹被缓慢落下的细粒盖住。几道线先变浅，再看不见。它停在更远一点的位置：“痕迹没了，刚才那一段还在吗？”','The fresh leg marks are covered by slowly settling particles. The lines fade, then disappear. It stops a little farther away. “If the trace is gone, is that stretch from just now still here?”','さっき残った脚の跡が、ゆっくり沈む細粒に覆われる。線は薄くなり、やがて見えなくなる。少し離れた場所で止まり、聞く。「跡がなくなったら、さっきのあいだはまだある？」'],
  options:[
   {id:'trace-record',label:['记录里还在','It remains in the record','記録には残る'],delta:{labels:2,attention:1},text:['纸上的线没有变浅。海底已经恢复成另一种表面。','The line on paper does not fade. The seafloor has already become another surface.','紙の線は薄くならない。海底の方は、もう別の表面になっている。']},
   {id:'trace-happened',label:['发生过就还在','It remains because it happened','起きたこととして残る'],delta:{interpretation:2},text:['它没有点头，也没有否认。细粒继续落。','It neither agrees nor disagrees. The particles keep falling.','肯定も否定もしない。細粒だけが降り続ける。']},
   {id:'trace-unsure',label:['不知道','Not sure','分からない'],delta:{restraint:2,quiet:1},text:['这一句没有被补成结论。下一道足迹已经出现。','The sentence is not completed into a conclusion. Another track is already appearing.','その言葉は結論に直されない。別の足跡がもう現れている。']}
  ]
 },
 {
  id:'blank',
  prompt:['记录页上有几处空栏。画面里发生过什么，空栏本身看不出来。它在一处阴影里停住：“没有写下来的，会去哪里？”','Several fields on the page are blank. The blanks themselves cannot show what happened in the image. It pauses in a patch of shadow. “Where does what was not written down go?”','記録頁には空欄がいくつかある。空欄そのものから、画面で何が起きたかは分からない。影の中で止まり、聞く。「書かなかったものは、どこへ行くの？」'],
  options:[
   {id:'blank-outside',label:['留在记录外面','Outside the record','記録の外に残る'],delta:{attention:2,restraint:1},text:['页边没有变宽。画面里的阴影仍然比记录多。','The margin does not grow wider. The image still contains more shadow than the record does.','頁の余白は広がらない。画面の影は、記録よりまだ多い。']},
   {id:'blank-space',label:['留在空白里','In the blank','空白に残る'],delta:{interpretation:1,quiet:2},text:['空栏被保留下来，没有加注释。','The blank field is kept without annotation.','空欄はそのまま残され、注釈は足されない。']},
   {id:'blank-unknown',label:['不知道','Not sure','分からない'],delta:{restraint:2,quiet:1},text:['它从阴影里出来。空栏仍然没有答案。','It comes out of the shadow. The blank still has no answer.','影から出てくる。空欄にはまだ答えがない。']}
  ]
 },
 {
  id:'reflection',
  prompt:['观察窗上浮出一层很淡的反光。镜头这一侧的轮廓第一次叠进黑水里。它停了一会儿，看着那层反光：“这个也算画面里的东西吗？”','A faint reflection appears on the observation window. For the first time, a shape from this side of the glass overlaps the black water. It pauses and looks at the reflection. “Does this count as something in the image too?”','観察窓にごく薄い反射が浮かぶ。ガラスのこちら側の輪郭が、初めて黒い水に重なる。少し止まり、その反射を見て聞く。「これも画面の中のものになる？」'],
  options:[
   {id:'reflection-clear',label:['把反光避开','Move out of the reflection','反射から外れる'],delta:{restraint:1,attention:1},text:['镜头这边的轮廓消失了。黑水重新显得完整。观察窗仍在原处。','The shape on this side disappears. The black water looks whole again. The observation window remains where it was.','こちら側の輪郭は消える。黒い水はまた一続きに見える。観察窓そのものは同じ場所に残る。']},
   {id:'reflection-note',label:['把反光也记在旁边','Note the reflection as well','反射も脇に記す'],delta:{attention:2,maps:1},text:['页边多了一句很短的注记。画面里的身体没有因此换位置。','A short note is added in the margin. The body in the image does not change position because of it.','頁の端に短い注記が増える。画面の身体は、それで位置を変えるわけではない。']},
   {id:'reflection-leave',label:['先不处理','Leave it alone','そのままにする'],delta:{quiet:2,restraint:1},text:['两个轮廓短暂重在一起。过了一会儿，水流让反光自己散开。','The two silhouettes overlap briefly. After a while, the reflection breaks apart on its own as the water shifts.','二つの輪郭がしばらく重なる。やがて水の揺れで、反射の方が自然にほどける。']}
  ]
 },
 {
  id:'offering',
  prompt:['机械臂边缘掉下一小片残屑。它没有立刻靠近，先看了看残屑，又转向观察窗：“这个是海底的一部分，还是你带来的？”','A small fragment falls from the edge of the manipulator. It does not approach at once. It looks at the fragment, then toward the observation window. “Is this part of the seafloor, or something you brought?”','マニピュレーターの縁から小さな破片が落ちる。すぐには近づかず、破片を見てから観察窓へ向く。「これは海底の一部？　それとも君が持ってきたもの？」'],
  options:[
   {id:'offering-food',label:['先记作食物','Record it as food for now','ひとまず食物と記す'],delta:{interpretation:2,labels:1},text:['“食物”进入记录。残屑还没有被吃。','“Food” enters the record. The fragment has not been eaten.','「食物」と記録される。破片はまだ食べられていない。']},
   {id:'offering-intervention',label:['记作一次干预','Record an intervention','介入として記す'],delta:{attention:2,restraint:1},text:['记录里多出一个来自观察窗这一侧的动作。残屑仍躺在粉砂上。','An action originating from this side of the observation window enters the record. The fragment still lies on the silt.','観察窓のこちら側から起きた動作が記録に加わる。破片はまだ泥の上にある。']},
   {id:'offering-fall',label:['只记它落下','Record only that it fell','落ちたことだけ記す'],delta:{restraint:2,quiet:1},text:['记录停在落下这一刻。它后来是否靠近，被留到下一行。','The record stops at the fall itself. Whether it later approaches is left for another line.','記録は落下した瞬間で止まる。その後近づくかどうかは、次の行へ残される。']}
  ]
 },
 {
  id:'specimen',
  prompt:['资料库窗口被短暂调到前景。编号、学名、采集栏和固定的背面图像盖住了海底的一角。它从窗口后方经过，只露出几节步足：“这里已经有一页了，为什么还要看这里？”','The archive window briefly moves to the foreground. A number, scientific name, collection fields, and a fixed dorsal image cover part of the seafloor. It passes behind the window with only a few legs visible. “There is already a page here. Why keep looking here?”','資料庫の窓が短く前面に出る。番号、学名、採集欄、固定された背面像が海底の一部を覆う。その窓の後ろを通り、数本の脚だけが見える。「もう一頁あるのに、どうしてまだここを見るの？」'],
  options:[
   {id:'specimen-update',label:['为了补全资料','To complete the record','資料を補うため'],delta:{labels:2,interpretation:1},text:['资料页多了一行。海底的画面没有因此少掉一处未知。','A line is added to the archive page. The seafloor image does not lose an unknown because of it.','資料頁に一行増える。それでも海底の画面から未知が一つ減るわけではない。']},
   {id:'specimen-now',label:['这一页没有现在','The page does not contain now','この頁には「今」がない'],delta:{attention:2,quiet:1},text:['资料库窗口被移到一旁。刚才被遮住的位置已经没有身体。','The archive window is moved aside. The place it covered no longer contains the body.','資料庫の窓を脇へ寄せる。さっき隠れていた場所には、もう身体はいない。']},
   {id:'specimen-noanswer',label:['不回答','Do not answer','答えない'],delta:{restraint:2,quiet:1},text:['窗口仍开着。它从窗口另一侧重新出现，没有再问。','The window remains open. It reappears on the other side and does not ask again.','窓は開いたまま。その反対側からまた現れ、それ以上は聞かない。']}
  ]
 },
 {
  id:'observer',
  prompt:['载具轻微漂移，探照灯从背板上滑开。它随即转向更暗的一侧。灯和身体几乎同时改变了位置。它问：“刚才是谁先动的？”','The vehicle drifts slightly and the lamp slides off its plates. It turns toward the darker side almost at once. Light and body have both changed position. It asks, “Which one moved first just now?”','機体がわずかに流れ、探照灯が背板から外れる。ほとんど同時に、暗い方へ向きを変える。光と身体の位置がどちらも変わった。聞く。「今、先に動いたのはどっち？」'],
  options:[
   {id:'observer-light',label:['灯先动','The light moved first','灯りが先'],delta:{attention:2,maps:1},text:['灯光移动的时刻被单独记下。转向写在下一行。两行没有连成箭头。','The lamp movement is recorded separately. The turn is written on the next line. No arrow joins them.','灯りが動いた時を別に記す。向きの変化は次の行に書く。二行は矢印で結ばない。']},
   {id:'observer-body',label:['身体先动','The body moved first','身体が先'],delta:{interpretation:2},text:['这个顺序被写下。载具仍在缓慢漂移。','That order is written down. The vehicle is still drifting slowly.','その順番を書き込む。機体はまだゆっくり流れている。']},
   {id:'observer-mixed',label:['分不开','Cannot separate them','分けられない'],delta:{restraint:2,attention:1},text:['两次变化被放在同一行。没有主语。','Both changes are placed on the same line. There is no subject.','二つの変化を同じ行に置く。主語はない。']}
  ]
 },
 {
  id:'translation',
  prompt:['水下麦克风里只剩短促的摩擦声。它没有靠近，也没有离开。过了一会儿，又问：“回答了，就算听懂了吗？”','Only brief scraping sounds remain in the underwater microphone. It neither approaches nor leaves. After a while it asks, “If there is an answer, does that mean it was understood?”','水中マイクには短い擦過音だけが残る。近づきも離れもしない。しばらくしてまた聞く。「答えが返れば、分かったことになるの？」'],
  options:[
   {id:'translation-yes',label:['至少算一种听懂','At least one kind of understanding','少なくとも一つの理解'],delta:{interpretation:2},text:['这句话被麦克风完整收下。摩擦声没有变得更清楚。','The microphone captures the sentence clearly. The scraping does not become clearer.','その言葉はマイクにきれいに入る。擦過音の方は、少しも明瞭にならない。']},
   {id:'translation-no',label:['回答和听懂不是一回事','Answering and understanding differ','答えることと理解は別'],delta:{restraint:2,attention:1},text:['它停了一会儿。下一次声音更短，仍然没有字幕。','It pauses. The next sound is shorter and still has no subtitle.','少し止まる。次の音はもっと短く、やはり字幕はない。']},
   {id:'translation-watch',label:['先继续观察','Keep observing','観察を続ける'],delta:{attention:2,quiet:1},text:['麦克风继续开着。记录里只写下声音出现的位置。','The microphone stays on. The record notes only where the sound occurred.','マイクはつけたままにする。記録には音が出た位置だけを書く。']}
  ]
 },
 {
  id:'frame',
  prompt:['它沿粉砂向画面边缘移动。身体的一部分先消失，触角还留在镜头里。它没有回头：“出了画面，还算这次观察吗？”','It moves across the silt toward the edge of the image. Part of the body disappears first while an antenna remains in frame. Without turning back, it asks, “Once it leaves the image, is it still part of this observation?”','泥の上を画面の端へ進む。身体の一部が先に消え、触角だけがまだ残る。振り返らずに聞く。「画面を出たあとも、この観察の中にいる？」'],
  options:[
   {id:'frame-yes',label:['还算','It still counts','まだ入る'],delta:{attention:2,maps:1},text:['记录继续了一行。画面里已经只剩触角尖。','The record continues for one more line. Only the tip of an antenna remains in the image.','記録はもう一行続く。画面には触角の先だけが残っている。']},
   {id:'frame-no',label:['到画面为止','Only up to the frame','画面まで'],delta:{labels:2,interpretation:1},text:['句号落在身体消失的位置。镜头外没有跟着出现句号。','The full stop is placed where the body disappears. Nothing outside the frame receives one.','身体が消えた位置に句点を置く。画面の外には句点は現れない。']},
   {id:'frame-open',label:['先不划边界','Leave the boundary open','境界を決めない'],delta:{restraint:2,quiet:1},text:['这一行没有收尾。触角随后也离开画面。','The line is left unfinished. The antenna then leaves the image as well.','その行は終わらせない。やがて触角も画面から消える。']}
  ]
 },
 {
  id:'ending',
  prompt:['画面里只剩粉砂、石块和缓慢落下的颗粒。过了一会儿，触角又从边缘短暂出现。它问了最后一句：“到这里，算结束吗？”','Only silt, stones, and slowly settling particles remain in the image. After a while an antenna briefly reappears at the edge. It asks one last question. “Does this count as an ending?”','画面に残るのは泥、石、ゆっくり沈む粒だけ。しばらくして、触角が端から短く現れる。最後に一つだけ聞く。「ここまでで、終わりになる？」'],
  options:[
   {id:'ending-close',label:['到这里','End here','ここまで'],delta:{labels:1,restraint:1},text:['记录停在这一行。触角没有再次出现。','The record stops on this line. The antenna does not appear again.','記録はこの行で止まる。触角はもう現れない。']},
   {id:'ending-watch',label:['再看一会儿','Keep watching','もう少し見る'],delta:{attention:2,quiet:1},text:['画面没有新的动作。粉砂仍在缓慢改变表面。','No new movement enters the image. The silt continues slowly changing the surface.','新しい動きは画面に入らない。泥だけがゆっくり表面を変え続ける。']},
   {id:'ending-silent',label:['不回答','Do not answer','答えない'],delta:{restraint:2,quiet:1},text:['麦克风没有收到回答。记录仍然需要在某处停下。','The microphone receives no answer. The record still has to stop somewhere.','マイクに返事は入らない。それでも記録はどこかで止まる必要がある。']}
  ]
 }
];

export const ABYSSAL_FRAGMENT_DATA={
 position:{
  glass:{
   title:['观察窗两侧','Both Sides of the Window','観察窓の両側'],
   body:['这一次观察没有只留下它的位置。灯光、镜头和观察窗这一侧，也在几处记录里露了出来。','This observation did not leave only its position behind. The light, the camera, and this side of the window also appear in several entries.','今回の観察に残ったのは、その身体の位置だけではない。灯り、カメラ、観察窓のこちら側も、いくつかの記録に現れている。']
  },
  drift:{
   title:['几次移动之间','Between Movements','いくつかの移動のあいだ'],
   body:['后来再看这些记录，很难说究竟是哪一刻开始成为“观察”的：有些发生在它移动时，有些发生在你改变位置之前。','Looking back, it is hard to say exactly when these moments became “observation”: some happened while it moved, others before you changed position.','あとから記録を見返すと、どの瞬間から「観察」になったのかはっきりしない。身体が動いていた時もあれば、こちらが位置を変える前に起きたこともある。']
  },
  edge:{
   title:['停在边缘的地方','Where It Stops at the Edge','縁で止まる場所'],
   body:['几次最清楚的记录都停在边缘：光照不到的地方、画面之外、石块后面，或一句话还没说完的位置。','Several of the clearest entries stop at an edge: beyond the light, outside the frame, behind a stone, or where a sentence remains unfinished.','いくつかの最も鮮明な記録は、縁で止まっている。光の届かない場所、画面の外、石の向こう、あるいは文が終わる前の位置。']
  }
 },
 record:{
  names:{
   body:['名字和分类确实让一些东西变得容易返回，但它们没有和眼前的身体完全重合。','Names and categories do make some things easier to return to, but they never fully overlap the body in view.','名前や分類によって戻りやすくなるものはあるが、目の前の身体と完全に重なることはない。']
  },
  traces:{
   body:['纸上留下的多是方向、停顿、时间和已经消失的痕迹；它们彼此并不总能拼成同一种解释。','What remains on paper is mostly direction, pauses, time, and traces already gone; they do not always assemble into the same explanation.','紙に残るのは、方向、停止、時間、すでに消えた痕跡が多い。それらがいつも同じ説明へまとまるわけではない。']
  },
  gaps:{
   body:['也有几处没有被补上。空栏没有替现场说话，只保留了当时没有写下来的那一部分。','Some places were never filled in. The blank fields do not speak for the scene; they only preserve what was not written at the time.','埋められなかった場所もある。空欄は現場の代わりに語らず、その時に書かれなかった部分だけを残している。']
  }
 },
 remainder:{
  field:{
   body:['最后留下的不像一个结论，更像一次相遇里双方各自移动过的位置。','What remains is less a conclusion than the positions through which both sides moved during an encounter.','最後に残るのは結論というより、一度の出会いの中で両側がそれぞれ動いた位置に近い。'],
   line:['相遇发生过，不必先被归成一种类型。','An encounter need not become a type before it can have happened.','出会いは、先に一つの型へ分類されなくても起こりうる。']
  },
  return:{
   body:['如果以后再打开这份记录，能返回的也许只是这些句子，而不是当时那片海底。','If this record is opened again, what can be returned to may be only these sentences, not that seafloor at that moment.','あとでこの記録を開き直しても、戻れるのはこの文だけで、あの時の海底ではないのかもしれない。'],
   line:['能返回的东西，不一定仍停在原处。','What can be returned to need not still be where it was.','戻れるものが、同じ場所に留まっているとは限らない。']
  },
  intervention:{
   body:['观察没有只从现场取走东西；灯光、机械臂、分类和等待本身，也曾进入现场。','Observation did not only take things from the scene; light, the manipulator, classification, and waiting also entered it.','観察は現場から何かを受け取るだけではなかった。灯り、マニピュレーター、分類、待つことそのものも現場へ入っていた。'],
   line:['观察留下记录，也留下条件。','Observation leaves records, and also conditions.','観察は記録だけでなく、条件も残す。']
  },
  open:{
   body:['记录在这里停下，但有些事情没有因此获得句号。','The record stops here, but some things do not receive a full stop because of it.','記録はここで止まる。それでも、いくつかのことに句点が付くわけではない。'],
   line:['停下和结束不是同一个动作。','Stopping and ending are not the same action.','止めることと、終わることは同じ動作ではない。']
  }
 }
};

export const ABYSSAL_ENDING_DATA={
 'abyssal-untranslated':{
  title:['未译部分','Untranslated Part','未訳の部分'],
  body:['记录里保留了许多没有被解释的动作：一次转向，一次停留，一段没有字幕的声音。它们没有因此变得更完整，也没有被删掉。最后留下的只是观察能够到达的位置。','The record keeps many actions without explanation: a turn, a pause, a sound with no subtitle. They are neither completed by interpretation nor removed. What remains is simply where observation could reach.','記録には、説明されない動きが多く残る。向きの変化、停止、字幕のない音。解釈で完成させることも、消すこともしない。最後に残るのは、観察が届いた場所だけ。'],
  line:['没有译出的部分，也在记录里。','What was not translated is still in the record.','訳されなかった部分も、記録の中にある。']
 },
 'abyssal-field':{
  title:['观察窗以内','Inside the Observation Window','観察窓の内側'],
  body:['后来留下的不只有身体的位置。灯光、倍率、石块、载具漂移，也一并进入记录。观察窗没有消失，只是不再被当作世界的外侧。','The later record contains more than the body’s position. Light, magnification, stones, and vehicle drift enter it as well. The observation window does not vanish; it simply stops being treated as outside the world.','後に残る記録には、身体の位置だけでなく、灯り、倍率、石、機体の漂流も入る。観察窓は消えない。ただ、世界の外側として扱われなくなる。'],
  line:['透明，不等于不在场。','Transparent does not mean absent.','透明であることは、不在であることではない。']
 },
 'abyssal-voice':{
  title:['问句留下','The Question Remains','問いが残る'],
  body:['几次回答之后，纸上留下的反而是问句。名字、动机、边界和结束都得到过解释，却没有哪一个解释能把画面固定下来。最后一行仍然带着问号。','After several answers, the questions are what remain on the page. Names, motives, boundaries, and endings all receive explanations, yet none of them fixes the image in place. The final line still carries a question mark.','いくつか答えたあと、頁に残るのはむしろ問いの方だった。名前、動機、境界、終わりには説明がついたが、どの説明も画面を固定できない。最後の行にはまだ疑問符がある。'],
  line:['回答写得比问题整齐。','Answers are written more neatly than questions.','答えの方が、問いより整って書かれる。']
 },
 'abyssal-margin':{
  title:['页边','At the Margin','頁の余白'],
  body:['几处空栏和没有写完的句子被原样留下。记录没有因此少一页，只是页边比别处更安静。后来再打开时，最先看见的反而是那些没有被填满的位置。','Several blank fields and unfinished sentences are left as they are. The record is not missing a page; its margins are simply quieter. When opened again, the unfilled places are what appear first.','いくつかの空欄と書き終えなかった文をそのまま残す。記録から頁が欠けるわけではなく、余白だけが少し静かになる。あとで開くと、最初に目に入るのは埋まらなかった場所だった。'],
  line:['空白没有替任何东西说话。','The blank speaks for nothing.','空白は、何かの代わりに語らない。']
 },
 'abyssal-label':{
  title:['标签朝外','Label Facing Outward','外を向くラベル'],
  body:['名称、动作和位置被写得很清楚。标签帮助下一次查找，也把许多连续的东西切成可以归档的单位。标本页因此很整齐，海底没有跟着变整齐。','Names, actions, and positions are written clearly. Labels help the next search and divide continuous things into units that can be archived. The specimen page becomes orderly; the seafloor does not.','名前、動作、位置は明確に書かれる。ラベルは次の検索を助け、連続したものを保管できる単位へ切り分ける。標本頁は整うが、海底まで整うわけではない。'],
  line:['标签总是朝向读它的人。','A label always faces its reader.','ラベルはいつも、それを読む側を向く。']
 },
 'abyssal-map':{
  title:['不完整的底图','Incomplete Base Map','不完全な底図'],
  body:['石块、光斑、足迹和画面边缘被逐一画下。地图越来越有用，也越来越明确地显示出没有被画进去的部分。最后一个轮廓停在纸边。','Stones, light patches, tracks, and frame edges are drawn one by one. The map becomes more useful and also makes clearer what was never drawn into it. The final outline stops at the edge of the page.','石、光の斑点、足跡、画面の縁を一つずつ描く。地図は役に立つようになり、同時に描かれなかった部分もはっきりする。最後の輪郭は紙の端で止まる。'],
  line:['地图的边缘不是海底的边缘。','The edge of the map is not the edge of the seafloor.','地図の端は、海底の端ではない。']
 },
 'abyssal-frame':{
  title:['画面之外','Outside the Frame','画面の外'],
  body:['记录持续到身体离开镜头之后。看不见的部分没有因此获得新的图像，只是被承认还可能继续。最后，画面里只剩粉砂，记录却没有把粉砂写成终点。','The record continues after the body leaves the camera. The unseen part gains no new image; it is only allowed to keep going. In the end only silt remains on screen, but the record does not turn the silt into an endpoint.','身体がカメラを離れたあとも記録は続く。見えない部分に新しい映像が与えられるわけではなく、ただ続いている可能性を残す。最後に画面へ泥だけが残っても、それを終点とは書かない。'],
  line:['看不见以后，边界才开始显眼。','The boundary becomes visible after sight ends.','見えなくなってから、境界の方が目立ち始める。']
 },
 'abyssal-name':{
  title:['档案中的名字','The Name in the Archive','資料庫の名前'],
  body:['名称被反复使用，却没有一次和身体完全重合。它帮助打开正确的页面，帮助找到同一条记录，也始终留在页面这一侧。画面里的身体早已换过位置。','The name is used repeatedly, yet never fully overlaps the body. It opens the right page and retrieves the same record, while remaining on this side of the page. The body in the image has long since changed position.','名前は何度も使われるが、身体と完全に重なることはない。正しい頁を開き、同じ記録を探す役には立つが、ずっと頁のこちら側に残る。画面の身体はとっくに位置を変えている。'],
  line:['名字便于返回，不负责停留。','A name helps one return; it does not make anything stay.','名前は戻るために役立つが、留まらせるものではない。']
 },
 'abyssal-silt':{
  title:['粉砂复原','Silt Restored','泥が戻る'],
  body:['足迹一度清楚，随后被细粒覆盖。没有补画消失的部分，也没有把消失写成缺失。海底恢复成近似原来的表面，记录保留着那次差异。','Tracks are clear for a while, then covered by fine particles. The vanished parts are neither redrawn nor treated as missing. The seafloor returns to something like its earlier surface while the record keeps the difference.','足跡はいったん鮮明になり、やがて細粒に覆われる。消えた部分を描き足すことも、欠落と書くこともしない。海底は元に近い表面へ戻り、記録だけがその差を残す。'],
  line:['痕迹消失，不等于从未经过。','A vanished trace is not the same as no passage.','跡が消えることと、通らなかったことは同じではない。']
 },
 'abyssal-return':{
  title:['回看','Looking Back','見返す'],
  body:['解释和观察交替写在同一份记录里。回看时，很难再把哪一句完全归给身体，哪一句完全归给观察者。两边都留下了痕迹，也都没有成为最后的说明。','Interpretation and observation alternate in the same record. On rereading, it becomes difficult to assign any sentence entirely to the body or entirely to the observer. Both leave traces; neither becomes the final explanation.','解釈と観察が同じ記録の中で交互に書かれる。読み返すと、どの文を完全に身体へ、どの文を完全に観察者へ帰せるのか分からなくなる。両方が跡を残し、どちらも最後の説明にはならない。'],
  line:['记录也有自己的观察位置。','A record has its own position of observation.','記録にも、観察する位置がある。']
 },
 'abyssal-blank':{
  title:['空栏','Blank Field','空欄'],
  body:['有些地方没有命名，没有箭头，也没有补上原因。它们在纸上只表现为空白，却并不因此等同于什么都没有发生。下一次打开资料库时，这些空栏仍在。','Some places receive no name, arrow, or added cause. On paper they appear only as blanks, but that does not make them equivalent to nothing having happened. The fields are still blank when the archive is opened again.','名前も矢印も原因も足されなかった場所がある。紙の上では空白にしか見えないが、何も起きなかったことと同じではない。次に資料庫を開いた時も、その欄は空いたまま残る。'],
  line:['不知道，也是一种被保留下来的状态。','Not knowing can also be a preserved state.','分からないことも、残しておける状態の一つ。']
 },
 'abyssal-reflection':{
  title:['玻璃上的第二个轮廓','The Second Silhouette on the Glass','ガラスの二つ目の輪郭'],
  body:['有一刻，观察窗两边的轮廓叠在同一幅画面里。后来反光散去，记录却留下了这一处不太容易归类的位置。它既不是海底的身体，也不完全在画面之外。','For a moment, silhouettes from both sides of the observation window overlap in one image. The reflection later disappears, but the record keeps a position that is difficult to classify: neither a body on the seafloor nor entirely outside the frame.','一度だけ、観察窓の両側の輪郭が同じ画面に重なる。反射はやがて消えるが、記録には分類しにくい位置が残る。海底の身体でもなく、完全に画面の外でもない。'],
  line:['观察者也会留下轮廓。','An observer can leave a silhouette too.','観察者にも輪郭は残る。']
 },
 'abyssal-offering':{
  title:['落下的东西','What Fell Down','落ちてきたもの'],
  body:['一小片残屑后来进入了海底，也进入了记录。它可以被写作食物、干预，或只是一次落下。名称不同，落下这件事没有重来。观察从来不只收集现场，也会给现场增加东西。','A small fragment eventually enters both the seafloor and the record. It can be written as food, intervention, or simply a fall. The names differ; the fall does not happen again. Observation does not only collect a field. It also adds things to it.','小さな破片が海底と記録の両方へ入る。食物、介入、ただの落下と書くことができる。呼び方は違っても、落下そのものはやり直されない。観察は現場を集めるだけでなく、現場へ何かを加えることもある。'],
  line:['记录现场的时候，现场也在记录动作。','While the field is recorded, it also retains the action.','現場を記録する時、現場の方にも動作が残る。']
 },
 'abyssal-specimen':{
  title:['已经存在的一页','A Page That Already Exists','すでにある一頁'],
  body:['资料库里早已有编号、名称和固定的图像。继续观察并没有让那一页失效，也没有让眼前的身体变成多余。档案保存可以返回的东西，现场保留无法被提前写完的部分。','The archive already contains a number, a name, and a fixed image. Continued observation neither invalidates that page nor makes the body in view redundant. The archive preserves what can be returned to; the field keeps what cannot be finished in advance.','資料庫にはすでに番号、名前、固定された画像がある。観察を続けてもその頁は無効にならず、目の前の身体も余分にはならない。資料庫は戻れるものを残し、現場はあらかじめ書き終えられない部分を残す。'],
  line:['一页资料可以完成，遭遇不一定。','A page can be completed; an encounter need not be.','一頁の資料は完成できても、出会いまで完成するとは限らない。']
 },
 'abyssal-between':{
  title:['两边都没有结论','No Conclusion on Either Side','どちら側にも結論はない'],
  body:['有时回答，有时只记录，有时什么也没有补上。问句和动作没有排成同一种顺序。最后的页面因此不太像结论，更像一次相遇留下的几种不同痕迹。','Sometimes there is an answer, sometimes only a record, sometimes nothing is added. Questions and movements never settle into the same order. The final page reads less like a conclusion than several kinds of trace left by an encounter.','答える時もあれば、記録だけの時もあり、何も足さない時もある。問いと動きは同じ順序には並ばない。最後の頁は結論というより、一度の出会いが残したいくつかの異なる跡に近い。'],
  line:['相遇不一定需要归类以后才成立。','An encounter does not need a category in order to have happened.','出会いは、分類されてから成立するものではない。']
 }
};


for(const [positionId,position] of Object.entries(ABYSSAL_FRAGMENT_DATA.position)){
 for(const [recordId,record] of Object.entries(ABYSSAL_FRAGMENT_DATA.record)){
  for(const [remainderId,remainder] of Object.entries(ABYSSAL_FRAGMENT_DATA.remainder)){
   ABYSSAL_ENDING_DATA[`abyssal-record-${positionId}-${recordId}-${remainderId}`]={
    title:position.title,
    body:[
     position.body[0]+record.body[0]+remainder.body[0],
     position.body[1]+' '+record.body[1]+' '+remainder.body[1],
     position.body[2]+record.body[2]+remainder.body[2]
    ],
    line:remainder.line
   };
  }
 }
}
