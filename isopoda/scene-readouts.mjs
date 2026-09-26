import {isShore,shoreReadings,shoreText} from './data/habitats/estuary-shore.mjs';
// Display scales only: authored values are documented in the habitat laboratory.
// Never feed display-unit conversions back into the ecosystem simulation.
import {SEAWEED_CONDITIONS,seaweedIndex} from './data/habitats/seaweed-observation.mjs';
import {abyssalReadings} from './data/habitats/abyssal-instruments.mjs';
import {sandInstrument} from './data/habitats/sandy-observation.mjs';
import {TIDE_LEVELS,TIDE_FLOWS,intertidalIndex} from './data/narrative/intertidal.mjs';
import {microscope,isFocused} from './scenery/petri.mjs';
import {habitatConfig} from './habitats.mjs';
import {encodeIsopodText,isopodNumbers} from './locales/isopod.mjs';

export const READOUT_WORDS={
 temp:['温度','Temp','温度'],waterTemp:['水温','Water temp','水温'],humidity:['相对湿度','RH','相対湿度'],vent:['通风','Airflow','通気'],
 depth:['水深','Depth','水深'],transmission:['透光','Transmission','透光率'],pressure:['压强','Pressure','圧力'],wash:['浪位','Wash','波の位置'],inundation:['淹水','Inundation','冠水'],gaps:['通水石隙','Open gaps','通水隙間'],current:['流势','Current','流勢'],
 flow:['流速','Flow','流速'],oxygen:['溶氧','DO','溶存酸素'],salinity:['盐度','Salinity','塩分'],
 connectivity:['连通','Connection','連結'],seepage:['渗流','Seepage','浸透流'],input:['输入','Input','流入'],
 dim:['微光','Dim','微光'],soft:['柔光','Soft light','柔らかな光'],bright:['强光','Bright','強い光'],
 dark:['无日光','No daylight','日光なし'],dappled:['斑驳光','Dappled light','まだらな光'],
 isolated:['隔水','Isolated','分断'],rising:['涨潮','Flood tide','上げ潮'],high:['满潮','High tide','満潮'],falling:['退潮','Ebb tide','下げ潮'],
 leaf:['叶片','Leaf litter','落葉'],film:['薄膜','Biofilm','生物膜'],fragments:['碎片','Fragments','断片'],suspended:['悬浮','Suspended','浮遊'],settled:['沉积','Settled','堆積'],
 power:['倍率','Magnification','倍率'],focus:['焦位','Focus position','焦点位置'],lamp:['照明','Illumination','照明'],
 focusSetting:['预设焦位','Focus setting','焦点設定'],lampSetting:['预设照明','Light setting','照明設定'],
 overview:['普通观察','Overview','全体観察'],focused:['合焦','In focus','合焦'],blurred:['失焦','Out of focus','ピンぼけ'],
 elapsed:['经过时间','Elapsed time','経過時間']
};
// Fictional labels and base-seven bar numerals are presentation only.
const ISOPOD_LABELS={temp:'~o~',waterTemp:'~o~',humidity:'\\o/',vent:'<o>',flow:'~>',oxygen:'o+',salinity:'~*',connectivity:'~|~',seepage:'~v',input:'v+',power:'o×',focus:'o:',focusSetting:'o:',lamp:'o^',lampSetting:'o^',depth:'v',transmission:'|o^|',pressure:'>o<',wash:'~|',inundation:'~v~',gaps:'|~|',current:'~~>'};
export const readoutText=(key,lang='zh')=>{const row=READOUT_WORDS[key];return lang==='isopod'?(ISOPOD_LABELS[key]||encodeIsopodText(row[0])):row[{zh:0,en:1,ja:2}[lang]??0]};
export function freshwaterMoment(s){
 if(Number.isInteger(s.scene?.materialStage))return Math.min(9,s.scene.materialStage*2+(s.scene.materialBeat||0));
 const n=(s.records||[]).filter(r=>r.kind==='freshwater-material').length;
 return Math.min(9,Math.max(0,n-(['feedback','ended'].includes(s.stage)?1:0)));
}
export const FRESHWATER_HOURS=[0,.5,48,48.5,120,120.5,121,121.5,168,168.5];
export const SAND_SECONDS=[0,8,17,25,34,43,51,60,69];
export function sceneInstrument(s,lang='zh'){
 const word=k=>readoutText(k,lang),numeric=(key,value,unit='')=>{
  return word(key)+' '+(lang==='isopod'?isopodNumbers(String(value)+unit):value+unit);
 };
 const index=(key,value)=>numeric(key,Math.round(value),'/100');
 switch(s.habitatId||'terrestrial'){
  case 'terrestrial':return [numeric('temp',s.temp.toFixed(1),' °C'),numeric('humidity',Math.round(s.humidity),'%'),index('vent',s.vent),word(s.light<30?'dim':s.light>65?'bright':'soft')];
  case 'estuary':{if(!isShore(s))return null;const r=shoreReadings(s);return [numeric('depth',r.depth.toFixed(2),' m'),numeric('salinity',r.salinity.toFixed(1),'‰'),numeric('flow',r.flow.toFixed(1),' cm/s'),shoreText('tide:'+r.tide,lang)]}
  case 'freshwater':return [numeric('waterTemp',s.temp.toFixed(1),' °C'),numeric('oxygen',(s.oxygen/10).toFixed(1),' mg/L'),numeric('flow',(s.flow/10).toFixed(1),' cm/s'),word(['leaf','film','fragments','suspended','settled'][Math.floor(freshwaterMoment(s)/2)])];
  case 'groundwater':return [index('connectivity',s.connectivity),index('seepage',s.seepage),index('input',s.input),word('dark')];
  case 'intertidal':{
   if(s.intertidalLegacy)return [numeric('inundation',Math.round(s.tide),'%'),numeric('salinity',s.salinity.toFixed(1)),index('current',s.flow),word(s.light<30?'dim':s.light>65?'bright':'soft')];
   const i=intertidalIndex(s),rows=[numeric('inundation',TIDE_LEVELS[i],'%'),numeric('gaps',[1,2,3,4,5,4,3,2,1][i],'/5'),index('current',TIDE_FLOWS[i])];return [...rows,word(i===0||i===8?'isolated':i<4?'rising':i===4?'high':'falling')];
  }
  case 'sandy-surf':{
   const rows=sandInstrument(s,habitatConfig(s).tides,lang);
   return [index('wash',s.tide),numeric('flow',(s.flow/2).toFixed(1),' cm/s'),numeric('salinity',s.salinity.toFixed(1)),rows[2]];
  }
  case 'shallow-marine':{const [,flow,light,depth]=SEAWEED_CONDITIONS[seaweedIndex(s)];return [numeric('flow',Math.round(flow/5.8),' cm/s'),numeric('transmission',light,'%'),numeric('depth',depth.toFixed(1),' m'),word('dappled')]}
  case 'abyssal':{const r=abyssalReadings(s);return [numeric('waterTemp',r.temperature.toFixed(1),' °C'),numeric('pressure',r.pressure.toFixed(2),' MPa'),numeric('lamp',r.lamp,'%'),word('dark')]}
  case 'petri-dish':{
   const m=microscope(s);return [numeric('power',m.mode?m.magnification:1,'×'),index(m.mode?'focus':'focusSetting',m.focus),numeric(m.mode?'lamp':'lampSetting',Math.round(m.light),'%'),word(!m.mode?'overview':isFocused(m)?'focused':'blurred')];
  }
  default:return null; // Estuary retains its existing instruments.
 }
}
