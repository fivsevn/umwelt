// Direct narrative for the abyssal habitat.
// Surface structure mirrors the other observation habitats, but the observed animal
// gradually returns the gaze. "Day" and "period" remain internal engine counters only.
export const ABYSSAL_NODES=[
 {
  id:'light',
  prompt:['探照灯落在粉砂上。一个宽大的轮廓停在光的边缘，触角慢慢转向观察窗。过了一会儿，它问：“光为什么停在这里？”','The lamp settles over pale silt. A broad silhouette rests at the edge of the light, antennae slowly turning toward the observation window. After a while, it asks, “Why did the light stop here?”','探照灯が淡い泥の上に止まる。幅広い輪郭が光の縁にいて、触角をゆっくり観察窓へ向ける。しばらくして聞く。「どうして光はここで止まったの？」'],
  options:[
   {id:'light-place',label:['为了看清这里','To see this place clearly','ここをよく見るため'],delta:{attention:1,maps:1},text:['光斑没有移动。它沿着亮处的边缘走了一小段，没有进入中央。','The pool of light stays still. It walks a short distance along the bright edge without entering the center.','光の斑点は動かない。明るい場所の縁を少し進み、中央には入らない。']},
   {id:'light-you',label:['为了看清你','To see you clearly','君をよく見るため'],delta:{interpretation:1,attention:1},text:['触角停了一瞬，又转向灯外。镜头里能看见的部分因此少了一点。','The antennae pause, then turn beyond the light. A little less of the body remains visible in the frame.','触角が一瞬止まり、光の外へ向く。画面に見える身体が少し減る。']},
   {id:'light-move',label:['把灯移开一点','Move the light aside','光を少し外す'],delta:{restraint:2,quiet:1},text:['光斑移到旁边。它没有跟过去，原来的位置很快只剩粉砂。','The light shifts aside. It does not follow; the old spot soon contains only silt.','光を少し外す。追いかけては来ない。さっきの場所にはすぐ泥だけが残る。']}
  ]
 },
 {
  id:'trace',
  prompt:['粉砂上留下几道很浅的步足痕。身体已经停在另一处。镜头在两边之间来回一次。它问：“记的是刚才，还是现在？”','Shallow leg marks remain in the silt. The body has already stopped somewhere else. The camera moves once between the two. It asks, “Are you recording before, or now?”','泥に浅い脚跡が残り、身体はもう別の場所で止まっている。カメラが二つの場所を一度往復する。「記録しているのは、さっき？　それとも今？」'],
  options:[
   {id:'trace-before',label:['先记痕迹','Record the marks first','先に痕跡を記す'],delta:{labels:1,attention:1},text:['痕迹被画成几条短线。画完时，边缘已经开始被细粒盖住。','The marks become a few short lines on the page. By the time the drawing is finished, fine grains are already softening their edges.','痕跡を短い線で描く。描き終える頃には、細かな粒が縁を埋め始めている。']},
   {id:'trace-now',label:['先记现在的位置','Record the current position first','先に今の位置を記す'],delta:{maps:1,attention:1},text:['新的位置被点在纸上。旧痕仍在画面另一侧，没有被这一个点带过来。','The new position becomes a dot on the page. The old marks remain elsewhere in the frame and do not move with it.','新しい位置を紙に点で残す。古い痕跡は画面の別の場所にあり、その点と一緒には動かない。']},
   {id:'trace-together',label:['先不分开','Do not separate them yet','まだ分けない'],delta:{restraint:1,quiet:1},text:['这一栏暂时空着。痕迹和身体同时留在画面里，直到镜头再次移动。','The field stays blank for now. Marks and body remain in the same frame until the camera moves again.','欄はしばらく空白のまま。カメラがまた動くまで、痕跡と身体が同じ画面に残る。']}
  ]
 },
 {
  id:'name',
  prompt:['资料栏的学名一直留在画面下方。它经过一块小石时，身体短暂挡住了其中几个字母。它问：“那几个字，是在说这里，还是在说别处？”','The scientific name remains beneath the image. As it passes a small stone, its body briefly covers several letters. It asks, “Do those words describe here, or somewhere else?”','資料欄の学名は画面の下に残り続ける。小石を通るとき、身体が一瞬いくつかの文字を隠す。「その文字は、ここについて書いてあるの？　それとも別の場所？」'],
  options:[
   {id:'name-body',label:['说的是眼前这个身体','This body in front of me','目の前のこの身体'],delta:{interpretation:2,labels:1},text:['它从字上移开。名称重新完整出现，身体已经换了位置。','It moves away from the text. The name becomes complete again while the body is already elsewhere.','文字の上から離れる。名称はまた完全に見えるが、身体はもう別の位置にいる。']},
   {id:'name-species',label:['说的是这一类','This kind of animal','この種類'],delta:{labels:2},text:['它停在石头另一侧。“这一类有多大？”问完以后，没有再补一句。','It stops on the far side of the stone. “How large is a kind?” It adds nothing after the question.','石の向こうで止まる。「種類って、どれくらい大きいの？」それ以上は何も言わない。']},
   {id:'name-index',label:['只是方便找到资料','It is only an index for the archive','資料を探すための索引'],delta:{restraint:1,labels:2},text:['它没有回答。资料栏仍在原处，路线从文字上方继续过去。','It does not answer. The archive label stays where it is while the route continues above it.','答えない。資料欄はそのままで、経路だけが文字の上を通り過ぎていく。']}
  ]
 },
 {
  id:'fall',
  prompt:['一小片有机残屑从黑水里落下来，先经过灯光，随后沉到粉砂上。它没有立刻靠近，只把触角转向那里。“它落下来以前，这里少了什么？”','A small piece of organic debris falls through the black water, crosses the light, and settles on the silt. It does not approach at once, only turns its antennae toward it. “Before it fell, what was missing here?”','小さな有機物の破片が黒い水から落ち、光を横切って泥に沈む。すぐには近づかず、触角だけをそちらへ向ける。「これが落ちてくる前、ここには何が足りなかったの？」'],
  options:[
   {id:'fall-food',label:['食物','Food','食べ物'],delta:{interpretation:2},text:['它仍没有靠近。残屑先在水流里轻轻翻了一次。','It still does not approach. The debris turns once in the current first.','まだ近づかない。破片が先に流れの中で一度だけ転がる。']},
   {id:'fall-route',label:['一条可能经过的路线','A route that might be taken','通るかもしれない経路'],delta:{maps:2,attention:1},text:['触角扫过残屑和旁边的空地。下一步落在两者之间。','The antennae sweep across the debris and the empty ground beside it. The next step lands between them.','触角が破片と、その横の何もない場所をなぞる。次の一歩はその間に落ちる。']},
   {id:'fall-none',label:['什么也没少','Nothing was missing','何も足りなかったわけではない'],delta:{restraint:2,quiet:1},text:['它停了一会儿。残屑已经成为底部的一部分，没有出现新的标记。','It pauses. The debris has already become part of the bottom, without receiving a new label.','少し止まる。破片はもう底の一部になっているが、新しい印は付かない。']}
  ]
 },
 {
  id:'motive',
  prompt:['过了一阵，它缓慢靠近那片残屑，又从旁边经过半个身体长度。镜头跟着转过去。它问：“已经知道为什么了吗？”','After a while it slowly approaches the debris, then passes it by half a body length. The camera follows. It asks, “Do you already know why?”','しばらくしてゆっくり破片へ近づき、半体長ほど通り過ぎる。カメラも向きを変える。「もう、理由は分かった？」'],
  options:[
   {id:'motive-hunger',label:['大概是饿了','Probably hunger','たぶん空腹'],delta:{interpretation:2},text:['它折回来，触角碰到残屑。“大概”被保留在记录里。','It turns back and touches the debris with an antenna. The word “probably” remains in the record.','折り返し、触角が破片に触れる。「たぶん」という語は記録に残る。']},
   {id:'motive-motion',label:['只知道靠近过','Only that you approached it','近づいたことだけ分かる'],delta:{attention:2,restraint:1},text:['记录里多了一条路线，没有补上原因。它在路线末端停住。','A route is added to the record without a cause attached. It stops at the end of that route.','記録には経路だけが増え、理由は書き足されない。その経路の端で止まる。']},
   {id:'motive-blank',label:['先不写原因','Leave the reason blank','理由はまだ書かない'],delta:{restraint:2,quiet:1},text:['原因栏空着。残屑边缘少了一小块，但画面没有说明是谁完成的。','The cause field remains blank. A small piece is missing from the debris, but the image does not say who removed it.','理由の欄は空白のまま。破片の縁が少し欠けているが、画面は誰がそうしたかを語らない。']}
  ]
 },
 {
  id:'scale',
  prompt:['倍率被调高。背板、步足和触角很快占满观察窗；刚才还能看见的石块退到画面外。它问：“现在变大的是哪一边？”','The magnification increases. Dorsal plates, legs, and antennae soon fill the observation window; the stone that was visible a moment ago leaves the frame. It asks, “Which side became larger?”','倍率を上げる。背板、脚、触角がすぐ観察窓を埋め、さっき見えていた石は画面外へ出る。「今、大きくなったのはどっち側？」'],
  options:[
   {id:'scale-body',label:['画面里的身体','The body in the image','画面の中の身体'],delta:{interpretation:2},text:['倍率数字仍亮着。身体没有占据更多海底，只占据了更多画面。','The magnification number remains lit. The body occupies no more seafloor, only more of the image.','倍率の数字は点いたまま。身体が占める海底は増えず、画面だけを多く占める。']},
   {id:'scale-frame',label:['观察窗里的比例','The scale inside the window','観察窓の中の比率'],delta:{attention:1,maps:2},text:['倍率被记在位置旁边。石块没有消失，只是不再和身体同时出现。','The magnification is written beside the position. The stone has not disappeared; it simply no longer appears at the same time as the body.','位置の横に倍率を記す。石は消えていない。ただ身体と同時に映らなくなった。']},
   {id:'scale-none',label:['没有东西真的变大','Nothing actually became larger','実際に大きくなったものはない'],delta:{restraint:1,attention:1},text:['它继续向前。画面不得不再次移动，才能把完整轮廓收回来。','It keeps moving. The frame has to move again to contain the whole outline.','そのまま進む。輪郭全体を収めるため、画面の方がまた動く。']}
  ]
 },
 {
  id:'unseen',
  prompt:['它绕到一块石头后面。仪表上的数值没有变化，画面里只剩石块、粉砂和偶尔露出的触角尖。石后传来一句：“看不见的那一段，还在记录里吗？”','It passes behind a rock. The instrument readings do not change; only rock, silt, and an occasional antenna tip remain in view. From behind the rock comes a question: “Is the part you cannot see still in the record?”','石の後ろへ回る。計器の数字は変わらず、画面には石と泥、ときどき触角の先だけが残る。石の向こうから聞こえる。「見えない部分も、記録の中にある？」'],
  options:[
   {id:'unseen-route',label:['留一条虚线','Leave a dotted route','点線を残す'],delta:{maps:2,interpretation:1},text:['虚线穿过石头。它重新出现的位置与虚线并不完全相接。','A dotted line crosses the rock. Where it reappears does not quite meet the line.','点線が石を横切る。再び現れた位置は、その点線と完全にはつながらない。']},
   {id:'unseen-gap',label:['只记消失和出现','Record disappearance and return','消えた所と現れた所だけ記す'],delta:{attention:2,restraint:1},text:['纸上留下两个点。石头仍占着两点之间的地方。','Two points remain on the page. The rock still occupies the space between them.','紙には二つの点が残る。その間の場所は石が占めたままだ。']},
   {id:'unseen-blank',label:['中间留空','Leave the middle blank','間を空白にする'],delta:{restraint:2,quiet:1},text:['空白没有被补上。它从石头另一侧出来以后，也没有回头看那一栏。','The blank is not filled. After it emerges on the other side, it does not look back at that field.','空白は埋めない。石の反対側から出たあとも、その欄を振り返らない。']}
  ]
 },
 {
  id:'boundary',
  prompt:['载具轻微漂移，原本居中的石块慢慢滑到画面边缘。海底没有移动，取景范围却换了一块。它问：“这里的边界在哪里？”','The vehicle drifts slightly and the centered rock slides toward the edge of the frame. The seafloor has not moved, but the sampled view has changed. It asks, “Where is the boundary of here?”','機体がわずかに漂い、中央にあった石が画面の端へ滑る。海底は動いていないのに、切り取られる範囲だけが変わる。「『ここ』の境界はどこ？」'],
  options:[
   {id:'boundary-light',label:['灯照到的地方','Where the light reaches','光が届くところ'],delta:{interpretation:1,maps:1},text:['光的边缘很清楚，水却继续穿过去。一个悬浮颗粒从暗处进入亮处。','The edge of the light is clear, but water continues through it. A suspended particle crosses from dark into brightness.','光の縁ははっきりしているが、水はそのまま通り抜ける。浮遊粒子が暗い方から明るい方へ入る。']},
   {id:'boundary-frame',label:['镜头边缘','The edge of the frame','画面の縁'],delta:{labels:1,maps:1},text:['镜头再次漂移，边界随之移动。石块从“外面”回到画面里。','The camera drifts again and the boundary moves with it. The rock returns from “outside” into the frame.','カメラがまた漂い、境界も一緒に動く。石が「外」から画面の中へ戻る。']},
   {id:'boundary-open',label:['暂时不知道','Not sure yet','まだ分からない'],delta:{restraint:2,maps:1,quiet:1},text:['没有画边界。画面仍有四条边，海底没有。','No boundary is drawn. The image still has four edges; the seafloor does not.','境界は描かない。画面には四辺があるが、海底にはない。']}
  ]
 },
 {
  id:'remains',
  prompt:['一块旧的甲壳残片半埋在粉砂里。它用触角碰了一下，残片翻过来，露出颜色更浅的一面。“只剩这一小块以后，原来的名字还在吗？”','An old shell fragment lies half buried in silt. It touches the fragment with an antenna; it turns over, revealing a paler side. “When only this small piece remains, does the old name remain too?”','古い甲殻の破片が泥に半分埋まっている。触角で触れると裏返り、より淡い面が出る。「これだけが残ったあとも、前の名前は残る？」'],
  options:[
   {id:'remains-name',label:['如果知道原来是谁，就还在','If the former identity is known, yes','元が誰か分かるなら残る'],delta:{labels:2,interpretation:1},text:['残片旁边多了一个暂定名称。它没有因此变得更完整。','A provisional name is added beside the fragment. It does not become more complete.','破片の横に仮の名称が付く。それで元の形に近づくわけではない。']},
   {id:'remains-record',label:['名字留在记录里','The name remains in the record','名前は記録に残る'],delta:{labels:2,restraint:1},text:['记录里的字保持完整。残片再次被细砂覆盖了一点。','The word in the record remains complete. A little more fine silt covers the fragment.','記録の文字は完全なまま。破片にはまた少し細かな泥がかかる。']},
   {id:'remains-unknown',label:['不知道原来是什么','The former whole is unknown','元が何だったか分からない'],delta:{restraint:2,quiet:1},text:['名称栏保持空白，只画了边缘。水流让那条边又露出一点。','The name field stays blank; only the edge is drawn. The current exposes a little more of that edge.','名称欄は空白のまま、縁だけを描く。流れでその縁が少しだけさらに現れる。']}
  ]
 },
 {
  id:'sentence',
  prompt:['画面很久没有明显变化。记录里出现一句“未见明显变化”。它仍伏在原处，触角偶尔移动。过了一会儿，它问：“这一句写的是谁？”','For a long while the image shows no obvious change. The record gains one sentence: “No obvious change observed.” It remains in place while its antennae occasionally move. After a while it asks, “Who is that sentence about?”','長いあいだ画面に目立った変化がない。記録には「明瞭な変化を認めず」と一文が増える。身体はその場にあり、触角だけが時々動く。しばらくして聞く。「その一文は、誰について書いたの？」'],
  options:[
   {id:'sentence-animal',label:['写的是你','You','君について'],delta:{interpretation:2},text:['触角又移动了一次。那句话没有修改。','The antennae move once more. The sentence is not revised.','触角がもう一度動く。その一文は直されない。']},
   {id:'sentence-frame',label:['写的是画面','The image','画面について'],delta:{attention:2},text:['镜头没有移动。画面确实几乎一样，水中的细粒仍持续下沉。','The camera does not move. The image is indeed almost unchanged, while fine particles keep falling through the water.','カメラは動かない。画面は確かにほぼ同じだが、水中の細粒は落ち続けている。']},
   {id:'sentence-observer',label:['写的是这次观察','This observation','この観察について'],delta:{attention:1,restraint:1,labels:1},text:['“未见”两个字被圈了一下。其余部分仍留在原处。','The words “not observed” are circled. The rest of the sentence remains untouched.','「認めず」の部分だけに印を付ける。残りの文はそのまま残す。']}
  ]
 },
 {
  id:'gaze',
  prompt:['它慢慢转过身体，正面对着观察窗。镜头没有再跟随移动。两边隔着玻璃和黑水停了一阵。它问：“你那边有多深？”','It slowly turns to face the observation window. The camera stops following. The two sides remain separated by glass and black water for a while. It asks, “How deep is it on your side?”','ゆっくり身体を向け、観察窓を正面から見る。カメラはもう追わない。ガラスと黒い水を挟んで、両側がしばらく止まる。「そっちは、どれくらい深いの？」'],
  options:[
   {id:'gaze-unmeasured',label:['没有量过','I have never measured it','測ったことがない'],delta:{restraint:2,attention:1},text:['它没有追问。仪表上的深度也没有替另一边回答。','It does not ask again. The depth gauge does not answer for the other side either.','それ以上は聞かない。深度計も、反対側の深さまでは答えない。']},
   {id:'gaze-shallow',label:['大概比这里浅','Probably shallower than here','たぶんここより浅い'],delta:{interpretation:1,maps:1},text:['“大概。”它把这个词重复了一次，随后把身体转回侧面。','“Probably.” It repeats the word once, then turns sideways again.','「たぶん。」その語を一度繰り返し、また身体を横へ向ける。']},
   {id:'gaze-screen',label:['隔着这里说不清','Hard to say from across this window','ここを挟むと分からない'],delta:{attention:2,maps:1},text:['观察窗里同时映出一点设备的反光和它的轮廓。两种影子短暂重叠。','The observation window holds a faint reflection of the equipment and its outline at once. The two overlap briefly.','観察窓に機器の薄い反射とその輪郭が同時に映る。二つの影が一瞬重なる。']}
  ]
 },
 {
  id:'close',
  prompt:['它开始沿着粉砂向灯外移动。身体只剩一半还在画面里时，又停了一次。触角转回来。“这一页要合上了吗？”','It begins moving across the silt toward the darkness beyond the lamp. When only half its body remains in the frame, it pauses once more and turns an antenna back. “Is this page about to close?”','泥の上を進み、光の外へ向かう。身体の半分だけが画面に残ったところで、もう一度止まり、触角をこちらへ向ける。「この頁は、もう閉じるの？」'],
  options:[
   {id:'close-here',label:['到这里','Here is enough','ここまで'],delta:{labels:1,restraint:1},text:['记录停在这个位置。它随后离开光线，最后一段路线没有进入纸面。','The record stops at this position. It then leaves the light; the last part of the route never enters the page.','記録はこの位置で止まる。そのあと光の外へ出て、最後の経路は紙面に入らない。']},
   {id:'close-wait',label:['再等一会儿','Wait a little longer','もう少し待つ'],delta:{quiet:2,attention:1},text:['没有新的动作立刻出现。过了一阵，画面里的那半个轮廓才继续向外移动。','No new action appears immediately. After a while, the half-visible outline continues out of the frame.','すぐには新しい動きは起きない。しばらくして、半分だけ見えていた輪郭がまた外へ進む。']},
   {id:'close-open',label:['先不合上','Leave it open','まだ閉じない'],delta:{maps:1,restraint:1},text:['页面保持打开。画面最终只剩粉砂、石块和缓慢下沉的颗粒。','The page remains open. Eventually the image contains only silt, rock, and slowly falling particles.','頁は開いたまま。やがて画面には泥と石、ゆっくり沈む粒子だけが残る。']}
  ]
 }
];

export const ABYSSAL_ENDING_DATA={
 'abyssal-untranslated':{
  title:['没有译完','Unfinished Translation','訳し切らない'],
  body:['记录里留下许多空白、暂定词和没有补完的原因。没有哪一处空白因此变成错误；它们只是把无法确认的部分继续留在海底。最后一条路线离开灯光，页上没有替它续写。','The record keeps blanks, provisional words, and causes left unfinished. None of the blanks become errors; they simply leave what could not be confirmed on the seafloor. The final route leaves the light, and the page does not continue it.','記録には空白、仮の語、書き切らない理由が残る。空白は誤りにはならず、確かめられない部分を海底に残す。最後の経路は光を離れ、頁はその先を書き足さない。'],
  line:['不完整的记录，也可以保持完整的边界。','An incomplete record can keep an honest boundary.','不完全な記録にも、保たれる境界がある。']
 },
 'abyssal-observer':{
  title:['观察窗两面','Two Sides of the Window','観察窓の二つの面'],
  body:['旧记录把灯光、倍率、载具漂移和观察位置也写进了海底档案。这个结局保留给已经完成的观察；新的记录会把同一种关系分到更细的页里。','An older record included light, magnification, vehicle drift, and observer position in the seafloor archive. This ending is retained for completed observations; newer records distribute the same relation across more specific pages.','旧い記録には光、倍率、機体の漂流、観察位置まで海底の資料に書かれている。この結末は完了済みの観察のために残し、新しい記録では同じ関係をより細かな頁へ分ける。'],
  line:['观察窗从来不只朝一个方向。','An observation window never faces only one way.','観察窓は一方向だけを向いているわけではない。']
 },
 'abyssal-reciprocal':{
  title:['第二个观察点','A Second Observation Point','もう一つの観察点'],
  body:['后来，记录里不只出现海底的位置，也出现灯、倍率、取景和观察窗另一侧。画面没有因此变成对称；只是原本不写进图里的位置，开始留下痕迹。','Later the record contains not only positions on the seafloor, but also light, magnification, framing, and the far side of the observation window. The image does not become symmetrical; a position once omitted from the map simply begins to leave traces.','記録には海底の位置だけでなく、光、倍率、切り取り方、観察窓の反対側まで現れる。画面が対称になるわけではない。ただ、図に入っていなかった位置が痕跡を残し始める。'],
  line:['观察窗有两面，记录通常只画一面。','An observation window has two sides; records usually draw only one.','観察窓には二つの面がある。記録はたいてい片方しか描かない。']
 },
 'abyssal-index':{
  title:['页码之外','Beyond the Page Number','頁番号の外'],
  body:['名称、学名和暂定标签都留在资料里。它们能把下一次查找带回这一页，却不能把已经离开的路线叫回来。分类仍然有用，只是不再假装等于眼前发生过的一切。','Names, scientific labels, and provisional tags remain in the archive. They can lead a future search back to this page, but cannot call the departed route back. Classification remains useful without pretending to equal everything that happened in front of the window.','名称、学名、仮のラベルは資料に残る。次の検索をこの頁へ戻すことはできても、去った経路を呼び戻すことはできない。分類は役に立つ。ただし、目の前で起きたすべてと同じものではない。'],
  line:['名字留下的位置，和身体留下的位置并不重合。','The place a name remains is not the place a body remains.','名前が残る場所と、身体が残る場所は重ならない。']
 },
 'abyssal-scale':{
  title:['借来的比例尺','A Borrowed Scale','借りた尺度'],
  body:['画面曾把身体放大，也把石块和海底挤到外面。记录里留下倍率、距离和几个比较词。回看时，很难再说“巨大”究竟来自身体，还是来自被带进深海的另一套尺度。','The image enlarged the body while pushing rock and seafloor outside the frame. Magnification, distance, and several comparative words remain in the notes. Looking back, it is hard to say whether “giant” belonged to the body or to another scale carried into the deep sea.','画面は身体を大きくし、石や海底を外へ押し出した。記録には倍率、距離、いくつかの比較語が残る。振り返ると、「巨大」が身体に属していたのか、深海へ持ち込まれた別の尺度に属していたのか分からなくなる。'],
  line:['比例尺没有住在海底。','The scale bar did not live on the seafloor.','尺度そのものが海底に住んでいたわけではない。']
 },
 'abyssal-trace':{
  title:['两个点之间','Between Two Points','二つの点のあいだ'],
  body:['消失的位置和重新出现的位置都很清楚。最难处理的是中间：石后的路线、被细砂盖住的足痕、没有进入镜头的动作。最后，记录没有把这些缺口全部连成线。','The place of disappearance and the place of return are both clear. The difficulty lies between them: routes behind rock, tracks covered by silt, movements outside the frame. In the end the record does not connect every gap into a line.','消えた場所と再び現れた場所ははっきりしている。難しいのはその間だ。石の後ろの経路、泥に埋まる足跡、画面に入らなかった動き。最後まで、すべての空白を一本の線にはしない。'],
  line:['两个坐标之间，不一定已经有一条路。','Two coordinates do not guarantee a route between them.','二つの座標の間に、必ず経路があるとは限らない。']
 },
 'abyssal-field':{
  title:['灯以内，灯以外','Inside the Light, Outside It','光の内、光の外'],
  body:['灯光、镜头和仪表划出一块可以记录的海底。边缘之外没有因此变成空无；只是没有同时进入这一套观察。最后留下的图有清楚的范围，也留下范围外继续存在的可能。','Lamp, camera, and instruments carve out a seafloor that can be recorded. Beyond their edge does not become nothing; it simply does not enter the same observation at the same time. The final map has a clear range and leaves open the possibility of what continues beyond it.','光、カメラ、計器が記録できる海底を切り取る。その外側が無になるわけではない。同じ観察へ同時に入らないだけだ。最後の図には明確な範囲と、その外で続くものの余地が残る。'],
  line:['画面有边，环境不必照着画面长。','The image has edges; the environment need not grow to match them.','画面には縁がある。環境までその形に従う必要はない。']
 },
 'abyssal-stillness':{
  title:['两次移动之间','Between Two Movements','二つの移動のあいだ'],
  body:['移动被记成点和线，停留却占去了更长的部分。回看记录时，那些时间只剩下“未见明显变化”、空白，或者一笔没有写完的句子。海底并没有相应地缺掉一块。','Movement becomes dots and lines, while pauses occupy more of the encounter. Looking back, those spans remain only as “no obvious change,” blank space, or an unfinished sentence. No matching piece is missing from the seafloor.','移動は点と線になり、停止の方が長い部分を占める。記録を見返すと、その時間は「明瞭な変化を認めず」、空白、書きかけの文だけになる。海底から同じ大きさの部分が欠けたわけではない。'],
  line:['没有事件的地方，仍然有时间经过。','Time still passes where no event is written.','出来事が書かれない場所にも、時間は通っている。']
 },
 'abyssal-remains':{
  title:['名字留下以后','After the Name Remains','名前だけが残ったあと'],
  body:['一小块残片被画下、命名，又慢慢被细砂盖住。名字比边缘保存得更完整。它因此更像资料，却没有因此更接近原来的身体。','A small fragment is drawn, named, and slowly covered by fine silt. The name stays more complete than the edge. It becomes easier to archive without becoming closer to the former body.','小さな破片は描かれ、名付けられ、また泥に覆われていく。名前の方が縁より完全に残る。資料にはしやすくなるが、元の身体へ近づくわけではない。'],
  line:['保存下来的完整，有时属于名称。','Sometimes the completeness that survives belongs to the name.','残る完全さが、名前の側にあることもある。']
 },
 'abyssal-voice':{
  title:['没有主语的句子','A Sentence Without a Subject','主語のない文'],
  body:['记录里留下了许多解释：靠近、停留、巨大、食物、原因。后来再读，那些词有些像在写海底，有些更像在写观察时使用的语言。两者没有被重新分开。','The notes retain many interpretations: approach, pause, giant, food, cause. Read later, some words seem to describe the seafloor and others the language used while observing it. They are not separated again.','記録には多くの解釈が残る。接近、停止、巨大、食物、理由。後から読むと、海底を書いた語もあれば、観察に使った言葉そのものを書いたような語もある。二つはもう分け直さない。'],
  line:['句子需要主语，发生过的事未必需要。','A sentence needs a subject; what happened may not.','文には主語が要る。起きたことには、必ずしも要らない。']
 },
 'abyssal-between':{
  title:['观察窗两侧','Both Sides of the Window','観察窓の両側'],
  body:['这一轮没有得到一个统一的答案。名字有时有用，空白有时有用；路线可以画，也可以停在石头前。最后，画面里只剩粉砂和缓慢下沉的颗粒，观察窗另一侧仍有人看着。','This round produces no single answer. Names are useful at times, blanks at others; a route can be drawn or allowed to stop before a rock. In the end only silt and slowly falling particles remain in the image, while someone still watches from the other side of the window.','この一回で一つの答えにはまとまらない。名前が役立つ時も、空白が役立つ時もある。経路は描けるし、石の前で止めてもいい。最後に画面へ残るのは泥とゆっくり沈む粒子だけで、観察窓の反対側にはまだ見る者がいる。'],
  line:['观察结束时，位置并没有只剩一个。','When observation ends, there is still more than one position.','観察が終わっても、位置は一つだけにはならない。']
 }
};
