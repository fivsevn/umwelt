import {sandIndex} from './data/habitats/sandy-observation.mjs';
import {isIntertidal,intertidalText,intertidalTime} from './data/narrative/intertidal.mjs';
import {isEstuaryObservation,estuaryIndex,estuaryText} from './data/narrative/estuary.mjs';
import {groundwaterObservationIndex} from './data/habitats/groundwater-observation.mjs';
import {gameText} from './locales/game.mjs';
import {encodeIsopodText,isopodWaveNumber} from './locales/isopod.mjs';

const titles={
 intertidal:[['岩缝里的水','Water in the fissure','岩間の水'],['涨潮越过石沿','Over the ledge','岩縁を越える潮'],['夜潮','Night tide','夜の潮'],['碎贝间的水','Between shells','貝殻の間'],['伏下的藻','Lowered algae','伏せた藻'],['旧水线','Old waterline','古い水際'],['石下','Under stone','石の下'],['潮水回到触角','Returning tide','戻る潮'],['未完的潮','Unfinished tide','続く潮']],
 estuary:[['泥面湿痕','Wet marks','泥の湿り'],['两股水','Two currents','二つの流れ'],['混合的碎屑','Mixed fragments','混ざる破片'],['昨日的边界','Yesterday’s boundary','昨日の境界'],['相邻表面','Adjacent surfaces','隣り合う面'],['另一种水','Different water','別の水'],['沟槽','The channel','溝'],['漂木转向','Turning driftwood','向きを変える流木'],['移动的盐度线','Shifting salinity','動く塩分の境界']],
 'shallow-marine':[['藻叶与身体','Frond and body','藻葉と身体'],['松开步足','Letting go','脚を離す'],['褶皱之间','Between folds','ひだの間'],['光斑移位','Shifting light','動く光'],['相邻的藻叶','The next frond','隣の藻葉'],['画面边缘','Frame edge','画面の端'],['新的缺口','A new gap','新しい隙間'],['再次抓附','Holding again','再びつかむ'],['随流摆动','With the current','流れと揺れる']],
 'sandy-surf':[['湿沙下','Under wet sand','濡れた砂の下'],['第一道浪','First wave','最初の波'],['泡沫短线','A line of foam','泡の線'],['干湿之间','Wet and dry','乾湿の間'],['回流','Backwash','引き波'],['重新埋藏','Buried again','再び潜る'],['交错沙纹','Crossing ripples','交わる砂紋'],['上涨的浅水','Rising shallows','満ちる浅瀬'],['沙与水之间','Sand and water','砂と水の間']],
 'petri-dish':[['圆形边界','Circular boundary','円い境界'],['一粒碎屑','One fragment','一粒の破片'],['台灯熄灭','Lamp off','消えた照明'],['一滴新水','A fresh drop','新しい一滴'],['同一倍率','Same scale','同じ倍率'],['皿底划痕','Scratches below','皿底の傷'],['干燥痕迹','Drying traces','乾きの跡'],['光的方向','Light direction','光の向き'],['圆内的路线','Routes within','円内の経路']]
};
const abyssal={light:['探照灯','Searchlight','探照灯'],stillness:['原处','Still here','同じ場所'],name:['长名字','A long name','長い名前'],food:['移动的残屑','Moving fragments','動く破片'],scale:['倍率','Magnification','倍率'],background:['石的背面','Behind the stone','石の裏'],trace:['足迹','Footprints','足跡'],blank:['看不见的地方','Out of sight','見えない場所'],reflection:['反光','Reflection','反射'],offering:['从上面来','From above','上から'],specimen:['不动的图像','A still image','静止した像'],observer:['观察窗','Observation window','観察窓'],translation:['翻译','Translation','翻訳'],frame:['画面之外','Beyond the frame','画面の外'],ending:['灯还亮着','Light remains','まだ灯る光']};
function localize(row,lang){return lang==='isopod'?encodeIsopodText(row[0]):row[{zh:0,en:1,ja:2}[lang]??0]}
export function observationTitle(state,scene,encounter,lang='zh'){
 if(isIntertidal(state))return intertidalText(scene.title,lang);
 if(isEstuaryObservation(state))return gameText(scene.title,lang);
 if(state.habitatId==='sandy-surf'||state.habitatId==='groundwater'||state.habitatId==='freshwater')return gameText(scene.title,lang);
 if(state.habitatId==='abyssal')return localize(abyssal[scene.dialogueNode]||abyssal.light,lang);
 const rows=titles[state.habitatId];
 if(rows)return localize(rows[Math.min(rows.length-1,(state.day-1)*3+state.period)],lang);
 return gameText(encounter?.title||scene.title,lang);
}
export function environmentScale(state,lang='zh'){
 if(state.habitatId==='sandy-surf')return {value:lang==='isopod'?isopodWaveNumber(sandIndex(state)+1):String(sandIndex(state)+1).padStart(2,'0')+' / 09',label:localize(['沙面观察进度','Beach observation progress','砂面観察の進み'],lang)};

 if(isIntertidal(state))return {value:intertidalTime(state,lang),label:intertidalText('intertidal:elapsed',lang)};
 if(isEstuaryObservation(state))return {value:lang==='isopod'?isopodWaveNumber(estuaryIndex(state)+1):String(estuaryIndex(state)+1).padStart(2,'0')+' / 06',label:estuaryText('estuary:v1:cycle',lang)};
 // Authored elevations of nearby observation points; not measured animal locations.
 // Cave surveys use distance, azimuth and inclination to locate stations:
 // https://www.nps.gov/jeca/learn/nature/surveying.htm
 if(state.habitatId==='groundwater'){const depth=[18.6,18.2,19.1,18.8,19.4,19.7,19.1,19.7][groundwaterObservationIndex(state)];return {value:lang==='isopod'?isopodWaveNumber(Math.round(depth*10),3):'Δh −'+depth.toFixed(1)+' m',label:localize(['观察点相对洞口高程（场景设定）','Observation point elevation relative to entrance (scene datum)','観察点の洞口からの比高（場面設定）'],lang)}};
 if(state.habitatId==='freshwater')return {value:lang==='isopod'?isopodWaveNumber(Math.round(state.temp*10),3):state.temp.toFixed(1)+' °C',label:localize(['水温','Water temperature','水温'],lang)};
 if(state.habitatId==='abyssal')return {value:lang==='isopod'?isopodWaveNumber(Math.round(state.salinity)):Math.round(state.salinity)+' ‰',label:localize(['盐度','Salinity','塩分'],lang)};
 return null; // Dated environments retain their existing date and clock.
}
