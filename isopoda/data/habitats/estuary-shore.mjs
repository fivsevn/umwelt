import {encodeIsopodText} from '../../locales/isopod.mjs';
export const isShore=s=>s?.habitatId==='estuary'&&s?.estuaryShoreVersion===1;
export const SHORE_TURNS=8;
export const shoreProgress=s=>(s?.records||[]).filter(r=>r.evidence?.version===2).length;
export const shorePoint=s=>Math.max(0,Math.min(2,Number.isInteger(s?.shorePoint)?s.shorePoint:1));
export const shoreIndex=s=>Math.max(0,Math.min(7,shoreProgress(s)-(['feedback','ended'].includes(s?.stage)?1:0)));
export const shoreTide=s=>shoreIndex(s)%4;
export const shoreRain=s=>((s.seed>>>0)%7===0)&&shoreIndex(s)>=4&&shoreIndex(s)<=5;
// The main animal stays observable beside shelter at every tide.
export const shoreVisible=()=>true;
export const SHORE_COORDINATES=Object.freeze([[-6,1.5],[0,0],[6,-1.5]]);
export function shoreReadings(s){
 const point=shorePoint(s),tide=shoreTide(s),rain=shoreRain(s);
 return {depth:Math.max(.03,[.24,.46,.16,.06][tide]+point*.04),salinity:[7,16,25][point]+[1,3,-1,-3][tide]-(rain?3:0),flow:[3.6,.8,2.8,.4][tide]+point*.3,tide};
}
export const shoreWalkLabel=(s,delta,lang='zh')=>shoreText('walk:'+Math.max(0,Math.min(2,shorePoint(s)+delta)),lang);
const rows={
 'point:0':['河侧','River side','川側'],'point:1':['汽水交界','Brackish edge','汽水の岸'],'point:2':['海侧','Sea side','海側'],
 'tide:0':['涨潮','Rising tide','上げ潮'],'tide:1':['满潮','High tide','満潮'],'tide:2':['退潮','Ebbing tide','下げ潮'],'tide:3':['低潮','Low tide','干潮'],
 'walk:0':['往河侧走','Walk riverward','川側へ歩く'],'walk:1':['往交界走','Walk to the edge','汽水の岸へ'],'walk:2':['往海侧走','Walk seaward','海側へ歩く'],
 'position':['沿岸局部坐标（米）','Local bank coordinates (m)','岸辺の局所座標（m）'],
 'prev':['向河侧走','Walk riverward','川側へ'],'next':['向海侧走','Walk seaward','海側へ'],
 'intro':['河水与海水在这里碰面。你停在岸边，潮水正慢慢靠近。','River and sea meet here. You stop on the bank as the water slowly approaches.','川と海がここで出会う。岸辺で足を止めると、潮がゆっくり近づいてくる。'],
 'hint':['沿哪边再走走？点岸上的脚印换个地方，或留在这里，继续观察。','Which way will you wander? Click the footprints to move, or stay here and continue observing.','どちらへ歩こう。岸の足跡を押して移動するか、ここで観察を続けよう。'],
 'linger':['沿岸再走几步，还是留在这里看一会儿？','A few more steps along the bank, or a little longer here?','岸沿いにもう少し歩こうか、ここでもうしばらく眺めようか。'],
 'canvas':['河口岸边，点击岸上脚印切换观察点','Estuary bank; use the footprints to walk along the shore','河口の岸辺。足跡を押して観察点を移動'],
 'arrival':['先在岸边停下来。','Pause beside the water.','まず岸辺に立ち止まる。'],
 'watch':['继续观察','Continue observing','観察を続ける'],
 'recorded':['已记录。','Recorded.','記録した。'],
 'quiet':['水还在经过。','Water keeps passing.','水は流れていく。'],
 'rain':['上游刚下过雨，水色浑了一点。','Rain upstream has clouded the water a little.','上流の雨で、水が少し濁った。'],
 'cycle':['岸边的潮水往返','Tides beside the bank','岸辺の潮の往復'],
 'ending:title':['水边还在','The bank remains','水際は残る'],
 'ending:body':['你站过的地方又被水淹过。漂流木没走多远，水已经换过几次。','Water covers the places where you stood again. The driftwood barely moved; the water has changed several times.','立っていた場所をまた水が覆う。流木はほとんど動かず、水は何度か入れ替わった。'],
 'ending:line':['岸边没有收场。','The bank does not close.','岸辺には幕が下りない。']
};
const observations=[
 [
 ['水向芦苇那边漫上来。木片边，一小截身体贴着湿砂移动。','Water rises toward the reeds. Beside the wood, a small body crawls over wet sand.','水が葦の方へ広がる。木片の脇で、小さな身体が湿った砂を這う。'],
 ['浅水漫过旧水线。几片植物碎屑从面前经过。','Shallow water crosses the old waterline. A few plant fragments drift past.','浅い水が古い水際を越える。植物のかけらが流れていく。'],
 ['开阔处的水先动起来。银灰色的小鱼偶尔从浅水里穿过。','The open water moves first. Small silver fish sometimes pass through the shallows.','開けた水面が先に動く。銀灰色の小魚が時々浅瀬を横切る。']
 ],[
 ['芦苇的影子落在水边。等足目沿木片外缘挪动，触角先探进水里。','Reed shadows fall beside the water. An isopod moves along the wood, testing the water with its antennae.','葦の影が水際に落ちる。等脚類が木片の縁を進み、触角から水に触れる。'],
 ['水没过那块矮石。刚才的泥面，成了鱼能经过的地方。','Water covers the low stone. The mud from a moment ago is now a passage for fish.','低い石が水に沈む。さっきの泥面を、今は魚が通れる。'],
 ['一阵细小的水纹散开。小鱼过去以后，浅水又平静了。','Small ripples spread. After the fish pass, the shallows settle again.','細かな波紋が広がる。魚が通ると、浅瀬はまた静まる。']
 ],[
 ['潮水退开，木边露出湿痕。等足目的轮廓贴着阴影挪了一点。','The tide draws back, leaving a wet mark beside the wood. An isopod shifts along its shadow.','潮が退き、木際に湿り跡が残る。等脚類の輪郭が影に沿って少し動く。'],
 ['砂泥重新露出来。一只等足目停在漂流木的缺口旁。','Sandy mud emerges again. An isopod pauses beside a notch in the driftwood.','砂泥がまた現れる。流木の切れ目の脇で等脚類が止まる。'],
 ['水向开阔处退去。石脚的等足目仍贴着湿润的边缘。','Water withdraws toward the open side. An isopod stays against the wet edge of a stone.','水が開けた方へ退く。石の根元の等脚類は湿った縁に沿っている。']
 ],[
 ['泥面的小孔露了出来。木片下的等足目换了个方向，仍没有离开阴影。','Small holes appear in the mud. The isopod under the wood turns, staying in shade.','泥面に小穴が現れる。木片の下の等脚類が向きを変え、影に留まる。'],
 ['水只剩浅浅一层。等足目沿湿砂移动，旁边留着更细的虫迹。','Only a thin layer of water remains. An isopod crosses wet sand beside finer burrow traces.','水は薄く残るだけ。等脚類が湿った砂を進み、その脇に細い這い跡がある。'],
 ['小蟹在洞口停一下，又缩回去。等足目还在石头背水的一侧。','A small crab pauses at its hole, then retreats. The isopod remains on the sheltered side of the stone.','小蟹が穴の口で止まり、また引っ込む。等脚類は石の水を避ける側にいる。']
 ]
];
for(let tide=0;tide<4;tide++)for(let point=0;point<3;point++)rows[`scene:${tide}:${point}`]=observations[tide][point];
export const SHORE_TEXT_CATALOG=Object.freeze(Object.entries(rows).map(([key,row])=>({key:'estuary:v2:'+key,locales:{zh:row[0],en:row[1],ja:row[2]},refs:{habitat:['estuary']}})));
export function shoreText(key,lang='zh'){
 const row=rows[key.replace('estuary:v2:','')];if(!row)return key;
 return lang==='isopod'?encodeIsopodText(row[0]):row[{zh:0,en:1,ja:2}[lang]??0];
}
export const SHORE_ENDING={id:'estuary-shore',title:'estuary:v2:ending:title',body:'estuary:v2:ending:body',line:'estuary:v2:ending:line'};
export function shoreScene(s){
 const index=shoreIndex(s),point=shorePoint(s),tide=shoreTide(s);
 return {id:`estuary-shore:${index}:${point}`,kind:'estuary-observation',estuaryNode:`shore-${tide}`,observationIndex:index,title:'estuary:v2:point:'+point,text:`estuary:v2:scene:${tide}:${point}`,options:[{id:'shore-watch',label:'estuary:v2:watch',delta:{},lens:'shore',text:'estuary:v2:'+(shoreVisible(s)?'recorded':'quiet')}]};
}
export function shoreEvidence(s){return {version:2,point:shorePoint(s),tide:shoreTide(s),rain:shoreRain(s),found:shoreVisible(s)}}
export function moveShore(s,delta){
 if(!isShore(s)||s.stage!=='choice')return false;
 const next=Math.max(0,Math.min(2,shorePoint(s)+Math.sign(delta)));if(next===shorePoint(s))return false;
 s.shorePoint=next;s.shoreIntroDone=true;s.scene=null;s.shoreNotice=false;return true;
}
export function shoreRecordLine(r,lang='zh'){
 const e=r.evidence;return [shoreText('point:'+e.point,lang),shoreText('tide:'+e.tide,lang),shoreText(e.found?'recorded':'quiet',lang)].join(' · ');
}
