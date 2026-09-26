import {ABYSSAL_NODES} from './abyssal-dialogue.mjs';
import {encodeIsopodText,isopodWaveNumber} from '../../locales/isopod.mjs';
// Authored observation-station readings, not measurements of a wild specimen.
const readings=[
 [1240,4.2,62],[1240.4,4.2,60],[1241.2,4.1,58],[1242.6,4.1,61],[1243.1,4.0,64],
 [1244.8,4.0,57],[1246.2,3.9,59],[1246.8,3.9,55],[1247.4,4.0,53],[1248.5,3.9,60],
 [1249.1,3.8,56],[1250.3,3.9,54],[1251.0,3.8,52],[1252.4,3.8,55],[1253.0,3.7,48]
];
const words={depth:['深度','Depth','深度'],temperature:['水温','Temp','水温'],pressure:['压强','Pressure','圧力'],lamp:['探灯','Lamp','照明']};
const label=(key,lang)=>words[key][{zh:0,en:1,ja:2}[lang]??0];
export function abyssalReadings(state){
 const node=ABYSSAL_NODES.findIndex(n=>n.id===state.scene?.dialogueNode),i=node<0?Math.min(14,(state.records||[]).filter(r=>r.kind==='abyssal-dialogue').length):node;
 const [depth,temperature,baseLamp]=readings[i];
 const last=state.stage==='feedback'?state.records?.at(-1)?.choice:null;
 const lamp=last==='ending-silent'?0:last==='light-dim'?baseLamp-18:baseLamp;
 return {depth,temperature,pressure:.1013+depth*.01005,lamp};
}
export function abyssalInstrument(state,lang='zh'){
 const r=abyssalReadings(state),rows=[label('temperature',lang)+' '+r.temperature.toFixed(1)+' °C',label('pressure',lang)+' '+r.pressure.toFixed(2)+' MPa',label('lamp',lang)+' '+r.lamp+'%'];
 return lang==='isopod'?rows.map(encodeIsopodText):rows;
}
export function abyssalDepth(state,lang='zh'){
 const text=abyssalReadings(state).depth.toFixed(1)+' m';
 return {value:lang==='isopod'?isopodWaveNumber(Math.round(abyssalReadings(state).depth*10)):text,label:label('depth',lang)};
}
