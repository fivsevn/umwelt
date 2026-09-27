import {encodeIsopodText} from './locales/isopod.mjs';
import {SPECIES} from './species-registry.mjs';
const preparations={
 freshwater:['穿好雨靴。','Put on your rain boots.','長靴を履く。'],
 groundwater:['带上手电筒。','Bring a flashlight.','懐中電灯を持っていく。'],
 estuary:['沿着岸边走走。','Take a walk along the shore.','岸辺を歩いてみる。'],
 intertidal:['在岩池边蹲下来。','Crouch beside a rock pool.','潮だまりのそばにしゃがむ。'],
 'sandy-surf':['去沙滩看看。','Take a look at the beach.','砂浜をのぞいてみる。'],
 'shallow-marine':['戴好潜水镜。','Put on your diving mask.','水中マスクをつける。'],
 abyssal:['准备下潜。','Get ready to descend.','潜る準備をする。'],
 'petri-dish':['打开阿西莫夫的饲养箱。',"Open Asimov’s specimen cabinet.",'アシモフの飼育ケースを開ける。']
};
export function arrivalText(habitat,language='zh'){
 const row=preparations[habitat];if(!row)return null;
 return language==='isopod'?encodeIsopodText(row[0]):row[{zh:0,en:1,ja:2}[language]??0];
}
export function unlockedPetriSpecies(collection){
 const unlocked=new Set(collection?.unlocked||[]);
 return SPECIES.filter(p=>unlocked.has(p.id)).map(p=>p.id);
}
