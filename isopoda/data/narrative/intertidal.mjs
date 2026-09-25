import {encodeIsopodText,isopodWaveNumber} from '../../locales/isopod.mjs';
// One authored low-to-low semidiurnal cycle, not a local tide prediction.
export const TIDE_MINUTES=[0,93,186,279,373,466,559,652,745];
export const TIDE_LEVELS=[24,34,59,84,94,84,59,34,24];
export const TIDE_FLOWS=[12,32,58,35,12,35,58,32,12];
export const isIntertidal=s=>s?.habitatId==='intertidal'&&!s.intertidalLegacy;
export const intertidalIndex=s=>Math.max(0,Math.min(8,(s.day-1)*3+s.period));
const local=(row,lang)=>lang==='isopod'?encodeIsopodText(row[0]):row[{zh:0,en:1,ja:2}[lang]??0];
const row=(name,prompt,labels,replies)=>({name,prompt,options:labels.map((label,i)=>({label,text:replies[i]}))});
export const INTERTIDAL_NODES=[
 row(['留下的浅水','Water left behind','残された浅水'],
 ['海退到石沿下面。几处湿面上仍有细小的动静，触角伸出去，又收回来。远处的石头看起来很近，中间却少了一段水。','The sea has slipped below the ledge. Small movements remain on a few wet surfaces; antennae reach out and withdraw. The next stone looks close; the water between is missing.','海が岩縁の下へ引いた。いくつかの湿った面で小さな動きが続き、触角が伸びては戻る。隣の石は近いのに、間の水が途切れている。'],
 [['看近处的触角','Watch the antennae','近くの触角を見る'],['沿池边看一圈','Look around the pool','池の縁をたどる'],['记下这道低水线','Mark the low waterline','低い水際を記す']],
 [['触角一前一后扫过湿面，身体还留在阴影里。小小的活动没有停，只是挤进了更窄的地方。','Antennae sweep the damp surface in turn. The bodies stay in shade. Movement continues in a smaller space.','触角が交互に湿った面を探る。身体は陰に残る。狭い場所でも動きは続く。'],['池底还留着水，石脊却露出来了。此刻能走的地方，被几段干湿相接的边缘分开。','Water remains in the pool, but the ridges are exposed. Wet and dry edges divide the available routes.','池底には水が残り、岩の稜は露出している。乾湿の境が道を分ける。'],['你在纸上留下一道短线。它只是这一次退潮的位置。','You draw a short line: the position of this low tide.','紙に短い線を引く。今回の干潮の位置だけを示す線だ。']]),
 row(['水先到石缝','The first wet seam','先に濡れる割れ目'],
 ['一小股水绕过石角，旧裂缝先亮了起来。靠近缝口的身体转了方向，步足仍抓着藻枝。','A trickle rounds the stone and lights the old crack. A body near its mouth turns, still gripping the weed.','水が石の角を回り、古い割れ目が光る。入口の個体が向きを変え、脚はまだ藻をつかんでいる。'],
 [['跟着缝口的身体','Follow the body at the crack','割れ目の個体を追う'],['看水怎样绕过石角','Watch water round the stone','石を回る水を見る'],['等水越过石沿','Wait at the ledge','岩縁で待つ']],
 [['它把前面的步足移过去，后面的还没松开。那段新路，先被试探了一下。','Its front legs reach across before the rear legs release. The new route is tested first.','前脚を伸ばし、後脚はまだ離さない。新しい道をまず探る。'],['水先填进凹处，再越过较低的一角。两边还没有完全连起来。','Water fills the hollow before spilling over a low corner. The two sides are not yet joined.','水は窪みを満たしてから低い角を越える。両側はまだつながりきらない。'],['你停在原处。触角仍在水边来回，涨潮不需要你的手把它推近。','You stay still. Antennae move at the edge as the tide approaches.','その場に留まる。近づく潮の縁で触角が動き続ける。']]),
 row(['两块石之间','Between two stones','二つの石の間'],
 ['浅水越过石脊，原来分开的两处接上了。一只细长的身体松开藻枝，划过短短一段水，又抓住另一边。','Shallow water crosses the ridge, joining two separate patches. A slender body releases the weed, paddles a short gap and grips the other side.','浅水が岩の稜を越え、離れた場所をつなぐ。細長い個体が藻を離れ、短い間を泳いで向こうをつかむ。'],
 [['看它松开步足','Watch it let go','脚を離すところを見る'],['看新接上的通路','Watch the joined route','つながった道を見る'],['记下两次抓附','Mark both grips','二度の付着を記す']],
 [['悬空的片刻很短。游过之后，它又贴回表面，触角朝新的方向伸开。','The free passage is brief. It settles against a surface and extends its antennae in a new direction.','浮く時間は短い。再び面に寄り、別の方向へ触角を伸ばす。'],['石头并没有靠近。水把原先不能连续经过的地方接在一起。','The stones have not moved closer. Water has connected the interrupted route.','石同士が近づいたわけではない。水が途切れた道をつないだ。'],['纸上有了两个位置，中间留一小段空白。你看见了经过，却没有量出速度。','Two positions go on paper, with a small gap. You saw a crossing, without measuring its speed.','二つの位置を紙に記し、間を少し空ける。通過は見たが、速さは測っていない。']]),
 row(['藻枝立起来','Weed lifting','起き上がる藻'],
 ['水托起伏着的藻枝。抓在上面的身体也跟着摇，能经过的地方不再只贴着池底。岩面上的藤壶开始伸出细小的蔓足。','Water lifts the flattened weed. Attached bodies sway with it; routes now rise above the pool floor. Barnacles extend their fine cirri.','伏せた藻を水が持ち上げる。つかまる身体も揺れ、道は池底から上へ広がる。フジツボが細い蔓脚を伸ばす。'],
 [['看藻枝上的摇摆','Watch the swaying bodies','藻の上の揺れを見る'],['看藤壶伸出蔓足','Watch the barnacles feed','フジツボの蔓脚を見る'],['沿着藻枝向上看','Look up the weed','藻を上へたどる']],
 [['它随藻枝摆过去，又摆回来。抓附也可以是一种移动。','It swings out and back with the weed. Holding on can move a body too.','藻とともに揺れて戻る。つかまっていても身体は動く。'],['壳口里伸出一小把细线，扫过水，又收回。石头上也有自己的节奏。','A tiny fan reaches out, sweeps the water and folds away. The stone has its own rhythm.','殻口から小さな扇が出て、水を払い、戻る。石の上にもリズムがある。'],['同一丛藻在水里展开。身体可以绕到枝背面，暂时离开你的视线。','The same weed opens in water. A body can pass behind a branch and out of view.','同じ藻が水中で開く。枝の裏へ回ると、個体は一時見えなくなる。']]),
 row(['最高的一道水','The high water','いちばん高い水'],
 ['潮水到了这轮最高的位置。几块石头之间都能经过，身体散开了，水流却暂时缓下来。你不再能一眼把它们收进同一个角落。','The tide reaches its highest point in this cycle. Water joins the stones and bodies spread out as the current eases. One corner no longer holds them all in view.','今回の潮が最高点に届く。石の間がつながり、流れが緩む中で個体が散る。一つの隅には収まらない。'],
 [['跟看一只经过的身体','Follow a passing body','通る個体を追う'],['留在原来的湿藻边','Stay by the first weed','最初の藻のそばに留まる'],['记下最宽的水面','Mark the widest water','広がった水を記す']],
 [['它经过较开阔的水，再贴到石侧。更大的空间里仍有停靠的地方。','It crosses open water and settles beside a stone. The wider space still offers places to grip.','開けた水を渡り、石の側面に寄る。広い場所にもつかまる面はある。'],['湿藻还在，却不再是唯一的去处。你留住的是观察位置，不是它们。','The weed remains, but is no longer the only place to go. You keep your viewpoint, not the animals.','藻は残るが、行き先は一つではない。留めたのは観察点だけだ。'],['这一次水面最宽。纸上的线没有说明下一只会去哪里。','This is the widest water in this cycle. The line cannot say where the next body will go.','今回もっとも広い水面を記す。次の個体の行き先は線にはない。']]),
 row(['回水穿过石口','Water returning','戻る流れ'],
 ['水面开始下移。石口的颗粒往外走，几只身体贴低，步足抓紧近处的表面。刚才敞开的水路，开始有了方向。','The water starts to fall. Particles move outward through the gap; several bodies lower themselves and grip nearby surfaces. The open passage gains a direction.','水面が下がり始める。隙間の粒が外へ流れ、個体は身を低くして面をつかむ。開いていた水路に向きが生まれる。'],
 [['看它怎样抓稳','Watch the grip','つかまる脚を見る'],['跟看退去的水','Follow the ebb','引く水を見る'],['回看刚才的通路','Return to the crossing','先ほどの道を見る']],
 [['身体贴近石面，触角还在动。停留不是画面静止，而是步足一直有所依靠。','The body stays close to stone while antennae move. Staying put still involves holding on.','身体は石に寄り、触角は動く。留まるにも脚の支えが続く。'],['细粒先越过石口，水仍连着两边。退潮还没有立刻关掉所有路。','Grains pass the gap first. Water still joins both sides; the ebb does not close every route at once.','先に粒が隙間を抜ける。水はまだ両側をつなぐ。すべての道が一度に閉じるわけではない。'],['那段路还在水下，经过的身体却更靠近边缘。','The route is still submerged, but passing bodies stay nearer its edges.','道はまだ水中にあるが、通る身体は縁に寄っている。']]),
 row(['石脊重新出现','The ridge returns','再び現れる岩の稜'],
 ['水薄下来，石脊重新露出轮廓。一只身体沿着有水的一侧拐弯，没有继续越过去。刚才的捷径正在收窄。','Water thins and the ridge reappears. One body turns along its wet side instead of crossing. The shortcut narrows.','水が薄くなり、岩の稜が見える。個体は越えずに濡れた側へ曲がる。近道が狭まる。'],
 [['跟看沿边的转弯','Follow the wet edge','濡れた縁を追う'],['看石脊何时露出','Watch the ridge emerge','岩の稜が出るのを見る'],['对照涨潮时的位置','Compare with the flood','満ち潮の位置と比べる']],
 [['路线弯了，脚下仍有水。它绕过了正在变干的高处。','The route bends but remains wet. It skirts the drying high ground.','道は曲がるが、足元には水がある。乾く高所を回る。'],['最高的一小段先露出来，剩下的水分成两边。','The highest patch emerges first, dividing the remaining water.','最も高い一部が先に出て、残る水を二つに分ける。'],['石头没有变，能连续经过的地方变了。纸上两条路线不必重合。','The stone is unchanged; the connected route has changed. The two lines need not coincide.','石は同じでも、つながる道が変わった。二つの線は重ならなくてよい。']]),
 row(['回到湿面','Back to wet surfaces','湿った面へ'],
 ['几段水路断开了。低处还留着浅水，露出的岩隙也没有立刻干透。藤壶收起蔓足，附近偶尔还有触角伸出来。','Several water routes break apart. Shallows remain below, and exposed crevices have not dried at once. Barnacles fold their cirri; nearby antennae still occasionally appear.','いくつかの水路が切れる。低所には浅水が残り、出た割れ目もすぐには乾かない。フジツボが蔓脚をしまい、そばでは時折触角がのぞく。'],
 [['看湿处的小动作','Watch the wet refuges','湿った隠れ場を見る'],['看合拢的壳口','Watch the closing shells','閉じる殻口を見る'],['记下断开的水路','Mark the broken routes','切れた水路を記す']],
 [['触角从阴影里伸出，步足换了一个抓点。活动缩在湿处，没有跟着海一起离开。','Antennae reach from the shade; legs change their grip. Activity stays in the wet refuge.','陰から触角が出て、脚がつかむ場所を変える。湿った避難場所で動きが続く。'],['刚才扫水的细线不见了，壳还留在同一块石头上。','The fans that swept the water disappear; the shells remain on the same stone.','水を払った扇は消え、殻は同じ石に残る。'],['你把连线停在露出的石脊前。水下的两边，现在需要分别看。','You stop the line at the exposed ridge. The two wet sides must now be watched separately.','露出した稜で線を止める。濡れた両側を別々に見る。']]),
 row(['又一次低水','Low water again','再び低い水'],
 ['水回到接近起点的高度。湿处仍有触角在动，你却不能凭一个相似的位置认出先前的那一只。海走完一轮，池里没有回到原样。','Water returns near its starting height. Antennae still move in the wet refuges, but a familiar position cannot identify the earlier animal. A tide has passed; the pool is not an exact repeat.','水は初めに近い高さへ戻る。湿った隠れ場で触角は動くが、似た位置だけでは先ほどの個体と分からない。一巡しても池は同じには戻らない。'],
 [['停在湿面旁','Stay by the wet surface','湿った面のそばに留まる'],['重看这一轮的水路','Review the changing routes','変わった道を見返す'],['合上这页水线','Close the waterline page','水際の頁を閉じる']],
 [['你多看了一会儿。最后留下的仍是一小片能动的湿处。','You watch a little longer. A small wet place remains alive with movement.','もう少し見る。小さな湿った場所で動きが続く。'],['从分开到连通，再从连通到分开，石头之间多过一条临时的路。','Separate, joined, then separate again: a temporary route passed between the stones.','離れ、つながり、また離れる。石の間に一時の道があった。'],['纸页停在低水处。下一轮水会再来，记录没有替它关门。','The page ends at low water. The next tide can return beyond this record.','頁は低い水で終わる。記録の先へ次の潮が来る。']])
];
const COPY={cycle:['一轮潮汐 · 九次观察','One tide · nine observations','一潮汐・九回の観察'],elapsed:['距本轮低潮的时间','Time since this low tide','今回の干潮からの経過時間'],level:['淹水','Inundation','冠水'],routes:['通水石隙','Open gaps','水の通る隙間'],flow:['流势','Current','流れ'],memory:['这一轮潮汐里，你的手也改变过身体的位置。记录保留了这些动作。','Your hand also changed positions during this tide. Those actions remain in the record.','この潮の間、手も身体の位置を変えた。その動きも記録に残る。'],ending:['水留下的路','Routes left by water','水が残した道'],body:['同一组石头，涨水时分出更多去处，落水时又把活动收回湿藻和岩缝。你看完了一轮开合，最后的触角还在动。','The same stones offered more routes as water rose, then gathered activity into wet weed and cracks as it fell. You watched one opening and closing. The last antennae still move.','同じ石の間に満ち潮が道を増やし、引き潮が湿った藻と割れ目へ動きを集めた。一度の開閉を見終えても、触角は動いている。'],line:['水线可以记下，下一次经过仍由它们开始。','The waterline can be recorded. The next passage begins with them.','水際は記せる。次に通り始めるのは彼らだ。']};
export function intertidalText(key,lang='zh'){
 const p=key.split(':');let r=p[1]==='crossing'?CRAWLING_CROSSING[p[2]]:COPY[p[1]];
 if(p[1]==='node'){const n=INTERTIDAL_NODES[Number(p[2])];r=p[3]==='option'?n?.options[Number(p[4])]?.[p[5]]:n?.[p[3]]}
 return r?local(r,lang):key;
}
export function intertidalTime(s,lang='zh') {const m=TIDE_MINUTES[intertidalIndex(s)];return lang==='isopod'?isopodWaveNumber(m,3):String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}
export function intertidalInstrument(s,lang='zh') {const i=intertidalIndex(s),numbers=[TIDE_LEVELS[i],[1,2,3,4,5,4,3,2,1][i],TIDE_FLOWS[i]];return ['level','routes','flow'].map((k,j)=>intertidalText('intertidal:'+k,lang)+' '+(lang==='isopod'?isopodWaveNumber(numbers[j]):numbers[j]+(j===0?'%':j===1?'/5':'')))}
const CRAWLING_CROSSING={
 prompt:['浅水越过石脊，原来分开的两处接上了。一个轮廓沿着湿面移到石侧，在拐角停了一下。','Shallow water crosses the ridge and joins two patches. An outline follows the wet surface to the side of a stone and pauses at its corner.','浅水が岩の稜を越え、二つの場所をつなぐ。輪郭が濡れた面を石の側面へたどり、角で止まる。'],
 label:['看它怎样过石角','Watch it round the stone','石の角を回るのを見る'],
 text:['前面的步足越过石角，后面的随后移过去。那段刚刚接通的湿面上，多了一次经过。','The front legs round the corner and the rear legs follow. Another passage crosses the newly joined wet surface.','前脚が石の角を越え、後脚が続く。つながったばかりの濡れた面を、また一つの身体が通る。']
};
export function intertidalScene(s){const i=intertidalIndex(s),key=`intertidal:node:${i}`,crawl=i===2&&!s.cohort?.some(c=>c.species==='granulosa');return {id:key,kind:'intertidal-tide',title:key+':name',text:crawl?'intertidal:crossing:prompt':key+':prompt',activity:key+':name',storyKey:key,options:INTERTIDAL_NODES[i].options.map((o,j)=>({id:`tide-${i}-${j}`,label:crawl&&j===0?'intertidal:crossing:label':key+`:option:${j}:label`,text:crawl&&j===0?'intertidal:crossing:text':key+`:option:${j}:text`,delta:{},animation:['tide-body','tide-water','tide-record'][j]}))}}

const catalogRow=(key,values)=>({key,locales:{zh:values[0],en:values[1],ja:values[2]},refs:{habitat:['intertidal']}});
export const TEXT_CATALOG=[...Object.entries(CRAWLING_CROSSING).map(([k,v])=>catalogRow('intertidal:crossing:'+k,v)),...Object.entries(COPY).map(([k,v])=>catalogRow('intertidal:'+k,v)),...INTERTIDAL_NODES.flatMap((n,i)=>[...['name','prompt'].map(k=>catalogRow(`intertidal:node:${i}:${k}`,n[k])),...n.options.flatMap((o,j)=>['label','text'].map(k=>catalogRow(`intertidal:node:${i}:option:${j}:${k}`,o[k])))])];
