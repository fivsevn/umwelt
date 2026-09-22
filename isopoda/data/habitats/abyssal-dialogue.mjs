// Direct narrative for the abyssal habitat.
// The animal speaks sparsely. Meaning is allowed to emerge from repeated observation,
// rather than from explicit philosophical questions or a stable A/B/C response grammar.
export const ABYSSAL_NODES=[
 {
  id:'light',
  prompt:['探照灯落在粉砂上。光边缘的轮廓没有离开，只把右侧触角慢慢转向观察窗。片刻后，它说：“有光……”','The lamp falls across the silt. The silhouette at its edge does not leave; only the right antenna slowly turns toward the observation window. After a while it says, “There is light…”','探照灯が泥の上に落ちる。光の縁にいる輪郭は離れず、右の触角だけをゆっくり観察窓へ向ける。しばらくして言う。「光がある……」'],
  options:[
   {id:'light-see',label:['“嗯。”','“Mm.”','「うん。」'],delta:{attention:1},text:['灯还落在原处。它没有再说什么，背板边缘在亮处慢慢显出来。','The lamp remains where it is. It says nothing more; the edge of its plates slowly emerges in the light.','灯りはそのまま残る。それ以上は何も言わず、背板の縁が明るいところにゆっくり現れる。']},
   {id:'light-dim',label:['把光束压低一点','Lower the beam a little','光を少し下げる'],delta:{attention:1,restraint:1},text:['亮处往粉砂上退了一截。它没有跟着光走，触角仍朝观察窗这一侧。','The bright patch retreats across the silt. It does not follow the light; the antenna remains turned toward the window.','明るい部分が泥の上を少し退く。光は追わず、触角はまだ観察窓の方を向いている。']},
   {id:'light-silent',label:['看向光外的粉砂','Look at the silt beyond the light','光の外の泥を見る'],delta:{maps:1},text:['光外更暗。细粒还在落。等你看回来时，它的触角已经低了一些。','It is darker beyond the beam. Fine particles are still settling. When you look back, its antenna is already lower.','光の外はもっと暗い。細粒はまだ沈んでいる。視線を戻すと、触角は少し下がっている。']}
  ]
 },
 {
  id:'stillness',
  prompt:['它在原处停了很久。触角贴着粉砂慢慢扫过，几只步足换了支点。屏幕上的坐标没有变。它说：“这里没变。”','It stays in the same place for a long time. Its antennae sweep slowly over the silt and several legs shift their footing. The coordinates on screen do not change. It says, “This stayed the same.”','長いあいだ同じ場所にいる。触角は泥をゆっくりなぞり、何本かの脚が支点を変える。画面の座標は変わらない。「ここは変わってない」と言う。'],
  options:[
   {id:'still-detail',label:['记下触角那一下','Note the antenna movement','触角の動きを記す'],delta:{attention:1},text:['时间后面多了一小句。坐标仍是刚才那个。','A short phrase is added after the time. The coordinates remain the same.','時刻のあとに短い一文が増える。座標はさっきのまま。']},
   {id:'still-position',label:['在坐标旁写上时间','Write the time beside the coordinates','座標の脇に時刻を書く'],delta:{attention:1},text:['同一个位置旁出现了两个时间。中间发生过什么，没有被压成一条线。','Two times now sit beside the same position. What happened between them is not compressed into a line.','同じ位置の脇に二つの時刻が並ぶ。そのあいだに起きたことは一本の線にはされない。']},
   {id:'still-blank',label:['让录像继续','Keep the recording running','録画を続ける'],delta:{},text:['记录栏没有新增文字。画面里的细小动作还在继续。','No new text enters the log. The small movements in the image continue.','記録欄に文字は増えない。画面の小さな動きは続いている。']}
  ]
 },
 {
  id:'name',
  prompt:['资料栏一直贴在画面下方。它经过一块小石时，身体短暂挡住了学名。字重新露出来后，它停了一下：“这个很长。”','The archive field remains along the bottom of the image. As it passes a small stone, its body briefly covers the scientific name. When the letters reappear, it pauses. “That is long.”','資料欄は画面の下に残っている。小石のそばを通る時、身体が学名をしばらく隠す。文字がまた現れると少し止まり、「長いね」と言う。'],
  options:[
   {id:'name-later',label:['把名字念一遍','Read the name aloud once','名前を一度読む'],delta:{labels:1},text:['声音结束后，那串字还在原来的位置。它已经往前走了一点。','When your voice ends, the string of letters is still where it was. It has moved a little farther on.','声が終わっても文字列は同じ場所にある。身体は少し先へ進んでいる。']},
   {id:'name-archive',label:['看一眼编号','Look at the specimen number','番号を見る'],delta:{labels:1},text:['编号没有变化。石边新留下了一道很浅的足迹。','The number does not change. A faint new track appears beside the stone.','番号は変わらない。石のそばに新しい薄い足跡が残る。']},
   {id:'name-none',label:['把资料栏收起来','Hide the archive panel','資料欄を閉じる'],delta:{},text:['画面下方空出一截。它从那块空出来的地方经过。','A strip at the bottom of the image becomes empty. It passes through the space that has opened up.','画面の下に少し空きができる。身体はその空いた場所を通っていく。']}
  ]
 },
 {
  id:'food',
  prompt:['一小片有机残屑从黑水里落下来。它停了一下，转过去，慢慢靠近。残屑也被水推着移动。它说：“它也在走。”','A small piece of organic debris falls through the black water. It pauses, turns, and slowly approaches. The fragment is also being pushed along by the water. It says, “It is moving too.”','小さな有機物の破片が黒い水から落ちてくる。一度止まり、向きを変えてゆっくり近づく。破片の方も水に押されて動いている。「あれも動いてる」と言う。'],
  options:[
   {id:'food-route',label:['在纸上点一下落点','Mark the landing point','落ちた場所に点を打つ'],delta:{attention:1},text:['纸上多了一个点。它越过那个位置半个身体，又折回来。','A dot appears on the page. It passes half a body length beyond that position, then turns back.','紙に点が一つ増える。その位置を半体長ほど通り過ぎてから、また戻る。']},
   {id:'food-hunger',label:['写下“靠近残屑”','Write “approached fragment”','「破片へ近づく」と書く'],delta:{attention:1},text:['这几个字写完时，它还没有碰到残屑。水先把残屑推远了一点。','By the time the words are written, it still has not touched the fragment. The water moves the fragment a little farther first.','書き終えた時も、まだ破片には触れていない。先に水が破片を少し遠ざける。']},
   {id:'food-wait',label:['等它碰到再写','Wait until contact before writing','触れてから書く'],delta:{},text:['笔停着。触角先碰到粉砂，随后才碰到残屑。','The pen waits. The antenna touches the silt first, then the fragment.','ペンは止まったまま。触角は先に泥へ触れ、そのあと破片へ触れる。']}
  ]
 },
 {
  id:'scale',
  prompt:['倍率被调高。背板、步足和触角很快占满观察窗，刚才那块石头退到画面外。它靠近镜头：“石头不见了。”','Magnification increases. Plates, legs, and antennae soon fill the observation window, and the stone from moments ago slips outside the frame. It comes closer to the camera. “The stone is gone.”','倍率が上がる。背板、脚、触角が観察窓を埋め、さっきの石は画面の外へ出る。カメラへ少し近づき、「石がいなくなった」と言う。'],
  options:[
   {id:'scale-body',label:['数一节背板','Count one body plate','背板を一節数える'],delta:{attention:1},text:['一节背板占了屏幕很大一块。计数结束时，石头仍然不在画面里。','One plate occupies a large part of the screen. When the count ends, the stone is still outside the frame.','一節の背板が画面の大きな部分を占める。数え終えても、石はまだ画面の外にある。']},
   {id:'scale-view',label:['把倍率记在角上','Note the magnification in the corner','倍率を隅に記す'],delta:{maps:1},text:['角落多了一个数字。身体和海底没有因此缩回去。','A number appears in the corner. Neither the body nor the seafloor shrinks back because of it.','隅に数字が一つ増える。それで身体や海底が元の大きさへ戻るわけではない。']},
   {id:'scale-none',label:['退回刚才的倍率','Return to the previous magnification','さっきの倍率へ戻す'],delta:{attention:1},text:['石头重新进入画面。它已经不在刚才的位置。','The stone comes back into view. It is no longer in the same place relative to the body.','石がまた画面に入る。身体との位置関係はもうさっきと同じではない。']}
  ]
 },
 {
  id:'background',
  prompt:['它绕过一块石头。触角贴着石面滑过去，身体在背流的一侧停得更久。仪表没有专门显示这块石头。它说：“这里凉一点。”','It moves around a stone. An antenna slides along the surface, and the body lingers longer on the lee side. No instrument has a reading specifically for the stone. It says, “It is a little cooler here.”','石を回り込む。触角が石面をなぞり、流れの陰になる側で身体が少し長く止まる。計器にはこの石だけの数値はない。「ここ、少し冷たい」と言う。'],
  options:[
   {id:'background-env',label:['把石头也画进去','Draw the stone as well','石も描き込む'],delta:{maps:1},text:['地图上多了一个不规则的轮廓。下一次转向正好发生在它旁边。','An irregular outline appears on the map. The next turn happens beside it.','地図に不規則な輪郭が一つ増える。次の方向転換はそのすぐ脇で起こる。']},
   {id:'background-bg',label:['只记转向的位置','Record only the turn','曲がった位置だけ記す'],delta:{attention:1},text:['坐标被记下来。石头没有名字，仍占着同一块海底。','The coordinates are recorded. The stone has no name in the entry and still occupies the same patch of seafloor.','座標だけが残る。記録の中で石に名前はないが、海底では同じ場所を占めている。']},
   {id:'background-both',label:['沿石头边缘看一圈','Follow the edge of the stone','石の縁を一周見る'],delta:{maps:1},text:['镜头绕出一个小弧。它从另一侧慢慢露出来。','The camera traces a small arc. It slowly reappears from the other side.','カメラが小さな弧を描く。身体は反対側からゆっくり現れる。']}
  ]
 },
 {
  id:'trace',
  prompt:['刚留下的步足痕迹被细粒慢慢盖住。几道线先变浅，再看不见。它停在更远一点的位置：“刚才有线。”','Fresh leg marks are slowly covered by settling particles. Several lines fade, then disappear. It stops a little farther away. “There were lines just now.”','さっきの足跡が沈んでくる細粒にゆっくり覆われる。線は薄くなり、やがて見えなくなる。少し離れた場所で止まり、「さっき線があった」と言う。'],
  options:[
   {id:'trace-record',label:['在纸上补一小段线','Add a short line on paper','紙に短い線を足す'],delta:{labels:1},text:['纸上的线没有变浅。海底那几道已经看不见了。','The line on paper does not fade. The ones on the seafloor are already gone.','紙の線は薄くならない。海底の線はもう見えない。']},
   {id:'trace-happened',label:['等细粒盖完','Wait until the particles settle','細粒が覆い終わるまで待つ'],delta:{},text:['粉砂恢复成近似原来的表面。它又向前走了一小段。','The silt returns to something close to its earlier surface. It moves a little farther on.','泥は元に近い表面へ戻る。身体はまた少し先へ進む。']},
   {id:'trace-unsure',label:['看下一道足迹','Watch the next track','次の足跡を見る'],delta:{attention:1},text:['新的足迹出现在旧痕旁边。两种表面只重叠了很短一会儿。','A new track appears beside the old trace. The two surfaces overlap for only a short while.','新しい足跡が古い跡のそばに現れる。二つの表面が重なるのは短いあいだだけ。']}
  ]
 },
 {
  id:'blank',
  prompt:['记录页上有几处空栏。它走进一片阴影，画面只剩触角偶尔反一下光。过了一会儿，里面传来一句：“这里看不到。”','Several fields on the page are blank. It walks into a patch of shadow until only an occasional glint from an antenna remains. After a while, a voice comes from inside. “You cannot see here.”','記録頁には空欄がいくつかある。影へ入ると、時々触角が光を返すだけになる。しばらくして中から「ここは見えない」と声がする。'],
  options:[
   {id:'blank-outside',label:['把光停在阴影外','Leave the light outside the shadow','光を影の外に置く'],delta:{attention:1},text:['阴影的边缘更清楚了，里面没有因此多出细节。','The edge of the shadow becomes clearer. Its interior gains no extra detail.','影の縁ははっきりするが、中の細部が増えるわけではない。']},
   {id:'blank-space',label:['在空栏旁写上时间','Write the time beside the blank','空欄の脇に時刻を書く'],delta:{},text:['空栏旁多了一个时间。里面仍然没有内容。','A time appears beside the blank field. The field itself remains empty.','空欄の脇に時刻が増える。欄の中身は空いたまま。']},
   {id:'blank-unknown',label:['把增益调高一点','Raise the gain a little','ゲインを少し上げる'],delta:{attention:1},text:['黑里多出一些噪点。触角偶尔比刚才亮一点。','More noise appears in the dark. The antenna glints a little brighter now and then.','暗い画面にノイズが増える。触角が時々さっきより少し明るく見える。']}
  ]
 },
 {
  id:'reflection',
  prompt:['观察窗上浮出一层很淡的反光。镜头这一侧的轮廓叠进黑水里。它停了一会儿，看着玻璃：“又有一个。”','A faint reflection appears on the observation window. A silhouette from this side of the glass overlaps the black water. It pauses and looks at the glass. “There is another one.”','観察窓にごく薄い反射が浮かぶ。ガラスのこちら側の輪郭が黒い水に重なる。少し止まり、ガラスを見て「もう一ついる」と言う。'],
  options:[
   {id:'reflection-clear',label:['往旁边挪一点','Shift a little to the side','少し横へずれる'],delta:{attention:1},text:['你的轮廓从玻璃上退开。黑水重新连成一片，窗还在原处。','Your silhouette slips off the glass. The black water looks continuous again; the window remains where it is.','こちらの輪郭がガラスから外れる。黒い水はまた一続きに見えるが、窓は同じ場所に残る。']},
   {id:'reflection-note',label:['把两个轮廓一起截下来','Capture both silhouettes','二つの輪郭を一緒に残す'],delta:{maps:1},text:['图像被保存。一个轮廓在海底，一个贴在玻璃上。','The image is saved. One silhouette lies on the seafloor; the other sits on the glass.','画像が保存される。一つの輪郭は海底に、もう一つはガラスにある。']},
   {id:'reflection-leave',label:['让录像继续','Keep the recording running','録画を続ける'],delta:{attention:1},text:['两个轮廓重了一会儿。水流一变，反光先散开。','The two silhouettes overlap for a while. When the water shifts, the reflection breaks apart first.','二つの輪郭がしばらく重なる。水が揺れると、先に反射の方がほどける。']}
  ]
 },
 {
  id:'offering',
  prompt:['机械臂边缘掉下一小片残屑。它没有立刻靠近，先看残屑，又看了一眼机械臂：“这个从上面来的。”','A small fragment falls from the edge of the manipulator. It does not approach at once; it looks at the fragment, then at the arm. “This came from above.”','マニピュレーターの縁から小さな破片が落ちる。すぐには近づかず、破片を見てからアームを見る。「これは上から来た」と言う。'],
  options:[
   {id:'offering-food',label:['写下“残屑”','Write “fragment”','「破片」と書く'],delta:{labels:1},text:['“残屑”留在记录里。它还没有碰那一片。','“Fragment” remains in the record. It has not touched it yet.','「破片」という語が記録に残る。身体はまだそれに触れていない。']},
   {id:'offering-intervention',label:['看一眼机械臂','Look at the manipulator','マニピュレーターを見る'],delta:{attention:1},text:['机械臂停在画面上缘。下面那片残屑已经落进粉砂。','The manipulator rests at the top edge of the frame. The fragment below has already settled into the silt.','マニピュレーターは画面上端で止まっている。下の破片はもう泥へ落ちている。']},
   {id:'offering-fall',label:['在落点做个记号','Mark where it landed','落ちた場所に印をつける'],delta:{attention:1},text:['落点旁多了一个小记号。水流又把残屑推开了一点。','A small mark appears beside the landing point. The current pushes the fragment a little farther away.','落下地点の脇に小さな印が増える。水流が破片をまた少し動かす。']}
  ]
 },
 {
  id:'specimen',
  prompt:['资料库窗口被调到前景。编号、学名和固定的背面图像盖住海底一角。它从窗口后面经过，只露出几节步足。停了一下，它说：“这里也有一个不会动的。”','The archive window moves to the foreground. A number, scientific name, and fixed dorsal image cover part of the seafloor. It passes behind the window with only a few legs visible. After a pause it says, “There is one here that does not move.”','資料庫の窓が前面に出る。番号、学名、固定された背面像が海底の一部を覆う。その後ろを通り、数本の脚だけが見える。少し止まり、「ここにも、動かないのが一ついる」と言う。'],
  options:[
   {id:'specimen-update',label:['把编号抄下来','Copy the specimen number','番号を書き写す'],delta:{labels:1},text:['编号进入记录。窗口后面的步足已经移到另一侧。','The number enters the record. The legs behind the window have already moved to the other side.','番号が記録に入る。窓の後ろの脚はもう反対側へ移っている。']},
   {id:'specimen-now',label:['把资料页缩小','Shrink the archive page','資料頁を小さくする'],delta:{attention:1},text:['海底重新露出一块。刚才被挡住的位置已经空了。','A patch of seafloor becomes visible again. The place that was covered a moment ago is now empty.','海底がまた少し見える。さっき隠れていた場所にはもう何もいない。']},
   {id:'specimen-noanswer',label:['等它从窗口后面出来','Wait for it to emerge','窓の向こうから出るのを待つ'],delta:{},text:['窗口没有动。过了一会儿，它从另一侧慢慢出现。','The window does not move. After a while, it slowly appears on the other side.','窓は動かない。しばらくして、反対側からゆっくり現れる。']}
  ]
 },
 {
  id:'observer',
  prompt:['载具轻微漂移，探照灯从背板上滑开。它几乎同时转向更暗的一侧。过了一会儿，它朝观察窗说：“你也动了。”','The vehicle drifts slightly and the lamp slides off its plates. Almost at the same moment, it turns toward the darker side. After a while it says toward the window, “You moved too.”','機体がわずかに流れ、探照灯が背板から外れる。ほとんど同時に、暗い方へ向きを変える。しばらくして観察窓へ「そっちも動いた」と言う。'],
  options:[
   {id:'observer-light',label:['记下光斑的位置','Note the light patch position','光斑の位置を記す'],delta:{maps:1},text:['一个坐标留给光斑。身体的转向写在下一行。','One coordinate is left for the light patch. The body’s turn is written on the next line.','光斑に一つ座標を残す。身体の向きの変化は次の行へ書く。']},
   {id:'observer-body',label:['跟着它转一点','Turn with it a little','少し追って向きを変える'],delta:{attention:1},text:['镜头重新把它放在中间。原来的石头从另一侧滑出画面。','The camera places it near the center again. The original stone slips out on the opposite side.','カメラがまた身体を中央近くへ置く。さっきの石は反対側から画面を出る。']},
   {id:'observer-mixed',label:['把这一段保留原样','Keep this segment as it is','この区間をそのまま残す'],delta:{attention:1},text:['录像里，两次移动挨得很近。没有箭头说明谁带着谁走。','In the recording, the two movements occur close together. No arrow says which one led the other.','録画では二つの移動がほとんど続けて起こる。どちらがどちらを導いたか示す矢印はない。']}
  ]
 },
 {
  id:'translation',
  prompt:['水下麦克风里传来几下短促的摩擦声。它没有靠近，也没有离开。下一句话却很清楚：“刚才那个，不是这句话。”','A few short scraping sounds come through the underwater microphone. It neither approaches nor leaves. Its next sentence is clear: “That just now was not this sentence.”','水中マイクに短い擦過音がいくつか入る。近づきも離れもしない。次の言葉だけははっきり聞こえる。「さっきのは、この言葉じゃない。」'],
  options:[
   {id:'translation-yes',label:['把波形放大','Enlarge the waveform','波形を拡大する'],delta:{attention:1},text:['波形占满一块屏幕。声音仍然只有几下长短不同的摩擦。','The waveform fills a section of the screen. The sound remains a few scrapes of different lengths.','波形が画面の一部を埋める。音は長さの違ういくつかの擦過音のまま。']},
   {id:'translation-no',label:['写下“摩擦声”','Write “scraping sound”','「擦過音」と書く'],delta:{labels:1},text:['四个字进入记录。下一次声音更短。','The label enters the record. The next sound is shorter.','その語が記録に入る。次の音はもっと短い。']},
   {id:'translation-watch',label:['回放三秒','Replay three seconds','三秒だけ再生する'],delta:{},text:['同一段声音又出现一次。海底那边没有任何东西倒着移动。','The same sound occurs once more. Nothing on the seafloor moves backward with the replay.','同じ音がもう一度流れる。海底の方では何も逆向きには動かない。']}
  ]
 },
 {
  id:'frame',
  prompt:['它沿粉砂走向画面边缘。身体先出去，最后只剩一小截触角。几秒后，声音从画面外传来：“还在。”','It moves across the silt toward the edge of the image. The body leaves first, until only a small tip of antenna remains. A few seconds later, its voice comes from outside the frame. “Still here.”','泥の上を画面の端へ進む。身体が先に出て、最後は触角の先だけが残る。数秒後、画面の外から声がする。「まだいる。」'],
  options:[
   {id:'frame-yes',label:['镜头往右推一点','Move the camera a little right','カメラを少し右へ動かす'],delta:{maps:1},text:['身体重新进入画面，原来留在左侧的海底同时消失了一块。','The body re-enters the frame, while a piece of seafloor that had been visible on the left disappears.','身体がまた画面に入る。同時に、左側に見えていた海底が一部消える。']},
   {id:'frame-no',label:['在画面边缘做个记号','Mark the edge of the frame','画面の縁に印をつける'],delta:{labels:1},text:['边缘多了一道短线。线外没有跟着出现新的画面。','A short line appears at the edge. No new image appears beyond it.','縁に短い線が増える。その外側に新しい画面が現れるわけではない。']},
   {id:'frame-open',label:['停在现在的位置','Keep the camera where it is','カメラを今の位置に置く'],delta:{attention:1},text:['触角也离开了。画面只剩粉砂，声音偶尔还从右侧传来。','The antenna leaves too. Only silt remains in the image, while an occasional sound still comes from the right.','触角も消える。画面には泥だけが残り、時々右側から音だけが聞こえる。']}
  ]
 },
 {
  id:'ending',
  prompt:['画面里只剩粉砂、石块和缓慢落下的颗粒。过了一会儿，触角又从边缘短暂出现。它看了一眼探照灯：“还亮着。”','Only silt, stones, and slowly settling particles remain in the image. After a while, an antenna briefly appears again at the edge. It looks toward the lamp. “Still on.”','画面に残るのは泥、石、ゆっくり沈む粒だけ。しばらくして触角が端から短く現れる。探照灯を見て、「まだ点いてる」と言う。'],
  options:[
   {id:'ending-close',label:['保存记录','Save the record','記録を保存する'],delta:{},text:['保存完成的提示亮了一下。海底没有跟着出现新的标记。','The save confirmation flashes once. No new mark appears on the seafloor with it.','保存完了の表示が一度光る。海底に新しい印が現れるわけではない。']},
   {id:'ending-watch',label:['再等十秒','Wait ten more seconds','あと十秒待つ'],delta:{quiet:1},text:['十秒里没有新的动作。细粒仍在一点点改变粉砂表面。','No new movement appears during the ten seconds. Fine particles continue changing the silt surface little by little.','十秒のあいだ新しい動きはない。細粒だけが泥の表面を少しずつ変えていく。']},
   {id:'ending-silent',label:['关掉探照灯','Switch off the lamp','探照灯を消す'],delta:{attention:1},text:['亮斑慢慢退掉。最后还能看见的，是玻璃上很淡的一点反光。','The bright patch slowly disappears. The last visible thing is a faint reflection on the glass.','明るい斑点がゆっくり消える。最後に見えるのは、ガラスに残ったごく淡い反射。']}
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
  },
  interval:{
   title:['两次之间','Between Two Moments','二つのあいだ'],
   body:['有些地方只剩下先后：光移开了一点，身体随后转向；声音出现，几秒后才有一句话。记录保留了间隔，没有替它补上原因。','Some places retain only sequence: the light shifts, the body turns later; a sound occurs, and a sentence follows seconds afterward. The record keeps the interval without supplying a cause.','いくつかの場所には前後だけが残る。光が少し動き、そのあと身体が向きを変える。音が出て、数秒後に言葉が続く。記録は間隔を残すが、原因は補わない。']
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
  },
  sequence:{
   body:['几处记录只留下先后顺序，没有把先后写成因果。回看时，两个相邻的动作仍然只是相邻。','Several entries preserve sequence without turning sequence into cause. On rereading, two adjacent actions remain merely adjacent.','いくつかの記録は前後だけを残し、それを因果にはしない。見返しても、隣り合う二つの動作はただ隣り合ったまま。']
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
