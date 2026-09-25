import {STORIES} from './data/habitats/stories.mjs';
import {STORY_ALTERNATES} from './data/habitats/story-alternates.mjs';
import {ABYSSAL_NODES,ABYSSAL_ENDING_DATA,ABYSSAL_FRAGMENT_DATA} from './data/habitats/abyssal-dialogue.mjs';
import {habitatConfig} from './habitats.mjs';
import {FRESHWATER_MATERIAL_STAGES,FRESHWATER_MATERIAL_ENDINGS} from './data/habitats/freshwater-material.mjs';
import {encodeIsopodText} from './locales/isopod.mjs';
const COPY={
 wait:['让时间过去','Let time pass','時を待つ'],record:['只记录位置','Record the positions','位置だけを記す'],
 still:['你没有改变它们经过的地方。下一次移动仍由它们开始。','You leave their surroundings as they are. The next movement begins with them.','通る場所を変えずにおく。次の動きは彼らから始まる。'],
 note:['纸上留下了位置，水里没有多出一条线。','Positions remain on paper. No new line appears in the water.','位置は紙に残る。水には新しい線はできない。'],
 limitation:['像素形态为有资料依据的近似；微小鉴别特征未完整绘制。','Pixel anatomy is evidence-informed; microscopic diagnostics are not fully rendered.','ピクセル形態は資料に基づく近似で、微細な識別形質は省略している。'],

 prev:['上一个环境','Previous habitat','前の環境'],next:['下一个环境','Next habitat','次の環境'],days3:['三日观察','Three days of observation','三日間の観察'],observations5:['五次观察','Five observations','五回の観察'],abyssalRound:['单次观察','Single observation','一回の観察'],
 flow:['水流','Flow','水流'],oxygen:['溶氧','Oxygen','溶存酸素'],light:['光照','Light','光量'],detritus:['碎屑','Detritus','有機物'],tide:['潮位','Tide','潮位'],salinity:['盐度','Salinity','塩分'],algae:['藻丛','Algae','藻'],
 calm:['水中的空白','A space in the water','水の中の余白'],care:['改变过的水','Altered water','変えられた水'],trace:['水线之外','Beyond the waterline','水位線の向こう'],
 low:['悬浮颗粒缓慢下沉，几个轮廓停在水流经过的边缘。','Particles settle slowly. Several bodies rest near passing water.','粒子がゆっくり沈み、輪郭が流れの縁で止まる。'],
 fast:['颗粒加快移动，身体更靠近可以抓住的表面。','Particles move faster; bodies draw nearer to surfaces they can grip.','粒子が速まり、身体がつかまれる面へ寄る。'],
 normal:['水穿过遮蔽之间，细小的路线仍在继续。','Water passes between shelters. Small routes continue.','水が隠れ場の間を通り、小さな経路が続く。'],
 memory:['三天里，你的手也曾改变水中的位置。记录保留了那些动作。','During these three days your hand also changed positions in the water. Those actions remain in the record.','この三日間、手も水中の位置を変えた。その動作も記録に残る。'],
 freshwaterMemory:['这五次观察里，你的手也曾改变水中的位置。物质继续变化时，那些动作也留在记录里。','Across these five observations your hand also changed positions in the water. As matter kept changing, those actions remained in the record.','この五回の観察でも、手は水中の位置を変えた。物質が変わり続けるあいだ、その動作も記録に残った。']
};
const endingBodies={
 groundwater:[['滴水继续落进浅池，流石边缘仍有细小移动。','Drops continue into the shallow pool while small movements persist along the flowstone edge.','滴は浅い水たまりへ落ち続け、流石の縁では小さな動きが続く。'],['你改变过渗流、光或细泥。后来的路线发生在这些改变之后。','You changed seepage, light, or fine silt. Later routes occurred after those changes.','染み出し、光、細泥を変えた。その後の経路は変更のあとに起きた。'],['最后一条线停在水膜边缘，下一滴水已经落下。','The last line stops at the water-film edge; the next drop has already fallen.','最後の線は水膜の縁で止まり、次の滴はもう落ちている。']],
 'sandy-surf':[['浪线退回浅水，湿沙下仍有埋藏的身体。','The wash retreats to shallow water while bodies remain buried beneath wet sand.','波が浅水へ戻っても、湿砂の下には埋まった身体が残る。'],['你改变过浪线附近的沙、漂积物或局部水流。后来的埋藏和游动从那里继续。','You changed sand, wrack, or local flow near the swash line. Later burrowing and swimming continued from there.','波打ち際の砂、漂着物、局所の流れを変えた。その後の潜行と遊泳はそこから続いた。'],['最后画下的泡沫线很快消失，湿沙的颜色又向下移动。','The last foam line disappears quickly and the colour of wet sand shifts downslope again.','最後に描いた泡の線はすぐ消え、湿砂の色はまた下へ移る。']],
 'petri-dish':[['培养皿的圆形边界没有变化，里面的路线仍然没有重复。','The circular dish boundary stays fixed while the route inside still does not repeat.','培養皿の円い境界は変わらず、内部の経路は同じ形を繰り返さない。'],['你调整过光、水滴或碎屑。玻璃皿中的移动从改变后的底面继续。','You adjusted light, water, or debris. Movement in the dish continued across the altered floor.','光、水滴、屑を変えた。培養皿の動きは変化した底面から続いた。'],['最后的位置点留在记录上，放大的身体已经越过它。','The final position dot remains in the record; the magnified body has already moved beyond it.','最後の位置点は記録に残り、拡大された身体はすでにそこを越えている。']],
 freshwater:[['木下的腐叶继续变薄。你留出了等待的时间，却没有替它们安排路线。','Leaves beneath the wood keep thinning. You left time to wait, without prescribing a route.','木の下の腐葉は薄くなる。待つ時間を残したが、経路は決めなかった。'],['你调整过水流与底部。后来的移动发生在这些改变之后，记录不能把两者分开。','You adjusted the flow and bottom. Later movements followed those changes; the record cannot separate them.','流れと底を変えた。その後の移動と変更を記録は切り離せない。'],['纸上的箭头结束在沉木边。水仍从木下经过，带着没有命名的细粒。','The arrow ends at the wood. Water still passes beneath it, carrying unnamed grains.','矢印は木際で終わる。水は名のない粒を運び、木の下を通る。']],
 intertidal:[['石缝重新被潮水覆盖。你等待过的地方，正在成为另一种边缘。','Tide covers the crack again. The place where you waited becomes another kind of edge.','割れ目がまた潮に覆われる。待っていた場所が別の縁になる。'],['你移动过的石头仍在这里。潮水一遍遍经过，把干预也收进环境。','The stone you moved remains. Repeated tides make that intervention part of the surroundings.','動かした石が残る。繰り返す潮が、その介入も環境に含める。'],['你记下多条水线。没有哪一条能够替海停在这里。','You recorded several waterlines. None can hold the sea here.','いくつもの水位線を記した。どの線も海をここに止められない。']],
 estuary:[['潮水退去以后，泥面的湿痕仍在改变。你等待过的地方没有保持同一种水。','After the tide withdraws, wet marks on the mud keep changing. The place where you waited did not hold one kind of water.','潮が引いたあとも泥面の湿り跡は変わり続ける。待っていた場所に同じ水は留まらなかった。'],['你改变过沟槽、漂木或渗流。后来的混合发生在这些改变之后，记录无法把干预从河口分开。','You changed a channel, driftwood, or seep. Later mixing happened after those changes; the record cannot separate intervention from estuary.','水路、流木、染み出しを変えた。その後の混合から介入だけを切り離すことはできない。'],['纸上最后一条盐度线停住了。真实的河口没有停住。','The last salinity line stops on paper. The real estuary does not.','紙上の最後の塩分線は止まる。実際の河口は止まらない。']],
 'shallow-marine':[['藻叶慢慢摆回原处.附着不是静止，只是和另一种移动一起发生。','Fronds slowly swing back. Attachment is not stillness; it moves with something else.','藻葉がゆっくり戻る。付着は静止ではなく、別の動きと共にある。'],['改变后的藻间仍有身体经过。你看到的路线，也包含你留下的空隙。','Bodies pass through the altered bed. Their routes also contain the gaps you left.','変えた藻間を身体が通る。見えた経路には、作った隙間も含まれる。'],['最后一条线画成了藻叶的形状。真实的藻叶已经转向下一阵流。','The last line takes the shape of a frond. The real one has turned toward the next current.','最後の線は藻葉の形になる。本物は次の流れへ向いている。']]
};
const freshwaterEndingIndex={care:0,calm:1,trace:2};
const STANDARD_AQUATIC_ENDINGS=Object.keys(STORIES).flatMap(id=>['calm','care','trace'].map((kind,i)=>{const endingIndex=id==='freshwater'?freshwaterEndingIndex[kind]:i;return {id:`${id}-${kind}`,title:id==='freshwater'?`water:freshwater-material:ending:${endingIndex}:title`:`water:${kind}`,body:id==='freshwater'?`water:freshwater-material:ending:${endingIndex}:body`:`water:${id}:ending:${i}`,line:id==='freshwater'?`water:freshwater-material:ending:${endingIndex}:line`:'water:note'}}));
export const ABYSSAL_ENDINGS=Object.keys(ABYSSAL_ENDING_DATA).map(id=>({id,title:`abyssal:ending:${id}:title`,body:`abyssal:ending:${id}:body`,line:`abyssal:ending:${id}:line`}));
export const AQUATIC_ENDINGS=[...STANDARD_AQUATIC_ENDINGS,...ABYSSAL_ENDINGS];

const langIndex={zh:0,en:1,ja:2};
function localizedRow(row,lang='zh'){
 if(!row)return null;
 return lang==='isopod'?encodeIsopodText(row[0]):row[langIndex[lang]??0];
}
function storyHash(seed,n){let x=(seed+Math.imul(n+1,2654435761))>>>0;x=Math.imul(x^(x>>>16),2246822507);return (x^(x>>>13))>>>0}
function altMatches(tag,s){
 if(tag==='always')return true;
 if(tag==='high-flow')return s.flow>50;
 if(tag==='low-flow')return s.flow<48;
 if(tag==='high-detritus')return s.detritus>52;
 if(tag==='low-detritus')return s.detritus<32;
 if(tag==='low-light')return s.light<35;
 if(tag==='low-oxygen')return s.oxygen<65;
 if(tag==='high-cover')return s.cover>68;
 if(tag==='low-salinity')return s.salinity<34;
 if(tag==='high-algae')return s.algae>72;
 return false;
}
function storyRefFor(s){
 const id=habitatConfig(s).encounterPool,turn=(s.day-1)*3+s.period,base=STORIES[id]?.[turn];
 const alts=STORY_ALTERNATES[id]?.[turn]||[],eligible=alts.map((entry,index)=>({entry,index})).filter(({entry})=>altMatches(entry.when,s));
 if(eligible.length&&storyHash(s.seed,turn+3101)%100<72){
  const picked=eligible[storyHash(s.seed,turn+3119)%eligible.length];
  return {row:picked.entry.row,storyKey:`alt:${turn}:${picked.index}`,key:n=>`water:${id}:alt:${turn}:${picked.index}:${n}`};
 }
 return {row:base,storyKey:`turn:${turn}`,key:n=>`water:${id}:turn:${turn}:${n}`};
}
function freshwaterMaterialText(value,lang){
 const parts=value.split(':'),index=Number(parts[2]);
 if(parts[0]!=='water'||parts[1]!=='freshwater-material')return value;
 if(parts[2]==='stage')return localizedRow(FRESHWATER_MATERIAL_STAGES[Number(parts[3])]?.name,lang)??value;
 if(parts[2]==='ending'){
  const ending=FRESHWATER_MATERIAL_ENDINGS[Number(parts[3])];if(!ending)return value;
  return localizedRow(ending[parts[4]],lang)??value;
 }
 const stage=FRESHWATER_MATERIAL_STAGES[index];if(!stage)return value;
 if(parts[3]!=='step')return value;
 const step=stage.steps?.[Number(parts[4])];if(!step)return value;
 if(parts[5]==='prompt')return localizedRow(step.prompt,lang)??value;
 if(parts[5]==='after')return localizedRow(step.after?.[parts.slice(6).join(':')],lang)??localizedRow(step.prompt,lang)??value;
 if(parts[5]==='option'){
  const option=step.options?.[Number(parts[6])];if(!option)return value;
  return localizedRow(option[parts[7]],lang)??value;
 }
 return value;
}
function abyssalText(value,lang){
 const parts=value.split(':'),kind=parts[1];
 if(kind==='node'){
  const node=ABYSSAL_NODES.find(n=>n.id===parts[2]);if(!node)return value;
  if(parts[3]==='prompt')return localizedRow(node.prompt,lang);
  if(parts[3]==='option'){
   const option=node.options[Number(parts[4])];if(!option)return value;
   return localizedRow(option[parts[5]],lang)??value;
  }
 }
 if(kind==='ending'){
  const ending=ABYSSAL_ENDING_DATA[parts[2]];if(!ending)return value;
  return localizedRow(ending[parts[3]],lang)??value;
 }
 return value;
}
export function aquaticText(value,lang='zh'){
 const text=String(value??'');
 if(text.startsWith('abyssal:'))return abyssalText(text,lang);
 if(text.startsWith('water:freshwater-material:'))return freshwaterMaterialText(text,lang);
 if(!text.startsWith('water:'))return null;
 const parts=text.split(':');let row;
 if(parts[1]==='habitat')row=habitatConfig(parts[2]).names;
 else if(parts[2]==='ending')row=endingBodies[parts[1]]?.[Number(parts[3])];
 else if(parts[2]==='turn')row=STORIES[parts[1]]?.[Number(parts[3])]?.[Number(parts[4])];
 else if(parts[2]==='alt')row=STORY_ALTERNATES[parts[1]]?.[Number(parts[3])]?.[Number(parts[4])]?.row?.[Number(parts[5])];
 else row=COPY[parts[1]];
 if(!row)return text;
 return localizedRow(row,lang);
}
const ABYSSAL_OPTION_ORDER={
 light:[0,2,1],
 stillness:[2,0,1],
 name:[1,0,2],
 food:[2,1,0],
 scale:[1,2,0],
 background:[2,0,1],
 trace:[1,0,2],
 blank:[2,1,0],
 reflection:[1,2,0],
 offering:[2,0,1],
 specimen:[1,2,0],
 observer:[2,1,0],
 translation:[1,2,0],
 frame:[2,0,1],
 ending:[1,0,2]
};

// Endings are assembled from traces distributed across the whole encounter.
// A choice can unlock more than one sentence family, or none at all.
// The visible position of an option is deliberately unrelated to these traces.
const ABYSSAL_FRAGMENT_UNLOCKS={
 position:{
  glass:['light-see','light-dim','reflection-clear','reflection-note','specimen-now','observer-mixed'],
  drift:['still-detail','food-route','background-bg','trace-happened','observer-body','ending-watch'],
  edge:['light-silent','scale-view','background-both','blank-outside','specimen-noanswer','frame-open','ending-silent'],
  interval:['still-position','food-wait','scale-none','trace-unsure','blank-space','offering-fall','translation-watch','ending-close']
 },
 record:{
  names:['name-later','name-archive','food-hunger','offering-food','specimen-update','translation-no','frame-no'],
  traces:['still-detail','food-route','background-bg','trace-record','reflection-note','offering-fall','observer-light','frame-yes'],
  gaps:['still-blank','name-none','food-wait','blank-space','reflection-leave','specimen-noanswer','frame-open','ending-silent'],
  sequence:['still-position','scale-none','background-both','trace-happened','blank-unknown','offering-intervention','observer-mixed','translation-watch','ending-watch']
 },
 remainder:{
  field:['light-dim','background-env','reflection-note','observer-mixed','frame-yes','blank-unknown'],
  return:['still-position','name-later','trace-record','specimen-now','ending-close'],
  intervention:['light-see','scale-body','reflection-clear','offering-intervention','observer-body','ending-silent'],
  open:['light-silent','still-blank','name-none','food-wait','trace-unsure','blank-outside','translation-watch','frame-open','ending-watch']
 }
};

const ABYSSAL_FRAGMENT_RESONANCE={
 position:{
  glass:[['reflection-note','observer-mixed'],['reflection-clear','specimen-now']],
  drift:[['still-detail','trace-happened'],['food-route','ending-watch']],
  edge:[['scale-view','frame-open'],['blank-outside','specimen-noanswer']],
  interval:[['still-position','translation-watch'],['food-wait','ending-close']]
 },
 record:{
  names:[['name-archive','specimen-update'],['food-hunger','translation-no']],
  traces:[['trace-record','reflection-note'],['observer-light','frame-yes']],
  gaps:[['name-none','blank-space'],['specimen-noanswer','ending-silent']],
  sequence:[['still-position','scale-none'],['observer-mixed','translation-watch']]
 },
 remainder:{
  field:[['background-env','observer-mixed'],['reflection-note','frame-yes']],
  return:[['name-later','specimen-now'],['trace-record','ending-close']],
  intervention:[['light-see','offering-intervention'],['reflection-clear','observer-body']],
  open:[['blank-outside','frame-open'],['translation-watch','ending-watch']]
 }
};

function abyssalPathHash(choices){
 let h=2166136261>>>0;
 for(const choice of choices){
  for(let i=0;i<choice.length;i++){h^=choice.charCodeAt(i);h=Math.imul(h,16777619)>>>0}
  h^=124;h=Math.imul(h,16777619)>>>0;
 }
 return h>>>0;
}
function abyssalFragmentKey(group,choices,signature,salt){
 const chosen=new Set(choices),unlocks=ABYSSAL_FRAGMENT_UNLOCKS[group],resonance=ABYSSAL_FRAGMENT_RESONANCE[group]||{};
 const scored=Object.keys(ABYSSAL_FRAGMENT_DATA[group]).map(id=>{
  let score=(unlocks[id]||[]).reduce((n,choice)=>n+(chosen.has(choice)?1:0),0);
  for(const pair of resonance[id]||[])if(pair.every(choice=>chosen.has(choice)))score+=2;
  return {id,score};
 });
 const max=Math.max(...scored.map(item=>item.score));
 // Keep near-neighbours in play: the record is assembled from overlapping traces,
 // not from a single dominant personality axis.
 const pool=max>0?scored.filter(item=>item.score>=Math.max(1,max-1)):scored;
 return pool[(signature+salt)%pool.length].id;
}
function abyssalCompositeEnding(s){
 const choices=(Array.isArray(s.records)?s.records:[]).filter(record=>record.kind==='abyssal-dialogue').map(record=>record.choice).filter(Boolean);
 const signature=abyssalPathHash(choices);
 const position=abyssalFragmentKey('position',choices,signature,17);
 const record=abyssalFragmentKey('record',choices,signature>>>3,29);
 const remainder=abyssalFragmentKey('remainder',choices,signature>>>7,43);
 const id=`abyssal-record-${position}-${record}-${remainder}`;
 return ABYSSAL_ENDINGS.find(ending=>ending.id===id)||ABYSSAL_ENDINGS.find(ending=>ending.id==='abyssal-between');
}

function abyssalScene(s){
 const index=(Array.isArray(s.records)?s.records:[]).filter(record=>record.kind==='abyssal-dialogue').length,node=ABYSSAL_NODES[index]||ABYSSAL_NODES.at(-1);
 const order=ABYSSAL_OPTION_ORDER[node.id]||node.options.map((_,i)=>i);
 return {id:`abyssal:${index}`,title:`abyssal:node:${node.id}:prompt`,kind:'abyssal-dialogue',text:`abyssal:node:${node.id}:prompt`,activity:`abyssal:node:${node.id}:prompt`,dialogueNode:node.id,storyKey:`abyssal:${node.id}`,options:order.map(i=>{const option=node.options[i];return {id:option.id,label:`abyssal:node:${node.id}:option:${i}:label`,delta:{...option.delta},text:`abyssal:node:${node.id}:option:${i}:text`}})};
}
function freshwaterMaterialScene(s){
 const records=(Array.isArray(s.records)?s.records:[]).filter(record=>record.kind==='freshwater-material');
 const turn=records.length,index=Math.min(FRESHWATER_MATERIAL_STAGES.length-1,Math.floor(turn/2)),beat=turn%2,stage=FRESHWATER_MATERIAL_STAGES[index],step=stage.steps[beat],previous=beat===1?records.at(-1)?.choice:null;
 const prompt=previous&&step.after?.[previous]?`water:freshwater-material:${index}:step:${beat}:after:${previous}`:`water:freshwater-material:${index}:step:${beat}:prompt`;
 return {
  id:`freshwater-material:${index}:${beat}`,
  title:`water:freshwater-material:stage:${index}`,
  kind:'freshwater-material',
  text:prompt,
  activity:`water:freshwater-material:stage:${index}`,
  storyKey:`freshwater-material:${stage.id}:${beat}`,
  materialStage:index,
  materialBeat:beat,
  options:step.options.map((option,i)=>({
   id:option.id,
   label:`water:freshwater-material:${index}:step:${beat}:option:${i}:label`,
   delta:{},
   text:`water:freshwater-material:${index}:step:${beat}:option:${i}:text`,
   animation:option.animation||option.id,
   lens:option.lens||null
  }))
 };
}
export function aquaticScene(s){
 if(s.habitatId==='freshwater')return freshwaterMaterialScene(s);
 if(habitatConfig(s).dialogue)return abyssalScene(s);
 const ref=storyRefFor(s),row=ref.row,key=ref.key;
 return {id:`${s.habitatId}:${s.day}.${s.period}`,title:key(0),kind:'aquatic',text:key(0),activity:key(0),storyKey:ref.storyKey,options:[{id:'water-adjust',label:key(1),delta:{...row[2],interventions:1,care:1},text:key(3)},{id:'water-wait',label:'water:wait',delta:{quiet:2},text:'water:still'},{id:'water-record',label:'water:record',delta:{labels:1},text:'water:note'}]};
}
export function aquaticEnding(s){
 if(habitatConfig(s).dialogue)return abyssalCompositeEnding(s);
 if(s.habitatId==='freshwater'){
  const frames=(Array.isArray(s.records)?s.records:[]).filter(record=>record.kind==='freshwater-material'&&['object','relation'].includes(record.lens));
  const object=frames.filter(record=>record.lens==='object').length,relation=frames.filter(record=>record.lens==='relation').length;
  const kind=Math.abs(object-relation)<=1?'calm':relation>object?'care':'trace';
  return AQUATIC_ENDINGS.find(e=>e.id===`freshwater-${kind}`);
 }
 const kind=s.interventions>=5?'care':s.quiet>=8?'calm':'trace';return AQUATIC_ENDINGS.find(e=>habitatConfig(s).endingPool.includes(e.id)&&e.id.endsWith('-'+kind));
}
export function aquaticFeedback(s){if(habitatConfig(s).dialogue||s.habitatId==='freshwater')return '';return s.oxygen<45?'water:low':s.flow>65?'water:fast':'water:normal'}
