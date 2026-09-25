import {encodeIsopodText} from '../../locales/isopod.mjs';
const rows={
 arrival:['这片沙里的住客','Residents of this sand','この砂の住人'],start:['去沙滩看看','Visit the sand','砂浜をのぞく'],
 hint:['按住沙面挖开；继续按住可提起，松开放下。平静的沙下也可能有住客。','Hold sand to dig; keep holding to lift, release to put down. Still sand may be occupied too.','砂を長押しして掘る。そのまま持ち上げ、離すと下ろす。静かな砂の下にも住人がいる。'],
 look:['看看沙子下面','Look beneath the sand','砂の下を見る'],wait:['等一道浪','Wait for a wave','波を待つ'],
 lookAfter:['手可以进入画面。沙子没有标出入口。','Your hand can enter the scene. The sand has not marked an entrance.','手は画面に入れる。砂に入口の印はない。'],
 waitAfter:['你把手留在外面。浪来的时候，也没有敲门。','You keep your hand outside. The waves do not knock either.','手を外に置く。波もノックはしない。'],
 'ending:title':['沙面重新平了','Level sand again','また平らな砂'],
 'ending:body':['你开始认得这片沙的颜色，也认得几种消失的方法。最后一页写完，沙里仍有没见过面的住客。','You begin to know the colour of this sand, and several ways of disappearing. The last page is finished; some residents remain unseen.','砂の色と、姿を消すいくつかの仕方を覚えた。最後の頁を書き終えても、まだ顔を見ていない住人がいる。'],
 'ending:line':['表面看起来，地方还很宽。','From the surface, there still seems to be plenty of room.','表面から見ると、まだ広く空いている。'],
 sand:['湿沙','Wet sand','湿砂'],water:['浅水','Shallows','浅水'],wave:['细浪','Small waves','小波']
};
const beats=[
 [
  [
   "沙面",
   "The surface",
   "砂の表面"
  ],
  [
   "一只沿着湿沙的暗边走，另一只只露出后半截。你刚找到第三只，前两处已经平了。这里的空白变化得很快。",
   "One follows the dark edge of wet sand; another shows only its rear. By the time you find a third, the first two places are level again. Blank spaces change quickly here.",
   "一匹は湿砂の暗い縁を進み、もう一匹は後ろ半分だけを見せている。三匹目を見つけたとき、先の二か所はもう平らだった。ここの空白はよく変わる。"
  ],
  [
   "记下露出的轮廓",
   "Mark the visible outlines",
   "見える輪郭を記す"
  ],
  [
   "纸上留下三个轮廓。沙面没有继续保持这个数目。",
   "Three outlines remain on the page. The sand does not maintain that number.",
   "紙には三つの輪郭が残った。砂はその数を保たなかった。"
  ],
  [
   "多看一会儿空处",
   "Watch an empty patch",
   "空いた場所を見る"
  ],
  [
   "平静的地方动了几粒沙。你还没有看见身体，“空着”已经有点写不下去。",
   "A few grains shift in the quiet patch. No body is visible yet, but “empty” is becoming harder to write.",
   "静かな場所で砂粒が動いた。身体はまだ見えないが、「空」とは書きにくくなった。"
  ]
 ],
 [
  [
   "下面",
   "Underneath",
   "下"
  ],
  [
   "几粒沙向两边滑开。手指按住那里，沙便松开；再停一会儿，可以把里面的身体轻轻提起，松手放回。旁边没有动静的一小块，也未必没有谁。",
   "A few grains slide apart. Hold there to loosen the sand; keep holding to lift the body gently, then release to put it back. The still patch beside it may be occupied too.",
   "砂粒が左右へ滑る。そこを押し続けると砂がほぐれ、少し待てば身体をそっと持ち上げられる。離せば戻せる。隣の静かな砂にも、何かいるかもしれない。"
  ],
  [
   "把下面也算进去",
   "Include what is underneath",
   "下も含めておく"
  ],
  [
   "你给图多留了一层。那一层还没有画满，沙面已经足够完整。",
   "You leave another layer in the diagram. It is unfinished; the surface already looks complete.",
   "図にもう一層の余地を残した。そこは描き終えていないのに、表面はもう整って見える。"
  ],
  [
   "只记看清的部分",
   "Record only what is clear",
   "見えた部分だけを記す"
  ],
  [
   "这次的记录很短。短的是记录，不是这里的生活。",
   "The entry is short. It is the entry that is short, not the life here.",
   "短い記録になった。短いのは記録で、ここの暮らしではない。"
  ]
 ],
 [
  [
   "松动的边缘",
   "A loosened edge",
   "緩んだ縁"
  ],
  [
   "翻开的沙比周围松一点。一只从凹边绕过去，触角碰了碰，随后继续走。你留下的东西暂时成了地形。",
   "The opened sand is looser than its surroundings. An isopod skirts the hollow, touches the rim with its antennae, then moves on. What you left has briefly become terrain.",
   "開いた砂は周囲より少し緩い。一匹がくぼみを回り、触角で縁に触れて進んだ。残したものが、しばらく地形になっている。"
  ],
  [
   "画下绕行的路",
   "Draw the detour",
   "回り道を描く"
  ],
  [
   "线绕着凹处弯了一下。你在图外，手留下的痕迹却在图内。",
   "The line bends around the hollow. You are outside the diagram; your hand's trace is inside it.",
   "線がくぼみをよけた。あなたは図の外にいる。手の跡は中にある。"
  ],
  [
   "等边缘落回去",
   "Wait for the rim to settle",
   "縁が戻るのを待つ"
  ],
  [
   "几粒沙落下去，凹处浅了一点。刚才的绕路没有留下固定的理由。",
   "A few grains fall and the hollow shallows. The detour is losing its fixed reason.",
   "砂粒が落ち、くぼみが浅くなった。回り道の理由は、そこに固定されなかった。"
  ]
 ],
 [
  [
   "影子的边界",
   "The edge of a shadow",
   "影の境界"
  ],
  [
   "光被你挡住了一小块。一只停在影子的边缘，触角还在动。你很容易把这次停顿叫作犹豫。",
   "You block a small patch of light. An isopod pauses at the edge, antennae still moving. It is easy to call this hesitation.",
   "光を少し遮った。一匹が影の縁で止まり、触角だけが動く。この停止を、ためらいと呼ぶのは簡単だった。"
  ],
  [
   "把影子移开",
   "Move the shadow",
   "影をよける"
  ],
  [
   "亮处移过去，它仍停了一会儿。解释走得比身体快。",
   "The light moves across. It stays a little longer. The explanation moved faster than the body.",
   "光が移っても、しばらく止まっていた。説明のほうが身体より速く進んだ。"
  ],
  [
   "把“犹豫”留在页边",
   "Leave “hesitation” in the margin",
   "「ためらい」を余白へ"
  ],
  [
   "正文里只剩“停下”。这个词小一些，也还装得下触角的动作。",
   "Only “paused” remains in the entry. It is a smaller word, with room for moving antennae.",
   "本文には「停止」だけが残った。小さな言葉だが、触角の動きも収まる。"
  ]
 ],
 [
  [
   "另一处出口",
   "Another exit",
   "別の出口"
  ],
  [
   "左边的轮廓消失后，右边露出一个相似的背面。中间那段沙很平。你画到一半的连线，正好经过看不见的地方。",
   "An outline vanishes on the left; a similar back appears on the right. The sand between is level. Your half-drawn line crosses precisely what you cannot see.",
   "左で輪郭が消え、右で似た背が現れた。間の砂は平らだ。描きかけの線は、見えない場所をちょうど通っている。"
  ],
  [
   "保留两个位置",
   "Keep the two positions",
   "二つの位置を残す"
  ],
  [
   "两个点隔着一段白纸。它们没有因此变成两只，也没有因此变成一只。",
   "Two dots stand apart on white paper. That makes them neither two animals nor one.",
   "白紙を挟んで二つの点がある。それで二匹になったわけでも、一匹になったわけでもない。"
  ],
  [
   "给连线加问号",
   "Question the connecting line",
   "線に疑問符を添える"
  ],
  [
   "线仍在，确定少了一点。纸没有因为这点减少而变得难看。",
   "The line stays; certainty diminishes. The page is none the worse for it.",
   "線は残り、確かさが少し減った。紙はそのぶん見苦しくはならなかった。"
  ]
 ],
 [
  [
   "身体收进去",
   "Tucking away",
   "身体が収まる"
  ],
  [
   "前端先进入沙里，后半身又拱了几下。最后一节消失时，附近还有细小的沙粒在动。动作结束得比你的视线晚一点。",
   "The front enters first; the rear heaves a few more times. When the last segment disappears, nearby grains are still moving. The action outlasts the visible body.",
   "前から潜り、後ろ半分が何度か持ち上がる。最後の節が消えても、そばの砂粒は動いていた。身体より動作のほうが長く残った。"
  ],
  [
   "看到沙粒停下",
   "Watch until the grains stop",
   "砂粒が止まるまで見る"
  ],
  [
   "最后一粒也停了。你看见的是停下，下面的事情没有一起交代。",
   "The last grain stops. You have seen it stop; nothing below has been accounted for.",
   "最後の一粒も止まった。見えたのは停止で、下の事情まで明らかになったわけではない。"
  ],
  [
   "记下消失的位置",
   "Mark the disappearance",
   "消えた位置を記す"
  ],
  [
   "标记留下了一个小点。它比住在下面的身体更愿意待在原处。",
   "A small dot remains. It is more willing to stay put than the body below.",
   "小さな点が残る。下にいる身体より、こちらのほうが同じ場所にいてくれる。"
  ]
 ],
 [
  [
   "经过的水",
   "Passing water",
   "通り過ぎる水"
  ],
  [
   "薄水越过刚才的凹处，边缘很快浅了。浪退下去，较深的沙色留在原地。来过的东西并不都留下同一种痕迹。",
   "Thin water crosses the hollow and softens its rim. As the wave retreats, darker sand remains. Visitors do not all leave the same kind of trace.",
   "薄い水がくぼみを越え、縁を浅くした。波が引くと濃い砂色が残った。通ったものが同じ跡を残すとは限らない。"
  ],
  [
   "沿着新的湿边看",
   "Follow the new wet edge",
   "新しい湿りの縁を見る"
  ],
  [
   "新的边缘接到旧的沙纹上。你很难指出，变化具体从哪一粒开始。",
   "The new edge joins the old ripples. It is hard to name the grain where change began.",
   "新しい縁が古い砂紋につながる。変化がどの一粒から始まったかは、指せなかった。"
  ],
  [
   "留着原来的位置",
   "Keep the earlier position",
   "元の位置を残す"
  ],
  [
   "图上的点没有移动，现在却已经不在水的同一边。",
   "The dot has not moved. It is no longer on the same side of the water.",
   "図の点は動いていない。それでも、水の同じ側にはいなくなった。"
  ]
 ],
 [
  [
   "至少",
   "At least",
   "少なくとも"
  ],
  [
   "露在外面的身体比刚才少。你重新数了一遍，结果一样。沙下没有配合这次复核。",
   "Fewer bodies are visible. You count again and get the same result. The sand below has not participated in the check.",
   "見える身体が減った。数え直しても同じだった。砂の下は、この確認に参加していない。"
  ],
  [
   "在数字前加“至少”",
   "Put “at least” before the number",
   "数の前に「少なくとも」"
  ],
  [
   "数字没变，能容下的事情多了一点。",
   "The number is unchanged. It can accommodate a little more now.",
   "数は変わらない。収まることが少し増えた。"
  ],
  [
   "只写“此刻看见”",
   "Write “visible now”",
   "「いま見える」と書く"
  ],
  [
   "这几个字把你也留在记录里，虽然没有写你的名字。",
   "Those words keep you in the record too, without writing your name.",
   "その言葉には、名前を書かずにあなたも記録されている。"
  ]
 ],
 [
  [
   "仍在这里",
   "Still here",
   "まだここに"
  ],
  [
   "沙面又平了一些。一只从画面边缘经过，没有走进你最后画出的圈。这一页快写完了，圈外并没有跟着变少。",
   "The sand is more level again. One passes along the edge without entering your final circle. The page is nearly finished; what lies outside it has not diminished.",
   "砂はまた平らになった。一匹が、最後に描いた円に入らず縁を通る。頁は終わりに近いが、円の外が減ったわけではない。"
  ],
  [
   "把圈留着",
   "Keep the circle",
   "円を残す"
  ],
  [
   "它现在标出你看过的一小块。够小，就不必冒充整片沙滩。",
   "It marks the small patch you watched. Small enough, it need not stand for the whole beach.",
   "見た小さな場所の印になった。小さければ、浜辺全体のふりをしなくてよい。"
  ],
  [
   "在圈边留一个缺口",
   "Leave a gap in the circle",
   "円に切れ目を残す"
  ],
  [
   "笔停下来。缺口没有替谁安排出去的方向。",
   "The pen stops. The gap assigns nobody a way out.",
   "ペンが止まる。切れ目は、誰にも出る方向を決めなかった。"
  ]
 ]
];
beats.forEach(([title,prompt,left,leftAfter,right,rightAfter],i)=>{
 for(const [key,value] of Object.entries({title,prompt,left,leftAfter,right,rightAfter}))rows[`${i}:${key}`]=value;
});
rows.cycle=['九次观察','Nine observations','九つの観察'];
const endings={
 calm:[['空处仍有余地','Room in the blank','空白の余地'],['你留了几处没有补齐的空白。等待没有使沙下变得透明，却让“没看见”不再等同于“没有”。最后露出的轮廓，也没有把这一页填满。','You leave several blanks unfinished. Waiting has not made the sand transparent; it has loosened the connection between unseen and absent. The last outline does not fill the page.','埋めない空白がいくつか残った。待っても砂は透明にならない。ただ、見えないことと、いないことが少し離れた。最後の輪郭も頁を埋め尽くさない。'],['空白也可以是一种准确。','A blank can be a kind of accuracy.','空白も、正確さの一つになる。']],
 care:[['手留下的地形','Terrain left by a hand','手が残した地形'],['几次翻沙以后，你认出了自己留下的凹边。有身体绕过它，也有水从那里经过。记录里原本只有被观察的对象，现在多出了一只没有画全的手。','After turning the sand, you recognise the rims you left. Bodies go around them; water passes through. A record once filled only with subjects now includes an unfinished hand.','砂を返すうち、自分の残した縁が分かるようになった。身体がよけ、水が通る。観察されるものだけだった記録に、描ききれない手が加わった。'],['观察者不必出镜，也会改变画面。','An observer can change the scene without entering the picture.','観察者は写らなくても、景色を変える。']],
 trace:[['两点之间','Between two points','二つの点の間'],['你留下了位置、轮廓和几条没有接完的线。有些相似的身体始终没能确认是不是同一只。地图比开始时细了，仍有地方只属于沙子。','You keep positions, outlines and a few unfinished lines. Some similar bodies never become certain identities. The map is finer than before; parts of it still belong only to sand.','位置と輪郭、結び終えない線が残った。似た身体のいくつかは、同じ個体か分からないままだ。地図は細かくなったが、砂だけの場所も残っている。'],['连线很容易，经过那里则是另一回事。','Drawing a connection is easy. Passing through it is another matter.','線で結ぶのは簡単だ。そこを通るのは別のことだ。']]
};
for(const [kind,parts] of Object.entries(endings))['title','body','line'].forEach((key,i)=>rows['ending:'+kind+':'+key]=parts[i]);

export const sandText=(key,lang='zh')=>{const row=rows[key.replace(/^sand:/,'')];return !row?key:lang==='isopod'?encodeIsopodText(row[0]):row[{zh:0,en:1,ja:2}[lang]??0]};
export function sandScene(s){const i=Math.min(8,(s.day-1)*3+s.period);return {id:`sand:${i}`,kind:'aquatic',title:`sand:${i}:title`,text:`sand:${i}:prompt`,storyKey:`sand:${i}`,options:[{id:'sand-look',label:`sand:${i}:left`,text:`sand:${i}:leftAfter`,delta:{}},{id:'sand-wait',label:`sand:${i}:right`,text:`sand:${i}:rightAfter`,delta:{quiet:1}}]}}

export const sandIndex=s=>Math.min(8,Math.max(0,(s.day-1)*3+s.period));
export function sandEndingKind(s){
 const touched=(s.directGrabs||0)+(s.groundTaps||0);
 if(touched>=3)return 'care';
 const records=(s.records||[]).filter(r=>['sand-look','sand-wait'].includes(r.choice));
 const waiting=records.filter(r=>r.choice==='sand-wait').length;
 return waiting>records.length/2?'calm':'trace';
}

const local=(row,lang)=>lang==='isopod'?encodeIsopodText(row[0]):row[{zh:0,en:1,ja:2}[lang]??0];
export function sandInstrument(s,tides,lang='zh'){
 const i=sandIndex(s),level=Math.round(s.tide),previous=tides[Math.max(0,i-1)];
 const direction=i===0?['初退','Ebb begins','引き始め']:level>previous?['上移','Advancing','前進']:['下移','Retreating','後退'];
 const surface=[['平整','Level','平ら'],['微动','Stirring','微動'],['松散','Loose','ほぐれる'],['回落','Settling','落ち着く'],['交错','Crossed','交差'],['松散','Loose','ほぐれる'],['抹平','Smoothed','ならされる'],['覆水','Washed','水に覆われる'],['平整','Level','平ら']][i];
 return [local(['浪位','Wash','波の位置'],lang)+' '+(lang==='isopod'?encodeIsopodText(String(level)):level+'/100'),local(['浪向','Direction','波向'],lang)+' '+local(direction,lang),local(['沙面','Surface','砂面'],lang)+' '+local(surface,lang)];
}
