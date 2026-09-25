import {encodeIsopodText,isopodWaveNumber} from '../../locales/isopod.mjs';

// Authored observation frames, not measured salinities, animal preferences or tide timings.
// The observer selects evidence; every method sees the same environmental sequence.
export const ESTUARY_KIND='estuary-observation';
export const ESTUARY_METHODS=Object.freeze(['site','follow','compare']);
export const ESTUARY_NODES=Object.freeze([
 {id:'mark',name:['落点','A fixed point','観察点'],samples:[12,10],exchange:22,flow:24,direction:.22,
  prompt:['木边有一道缺口，一只轮廓停在下面。你留下一个位置标记 P；藻根旁是第二个观察点 Q。这次，要保留哪一种记录？','A body rests beneath a notch in the wood. You mark this place P, and the algal base Q. What will this observation preserve?','木の切れ目の下に輪郭が止まる。ここを P、藻の根元を Q と記す。今回は何を記録に残す？'],
  site:['缺口和停留都留在记录里。轮廓后来离开了木边；你没有跟过去。','The notch and a pause enter the record. The body later leaves the wood; you do not follow.','切れ目と休止を記録する。輪郭はやがて木際を離れるが、追わない。'],
  follow:['线从木边开始，沿实际看见的移动延伸。原点之外的去向留下了，其他经过没有留下。','The line starts at the wood and extends along the visible movement. You retain this departure, not the other passages.','線は木際から、見えた動きに沿って伸びる。この出発は残り、ほかの通過は残らない。'],
  compare:['两处水样留下了同一时刻的读数。你没有把采样之间没看到的移动补进记录。','Two water samples preserve readings from this observation. You do not fill in movement missed while sampling.','二つの水試料がこの観察の値を残す。採水中に見なかった動きは補わない。']},
 {id:'arrival',name:['来水改变','Incoming water','変わる流入'],samples:[18,12],exchange:48,flow:48,direction:.7,
  prompt:['颗粒沿沟槽进入，木边的缺口没有改变。一个身体沿着木缘，向藻根那边移动。','Particles enter along the runnel; the notch is unchanged. A body moves along the wood toward the algae.','粒子が溝を進む。木の切れ目は変わらず、身体が木縁から藻の方へ移る。'],
  site:['你守住木边，记下水样和一次经过。离开的轮廓没有继续留在这一条记录里。','You stay at the wood, recording a sample and one passage. The departing outline goes beyond this record.','木際に残り、水試料と一度の通過を記す。離れた輪郭の先は、この記録にない。'],
  follow:['它沿木缘转过一小段。线只经过看见的地方；原点这时有没有另一只经过，没有被记录。','It turns along the edge. The line covers only visible movement; any other passage at the origin is unrecorded.','木縁を少し回る。線は見えた場所だけを通り、原点での別の通過は記録されない。'],
  compare:['木边与藻根的读数分开写下。这张对照没有记录那个身体什么时候离开。','The wood and algal-base readings are written separately. This comparison does not record when the body left.','木際と藻の根元の値を別々に記す。この比較には、身体が離れた時点はない。']},
 {id:'separation',name:['与原点分开','Leaving the origin','原点から離れる'],samples:[23,15],exchange:70,flow:58,direction:1,
  prompt:['藻根旁有一个轮廓停下。木边的旧标记仍在另一侧。两个地方同时发生的事，不能都变成连续的记录。','An outline pauses by the algae; the old mark is on the other side. Both places cannot be watched continuously at once.','藻の根元で輪郭が止まる。古い印は反対側にある。両方の出来事を同時に連続記録することはできない。'],
  site:['原点在这一段里空了出来。记录保留了空处，没有替离开的身体补一个目的地。','The origin is empty during this interval. The record preserves that absence without supplying a destination.','この間、原点は空いている。空白は残るが、離れた身体の行き先は補わない。'],
  follow:['步足贴着藻根，停顿留在线的末端。停下不等于这里永远适合停留。','Feet hold the algal base; a pause ends the line. This pause does not establish a permanent resting place.','脚が藻の根元に触れ、線の先に休止が残る。止まったことは、恒久的な居場所を意味しない。'],
  compare:['两处读数的差别仍在。纸上是两个采样点，不是一道动物必须跨越的墙。','The readings still differ. These are two sampling points, not a wall an animal must cross.','二点の値はまだ異なる。紙にあるのは採水点で、動物が越える壁ではない。']},
 {id:'turn',name:['转流','The turn','転流'],samples:[25,21],exchange:12,flow:12,direction:.04,
  prompt:['颗粒慢下来。几个轮廓仍贴着原来的表面，其中一个被藻叶遮住。水的变化，比画面里的动作更容易记下。','Particles slow. Several bodies remain against their surfaces; one is covered by an algal blade. The water changes more visibly than the bodies.','粒子が遅くなる。いくつかの輪郭は面に沿ったままで、一つが藻葉に隠れる。身体より水の変化が記しやすい。'],
  site:['木边仍没有明显停留。你记下了新的水样，没有把“不移动”写成“不受影响”。','There is still no clear pause at the wood. You record a new sample, without equating stillness with no effect.','木際には明確な休止がない。新しい試料を記し、動かないことを無影響とは書かない。'],
  follow:['轮廓进入藻影。可见的线在叶缘停下，后面没有自动接出一段路。','The outline enters algal shade. The visible line ends at the blade; no route is added beyond it.','輪郭が藻の影に入る。見える線は葉縁で止まり、その先の経路は補われない。'],
  compare:['两处水样靠近了一些，画面里却没有整齐一致的反应。你只保留这次对照。','The readings are closer, but the bodies show no uniform response. You preserve this comparison alone.','二点の値は近づくが、身体は一斉には反応しない。この比較だけを残す。']},
 {id:'ebb',name:['条件回撤','Water withdrawing','退いていく水'],samples:[16,19],exchange:46,flow:43,direction:-.7,
  prompt:['细粒换了方向。藻影外再次出现一个轮廓；刚才看不见的那一段，仍然没有记录。','Fine particles reverse direction. An outline appears outside the algae; the hidden interval is still unrecorded.','細粒の向きが変わる。藻の外に再び輪郭が現れるが、見えなかった間は記録にない。'],
  site:['水又经过原点，读数和来水时不同。木边的标记没有移动。','Water passes the origin again, with a different reading from the incoming flow. The mark has not moved.','水がまた原点を通り、流入時とは異なる値を示す。木際の印は動かない。'],
  follow:['这一段从眼前的轮廓重新开始。你没有因为它出现得近，就把它认作刚才那只。','This segment starts with the visible outline. Proximity alone does not identify it as the earlier animal.','この区間は目の前の輪郭から始める。近くに現れたことだけで、先ほどの個体とはしない。'],
  compare:['这次木边的读数低于藻根。两个点的次序变了，但位置没有交换。','This time the wood reading is lower than the algal-base reading. Their order changes; their positions do not.','今回は木際の値が藻の根元より低い。値の順序が変わり、位置は入れ替わらない。']},
 {id:'return',name:['重访','Revisiting','再訪'],samples:[11,15],exchange:26,flow:28,direction:-.3,
  prompt:['你又回到开头的木边。缺口还在，最初的停留却不在这里。最后一次，要给这份记录留下什么？','You return to the wood. The notch remains, but the first pause does not. What will the final observation preserve?','最初の木際に戻る。切れ目は残るが、あの休止はここにない。最後に何を残す？'],
  site:['同一个标记旁，又留下一份水样。开头没记录的部分不会被结尾补齐；记过的部分可以相互对照。','Another sample is recorded beside the same mark. The ending cannot fill gaps at the start; what was recorded can be compared.','同じ印のそばに、もう一つの試料を記す。最後の記録は初めの欠落を埋めず、残した部分だけが比較できる。'],
  follow:['末端仍在一个移动的身体旁，不在原点旁。纸上的空档保留着，你没有把它们连成完整的一生。','The endpoint stays with a moving body, not the origin. The gaps remain; you do not join them into a complete life.','終点は原点でなく動く身体のそばにある。空白を残し、完全な生の経路にはつなげない。'],
  compare:['最后一组对照留下了。你可以回到同一个坐标，却不能让先前经过的水也留下。','The last comparison is recorded. You can return to a coordinate, but cannot keep the water that passed it before.','最後の比較を残す。同じ座標には戻れても、先に通った水を引き留めることはできない。']}
]);

const catalog=[];
function add(key,row){catalog.push({key,locales:{zh:row[0],en:row[1],ja:row[2]},refs:{habitat:['estuary']}});return key}
const prefix='estuary:v1:';
const common={
 'method:site':['守住原点','Stay at P','原点に残る'],'method:follow':['跟随轮廓','Follow an outline','輪郭を追う'],'method:compare':['对照两处','Compare P / Q','二点を比べる'],
 'point:p':['P · 木边','P · wood','P · 木際'],'point:q':['Q · 藻根','Q · algae','Q · 藻根'],'pending':['待记录','Unrecorded','未記録'],
 'cycle':['一次潮水往返 · 六次观察','One tidal passage · six observations','一度の潮の往復・六回の観察'],
 'new-track':['重新从眼前的轮廓开始，不接上先前的空档。','Start again with the visible outline, without bridging the earlier gap.','目の前の輪郭から始め、前の空白はつながない。'],
 'evidence:site':['木边 {a}‰；去向未记。','Wood {a}‰; departure unrecorded.','木際 {a}‰。行き先は未記録。'],
 'evidence:compare':['木边 {a}‰ / 藻根 {b}‰；轨迹未记。','Wood {a}‰ / algae {b}‰; route unrecorded.','木際 {a}‰ / 藻の根元 {b}‰。経路は未記録。'],
 'evidence:follow':['可见轨迹；本段没有采水。','Visible route; no water samples in this interval.','見えた経路。この間の採水はない。'],
 'evidence:lost':['线止于遮挡，不推断暗处的路线。','The line ends at cover; no hidden route is inferred.','線は遮蔽で止まり、隠れた経路は推測しない。'],
 'evidence:new':['新的一段，不认作先前的个体。','A new segment, not an identification of the previous animal.','新しい区間。前の個体とは同定しない。'],
 'ending:title':['标记还在','The mark remains','印は残る'],
 'ending:body':['你回到了开头的位置。留下的不是河口的全貌，而是六次取舍形成的记录。','You return to the starting place. What remains is not the whole estuary, but a record shaped by six choices.','最初の場所に戻る。残るのは河口の全体像でなく、六回の選択が形作った記録だ。'],
 'ending:line':['坐标留得住，经过这里的水留不住。','A coordinate can remain. The water passing it cannot.','座標は残せても、通る水は残せない。']
};
for(const [key,row] of Object.entries(common))add(prefix+key,row);
const carry={site:['上一段守住了木边；离开的去向没有被跟随。','The previous interval stayed at the wood; departures were not followed.','前の区間は木際に残り、離れた先は追わなかった。'],follow:['上一段留下了可见轨迹；原点的同时记录空着。','The previous interval kept a visible route; its simultaneous origin record is blank.','前の区間は見える経路を残し、同時の原点の記録は空いている。'],compare:['上一段留下了两处水样；连续移动没有被记录。','The previous interval kept two samples, not a continuous movement record.','前の区間は二点の試料を残し、連続する動きは記録しなかった。']};
for(const node of ESTUARY_NODES){
 add(`${prefix}${node.id}:name`,node.name);
 for(const previous of ['none',...ESTUARY_METHODS])add(`${prefix}${node.id}:prompt:${previous}`,node.prompt.map((line,i)=>(previous==='none'?'':carry[previous][i]+' ')+line));
 for(const method of ESTUARY_METHODS){
  add(`${prefix}${node.id}:${method}:text`,node[method]);
  if(method==='follow')add(`${prefix}${node.id}:${method}:new`,node[method].map((line,i)=>common['new-track'][i]+' '+line));
 }
}
export const TEXT_CATALOG=Object.freeze(catalog.map(row=>Object.freeze(row)));
const textByKey=new Map(TEXT_CATALOG.map(row=>[row.key,row.locales]));
export function estuaryText(value,lang='zh'){
 if(typeof value!=='string'||!value.startsWith(prefix))return null;
 const row=textByKey.get(value);if(!row)return value;
 return lang==='isopod'?encodeIsopodText(row.zh):row[lang]??row.zh;
}
const text=(id,lang)=>estuaryText(prefix+id,lang);
export const ESTUARY_ENDING=Object.freeze({id:'estuary-notebook',title:prefix+'ending:title',body:prefix+'ending:body',line:prefix+'ending:line'});
export const isEstuaryObservation=s=>s?.habitatId==='estuary'&&s?.estuaryVersion===1&&s?.estuaryLegacy!==true;
export const estuaryRecords=s=>(Array.isArray(s?.records)?s.records:[]).filter(r=>r.kind===ESTUARY_KIND);
export const estuaryProgress=s=>estuaryRecords(s).length;
export function estuaryIndex(s){
 const count=estuaryProgress(s);
 return Math.max(0,Math.min(5,count-(s?.stage==='feedback'||s?.stage==='ended'?1:0)));
}
export function estuaryScene(s){
 const index=Math.min(5,estuaryProgress(s)),node=ESTUARY_NODES[index],last=estuaryRecords(s).at(-1),previous=ESTUARY_METHODS.includes(last?.lens)?last.lens:'none';
 const continuous=index===0||(previous==='follow'&&!!last?.evidence?.track&&!last.evidence.track.lost);
 return {id:`estuary-v1:${node.id}`,kind:ESTUARY_KIND,estuaryNode:node.id,observationIndex:index,title:`${prefix}${node.id}:name`,text:`${prefix}${node.id}:prompt:${previous}`,storyKey:`estuary-v1:${node.id}`,options:ESTUARY_METHODS.map(method=>({id:`estuary-${method}`,label:prefix+'method:'+method,delta:{},lens:method,animation:`estuary-${method}`,text:`${prefix}${node.id}:${method}:${method==='follow'&&!continuous&&index>0&&node.id!=='ebb'?'new':'text'}`}))};
}
// Offsets are local to editable scene objects, never absolute screen positions.
const point=(anchor,x,y)=>({anchor,x,y});
export const ESTUARY_ROUTES=Object.freeze([
 [point('origin',8,12),point('origin',27,13)],
 [point('origin',27,13),point('origin',42,18),point('algae',-40,18)],
 [point('algae',-40,18),point('algae',-16,12),point('algae',-10,6)],
 [point('algae',-10,6),point('algae',-3,-3)],
 [point('runnel',-14,3),point('runnel',-3,7)],
 [point('runnel',-3,7),point('runnel',16,10)]
]);
export function captureEstuaryEvidence(s,scene,option){
 const index=scene.observationIndex,node=ESTUARY_NODES[index],method=option.lens,last=estuaryRecords(s).at(-1);
 if(!node||!ESTUARY_METHODS.includes(method))throw new RangeError('Invalid estuary observation');
 const evidence={version:1,nodeId:node.id,method};
 if(method==='site')evidence.origin={salinity:node.samples[0]};
 if(method==='compare')evidence.pair={origin:node.samples[0],algae:node.samples[1]};
 if(method==='follow'){
  const continuous=index===0||(last?.lens==='follow'&&!!last?.evidence?.track&&!last.evidence.track.lost);
  evidence.track={token:continuous&&last?.evidence?.track?last.evidence.track.token:`outline:${node.id}`,continuous,lost:node.id==='turn',points:structuredClone(ESTUARY_ROUTES[index])};
 }
 return evidence;
}
export function applyEstuaryWater(s){
 const n=ESTUARY_NODES[Math.min(5,estuaryProgress(s))];
 Object.assign(s,{salinity:n.samples[0],flow:n.flow,oxygen:74,light:48,cover:66,detritus:52,tide:72,algae:58});
}
export function estuaryRecordLine(record,lang='zh'){
 const e=record?.evidence;if(!e||e.version!==1)return '';
 const value=n=>Number.isFinite(n)?String(n):'—';
 if(!ESTUARY_METHODS.includes(e.method))return '';
 const resolved=lang==='isopod'?'zh':lang;
 let line=text('evidence:'+e.method,resolved);
 if(e.origin)line=line.replace('{a}',value(e.origin.salinity));
 if(e.pair)line=line.replace('{a}',value(e.pair.origin)).replace('{b}',value(e.pair.algae));
 if(e.track?.lost)line+=' '+text('evidence:lost',resolved);
 else if(e.track&&!e.track.continuous)line+=' '+text('evidence:new',resolved);
 return lang==='isopod'?encodeIsopodText(line):line;
}
export function estuarySummary(records,lang='zh'){
 const entries=estuaryRecords({records}).filter(r=>ESTUARY_NODES.some(n=>n.id===r.evidence?.nodeId)).slice(0,6);
 return [text('ending:body',lang),...entries.map(r=>`${text(r.evidence?.nodeId+':name',lang)} — ${estuaryRecordLine(r,lang)}`)].join('\n\n');
}
export function estuaryInstrument(s,lang='zh'){
 const e=estuaryRecords(s).at(-1)?.evidence,value=n=>Number.isFinite(n)?(lang==='isopod'?isopodWaveNumber(n):String(n)):'—';
 return [text('point:p',lang)+' '+value(e?.origin?.salinity??e?.pair?.origin),text('point:q',lang)+' '+value(e?.pair?.algae),text(e?'method:'+e.method:'pending',lang)];
}
