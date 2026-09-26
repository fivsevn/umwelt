import {encodeIsopodText} from '../../locales/isopod.mjs';
const row=(title,prompt,labels,after)=>({title,prompt,labels,after});
export const SEAWEED_OBSERVATIONS=[
 row(['叶缘','The blade edge','葉の縁'],['藻叶在水中慢慢摆动。沿着叶缘找一找，身体也可能随着它移动。','The blades sway slowly. Look along an edge: a body may be moving with it.','藻葉がゆっくり揺れる。縁に沿って見ると、一緒に動く身体が見つかるかもしれない。'],[['沿着叶缘看','Watch the edge','葉の縁を見る'],['看看藻根','Look near the holdfast','付着器を見る'],['记下这一处','Note this place','この場所を記す']],['目光沿着叶缘停了一会儿。','Your gaze stays with the blade edge.','葉の縁にしばらく目を留める。']),
 row(['缝隙','A gap','隙間'],['两片藻叶重叠的地方，视线停在前面的一片。缝隙会随摆动开合。','Where two blades overlap, the nearer one stops your view. The gap opens and closes with their sway.','二枚の葉が重なる場所では、手前の葉に視線が止まる。揺れとともに隙間が開閉する。'],[['轻拨前面的藻叶','Part the nearer blade','手前の葉をよける'],['等缝隙自己打开','Wait for the gap to open','隙間が開くのを待つ'],['记下遮住的位置','Note the covered place','隠れた場所を記す']],['这一处遮蔽留在记录里。','This covered place remains in the record.','この隠れた場所を記録に残す。']),
 row(['随动','Moving together','一緒に揺れる'],['停在叶面上的身体，和水里的颗粒经过不同的路线。把目光留在一片叶上。','A body resting on a blade follows a different route from the particles in the water. Keep watching one blade.','葉にとまる身体と水中の粒は、違う道を通る。一枚の葉に目を留める。'],[['看步足接触的地方','Watch where the feet touch','脚が触れる場所を見る'],['看整片叶的摆动','Watch the whole blade','葉全体の揺れを見る'],['画一段短线','Draw a short line','短い線を描く']],['纸上添了一段线，叶片仍在水中。','A short line joins the page; the blade stays in the water.','紙に短い線が加わり、葉は水中にある。']),
 row(['叶背','Behind a blade','葉の裏'],['叶缘两侧的光不同。身体经过重叠处时，有些部分会先被挡住。','Light differs on either side of the edge. At an overlap, parts of a passing body can disappear first.','葉の縁の両側で光が違う。重なりを通る身体は、一部から隠れていく。'],[['守着这片叶','Stay with this blade','この葉を見続ける'],['看相邻的叶片','Watch the next blade','隣の葉を見る'],['留下一处空白','Leave a gap in the note','記録に空白を残す']],['看不见的部分没有补画。','The unseen part is left undrawn.','見えない部分は描き足さなかった。']),
 row(['相邻','Within reach','隣り合う葉'],['相邻叶片时而靠近，时而分开。叶面之间还有一小段水。','Neighbouring blades approach and separate. A little water remains between their surfaces.','隣の葉が近づき、また離れる。葉面の間には少しの水がある。'],[['跟着移动的身体','Follow a moving body','動く身体を追う'],['留在原来的叶边','Stay by the first blade','元の葉の縁に留まる'],['只记清楚的一段','Note only the visible part','見える部分だけ記す']],['记录只接上看清楚的那一段。','Only the clearly seen stretch enters the record.','はっきり見えた部分だけを記した。']),
 row(['底部','Near the bottom','底の近く'],['下方的藻体贴近石边，褶皱之间还有细小的空处。这里的摆动更短。','Lower blades lie near the stones, with small spaces between folds. Their sway is shorter here.','下の藻は石のそばにあり、ひだの間に小さな空間がある。ここでは揺れが小さい。'],[['看看底部的褶皱','Look between the lower folds','下のひだを見る'],['继续看上方的藻叶','Keep watching the upper blades','上の葉を見続ける'],['标出两处位置','Mark both places','二か所を記す']],['上方与下方各占了纸上的一处。','The upper and lower places each receive a mark.','上と下の場所をそれぞれ紙に記した。']),
 row(['遮住','Out of sight','見えない間'],['一片前景藻叶从视线前摆过。被遮住的地方，水还在经过。','A foreground blade sways across your view. Water still passes through the covered place.','手前の葉が視線を横切る。隠れた場所にも水は流れている。'],[['等这一片摆开','Wait for this blade to pass','この葉が動くのを待つ'],['轻拨一下再松手','Part it, then release','軽くよけて離す'],['记下最后看见的位置','Note the last visible place','最後に見えた場所を記す']],['视线中断的地方留了下来。','The point where the view broke remains marked.','視線が途切れた場所を残した。']),
 row(['重现','A glimpse again','また見える'],['再看看邻近的缝隙。那里露出的轮廓，未必能和刚才的一一对应。','Look again through a neighbouring gap. A shape there may not be identifiable as the one seen earlier.','隣の隙間をもう一度見る。そこに見える輪郭を、先ほどのものと結びつけられるとは限らない。'],[['看新露出的部分','Watch what comes into view','新しく見える部分を見る'],['继续等在原处','Keep waiting here','同じ場所で待つ'],['不替它补上路线','Leave the missing route open','見えない経路を埋めない']],['两段记录之间仍有空白。','A gap remains between the two notes.','二つの記録の間には空白が残る。']),
 row(['松手','Letting go','手を離す'],['把手从藻叶上移开。再看一会儿，这一页就停在这里。','Take your hand away from the blade. Watch a little longer, then leave the page here.','藻葉から手を離す。もう少し眺めて、この頁をここで終える。'],[['留在这里看一会儿','Watch a little longer','もう少し眺める'],['看回最初的叶缘','Return to the first edge','最初の葉の縁を見る'],['合上这一页','Close this page','この頁を閉じる']],['这一页停下了。藻叶继续摆动。','The page ends. The blades keep swaying.','頁が終わる。藻葉は揺れ続ける。'])
];
// Each choice keeps its own observation, including when no movement was seen.
const ALTERNATE_RESPONSES=[
 [['目光移到藻根附近，叶尖暂时留在视线外。','Your gaze moves towards the holdfast; the tips leave your attention.','付着器の近くへ目を移し、葉先から目を離した。'],['纸上标出一处叶缘。下一次再看，仍要重新寻找。','An edge is marked on the page. Finding it again will take another look.','紙に葉の縁を記した。次に見る時は、また探すことになる。']],
 [['手留在藻丛外，缝隙随水流开合。','Your hand stays outside the bed as the gap opens and closes.','手を藻の外に置き、隙間の開閉を眺めた。'],['只标出视线停住的位置，叶后的部分仍然空着。','You mark where the view stops and leave the space behind the blade blank.','視線の止まる位置だけを記し、葉の裏は空白にした。']],
 [['目光跟着整片叶，水中的颗粒从旁边经过。','You follow the whole blade while particles pass beside it.','葉全体を目で追い、そのそばを粒が通る。'],['短线留在纸上，没有跟着水流摆动。','The short line stays on the page, untouched by the current.','短い線は紙に留まり、水流では揺れない。']],
 [['目光移到相邻叶片，原来的叶背留在视线之外。','You turn to the next blade; the first underside leaves your view.','隣の葉に目を移し、元の葉裏から目を離した。'],['空白留在叶缘旁，没有补上看不见的身体。','A blank remains by the edge; no unseen body is filled in.','葉の縁のそばに空白を残し、見えない身体を描き足さなかった。']],
 [['你守着原来的叶边，邻近叶片继续靠近、分开。','You stay by the first edge as neighbouring blades approach and separate.','元の縁に留まり、隣の葉が近づき離れるのを見た。'],['清楚的一段被记下，水中的空处仍留在两端之间。','The visible stretch is recorded; the water between its ends stays open.','見えた部分を記し、その間の水は空白に残した。']],
 [['目光回到上方，底部的褶皱留给下一次观察。','Your gaze returns above; the lower folds wait for another observation.','上方へ目を戻し、下のひだは次の観察に残した。'],['纸上添了上下两个位置，连接它们的路线没有画出。','Two positions are marked, without a route connecting them.','上下二か所を記し、つなぐ経路は描かなかった。']],
 [['目光仍留在这一片叶附近。','Your gaze stays near this blade.','この葉の近くに目を留めた。'],['最后看清楚的位置被记下，后面的部分没有接上。','The last clearly seen position is marked; the rest stays unjoined.','最後にはっきり見えた位置を記し、その先はつながなかった。']],
 [['你继续守着原处，没有追到另一片叶后面。','You keep watching the same place without following behind another blade.','同じ場所を見続け、別の葉の裏までは追わなかった。'],['没有把分开的两段线连成一条。','The two separate lines are not joined into one.','離れた二本の線を一本につながなかった。']],
 [['目光回到最初的叶缘，它已经换了一个角度。','You return to the first edge; its angle has changed.','最初の葉の縁へ目を戻すと、向きが変わっていた。'],['纸页合上，藻叶仍在水里。','The page closes; the blades remain in the water.','頁を閉じても、葉は水中にある。']]
];
const COPY={arrival:['这片藻丛里的等足目','Among these blades','この藻の間で'],hint:['指尖贴近藻叶。按住，轻轻拨向一旁，再松开。','Rest a fingertip on a blade. Hold, gently draw it aside, then let go.','葉に指先を寄せる。押したままそっとよけて、離す。'],clock:['观察时刻','Observation time','観察時刻'],slow:['缓流','Gentle flow','緩い流れ'],full:['流势渐强','Stronger flow','流れが強まる'],ease:['流势渐缓','Easing flow','流れが緩む'],light:['疏光','Dappled light','木漏れの光'],sway:['叶尖轻摆','Tips sway','葉先が揺れる'],sweep:['叶片起伏','Blades sweep','葉がうねる'],cycle:['九次藻间观察','Nine observations among blades','藻の間の九回の観察'],ending:['叶间的空处','Spaces between blades','葉の間の空間'],body:['叶片摆回水里，缝隙又换了形状。记录留下了几处位置，也留下了没有接上的路线。','The blades swing back into the water and the gaps change shape. A few positions remain in the notes, along with routes left unjoined.','葉が水中へ戻り、隙間の形が変わる。記録には幾つかの位置と、つながらなかった経路が残る。'],line:['下一阵水从藻间经过。','Another current passes between the blades.','次の流れが藻の間を通る。'],memory:['观察期间，你的手也曾进入这片藻丛。','Your hand also entered the bed during this observation.','観察の間、手も藻の間に入った。'],plucked:['你拨动过的叶片正在回摆。','The blade you moved is swinging back.','動かした葉が戻りつつある。'],crossed:['这次停留中，有身体到达了另一片藻叶。','During this pause, a body reached another blade.','この間に、別の葉へ移った身体があった。'],hidden:['这次停留中，有轮廓完全被藻叶挡住。','During this pause, a body was fully covered by a blade.','この間に、葉にすっかり隠れた輪郭があった。'],quiet:['手停在前面的藻叶旁，叶后的缝隙仍在开合。','Your hand rests beside the nearer blade. The gap behind it still opens and closes.','手を手前の葉のそばに置く。裏の隙間はまだ開閉している。']};
export const SEAWEED_ENDING={id:'shallow-marine-observed',title:'kelp:ending',body:'kelp:body',line:'kelp:line'};
export const isSeaweed=s=>s?.habitatId==='shallow-marine'&&s?.seaweedVersion===1;
export const seaweedProgress=s=>(s.records||[]).filter(r=>r.kind==='seaweed-observation').length;
export const seaweedIndex=s=>Math.min(8,Math.max(0,seaweedProgress(s)-(s.stage==='feedback'||s.stage==='ended'?1:0)));
export function seaweedText(key,lang='zh'){
 const [,kind,i,field,n,event]=key.split(':');let value;
 if(kind==='node'){
  const node=SEAWEED_OBSERVATIONS[Number(i)];value=field==='label'?node?.labels[Number(n)]:node?.[field];
  if(field==='after'&&Number(n)>0)value=ALTERNATE_RESPONSES[Number(i)]?.[Number(n)-1]||value;
  if(field==='after'&&event&&COPY[event]){const base=value;value=event==='quiet'?COPY.quiet:base.map((text,j)=>text+' '+COPY[event][j])}
 }else value=COPY[kind];
 if(!value)return key;
 return lang==='isopod'?encodeIsopodText(value[0]):value[{zh:0,en:1,ja:2}[lang]??0];
}
export function seaweedScene(s){const i=seaweedIndex(s),key=`kelp:node:${i}`;return {id:`kelp:${i}`,title:key+':title',kind:'seaweed-observation',text:key+':prompt',observationIndex:i,options:SEAWEED_OBSERVATIONS[i].labels.map((_,j)=>({id:`kelp-${i}-${j}`,label:key+':label:'+j,text:key+':after:'+j,delta:j===2?{labels:1}:{quiet:1},...((i===1&&j===0)||(i===6&&j===1)?{interaction:{type:'seaweed',prompt:'kelp:hint'}}:{})}))}}
export function seaweedFeedback(s,option){
 const evidence={...(s.seaweedEvidence||{})},i=seaweedIndex(s),j=Number(option.id.split('-').at(-1));
 const askedToPart=(i===1&&j===0)||(i===6&&j===1);
 const event=evidence.plucked?'plucked':askedToPart?'quiet':evidence.crossed?'crossed':evidence.hidden?'hidden':'';
 return {text:option.text+(event?':'+event:''),evidence};
}

// Authored observation times and flow, not measurements or a local tide prediction.
export const SEAWEED_CONDITIONS=[['09:12',46],['09:16',48],['09:21',52],['09:27',58],['09:33',62],['09:40',55],['09:47',49],['09:54',43],['10:02',38]];
export function seaweedInstrument(s,lang){const i=seaweedIndex(s);return [i<3?'slow':i<5?'full':'ease','light',i>=3&&i<6?'sweep':'sway'].map(k=>seaweedText('kelp:'+k,lang))}
