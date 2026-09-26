import {shoreFaunaSnapshot} from './shore-fauna.mjs';
import {shoreLocalSalinity} from './shore-hydrology.mjs';
import {encodeIsopodText} from '../../locales/isopod.mjs';
export const isShore=s=>s?.habitatId==='estuary'&&s?.estuaryShoreVersion===1;
export const SHORE_TURNS=8;
export const shoreProgress=s=>(s?.records||[]).filter(r=>r.evidence?.version===2).length;
export const shorePoint=s=>Math.max(0,Math.min(2,Number.isInteger(s?.shorePoint)?s.shorePoint:1));
export const shoreIndex=s=>Math.max(0,Math.min(7,shoreProgress(s)-(['feedback','ended'].includes(s?.stage)?1:0)));
export const shoreTide=s=>shoreIndex(s)%4;
export const shoreRain=s=>((s.seed>>>0)%7===0)&&shoreIndex(s)>=4&&shoreIndex(s)<=5;
export const shoreFauna=s=>shoreFaunaSnapshot(s.cohort||[],shorePoint(s),shoreIndex(s));
export const shoreVisible=s=>shoreFauna(s).some(a=>a.visible);
export function shoreBranch(s){
 const found=shoreVisible(s),previous=(s.records||[]).filter(r=>r.evidence?.version===2&&r.evidence.point===shorePoint(s)).at(-1)?.evidence;
 return found?(previous?(previous.found?'again':'return'):'found'):(previous?.found?'lost':'quiet');
}
export const SHORE_COORDINATES=Object.freeze([[-7.4,2.1],[0,0],[11.8,-3.6]]);
export function shoreReadings(s){
 const point=shorePoint(s),tide=shoreTide(s),rain=shoreRain(s);
 return {depth:Math.max(.03,[.24,.46,.16,.06][tide]+point*.04),salinity:shoreLocalSalinity(point,tide,rain),flow:[3.6,.8,2.8,.4][tide]+point*.3,tide};
}
export const shoreWalkLabel=(s,delta,lang='zh')=>shoreText('walk:'+Math.max(0,Math.min(2,shorePoint(s)+delta)),lang);
const rows={
 'point:0':['河侧','River side','川側'],'point:1':['汽水交界','Brackish edge','汽水の岸'],'point:2':['海侧','Sea side','海側'],
 'tide:0':['涨潮','Rising tide','上げ潮'],'tide:1':['满潮','High tide','満潮'],'tide:2':['退潮','Ebbing tide','下げ潮'],'tide:3':['低潮','Low tide','干潮'],
 'walk:0':['往河侧走','Walk riverward','川側へ歩く'],'walk:1':['往交界走','Walk to the edge','汽水の岸へ'],'walk:2':['往海侧走','Walk seaward','海側へ歩く'],
 'position':['沿岸局部坐标','Local bank coordinates','岸辺の局所座標'],
 'prev':['向河侧走','Walk riverward','川側へ'],'next':['向海侧走','Walk seaward','海側へ'],
 'intro':['河水与海水在这里碰面。岸边的潮水正慢慢靠近。','River and sea meet here. The water slowly approaches the bank.','川と海がここで出会う。岸辺で足を止めると、潮がゆっくり近づいてくる。'],
 'hint':['沿哪边再走走？点岸上的脚印换个地方，或留在这里，继续观察。按住它们，可以轻轻捧起。','Which way along the bank? Click the footprints to move, or stay here and continue observing. Hold a small body for a gentle lift.','どちらへ歩こう。岸の足跡を押して移動するか、ここで観察を続けよう。小さな身体を長押しすると、そっと持ち上げられる。'],
 'linger':['沿岸再走几步，还是留在这里看一会儿？','A few more steps along the bank, or a little longer here?','岸沿いにもう少し歩こうか、ここでもうしばらく眺めようか。'],
 'canvas':['河口岸边，点击岸上脚印切换观察点','Estuary bank; use the footprints to walk along the shore','河口の岸辺。足跡を押して観察点を移動'],
 'arrival':['先在岸边停下来。','Pause beside the water.','まず岸辺に立ち止まる。'],
 'watch':['继续观察','Continue observing','観察を続ける'],
 'recorded':['已记录。','Recorded.','記録した。'],
 'quiet':['水还在经过。','Water keeps passing.','水は流れていく。'],
 'rain':['上游刚下过雨，水色浑了一点。','Rain upstream has clouded the water a little.','上流の雨で、水が少し濁った。'],
 'cycle':['岸边的潮水往返','Tides beside the bank','岸辺の潮の往復'],
 'ending:title':['水边还在','The bank remains','水際は残る'],
 'ending:body':['刚才露出的岸边又被水淹过。漂流木没走多远，水已经换过几次。','Water covers the exposed bank again. The driftwood barely moved; the water has changed several times.','立っていた場所をまた水が覆う。流木はほとんど動かず、水は何度か入れ替わった。'],
 'ending:line':['岸边没有收场。','The bank does not close.','岸辺には幕が下りない。']
};
const observations=[
 [
 ['水向芦苇那边漫上来，绕过木片的边缘。','Water rises toward the reeds and around the edge of the wood.','水が葦の方へ広がり、木片の縁を回り込む。'],
 ['浅水漫过旧水线。几片植物碎屑从面前经过。','Shallow water crosses the old waterline. A few plant fragments drift past.','浅い水が古い水際を越える。植物のかけらが流れていく。'],
 ['开阔处的水先动起来。银灰色的小鱼偶尔从浅水里穿过。','The open water moves first. Small silver fish sometimes pass through the shallows.','開けた水面が先に動く。銀灰色の小魚が時々浅瀬を横切る。']
 ],[
 ['芦苇的影子落在水边。木片外缘只剩一道窄窄的湿痕。','Reed shadows fall beside the water. A narrow wet mark remains along the wood.','葦の影が水際に落ちる。木片の縁に細い湿り跡が残る。'],
 ['水没过那块矮石。刚才的泥面，成了鱼能经过的地方。','Water covers the low stone. The mud from a moment ago is now a passage for fish.','低い石が水に沈む。さっきの泥面を、今は魚が通れる。'],
 ['一阵细小的水纹散开。小鱼过去以后，浅水又平静了。','Small ripples spread. After the fish pass, the shallows settle again.','細かな波紋が広がる。魚が通ると、浅瀬はまた静まる。']
 ],[
 ['潮水退开，木边露出湿痕。细泥还贴在背水的一面。','The tide draws back, leaving wet marks and fine mud beside the wood.','潮が退き、木際に湿り跡と細かな泥が残る。'],
 ['砂泥重新露出来。小小的身体停在漂流木的缺口旁。','Sandy mud emerges again. A small body pauses beside a notch in the driftwood.','砂泥がまた現れる。流木の切れ目の脇で小さな身体が止まる。'],
 ['水向开阔处退去，石脚留着一圈湿润的边缘。','Water withdraws toward the open side, leaving a wet rim around the stone.','水が開けた方へ退き、石の根元に湿った縁が残る。']
 ],[
 ['泥面的小孔露了出来。木片底下仍是暗湿的一片。','Small holes appear in the mud. The space under the wood is still dark and damp.','泥面に小穴が現れる。木片の下はまだ暗く湿っている。'],
 ['水只剩浅浅一层。它们沿湿砂移动，旁边留着更细的虫迹。','Only a thin layer of water remains. A small body crosses wet sand beside finer burrow traces.','水は薄く残るだけ。小さな身体が湿った砂を進み、その脇に細い這い跡がある。'],
 ['小蟹在洞口停一下，又缩回去。石头背水的一侧还没有干。','A small crab pauses at its hole, then retreats. The sheltered side of the stone is still wet.','小蟹が穴の口で止まり、また引っ込む。石の陰はまだ湿っている。']
 ]
];
const waterObservations=[
 ['蓝绿色的水向河侧伸来，灰绿的水团被挤出几条细长的尾巴。沉木还在原处。','Blue-green water reaches riverward, stretching the grey-green patches into narrow tails. The wood stays in place.','青緑の水が川側へ伸び、灰緑の水のかたまりが細い尾を引く。流木は同じ場所にある。'],
 ['蓝绿色已经越过沉木旁刚才的交界。两种水色之间，还夹着零碎的小块。','Blue-green water has passed the earlier meeting place beside the wood. Small patches remain between the two colours.','青緑の水が、流木の脇にあった先ほどの境を越えた。二つの水色の間に小さなかたまりが残る。'],
 ['灰绿色的来水往海侧铺开。沉木旁的蓝绿色退远了一点，交界又换了地方。','Grey-green river water spreads seaward. The blue-green patch beside the wood recedes, and the meeting place shifts again.','灰緑の川の水が海側へ広がる。流木の脇の青緑が少し遠ざかり、境がまた移る。'],
 ['灰绿色占得更宽了。蓝绿色仍留在海侧，两边没有分出一条整齐的线。','Grey-green water occupies more of the shallows. Blue-green remains seaward, without a neat line between them.','灰緑の水が浅瀬に広がった。青緑は海側に残り、間には整った一本の線もない。']
];
for(let tide=0;tide<4;tide++)observations[tide][1]=waterObservations[tide];
rows['rain-water']=['上游雨后的来水到了。灰绿色向海侧多铺开一截，这次涨潮，蓝绿色没能伸到上次那么远。','Rain-fed river water has arrived. Grey-green spreads farther seaward; this tide, blue-green does not reach as far upriver.','上流の雨の水が届いた。灰緑が海側へ伸び、今度の潮では青緑が前ほど川側へ届かない。'];
for(let tide=0;tide<4;tide++)for(let point=0;point<3;point++)rows[`scene:${tide}:${point}`]=observations[tide][point];
rows['watch']=['沿水线观察','Watch the waterline','水際を観察'];
rows['shelter']=['留意遮蔽处','Watch the shelters','物陰を観察'];
rows['focus:water']=['水线附近的变化留在这一行。湿边继续移动，轮廓的去向暂时没有连起来。','Changes beside the waterline enter this line. The damp edge keeps moving; the outlines do not yet form a continuous path.','水際の変化がこの行に残る。湿った縁は動き続け、輪郭の行方はまだつながらない。'];
rows['focus:cover']=['记录转向石木旁的阴影。湿痕、缝隙和露出的轮廓分别留下位置。','The record turns to shade beside stone and wood. Wet marks, crevices and visible outlines receive separate locations.','記録は石や木の陰へ移る。湿り跡、隙間、見える輪郭を別々に記す。'];
const tideActions=[
 ['水刚漫到的边缘变湿，遮蔽物旁出现了新的浅水。','New shallow water wets the edges beside shelter.','水が物陰の縁に届き、新しい浅瀬ができる。'],
 ['水盖住低处，石木背水的一侧留下了较缓的水流。','Water covers the low ground; the lee of stone and wood offers slower flow.','低い場所が水に覆われ、石や木の陰では流れが緩む。'],
 ['湿边随着退水往下移，原来露着浅水的地方开始见泥。','The wet edge moves down with the ebb, exposing mud beneath the shallows.','引く水とともに湿った縁が下がり、浅瀬から泥が現れる。'],
 ['露出的岸面渐宽，石下、木边和泥孔旁还留着湿痕。','More bank lies exposed; damp marks remain under stones, by wood and beside mud holes.','露出した岸が広がり、石の下や木際、泥穴の脇には湿り跡が残る。']
];
for(let i=0;i<4;i++)rows['goal:'+i]=tideActions[i];
const faunaRows={
 found:['湿润的边缘，小小的身体在遮蔽物旁停停走走。','Along the damp edges, small bodies pause and move beside shelter.','湿った縁を目で追うと、小さな身体が物陰で進んだり止まったりする。'],
 again:['这次仍能看见轮廓。笔记另起一行，与上次的路线隔开。','Outlines are visible again. A new line begins, separate from the earlier individual’s path.','今回も輪郭が見える。前の一匹の経路につながず、新しい行に記す。'],
 return:['上次留白的地方，这回出现了小小的轮廓。位置添进笔记，两次观察之间仍留着空隙。','A small outline appears where the last entry was blank. The location enters the notebook; the interval between observations remains open.','前回空欄だった場所に、小さな輪郭が現れた。位置を記し、二度の観察の間は空けておく。'],
 lost:['同一小段岸边，这次没有出现它们的轮廓。笔记停在“未见”。','On the same stretch of bank, no small outline is visible this time. The note stops at “not seen”.','同じ短い岸辺を見直す。今回は小さな輪郭が見つからず、「見えず」と記す。'],
 quiet:['观察了一会儿，仍没有看见它们。水从石边经过，记录里这一栏暂时空着。','After a while, none of the small bodies have come into view. Water passes the stone; that column stays blank for now.','しばらく見ても小さな身体は見えない。水が石の脇を流れ、その欄はひとまず空いたまま。']
};
for(const [branch,row] of Object.entries(faunaRows)){
 rows['fauna:'+branch]=row;
 for(let tide=0;tide<4;tide++)for(const focus of ['water','cover'])rows[`focus:${focus}:${tide}:${branch}`]=rows['focus:'+focus].map((text,i)=>text+' '+tideActions[tide][i]+' '+row[i]);
 for(let tide=0;tide<4;tide++)for(let point=0;point<3;point++)rows[`scene:${tide}:${point}:${branch}`]=observations[tide][point].map((text,i)=>text+' '+row[i]);
 rows['rain-water:'+branch]=rows['rain-water'].map((text,i)=>text+' '+row[i]);
}
rows['quiet']=['本次未见它们。','None seen this time.','今回は小さな姿を見かけなかった。'];
rows['ending:body']=['几次观察都留下了它们的轮廓。小小的身体靠着湿边与遮蔽物，水色的交界却几次越过了同一块木片。最后一行写完，岸边还留着没看过的地方。','Each visit left a small outline in the notebook. Small bodies stayed near damp edges and cover while the water colours crossed the same wood again. The last line is complete; parts of the bank remain unwatched.','観察のたび、小さな輪郭を記した。湿った縁や物陰のそばで、水色の境は同じ木片を何度も越えた。最後の行を書いても、まだ見ていない岸辺が残る。'];
rows['ending:mosaic:title']=['错开的岸边','Uneven encounters','出会いのずれる岸辺'];
rows['ending:mosaic:body']=['有几行画着轮廓，有几行只记下水线和“未见”。轮廓与留白并排留在同一页，没有连成一条连续的路线。潮水经过的岸边，比笔记上的空格更长。','Some lines hold outlines; others only a waterline and “not seen”. Outlines and gaps share the page without forming one continuous path. The tidal bank stretches beyond the gaps in the notebook.','輪郭を描いた行も、水際と「見えず」だけの行もある。一つの経路に補わず、同じ頁に残す。潮の通る岸辺は、手帳の空白より長い。'];
rows['ending:empty:title']=['空着的那一栏','The blank column','空いたままの欄'];
rows['ending:empty:body']=['这几次停留，没有它们的轮廓进入记录。位置、潮水和等候的时间都已记下，那一栏仍然空着。离开时，石下的阴影还在，水仍从旁边经过。','No small outline entered the record during these visits. Places, tides and time spent waiting fill the notes; the column remains blank. At departure, the shade beneath the stones remains and water keeps passing.','何度か足を止めても、小さな輪郭は記録に入らなかった。場所、潮、待った時間を記し、その欄を空けておく。立ち去る時も石の下には影があり、水が流れていた。'];
export const SHORE_TEXT_CATALOG=Object.freeze(Object.entries(rows).map(([key,row])=>({key:'estuary:v2:'+key,locales:{zh:row[0],en:row[1],ja:row[2]},refs:{habitat:['estuary']}})));
export function shoreText(key,lang='zh'){
 const row=rows[key.replace('estuary:v2:','')];if(!row)return key;
 return lang==='isopod'?encodeIsopodText(row[0]):row[{zh:0,en:1,ja:2}[lang]??0];
}
export const SHORE_ENDING={id:'estuary-shore',title:'estuary:v2:ending:title',body:'estuary:v2:ending:body',line:'estuary:v2:ending:line'};
export const SHORE_ENDINGS=[SHORE_ENDING,...['mosaic','empty'].map(kind=>({id:'estuary-shore-'+kind,title:`estuary:v2:ending:${kind}:title`,body:`estuary:v2:ending:${kind}:body`,line:'estuary:v2:ending:line'}))];
export function shoreEnding(s){const records=(s.records||[]).filter(r=>r.evidence?.version===2),found=records.filter(r=>r.evidence.found).length;return SHORE_ENDINGS[found===0?2:found<records.length?1:0]}
export function shoreScene(s){
 const index=shoreIndex(s),point=shorePoint(s),tide=shoreTide(s);
 return {id:`estuary-shore:${index}:${point}`,kind:'estuary-observation',estuaryNode:`shore-${tide}`,observationIndex:index,title:'estuary:v2:point:'+point,text:shoreRain(s)?'estuary:v2:rain-water:'+shoreBranch(s):`estuary:v2:scene:${tide}:${point}:${shoreBranch(s)}`,options:[{id:'shore-watch',label:'estuary:v2:watch',delta:{},lens:'shore',text:`estuary:v2:focus:water:${tide}:${shoreBranch(s)}`},{id:'shore-shelter',label:'estuary:v2:shelter',delta:{},lens:'cover',text:`estuary:v2:focus:cover:${tide}:${shoreBranch(s)}`}]};
}
export function shoreEvidence(s){return {version:2,point:shorePoint(s),tide:shoreTide(s),rain:shoreRain(s),found:shoreVisible(s),taxa:[...new Set((s.cohort||[]).filter((a,i)=>shoreFauna(s)[i].visible).map(a=>a.species))],branch:shoreBranch(s),focus:s.shoreFocus||'water'}}
export function moveShore(s,delta){
 if(!isShore(s)||s.stage!=='choice')return false;
 const next=Math.max(0,Math.min(2,shorePoint(s)+Math.sign(delta)));if(next===shorePoint(s))return false;
 s.shorePoint=next;s.shoreIntroDone=true;s.scene=null;s.shoreNotice=false;return true;
}
export function shoreRecordLine(r,lang='zh'){
 const e=r.evidence;return [shoreText('point:'+e.point,lang),shoreText('tide:'+e.tide,lang),shoreText(e.found?'recorded':'quiet',lang)].join(' · ');
}
