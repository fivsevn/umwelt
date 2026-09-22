import {STORIES} from './data/habitats/stories.mjs';
import {habitatConfig} from './habitats.mjs';
import {encodeIsopodText} from './locales/isopod.mjs?v=isopod-3';
const COPY={
 wait:['让时间过去','Let time pass','時を待つ'],record:['只记录位置','Record the positions','位置だけを記す'],
 still:['你没有改变它们经过的地方。下一次移动仍由它们开始。','You leave their surroundings as they are. The next movement begins with them.','通る場所を変えずにおく。次の動きは彼らから始まる。'],
 note:['纸上留下了位置，水里没有多出一条线。','Positions remain on paper. No new line appears in the water.','位置は紙に残る。水には新しい線はできない。'],
 limitation:['像素形态为有资料依据的近似；微小鉴别特征未完整绘制。','Pixel anatomy is evidence-informed; microscopic diagnostics are not fully rendered.','ピクセル形態は資料に基づく近似で、微細な識別形質は省略している。'],

 prev:['上一个环境','Previous habitat','前の環境'],next:['下一个环境','Next habitat','次の環境'],days3:['三日观察','Three days of observation','三日間の観察'],
 flow:['水流','Flow','水流'],oxygen:['溶氧','Oxygen','溶存酸素'],detritus:['碎屑','Detritus','有機物'],tide:['潮位','Tide','潮位'],salinity:['盐度','Salinity','塩分'],algae:['藻丛','Algae','藻'],
 calm:['水中的空白','A space in the water','水の中の余白'],care:['改变过的水','Altered water','変えられた水'],trace:['水线之外','Beyond the waterline','水位線の向こう'],
 low:['悬浮颗粒缓慢下沉，几个轮廓停在水流经过的边缘。','Particles settle slowly. Several bodies rest near passing water.','粒子がゆっくり沈み、輪郭が流れの縁で止まる。'],
 fast:['颗粒加快移动，身体更靠近可以抓住的表面。','Particles move faster; bodies draw nearer to surfaces they can grip.','粒子が速まり、身体がつかまれる面へ寄る。'],
 normal:['水穿过遮蔽之间，细小的路线仍在继续。','Water passes between shelters. Small routes continue.','水が隠れ場の間を通り、小さな経路が続く。'],
 memory:['三天里，你的手也曾改变水中的位置。记录保留了那些动作。','During these three days your hand also changed positions in the water. Those actions remain in the record.','この三日間、手も水中の位置を変えた。その動作も記録に残る。']
};
const endingBodies={
 freshwater:[['木下的腐叶继续变薄。你留出了等待的时间，却没有替它们安排路线。','Leaves beneath the wood keep thinning. You left time to wait, without prescribing a route.','木の下の腐葉は薄くなる。待つ時間を残したが、経路は決めなかった。'],['你调整过水流与底部。后来的移动发生在这些改变之后，记录不能把两者分开。','You adjusted the flow and bottom. Later movements followed those changes; the record cannot separate them.','流れと底を変えた。その後の移動と変更を記録は切り離せない。'],['纸上的箭头结束在沉木边。水仍从木下经过，带着没有命名的细粒。','The arrow ends at the wood. Water still passes beneath it, carrying unnamed grains.','矢印は木際で終わる。水は名のない粒を運び、木の下を通る。']],
 intertidal:[['石缝重新被潮水覆盖。你等待过的地方，正在成为另一种边缘。','Tide covers the crack again. The place where you waited becomes another kind of edge.','割れ目がまた潮に覆われる。待っていた場所が別の縁になる。'],['你移动过的石头仍在这里。潮水一遍遍经过，把干预也收进环境。','The stone you moved remains. Repeated tides make that intervention part of the surroundings.','動かした石が残る。繰り返す潮が、その介入も環境に含める。'],['你记下多条水线。没有哪一条能够替海停在这里。','You recorded several waterlines. None can hold the sea here.','いくつもの水位線を記した。どの線も海をここに止められない。']],
 'shallow-marine':[['藻叶慢慢摆回原处。附着不是静止，只是和另一种移动一起发生。','Fronds slowly swing back. Attachment is not stillness; it moves with something else.','藻葉がゆっくり戻る。付着は静止ではなく、別の動きと共にある。'],['改变后的藻间仍有身体经过。你看到的路线，也包含你留下的空隙。','Bodies pass through the altered bed. Their routes also contain the gaps you left.','変えた藻間を身体が通る。見えた経路には、作った隙間も含まれる。'],['最后一条线画成了藻叶的形状。真实的藻叶已经转向下一阵流。','The last line takes the shape of a frond. The real one has turned toward the next current.','最後の線は藻葉の形になる。本物は次の流れへ向いている。']]
};
export const AQUATIC_ENDINGS=Object.keys(STORIES).flatMap(id=>['calm','care','trace'].map((kind,i)=>({id:`${id}-${kind}`,title:`water:${kind}`,body:`water:${id}:ending:${i}`,line:'water:note'})));
export function aquaticText(value,lang='zh'){
 if(!String(value).startsWith('water:'))return null;
 const parts=value.split(':');let row;
 if(parts[1]==='habitat')row=habitatConfig(parts[2]).names;
 else if(parts[2]==='ending')row=endingBodies[parts[1]]?.[Number(parts[3])];
 else if(parts[2]==='turn')row=STORIES[parts[1]]?.[Number(parts[3])]?.[Number(parts[4])];
 else row=COPY[parts[1]];
 if(!row)return value;
 return lang==='isopod'?encodeIsopodText(row[0]):row[{zh:0,en:1,ja:2}[lang]??0];
}
export function aquaticScene(s){const index=(s.day-1)*3+s.period,row=STORIES[habitatConfig(s).encounterPool][index],key=n=>`water:${s.habitatId}:turn:${index}:${n}`;
 return {id:`${s.habitatId}:${s.day}.${s.period}`,title:key(0),kind:'aquatic',text:key(0),activity:key(0),options:[{id:'water-adjust',label:key(1),delta:{...row[2],interventions:1,care:1},text:key(3)},{id:'water-wait',label:'water:wait',delta:{quiet:2},text:'water:still'},{id:'water-record',label:'water:record',delta:{labels:1},text:'water:note'}]};
}
export function aquaticEnding(s){const kind=s.interventions>=5?'care':s.quiet>=8?'calm':'trace';return AQUATIC_ENDINGS.find(e=>habitatConfig(s).endingPool.includes(e.id)&&e.id.endsWith('-'+kind))}
export function aquaticFeedback(s){return s.oxygen<45?'water:low':s.flow>65?'water:fast':'water:normal'}
