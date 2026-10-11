import { ERRANDS } from '../../../../rooftop/resident.mjs';
import { OBSERVER_MESSAGES } from '../../../../rooftop/observer-ui.mjs';
import { WEATHER, TIMES, weatherProfile } from '../../../../rooftop/weather.mjs';
import { SEASONS } from '../../../../rooftop/seasons.mjs';
import { atmosphereCaption } from '../../../../rooftop/atmosphere.mjs';
import { weatherAction, actionCaption } from '../../../../rooftop/resident-weather.mjs';
import { ACTIVITIES } from '../../../../rooftop/wardrobe.mjs';
const entries=[],seen=new Set();
function add(kind,text,context=''){if(!text||seen.has(kind+text))return;seen.add(kind+text);entries.push({kind,text,context});}
for(const text of ERRANDS)add('东东外出',text);add('东东外出','东东回来了。');
for(const [id,text] of Object.entries(OBSERVER_MESSAGES))add('观察者',text,id==='bird'?'小鸟':'无人机');
add('天气与季节','窗外的声音隔着一层玻璃。','房间');
for(const w of WEATHER)for(const t of TIMES)for(const season of [null,...SEASONS]){
 const state=weatherProfile(w.id,t.id,season?.id||'spring');if(!season)state.season=null;
 add('天气与季节',atmosphereCaption(state),[w.name,t.name,season?.name||'时刻'].join(' · '));
 for(let p=0;p<3;p++)for(let q=0;q<3;q++)for(const present of [true,false]){
  const person=weatherAction(state,'person',p,{sheltered:true})||{state:'rest'},pig=weatherAction(state,'pig',q,{sheltered:true})||{state:'rest'};
  add('日常动作',actionCaption({...person,sheltered:true},{...pig,sheltered:true},{present,scene:'north',weather:state}),w.name);
 }
}
for(const [state,task] of Object.entries(ACTIVITIES))for(const pig of ['rest','walk'])add('日常动作',actionCaption({state,task},{state:pig},{present:true,scene:'room'}),'房间动作');
const html=await(await fetch('../../../../rooftop/index.html')).text(),doc=new DOMParser().parseFromString(html,'text/html');
for(const element of doc.querySelectorAll('.corner-cards .world-card'))if(element.textContent.trim())add('入口与提示',element.textContent.trim(),element.id);
const app=await(await fetch('../../../../rooftop/app.mjs')).text();
for(const call of app.matchAll(/\bmessage\(/g)){
 let i=call.index+call[0].length,depth=1,quote=null,escape=false,expr='';
 for(;i<app.length&&depth;i++){const ch=app[i];if(quote){expr+=ch;if(escape)escape=false;else if(ch==='\\')escape=true;else if(ch===quote)quote=null;}else if(ch==='"'||ch==="'"||ch==='`'){quote=ch;expr+=ch;}else if(ch==='('){depth++;expr+=ch;}else if(ch===')'){depth--;if(depth)expr+=ch;}else expr+=ch;}
 const literals=[...expr.matchAll(/(["'])(.*?)\1/gs)].map(m=>m[2]);
 if(expr.includes('Math.round')){const prefix=literals[0]+'〔百分比〕'+literals[1];for(const suffix of literals.slice(2))add('摆放提示',prefix+suffix);}
 else if(expr.includes('asset('))add('摆放提示',literals[0]+'〔物件〕'+literals.at(-1));
 else if(expr.includes('e.message'))add('摆放提示',literals[0]+'〔原因〕');
 else for(const text of literals)if(/[\u3400-\u9fff]/.test(text))add('摆放提示',text);
}
add('入口与提示','去北天台看看。','另一处天台');
const music=await(await fetch('../../../../rooftop/music.mjs')).text();
for(const match of music.matchAll(/button\.textContent[^;]*;/g))for(const literal of match[0].matchAll(/"([^"\n]+)"/g))add('入口与提示',literal[1],'音乐');

const $=id=>document.getElementById(id);for(const kind of new Set(entries.map(e=>e.kind)))$('kind').add(new Option(kind,kind));
function render(){const query=$('search').value.trim(),list=entries.filter(e=>($('kind').value==='all'||e.kind===$('kind').value)&&(!query||(e.text+e.context).includes(query)));$('cards').replaceChildren();for(const e of list){const article=document.createElement('article'),label=document.createElement('small'),sample=document.createElement('div');label.textContent=e.kind+(e.context?' · '+e.context:'');sample.className='sample';sample.textContent=e.text;article.append(label,sample);$('cards').append(article);}$('count').textContent=list.length+' / '+entries.length+' 张';document.body.dataset.statusCards=String(entries.length);}
$('search').oninput=render;$('kind').onchange=render;render();
