import {GROUNDWATER_OBSERVATIONS} from './groundwater-observation.mjs';
// Old saves keep their ids while reusing the current cave voice.
export const GROUNDWATER_PULSES=[
 {
  "id": "seep",
  "options": [
   {
    "id": "follow-body",
    "lens": "body"
   },
   {
    "id": "mark-entrance",
    "lens": "medium"
   },
   {
    "id": "wait-seep",
    "lens": "limit"
   }
  ]
 },
 {
  "id": "connection",
  "options": [
   {
    "id": "connect-marks",
    "lens": "medium"
   },
   {
    "id": "record-silt",
    "lens": "limit"
   },
   {
    "id": "seek-third",
    "lens": "body"
   }
  ]
 },
 {
  "id": "input",
  "options": [
   {
    "id": "watch-input",
    "lens": "medium"
   },
   {
    "id": "watch-animal",
    "lens": "body"
   },
   {
    "id": "leave-input",
    "lens": "limit"
   }
  ]
 },
 {
  "id": "recession",
  "options": [
   {
    "id": "search-again",
    "lens": "body"
   },
   {
    "id": "finish-map",
    "lens": "medium"
   },
   {
    "id": "lights-out",
    "lens": "limit"
   }
  ]
 }
].map((row,i)=>{
 const current=GROUNDWATER_OBSERVATIONS[i*2];
 return {...row,name:current.name,prompt:current.prompt,options:row.options.map((o,j)=>({...o,label:current.options[j].label,text:current.options[j].text}))};
});
export const GROUNDWATER_ENDINGS={
 "body": {
  "title": [
   "门口的脚步",
   "Footsteps at the door",
   "入口の足音"
  ],
  "body": [
   "纸上留下几次露面，几次停留。石边的小住客来去照常，笔记没赶上全部行程。",
   "Several appearances and pauses remain on the page. Small residents continue their rounds by the stone; the notebook misses part of the itinerary.",
   "紙には何度かの顔出しと、ひと休み。石のそばの住人は普段通りに行き来し、ノートは全行程には追いつかない。"
  ],
  "line": [
   "最后一页到了，脚步还没到。",
   "The last page arrives before the footsteps finish.",
   "足取りが終わる前に、最後のページが来る。"
  ]
 },
 "medium": {
  "title": [
   "几处门牌",
   "A few addresses",
   "いくつかの住所"
  ],
  "body": [
   "几个入口、几片湿石，排在同一张纸上。虚线绕了些弯，门后的路仍各自留着。",
   "Entrances and wet stones share a page. Dotted lines take a few turns; the ways behind the doors remain elsewhere.",
   "入口と濡れた石が一枚の紙に並ぶ。破線はいくつか曲がり、戸口の奥の道は奥に残る。"
  ],
  "line": [
   "地址记下了，串门的事另说。",
   "Addresses recorded. Visiting arrangements remain open.",
   "住所は記した。訪問の話は、また別。"
  ]
 },
 "limit": {
  "title": [
   "灯外",
   "Beyond the beam",
   "光の外"
  ],
  "body": [
   "几处空白留到了最后。手电收起，滴水继续，洞里没有为末页另作安排。",
   "A few blanks last to the end. The torch folds away; dripping continues. The cave makes no special arrangements for the last page.",
   "最後まで余白が残る。ライトをしまっても滴は続き、洞内に最終ページの特別な支度はない。"
  ],
  "line": [
   "灯有收工的时候。",
   "The lamp has a closing time.",
   "灯りには、店じまいの時間がある。"
  ]
 }
};
